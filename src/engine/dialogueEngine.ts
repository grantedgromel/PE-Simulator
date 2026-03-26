import type { GameState } from '../types/game'

export interface DialogueNode {
  id: string
  speakerId: string
  text: string | ((state: GameState, context: Record<string, unknown>) => string)
  expression: string
  responses?: DialogueResponse[]
  autoAdvance?: boolean
  nextNodeId?: string
}

export interface DialogueResponse {
  text: string
  nextNodeId: string | null
  condition?: (state: GameState) => boolean
  effects?: (state: GameState) => Partial<GameState>
  consequenceHint?: 'cooperative' | 'aggressive' | 'financial' | 'neutral'
}

export interface DialogueTree {
  id: string
  triggerContext: string
  startNodeId: string
  nodes: Record<string, DialogueNode>
}

export interface DialogueCharacter {
  id: string
  name: string
  title: string
  expression: string
  portraitSeed: number
  characterType: 'seller' | 'banker' | 'lp' | 'competitor' | 'ceo' | 'consultant' | 'lawyer' | 'journalist' | 'team'
}

export interface ActiveDialogue {
  tree: DialogueTree
  character: DialogueCharacter
  currentNodeId: string
  context: Record<string, unknown>
  history: { speaker: string; text: string }[]
}

/**
 * Resolve text templates with game state and context values.
 */
export function resolveText(
  text: string | ((state: GameState, context: Record<string, unknown>) => string),
  state: GameState,
  context: Record<string, unknown>,
): string {
  if (typeof text === 'function') return text(state, context)

  return text.replace(/\{(\w+)\}/g, (_, key) => {
    if (key in context) return String(context[key])
    if (key === 'fundName') return state.fund.name
    if (key === 'reputationScore') return String(state.fund.reputationScore)
    if (key === 'portfolioCount') return String(state.portfolioCompanies.length)
    if (key === 'netMoic') return state.fund.netMoic !== null ? state.fund.netMoic.toFixed(1) + 'x' : '—'
    if (key === 'dpi') return state.fund.dpi.toFixed(1) + 'x'
    return `{${key}}`
  })
}

/**
 * Get available responses for a node, filtered by conditions.
 */
export function getAvailableResponses(
  node: DialogueNode,
  state: GameState,
): DialogueResponse[] {
  if (!node.responses) return []
  return node.responses.filter((r) => !r.condition || r.condition(state))
}

/**
 * Advance dialogue to next node based on response selection.
 */
export function advanceDialogue(
  dialogue: ActiveDialogue,
  responseIndex: number,
  state: GameState,
): { dialogue: ActiveDialogue | null; stateChanges: Partial<GameState> | null } {
  const node = dialogue.tree.nodes[dialogue.currentNodeId]
  if (!node) return { dialogue: null, stateChanges: null }

  const responses = getAvailableResponses(node, state)
  const response = responses[responseIndex]
  if (!response) return { dialogue: null, stateChanges: null }

  const stateChanges = response.effects ? response.effects(state) : null

  // Add to history
  const resolvedText = resolveText(node.text, state, dialogue.context)
  const history = [
    ...dialogue.history,
    { speaker: dialogue.character.name, text: resolvedText },
    { speaker: 'You', text: response.text },
  ]

  if (!response.nextNodeId) {
    return { dialogue: null, stateChanges }
  }

  const nextNode = dialogue.tree.nodes[response.nextNodeId]
  return {
    dialogue: {
      ...dialogue,
      currentNodeId: response.nextNodeId,
      character: {
        ...dialogue.character,
        expression: nextNode?.expression ?? dialogue.character.expression,
      },
      history,
    },
    stateChanges,
  }
}
