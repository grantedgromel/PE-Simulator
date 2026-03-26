import { useGameStore } from '../../store/gameStore'

export function NameGenerator() {
  const { setup, setFundName, rerollFundName } = useGameStore()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-terminal-muted uppercase tracking-wider">
        Fund Name
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={setup.fundName}
          onChange={(e) => setFundName(e.target.value)}
          className="flex-1 bg-terminal-surface border border-terminal-border rounded px-4 py-3 text-terminal-white font-mono text-lg focus:outline-none focus:border-terminal-green transition-colors"
          placeholder="Enter fund name..."
        />
        <button
          onClick={rerollFundName}
          className="px-4 py-3 bg-terminal-surface border border-terminal-border rounded text-terminal-amber hover:bg-terminal-surface-hover hover:border-terminal-amber transition-colors font-mono text-sm"
          title="Generate new name"
        >
          REROLL
        </button>
      </div>
    </div>
  )
}
