import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatPercent, formatFundCycle, formatQuarter } from '../../utils/formatters'

export function TopBar() {
  const { fund, currentFundCycle, currentYear, currentQuarter } = useGameStore()

  return (
    <div className="bg-terminal-surface border-b border-terminal-border px-4 py-2 flex items-center justify-between flex-shrink-0">
      {/* Fund name and period */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-terminal-green font-bold text-sm">
          {fund.name}
        </span>
        <span className="text-terminal-muted text-xs font-mono">
          {formatFundCycle(currentFundCycle)} — {formatQuarter(currentYear, currentQuarter)}
        </span>
      </div>

      {/* Key metrics */}
      <div className="flex items-center gap-6">
        <MetricDisplay label="CASH" value={formatCurrency(fund.remainingCapital)} />
        <MetricDisplay label="DEPLOYED" value={formatCurrency(fund.deployedCapital)} />
        <MetricDisplay
          label="NET IRR"
          value={fund.netIRR !== null ? formatPercent(fund.netIRR) : '—'}
        />
        <MetricDisplay
          label="MOIC"
          value={fund.moic !== null ? formatMultiple(fund.moic) : '—'}
        />
        <MetricDisplay label="DPI" value={fund.dpi > 0 ? formatMultiple(fund.dpi) : '—'} />
      </div>
    </div>
  )
}

function MetricDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-terminal-muted font-mono uppercase">{label}</div>
      <div className="text-sm font-mono text-terminal-white">{value}</div>
    </div>
  )
}
