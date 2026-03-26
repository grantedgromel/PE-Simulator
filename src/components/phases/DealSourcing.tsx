import { useGameStore } from '../../store/gameStore'
import { DealCard } from '../shared/DealCard'

export function DealSourcing() {
  const currentDeals = useGameStore((s) => s.currentDeals)

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          Deal Sourcing
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          Review available opportunities. Pursue deals to enter diligence, watch to monitor, or pass.
        </p>
      </div>

      {currentDeals.length === 0 ? (
        <div className="text-center text-terminal-muted py-12">
          <p className="font-mono">No deals available this quarter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}
