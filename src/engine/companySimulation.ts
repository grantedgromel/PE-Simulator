import type { PortfolioCompany } from '../types/company'
import type { PendingEffect } from '../types/effects'
import type { GameEvent } from '../types/events'
import { PRNG } from './prng'
import { applyConsequenceDelta, clampHumanMetric, ensureCompanyConsequences } from './consequenceEngine'
import {
  getCustomerLossDescription,
  getEmployeeExodusDescription,
  getQualityCrisisDescription,
  getRegulatoryActionDescription,
} from '../data/sectorConsequenceFlavor'
import { applySectorQuarterlyDynamics, getSectorTuning } from './sectorDynamics'

export interface SimulationResult {
  company: PortfolioCompany
  remainingEffects: PendingEffect[]
  events: GameEvent[]
}

export function simulateCompanyQuarter(
  prng: PRNG,
  company: PortfolioCompany,
  allEffects: PendingEffect[],
  currentQuarter: number,
): SimulationResult {
  let co = ensureCompanyConsequences(company)
  const tuning = getSectorTuning(co.sector)
  const companyEffects = allEffects.filter((e) => e.companyId === company.id)
  const otherEffects = allEffects.filter((e) => e.companyId !== company.id)
  const remaining: PendingEffect[] = []
  const events: GameEvent[] = []

  // 1. Process pending effects that trigger this quarter
  for (const effect of companyEffects) {
    if (effect.triggerQuarter <= currentQuarter) {
      co = applyEffect(co, effect)
      // Handle multi-quarter effects
      if (effect.remainingQuarters && effect.remainingQuarters > 1) {
        remaining.push({
          ...effect,
          triggerQuarter: currentQuarter + 1,
          remainingQuarters: effect.remainingQuarters - 1,
        })
      }
    } else {
      remaining.push(effect)
    }
  }

  // 2. Fragility accumulation from current state
  if (co.leverageRatio > 4.5) co.fragility += 2
  if (co.morale < 30) co.fragility += 3
  if (co.customerSatisfaction < 30) co.fragility += 3
  if (co.communityTrust < 45) co.fragility += tuning.lowTrustFragilityBonus
  if (co.communityTrust < 30) co.fragility += 3
  if (co.morale > 70) co.fragility -= 1
  if (co.customerSatisfaction > 70) co.fragility -= 1
  co.fragility -= 1 // natural decay

  // 3. Blowup check
  const blowupRoll = prng.nextInt(0, 100)
  if (blowupRoll < co.fragility / 3) {
    const blowup = generateBlowup(prng, co, currentQuarter)
    co = blowup.company
    events.push(blowup.event)
    remaining.push(...blowup.effects)
  }

  // 4. Skip simulation if company is in exit process
  if (co.exitInProgress) {
    co.morale = Math.max(0, Math.min(100, Math.round(co.morale)))
    co.customerSatisfaction = Math.max(0, Math.min(100, Math.round(co.customerSatisfaction)))
    co.communityTrust = clampHumanMetric(co.communityTrust)
    co.fragility = Math.max(0, Math.min(100, Math.round(co.fragility)))
    return { company: co, remainingEffects: [...otherEffects, ...remaining], events }
  }

  // 5. Baseline drift
  const quarterlyGrowth = co.revenueGrowthRate / 4
  co.revenue = Math.round(co.revenue * (1 + quarterlyGrowth) * 100) / 100
  co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100

  // 6. Debt service (informational)
  const annualSeniorInterest = co.seniorDebt * co.seniorDebtRate
  const annualMezzInterest = co.mezzanineDebt * co.mezzanineDebtRate
  const annualDebtService = annualSeniorInterest + annualMezzInterest

  // 6b. Sector-specific drift and failure modes
  const sectorResult = applySectorQuarterlyDynamics(prng, co, currentQuarter)
  co = sectorResult.company
  events.push(...sectorResult.events)
  remaining.push(...sectorResult.effects)

  // 7. Covenant check
  co.covenantBreached = co.ebitda < co.covenantEbitdaThreshold
  if (co.covenantBreached && !co.covenantChoicePending) {
    co.covenantChoicePending = true
    events.push({
      id: `evt-covenant-${co.id}-${currentQuarter}`,
      category: 'Company',
      title: `Covenant Breach: ${co.name}`,
      description: `${co.name} has breached its maintenance covenant. EBITDA of $${co.ebitda.toFixed(1)}M is below the $${co.covenantEbitdaThreshold.toFixed(1)}M threshold. Lenders are demanding action.`,
      quarter: currentQuarter,
      year: 0,
      impact: {},
      resolved: false,
    })
  }

  // 8. Morale/satisfaction drift
  if (co.morale < 65) co.morale = Math.min(65, co.morale + 2)
  else if (co.morale > 75) co.morale = Math.max(75, co.morale - 1)
  if (co.customerSatisfaction < 70) co.customerSatisfaction = Math.min(70, co.customerSatisfaction + 1)

  if (co.morale > 70 && co.customerSatisfaction > 70) {
    co.communityTrust += 1.5
  }
  if (co.morale < 45 || co.customerSatisfaction < 45) {
    co.communityTrust -= tuning.lowMoraleTrustPenalty
  }
  if (co.consequenceLedger.dividendRecaps > 0 && co.leverageRatio > 5) {
    co.communityTrust -= 1
  }
  if (co.communityTrust < 40) {
    co.customerSatisfaction -= 2
  }
  if (co.communityTrust < 30) {
    co.revenueGrowthRate = Math.round((co.revenueGrowthRate - 0.005) * 1000) / 1000
  }

  // 9. Revenue penalty for critically low satisfaction
  if (co.customerSatisfaction < 40) {
    const declinePct = ((40 - co.customerSatisfaction) / 200) * tuning.lowSatisfactionRevenuePenaltyMult
    co.revenue = Math.round(co.revenue * (1 - declinePct) * 100) / 100
    co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100
  }

  // 10. Valuation update
  const multipleWalk = prng.nextFloat(-0.3, 0.3)
  const currentMultiple = Math.max(3, co.entryMultiple + multipleWalk)
  co.currentImpliedValuation = Math.round(co.ebitda * currentMultiple * 100) / 100

  // 11. Update ratios
  co.leverageRatio = co.ebitda > 0 ? Math.round(co.totalDebt / co.ebitda * 10) / 10 : 99.9
  co.interestCoverage = annualDebtService > 0 ? Math.round(co.ebitda / annualDebtService * 10) / 10 : 999.9

  // Clamp values
  co.morale = Math.max(0, Math.min(100, Math.round(co.morale)))
  co.customerSatisfaction = Math.max(0, Math.min(100, Math.round(co.customerSatisfaction)))
  co.communityTrust = clampHumanMetric(co.communityTrust)
  co.fragility = Math.max(0, Math.min(100, Math.round(co.fragility)))
  co.resilience = Math.max(0, Math.min(100, Math.round(co.resilience)))

  return {
    company: co,
    remainingEffects: [...otherEffects, ...remaining],
    events,
  }
}

function applyEffect(company: PortfolioCompany, effect: PendingEffect): PortfolioCompany {
  const co = ensureCompanyConsequences(company)
  switch (effect.effectType) {
    case 'morale_drop':
      co.morale -= effect.magnitude
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
      co.ebitdaMargin = co.revenue > 0 ? Math.round(co.ebitda / co.revenue * 1000) / 1000 : co.ebitdaMargin
      break
    case 'fragility_increase':
      co.fragility += effect.magnitude
      break
    case 'integration_drag':
      co.ebitdaMargin = Math.round((co.ebitdaMargin - effect.magnitude) * 1000) / 1000
      co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100
      break
    case 'synergy_capture':
      co.ebitda = Math.round((co.ebitda + effect.magnitude) * 100) / 100
      co.ebitdaMargin = co.revenue > 0 ? Math.round(co.ebitda / co.revenue * 1000) / 1000 : co.ebitdaMargin
      break
    case 'compliance_cost':
      co.ebitda = Math.round((co.ebitda - effect.magnitude) * 100) / 100
      co.ebitdaMargin = co.revenue > 0 ? Math.round(co.ebitda / co.revenue * 1000) / 1000 : co.ebitdaMargin
      break
    case 'transition_disruption':
      co.ebitda = Math.round(co.ebitda * (1 - effect.magnitude) * 100) / 100
      co.ebitdaMargin = co.revenue > 0 ? Math.round(co.ebitda / co.revenue * 1000) / 1000 : co.ebitdaMargin
      break
  }
  return co
}

interface BlowupResult {
  company: PortfolioCompany
  event: GameEvent
  effects: PendingEffect[]
}

function generateBlowup(prng: PRNG, company: PortfolioCompany, currentQuarter: number): BlowupResult {
  const blowupType = prng.nextInt(0, 4)
  let co = ensureCompanyConsequences(company)
  const effects: PendingEffect[] = []
  let event: GameEvent

  switch (blowupType) {
    case 0: {
      // Key customer loss
      const revLoss = prng.nextFloat(0.10, 0.25)
      co.revenue = Math.round(co.revenue * (1 - revLoss) * 100) / 100
      co.ebitda = Math.round(co.revenue * co.ebitdaMargin * 100) / 100
      event = {
        id: `evt-custloss-${co.id}-${currentQuarter}`,
        category: 'Company',
        title: `Customer Loss: ${co.name}`,
        description: `${getCustomerLossDescription(co, currentQuarter)} Revenue impact: -${(revLoss * 100).toFixed(0)}%.`,
        quarter: currentQuarter, year: 0, impact: { revenue: -revLoss }, resolved: true,
      }
      break
    }
    case 1: {
      // Employee exodus
      const headcountLoss = prng.nextFloat(0.15, 0.25)
      co.employeeCount = Math.round(co.employeeCount * (1 - headcountLoss))
      co.morale -= prng.nextFloat(15, 20)
      co = applyConsequenceDelta(co, {
        communityTrustDelta: -prng.nextFloat(5, 9),
        communityBacklashEvents: 1,
      })
      effects.push({
        id: `eff-exodus-ebitda-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
        companyId: co.id,
        triggerQuarter: currentQuarter + 1,
        effectType: 'ebitda_boost',
        magnitude: -prng.nextFloat(0.03, 0.08),
        remainingQuarters: 2,
      })
      event = {
        id: `evt-exodus-${co.id}-${currentQuarter}`,
        category: 'Company',
        title: `Employee Exodus: ${co.name}`,
        description: `${getEmployeeExodusDescription(co, currentQuarter)} ${Math.round(headcountLoss * 100)}% of staff departed including key department heads.`,
        quarter: currentQuarter, year: 0, impact: { employees: -headcountLoss }, resolved: true,
      }
      break
    }
    case 2: {
      // Quality failure
      co.customerSatisfaction -= prng.nextFloat(20, 30)
      co = applyConsequenceDelta(co, {
        communityTrustDelta: -prng.nextFloat(8, 12),
        qualityIncidents: 1,
        communityBacklashEvents: 1,
      })
      effects.push({
        id: `eff-qualfail-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
        companyId: co.id,
        triggerQuarter: currentQuarter + 1,
        effectType: 'growth_boost',
        magnitude: -prng.nextFloat(0.05, 0.10),
        remainingQuarters: 2,
      })
      event = {
        id: `evt-quality-${co.id}-${currentQuarter}`,
        category: 'Company',
        title: `Quality Crisis: ${co.name}`,
        description: getQualityCrisisDescription(co, currentQuarter),
        quarter: currentQuarter, year: 0, impact: { satisfaction: -25 }, resolved: true,
      }
      break
    }
    case 3: {
      // Regulatory action
      const oneTimeCost = prng.nextFloat(2, 5)
      co.ebitda = Math.round((co.ebitda - oneTimeCost) * 100) / 100
      co = applyConsequenceDelta(co, {
        communityTrustDelta: -prng.nextFloat(10, 14),
        regulatoryIncidents: 1,
        communityBacklashEvents: 1,
      })
      for (let q = 0; q < 4; q++) {
        effects.push({
          id: `eff-reg-${currentQuarter}-${q}-${prng.nextInt(1000, 9999)}`,
          companyId: co.id,
          triggerQuarter: currentQuarter + 1 + q,
          effectType: 'compliance_cost',
          magnitude: prng.nextFloat(0.5, 1),
        })
      }
      event = {
        id: `evt-regulatory-${co.id}-${currentQuarter}`,
        category: 'Company',
        title: `Regulatory Action: ${co.name}`,
        description: `${getRegulatoryActionDescription(co, currentQuarter)} One-time cost: $${oneTimeCost.toFixed(1)}M plus ongoing compliance costs.`,
        quarter: currentQuarter, year: 0, impact: { ebitda: -oneTimeCost }, resolved: true,
      }
      break
    }
    default: {
      // Covenant stress (push toward breach)
      co.ebitda = Math.round(co.ebitda * 0.9 * 100) / 100
      co.ebitdaMargin = co.revenue > 0 ? Math.round(co.ebitda / co.revenue * 1000) / 1000 : co.ebitdaMargin
      co = applyConsequenceDelta(co, {
        communityTrustDelta: -prng.nextFloat(2, 4),
      })
      event = {
        id: `evt-stress-${co.id}-${currentQuarter}`,
        category: 'Company',
        title: `Operational Stress: ${co.name}`,
        description: `${co.name} experienced unexpected operational challenges. EBITDA declined 10%.`,
        quarter: currentQuarter, year: 0, impact: { ebitda: -0.10 }, resolved: true,
      }
    }
  }

  return { company: co, event, effects }
}

export function simulateAllCompanies(
  prng: PRNG,
  companies: PortfolioCompany[],
  effects: PendingEffect[],
  currentQuarter: number,
): { companies: PortfolioCompany[]; effects: PendingEffect[]; events: GameEvent[] } {
  let remainingEffects = [...effects]
  const updatedCompanies: PortfolioCompany[] = []
  const allEvents: GameEvent[] = []

  for (const company of companies) {
    if (company.status !== 'Active') {
      updatedCompanies.push(company)
      continue
    }
    const result = simulateCompanyQuarter(prng, company, remainingEffects, currentQuarter)
    updatedCompanies.push(result.company)
    remainingEffects = result.remainingEffects
    allEvents.push(...result.events)
  }

  return { companies: updatedCompanies, effects: remainingEffects, events: allEvents }
}
