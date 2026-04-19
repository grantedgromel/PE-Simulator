/**
 * Central registry mapping domain entities to asset paths under /public/assets/.
 *
 * The registry returns candidate paths — the renderer decides what to do if an
 * asset is missing. A graceful fallback is part of the contract: the game must
 * remain playable with zero assets dropped in.
 *
 * All lookups are deterministic given (entity id / seed, entity state), so the
 * same entity always renders the same way across reloads.
 */

import type { Sector } from '../types/game'
import type { TeamRole } from '../types/team'
import type { CharacterType, Expression } from '../types/npc'
import type { ValueCreationAction } from '../types/company'

const BASE = '/assets'

export type HealthState = 'healthy' | 'stressed' | 'distressed' | 'construction' | 'exited' | 'destroyed'

// Number of variants we'll cycle through once assets are dropped in per sector.
// Renderer falls back gracefully if the variant file is missing.
const VARIANTS_PER_SECTOR: Record<Sector, number> = {
  Healthcare: 4,
  BusinessServices: 4,
  Consumer: 4,
  Technology: 4,
  Industrial: 4,
}

const SECTOR_SLUG: Record<Sector, string> = {
  Healthcare: 'healthcare',
  BusinessServices: 'businessservices',
  Consumer: 'consumer',
  Technology: 'technology',
  Industrial: 'industrial',
}

// Palette per sector — used by the procedural fallback renderer so sector
// identity still reads even before real art is dropped in.
export const SECTOR_PALETTE: Record<Sector, { primary: number; accent: number; roof: number }> = {
  Healthcare:       { primary: 0x6fd3ff, accent: 0xffffff, roof: 0x3aa2cc },
  BusinessServices: { primary: 0x9aa3b2, accent: 0xcdd4e0, roof: 0x6a7080 },
  Consumer:         { primary: 0xffb36b, accent: 0xffd9a8, roof: 0xcc7a3a },
  Technology:       { primary: 0x8c7cff, accent: 0xc3bbff, roof: 0x5a4acf },
  Industrial:       { primary: 0xb08a5a, accent: 0xd4b488, roof: 0x7a5a33 },
}

// === BUILDINGS ===

export function getBuildingVariantCount(sector: Sector): number {
  return VARIANTS_PER_SECTOR[sector]
}

/**
 * Resolve a building sprite path for a portfolio company.
 * Returns a path even if the file does not exist; the loader must handle 404.
 */
export function getBuildingSpritePath(
  sector: Sector,
  variant: number,
  tier: 1 | 2 | 3,
  healthState: HealthState,
): string {
  const slug = SECTOR_SLUG[sector]
  const v = ((variant % VARIANTS_PER_SECTOR[sector]) + VARIANTS_PER_SECTOR[sector]) % VARIANTS_PER_SECTOR[sector]
  // Convention: <slug>_<variant>_t<tier>_<health>.png with fallbacks handled downstream.
  return `${BASE}/buildings/${slug}/${slug}_${v}_t${tier}_${healthState}.png`
}

/** Lower-fidelity fallback path tried before giving up entirely. */
export function getBuildingSpriteFallbackPath(sector: Sector, variant: number): string {
  const slug = SECTOR_SLUG[sector]
  const v = ((variant % VARIANTS_PER_SECTOR[sector]) + VARIANTS_PER_SECTOR[sector]) % VARIANTS_PER_SECTOR[sector]
  return `${BASE}/buildings/${slug}/${slug}_${v}.png`
}

export function getHQSpritePath(tier: 1 | 2 | 3): string {
  return `${BASE}/buildings/hq/hq_t${tier}.png`
}

// === PORTRAITS ===

function roleSlug(role: TeamRole): string {
  return role.toLowerCase()
}

function characterTypeSlug(ct: CharacterType): string {
  return ct.toLowerCase()
}

export function getTeamMemberPortraitPath(role: TeamRole, seed: number): string {
  const slug = roleSlug(role)
  // Seed mapped to a slot 0..15. Renderer picks the nearest existing slot.
  const slot = ((seed % 16) + 16) % 16
  return `${BASE}/portraits/${slug}/${slug}_${slot}.png`
}

export function getNPCPortraitPath(
  characterType: CharacterType,
  seed: number,
  expression: Expression = 'neutral',
): string {
  const slug = characterTypeSlug(characterType)
  const slot = ((seed % 16) + 16) % 16
  return `${BASE}/portraits/${slug}/${slug}_${slot}_${expression}.png`
}

export function getNPCPortraitFallbackPath(
  characterType: CharacterType,
  seed: number,
): string {
  const slug = characterTypeSlug(characterType)
  const slot = ((seed % 16) + 16) % 16
  return `${BASE}/portraits/${slug}/${slug}_${slot}.png`
}

// === ICONS ===

export function getSectorIconPath(sector: Sector): string {
  return `${BASE}/icons/sector/${SECTOR_SLUG[sector]}.svg`
}

const ACTION_SLUG: Record<ValueCreationAction, string> = {
  CostCutting: 'cost-cut',
  AddOnAcquisition: 'add-on',
  RevenueEnhancement: 'revenue',
  DividendRecap: 'dividend-recap',
  ManagementUpgrade: 'management',
  ConsultantEngagement: 'consultant',
  OrganicInvestment: 'invest',
  DoNothing: 'hold',
}

export function getActionIconPath(action: ValueCreationAction): string {
  return `${BASE}/icons/action/${ACTION_SLUG[action]}.svg`
}

const STATUS_SLUG: Record<HealthState, string> = {
  healthy: 'healthy',
  stressed: 'stressed',
  distressed: 'distressed',
  construction: 'construction',
  exited: 'exited',
  destroyed: 'destroyed',
}

export function getStatusIconPath(healthState: HealthState): string {
  return `${BASE}/icons/status/${STATUS_SLUG[healthState]}.svg`
}

export function getMetricIconPath(metricKey: string): string {
  // Keys: cash, deployed, moic, dpi, tvpi, irr, carry, reputation, lp-trust, ...
  return `${BASE}/icons/metric/${metricKey}.svg`
}

// === VISUAL TIER DERIVATION ===

/**
 * Derive a 1|2|3 visual tier from company fundamentals. Bigger / healthier
 * companies render as bigger buildings on the map.
 */
export function deriveVisualTier(revenue: number, employeeCount: number): 1 | 2 | 3 {
  if (revenue >= 60 || employeeCount >= 400) return 3
  if (revenue >= 25 || employeeCount >= 150) return 2
  return 1
}
