import type { Sector } from '../types/game'
import type { Deal, DealSource } from '../types/deal'
import { PRNG } from './prng'
import { generateCompanyName, getRandomSubSector, getRandomDescription } from './nameGenerators'

interface DealGenParams {
  sector: Sector
  fundSize: number
  reputationScore: number
  difficulty: 'Easy' | 'Normal' | 'Hard'
  quarter: number
  year: number
}

// Sector-specific financial characteristics
const SECTOR_PROFILES: Record<Sector, {
  revenueRange: [number, number]
  marginRange: [number, number]
  growthRange: [number, number]
  multipleRange: [number, number]
  employeePerMRevenue: [number, number]
}> = {
  Healthcare: {
    revenueRange: [8, 80],
    marginRange: [0.15, 0.28],
    growthRange: [0.03, 0.12],
    multipleRange: [8, 14],
    employeePerMRevenue: [3, 6],
  },
  BusinessServices: {
    revenueRange: [10, 90],
    marginRange: [0.10, 0.22],
    growthRange: [0.02, 0.08],
    multipleRange: [6, 11],
    employeePerMRevenue: [4, 8],
  },
  Consumer: {
    revenueRange: [5, 60],
    marginRange: [0.08, 0.20],
    growthRange: [0.04, 0.15],
    multipleRange: [6, 12],
    employeePerMRevenue: [5, 10],
  },
  Technology: {
    revenueRange: [5, 50],
    marginRange: [0.20, 0.40],
    growthRange: [0.08, 0.25],
    multipleRange: [10, 18],
    employeePerMRevenue: [2, 4],
  },
  Industrial: {
    revenueRange: [15, 120],
    marginRange: [0.10, 0.20],
    growthRange: [0.01, 0.07],
    multipleRange: [6, 10],
    employeePerMRevenue: [3, 7],
  },
}

function determineDealSource(prng: PRNG, reputationScore: number, difficulty: string): DealSource {
  const proprietaryChance = Math.max(0, (reputationScore - 40) / 200)
  const limitedChance = Math.max(0.1, reputationScore / 300)

  if (prng.chance(proprietaryChance) && difficulty !== 'Hard') {
    return 'Proprietary'
  }
  if (prng.chance(limitedChance)) {
    return 'LimitedProcess'
  }
  return 'Auction'
}

function determineCompetingBids(prng: PRNG, source: DealSource, difficulty: string): number {
  if (source === 'Proprietary') return 0
  if (source === 'LimitedProcess') return prng.nextInt(1, 2)

  switch (difficulty) {
    case 'Easy': return prng.nextInt(2, 3)
    case 'Normal': return prng.nextInt(3, 5)
    case 'Hard': return prng.nextInt(5, 8)
    default: return prng.nextInt(3, 5)
  }
}

function generateSingleDeal(prng: PRNG, params: DealGenParams): Deal {
  const profile = SECTOR_PROFILES[params.sector]
  const name = generateCompanyName(prng, params.sector)
  const subSector = getRandomSubSector(prng, params.sector)
  const description = getRandomDescription(prng, params.sector)

  // Generate actual financials
  const actualRevenue = prng.nextFloat(profile.revenueRange[0], profile.revenueRange[1])
  const actualEbitdaMargin = prng.nextFloat(profile.marginRange[0], profile.marginRange[1])
  const actualEbitda = actualRevenue * actualEbitdaMargin
  const growthRate = prng.nextFloat(profile.growthRange[0], profile.growthRange[1])
  const baseMultiple = prng.nextFloat(profile.multipleRange[0], profile.multipleRange[1])
  const employeePer = prng.nextFloat(profile.employeePerMRevenue[0], profile.employeePerMRevenue[1])
  const employeeCount = Math.round(actualRevenue * employeePer)

  // Deal quality (1-10)
  const dealQuality = prng.nextInt(3, 9)

  // Customer concentration risk
  const customerConcentration = prng.nextFloat(0.05, 0.50)

  // Management quality
  const managementQuality = prng.nextInt(3, 9)

  // Hidden risks
  const possibleRisks = [
    'Key employee flight risk',
    'Pending regulatory change',
    'Customer concentration above 30%',
    'Deferred maintenance / capex backlog',
    'Underfunded pension obligations',
    'Aggressive revenue recognition',
    'Expiring lease on primary facility',
    'Founder dependency',
    'Pending litigation',
    'Technology platform needs modernization',
  ]
  const riskCount = prng.nextInt(0, 3)
  const hiddenRisks: string[] = []
  const riskPool = [...possibleRisks]
  for (let i = 0; i < riskCount; i++) {
    if (riskPool.length === 0) break
    const idx = prng.nextInt(0, riskPool.length - 1)
    hiddenRisks.push(riskPool.splice(idx, 1)[0])
  }

  // Additional hidden stats for deeper diligence
  const revenueQuality = prng.nextInt(30, 95)
  const competitivePosition = prng.nextInt(20, 90)
  const regulatoryRisk = prng.nextInt(5, 60)
  const hiddenLiabilities = prng.chance(0.3) ? prng.nextFloat(0.5, 5.0) : 0

  // Determine deal source and competition
  const source = determineDealSource(prng, params.reputationScore, params.difficulty)
  const competingBidCount = determineCompetingBids(prng, source, params.difficulty)

  // Competing bid range (as multiples)
  const bidFloor = baseMultiple * prng.nextFloat(0.85, 0.95)
  const bidCeiling = baseMultiple * prng.nextFloat(1.0, 1.2)

  // What's visible at sourcing (diligence level 0)
  // Revenue is visible, EBITDA is approximate, employee count is estimated
  const visibleRevenue = Math.round(actualRevenue * prng.nextFloat(0.95, 1.05)) // slightly imprecise
  const visibleEbitda = null // hidden until diligence
  const visibleEmployees = Math.round(employeeCount / 10) * 10 // rounded to nearest 10

  const ev = actualEbitda * baseMultiple

  return {
    id: `deal-${Date.now()}-${prng.nextInt(1000, 9999)}`,
    name,
    sector: params.sector,
    subSector,
    description,
    status: 'Available',
    source,
    revenue: visibleRevenue,
    ebitda: visibleEbitda,
    askingMultiple: Math.round(baseMultiple * 10) / 10,
    employeeCount: visibleEmployees,
    actualRevenue: Math.round(actualRevenue * 100) / 100,
    actualEbitda: Math.round(actualEbitda * 100) / 100,
    actualEbitdaMargin: Math.round(actualEbitdaMargin * 1000) / 1000,
    revenueGrowthRate: Math.round(growthRate * 1000) / 1000,
    customerConcentration: Math.round(customerConcentration * 100) / 100,
    managementQuality,
    hiddenRisks,
    dealQuality,
    competingBidRange: [Math.round(bidFloor * 10) / 10, Math.round(bidCeiling * 10) / 10],
    competingBidCount,
    playerBid: null,
    diligenceLevelCompleted: 0,
    revenueQuality,
    competitivePosition,
    regulatoryRisk,
    hiddenLiabilities: Math.round(hiddenLiabilities * 100) / 100,
    diligenceCost: 0,
    enterpriseValue: Math.round(ev * 100) / 100,
    assignedPrincipalId: undefined,
  }
}

export function generateDeals(prng: PRNG, params: DealGenParams): Deal[] {
  const count = prng.nextInt(2, 4)
  const deals: Deal[] = []
  for (let i = 0; i < count; i++) {
    deals.push(generateSingleDeal(prng, params))
  }
  return deals
}
