export type CharacterType =
  | 'Seller'
  | 'Banker'
  | 'LP'
  | 'Competitor'
  | 'CEO'
  | 'Consultant'
  | 'Lawyer'
  | 'Journalist'

export type Expression = 'neutral' | 'pleased' | 'angry' | 'nervous' | 'skeptical'

export interface DialogueEntry {
  speaker: 'npc' | 'player'
  text: string
  quarter: number
  year: number
}

export interface NPC {
  id: string
  name: string
  characterType: CharacterType
  portraitSpriteKey: string
  currentExpression: Expression
  personalityTraits: string[]
  relationshipScore: number
  dialogueHistory: DialogueEntry[]
  associatedEntityId: string | null
  status: 'active' | 'departed' | 'hostile' | 'ghosting'
}
