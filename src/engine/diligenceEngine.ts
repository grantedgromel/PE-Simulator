import type { Deal } from '../types/deal'

export const DILIGENCE_COSTS: Record<number, number> = {
  1: 0.05,
  2: 0.15,
  3: 0.30,
  4: 0.50,
  5: 0.75,
}

export interface DiligenceLevelInfo {
  level: number
  cost: number
  description: string
  revealedLabels: string[]
}

export const DILIGENCE_LEVELS: DiligenceLevelInfo[] = [
  {
    level: 1,
    cost: 0.05,
    description: 'Basic financials confirmed. Revenue, EBITDA, and margins verified.',
    revealedLabels: ['Revenue (confirmed)', 'EBITDA', 'EBITDA Margin'],
  },
  {
    level: 2,
    cost: 0.15,
    description: 'Growth trends, customer concentration, and revenue quality assessed.',
    revealedLabels: ['Growth Rate', 'Customer Concentration', 'Revenue Quality', 'Employee Count (exact)'],
  },
  {
    level: 3,
    cost: 0.30,
    description: 'Management quality evaluated. Some hidden risks surfaced.',
    revealedLabels: ['Management Quality', 'Partial Risk Flags'],
  },
  {
    level: 4,
    cost: 0.50,
    description: 'Full operational picture. Competitive positioning and liabilities revealed.',
    revealedLabels: ['Competitive Position', 'Hidden Liabilities', 'Regulatory Risk'],
  },
  {
    level: 5,
    cost: 0.75,
    description: 'Deep diligence. Fragility, resilience, and all risks quantified.',
    revealedLabels: ['Fragility', 'Resilience', 'All Hidden Risks'],
  },
]

/**
 * Get the cumulative cost to reach a target diligence level from current level.
 */
export function getDiligenceCostForLevel(currentLevel: number, targetLevel: number): number {
  let cost = 0
  for (let l = currentLevel + 1; l <= targetLevel; l++) {
    cost += DILIGENCE_COSTS[l] ?? 0
  }
  return cost
}

/**
 * Perform diligence on a deal, revealing information based on the target level.
 * Returns the updated deal and the incremental cost.
 */
export function performDiligence(deal: Deal, targetLevel: number): { deal: Deal; cost: number } {
  if (targetLevel <= deal.diligenceLevelCompleted) {
    return { deal, cost: 0 }
  }

  const cost = getDiligenceCostForLevel(deal.diligenceLevelCompleted, targetLevel)
  let updated = { ...deal }

  // Level 1+: Confirm financials
  if (targetLevel >= 1 && deal.diligenceLevelCompleted < 1) {
    updated.revenue = updated.actualRevenue
    updated.ebitda = updated.actualEbitda
  }

  // Level 2+: Growth, concentration, revenue quality, exact employees
  if (targetLevel >= 2 && deal.diligenceLevelCompleted < 2) {
    updated.employeeCount = Math.round(updated.actualRevenue * 5) // more precise
  }

  // Level 3+: Management quality revealed (hiddenRisks partially — show count)
  // Level 4+: Competitive position, liabilities, regulatory risk
  // Level 5: Fragility, resilience, full risk details
  // (All these fields exist on the Deal object and are accessible to the UI
  //  based on diligenceLevelCompleted — the UI checks the level to decide what to show)

  updated.diligenceLevelCompleted = targetLevel
  updated.diligenceCost = (deal.diligenceCost ?? 0) + cost

  return { deal: updated, cost }
}

/**
 * Check if a particular field should be visible at the given diligence level.
 */
export function isFieldRevealed(field: string, level: number): boolean {
  const FIELD_REVEAL_MAP: Record<string, number> = {
    actualRevenue: 1,
    actualEbitda: 1,
    actualEbitdaMargin: 1,
    revenueGrowthRate: 2,
    customerConcentration: 2,
    revenueQuality: 2,
    employeeCountExact: 2,
    managementQuality: 3,
    hiddenRisksPartial: 3,
    competitivePosition: 4,
    hiddenLiabilities: 4,
    regulatoryRisk: 4,
    fragility: 5,
    resilience: 5,
    hiddenRisksFull: 5,
  }
  return level >= (FIELD_REVEAL_MAP[field] ?? 999)
}
