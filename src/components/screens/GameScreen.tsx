import { useGameStore } from '../../store/gameStore'
import { TopBar } from '../hud/TopBar'
import { BottomBar } from '../hud/BottomBar'
import { Sidebar } from '../hud/Sidebar'
import { DealSourcing } from '../phases/DealSourcing'
import { PortfolioView } from '../phases/PortfolioView'
import { EndOfQuarter } from '../phases/EndOfQuarter'

export function GameScreen() {
  const currentPhase = useGameStore((s) => s.currentPhase)

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'Sourcing':
        return <DealSourcing />
      case 'Operations':
        return <PortfolioView />
      case 'EndOfQuarter':
        return <EndOfQuarter />
      // Phases not yet implemented — show placeholder
      case 'Diligence':
      case 'Structuring':
      case 'Exits':
        return (
          <div className="flex items-center justify-center h-full text-terminal-muted">
            <div className="text-center">
              <p className="font-mono text-lg">{currentPhase}</p>
              <p className="text-xs mt-1">Coming in Phase 2-3</p>
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
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {renderPhaseContent()}
        </div>
        {/* Sidebar */}
        <Sidebar />
      </div>
      <BottomBar />
    </div>
  )
}
