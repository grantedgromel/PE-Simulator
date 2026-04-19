import type { Sector } from '../../types/game'
import { useGameStore } from '../../store/gameStore'

const SECTORS: { id: Sector; label: string; description: string }[] = [
  {
    id: 'Healthcare',
    label: 'Healthcare Services',
    description: 'Dental, dermatology, veterinary clinics. Staffing cuts punish harder, regulators arrive faster, and patient trust matters.',
  },
  {
    id: 'BusinessServices',
    label: 'Business Services',
    description: 'Staffing, waste management, facilities. Labor execution drives retention, and service misses kill contracts quickly.',
  },
  {
    id: 'Consumer',
    label: 'Consumer / Restaurants',
    description: 'Fast-casual, fitness, retail. Price hikes hit hardest here; brand damage and review collapse are very real.',
  },
  {
    id: 'Technology',
    label: 'Technology / Software',
    description: 'Vertical SaaS, IT services, MSPs. Talent and support quality drive churn; reinvestment pays off more.',
  },
  {
    id: 'Industrial',
    label: 'Industrial / Manufacturing',
    description: 'Specialty chemicals, packaging, building products. Deferred maintenance and thin staffing turn into quality and plant-risk events.',
  },
]

export function SectorPicker() {
  const { setup, setSector } = useGameStore()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-terminal-muted uppercase tracking-wider">
        Sector Focus
      </label>
      <div className="grid gap-2">
        {SECTORS.map((sector) => (
          <button
            key={sector.id}
            onClick={() => setSector(sector.id)}
            className={`text-left px-4 py-3 rounded border transition-colors ${
              setup.sector === sector.id
                ? 'bg-terminal-green/10 border-terminal-green text-terminal-green'
                : 'bg-terminal-surface border-terminal-border text-terminal-white hover:border-terminal-muted'
            }`}
          >
            <div className="font-medium text-sm">{sector.label}</div>
            <div className="text-xs text-terminal-muted mt-0.5">{sector.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
