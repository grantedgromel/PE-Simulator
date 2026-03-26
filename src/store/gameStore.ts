import { create } from 'zustand'
import type { GameState, Sector, Difficulty, Screen } from '../types/game'
import type { DealStatus } from '../types/deal'
import { createInitialState } from '../engine/initialState'
import { advancePhase, skipToEndOfQuarter } from '../engine/quarterEngine'
import { generateFundName } from '../engine/nameGenerators'
import { PRNG } from '../engine/prng'
import { saveToSlot, loadFromSlot } from '../utils/saveLoad'

interface SetupState {
  fundName: string
  sector: Sector
  difficulty: Difficulty
}

interface GameStore extends GameState {
  // Setup state (pre-game)
  setup: SetupState

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
    set(newState)
  },

  nextPhase: () => {
    const state = get()
    if (state.currentPhase === 'Sourcing') {
      // In Phase 1, skip directly to EndOfQuarter after sourcing
      set(skipToEndOfQuarter(state))
    } else {
      set(advancePhase(state))
    }
  },

  endQuarter: () => {
    const state = get()
    const newState = advancePhase({ ...state, currentPhase: 'EndOfQuarter' })
    set(newState)
    // Auto-save
    saveToSlot(0, { ...get() } as unknown as GameState)
  },

  updateDealStatus: (dealId, status) =>
    set((state) => ({
      currentDeals: state.currentDeals.map((deal) =>
        deal.id === dealId ? { ...deal, status } : deal
      ),
    })),

  saveGame: (slot) => {
    const state = get()
    saveToSlot(slot, state as unknown as GameState)
  },

  loadGame: (slot) => {
    const saved = loadFromSlot(slot)
    if (saved) {
      set({ ...saved, screen: 'game' })
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
    } as Partial<GameStore>)
  },
}))
