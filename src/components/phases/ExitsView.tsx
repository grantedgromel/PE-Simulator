import { useGameStore } from '../../store/gameStore'
import { calculateExitOptions } from '../../engine/exitEngine'
import type { ExitRoute } from '../../types/effects'
import { formatCurrency, formatMultiple } from '../../utils/formatters'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'
import { getOwnershipArchetype, getStakeholderOutcomeScore } from '../../engine/consequenceEngine'

export function ExitsView() {
  const { portfolioCompanies, fund, marketConditions, difficulty, initiateCompanyExit } = useGameStore()

  const eligibleCompanies = portfolioCompanies.filter(
    (company) => company.status === 'Active' && (company.quartersHeld >= 8 || company.exitInProgress),
  )

  if (eligibleCompanies.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full space-y-6">
        <PhaseBrief {...PHASE_BRIEFS.exits} />
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-terminal-border bg-terminal-surface text-terminal-muted">
          <p className="font-mono">No companies eligible for exit (must hold 2+ years).</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <PhaseBrief {...PHASE_BRIEFS.exits} />

      <div className="mt-6 space-y-6">
        {eligibleCompanies.map((company) => {
          const humanScore = getStakeholderOutcomeScore(company)
          const ownershipArchetype = getOwnershipArchetype(company)

          if (company.exitInProgress) {
            return (
              <div key={company.id} className="rounded border border-terminal-amber/30 bg-terminal-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-terminal-white">{company.name}</h3>
                  <span className="text-xs font-mono text-terminal-amber">EXIT IN PROGRESS</span>
                </div>
                <p className="mt-1 text-xs text-terminal-muted">
                  {company.exitInProgress.route} - Estimated proceeds: {formatCurrency(company.exitInProgress.estimatedProceeds)}
                </p>
              </div>
            )
          }

          const options = calculateExitOptions(company, fund, marketConditions, difficulty)

          return (
            <div key={company.id} className="rounded border border-terminal-border bg-terminal-surface p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-terminal-white">{company.name}</h3>
                  <p className="text-xs text-terminal-muted">
                    {company.subSector} - {company.quartersHeld}Q held - EBITDA: {formatCurrency(company.ebitda)}
                  </p>
                  <p className="mt-1 text-xs text-terminal-muted">
                    Community trust: {company.communityTrust}/100 | Human score: {humanScore}/100 | {ownershipArchetype}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {options.map((option) => (
                  <div
                    key={option.route}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-xs ${
                      option.available
                        ? 'border-terminal-border hover:border-terminal-muted'
                        : 'border-terminal-border/50 opacity-40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${routeColor(option.route)}`}>{routeLabel(option.route)}</span>
                        <span className="text-terminal-muted">|</span>
                        <span className="font-mono text-terminal-white">{formatMultiple(option.exitMultiple)}</span>
                        <span className="text-terminal-muted">-&gt;</span>
                        <span className="font-mono text-terminal-green">{formatCurrency(option.netProceeds)}</span>
                        <span className="text-terminal-muted">|</span>
                        <span className="font-mono text-terminal-white">{formatMultiple(option.estimatedGrossMoic)} MOIC</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-terminal-muted">{option.description}</p>
                      {!option.available && option.unavailableReason && (
                        <p className="text-[10px] text-terminal-red">{option.unavailableReason}</p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-terminal-muted">{option.timeToComplete}Q</div>
                        <div className="text-[10px] text-terminal-muted">{Math.round(option.successProbability * 100)}%</div>
                      </div>
                      {option.available && (
                        <button
                          onClick={() => initiateCompanyExit(company.id, option.route)}
                          className="rounded border border-terminal-green bg-terminal-green/15 px-3 py-1 font-mono text-[10px] text-terminal-green hover:bg-terminal-green/25"
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
