interface MetricCardProps {
  label: string
  value: string
  change?: number
  size?: 'sm' | 'md'
}

export function MetricCard({ label, value, change, size = 'md' }: MetricCardProps) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-3">
      <div className="text-[10px] text-terminal-muted font-mono uppercase tracking-wider">
        {label}
      </div>
      <div className={`font-mono text-terminal-white ${size === 'md' ? 'text-lg' : 'text-sm'} mt-1`}>
        {value}
      </div>
      {change !== undefined && (
        <div
          className={`text-xs font-mono mt-0.5 ${
            change > 0
              ? 'text-terminal-green'
              : change < 0
                ? 'text-terminal-red'
                : 'text-terminal-muted'
          }`}
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(1)}%
        </div>
      )}
    </div>
  )
}
