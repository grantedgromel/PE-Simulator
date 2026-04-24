import type { GamePhase } from '../../types/game'
import { useGameStore } from '../../store/gameStore'

const PHASES: { id: GamePhase; label: string }[] = [
  { id: 'Sourcing', label: 'SOURCING' },
  { id: 'TeamAssignment', label: 'TEAM' },
  { id: 'Diligence', label: 'DILIGENCE' },
  { id: 'Structuring', label: 'STRUCTURING' },
  { id: 'Operations', label: 'OPS' },
  { id: 'Exits', label: 'EXITS' },
  { id: 'EndOfQuarter', label: 'END QTR' },
]

export function BottomBar() {
  const { currentPhase, nextPhase, endQuarter, currentDeals, auctionResults } = useGameStore()

  const isEndOfQuarter = currentPhase === 'EndOfQuarter'

  let buttonLabel = 'NEXT PHASE'
  let buttonEnabled = true
  let handleClick = nextPhase

  if (isEndOfQuarter) {
    buttonLabel = 'NEXT QUARTER'
    handleClick = endQuarter
  } else if (currentPhase === 'Sourcing') {
    buttonLabel = 'END SOURCING'
  } else if (currentPhase === 'TeamAssignment') {
    buttonLabel = 'CONFIRM ASSIGNMENTS'
  } else if (currentPhase === 'Diligence') {
    const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued')
    const allBidsSubmitted = pursuedDeals.every((d) => d.playerBid !== null)
    const auctionsResolved = auctionResults.length > 0

    if (!auctionsResolved) {
      buttonEnabled = false
      buttonLabel = allBidsSubmitted ? 'RESOLVE AUCTIONS FIRST' : 'SUBMIT ALL BIDS FIRST'
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
    <div
      className="flex flex-shrink-0 items-center justify-between border-t-[3px] px-6 py-3"
      style={{ background: 'var(--color-ink2)', borderColor: 'var(--color-ink)' }}
    >
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
              className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `2px solid ${isCurrent ? 'var(--color-lime)' : 'transparent'}`,
                background: isCurrent ? 'var(--color-lime)' : 'transparent',
                color: isCurrent
                  ? 'var(--color-ink)'
                  : isPast
                    ? 'rgba(247,241,225,0.55)'
                    : 'rgba(247,241,225,0.25)',
                boxShadow: isCurrent ? '2px 2px 0 var(--color-ink)' : undefined,
              }}
            >
              {phase.label}
            </div>
          )
        })}
      </div>

      <button onClick={handleClick} disabled={!buttonEnabled} className="pe-bigbtn pe-bigbtn-orange text-sm">
        {buttonLabel} ▶
      </button>
    </div>
  )
}
