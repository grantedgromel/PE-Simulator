import type { FundState } from './data'
import { fmtMoney } from './data'
import { Panel, BigBtn, Meter } from './ui'
import type { ScreenId } from './PEApp'

interface DashboardProps {
  fund: FundState
  onNav: (screen: ScreenId, payload?: string) => void
  onAdvanceQuarter: () => void
}

export function Dashboard({ fund, onNav, onAdvanceQuarter }: DashboardProps) {
  const { portfolio } = fund
  const deployed = portfolio.reduce((s, p) => s + p.entryEbitda * p.entryMultiple, 0)

  return (
    <div className="pe-dash">
      <div className="pe-dash-grid">
        <div className="pe-dash-col pe-dash-left">
          <Panel tone="cream" label="PORTFOLIO" className="pe-dash-portfolio">
            <div className="pe-portfolio-header">
              <div className="pe-portfolio-count">{portfolio.length} COMPANIES</div>
              <div className="pe-portfolio-deployed">{fmtMoney(deployed)} DEPLOYED</div>
            </div>
            <div className="pe-portfolio-grid">
              {portfolio.map((p) => (
                <div key={p.id} className="pe-pco-card" onClick={() => onNav('company', p.id)}>
                  <div className="pe-pco-swatch" style={{ background: p.color }}>
                    <div className="pe-pco-initials">
                      {p.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                    </div>
                  </div>
                  <div className="pe-pco-body">
                    <div className="pe-pco-name">{p.name}</div>
                    <div className="pe-pco-sector">{p.sector} · acq. {p.acquired}</div>
                    <div className="pe-pco-stats">
                      <div><span className="pe-pco-k">EBITDA</span><span className="pe-pco-v">${p.currentEbitda.toFixed(1)}M</span></div>
                      <div><span className="pe-pco-k">LEVERAGE</span><span className="pe-pco-v">{p.leverage.toFixed(1)}×</span></div>
                      <div><span className="pe-pco-k">HOLD</span><span className="pe-pco-v">{p.hold}Q</span></div>
                    </div>
                    <div className="pe-pco-meters">
                      <div className="pe-pco-meter-row">
                        <span>OPS</span>
                        <Meter
                          value={p.satisfaction}
                          tone={p.satisfaction > 60 ? '#8BE04E' : p.satisfaction > 40 ? '#FF7A3C' : '#FF3DA5'}
                          height={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pe-pco-add" onClick={() => onNav('pipeline')}>
                <div className="pe-pco-plus">+</div>
                <div className="pe-pco-add-lbl">SOURCE NEW DEAL</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="pe-dash-col pe-dash-right">
          <Panel tone="ink" label="QUARTER CLOCK">
            <div className="pe-clock">
              <div className="pe-clock-big">{fund.quarter}</div>
              <div className="pe-clock-sub">VINTAGE {fund.vintage} · YEAR {Math.ceil(fund.quarterNum / 4)}</div>
              <div className="pe-clock-progress">
                <div className="pe-clock-progress-fill" style={{ width: `${(fund.quarterNum / 28) * 100}%` }} />
              </div>
              <div className="pe-clock-runway">{28 - fund.quarterNum} quarters until Fund II fundraise</div>
            </div>
            <div className="pe-clock-actions">
              <BigBtn tone="lime" size="lg" style={{ width: '100%' }} onClick={onAdvanceQuarter}>
                END QUARTER ▸
              </BigBtn>
              <div className="pe-clock-consequences">
                Advancing the quarter triggers interest payments, EBITDA updates, and LP correspondence.
              </div>
            </div>
          </Panel>

          <Panel tone="cream" label="ACTIONS">
            <div className="pe-actions-list">
              <div className="pe-action-row" onClick={() => onNav('pipeline')}>
                <div className="pe-action-icon" style={{ background: '#FF7A3C' }}>◆</div>
                <div className="pe-action-body">
                  <div className="pe-action-name">DEAL PIPELINE</div>
                  <div className="pe-action-sub">8 new CIMs in inbox</div>
                </div>
                <div className="pe-action-arrow">▸</div>
              </div>
              <div className="pe-action-row" onClick={() => onNav('diligence')}>
                <div className="pe-action-icon" style={{ background: '#C9FF3C' }}>▲</div>
                <div className="pe-action-body">
                  <div className="pe-action-name">DILIGENCE ROOM</div>
                  <div className="pe-action-sub">Allocate team, hire advisors</div>
                </div>
                <div className="pe-action-arrow">▸</div>
              </div>
              <div className="pe-action-row" onClick={() => onNav('auction')}>
                <div className="pe-action-icon" style={{ background: '#FF3DA5' }}>●</div>
                <div className="pe-action-body">
                  <div className="pe-action-name">LIVE AUCTION</div>
                  <div className="pe-action-sub">Patriot HVAC — final bids Thursday</div>
                </div>
                <div className="pe-action-arrow">▸</div>
              </div>
              <div className="pe-action-row" onClick={() => onNav('capstack')}>
                <div className="pe-action-icon" style={{ background: '#1A1833', color: '#F7F1E1' }}>▣</div>
                <div className="pe-action-body">
                  <div className="pe-action-name">CAPITAL STACK</div>
                  <div className="pe-action-sub">Structure Patriot HVAC financing</div>
                </div>
                <div className="pe-action-arrow">▸</div>
              </div>
            </div>
          </Panel>

          <Panel tone="paper" label="LP SENTIMENT">
            <div className="pe-lp-row">
              <div className="pe-lp-face">🙂</div>
              <div className="pe-lp-body">
                <div className="pe-lp-headline">LPs are cautiously optimistic</div>
                <div className="pe-lp-detail">3 of 14 have asked about the Willow situation.</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
