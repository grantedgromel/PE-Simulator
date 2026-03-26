import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatFundCycle, formatQuarter } from '../../utils/formatters'

export function EndOfQuarter() {
  const { fund, currentFundCycle, currentYear, currentQuarter, currentDeals, totalQuartersElapsed } = useGameStore()

  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued').length
  const passedDeals = currentDeals.filter((d) => d.status === 'Passed').length
  const watchingDeals = currentDeals.filter((d) => d.status === 'Watching').length

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          End of Quarter
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          {formatFundCycle(currentFundCycle)} — {formatQuarter(currentYear, currentQuarter)} Summary
        </p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Quarter Summary */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4 space-y-2">
          <h3 className="text-xs font-mono text-terminal-muted uppercase">Quarter Activity</h3>
          <div className="space-y-1">
            <SummaryRow label="Deals Reviewed" value={String(currentDeals.length)} />
            <SummaryRow label="Deals Pursued" value={String(pursuedDeals)} />
            <SummaryRow label="Deals Passed" value={String(passedDeals)} />
            <SummaryRow label="Deals Watched" value={String(watchingDeals)} />
          </div>
        </div>

        {/* Fund Status */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4 space-y-2">
          <h3 className="text-xs font-mono text-terminal-muted uppercase">Fund Status</h3>
          <div className="space-y-1">
            <SummaryRow label="Mgmt Fees (Cumulative)" value={formatCurrency(fund.managementFeesCollected)} />
            <SummaryRow label="Capital Remaining" value={formatCurrency(fund.remainingCapital)} />
            <SummaryRow label="Quarters Elapsed" value={String(totalQuartersElapsed + 1)} />
          </div>
        </div>

        <p className="text-xs text-terminal-muted text-center mt-4">
          Click "NEXT QUARTER" to advance to {formatQuarter(
            currentQuarter === 4 ? currentYear + 1 : currentYear,
            currentQuarter === 4 ? 1 : currentQuarter + 1
          )}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className="font-mono text-terminal-white">{value}</span>
    </div>
  )
}
