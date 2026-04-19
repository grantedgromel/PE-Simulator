import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { DILIGENCE_LEVELS, getDiligenceCostForLevel, isFieldRevealed } from '../../engine/diligenceEngine'
import { getMarketEstimate } from '../../engine/auctionEngine'
import { getBidRangeModifier, getDiligenceModifier } from '../../engine/teamEngine'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'
import { PhaseBrief } from '../shared/PhaseBrief'
import { PHASE_BRIEFS } from '../../data/phaseBriefs'

export function DiligenceView() {
  const { currentDeals, auctionResults, fund, resolveAllAuctions } = useGameStore()

  const pursuedDeals = currentDeals.filter((deal) => deal.status === 'Pursued')
  const allBidsSubmitted = pursuedDeals.every((deal) => deal.playerBid !== null)
  const auctionsResolved = auctionResults.length > 0

  if (pursuedDeals.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full space-y-6">
        <PhaseBrief {...PHASE_BRIEFS.diligence} />
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-terminal-border bg-terminal-surface text-terminal-muted">
          <p className="font-mono">No deals to diligence this quarter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <PhaseBrief {...PHASE_BRIEFS.diligence} />

      {pursuedDeals.map((deal) => {
        const result = auctionResults.find((auction) => auction.dealId === deal.id)
        return (
          <DealDiligenceCard
            key={deal.id}
            deal={deal}
            auctionResult={result}
            remainingCash={fund.remainingCapital}
          />
        )
      })}

      {!auctionsResolved && allBidsSubmitted && (
        <div className="flex justify-center">
          <button
            onClick={resolveAllAuctions}
            className="px-8 py-3 bg-terminal-amber/20 border border-terminal-amber text-terminal-amber font-mono text-sm rounded hover:bg-terminal-amber/30 transition-colors"
          >
            RESOLVE AUCTIONS
          </button>
        </div>
      )}
    </div>
  )
}

function DealDiligenceCard({
  deal,
  auctionResult,
  remainingCash,
}: {
  deal: ReturnType<typeof useGameStore.getState>['currentDeals'][0]
  auctionResult?: { won: boolean; winningBid: number; competitorBids: number[]; sellerCounterOffer?: number }
  remainingCash: number
}) {
  const { runDiligence, submitBid, acceptCounter, teamMembers, difficulty } = useGameStore()
  const [bidInput, setBidInput] = useState('')
  const level = deal.diligenceLevelCompleted
  const estimate = getMarketEstimate(deal)
  const bidRangeModifier = getBidRangeModifier(deal.id, teamMembers)
  const diligenceModifier = getDiligenceModifier(deal.id, teamMembers, difficulty)
  const diligenceCostMultiplier = Math.max(
    0.8,
    Math.min(
      1.12,
      1 - (diligenceModifier.accuracyBonus * 0.75) - (diligenceModifier.effectiveLevelBonus * 0.08)
        + (diligenceModifier.unreliableInfo ? 0.06 : 0),
    ),
  )
  const estimateMid = (estimate[0] + estimate[1]) / 2
  const estimateHalfRange = ((estimate[1] - estimate[0]) / 2) * bidRangeModifier
  const adjustedEstimate: [number, number] = [
    Math.round((estimateMid - estimateHalfRange) * 10) / 10,
    Math.round((estimateMid + estimateHalfRange) * 10) / 10,
  ]
  const assignedPrincipal = teamMembers.find(
    (member) => member.role === 'Principal' && member.currentAssignments.includes(deal.id),
  )
  const assignedSupport = teamMembers.find(
    (member) => (member.role === 'VP' || member.role === 'Associate') && member.currentAssignments.includes(deal.id),
  )

  const bidValue = parseFloat(bidInput)
  const isValidBid = !Number.isNaN(bidValue) && bidValue > 0

  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-medium text-terminal-white">{deal.name}</h3>
          <p className="text-xs text-terminal-muted">{deal.subSector}</p>
        </div>
        {auctionResult && (
          <span className={`text-sm font-mono ${auctionResult.won ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {auctionResult.won ? 'WON' : 'LOST'}
          </span>
        )}
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <MiniReadout label="Lead" value={assignedPrincipal?.name ?? 'Unassigned'} warn={!assignedPrincipal} />
        <MiniReadout label="Support" value={assignedSupport?.name ?? 'None'} />
        <MiniReadout
          label="Read"
          value={diligenceModifier.additionalReveal ? 'Sharp' : diligenceModifier.unreliableInfo ? 'Noisy' : 'Standard'}
          tone={diligenceModifier.additionalReveal ? 'green' : diligenceModifier.unreliableInfo ? 'red' : 'white'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase text-terminal-muted">Company Information</h4>

          <InfoRow label="Revenue" value={deal.revenue !== null ? formatCurrency(deal.revenue) : '???'} />
          <InfoRow
            label="EBITDA"
            value={level >= 1 ? formatCurrency(deal.actualEbitda) : '???'}
            locked={level < 1}
            unlockLevel={1}
          />
          <InfoRow
            label="EBITDA Margin"
            value={level >= 1 ? formatPercent(deal.actualEbitdaMargin) : '???'}
            locked={level < 1}
            unlockLevel={1}
          />
          <InfoRow
            label="Growth Rate"
            value={isFieldRevealed('revenueGrowthRate', level) ? formatPercent(deal.revenueGrowthRate) : '???'}
            locked={!isFieldRevealed('revenueGrowthRate', level)}
            unlockLevel={2}
          />
          <InfoRow
            label="Customer Conc."
            value={isFieldRevealed('customerConcentration', level) ? formatPercent(deal.customerConcentration) : '???'}
            locked={!isFieldRevealed('customerConcentration', level)}
            unlockLevel={2}
          />
          <InfoRow
            label="Revenue Quality"
            value={isFieldRevealed('revenueQuality', level) ? `${deal.revenueQuality}/100` : '???'}
            locked={!isFieldRevealed('revenueQuality', level)}
            unlockLevel={2}
          />
          <InfoRow
            label="Mgmt Quality"
            value={isFieldRevealed('managementQuality', level) ? `${deal.managementQuality}/10` : '???'}
            locked={!isFieldRevealed('managementQuality', level)}
            unlockLevel={3}
          />
          <InfoRow
            label="Hidden Risks"
            value={isFieldRevealed('hiddenRisksPartial', level) ? `${deal.hiddenRisks.length} flagged` : '???'}
            locked={!isFieldRevealed('hiddenRisksPartial', level)}
            unlockLevel={3}
          />
          {isFieldRevealed('hiddenRisksFull', level) && deal.hiddenRisks.length > 0 && (
            <div className="mt-2 space-y-1">
              {deal.hiddenRisks.map((risk) => (
                <div key={risk} className="text-xs text-terminal-red">- {risk}</div>
              ))}
            </div>
          )}
          <InfoRow
            label="Competitive Pos."
            value={isFieldRevealed('competitivePosition', level) ? `${deal.competitivePosition}/100` : '???'}
            locked={!isFieldRevealed('competitivePosition', level)}
            unlockLevel={4}
          />
          <InfoRow
            label="Hidden Liabilities"
            value={isFieldRevealed('hiddenLiabilities', level) ? formatCurrency(deal.hiddenLiabilities) : '???'}
            locked={!isFieldRevealed('hiddenLiabilities', level)}
            unlockLevel={4}
          />

          <div className="mt-3 border-t border-terminal-border pt-2">
            <InfoRow label="Ask Multiple" value={formatMultiple(deal.askingMultiple)} />
            <InfoRow label="Est. EV" value={formatCurrency(deal.enterpriseValue)} />
            <InfoRow label="Competing Bids" value={String(deal.competingBidCount)} />
          </div>
        </div>

        <div className="space-y-4">
          {!auctionResult && (
            <>
              <div>
                <h4 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Diligence Levels</h4>
                <div className="space-y-1">
                  {DILIGENCE_LEVELS.map((info) => {
                    const isCompleted = level >= info.level
                    const isNext = info.level === level + 1
                    const cost = Math.round(getDiligenceCostForLevel(level, info.level) * diligenceCostMultiplier * 100) / 100
                    const canAfford = cost <= remainingCash

                    return (
                      <button
                        key={info.level}
                        onClick={() => {
                          if (!isCompleted && canAfford) {
                            runDiligence(deal.id, info.level)
                          }
                        }}
                        disabled={isCompleted || !canAfford}
                        className={`w-full rounded border px-3 py-2 text-left text-xs transition-colors ${
                          isCompleted
                            ? 'border-terminal-green/30 bg-terminal-green/10 text-terminal-green'
                            : isNext && canAfford
                              ? 'border-terminal-amber bg-terminal-surface text-terminal-amber hover:bg-terminal-amber/10'
                              : 'border-terminal-border bg-terminal-bg text-terminal-muted'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-mono">Level {info.level}</span>
                          <span className="font-mono">{isCompleted ? 'DONE' : formatCurrency(cost)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {info.revealedLabels.slice(0, 3).map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-terminal-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-terminal-muted"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {level > 0 && (
                  <p className="mt-2 text-xs text-terminal-muted">
                    Diligence spent: {formatCurrency(deal.diligenceCost)}
                  </p>
                )}
              </div>

              {level >= 1 && !deal.playerBid && (
                <div className="border-t border-terminal-border pt-4">
                  <h4 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Submit Bid</h4>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-terminal-muted">Market window</span>
                    <span className="font-mono text-terminal-white">
                      {formatMultiple(adjustedEstimate[0])} - {formatMultiple(adjustedEstimate[1])}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-terminal-muted">Edge</span>
                    <span className="font-mono text-terminal-green">
                      {diligenceModifier.additionalReveal ? '+1 deep tier' : diligenceModifier.effectiveLevelBonus > 0 ? 'Lower spend' : 'Flat'}
                    </span>
                  </div>
                  <div className="mb-2 text-[10px] text-terminal-muted">
                    {assignedPrincipal ? `${assignedPrincipal.name} is covering this deal.` : 'No principal assigned.'}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={bidInput}
                        onChange={(event) => setBidInput(event.target.value)}
                        placeholder="e.g. 8.5"
                        className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm font-mono text-terminal-white focus:outline-none focus:border-terminal-green"
                      />
                      <span className="absolute right-3 top-2 text-sm text-terminal-muted">x</span>
                    </div>
                    <button
                      onClick={() => {
                        if (isValidBid) {
                          submitBid(deal.id, bidValue)
                          setBidInput('')
                        }
                      }}
                      disabled={!isValidBid}
                      className="rounded border border-terminal-green bg-terminal-green/20 px-4 py-2 font-mono text-xs text-terminal-green transition-colors hover:bg-terminal-green/30 disabled:opacity-30"
                    >
                      BID
                    </button>
                  </div>
                  {isValidBid && deal.actualEbitda > 0 && (
                    <p className="mt-1 text-xs font-mono text-terminal-muted">
                      {formatMultiple(bidValue)} x {formatCurrency(deal.actualEbitda)} EBITDA = {formatCurrency(bidValue * deal.actualEbitda)} TEV
                    </p>
                  )}
                </div>
              )}

              {deal.playerBid !== null && (
                <div className="border-t border-terminal-border pt-4">
                  <p className="text-xs font-mono text-terminal-green">
                    Bid submitted: {formatMultiple(deal.playerBid)}
                  </p>
                </div>
              )}
            </>
          )}

          {auctionResult && (
            <div className="border-t border-terminal-border pt-4">
              <h4 className="mb-2 text-xs font-mono uppercase text-terminal-muted">Auction Result</h4>
              {auctionResult.won ? (
                <div className="space-y-1">
                  <p className="text-sm font-mono text-terminal-green">You won at {formatMultiple(auctionResult.winningBid)}</p>
                  {auctionResult.competitorBids.length > 0 && (
                    <p className="text-xs text-terminal-muted">
                      Competing bids: {auctionResult.competitorBids.map((bid) => formatMultiple(bid)).join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-mono text-terminal-red">
                    {auctionResult.winningBid > 0
                      ? `Lost. Winning bid: ${formatMultiple(auctionResult.winningBid)}`
                      : 'Seller walked away.'}
                  </p>
                  {auctionResult.sellerCounterOffer && (
                    <div className="mt-2">
                      <p className="text-xs text-terminal-amber">
                        Seller counter: {formatMultiple(auctionResult.sellerCounterOffer)}
                      </p>
                      <button
                        onClick={() => acceptCounter(deal.id, auctionResult.sellerCounterOffer!)}
                        className="mt-1 rounded border border-terminal-amber bg-terminal-amber/20 px-3 py-1 font-mono text-xs text-terminal-amber hover:bg-terminal-amber/30"
                      >
                        ACCEPT
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  locked = false,
  unlockLevel,
}: {
  label: string
  value: string
  locked?: boolean
  unlockLevel?: number
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className={`font-mono ${locked ? 'text-terminal-border' : 'text-terminal-white'}`}>
        {locked ? (
          <span title={unlockLevel ? `Revealed at Level ${unlockLevel}` : ''}>
            <span className="text-terminal-border">???</span>
            {unlockLevel && <span className="ml-1 text-[10px] text-terminal-border">L{unlockLevel}</span>}
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  )
}

function MiniReadout({
  label,
  value,
  tone = 'white',
  warn = false,
}: {
  label: string
  value: string
  tone?: 'green' | 'red' | 'white'
  warn?: boolean
}) {
  const toneClass = warn
    ? 'text-terminal-red'
    : tone === 'green'
      ? 'text-terminal-green'
      : tone === 'red'
        ? 'text-terminal-red'
        : 'text-terminal-white'

  return (
    <div className="rounded border border-terminal-border bg-terminal-bg/70 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-terminal-muted">{label}</div>
      <div className={`mt-1 text-xs font-medium ${toneClass}`}>{value}</div>
    </div>
  )
}
