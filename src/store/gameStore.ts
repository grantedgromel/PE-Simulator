import { create } from 'zustand'
import type { GameState, Sector, Difficulty, Screen } from '../types/game'
import type { DealStatus } from '../types/deal'
import type { ValueCreationAction } from '../types/company'
import type { CapitalStructure, ExitRoute, CovenantChoice } from '../types/effects'
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
import {
  executeAction as executeOperationsAction,
  executeAddOn,
  executeDividendRecap,
  generateAddOnTargets,
  type AddOnTarget,
} from '../engine/operationsEngine'
import { calculateExitOptions, initiateExit } from '../engine/exitEngine'
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
  addOnTargets: AddOnTarget[]
  quarterEvents: import('../types/events').GameEvent[]

  // Setup
  setScreen: (screen: Screen) => void
  setFundName: (name: string) => void
  rerollFundName: () => void
  setSector: (sector: Sector) => void
  setDifficulty: (difficulty: Difficulty) => void

  // Game flow
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
  generateAddOns: (companyId: string) => void
  executeAddOnAcquisition: (companyId: string, target: AddOnTarget) => void
  executeDividendRecapAction: (companyId: string, amount: number) => void
  resolveCovenantChoice: (choice: CovenantChoice) => void

  // Exits
  initiateCompanyExit: (companyId: string, route: ExitRoute) => void

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
    marketConditions: { interestRateModifier: 0, exitMultipleModifier: 0, creditAvailability: 70, ipoMarketTemperature: 50 },
    exitResults: [],
    fundEndQuarter: 40,
    investmentPeriodEndQuarter: 20,
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
  addOnTargets: [],
  quarterEvents: [],

  setScreen: (screen) => set({ screen }),
  setFundName: (name) => set((s) => ({ setup: { ...s.setup, fundName: name } })),
  rerollFundName: () => {
    const name = generateFundName(new PRNG(Math.floor(Math.random() * 2147483647)))
    set((s) => ({ setup: { ...s.setup, fundName: name } }))
  },
  setSector: (sector) => set((s) => ({ setup: { ...s.setup, sector } })),
  setDifficulty: (difficulty) => set((s) => ({ setup: { ...s.setup, difficulty } })),

  startGame: () => {
    const { setup } = get()
    const newState = createInitialState(setup.fundName, setup.sector, setup.difficulty)
    set({ ...newState, auctionResults: [], structuringDealId: null, addOnTargets: [], quarterEvents: [] })
  },

  nextPhase: () => {
    const state = get()
    const newState = advancePhase(state)
    set(newState)
  },

  endQuarter: () => {
    const state = get()
    const newState = advancePhase({ ...state, currentPhase: 'EndOfQuarter' })
    set({ ...newState, auctionResults: [], structuringDealId: null, addOnTargets: [], quarterEvents: [] })
    saveToSlot(0, { ...get() } as unknown as GameState)
  },

  updateDealStatus: (dealId, status) =>
    set((s) => ({
      currentDeals: s.currentDeals.map((d) => d.id === dealId ? { ...d, status } : d),
    })),

  // Diligence
  runDiligence: (dealId, targetLevel) => {
    const state = get()
    const deal = state.currentDeals.find((d) => d.id === dealId)
    if (!deal) return
    const { deal: updated, cost } = performDiligence(deal, targetLevel)
    set({
      currentDeals: state.currentDeals.map((d) => d.id === dealId ? updated : d),
      fund: { ...state.fund, remainingCapital: Math.round((state.fund.remainingCapital - cost) * 100) / 100 },
    })
  },

  // Bidding
  submitBid: (dealId, bidMultiple) =>
    set((s) => ({
      currentDeals: s.currentDeals.map((d) => d.id === dealId ? { ...d, playerBid: bidMultiple } : d),
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
        enterpriseValue: result.won ? deal.actualEbitda * result.winningBid : deal.enterpriseValue,
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
        d.id === dealId ? { ...d, status: 'Won' as const, playerBid: counterMultiple, enterpriseValue: d.actualEbitda * counterMultiple } : d
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
    const totalLeverage = ebitda > 0 ? (tev * (structure.seniorDebtPct + structure.mezzaninePct)) / ebitda : 0
    const seniorRate = calculateSeniorInterestRate(totalLeverage)
    const mezzRate = calculateMezzanineRate(seniorRate)
    const fullStructure: CapitalStructure = { ...structure, seniorDebtRate: seniorRate, mezzanineRate: mezzRate }
    const structCalc = calculateCapitalStructure(tev, ebitda, fullStructure, state.difficulty)
    if (!structCalc.isValid || structCalc.fundEquity > state.fund.remainingCapital) return

    const newCompany = createPortfolioCompanyFromDeal(deal, fullStructure, structCalc, state.currentYear, state.currentQuarter)

    set({
      portfolioCompanies: [...state.portfolioCompanies, newCompany],
      currentDeals: state.currentDeals.map((d) => d.id === dealId ? { ...d, status: 'Passed' as const } : d),
      fund: {
        ...state.fund,
        deployedCapital: Math.round((state.fund.deployedCapital + structCalc.fundEquity) * 100) / 100,
        remainingCapital: Math.round((state.fund.remainingCapital - structCalc.fundEquity) * 100) / 100,
        totalInvested: Math.round((state.fund.totalInvested + structCalc.fundEquity) * 100) / 100,
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
    const result = executeOperationsAction(prng, company, action, state.totalQuartersElapsed, state.currentYear)

    let fundUpdate = { ...state.fund }
    if (result.fundCashImpact) {
      fundUpdate.remainingCapital = Math.round((fundUpdate.remainingCapital + result.fundCashImpact) * 100) / 100
    }
    if (result.fundDistribution) {
      fundUpdate.totalDistributions = Math.round((fundUpdate.totalDistributions + result.fundDistribution) * 100) / 100
    }

    set({
      portfolioCompanies: state.portfolioCompanies.map((c) =>
        c.id === companyId ? { ...result.company, actionsTaken: [...c.actionsTaken, result.record] } : c
      ),
      pendingEffects: [...state.pendingEffects, ...result.newEffects],
      fund: fundUpdate,
      eventLog: result.logMessage
        ? [...state.eventLog, { id: `log-${Date.now()}`, category: 'Company' as const, title: result.record.action, description: result.logMessage, quarter: state.totalQuartersElapsed, year: state.currentYear, impact: {}, resolved: true }]
        : state.eventLog,
    })
  },

  generateAddOns: (companyId) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === companyId)
    if (!company) return
    const prng = new PRNG(state.seed + state.prngCounter + state.totalQuartersElapsed + 999)
    set({ addOnTargets: generateAddOnTargets(prng, company) })
  },

  executeAddOnAcquisition: (companyId, target) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === companyId)
    if (!company) return
    const prng = new PRNG(state.seed + state.prngCounter + state.totalQuartersElapsed + target.id.length)
    const result = executeAddOn(prng, company, target, state.totalQuartersElapsed, state.currentYear)

    let fundUpdate = { ...state.fund }
    if (result.fundCashImpact) {
      fundUpdate.remainingCapital = Math.round((fundUpdate.remainingCapital + result.fundCashImpact) * 100) / 100
    }

    set({
      portfolioCompanies: state.portfolioCompanies.map((c) =>
        c.id === companyId ? { ...result.company, actionsTaken: [...c.actionsTaken, result.record] } : c
      ),
      pendingEffects: [...state.pendingEffects, ...result.newEffects],
      fund: fundUpdate,
      addOnTargets: [],
    })
  },

  executeDividendRecapAction: (companyId, amount) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === companyId)
    if (!company) return
    const result = executeDividendRecap(company, amount, state.totalQuartersElapsed, state.currentYear)

    set({
      portfolioCompanies: state.portfolioCompanies.map((c) =>
        c.id === companyId ? { ...result.company, actionsTaken: [...c.actionsTaken, result.record] } : c
      ),
      fund: {
        ...state.fund,
        totalDistributions: Math.round((state.fund.totalDistributions + amount) * 100) / 100,
      },
    })
  },

  resolveCovenantChoice: (choice) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === choice.companyId)
    if (!company) return

    let updated = { ...company, covenantChoicePending: false }

    switch (choice.type) {
      case 'negotiate_waiver': {
        const prng = new PRNG(state.seed + state.prngCounter + choice.companyId.length)
        const success = prng.chance((60 + company.resilience / 2) / 100)
        if (success) {
          updated.covenantEbitdaThreshold = Math.round(updated.covenantEbitdaThreshold * 0.85 * 100) / 100
          updated.covenantBreached = updated.ebitda >= updated.covenantEbitdaThreshold
        } else {
          // Failed — forced restructuring
          updated.entryEquity = Math.round(updated.entryEquity * 0.7 * 100) / 100
        }
        set({
          portfolioCompanies: state.portfolioCompanies.map((c) => c.id === choice.companyId ? updated : c),
          fund: { ...state.fund, remainingCapital: Math.round((state.fund.remainingCapital - 0.75) * 100) / 100 },
        })
        break
      }
      case 'equity_cure': {
        const debtPaydown = updated.covenantEbitdaThreshold - updated.ebitda + 1
        const cureAmount = Math.max(1, debtPaydown * 2)
        updated.totalDebt = Math.round((updated.totalDebt - cureAmount) * 100) / 100
        updated.seniorDebt = Math.round((updated.seniorDebt - cureAmount) * 100) / 100
        updated.covenantBreached = false
        set({
          portfolioCompanies: state.portfolioCompanies.map((c) => c.id === choice.companyId ? updated : c),
          fund: { ...state.fund, remainingCapital: Math.round((state.fund.remainingCapital - cureAmount) * 100) / 100 },
        })
        break
      }
      case 'forced_restructuring': {
        updated.entryEquity = Math.round(updated.entryEquity * 0.65 * 100) / 100
        updated.totalDebt = Math.round(updated.totalDebt * 0.8 * 100) / 100
        updated.seniorDebt = Math.round(updated.seniorDebt * 0.8 * 100) / 100
        updated.covenantBreached = false
        updated.covenantEbitdaThreshold = Math.round(updated.covenantEbitdaThreshold * 0.7 * 100) / 100
        set({
          portfolioCompanies: state.portfolioCompanies.map((c) => c.id === choice.companyId ? updated : c),
          fund: { ...state.fund, reputationScore: Math.max(0, state.fund.reputationScore - 3) },
        })
        break
      }
      case 'write_off': {
        updated.status = 'WrittenOff'
        set({
          portfolioCompanies: state.portfolioCompanies.filter((c) => c.id !== choice.companyId),
          writtenOffCompanies: [...state.writtenOffCompanies, updated],
          fund: { ...state.fund, reputationScore: Math.max(0, state.fund.reputationScore - 8) },
        })
        break
      }
    }
  },

  // Exits
  initiateCompanyExit: (companyId, route) => {
    const state = get()
    const company = state.portfolioCompanies.find((c) => c.id === companyId)
    if (!company) return

    const options = calculateExitOptions(company, state.fund, state.marketConditions, state.difficulty)
    const option = options.find((o) => o.route === route)
    if (!option || !option.available) return

    if (route === 'WriteOff') {
      const updated = initiateExit(company, option, state.totalQuartersElapsed)
      set({
        portfolioCompanies: state.portfolioCompanies.filter((c) => c.id !== companyId),
        writtenOffCompanies: [...state.writtenOffCompanies, updated],
        fund: { ...state.fund, reputationScore: Math.max(0, state.fund.reputationScore - 8) },
        exitResults: [...state.exitResults, {
          companyId: company.id,
          companyName: company.name,
          route: 'WriteOff',
          entryYear: state.currentYear - Math.floor(company.quartersHeld / 4),
          entryQuarter: 1,
          exitYear: state.currentYear,
          exitQuarter: state.totalQuartersElapsed,
          holdPeriodQuarters: company.quartersHeld,
          equityInvested: company.entryEquity,
          additionalInvestments: 0,
          totalInvested: company.entryEquity,
          dividendRecapProceeds: company.dividendRecapTotal,
          exitProceeds: 0,
          totalProceeds: company.dividendRecapTotal,
          grossMoic: company.entryEquity > 0 ? company.dividendRecapTotal / company.entryEquity : 0,
          grossIrr: -1,
        }],
      })
    } else if (route === 'ContinuationVehicle') {
      const prng = new PRNG(state.seed + state.prngCounter + companyId.length + 777)
      const approved = prng.chance(state.fund.reputationScore / 100)
      if (!approved) return // LPAC denied

      const updated = initiateExit(company, option, state.totalQuartersElapsed)
      set({
        portfolioCompanies: state.portfolioCompanies.map((c) => c.id === companyId ? updated : c),
        fund: { ...state.fund, reputationScore: Math.max(0, state.fund.reputationScore - 10) },
      })
    } else {
      const updated = initiateExit(company, option, state.totalQuartersElapsed)
      set({
        portfolioCompanies: state.portfolioCompanies.map((c) => c.id === companyId ? updated : c),
      })
    }
  },

  // Save/Load
  saveGame: (slot) => saveToSlot(slot, get() as unknown as GameState),
  loadGame: (slot) => {
    const saved = loadFromSlot(slot)
    if (saved) {
      set({ ...saved, screen: 'game', auctionResults: [], structuringDealId: null, addOnTargets: [], quarterEvents: [] })
      return true
    }
    return false
  },
  returnToMenu: () => {
    set({
      ...createDefaultState(),
      setup: { ...defaultSetup, fundName: generateFundName(new PRNG(Math.floor(Math.random() * 2147483647))) },
      auctionResults: [],
      structuringDealId: null,
      addOnTargets: [],
      quarterEvents: [],
    } as Partial<GameStore>)
  },
}))
