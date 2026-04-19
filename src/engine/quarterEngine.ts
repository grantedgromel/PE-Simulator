import type { GameState, GamePhase } from '../types/game'
import { updateFundMetrics } from './fundEconomics'
import { generateDeals } from './dealGenerator'
import { simulateAllCompanies } from './companySimulation'
import { updateMarketConditions } from './marketConditions'
import { generateQuarterlyEvents } from './eventEngine'
import { completeExit, forceExitAll } from './exitEngine'
import { processSkillDevelopment, checkTeamEvents } from './teamEngine'
import { PRNG } from './prng'
import { applyConsequenceDelta, ensureCompanyConsequences, summarizeHumanConsequences } from './consequenceEngine'
import { getMainStreetBacklashDescription } from '../data/sectorConsequenceFlavor'

const PHASE_ORDER: GamePhase[] = [
  'Sourcing',
  'TeamAssignment',
  'Diligence',
  'Structuring',
  'Operations',
  'Exits',
  'EndOfQuarter',
]

/**
 * Determine the next phase, skipping phases that have no relevant content.
 */
export function getNextPhase(state: GameState): GamePhase {
  const currentIndex = PHASE_ORDER.indexOf(state.currentPhase)
  const isInvestmentPeriod = state.totalQuartersElapsed < state.investmentPeriodEndQuarter

  for (let i = currentIndex + 1; i < PHASE_ORDER.length; i++) {
    const phase = PHASE_ORDER[i]

    // Skip Sourcing/TeamAssignment/Diligence/Structuring after investment period ends
    if (!isInvestmentPeriod && (phase === 'Sourcing' || phase === 'TeamAssignment' || phase === 'Diligence' || phase === 'Structuring')) {
      continue
    }

    // TeamAssignment: show if there are deals to assign or portfolio to manage
    if (phase === 'TeamAssignment') {
      const hasPursued = state.currentDeals.some((d) => d.status === 'Pursued')
      const hasPortfolio = state.portfolioCompanies.some((c) => c.status === 'Active')
      if (!hasPursued && !hasPortfolio) continue
    }

    if (phase === 'Diligence') {
      const hasPursued = state.currentDeals.some((d) => d.status === 'Pursued')
      if (!hasPursued) continue
    }

    if (phase === 'Structuring') {
      const hasWon = state.currentDeals.some((d) => d.status === 'Won')
      if (!hasWon) continue
    }

    if (phase === 'Operations') {
      if (state.portfolioCompanies.filter(c => c.status === 'Active').length === 0) continue
    }

    if (phase === 'Exits') {
      const hasExitable = state.portfolioCompanies.some(
        (c) => c.status === 'Active' && (c.quartersHeld >= 8 || c.exitInProgress)
      )
      if (!hasExitable) continue
    }

    return phase
  }

  return 'EndOfQuarter'
}

export function advancePhase(state: GameState): GameState {
  if (state.currentPhase === 'EndOfQuarter') {
    return processEndOfQuarter(state)
  }

  const nextPhase = getNextPhase(state)
  return { ...state, currentPhase: nextPhase }
}

export function processEndOfQuarter(state: GameState): GameState {
  let nextQuarter = state.currentQuarter + 1
  let nextYear = state.currentYear

  if (nextQuarter > 4) {
    nextQuarter = 1
    nextYear += 1
  }

  const yearInFund = nextYear - state.fund.vintageYear + 1
  const newPrngCounter = state.prngCounter + 1
  const prng = new PRNG(state.seed + newPrngCounter)
  const newTotalQuarters = state.totalQuartersElapsed + 1

  // 1. Process in-progress exits
  let portfolioCompanies = [...state.portfolioCompanies]
  const exitedCompanies = [...state.exitedCompanies]
  const exitResults = [...state.exitResults]
  let totalNewDistributions = 0

  for (let i = 0; i < portfolioCompanies.length; i++) {
    const co = portfolioCompanies[i]
    if (co.exitInProgress && co.exitInProgress.completionQuarter <= newTotalQuarters) {
      const exitResult = completeExit(prng, co, newTotalQuarters, nextYear)
      if (exitResult && exitResult.result) {
        portfolioCompanies[i] = exitResult.company
        exitedCompanies.push(exitResult.company)
        exitResults.push(exitResult.result)
        totalNewDistributions += exitResult.proceeds
      } else if (exitResult) {
        // Exit failed — company returns to active
        portfolioCompanies[i] = exitResult.company
      }
    }
  }

  // Remove exited companies from active portfolio
  portfolioCompanies = portfolioCompanies.filter((c) => c.status === 'Active')

  // 2. Check for fund expiration — force exit remaining
  if (newTotalQuarters >= state.fundEndQuarter && portfolioCompanies.length > 0) {
    const forceResult = forceExitAll(prng, portfolioCompanies, newTotalQuarters, nextYear)
    exitedCompanies.push(...forceResult.exitedCompanies)
    exitResults.push(...forceResult.results)
    totalNewDistributions += forceResult.totalProceeds
    portfolioCompanies = []
  }

  // 3. Simulate all remaining active portfolio companies
  const { companies: simulatedCompanies, effects: remainingEffects, events: simEvents } =
    simulateAllCompanies(prng, portfolioCompanies, state.pendingEffects, newTotalQuarters)

  const updatedPortfolio = simulatedCompanies.map((co) => ({
    ...co,
    quartersHeld: co.quartersHeld + 1,
    yearsHeld: Math.floor((co.quartersHeld + 1) / 4),
  }))

  // 4. Generate random events
  const { events: randomEvents, marketDelta, reputationDelta, companyEffects } =
    generateQuarterlyEvents(prng, { ...state, portfolioCompanies: updatedPortfolio })

  // Apply company-specific event effects
  const eventedPortfolio = updatedPortfolio.map((co) => {
    let updated = ensureCompanyConsequences(co)
    const effectsForCompany = companyEffects.filter((effect) => effect.companyId === co.id)
    if (effectsForCompany.length === 0) return updated

    for (const effect of effectsForCompany) {
      if (effect.modifications.revenueLoss) {
        updated.revenue = Math.round(updated.revenue * (1 - effect.modifications.revenueLoss) * 100) / 100
        updated.ebitda = Math.round(updated.revenue * updated.ebitdaMargin * 100) / 100
      }
      if (effect.modifications.moraleDelta) {
        updated.morale = Math.max(0, Math.min(100, updated.morale + effect.modifications.moraleDelta))
      }
      if (effect.modifications.ebitdaRestatement) {
        updated.ebitda = Math.round(updated.ebitda * (1 - effect.modifications.ebitdaRestatement) * 100) / 100
        updated.ebitdaMargin = updated.revenue > 0 ? Math.round(updated.ebitda / updated.revenue * 1000) / 1000 : updated.ebitdaMargin
      }
      if (effect.modifications.ebitdaHit) {
        updated.ebitda = Math.round(updated.ebitda * (1 - effect.modifications.ebitdaHit) * 100) / 100
      }
      if (effect.modifications.communityTrustDelta || effect.modifications.backlashEvent) {
        updated = applyConsequenceDelta(updated, {
          communityTrustDelta: effect.modifications.communityTrustDelta,
          communityBacklashEvents: effect.modifications.backlashEvent,
          regulatoryIncidents: effect.modifications.regulatoryIncident,
          qualityIncidents: effect.modifications.qualityIncident,
        })
      }
    }
    return updated
  })

  const consequenceSummary = summarizeHumanConsequences(eventedPortfolio)
  const lowTrustCompanies = eventedPortfolio.filter((company) => company.communityTrust < 45)
  const blowbackEvents: import('../types/events').GameEvent[] = []
  let consequenceReputationDelta = 0
  let consequenceLpTrustDelta = 0

  if (lowTrustCompanies.length > 0) {
    consequenceReputationDelta -= lowTrustCompanies.length >= 2 ? 2 : 1
  }
  if (consequenceSummary.averageCommunityTrust > 0 && consequenceSummary.averageCommunityTrust < 45) {
    consequenceReputationDelta -= 1
  }
  if (
    consequenceSummary.totalDividendRecaps > 0
    && consequenceSummary.totalExtractedCash > consequenceSummary.totalInvestedCash * 1.25
  ) {
    consequenceLpTrustDelta -= 1
  }

  if (consequenceReputationDelta < 0 || consequenceLpTrustDelta < 0) {
    const mostPressuredCompany = lowTrustCompanies[0]
    blowbackEvents.push({
      id: `evt-blowback-${newTotalQuarters}`,
      category: 'Satirical',
      title: 'Main Street Blowback',
      description: mostPressuredCompany
        ? getMainStreetBacklashDescription(mostPressuredCompany, newTotalQuarters + lowTrustCompanies.length)
        : 'Your portfolio is drawing more hostile attention from customers, employees, and local press.',
      quarter: newTotalQuarters,
      year: nextYear,
      impact: { reputation: consequenceReputationDelta, lpTrust: consequenceLpTrustDelta },
      resolved: true,
    })
  }

  // 5. Update market conditions
  const newMarket = updateMarketConditions(prng, state.marketConditions)
  if (marketDelta.interestRateModifier) newMarket.interestRateModifier += marketDelta.interestRateModifier
  if (marketDelta.exitMultipleModifier) newMarket.exitMultipleModifier += marketDelta.exitMultipleModifier
  if (marketDelta.creditAvailability) newMarket.creditAvailability = Math.max(0, Math.min(100, newMarket.creditAvailability + marketDelta.creditAvailability))
  if (marketDelta.ipoMarketTemperature) newMarket.ipoMarketTemperature = Math.max(0, Math.min(100, newMarket.ipoMarketTemperature + marketDelta.ipoMarketTemperature))

  // 6. Update fund metrics
  let updatedFund = updateFundMetrics(state.fund, yearInFund)
  const totalDeployed = eventedPortfolio.reduce((sum, co) => sum + co.entryEquity, 0)
  updatedFund = {
    ...updatedFund,
    deployedCapital: Math.round(totalDeployed * 100) / 100,
    remainingCapital: Math.round(
      (updatedFund.committedCapital - totalDeployed - updatedFund.managementFeesCollected) * 100
    ) / 100,
    totalDistributions: Math.round((updatedFund.totalDistributions + totalNewDistributions) * 100) / 100,
    reputationScore: Math.max(0, Math.min(100, updatedFund.reputationScore + reputationDelta + consequenceReputationDelta)),
    lpTrustScore: Math.max(0, Math.min(100, updatedFund.lpTrustScore + consequenceLpTrustDelta)),
  }

  // 7. Generate new deals (only during investment period)
  const isInvestmentPeriod = newTotalQuarters < state.investmentPeriodEndQuarter
  const newDeals = isInvestmentPeriod
    ? generateDeals(prng, {
        sector: state.fund.sector,
        fundSize: state.fund.committedCapital,
        reputationScore: updatedFund.reputationScore,
        difficulty: state.difficulty,
        quarter: nextQuarter as 1 | 2 | 3 | 4,
        year: nextYear,
      })
    : []

  // 7b. Process team: skill development and events
  const developedTeam = processSkillDevelopment(state.teamMembers, newTotalQuarters)
  const { events: teamEventsList, updatedMembers: teamAfterEvents } = checkTeamEvents(
    prng, developedTeam, state.difficulty, updatedFund.reputationScore, newTotalQuarters,
  )
  const teamEvents: import('../types/events').GameEvent[] = teamEventsList.map((te) => ({
    id: `evt-team-${te.memberId}-${newTotalQuarters}`,
    category: 'Team' as const,
    title: te.type === 'burnout' ? 'Burnout Warning' : te.type === 'poaching' ? 'Poaching Attempt' : 'Team Update',
    description: te.description,
    quarter: newTotalQuarters,
    year: nextYear,
    impact: {},
    resolved: false,
  }))

  // Combine all events
  const allNewEvents = [...simEvents, ...randomEvents, ...teamEvents, ...blowbackEvents]

  // 8. Check for fund completion and LP report trigger
  const fundComplete = newTotalQuarters >= state.fundEndQuarter
  const isQ4 = nextQuarter === 4 && !fundComplete
  const lpReportDue = isQ4 && eventedPortfolio.length > 0

  // Determine screen
  let nextScreen = state.screen
  if (fundComplete) nextScreen = 'fundComplete'
  else if (lpReportDue) nextScreen = 'lpReport'

  return {
    ...state,
    screen: nextScreen,
    lpReportPending: lpReportDue,
    currentQuarter: nextQuarter as 1 | 2 | 3 | 4,
    currentYear: nextYear,
    currentPhase: fundComplete ? 'EndOfQuarter' : (isInvestmentPeriod ? 'Sourcing' : 'Operations'),
    fund: updatedFund,
    currentDeals: newDeals,
    portfolioCompanies: eventedPortfolio,
    exitedCompanies,
    teamMembers: teamAfterEvents,
    pendingEffects: remainingEffects,
    marketConditions: newMarket,
    exitResults,
    prngCounter: newPrngCounter,
    totalQuartersElapsed: newTotalQuarters,
    eventLog: [...state.eventLog, ...allNewEvents],
    historicalIRRByQuarter: [
      ...state.historicalIRRByQuarter,
      updatedFund.netIRR ?? 0,
    ],
  }
}
