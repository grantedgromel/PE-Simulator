import type { PortfolioCompany } from '../types/company'
import type { TeamMember } from '../types/team'
import type { FundCycle, Sector } from '../types/game'

export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32
export const MAP_SIZE = 40

export interface MapBuilding {
  companyId: string
  name: string
  gridX: number
  gridY: number
  sector: string
  sectorTyped: Sector | null
  visualTier: 1 | 2 | 3
  buildingVariant: number
  healthState: 'healthy' | 'stressed' | 'distressed' | 'construction' | 'exited' | 'destroyed'
  addOnCount: number
  isHQ: boolean
  assignedOPName?: string
  exitInProgress: boolean
}

export interface MapRoad {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export interface MapState {
  buildings: MapBuilding[]
  roads: MapRoad[]
  hqTier: 1 | 2 | 3
  cameraX: number
  cameraY: number
  zoom: number
}

// === COORDINATE TRANSFORMS ===

export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  }
}

export function screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
    gridY: Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2),
  }
}

// === BUILDING STATE ===

export function getBuildingHealthState(company: PortfolioCompany): MapBuilding['healthState'] {
  if (company.status === 'WrittenOff') return 'destroyed'
  if (company.status === 'Exited') return 'exited'
  if (company.exitInProgress) return 'exited'
  const health = (company.morale + company.customerSatisfaction) / 2
  if (health > 60) return 'healthy'
  if (health > 35) return 'stressed'
  return 'distressed'
}

// === MAP LAYOUT ===

const POSITION_ANGLES = [
  0, Math.PI / 3, 2 * Math.PI / 3, Math.PI,
  4 * Math.PI / 3, 5 * Math.PI / 3,
  Math.PI / 6, Math.PI / 2, 5 * Math.PI / 6,
  7 * Math.PI / 6, 3 * Math.PI / 2, 11 * Math.PI / 6,
]

export function calculateBuildingPosition(index: number, _totalBuildings: number): { gridX: number; gridY: number } {
  const angle = POSITION_ANGLES[index % POSITION_ANGLES.length]
  const ring = Math.floor(index / POSITION_ANGLES.length)
  const distance = 5 + ring * 4 + (index % 3)

  return {
    gridX: Math.round(MAP_SIZE / 2 + Math.cos(angle) * distance),
    gridY: Math.round(MAP_SIZE / 2 + Math.sin(angle) * distance),
  }
}

export function generateRoadPath(
  fromX: number, fromY: number,
  toX: number, toY: number,
): MapRoad {
  return { fromX, fromY, toX, toY }
}

// === MAP STATE GENERATION ===

export function generateMapState(
  portfolioCompanies: PortfolioCompany[],
  teamMembers: TeamMember[],
  fundCycle: FundCycle,
): MapState {
  const hqX = MAP_SIZE / 2
  const hqY = MAP_SIZE / 2

  const buildings: MapBuilding[] = [
    {
      companyId: 'hq',
      name: 'Fund HQ',
      gridX: hqX,
      gridY: hqY,
      sector: 'hq',
      sectorTyped: null,
      visualTier: fundCycle,
      buildingVariant: 0,
      healthState: 'healthy',
      addOnCount: 0,
      isHQ: true,
      exitInProgress: false,
    },
  ]

  const activeCompanies = portfolioCompanies.filter((c) => c.status === 'Active' || c.status === 'Exited')
  const roads: MapRoad[] = []

  activeCompanies.forEach((company, index) => {
    const pos = calculateBuildingPosition(index, activeCompanies.length)
    const assignedOP = teamMembers.find(
      (tm) => tm.role === 'OperatingPartner' && tm.currentAssignments.includes(company.id),
    )

    buildings.push({
      companyId: company.id,
      name: company.name,
      gridX: pos.gridX,
      gridY: pos.gridY,
      sector: company.sector,
      sectorTyped: company.sector,
      visualTier: company.visualTier ?? 1,
      buildingVariant: company.buildingVariant ?? 0,
      healthState: getBuildingHealthState(company),
      addOnCount: company.addOnCount,
      isHQ: false,
      assignedOPName: assignedOP?.name,
      exitInProgress: !!company.exitInProgress,
    })

    roads.push(generateRoadPath(hqX, hqY, pos.gridX, pos.gridY))
  })

  return {
    buildings,
    roads,
    hqTier: fundCycle,
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
  }
}
