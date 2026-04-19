import type { PortfolioCompany } from '../types/company'
import type { PendingEffect } from '../types/effects'
import type { GameEvent } from '../types/events'
import type { Sector } from '../types/game'
import { PRNG } from './prng'
import { applyConsequenceDelta, ensureCompanyConsequences } from './consequenceEngine'
import {
  getCustomerLossDescription,
  getMainStreetBacklashDescription,
  getQualityCrisisDescription,
  getRegulatoryActionDescription,
} from '../data/sectorConsequenceFlavor'

export interface SectorTuning {
  costCutMarginMult: number
  costCutMoraleMult: number
  costCutSatisfactionMult: number
  costCutFragilityMult: number
  costCutTrustMult: number
  priceRevenueBoostMult: number
  priceSatisfactionHitMult: number
  priceTrustHitMult: number
  priceBleedMult: number
  organicGrowthMult: number
  organicTrustMult: number
  organicMoraleMult: number
  organicFragilityRepairMult: number
  addOnTrustMult: number
  addOnIntegrationRiskMult: number
  managementTransitionMult: number
  managementGrowthMult: number
  managementTrustMult: number
  recapTrustMult: number
  lowTrustFragilityBonus: number
  lowSatisfactionRevenuePenaltyMult: number
  lowMoraleTrustPenalty: number
}

export interface SectorQuarterlyResult {
  company: PortfolioCompany
  events: GameEvent[]
  effects: PendingEffect[]
}

const SECTOR_TUNING: Record<Sector, SectorTuning> = {
  Healthcare: {
    costCutMarginMult: 0.9,
    costCutMoraleMult: 1.15,
    costCutSatisfactionMult: 1.4,
    costCutFragilityMult: 1.15,
    costCutTrustMult: 1.35,
    priceRevenueBoostMult: 0.9,
    priceSatisfactionHitMult: 1.15,
    priceTrustHitMult: 1.2,
    priceBleedMult: 1.05,
    organicGrowthMult: 0.95,
    organicTrustMult: 1.25,
    organicMoraleMult: 1.1,
    organicFragilityRepairMult: 1.05,
    addOnTrustMult: 1.1,
    addOnIntegrationRiskMult: 1.1,
    managementTransitionMult: 1.0,
    managementGrowthMult: 1.1,
    managementTrustMult: 1.15,
    recapTrustMult: 1.1,
    lowTrustFragilityBonus: 2,
    lowSatisfactionRevenuePenaltyMult: 1.15,
    lowMoraleTrustPenalty: 1.5,
  },
  BusinessServices: {
    costCutMarginMult: 1.1,
    costCutMoraleMult: 1.25,
    costCutSatisfactionMult: 1.1,
    costCutFragilityMult: 1.2,
    costCutTrustMult: 1.15,
    priceRevenueBoostMult: 0.95,
    priceSatisfactionHitMult: 1.0,
    priceTrustHitMult: 1.0,
    priceBleedMult: 1.0,
    organicGrowthMult: 0.9,
    organicTrustMult: 1.0,
    organicMoraleMult: 1.0,
    organicFragilityRepairMult: 1.0,
    addOnTrustMult: 1.0,
    addOnIntegrationRiskMult: 1.0,
    managementTransitionMult: 1.0,
    managementGrowthMult: 1.0,
    managementTrustMult: 1.0,
    recapTrustMult: 1.0,
    lowTrustFragilityBonus: 1,
    lowSatisfactionRevenuePenaltyMult: 1.15,
    lowMoraleTrustPenalty: 1.6,
  },
  Consumer: {
    costCutMarginMult: 0.95,
    costCutMoraleMult: 1.1,
    costCutSatisfactionMult: 1.2,
    costCutFragilityMult: 1.1,
    costCutTrustMult: 1.15,
    priceRevenueBoostMult: 1.05,
    priceSatisfactionHitMult: 1.5,
    priceTrustHitMult: 1.5,
    priceBleedMult: 1.4,
    organicGrowthMult: 1.1,
    organicTrustMult: 1.1,
    organicMoraleMult: 1.05,
    organicFragilityRepairMult: 0.9,
    addOnTrustMult: 1.05,
    addOnIntegrationRiskMult: 1.0,
    managementTransitionMult: 1.0,
    managementGrowthMult: 1.05,
    managementTrustMult: 1.0,
    recapTrustMult: 1.2,
    lowTrustFragilityBonus: 1.5,
    lowSatisfactionRevenuePenaltyMult: 1.7,
    lowMoraleTrustPenalty: 1.0,
  },
  Technology: {
    costCutMarginMult: 0.8,
    costCutMoraleMult: 1.2,
    costCutSatisfactionMult: 1.15,
    costCutFragilityMult: 1.15,
    costCutTrustMult: 1.25,
    priceRevenueBoostMult: 1.1,
    priceSatisfactionHitMult: 1.15,
    priceTrustHitMult: 1.25,
    priceBleedMult: 1.15,
    organicGrowthMult: 1.35,
    organicTrustMult: 1.15,
    organicMoraleMult: 1.05,
    organicFragilityRepairMult: 1.0,
    addOnTrustMult: 1.1,
    addOnIntegrationRiskMult: 1.2,
    managementTransitionMult: 1.1,
    managementGrowthMult: 1.25,
    managementTrustMult: 1.1,
    recapTrustMult: 1.0,
    lowTrustFragilityBonus: 1,
    lowSatisfactionRevenuePenaltyMult: 1.1,
    lowMoraleTrustPenalty: 1.8,
  },
  Industrial: {
    costCutMarginMult: 1.0,
    costCutMoraleMult: 1.15,
    costCutSatisfactionMult: 0.9,
    costCutFragilityMult: 1.45,
    costCutTrustMult: 1.2,
    priceRevenueBoostMult: 0.9,
    priceSatisfactionHitMult: 0.8,
    priceTrustHitMult: 0.9,
    priceBleedMult: 0.9,
    organicGrowthMult: 0.85,
    organicTrustMult: 1.0,
    organicMoraleMult: 0.9,
    organicFragilityRepairMult: 1.4,
    addOnTrustMult: 0.9,
    addOnIntegrationRiskMult: 1.15,
    managementTransitionMult: 1.0,
    managementGrowthMult: 0.9,
    managementTrustMult: 1.0,
    recapTrustMult: 0.95,
    lowTrustFragilityBonus: 1.5,
    lowSatisfactionRevenuePenaltyMult: 0.9,
    lowMoraleTrustPenalty: 1.0,
  },
}

export function getSectorTuning(sector: Sector): SectorTuning {
  return SECTOR_TUNING[sector]
}

export function applySectorQuarterlyDynamics(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
): SectorQuarterlyResult {
  let co = ensureCompanyConsequences(company)
  const events: GameEvent[] = []
  const effects: PendingEffect[] = []

  switch (co.sector) {
    case 'Healthcare':
      if (co.morale < 50) co.customerSatisfaction -= 2
      if (co.customerSatisfaction < 55) co.revenueGrowthRate = roundGrowth(co.revenueGrowthRate - 0.003)

      if (
        co.morale < 55
        && (co.costCutCount > 0 || co.communityTrust < 42)
        && prng.chance(0.08 + co.costCutCount * 0.03)
      ) {
        const oneTimeCost = prng.nextFloat(1.2, 2.8)
        co.ebitda = roundMoney(co.ebitda - oneTimeCost)
        co = applyConsequenceDelta(co, {
          communityTrustDelta: -6,
          regulatoryIncidents: 1,
          communityBacklashEvents: 1,
        })
        effects.push({
          id: `eff-healthcare-reg-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
          companyId: co.id,
          triggerQuarter: currentQuarter + 1,
          effectType: 'compliance_cost',
          magnitude: prng.nextFloat(0.5, 1.2),
          remainingQuarters: 2,
        })
        events.push({
          id: `evt-healthcare-reg-${co.id}-${currentQuarter}`,
          category: 'Company',
          title: `Care Standards Review: ${co.name}`,
          description: `${getRegulatoryActionDescription(co, currentQuarter)} Referral sources and regulators are paying closer attention.`,
          quarter: currentQuarter,
          year: 0,
          impact: { ebitda: -oneTimeCost },
          resolved: true,
        })
      }
      break

    case 'BusinessServices':
      if (co.morale < 50) {
        co.customerSatisfaction -= 2
        co.communityTrust -= 1
      }
      if (co.costCutCount > 0) co.fragility += 1

      if (
        co.morale < 45
        && (co.consequenceLedger.layoffs > 0 || co.costCutCount > 0)
        && prng.chance(0.1 + co.costCutCount * 0.04)
      ) {
        const contractLoss = prng.nextFloat(0.06, 0.1)
        co.revenue = roundMoney(co.revenue * (1 - contractLoss))
        co.ebitda = roundMoney(co.revenue * co.ebitdaMargin)
        co = applyConsequenceDelta(co, {
          communityTrustDelta: -4,
          communityBacklashEvents: 1,
        })
        effects.push({
          id: `eff-service-contract-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
          companyId: co.id,
          triggerQuarter: currentQuarter + 1,
          effectType: 'growth_boost',
          magnitude: -prng.nextFloat(0.01, 0.025),
          remainingQuarters: 2,
        })
        events.push({
          id: `evt-service-contract-${co.id}-${currentQuarter}`,
          category: 'Company',
          title: `Service Contract Miss: ${co.name}`,
          description: `${getCustomerLossDescription(co, currentQuarter)} The client blamed thin staffing and inconsistent field execution.`,
          quarter: currentQuarter,
          year: 0,
          impact: { revenue: -contractLoss },
          resolved: true,
        })
      }
      break

    case 'Consumer':
      if (co.consequenceLedger.priceHikes > 0) co.communityTrust -= 1
      if (co.customerSatisfaction < 55) {
        const drift = (55 - co.customerSatisfaction) / 500
        co.revenue = roundMoney(co.revenue * (1 - drift))
        co.ebitda = roundMoney(co.revenue * co.ebitdaMargin)
      }
      if (co.communityTrust < 50) co.customerSatisfaction -= 1

      if (
        co.consequenceLedger.priceHikes > 0
        && co.customerSatisfaction < 50
        && prng.chance(0.12 + co.consequenceLedger.priceHikes * 0.05)
      ) {
        const trafficLoss = prng.nextFloat(0.04, 0.08)
        co.revenue = roundMoney(co.revenue * (1 - trafficLoss))
        co.ebitda = roundMoney(co.revenue * co.ebitdaMargin)
        co = applyConsequenceDelta(co, {
          communityTrustDelta: -6,
          communityBacklashEvents: 1,
          qualityIncidents: 1,
        })
        events.push({
          id: `evt-consumer-viral-${co.id}-${currentQuarter}`,
          category: 'Satirical',
          title: `Shrinkflation Backlash: ${co.name}`,
          description: `${getMainStreetBacklashDescription(co, currentQuarter)} Customers are posting receipts, portions, and side-eye at scale.`,
          quarter: currentQuarter,
          year: 0,
          impact: { revenue: -trafficLoss },
          resolved: true,
        })
      }
      break

    case 'Technology':
      if (co.morale < 55) co.revenueGrowthRate = roundGrowth(co.revenueGrowthRate - 0.008)
      if (co.customerSatisfaction < 55) co.communityTrust -= 1.5
      if (co.morale > 70 && co.consequenceLedger.growthInvestments > 0) {
        co.revenueGrowthRate = roundGrowth(co.revenueGrowthRate + 0.004)
      }

      if (
        (co.morale < 50 || co.customerSatisfaction < 50)
        && (co.consequenceLedger.priceHikes > 0 || co.consequenceLedger.layoffs > 0)
        && prng.chance(0.1 + co.consequenceLedger.qualityIncidents * 0.03)
      ) {
        const churnLoss = prng.nextFloat(0.05, 0.09)
        co.revenue = roundMoney(co.revenue * (1 - churnLoss))
        co.ebitda = roundMoney(co.revenue * co.ebitdaMargin)
        co = applyConsequenceDelta(co, {
          communityTrustDelta: -5,
          communityBacklashEvents: 1,
          qualityIncidents: 1,
        })
        effects.push({
          id: `eff-tech-support-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
          companyId: co.id,
          triggerQuarter: currentQuarter + 1,
          effectType: 'growth_boost',
          magnitude: -prng.nextFloat(0.015, 0.03),
          remainingQuarters: 2,
        })
        events.push({
          id: `evt-tech-support-${co.id}-${currentQuarter}`,
          category: 'Company',
          title: `Support Churn Wave: ${co.name}`,
          description: `${getCustomerLossDescription(co, currentQuarter)} Customers are citing ticket fatigue, slower support, and product trust issues.`,
          quarter: currentQuarter,
          year: 0,
          impact: { revenue: -churnLoss },
          resolved: true,
        })
      }
      break

    case 'Industrial':
      if (co.costCutCount > 0) co.fragility += 2
      if (co.consequenceLedger.growthInvestments > 0) co.fragility -= 2
      if (co.fragility > 50 && co.leverageRatio > 4.5) {
        co.revenueGrowthRate = roundGrowth(co.revenueGrowthRate - 0.004)
      }

      if (
        co.fragility > 60
        && co.costCutCount > 0
        && prng.chance(0.1 + co.costCutCount * 0.04)
      ) {
        const downtimeLoss = prng.nextFloat(0.03, 0.07)
        co.ebitda = roundMoney(co.ebitda * (1 - downtimeLoss))
        co = applyConsequenceDelta(co, {
          communityTrustDelta: -4,
          qualityIncidents: 1,
          communityBacklashEvents: 1,
        })
        effects.push({
          id: `eff-industrial-downtime-${currentQuarter}-${prng.nextInt(1000, 9999)}`,
          companyId: co.id,
          triggerQuarter: currentQuarter + 1,
          effectType: 'revenue_decline',
          magnitude: prng.nextFloat(0.01, 0.03),
          remainingQuarters: 2,
        })
        events.push({
          id: `evt-industrial-downtime-${co.id}-${currentQuarter}`,
          category: 'Company',
          title: `Maintenance Shutdown: ${co.name}`,
          description: `${getQualityCrisisDescription(co, currentQuarter)} Deferred maintenance and thin staffing turned into unplanned downtime.`,
          quarter: currentQuarter,
          year: 0,
          impact: { ebitda: -downtimeLoss },
          resolved: true,
        })
      }
      break
  }

  return { company: co, events, effects }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function roundGrowth(value: number): number {
  return Math.round(value * 1000) / 1000
}
