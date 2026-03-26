import type { Difficulty } from '../types/game'

export interface DifficultyConfig {
  competitorCountRange: [number, number]
  competitorAggressiveness: number
  maxSeniorLeverage: number
  maxTotalLeverage: number
  baseInterestRateSpread: number
  covenantCushionMultiplier: number
  actionOutcomeVariance: number
  blowupThresholdDivisor: number
  eventPoolFilter: ('all' | 'normal_hard' | 'hard_only')[]
  eventCountWeights: [number, number, number, number]
  poachingFrequency: number
  unattendedCompanyDrift: number
  diligenceUnreliability: boolean
  unreliabilityMagnitude: number
  lpReturnBenchmark: number
}

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  Easy: {
    competitorCountRange: [2, 3],
    competitorAggressiveness: 0.9,
    maxSeniorLeverage: 4.5,
    maxTotalLeverage: 6.0,
    baseInterestRateSpread: -0.005,
    covenantCushionMultiplier: 1.3,
    actionOutcomeVariance: 0.5,
    blowupThresholdDivisor: 4,
    eventPoolFilter: ['all'],
    eventCountWeights: [0.40, 0.45, 0.15, 0.0],
    poachingFrequency: 0,
    unattendedCompanyDrift: -0.001,
    diligenceUnreliability: false,
    unreliabilityMagnitude: 0,
    lpReturnBenchmark: 1.5,
  },
  Normal: {
    competitorCountRange: [3, 5],
    competitorAggressiveness: 1.0,
    maxSeniorLeverage: 4.0,
    maxTotalLeverage: 5.5,
    baseInterestRateSpread: 0,
    covenantCushionMultiplier: 1.15,
    actionOutcomeVariance: 1.0,
    blowupThresholdDivisor: 3,
    eventPoolFilter: ['all', 'normal_hard'],
    eventCountWeights: [0.30, 0.50, 0.20, 0.0],
    poachingFrequency: 0.15,
    unattendedCompanyDrift: -0.003,
    diligenceUnreliability: true,
    unreliabilityMagnitude: 0.10,
    lpReturnBenchmark: 1.8,
  },
  Hard: {
    competitorCountRange: [5, 8],
    competitorAggressiveness: 1.1,
    maxSeniorLeverage: 3.5,
    maxTotalLeverage: 5.0,
    baseInterestRateSpread: 0.005,
    covenantCushionMultiplier: 1.0,
    actionOutcomeVariance: 1.5,
    blowupThresholdDivisor: 2.5,
    eventPoolFilter: ['all', 'normal_hard', 'hard_only'],
    eventCountWeights: [0.15, 0.45, 0.35, 0.05],
    poachingFrequency: 0.30,
    unattendedCompanyDrift: -0.005,
    diligenceUnreliability: true,
    unreliabilityMagnitude: 0.20,
    lpReturnBenchmark: 2.0,
  },
}

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return CONFIGS[difficulty]
}
