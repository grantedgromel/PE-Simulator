import { useGameStore } from './store/gameStore'
import { MainMenu } from './components/screens/MainMenu'
import { GameScreen } from './components/screens/GameScreen'
import { FundComplete } from './components/screens/FundComplete'

function App() {
  const screen = useGameStore((s) => s.screen)

  if (screen === 'fundComplete') {
    return <FundComplete />
  }

  if (screen === 'game') {
    return <GameScreen />
  }

  return <MainMenu />
}

export default App
