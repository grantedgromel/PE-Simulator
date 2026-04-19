import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'
import { summarizeHumanConsequences } from '../../engine/consequenceEngine'

export function FundComplete() {
  const { fund, exitResults, exitedCompanies, writtenOffCompanies, portfolioCompanies, setScreen } = useGameStore()

  const totalInvested = exitResults.reduce((sum, r) => sum + r.totalInvested, 0)
  const totalProceeds = exitResults.reduce((sum, r) => sum + r.totalProceeds, 0)
  const avgMoic = totalInvested > 0 ? totalProceeds / totalInvested : 0
  const totalEmployeesImpacted = [...exitedCompanies, ...writtenOffCompanies, ...portfolioCompanies]
    .reduce((sum, c) => sum + c.employeeCount, 0)
  const humanSummary = summarizeHumanConsequences([
    ...exitedCompanies,
    ...writtenOffCompanies,
    ...portfolioCompanies,
  ])

  const bestDeal = exitResults.length > 0
    ? exitResults.reduce((best, r) => r.grossMoic > best.grossMoic ? r : best)
    : null
  const worstDeal = exitResults.length > 0
    ? exitResults.reduce((worst, r) => r.grossMoic < worst.grossMoic ? r : worst)
    : null

  return (
    <div className="h-full flex flex-col items-center justify-center bg-terminal-bg overflow-y-auto">
      <div className="w-full max-w-3xl px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-mono font-bold text-terminal-green tracking-widest">
            FUND I COMPLETE
          </h1>
          <p className="text-terminal-amber font-mono text-sm">{fund.name}</p>
        </div>

        <div className="border-t border-terminal-border" />

        {/* Fund-Level Metrics */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-6">
          <h2 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-4">Fund Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <FundMetric label="Total Invested" value={formatCurrency(totalInvested)} />
            <FundMetric label="Total Proceeds" value={formatCurrency(totalProceeds)} />
            <FundMetric label="Gross MOIC" value={formatMultiple(avgMoic)} highlight={avgMoic >= 2} />
            <FundMetric label="Total Distributions" value={formatCurrency(fund.totalDistributions)} />
            <FundMetric label="Deals Exited" value={String(exitResults.length)} />
            <FundMetric label="Write-Offs" value={String(writtenOffCompanies.length)} warn={writtenOffCompanies.length > 0} />
          </div>
        </div>

        {/* Deal Table */}
        {exitResults.length > 0 && (
          <div className="bg-terminal-surface border border-terminal-border rounded p-4">
            <h2 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">Deal Results</h2>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-terminal-muted">
                  <th className="text-left py-1">Company</th>
                  <th className="text-right py-1">Invested</th>
                  <th className="text-right py-1">Proceeds</th>
                  <th className="text-right py-1">MOIC</th>
                  <th className="text-right py-1">IRR</th>
                  <th className="text-right py-1">Hold</th>
                  <th className="text-right py-1">Exit</th>
                </tr>
              </thead>
              <tbody>
                {exitResults.map((r) => (
                  <tr key={r.companyId} className="border-t border-terminal-border/50">
                    <td className="text-terminal-white py-1">{r.companyName}</td>
                    <td className="text-right text-terminal-white py-1">{formatCurrency(r.totalInvested)}</td>
                    <td className="text-right text-terminal-white py-1">{formatCurrency(r.totalProceeds)}</td>
                    <td className={`text-right py-1 ${r.grossMoic >= 2 ? 'text-terminal-green' : r.grossMoic < 1 ? 'text-terminal-red' : 'text-terminal-white'}`}>
                      {formatMultiple(r.grossMoic)}
                    </td>
                    <td className={`text-right py-1 ${r.grossIrr >= 0.20 ? 'text-terminal-green' : r.grossIrr < 0 ? 'text-terminal-red' : 'text-terminal-white'}`}>
                      {r.grossIrr > -1 ? formatPercent(r.grossIrr) : 'N/A'}
                    </td>
                    <td className="text-right text-terminal-muted py-1">{r.holdPeriodQuarters}Q</td>
                    <td className="text-right text-terminal-muted py-1">{r.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-4">
          {bestDeal && (
            <div className="bg-terminal-green/10 border border-terminal-green/30 rounded p-3">
              <div className="text-[10px] text-terminal-green font-mono uppercase">Best Deal</div>
              <div className="text-sm text-terminal-white mt-1">{bestDeal.companyName}</div>
              <div className="text-xs text-terminal-green font-mono">{formatMultiple(bestDeal.grossMoic)} MOIC</div>
            </div>
          )}
          {worstDeal && (
            <div className="bg-terminal-red/10 border border-terminal-red/30 rounded p-3">
              <div className="text-[10px] text-terminal-red font-mono uppercase">Worst Deal</div>
              <div className="text-sm text-terminal-white mt-1">{worstDeal.companyName}</div>
              <div className="text-xs text-terminal-red font-mono">{formatMultiple(worstDeal.grossMoic)} MOIC</div>
            </div>
          )}
        </div>

        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h2 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">Ownership Footprint</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <FundMetric label="Community Trust" value={`${humanSummary.averageCommunityTrust.toFixed(1)}/100`} />
            <FundMetric label="Layoffs" value={humanSummary.totalLayoffs.toLocaleString()} warn={humanSummary.totalLayoffs > 0} />
            <FundMetric label="Jobs Added" value={humanSummary.totalJobsAdded.toLocaleString()} highlight={humanSummary.totalJobsAdded > humanSummary.totalLayoffs} />
            <FundMetric label="Cash Extracted" value={formatCurrency(humanSummary.totalExtractedCash)} warn={humanSummary.totalExtractedCash > humanSummary.totalInvestedCash} />
          </div>
        </div>

        <div className="text-center text-terminal-muted text-xs font-mono">
          Total employees across your portfolio: {totalEmployeesImpacted.toLocaleString()}
        </div>

        <div className="border-t border-terminal-border" />

        <button
          onClick={() => setScreen('fundraising')}
          className="w-full py-4 bg-terminal-amber/20 border border-terminal-amber text-terminal-amber font-mono rounded hover:bg-terminal-amber/30 transition-colors"
        >
          PROCEED TO FUNDRAISING
        </button>
      </div>
    </div>
  )
}

function FundMetric({ label, value, highlight = false, warn = false }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-terminal-muted font-mono uppercase">{label}</div>
      <div className={`text-lg font-mono ${warn ? 'text-terminal-red' : highlight ? 'text-terminal-green' : 'text-terminal-white'}`}>{value}</div>
    </div>
  )
}
