import type { MarketConditions } from '../types/effects'
import { PRNG } from './prng'

const BASELINE: MarketConditions = {
  interestRateModifier: 0,
  exitMultipleModifier: 0,
  creditAvailability: 70,
  ipoMarketTemperature: 50,
}

export function createInitialMarketConditions(): MarketConditions {
  return { ...BASELINE }
}

/**
 * Update market conditions each quarter with mean reversion + random walk.
 */
export function updateMarketConditions(
  prng: PRNG,
  current: MarketConditions,
): MarketConditions {
  return {
    interestRateModifier: meanRevert(current.interestRateModifier, BASELINE.interestRateModifier, 0.2, prng.nextFloat(-0.5, 0.5)),
    exitMultipleModifier: meanRevert(current.exitMultipleModifier, BASELINE.exitMultipleModifier, 0.15, prng.nextFloat(-0.3, 0.3)),
    creditAvailability: clamp(meanRevert(current.creditAvailability, BASELINE.creditAvailability, 0.1, prng.nextFloat(-5, 5)), 0, 100),
    ipoMarketTemperature: clamp(meanRevert(current.ipoMarketTemperature, BASELINE.ipoMarketTemperature, 0.1, prng.nextFloat(-8, 8)), 0, 100),
  }
}

function meanRevert(current: number, baseline: number, speed: number, noise: number): number {
  const reversion = (baseline - current) * speed
  return Math.round((current + reversion + noise) * 100) / 100
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
