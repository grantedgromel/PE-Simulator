import type { Deal } from '../../types/deal'
import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple } from '../../utils/formatters'

interface DealCardProps {
  deal: Deal
}

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  Auction: { text: 'AUCTION', color: 'text-terminal-muted' },
  LimitedProcess: { text: 'LIMITED', color: 'text-terminal-amber' },
  Proprietary: { text: 'PROPRIETARY', color: 'text-terminal-green' },
}

export function DealCard({ deal }: DealCardProps) {
  const updateDealStatus = useGameStore((s) => s.updateDealStatus)
  const sourceLabel = SOURCE_LABELS[deal.source]

  const isActioned = deal.status !== 'Available'

  return (
    <div
      className={`bg-terminal-surface border rounded p-4 transition-colors ${
        deal.status === 'Pursued'
          ? 'border-terminal-green'
          : deal.status === 'Watching'
            ? 'border-terminal-amber'
            : deal.status === 'Passed'
              ? 'border-terminal-border opacity-50'
              : 'border-terminal-border hover:border-terminal-muted'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-terminal-white font-medium text-sm">{deal.name}</h3>
          <p className="text-terminal-muted text-xs mt-0.5">{deal.subSector}</p>
        </div>
        <span className={`text-[10px] font-mono ${sourceLabel.color}`}>
          {sourceLabel.text}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-terminal-muted mb-3 leading-relaxed">
        {deal.description}
      </p>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
        <FinancialRow
          label="Revenue"
          value={deal.revenue !== null ? formatCurrency(deal.revenue) : '???'}
        />
        <FinancialRow
          label="EBITDA"
          value={deal.ebitda !== null ? formatCurrency(deal.ebitda) : '???'}
        />
        <FinancialRow label="Ask Multiple" value={formatMultiple(deal.askingMultiple)} />
        <FinancialRow
          label="Employees"
          value={deal.employeeCount !== null ? `~${deal.employeeCount}` : '???'}
        />
      </div>

      {/* Competing bids indicator */}
      <div className="text-xs text-terminal-muted mb-3">
        {deal.competingBidCount === 0 ? (
          <span className="text-terminal-green">No competing bidders</span>
        ) : (
          <span>{deal.competingBidCount} competing bidder{deal.competingBidCount > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Action buttons */}
      {!isActioned ? (
        <div className="flex gap-2">
          <button
            onClick={() => updateDealStatus(deal.id, 'Pursued')}
            className="flex-1 py-2 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-xs rounded hover:bg-terminal-green/25 transition-colors"
          >
            PURSUE
          </button>
          <button
            onClick={() => updateDealStatus(deal.id, 'Watching')}
            className="flex-1 py-2 bg-terminal-amber/15 border border-terminal-amber text-terminal-amber font-mono text-xs rounded hover:bg-terminal-amber/25 transition-colors"
          >
            WATCH
          </button>
          <button
            onClick={() => updateDealStatus(deal.id, 'Passed')}
            className="flex-1 py-2 bg-terminal-surface border border-terminal-border text-terminal-muted font-mono text-xs rounded hover:border-terminal-muted transition-colors"
          >
            PASS
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <span
            className={`text-xs font-mono ${
              deal.status === 'Pursued'
                ? 'text-terminal-green'
                : deal.status === 'Watching'
                  ? 'text-terminal-amber'
                  : 'text-terminal-muted'
            }`}
          >
            {deal.status.toUpperCase()}
          </span>
          <button
            onClick={() => updateDealStatus(deal.id, 'Available')}
            className="text-xs text-terminal-muted hover:text-terminal-white transition-colors"
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  )
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className="font-mono text-terminal-white">{value}</span>
    </div>
  )
}
