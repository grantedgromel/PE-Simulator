import type { Fund, WaterfallResult } from '../types/fund'
import { calculateIRR } from './exitEngine'

/**
 * Calculate the European (whole-fund) carry waterfall.
 * Stage 1: Return of Capital → LP gets back invested capital
 * Stage 2: Preferred Return → LP gets 8% annualized (2% quarterly compounded)
 * Stage 3: GP Catch-Up → 100% to GP until GP has 20% of total profits
 * Stage 4: 80/20 Split → remaining split 80% LP / 20% GP
 */
export function calculateWaterfall(
  totalDistributions: number,
  lpInvestedCapital: number,
  quartersInvested: number,
): WaterfallResult {
  // LP preferred return: compounded quarterly at 2%
  const preferredReturn = lpInvestedCapital * (Math.pow(1.02, quartersInvested) - 1)

  let remaining = totalDistributions
  let totalToLP = 0
  let totalToGP = 0
  let capitalReturned = 0
  let preferredReturnPaid = 0
  let gpCatchUpPaid = 0

  // Stage 1: Return of Capital
  capitalReturned = Math.min(remaining, lpInvestedCapital)
  totalToLP += capitalReturned
  remaining -= capitalReturned
  if (remaining <= 0) {
    return makeResult(1)
  }

  // Stage 2: Preferred Return
  // Stage2
  preferredReturnPaid = Math.min(remaining, preferredReturn)
  totalToLP += preferredReturnPaid
  remaining -= preferredReturnPaid
  if (remaining <= 0) {
    return makeResult(2)
  }

  // Stage 3: GP Catch-Up
  // GP needs 20% of total profits. Total profits = totalDistributions - lpInvestedCapital
  // At this point, LP has received: capitalReturned + preferredReturnPaid
  // GP has received: $0
  // GP target: profits * 0.20 / 0.80 of what LP received above capital
  // Simplified: 100% to GP until GP has 25% of LP's profit (which equals 20% of total profit)
  // Stage3
  const totalProfits = totalDistributions - lpInvestedCapital
  const gpTarget = totalProfits * 0.20
  gpCatchUpPaid = Math.min(remaining, gpTarget)
  totalToGP += gpCatchUpPaid
  remaining -= gpCatchUpPaid
  if (remaining <= 0) {
    return makeResult(3)
  }

  // Stage 4: 80/20 Split
  // Stage4
  totalToLP += remaining * 0.80
  totalToGP += remaining * 0.20

  return makeResult(4)

  function makeResult(stage: 1 | 2 | 3 | 4): WaterfallResult {
    return {
      totalDistributions,
      lpInvestedCapital,
      lpPreferredReturn: preferredReturn,
      capitalReturned,
      preferredReturnPaid,
      gpCatchUpPaid,
      totalToLP: Math.round(totalToLP * 100) / 100,
      totalToGP: Math.round(totalToGP * 100) / 100,
      currentStage: stage,
    }
  }
}

/**
 * Calculate net-to-LP metrics using actual cash flow streams.
 */
export function calculateNetMetrics(fund: Fund): {
  netMoic: number | null
  netIrr: number | null
  dpi: number
  tvpi: number
} {
  const lpInvested = fund.totalInvested + fund.managementFeesCollected
  if (lpInvested <= 0) return { netMoic: null, netIrr: null, dpi: 0, tvpi: 0 }

  // Run waterfall on total distributions
  const waterfall = calculateWaterfall(
    fund.totalDistributions,
    fund.totalInvested,
    fund.irrByQuarter.length || 1,
  )

  const netDistributions = waterfall.totalToLP
  const dpi = netDistributions / lpInvested

  // Estimate remaining portfolio NAV for LP
  const remainingNAV = Math.max(0, fund.deployedCapital * 0.9) // simplified: 90% of deployed
  const tvpi = (netDistributions + remainingNAV) / lpInvested
  const netMoic = tvpi

  // Build LP cash flow stream for net IRR
  const cashFlows: { quarter: number; amount: number }[] = []

  // Capital calls (negative for LP)
  for (const call of fund.capitalCalls) {
    cashFlows.push({ quarter: call.quarter, amount: -call.amount })
  }

  // Fee calls (negative for LP)
  for (let q = 0; q < fund.irrByQuarter.length; q++) {
    const fee = q < 20
      ? fund.committedCapital * fund.managementFeeRate / 4
      : Math.max(0, fund.deployedCapital - fund.totalDistributions) * 0.015 / 4
    if (fee > 0) {
      cashFlows.push({ quarter: q, amount: -fee })
    }
  }

  // LP distributions (positive)
  for (const dist of fund.lpDistributions) {
    cashFlows.push({ quarter: dist.quarter, amount: dist.amount })
  }

  // Terminal value
  if (remainingNAV > 0) {
    const lastQ = fund.irrByQuarter.length
    cashFlows.push({ quarter: lastQ, amount: remainingNAV })
  }

  const netIrr = cashFlows.length >= 2 ? calculateIRR(cashFlows) : null

  return {
    netMoic: Math.round((netMoic ?? 0) * 100) / 100,
    netIrr: netIrr !== null ? Math.round(netIrr * 1000) / 1000 : null,
    dpi: Math.round(dpi * 100) / 100,
    tvpi: Math.round(tvpi * 100) / 100,
  }
}

/**
 * Calculate personal carry for the player.
 */
export function calculatePersonalCarry(
  gpTotalCarry: number,
  teamCarryAllocations: { name: string; pct: number }[],
): {
  playerSharePct: number
  playerCarryDollars: number
  teamBreakdown: { name: string; pct: number; dollars: number }[]
} {
  const totalTeamPct = teamCarryAllocations.reduce((s, t) => s + t.pct, 0)
  const playerSharePct = Math.max(0, 100 - totalTeamPct)
  const playerCarryDollars = gpTotalCarry * (playerSharePct / 100)

  return {
    playerSharePct: Math.round(playerSharePct * 10) / 10,
    playerCarryDollars: Math.round(playerCarryDollars * 100) / 100,
    teamBreakdown: teamCarryAllocations.map((t) => ({
      ...t,
      dollars: Math.round(gpTotalCarry * (t.pct / 100) * 100) / 100,
    })),
  }
}
