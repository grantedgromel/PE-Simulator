import { useMemo, useState } from 'react'
import { DEAL_POOL, fmtMoney, type Deal } from './data'
import { Panel, BigBtn } from './ui'
import type { ScreenId } from './PEApp'

interface CapStackProps {
  deal: Deal | null
  onNav: (screen: ScreenId) => void
}

export function CapStack({ deal, onNav }: CapStackProps) {
  const activeDeal = deal ?? DEAL_POOL[0]
  const purchase = activeDeal.ebitda * activeDeal.multiple * 1.03
  const fees = purchase * 0.02
  const totalUses = purchase + fees

  const [tlb, setTlb] = useState(purchase * 0.48)
  const [mezz, setMezz] = useState(purchase * 0.10)
  const equity = Math.max(0, totalUses - tlb - mezz)

  const [holdYears, setHoldYears] = useState(5)
  const [ebitdaGrowth, setEbitdaGrowth] = useState(8)
  const [exitMultiple, setExitMultiple] = useState(activeDeal.multiple + 0.5)

  const rebalance = (key: 'tlb' | 'mezz', val: number) => {
    if (key === 'tlb') setTlb(Math.max(0, Math.min(totalUses - mezz, val)))
    else setMezz(Math.max(0, Math.min(totalUses - tlb, val)))
  }

  const entryMultiple = purchase / activeDeal.ebitda
  const leverage = (tlb + mezz) / activeDeal.ebitda
  const tlbRate = 0.085
  const mezzRate = 0.13
  const annualInterest = tlb * tlbRate + mezz * mezzRate
  const coverage = activeDeal.ebitda / annualInterest
  const equityPct = (equity / totalUses) * 100
  const covenantTight = leverage > 6.5
  const covenantBreach = leverage > 7.5

  const years = useMemo(() => {
    const out: { year: number; ebitda: number; interest: number; fcf: number; sweep: number; debt: number }[] = []
    let curEbitda = activeDeal.ebitda
    let curDebt = tlb + mezz
    const blendedRate = tlb + mezz > 0 ? (tlb * tlbRate + mezz * mezzRate) / (tlb + mezz) : 0
    for (let y = 1; y <= holdYears; y++) {
      curEbitda = curEbitda * (1 + ebitdaGrowth / 100)
      const interest = curDebt * (curDebt > 0 ? blendedRate : 0)
      const taxes = Math.max(0, (curEbitda - interest) * 0.25)
      const fcf = curEbitda - interest - taxes - curEbitda * 0.04
      const sweep = Math.max(0, Math.min(fcf * 0.75, curDebt))
      curDebt = Math.max(0, curDebt - sweep)
      out.push({ year: y, ebitda: curEbitda, interest, fcf, sweep, debt: curDebt })
    }
    return out
  }, [activeDeal.ebitda, tlb, mezz, holdYears, ebitdaGrowth])

  const exitEbitda = years[years.length - 1].ebitda
  const exitEV = exitEbitda * exitMultiple
  const netDebtAtExit = years[years.length - 1].debt
  const equityProceeds = Math.max(0, exitEV - netDebtAtExit)
  const moic = equity > 0 ? equityProceeds / equity : 0
  const irr = equity > 0 && moic > 0 ? (Math.pow(moic, 1 / holdYears) - 1) * 100 : 0

  const growthValue = (exitEbitda - activeDeal.ebitda) * entryMultiple
  const multipleValue = exitEbitda * (exitMultiple - entryMultiple)
  const deleveraging = (tlb + mezz) - netDebtAtExit
  const attribTotal = Math.max(0.01, growthValue + multipleValue + deleveraging)

  const returnTone = irr >= 25 ? 'lime' : irr >= 18 ? 'orange' : 'pink'

  return (
    <div className="pe-screen">
      <div className="pe-screen-hdr">
        <div className="pe-screen-hdr-kicker">CAPITAL STRUCTURE · LBO MODEL</div>
        <div className="pe-screen-hdr-title">{activeDeal.name}</div>
        <div className="pe-screen-hdr-sub">
          Structure the debt, set operating assumptions, price the exit. The model tells you what you're actually selling to LPs.
        </div>
      </div>

      <div className="pe-cap-grid">
        <Panel tone="cream" label="USES & SOURCES">
          <div className="pe-cap-uses">
            <div className="pe-cap-use-row"><span>Purchase price</span><b>{fmtMoney(purchase)}</b></div>
            <div className="pe-cap-use-row"><span>Fees & expenses</span><b>{fmtMoney(fees)}</b></div>
            <div className="pe-cap-use-row pe-cap-use-total"><span>TOTAL USES</span><b>{fmtMoney(totalUses)}</b></div>
          </div>

          <div className="pe-cap-slider-row">
            <div className="pe-cap-slider-hdr">
              <span>TLB · SOFR+500 (8.5%)</span>
              <b style={{ color: '#1A1833' }}>{fmtMoney(tlb)}</b>
            </div>
            <input
              type="range"
              min={0}
              max={totalUses}
              step={0.5}
              value={tlb}
              onChange={(e) => rebalance('tlb', +e.target.value)}
              className="pe-dd-slider"
            />
          </div>
          <div className="pe-cap-slider-row">
            <div className="pe-cap-slider-hdr">
              <span>MEZZANINE · 13% PIK</span>
              <b style={{ color: '#1A1833' }}>{fmtMoney(mezz)}</b>
            </div>
            <input
              type="range"
              min={0}
              max={totalUses * 0.25}
              step={0.5}
              value={mezz}
              onChange={(e) => rebalance('mezz', +e.target.value)}
              className="pe-dd-slider"
            />
          </div>
          <div className="pe-cap-slider-row">
            <div className="pe-cap-slider-hdr">
              <span>SPONSOR EQUITY (plug)</span>
              <b style={{ color: '#1A1833' }}>{fmtMoney(equity)}</b>
            </div>
            <div className="pe-cap-equity-note" style={{ color: '#1A1833' }}>
              {equityPct.toFixed(0)}% of capital · your fund writes this check
            </div>
          </div>

          <div className="pe-cap-metrics" style={{ marginTop: 12 }}>
            <div className="pe-metric"><div className="pe-metric-k">ENTRY</div><div className="pe-metric-v">{entryMultiple.toFixed(1)}×</div></div>
            <div className="pe-metric"><div className="pe-metric-k">LEVERAGE</div><div className="pe-metric-v" style={{ color: covenantBreach ? 'var(--pink)' : covenantTight ? 'var(--orange)' : '#1A1833' }}>{leverage.toFixed(1)}×</div></div>
            <div className="pe-metric"><div className="pe-metric-k">INT. COV.</div><div className="pe-metric-v">{coverage.toFixed(1)}×</div></div>
            <div className="pe-metric"><div className="pe-metric-k">EQUITY %</div><div className="pe-metric-v">{equityPct.toFixed(0)}%</div></div>
          </div>
        </Panel>

        <Panel tone="paper" label="OPERATING ASSUMPTIONS">
          <div className="pe-cap-assumptions">
            <div className="pe-cap-slider-row">
              <div className="pe-cap-slider-hdr">
                <span>HOLD PERIOD</span>
                <b style={{ color: '#1A1833' }}>{holdYears}Y</b>
              </div>
              <input type="range" min={3} max={8} step={1} value={holdYears} onChange={(e) => setHoldYears(+e.target.value)} className="pe-dd-slider" />
            </div>
            <div className="pe-cap-slider-row">
              <div className="pe-cap-slider-hdr">
                <span>EBITDA GROWTH / YR</span>
                <b style={{ color: '#1A1833' }}>{ebitdaGrowth}%</b>
              </div>
              <input type="range" min={-2} max={20} step={0.5} value={ebitdaGrowth} onChange={(e) => setEbitdaGrowth(+e.target.value)} className="pe-dd-slider" />
            </div>
            <div className="pe-cap-slider-row">
              <div className="pe-cap-slider-hdr">
                <span>EXIT MULTIPLE</span>
                <b style={{ color: '#1A1833' }}>{exitMultiple.toFixed(1)}×</b>
              </div>
              <input type="range" min={4} max={14} step={0.1} value={exitMultiple} onChange={(e) => setExitMultiple(+e.target.value)} className="pe-dd-slider" />
            </div>
          </div>

          <div className="pe-cap-pforma">
            <div className="pe-cap-pforma-hdr">
              <span>YR</span><span>EBITDA</span><span>INT</span><span>FCF</span><span>DEBT</span>
            </div>
            {years.map((y) => (
              <div key={y.year} className="pe-cap-pforma-row">
                <span>{y.year}</span>
                <span>${y.ebitda.toFixed(1)}</span>
                <span>${y.interest.toFixed(1)}</span>
                <span>${y.fcf.toFixed(1)}</span>
                <span>${y.debt.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel tone="ink" label="RETURNS · LP-FACING">
          <div className="pe-cap-returns-big">
            <div className="pe-cap-return-block">
              <div className="pe-cap-return-lbl">IRR</div>
              <div className="pe-cap-return-val" style={{ color: `var(--${returnTone})` }}>{irr.toFixed(1)}%</div>
              <div className="pe-cap-return-sub">target 22%</div>
            </div>
            <div className="pe-cap-return-block">
              <div className="pe-cap-return-lbl">MoIC</div>
              <div className="pe-cap-return-val" style={{ color: `var(--${returnTone})` }}>{moic.toFixed(2)}×</div>
              <div className="pe-cap-return-sub">target 2.5×</div>
            </div>
          </div>

          <div className="pe-cap-exit-math">
            <div className="pe-cap-exit-row"><span>Exit EBITDA (Y{holdYears})</span><b>{fmtMoney(exitEbitda)}</b></div>
            <div className="pe-cap-exit-row"><span>× Exit multiple</span><b>{exitMultiple.toFixed(1)}×</b></div>
            <div className="pe-cap-exit-row pe-cap-exit-sub"><span>= Exit enterprise value</span><b>{fmtMoney(exitEV)}</b></div>
            <div className="pe-cap-exit-row"><span>− Remaining debt</span><b>({fmtMoney(netDebtAtExit)})</b></div>
            <div className="pe-cap-exit-row pe-cap-exit-total"><span>= EQUITY PROCEEDS</span><b>{fmtMoney(equityProceeds)}</b></div>
            <div className="pe-cap-exit-row pe-cap-exit-faint"><span>Equity check</span><b>{fmtMoney(equity)}</b></div>
          </div>

          <div className="pe-cap-attrib">
            <div className="pe-cap-attrib-hdr">VALUE CREATION BRIDGE</div>
            <div className="pe-cap-attrib-bar">
              <div style={{ width: `${(growthValue / attribTotal) * 100}%`, background: 'var(--lime)' }} title="EBITDA growth" />
              <div style={{ width: `${(multipleValue / attribTotal) * 100}%`, background: 'var(--orange)' }} title="Multiple expansion" />
              <div style={{ width: `${(deleveraging / attribTotal) * 100}%`, background: 'var(--pink)' }} title="Deleveraging" />
            </div>
            <div className="pe-cap-attrib-legend">
              <div><i style={{ background: 'var(--lime)' }} />Growth {((growthValue / attribTotal) * 100).toFixed(0)}%</div>
              <div><i style={{ background: 'var(--orange)' }} />Multiple {((multipleValue / attribTotal) * 100).toFixed(0)}%</div>
              <div><i style={{ background: 'var(--pink)' }} />Lev {((deleveraging / attribTotal) * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="pe-cap-covenant" style={{ marginTop: 14 }}>
            <div className="pe-cap-covenant-row">
              <span>COV: MAX 6.5× LEVERAGE</span>
              <b style={{ color: covenantBreach ? 'var(--pink)' : covenantTight ? 'var(--orange)' : 'var(--lime)' }}>
                {covenantBreach ? 'BREACH' : covenantTight ? 'TIGHT' : 'OK'}
              </b>
            </div>
          </div>

          <BigBtn
            tone="lime"
            size="lg"
            style={{ width: '100%', marginTop: 12 }}
            disabled={covenantBreach}
            onClick={() => onNav('dashboard')}
          >
            {covenantBreach ? 'LENDERS SAID NO' : 'CLOSE THE DEAL ▸'}
          </BigBtn>
        </Panel>
      </div>
    </div>
  )
}
