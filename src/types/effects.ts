export type EffectType =
  | 'morale_drop'
  | 'satisfaction_bleed'
  | 'growth_boost'
  | 'revenue_decline'
  | 'ebitda_boost'
  | 'fragility_increase'

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
