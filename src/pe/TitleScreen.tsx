import { useState } from 'react'
import { Panel, BigBtn } from './ui'
import { generateFundName } from './data'

interface TitleScreenProps {
  onStart: (name: string, vintage: string) => void
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const [name, setName] = useState(() => generateFundName())
  const [editing, setEditing] = useState(false)
  const [vintage, setVintage] = useState('2026')
  const [spinKey, setSpinKey] = useState(0)

  const reroll = () => {
    setName(generateFundName())
    setSpinKey((k) => k + 1)
  }

  return (
    <div className="pe-title-wrap">
      <div className="pe-title-bg" />
      <div className="pe-title-stack">
        <div className="pe-title-logo">
          <div className="pe-title-lo1">PE</div>
          <div className="pe-title-lo2">SIMULATOR</div>
          <div className="pe-title-lo3">— FUND I —</div>
        </div>

        <Panel tone="cream" className="pe-title-card">
          <div className="pe-title-step">STEP 1 OF 1 · NAME YOUR FUND</div>

          <div className="pe-title-name" key={spinKey}>
            {editing ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                className="pe-title-input"
              />
            ) : (
              <div onClick={() => setEditing(true)} className="pe-title-name-text">{name}</div>
            )}
          </div>

          <div className="pe-title-vintage">
            <div className="pe-vintage-lbl">VINTAGE YEAR</div>
            <div className="pe-vintage-tabs">
              {['2024', '2025', '2026'].map((y) => (
                <div
                  key={y}
                  className={'pe-vintage-tab ' + (vintage === y ? 'on' : '')}
                  onClick={() => setVintage(y)}
                >
                  {y}
                </div>
              ))}
            </div>
          </div>

          <div className="pe-title-commits">
            <div className="pe-title-commit-row">
              <span className="pe-ltag">FUND SIZE</span>
              <span className="pe-lval">$400M</span>
            </div>
            <div className="pe-title-commit-row">
              <span className="pe-ltag">TARGET RETURN</span>
              <span className="pe-lval">2.5× / 22% IRR</span>
            </div>
            <div className="pe-title-commit-row">
              <span className="pe-ltag">LP COMMITMENTS</span>
              <span className="pe-lval">CalPERS · Yale · OTPP · +14</span>
            </div>
            <div className="pe-title-commit-row">
              <span className="pe-ltag">STRATEGY</span>
              <span className="pe-lval">LOWER-MIDDLE-MARKET BUYOUTS</span>
            </div>
          </div>

          <div className="pe-title-actions">
            <BigBtn tone="cream" onClick={reroll} size="sm" style={{ border: '2px solid #1A1833' }}>
              ↻ REROLL NAME
            </BigBtn>
            <BigBtn tone="lime" size="lg" onClick={() => onStart(name, vintage)}>
              RAISE THE FUND ▸
            </BigBtn>
          </div>
        </Panel>

        <div className="pe-title-footer">
          <div>PRESS START · MOUSE ONLY · NO REFUNDS</div>
          <div className="pe-title-blink">● LIVE</div>
        </div>
      </div>
    </div>
  )
}
