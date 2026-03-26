import { useGameStore } from '../../store/gameStore'
import { calculateExitOptions } from '../../engine/exitEngine'
import type { ExitRoute } from '../../types/effects'
import { formatCurrency, formatMultiple } from '../../utils/formatters'

export function ExitsView() {
  const { portfolioCompanies, fund, marketConditions, difficulty, initiateCompanyExit } = useGameStore()

  const eligibleCompanies = portfolioCompanies.filter(
    (c) => c.status === 'Active' && (c.quartersHeld >= 8 || c.exitInProgress)
  )

  if (eligibleCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <p className="font-mono">No companies eligible for exit (must hold 2+ years).</p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">Exit Opportunities</h2>
        <p className="text-xs text-terminal-muted mt-1">
          Choose an exit route for eligible portfolio companies.
        </p>
      </div>

      <div className="space-y-6">
        {eligibleCompanies.map((company) => {
          if (company.exitInProgress) {
            return (
              <div key={company.id} className="bg-terminal-surface border border-terminal-amber/30 rounded p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-terminal-white font-medium">{company.name}</h3>
                  <span className="text-xs font-mono text-terminal-amber">EXIT IN PROGRESS</span>
                </div>
                <p className="text-xs text-terminal-muted mt-1">
                  {company.exitInProgress.route} — Estimated proceeds: {formatCurrency(company.exitInProgress.estimatedProceeds)}
                </p>
              </div>
            )
          }

          const options = calculateExitOptions(company, fund, marketConditions, difficulty)

          return (
            <div key={company.id} className="bg-terminal-surface border border-terminal-border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-terminal-white font-medium">{company.name}</h3>
                  <p className="text-terminal-muted text-xs">
                    {company.subSector} — {company.quartersHeld}Q held — EBITDA: {formatCurrency(company.ebitda)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {options.map((opt) => (
                  <div
                    key={opt.route}
                    className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                      opt.available
                        ? 'border-terminal-border hover:border-terminal-muted'
                        : 'border-terminal-border/50 opacity-40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${routeColor(opt.route)}`}>{routeLabel(opt.route)}</span>
                        <span className="text-terminal-muted">|</span>
                        <span className="text-terminal-white font-mono">{formatMultiple(opt.exitMultiple)}</span>
                        <span className="text-terminal-muted">→</span>
                        <span className="text-terminal-green font-mono">{formatCurrency(opt.netProceeds)}</span>
                        <span className="text-terminal-muted">|</span>
                        <span className="font-mono text-terminal-white">{formatMultiple(opt.estimatedGrossMoic)} MOIC</span>
                      </div>
                      <p className="text-[10px] text-terminal-muted mt-0.5">{opt.description}</p>
                      {!opt.available && opt.unavailableReason && (
                        <p className="text-[10px] text-terminal-red">{opt.unavailableReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="text-[10px] text-terminal-muted">{opt.timeToComplete}Q</div>
                        <div className="text-[10px] text-terminal-muted">{Math.round(opt.successProbability * 100)}%</div>
                      </div>
                      {opt.available && (
                        <button
                          onClick={() => initiateCompanyExit(company.id, opt.route)}
                          className="px-3 py-1 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-[10px] rounded hover:bg-terminal-green/25"
                        >
                          EXIT
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function routeLabel(route: ExitRoute): string {
  switch (route) {
    case 'StrategicSale': return 'STRATEGIC'
    case 'SponsorToSponsor': return 'SPONSOR'
    case 'IPO': return 'IPO'
    case 'ContinuationVehicle': return 'CONTINUATION'
    case 'WriteOff': return 'WRITE-OFF'
  }
}

function routeColor(route: ExitRoute): string {
  switch (route) {
    case 'StrategicSale': return 'text-terminal-green'
    case 'SponsorToSponsor': return 'text-terminal-blue'
    case 'IPO': return 'text-terminal-amber'
    case 'ContinuationVehicle': return 'text-terminal-muted'
    case 'WriteOff': return 'text-terminal-red'
  }
}
