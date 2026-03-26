import { useGameStore } from '../../store/gameStore'
import { NameGenerator } from '../setup/NameGenerator'
import { SectorPicker } from '../setup/SectorPicker'
import { DifficultyPicker } from '../setup/DifficultyPicker'
import { listSaves } from '../../utils/saveLoad'
import { formatFundCycle, formatQuarter } from '../../utils/formatters'
import { getRandomTip } from '../../data/flavorText'

export function MainMenu() {
  const { setup, startGame, loadGame } = useGameStore()
  const saves = listSaves()
  const hasSaves = saves.some((s) => s !== null)
  const tip = getRandomTip()

  return (
    <div className="h-full flex flex-col items-center justify-center bg-terminal-bg overflow-y-auto">
      <div className="w-full max-w-2xl px-6 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-mono font-bold text-terminal-green tracking-widest">
            PE SIMULATOR
          </h1>
          <p className="text-terminal-muted font-mono text-sm">
            Leveraged Buyout Fund Management
          </p>
          <div className="mt-4 px-8">
            <p className="text-terminal-muted text-xs italic">"{tip}"</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-terminal-border" />

        {/* Fund Setup */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
              New Fund Setup
            </h2>
          </div>

          <NameGenerator />
          <SectorPicker />
          <DifficultyPicker />

          {/* Fund I Info */}
          <div className="bg-terminal-surface border border-terminal-border rounded p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-terminal-muted">Fund Size</span>
              <span className="font-mono text-terminal-white">$200M committed</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-terminal-muted">Investment Period</span>
              <span className="font-mono text-terminal-white">5 years</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-terminal-muted">Fund Life</span>
              <span className="font-mono text-terminal-white">10 years</span>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startGame}
            disabled={!setup.fundName.trim()}
            className="w-full py-4 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-lg rounded hover:bg-terminal-green/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            START FUND I
          </button>
        </div>

        {/* Load Game */}
        {hasSaves && (
          <>
            <div className="border-t border-terminal-border" />
            <div className="space-y-3">
              <h2 className="text-sm font-mono text-terminal-muted uppercase tracking-widest text-center">
                Load Game
              </h2>
              {saves.map((save, i) =>
                save ? (
                  <button
                    key={i}
                    onClick={() => loadGame(i)}
                    className="w-full text-left px-4 py-3 bg-terminal-surface border border-terminal-border rounded hover:border-terminal-muted transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-terminal-white font-medium text-sm">
                          {save.fundName}
                        </span>
                        <span className="text-terminal-muted text-xs ml-2">
                          {formatFundCycle(save.fundCycle)} — {formatQuarter(save.year, save.quarter)}
                        </span>
                      </div>
                      <span className="text-terminal-muted text-xs font-mono">
                        Slot {i + 1}
                      </span>
                    </div>
                  </button>
                ) : null
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-terminal-muted text-xs font-mono pt-4">
          v1.0.0 — PE Simulator
        </div>
      </div>
    </div>
  )
}
