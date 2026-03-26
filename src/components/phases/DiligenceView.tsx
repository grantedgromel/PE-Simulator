import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { DILIGENCE_LEVELS, getDiligenceCostForLevel, isFieldRevealed } from '../../engine/diligenceEngine'
import { getMarketEstimate } from '../../engine/auctionEngine'
import { formatCurrency, formatMultiple, formatPercent } from '../../utils/formatters'

export function DiligenceView() {
  const {
    currentDeals, auctionResults, fund,
    resolveAllAuctions,
  } = useGameStore()

  const pursuedDeals = currentDeals.filter((d) => d.status === 'Pursued')
  const allBidsSubmitted = pursuedDeals.every((d) => d.playerBid !== null)
  const auctionsResolved = auctionResults.length > 0

  if (pursuedDeals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <p className="font-mono">No deals to diligence this quarter.</p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <div>
        <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">
          Due Diligence & Bidding
        </h2>
        <p className="text-xs text-terminal-muted mt-1">
          Run diligence to reveal hidden information, then submit your bid.
        </p>
      </div>

      {pursuedDeals.map((deal) => {
        const result = auctionResults.find((r) => r.dealId === deal.id)
        return (
          <DealDiligenceCard
            key={deal.id}
            deal={deal}
            auctionResult={result}
            remainingCash={fund.remainingCapital}
          />
        )
      })}

      {/* Resolve Auctions button */}
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
  const { runDiligence, submitBid, acceptCounter } = useGameStore()
  const [bidInput, setBidInput] = useState('')
  const level = deal.diligenceLevelCompleted
  const estimate = getMarketEstimate(deal)

  const bidValue = parseFloat(bidInput)
  const isValidBid = !isNaN(bidValue) && bidValue > 0

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-terminal-white font-medium">{deal.name}</h3>
          <p className="text-terminal-muted text-xs">{deal.subSector}</p>
        </div>
        {auctionResult && (
          <span className={`text-sm font-mono ${auctionResult.won ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {auctionResult.won ? 'WON' : 'LOST'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Company info with progressive reveal */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-terminal-muted uppercase">Company Information</h4>

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
            value={isFieldRevealed('hiddenRisksPartial', level) ? `${deal.hiddenRisks.length} identified` : '???'}
            locked={!isFieldRevealed('hiddenRisksPartial', level)}
            unlockLevel={3}
          />
          {isFieldRevealed('hiddenRisksFull', level) && deal.hiddenRisks.length > 0 && (
            <div className="mt-2 space-y-1">
              {deal.hiddenRisks.map((risk, i) => (
                <div key={i} className="text-xs text-terminal-red">- {risk}</div>
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

          <div className="border-t border-terminal-border mt-3 pt-2">
            <InfoRow label="Ask Multiple" value={formatMultiple(deal.askingMultiple)} />
            <InfoRow label="Est. EV" value={formatCurrency(deal.enterpriseValue)} />
            <InfoRow label="Competing Bids" value={String(deal.competingBidCount)} />
          </div>
        </div>

        {/* Right: Diligence controls + bidding */}
        <div className="space-y-4">
          {/* Diligence Level Selector */}
          {!auctionResult && (
            <>
              <div>
                <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Diligence Level</h4>
                <div className="space-y-1">
                  {DILIGENCE_LEVELS.map((info) => {
                    const isCompleted = level >= info.level
                    const isNext = info.level === level + 1
                    const cost = getDiligenceCostForLevel(level, info.level)
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
                        className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                          isCompleted
                            ? 'bg-terminal-green/10 border-terminal-green/30 text-terminal-green'
                            : isNext && canAfford
                              ? 'bg-terminal-surface border-terminal-amber text-terminal-amber hover:bg-terminal-amber/10'
                              : 'bg-terminal-bg border-terminal-border text-terminal-muted'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-mono">Level {info.level}</span>
                          <span className="font-mono">
                            {isCompleted ? 'DONE' : formatCurrency(cost)}
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5 opacity-70">{info.description}</p>
                      </button>
                    )
                  })}
                </div>
                {level > 0 && (
                  <p className="text-xs text-terminal-muted mt-2">
                    Diligence spent: {formatCurrency(deal.diligenceCost)}
                  </p>
                )}
              </div>

              {/* Bidding */}
              {level >= 1 && !deal.playerBid && (
                <div className="border-t border-terminal-border pt-4">
                  <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Submit Bid</h4>
                  <div className="text-xs text-terminal-muted mb-2">
                    Market estimate: {formatMultiple(estimate[0])} — {formatMultiple(estimate[1])}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        placeholder="e.g. 8.5"
                        className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-white font-mono text-sm focus:outline-none focus:border-terminal-green"
                      />
                      <span className="absolute right-3 top-2 text-terminal-muted text-sm">x</span>
                    </div>
                    <button
                      onClick={() => {
                        if (isValidBid) {
                          submitBid(deal.id, bidValue)
                          setBidInput('')
                        }
                      }}
                      disabled={!isValidBid}
                      className="px-4 py-2 bg-terminal-green/20 border border-terminal-green text-terminal-green font-mono text-xs rounded hover:bg-terminal-green/30 transition-colors disabled:opacity-30"
                    >
                      BID
                    </button>
                  </div>
                  {isValidBid && deal.actualEbitda > 0 && (
                    <p className="text-xs text-terminal-muted mt-1 font-mono">
                      {formatMultiple(bidValue)} x {formatCurrency(deal.actualEbitda)} EBITDA = {formatCurrency(bidValue * deal.actualEbitda)} TEV
                    </p>
                  )}
                </div>
              )}

              {/* Bid submitted, waiting for resolution */}
              {deal.playerBid !== null && (
                <div className="border-t border-terminal-border pt-4">
                  <p className="text-xs font-mono text-terminal-green">
                    Bid submitted: {formatMultiple(deal.playerBid)}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Auction result */}
          {auctionResult && (
            <div className="border-t border-terminal-border pt-4">
              <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Auction Result</h4>
              {auctionResult.won ? (
                <div className="space-y-1">
                  <p className="text-sm text-terminal-green font-mono">You won at {formatMultiple(auctionResult.winningBid)}</p>
                  {auctionResult.competitorBids.length > 0 && (
                    <p className="text-xs text-terminal-muted">
                      Competing bids: {auctionResult.competitorBids.map((b) => formatMultiple(b)).join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-terminal-red font-mono">
                    {auctionResult.winningBid > 0
                      ? `Lost. Winning bid: ${formatMultiple(auctionResult.winningBid)}`
                      : 'Seller walked away.'}
                  </p>
                  {auctionResult.sellerCounterOffer && (
                    <div className="mt-2">
                      <p className="text-xs text-terminal-amber">
                        Seller counter-offer: {formatMultiple(auctionResult.sellerCounterOffer)}
                      </p>
                      <button
                        onClick={() => acceptCounter(deal.id, auctionResult.sellerCounterOffer!)}
                        className="mt-1 px-3 py-1 bg-terminal-amber/20 border border-terminal-amber text-terminal-amber font-mono text-xs rounded hover:bg-terminal-amber/30"
                      >
                        ACCEPT COUNTER
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
    <div className="flex justify-between items-center text-xs">
      <span className="text-terminal-muted">{label}</span>
      <span className={`font-mono ${locked ? 'text-terminal-border' : 'text-terminal-white'}`}>
        {locked ? (
          <span title={unlockLevel ? `Revealed at Level ${unlockLevel}` : ''}>
            <span className="text-terminal-border">???</span>
            {unlockLevel && <span className="text-[10px] text-terminal-border ml-1">L{unlockLevel}</span>}
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  )
}
