import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple } from '../../utils/formatters'
import { getLegacyStatement } from '../../data/flavorText'

const GRADE_COLORS: Record<string, string> = {
  S: 'text-terminal-green',
  A: 'text-terminal-green',
  B: 'text-terminal-amber',
  C: 'text-terminal-amber',
  D: 'text-terminal-red',
  F: 'text-terminal-red',
}

export function GameOver() {
  const { finalScore, returnToMenu } = useGameStore()

  if (!finalScore) {
    return (
      <div className="h-full flex items-center justify-center bg-terminal-bg">
        <button onClick={returnToMenu} className="text-terminal-muted font-mono">Return to Menu</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-terminal-bg overflow-y-auto">
      <div className="w-full max-w-3xl px-6 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-mono font-bold text-terminal-green tracking-widest">
            CAREER COMPLETE
          </h1>
        </div>

        {/* Dual Grades */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-terminal-surface border border-terminal-border rounded p-6 text-center">
            <div className="text-xs text-terminal-muted font-mono uppercase mb-2">Return Grade</div>
            <div className={`text-6xl font-mono font-bold ${GRADE_COLORS[finalScore.returnGrade]}`}>
              {finalScore.returnGrade}
            </div>
            <div className="text-sm text-terminal-white font-mono mt-2">
              {formatMultiple(finalScore.weightedNetMoic)} Net MOIC
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded p-6 text-center">
            <div className="text-xs text-terminal-muted font-mono uppercase mb-2">Human Impact Grade</div>
            <div className={`text-6xl font-mono font-bold ${GRADE_COLORS[finalScore.humanImpactGrade]}`}>
              {finalScore.humanImpactGrade}
            </div>
            <div className="text-sm text-terminal-muted font-mono mt-2">
              {finalScore.totalEmployeesImpacted.toLocaleString()} employees
            </div>
          </div>
        </div>

        {/* Legacy Statement */}
        <div className="text-center px-8">
          <p className="text-sm text-terminal-muted italic">
            {getLegacyStatement(finalScore.returnGrade, finalScore.humanImpactGrade)}
          </p>
        </div>

        {/* Personal Economics */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h3 className="text-xs font-mono text-terminal-amber uppercase mb-3">Your Personal Economics</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-terminal-muted text-xs">Total Carry Earned</div>
              <div className="font-mono text-terminal-green text-lg">{formatCurrency(finalScore.totalPersonalCarry)}</div>
            </div>
            <div>
              <div className="text-terminal-muted text-xs">Total Management Fee Income</div>
              <div className="font-mono text-terminal-white text-lg">{formatCurrency(finalScore.totalManagementFeeIncome)}</div>
            </div>
          </div>
        </div>

        {/* Fund-by-Fund Results */}
        <div className="bg-terminal-surface border border-terminal-border rounded p-4">
          <h3 className="text-xs font-mono text-terminal-muted uppercase mb-3">Fund Results</h3>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-terminal-muted">
                <th className="text-left py-1">Fund</th>
                <th className="text-right py-1">Size</th>
                <th className="text-right py-1">Net MOIC</th>
                <th className="text-right py-1">DPI</th>
                <th className="text-right py-1">Deals</th>
                <th className="text-right py-1">Write-Offs</th>
                <th className="text-right py-1">Carry</th>
              </tr>
            </thead>
            <tbody>
              {finalScore.funds.map((f) => (
                <tr key={f.fundNumber} className="border-t border-terminal-border/50">
                  <td className="text-terminal-white py-1">Fund {['I', 'II', 'III'][f.fundNumber - 1]}</td>
                  <td className="text-right text-terminal-white py-1">{formatCurrency(f.committedCapital)}</td>
                  <td className={`text-right py-1 ${(f.netMoic ?? 0) >= 2 ? 'text-terminal-green' : (f.netMoic ?? 0) < 1 ? 'text-terminal-red' : 'text-terminal-white'}`}>
                    {f.netMoic !== null ? formatMultiple(f.netMoic) : '—'}
                  </td>
                  <td className="text-right text-terminal-white py-1">{formatMultiple(f.dpi)}</td>
                  <td className="text-right text-terminal-white py-1">{f.dealsCompleted}</td>
                  <td className={`text-right py-1 ${f.writeOffs > 0 ? 'text-terminal-red' : 'text-terminal-muted'}`}>{f.writeOffs}</td>
                  <td className="text-right text-terminal-green py-1">{formatCurrency(f.totalPersonalCarry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cumulative */}
        <div className="text-center text-xs text-terminal-muted font-mono">
          Net-to-LP: {formatCurrency(finalScore.cumulativeNetToLP)} across {finalScore.funds.length} fund{finalScore.funds.length > 1 ? 's' : ''}
        </div>

        <div className="border-t border-terminal-border" />

        <button
          onClick={returnToMenu}
          className="w-full py-4 bg-terminal-surface border border-terminal-border text-terminal-white font-mono rounded hover:border-terminal-muted transition-colors"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}
