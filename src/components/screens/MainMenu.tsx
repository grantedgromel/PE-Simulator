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
    <div className="relative h-full overflow-y-auto">
      {/* Diagonal arcade grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(transparent 95%, rgba(255,122,60,0.18) 95%)',
            'linear-gradient(90deg, transparent 95%, rgba(255,122,60,0.18) 95%)',
          ].join(', '),
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        {/* Logo + tagline */}
        <div className="mb-10 text-center">
          <div className="pe-title-logo-1">PE</div>
          <div className="pe-title-logo-2 mt-2">SIMULATOR</div>
          <div className="mt-4 font-mono text-[13px] uppercase tracking-[0.4em] text-cream/65" style={{ color: 'rgba(247,241,225,0.65)' }}>
            Fund I — A Game of Levered Decisions
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT: pitch panel */}
          <section className="pe-panel" style={{ background: 'var(--color-cream)' }}>
            <span className="pe-panel-label">STUDIO-GRADE LBO SATIRE</span>

            <h1 className="mt-2 text-5xl font-extrabold leading-none text-ink md:text-6xl" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
              Build the Fund.
              <br />
              <span style={{ color: 'var(--color-orange)' }}>Stretch</span> the Stack.
              <br />
              <span style={{ color: 'var(--color-pink)' }}>Own</span> the Fallout.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: 'var(--color-ink)', opacity: 0.78 }}>
              Raise a fund, buy cash-flow businesses, lever them up, fix or strip them,
              then hope the exit window stays open.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {PLAY_PILLARS.map((pillar) => (
                <span key={pillar} className="pe-tag">{pillar}</span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatTile label="Fund Size" value="$200M" note="Fund I" tone="orange" />
              <StatTile label="Investing Window" value="20Q" note="5 years" tone="lime" />
              <StatTile label="Victory Test" value="DPI + Damage" note="Returns and fallout" tone="pink" />
            </div>

            <div
              className="mt-6 rounded-xl border-2 border-dashed p-4"
              style={{ borderColor: 'var(--color-ink)', background: 'var(--color-paper)' }}
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
                Tip Feed
              </p>
              <p className="mt-2 text-sm italic leading-6" style={{ color: 'var(--color-ink)' }}>
                "{tip}"
              </p>
            </div>
          </section>

          {/* RIGHT: setup panel */}
          <div className="space-y-8">
            <section className="pe-panel" style={{ background: 'var(--color-cream)' }}>
              <span className="pe-panel-label">NEW FUND SETUP</span>

              <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
                Step 01 of 03
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                Name the fund, pick your hunting ground, set the market.
              </p>

              <div className="mt-5 space-y-5">
                <NameGenerator />
                <SectorPicker />
                <DifficultyPicker />

                <button
                  onClick={startGame}
                  disabled={!setup.fundName.trim()}
                  className="pe-bigbtn pe-bigbtn-lime w-full text-lg"
                >
                  ▶ Start Fund I
                </button>

                <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-ink)', opacity: 0.55 }}>
                  <span>v0.1 · Vintage 2026</span>
                  <span className="pe-blink" style={{ color: 'var(--color-pink)' }}>● PRESS START</span>
                </div>
              </div>
            </section>

            {hasSaves && (
              <section className="pe-panel-dark">
                <span className="pe-panel-label" style={{ background: 'var(--color-ink2)', color: 'var(--color-cream)' }}>
                  CONTINUE FUND
                </span>
                <div className="mt-4 space-y-3">
                  {saves.map((save, index) =>
                    save ? (
                      <button
                        key={index}
                        onClick={() => loadGame(index)}
                        className="block w-full rounded-xl border-2 border-cream/30 bg-ink/40 px-4 py-3 text-left transition-colors hover:border-lime hover:bg-ink/60"
                        style={{
                          borderColor: 'rgba(247,241,225,0.25)',
                          background: 'rgba(26,24,51,0.4)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-cream)' }}>
                              {save.fundName}
                            </span>
                            <p className="mt-1 font-mono text-xs" style={{ color: 'var(--color-cream)', opacity: 0.6 }}>
                              {formatFundCycle(save.fundCycle)} | {formatQuarter(save.year, save.quarter)}
                            </p>
                          </div>
                          <span className="font-mono text-xs" style={{ color: 'var(--color-orange)' }}>
                            SLOT {index + 1}
                          </span>
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
  tone,
}: {
  label: string
  value: string
  note: string
  tone: 'orange' | 'lime' | 'pink'
}) {
  const toneColor =
    tone === 'orange' ? 'var(--color-orange)' : tone === 'lime' ? 'var(--color-lime)' : 'var(--color-pink)'

  return (
    <div
      className="rounded-xl border-2 p-3"
      style={{ borderColor: 'var(--color-ink)', background: 'var(--color-paper)' }}
    >
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-extrabold leading-none"
        style={{ color: 'var(--color-ink)', textShadow: `2px 2px 0 ${toneColor}` }}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px]" style={{ color: 'var(--color-ink)', opacity: 0.55 }}>
        {note}
      </p>
    </div>
  )
}
