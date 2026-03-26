import type { Sector } from './game'

export type DealStatus = 'Available' | 'Pursued' | 'Won' | 'Lost' | 'Passed' | 'Watching'
export type DealSource = 'Auction' | 'LimitedProcess' | 'Proprietary'

export interface Deal {
  id: string
  name: string
  sector: Sector
  subSector: string
  description: string
  status: DealStatus
  source: DealSource

  // Visible at sourcing (always shown)
  revenue: number | null
  ebitda: number | null
  askingMultiple: number
  employeeCount: number | null

  // Hidden — revealed by diligence
  actualRevenue: number
  actualEbitda: number
  actualEbitdaMargin: number
  revenueGrowthRate: number
  customerConcentration: number
  managementQuality: number
  hiddenRisks: string[]
  dealQuality: number // 1-10

  // Bidding
  competingBidRange: [number, number] // min/max multiple
  competingBidCount: number
  playerBid: number | null

  // Diligence
  diligenceLevelCompleted: number // 0-5

  // Financials for structuring
  enterpriseValue: number
  assignedPrincipalId?: string
}
