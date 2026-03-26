import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { ValueCreationAction } from '../../types/company'
import { formatCurrency, formatPercent, formatMultiple } from '../../utils/formatters'

const ACTIONS: { id: ValueCreationAction; label: string; description: string; color: string }[] = [
  {
    id: 'CostCutting',
    label: 'Cut Costs',
    description: 'EBITDA margin +2-4pp, headcount -10-15%. Delayed morale hit.',
    color: 'text-terminal-amber',
  },
  {
    id: 'RevenueEnhancement',
    label: 'Raise Prices',
    description: 'Revenue +5-10% immediately. Satisfaction bleeds over 2-4 quarters.',
    color: 'text-terminal-blue',
  },
  {
    id: 'OrganicInvestment',
    label: 'Invest in Growth',
    description: 'EBITDA dips short-term. Growth boost in 3-5 quarters.',
    color: 'text-terminal-green',
  },
  {
    id: 'AddOnAcquisition',
    label: 'Add-On',
    description: 'Bolt-on acquisition. Revenue jumps, integration risk.',
    color: 'text-terminal-green',
  },
  {
    id: 'DividendRecap',
    label: 'Div Recap',
    description: 'Extract cash via debt. Improves DPI, increases leverage.',
    color: 'text-terminal-amber',
  },
  {
    id: 'ManagementUpgrade',
    label: 'New Mgmt',
    description: 'Replace CEO. Transition disruption, then improvement.',
    color: 'text-terminal-blue',
  },
  {
    id: 'ConsultantEngagement',
    label: 'Consultant',
    description: '$1-3M cost. 40% helpful, 30% obvious, 30% waste.',
    color: 'text-terminal-muted',
  },
  {
    id: 'DoNothing',
    label: 'Do Nothing',
    description: 'Drift on baseline momentum.',
    color: 'text-terminal-muted',
  },
]

export function OperationsView() {
  const { portfolioCompanies } = useGameStore()
  const activeCompanies = portfolioCompanies.filter((c) => c.status === 'Active')

  if (activeCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <p className="font-mono">No portfolio companies to manage.</p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          Portfolio Operations
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          Choose one value creation action per company this quarter.
        </p>
      </div>

      <div className="space-y-4">
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
    executeCompanyAction, totalQuartersElapsed,
    generateAddOns, executeAddOnAcquisition, executeDividendRecapAction,
    resolveCovenantChoice, addOnTargets,
  } = useGameStore()
  const [selectedAction, setSelectedAction] = useState<ValueCreationAction | null>(null)
  const [showAddOns, setShowAddOns] = useState(false)
  const [recapAmount, setRecapAmount] = useState(0)
  const [showRecap, setShowRecap] = useState(false)

  const actionTakenThisQuarter = company.actionsTaken.some(
    (a) => a.quarter === totalQuartersElapsed,
  )

  const handleExecute = () => {
    if (!selectedAction || actionTakenThisQuarter) return

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

  const maxRecap = Math.max(0, (6.0 - company.leverageRatio) * company.ebitda)

  const moraleColor =
    company.morale >= 60 ? 'text-terminal-green' : company.morale >= 40 ? 'text-terminal-amber' : 'text-terminal-red'
  const satColor =
    company.customerSatisfaction >= 60 ? 'text-terminal-green' : company.customerSatisfaction >= 40 ? 'text-terminal-amber' : 'text-terminal-red'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-terminal-white font-medium">{company.name}</h3>
          <p className="text-terminal-muted text-xs">
            {company.subSector} — {company.quartersHeld}Q held
          </p>
        </div>
        {company.covenantBreached && (
          <span className="text-xs font-mono text-terminal-red bg-terminal-red/10 px-2 py-0.5 rounded">
            COVENANT BREACH
          </span>
        )}
        {actionTakenThisQuarter && (
          <span className="text-xs font-mono text-terminal-green bg-terminal-green/10 px-2 py-0.5 rounded">
            ACTION TAKEN
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <CompactMetric label="Revenue" value={formatCurrency(company.revenue)} />
        <CompactMetric label="EBITDA" value={formatCurrency(company.ebitda)} />
        <CompactMetric label="Margin" value={formatPercent(company.ebitdaMargin)} />
        <CompactMetric label="Leverage" value={formatMultiple(company.leverageRatio)} warn={company.leverageRatio > 5} />
      </div>

      {/* Health Bars */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <HealthBar label="Morale" value={company.morale} color={moraleColor} />
        <HealthBar label="Cust. Satisfaction" value={company.customerSatisfaction} color={satColor} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        <CompactMetric label="Interest Coverage" value={`${company.interestCoverage}x`} warn={company.interestCoverage < 2} />
        <CompactMetric label="Employees" value={String(company.employeeCount)} />
        <CompactMetric label="Growth Rate" value={formatPercent(company.revenueGrowthRate)} />
        <CompactMetric label="Valuation" value={formatCurrency(company.currentImpliedValuation)} />
        <CompactMetric label="Fragility" value={`${company.fragility}/100`} warn={company.fragility > 50} />
        <CompactMetric label="Add-Ons" value={String(company.addOnCount)} />
        <CompactMetric label="Mgmt Quality" value={`${company.managementQuality}/100`} />
        <CompactMetric label="Div Recaps" value={formatCurrency(company.dividendRecapTotal)} />
      </div>

      {/* Action Selection */}
      {!actionTakenThisQuarter && (
        <div className="border-t border-terminal-border pt-3">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-1 mb-2">
            {ACTIONS.map((action) => {
              const isRepeatCut = action.id === 'CostCutting' && company.costCutCount > 0
              return (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`text-left px-2 py-2 rounded border text-xs transition-colors ${
                    selectedAction === action.id
                      ? 'border-terminal-green bg-terminal-green/10'
                      : 'border-terminal-border hover:border-terminal-muted'
                  }`}
                >
                  <div className={`font-mono text-[11px] ${action.color}`}>{action.label}</div>
                  <p className="text-[10px] text-terminal-muted mt-0.5">{action.description}</p>
                  {isRepeatCut && (
                    <p className="text-[10px] text-terminal-red mt-0.5">
                      Diminishing returns (cut #{company.costCutCount + 1})
                    </p>
                  )}
                </button>
              )
            })}
          </div>
          {selectedAction && !showAddOns && !showRecap && (
            <button
              onClick={handleExecute}
              className="w-full py-2 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-xs rounded hover:bg-terminal-green/30 transition-colors"
            >
              EXECUTE: {ACTIONS.find((a) => a.id === selectedAction)?.label}
            </button>
          )}

          {/* Add-On Target Picker */}
          {showAddOns && addOnTargets.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-terminal-muted">Select add-on target:</p>
              {addOnTargets.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-2 bg-terminal-bg rounded border border-terminal-border text-xs">
                  <div>
                    <span className="text-terminal-white">{t.name}</span>
                    <span className="text-terminal-muted ml-2">Rev: {formatCurrency(t.revenue)} | EBITDA: {formatCurrency(t.ebitda)} | {formatMultiple(t.askingMultiple)}</span>
                  </div>
                  <button
                    onClick={() => { executeAddOnAcquisition(company.id, t); setShowAddOns(false); setSelectedAction(null) }}
                    className="px-2 py-1 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-[10px] rounded"
                  >
                    ACQUIRE
                  </button>
                </div>
              ))}
              <button onClick={() => { setShowAddOns(false); setSelectedAction(null) }} className="text-xs text-terminal-muted hover:text-terminal-white">Cancel</button>
            </div>
          )}

          {/* Dividend Recap Slider */}
          {showRecap && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-terminal-muted">Recap amount (max: {formatCurrency(maxRecap)}):</p>
              <input
                type="range" min={0} max={maxRecap} step={0.5} value={recapAmount}
                onChange={(e) => setRecapAmount(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs font-mono text-terminal-white">{formatCurrency(recapAmount)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { executeDividendRecapAction(company.id, recapAmount); setShowRecap(false); setSelectedAction(null) }}
                  disabled={recapAmount <= 0}
                  className="flex-1 py-1 bg-terminal-green/15 border border-terminal-green text-terminal-green font-mono text-xs rounded disabled:opacity-30"
                >
                  EXECUTE RECAP
                </button>
                <button onClick={() => { setShowRecap(false); setSelectedAction(null) }} className="text-xs text-terminal-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Covenant Breach Actions */}
          {company.covenantChoicePending && (
            <div className="mt-2 p-2 bg-terminal-red/10 border border-terminal-red/30 rounded space-y-1">
              <p className="text-xs text-terminal-red font-mono">COVENANT BREACH — Choose action:</p>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'negotiate_waiver' })} className="px-2 py-1 text-[10px] border border-terminal-border rounded text-terminal-white hover:border-terminal-muted">Negotiate Waiver ($0.75M)</button>
                <button onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'equity_cure' })} className="px-2 py-1 text-[10px] border border-terminal-border rounded text-terminal-white hover:border-terminal-muted">Equity Cure</button>
                <button onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'forced_restructuring' })} className="px-2 py-1 text-[10px] border border-terminal-border rounded text-terminal-amber hover:border-terminal-amber">Forced Restructuring</button>
                <button onClick={() => resolveCovenantChoice({ companyId: company.id, type: 'write_off' })} className="px-2 py-1 text-[10px] border border-terminal-red rounded text-terminal-red hover:bg-terminal-red/10">Write Off</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Actions */}
      {company.actionsTaken.length > 0 && (
        <div className="border-t border-terminal-border pt-2 mt-2">
          <div className="text-[10px] text-terminal-muted">
            Recent: {company.actionsTaken.slice(-3).map((a) => a.action).join(' → ')}
          </div>
        </div>
      )}
    </div>
  )
}

function CompactMetric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-xs">
      <div className="text-terminal-muted text-[10px]">{label}</div>
      <div className={`font-mono ${warn ? 'text-terminal-red' : 'text-terminal-white'}`}>{value}</div>
    </div>
  )
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-terminal-muted">{label}</span>
        <span className={`font-mono ${color}`}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-terminal-bg rounded overflow-hidden">
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
