import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatFundCycle, formatQuarter } from '../../utils/formatters'

export function EndOfQuarter() {
  const {
    fund, currentFundCycle, currentYear, currentQuarter, currentDeals,
    totalQuartersElapsed, eventLog, marketConditions, portfolioCompanies,
    investmentPeriodEndQuarter, fundEndQuarter,
  } = useGameStore()

  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued').length
  const passedDeals = currentDeals.filter((d) => d.status === 'Passed').length
  const watchingDeals = currentDeals.filter((d) => d.status === 'Watching').length

  // Get recent events (this quarter)
  const recentEvents = eventLog.filter((e) => e.quarter === totalQuartersElapsed)

  const isInvestment = totalQuartersElapsed < investmentPeriodEndQuarter
  const quartersRemaining = fundEndQuarter - totalQuartersElapsed

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

      <div className="max-w-2xl space-y-4">
        {/* Fund Timer */}
        {quartersRemaining <= 8 && (
          <div className={`border rounded p-3 ${quartersRemaining <= 4 ? 'border-terminal-red bg-terminal-red/5' : 'border-terminal-amber bg-terminal-amber/5'}`}>
            <p className={`text-xs font-mono ${quartersRemaining <= 4 ? 'text-terminal-red' : 'text-terminal-amber'}`}>
              {quartersRemaining <= 4
                ? `WARNING: ${quartersRemaining} quarters until fund expiration. Unrealized investments will be force-liquidated.`
                : `${quartersRemaining} quarters remaining in fund life. ${isInvestment ? 'Investment period active.' : 'Harvest period — no new acquisitions.'}`
              }
            </p>
          </div>
        )}

        {/* Events */}
        {recentEvents.length > 0 && (
          <div className="bg-terminal-surface border border-terminal-border rounded p-4">
            <h3 className="text-xs font-mono text-terminal-amber uppercase mb-3">Events This Quarter</h3>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="border-l-2 border-terminal-amber/50 pl-3">
                  <p className="text-xs text-terminal-white font-medium">{event.title}</p>
                  <p className="text-xs text-terminal-muted mt-0.5">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Conditions */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Market Conditions</h3>
          <div className="grid grid-cols-2 gap-2">
            <MarketMetric
              label="Rate Environment"
              value={marketConditions.interestRateModifier > 0 ? `+${(marketConditions.interestRateModifier * 100).toFixed(0)}bps` : `${(marketConditions.interestRateModifier * 100).toFixed(0)}bps`}
              status={marketConditions.interestRateModifier > 0.5 ? 'bad' : marketConditions.interestRateModifier < -0.5 ? 'good' : 'neutral'}
            />
            <MarketMetric
              label="Exit Multiples"
              value={marketConditions.exitMultipleModifier > 0 ? `+${marketConditions.exitMultipleModifier.toFixed(1)}x` : `${marketConditions.exitMultipleModifier.toFixed(1)}x`}
              status={marketConditions.exitMultipleModifier > 0.3 ? 'good' : marketConditions.exitMultipleModifier < -0.3 ? 'bad' : 'neutral'}
            />
            <MarketMetric
              label="Credit Markets"
              value={marketConditions.creditAvailability > 60 ? 'Open' : marketConditions.creditAvailability > 30 ? 'Tight' : 'Frozen'}
              status={marketConditions.creditAvailability > 60 ? 'good' : marketConditions.creditAvailability > 30 ? 'neutral' : 'bad'}
            />
            <MarketMetric
              label="IPO Market"
              value={marketConditions.ipoMarketTemperature > 70 ? 'Hot' : marketConditions.ipoMarketTemperature > 50 ? 'Warm' : marketConditions.ipoMarketTemperature > 30 ? 'Cool' : 'Cold'}
              status={marketConditions.ipoMarketTemperature > 50 ? 'good' : marketConditions.ipoMarketTemperature > 30 ? 'neutral' : 'bad'}
            />
          </div>
        </div>

        {/* Portfolio Summary */}
        {portfolioCompanies.length > 0 && (
          <div className="bg-terminal-surface border border-terminal-border rounded p-4">
            <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Portfolio Snapshot</h3>
            <div className="space-y-1">
              {portfolioCompanies.filter(c => c.status === 'Active').map((co) => (
                <div key={co.id} className="flex justify-between text-xs">
                  <span className="text-terminal-white">{co.name}</span>
                  <span className={`font-mono ${co.covenantBreached ? 'text-terminal-red' : co.fragility > 60 ? 'text-terminal-amber' : 'text-terminal-muted'}`}>
                    EBITDA: {formatCurrency(co.ebitda)} | Leverage: {co.leverageRatio}x
                    {co.covenantBreached && ' | BREACH'}
                    {co.exitInProgress && ' | EXITING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quarter Activity */}
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
            <SummaryRow label="Total Distributions" value={formatCurrency(fund.totalDistributions)} />
            <SummaryRow label="Capital Remaining" value={formatCurrency(fund.remainingCapital)} />
            <SummaryRow label="Reputation" value={`${fund.reputationScore}/100`} />
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

function MarketMetric({ label, value, status }: { label: string; value: string; status: 'good' | 'neutral' | 'bad' }) {
  const color = status === 'good' ? 'text-terminal-green' : status === 'bad' ? 'text-terminal-red' : 'text-terminal-muted'
  return (
    <div className="flex justify-between text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  )
}
