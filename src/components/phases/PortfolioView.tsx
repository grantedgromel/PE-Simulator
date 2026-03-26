import { useGameStore } from '../../store/gameStore'
import { CompanyCard } from '../shared/CompanyCard'

export function PortfolioView() {
  const portfolioCompanies = useGameStore((s) => s.portfolioCompanies)

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          Portfolio Companies
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          Active portfolio companies and their current performance.
        </p>
      </div>

      {portfolioCompanies.length === 0 ? (
        <div className="text-center text-terminal-muted py-12 space-y-2">
          <p className="font-mono text-lg">No portfolio companies yet</p>
          <p className="text-xs">Win a deal through the sourcing and bidding process to add your first portfolio company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {portfolioCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  )
}
