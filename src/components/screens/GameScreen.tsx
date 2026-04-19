import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { TopBar } from '../hud/TopBar'
import { BottomBar } from '../hud/BottomBar'
import { Sidebar } from '../hud/Sidebar'
import { DealSourcing } from '../phases/DealSourcing'
import { TeamAssignmentView } from '../phases/TeamAssignmentView'
import { DiligenceView } from '../phases/DiligenceView'
import { StructuringView } from '../phases/StructuringView'
import { OperationsView } from '../phases/OperationsView'
import { ExitsView } from '../phases/ExitsView'
import { EndOfQuarter } from '../phases/EndOfQuarter'
import { DialoguePanel } from '../dialogue/DialoguePanel'
import { GameMap } from '../map/GameMap'
import { MapOverlay } from '../map/MapOverlay'
import { CompanyDetailDrawer } from '../map/CompanyDetailDrawer'

export function GameScreen() {
  const currentPhase = useGameStore((s) => s.currentPhase)
  const activeDialogue = useGameStore((s) => s.activeDialogue)
  const dismissDialogue = useGameStore((s) => s.dismissDialogue)
  const portfolioCompanies = useGameStore((s) => s.portfolioCompanies)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const hasPortfolio = portfolioCompanies.some((c) => c.status === 'Active')
  const selectedCompany = selectedCompanyId
    ? portfolioCompanies.find((c) => c.id === selectedCompanyId) ?? null
    : null

  // Phases that let the map drive the whole main area (no side phase panel).
  const isMapPhase =
    currentPhase === 'Operations' ||
    currentPhase === 'Exits' ||
    currentPhase === 'EndOfQuarter'

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'Sourcing':
        return <DealSourcing />
      case 'TeamAssignment':
        return <TeamAssignmentView />
      case 'Diligence':
        return <DiligenceView />
      case 'Structuring':
        return <StructuringView />
      case 'Operations':
        return <OperationsView />
      case 'Exits':
        return <ExitsView />
      case 'EndOfQuarter':
        return <EndOfQuarter />
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main area — map is the hub. Phase content floats as a left-side panel on
            phases that need dense input; overlays the whole area on map phases. */}
        <div className="flex-1 overflow-hidden relative">
          {hasPortfolio ? (
            <div className="absolute inset-0">
              <GameMap onBuildingClick={setSelectedCompanyId} />
              <MapOverlay />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-terminal-muted">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1">
                  Portfolio
                </div>
                <div className="text-xs font-mono opacity-70">
                  Fund has not yet deployed capital.
                </div>
              </div>
            </div>
          )}

          {/* Phase content */}
          {isMapPhase ? (
            <div className="absolute inset-0 bg-terminal-bg/70 overflow-y-auto">
              {renderPhaseContent()}
            </div>
          ) : (
            <div className="absolute left-0 top-0 bottom-0 w-full max-w-xl bg-terminal-bg/92 backdrop-blur-sm border-r border-terminal-border overflow-y-auto z-10">
              {renderPhaseContent()}
            </div>
          )}

          {/* Company detail drawer — always available on top of everything else */}
          {selectedCompany && (
            <CompanyDetailDrawer
              company={selectedCompany}
              onClose={() => setSelectedCompanyId(null)}
            />
          )}
        </div>
        <Sidebar />
      </div>
      <BottomBar />

      {/* Dialogue overlay */}
      {activeDialogue && (
        <DialoguePanel
          dialogue={activeDialogue}
          onComplete={() => dismissDialogue()}
          onDismiss={dismissDialogue}
        />
      )}
    </div>
  )
}
