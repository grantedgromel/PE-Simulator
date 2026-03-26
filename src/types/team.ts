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
  type: 'deal' | 'portfolio' | 'exit'
  entityId: string
  entityName: string
  outcome: 'success' | 'neutral' | 'failure'
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
