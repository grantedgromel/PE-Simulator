import { useGameStore } from '../../store/gameStore'
import { determineFundraisingOutcome, generatePostExitFates } from '../../engine/fundraisingEngine'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'

export function Fundraising() {
  const {
    fund, exitResults, exitedCompanies, difficulty, seed,
    currentFundCycle, startNextFund, endGame,
  } = useGameStore()

  const result = determineFundraisingOutcome(
    fund, exitResults, fund.reputationScore, fund.lpTrustScore, difficulty,
  )

  const postExitFates = generatePostExitFates(exitedCompanies, seed)
  const isLastFund = currentFundCycle >= 3

  return (
    <div className="h-full flex flex-col items-center justify-center bg-terminal-bg overflow-y-auto">
      <div className="w-full max-w-3xl px-6 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-terminal-amber tracking-widest">
            FUND TRANSITION
          </h1>
          <p className="text-terminal-muted font-mono text-sm mt-1">
            {fund.name} — Fund {currentFundCycle} Complete
          </p>
        </div>

        {/* Track Record */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Track Record</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-terminal-muted">Net MOIC:</span> <span className={`font-mono ${(fund.netMoic ?? 0) >= 2.0 ? 'text-terminal-green' : 'text-terminal-white'}`}>{fund.netMoic !== null ? formatMultiple(fund.netMoic) : '—'}</span></div>
            <div><span className="text-terminal-muted">DPI:</span> <span className="font-mono text-terminal-white">{formatMultiple(fund.dpi)}</span></div>
            <div><span className="text-terminal-muted">GP Carry:</span> <span className="font-mono text-terminal-green">{formatCurrency(fund.gpTotalCarry)}</span></div>
          </div>
        </div>

        {/* Post-Exit Fates */}
        {postExitFates.length > 0 && (
          <div className="bg-terminal-surface border border-terminal-border rounded p-4">
            <h3 className="text-xs font-mono text-terminal-amber uppercase mb-2">What Happened After You Left</h3>
            <div className="space-y-2">
              {postExitFates.map((fate, i) => (
                <p key={i} className="text-xs text-terminal-muted italic">
                  {fate.fate}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-terminal-border" />

        {/* Fundraising Result */}
        {!isLastFund ? (
          <div className={`bg-terminal-surface border rounded p-4 ${result.success ? 'border-terminal-green/30' : 'border-terminal-red/30'}`}>
            <h3 className="text-xs font-mono text-terminal-amber uppercase mb-2">
              Fund {currentFundCycle + 1} Fundraising
            </h3>

            {result.success ? (
              <div className="space-y-2">
                <p className="text-sm text-terminal-green font-mono">
                  Fund {currentFundCycle + 1}: {formatCurrency(result.newFundSize)} committed
                </p>
                <p className="text-xs text-terminal-muted">{result.reason}</p>
                <p className="text-xs text-terminal-muted">
                  LP retention: {formatPercent(result.lpRetentionRate)}
                </p>
                <button
                  onClick={() => startNextFund(result.newFundSize)}
                  className="w-full mt-3 py-3 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-sm rounded hover:bg-terminal-green/30 transition-colors"
                >
                  LAUNCH FUND {currentFundCycle + 1}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-terminal-red font-mono">Fundraising Failed</p>
                <p className="text-xs text-terminal-muted">{result.reason}</p>
                <button
                  onClick={endGame}
                  className="w-full mt-3 py-3 bg-terminal-red/20 border border-terminal-red text-terminal-red font-mono text-sm rounded hover:bg-terminal-red/30 transition-colors"
                >
                  GAME OVER
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-terminal-amber font-mono">Fund III Complete — Career Over</p>
            <button
              onClick={endGame}
              className="w-full py-3 bg-terminal-amber/20 border border-terminal-amber text-terminal-amber font-mono text-sm rounded hover:bg-terminal-amber/30 transition-colors"
            >
              VIEW FINAL SCORE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
