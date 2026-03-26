import type { GamePhase } from '../../types/game'
import { useGameStore } from '../../store/gameStore'

const PHASES: { id: GamePhase; label: string }[] = [
  { id: 'Sourcing', label: 'SOURCING' },
  { id: 'Diligence', label: 'DILIGENCE' },
  { id: 'Structuring', label: 'STRUCTURING' },
  { id: 'Operations', label: 'OPERATIONS' },
  { id: 'Exits', label: 'EXITS' },
  { id: 'EndOfQuarter', label: 'END OF QTR' },
]

export function BottomBar() {
  const { currentPhase, nextPhase, endQuarter } = useGameStore()

  const isEndOfQuarter = currentPhase === 'EndOfQuarter'
  const buttonLabel = isEndOfQuarter ? 'NEXT QUARTER' : 'END QUARTER'
  const handleClick = isEndOfQuarter ? endQuarter : nextPhase

  return (
    <div className="bg-terminal-surface border-t border-terminal-border px-4 py-2 flex items-center justify-between flex-shrink-0">
      {/* Phase indicators */}
      <div className="flex items-center gap-1">
        {PHASES.map((phase) => {
          const isCurrent = phase.id === currentPhase
          const phaseIndex = PHASES.findIndex((p) => p.id === phase.id)
          const currentIndex = PHASES.findIndex((p) => p.id === currentPhase)
          const isPast = phaseIndex < currentIndex

          return (
            <div
              key={phase.id}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                isCurrent
                  ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green'
                  : isPast
                    ? 'text-terminal-muted border border-transparent'
                    : 'text-terminal-border border border-transparent'
              }`}
            >
              {phase.label}
            </div>
          )
        })}
      </div>

      {/* Action button */}
      <button
        onClick={handleClick}
        className="px-6 py-2 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-sm rounded hover:bg-terminal-green/30 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
