import { useState } from 'react'
import { DEAL_POOL, fmtMoney, type Deal } from './data'
import { Panel, BigBtn, Tag, HeatDots } from './ui'
import type { ScreenId } from './PEApp'

interface PipelineProps {
  onNav: (screen: ScreenId) => void
  onSelectDeal: (deal: Deal) => void
}

export function Pipeline({ onNav, onSelectDeal }: PipelineProps) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(DEAL_POOL[0].id)
  const sectors = ['all', ...Array.from(new Set(DEAL_POOL.map((d) => d.sector)))]

  const deals = filter === 'all' ? DEAL_POOL : DEAL_POOL.filter((d) => d.sector === filter)
  const deal = DEAL_POOL.find((d) => d.id === selected) ?? DEAL_POOL[0]

  return (
    <div className="pe-screen">
      <div className="pe-screen-hdr">
        <div className="pe-screen-hdr-kicker">INBOX</div>
        <div className="pe-screen-hdr-title">DEAL PIPELINE</div>
        <div className="pe-screen-hdr-sub">
          Bankers are pitching. Every CIM lies by omission. Pick wisely.
        </div>
      </div>

      <div className="pe-pipe-filters">
        {sectors.map((s) => (
          <div
            key={s}
            className={'pe-pipe-filter ' + (filter === s ? 'on' : '')}
            onClick={() => setFilter(s)}
          >
            {s.toUpperCase()}
          </div>
        ))}
      </div>

      <div className="pe-pipe-grid">
        <Panel tone="cream" className="pe-pipe-list" label={`${deals.length} ACTIVE OPPORTUNITIES`}>
          <div className="pe-pipe-rows">
            {deals.map((d) => (
              <div
                key={d.id}
                className={'pe-pipe-row ' + (selected === d.id ? 'on' : '')}
                onClick={() => setSelected(d.id)}
              >
                <div className="pe-pipe-row-main">
                  <div className="pe-pipe-row-name">{d.name}</div>
                  <div className="pe-pipe-row-sub">
                    {d.sector} · {d.banker} · {d.process}
                  </div>
                </div>
                <div className="pe-pipe-row-stats">
                  <div className="pe-pipe-row-mult">{d.multiple.toFixed(1)}×</div>
                  <div className="pe-pipe-row-ebitda">{fmtMoney(d.ebitda)} EBITDA</div>
                </div>
                <HeatDots heat={d.heat} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel tone="paper" className="pe-pipe-detail" label="CIM DETAIL">
          <div className="pe-pipe-detail-hd">
            <Tag tone="orange">{deal.sector}</Tag>
            <HeatDots heat={deal.heat} />
          </div>
          <div className="pe-pipe-detail-name">{deal.name}</div>
          <div className="pe-pipe-detail-story">{deal.story}</div>

          <div className="pe-pipe-detail-grid">
            <div className="pe-metric"><div className="pe-metric-k">REVENUE</div><div className="pe-metric-v">{fmtMoney(deal.revenue)}</div></div>
            <div className="pe-metric"><div className="pe-metric-k">EBITDA</div><div className="pe-metric-v">{fmtMoney(deal.ebitda)}</div></div>
            <div className="pe-metric"><div className="pe-metric-k">ASK (×EBITDA)</div><div className="pe-metric-v">{deal.multiple.toFixed(1)}×</div></div>
            <div className="pe-metric"><div className="pe-metric-k">IMPLIED EV</div><div className="pe-metric-v">{fmtMoney(deal.ebitda * deal.multiple)}</div></div>
            <div className="pe-metric"><div className="pe-metric-k">BANKER</div><div className="pe-metric-v">{deal.banker}</div></div>
            <div className="pe-metric"><div className="pe-metric-k">PROCESS</div><div className="pe-metric-v">{deal.process}</div></div>
          </div>

          <div className="pe-pipe-detail-actions">
            <BigBtn tone="cream" size="sm" style={{ border: '2px solid #1A1833' }} onClick={() => onNav('dashboard')}>
              PASS
            </BigBtn>
            <BigBtn tone="orange" onClick={() => { onSelectDeal(deal); onNav('diligence') }}>
              OPEN DILIGENCE ▸
            </BigBtn>
          </div>
        </Panel>
      </div>
    </div>
  )
}
