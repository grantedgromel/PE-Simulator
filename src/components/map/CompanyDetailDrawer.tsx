import type { PortfolioCompany } from '../../types/company'
import { CompanyCard } from '../shared/CompanyCard'

interface CompanyDetailDrawerProps {
  company: PortfolioCompany
  onClose: () => void
}

/**
 * Slide-in panel that shows when a building is clicked on the iso map.
 * Surfaces the existing CompanyCard plus a header with sector badge and a
 * close affordance. Later milestones will add action buttons (Operations
 * phase), exit controls (Exits phase), and diligence notes here.
 */
export function CompanyDetailDrawer({ company, onClose }: CompanyDetailDrawerProps) {
  return (
    <>
      {/* Backdrop — click to dismiss. */}
      <div
        className="absolute inset-0 bg-black/30 z-30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-terminal-surface border-l border-terminal-border z-40 flex flex-col shadow-2xl"
        role="dialog"
        aria-label={`${company.name} details`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-terminal-muted">
              {company.sector}
            </div>
            <h2 className="text-sm font-medium text-terminal-white">{company.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-white text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-terminal-bg transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <CompanyCard company={company} />
        </div>
      </div>
    </>
  )
}
