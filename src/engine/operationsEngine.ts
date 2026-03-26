import type { PortfolioCompany, ActionRecord, ValueCreationAction } from '../types/company'
import type { PendingEffect } from '../types/effects'
import { PRNG } from './prng'

export interface ActionResult {
  company: PortfolioCompany
  newEffects: PendingEffect[]
  record: ActionRecord
}

/**
 * Execute a value creation action on a portfolio company.
 */
export function executeAction(
  prng: PRNG,
  company: PortfolioCompany,
  action: ValueCreationAction,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  switch (action) {
    case 'CostCutting':
      return executeCostCutting(prng, company, currentQuarter, currentYear)
    case 'RevenueEnhancement':
      return executeRevenueEnhancement(prng, company, currentQuarter, currentYear)
    case 'OrganicInvestment':
      return executeOrganicInvestment(prng, company, currentQuarter, currentYear)
    case 'DoNothing':
    default:
      return executeDoNothing(company, currentQuarter, currentYear)
  }
}

function executeCostCutting(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const isRepeat = company.costCutCount > 0

  // Diminishing returns on margin improvement
  const marginBoost = isRepeat
    ? prng.nextFloat(0.01, 0.02) // 1-2pp for repeat cuts
    : prng.nextFloat(0.02, 0.04) // 2-4pp for first cut

  // Employee reduction
  const employeeCutPct = prng.nextFloat(0.10, 0.15)
  const employeesLost = Math.round(company.employeeCount * employeeCutPct)

  // Immediate effects
  const newMargin = Math.min(company.ebitdaMargin + marginBoost, 0.50) // cap at 50%
  const newEbitda = company.revenue * newMargin
  const ebitdaChange = newEbitda - company.ebitda

  const updated: PortfolioCompany = {
    ...company,
    ebitdaMargin: Math.round(newMargin * 1000) / 1000,
    ebitda: Math.round(newEbitda * 100) / 100,
    employeeCount: company.employeeCount - employeesLost,
    costCutCount: company.costCutCount + 1,
  }

  // Delayed effects
  const moraleDrop = isRepeat ? prng.nextFloat(15, 25) : prng.nextFloat(8, 15)
  const fragilityIncrease = prng.nextFloat(5, 10)

  const newEffects: PendingEffect[] = [
    {
      id: `eff-morale-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'morale_drop',
      magnitude: moraleDrop,
    },
    {
      id: `eff-frag-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'fragility_increase',
      magnitude: fragilityIncrease,
    },
  ]

  const record: ActionRecord = {
    quarter: currentQuarter,
    year: currentYear,
    action: 'CostCutting',
    ebitdaImpact: Math.round(ebitdaChange * 100) / 100,
    revenueImpact: 0,
    moraleImpact: 0, // delayed
  }

  return { company: updated, newEffects, record }
}

function executeRevenueEnhancement(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  // Immediate: revenue +5-10%
  const revenueBoostPct = prng.nextFloat(0.05, 0.10)
  const newRevenue = company.revenue * (1 + revenueBoostPct)
  const newEbitda = newRevenue * company.ebitdaMargin // margin stays flat
  const ebitdaChange = newEbitda - company.ebitda

  const updated: PortfolioCompany = {
    ...company,
    revenue: Math.round(newRevenue * 100) / 100,
    ebitda: Math.round(newEbitda * 100) / 100,
  }

  // Delayed: satisfaction bleeds 5-12/Q for 2-4 quarters, starting 2Q later
  const bleedMagnitude = prng.nextFloat(5, 12)
  const bleedDuration = prng.nextInt(2, 4)
  const bleedStart = currentQuarter + 2

  const newEffects: PendingEffect[] = []
  for (let q = 0; q < bleedDuration; q++) {
    newEffects.push({
      id: `eff-satbleed-${currentQuarter}-${q}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: bleedStart + q,
      effectType: 'satisfaction_bleed',
      magnitude: bleedMagnitude,
    })
  }

  const record: ActionRecord = {
    quarter: currentQuarter,
    year: currentYear,
    action: 'RevenueEnhancement',
    ebitdaImpact: Math.round(ebitdaChange * 100) / 100,
    revenueImpact: Math.round((newRevenue - company.revenue) * 100) / 100,
    moraleImpact: 0,
  }

  return { company: updated, newEffects, record }
}

function executeOrganicInvestment(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  // Immediate: EBITDA dip of 1-3%
  const ebitdaDipPct = prng.nextFloat(0.01, 0.03)
  const newEbitda = company.ebitda * (1 - ebitdaDipPct)
  const newMargin = company.revenue > 0 ? newEbitda / company.revenue : company.ebitdaMargin
  const ebitdaChange = newEbitda - company.ebitda

  const updated: PortfolioCompany = {
    ...company,
    ebitda: Math.round(newEbitda * 100) / 100,
    ebitdaMargin: Math.round(newMargin * 1000) / 1000,
  }

  // Delayed: growth rate boost +2-5pp starting 3-5Q later
  const growthBoost = prng.nextFloat(0.02, 0.05)
  const growthDelay = prng.nextInt(3, 5)

  // Delayed: morale boost +3-5 in 2Q
  const moraleBoost = prng.nextFloat(3, 5)

  const newEffects: PendingEffect[] = [
    {
      id: `eff-growth-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + growthDelay,
      effectType: 'growth_boost',
      magnitude: growthBoost,
    },
    {
      id: `eff-moraleboost-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 2,
      effectType: 'morale_drop', // negative magnitude = boost
      magnitude: -moraleBoost,
    },
  ]

  const record: ActionRecord = {
    quarter: currentQuarter,
    year: currentYear,
    action: 'OrganicInvestment',
    ebitdaImpact: Math.round(ebitdaChange * 100) / 100,
    revenueImpact: 0,
    moraleImpact: 0,
  }

  return { company: updated, newEffects, record }
}

function executeDoNothing(
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  return {
    company,
    newEffects: [],
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'DoNothing',
      ebitdaImpact: 0,
      revenueImpact: 0,
      moraleImpact: 0,
    },
  }
}
