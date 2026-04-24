import { useGameStore } from '../../store/gameStore'

export function NameGenerator() {
  const { setup, setFundName, rerollFundName } = useGameStore()

  return (
    <div className="space-y-2">
      <label
        className="block font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
        style={{ color: 'var(--color-ink)', opacity: 0.6 }}
      >
        Fund Name
      </label>
      <div className="flex gap-2">
        <div
          className="flex-1 rounded-xl border-[3px] border-dashed pe-pop"
          style={{
            borderColor: 'var(--color-ink)',
            background: 'var(--color-paper)',
            padding: '14px 18px',
          }}
          key={setup.fundName}
        >
          <input
            type="text"
            value={setup.fundName}
            onChange={(e) => setFundName(e.target.value)}
            className="w-full bg-transparent text-2xl font-extrabold outline-none"
            style={{ color: 'var(--color-ink)', letterSpacing: '-0.01em' }}
            placeholder="Enter fund name…"
          />
        </div>
        <button
          onClick={rerollFundName}
          className="pe-bigbtn pe-bigbtn-orange font-mono text-sm"
          title="Generate new name"
        >
          ⟳ Reroll
        </button>
      </div>
    </div>
  )
}
