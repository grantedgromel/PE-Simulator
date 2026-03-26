import type { Fund, FundRecord, FinalScore } from './fund'
import type { PortfolioCompany } from './company'
import type { Deal } from './deal'
import type { TeamMember } from './team'
import type { GameEvent } from './events'
import type { LPBase } from './lp'
import type { PendingEffect, MarketConditions, ExitResult } from './effects'

export type Sector =
  | 'Healthcare'
  | 'BusinessServices'
  | 'Consumer'
  | 'Technology'
  | 'Industrial'

export type Difficulty = 'Easy' | 'Normal' | 'Hard'

export type GamePhase =
  | 'Sourcing'
  | 'TeamAssignment'
  | 'Diligence'
  | 'Structuring'
  | 'Operations'
  | 'Exits'
  | 'EndOfQuarter'

export type Screen = 'menu' | 'game' | 'fundComplete' | 'fundraising' | 'lpReport' | 'gameOver'

export type FundCycle = 1 | 2 | 3

export interface GameState {
  screen: Screen
  seed: number
  prngCounter: number
  difficulty: Difficulty
  currentFundCycle: FundCycle
  currentYear: number
  currentQuarter: 1 | 2 | 3 | 4
  currentPhase: GamePhase
  fund: Fund
  portfolioCompanies: PortfolioCompany[]
  exitedCompanies: PortfolioCompany[]
  writtenOffCompanies: PortfolioCompany[]
  currentDeals: Deal[]
  teamMembers: TeamMember[]
  lpBase: LPBase
  eventLog: GameEvent[]
  historicalIRRByQuarter: number[]
  pendingEffects: PendingEffect[]
  marketConditions: MarketConditions
  exitResults: ExitResult[]
  fundEndQuarter: number
  investmentPeriodEndQuarter: number
  fundHistory: FundRecord[]
  personalCarryEstimate: number
  totalPersonalCarry: number
  totalQuartersElapsed: number
  lpReportPending: boolean
  finalScore: FinalScore | null
}
