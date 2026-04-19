/**
 * Deterministic portrait / visual-variant seeding.
 *
 * Every visual choice (which portrait, which building variant, which face from
 * portraitGenerator.ts) must be reproducible from stable inputs — a string id
 * or a seeded PRNG. That way:
 *  - Reloads from localStorage render the same faces and buildings.
 *  - Old saves that lack the new visual fields can be migrated by hashing ids.
 *
 * This module contains two pieces:
 *  1. `hashStringSeed(id)`  — stable 32-bit hash (FNV-1a) of an entity id
 *  2. `deriveVisualsFor*`    — per-type helpers that produce the visual fields
 *
 * Keep this deterministic and dependency-free.
 */

import type { PortfolioCompany } from '../types/company'
import type { TeamMember } from '../types/team'
import type { Deal } from '../types/deal'
import { getBuildingVariantCount, deriveVisualTier } from './assetRegistry'

// FNV-1a 32-bit. Good enough for "pick a sprite slot" scale; deterministic;
// zero deps. Output is always an unsigned 32-bit int.
export function hashStringSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    // Use Math.imul to keep 32-bit multiplication safe in JS.
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// === COMPANY ===

export interface CompanyVisuals {
  visualTier: 1 | 2 | 3
  buildingVariant: number
}

export function deriveVisualsForCompany(
  id: string,
  sector: PortfolioCompany['sector'],
  revenue: number,
  employeeCount: number,
): CompanyVisuals {
  const seed = hashStringSeed(id)
  return {
    visualTier: deriveVisualTier(revenue, employeeCount),
    buildingVariant: seed % getBuildingVariantCount(sector),
  }
}

/** Backfill a company that predates the visual fields (old save migration). */
export function withCompanyVisuals<T extends Pick<PortfolioCompany, 'id' | 'sector' | 'revenue' | 'employeeCount'> & Partial<CompanyVisuals>>(
  company: T,
): T & CompanyVisuals {
  if (typeof company.visualTier === 'number' && typeof company.buildingVariant === 'number') {
    return company as T & CompanyVisuals
  }
  const v = deriveVisualsForCompany(company.id, company.sector, company.revenue, company.employeeCount)
  return { ...company, ...v }
}

// === TEAM MEMBER ===

export interface TeamMemberVisuals {
  portraitSeed: number
}

export function deriveVisualsForTeamMember(id: string): TeamMemberVisuals {
  return { portraitSeed: hashStringSeed(id) }
}

export function withTeamMemberVisuals<T extends Pick<TeamMember, 'id'> & Partial<TeamMemberVisuals>>(
  member: T,
): T & TeamMemberVisuals {
  if (typeof member.portraitSeed === 'number') {
    return member as T & TeamMemberVisuals
  }
  return { ...member, portraitSeed: hashStringSeed(member.id) }
}

// === DEAL ===

export interface DealVisuals {
  sellerPortraitSeed: number
  buildingVariant: number
}

export function deriveVisualsForDeal(id: string, sector: Deal['sector']): DealVisuals {
  const seed = hashStringSeed(id)
  return {
    sellerPortraitSeed: seed,
    // Offset so a deal and its eventual portfolio company can diverge if desired.
    buildingVariant: (seed >>> 3) % getBuildingVariantCount(sector),
  }
}

export function withDealVisuals<T extends Pick<Deal, 'id' | 'sector'> & Partial<DealVisuals>>(
  deal: T,
): T & DealVisuals {
  if (typeof deal.sellerPortraitSeed === 'number' && typeof deal.buildingVariant === 'number') {
    return deal as T & DealVisuals
  }
  return { ...deal, ...deriveVisualsForDeal(deal.id, deal.sector) }
}
