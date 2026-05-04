// Predicate + lookup table for character portraits, kept separate from the
// React component so the component module is fast-refresh-clean.
import type { Options as OpenPeepsOptions } from '@dicebear/open-peeps'

export type Face = NonNullable<OpenPeepsOptions['face']>[number]
export type Accessory = NonNullable<OpenPeepsOptions['accessories']>[number]
export type Mask = NonNullable<OpenPeepsOptions['mask']>[number]
export type Head = NonNullable<OpenPeepsOptions['head']>[number]

export interface PortraitTweaks {
  face?: Face
  accessories?: Accessory
  mask?: Mask
  head?: Head
}

// Archetype-coded portrait tweaks — sourcing skews charm, deal team skews
// glasses + analytical, operating skews stern / cost-cutter.
export const PORTRAIT_TWEAKS: Record<string, PortraitTweaks> = {
  // Sourcing — old-money, healthcare charmer, LinkedIn hustler
  s1: { face: 'solemn', head: 'grayShort', accessories: 'glasses' },
  s2: { face: 'smile', head: 'long' },
  s3: { face: 'smileLOL', accessories: 'sunglasses' },
  // Deal team — IC partner, modeler, VP, exhausted associate
  d1: { face: 'serious', accessories: 'glasses2' },
  d2: { face: 'explaining', accessories: 'glasses3' },
  d3: { face: 'tired' },
  d4: { face: 'concerned', accessories: 'glasses4' },
  // Operating partners — Landlord, growth, supply chain
  o1: { face: 'contempt', head: 'grayShort' },
  o2: { face: 'lovingGrin1' },
  o3: { face: 'serious', mask: 'respirator' },
}

export function hasPortrait(id: string | undefined): boolean {
  return !!id && id in PORTRAIT_TWEAKS
}
