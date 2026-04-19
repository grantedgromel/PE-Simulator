import type { Fund, FundraisingResult, FundRecord, FinalScore } from '../types/fund'
import type { Difficulty } from '../types/game'
import type { PortfolioCompany } from '../types/company'
import type { ExitResult } from '../types/effects'
import {
  ensureCompanyConsequences,
  getOwnershipArchetype,
  getStakeholderOutcomeScore,
  summarizeHumanConsequences,
} from './consequenceEngine'
import { getSectorPostExitFate } from '../data/sectorConsequenceFlavor'

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
    const hydrated = ensureCompanyConsequences(co)
    const humanScore = getStakeholderOutcomeScore(hydrated)
    const archetype = getOwnershipArchetype(hydrated)
    const healthy = humanScore >= 65 && hydrated.revenueGrowthRate > 0
    const stripMined =
      humanScore < 35
      || hydrated.communityTrust < 30
      || hydrated.consequenceLedger.layoffs > Math.max(25, hydrated.employeeCount * 0.2)
    const hash = (seed + i * 7919) % 100

    if (hydrated.status === 'WrittenOff') {
      return {
        companyName: hydrated.name,
        fate: `${hydrated.name} was liquidated. Assets were sold to satisfy creditors. ${hydrated.employeeCount} employees were let go.`,
      }
    }

    if (healthy) {
      if (hash < 85) {
        return {
          companyName: hydrated.name,
          fate: getSectorPostExitFate(hydrated, 'healthy', hash),
        }
      }
      return { companyName: hydrated.name, fate: `${hydrated.name} became a case study in disciplined ownership. Even critics admitted the ${archetype.toLowerCase()} routine worked.` }
    }

    if (stripMined) {
      if (hash < 80) {
        return {
          companyName: hydrated.name,
          fate: getSectorPostExitFate(hydrated, 'stripMined', hash),
        }
      }
      if (hash < 92) return { companyName: hydrated.name, fate: `${hydrated.name}'s former CEO wrote a viral essay about life inside a ${archetype.toLowerCase()} asset. It did numbers.` }
      return { companyName: hydrated.name, fate: `${hydrated.name} was acquired for parts. The brand no longer exists, but the debt model is still immaculate.` }
    }

    // Mixed health
    if (hash < 80) {
      return {
        companyName: hydrated.name,
        fate: getSectorPostExitFate(hydrated, 'mixed', hash),
      }
    }
    return { companyName: hydrated.name, fate: `${hydrated.name} was re-sold within two years. Buyers liked the EBITDA, but diligence kept circling back to culture and customer fatigue.` }
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
  const consequenceSummary = summarizeHumanConsequences(allCompanies)

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
  const averageCommunityTrust = consequenceSummary.averageCommunityTrust
  const averageHumanOutcomeScore = consequenceSummary.averageOutcomeScore

  let humanImpactGrade: FinalScore['humanImpactGrade'] = 'C'
  if (averageHumanOutcomeScore >= 75 && avgMorale >= 60 && bankruptRate < 0.1) humanImpactGrade = 'S'
  else if (averageHumanOutcomeScore >= 62 && averageCommunityTrust >= 55 && bankruptRate < 0.2) humanImpactGrade = 'A'
  else if (averageHumanOutcomeScore >= 48 && averageCommunityTrust >= 45 && bankruptRate < 0.3) humanImpactGrade = 'B'
  else if (bankruptRate >= 0.5 || averageHumanOutcomeScore < 20) humanImpactGrade = 'F'
  else if (bankruptRate >= 0.4 || avgMorale < 30 || averageCommunityTrust < 30) humanImpactGrade = 'D'

  return {
    funds: fundHistory,
    cumulativeNetToLP,
    weightedNetMoic: Math.round(weightedNetMoic * 100) / 100,
    totalPersonalCarry: Math.round(totalPersonalCarry * 100) / 100,
    totalManagementFeeIncome: Math.round(totalFees * 100) / 100,
    totalEmployeesImpacted: totalEmployees,
    totalLayoffs: consequenceSummary.totalLayoffs,
    totalJobsAdded: consequenceSummary.totalJobsAdded,
    totalExtractedCash: consequenceSummary.totalExtractedCash,
    totalInvestedInBusinesses: consequenceSummary.totalInvestedCash,
    averageCommunityTrust,
    averageHumanOutcomeScore,
    returnGrade,
    humanImpactGrade,
  }
}
