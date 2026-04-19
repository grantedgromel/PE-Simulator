import type { GameState, Difficulty } from '../types/game'
import type { GameEvent } from '../types/events'
import type { MarketConditions } from '../types/effects'
import { PRNG } from './prng'
import {
  getLayoffPressQuote,
  getMainStreetBacklashDescription,
} from '../data/sectorConsequenceFlavor'

interface EventTemplate {
  name: string
  category: GameEvent['category']
  difficulty: 'all' | 'normal_hard' | 'hard_only'
  weight: number
  precondition?: (state: GameState) => boolean
  generate: (prng: PRNG, state: GameState, quarter: number) => {
    event: GameEvent
    stateModifications: Partial<{
      marketConditions: Partial<MarketConditions>
      reputationDelta: number
      companyId: string
      companyModifications: Record<string, number>
    }>
  }
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // === ALL DIFFICULTIES ===
  {
    name: 'Rate Increase',
    category: 'Macro',
    difficulty: 'all',
    weight: 8,
    generate: (prng, _state, quarter) => ({
      event: {
        id: `evt-rates-${quarter}`, category: 'Macro', title: 'Interest Rate Hike',
        description: 'The Fed raised rates. New debt pricing increases by 50-100bps across the market.',
        quarter, year: 0, impact: { interestRate: 0.75 }, resolved: true,
      },
      stateModifications: { marketConditions: { interestRateModifier: prng.nextFloat(0.5, 1.0) } },
    }),
  },
  {
    name: 'Market Rally',
    category: 'Macro',
    difficulty: 'all',
    weight: 6,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-rally-${quarter}`, category: 'Macro', title: 'Market Rally',
        description: 'Buoyant market conditions. Exit multiples expand across sectors.',
        quarter, year: 0, impact: { exitMultiple: 0.5 }, resolved: true,
      },
      stateModifications: { marketConditions: { exitMultipleModifier: 0.7 } },
    }),
  },
  {
    name: 'New Regulation',
    category: 'Sector',
    difficulty: 'all',
    weight: 5,
    precondition: (state) => state.portfolioCompanies.length > 0,
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(c => c.status === 'Active'))
      return {
        event: {
          id: `evt-reg-${quarter}`, category: 'Sector', title: `New Regulation: ${co?.name ?? 'Industry'}`,
          description: `New regulatory requirements in ${state.fund.sector}. Compliance costs increase for portfolio companies.`,
          quarter, year: 0, impact: { compliance: 0.03 }, resolved: true,
        },
        stateModifications: co ? { companyId: co.id, companyModifications: { ebitdaHit: 0.03 } } : {},
      }
    },
  },
  {
    name: 'Key Employee Departure',
    category: 'Company',
    difficulty: 'all',
    weight: 7,
    precondition: (state) => state.portfolioCompanies.some(c => c.status === 'Active'),
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(c => c.status === 'Active'))
      return {
        event: {
          id: `evt-keydep-${quarter}`, category: 'Company', title: `Departure: ${co?.name ?? 'Company'}`,
          description: `A senior leader at ${co?.name} departed unexpectedly. Morale dipped.`,
          quarter, year: 0, impact: { morale: -5 }, resolved: true,
        },
        stateModifications: co ? { companyId: co.id, companyModifications: { moraleDelta: -5, productivityDip: 0.02 } } : {},
      }
    },
  },
  {
    name: 'Layoff Press',
    category: 'Satirical',
    difficulty: 'all',
    weight: 4,
    precondition: (state) => state.portfolioCompanies.some(
      (c) => c.consequenceLedger?.layoffs > 0 && c.status === 'Active',
    ),
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(
        (c) => c.consequenceLedger?.layoffs > 0 && c.status === 'Active',
      ))
      const layoffCount = co?.consequenceLedger?.layoffs ?? Math.round((co?.employeeCount ?? 100) * 0.1)
      const quote = co ? getLayoffPressQuote(co, quarter + layoffCount) : '"PE-backed company cuts jobs at beloved local business."'
      return {
        event: {
          id: `evt-press-${quarter}`, category: 'Satirical', title: `Press Coverage: ${co?.name ?? 'Company'}`,
          description: `Local newspaper published article about layoffs at ${co?.name}. ${quote} Estimated positions affected: ${layoffCount}.`,
          quarter, year: 0, impact: { reputation: -2 }, resolved: true,
        },
        stateModifications: co
          ? {
              reputationDelta: -2,
              companyId: co.id,
              companyModifications: { communityTrustDelta: -5, backlashEvent: 1 },
            }
          : { reputationDelta: -2 },
      }
    },
  },
  {
    name: 'Main Street Backlash',
    category: 'Satirical',
    difficulty: 'all',
    weight: 3,
    precondition: (state) => state.portfolioCompanies.some(
      (c) => c.status === 'Active' && (c.communityTrust ?? 60) < 45,
    ),
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(
        (c) => c.status === 'Active' && (c.communityTrust ?? 60) < 45,
      ))
      return {
        event: {
          id: `evt-backlash-${quarter}`,
          category: 'Satirical',
          title: `Town Hall Revolt: ${co?.name ?? 'Portfolio Company'}`,
          description: co
            ? getMainStreetBacklashDescription(co, quarter)
            : 'A portfolio company is taking heat from customers, workers, and local officials. The ownership playbook is now part of the story.',
          quarter,
          year: 0,
          impact: { reputation: -3 },
          resolved: true,
        },
        stateModifications: co
          ? {
              reputationDelta: -3,
              companyId: co.id,
              companyModifications: { communityTrustDelta: -4, backlashEvent: 1, moraleDelta: -3 },
            }
          : { reputationDelta: -3 },
      }
    },
  },
  {
    name: 'LinkedIn Post',
    category: 'Satirical',
    difficulty: 'all',
    weight: 3,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-linkedin-${quarter}`, category: 'Satirical', title: 'LinkedIn Goes Viral',
        description: `A portfolio company CEO posted about "our incredible PE partnership journey" on LinkedIn. It has 47,000 likes and the comments are savage.`,
        quarter, year: 0, impact: {}, resolved: true,
      },
      stateModifications: {},
    }),
  },
  {
    name: 'LP Interest',
    category: 'LP',
    difficulty: 'all',
    weight: 4,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-lp-interest-${quarter}`, category: 'LP', title: 'New LP Interest',
        description: 'A new institutional investor expressed interest in your next fund. Good market presence noted.',
        quarter, year: 0, impact: { reputation: 2 }, resolved: true,
      },
      stateModifications: { reputationDelta: 2 },
    }),
  },
  {
    name: 'Credit Tightening',
    category: 'Macro',
    difficulty: 'all',
    weight: 4,
    generate: (prng, _state, quarter) => ({
      event: {
        id: `evt-credit-${quarter}`, category: 'Macro', title: 'Credit Markets Tighten',
        description: 'Banks pulled back on leveraged lending. Available leverage on new deals reduced.',
        quarter, year: 0, impact: { credit: -15 }, resolved: true,
      },
      stateModifications: { marketConditions: { creditAvailability: -prng.nextFloat(10, 20) } },
    }),
  },

  // === NORMAL + HARD ===
  {
    name: 'Recession',
    category: 'Macro',
    difficulty: 'normal_hard',
    weight: 3,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-recession-${quarter}`, category: 'Macro', title: 'Economic Downturn',
        description: 'Recession hits. Revenue across portfolio declines 5-15%. Exit multiples contract.',
        quarter, year: 0, impact: { revenue: -0.10, multiples: -1.0 }, resolved: true,
      },
      stateModifications: { marketConditions: { exitMultipleModifier: -1.0, creditAvailability: -20 } },
    }),
  },
  {
    name: 'Key Customer Churn',
    category: 'Company',
    difficulty: 'normal_hard',
    weight: 5,
    precondition: (state) => state.portfolioCompanies.some(c => c.status === 'Active'),
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(c => c.status === 'Active'))
      const loss = prng.nextFloat(0.10, 0.20)
      return {
        event: {
          id: `evt-churn-${quarter}`, category: 'Company', title: `Customer Loss: ${co?.name ?? 'Company'}`,
          description: `A key customer of ${co?.name} churned. Revenue at risk: ${(loss * 100).toFixed(0)}%.`,
          quarter, year: 0, impact: { revenue: -loss }, resolved: true,
        },
        stateModifications: co ? { companyId: co.id, companyModifications: { revenueLoss: loss } } : {},
      }
    },
  },
  {
    name: 'Inflation Spike',
    category: 'Macro',
    difficulty: 'normal_hard',
    weight: 4,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-inflation-${quarter}`, category: 'Macro', title: 'Inflation Spike',
        description: 'Input costs rising across portfolio. EBITDA margins compressed 1-3pp.',
        quarter, year: 0, impact: { margins: -0.02 }, resolved: true,
      },
      stateModifications: {},
    }),
  },
  {
    name: 'LP Emergency Meeting',
    category: 'LP',
    difficulty: 'normal_hard',
    weight: 3,
    precondition: (state) => (state.fund.moic ?? 0) < 1.5 && state.totalQuartersElapsed > 8,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-lp-meeting-${quarter}`, category: 'LP', title: 'LP Demands Meeting',
        description: 'Your largest LP requests an emergency call to discuss underperformance. They are "reassessing the relationship."',
        quarter, year: 0, impact: { reputation: -5 }, resolved: true,
      },
      stateModifications: { reputationDelta: -5 },
    }),
  },

  // === HARD ONLY ===
  {
    name: 'Aggressive Rate Hikes',
    category: 'Macro',
    difficulty: 'hard_only',
    weight: 4,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-agghike-${quarter}`, category: 'Macro', title: 'Aggressive Rate Hikes',
        description: 'Fed raises rates aggressively. ALL floating-rate debt reprices across entire portfolio.',
        quarter, year: 0, impact: { interestRate: 2.0 }, resolved: true,
      },
      stateModifications: { marketConditions: { interestRateModifier: 2.0, creditAvailability: -30 } },
    }),
  },
  {
    name: 'Black Swan',
    category: 'Macro',
    difficulty: 'hard_only',
    weight: 2,
    generate: (_prng, _state, quarter) => ({
      event: {
        id: `evt-blackswan-${quarter}`, category: 'Macro', title: 'Black Swan Event',
        description: 'Global shock event. Industry revenue drops 15-30% for the next 2-4 quarters. All bets are off.',
        quarter, year: 0, impact: { revenue: -0.20, multiples: -2.0 }, resolved: true,
      },
      stateModifications: { marketConditions: { exitMultipleModifier: -2.0, creditAvailability: -40, ipoMarketTemperature: -30 } },
    }),
  },
  {
    name: 'Accounting Fraud',
    category: 'Company',
    difficulty: 'hard_only',
    weight: 2,
    precondition: (state) => state.portfolioCompanies.some(c => c.status === 'Active' && c.quartersHeld > 4),
    generate: (prng, state, quarter) => {
      const co = prng.pick(state.portfolioCompanies.filter(c => c.status === 'Active' && c.quartersHeld > 4))
      return {
        event: {
          id: `evt-fraud-${quarter}`, category: 'Company', title: `Fraud Discovered: ${co?.name ?? 'Company'}`,
          description: `Accounting irregularities discovered at ${co?.name}. EBITDA was overstated 20-30%. Immediate restatement required.`,
          quarter, year: 0, impact: { ebitda: -0.25 }, resolved: true,
        },
        stateModifications: co ? { companyId: co.id, companyModifications: { ebitdaRestatement: 0.25, reputationDelta: -5 } } : {},
      }
    },
  },
]

function isEligible(template: EventTemplate, difficulty: Difficulty, state: GameState): boolean {
  if (difficulty === 'Easy' && template.difficulty !== 'all') return false
  if (difficulty === 'Normal' && template.difficulty === 'hard_only') return false
  if (template.precondition && !template.precondition(state)) return false
  return true
}

export function generateQuarterlyEvents(prng: PRNG, state: GameState): {
  events: GameEvent[]
  marketDelta: Partial<MarketConditions>
  reputationDelta: number
  companyEffects: { companyId: string; modifications: Record<string, number> }[]
} {
  const eligible = EVENT_TEMPLATES.filter((t) => isEligible(t, state.difficulty, state))
  if (eligible.length === 0) return { events: [], marketDelta: {}, reputationDelta: 0, companyEffects: [] }

  // Roll event count
  let count: number
  if (state.difficulty === 'Hard') {
    const roll = prng.next()
    count = roll < 0.15 ? 0 : roll < 0.60 ? 1 : roll < 0.95 ? 2 : 3
  } else {
    const roll = prng.next()
    count = roll < 0.30 ? 0 : roll < 0.80 ? 1 : 2
  }

  const events: GameEvent[] = []
  const marketDelta: Partial<MarketConditions> = {}
  let reputationDelta = 0
  const companyEffects: { companyId: string; modifications: Record<string, number> }[] = []

  const used = new Set<string>()
  for (let i = 0; i < count; i++) {
    const pool = eligible.filter((t) => !used.has(t.name))
    if (pool.length === 0) break

    const totalWeight = pool.reduce((sum, t) => sum + t.weight, 0)
    let roll = prng.nextFloat(0, totalWeight)
    let selected = pool[0]
    for (const t of pool) {
      roll -= t.weight
      if (roll <= 0) { selected = t; break }
    }

    used.add(selected.name)
    const result = selected.generate(prng, state, state.totalQuartersElapsed)
    events.push(result.event)

    if (result.stateModifications.marketConditions) {
      Object.assign(marketDelta, result.stateModifications.marketConditions)
    }
    if (result.stateModifications.reputationDelta) {
      reputationDelta += result.stateModifications.reputationDelta
    }
    if (result.stateModifications.companyId && result.stateModifications.companyModifications) {
      companyEffects.push({
        companyId: result.stateModifications.companyId,
        modifications: result.stateModifications.companyModifications,
      })
    }
  }

  return { events, marketDelta, reputationDelta, companyEffects }
}
