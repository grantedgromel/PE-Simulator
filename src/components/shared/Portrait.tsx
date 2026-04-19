import { useState, useMemo } from 'react'
import type { TeamRole } from '../../types/team'
import type { CharacterType, Expression } from '../../types/npc'
import {
  getTeamMemberPortraitPath,
  getNPCPortraitPath,
  getNPCPortraitFallbackPath,
} from '../../engine/assetRegistry'
import { generatePortraitConfig, renderPortraitSVG } from '../../engine/portraitGenerator'

export type PortraitSubject =
  | { kind: 'team'; role: TeamRole; seed: number }
  | { kind: 'npc'; characterType: CharacterType; seed: number; expression?: Expression }

export interface PortraitProps {
  subject: PortraitSubject
  size?: number
  className?: string
  rounded?: 'none' | 'md' | 'full'
  ringColor?: string
  title?: string
}

/**
 * Renders a character portrait. Tries to load a real asset from
 * /public/assets/portraits/... first; falls back to the procedural SVG
 * generator so the UI is never blank.
 *
 * The asset paths and SVG are both derived deterministically from (kind,
 * role/characterType, seed) — same seed renders the same face across reloads.
 */
export function Portrait({
  subject,
  size = 64,
  className = '',
  rounded = 'md',
  ringColor,
  title,
}: PortraitProps) {
  const paths = useMemo(() => resolvePaths(subject), [subject])
  const [pathIndex, setPathIndex] = useState(0)
  const failed = pathIndex >= paths.length

  const svgMarkup = useMemo(() => {
    if (!failed) return ''
    return renderProceduralPortrait(subject)
  }, [failed, subject])

  const roundClass = rounded === 'full' ? 'rounded-full' : rounded === 'md' ? 'rounded' : ''
  const ringStyle = ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined

  return (
    <div
      className={`inline-block overflow-hidden bg-terminal-bg border border-terminal-border ${roundClass} ${className}`}
      style={{ width: size, height: size, ...ringStyle }}
      title={title}
    >
      {failed ? (
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : (
        <img
          src={paths[pathIndex]}
          alt=""
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setPathIndex((i) => i + 1)}
        />
      )}
    </div>
  )
}

function resolvePaths(subject: PortraitSubject): string[] {
  if (subject.kind === 'team') {
    return [getTeamMemberPortraitPath(subject.role, subject.seed)]
  }
  const expr = subject.expression ?? 'neutral'
  return [
    getNPCPortraitPath(subject.characterType, subject.seed, expr),
    getNPCPortraitFallbackPath(subject.characterType, subject.seed),
  ]
}

function renderProceduralPortrait(subject: PortraitSubject): string {
  const config = generatePortraitConfig(subject.seed)
  if (subject.kind === 'team') {
    return renderPortraitSVG(config, 'neutral', subject.role.toLowerCase())
  }
  return renderPortraitSVG(
    config,
    subject.expression ?? 'neutral',
    subject.characterType.toLowerCase(),
  )
}
