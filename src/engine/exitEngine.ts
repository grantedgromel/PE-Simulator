import type { PortfolioCompany } from '../types/company'
import type { Fund } from '../types/fund'
import type { ExitRoute, ExitResult, ExitInProgress, MarketConditions } from '../types/effects'
import type { Difficulty, Sector } from '../types/game'
import { PRNG } from './prng'

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
  _difficulty: Difficulty,
): ExitOption[] {
  const sectorBase = SECTOR_BASE_MULTIPLES[company.sector] + market.exitMultipleModifier

  return [
    calculateStrategicSale(company, sectorBase),
    calculateSponsorToSponsor(company, sectorBase),
    calculateIPO(company, sectorBase, market),
    calculateContinuationVehicle(company, fund),
    calculateWriteOff(company),
  ]
}

function calculateStrategicSale(company: PortfolioCompany, sectorBase: number): ExitOption {
  let premium = 0
  if (company.revenueGrowthRate > 0.05 && company.customerSatisfaction > 60 && company.morale > 50) {
    premium = 1.5
  } else if (company.revenueGrowthRate > 0 && company.customerSatisfaction > 40) {
    premium = 0.3
  } else {
    premium = -1.0
  }

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
    successProbability: 0.90,
    available: company.quartersHeld >= 8,
    unavailableReason: company.quartersHeld < 8 ? 'Must hold for 2+ years' : undefined,
    description: 'Sale to a strategic acquirer. Premium for healthy businesses.',
  }
}

function calculateSponsorToSponsor(company: PortfolioCompany, sectorBase: number): ExitOption {
  let adjustment = -0.5 // sponsors grind
  if (company.addOnCount < 3 && company.revenue < 100) adjustment += 0.7 // roll-up runway
  if (company.revenue > 50) adjustment += 0.5 // platform scale

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
    description: 'Sale to another PE fund. Faster but lower multiple.',
  }
}

function calculateIPO(company: PortfolioCompany, sectorBase: number, market: MarketConditions): ExitOption {
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

  const meetsThresholds = company.revenue >= 75 && company.ebitda >= 15 && company.revenueGrowthRate > 0

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
      ? 'Requires revenue >$75M, EBITDA >$15M, positive growth'
      : company.quartersHeld < 8 ? 'Must hold for 2+ years' : undefined,
    description: `IPO. Market: ${temp > 70 ? 'Hot' : temp > 50 ? 'Warm' : temp > 30 ? 'Cool' : 'Cold'}. Partial exit initially.`,
  }
}

function calculateContinuationVehicle(company: PortfolioCompany, fund: Fund): ExitOption {
  const netProceeds = Math.max(0, company.currentImpliedValuation - company.totalDebt)
  const totalInvested = company.entryEquity
  const moic = totalInvested > 0 ? (netProceeds + company.dividendRecapTotal) / totalInvested : 0
  const approvalProb = fund.reputationScore / 100

  return {
    route: 'ContinuationVehicle',
    exitMultiple: company.ebitda > 0 ? Math.round(company.currentImpliedValuation / company.ebitda * 10) / 10 : 0,
    exitTEV: company.currentImpliedValuation,
    netProceeds: Math.round(netProceeds * 100) / 100,
    estimatedGrossMoic: Math.round(moic * 100) / 100,
    timeToComplete: 1,
    successProbability: approvalProb,
    available: true,
    description: `Roll into next fund. LP approval chance: ${Math.round(approvalProb * 100)}%. Reputation hit.`,
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
  if (option.route === 'WriteOff') {
    return {
      ...company,
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

  return { ...company, exitInProgress }
}

export function completeExit(
  prng: PRNG,
  company: PortfolioCompany,
  currentQuarter: number,
  currentYear: number,
): { company: PortfolioCompany; result: ExitResult; proceeds: number } | null {
  const exit = company.exitInProgress
  if (!exit || exit.completionQuarter > currentQuarter) return null

  // Check success probability
  const option = { route: exit.route, successProbability: 0.85 }
  if (exit.route === 'IPO') option.successProbability = 0.70
  if (exit.route === 'ContinuationVehicle') option.successProbability = 0.60

  if (!prng.chance(option.successProbability)) {
    // Failed — company returns to active
    return {
      company: { ...company, exitInProgress: null },
      result: null!,
      proceeds: 0,
    }
  }

  const exitTEV = company.ebitda * exit.exitMultiple
  const netProceeds = Math.max(0, exitTEV - company.totalDebt)
  const totalInvested = company.entryEquity
  const totalProceeds = netProceeds + company.dividendRecapTotal
  const grossMoic = totalInvested > 0 ? totalProceeds / totalInvested : 0

  // Calculate IRR from cash flows
  const entryQuarter = company.quartersHeld > 0 ? currentQuarter - company.quartersHeld : 0
  const cashFlows: { quarter: number; amount: number }[] = [
    { quarter: entryQuarter, amount: -totalInvested },
  ]
  if (company.dividendRecapTotal > 0) {
    // Approximate recap timing as midpoint
    cashFlows.push({
      quarter: entryQuarter + Math.floor(company.quartersHeld / 2),
      amount: company.dividendRecapTotal,
    })
  }
  cashFlows.push({ quarter: currentQuarter, amount: netProceeds })

  const grossIrr = calculateIRR(cashFlows)

  const exitResult: ExitResult = {
    companyId: company.id,
    companyName: company.name,
    route: exit.route,
    entryYear: currentYear - Math.floor(company.quartersHeld / 4),
    entryQuarter: 1,
    exitYear: currentYear,
    exitQuarter: currentQuarter,
    holdPeriodQuarters: company.quartersHeld,
    equityInvested: totalInvested,
    additionalInvestments: 0,
    totalInvested,
    dividendRecapProceeds: company.dividendRecapTotal,
    exitProceeds: netProceeds,
    totalProceeds,
    grossMoic: Math.round(grossMoic * 100) / 100,
    grossIrr: Math.round(grossIrr * 1000) / 1000,
  }

  const exitedCompany: PortfolioCompany = {
    ...company,
    status: 'Exited',
    exitInProgress: null,
    exitType: exit.route as any,
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
    if (company.status !== 'Active') continue

    const fireMultiple = Math.max(3, company.entryMultiple - prng.nextFloat(1, 2))
    const exitTEV = company.ebitda * fireMultiple
    const netProceeds = Math.max(0, exitTEV - company.totalDebt)
    const totalInvested = company.entryEquity
    const totalProceedsForDeal = netProceeds + company.dividendRecapTotal
    const grossMoic = totalInvested > 0 ? totalProceedsForDeal / totalInvested : 0

    results.push({
      companyId: company.id,
      companyName: company.name,
      route: 'StrategicSale',
      entryYear: currentYear - Math.floor(company.quartersHeld / 4),
      entryQuarter: 1,
      exitYear: currentYear,
      exitQuarter: currentQuarter,
      holdPeriodQuarters: company.quartersHeld,
      equityInvested: totalInvested,
      additionalInvestments: 0,
      totalInvested,
      dividendRecapProceeds: company.dividendRecapTotal,
      exitProceeds: netProceeds,
      totalProceeds: totalProceedsForDeal,
      grossMoic: Math.round(grossMoic * 100) / 100,
      grossIrr: 0,
    })

    exitedCompanies.push({
      ...company,
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
