import { useState } from 'react'
import type { FundState, PortfolioCompany } from './data'
import { Panel } from './ui'

interface CompanyViewProps {
  companyId: string | null
  fund: FundState
}

export function CompanyView({ companyId, fund }: CompanyViewProps) {
  const co: PortfolioCompany = fund.portfolio.find((p) => p.id === companyId) ?? fund.portfolio[0]
  const [levers, setLevers] = useState(co.levers)

  const deltaSat = -(levers.priceIncrease * 0.8 + levers.mgmtTurnover * 4 + levers.capexCut * 0.6)
  const deltaEbitda = levers.priceIncrease * 0.22 + levers.addOns * 1.8 + levers.capexCut * 0.12
  const projectedEbitda = co.currentEbitda * (1 + deltaEbitda / 100)
  const projectedSat = Math.max(0, co.satisfaction + deltaSat)

  const hc = projectedSat < 30 || levers.priceIncrease > 25 || levers.capexCut > 30

  return (
    <div className="pe-screen">
      <div className="pe-screen-hdr">
        <div className="pe-screen-hdr-kicker">PORTFOLIO CO. · {co.sector.toUpperCase()}</div>
        <div className="pe-screen-hdr-title" style={{ color: co.color }}>{co.name}</div>
        <div className="pe-screen-hdr-sub">
          Acquired {co.acquired} · {co.entryMultiple.toFixed(1)}× entry · hold: {co.hold}Q
        </div>
      </div>

      <div className="pe-co-grid">
        <Panel tone="cream" label="VALUE CREATION LEVERS" className="pe-co-levers">
          <div className="pe-co-lever">
            <div className="pe-co-lever-hdr">
              <div>
                <b>PRICE INCREASES</b>
                <span className="pe-co-lever-sub">Raise list prices across the book</span>
              </div>
              <div className="pe-co-lever-val">+{levers.priceIncrease}%</div>
            </div>
            <input type="range" min={0} max={40} value={levers.priceIncrease} onChange={(e) => setLevers({ ...levers, priceIncrease: +e.target.value })} className="pe-dd-slider" />
          </div>

          <div className="pe-co-lever">
            <div className="pe-co-lever-hdr">
              <div>
                <b>MANAGEMENT TURNOVER</b>
                <span className="pe-co-lever-sub">Replace CFO, plant managers, field leaders</span>
              </div>
              <div className="pe-co-lever-val">{levers.mgmtTurnover}</div>
            </div>
            <input type="range" min={0} max={8} value={levers.mgmtTurnover} onChange={(e) => setLevers({ ...levers, mgmtTurnover: +e.target.value })} className="pe-dd-slider" />
          </div>

          <div className="pe-co-lever">
            <div className="pe-co-lever-hdr">
              <div>
                <b>ADD-ON ACQUISITIONS</b>
                <span className="pe-co-lever-sub">Tuck-in smaller competitors at lower multiples</span>
              </div>
              <div className="pe-co-lever-val">{levers.addOns}</div>
            </div>
            <input type="range" min={0} max={6} value={levers.addOns} onChange={(e) => setLevers({ ...levers, addOns: +e.target.value })} className="pe-dd-slider" />
          </div>

          <div className="pe-co-lever">
            <div className="pe-co-lever-hdr">
              <div>
                <b>CAPEX DISCIPLINE</b>
                <span className="pe-co-lever-sub">Defer maintenance, close 'underperforming' sites</span>
              </div>
              <div className="pe-co-lever-val">-{levers.capexCut}%</div>
            </div>
            <input type="range" min={0} max={40} value={levers.capexCut} onChange={(e) => setLevers({ ...levers, capexCut: +e.target.value })} className="pe-dd-slider" />
          </div>
        </Panel>

        <div className="pe-co-right">
          <Panel tone="paper" label="PROJECTED NEXT QTR">
            <div className="pe-co-projgrid">
              <div className="pe-metric">
                <div className="pe-metric-k">EBITDA</div>
                <div className="pe-metric-v">${projectedEbitda.toFixed(1)}M</div>
                <div className="pe-metric-sub" style={{ color: '#8BE04E' }}>+{deltaEbitda.toFixed(1)}%</div>
              </div>
              <div className="pe-metric">
                <div className="pe-metric-k">OPS MORALE</div>
                <div className="pe-metric-v">{Math.round(projectedSat)}</div>
                <div className="pe-metric-sub" style={{ color: '#FF3DA5' }}>{deltaSat.toFixed(0)}</div>
              </div>
              <div className="pe-metric">
                <div className="pe-metric-k">LEVERAGE</div>
                <div className="pe-metric-v">{co.leverage.toFixed(1)}×</div>
              </div>
              <div className="pe-metric">
                <div className="pe-metric-k">EST. EXIT MULT.</div>
                <div className="pe-metric-v">{(co.entryMultiple + 1.2).toFixed(1)}×</div>
              </div>
            </div>
          </Panel>

          <Panel tone={hc ? 'pink' : 'cream'} label="HUMAN CONSEQUENCES">
            <div className="pe-co-hc">
              <div className="pe-co-hc-row">
                <span>LAYOFFS TO DATE</span>
                <b>{co.layoffs}</b>
              </div>
              <div className="pe-co-hc-row">
                <span>ACTIVE LAWSUITS</span>
                <b>{co.lawsuits}</b>
              </div>
              <div className="pe-co-hc-row">
                <span>GLASSDOOR SHIFT</span>
                <b>3.8 → {(3.8 - co.layoffs / 100).toFixed(1)}</b>
              </div>
              {hc && (
                <div className="pe-co-hc-warn">
                  Local paper just ran a piece. LPs will see it.
                </div>
              )}
            </div>
          </Panel>

          <Panel tone="ink" label="EXIT OPTIONS">
            <div className="pe-co-exits">
              <div className="pe-co-exit">
                <b>STRATEGIC SALE</b>
                <span>Clean exit. ~{(co.entryMultiple + 1.4).toFixed(1)}× multiple. 6 months.</span>
              </div>
              <div className="pe-co-exit">
                <b>SPONSOR-TO-SPONSOR</b>
                <span>Another PE firm buys. Same narrative, new GP.</span>
              </div>
              <div className="pe-co-exit">
                <b>DIVIDEND RECAP</b>
                <span>Re-lever. Take cash out. Keep the asset. LPs love this.</span>
              </div>
              <div className="pe-co-exit">
                <b>CONTINUATION VEHICLE</b>
                <span>Sell to yourself. Truly nothing wrong with this.</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
