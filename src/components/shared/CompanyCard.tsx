import type { PortfolioCompany } from '../../types/company'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'
import { getStakeholderOutcomeScore } from '../../engine/consequenceEngine'

interface CompanyCardProps {
  company: PortfolioCompany
}

const toneFor = (n: number) =>
  n >= 70 ? 'var(--color-arcade-green)' : n >= 40 ? 'var(--color-orange)' : 'var(--color-pink)'

export function CompanyCard({ company }: CompanyCardProps) {
  const humanScore = getStakeholderOutcomeScore(company)
  const initials = company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: 'var(--color-cream)',
        border: '2.5px solid var(--color-ink)',
        boxShadow: '3px 3px 0 var(--color-ink)',
        color: 'var(--color-ink)',
      }}
    >
      {/* Title bar — ticker + name + held tag */}
      <div className="flex items-center gap-3 border-b-2 px-3 py-2.5" style={{ borderColor: 'var(--color-ink)' }}>
        <div className="pe-ticker" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--color-paper)' }}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-extrabold leading-tight" style={{ letterSpacing: '-0.01em' }}>
            {company.name}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em]" style={{ opacity: 0.6 }}>
            {company.subSector}
          </p>
        </div>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            border: '2px solid var(--color-ink)',
            borderRadius: 6,
            padding: '2px 7px',
            background: 'var(--color-lime)',
          }}
        >
          {company.quartersHeld}Q HELD
        </span>
      </div>

      {/* Stats — CIM-style 4-up */}
      <div className="grid grid-cols-4 border-b-2" style={{ borderColor: 'var(--color-ink)' }}>
        <CIMStat label="Revenue" value={formatCurrency(company.revenue)} />
        <CIMStat label="EBITDA" value={formatCurrency(company.ebitda)} />
        <CIMStat label="Margin" value={formatPercent(company.ebitdaMargin)} />
        <CIMStat label="Leverage" value={formatMultiple(company.leverageRatio)} last />
      </div>

      {/* Meta row */}
      <div
        className="grid grid-cols-2 gap-2 border-b px-3 py-2 font-mono text-[11px] font-bold"
        style={{ borderColor: 'rgba(26,24,51,0.2)', borderStyle: 'dashed' }}
      >
        <div>
          <span className="text-[9px] uppercase tracking-[0.12em]" style={{ opacity: 0.55 }}>Heads </span>
          {company.employeeCount}
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-[0.12em]" style={{ opacity: 0.55 }}>Score </span>
          <span style={{ color: toneFor(humanScore) }}>{humanScore}</span>
        </div>
      </div>

      {/* Ops sentiment row */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em]" style={{ opacity: 0.6 }}>
          MORALE
        </span>
        <div className="pe-meter" style={{ height: 8 }}>
          <div className="pe-meter-fill" style={{ width: `${company.morale}%`, background: toneFor(company.morale) }} />
        </div>
        <span className="font-mono text-[12px] font-extrabold" style={{ color: toneFor(company.morale) }}>
          {company.morale}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em]" style={{ opacity: 0.6 }}>
          TRUST
        </span>
        <div className="pe-meter" style={{ height: 8 }}>
          <div
            className="pe-meter-fill"
            style={{ width: `${company.communityTrust}%`, background: toneFor(company.communityTrust) }}
          />
        </div>
        <span className="font-mono text-[12px] font-extrabold" style={{ color: toneFor(company.communityTrust) }}>
          {company.communityTrust}
        </span>
      </div>
    </div>
  )
}

function CIMStat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="px-2.5 py-2"
      style={{
        background: 'var(--color-paper)',
        borderRight: last ? 'none' : '1.5px dashed rgba(26,24,51,0.25)',
      }}
    >
      <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.12em]" style={{ opacity: 0.6 }}>
        {label}
      </div>
      <div className="mt-1 font-mono text-[14px] font-extrabold" style={{ letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  )
}
