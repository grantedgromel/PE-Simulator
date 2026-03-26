import { useGameStore } from '../../store/gameStore'

export function TeamAssignmentView() {
  const {
    teamMembers, currentDeals, portfolioCompanies,
    assignTeamMember, unassignTeamMember, promoteTeamMember,
  } = useGameStore()

  const activeMembers = teamMembers.filter((tm) => tm.status === 'Active' || tm.status === 'BurnedOut')
  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued')
  const activeCompanies = portfolioCompanies.filter((c) => c.status === 'Active')

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          Team Assignment
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          Assign principals to deals and operating partners to portfolio companies.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Team Roster */}
        <div>
          <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Team Roster</h3>
          <div className="space-y-2">
            {activeMembers.map((tm) => {
              const utilization = tm.currentAssignments.length / tm.capacity
              const utilColor = utilization >= 1 ? 'text-terminal-red' : utilization >= 0.5 ? 'text-terminal-amber' : 'text-terminal-green'
              const isPromotable = (tm.role === 'Associate' && tm.tenureQuarters >= 12 && tm.experienceLog.filter(e => e.type === 'deal_closed').length >= 3)
                || (tm.role === 'VP' && tm.tenureQuarters >= 20 && tm.experienceLog.filter(e => e.type === 'exit_completed').length >= 2)

              return (
                <div key={tm.id} className="bg-terminal-surface border border-terminal-border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-terminal-white text-sm font-medium">{tm.name}</span>
                      <span className="text-terminal-muted text-xs ml-2">{tm.role}</span>
                      {tm.status === 'BurnedOut' && <span className="text-terminal-red text-xs ml-2">BURNED OUT</span>}
                    </div>
                    <span className={`text-xs font-mono ${utilColor}`}>
                      {tm.currentAssignments.length}/{tm.capacity}
                    </span>
                  </div>

                  {/* Skills compact display */}
                  <div className="flex gap-3 mt-1 text-[10px] text-terminal-muted">
                    <span>Src: <span className="text-terminal-white">{Math.round(tm.skills.dealSourcing)}</span></span>
                    <span>Dil: <span className="text-terminal-white">{Math.round(tm.skills.diligence)}</span></span>
                    <span>Ops: <span className="text-terminal-white">{Math.round(tm.skills.operationalExecution)}</span></span>
                    <span>Carry: <span className="text-terminal-white">{tm.carryAllocationPct.toFixed(1)}%</span></span>
                  </div>

                  {/* Assignments */}
                  {tm.currentAssignments.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tm.currentAssignments.map((aid) => {
                        const dealName = currentDeals.find((d) => d.id === aid)?.name
                        const coName = portfolioCompanies.find((c) => c.id === aid)?.name
                        return (
                          <span
                            key={aid}
                            className="text-[10px] bg-terminal-bg px-1.5 py-0.5 rounded text-terminal-muted cursor-pointer hover:text-terminal-red"
                            onClick={() => unassignTeamMember(tm.id, aid)}
                            title="Click to unassign"
                          >
                            {dealName ?? coName ?? aid} ×
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Promote button */}
                  {isPromotable && (
                    <button
                      onClick={() => promoteTeamMember(tm.id)}
                      className="mt-1 text-[10px] text-terminal-green hover:underline"
                    >
                      PROMOTE to {tm.role === 'Associate' ? 'VP' : 'Principal'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Team P&L */}
          <div className="mt-4 bg-terminal-bg rounded p-3 border border-terminal-border">
            <h4 className="text-[10px] font-mono text-terminal-muted uppercase mb-1">Team Economics</h4>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-terminal-muted">Quarterly salary cost</span>
                <span className="font-mono text-terminal-white">${activeMembers.reduce((s, tm) => s + tm.salaryCostPerQuarter, 0).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Total carry allocated</span>
                <span className="font-mono text-terminal-white">{activeMembers.reduce((s, tm) => s + tm.carryAllocationPct, 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Your carry share</span>
                <span className="font-mono text-terminal-green">{(100 - activeMembers.reduce((s, tm) => s + tm.carryAllocationPct, 0)).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Assignment Slots */}
        <div>
          {/* Active Deals */}
          {pursuedDeals.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Active Deals — Assign Principal</h3>
              <div className="space-y-2">
                {pursuedDeals.map((deal) => {
                  const assignedPrincipal = teamMembers.find(
                    (tm) => tm.role === 'Principal' && tm.currentAssignments.includes(deal.id)
                  )
                  const availablePrincipals = teamMembers.filter(
                    (tm) => tm.role === 'Principal' && tm.status === 'Active' && tm.currentAssignments.length < tm.capacity && !tm.currentAssignments.includes(deal.id)
                  )

                  return (
                    <div key={deal.id} className="bg-terminal-surface border border-terminal-border rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-terminal-white text-xs">{deal.name}</span>
                        {assignedPrincipal ? (
                          <span className="text-xs text-terminal-green font-mono">{assignedPrincipal.name}</span>
                        ) : (
                          <span className="text-xs text-terminal-red font-mono">UNASSIGNED</span>
                        )}
                      </div>
                      {!assignedPrincipal && availablePrincipals.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {availablePrincipals.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => assignTeamMember(p.id, deal.id)}
                              className="text-[10px] px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/30 text-terminal-green rounded hover:bg-terminal-green/20"
                            >
                              {p.name} (D:{Math.round(p.skills.diligence)})
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

          {/* Portfolio Companies */}
          {activeCompanies.length > 0 && (
            <div>
              <h3 className="text-xs font-mono text-terminal-muted uppercase mb-2">Portfolio — Assign Operating Partner</h3>
              <div className="space-y-2">
                {activeCompanies.map((co) => {
                  const assignedOP = teamMembers.find(
                    (tm) => tm.role === 'OperatingPartner' && tm.currentAssignments.includes(co.id)
                  )
                  const availableOPs = teamMembers.filter(
                    (tm) => tm.role === 'OperatingPartner' && tm.status === 'Active' && tm.currentAssignments.length < tm.capacity && !tm.currentAssignments.includes(co.id)
                  )

                  return (
                    <div key={co.id} className="bg-terminal-surface border border-terminal-border rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-terminal-white text-xs">{co.name}</span>
                        {assignedOP ? (
                          <span className="text-xs text-terminal-green font-mono">
                            {assignedOP.name} ({co.sector}: {Math.round(assignedOP.skills.sectorExpertise[co.sector])})
                          </span>
                        ) : (
                          <span className="text-xs text-terminal-amber font-mono">NO OP</span>
                        )}
                      </div>
                      {!assignedOP && availableOPs.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {availableOPs.map((op) => (
                            <button
                              key={op.id}
                              onClick={() => assignTeamMember(op.id, co.id)}
                              className="text-[10px] px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/30 text-terminal-green rounded hover:bg-terminal-green/20"
                            >
                              {op.name} (Ops:{Math.round(op.skills.operationalExecution)}, {co.sector}:{Math.round(op.skills.sectorExpertise[co.sector])})
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
