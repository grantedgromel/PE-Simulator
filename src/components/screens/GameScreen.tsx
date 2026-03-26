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

export function GameScreen() {
  const currentPhase = useGameStore((s) => s.currentPhase)
  const activeDialogue = useGameStore((s) => s.activeDialogue)
  const dismissDialogue = useGameStore((s) => s.dismissDialogue)
  const portfolioCompanies = useGameStore((s) => s.portfolioCompanies)

  const hasPortfolio = portfolioCompanies.some((c) => c.status === 'Active')

  // Phases that show as overlays on the map vs. full panels
  const isMapPhase = currentPhase === 'Operations' || currentPhase === 'Exits' || currentPhase === 'EndOfQuarter'

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
        {/* Main content area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Isometric map as background when portfolio exists */}
          {hasPortfolio && (
            <div className={`absolute inset-0 ${isMapPhase ? '' : 'opacity-20 pointer-events-none'}`}>
              <GameMap />
            </div>
          )}

          {/* Phase content - overlaid on map for map phases, replaces for others */}
          <div className={`${isMapPhase && hasPortfolio ? 'absolute inset-0 bg-terminal-bg/70 overflow-y-auto' : 'h-full'}`}>
            {renderPhaseContent()}
          </div>
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
