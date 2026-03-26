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
  const { currentPhase, nextPhase, endQuarter, currentDeals, auctionResults } = useGameStore()

  const isEndOfQuarter = currentPhase === 'EndOfQuarter'

  // Determine button state based on current phase
  let buttonLabel = 'NEXT PHASE'
  let buttonEnabled = true
  let handleClick = nextPhase

  if (isEndOfQuarter) {
    buttonLabel = 'NEXT QUARTER'
    handleClick = endQuarter
  } else if (currentPhase === 'Sourcing') {
    buttonLabel = 'END SOURCING'
  } else if (currentPhase === 'Diligence') {
    const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued')
    const allBidsSubmitted = pursuedDeals.every((d) => d.playerBid !== null)
    const auctionsResolved = auctionResults.length > 0

    if (!auctionsResolved) {
      buttonLabel = 'RESOLVE AUCTIONS FIRST'
      buttonEnabled = false
      if (allBidsSubmitted) {
        // Auctions need resolving — button stays disabled, user must click Resolve in the view
        buttonLabel = 'RESOLVE AUCTIONS FIRST'
      } else {
        buttonLabel = 'SUBMIT ALL BIDS FIRST'
      }
    } else {
      buttonLabel = 'PROCEED TO STRUCTURING'
    }
  } else if (currentPhase === 'Structuring') {
    buttonLabel = 'DONE STRUCTURING'
  } else if (currentPhase === 'Operations') {
    buttonLabel = 'END OPERATIONS'
  } else if (currentPhase === 'Exits') {
    buttonLabel = 'DONE WITH EXITS'
  }

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
        disabled={!buttonEnabled}
        className="px-6 py-2 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-sm rounded hover:bg-terminal-green/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
