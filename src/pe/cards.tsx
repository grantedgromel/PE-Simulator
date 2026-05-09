// Rome: Total War-style person cards + CIM-style company cards.
import type { CSSProperties } from 'react'
import { ARCHETYPES, type Person, type Deal, type PortfolioCompany } from './data'
import { HeatDots, Tag, Meter } from './ui'
import { PersonPortrait } from './portraits'
import { hasPortrait } from './portraitData'
import { CompanyIcon } from './companyArt'
import { hasCompanyIcon } from './companyIcons'

interface TraitRowProps {
  label: string
  value: number
  max?: number
  tone?: string
}

export function TraitRow({ label, value, max = 5, tone = '#1A1833' }: TraitRowProps) {
  return (
    <div className="pe-trait-row">
      <div className="pe-trait-label">{label.replace(/_/g, ' ')}</div>
      <div className="pe-trait-pips">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={'pe-trait-pip ' + (i < value ? 'on' : 'off')}
            style={i < value ? { background: tone, borderColor: tone } : undefined}
          />
        ))}
      </div>
      <div className="pe-trait-score">{value}</div>
    </div>
  )
}

interface PortraitTileProps {
  initials: string
  color?: string
  sigil?: string
  size?: number
  art?: string
}

export function PortraitTile({ initials, color = '#FF7A3C', sigil, size = 80, art }: PortraitTileProps) {
  const showArt = hasPortrait(art)
  return (
    <div className="pe-portrait" style={{ width: size, height: size, background: color }}>
      {showArt && art ? (
        <PersonPortrait id={art} bg={color} size={size} />
      ) : (
        <div className="pe-portrait-glyph" style={{ fontSize: size * 0.44 }}>{initials}</div>
      )}
      {sigil && <div className="pe-portrait-sigil">{sigil}</div>}
      <div className="pe-portrait-corner pe-portrait-corner-tl" />
      <div className="pe-portrait-corner pe-portrait-corner-tr" />
      <div className="pe-portrait-corner pe-portrait-corner-bl" />
      <div className="pe-portrait-corner pe-portrait-corner-br" />
    </div>
  )
}

type PersonCardVariant = 'full' | 'roster' | 'row' | 'mini'

interface PersonCardProps {
  person: Person
  variant?: PersonCardVariant
  onClick?: () => void
  selected?: boolean
}

export function PersonCard({ person, variant = 'full', onClick, selected = false }: PersonCardProps) {
  const arch = ARCHETYPES[person.archetype]
  if (!arch) return null

  if (variant === 'mini') {
    return (
      <div
        className={'pe-person-mini ' + (onClick ? 'clickable ' : '') + (selected ? 'selected ' : '')}
        onClick={onClick}
      >
        <PortraitTile initials={person.initials} color={arch.color} size={32} art={person.art} />
        <div className="pe-person-mini-body">
          <div className="pe-person-mini-name">{person.name}</div>
          <div className="pe-person-mini-role">{arch.label}</div>
        </div>
      </div>
    )
  }

  if (variant === 'row') {
    return (
      <div
        className={'pe-person-row ' + (onClick ? 'clickable ' : '') + (selected ? 'selected ' : '')}
        onClick={onClick}
      >
        <PortraitTile initials={person.initials} color={arch.color} sigil={arch.sigil} size={48} art={person.art} />
        <div className="pe-person-row-body">
          <div className="pe-person-row-name">{person.name}</div>
          <div className="pe-person-row-title">{person.title}</div>
        </div>
        <div className="pe-person-row-traits">
          {arch.traitKeys.slice(0, 3).map((k) => (
            <div key={k} className="pe-person-row-trait">
              <div className="pe-person-row-trait-label">{k.slice(0, 3)}</div>
              <div className="pe-person-row-trait-value">{person.traits[k]}</div>
            </div>
          ))}
        </div>
        <div className="pe-person-row-cost">
          <div className="pe-person-row-cost-label">ANNUAL</div>
          <div className="pe-person-row-cost-value">${person.cost.toFixed(1)}M</div>
        </div>
      </div>
    )
  }

  const compact = variant === 'roster'
  const cardStyle = { '--arch-color': arch.color } as CSSProperties

  return (
    <div
      className={'pe-person-card ' + (compact ? 'compact ' : '') + (onClick ? 'clickable ' : '') + (selected ? 'selected ' : '')}
      onClick={onClick}
      style={cardStyle}
    >
      <div className="pe-person-card-banner" style={{ background: arch.color }}>
        <div className="pe-person-card-banner-sigil">{arch.sigil}</div>
        <div className="pe-person-card-banner-arch">{arch.label.toUpperCase()}</div>
        <div className="pe-person-card-banner-tenure">{person.tenure}</div>
      </div>

      <div className="pe-person-card-head">
        <PortraitTile initials={person.initials} color={arch.color} sigil={arch.sigil} size={compact ? 64 : 84} art={person.art} />
        <div className="pe-person-card-namebox">
          <div className="pe-person-card-name">{person.name}</div>
          <div className="pe-person-card-title">{person.title}</div>
          <div className="pe-person-card-sector">
            <Tag tone="paper">{person.sector}</Tag>
          </div>
        </div>
      </div>

      <div className="pe-person-card-traits">
        {arch.traitKeys.map((k) => (
          <TraitRow key={k} label={k} value={person.traits[k] || 0} tone={arch.color} />
        ))}
      </div>

      {!compact && person.quirk && (
        <div className="pe-person-card-quirk">
          <div className="pe-person-card-quirk-label">TRAIT</div>
          <div className="pe-person-card-quirk-value">{person.quirk}</div>
        </div>
      )}
      {!compact && person.flavor && (
        <div className="pe-person-card-flavor">"{person.flavor}"</div>
      )}

      <div className="pe-person-card-foot">
        <div className="pe-person-card-foot-label">ANNUAL COMP</div>
        <div className="pe-person-card-foot-value">${person.cost.toFixed(1)}M</div>
      </div>
    </div>
  )
}

type CompanyLike = (Deal & { color?: string }) | PortfolioCompany
type CompanyCardVariant = 'full' | 'portfolio' | 'deal' | 'row'

interface CompanyCardProps {
  company: CompanyLike
  variant?: CompanyCardVariant
  onClick?: () => void
  selected?: boolean
}

function isDealShape(c: CompanyLike): c is Deal {
  return 'banker' in c
}

export function CompanyCard({ company, variant = 'portfolio', onClick, selected = false }: CompanyCardProps) {
  const isDeal = isDealShape(company)
  const color = (company as PortfolioCompany).color || '#FF7A3C'
  const initials = (company.name || '').split(' ').slice(0, 2).map((w) => w[0]).join('')
  const ticker = (company.name || '').replace(/[^A-Z]/g, '').slice(0, 4) || initials

  const ebitda = isDeal ? company.ebitda : (company as PortfolioCompany).currentEbitda
  const revenue = company.revenue
  const margin = ebitda && revenue ? (ebitda / revenue) * 100 : null

  if (variant === 'row') {
    const iconAvailable = hasCompanyIcon(company.art)
    return (
      <div
        className={'pe-co-row ' + (onClick ? 'clickable ' : '') + (selected ? 'selected ' : '')}
        onClick={onClick}
      >
        <div className="pe-co-row-swatch" style={{ background: color }}>
          {iconAvailable ? (
            <CompanyIcon art={company.art} size={44} />
          ) : (
            <div className="pe-co-row-initials">{initials}</div>
          )}
        </div>
        <div className="pe-co-row-body">
          <div className="pe-co-row-name">{company.name}</div>
          <div className="pe-co-row-sector">{company.sector}</div>
        </div>
        <div className="pe-co-row-stats">
          <div><span className="pe-co-row-k">EBITDA</span><span className="pe-co-row-v">${ebitda?.toFixed(1)}M</span></div>
          <div><span className="pe-co-row-k">REV</span><span className="pe-co-row-v">${revenue}M</span></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={'pe-co-card ' + variant + ' ' + (onClick ? 'clickable ' : '') + (selected ? 'selected ' : '')}
      onClick={onClick}
    >
      <div className="pe-co-card-titlebar">
        <div className="pe-co-card-ticker" style={{ background: color }}>
          {hasCompanyIcon(company.art) ? <CompanyIcon art={company.art} size={52} /> : ticker}
        </div>
        <div className="pe-co-card-title-text">
          <div className="pe-co-card-name">{company.name}</div>
          <div className="pe-co-card-sector">{company.sector}</div>
        </div>
        {isDeal ? (
          <div className="pe-co-card-status">
            <div className="pe-co-card-status-label">HEAT</div>
            <HeatDots heat={company.heat} />
          </div>
        ) : (
          <div className="pe-co-card-status">
            <div className="pe-co-card-status-label">HOLD</div>
            <div className="pe-co-card-status-value">{(company as PortfolioCompany).hold}Q</div>
          </div>
        )}
      </div>

      <div className="pe-co-card-stats">
        <div className="pe-co-card-stat">
          <div className="pe-co-card-stat-label">REVENUE</div>
          <div className="pe-co-card-stat-value">${revenue}M</div>
        </div>
        <div className="pe-co-card-stat">
          <div className="pe-co-card-stat-label">EBITDA</div>
          <div className="pe-co-card-stat-value">${ebitda?.toFixed(1)}M</div>
        </div>
        <div className="pe-co-card-stat">
          <div className="pe-co-card-stat-label">MARGIN</div>
          <div className="pe-co-card-stat-value">{margin ? margin.toFixed(0) + '%' : '—'}</div>
        </div>
        <div className="pe-co-card-stat">
          <div className="pe-co-card-stat-label">{isDeal ? 'ASK MULTIPLE' : 'LEVERAGE'}</div>
          <div className="pe-co-card-stat-value">
            {isDeal ? `${company.multiple?.toFixed(1)}×` : `${(company as PortfolioCompany).leverage?.toFixed(1)}×`}
          </div>
        </div>
      </div>

      <div className="pe-co-card-meta">
        {isDeal ? (
          <>
            <div><span className="pe-co-card-meta-k">BANKER</span> {company.banker}</div>
            <div><span className="pe-co-card-meta-k">PROCESS</span> {company.process}</div>
          </>
        ) : (
          <>
            <div><span className="pe-co-card-meta-k">ACQUIRED</span> {(company as PortfolioCompany).acquired}</div>
            <div><span className="pe-co-card-meta-k">ENTRY</span> {(company as PortfolioCompany).entryMultiple?.toFixed(1)}×</div>
          </>
        )}
      </div>

      {!isDeal && typeof (company as PortfolioCompany).satisfaction === 'number' && (
        <div className="pe-co-card-ops">
          <div className="pe-co-card-ops-label">OPS SENTIMENT</div>
          <Meter
            value={(company as PortfolioCompany).satisfaction}
            tone={(company as PortfolioCompany).satisfaction > 60 ? '#8BE04E' : (company as PortfolioCompany).satisfaction > 40 ? '#FF7A3C' : '#FF3DA5'}
            height={8}
          />
          <div className="pe-co-card-ops-val">{(company as PortfolioCompany).satisfaction}</div>
        </div>
      )}

      {isDeal && variant !== 'portfolio' && company.story && (
        <div className="pe-co-card-story">"{company.story}"</div>
      )}
    </div>
  )
}
