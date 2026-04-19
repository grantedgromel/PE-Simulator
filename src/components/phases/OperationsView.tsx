import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { ValueCreationAction } from '../../types/company'
import { formatCurrency, formatPercent, formatMultiple } from '../../utils/formatters'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'
import { getOwnershipArchetype, getStakeholderOutcomeScore } from '../../engine/consequenceEngine'
import { getCommunityPulseLine } from '../../data/sectorConsequenceFlavor'
import { calculateMaxRecap } from '../../engine/operationsEngine'
import { getActionModifier } from '../../engine/teamEngine'
import {
  ACTION_COMMAND_COSTS,
  getOperationBlockReason,
  getOperationsExecutionBudget,
  getOperationsExecutionSpent,
  getStaffedPortfolioCompanyIds,
  hasOperatingPartnerCoverage,
} from '../../engine/turnPressure'

const ACTIONS: Array<{
  id: ValueCreationAction
  label: string
  tone: string
  tags: string[]
}> = [
  {
    id: 'CostCutting',
    label: 'Cut Costs',
    tone: 'text-terminal-amber',
    tags: ['+Margin', '-Jobs', '-Trust'],
  },
  {
    id: 'RevenueEnhancement',
    label: 'Raise Prices',
    tone: 'text-terminal-blue',
    tags: ['+Revenue', '-Sat', '-Trust'],
  },
  {
    id: 'OrganicInvestment',
    label: 'Invest',
    tone: 'text-terminal-green',
    tags: ['-EBITDA now', '+Growth later', '+Trust'],
  },
  {
    id: 'AddOnAcquisition',
    label: 'Add-On',
    tone: 'text-terminal-green',
    tags: ['+Scale', '+Debt', 'Integration risk'],
  },
  {
    id: 'DividendRecap',
    label: 'Recap',
    tone: 'text-terminal-amber',
    tags: ['+DPI', '+Leverage', '-Trust'],
  },
  {
    id: 'ManagementUpgrade',
    label: 'New Mgmt',
    tone: 'text-terminal-blue',
    tags: ['Reset team', 'Transition risk', 'Upside'],
  },
  {
    id: 'ConsultantEngagement',
    label: 'Consultant',
    tone: 'text-terminal-muted',
    tags: ['Costs cash', 'Maybe useful', 'Maybe deck'],
  },
  {
    id: 'DoNothing',
    label: 'Hold',
    tone: 'text-terminal-muted',
    tags: ['Save moves', 'No change', 'No cost'],
  },
]

export function OperationsView() {
  const { portfolioCompanies, teamMembers, totalQuartersElapsed } = useGameStore()
  const activeCompanies = portfolioCompanies.filter((company) => company.status === 'Active')
  const staffedCompanies = getStaffedPortfolioCompanyIds(teamMembers, activeCompanies)
  const executionBudget = getOperationsExecutionBudget(teamMembers, activeCompanies)
  const executionSpent = getOperationsExecutionSpent(activeCompanies, totalQuartersElapsed)

  if (activeCompanies.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full space-y-6">
        <PhaseBrief {...PHASE_BRIEFS.operations} />
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-terminal-border bg-terminal-surface text-terminal-muted">
          <p className="font-mono">No portfolio companies to manage.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <PhaseBrief {...PHASE_BRIEFS.operations} />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ExecutionMetric label="Execution" value={`${executionSpent}/${executionBudget}`} tone={executionSpent >= executionBudget ? 'amber' : 'green'} />
        <ExecutionMetric label="Staffed Assets" value={`${staffedCompanies.size}/${activeCompanies.length}`} />
        <ExecutionMetric label="Portfolio" value={String(activeCompanies.length)} />
      </div>

      <div className="mt-6 space-y-4">
        {activeCompanies.map((company) => (
          <CompanyOperationsCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  )
}

function CompanyOperationsCard({
  company,
}: {
  company: ReturnType<typeof useGameStore.getState>['portfolioCompanies'][0]
}) {
  const {
    executeCompanyAction,
    totalQuartersElapsed,
    generateAddOns,
    executeAddOnAcquisition,
    executeDividendRecapAction,
    resolveCovenantChoice,
    addOnTargets,
    teamMembers,
    portfolioCompanies,
  } = useGameStore()
  const [selectedAction, setSelectedAction] = useState<ValueCreationAction | null>(null)
  const [showAddOns, setShowAddOns] = useState(false)
  const [recapAmount, setRecapAmount] = useState(0)
  const [showRecap, setShowRecap] = useState(false)

  const actionTakenThisQuarter = company.actionsTaken.some((record) => record.quarter === totalQuartersElapsed)
  const actionModifier = getActionModifier(company, teamMembers)
  const hasCoverage = hasOperatingPartnerCoverage(company.id, teamMembers, portfolioCompanies)
  const maxRecap = calculateMaxRecap(company)

  const moraleColor =
    company.morale >= 60 ? 'text-terminal-green' : company.morale >= 40 ? 'text-terminal-amber' : 'text-terminal-red'
  const satColor =
    company.customerSatisfaction >= 60 ? 'text-terminal-green' : company.customerSatisfaction >= 40 ? 'text-terminal-amber' : 'text-terminal-red'
  const trustColor =
    company.communityTrust >= 60 ? 'text-terminal-green' : company.communityTrust >= 40 ? 'text-terminal-amber' : 'text-terminal-red'
  const humanScore = getStakeholderOutcomeScore(company)
  const ownershipArchetype = getOwnershipArchetype(company)
  const pulseLine = getCommunityPulseLine(company, company.quartersHeld + company.name.length)

  const handleExecute = () => {
    if (!selectedAction) return

    if (selectedAction === 'AddOnAcquisition') {
      generateAddOns(company.id)
      setShowAddOns(true)
      return
    }

    if (selectedAction === 'DividendRecap') {
      setShowRecap(true)
      return
    }

    executeCompanyAction(company.id, selectedAction)
    setSelectedAction(null)
  }

  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-terminal-white">{company.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${hasCoverage ? 'bg-terminal-green/10 text-terminal-green' : 'bg-terminal-red/10 text-terminal-red'}`}>
              {hasCoverage ? 'OP COVERED' : 'NO OP'}
            </span>
          </div>
          <p className="mt-1 text-xs text-terminal-muted">
            {company.subSector} | {company.quartersHeld}Q held | {ownershipArchetype}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {company.covenantBreached && (
            <span className="rounded bg-terminal-red/10 px-2 py-0.5 text-xs font-mono text-terminal-red">
              COVENANT BREACH
            </span>
          )}
          {actionTakenThisQuarter && (
            <span className="rounded bg-terminal-green/10 px-2 py-0.5 text-xs font-mono text-terminal-green">
              MOVE SPENT
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <CompactMetric label="Revenue" value={formatCurrency(company.revenue)} />
        <CompactMetric label="EBITDA" value={formatCurrency(company.ebitda)} />
        <CompactMetric label="Margin" value={formatPercent(company.ebitdaMargin)} />
        <CompactMetric label="Leverage" value={formatMultiple(company.leverageRatio)} warn={company.leverageRatio > 5} />
        <CompactMetric label="Interest Cov." value={`${company.interestCoverage}x`} warn={company.interestCoverage < 2} />
        <CompactMetric label="Employees" value={String(company.employeeCount)} />
        <CompactMetric label="Growth" value={formatPercent(company.revenueGrowthRate)} />
        <CompactMetric label="Value" value={formatCurrency(company.currentImpliedValuation)} />
      </div>

      <div className="mb-3 grid gap-4 md:grid-cols-2">
        <HealthBar label="Morale" value={company.morale} color={moraleColor} />
        <HealthBar label="Customer Sat." value={company.customerSatisfaction} color={satColor} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <CompactMetric label="Trust" value={`${company.communityTrust}/100`} className={trustColor} />
        <CompactMetric label="Human Score" value={`${humanScore}/100`} warn={humanScore < 40} />
        <CompactMetric label="Fragility" value={`${company.fragility}/100`} warn={company.fragility > 50} />
        <CompactMetric label="Div Recaps" value={formatCurrency(company.dividendRecapTotal)} />
      </div>

      <div className="mb-3 rounded border border-terminal-border bg-terminal-bg/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-terminal-muted">Ops Lead</div>
            <div className="mt-1 text-xs text-terminal-white">{actionModifier.description}</div>
          </div>
          <div className="flex gap-3 text-xs font-mono">
            <span className="text-terminal-green">Eff {actionModifier.effectivenessMultiplier.toFixed(2)}x</span>
            <span className="text-terminal-amber">Risk {actionModifier.sideEffectMultiplier.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded border border-terminal-border bg-terminal-bg/70 p-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-terminal-muted">Street Pulse</div>
        <p className="mt-1 text-xs leading-5 text-terminal-muted">{pulseLine}</p>
      </div>

      {!actionTakenThisQuarter && (
        <div className="border-t border-terminal-border pt-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {ACTIONS.map((action) => {
              const blockReason = getOperationBlockReason(
                company,
                action.id,
                teamMembers,
                portfolioCompanies,
                totalQuartersElapsed,
              )
              const isDisabled = blockReason !== null

              return (
                <button
                  key={action.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedAction(action.id)
                    }
                  }}
                  disabled={isDisabled}
                  className={`rounded border px-3 py-3 text-left transition-colors ${
                    selectedAction === action.id
                      ? 'border-terminal-green bg-terminal-green/10'
                      : 'border-terminal-border bg-terminal-bg/60 hover:border-terminal-muted'
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[11px] ${action.tone}`}>{action.label}</span>
                    <span className="text-[10px] font-mono text-terminal-white">
                      {ACTION_COMMAND_COSTS[action.id]} AP
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {action.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-terminal-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-terminal-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-terminal-muted">
                    {blockReason ?? 'Ready'}
                  </div>
                </button>
              )
            })}
          </div>

          {selectedAction && !showAddOns && !showRecap && (
            <button
              onClick={handleExecute}
              className="mt-3 w-full rounded border border-terminal-green bg-terminal-green/20 py-2 font-mono text-xs text-terminal-green transition-colors hover:bg-terminal-green/30"
            >
              EXECUTE: {ACTIONS.find((action) => action.id === selectedAction)?.label}
            </button>
          )}

          {showAddOns && addOnTargets.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-terminal-muted">Pick an add-on target.</p>
              {addOnTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-xs">
                  <div>
                    <span className="text-terminal-white">{target.name}</span>
                    <span className="ml-2 text-terminal-muted">
                      {formatCurrency(target.revenue)} rev | {formatCurrency(target.ebitda)} EBITDA | {formatMultiple(target.askingMultiple)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      executeAddOnAcquisition(company.id, target)
                      setShowAddOns(false)
                      setSelectedAction(null)
                    }}
                    className="rounded border border-terminal-green bg-terminal-green/15 px-2 py-1 font-mono text-[10px] text-terminal-green"
                  >
                    ACQUIRE
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setShowAddOns(false)
                  setSelectedAction(null)
                }}
                className="text-xs text-terminal-muted hover:text-terminal-white"
              >
                Cancel
              </button>
            </div>
          )}

          {showRecap && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-terminal-muted">Recap amount</span>
                <span className="font-mono text-terminal-white">{formatCurrency(recapAmount)}</span>
              </div>
              <div className="text-[10px] text-terminal-muted">Max: {formatCurrency(maxRecap)}</div>
              <input
                type="range"
                min={0}
                max={maxRecap}
                step={0.5}
                value={recapAmount}
                onChange={(event) => setRecapAmount(parseFloat(event.target.value))}
                className="w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    executeDividendRecapAction(company.id, recapAmount)
                    setShowRecap(false)
                    setSelectedAction(null)
                  }}
                  disabled={recapAmount <= 0}
                  className="flex-1 rounded border border-terminal-green bg-terminal-green/15 py-1 font-mono text-xs text-terminal-green disabled:opacity-30"
                >
                  EXECUTE RECAP
                </button>
                <button
                  onClick={() => {
                    setShowRecap(false)
                    setSelectedAction(null)
                  }}
                  className="text-xs text-terminal-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {company.covenantChoicePending && (
            <div className="mt-3 space-y-1 rounded border border-terminal-red/30 bg-terminal-red/10 p-3">
              <p className="text-xs font-mono text-terminal-red">COVENANT BREACH</p>
              <div className="grid gap-1 md:grid-cols-2">
                <button
                  onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'negotiate_waiver' })}
                  className="rounded border border-terminal-border px-2 py-1 text-[10px] text-terminal-white hover:border-terminal-muted"
                >
                  Negotiate Waiver ($0.75M)
                </button>
                <button
                  onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'equity_cure' })}
                  className="rounded border border-terminal-border px-2 py-1 text-[10px] text-terminal-white hover:border-terminal-muted"
                >
                  Equity Cure
                </button>
                <button
                  onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'forced_restructuring' })}
                  className="rounded border border-terminal-amber px-2 py-1 text-[10px] text-terminal-amber"
                >
                  Forced Restructuring
                </button>
                <button
                  onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'write_off' })}
                  className="rounded border border-terminal-red px-2 py-1 text-[10px] text-terminal-red"
                >
                  Write Off
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {company.actionsTaken.length > 0 && (
        <div className="mt-3 border-t border-terminal-border pt-2 text-[10px] text-terminal-muted">
          Recent: {company.actionsTaken.slice(-3).map((record) => record.action).join(' -> ')}
        </div>
      )}
    </div>
  )
}

function ExecutionMetric({
  label,
  value,
  tone = 'white',
}: {
  label: string
  value: string
  tone?: 'green' | 'amber' | 'white'
}) {
  const toneClass = tone === 'green'
    ? 'text-terminal-green'
    : tone === 'amber'
      ? 'text-terminal-amber'
      : 'text-terminal-white'

  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-surface/80 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-terminal-muted">{label}</div>
      <div className={`mt-1 font-mono text-lg ${toneClass}`}>{value}</div>
    </div>
  )
}

function CompactMetric({
  label,
  value,
  warn = false,
  className,
}: {
  label: string
  value: string
  warn?: boolean
  className?: string
}) {
  return (
    <div className="text-xs">
      <div className="text-[10px] text-terminal-muted">{label}</div>
      <div className={`font-mono ${className ?? (warn ? 'text-terminal-red' : 'text-terminal-white')}`}>{value}</div>
    </div>
  )
}

function HealthBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px]">
        <span className="text-terminal-muted">{label}</span>
        <span className={`font-mono ${color}`}>{value}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-terminal-bg">
        <div
          className={`h-full rounded transition-all ${
            value >= 60 ? 'bg-terminal-green' : value >= 40 ? 'bg-terminal-amber' : 'bg-terminal-red'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
