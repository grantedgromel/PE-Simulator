import { useState } from 'react'
import { type Deal, type FundState, makeInitialFund, quarterLabel } from './data'
import { TitleScreen } from './TitleScreen'
import { HUD } from './HUD'
import { Dashboard } from './Dashboard'
import { Pipeline } from './Pipeline'
import { Diligence } from './Diligence'
import { Auction } from './Auction'
import { CapStack } from './CapStack'
import { CompanyView } from './CompanyView'
import { Roster } from './Roster'

export type ScreenId =
  | 'dashboard'
  | 'pipeline'
  | 'diligence'
  | 'auction'
  | 'capstack'
  | 'company'
  | 'roster'

export function PEApp() {
  const [fund, setFund] = useState<FundState | null>(null)
  const [screen, setScreen] = useState<ScreenId>('dashboard')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)

  if (!fund) {
    return (
      <div className="pe-app">
        <TitleScreen
          onStart={(name, vintage) => {
            setFund(makeInitialFund(name, vintage))
            setScreen('dashboard')
          }}
        />
      </div>
    )
  }

  const onNav = (next: ScreenId, payload?: string) => {
    setScreen(next)
    if (next === 'company' && payload) setActiveCompanyId(payload)
  }

  const advanceQuarter = () => {
    setFund((prev) => {
      if (!prev) return prev
      const quarterNum = prev.quarterNum + 1
      const quarter = quarterLabel(quarterNum, prev.vintage)
      const portfolio = prev.portfolio.map((p) => ({
        ...p,
        hold: p.hold + 1,
        currentEbitda: Math.round((p.currentEbitda * 1.02) * 10) / 10,
      }))
      return { ...prev, quarterNum, quarter, portfolio }
    })
  }

  return (
    <div className="pe-app">
      <HUD fund={fund} onNav={onNav} currentScreen={screen} />
      {screen === 'dashboard' && (
        <Dashboard fund={fund} onNav={onNav} onAdvanceQuarter={advanceQuarter} />
      )}
      {screen === 'pipeline' && (
        <Pipeline onNav={onNav} onSelectDeal={setSelectedDeal} />
      )}
      {screen === 'diligence' && (
        <Diligence deal={selectedDeal} onNav={onNav} />
      )}
      {screen === 'auction' && (
        <Auction deal={selectedDeal} onNav={onNav} />
      )}
      {screen === 'capstack' && (
        <CapStack deal={selectedDeal} onNav={onNav} />
      )}
      {screen === 'company' && (
        <CompanyView companyId={activeCompanyId} fund={fund} />
      )}
      {screen === 'roster' && (
        <Roster fund={fund} onNav={onNav} />
      )}
    </div>
  )
}
