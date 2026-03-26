import { useGameStore } from '../../store/gameStore'
import { formatCurrency } from '../../utils/formatters'

/**
 * React overlay for map elements that are easier to render as HTML
 * than PixiJS (EBITDA bars, tooltips, notifications).
 * Positioned absolutely on top of the PixiJS canvas.
 */
export function MapOverlay() {
  const { portfolioCompanies } = useGameStore()
  const activeCompanies = portfolioCompanies.filter((c) => c.status === 'Active')

  if (activeCompanies.length === 0) return null

  return (
    <div className="absolute top-2 left-2 space-y-1 pointer-events-none z-10">
      {/* Compact portfolio health summary */}
      <div className="bg-terminal-bg/80 border border-terminal-border/50 rounded px-2 py-1">
        <div className="text-[10px] font-mono text-terminal-muted uppercase mb-1">Portfolio Health</div>
        {activeCompanies.map((co) => {
          const healthPct = (co.morale + co.customerSatisfaction) / 2
          const barColor = healthPct > 60 ? 'bg-terminal-green' : healthPct > 35 ? 'bg-terminal-amber' : 'bg-terminal-red'
          const ebitdaChange = co.actionsTaken.length > 0
            ? co.actionsTaken[co.actionsTaken.length - 1].ebitdaImpact
            : 0

          return (
            <div key={co.id} className="flex items-center gap-2 text-[9px]">
              <span className="text-terminal-muted w-20 truncate">{co.name}</span>
              <div className="w-16 h-1.5 bg-terminal-border rounded overflow-hidden">
                <div className={`h-full ${barColor} rounded transition-all`} style={{ width: `${healthPct}%` }} />
              </div>
              <span className="text-terminal-white font-mono w-12 text-right">{formatCurrency(co.ebitda)}</span>
              {ebitdaChange !== 0 && (
                <span className={`font-mono ${ebitdaChange > 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {ebitdaChange > 0 ? '+' : ''}{formatCurrency(ebitdaChange)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
