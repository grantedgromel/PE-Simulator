interface CovenantGaugeProps {
  headroom: number // 0-1
  ebitdaFloor: number
  currentEbitda: number
}

export function CovenantGauge({ headroom, ebitdaFloor, currentEbitda }: CovenantGaugeProps) {
  const pct = Math.max(0, Math.min(1, headroom))
  const color = pct > 0.30 ? 'bg-terminal-green' : pct > 0.15 ? 'bg-terminal-amber' : 'bg-terminal-red'
  const textColor = pct > 0.30 ? 'text-terminal-green' : pct > 0.15 ? 'text-terminal-amber' : 'text-terminal-red'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-terminal-muted">Covenant Headroom</span>
        <span className={`font-mono ${textColor}`}>
          {(pct * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-terminal-bg rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all`} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-terminal-muted mt-0.5">
        <span>Floor: ${ebitdaFloor.toFixed(1)}M</span>
        <span>Current: ${currentEbitda.toFixed(1)}M</span>
      </div>
    </div>
  )
}
