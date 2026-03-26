interface CapitalStackVisualProps {
  seniorPct: number
  mezzaninePct: number
  equityPct: number
  mgmtRolloverPct: number // % of equity
}

export function CapitalStackVisual({ seniorPct, mezzaninePct, equityPct, mgmtRolloverPct }: CapitalStackVisualProps) {
  const fundEquityPct = equityPct * (1 - mgmtRolloverPct)
  const rolloverPct = equityPct * mgmtRolloverPct

  return (
    <div className="w-full">
      <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Capital Stack</h4>
      <div className="h-48 w-full flex flex-col rounded overflow-hidden border border-terminal-border">
        {/* Equity (top) */}
        {rolloverPct > 0.001 && (
          <div
            className="bg-emerald-700/60 flex items-center justify-center text-[10px] font-mono text-terminal-white transition-all"
            style={{ flex: rolloverPct }}
          >
            {rolloverPct > 0.05 && `Rollover ${(mgmtRolloverPct * 100).toFixed(0)}%`}
          </div>
        )}
        <div
          className="bg-terminal-green/30 flex items-center justify-center text-xs font-mono text-terminal-green transition-all"
          style={{ flex: fundEquityPct }}
        >
          {fundEquityPct > 0.08 && `Equity ${(equityPct * 100).toFixed(0)}%`}
        </div>

        {/* Mezzanine */}
        {mezzaninePct > 0.001 && (
          <div
            className="bg-terminal-amber/30 flex items-center justify-center text-xs font-mono text-terminal-amber transition-all"
            style={{ flex: mezzaninePct }}
          >
            {mezzaninePct > 0.05 && `Mezz ${(mezzaninePct * 100).toFixed(0)}%`}
          </div>
        )}

        {/* Senior Debt (bottom) */}
        <div
          className="bg-terminal-blue/30 flex items-center justify-center text-xs font-mono text-terminal-blue transition-all"
          style={{ flex: seniorPct }}
        >
          {seniorPct > 0.05 && `Senior ${(seniorPct * 100).toFixed(0)}%`}
        </div>
      </div>
    </div>
  )
}
