import type { Deal } from '../../types/deal'
import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple } from '../../utils/formatters'

interface DealCardProps {
  deal: Deal
  canPursue: boolean
}

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  Auction: { text: 'AUCTION', color: 'var(--color-ink)' },
  LimitedProcess: { text: 'LIMITED', color: 'var(--color-orange)' },
  Proprietary: { text: 'PROPRIETARY', color: 'var(--color-arcade-green)' },
}

const STATUS_RING: Record<Deal['status'], string> = {
  Available: 'var(--color-ink)',
  Pursued: 'var(--color-lime)',
  Watching: 'var(--color-orange)',
  Passed: 'var(--color-ink)',
  Won: 'var(--color-arcade-green)',
  Lost: 'var(--color-pink)',
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

  const initials = deal.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="pe-card pe-card-clickable"
      style={{
        boxShadow: deal.status === 'Pursued'
          ? `0 0 0 3px ${STATUS_RING.Pursued}, 3px 3px 0 var(--color-ink)`
          : deal.status === 'Watching'
            ? `0 0 0 3px ${STATUS_RING.Watching}, 3px 3px 0 var(--color-ink)`
            : undefined,
        opacity: deal.status === 'Passed' ? 0.5 : 1,
      }}
    >
      {/* Header — ticker tile + name + source pill */}
      <div className="mb-3 flex items-start gap-3">
        <div
          className="pe-ticker"
          style={{ width: 48, height: 48, fontSize: 18, background: 'var(--color-paper)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-tight" style={{ color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
            {deal.name}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink)', opacity: 0.55 }}>
            {deal.subSector}
          </p>
        </div>
        <span
          className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]"
          style={{
            background: 'var(--color-cream)',
            color: sourceLabel.color,
            border: '2px solid var(--color-ink)',
            borderRadius: 6,
            padding: '3px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {sourceLabel.text}
        </span>
      </div>

      {/* Signal pips */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <SignalPips label="Heat" value={heat} tone="pink" />
        <SignalPips label="Scale" value={scale} tone="orange" />
        <SignalPips label="Labor" value={labor ?? 1} tone="lime" />
      </div>

      {/* Financials grid */}
      <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1">
        <FinancialRow label="Revenue" value={deal.revenue !== null ? formatCurrency(deal.revenue) : '???'} />
        <FinancialRow label="EBITDA" value={deal.ebitda !== null ? formatCurrency(deal.ebitda) : '???'} />
        <FinancialRow label="Ask Mult." value={formatMultiple(deal.askingMultiple)} />
        <FinancialRow label="Heads" value={deal.employeeCount !== null ? `~${deal.employeeCount}` : '???'} />
      </div>

      {/* Competing bidders strip */}
      <div
        className="mb-3 rounded-lg border-2 px-3 py-2 font-mono text-[11px]"
        style={{
          borderColor: 'var(--color-ink)',
          background: deal.competingBidCount === 0 ? 'var(--color-lime)' : 'var(--color-paper)',
          color: 'var(--color-ink)',
        }}
      >
        {deal.competingBidCount === 0
          ? 'NO COMPETING BIDDERS'
          : `${deal.competingBidCount} COMPETING BIDDER${deal.competingBidCount > 1 ? 'S' : ''}`}
      </div>

      {/* Actions */}
      {!isActioned ? (
        <div className="flex gap-2">
          <button
            onClick={() => updateDealStatus(deal.id, 'Pursued')}
            disabled={!canPursue}
            className="pe-bigbtn pe-bigbtn-lime flex-1 text-xs"
            style={{ padding: '8px 0' }}
          >
            PURSUE
          </button>
          <button
            onClick={() => updateDealStatus(deal.id, 'Watching')}
            className="pe-bigbtn pe-bigbtn-orange flex-1 text-xs"
            style={{ padding: '8px 0' }}
          >
            WATCH
          </button>
          <button
            onClick={() => updateDealStatus(deal.id, 'Passed')}
            className="pe-bigbtn pe-bigbtn-cream flex-1 text-xs"
            style={{ padding: '8px 0' }}
          >
            PASS
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: STATUS_RING[deal.status] }}
          >
            ● {deal.status.toUpperCase()}
          </span>
          <button
            onClick={() => updateDealStatus(deal.id, 'Available')}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] underline"
            style={{ color: 'var(--color-ink)', opacity: 0.6 }}
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
    <div className="flex items-center justify-between text-[11.5px]">
      <span className="font-mono uppercase tracking-[0.06em]" style={{ color: 'var(--color-ink)', opacity: 0.55 }}>
        {label}
      </span>
      <span className="font-mono font-bold" style={{ color: 'var(--color-ink)' }}>
        {value}
      </span>
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
  tone: 'pink' | 'orange' | 'lime'
}) {
  const toneColor =
    tone === 'pink' ? 'var(--color-pink)' : tone === 'orange' ? 'var(--color-orange)' : 'var(--color-lime)'

  return (
    <div
      className="rounded-lg px-2 py-2"
      style={{ background: 'var(--color-paper)', border: '2px solid var(--color-ink)' }}
    >
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
        {label}
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-2 flex-1 rounded-sm"
            style={{
              background: index < value ? toneColor : 'transparent',
              border: '1.5px solid var(--color-ink)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
