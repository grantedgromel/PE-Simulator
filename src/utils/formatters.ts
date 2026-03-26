/**
 * Format a number as currency (in millions).
 * Values are stored in millions, so 200 = $200M.
 */
export function formatCurrency(valueInMillions: number): string {
  if (valueInMillions >= 1000) {
    return `$${(valueInMillions / 1000).toFixed(1)}B`
  }
  if (valueInMillions >= 100) {
    return `$${Math.round(valueInMillions)}M`
  }
  if (valueInMillions >= 10) {
    return `$${valueInMillions.toFixed(1)}M`
  }
  return `$${valueInMillions.toFixed(2)}M`
}

/**
 * Format a decimal as a percentage.
 * 0.152 → "15.2%"
 */
export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`
}

/**
 * Format a number as a multiple.
 * 8.5 → "8.5x"
 */
export function formatMultiple(value: number): string {
  return `${value.toFixed(1)}x`
}

/**
 * Format a number with commas.
 * 1234567 → "1,234,567"
 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString()
}

/**
 * Format quarter display.
 * (1, 3) → "Year 1, Q3"
 */
export function formatQuarter(year: number, quarter: number): string {
  return `Year ${year}, Q${quarter}`
}

/**
 * Format fund cycle display.
 * 1 → "Fund I", 2 → "Fund II", 3 → "Fund III"
 */
export function formatFundCycle(cycle: number): string {
  const numerals = ['I', 'II', 'III']
  return `Fund ${numerals[cycle - 1] ?? cycle}`
}
