import type { GameState, Sector, Difficulty, FundCycle } from '../types/game'
import type { Fund } from '../types/fund'
import type { LPBase } from '../types/lp'
import type { TeamMember } from '../types/team'
import { PRNG } from './prng'
import { generateDeals } from './dealGenerator'
import { generateStartingTeam } from './teamEngine'

export function createFund(name: string, sector: Sector, committedCapital: number, reputation: number, lpTrust: number): Fund {
  return {
    name,
    sector,
    vintageYear: 1,
    committedCapital,
    deployedCapital: 0,
    remainingCapital: committedCapital,
    managementFeeRate: 0.02,
    carryRate: 0.20,
    hurdleRate: 0.08,
    reputationScore: reputation,
    lpTrustScore: lpTrust,
    totalDistributions: 0,
    totalInvested: 0,
    netIRR: null,
    grossIRR: null,
    netMoic: null,
    dpi: 0,
    tvpi: 0,
    rvpi: 0,
    moic: null,
    managementFeesCollected: 0,
    carryAccrued: 0,
    gpTotalCarry: 0,
    irrByQuarter: [],
    capitalCalls: [],
    lpDistributions: [],
  }
}

function createInitialLPBase(committedCapital: number): LPBase {
  return {
    totalCommitments: committedCapital,
    satisfactionScore: 65,
    likelihoodToReUp: 0.5,
  }
}

export function createInitialState(
  fundName: string,
  sector: Sector,
  difficulty: Difficulty,
  seed?: number,
): GameState {
  const gameSeed = seed ?? Math.floor(Math.random() * 2147483647)
  const prng = new PRNG(gameSeed)

  const fund = createFund(fundName, sector, 200, 50, 60)
  const startingTeam = generateStartingTeam(prng, sector)

  const initialDeals = generateDeals(prng, {
    sector,
    fundSize: fund.committedCapital,
    reputationScore: fund.reputationScore,
    difficulty,
    quarter: 1,
    year: 1,
  })

  return {
    screen: 'game',
    seed: gameSeed,
    prngCounter: 1,
    difficulty,
    currentFundCycle: 1,
    currentYear: 1,
    currentQuarter: 1,
    currentPhase: 'Sourcing',
    fund,
    portfolioCompanies: [],
    exitedCompanies: [],
    writtenOffCompanies: [],
    currentDeals: initialDeals,
    teamMembers: startingTeam,
    lpBase: createInitialLPBase(200),
    eventLog: [],
    pendingEffects: [],
    marketConditions: {
      interestRateModifier: 0,
      exitMultipleModifier: 0,
      creditAvailability: 70,
      ipoMarketTemperature: 50,
    },
    exitResults: [],
    fundEndQuarter: 40,
    investmentPeriodEndQuarter: 20,
    fundHistory: [],
    historicalIRRByQuarter: [],
    personalCarryEstimate: 0,
    totalPersonalCarry: 0,
    totalQuartersElapsed: 0,
    lpReportPending: false,
    finalScore: null,
  }
}

/**
 * Create Fund II or III state from existing game state.
 */
export function createNextFundState(
  currentState: GameState,
  newFundSize: number,
  existingTeam: TeamMember[],
): GameState {
  const nextCycle = (currentState.currentFundCycle + 1) as FundCycle
  const prng = new PRNG(currentState.seed + currentState.prngCounter + 5000)

  const fund = createFund(
    currentState.fund.name,
    currentState.fund.sector,
    newFundSize,
    currentState.fund.reputationScore,
    currentState.fund.lpTrustScore,
  )

  // Reset team assignments but keep skills/morale
  const resetTeam = existingTeam
    .filter((tm) => tm.status === 'Active')
    .map((tm) => ({
      ...tm,
      currentAssignments: [],
      consecutiveMaxCapacityQuarters: 0,
    }))

  const initialDeals = generateDeals(prng, {
    sector: fund.sector,
    fundSize: fund.committedCapital,
    reputationScore: fund.reputationScore,
    difficulty: currentState.difficulty,
    quarter: 1,
    year: currentState.currentYear + 1,
  })

  return {
    ...currentState,
    screen: 'game',
    currentFundCycle: nextCycle,
    currentYear: currentState.currentYear + 1,
    currentQuarter: 1,
    currentPhase: 'Sourcing',
    fund,
    portfolioCompanies: [],
    exitedCompanies: [],
    writtenOffCompanies: [],
    currentDeals: initialDeals,
    teamMembers: resetTeam,
    lpBase: { totalCommitments: newFundSize, satisfactionScore: 65, likelihoodToReUp: 0.5 },
    eventLog: [],
    pendingEffects: [],
    exitResults: [],
    fundEndQuarter: currentState.totalQuartersElapsed + 40,
    investmentPeriodEndQuarter: currentState.totalQuartersElapsed + 20,
    prngCounter: currentState.prngCounter + 5001,
    lpReportPending: false,
    finalScore: null,
  }
}
