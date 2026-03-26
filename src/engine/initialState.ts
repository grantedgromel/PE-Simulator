import type { GameState, Sector, Difficulty } from '../types/game'
import type { Fund } from '../types/fund'
import type { LPBase } from '../types/lp'
import { PRNG } from './prng'
import { generateDeals } from './dealGenerator'

function createInitialFund(name: string, sector: Sector): Fund {
  return {
    name,
    sector,
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
  }
}

function createInitialLPBase(): LPBase {
  return {
    totalCommitments: 200,
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

  const fund = createInitialFund(fundName, sector)

  // Generate initial deal flow
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
    teamMembers: [],
    lpBase: createInitialLPBase(),
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
    historicalIRRByQuarter: [],
    personalCarryEstimate: 0,
    totalQuartersElapsed: 0,
  }
}
