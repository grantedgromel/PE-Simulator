import type { Fund } from '../types/fund'
import { calculateWaterfall } from './carryWaterfall'

/**
 * Calculate quarterly management fee.
 */
export function calculateQuarterlyManagementFee(fund: Fund, yearInFund: number): number {
  if (yearInFund <= 5) {
    return (fund.managementFeeRate * fund.committedCapital) / 4
  }
  const investedCapital = Math.max(0, fund.deployedCapital - fund.totalDistributions)
  return (0.015 * investedCapital) / 4
}

/**
 * Calculate MOIC.
 */
export function calculateMOIC(fund: Fund): number | null {
  if (fund.totalInvested === 0) return null
  const totalValue = fund.totalDistributions + calculateRemainingValue(fund)
  return totalValue / fund.totalInvested
}

/**
 * Calculate DPI.
 */
export function calculateDPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  return fund.totalDistributions / fund.totalInvested
}

/**
 * Calculate TVPI.
 */
export function calculateTVPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  const totalValue = fund.totalDistributions + calculateRemainingValue(fund)
  return totalValue / fund.totalInvested
}

/**
 * Calculate RVPI.
 */
export function calculateRVPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  return calculateRemainingValue(fund) / fund.totalInvested
}

function calculateRemainingValue(fund: Fund): number {
  return Math.max(0, fund.deployedCapital - fund.totalDistributions)
}

/**
 * Update all fund metrics including carry waterfall. Called at end of each quarter.
 */
export function updateFundMetrics(fund: Fund, yearInFund: number): Fund {
  const fee = calculateQuarterlyManagementFee(fund, yearInFund)

  // Run carry waterfall
  const quartersInvested = fund.irrByQuarter.length || 1
  const waterfall = calculateWaterfall(fund.totalDistributions, fund.totalInvested, quartersInvested)

  const moic = calculateMOIC(fund)
  const dpi = calculateDPI(fund)
  const tvpi = calculateTVPI(fund)
  const rvpi = calculateRVPI(fund)

  // Net MOIC (LP perspective): total to LP / LP invested (capital + fees)
  const lpInvested = fund.totalInvested + fund.managementFeesCollected + fee
  const netMoic = lpInvested > 0 ? (waterfall.totalToLP + calculateRemainingValue(fund)) / lpInvested : null

  return {
    ...fund,
    managementFeesCollected: Math.round((fund.managementFeesCollected + fee) * 100) / 100,
    remainingCapital: fund.committedCapital - fund.deployedCapital,
    moic,
    netMoic,
    dpi,
    tvpi,
    rvpi,
    gpTotalCarry: waterfall.totalToGP,
    carryAccrued: waterfall.totalToGP,
    irrByQuarter: [...fund.irrByQuarter, netMoic !== null ? (netMoic - 1) * 0.1 : 0], // simplified net IRR proxy per quarter
  }
}
