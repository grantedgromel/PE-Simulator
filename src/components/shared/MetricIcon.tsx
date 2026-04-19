import { useState } from 'react'
import { getMetricIconPath } from '../../engine/assetRegistry'

export type MetricKey =
  | 'cash'
  | 'deployed'
  | 'moic'
  | 'dpi'
  | 'tvpi'
  | 'irr'
  | 'carry'
  | 'reputation'
  | 'lp-trust'
  | 'fees'

interface MetricIconProps {
  metric: MetricKey
  size?: number
  className?: string
  title?: string
}

/**
 * Single-color glyph for a HUD metric. Asset-first with inline-SVG fallback.
 * Intended to sit next to a small numeric value in the TopBar, Sidebar, etc.
 */
export function MetricIcon({ metric, size = 14, className = '', title }: MetricIconProps) {
  const [failed, setFailed] = useState(false)
  const path = getMetricIconPath(metric)

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center text-current ${className}`}
        style={{ width: size, height: size }}
        title={title}
        aria-hidden="true"
      >
        {renderMetricGlyph(metric, size)}
      </span>
    )
  }

  return (
    <img
      src={path}
      alt=""
      title={title}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

function renderMetricGlyph(metric: MetricKey, size: number) {
  const stroke = 'currentColor'
  const sw = Math.max(1.3, size / 10)

  switch (metric) {
    case 'cash':
      // $ in circle
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <path
            d="M15 9a3 3 0 00-3-2c-1.8 0-3 1-3 2.3 0 3 6 1.7 6 4.7 0 1.4-1.3 2.5-3 2.5a3 3 0 01-3-2M12 6v12"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      )
    case 'deployed':
      // Outgoing arrow stack
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 20l8-8M12 4h8v8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 14v6h6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'moic':
    case 'tvpi':
      // "×" multiplier
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <path d="M8 8l8 8M16 8l-8 8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
    case 'dpi':
      // Coins stack (distributions)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="7" rx="7" ry="2.5" stroke={stroke} strokeWidth={sw} />
          <path d="M5 7v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7" stroke={stroke} strokeWidth={sw} />
          <path d="M5 12v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" stroke={stroke} strokeWidth={sw} />
        </svg>
      )
    case 'irr':
      // Trend up
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 17l6-6 4 4 8-9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 6h6v6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'carry':
      // Trophy-ish
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 4h10v5a5 5 0 01-10 0V4zM3 6h4v2a2 2 0 01-2 2H4V6zM17 6h4v4h-1a2 2 0 01-2-2V6zM9 15h6M12 14v4M8 20h8"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'reputation':
      // Star
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4 6.4 20.4l1.1-6.3L2.9 9.6l6.3-.9L12 3z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'lp-trust':
      // Handshake-adjacent
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12l4-4 3 3 5-5 6 6-5 5-3-3-4 4-6-6z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'fees':
      // Receipt
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path d="M9 8h6M9 12h6M9 16h4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
  }
}
