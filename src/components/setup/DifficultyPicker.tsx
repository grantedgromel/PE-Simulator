import type { Difficulty } from '../../types/game'
import { useGameStore } from '../../store/gameStore'

const DIFFICULTIES: { id: Difficulty; label: string; subtitle: string; description: string }[] = [
  {
    id: 'Easy',
    label: 'Emerging Manager',
    subtitle: 'EASY',
    description: '2-3 competing bidders, forgiving covenants, mild random events. Best for first playthrough.',
  },
  {
    id: 'Normal',
    label: 'Established Mid-Market',
    subtitle: 'NORMAL',
    description: '3-5 bidders, standard covenants, balanced events. Realistic PE simulation.',
  },
  {
    id: 'Hard',
    label: 'Peak Market / Mega-Fund',
    subtitle: 'HARD',
    description: '5-8 bidders, tight markets, unreliable information. Winner\'s curse is real.',
  },
]

export function DifficultyPicker() {
  const { setup, setDifficulty } = useGameStore()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-terminal-muted uppercase tracking-wider">
        Difficulty
      </label>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            onClick={() => setDifficulty(diff.id)}
            className={`text-left px-4 py-3 rounded border transition-colors ${
              setup.difficulty === diff.id
                ? diff.id === 'Easy'
                  ? 'bg-terminal-green/10 border-terminal-green text-terminal-green'
                  : diff.id === 'Normal'
                    ? 'bg-terminal-amber/10 border-terminal-amber text-terminal-amber'
                    : 'bg-terminal-red/10 border-terminal-red text-terminal-red'
                : 'bg-terminal-surface border-terminal-border text-terminal-white hover:border-terminal-muted'
            }`}
          >
            <div className="text-xs font-mono text-terminal-muted mb-1">{diff.subtitle}</div>
            <div className="font-medium text-sm">{diff.label}</div>
            <div className="text-xs text-terminal-muted mt-1">{diff.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
