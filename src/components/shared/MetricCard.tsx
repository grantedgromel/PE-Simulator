interface MetricCardProps {
  label: string
  value: string
  change?: number
  size?: 'sm' | 'md'
}

export function MetricCard({ label, value, change, size = 'md' }: MetricCardProps) {
  const changeColor =
    change === undefined
      ? undefined
      : change > 0
        ? 'var(--color-arcade-green)'
        : change < 0
          ? 'var(--color-pink)'
          : 'var(--color-cream)'

  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{
        background: 'var(--color-paper)',
        border: '2.5px solid var(--color-ink)',
        boxShadow: '2px 2px 0 var(--color-ink)',
        color: 'var(--color-ink)',
      }}
    >
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
        {label}
      </div>
      <div
        className={`mt-1 font-mono font-extrabold ${size === 'md' ? 'text-xl' : 'text-base'}`}
        style={{ color: 'var(--color-ink)' }}
      >
        {value}
      </div>
      {change !== undefined && (
        <div className="mt-1 font-mono text-[11px] font-bold" style={{ color: changeColor }}>
          {change > 0 ? '▲' : change < 0 ? '▼' : '–'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
