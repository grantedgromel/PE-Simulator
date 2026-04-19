import { useGameStore } from '../../store/gameStore'
import { DealCard } from '../shared/DealCard'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'
import { getSourcingCapacity } from '../../engine/turnPressure'

export function DealSourcing() {
  const currentDeals = useGameStore((s) => s.currentDeals)
  const teamMembers = useGameStore((s) => s.teamMembers)
  const pursuedDeals = currentDeals.filter((deal) => deal.status === 'Pursued').length
  const sourcingCapacity = getSourcingCapacity(teamMembers)

  return (
    <div className="p-6 overflow-y-auto h-full">
      <PhaseBrief {...PHASE_BRIEFS.sourcing} />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SourceMetric label="Live Deals" value={String(currentDeals.length)} />
        <SourceMetric label="Shortlist" value={`${pursuedDeals}/${sourcingCapacity}`} tone={pursuedDeals >= sourcingCapacity ? 'amber' : 'green'} />
        <SourceMetric label="Watchlist" value={String(currentDeals.filter((deal) => deal.status === 'Watching').length)} />
      </div>

      {currentDeals.length === 0 ? (
        <div className="text-center text-terminal-muted py-12">
          <p className="font-mono">No deals available this quarter.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {currentDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              canPursue={deal.status === 'Pursued' || pursuedDeals < sourcingCapacity}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SourceMetric({
  label,
  value,
  tone = 'white',
}: {
  label: string
  value: string
  tone?: 'green' | 'amber' | 'white'
}) {
  const toneClass = tone === 'green'
    ? 'text-terminal-green'
    : tone === 'amber'
      ? 'text-terminal-amber'
      : 'text-terminal-white'

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-surface/80 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-terminal-muted">{label}</div>
      <div className={`mt-1 font-mono text-lg ${toneClass}`}>{value}</div>
    </div>
  )
}
