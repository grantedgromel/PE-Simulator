import type { Sector } from './game'

export interface Fund {
  name: string
  sector: Sector
  vintageYear: number
  committedCapital: number
  deployedCapital: number
  remainingCapital: number
  managementFeeRate: number
  carryRate: number
  hurdleRate: number
  reputationScore: number
  lpTrustScore: number
  totalDistributions: number
  totalInvested: number
  netIRR: number | null
  grossIRR: number | null
  netMoic: number | null
  dpi: number
  tvpi: number
  rvpi: number
  moic: number | null
  managementFeesCollected: number
  carryAccrued: number
  gpTotalCarry: number
  irrByQuarter: number[]
  capitalCalls: { quarter: number; amount: number }[]
  lpDistributions: { quarter: number; amount: number }[]
}

export interface WaterfallResult {
  totalDistributions: number
  lpInvestedCapital: number
  lpPreferredReturn: number
  capitalReturned: number
  preferredReturnPaid: number
  gpCatchUpPaid: number
  totalToLP: number
  totalToGP: number
  currentStage: 1 | 2 | 3 | 4
}

export interface FundraisingResult {
  success: boolean
  newFundSize: number
  lpRetentionRate: number
  reason: string
}

export interface FundRecord {
  fundNumber: number
  committedCapital: number
  netMoic: number | null
  grossMoic: number | null
  netIrr: number | null
  grossIrr: number | null
  dpi: number
  dealsCompleted: number
  writeOffs: number
  totalPersonalCarry: number
  totalManagementFees: number
}

export interface FinalScore {
  funds: FundRecord[]
  cumulativeNetToLP: number
  weightedNetMoic: number
  totalPersonalCarry: number
  totalManagementFeeIncome: number
  totalEmployeesImpacted: number
  totalLayoffs: number
  totalJobsAdded: number
  totalExtractedCash: number
  totalInvestedInBusinesses: number
  averageCommunityTrust: number
  averageHumanOutcomeScore: number
  returnGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  humanImpactGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
}
