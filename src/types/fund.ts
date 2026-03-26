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
  dpi: number
  tvpi: number
  rvpi: number
  moic: number | null
  managementFeesCollected: number
  carryAccrued: number
}
