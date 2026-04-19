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
    <div className="relative overflow-hidden rounded-2xl border border-terminal-border bg-terminal-surface/85 p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: [
            'radial-gradient(circle at top right, rgba(0, 255, 136, 0.14), transparent 34%)',
            'radial-gradient(circle at bottom left, rgba(255, 183, 0, 0.1), transparent 38%)',
          ].join(', '),
        }}
      />

      <div className="relative space-y-3">
        <div className="max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-terminal-amber">
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-xl font-semibold leading-tight text-terminal-white md:text-2xl">
              {title}
            </h2>
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-terminal-muted">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <LensCard label="Finance" accent="text-terminal-green" body={financeLens} />
          <LensCard label="Satire" accent="text-terminal-amber" body={satireLens} />
          <LensCard label="Goal" accent="text-terminal-blue" body={playerGoal} />
        </div>
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
    <div className="rounded-xl border border-terminal-border bg-terminal-bg/70 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[10px] font-mono uppercase tracking-[0.24em] ${accent}`}>
          {label}
        </p>
        <p className="text-xs font-medium text-terminal-white">
          {body}
        </p>
      </div>
    </div>
  )
}
