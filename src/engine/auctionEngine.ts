import type { Deal } from '../types/deal'
import type { Difficulty } from '../types/game'
import { PRNG } from './prng'

export interface AuctionResult {
  won: boolean
  playerBid: number
  winningBid: number
  competitorBids: number[]
  sellerCounterOffer?: number
}

/**
 * Resolve an auction for a deal.
 * Returns whether the player won and what the competing bids were.
 */
export function resolveAuction(
  prng: PRNG,
  deal: Deal,
  playerBidMultiple: number,
  difficulty: Difficulty,
): AuctionResult {
  if (deal.source === 'Proprietary') {
    return resolveProprietaryDeal(prng, deal, playerBidMultiple)
  }

  return resolveCompetitiveAuction(prng, deal, playerBidMultiple, difficulty)
}

function resolveCompetitiveAuction(
  prng: PRNG,
  deal: Deal,
  playerBidMultiple: number,
  difficulty: Difficulty,
): AuctionResult {
  const competitorBids: number[] = []
  const asking = deal.askingMultiple

  // AI bidding behavior depends on deal quality and difficulty
  const qualityFactor = deal.dealQuality / 10 // 0.3 - 0.9

  for (let i = 0; i < deal.competingBidCount; i++) {
    // Base range: 0.80-1.10 of asking price
    let minMult = 0.80
    let maxMult = 1.05

    // High quality deals attract more aggressive bids
    if (qualityFactor > 0.7) {
      minMult = 0.90
      maxMult = 1.15
    } else if (qualityFactor < 0.4) {
      minMult = 0.70
      maxMult = 0.95
    }

    // Difficulty adjustment
    if (difficulty === 'Hard') {
      minMult += 0.05
      maxMult += 0.10
    } else if (difficulty === 'Easy') {
      minMult -= 0.05
      maxMult -= 0.05
    }

    // Some competitors may pass on lower quality deals
    if (qualityFactor < 0.4 && prng.chance(0.3)) {
      continue // competitor passes
    }

    const bidMultiple = asking * prng.nextFloat(minMult, maxMult)
    competitorBids.push(Math.round(bidMultiple * 10) / 10)
  }

  const highestCompetitorBid = competitorBids.length > 0
    ? Math.max(...competitorBids)
    : 0

  // Player wins if their bid is strictly higher than all competitors
  const won = playerBidMultiple > highestCompetitorBid

  return {
    won,
    playerBid: playerBidMultiple,
    winningBid: won ? playerBidMultiple : highestCompetitorBid,
    competitorBids,
  }
}

function resolveProprietaryDeal(
  prng: PRNG,
  deal: Deal,
  playerBidMultiple: number,
): AuctionResult {
  // Seller's reservation price: 85-95% of asking
  const reservationMultiple = deal.askingMultiple * prng.nextFloat(0.85, 0.95)

  if (playerBidMultiple >= reservationMultiple) {
    // Deal accepted
    return {
      won: true,
      playerBid: playerBidMultiple,
      winningBid: playerBidMultiple,
      competitorBids: [],
    }
  }

  // Check if bid is close enough for counter-offer
  const gap = reservationMultiple - playerBidMultiple
  if (gap <= 0.5) {
    const counterOffer = Math.round(((playerBidMultiple + reservationMultiple) / 2) * 10) / 10
    return {
      won: false,
      playerBid: playerBidMultiple,
      winningBid: 0,
      competitorBids: [],
      sellerCounterOffer: counterOffer,
    }
  }

  // Bid too low — seller walks
  return {
    won: false,
    playerBid: playerBidMultiple,
    winningBid: 0,
    competitorBids: [],
  }
}

/**
 * Accept a counter-offer on a proprietary deal.
 */
export function acceptCounterOffer(_deal: Deal, counterMultiple: number): AuctionResult {
  return {
    won: true,
    playerBid: counterMultiple,
    winningBid: counterMultiple,
    competitorBids: [],
  }
}

/**
 * Get estimated competing bid range for UI display.
 */
export function getMarketEstimate(deal: Deal): [number, number] {
  const asking = deal.askingMultiple

  switch (deal.source) {
    case 'Auction':
      return [
        Math.round((asking - 2.0) * 10) / 10,
        Math.round((asking + 2.0) * 10) / 10,
      ]
    case 'LimitedProcess':
      return [
        Math.round((asking - 1.5) * 10) / 10,
        Math.round((asking + 1.5) * 10) / 10,
      ]
    case 'Proprietary':
      return [
        Math.round((asking - 1.0) * 10) / 10,
        asking,
      ]
  }
}
