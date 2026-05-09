// Character portraits — DiceBear open-peeps style (CC0 art / MIT code).
// Deterministic from each character's `art` key so the cast is stable.
import { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import type { StyleOptions } from '@dicebear/core'
import { openPeeps } from '@dicebear/collection'
import type { Options as OpenPeepsOptions } from '@dicebear/open-peeps'
import { PORTRAIT_TWEAKS } from './portraitData'

interface PersonPortraitProps {
  id: string
  bg: string
  size: number
}

export function PersonPortrait({ id, bg, size }: PersonPortraitProps) {
  const svg = useMemo(() => {
    const tweaks = PORTRAIT_TWEAKS[id] ?? {}
    const opts: StyleOptions<OpenPeepsOptions> = {
      seed: id,
      size,
      backgroundColor: [bg.replace('#', '')],
    }
    if (tweaks.face) opts.face = [tweaks.face]
    if (tweaks.accessories) {
      opts.accessories = [tweaks.accessories]
      opts.accessoriesProbability = 100
    }
    if (tweaks.mask) {
      opts.mask = [tweaks.mask]
      opts.maskProbability = 100
    }
    if (tweaks.head) opts.head = [tweaks.head]
    return createAvatar(openPeeps, opts).toString()
  }, [id, bg, size])

  return <div className="pe-portrait-svg" dangerouslySetInnerHTML={{ __html: svg }} />
}
