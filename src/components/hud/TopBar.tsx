import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatFundCycle, formatQuarter } from '../../utils/formatters'
import { MetricIcon, type MetricKey } from '../shared/MetricIcon'

export function TopBar() {
  const { fund, currentFundCycle, currentYear, currentQuarter, totalQuartersElapsed, investmentPeriodEndQuarter, fundEndQuarter } = useGameStore()
  const isInvestment = totalQuartersElapsed < investmentPeriodEndQuarter
  const quartersRemaining = fundEndQuarter - totalQuartersElapsed

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
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
          isInvestment ? 'text-terminal-green bg-terminal-green/10' :
          quartersRemaining <= 4 ? 'text-terminal-red bg-terminal-red/10' :
          'text-terminal-amber bg-terminal-amber/10'
        }`}>
          {isInvestment ? 'INVESTING' : 'HARVESTING'} | {quartersRemaining}Q left
        </span>
      </div>

      {/* Key metrics */}
      <div className="flex items-center gap-4">
        <MetricDisplay icon="cash" label="CASH" value={formatCurrency(fund.remainingCapital)} />
        <MetricDisplay icon="deployed" label="DEPLOYED" value={formatCurrency(fund.deployedCapital)} />
        <MetricDisplay
          icon="moic"
          label="GROSS MOIC"
          value={fund.moic !== null ? formatMultiple(fund.moic) : '—'}
        />
        <MetricDisplay
          icon="moic"
          label="NET MOIC"
          value={fund.netMoic !== null ? formatMultiple(fund.netMoic) : '—'}
        />
        <MetricDisplay icon="dpi" label="DPI" value={fund.dpi > 0 ? formatMultiple(fund.dpi) : '—'} />
        <MetricDisplay
          icon="carry"
          label="CARRY"
          value={fund.gpTotalCarry > 0 ? formatCurrency(fund.gpTotalCarry) : '—'}
        />
      </div>
    </div>
  )
}

function MetricDisplay({ icon, label, value }: { icon: MetricKey; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-terminal-muted" aria-hidden="true">
        <MetricIcon metric={icon} size={14} />
      </span>
      <div className="text-right">
        <div className="text-[10px] text-terminal-muted font-mono uppercase">{label}</div>
        <div className="text-sm font-mono text-terminal-white">{value}</div>
      </div>
    </div>
  )
}
