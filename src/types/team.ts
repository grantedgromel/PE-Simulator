export type TeamRole = 'Principal' | 'OperatingPartner' | 'VP' | 'Associate' | 'PlacementAgent'
export type TeamMemberStatus = 'Active' | 'BurnedOut' | 'Departing' | 'Poached'
export type HireSource = 'InternalPromotion' | 'ExternalHire'

export interface SectorExpertise {
  Healthcare: number
  BusinessServices: number
  Consumer: number
  Technology: number
  Industrial: number
}

export interface Skills {
  dealSourcing: number
  diligence: number
  operationalExecution: number
  lpRelations: number
  sectorExpertise: SectorExpertise
}

export interface ExperienceEntry {
  type: 'deal_closed' | 'deal_lost' | 'exit_completed' | 'portfolio_quarter' | 'add_on_closed'
  entityId: string
  entityName: string
  outcome: 'success' | 'neutral' | 'failure'
  sector: string
  quarter: number
  year: number
}

export interface TeamMember {
  id: string
  name: string
  role: TeamRole
  skills: Skills
  currentAssignments: string[]
  capacity: number
  experienceLog: ExperienceEntry[]
  tenureQuarters: number
  morale: number
  carryAllocationPct: number
  status: TeamMemberStatus
  hireSource: HireSource
  salaryCostPerQuarter: number
  consecutiveMaxCapacityQuarters: number
}
