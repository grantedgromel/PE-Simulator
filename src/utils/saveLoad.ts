import type { GameState } from '../types/game'
import {
  withCompanyVisuals,
  withTeamMemberVisuals,
  withDealVisuals,
} from '../engine/portraitAssigner'

const SAVE_KEY_PREFIX = 'pe-simulator-save-'

/**
 * Backfill fields added after initial release so old saves still load cleanly.
 * Keep this list small and deterministic; never invent gameplay values here.
 */
function migrateLoadedState(state: GameState): GameState {
  return {
    ...state,
    portfolioCompanies: state.portfolioCompanies.map(withCompanyVisuals),
    exitedCompanies: state.exitedCompanies.map(withCompanyVisuals),
    writtenOffCompanies: state.writtenOffCompanies.map(withCompanyVisuals),
    teamMembers: state.teamMembers.map(withTeamMemberVisuals),
    currentDeals: state.currentDeals.map(withDealVisuals),
  }
}

export interface SaveMetadata {
  slot: number
  fundName: string
  fundCycle: number
  year: number
  quarter: number
  timestamp: number
}

export function saveToSlot(slot: number, state: GameState): void {
  try {
    const data = JSON.stringify(state)
    localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, data)

    // Save metadata separately for quick listing
    const meta: SaveMetadata = {
      slot,
      fundName: state.fund.name,
      fundCycle: state.currentFundCycle,
      year: state.currentYear,
      quarter: state.currentQuarter,
      timestamp: Date.now(),
    }
    localStorage.setItem(`${SAVE_KEY_PREFIX}meta-${slot}`, JSON.stringify(meta))
  } catch {
    console.error('Failed to save game')
  }
}

export function loadFromSlot(slot: number): GameState | null {
  try {
    const data = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (!data) return null
    return migrateLoadedState(JSON.parse(data) as GameState)
  } catch {
    console.error('Failed to load game')
    return null
  }
}

export function listSaves(): (SaveMetadata | null)[] {
  const saves: (SaveMetadata | null)[] = []
  for (let i = 0; i < 3; i++) {
    try {
      const meta = localStorage.getItem(`${SAVE_KEY_PREFIX}meta-${i}`)
      saves.push(meta ? (JSON.parse(meta) as SaveMetadata) : null)
    } catch {
      saves.push(null)
    }
  }
  return saves
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`)
  localStorage.removeItem(`${SAVE_KEY_PREFIX}meta-${slot}`)
}
