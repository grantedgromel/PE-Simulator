import type { Fund } from '../types/fund'

/**
 * Calculate quarterly management fee.
 * During investment period (years 1-5): 2% of committed capital / 4
 * After investment period: 1.5% of invested (deployed) capital / 4
 */
export function calculateQuarterlyManagementFee(fund: Fund, yearInFund: number): number {
  if (yearInFund <= 5) {
    return (fund.managementFeeRate * fund.committedCapital) / 4
  }
  return (0.015 * fund.deployedCapital) / 4
}

/**
 * Calculate MOIC (Multiple on Invested Capital).
 * Total Value / Total Invested
 */
export function calculateMOIC(fund: Fund): number | null {
  if (fund.totalInvested === 0) return null
  const totalValue = fund.totalDistributions + calculateRemainingValue(fund)
  return totalValue / fund.totalInvested
}

/**
 * Calculate DPI (Distributions to Paid-In).
 * Cumulative Distributions / Total Invested
 */
export function calculateDPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  return fund.totalDistributions / fund.totalInvested
}

/**
 * Calculate TVPI (Total Value to Paid-In).
 * (Distributions + Remaining Value) / Total Invested
 */
export function calculateTVPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  const totalValue = fund.totalDistributions + calculateRemainingValue(fund)
  return totalValue / fund.totalInvested
}

/**
 * Calculate RVPI (Remaining Value to Paid-In).
 * Remaining Value / Total Invested
 */
export function calculateRVPI(fund: Fund): number {
  if (fund.totalInvested === 0) return 0
  return calculateRemainingValue(fund) / fund.totalInvested
}

/**
 * Remaining value = sum of current implied valuations of active portfolio companies minus debt.
 * For now, a stub returning deployedCapital - totalDistributions (simplified).
 */
function calculateRemainingValue(fund: Fund): number {
  return Math.max(0, fund.deployedCapital - fund.totalDistributions)
}

/**
 * Update all fund metrics. Call at end of each quarter.
 */
export function updateFundMetrics(fund: Fund, yearInFund: number): Fund {
  const fee = calculateQuarterlyManagementFee(fund, yearInFund)
  return {
    ...fund,
    managementFeesCollected: fund.managementFeesCollected + fee,
    remainingCapital: fund.committedCapital - fund.deployedCapital,
    moic: calculateMOIC(fund),
    dpi: calculateDPI(fund),
    tvpi: calculateTVPI(fund),
    rvpi: calculateRVPI(fund),
  }
}
