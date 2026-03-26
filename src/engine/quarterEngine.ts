import type { GameState, GamePhase } from '../types/game'
import { updateFundMetrics } from './fundEconomics'
import { generateDeals } from './dealGenerator'
import { PRNG } from './prng'

const PHASE_ORDER: GamePhase[] = [
  'Sourcing',
  'Diligence',
  'Structuring',
  'Operations',
  'Exits',
  'EndOfQuarter',
]

/**
 * Advance to the next phase within the current quarter.
 * For Phase 1, we skip Diligence/Structuring/Operations/Exits (they're stubs).
 */
export function advancePhase(state: GameState): GameState {
  const currentIndex = PHASE_ORDER.indexOf(state.currentPhase)

  if (state.currentPhase === 'EndOfQuarter') {
    return processEndOfQuarter(state)
  }

  // In Phase 1, skip directly from Sourcing to EndOfQuarter
  // (Diligence, Structuring, Operations, Exits are not yet implemented)
  const nextPhase = currentIndex < PHASE_ORDER.length - 1
    ? PHASE_ORDER[currentIndex + 1]
    : 'EndOfQuarter'

  return { ...state, currentPhase: nextPhase }
}

/**
 * Skip to end of quarter (for Phase 1 simplified flow).
 */
export function skipToEndOfQuarter(state: GameState): GameState {
  return { ...state, currentPhase: 'EndOfQuarter' }
}

/**
 * Process end of quarter: advance time, update metrics, generate new deals.
 */
export function processEndOfQuarter(state: GameState): GameState {
  let nextQuarter = state.currentQuarter + 1
  let nextYear = state.currentYear

  if (nextQuarter > 4) {
    nextQuarter = 1
    nextYear += 1
  }

  const yearInFund = nextYear - state.fund.vintageYear + 1
  const updatedFund = updateFundMetrics(state.fund, yearInFund)

  // Update PRNG counter and generate new deals
  const newPrngCounter = state.prngCounter + 1
  const prng = new PRNG(state.seed + newPrngCounter)

  const newDeals = generateDeals(prng, {
    sector: state.fund.sector,
    fundSize: state.fund.committedCapital,
    reputationScore: state.fund.reputationScore,
    difficulty: state.difficulty,
    quarter: nextQuarter as 1 | 2 | 3 | 4,
    year: nextYear,
  })

  // Update portfolio company quarters held
  const updatedPortfolio = state.portfolioCompanies.map((co) => ({
    ...co,
    quartersHeld: co.quartersHeld + 1,
    yearsHeld: Math.floor((co.quartersHeld + 1) / 4),
  }))

  return {
    ...state,
    currentQuarter: nextQuarter as 1 | 2 | 3 | 4,
    currentYear: nextYear,
    currentPhase: 'Sourcing',
    fund: updatedFund,
    currentDeals: newDeals,
    portfolioCompanies: updatedPortfolio,
    prngCounter: newPrngCounter,
    totalQuartersElapsed: state.totalQuartersElapsed + 1,
    historicalIRRByQuarter: [
      ...state.historicalIRRByQuarter,
      updatedFund.netIRR ?? 0,
    ],
  }
}
