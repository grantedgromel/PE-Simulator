import { useMemo, useState } from 'react'
import { DEAL_POOL, fmtMoney, type Deal } from './data'
import { Panel, BigBtn } from './ui'
import type { ScreenId } from './PEApp'

interface AuctionProps {
  deal: Deal | null
  onNav: (screen: ScreenId) => void
}

interface Rival {
  name: string
  bid: number
  color: string
  bidding: boolean
}

interface AuctionResult {
  winner: { n: string; b: number; color: string }
  sorted: Array<{ n: string; b: number; color: string }>
  won: boolean
}

export function Auction({ deal, onNav }: AuctionProps) {
  const activeDeal = deal ?? DEAL_POOL[0]
  const ask = activeDeal.ebitda * activeDeal.multiple
  const [bid, setBid] = useState(ask)
  const [result, setResult] = useState<AuctionResult | null>(null)

  const rivals = useMemo<Rival[]>(() => [
    { name: 'Vista Partners', bid: ask * 1.04, color: '#FF3DA5', bidding: true },
    { name: 'Apollo LM', bid: ask * 0.96, color: '#8BE04E', bidding: true },
    { name: 'Thoma Bravo', bid: ask * 1.08, color: '#FF7A3C', bidding: true },
    { name: 'Strategic: Carrier Corp', bid: ask * 1.12, color: '#1A1833', bidding: true },
  ], [ask])

  const submit = () => {
    const all = [
      ...rivals.filter((r) => r.bidding).map((r) => ({ n: r.name, b: r.bid, color: r.color })),
      { n: 'YOU', b: bid, color: '#C9FF3C' },
    ]
    all.sort((a, b) => b.b - a.b)
    const winner = all[0]
    const won = winner.n === 'YOU'
    setResult({ winner, sorted: all, won })
  }

  const bidPct = ((bid - ask) / ask) * 100

  return (
    <div className="pe-screen">
      <div className="pe-screen-hdr">
        <div className="pe-screen-hdr-kicker">FINAL ROUND · SEALED BID</div>
        <div className="pe-screen-hdr-title">{activeDeal.name}</div>
        <div className="pe-screen-hdr-sub">
          Banker wants a letter by 5pm. Overpay and you're "disciplined." Underpay and you lose.
        </div>
      </div>

      <div className="pe-auc-grid">
        <Panel tone="cream" label="BIDDERS IN THE ROOM" className="pe-auc-rivals">
          {rivals.map((r, i) => (
            <div key={i} className={'pe-auc-rival ' + (r.bidding ? '' : 'out')}>
              <div className="pe-auc-rival-dot" style={{ background: r.color }} />
              <div className="pe-auc-rival-name">{r.name}</div>
              <div className="pe-auc-rival-sub">{r.bidding ? 'ACTIVE' : 'DROPPED'}</div>
            </div>
          ))}
          <div className="pe-auc-rival" style={{ marginTop: 10, borderTop: '2px solid #1A1833', paddingTop: 10 }}>
            <div className="pe-auc-rival-dot" style={{ background: '#C9FF3C' }} />
            <div className="pe-auc-rival-name">YOU</div>
            <div className="pe-auc-rival-sub">BIDDING</div>
          </div>
        </Panel>

        <Panel tone="paper" label="YOUR BID" className="pe-auc-console">
          <div className="pe-auc-ask">
            <div className="pe-auc-ask-lbl">BANKER ASK</div>
            <div className="pe-auc-ask-val">{fmtMoney(ask)}</div>
            <div className="pe-auc-ask-sub">{activeDeal.multiple.toFixed(1)}× EBITDA</div>
          </div>

          <div className="pe-auc-bid-display">
            <div className="pe-auc-bid-val">{fmtMoney(bid)}</div>
            <div className="pe-auc-bid-mult">{(bid / activeDeal.ebitda).toFixed(2)}× EBITDA</div>
            <div className={'pe-auc-bid-delta ' + (bidPct > 0 ? 'over' : 'under')}>
              {bidPct > 0 ? '+' : ''}{bidPct.toFixed(1)}% vs ask
            </div>
          </div>

          <div className="pe-auc-slider-wrap">
            <div className="pe-auc-slider-zone under" />
            <div className="pe-auc-slider-zone band" />
            <div className="pe-auc-slider-zone over" />
            <input
              type="range"
              min={ask * 0.8}
              max={ask * 1.2}
              step={0.1}
              value={bid}
              onChange={(e) => setBid(+e.target.value)}
              className="pe-auc-slider"
            />
            <div className="pe-auc-slider-ticks">
              <span>-20%</span><span>ASK</span><span>+20%</span>
            </div>
          </div>

          <div className="pe-auc-warning">
            {bidPct > 15 && <div className="pe-warn pink">⚠ You're 15%+ over ask. IC will need a memo.</div>}
            {bidPct < -5 && <div className="pe-warn orange">⚠ Likely too low. Banker won't wait.</div>}
            {bidPct >= -5 && bidPct <= 15 && <div className="pe-warn lime">✓ In the zone.</div>}
          </div>

          <BigBtn tone="lime" size="lg" style={{ width: '100%', marginTop: 14 }} onClick={submit}>
            SUBMIT FINAL BID ▸
          </BigBtn>
        </Panel>

        {result && (
          <Panel tone="ink" label="RESULTS" className="pe-auc-result">
            <div className={'pe-auc-verdict ' + (result.won ? 'won' : 'lost')}>
              {result.won ? 'YOU WON THE DEAL' : 'YOU LOST'}
            </div>
            <div className="pe-auc-result-list">
              {result.sorted.map((r, i) => (
                <div key={i} className={'pe-auc-result-row ' + (r.n === 'YOU' ? 'you' : '')}>
                  <div className="pe-auc-result-rank">#{i + 1}</div>
                  <div className="pe-auc-result-dot" style={{ background: r.color }} />
                  <div className="pe-auc-result-name">{r.n}</div>
                  <div className="pe-auc-result-bid">{fmtMoney(r.b)}</div>
                </div>
              ))}
            </div>
            {result.won ? (
              <BigBtn tone="orange" style={{ width: '100%', marginTop: 14 }} onClick={() => onNav('capstack')}>
                STRUCTURE THE DEBT ▸
              </BigBtn>
            ) : (
              <BigBtn tone="cream" style={{ width: '100%', marginTop: 14 }} onClick={() => onNav('pipeline')}>
                BACK TO PIPELINE
              </BigBtn>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
