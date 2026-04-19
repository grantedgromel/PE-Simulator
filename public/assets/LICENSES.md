# Asset Licenses & Attribution

This directory holds runtime art assets for PE Simulator. Every asset pack dropped in here must be logged below with source, license, and attribution requirements.

## Layout

```
public/assets/
  buildings/
    healthcare/         # hospitals, clinics, dental offices
    businessservices/   # offices, low-rise commercial
    consumer/           # storefronts, restaurants
    technology/         # modern glass offices, data centers
    industrial/         # factories, warehouses
    hq/                 # the player's firm HQ (multiple tiers)
  portraits/
    {role}/             # one folder per TeamRole and CharacterType
  characters/           # full-body character sprites for the map
  icons/
    sector/             # one icon per sector
    action/             # value-creation action icons (cost cut, add-on, etc.)
    status/             # health/status glyphs (healthy, stressed, distressed, exited)
    metric/             # HUD metric glyphs (cash, MOIC, DPI, carry, etc.)
```

## Asset Packs In Use

*(empty — packs to be dropped in here. Keep this list accurate.)*

### Recommended first packs

| Pack | Source | License | Attribution required | Use |
|---|---|---|---|---|
| Kenney Isometric Buildings | https://kenney.nl/assets/isometric-buildings-1 | CC0 | No | `buildings/**` |
| Kenney City Kit (Commercial + Suburban) | https://kenney.nl | CC0 | No | `buildings/**`, map ambience |
| Kenney Character Pack | https://kenney.nl | CC0 | No | `characters/**`, portrait fallbacks |
| game-icons.net (flat) | https://game-icons.net | CC-BY 3.0 | **Yes** — credit in this file + in-game credits screen | `icons/**` |
| Heroicons | https://heroicons.com | MIT | No (but keep in mind) | HUD glyphs |

## Attribution ledger

When you add a CC-BY-licensed asset, append an entry here:

```
- <file path> — "<original name>" by <author> (<license>, <source URL>)
```

*(empty)*

## Runtime fallback

Any entity whose resolved sprite path is missing at runtime falls back to the
procedural rendering in `GameMap.tsx` (colored isometric rectangles) and
`engine/portraitGenerator.ts` (procedural SVG faces). The game must stay playable
with **zero** assets in this directory.
