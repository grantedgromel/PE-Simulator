import type { ConsequenceLedger, PortfolioCompany } from '../types/company'

export interface HumanConsequenceSummary {
  totalLayoffs: number
  totalJobsAdded: number
  totalPriceHikes: number
  totalDividendRecaps: number
  totalExtractedCash: number
  totalInvestedCash: number
  totalBacklashEvents: number
  totalRegulatoryIncidents: number
  averageCommunityTrust: number
  averageOutcomeScore: number
}

interface ConsequenceDelta {
  communityTrustDelta?: number
  layoffs?: number
  jobsAdded?: number
  priceHikes?: number
  dividendRecaps?: number
  extractedCash?: number
  investedCash?: number
  growthInvestments?: number
  communityBacklashEvents?: number
  regulatoryIncidents?: number
  qualityIncidents?: number
}

export function createDefaultConsequenceLedger(): ConsequenceLedger {
  return {
    layoffs: 0,
    jobsAdded: 0,
    priceHikes: 0,
    dividendRecaps: 0,
    extractedCash: 0,
    investedCash: 0,
    growthInvestments: 0,
    communityBacklashEvents: 0,
    regulatoryIncidents: 0,
    qualityIncidents: 0,
  }
}

export function clampHumanMetric(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function ensureCompanyConsequences(company: PortfolioCompany): PortfolioCompany {
  return {
    ...company,
    communityTrust: clampHumanMetric(company.communityTrust ?? 60),
    consequenceLedger: {
      ...createDefaultConsequenceLedger(),
      ...(company.consequenceLedger ?? {}),
    },
  }
}

export function applyConsequenceDelta(
  company: PortfolioCompany,
  delta: ConsequenceDelta,
): PortfolioCompany {
  const hydrated = ensureCompanyConsequences(company)
  const ledger = hydrated.consequenceLedger

  return {
    ...hydrated,
    communityTrust: clampHumanMetric(
      hydrated.communityTrust + (delta.communityTrustDelta ?? 0),
    ),
    consequenceLedger: {
      layoffs: Math.max(0, ledger.layoffs + (delta.layoffs ?? 0)),
      jobsAdded: Math.max(0, ledger.jobsAdded + (delta.jobsAdded ?? 0)),
      priceHikes: Math.max(0, ledger.priceHikes + (delta.priceHikes ?? 0)),
      dividendRecaps: Math.max(0, ledger.dividendRecaps + (delta.dividendRecaps ?? 0)),
      extractedCash: Math.max(0, roundMoney(ledger.extractedCash + (delta.extractedCash ?? 0))),
      investedCash: Math.max(0, roundMoney(ledger.investedCash + (delta.investedCash ?? 0))),
      growthInvestments: Math.max(0, ledger.growthInvestments + (delta.growthInvestments ?? 0)),
      communityBacklashEvents: Math.max(0, ledger.communityBacklashEvents + (delta.communityBacklashEvents ?? 0)),
      regulatoryIncidents: Math.max(0, ledger.regulatoryIncidents + (delta.regulatoryIncidents ?? 0)),
      qualityIncidents: Math.max(0, ledger.qualityIncidents + (delta.qualityIncidents ?? 0)),
    },
  }
}

export function getStakeholderOutcomeScore(company: PortfolioCompany): number {
  const hydrated = ensureCompanyConsequences(company)
  const ledger = hydrated.consequenceLedger
  const workforceBase = Math.max(1, hydrated.employeeCount + ledger.layoffs)

  const baseScore =
    hydrated.communityTrust * 0.38
    + hydrated.morale * 0.18
    + hydrated.customerSatisfaction * 0.18
    + hydrated.resilience * 0.12
    + Math.max(0, 18 - hydrated.fragility * 0.18)

  const layoffPenalty = Math.min(18, (ledger.layoffs / workforceBase) * 44)
  const extractionPenalty = Math.min(
    18,
    ledger.dividendRecaps * 4
      + ledger.priceHikes * 2.5
      + (ledger.extractedCash / Math.max(1, hydrated.entryEquity)) * 8,
  )
  const incidentPenalty =
    ledger.communityBacklashEvents * 3
    + ledger.regulatoryIncidents * 5
    + ledger.qualityIncidents * 4

  const investmentCredit = Math.min(
    14,
    ledger.growthInvestments * 2.5
      + (ledger.investedCash / Math.max(1, hydrated.entryEquity)) * 6
      + (ledger.jobsAdded / workforceBase) * 12,
  )

  return clampHumanMetric(baseScore - layoffPenalty - extractionPenalty - incidentPenalty + investmentCredit)
}

export function getOwnershipArchetype(company: PortfolioCompany): string {
  const score = getStakeholderOutcomeScore(company)
  if (score >= 75) return 'Steward'
  if (score >= 60) return 'Builder'
  if (score >= 45) return 'Operator'
  if (score >= 30) return 'Strip-Miner'
  return 'Predator'
}

export function summarizeHumanConsequences(companies: PortfolioCompany[]): HumanConsequenceSummary {
  const hydrated = companies.map(ensureCompanyConsequences)
  if (hydrated.length === 0) {
    return {
      totalLayoffs: 0,
      totalJobsAdded: 0,
      totalPriceHikes: 0,
      totalDividendRecaps: 0,
      totalExtractedCash: 0,
      totalInvestedCash: 0,
      totalBacklashEvents: 0,
      totalRegulatoryIncidents: 0,
      averageCommunityTrust: 0,
      averageOutcomeScore: 0,
    }
  }

  const totals = hydrated.reduce(
    (summary, company) => {
      const ledger = company.consequenceLedger
      return {
        totalLayoffs: summary.totalLayoffs + ledger.layoffs,
        totalJobsAdded: summary.totalJobsAdded + ledger.jobsAdded,
        totalPriceHikes: summary.totalPriceHikes + ledger.priceHikes,
        totalDividendRecaps: summary.totalDividendRecaps + ledger.dividendRecaps,
        totalExtractedCash: roundMoney(summary.totalExtractedCash + ledger.extractedCash),
        totalInvestedCash: roundMoney(summary.totalInvestedCash + ledger.investedCash),
        totalBacklashEvents: summary.totalBacklashEvents + ledger.communityBacklashEvents,
        totalRegulatoryIncidents: summary.totalRegulatoryIncidents + ledger.regulatoryIncidents,
        averageCommunityTrust: summary.averageCommunityTrust + company.communityTrust,
        averageOutcomeScore: summary.averageOutcomeScore + getStakeholderOutcomeScore(company),
      }
    },
    {
      totalLayoffs: 0,
      totalJobsAdded: 0,
      totalPriceHikes: 0,
      totalDividendRecaps: 0,
      totalExtractedCash: 0,
      totalInvestedCash: 0,
      totalBacklashEvents: 0,
      totalRegulatoryIncidents: 0,
      averageCommunityTrust: 0,
      averageOutcomeScore: 0,
    },
  )

  return {
    ...totals,
    averageCommunityTrust: Math.round((totals.averageCommunityTrust / hydrated.length) * 10) / 10,
    averageOutcomeScore: Math.round((totals.averageOutcomeScore / hydrated.length) * 10) / 10,
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
