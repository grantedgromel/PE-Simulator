import type { PortfolioCompany } from '../types/company'
import type { Fund } from '../types/fund'
import type { ExitRoute, ExitResult, ExitInProgress, MarketConditions } from '../types/effects'
import type { Difficulty, Sector } from '../types/game'
import { PRNG } from './prng'
import { ensureCompanyConsequences, getStakeholderOutcomeScore } from './consequenceEngine'

export interface ExitOption {
  route: ExitRoute
  exitMultiple: number
  exitTEV: number
  netProceeds: number
  estimatedGrossMoic: number
  timeToComplete: number
  successProbability: number
  available: boolean
  unavailableReason?: string
  description: string
}

const SECTOR_BASE_MULTIPLES: Record<Sector, number> = {
  Healthcare: 11,
  BusinessServices: 8.5,
  Consumer: 9,
  Technology: 14,
  Industrial: 8,
}

export function calculateExitOptions(
  company: PortfolioCompany,
  fund: Fund,
  market: MarketConditions,
  difficulty: Difficulty,
): ExitOption[] {
  const hydrated = ensureCompanyConsequences(company)
  const difficultyModifier = difficulty === 'Easy' ? 0.3 : difficulty === 'Hard' ? -0.3 : 0
  const sectorBase = SECTOR_BASE_MULTIPLES[hydrated.sector] + market.exitMultipleModifier + difficultyModifier

  return [
    calculateStrategicSale(hydrated, sectorBase),
    calculateSponsorToSponsor(hydrated, sectorBase),
    calculateIPO(hydrated, sectorBase, market),
    calculateContinuationVehicle(hydrated, fund),
    calculateWriteOff(hydrated),
  ]
}

function calculateStrategicSale(company: PortfolioCompany, sectorBase: number): ExitOption {
  const humanScore = getStakeholderOutcomeScore(company)
  let premium = 0
  if (
    company.revenueGrowthRate > 0.05
    && company.customerSatisfaction > 60
    && company.morale > 50
    && company.communityTrust > 55
    && humanScore >= 60
  ) {
    premium = 1.5
  } else if (company.revenueGrowthRate > 0 && company.customerSatisfaction > 40 && company.communityTrust > 45) {
    premium = 0.3
  } else {
    premium = -1.0
  }

  if (humanScore < 40) premium -= 0.7
  if (company.consequenceLedger.regulatoryIncidents > 0) premium -= 0.4

  const exitMultiple = Math.max(3, sectorBase + premium)
  const exitTEV = company.ebitda * exitMultiple
  const netProceeds = Math.max(0, exitTEV - company.totalDebt)
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? (netProceeds + company.dividendRecapTotal) / totalInvested : 0

  return {
    route: 'StrategicSale',
    exitMultiple: Math.round(exitMultiple * 10) / 10,
    exitTEV: Math.round(exitTEV * 100) / 100,
    netProceeds: Math.round(netProceeds * 100) / 100,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: company.ebitda > 15 ? 1 : 2,
    successProbability: humanScore < 40 ? 0.8 : 0.9,
    available: company.quartersHeld >= 8,
    unavailableReason: company.quartersHeld < 8 ? 'Must hold for 2+ years' : undefined,
    description: 'Sale to a strategic acquirer. Highest premium if the business still looks healthy to employees, customers, and buyers.',
  }
}

function calculateSponsorToSponsor(company: PortfolioCompany, sectorBase: number): ExitOption {
  const humanScore = getStakeholderOutcomeScore(company)
  let adjustment = -0.5 // sponsors grind
  if (company.addOnCount < 3 && company.revenue < 100) adjustment += 0.7 // roll-up runway
  if (company.revenue > 50) adjustment += 0.5 // platform scale
  if (humanScore < 40) adjustment -= 0.5
  if (company.consequenceLedger.dividendRecaps > 0 && company.leverageRatio > 5.5) adjustment -= 0.4

  const exitMultiple = Math.max(3, sectorBase + adjustment)
  const exitTEV = company.ebitda * exitMultiple
  const netProceeds = Math.max(0, exitTEV - company.totalDebt)
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? (netProceeds + company.dividendRecapTotal) / totalInvested : 0

  return {
    route: 'SponsorToSponsor',
    exitMultiple: Math.round(exitMultiple * 10) / 10,
    exitTEV: Math.round(exitTEV * 100) / 100,
    netProceeds: Math.round(netProceeds * 100) / 100,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: 1,
    successProbability: 0.85,
    available: company.quartersHeld >= 8,
    unavailableReason: company.quartersHeld < 8 ? 'Must hold for 2+ years' : undefined,
    description: 'Sale to another PE fund. Faster, but hollowed-out assets get marked down quickly.',
  }
}

function calculateIPO(company: PortfolioCompany, sectorBase: number, market: MarketConditions): ExitOption {
  const humanScore = getStakeholderOutcomeScore(company)
  const temp = market.ipoMarketTemperature
  let premium = 0
  let successProb = 0.5

  if (temp > 70) { premium = 2.0; successProb = 0.90 }
  else if (temp > 50) { premium = 0.5; successProb = 0.70 }
  else if (temp > 30) { premium = -0.5; successProb = 0.50 }
  else { premium = -1.0; successProb = 0.25 }

  const exitMultiple = Math.max(3, sectorBase + premium)
  const exitTEV = company.ebitda * exitMultiple
  const netProceeds = Math.max(0, exitTEV - company.totalDebt) * 0.4 // sell 40% initially
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? (netProceeds * 2.5 + company.dividendRecapTotal) / totalInvested : 0 // estimate full exit

  const meetsThresholds =
    company.revenue >= 75
    && company.ebitda >= 15
    && company.revenueGrowthRate > 0
    && company.communityTrust >= 45
    && company.consequenceLedger.regulatoryIncidents === 0
    && humanScore >= 45

  return {
    route: 'IPO',
    exitMultiple: Math.round(exitMultiple * 10) / 10,
    exitTEV: Math.round(exitTEV * 100) / 100,
    netProceeds: Math.round(netProceeds * 100) / 100,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: 2,
    successProbability: successProb,
    available: meetsThresholds && company.quartersHeld >= 8,
    unavailableReason: !meetsThresholds
      ? 'Requires revenue >$75M, EBITDA >$15M, positive growth, clean governance, and decent public optics'
      : company.quartersHeld < 8 ? 'Must hold for 2+ years' : undefined,
    description: `IPO. Market: ${temp > 70 ? 'Hot' : temp > 50 ? 'Warm' : temp > 30 ? 'Cool' : 'Cold'}. Partial exit initially.`,
  }
}

function calculateContinuationVehicle(company: PortfolioCompany, fund: Fund): ExitOption {
  const humanScore = getStakeholderOutcomeScore(company)
  const netProceeds = Math.max(0, company.currentImpliedValuation - company.totalDebt)
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? (netProceeds + company.dividendRecapTotal) / totalInvested : 0
  const approvalProb = Math.max(0.2, Math.min(0.95, (fund.reputationScore / 100) * (0.7 + humanScore / 200)))

  return {
    route: 'ContinuationVehicle',
    exitMultiple: company.ebitda > 0 ? Math.round(company.currentImpliedValuation / company.ebitda * 10) / 10 : 0,
    exitTEV: company.currentImpliedValuation,
    netProceeds: Math.round(netProceeds * 100) / 100,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: 1,
    successProbability: approvalProb,
    available: true,
    description: `Roll into next fund. LP approval chance: ${Math.round(approvalProb * 100)}%. Harder to sell if the asset looks over-extracted.`,
  }
}

function calculateWriteOff(company: PortfolioCompany): ExitOption {
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? company.dividendRecapTotal / totalInvested : 0

  return {
    route: 'WriteOff',
    exitMultiple: 0,
    exitTEV: 0,
    netProceeds: 0,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: 0,
    successProbability: 1.0,
    available: true,
    description: 'Write off equity. Immediate. Reputation hit.',
  }
}

export function initiateExit(
  company: PortfolioCompany,
  option: ExitOption,
  currentQuarter: number,
): PortfolioCompany {
  const hydrated = ensureCompanyConsequences(company)
  if (option.route === 'WriteOff') {
    return {
      ...hydrated,
      status: 'WrittenOff',
      exitInProgress: null,
    }
  }

  const exitInProgress: ExitInProgress = {
    route: option.route,
    startQuarter: currentQuarter,
    completionQuarter: currentQuarter + option.timeToComplete,
    estimatedProceeds: option.netProceeds,
    exitMultiple: option.exitMultiple,
  }

  return { ...hydrated, exitInProgress }
}

export function completeExit(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): { company: PortfolioCompany; result: ExitResult; proceeds: number } | null {
  const hydrated = ensureCompanyConsequences(company)
  const exit = hydrated.exitInProgress
  if (!exit || exit.completionQuarter > currentQuarter) return null

  // Check success probability
  const option = { route: exit.route, successProbability: 0.85 }
  if (exit.route === 'IPO') option.successProbability = 0.70
  if (exit.route === 'ContinuationVehicle') option.successProbability = 0.60

  if (!prng.chance(option.successProbability)) {
    // Failed — company returns to active
    return {
      company: { ...hydrated, exitInProgress: null },
      result: null!,
      proceeds: 0,
    }
  }

  const exitTEV = hydrated.ebitda * exit.exitMultiple
  const netProceeds = Math.max(0, exitTEV - hydrated.totalDebt)
  const totalInvested = hydrated.entryEquity
  const totalProceeds = netProceeds + hydrated.dividendRecapTotal
  const grossMoic = totalInvested > 0 ? totalProceeds / totalInvested : 0

  // Calculate IRR from cash flows
  const entryQuarter = hydrated.quartersHeld > 0 ? currentQuarter - hydrated.quartersHeld : 0
  const cashFlows: { quarter: number; amount: number }[] = [
    { quarter: entryQuarter, amount: -totalInvested },
  ]
  if (hydrated.dividendRecapTotal > 0) {
    // Approximate recap timing as midpoint
    cashFlows.push({
      quarter: entryQuarter + Math.floor(hydrated.quartersHeld / 2),
      amount: hydrated.dividendRecapTotal,
    })
  }
  cashFlows.push({ quarter: currentQuarter, amount: netProceeds })

  const grossIrr = calculateIRR(cashFlows)

  const exitResult: ExitResult = {
    companyId: hydrated.id,
    companyName: hydrated.name,
    route: exit.route,
    entryYear: currentYear - Math.floor(hydrated.quartersHeld / 4),
    entryQuarter: 1,
    exitYear: currentYear,
    exitQuarter: currentQuarter,
    holdPeriodQuarters: hydrated.quartersHeld,
    equityInvested: totalInvested,
    additionalInvestments: 0,
    totalInvested,
    dividendRecapProceeds: hydrated.dividendRecapTotal,
    exitProceeds: netProceeds,
    totalProceeds,
    grossMoic: Math.round(grossMoic * 100) / 100,
    grossIrr: Math.round(grossIrr * 1000) / 1000,
  }

  const exitedCompany: PortfolioCompany = {
    ...hydrated,
    status: 'Exited',
    exitInProgress: null,
    exitType: exit.route,
    exitMultiple: exit.exitMultiple,
    exitProceeds: netProceeds,
  }

  return { company: exitedCompany, result: exitResult, proceeds: netProceeds }
}

/**
 * Calculate IRR using Newton's method on quarterly cash flows.
 * Returns annualized IRR.
 */
export function calculateIRR(cashFlows: { quarter: number; amount: number }[]): number {
  if (cashFlows.length < 2) return 0

  const minQ = Math.min(...cashFlows.map((cf) => cf.quarter))
  const normalized = cashFlows.map((cf) => ({
    period: cf.quarter - minQ,
    amount: cf.amount,
  }))

  // Check if all cash flows are negative
  const totalCF = normalized.reduce((sum, cf) => sum + cf.amount, 0)
  if (totalCF <= 0) return -1

  let r = 0.05 // initial quarterly rate guess

  for (let iter = 0; iter < 100; iter++) {
    let npv = 0
    let dnpv = 0

    for (const cf of normalized) {
      const discount = Math.pow(1 + r, cf.period)
      if (discount === 0) continue
      npv += cf.amount / discount
      dnpv -= cf.period * cf.amount / (discount * (1 + r))
    }

    if (Math.abs(npv) < 0.0001) break
    if (dnpv === 0) break

    const newR = r - npv / dnpv
    // Clamp to reasonable range
    r = Math.max(-0.99, Math.min(10, newR))
  }

  // Annualize quarterly rate
  const annualIRR = Math.pow(1 + r, 4) - 1
  return Math.max(-1, Math.min(annualIRR, 10))
}

/**
 * Force-exit all remaining companies at a discount (fund expiration).
 */
export function forceExitAll(
  prng: PRNG,
  companies: PortfolioCompany[],
  currentQuarter: number,
  currentYear: number,
): { exitedCompanies: PortfolioCompany[]; results: ExitResult[]; totalProceeds: number } {
  const results: ExitResult[] = []
  const exitedCompanies: PortfolioCompany[] = []
  let totalProceeds = 0

  for (const company of companies) {
    const hydrated = ensureCompanyConsequences(company)
    if (hydrated.status !== 'Active') continue

    const fireMultiple = Math.max(3, hydrated.entryMultiple - prng.nextFloat(1, 2))
    const exitTEV = hydrated.ebitda * fireMultiple
    const netProceeds = Math.max(0, exitTEV - hydrated.totalDebt)
    const totalInvested = hydrated.entryEquity
    const totalProceedsForDeal = netProceeds + hydrated.dividendRecapTotal
    const grossMoic = totalInvested > 0 ? totalProceedsForDeal / totalInvested : 0

    results.push({
      companyId: hydrated.id,
      companyName: hydrated.name,
      route: 'StrategicSale',
      entryYear: currentYear - Math.floor(hydrated.quartersHeld / 4),
      entryQuarter: 1,
      exitYear: currentYear,
      exitQuarter: currentQuarter,
      holdPeriodQuarters: hydrated.quartersHeld,
      equityInvested: totalInvested,
      additionalInvestments: 0,
      totalInvested,
      dividendRecapProceeds: hydrated.dividendRecapTotal,
      exitProceeds: netProceeds,
      totalProceeds: totalProceedsForDeal,
      grossMoic: Math.round(grossMoic * 100) / 100,
      grossIrr: 0,
    })

    exitedCompanies.push({
      ...hydrated,
      status: 'Exited',
      exitInProgress: null,
      exitType: 'StrategicSale',
      exitMultiple: fireMultiple,
      exitProceeds: netProceeds,
    })

    totalProceeds += netProceeds
  }

  return { exitedCompanies, results, totalProceeds }
}
