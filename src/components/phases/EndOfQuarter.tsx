import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatFundCycle, formatQuarter } from '../../utils/formatters'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'

export function EndOfQuarter() {
  const {
    fund, currentFundCycle, currentYear, currentQuarter, currentDeals,
    totalQuartersElapsed, eventLog, marketConditions, portfolioCompanies,
    investmentPeriodEndQuarter, fundEndQuarter,
  } = useGameStore()

  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued').length
  const passedDeals = currentDeals.filter((d) => d.status === 'Passed').length
  const watchingDeals = currentDeals.filter((d) => d.status === 'Watching').length
  const recentEvents = eventLog.filter((e) => e.quarter === totalQuartersElapsed)
  const isInvestment = totalQuartersElapsed < investmentPeriodEndQuarter
  const quartersRemaining = fundEndQuarter - totalQuartersElapsed

  return (
    <div className="p-6 overflow-y-auto h-full">
      <PhaseBrief {...PHASE_BRIEFS.endOfQuarter} />

      <div className="mt-6 max-w-2xl space-y-4">
        <div className="rounded-xl border border-terminal-border bg-terminal-surface p-4">
          <p className="text-xs font-mono uppercase tracking-[0.24em] text-terminal-amber">
            Fund Snapshot
          </p>
          <p className="mt-2 text-sm text-terminal-white">
            {formatFundCycle(currentFundCycle)} - {formatQuarter(currentYear, currentQuarter)} Summary
          </p>
        </div>

        {quartersRemaining <= 8 && (
          <div className={`rounded border p-3 ${quartersRemaining <= 4 ? 'border-terminal-red bg-terminal-red/5' : 'border-terminal-amber bg-terminal-amber/5'}`}>
            <p className={`text-xs font-mono ${quartersRemaining <= 4 ? 'text-terminal-red' : 'text-terminal-amber'}`}>
              {quartersRemaining <= 4
                ? `WARNING: ${quartersRemaining} quarters until fund expiration. Unrealized investments will be force-liquidated.`
                : `${quartersRemaining} quarters remaining in fund life. ${isInvestment ? 'Investment period active.' : 'Harvest period - no new acquisitions.'}`
              }
            </p>
          </div>
        )}

        {recentEvents.length > 0 && (
          <div className="rounded border border-terminal-border bg-terminal-surface p-4">
            <h3 className="mb-3 text-xs font-mono uppercase text-terminal-amber">Events This Quarter</h3>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="border-l-2 border-terminal-amber/50 pl-3">
                  <p className="text-xs font-medium text-terminal-white">{event.title}</p>
                  <p className="mt-0.5 text-xs text-terminal-muted">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded border border-terminal-border bg-terminal-surface p-4">
          <h3 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Market Conditions</h3>
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

        {portfolioCompanies.length > 0 && (
          <div className="rounded border border-terminal-border bg-terminal-surface p-4">
            <h3 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Portfolio Snapshot</h3>
            <div className="space-y-1">
              {portfolioCompanies.filter((company) => company.status === 'Active').map((company) => (
                <div key={company.id} className="flex justify-between text-xs">
                  <span className="text-terminal-white">{company.name}</span>
                  <span className={`font-mono ${company.covenantBreached ? 'text-terminal-red' : company.fragility > 60 ? 'text-terminal-amber' : 'text-terminal-muted'}`}>
                    EBITDA: {formatCurrency(company.ebitda)} | Leverage: {company.leverageRatio}x | Trust: {company.communityTrust}
                    {company.covenantBreached && ' | BREACH'}
                    {company.exitInProgress && ' | EXITING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 rounded border border-terminal-border bg-terminal-surface p-4">
          <h3 className="text-xs font-mono uppercase text-terminal-muted">Quarter Activity</h3>
          <div className="space-y-1">
            <SummaryRow label="Deals Reviewed" value={String(currentDeals.length)} />
            <SummaryRow label="Deals Pursued" value={String(pursuedDeals)} />
            <SummaryRow label="Deals Passed" value={String(passedDeals)} />
            <SummaryRow label="Deals Watched" value={String(watchingDeals)} />
          </div>
        </div>

        <div className="space-y-2 rounded border border-terminal-border bg-terminal-surface p-4">
          <h3 className="text-xs font-mono uppercase text-terminal-muted">Fund Status</h3>
          <div className="space-y-1">
            <SummaryRow label="Mgmt Fees (Cumulative)" value={formatCurrency(fund.managementFeesCollected)} />
            <SummaryRow label="Total Distributions" value={formatCurrency(fund.totalDistributions)} />
            <SummaryRow label="Capital Remaining" value={formatCurrency(fund.remainingCapital)} />
            <SummaryRow label="Reputation" value={`${fund.reputationScore}/100`} />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-terminal-muted">
          Click "NEXT QUARTER" to advance to {formatQuarter(
            currentQuarter === 4 ? currentYear + 1 : currentYear,
            currentQuarter === 4 ? 1 : currentQuarter + 1,
          )}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
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
