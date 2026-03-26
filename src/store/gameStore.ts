import { create } from 'zustand'
import type { GameState, Sector, Difficulty, Screen } from '../types/game'
import type { DealStatus } from '../types/deal'
import type { ValueCreationAction } from '../types/company'
import type { CapitalStructure } from '../types/effects'
import { createInitialState } from '../engine/initialState'
import { advancePhase } from '../engine/quarterEngine'
import { generateFundName } from '../engine/nameGenerators'
import { performDiligence } from '../engine/diligenceEngine'
import { resolveAuction, acceptCounterOffer } from '../engine/auctionEngine'
import {
  calculateCapitalStructure,
  calculateSeniorInterestRate,
  calculateMezzanineRate,
  createPortfolioCompanyFromDeal,
} from '../engine/structuringEngine'
import { executeAction as executeOperationsAction } from '../engine/operationsEngine'
import { PRNG } from '../engine/prng'
import { saveToSlot, loadFromSlot } from '../utils/saveLoad'

interface SetupState {
  fundName: string
  sector: Sector
  difficulty: Difficulty
}

interface AuctionResultState {
  dealId: string
  won: boolean
  winningBid: number
  competitorBids: number[]
  sellerCounterOffer?: number
}

interface GameStore extends GameState {
  setup: SetupState
  auctionResults: AuctionResultState[]
  structuringDealId: string | null

  // Setup actions
  setScreen: (screen: Screen) => void
  setFundName: (name: string) => void
  rerollFundName: () => void
  setSector: (sector: Sector) => void
  setDifficulty: (difficulty: Difficulty) => void

  // Game actions
  startGame: () => void
  nextPhase: () => void
  endQuarter: () => void
  updateDealStatus: (dealId: string, status: DealStatus) => void

  // Diligence
  runDiligence: (dealId: string, targetLevel: number) => void

  // Bidding
  submitBid: (dealId: string, bidMultiple: number) => void
  resolveAllAuctions: () => void
  acceptCounter: (dealId: string, counterMultiple: number) => void
  clearAuctionResults: () => void

  // Structuring
  setStructuringDeal: (dealId: string | null) => void
  closeDeal: (dealId: string, structure: CapitalStructure) => void

  // Operations
  executeCompanyAction: (companyId: string, action: ValueCreationAction) => void

  // Save/load
  saveGame: (slot: number) => void
  loadGame: (slot: number) => boolean
  returnToMenu: () => void
}

const defaultSetup: SetupState = {
  fundName: '',
  sector: 'Healthcare',
  difficulty: 'Normal',
}

function createDefaultState(): GameState {
  return {
    screen: 'menu',
    seed: 0,
    prngCounter: 0,
    difficulty: 'Normal',
    currentFundCycle: 1,
    currentYear: 1,
    currentQuarter: 1,
    currentPhase: 'Sourcing',
    fund: {
      name: '',
      sector: 'Healthcare',
      vintageYear: 1,
      committedCapital: 200,
      deployedCapital: 0,
      remainingCapital: 200,
      managementFeeRate: 0.02,
      carryRate: 0.20,
      hurdleRate: 0.08,
      reputationScore: 50,
      lpTrustScore: 60,
      totalDistributions: 0,
      totalInvested: 0,
      netIRR: null,
      grossIRR: null,
      dpi: 0,
      tvpi: 0,
      rvpi: 0,
      moic: null,
      managementFeesCollected: 0,
      carryAccrued: 0,
    },
    portfolioCompanies: [],
    exitedCompanies: [],
    writtenOffCompanies: [],
    currentDeals: [],
    teamMembers: [],
    lpBase: { totalCommitments: 200, satisfactionScore: 65, likelihoodToReUp: 0.5 },
    eventLog: [],
    pendingEffects: [],
    historicalIRRByQuarter: [],
    personalCarryEstimate: 0,
    totalQuartersElapsed: 0,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createDefaultState(),
  setup: {
    ...defaultSetup,
    fundName: generateFundName(new PRNG(Math.floor(Math.random() * 2147483647))),
  },
  auctionResults: [],
  structuringDealId: null,

  setScreen: (screen) => set({ screen }),

  setFundName: (name) =>
    set((state) => ({ setup: { ...state.setup, fundName: name } })),

  rerollFundName: () => {
    const prng = new PRNG(Math.floor(Math.random() * 2147483647))
    const name = generateFundName(prng)
    set((state) => ({ setup: { ...state.setup, fundName: name } }))
  },

  setSector: (sector) =>
    set((state) => ({ setup: { ...state.setup, sector } })),

  setDifficulty: (difficulty) =>
    set((state) => ({ setup: { ...state.setup, difficulty } })),

  startGame: () => {
    const { setup } = get()
    const newState = createInitialState(setup.fundName, setup.sector, setup.difficulty)
    set({ ...newState, auctionResults: [], structuringDealId: null })
  },

  nextPhase: () => {
    const state = get()
    const newState = advancePhase(state)
    set(newState)
  },

  endQuarter: () => {
    const state = get()
    const newState = advancePhase({ ...state, currentPhase: 'EndOfQuarter' })
    set({ ...newState, auctionResults: [], structuringDealId: null })
    saveToSlot(0, { ...get() } as unknown as GameState)
  },

  updateDealStatus: (dealId, status) =>
    set((state) => ({
      currentDeals: state.currentDeals.map((deal) =>
        deal.id === dealId ? { ...deal, status } : deal
      ),
    })),

  // Diligence
  runDiligence: (dealId, targetLevel) => {
    const state = get()
    const deal = state.currentDeals.find((d) => d.id === dealId)
    if (!deal) return

    const { deal: updatedDeal, cost } = performDiligence(deal, targetLevel)

    set({
      currentDeals: state.currentDeals.map((d) =>
        d.id === dealId ? updatedDeal : d
      ),
      fund: {
        ...state.fund,
        remainingCapital: Math.round((state.fund.remainingCapital - cost) * 100) / 100,
      },
    })
  },

  // Bidding
  submitBid: (dealId, bidMultiple) =>
    set((state) => ({
      currentDeals: state.currentDeals.map((d) =>
        d.id === dealId ? { ...d, playerBid: bidMultiple } : d
      ),
    })),

  resolveAllAuctions: () => {
    const state = get()
    const prng = new PRNG(state.seed + state.prngCounter + 100)
    const results: AuctionResultState[] = []

    const updatedDeals = state.currentDeals.map((deal) => {
      if (deal.status !== 'Pursued' || deal.playerBid === null) return deal

      const result = resolveAuction(prng, deal, deal.playerBid, state.difficulty)
      results.push({
        dealId: deal.id,
        won: result.won,
        winningBid: result.winningBid,
        competitorBids: result.competitorBids,
        sellerCounterOffer: result.sellerCounterOffer,
      })

      return {
        ...deal,
        status: result.won ? 'Won' as const : 'Lost' as const,
        enterpriseValue: result.won
          ? deal.actualEbitda * result.winningBid
          : deal.enterpriseValue,
      }
    })

    set({ currentDeals: updatedDeals, auctionResults: results })
  },

  acceptCounter: (dealId, counterMultiple) => {
    const state = get()
    const deal = state.currentDeals.find((d) => d.id === dealId)
    if (!deal) return

    acceptCounterOffer(deal, counterMultiple)

    set({
      currentDeals: state.currentDeals.map((d) =>
        d.id === dealId
          ? {
              ...d,
              status: 'Won' as const,
              playerBid: counterMultiple,
              enterpriseValue: d.actualEbitda * counterMultiple,
            }
          : d
      ),
      auctionResults: state.auctionResults.map((r) =>
        r.dealId === dealId ? { ...r, won: true, winningBid: counterMultiple } : r
      ),
    })
  },

  clearAuctionResults: () => set({ auctionResults: [] }),

  // Structuring
  setStructuringDeal: (dealId) => set({ structuringDealId: dealId }),

  closeDeal: (dealId, structure) => {
    const state = get()
    const deal = state.currentDeals.find((d) => d.id === dealId)
    if (!deal || deal.status !== 'Won') return

    const tev = deal.enterpriseValue
    const ebitda = deal.actualEbitda

    // Calculate rates
    const totalLeverage = ebitda > 0
      ? (tev * (structure.seniorDebtPct + structure.mezzaninePct)) / ebitda
      : 0
    const seniorRate = calculateSeniorInterestRate(totalLeverage)
    const mezzRate = calculateMezzanineRate(seniorRate)

    const fullStructure: CapitalStructure = {
      ...structure,
      seniorDebtRate: seniorRate,
      mezzanineRate: mezzRate,
    }

    const structCalc = calculateCapitalStructure(tev, ebitda, fullStructure, state.difficulty)
    if (!structCalc.isValid) return

    // Check if fund has enough capital
    if (structCalc.fundEquity > state.fund.remainingCapital) return

    const newCompany = createPortfolioCompanyFromDeal(
      deal,
      fullStructure,
      structCalc,
      state.currentYear,
      state.currentQuarter,
    )

    set({
      portfolioCompanies: [...state.portfolioCompanies, newCompany],
      currentDeals: state.currentDeals.map((d) =>
        d.id === dealId ? { ...d, status: 'Passed' as const } : d
      ),
      fund: {
        ...state.fund,
        deployedCapital: Math.round(
          (state.fund.deployedCapital + structCalc.fundEquity) * 100
        ) / 100,
        remainingCapital: Math.round(
          (state.fund.remainingCapital - structCalc.fundEquity) * 100
        ) / 100,
        totalInvested: Math.round(
          (state.fund.totalInvested + structCalc.fundEquity) * 100
        ) / 100,
      },
      structuringDealId: null,
    })
  },

  // Operations
  executeCompanyAction: (companyId, action) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === companyId)
    if (!company) return

    const prng = new PRNG(state.seed + state.prngCounter + state.totalQuartersElapsed + companyId.length)

    const result = executeOperationsAction(
      prng,
      company,
      action,
      state.totalQuartersElapsed,
      state.currentYear,
    )

    set({
      portfolioCompanies: state.portfolioCompanies.map((c) =>
        c.id === companyId
          ? { ...result.company, actionsTaken: [...c.actionsTaken, result.record] }
          : c
      ),
      pendingEffects: [...state.pendingEffects, ...result.newEffects],
    })
  },

  saveGame: (slot) => {
    const state = get()
    saveToSlot(slot, state as unknown as GameState)
  },

  loadGame: (slot) => {
    const saved = loadFromSlot(slot)
    if (saved) {
      set({ ...saved, screen: 'game', auctionResults: [], structuringDealId: null })
      return true
    }
    return false
  },

  returnToMenu: () => {
    set({
      ...createDefaultState(),
      setup: {
        ...defaultSetup,
        fundName: generateFundName(new PRNG(Math.floor(Math.random() * 2147483647))),
      },
      auctionResults: [],
      structuringDealId: null,
    } as Partial<GameStore>)
  },
}))
