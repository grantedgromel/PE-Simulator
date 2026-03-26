import type { PortfolioCompany, ActionRecord, ValueCreationAction } from '../types/company'
import type { PendingEffect } from '../types/effects'
import { PRNG } from './prng'
import { generateCompanyName, getRandomSubSector } from './nameGenerators'

export interface ActionResult {
  company: PortfolioCompany
  newEffects: PendingEffect[]
  record: ActionRecord
  fundCashImpact?: number
  fundDistribution?: number
  logMessage?: string
}

export interface AddOnTarget {
  id: string
  name: string
  subSector: string
  revenue: number
  ebitda: number
  askingMultiple: number
  description: string
}

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
    case 'AddOnAcquisition':
      return executeDoNothing(company, currentQuarter, currentYear) // handled separately via executeAddOn
    case 'DividendRecap':
      return executeDoNothing(company, currentQuarter, currentYear) // handled separately via executeDividendRecap
    case 'ManagementUpgrade':
      return executeManagementUpgrade(prng, company, currentQuarter, currentYear)
    case 'ConsultantEngagement':
      return executeConsultantEngagement(prng, company, currentQuarter, currentYear)
    case 'DoNothing':
    default:
      return executeDoNothing(company, currentQuarter, currentYear)
  }
}

// === ADD-ON ACQUISITION ===

export function generateAddOnTargets(prng: PRNG, company: PortfolioCompany): AddOnTarget[] {
  const count = prng.nextInt(1, 3)
  const targets: AddOnTarget[] = []
  for (let i = 0; i < count; i++) {
    const revPct = prng.nextFloat(0.20, 0.50)
    const revenue = Math.round(company.revenue * revPct * 100) / 100
    const margin = prng.nextFloat(0.08, 0.22)
    const ebitda = Math.round(revenue * margin * 100) / 100
    const multiple = prng.nextFloat(5, 9)
    targets.push({
      id: `addon-${Date.now()}-${prng.nextInt(1000, 9999)}`,
      name: generateCompanyName(prng, company.sector),
      subSector: getRandomSubSector(prng, company.sector),
      revenue,
      ebitda,
      askingMultiple: Math.round(multiple * 10) / 10,
      description: `Bolt-on target with ${Math.round(revenue)}M revenue.`,
    })
  }
  return targets
}

export function executeAddOn(
  prng: PRNG,
  company: PortfolioCompany,
  target: AddOnTarget,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const synergyCapture = prng.nextFloat(0.60, 0.80)
  const capturedEbitda = target.ebitda * synergyCapture
  const addOnDebt = target.ebitda * prng.nextFloat(2, 4)
  const addOnCost = target.ebitda * target.askingMultiple

  const updated: PortfolioCompany = {
    ...company,
    revenue: Math.round((company.revenue + target.revenue) * 100) / 100,
    ebitda: Math.round((company.ebitda + capturedEbitda) * 100) / 100,
    ebitdaMargin: Math.round((company.ebitda + capturedEbitda) / (company.revenue + target.revenue) * 1000) / 1000,
    totalDebt: Math.round((company.totalDebt + addOnDebt) * 100) / 100,
    seniorDebt: Math.round((company.seniorDebt + addOnDebt) * 100) / 100,
    employeeCount: company.employeeCount + Math.round(target.revenue * 5),
    addOnCount: company.addOnCount + 1,
    addOnRevenue: Math.round((company.addOnRevenue + target.revenue) * 100) / 100,
  }
  updated.leverageRatio = updated.ebitda > 0 ? Math.round(updated.totalDebt / updated.ebitda * 10) / 10 : 99
  updated.interestCoverage = updated.ebitda > 0
    ? Math.round(updated.ebitda / ((updated.seniorDebt * updated.seniorDebtRate) + (updated.mezzanineDebt * updated.mezzanineDebtRate)) * 10) / 10
    : 0

  const integrationDuration = prng.nextInt(2, 4)
  const integrationRiskMultiplier = 1 + (company.addOnCount * 0.15) // each add-on increases risk
  const dragMagnitude = prng.nextFloat(0.005, 0.015) * integrationRiskMultiplier

  const newEffects: PendingEffect[] = [
    {
      id: `eff-intdrag-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'integration_drag',
      magnitude: dragMagnitude,
      remainingQuarters: integrationDuration,
    },
    {
      id: `eff-synergy-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + integrationDuration + 1,
      effectType: 'synergy_capture',
      magnitude: target.ebitda * (1 - synergyCapture),
    },
    {
      id: `eff-morale-addon-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'morale_drop',
      magnitude: prng.nextFloat(3, 5),
    },
    {
      id: `eff-frag-addon-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter,
      effectType: 'fragility_increase',
      magnitude: prng.nextFloat(5, 10),
    },
  ]

  return {
    company: updated,
    newEffects,
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'AddOnAcquisition',
      ebitdaImpact: Math.round(capturedEbitda * 100) / 100,
      revenueImpact: target.revenue,
      moraleImpact: 0,
    },
    fundCashImpact: -(addOnCost - addOnDebt), // equity portion paid from fund
    logMessage: `Acquired ${target.name} for ${Math.round(addOnCost * 10) / 10}M (${target.askingMultiple}x EBITDA)`,
  }
}

// === DIVIDEND RECAP ===

export function calculateMaxRecap(company: PortfolioCompany): number {
  const maxAdditionalLeverage = Math.max(0, 6.0 - company.leverageRatio) // max 6x total
  return Math.round(maxAdditionalLeverage * company.ebitda * 100) / 100
}

export function executeDividendRecap(
  company: PortfolioCompany,
  recapAmount: number,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const updated: PortfolioCompany = {
    ...company,
    totalDebt: Math.round((company.totalDebt + recapAmount) * 100) / 100,
    seniorDebt: Math.round((company.seniorDebt + recapAmount) * 100) / 100,
    dividendRecapTotal: Math.round((company.dividendRecapTotal + recapAmount) * 100) / 100,
  }
  updated.leverageRatio = updated.ebitda > 0 ? Math.round(updated.totalDebt / updated.ebitda * 10) / 10 : 99
  const annualInterest = updated.seniorDebt * updated.seniorDebtRate + updated.mezzanineDebt * updated.mezzanineDebtRate
  updated.interestCoverage = annualInterest > 0 ? Math.round(updated.ebitda / annualInterest * 10) / 10 : 999

  return {
    company: updated,
    newEffects: [],
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'DividendRecap',
      ebitdaImpact: 0,
      revenueImpact: 0,
      moraleImpact: 0,
    },
    fundDistribution: recapAmount,
    logMessage: `Dividend recap of $${recapAmount.toFixed(1)}M from ${company.name}`,
  }
}

// === MANAGEMENT UPGRADE ===

function executeManagementUpgrade(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const newQuality = prng.nextInt(40, 90)
  const oldQuality = company.managementQuality
  const moraleImpact = company.morale > 60 ? -prng.nextFloat(10, 15) : prng.nextFloat(5, 10)

  const buyoutCost = company.managementRolloverPct > 0
    ? company.currentImpliedValuation * company.managementRolloverPct * 0.3
    : 0

  const updated: PortfolioCompany = {
    ...company,
    managementQuality: newQuality,
    morale: Math.round(Math.max(0, Math.min(100, company.morale + moraleImpact))),
    managementRolloverPct: 0,
  }

  const transitionDuration = prng.nextInt(1, 2)
  const newEffects: PendingEffect[] = [
    {
      id: `eff-transition-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'transition_disruption',
      magnitude: prng.nextFloat(0.01, 0.03),
      remainingQuarters: transitionDuration,
    },
  ]

  if (newQuality > oldQuality) {
    newEffects.push({
      id: `eff-newceo-boost-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + transitionDuration + 1,
      effectType: 'growth_boost',
      magnitude: prng.nextFloat(0.01, 0.03),
    })
  } else {
    newEffects.push({
      id: `eff-badceo-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + transitionDuration + 1,
      effectType: 'morale_drop',
      magnitude: prng.nextFloat(5, 10),
    })
  }

  return {
    company: updated,
    newEffects,
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'ManagementUpgrade',
      ebitdaImpact: 0,
      revenueImpact: 0,
      moraleImpact: Math.round(moraleImpact),
    },
    fundCashImpact: buyoutCost > 0 ? -buyoutCost : undefined,
    logMessage: `Management upgraded at ${company.name}. New quality: ${newQuality}/100 (was ${oldQuality}/100)`,
  }
}

// === CONSULTANT ENGAGEMENT ===

function executeConsultantEngagement(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const cost = prng.nextFloat(1, 3)
  const roll = prng.next()
  let logMessage: string
  const newEffects: PendingEffect[] = []
  let ebitdaImpact = -cost // cost always hits

  if (roll < 0.4) {
    // Helpful insight (40%)
    const marginBoost = prng.nextFloat(0.01, 0.02)
    newEffects.push({
      id: `eff-consult-insight-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
      companyId: company.id,
      triggerQuarter: currentQuarter + 1,
      effectType: 'ebitda_boost',
      magnitude: marginBoost,
      remainingQuarters: 2,
    })
    logMessage = `Consultants at ${company.name} identified actionable efficiency gains.`
  } else if (roll < 0.7) {
    // Obvious finding (30%)
    logMessage = `${company.name} received a 200-page deck recommending "continued focus on operational excellence."`
  } else {
    // Waste of money (30%)
    logMessage = `${company.name}'s management team spent 6 weeks in workshops. No measurable impact.`
  }

  const updated: PortfolioCompany = {
    ...company,
    ebitda: Math.round((company.ebitda - cost) * 100) / 100,
  }

  return {
    company: updated,
    newEffects,
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'ConsultantEngagement',
      ebitdaImpact: Math.round(ebitdaImpact * 100) / 100,
      revenueImpact: 0,
      moraleImpact: 0,
    },
    logMessage,
  }
}

// === EXISTING ACTIONS (from Phase 2) ===

function executeCostCutting(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const isRepeat = company.costCutCount > 0
  const marginBoost = isRepeat ? prng.nextFloat(0.01, 0.02) : prng.nextFloat(0.02, 0.04)
  const employeeCutPct = prng.nextFloat(0.10, 0.15)
  const employeesLost = Math.round(company.employeeCount * employeeCutPct)

  const newMargin = Math.min(company.ebitdaMargin + marginBoost, 0.50)
  const newEbitda = company.revenue * newMargin
  const ebitdaChange = newEbitda - company.ebitda

  const updated: PortfolioCompany = {
    ...company,
    ebitdaMargin: Math.round(newMargin * 1000) / 1000,
    ebitda: Math.round(newEbitda * 100) / 100,
    employeeCount: company.employeeCount - employeesLost,
    costCutCount: company.costCutCount + 1,
  }

  const moraleDrop = isRepeat ? prng.nextFloat(15, 25) : prng.nextFloat(8, 15)
  const fragilityIncrease = prng.nextFloat(5, 10)

  return {
    company: updated,
    newEffects: [
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
    ],
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'CostCutting',
      ebitdaImpact: Math.round(ebitdaChange * 100) / 100,
      revenueImpact: 0,
      moraleImpact: 0,
    },
    logMessage: `Cut costs at ${company.name}: ${employeesLost} positions eliminated.`,
  }
}

function executeRevenueEnhancement(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const revenueBoostPct = prng.nextFloat(0.05, 0.10)
  const newRevenue = company.revenue * (1 + revenueBoostPct)
  const newEbitda = newRevenue * company.ebitdaMargin

  const updated: PortfolioCompany = {
    ...company,
    revenue: Math.round(newRevenue * 100) / 100,
    ebitda: Math.round(newEbitda * 100) / 100,
  }

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

  return {
    company: updated,
    newEffects,
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'RevenueEnhancement',
      ebitdaImpact: Math.round((newEbitda - company.ebitda) * 100) / 100,
      revenueImpact: Math.round((newRevenue - company.revenue) * 100) / 100,
      moraleImpact: 0,
    },
    logMessage: `Price increases at ${company.name}: revenue +${(revenueBoostPct * 100).toFixed(0)}%.`,
  }
}

function executeOrganicInvestment(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): ActionResult {
  const ebitdaDipPct = prng.nextFloat(0.01, 0.03)
  const newEbitda = company.ebitda * (1 - ebitdaDipPct)
  const newMargin = company.revenue > 0 ? newEbitda / company.revenue : company.ebitdaMargin

  const updated: PortfolioCompany = {
    ...company,
    ebitda: Math.round(newEbitda * 100) / 100,
    ebitdaMargin: Math.round(newMargin * 1000) / 1000,
  }

  const growthBoost = prng.nextFloat(0.02, 0.05)
  const growthDelay = prng.nextInt(3, 5)
  const moraleBoost = prng.nextFloat(3, 5)

  return {
    company: updated,
    newEffects: [
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
        effectType: 'morale_drop',
        magnitude: -moraleBoost,
      },
      {
        id: `eff-fragdecay-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
        companyId: company.id,
        triggerQuarter: currentQuarter + 1,
        effectType: 'fragility_increase',
        magnitude: -prng.nextFloat(3, 5),
      },
    ],
    record: {
      quarter: currentQuarter,
      year: currentYear,
      action: 'OrganicInvestment',
      ebitdaImpact: Math.round((newEbitda - company.ebitda) * 100) / 100,
      revenueImpact: 0,
      moraleImpact: 0,
    },
    logMessage: `Organic investment at ${company.name}: short-term EBITDA dip, growth expected in ${growthDelay} quarters.`,
  }
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
