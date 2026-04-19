import { useGameStore } from '../../store/gameStore'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'
import {
  getOperationsExecutionBudget,
  getOperationsExecutionSpent,
  getSourcingCapacity,
  getStaffedPortfolioCompanyIds,
} from '../../engine/turnPressure'
import { Portrait } from '../shared/Portrait'
import type { TeamMember } from '../../types/team'

export function Sidebar() {
  const { fund, portfolioCompanies, currentDeals, totalQuartersElapsed, teamMembers } = useGameStore()

  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued').length
  const availableDeals = currentDeals.filter((d) => d.status === 'Available').length
  const activePortfolio = portfolioCompanies.filter((company) => company.status === 'Active')
  const sourcingCapacity = getSourcingCapacity(teamMembers)
  const executionBudget = getOperationsExecutionBudget(teamMembers, activePortfolio)
  const executionSpent = getOperationsExecutionSpent(activePortfolio, totalQuartersElapsed)
  const staffedCompanies = getStaffedPortfolioCompanyIds(teamMembers, activePortfolio)

  return (
    <div className="w-64 bg-terminal-surface border-l border-terminal-border flex flex-col overflow-y-auto flex-shrink-0">
      {/* Fund Metrics */}
      <div className="p-4 border-b border-terminal-border">
        <h3 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">
          Fund Metrics
        </h3>
        <div className="space-y-2">
          <SidebarMetric label="Committed" value={formatCurrency(fund.committedCapital)} />
          <SidebarMetric label="Deployed" value={formatCurrency(fund.deployedCapital)} />
          <SidebarMetric label="Remaining" value={formatCurrency(fund.remainingCapital)} />
          <div className="border-t border-terminal-border my-2" />
          <SidebarMetric label="Net IRR" value={fund.netIRR !== null ? formatPercent(fund.netIRR) : '—'} />
          <SidebarMetric label="Gross IRR" value={fund.grossIRR !== null ? formatPercent(fund.grossIRR) : '—'} />
          <SidebarMetric label="MOIC" value={fund.moic !== null ? formatMultiple(fund.moic) : '—'} />
          <SidebarMetric label="DPI" value={fund.dpi > 0 ? formatMultiple(fund.dpi) : '—'} />
          <SidebarMetric label="TVPI" value={fund.tvpi > 0 ? formatMultiple(fund.tvpi) : '—'} />
          <div className="border-t border-terminal-border my-2" />
          <SidebarMetric label="Reputation" value={`${fund.reputationScore}/100`} />
          <SidebarMetric label="LP Trust" value={`${fund.lpTrustScore}/100`} />
          <SidebarMetric label="Mgmt Fees" value={formatCurrency(fund.managementFeesCollected)} />
        </div>
      </div>

      {/* Deal Pipeline */}
      <div className="p-4 border-b border-terminal-border">
        <h3 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">
          Deal Pipeline
        </h3>
        <div className="space-y-1">
          <SidebarMetric label="Available" value={String(availableDeals)} />
          <SidebarMetric label="Pursued" value={String(pursuedDeals)} />
          <SidebarMetric label="Shortlist Cap" value={String(sourcingCapacity)} />
        </div>
      </div>

      <div className="p-4 border-b border-terminal-border">
        <h3 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">
          Quarter Pressure
        </h3>
        <div className="space-y-1">
          <SidebarMetric label="Exec Budget" value={`${executionSpent}/${executionBudget}`} />
          <SidebarMetric label="Staffed Assets" value={`${staffedCompanies.size}/${activePortfolio.length}`} />
        </div>
      </div>

      {/* Team roster */}
      <div className="p-4 border-b border-terminal-border">
        <h3 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">
          Team ({teamMembers.filter((tm) => tm.status === 'Active').length})
        </h3>
        {teamMembers.length === 0 ? (
          <p className="text-xs text-terminal-muted italic">No team yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {teamMembers.map((tm) => (
              <TeamRosterTile key={tm.id} member={tm} />
            ))}
          </div>
        )}
      </div>

      {/* Portfolio */}
      <div className="p-4 flex-1">
        <h3 className="text-xs font-mono text-terminal-amber uppercase tracking-wider mb-3">
          Portfolio ({portfolioCompanies.length})
        </h3>
        {portfolioCompanies.length === 0 ? (
          <p className="text-xs text-terminal-muted italic">No portfolio companies yet</p>
        ) : (
          <div className="space-y-2">
            {portfolioCompanies.map((co) => (
              <div
                key={co.id}
                className="text-xs p-2 bg-terminal-bg rounded border border-terminal-border"
              >
                <div className="text-terminal-white font-medium truncate">{co.name}</div>
                <div className="text-terminal-muted mt-0.5">
                  EBITDA: {formatCurrency(co.ebitda)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quarter counter */}
      <div className="p-4 border-t border-terminal-border">
        <div className="text-xs text-terminal-muted font-mono text-center">
          Quarter {totalQuartersElapsed + 1} of Fund Life
        </div>
      </div>
    </div>
  )
}

function SidebarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className="font-mono text-terminal-white">{value}</span>
    </div>
  )
}

const ROLE_ABBR: Record<TeamMember['role'], string> = {
  Principal: 'P',
  OperatingPartner: 'OP',
  VP: 'VP',
  Associate: 'A',
  PlacementAgent: 'PA',
}

function TeamRosterTile({ member }: { member: TeamMember }) {
  const ringColor =
    member.status !== 'Active'
      ? '#6b6b7b'
      : member.currentAssignments.length >= member.capacity
        ? '#ff4444'
        : member.currentAssignments.length > 0
          ? '#ffb700'
          : '#00ff88'

  return (
    <div
      className="flex flex-col items-center text-center"
      title={`${member.name} · ${member.role} · ${member.currentAssignments.length}/${member.capacity} assignments · morale ${member.morale}`}
    >
      <Portrait
        subject={{ kind: 'team', role: member.role, seed: member.portraitSeed }}
        size={44}
        rounded="full"
        ringColor={ringColor}
      />
      <div className="mt-1 text-[9px] font-mono text-terminal-muted uppercase tracking-wider">
        {ROLE_ABBR[member.role]}
      </div>
      <div className="text-[9px] text-terminal-white truncate w-full">
        {member.name.split(' ')[0]}
      </div>
    </div>
  )
}
