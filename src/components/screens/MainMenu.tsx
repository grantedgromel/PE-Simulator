import { useGameStore } from '../../store/gameStore'
import { NameGenerator } from '../setup/NameGenerator'
import { SectorPicker } from '../setup/SectorPicker'
import { DifficultyPicker } from '../setup/DifficultyPicker'
import { listSaves } from '../../utils/saveLoad'
import { formatFundCycle, formatQuarter } from '../../utils/formatters'
import { getRandomTip } from '../../data/flavorText'

const PLAY_PILLARS = ['Teach the math', 'Roast the machine', 'Show the damage']

export function MainMenu() {
  const { setup, startGame, loadGame } = useGameStore()
  const saves = listSaves()
  const hasSaves = saves.some((save) => save !== null)
  const tip = getRandomTip()

  return (
    <div className="relative h-full overflow-y-auto bg-terminal-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: [
            'radial-gradient(circle at top left, rgba(68, 136, 255, 0.18), transparent 28%)',
            'radial-gradient(circle at top right, rgba(0, 255, 136, 0.14), transparent 30%)',
            'radial-gradient(circle at bottom center, rgba(255, 183, 0, 0.12), transparent 34%)',
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: 'auto, auto, auto, 28px 28px, 28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-3xl border border-terminal-border bg-terminal-surface/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.34em] text-terminal-amber">
              Studio-Grade LBO Satire
            </p>
            <h1 className="mt-3 text-5xl font-semibold leading-none text-terminal-white md:text-6xl">
              PE Simulator
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-terminal-white/90">
              Raise a fund, buy cash-flow businesses, lever them up, fix or strip them, then hope the exit window stays open.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {PLAY_PILLARS.map((pillar) => (
                <Tag key={pillar} label={pillar} />
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatTile label="Fund Size" value="$200M" note="Fund I" />
              <StatTile label="Investing Window" value="20Q" note="5 years" />
              <StatTile label="Victory Test" value="DPI + Damage" note="Returns and fallout" />
            </div>

            <div className="mt-6 rounded-2xl border border-terminal-border bg-terminal-bg/75 p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-terminal-muted">
                Tip Feed
              </p>
              <p className="mt-2 text-sm italic leading-6 text-terminal-white/85">
                "{tip}"
              </p>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-terminal-border bg-terminal-surface/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="mb-5">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-terminal-green">
                  New Fund Setup
                </p>
                <p className="mt-2 text-sm text-terminal-muted">
                  Name the fund, pick your hunting ground, set the market.
                </p>
              </div>

              <div className="space-y-6">
                <NameGenerator />
                <SectorPicker />
                <DifficultyPicker />

                <button
                  onClick={startGame}
                  disabled={!setup.fundName.trim()}
                  className="w-full rounded-2xl border border-terminal-green bg-terminal-green/20 py-4 font-mono text-lg text-terminal-green transition-colors hover:bg-terminal-green/30 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  START FUND I
                </button>
              </div>
            </section>

            {hasSaves && (
              <section className="rounded-3xl border border-terminal-border bg-terminal-surface/90 p-6">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-terminal-blue">
                  Continue Fund
                </p>
                <div className="mt-4 space-y-3">
                  {saves.map((save, index) =>
                    save ? (
                      <button
                        key={index}
                        onClick={() => loadGame(index)}
                        className="w-full rounded-2xl border border-terminal-border bg-terminal-bg/70 px-4 py-3 text-left transition-colors hover:border-terminal-muted"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-sm font-medium text-terminal-white">
                              {save.fundName}
                            </span>
                            <p className="mt-1 text-xs text-terminal-muted">
                              {formatFundCycle(save.fundCycle)} | {formatQuarter(save.year, save.quarter)}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-terminal-muted">Slot {index + 1}</span>
                        </div>
                      </button>
                    ) : null,
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-terminal-border bg-terminal-bg/75 p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-terminal-muted">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-terminal-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-terminal-muted">
        {note}
      </p>
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-terminal-border bg-terminal-bg/70 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-terminal-white">
      {label}
    </span>
  )
}
