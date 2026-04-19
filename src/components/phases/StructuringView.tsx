import { useState, useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import {
  calculateCapitalStructure,
  calculateSensitivityTable,
  calculateSeniorInterestRate,
  calculateMezzanineRate,
  MAX_SENIOR_LEVERAGE,
  MAX_TOTAL_LEVERAGE,
  MIN_EQUITY_PCT,
} from '../../engine/structuringEngine'
import type { CapitalStructure } from '../../types/effects'
import { SensitivityTable } from '../shared/SensitivityTable'
import { CapitalStackVisual } from '../shared/CapitalStackVisual'
import { CovenantGauge } from '../shared/CovenantGauge'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'

export function StructuringView() {
  const { currentDeals, structuringDealId, setStructuringDeal } = useGameStore()
  const wonDeals = currentDeals.filter((d) => d.status === 'Won')

  if (wonDeals.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full space-y-6">
        <PhaseBrief {...PHASE_BRIEFS.structuring} />
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-terminal-border bg-terminal-surface text-terminal-muted">
          <p className="font-mono">No deals to structure this quarter.</p>
        </div>
      </div>
    )
  }

  const activeDeal = structuringDealId
    ? wonDeals.find((d) => d.id === structuringDealId)
    : null

  if (!activeDeal) {
    return (
      <div className="p-6 overflow-y-auto h-full space-y-6">
        <PhaseBrief {...PHASE_BRIEFS.structuring} />
        <div className="space-y-2">
          {wonDeals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => setStructuringDeal(deal.id)}
              className="w-full rounded border border-terminal-green/30 bg-terminal-surface p-4 text-left transition-colors hover:border-terminal-green"
            >
              <div className="flex justify-between">
                <span className="font-medium text-terminal-white">{deal.name}</span>
                <span className="font-mono text-sm text-terminal-green">
                  {formatCurrency(deal.enterpriseValue)} TEV
                </span>
              </div>
              <p className="mt-1 text-xs text-terminal-muted">{deal.subSector}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return <StructuringPanel deal={activeDeal} />
}

function StructuringPanel({ deal }: { deal: ReturnType<typeof useGameStore.getState>['currentDeals'][0] }) {
  const { fund, difficulty, closeDeal, setStructuringDeal } = useGameStore()

  const tev = deal.enterpriseValue
  const ebitda = deal.actualEbitda

  const [seniorPct, setSeniorPct] = useState(0.45)
  const [mezzPct, setMezzPct] = useState(0.15)
  const [rolloverPct, setRolloverPct] = useState(0.10)
  const [isPIK, setIsPIK] = useState(false)

  const equityPct = Math.max(0, 1 - seniorPct - mezzPct)

  const structure: CapitalStructure = useMemo(() => {
    const totalLeverage = ebitda > 0 ? (tev * (seniorPct + mezzPct)) / ebitda : 0
    const seniorRate = calculateSeniorInterestRate(totalLeverage)
    const mezzRate = calculateMezzanineRate(seniorRate)
    return {
      seniorDebtPct: seniorPct,
      mezzaninePct: mezzPct,
      equityPct,
      managementRolloverPct: rolloverPct,
      seniorDebtRate: seniorRate,
      mezzanineRate: mezzRate,
      isPIK,
    }
  }, [seniorPct, mezzPct, equityPct, rolloverPct, isPIK, tev, ebitda])

  const calc = useMemo(
    () => calculateCapitalStructure(tev, ebitda, structure, difficulty),
    [tev, ebitda, structure, difficulty],
  )

  const sensitivity = useMemo(() => {
    const totalDebt = calc.seniorDebt + calc.mezzanineDebt
    return calculateSensitivityTable(ebitda, deal.revenueGrowthRate, calc.fundEquity, totalDebt)
  }, [ebitda, deal.revenueGrowthRate, calc])

  const canClose = calc.isValid && calc.fundEquity <= fund.remainingCapital

  const handleClose = () => {
    closeDeal(deal.id, structure)
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <PhaseBrief {...PHASE_BRIEFS.structuring} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-terminal-amber">
            Capital Structure - {deal.name}
          </h2>
          <p className="mt-0.5 text-xs text-terminal-muted">
            TEV: {formatCurrency(tev)} | EBITDA: {formatCurrency(ebitda)} | Growth: {formatPercent(deal.revenueGrowthRate)}
          </p>
        </div>
        <button
          onClick={() => setStructuringDeal(null)}
          className="text-xs text-terminal-muted hover:text-terminal-white"
        >
          BACK
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <CapitalStackVisual
            seniorPct={seniorPct}
            mezzaninePct={mezzPct}
            equityPct={equityPct}
            mgmtRolloverPct={rolloverPct}
          />

          <SliderRow
            label="Senior Debt"
            value={seniorPct}
            onChange={(v) => {
              setSeniorPct(v)
              if (v + mezzPct > 1 - MIN_EQUITY_PCT) {
                setMezzPct(Math.max(0, 1 - MIN_EQUITY_PCT - v))
              }
            }}
            min={0}
            max={0.70}
            step={0.01}
            displayValue={`${(seniorPct * 100).toFixed(0)}% (${formatCurrency(tev * seniorPct)})`}
            color="text-terminal-blue"
            warning={
              ebitda > 0 && (tev * seniorPct) / ebitda > MAX_SENIOR_LEVERAGE[difficulty]
                ? `Exceeds ${MAX_SENIOR_LEVERAGE[difficulty]}x senior limit`
                : undefined
            }
          />

          <SliderRow
            label="Mezzanine"
            value={mezzPct}
            onChange={(v) => {
              setMezzPct(v)
              if (seniorPct + v > 1 - MIN_EQUITY_PCT) {
                setSeniorPct(Math.max(0, 1 - MIN_EQUITY_PCT - v))
              }
            }}
            min={0}
            max={0.30}
            step={0.01}
            displayValue={`${(mezzPct * 100).toFixed(0)}% (${formatCurrency(tev * mezzPct)})`}
            color="text-terminal-amber"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPIK}
              onChange={(e) => setIsPIK(e.target.checked)}
              className="accent-terminal-amber"
            />
            <span className="text-xs text-terminal-muted">PIK (paid-in-kind) - defer mezz interest</span>
          </div>

          <SliderRow
            label="Mgmt Rollover"
            value={rolloverPct}
            onChange={setRolloverPct}
            min={0}
            max={0.30}
            step={0.01}
            displayValue={`${(rolloverPct * 100).toFixed(0)}% of equity (${formatCurrency(tev * equityPct * rolloverPct)})`}
            color="text-emerald-500"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-1 rounded bg-terminal-bg p-3">
            <h4 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Key Metrics</h4>
            <MetricRow label="Total Enterprise Value" value={formatCurrency(tev)} />
            <MetricRow label="Senior Debt" value={formatCurrency(calc.seniorDebt)} sub={formatPercent(structure.seniorDebtRate)} />
            <MetricRow label="Mezzanine Debt" value={formatCurrency(calc.mezzanineDebt)} sub={formatPercent(structure.mezzanineRate)} />
            <MetricRow label="Total Debt" value={formatCurrency(calc.seniorDebt + calc.mezzanineDebt)} />
            <div className="my-1 border-t border-terminal-border" />
            <MetricRow label="Total Equity" value={formatCurrency(calc.equityCheck)} />
            <MetricRow label="Fund Equity" value={formatCurrency(calc.fundEquity)} highlight />
            <MetricRow label="Mgmt Rollover" value={formatCurrency(calc.mgmtRollover)} />
            <div className="my-1 border-t border-terminal-border" />
            <MetricRow label="Total Leverage" value={formatMultiple(calc.totalLeverage)} warn={calc.totalLeverage > MAX_TOTAL_LEVERAGE[difficulty]} />
            <MetricRow label="Interest Coverage" value={`${calc.interestCoverage}x`} warn={calc.interestCoverage < 2.0} />
            <MetricRow label="Annual Debt Service" value={formatCurrency(calc.annualDebtService)} />
            <MetricRow label="Free Cash Flow" value={formatCurrency(calc.freeCashFlow)} warn={calc.freeCashFlow < 0} />
          </div>

          <CovenantGauge
            headroom={calc.covenantHeadroom}
            ebitdaFloor={calc.covenantEbitdaFloor}
            currentEbitda={ebitda}
          />

          <SensitivityTable table={sensitivity} />

          {calc.errors.length > 0 && (
            <div className="rounded border border-terminal-red/30 bg-terminal-red/10 p-2">
              {calc.errors.map((err, i) => (
                <p key={i} className="text-xs text-terminal-red">{err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-terminal-muted">Fund Cash Available</span>
            <span className={`font-mono ${calc.fundEquity > fund.remainingCapital ? 'text-terminal-red' : 'text-terminal-green'}`}>
              {formatCurrency(fund.remainingCapital)}
            </span>
          </div>

          <button
            onClick={handleClose}
            disabled={!canClose}
            className="w-full rounded border border-terminal-green bg-terminal-green/20 py-3 font-mono text-sm text-terminal-green transition-colors hover:bg-terminal-green/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            CLOSE DEAL - Deploy {formatCurrency(calc.fundEquity)}
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
  displayValue,
  color,
  warning,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  displayValue: string
  color: string
  warning?: string
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className={`font-mono ${color}`}>{label}</span>
        <span className="font-mono text-terminal-muted">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-current"
        style={{ color: 'var(--color-terminal-green)' }}
      />
      {warning && <p className="mt-0.5 text-[10px] text-terminal-red">{warning}</p>}
    </div>
  )
}

function MetricRow({
  label,
  value,
  sub,
  highlight = false,
  warn = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className={`font-mono ${warn ? 'text-terminal-red' : highlight ? 'text-terminal-green' : 'text-terminal-white'}`}>
        {value}
        {sub && <span className="ml-1 text-[10px] text-terminal-muted">({sub})</span>}
      </span>
    </div>
  )
}
