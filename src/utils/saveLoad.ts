import type { GameState } from '../types/game'

const SAVE_KEY_PREFIX = 'pe-simulator-save-'

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
    return JSON.parse(data) as GameState
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
