interface PhaseBriefProps {
  eyebrow: string
  title: string
  description: string
  financeLens: string
  satireLens: string
  playerGoal: string
}

export function PhaseBrief({
  eyebrow,
  title,
  description,
  financeLens,
  satireLens,
  playerGoal,
}: PhaseBriefProps) {
  return (
    <div className="pe-panel" style={{ background: 'var(--color-cream)', padding: '20px 22px' }}>
      <span className="pe-panel-label">{eyebrow}</span>

      <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h2
          className="text-2xl font-extrabold leading-tight md:text-3xl"
          style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
        <p
          className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--color-ink)', opacity: 0.6 }}
        >
          {description}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <LensCard label="Finance" accent="var(--color-arcade-green)" body={financeLens} />
        <LensCard label="Satire" accent="var(--color-orange)" body={satireLens} />
        <LensCard label="Goal" accent="var(--color-pink)" body={playerGoal} />
      </div>
    </div>
  )
}

function LensCard({
  label,
  accent,
  body,
}: {
  label: string
  accent: string
  body: string
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: 'var(--color-paper)',
        border: '2px solid var(--color-ink)',
        boxShadow: '2px 2px 0 var(--color-ink)',
      }}
    >
      <p
        className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {label}
      </p>
      <p className="mt-1 text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--color-ink)' }}>
        {body}
      </p>
    </div>
  )
}
