import type { PortfolioCompany } from '../../types/company'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'

interface CompanyCardProps {
  company: PortfolioCompany
}

export function CompanyCard({ company }: CompanyCardProps) {
  const moraleColor =
    company.morale >= 70
      ? 'text-terminal-green'
      : company.morale >= 40
        ? 'text-terminal-amber'
        : 'text-terminal-red'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-terminal-white font-medium text-sm">{company.name}</h3>
          <p className="text-terminal-muted text-xs">{company.subSector}</p>
        </div>
        <span className="text-xs font-mono text-terminal-muted">
          {company.quartersHeld}Q held
        </span>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-3">
        <CompanyStat label="Revenue" value={formatCurrency(company.revenue)} />
        <CompanyStat label="EBITDA" value={formatCurrency(company.ebitda)} />
        <CompanyStat label="Margin" value={formatPercent(company.ebitdaMargin)} />
        <CompanyStat label="Leverage" value={formatMultiple(company.leverageRatio)} />
        <CompanyStat label="Employees" value={String(company.employeeCount)} />
        <CompanyStat label="Morale" value={`${company.morale}`} className={moraleColor} />
      </div>
    </div>
  )
}

function CompanyStat({
  label,
  value,
  className = 'text-terminal-white',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="text-xs">
      <span className="text-terminal-muted">{label}: </span>
      <span className={`font-mono ${className}`}>{value}</span>
    </div>
  )
}
