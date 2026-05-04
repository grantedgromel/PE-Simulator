// Shared chrome — arcade panels, HUD primitives, buttons, meters, tags.
import type { CSSProperties, ReactNode } from 'react'

type Tone = 'cream' | 'ink' | 'orange' | 'lime' | 'pink' | 'paper'

const PANEL_TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  cream: { bg: '#F7F1E1', fg: '#1A1833', border: '#1A1833' },
  ink: { bg: '#1A1833', fg: '#F7F1E1', border: '#F7F1E1' },
  orange: { bg: '#FF7A3C', fg: '#1A1833', border: '#1A1833' },
  lime: { bg: '#C9FF3C', fg: '#1A1833', border: '#1A1833' },
  pink: { bg: '#FF3DA5', fg: '#1A1833', border: '#1A1833' },
  paper: { bg: '#EFE6CF', fg: '#1A1833', border: '#1A1833' },
}

interface PanelProps {
  children: ReactNode
  tone?: Tone
  className?: string
  style?: CSSProperties
  label?: string
  onClick?: () => void
}

export function Panel({ children, tone = 'cream', className = '', style, label, onClick }: PanelProps) {
  const t = PANEL_TONES[tone]
  return (
    <div
      onClick={onClick}
      className={`pe-panel ${className}`}
      style={{ background: t.bg, color: t.fg, borderColor: t.border, ...style }}
    >
      {label && <div className="pe-panel-label" style={{ background: t.bg, color: t.fg, borderColor: t.border }}>{label}</div>}
      {children}
    </div>
  )
}

type BtnTone = 'lime' | 'orange' | 'pink' | 'cream' | 'ink' | 'ghost'

const BTN_TONES: Record<BtnTone, { bg: string; fg: string }> = {
  lime: { bg: '#C9FF3C', fg: '#1A1833' },
  orange: { bg: '#FF7A3C', fg: '#1A1833' },
  pink: { bg: '#FF3DA5', fg: '#1A1833' },
  cream: { bg: '#F7F1E1', fg: '#1A1833' },
  ink: { bg: '#1A1833', fg: '#F7F1E1' },
  ghost: { bg: 'transparent', fg: '#F7F1E1' },
}

interface BigBtnProps {
  children: ReactNode
  onClick?: () => void
  tone?: BtnTone
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

export function BigBtn({ children, onClick, tone = 'lime', disabled, size = 'md', style }: BigBtnProps) {
  const t = BTN_TONES[tone]
  const pad = size === 'lg' ? '18px 32px' : size === 'sm' ? '6px 12px' : '12px 22px'
  const fs = size === 'lg' ? 22 : size === 'sm' ? 12 : 15
  return (
    <button
      className="pe-bigbtn"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: t.bg,
        color: t.fg,
        padding: pad,
        fontSize: fs,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

interface StatProps {
  label: string
  value: string
  sub?: string
  tone?: string
}

export function Stat({ label, value, sub, tone }: StatProps) {
  return (
    <div className="pe-stat" style={tone ? { background: tone } : undefined}>
      <div className="pe-stat-label">{label}</div>
      <div className="pe-stat-value">{value}</div>
      {sub && <div className="pe-stat-sub">{sub}</div>}
    </div>
  )
}

interface MeterProps {
  value: number
  max?: number
  tone?: string
  height?: number
  showPct?: boolean
}

export function Meter({ value, max = 100, tone = '#FF7A3C', height = 10, showPct = false }: MeterProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="pe-meter" style={{ height }}>
      <div className="pe-meter-fill" style={{ width: `${pct}%`, background: tone }} />
      {showPct && <div className="pe-meter-label">{Math.round(pct)}%</div>}
    </div>
  )
}

type TagTone = 'paper' | 'orange' | 'pink' | 'lime' | 'ink' | 'cream'
const TAG_TONES: Record<TagTone, { bg: string; fg: string }> = {
  paper: { bg: '#EFE6CF', fg: '#1A1833' },
  orange: { bg: '#FF7A3C', fg: '#1A1833' },
  pink: { bg: '#FF3DA5', fg: '#1A1833' },
  lime: { bg: '#C9FF3C', fg: '#1A1833' },
  ink: { bg: '#1A1833', fg: '#F7F1E1' },
  cream: { bg: '#F7F1E1', fg: '#1A1833' },
}

export function Tag({ children, tone = 'paper' }: { children: ReactNode; tone?: TagTone }) {
  const t = TAG_TONES[tone]
  return <span className="pe-tag" style={{ background: t.bg, color: t.fg }}>{children}</span>
}

export function HeatDots({ heat }: { heat: number }) {
  return (
    <div className="pe-heat">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={'pe-heat-dot ' + (i <= heat ? 'on' : 'off')} />
      ))}
    </div>
  )
}
