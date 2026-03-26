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

export function StructuringView() {
  const { currentDeals, structuringDealId, setStructuringDeal } = useGameStore()
  const wonDeals = currentDeals.filter((d) => d.status === 'Won')

  if (wonDeals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <p className="font-mono">No deals to structure this quarter.</p>
      </div>
    )
  }

  // If no deal selected, show deal list
  const activeDeal = structuringDealId
    ? wonDeals.find((d) => d.id === structuringDealId)
    : null

  if (!activeDeal) {
    return (
      <div className="p-6 overflow-y-auto h-full">
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest mb-4">
          Deal Structuring
        </h2>
        <p className="text-xs text-terminal-muted mb-4">Select a won deal to structure its capital stack.</p>
        <div className="space-y-2">
          {wonDeals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => setStructuringDeal(deal.id)}
              className="w-full text-left p-4 bg-terminal-surface border border-terminal-green/30 rounded hover:border-terminal-green transition-colors"
            >
              <div className="flex justify-between">
                <span className="text-terminal-white font-medium">{deal.name}</span>
                <span className="font-mono text-terminal-green text-sm">
                  {formatCurrency(deal.enterpriseValue)} TEV
                </span>
              </div>
              <p className="text-xs text-terminal-muted mt-1">{deal.subSector}</p>
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
    const weightedRate = totalDebt > 0
      ? (calc.seniorDebt * structure.seniorDebtRate + calc.mezzanineDebt * structure.mezzanineRate) / totalDebt
      : 0
    return calculateSensitivityTable(ebitda, deal.revenueGrowthRate, calc.fundEquity, totalDebt, weightedRate)
  }, [ebitda, deal.revenueGrowthRate, calc, structure])

  const canClose = calc.isValid && calc.fundEquity <= fund.remainingCapital

  const handleClose = () => {
    closeDeal(deal.id, structure)
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
            Capital Structure — {deal.name}
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
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
        {/* Left: Sliders + Visual */}
        <div className="space-y-5">
          <CapitalStackVisual
            seniorPct={seniorPct}
            mezzaninePct={mezzPct}
            equityPct={equityPct}
            mgmtRolloverPct={rolloverPct}
          />

          {/* Senior Debt Slider */}
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

          {/* Mezzanine Slider */}
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
            <span className="text-xs text-terminal-muted">PIK (paid-in-kind) — defer mezz interest</span>
          </div>

          {/* Management Rollover */}
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

        {/* Right: Calculations */}
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="bg-terminal-bg rounded p-3 space-y-1">
            <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Key Metrics</h4>
            <MetricRow label="Total Enterprise Value" value={formatCurrency(tev)} />
            <MetricRow label="Senior Debt" value={formatCurrency(calc.seniorDebt)} sub={formatPercent(structure.seniorDebtRate)} />
            <MetricRow label="Mezzanine Debt" value={formatCurrency(calc.mezzanineDebt)} sub={formatPercent(structure.mezzanineRate)} />
            <MetricRow label="Total Debt" value={formatCurrency(calc.seniorDebt + calc.mezzanineDebt)} />
            <div className="border-t border-terminal-border my-1" />
            <MetricRow label="Total Equity" value={formatCurrency(calc.equityCheck)} />
            <MetricRow label="Fund Equity" value={formatCurrency(calc.fundEquity)} highlight />
            <MetricRow label="Mgmt Rollover" value={formatCurrency(calc.mgmtRollover)} />
            <div className="border-t border-terminal-border my-1" />
            <MetricRow label="Total Leverage" value={formatMultiple(calc.totalLeverage)} warn={calc.totalLeverage > MAX_TOTAL_LEVERAGE[difficulty]} />
            <MetricRow label="Interest Coverage" value={`${calc.interestCoverage}x`} warn={calc.interestCoverage < 2.0} />
            <MetricRow label="Annual Debt Service" value={formatCurrency(calc.annualDebtService)} />
            <MetricRow label="Free Cash Flow" value={formatCurrency(calc.freeCashFlow)} warn={calc.freeCashFlow < 0} />
          </div>

          {/* Covenant Gauge */}
          <CovenantGauge
            headroom={calc.covenantHeadroom}
            ebitdaFloor={calc.covenantEbitdaFloor}
            currentEbitda={ebitda}
          />

          {/* Sensitivity Table */}
          <SensitivityTable table={sensitivity} />

          {/* Errors */}
          {calc.errors.length > 0 && (
            <div className="bg-terminal-red/10 border border-terminal-red/30 rounded p-2">
              {calc.errors.map((err, i) => (
                <p key={i} className="text-xs text-terminal-red">{err}</p>
              ))}
            </div>
          )}

          {/* Available capital check */}
          <div className="flex justify-between text-xs">
            <span className="text-terminal-muted">Fund Cash Available</span>
            <span className={`font-mono ${calc.fundEquity > fund.remainingCapital ? 'text-terminal-red' : 'text-terminal-green'}`}>
              {formatCurrency(fund.remainingCapital)}
            </span>
          </div>

          {/* Close Deal Button */}
          <button
            onClick={handleClose}
            disabled={!canClose}
            className="w-full py-3 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-sm rounded hover:bg-terminal-green/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            CLOSE DEAL — Deploy {formatCurrency(calc.fundEquity)}
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
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-mono ${color}`}>{label}</span>
        <span className="text-terminal-muted font-mono">{displayValue}</span>
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
      {warning && <p className="text-[10px] text-terminal-red mt-0.5">{warning}</p>}
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
    <div className="flex justify-between items-center text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className={`font-mono ${warn ? 'text-terminal-red' : highlight ? 'text-terminal-green' : 'text-terminal-white'}`}>
        {value}
        {sub && <span className="text-[10px] text-terminal-muted ml-1">({sub})</span>}
      </span>
    </div>
  )
}
