import { useGameStore } from './store/gameStore'
import { MainMenu } from './components/screens/MainMenu'
import { GameScreen } from './components/screens/GameScreen'

function App() {
  const screen = useGameStore((s) => s.screen)

  if (screen === 'game') {
    return <GameScreen />
  }

  return <MainMenu />
}

export default App
