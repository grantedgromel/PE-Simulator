import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatFundCycle } from '../../utils/formatters'

export function LPReport() {
  const { fund, currentFundCycle, currentYear, portfolioCompanies, exitResults, submitLPReport } = useGameStore()

  // Find underperforming companies that need framing
  const underperformers = portfolioCompanies.filter((co) => {
    if (co.status !== 'Active') return false
    if (co.quartersHeld < 4) return false
    const coResult = exitResults.find((r) => r.companyId === co.id)
    if (coResult && coResult.grossMoic >= 1.5) return false
    // Check if EBITDA declining or low implied MOIC
    const impliedMoic = co.entryEquity > 0 ? Math.max(0, co.currentImpliedValuation - co.totalDebt) / co.entryEquity : 0
    return impliedMoic < 1.5 || co.revenueGrowthRate < 0
  })

  const [choices, setChoices] = useState<Record<string, 'honest' | 'spin' | 'omit'>>({})

  const allChosen = underperformers.every((co) => choices[co.id])

  const handleSubmit = () => {
    submitLPReport(choices)
  }

  // LP reaction
  const netMoic = fund.netMoic ?? fund.moic ?? 0
  const trustLevel = fund.lpTrustScore
  const lpQuote = trustLevel > 70 && netMoic > 1.5
    ? `"We're pleased with the portfolio's progress. Looking forward to the annual meeting." — LP Advisory Committee`
    : trustLevel > 40
      ? `"We have some questions about the portfolio companies you didn't mention. Can we schedule a call?" — LP Advisory Committee`
      : `"We've asked our team to conduct an independent review of the fund's holdings." — LP Advisory Committee`

  return (
    <div className="h-full flex flex-col items-center justify-center bg-terminal-bg overflow-y-auto">
      <div className="w-full max-w-3xl px-6 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-terminal-amber tracking-widest">
            LP ANNUAL REPORT
          </h1>
          <p className="text-terminal-muted font-mono text-sm mt-1">
            {fund.name} — {formatFundCycle(currentFundCycle)} — Year {currentYear}
          </p>
        </div>

        {/* Fund Summary */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h3 className="text-xs font-mono text-terminal-muted uppercase mb-3">Fund Performance Summary</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-terminal-muted">Committed:</span> <span className="font-mono text-terminal-white">{formatCurrency(fund.committedCapital)}</span></div>
            <div><span className="text-terminal-muted">Deployed:</span> <span className="font-mono text-terminal-white">{formatCurrency(fund.deployedCapital)}</span></div>
            <div><span className="text-terminal-muted">Distributions:</span> <span className="font-mono text-terminal-white">{formatCurrency(fund.totalDistributions)}</span></div>
            <div><span className="text-terminal-muted">Gross MOIC:</span> <span className="font-mono text-terminal-white">{fund.moic !== null ? formatMultiple(fund.moic) : '—'}</span></div>
            <div><span className="text-terminal-muted">Net MOIC:</span> <span className="font-mono text-terminal-white">{fund.netMoic !== null ? formatMultiple(fund.netMoic) : '—'}</span></div>
            <div><span className="text-terminal-muted">DPI:</span> <span className="font-mono text-terminal-white">{fund.dpi > 0 ? formatMultiple(fund.dpi) : '—'}</span></div>
          </div>
        </div>

        {/* Framing Choices */}
        {underperformers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-terminal-amber uppercase">Portfolio Company Framing</h3>
            <p className="text-xs text-terminal-muted">Choose how to present underperforming companies to LPs.</p>

            {underperformers.map((co) => {
              const impliedMoic = co.entryEquity > 0 ? Math.max(0, co.currentImpliedValuation - co.totalDebt) / co.entryEquity : 0

              return (
                <div key={co.id} className="bg-terminal-surface border border-terminal-border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-terminal-white text-sm">{co.name}</span>
                    <span className={`text-xs font-mono ${impliedMoic < 1 ? 'text-terminal-red' : 'text-terminal-amber'}`}>
                      Implied MOIC: {formatMultiple(impliedMoic)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <FramingButton
                      label="Honest"
                      description={`"${co.name} has underperformed. EBITDA ${co.revenueGrowthRate < 0 ? 'declined' : 'growth stalled'}. We are evaluating alternatives."`}
                      effect="LP Trust +3, Reputation +2"
                      selected={choices[co.id] === 'honest'}
                      onClick={() => setChoices({ ...choices, [co.id]: 'honest' })}
                      color="text-terminal-green"
                    />
                    <FramingButton
                      label="Spin"
                      description={`"${co.name} is in the early innings of its transformation. We see significant upside as operational initiatives take hold."`}
                      effect="LP Trust -2"
                      selected={choices[co.id] === 'spin'}
                      onClick={() => setChoices({ ...choices, [co.id]: 'spin' })}
                      color="text-terminal-amber"
                    />
                    <FramingButton
                      label="Omit"
                      description="Don't mention this company in the letter."
                      effect="LP Trust -1 (risk: -8 if LPs ask)"
                      selected={choices[co.id] === 'omit'}
                      onClick={() => setChoices({ ...choices, [co.id]: 'omit' })}
                      color="text-terminal-red"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* LP Reaction */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <p className="text-xs text-terminal-muted italic">{lpQuote}</p>
          <p className="text-xs text-terminal-muted mt-2">LP Trust: {fund.lpTrustScore}/100</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={underperformers.length > 0 && !allChosen}
          className="w-full py-3 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-sm rounded hover:bg-terminal-green/30 transition-colors disabled:opacity-30"
        >
          SUBMIT ANNUAL REPORT
        </button>
      </div>
    </div>
  )
}

function FramingButton({
  label, description, effect, selected, onClick, color,
}: {
  label: string; description: string; effect: string; selected: boolean; onClick: () => void; color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
        selected ? 'border-terminal-green bg-terminal-green/10' : 'border-terminal-border hover:border-terminal-muted'
      }`}
    >
      <span className={`font-mono ${color}`}>{label}</span>
      <span className="text-terminal-muted ml-2">({effect})</span>
      <p className="text-[10px] text-terminal-muted mt-0.5 italic">{description}</p>
    </button>
  )
}
