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
    description: 'Revenue +5-10% immediately. Customer satisfaction bleeds over 2-4 quarters.',
    color: 'text-terminal-blue',
  },
  {
    id: 'OrganicInvestment',
    label: 'Invest in Growth',
    description: 'EBITDA dips short-term. Growth rate +2-5pp in 3-5 quarters. Morale boost.',
    color: 'text-terminal-green',
  },
  {
    id: 'DoNothing',
    label: 'Do Nothing',
    description: 'Company drifts on baseline momentum. No action, no risk.',
    color: 'text-terminal-muted',
  },
]

export function OperationsView() {
  const { portfolioCompanies } = useGameStore()

  if (portfolioCompanies.length === 0) {
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
        {portfolioCompanies.map((company) => (
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
  const { executeCompanyAction, totalQuartersElapsed } = useGameStore()
  const [selectedAction, setSelectedAction] = useState<ValueCreationAction | null>(null)

  // Check if action already taken this quarter
  const actionTakenThisQuarter = company.actionsTaken.some(
    (a) => a.quarter === totalQuartersElapsed,
  )

  const handleExecute = () => {
    if (selectedAction && !actionTakenThisQuarter) {
      executeCompanyAction(company.id, selectedAction)
      setSelectedAction(null)
    }
  }

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

      <div className="grid grid-cols-2 gap-3 mb-3">
        <CompactMetric label="Interest Coverage" value={`${company.interestCoverage}x`} warn={company.interestCoverage < 2} />
        <CompactMetric label="Employees" value={String(company.employeeCount)} />
        <CompactMetric label="Growth Rate" value={formatPercent(company.revenueGrowthRate)} />
        <CompactMetric label="Valuation" value={formatCurrency(company.currentImpliedValuation)} />
      </div>

      {/* Action Selection */}
      {!actionTakenThisQuarter && (
        <div className="border-t border-terminal-border pt-3">
          <div className="grid grid-cols-4 gap-2 mb-2">
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
          {selectedAction && (
            <button
              onClick={handleExecute}
              className="w-full py-2 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-xs rounded hover:bg-terminal-green/30 transition-colors"
            >
              EXECUTE: {ACTIONS.find((a) => a.id === selectedAction)?.label}
            </button>
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
