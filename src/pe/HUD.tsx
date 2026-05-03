import type { FundState } from './data'
import { fmtMoney } from './data'
import { Stat } from './ui'
import type { ScreenId } from './PEApp'

interface HUDProps {
  fund: FundState
  onNav: (screen: ScreenId) => void
  currentScreen: ScreenId
}

const NAV_ITEMS: ReadonlyArray<readonly [ScreenId, string]> = [
  ['dashboard', 'HQ'],
  ['pipeline', 'DEALS'],
  ['diligence', 'DD'],
  ['auction', 'BID'],
  ['capstack', 'STACK'],
  ['roster', 'ROSTER'],
]

export function HUD({ fund, onNav, currentScreen }: HUDProps) {
  const deployed = fund.portfolio.reduce((s, p) => s + p.entryEbitda * p.entryMultiple, 0)
  const dry = fund.committed - deployed

  return (
    <div className="pe-hud">
      <div className="pe-hud-brand" onClick={() => onNav('dashboard')}>
        <div className="pe-hud-logo">
          <div className="pe-hud-logo-p">PE</div>
        </div>
        <div className="pe-hud-fund">
          <div className="pe-hud-fund-name">{fund.name}</div>
          <div className="pe-hud-fund-sub">FUND I · {fund.vintage}</div>
        </div>
      </div>

      <div className="pe-hud-stats">
        <Stat label="DRY POWDER" value={fmtMoney(dry)} sub={`of ${fmtMoney(fund.committed)}`} />
        <Stat label="CASH" value={fmtMoney(fund.cash)} sub="MGMT FEE ACCRUED" />
        <Stat label="PORTFOLIO" value={String(fund.portfolio.length)} sub="ACTIVE" />
        <Stat label="QUARTER" value={fund.quarter} sub={`Y${Math.ceil(fund.quarterNum / 4)}`} tone="#FF7A3C" />
      </div>

      <div className="pe-hud-nav">
        {NAV_ITEMS.map(([id, lbl]) => (
          <div
            key={id}
            className={'pe-hud-nav-btn ' + (currentScreen === id ? 'on' : '')}
            onClick={() => onNav(id)}
          >
            {lbl}
          </div>
        ))}
      </div>
    </div>
  )
}
