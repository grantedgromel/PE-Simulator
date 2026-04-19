/**
 * Thin sprite/texture cache for the Pixi map.
 *
 * Guarantees:
 *  - Each (path) is fetched at most once per session.
 *  - Failed loads resolve to `null`, not a rejected promise — callers must
 *    handle `null` by falling back to procedural rendering.
 *  - Safe to call during React render as long as consumers read via the
 *    returned promise (no sync throws).
 */

import { Assets, type Texture } from 'pixi.js'

type CacheEntry = {
  promise: Promise<Texture | null>
  texture: Texture | null
  failed: boolean
}

const cache = new Map<string, CacheEntry>()

/** Resolve a texture path to a Texture, or null if the asset is missing. */
export function loadTexture(path: string): Promise<Texture | null> {
  const existing = cache.get(path)
  if (existing) return existing.promise

  const promise = Assets.load(path)
    .then((tex: Texture) => {
      const entry = cache.get(path)
      if (entry) entry.texture = tex
      return tex
    })
    .catch(() => {
      const entry = cache.get(path)
      if (entry) entry.failed = true
      return null
    })

  cache.set(path, { promise, texture: null, failed: false })
  return promise
}

/** Synchronous peek — returns null if the asset isn't loaded yet or failed. */
export function peekTexture(path: string): Texture | null {
  const entry = cache.get(path)
  if (!entry || entry.failed) return null
  return entry.texture
}

/** Try a sequence of paths, returning the first one that loads. */
export async function loadTextureWithFallback(
  paths: readonly string[],
): Promise<Texture | null> {
  for (const p of paths) {
    const tex = await loadTexture(p)
    if (tex) return tex
  }
  return null
}
