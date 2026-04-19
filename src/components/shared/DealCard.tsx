import type { Deal } from '../../types/deal'
import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple } from '../../utils/formatters'

interface DealCardProps {
  deal: Deal
  canPursue: boolean
}

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  Auction: { text: 'AUCTION', color: 'text-terminal-muted' },
  LimitedProcess: { text: 'LIMITED', color: 'text-terminal-amber' },
  Proprietary: { text: 'PROPRIETARY', color: 'text-terminal-green' },
}

export function DealCard({ deal, canPursue }: DealCardProps) {
  const updateDealStatus = useGameStore((s) => s.updateDealStatus)
  const sourceLabel = SOURCE_LABELS[deal.source]

  const isActioned = deal.status !== 'Available'
  const heat = Math.min(5, Math.max(1, deal.competingBidCount + (deal.source === 'Auction' ? 1 : 0)))
  const scale = Math.min(5, Math.max(1, Math.round((deal.revenue ?? 10) / 20)))
  const labor = deal.revenue && deal.employeeCount
    ? Math.min(5, Math.max(1, Math.round((deal.employeeCount / Math.max(1, deal.revenue)) / 1.5)))
    : null

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

      <div className="mb-3 grid grid-cols-3 gap-2">
        <SignalPips label="Heat" value={heat} tone="amber" />
        <SignalPips label="Scale" value={scale} tone="blue" />
        <SignalPips label="Labor" value={labor ?? 1} tone="green" />
      </div>

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
            disabled={!canPursue}
            className="flex-1 py-2 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-xs rounded hover:bg-terminal-green/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

function SignalPips({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'blue' | 'green'
}) {
  const toneClass = tone === 'amber'
    ? 'bg-terminal-amber'
    : tone === 'blue'
      ? 'bg-terminal-blue'
      : 'bg-terminal-green'

  return (
    <div className="rounded border border-terminal-border bg-terminal-bg/70 px-2 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-terminal-muted">
        {label}
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index < value ? toneClass : 'bg-terminal-border/50'}`}
          />
        ))}
      </div>
    </div>
  )
}
