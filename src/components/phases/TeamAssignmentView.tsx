import { useGameStore } from '../../store/gameStore'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'

export function TeamAssignmentView() {
  const {
    teamMembers, currentDeals, portfolioCompanies,
    assignTeamMember, unassignTeamMember, promoteTeamMember,
  } = useGameStore()

  const activeMembers = teamMembers.filter((teamMember) => teamMember.status === 'Active' || teamMember.status === 'BurnedOut')
  const pursuedDeals = currentDeals.filter((deal) => deal.status === 'Pursued')
  const activeCompanies = portfolioCompanies.filter((company) => company.status === 'Active')

  return (
    <div className="p-6 overflow-y-auto h-full">
      <PhaseBrief {...PHASE_BRIEFS.teamAssignment} />

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Team Roster</h3>
          <div className="space-y-2">
            {activeMembers.map((teamMember) => {
              const utilization = teamMember.currentAssignments.length / teamMember.capacity
              const utilizationColor = utilization >= 1 ? 'text-terminal-red' : utilization >= 0.5 ? 'text-terminal-amber' : 'text-terminal-green'
              const isPromotable =
                (teamMember.role === 'Associate'
                  && teamMember.tenureQuarters >= 12
                  && teamMember.experienceLog.filter((entry) => entry.type === 'deal_closed').length >= 3)
                || (teamMember.role === 'VP'
                  && teamMember.tenureQuarters >= 20
                  && teamMember.experienceLog.filter((entry) => entry.type === 'exit_completed').length >= 2)

              return (
                <div key={teamMember.id} className="rounded border border-terminal-border bg-terminal-surface p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium text-terminal-white">{teamMember.name}</span>
                      <span className="ml-2 text-xs text-terminal-muted">{teamMember.role}</span>
                      {teamMember.status === 'BurnedOut' && <span className="ml-2 text-xs text-terminal-red">BURNED OUT</span>}
                    </div>
                    <span className={`text-xs font-mono ${utilizationColor}`}>
                      {teamMember.currentAssignments.length}/{teamMember.capacity}
                    </span>
                  </div>

                  <div className="mt-1 flex gap-3 text-[10px] text-terminal-muted">
                    <span>Src: <span className="text-terminal-white">{Math.round(teamMember.skills.dealSourcing)}</span></span>
                    <span>Dil: <span className="text-terminal-white">{Math.round(teamMember.skills.diligence)}</span></span>
                    <span>Ops: <span className="text-terminal-white">{Math.round(teamMember.skills.operationalExecution)}</span></span>
                    <span>Carry: <span className="text-terminal-white">{teamMember.carryAllocationPct.toFixed(1)}%</span></span>
                  </div>

                  {teamMember.currentAssignments.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {teamMember.currentAssignments.map((assignmentId) => {
                        const dealName = currentDeals.find((deal) => deal.id === assignmentId)?.name
                        const companyName = portfolioCompanies.find((company) => company.id === assignmentId)?.name
                        return (
                          <span
                            key={assignmentId}
                            className="cursor-pointer rounded bg-terminal-bg px-1.5 py-0.5 text-[10px] text-terminal-muted hover:text-terminal-red"
                            onClick={() => unassignTeamMember(teamMember.id, assignmentId)}
                            title="Click to unassign"
                          >
                            {dealName ?? companyName ?? assignmentId} x
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {isPromotable && (
                    <button
                      onClick={() => promoteTeamMember(teamMember.id)}
                      className="mt-1 text-[10px] text-terminal-green hover:underline"
                    >
                      PROMOTE to {teamMember.role === 'Associate' ? 'VP' : 'Principal'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded border border-terminal-border bg-terminal-bg p-3">
            <h4 className="mb-1 text-[10px] font-mono uppercase text-terminal-muted">Team Economics</h4>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span className="text-terminal-muted">Quarterly salary cost</span>
                <span className="font-mono text-terminal-white">${activeMembers.reduce((sum, teamMember) => sum + teamMember.salaryCostPerQuarter, 0).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Total carry allocated</span>
                <span className="font-mono text-terminal-white">{activeMembers.reduce((sum, teamMember) => sum + teamMember.carryAllocationPct, 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Your carry share</span>
                <span className="font-mono text-terminal-green">{(100 - activeMembers.reduce((sum, teamMember) => sum + teamMember.carryAllocationPct, 0)).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {pursuedDeals.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Active Deals - Assign Principal</h3>
              <div className="space-y-2">
                {pursuedDeals.map((deal) => {
                  const assignedPrincipal = teamMembers.find(
                    (teamMember) => teamMember.role === 'Principal' && teamMember.currentAssignments.includes(deal.id),
                  )
                  const availablePrincipals = teamMembers.filter(
                    (teamMember) =>
                      teamMember.role === 'Principal'
                      && teamMember.status === 'Active'
                      && teamMember.currentAssignments.length < teamMember.capacity
                      && !teamMember.currentAssignments.includes(deal.id),
                  )

                  return (
                    <div key={deal.id} className="rounded border border-terminal-border bg-terminal-surface p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-terminal-white">{deal.name}</span>
                        {assignedPrincipal ? (
                          <span className="text-xs font-mono text-terminal-green">{assignedPrincipal.name}</span>
                        ) : (
                          <span className="text-xs font-mono text-terminal-red">UNASSIGNED</span>
                        )}
                      </div>
                      {!assignedPrincipal && availablePrincipals.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {availablePrincipals.map((principal) => (
                            <button
                              key={principal.id}
                              onClick={() => assignTeamMember(principal.id, deal.id)}
                              className="rounded border border-terminal-green/30 bg-terminal-green/10 px-2 py-0.5 text-[10px] text-terminal-green hover:bg-terminal-green/20"
                            >
                              {principal.name} (D:{Math.round(principal.skills.diligence)})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeCompanies.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Portfolio - Assign Operating Partner</h3>
              <div className="space-y-2">
                {activeCompanies.map((company) => {
                  const assignedOperatingPartner = teamMembers.find(
                    (teamMember) => teamMember.role === 'OperatingPartner' && teamMember.currentAssignments.includes(company.id),
                  )
                  const availableOperatingPartners = teamMembers.filter(
                    (teamMember) =>
                      teamMember.role === 'OperatingPartner'
                      && teamMember.status === 'Active'
                      && teamMember.currentAssignments.length < teamMember.capacity
                      && !teamMember.currentAssignments.includes(company.id),
                  )

                  return (
                    <div key={company.id} className="rounded border border-terminal-border bg-terminal-surface p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-terminal-white">{company.name}</span>
                        {assignedOperatingPartner ? (
                          <span className="text-xs font-mono text-terminal-green">
                            {assignedOperatingPartner.name} ({company.sector}: {Math.round(assignedOperatingPartner.skills.sectorExpertise[company.sector])})
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-terminal-amber">NO OP</span>
                        )}
                      </div>
                      {!assignedOperatingPartner && availableOperatingPartners.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {availableOperatingPartners.map((operatingPartner) => (
                            <button
                              key={operatingPartner.id}
                              onClick={() => assignTeamMember(operatingPartner.id, company.id)}
                              className="rounded border border-terminal-green/30 bg-terminal-green/10 px-2 py-0.5 text-[10px] text-terminal-green hover:bg-terminal-green/20"
                            >
                              {operatingPartner.name} (Ops:{Math.round(operatingPartner.skills.operationalExecution)}, {company.sector}:{Math.round(operatingPartner.skills.sectorExpertise[company.sector])})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
