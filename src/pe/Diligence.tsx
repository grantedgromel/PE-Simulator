import { useState } from 'react'
import { ADVISORS, DEAL_POOL, TEAM, fmtMoney, type Deal } from './data'
import { Panel, BigBtn, Meter, Tag } from './ui'
import { PersonCard } from './cards'
import type { ScreenId } from './PEApp'

interface DiligenceProps {
  deal: Deal | null
  onNav: (screen: ScreenId) => void
}

type FindingTone = 'pink' | 'orange' | 'lime' | 'cream'
interface Finding {
  tone: FindingTone
  k: string
  tag: string
}

export function Diligence({ deal, onNav }: DiligenceProps) {
  const activeDeal = deal ?? DEAL_POOL[0]
  const dealTeamMembers = TEAM.filter((p) => p.archetype === 'DEAL_TEAM')
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [advisors, setAdvisors] = useState<string[]>([])
  const [findings, setFindings] = useState<Finding[]>([])

  const toggleAdvisor = (id: string) => {
    setAdvisors((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  }

  const spend = advisors.reduce((s, id) => s + (ADVISORS.find((a) => a.id === id)?.cost || 0), 0)
  const avgWeeks = advisors.length
    ? Math.max(...advisors.map((id) => ADVISORS.find((a) => a.id === id)?.weeks ?? 0))
    : 0

  const totalTeamHours = Object.values(allocations).reduce((s, v) => s + v, 0)
  const teamQuality = Object.entries(allocations).reduce((s, [pid, h]) => {
    const p = TEAM.find((t) => t.id === pid)
    if (!p) return s
    const score = ((p.traits.DILIGENCE || 0) + (p.traits.MODELING || 0) + (p.traits.JUDGMENT || 0)) / 15
    return s + score * h
  }, 0)
  const confidence = Math.min(100, Math.round(teamQuality * 0.8 + advisors.length * 9 + spend * 5))

  const runDD = () => {
    const hasQoE = advisors.includes('a1')
    const hasCommDD = advisors.includes('a2')
    const hasLegal = advisors.includes('a3') || advisors.includes('a4')
    const hasIT = advisors.includes('a5')
    const f: Finding[] = []
    if (hasQoE) f.push({ tone: 'pink', k: "QoE finds $2.4M of 'non-recurring' add-backs that look awfully recurring.", tag: 'QUALITY OF EARNINGS' })
    if (hasCommDD) f.push({ tone: 'orange', k: 'Commercial DD: customer #1 is 38% of revenue and sole-sourced elsewhere.', tag: 'COMMERCIAL' })
    if (hasLegal) f.push({ tone: 'lime', k: 'Legal: 2 dormant wage-and-hour class actions in CA. Settleable.', tag: 'LEGAL' })
    if (hasIT) f.push({ tone: 'cream', k: 'IT: ERP is on-prem Windows Server 2012. Needs $1.8M migration.', tag: 'TECH' })
    if (!f.length) f.push({ tone: 'cream', k: "You read the CIM. You feel good. You have no idea what you're buying.", tag: 'VIBES' })
    setFindings(f)
  }

  return (
    <div className="pe-screen">
      <div className="pe-screen-hdr">
        <div className="pe-screen-hdr-kicker">DILIGENCE ROOM</div>
        <div className="pe-screen-hdr-title">{activeDeal.name}</div>
        <div className="pe-screen-hdr-sub">Spend to reduce uncertainty. Over-spend and IC will ask why.</div>
      </div>

      <div className="pe-dd-grid">
        <Panel tone="cream" label="DEAL TEAM ALLOCATION" className="pe-dd-team">
          <div className="pe-dd-team-sub">Slide to allocate hours. Partners cost more. Associates grind harder.</div>
          <div className="pe-dd-team-cards">
            {dealTeamMembers.map((p) => {
              const val = allocations[p.id] || 0
              return (
                <div key={p.id} className={'pe-dd-card-wrap ' + (val > 0 ? 'on' : '')}>
                  <PersonCard person={p} variant="row" />
                  <div className="pe-dd-slider-wrap">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) => setAllocations((a) => ({ ...a, [p.id]: +e.target.value }))}
                      className="pe-dd-slider"
                    />
                    <div className="pe-dd-slider-val">{val}%</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pe-dd-team-totals">
            <div><span>TEAM HOURS</span><b>{totalTeamHours}%</b></div>
            <div><span>TEAM QUALITY</span><b>{teamQuality.toFixed(0)}</b></div>
          </div>
        </Panel>

        <Panel tone="paper" label="HIRE ADVISORS" className="pe-dd-advisors">
          <div className="pe-dd-adv-list">
            {ADVISORS.map((a) => {
              const on = advisors.includes(a.id)
              return (
                <div
                  key={a.id}
                  className={'pe-dd-adv ' + (on ? 'on' : '')}
                  onClick={() => toggleAdvisor(a.id)}
                >
                  <div className="pe-dd-adv-check">{on ? '✓' : ''}</div>
                  <div className="pe-dd-adv-body">
                    <div className="pe-dd-adv-name">{a.name}</div>
                    <div className="pe-dd-adv-sub">
                      {a.finding} · {a.weeks}wk · {a.accuracy}% accuracy
                    </div>
                  </div>
                  <div className="pe-dd-adv-cost">{fmtMoney(a.cost)}</div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel tone="ink" label="IC CONFIDENCE" className="pe-dd-conf">
          <div className="pe-dd-conf-num">{confidence}</div>
          <Meter value={confidence} tone="#C9FF3C" height={14} />
          <div className="pe-dd-conf-rows">
            <div><span>BUDGET SPEND</span><b>{fmtMoney(spend)}</b></div>
            <div><span>TIMELINE</span><b>{avgWeeks || 0} weeks</b></div>
            <div><span>ADVISORS</span><b>{advisors.length}</b></div>
          </div>
          <BigBtn tone="lime" style={{ width: '100%', marginTop: 14 }} onClick={runDD}>
            RUN DILIGENCE ▸
          </BigBtn>
          {findings.length > 0 && (
            <div className="pe-dd-findings">
              <div className="pe-dd-findings-hdr">FINDINGS</div>
              {findings.map((f, i) => (
                <div key={i} className="pe-dd-finding">
                  <Tag tone={f.tone}>{f.tag}</Tag>
                  <div className="pe-dd-finding-text">{f.k}</div>
                </div>
              ))}
              <BigBtn tone="orange" style={{ width: '100%', marginTop: 10 }} onClick={() => onNav('auction')}>
                PROCEED TO BID ▸
              </BigBtn>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
