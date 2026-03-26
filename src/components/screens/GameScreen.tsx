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

export function GameScreen() {
  const currentPhase = useGameStore((s) => s.currentPhase)
  const activeDialogue = useGameStore((s) => s.activeDialogue)
  const dismissDialogue = useGameStore((s) => s.dismissDialogue)

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
        <div className="flex-1 overflow-hidden">
          {renderPhaseContent()}
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
