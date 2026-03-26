import type { Fund, FundraisingResult, FundRecord, FinalScore } from '../types/fund'
import type { Difficulty } from '../types/game'
import type { PortfolioCompany } from '../types/company'
import type { ExitResult } from '../types/effects'

/**
 * Determine fundraising outcome based on fund track record.
 */
export function determineFundraisingOutcome(
  fund: Fund,
  _exitResults: import('../types/effects').ExitResult[],
  reputationScore: number,
  lpTrustScore: number,
  difficulty: Difficulty,
): FundraisingResult {
  const netMoic = fund.netMoic ?? (fund.moic ?? 0)
  const dpi = fund.dpi

  let sizeMultiplier: number
  if (netMoic >= 2.5 && dpi >= 1.5) {
    sizeMultiplier = 3.0
  } else if (netMoic >= 2.0) {
    sizeMultiplier = 2.5
  } else if (netMoic >= 1.8) {
    sizeMultiplier = 2.0
  } else if (netMoic >= 1.5) {
    sizeMultiplier = 1.5
  } else if (netMoic >= 1.2) {
    sizeMultiplier = 1.0
  } else {
    sizeMultiplier = 0
  }

  // DPI modifier — LPs who haven't seen cash are skeptical
  if (dpi < 0.5) sizeMultiplier *= 0.8
  if (dpi >= 1.0) sizeMultiplier *= 1.1

  // Reputation/trust modifiers
  if (reputationScore > 70) sizeMultiplier *= 1.1
  if (lpTrustScore < 40) sizeMultiplier *= 0.7
  if (lpTrustScore > 70) sizeMultiplier *= 1.05

  // Difficulty modifier
  const diffMod = difficulty === 'Easy' ? 1.1 : difficulty === 'Hard' ? 0.9 : 1.0
  sizeMultiplier *= diffMod

  if (sizeMultiplier <= 0) {
    const weakestMetric = dpi < 0.5 ? 'insufficient cash distributions to LPs'
      : netMoic < 1.2 ? 'below-threshold net returns'
      : 'deteriorated LP relationships'
    return {
      success: false,
      newFundSize: 0,
      lpRetentionRate: 0,
      reason: `LPs cited ${weakestMetric}. The firm will wind down operations.`,
    }
  }

  const newFundSize = Math.round(fund.committedCapital * sizeMultiplier)
  const lpRetention = Math.min(0.95, 0.50 + (netMoic - 1.0) * 0.30 + (lpTrustScore - 50) * 0.005)

  return {
    success: true,
    newFundSize,
    lpRetentionRate: Math.round(lpRetention * 100) / 100,
    reason: netMoic >= 2.0
      ? 'Strong track record attracted significant LP interest. Fund was oversubscribed.'
      : netMoic >= 1.5
        ? 'Solid performance secured commitments from existing and new LPs.'
        : 'LPs committed cautiously, citing the need for continued performance improvement.',
  }
}

/**
 * Generate post-exit company fates for the transition screen.
 */
export function generatePostExitFates(
  exitedCompanies: PortfolioCompany[],
  seed: number,
): { companyName: string; fate: string }[] {
  // Simple deterministic selection based on company state at exit
  return exitedCompanies.map((co, i) => {
    const healthy = co.morale > 50 && co.customerSatisfaction > 50 && co.revenueGrowthRate > 0
    const stripMined = co.morale < 30 || co.customerSatisfaction < 30 || co.costCutCount >= 3
    const hash = (seed + i * 7919) % 100

    if (co.status === 'WrittenOff') {
      return {
        companyName: co.name,
        fate: `${co.name} was liquidated. Assets were sold to satisfy creditors. ${co.employeeCount} employees were let go.`,
      }
    }

    if (healthy) {
      if (hash < 60) return { companyName: co.name, fate: `${co.name} continued to grow under new ownership. Expanded operations significantly.` }
      if (hash < 90) return { companyName: co.name, fate: `${co.name} was acquired by another PE fund and merged with a competitor.` }
      return { companyName: co.name, fate: `${co.name} went through another round of cost-cutting under its new owners.` }
    }

    if (stripMined) {
      if (hash < 40) return { companyName: co.name, fate: `${co.name} filed for Chapter 11 protection 18 months after your exit. ${co.employeeCount} employees affected.` }
      if (hash < 70) return { companyName: co.name, fate: `${co.name} closed multiple locations under new management. Former employees blamed cost cuts.` }
      if (hash < 90) return { companyName: co.name, fate: `${co.name}'s former CEO wrote a LinkedIn post titled "What I Learned From Being Acquired by PE." It has 47,000 likes.` }
      return { companyName: co.name, fate: `${co.name} was acquired for parts. The brand no longer exists.` }
    }

    // Mixed health
    if (hash < 50) return { companyName: co.name, fate: `${co.name} continued operating under new ownership with mixed results.` }
    return { companyName: co.name, fate: `${co.name} was re-sold to a strategic acquirer within two years.` }
  })
}

/**
 * Create a FundRecord from the current fund state.
 */
export function createFundRecord(
  fund: Fund,
  fundNumber: number,
  exitResults: ExitResult[],
  writtenOffs: number,
  personalCarry: number,
): FundRecord {
  return {
    fundNumber,
    committedCapital: fund.committedCapital,
    netMoic: fund.netMoic,
    grossMoic: fund.moic,
    netIrr: fund.netIRR,
    grossIrr: fund.grossIRR,
    dpi: fund.dpi,
    dealsCompleted: exitResults.length,
    writeOffs: writtenOffs,
    totalPersonalCarry: personalCarry,
    totalManagementFees: fund.managementFeesCollected,
  }
}

/**
 * Calculate final game score across all funds.
 */
export function calculateFinalScore(
  fundHistory: FundRecord[],
  allExitedCompanies: PortfolioCompany[],
  allWrittenOff: PortfolioCompany[],
): FinalScore {
  const totalWeightedMoic = fundHistory.reduce(
    (sum, f) => sum + (f.netMoic ?? 0) * f.committedCapital, 0
  )
  const totalCapital = fundHistory.reduce((sum, f) => sum + f.committedCapital, 0)
  const weightedNetMoic = totalCapital > 0 ? totalWeightedMoic / totalCapital : 0

  const totalPersonalCarry = fundHistory.reduce((sum, f) => sum + f.totalPersonalCarry, 0)
  const totalFees = fundHistory.reduce((sum, f) => sum + f.totalManagementFees, 0)
  const cumulativeNetToLP = fundHistory.reduce(
    (sum, f) => sum + (f.netMoic ?? 0) * f.committedCapital, 0
  )

  const allCompanies = [...allExitedCompanies, ...allWrittenOff]
  const totalEmployees = allCompanies.reduce((s, c) => s + c.employeeCount, 0)

  // Return grade
  let returnGrade: FinalScore['returnGrade'] = 'F'
  if (weightedNetMoic >= 2.5) returnGrade = 'S'
  else if (weightedNetMoic >= 2.0) returnGrade = 'A'
  else if (weightedNetMoic >= 1.7) returnGrade = 'B'
  else if (weightedNetMoic >= 1.4) returnGrade = 'C'
  else if (weightedNetMoic >= 1.0) returnGrade = 'D'

  // Human impact grade (inverse: fewer issues = better grade)
  const avgMorale = allCompanies.length > 0
    ? allCompanies.reduce((s, c) => s + c.morale, 0) / allCompanies.length
    : 50
  const bankruptRate = allWrittenOff.length / Math.max(1, allCompanies.length)

  let humanImpactGrade: FinalScore['humanImpactGrade'] = 'C'
  if (avgMorale >= 60 && bankruptRate < 0.1) humanImpactGrade = 'S'
  else if (avgMorale >= 50 && bankruptRate < 0.2) humanImpactGrade = 'A'
  else if (avgMorale >= 45 && bankruptRate < 0.3) humanImpactGrade = 'B'
  else if (bankruptRate >= 0.5) humanImpactGrade = 'F'
  else if (bankruptRate >= 0.4 || avgMorale < 30) humanImpactGrade = 'D'

  return {
    funds: fundHistory,
    cumulativeNetToLP,
    weightedNetMoic: Math.round(weightedNetMoic * 100) / 100,
    totalPersonalCarry: Math.round(totalPersonalCarry * 100) / 100,
    totalManagementFeeIncome: Math.round(totalFees * 100) / 100,
    totalEmployeesImpacted: totalEmployees,
    returnGrade,
    humanImpactGrade,
  }
}
