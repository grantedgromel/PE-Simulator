import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatFundCycle, formatQuarter } from '../../utils/formatters'

export function TopBar() {
  const {
    fund,
    currentFundCycle,
    currentYear,
    currentQuarter,
    totalQuartersElapsed,
    investmentPeriodEndQuarter,
    fundEndQuarter,
  } = useGameStore()
  const isInvestment = totalQuartersElapsed < investmentPeriodEndQuarter
  const quartersRemaining = fundEndQuarter - totalQuartersElapsed
  const periodTone = isInvestment ? 'lime' : quartersRemaining <= 4 ? 'pink' : 'orange'
  const periodColor =
    periodTone === 'lime' ? 'var(--color-lime)' : periodTone === 'pink' ? 'var(--color-pink)' : 'var(--color-orange)'

  return (
    <div
      className="flex flex-shrink-0 items-center justify-between gap-4 border-b-[3px] px-6 py-3"
      style={{ background: 'var(--color-ink2)', borderColor: 'var(--color-ink)' }}
    >
      {/* Brand + fund + period chip */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-[10px] border-[2.5px]"
          style={{
            background: 'var(--color-orange)',
            borderColor: 'var(--color-cream)',
            boxShadow: '3px 3px 0 var(--color-cream)',
          }}
        >
          <span className="text-base font-extrabold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            PE
          </span>
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold" style={{ color: 'var(--color-cream)' }}>
            {fund.name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-cream)', opacity: 0.55 }}>
            {formatFundCycle(currentFundCycle)} · {formatQuarter(currentYear, currentQuarter)}
          </div>
        </div>
        <span
          className="ml-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{
            background: periodColor,
            color: 'var(--color-ink)',
            border: '2px solid var(--color-ink)',
            borderRadius: 8,
            padding: '4px 10px',
            boxShadow: '2px 2px 0 var(--color-ink)',
          }}
        >
          {isInvestment ? 'INVESTING' : 'HARVESTING'} · {quartersRemaining}Q LEFT
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2">
        <Stat label="CASH" value={formatCurrency(fund.remainingCapital)} accent="lime" />
        <Stat label="DEPLOYED" value={formatCurrency(fund.deployedCapital)} />
        <Stat label="GROSS MOIC" value={fund.moic !== null ? formatMultiple(fund.moic) : '—'} />
        <Stat label="NET MOIC" value={fund.netMoic !== null ? formatMultiple(fund.netMoic) : '—'} />
        <Stat label="DPI" value={fund.dpi > 0 ? formatMultiple(fund.dpi) : '—'} />
        <Stat
          label="CARRY"
          value={fund.gpTotalCarry > 0 ? formatCurrency(fund.gpTotalCarry) : '—'}
          accent="orange"
        />
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'lime' | 'orange' }) {
  const accentColor =
    accent === 'lime' ? 'var(--color-lime)' : accent === 'orange' ? 'var(--color-orange)' : 'var(--color-cream)'
  return (
    <div className="pe-stat text-right">
      <div className="pe-stat-label" style={{ color: 'var(--color-cream)' }}>{label}</div>
      <div className="pe-stat-value" style={{ color: accentColor }}>{value}</div>
    </div>
  )
}
