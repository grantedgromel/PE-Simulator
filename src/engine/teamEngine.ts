import type { TeamMember, TeamRole, SectorExpertise } from '../types/team'
import type { Sector, Difficulty } from '../types/game'
import type { PortfolioCompany } from '../types/company'
import { PRNG } from './prng'
import { hashStringSeed } from './portraitAssigner'

// === NAME GENERATION ===

const FIRST_NAMES = [
  'Sarah', 'James', 'Maria', 'David', 'Jennifer', 'Michael', 'Priya', 'Robert',
  'Wei', 'Daniel', 'Ana', 'Christopher', 'Keiko', 'Thomas', 'Fatima', 'Andrew',
  'Elena', 'Marcus', 'Yuki', 'Jonathan', 'Sonia', 'Patrick', 'Min', 'Charles',
  'Adaeze', 'William', 'Camila', 'Brian', 'Nadia', 'Richard', 'Aisha', 'Kevin',
]

const LAST_NAMES = [
  'Chen', 'Park', 'Williams', 'Martinez', 'Singh', 'O\'Brien', 'Nakamura', 'Thompson',
  'Rodriguez', 'Kim', 'Anderson', 'Patel', 'Novak', 'Campbell', 'Okafor', 'Foster',
  'Ramirez', 'Bergström', 'Hayes', 'Ishikawa', 'Kowalski', 'Davis', 'Al-Rashid', 'Turner',
  'Fernandez', 'Johansson', 'Richardson', 'Tanaka', 'Morrison', 'Gupta', 'Sullivan', 'Zhao',
]

const PE_FIRMS = ['Blackstone', 'KKR', 'Carlyle', 'Apollo', 'TPG', 'Bain Capital', 'Warburg Pincus', 'Thoma Bravo', 'Advent', 'Hellman & Friedman']

function generateTeamName(prng: PRNG): string {
  return `${prng.pick(FIRST_NAMES)} ${prng.pick(LAST_NAMES)}`
}

// === TEAM GENERATION ===

function generateSkillRange(prng: PRNG, min: number, max: number): number {
  return Math.round(prng.nextFloat(min, max) * 10) / 10
}

function generateSectorExpertise(prng: PRNG, primarySector: Sector, primaryRange: [number, number], otherRange: [number, number]): SectorExpertise {
  const sectors: Sector[] = ['Healthcare', 'BusinessServices', 'Consumer', 'Technology', 'Industrial']
  const expertise: Partial<SectorExpertise> = {}
  for (const s of sectors) {
    expertise[s] = s === primarySector
      ? generateSkillRange(prng, primaryRange[0], primaryRange[1])
      : generateSkillRange(prng, otherRange[0], otherRange[1])
  }
  return expertise as SectorExpertise
}

export function generateStartingTeam(prng: PRNG, sector: Sector): TeamMember[] {
  const principalId = `tm-principal-${prng.nextInt(1000, 9999)}`
  const principal: TeamMember = {
    id: principalId,
    name: generateTeamName(prng),
    role: 'Principal',
    skills: {
      dealSourcing: generateSkillRange(prng, 5, 7),
      diligence: generateSkillRange(prng, 5, 7),
      operationalExecution: generateSkillRange(prng, 4, 6),
      lpRelations: generateSkillRange(prng, 4, 6),
      sectorExpertise: generateSectorExpertise(prng, sector, [6, 8], [2, 4]),
    },
    currentAssignments: [],
    capacity: 2,
    experienceLog: [],
    tenureQuarters: 0,
    morale: 75,
    carryAllocationPct: prng.nextFloat(8, 12),
    status: 'Active',
    hireSource: 'InternalPromotion',
    salaryCostPerQuarter: prng.nextFloat(0.3, 0.5),
    consecutiveMaxCapacityQuarters: 0,
    portraitSeed: hashStringSeed(principalId),
  }

  const opId = `tm-op-${prng.nextInt(1000, 9999)}`
  const op: TeamMember = {
    id: opId,
    name: generateTeamName(prng),
    role: 'OperatingPartner',
    skills: {
      dealSourcing: generateSkillRange(prng, 2, 4),
      diligence: generateSkillRange(prng, 3, 5),
      operationalExecution: generateSkillRange(prng, 5, 7),
      lpRelations: generateSkillRange(prng, 3, 5),
      sectorExpertise: generateSectorExpertise(prng, sector, [5, 7], [2, 4]),
    },
    currentAssignments: [],
    capacity: 2,
    experienceLog: [],
    tenureQuarters: 0,
    morale: 75,
    carryAllocationPct: prng.nextFloat(5, 8),
    status: 'Active',
    hireSource: 'ExternalHire',
    salaryCostPerQuarter: prng.nextFloat(0.25, 0.4),
    consecutiveMaxCapacityQuarters: 0,
    portraitSeed: hashStringSeed(opId),
  }

  const vpId = `tm-vp-${prng.nextInt(1000, 9999)}`
  const vp: TeamMember = {
    id: vpId,
    name: generateTeamName(prng),
    role: 'VP',
    skills: {
      dealSourcing: generateSkillRange(prng, 3, 5),
      diligence: generateSkillRange(prng, 3, 5),
      operationalExecution: generateSkillRange(prng, 3, 5),
      lpRelations: generateSkillRange(prng, 2, 4),
      sectorExpertise: generateSectorExpertise(prng, sector, [3, 5], [1, 3]),
    },
    currentAssignments: [],
    capacity: 2,
    experienceLog: [],
    tenureQuarters: 0,
    morale: 75,
    carryAllocationPct: prng.nextFloat(2, 4),
    status: 'Active',
    hireSource: 'ExternalHire',
    salaryCostPerQuarter: prng.nextFloat(0.1, 0.2),
    consecutiveMaxCapacityQuarters: 0,
    portraitSeed: hashStringSeed(vpId),
  }

  const assocId = `tm-assoc-${prng.nextInt(1000, 9999)}`
  const associate: TeamMember = {
    id: assocId,
    name: generateTeamName(prng),
    role: 'Associate',
    skills: {
      dealSourcing: generateSkillRange(prng, 1, 3),
      diligence: generateSkillRange(prng, 1, 3),
      operationalExecution: generateSkillRange(prng, 1, 3),
      lpRelations: generateSkillRange(prng, 1, 2),
      sectorExpertise: generateSectorExpertise(prng, sector, [2, 4], [1, 2]),
    },
    currentAssignments: [],
    capacity: 3,
    experienceLog: [],
    tenureQuarters: 0,
    morale: 75,
    carryAllocationPct: prng.nextFloat(0, 1),
    status: 'Active',
    hireSource: 'ExternalHire',
    salaryCostPerQuarter: prng.nextFloat(0.05, 0.1),
    consecutiveMaxCapacityQuarters: 0,
    portraitSeed: hashStringSeed(assocId),
  }

  return [principal, op, vp, associate]
}

// === SKILL MODIFIERS ===

export interface ActionModifier {
  effectivenessMultiplier: number
  sideEffectMultiplier: number
  description: string
}

export function getActionModifier(
  company: PortfolioCompany,
  teamMembers: TeamMember[],
): ActionModifier {
  const assignedOP = teamMembers.find(
    (tm) => tm.role === 'OperatingPartner' && tm.currentAssignments.includes(company.id)
  )
  const assignedSupport = teamMembers.find(
    (tm) => (tm.role === 'VP' || tm.role === 'Associate') && tm.currentAssignments.includes(company.id)
  )

  if (!assignedOP) {
    return {
      effectivenessMultiplier: 0.7,
      sideEffectMultiplier: 1.3,
      description: 'No OP assigned',
    }
  }

  const opExec = assignedOP.skills.operationalExecution
  const sectorMatch = assignedOP.skills.sectorExpertise[company.sector]

  let effectMult = (1.0 + (opExec - 5) * 0.08) * (1.0 + (sectorMatch - 5) * 0.06)
  let sideEffectMult = 1.0 - (opExec - 5) * 0.05

  if (assignedSupport) {
    const bonus = assignedSupport.role === 'VP' ? 0.08 : 0.04
    effectMult += bonus
    sideEffectMult -= bonus / 2
  }

  const sectorLabel = sectorMatch >= 6 ? 'Sector Match' : sectorMatch <= 3 ? 'Sector Mismatch' : ''

  return {
    effectivenessMultiplier: Math.round(effectMult * 100) / 100,
    sideEffectMultiplier: Math.max(0.5, Math.round(sideEffectMult * 100) / 100),
    description: `${assignedOP.name} [Ops: ${opExec}, ${company.sector}: ${sectorMatch}]${sectorLabel ? ` — ${sectorLabel}` : ''}`,
  }
}

export function getDealSourcingModifier(teamMembers: TeamMember[]): {
  dealCountBonus: number
  proprietaryChance: number
} {
  const principals = teamMembers.filter((tm) => tm.role === 'Principal' && tm.status === 'Active')
  const bestSourcing = principals.length > 0
    ? Math.max(...principals.map((p) => p.skills.dealSourcing))
    : 3

  return {
    dealCountBonus: bestSourcing >= 7 ? 1 : bestSourcing <= 3 ? -1 : 0,
    proprietaryChance: bestSourcing >= 9 ? 0.15 + (bestSourcing - 8) * 0.05 : 0,
  }
}

export function getDiligenceModifier(
  dealId: string,
  teamMembers: TeamMember[],
  difficulty: Difficulty,
): {
  accuracyBonus: number
  additionalReveal: boolean
  unreliableInfo: boolean
  effectiveLevelBonus: number
} {
  const assignedPrincipal = teamMembers.find(
    (tm) => tm.role === 'Principal' && tm.currentAssignments.includes(dealId)
  )
  const assignedSupport = teamMembers.find(
    (tm) => (tm.role === 'VP' || tm.role === 'Associate') && tm.currentAssignments.includes(dealId)
  )

  const diligenceSkill = assignedPrincipal?.skills.diligence ?? 3
  const accuracyBonus = (diligenceSkill - 5) * 0.04
  const additionalReveal = diligenceSkill >= 8
  const unreliableInfo = diligenceSkill <= 4 && difficulty !== 'Easy'

  let effectiveLevelBonus = 0
  if (assignedSupport) {
    effectiveLevelBonus = assignedSupport.role === 'VP' ? 1 : 0.5
  }

  return { accuracyBonus, additionalReveal, unreliableInfo, effectiveLevelBonus }
}

export function getBidRangeModifier(dealId: string, teamMembers: TeamMember[]): number {
  const assignedPrincipal = teamMembers.find(
    (tm) => tm.role === 'Principal' && tm.currentAssignments.includes(dealId)
  )
  const diligenceSkill = assignedPrincipal?.skills.diligence ?? 3
  return 1.0 - (diligenceSkill - 5) * 0.08
}

// === SKILL DEVELOPMENT ===

export function processSkillDevelopment(
  teamMembers: TeamMember[],
  _totalQuartersElapsed: number,
): TeamMember[] {
  return teamMembers.map((tm) => {
    const skills = { ...tm.skills, sectorExpertise: { ...tm.skills.sectorExpertise } }
    const isAssigned = tm.currentAssignments.length > 0

    // Decay if idle for 2+ quarters
    if (!isAssigned) {
      if (tm.consecutiveMaxCapacityQuarters <= -2) {
        skills.dealSourcing = Math.max(1, skills.dealSourcing - 0.1)
        skills.diligence = Math.max(1, skills.diligence - 0.1)
        skills.operationalExecution = Math.max(1, skills.operationalExecution - 0.1)
      }
    }

    return {
      ...tm,
      skills,
      tenureQuarters: tm.tenureQuarters + 1,
    }
  })
}

// === TEAM EVENTS ===

export interface TeamEvent {
  type: 'burnout' | 'poaching' | 'promotion_request' | 'carry_request'
  memberId: string
  memberName: string
  description: string
}

export function checkTeamEvents(
  prng: PRNG,
  teamMembers: TeamMember[],
  difficulty: Difficulty,
  _fundReputation: number,
  _totalQuartersElapsed: number,
): { events: TeamEvent[]; updatedMembers: TeamMember[] } {
  const events: TeamEvent[] = []
  let members = [...teamMembers]

  for (let i = 0; i < members.length; i++) {
    const tm = members[i]
    if (tm.status !== 'Active') continue

    // Burnout check
    if (tm.currentAssignments.length >= tm.capacity) {
      const newConsec = tm.consecutiveMaxCapacityQuarters + 1
      members[i] = { ...tm, consecutiveMaxCapacityQuarters: newConsec }
      if (newConsec >= 3 && prng.chance(0.20)) {
        events.push({
          type: 'burnout',
          memberId: tm.id,
          memberName: tm.name,
          description: `${tm.name} is showing signs of burnout after ${newConsec} quarters at max capacity.`,
        })
      }
    } else {
      members[i] = { ...tm, consecutiveMaxCapacityQuarters: 0 }
    }

    // Poaching check (based on difficulty)
    const poachChance = difficulty === 'Easy' ? 0 : difficulty === 'Normal' ? 0.02 : 0.04
    if (prng.chance(poachChance) && tm.role === 'Principal') {
      events.push({
        type: 'poaching',
        memberId: tm.id,
        memberName: tm.name,
        description: `${tm.name} received an offer from ${prng.pick(PE_FIRMS)}. They want to discuss.`,
      })
    }

    // Promotion expectations
    if (tm.role === 'Associate' && tm.tenureQuarters >= 12) {
      const dealReps = tm.experienceLog.filter((e) => e.type === 'deal_closed').length
      if (dealReps >= 3) {
        events.push({
          type: 'promotion_request',
          memberId: tm.id,
          memberName: tm.name,
          description: `${tm.name} (Associate, ${tm.tenureQuarters}Q tenure, ${dealReps} deals) expects a VP promotion.`,
        })
      }
    }
    if (tm.role === 'VP' && tm.tenureQuarters >= 20) {
      const exitReps = tm.experienceLog.filter((e) => e.type === 'exit_completed').length
      if (exitReps >= 2) {
        events.push({
          type: 'promotion_request',
          memberId: tm.id,
          memberName: tm.name,
          description: `${tm.name} (VP, ${tm.tenureQuarters}Q tenure, ${exitReps} exits) expects a Principal promotion.`,
        })
      }
    }
  }

  return { events, updatedMembers: members }
}

// === HIRING ===

export function generateHireCandidates(
  prng: PRNG,
  role: TeamRole,
  sector: Sector,
  fundMoic: number | null,
): TeamMember[] {
  const count = prng.nextInt(2, 4)
  const candidates: TeamMember[] = []
  const qualityBonus = (fundMoic ?? 1.0) > 2.0 ? 1 : 0

  for (let i = 0; i < count; i++) {
    const baseMin = role === 'Principal' ? 4 : role === 'OperatingPartner' ? 4 : role === 'VP' ? 3 : 1
    const baseMax = baseMin + 3 + qualityBonus

    const hireId = `tm-hire-${prng.nextInt(10000, 99999)}`
    const tm: TeamMember = {
      id: hireId,
      name: generateTeamName(prng),
      role,
      skills: {
        dealSourcing: generateSkillRange(prng, baseMin, baseMax),
        diligence: generateSkillRange(prng, baseMin, baseMax),
        operationalExecution: generateSkillRange(prng, baseMin, baseMax),
        lpRelations: generateSkillRange(prng, baseMin - 1, baseMax - 1),
        sectorExpertise: generateSectorExpertise(prng, sector, [baseMin, baseMax], [1, 3]),
      },
      currentAssignments: [],
      capacity: role === 'Associate' ? 3 : 2,
      experienceLog: [],
      tenureQuarters: 0,
      morale: 70,
      carryAllocationPct: role === 'Principal' ? prng.nextFloat(6, 10) : role === 'OperatingPartner' ? prng.nextFloat(4, 7) : prng.nextFloat(1, 3),
      status: 'Active',
      hireSource: 'ExternalHire',
      salaryCostPerQuarter: role === 'Principal' ? prng.nextFloat(0.4, 0.6) : role === 'OperatingPartner' ? prng.nextFloat(0.3, 0.5) : role === 'VP' ? prng.nextFloat(0.15, 0.25) : prng.nextFloat(0.08, 0.12),
      consecutiveMaxCapacityQuarters: 0,
      portraitSeed: hashStringSeed(hireId),
    }
    candidates.push(tm)
  }

  return candidates
}

export function promoteTeamMember(member: TeamMember): TeamMember {
  const newRole: TeamRole = member.role === 'Associate' ? 'VP' : member.role === 'VP' ? 'Principal' : member.role
  return {
    ...member,
    role: newRole,
    skills: {
      dealSourcing: Math.min(10, member.skills.dealSourcing + 1),
      diligence: Math.min(10, member.skills.diligence + 1),
      operationalExecution: Math.min(10, member.skills.operationalExecution + 1),
      lpRelations: Math.min(10, member.skills.lpRelations + 1),
      sectorExpertise: member.skills.sectorExpertise,
    },
    capacity: 2, // promoted roles always have capacity 2
    morale: 80,
    salaryCostPerQuarter: member.salaryCostPerQuarter * 2,
    hireSource: 'InternalPromotion',
  }
}
