import { useState } from 'react'
import type { Sector } from '../../types/game'
import { getSectorIconPath } from '../../engine/assetRegistry'

interface SectorIconProps {
  sector: Sector
  size?: number
  className?: string
  title?: string
}

/**
 * Renders a single-color glyph for a sector.
 * Asset-first (svg file under /assets/icons/sector/), with a built-in
 * inline-SVG fallback so every sector reads at a glance even with zero
 * assets installed.
 */
export function SectorIcon({ sector, size = 16, className = '', title }: SectorIconProps) {
  const [failed, setFailed] = useState(false)
  const path = getSectorIconPath(sector)

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center text-current ${className}`}
        style={{ width: size, height: size }}
        title={title ?? sector}
        aria-label={sector}
      >
        {renderSectorGlyph(sector, size)}
      </span>
    )
  }

  return (
    <img
      src={path}
      alt={sector}
      title={title ?? sector}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

function renderSectorGlyph(sector: Sector, size: number) {
  const stroke = 'currentColor'
  const sw = Math.max(1.3, size / 12)

  switch (sector) {
    case 'Healthcare':
      // Plus / medical cross in a rounded square
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={stroke} strokeWidth={sw} />
          <path d="M12 8v8M8 12h8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
    case 'BusinessServices':
      // Briefcase
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="7" width="18" height="12" rx="2" stroke={stroke} strokeWidth={sw} />
          <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
    case 'Consumer':
      // Shopping bag
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M5 8h14l-1.2 11a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 016 0v2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
    case 'Technology':
      // Chip
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="6" y="6" width="12" height="12" rx="2" stroke={stroke} strokeWidth={sw} />
          <rect x="9.5" y="9.5" width="5" height="5" stroke={stroke} strokeWidth={sw} />
          <path
            d="M10 6V3M14 6V3M10 21v-3M14 21v-3M6 10H3M6 14H3M21 10h-3M21 14h-3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      )
    case 'Industrial':
      // Factory silhouette
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 20V10l5 3V10l5 3V10l5 3v7H3z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path d="M6 20v-3M10 20v-3M14 20v-3M18 20v-3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      )
  }
}
