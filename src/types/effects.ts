export type EffectType =
  | 'morale_drop'
  | 'satisfaction_bleed'
  | 'growth_boost'
  | 'revenue_decline'
  | 'ebitda_boost'
  | 'fragility_increase'
  | 'integration_drag'
  | 'synergy_capture'
  | 'compliance_cost'
  | 'transition_disruption'

export interface PendingEffect {
  id: string
  companyId: string
  triggerQuarter: number
  effectType: EffectType
  magnitude: number
  remainingQuarters?: number
}

export interface CapitalStructure {
  seniorDebtPct: number
  mezzaninePct: number
  equityPct: number
  managementRolloverPct: number
  seniorDebtRate: number
  mezzanineRate: number
  isPIK: boolean
}

export type ExitRoute =
  | 'StrategicSale'
  | 'SponsorToSponsor'
  | 'IPO'
  | 'ContinuationVehicle'
  | 'WriteOff'

export interface ExitInProgress {
  route: ExitRoute
  startQuarter: number
  completionQuarter: number
  estimatedProceeds: number
  exitMultiple: number
}

export interface ExitResult {
  companyId: string
  companyName: string
  route: ExitRoute
  entryYear: number
  entryQuarter: number
  exitYear: number
  exitQuarter: number
  holdPeriodQuarters: number
  equityInvested: number
  additionalInvestments: number
  totalInvested: number
  dividendRecapProceeds: number
  exitProceeds: number
  totalProceeds: number
  grossMoic: number
  grossIrr: number
}

export interface MarketConditions {
  interestRateModifier: number
  exitMultipleModifier: number
  creditAvailability: number
  ipoMarketTemperature: number
}

export interface CovenantChoice {
  companyId: string
  type: 'negotiate_waiver' | 'equity_cure' | 'forced_restructuring' | 'write_off'
}
