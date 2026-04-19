import { useState, useEffect, useCallback } from 'react'
import type { ActiveDialogue } from '../../engine/dialogueEngine'
import { resolveText, getAvailableResponses, advanceDialogue } from '../../engine/dialogueEngine'
import { useGameStore } from '../../store/gameStore'
import { Portrait } from '../shared/Portrait'
import type { CharacterType, Expression } from '../../types/npc'

interface DialoguePanelProps {
  dialogue: ActiveDialogue
  onComplete: (stateChanges: Partial<import('../../types/game').GameState> | null) => void
  onDismiss?: () => void
}

export function DialoguePanel({ dialogue, onComplete, onDismiss }: DialoguePanelProps) {
  const state = useGameStore()
  const node = dialogue.tree.nodes[dialogue.currentNodeId]
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [accumulatedChanges, setAccumulatedChanges] = useState<Partial<import('../../types/game').GameState> | null>(null)

  const fullText = node ? resolveText(node.text, state, dialogue.context) : ''
  const responses = node ? getAvailableResponses(node, state) : []

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.substring(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 25)
    return () => clearInterval(interval)
  }, [fullText])

  const skipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText)
      setIsTyping(false)
    }
  }, [isTyping, fullText])

  const handleResponse = (index: number) => {
    const result = advanceDialogue(dialogue, index, state)
    if (result.stateChanges) {
      setAccumulatedChanges((prev) => prev ? { ...prev, ...result.stateChanges } : result.stateChanges)
    }
    if (!result.dialogue) {
      // Dialogue complete
      const finalChanges = result.stateChanges
        ? (accumulatedChanges ? { ...accumulatedChanges, ...result.stateChanges } : result.stateChanges)
        : accumulatedChanges
      onComplete(finalChanges)
    } else {
      // Continue to next node — update the dialogue in parent
      onComplete(null) // no state change yet
      // We'd need to update the dialogue prop — handled by parent
    }
  }

  if (!node) return null

  const hintIcons: Record<string, string> = {
    cooperative: '🤝',
    aggressive: '⚔',
    financial: '💰',
    neutral: '—',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onDismiss && responses.length === 0 ? onDismiss : skipTypewriter}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div className="relative w-full max-w-4xl bg-terminal-surface border-t border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex p-4 gap-4">
          {/* Portrait */}
          <div className="flex-shrink-0 w-32">
            <Portrait
              subject={{
                kind: 'npc',
                characterType: dialogue.character.characterType as CharacterType,
                seed: dialogue.character.portraitSeed,
                expression: dialogue.character.expression as Expression,
              }}
              size={128}
              rounded="md"
            />
            <div className="mt-2 text-center">
              <div className="text-xs text-terminal-green font-mono">{dialogue.character.name}</div>
              <div className="text-[10px] text-terminal-muted">{dialogue.character.title}</div>
            </div>
          </div>

          {/* Text + Responses */}
          <div className="flex-1">
            <div className="min-h-[80px] mb-3">
              <p className="text-sm text-terminal-white leading-relaxed">
                {displayedText}
                {isTyping && <span className="animate-pulse text-terminal-green">▊</span>}
              </p>
            </div>

            {/* Response buttons (only show when typing complete) */}
            {!isTyping && responses.length > 0 && (
              <div className="space-y-1.5">
                {responses.map((response, i) => (
                  <button
                    key={i}
                    onClick={() => handleResponse(i)}
                    className="w-full text-left px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-xs text-terminal-white hover:border-terminal-green hover:text-terminal-green transition-colors"
                  >
                    <span className="text-terminal-muted mr-2 text-[10px]">
                      {hintIcons[response.consequenceHint ?? 'neutral']}
                    </span>
                    {response.text}
                  </button>
                ))}
              </div>
            )}

            {/* Auto-advance or end indicator */}
            {!isTyping && responses.length === 0 && (
              <button
                onClick={() => onComplete(accumulatedChanges)}
                className="px-4 py-1.5 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-xs rounded"
              >
                CONTINUE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
