import { useGameStore } from '../../store/gameStore'
import { TopBar } from '../hud/TopBar'
import { BottomBar } from '../hud/BottomBar'
import { Sidebar } from '../hud/Sidebar'
import { DealSourcing } from '../phases/DealSourcing'
import { DiligenceView } from '../phases/DiligenceView'
import { StructuringView } from '../phases/StructuringView'
import { OperationsView } from '../phases/OperationsView'
import { EndOfQuarter } from '../phases/EndOfQuarter'

export function GameScreen() {
  const currentPhase = useGameStore((s) => s.currentPhase)

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'Sourcing':
        return <DealSourcing />
      case 'Diligence':
        return <DiligenceView />
      case 'Structuring':
        return <StructuringView />
      case 'Operations':
        return <OperationsView />
      case 'EndOfQuarter':
        return <EndOfQuarter />
      case 'Exits':
        return (
          <div className="flex items-center justify-center h-full text-terminal-muted">
            <div className="text-center">
              <p className="font-mono text-lg">Exits</p>
              <p className="text-xs mt-1">Coming in Phase 3</p>
            </div>
          </div>
        )
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
    </div>
  )
}
