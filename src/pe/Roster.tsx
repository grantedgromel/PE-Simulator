import { useState } from 'react'
import { ARCHETYPES, TEAM, type ArchetypeId, type FundState } from './data'
import { PersonCard, CompanyCard } from './cards'
import type { ScreenId } from './PEApp'

interface RosterProps {
  fund: FundState
  onNav: (screen: ScreenId, payload?: string) => void
}

type FilterId = 'ALL' | 'COMPANIES' | ArchetypeId

const FILTERS: ReadonlyArray<{ id: FilterId; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'COMPANIES', label: 'Companies' },
  { id: 'SOURCING', label: 'Sourcing' },
  { id: 'DEAL_TEAM', label: 'Deal Team' },
  { id: 'OPERATING', label: 'Operating' },
]

export function Roster({ fund, onNav }: RosterProps) {
  const [filter, setFilter] = useState<FilterId>('ALL')
  const [selected, setSelected] = useState<string | null>(null)

  const archs = Object.values(ARCHETYPES)
  const showCompanies = filter === 'ALL' || filter === 'COMPANIES'
  const showArch = (id: ArchetypeId) => filter === 'ALL' || filter === id
  const teamByArch = (id: ArchetypeId) => TEAM.filter((p) => p.archetype === id)

  return (
    <div className="pe-roster">
      <div className="pe-roster-header">
        <div>
          <div className="pe-roster-title">ROSTER</div>
          <div className="pe-roster-sub">
            {TEAM.length} PEOPLE · {fund.portfolio.length} COMPANIES
          </div>
        </div>
        <div className="pe-roster-filters">
          {FILTERS.map((f) => (
            <div
              key={f.id}
              className={'pe-roster-filter ' + (filter === f.id ? 'active' : '')}
              onClick={() => setFilter(f.id)}
            >
              {f.label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {showCompanies && fund.portfolio.length > 0 && (
        <div className="pe-roster-section">
          <div className="pe-roster-section-title">PORTFOLIO COMPANIES · {fund.portfolio.length}</div>
          <div className="pe-roster-grid co-grid">
            {fund.portfolio.map((pc) => (
              <CompanyCard
                key={pc.id}
                company={pc}
                variant="portfolio"
                onClick={() => onNav('company', pc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {archs.map((a) => showArch(a.id) && (
        <div key={a.id} className="pe-roster-section">
          <div className="pe-roster-section-title">
            <span style={{ color: a.color }}>{a.sigil}</span> {a.label.toUpperCase()} · {teamByArch(a.id).length}
          </div>
          <div className="pe-roster-grid">
            {teamByArch(a.id).map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                variant="full"
                selected={selected === p.id}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
