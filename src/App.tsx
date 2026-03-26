import { useGameStore } from './store/gameStore'
import { MainMenu } from './components/screens/MainMenu'
import { GameScreen } from './components/screens/GameScreen'
import { FundComplete } from './components/screens/FundComplete'
import { LPReport } from './components/screens/LPReport'
import { Fundraising } from './components/screens/Fundraising'
import { GameOver } from './components/screens/GameOver'

function App() {
  const screen = useGameStore((s) => s.screen)

  switch (screen) {
    case 'game':
      return <GameScreen />
    case 'fundComplete':
      return <FundComplete />
    case 'lpReport':
      return <LPReport />
    case 'fundraising':
      return <Fundraising />
    case 'gameOver':
      return <GameOver />
    default:
      return <MainMenu />
  }
}

export default App
