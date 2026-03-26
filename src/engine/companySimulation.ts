import type { PortfolioCompany } from '../types/company'
import type { PendingEffect } from '../types/effects'
import { PRNG } from './prng'

/**
 * Simulate one quarter for a single portfolio company.
 * Processes pending effects, applies baseline drift, checks covenants.
 */
export function simulateCompanyQuarter(
  prng: PRNG,
  company: PortfolioCompany,
  allEffects: PendingEffect[],
  currentQuarter: number,
): { company: PortfolioCompany; remainingEffects: PendingEffect[] } {
  let co = { ...company }
  const companyEffects = allEffects.filter((e) => e.companyId === company.id)
  const otherEffects = allEffects.filter((e) => e.companyId !== company.id)
  const remaining: PendingEffect[] = []

  // 1. Process pending effects that trigger this quarter
  for (const effect of companyEffects) {
    if (effect.triggerQuarter <= currentQuarter) {
      co = applyEffect(co, effect)
    } else {
      remaining.push(effect)
    }
  }

  // 2. Baseline drift: revenue grows by quarterly growth rate
  const quarterlyGrowth = co.revenueGrowthRate / 4
  co.revenue = Math.round(co.revenue * (1 + quarterlyGrowth) * 100) / 100
  co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100

  // 3. Debt service tracking (doesn't change EBITDA but tracks cash flow)
  const annualSeniorInterest = co.seniorDebt * co.seniorDebtRate
  const annualMezzInterest = co.mezzanineDebt * co.mezzanineDebtRate
  const annualDebtService = annualSeniorInterest + annualMezzInterest

  // 4. Covenant check
  co.covenantBreached = co.ebitda < co.covenantEbitdaThreshold

  // 5. Morale drift: slowly recover toward 65 at +2/Q
  if (co.morale < 65) {
    co.morale = Math.min(65, co.morale + 2)
  } else if (co.morale > 75) {
    co.morale = Math.max(75, co.morale - 1) // high morale decays slightly
  }

  // 6. Satisfaction drift: slowly recover toward 70 at +1/Q
  if (co.customerSatisfaction < 70) {
    co.customerSatisfaction = Math.min(70, co.customerSatisfaction + 1)
  }

  // 7. Revenue decline if satisfaction is critically low
  if (co.customerSatisfaction < 40) {
    const declinePct = (40 - co.customerSatisfaction) / 200 // up to 10% decline per Q at satisfaction=20
    co.revenue = Math.round(co.revenue * (1 - declinePct) * 100) / 100
    co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100
  }

  // 8. Update implied valuation with slight random walk on exit multiple
  const sectorBaseMultiple = co.entryMultiple // simplified: use entry multiple as sector proxy
  const multipleWalk = prng.nextFloat(-0.3, 0.3)
  const currentMultiple = Math.max(3, sectorBaseMultiple + multipleWalk)
  co.currentImpliedValuation = Math.round(co.ebitda * currentMultiple * 100) / 100

  // 9. Update leverage ratio and interest coverage
  co.leverageRatio = co.ebitda > 0
    ? Math.round(co.totalDebt / co.ebitda * 10) / 10
    : 99.9
  co.interestCoverage = annualDebtService > 0
    ? Math.round(co.ebitda / annualDebtService * 10) / 10
    : 999.9

  // Clamp values
  co.morale = Math.max(0, Math.min(100, Math.round(co.morale)))
  co.customerSatisfaction = Math.max(0, Math.min(100, Math.round(co.customerSatisfaction)))
  co.fragility = Math.max(0, Math.min(100, Math.round(co.fragility)))
  co.resilience = Math.max(0, Math.min(100, Math.round(co.resilience)))

  return {
    company: co,
    remainingEffects: [...otherEffects, ...remaining],
  }
}

function applyEffect(company: PortfolioCompany, effect: PendingEffect): PortfolioCompany {
  const co = { ...company }

  switch (effect.effectType) {
    case 'morale_drop':
      co.morale -= effect.magnitude // negative magnitude = boost
      break
    case 'satisfaction_bleed':
      co.customerSatisfaction -= effect.magnitude
      break
    case 'growth_boost':
      co.revenueGrowthRate = Math.round((co.revenueGrowthRate + effect.magnitude) * 1000) / 1000
      break
    case 'revenue_decline':
      co.revenue = Math.round(co.revenue * (1 - effect.magnitude) * 100) / 100
      co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100
      break
    case 'ebitda_boost':
      co.ebitda = Math.round(co.ebitda * (1 + effect.magnitude) * 100) / 100
      co.ebitdaMargin = co.revenue > 0
        ? Math.round(co.ebitda / co.revenue * 1000) / 1000
        : co.ebitdaMargin
      break
    case 'fragility_increase':
      co.fragility += effect.magnitude
      break
  }

  return co
}

/**
 * Simulate all portfolio companies for the quarter.
 */
export function simulateAllCompanies(
  prng: PRNG,
  companies: PortfolioCompany[],
  effects: PendingEffect[],
  currentQuarter: number,
): { companies: PortfolioCompany[]; effects: PendingEffect[] } {
  let remainingEffects = [...effects]
  const updatedCompanies: PortfolioCompany[] = []

  for (const company of companies) {
    const result = simulateCompanyQuarter(prng, company, remainingEffects, currentQuarter)
    updatedCompanies.push(result.company)
    remainingEffects = result.remainingEffects
  }

  return { companies: updatedCompanies, effects: remainingEffects }
}
