import type { Deal } from '../types/deal'
import type { PortfolioCompany } from '../types/company'
import type { CapitalStructure } from '../types/effects'
import type { Difficulty } from '../types/game'
import { createDefaultConsequenceLedger } from './consequenceEngine'
import { deriveVisualsForCompany } from './portraitAssigner'

export const MAX_SENIOR_LEVERAGE: Record<Difficulty, number> = {
  Easy: 4.5,
  Normal: 4.0,
  Hard: 3.5,
}

export const MAX_TOTAL_LEVERAGE: Record<Difficulty, number> = {
  Easy: 6.0,
  Normal: 5.5,
  Hard: 5.0,
}

export const MIN_EQUITY_PCT = 0.25
export const DEBT_AMORTIZATION_RATE = 0.05 // 5% annual

export interface StructureCalculation {
  seniorDebt: number
  mezzanineDebt: number
  equityCheck: number
  mgmtRollover: number
  fundEquity: number
  totalLeverage: number
  seniorLeverage: number
  interestCoverage: number
  annualDebtService: number
  quarterlyDebtService: number
  freeCashFlow: number
  covenantEbitdaFloor: number
  covenantHeadroom: number
  isValid: boolean
  errors: string[]
}

export interface SensitivityCell {
  exitMultiple: number
  holdYears: number
  moic: number
  irr: number
}

/**
 * Calculate the senior debt interest rate based on leverage level.
 * Base: ~7.5% (SOFR 5% + 250bps)
 * 3-4x: +50bps per 0.5x turn
 * 4-5x: +100bps per 0.5x turn
 * 5x+: +200bps per 0.5x turn
 */
export function calculateSeniorInterestRate(leverage: number): number {
  const base = 0.075
  let rate = base

  if (leverage > 3.0) {
    const turnsAbove3 = Math.min(leverage - 3.0, 1.0)
    rate += turnsAbove3 * 0.01 // +50bps per 0.5x = +100bps per 1x
  }
  if (leverage > 4.0) {
    const turnsAbove4 = Math.min(leverage - 4.0, 1.0)
    rate += turnsAbove4 * 0.02 // +100bps per 0.5x = +200bps per 1x
  }
  if (leverage > 5.0) {
    const turnsAbove5 = leverage - 5.0
    rate += turnsAbove5 * 0.04 // +200bps per 0.5x = +400bps per 1x
  }

  return Math.round(rate * 10000) / 10000
}

/**
 * Calculate the mezzanine interest rate: senior rate + 500bps.
 */
export function calculateMezzanineRate(seniorRate: number): number {
  return seniorRate + 0.05
}

/**
 * Full capital structure calculation with real-time metrics.
 */
export function calculateCapitalStructure(
  tev: number,
  ebitda: number,
  structure: CapitalStructure,
  difficulty: Difficulty,
): StructureCalculation {
  const errors: string[] = []

  const seniorDebt = tev * structure.seniorDebtPct
  const mezzanineDebt = tev * structure.mezzaninePct
  const totalDebt = seniorDebt + mezzanineDebt
  const equityTotal = tev - totalDebt
  const equityPct = equityTotal / tev
  const mgmtRollover = equityTotal * structure.managementRolloverPct
  const fundEquity = equityTotal - mgmtRollover

  const totalLeverage = ebitda > 0 ? totalDebt / ebitda : 0
  const seniorLeverage = ebitda > 0 ? seniorDebt / ebitda : 0

  const seniorRate = calculateSeniorInterestRate(totalLeverage)
  const mezzRate = calculateMezzanineRate(seniorRate)

  const annualSeniorInterest = seniorDebt * seniorRate
  const annualMezzInterest = structure.isPIK ? 0 : mezzanineDebt * mezzRate
  const annualDebtService = annualSeniorInterest + annualMezzInterest
  const quarterlyDebtService = annualDebtService / 4

  const interestCoverage = annualDebtService > 0 ? ebitda / annualDebtService : 999
  const freeCashFlow = ebitda - annualDebtService

  // Covenant: EBITDA floor where interest coverage = 1.5x
  const covenantEbitdaFloor = annualDebtService * 1.5
  const covenantHeadroom = ebitda > 0
    ? (ebitda - covenantEbitdaFloor) / ebitda
    : 0

  // Validation
  if (equityPct < MIN_EQUITY_PCT) {
    errors.push(`Equity must be at least ${MIN_EQUITY_PCT * 100}% of TEV`)
  }
  if (seniorLeverage > MAX_SENIOR_LEVERAGE[difficulty]) {
    errors.push(`Senior leverage ${seniorLeverage.toFixed(1)}x exceeds limit of ${MAX_SENIOR_LEVERAGE[difficulty]}x`)
  }
  if (totalLeverage > MAX_TOTAL_LEVERAGE[difficulty]) {
    errors.push(`Total leverage ${totalLeverage.toFixed(1)}x exceeds limit of ${MAX_TOTAL_LEVERAGE[difficulty]}x`)
  }
  if (interestCoverage < 1.0 && totalDebt > 0) {
    errors.push('EBITDA does not cover interest payments')
  }

  return {
    seniorDebt: Math.round(seniorDebt * 100) / 100,
    mezzanineDebt: Math.round(mezzanineDebt * 100) / 100,
    equityCheck: Math.round(equityTotal * 100) / 100,
    mgmtRollover: Math.round(mgmtRollover * 100) / 100,
    fundEquity: Math.round(fundEquity * 100) / 100,
    totalLeverage: Math.round(totalLeverage * 10) / 10,
    seniorLeverage: Math.round(seniorLeverage * 10) / 10,
    interestCoverage: Math.round(interestCoverage * 10) / 10,
    annualDebtService: Math.round(annualDebtService * 100) / 100,
    quarterlyDebtService: Math.round(quarterlyDebtService * 100) / 100,
    freeCashFlow: Math.round(freeCashFlow * 100) / 100,
    covenantEbitdaFloor: Math.round(covenantEbitdaFloor * 100) / 100,
    covenantHeadroom: Math.round(covenantHeadroom * 1000) / 1000,
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate the sensitivity table: MOIC and IRR at various exit multiples and hold periods.
 */
export function calculateSensitivityTable(
  ebitda: number,
  growthRate: number,
  equityInvested: number,
  totalDebt: number,
): SensitivityCell[][] {
  const exitMultiples = [6, 8, 10, 12]
  const holdYears = [3, 4, 5]

  return holdYears.map((years) =>
    exitMultiples.map((exitMult) => {
      // Project EBITDA forward
      const projectedEbitda = ebitda * Math.pow(1 + growthRate, years)

      // Exit TEV
      const exitTEV = projectedEbitda * exitMult

      // Remaining debt after amortization
      const remainingDebt = totalDebt * Math.max(0, 1 - DEBT_AMORTIZATION_RATE * years)

      // Equity proceeds
      const equityProceeds = Math.max(0, exitTEV - remainingDebt)

      // MOIC
      const moic = equityInvested > 0 ? equityProceeds / equityInvested : 0

      // IRR approximation: MOIC^(1/years) - 1
      const irr = moic > 0 ? Math.pow(moic, 1 / years) - 1 : -1

      return {
        exitMultiple: exitMult,
        holdYears: years,
        moic: Math.round(moic * 100) / 100,
        irr: Math.round(irr * 1000) / 1000,
      }
    })
  )
}

/**
 * Create a PortfolioCompany from a won deal and its capital structure.
 */
export function createPortfolioCompanyFromDeal(
  deal: Deal,
  structure: CapitalStructure,
  structCalc: StructureCalculation,
): PortfolioCompany {
  const baseMorale = 60 + Math.round(structure.managementRolloverPct * 60) // 60-78
  const baseCommunityTrust = Math.max(
    45,
    Math.min(82, 56 + Math.round(structure.managementRolloverPct * 50) + (deal.managementQuality - 5) * 2),
  )

  const id = `co-${deal.id}`
  const employeeCount = deal.employeeCount ?? Math.round(deal.actualRevenue * 5)
  const visuals = deriveVisualsForCompany(id, deal.sector, deal.actualRevenue, employeeCount)

  return {
    id,
    name: deal.name,
    sector: deal.sector,
    subSector: deal.subSector,
    description: deal.description,
    revenue: deal.actualRevenue,
    ebitda: deal.actualEbitda,
    ebitdaMargin: deal.actualEbitdaMargin,
    revenueGrowthRate: deal.revenueGrowthRate,
    entryMultiple: deal.playerBid ?? deal.askingMultiple,
    entryEquity: structCalc.fundEquity,
    totalDebt: structCalc.seniorDebt + structCalc.mezzanineDebt,
    seniorDebt: structCalc.seniorDebt,
    mezzanineDebt: structCalc.mezzanineDebt,
    leverageRatio: structCalc.totalLeverage,
    interestCoverage: structCalc.interestCoverage,
    covenantEbitdaThreshold: structCalc.covenantEbitdaFloor,
    employeeCount,
    morale: baseMorale,
    customerSatisfaction: 70,
    communityTrust: baseCommunityTrust,
    fragility: 100 - deal.dealQuality * 10, // lower quality = higher fragility
    resilience: deal.dealQuality * 10,
    yearsHeld: 0,
    quartersHeld: 0,
    currentImpliedValuation: deal.actualEbitda * deal.askingMultiple,
    status: 'Active',
    actionsTaken: [],
    seniorDebtRate: structure.seniorDebtRate,
    mezzanineDebtRate: structure.mezzanineRate,
    managementRolloverPct: structure.managementRolloverPct,
    costCutCount: 0,
    addOnCount: 0,
    addOnRevenue: 0,
    managementQuality: deal.managementQuality * 10, // scale 1-10 → 10-100
    covenantBreached: false,
    covenantChoicePending: false,
    dividendRecapTotal: 0,
    consequenceLedger: createDefaultConsequenceLedger(),
    exitInProgress: null,
    visualTier: visuals.visualTier,
    buildingVariant: visuals.buildingVariant,
  }
}
