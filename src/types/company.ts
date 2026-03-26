import type { Sector } from './game'

export type CompanyStatus = 'Active' | 'Exited' | 'WrittenOff'

export type ValueCreationAction =
  | 'CostCutting'
  | 'AddOnAcquisition'
  | 'RevenueEnhancement'
  | 'DividendRecap'
  | 'ManagementUpgrade'
  | 'ConsultantEngagement'
  | 'OrganicInvestment'
  | 'DoNothing'

export type ExitType =
  | 'StrategicSale'
  | 'SponsorToSponsor'
  | 'IPO'
  | 'ContinuationVehicle'
  | 'WriteOff'

export interface ActionRecord {
  quarter: number
  year: number
  action: ValueCreationAction
  ebitdaImpact: number
  revenueImpact: number
  moraleImpact: number
}

export interface PortfolioCompany {
  id: string
  name: string
  sector: Sector
  subSector: string
  description: string
  revenue: number
  ebitda: number
  ebitdaMargin: number
  revenueGrowthRate: number
  entryMultiple: number
  entryEquity: number
  totalDebt: number
  seniorDebt: number
  mezzanineDebt: number
  leverageRatio: number
  interestCoverage: number
  covenantEbitdaThreshold: number
  employeeCount: number
  morale: number
  customerSatisfaction: number
  fragility: number
  resilience: number
  yearsHeld: number
  quartersHeld: number
  currentImpliedValuation: number
  status: CompanyStatus
  actionsTaken: ActionRecord[]
  exitType?: ExitType
  exitMultiple?: number
  exitProceeds?: number
  seniorDebtRate: number
  mezzanineDebtRate: number
  managementRolloverPct: number
  costCutCount: number
  covenantBreached: boolean
  assignedOperatingPartnerId?: string
}
