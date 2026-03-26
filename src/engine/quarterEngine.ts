import type { GameState, GamePhase } from '../types/game'
import { updateFundMetrics } from './fundEconomics'
import { generateDeals } from './dealGenerator'
import { simulateAllCompanies } from './companySimulation'
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
 * Determine the next phase, skipping phases that have no relevant content.
 */
export function getNextPhase(state: GameState): GamePhase {
  const currentIndex = PHASE_ORDER.indexOf(state.currentPhase)

  for (let i = currentIndex + 1; i < PHASE_ORDER.length; i++) {
    const phase = PHASE_ORDER[i]

    // Skip Diligence if no deals are pursued
    if (phase === 'Diligence') {
      const hasPursued = state.currentDeals.some((d) => d.status === 'Pursued')
      if (!hasPursued) continue
    }

    // Skip Structuring if no deals are won
    if (phase === 'Structuring') {
      const hasWon = state.currentDeals.some((d) => d.status === 'Won')
      if (!hasWon) continue
    }

    // Skip Operations if no portfolio companies
    if (phase === 'Operations') {
      if (state.portfolioCompanies.length === 0) continue
    }

    // Skip Exits for now (Phase 3)
    if (phase === 'Exits') continue

    return phase
  }

  return 'EndOfQuarter'
}

/**
 * Advance to the next phase within the current quarter.
 */
export function advancePhase(state: GameState): GameState {
  if (state.currentPhase === 'EndOfQuarter') {
    return processEndOfQuarter(state)
  }

  const nextPhase = getNextPhase(state)
  return { ...state, currentPhase: nextPhase }
}

/**
 * Process end of quarter: simulate companies, advance time, generate new deals.
 */
export function processEndOfQuarter(state: GameState): GameState {
  let nextQuarter = state.currentQuarter + 1
  let nextYear = state.currentYear

  if (nextQuarter > 4) {
    nextQuarter = 1
    nextYear += 1
  }

  const yearInFund = nextYear - state.fund.vintageYear + 1
  const newPrngCounter = state.prngCounter + 1
  const prng = new PRNG(state.seed + newPrngCounter)

  // Simulate all portfolio companies for the quarter
  const { companies: simulatedCompanies, effects: remainingEffects } =
    simulateAllCompanies(
      prng,
      state.portfolioCompanies,
      state.pendingEffects,
      state.totalQuartersElapsed + 1,
    )

  // Update portfolio company time tracking
  const updatedPortfolio = simulatedCompanies.map((co) => ({
    ...co,
    quartersHeld: co.quartersHeld + 1,
    yearsHeld: Math.floor((co.quartersHeld + 1) / 4),
  }))

  // Update fund metrics
  let updatedFund = updateFundMetrics(state.fund, yearInFund)

  // Recalculate deployed capital from actual portfolio equity
  const totalDeployed = updatedPortfolio.reduce((sum, co) => sum + co.entryEquity, 0)
  updatedFund = {
    ...updatedFund,
    deployedCapital: Math.round(totalDeployed * 100) / 100,
    remainingCapital: Math.round(
      (updatedFund.committedCapital - totalDeployed - updatedFund.managementFeesCollected) * 100,
    ) / 100,
  }

  // Generate new deals
  const newDeals = generateDeals(prng, {
    sector: state.fund.sector,
    fundSize: state.fund.committedCapital,
    reputationScore: state.fund.reputationScore,
    difficulty: state.difficulty,
    quarter: nextQuarter as 1 | 2 | 3 | 4,
    year: nextYear,
  })

  return {
    ...state,
    currentQuarter: nextQuarter as 1 | 2 | 3 | 4,
    currentYear: nextYear,
    currentPhase: 'Sourcing',
    fund: updatedFund,
    currentDeals: newDeals,
    portfolioCompanies: updatedPortfolio,
    pendingEffects: remainingEffects,
    prngCounter: newPrngCounter,
    totalQuartersElapsed: state.totalQuartersElapsed + 1,
    historicalIRRByQuarter: [
      ...state.historicalIRRByQuarter,
      updatedFund.netIRR ?? 0,
    ],
  }
}
