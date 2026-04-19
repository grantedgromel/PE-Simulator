import { useEffect, useRef, useCallback, useState } from 'react'
import { Application, Graphics, Container, Text, TextStyle, Sprite } from 'pixi.js'
import { useGameStore } from '../../store/gameStore'
import {
  generateMapState,
  gridToScreen,
  screenToGrid,
  type MapBuilding,
  type MapRoad,
} from '../../engine/isometricMap'
import {
  getBuildingSpritePath,
  getBuildingSpriteFallbackPath,
  getHQSpritePath,
  SECTOR_PALETTE,
  type HealthState,
} from '../../engine/assetRegistry'
import { loadTexture, peekTexture } from '../../engine/spriteCache'

const COLORS = {
  bg: 0x0a0a0f,
  road: 0x1e1e2e,
  roadHighlight: 0x2e2e3e,
  healthy: 0x00ff88,
  stressed: 0xffb700,
  distressed: 0xff4444,
  construction: 0x4488ff,
  exited: 0x3a3a4a,
  destroyed: 0x2a2a2a,
  hq: 0x00ff88,
  window: 0xffb700,
  windowOff: 0x1a1a28,
  text: 0xe8e8ed,
  textMuted: 0x6b6b7b,
}

const HEALTH_TINT: Record<HealthState, number | null> = {
  healthy: null,
  stressed: 0xffcc66,
  distressed: 0xff6666,
  construction: 0x88aaff,
  exited: 0x888888,
  destroyed: 0x444444,
}

const HEALTH_COLORS: Record<string, number> = {
  healthy: COLORS.healthy,
  stressed: COLORS.stressed,
  distressed: COLORS.distressed,
  construction: COLORS.construction,
  exited: COLORS.exited,
  destroyed: COLORS.destroyed,
}

interface GameMapProps {
  onBuildingClick?: (companyId: string) => void
}

export function GameMap({ onBuildingClick }: GameMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const worldRef = useRef<Container | null>(null)
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)
  // Bumped when a sprite texture finishes loading so the renderer re-runs.
  const [spriteVersion, setSpriteVersion] = useState(0)

  const { portfolioCompanies, teamMembers, currentFundCycle } = useGameStore()

  const mapState = generateMapState(portfolioCompanies, teamMembers, currentFundCycle)

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const app = new Application()
    const initPromise = app.init({
      background: COLORS.bg,
      resizeTo: canvasRef.current,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    initPromise.then(() => {
      if (!canvasRef.current) return
      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
      appRef.current = app

      const world = new Container()
      world.sortableChildren = true
      app.stage.addChild(world)
      worldRef.current = world

      // Center the world
      world.x = app.screen.width / 2
      world.y = app.screen.height / 3
    })

    return () => {
      app.destroy(true, { children: true })
      appRef.current = null
      worldRef.current = null
    }
  }, [])

  // Render map
  useEffect(() => {
    const world = worldRef.current
    if (!world) return

    // Clear previous render
    world.removeChildren()

    // Draw roads
    for (const road of mapState.roads) {
      drawRoad(world, road)
    }

    // Draw buildings — sprite-first, fallback to Graphics.
    for (const building of mapState.buildings) {
      drawBuilding(world, building, building.companyId === hoveredBuilding, () => {
        setSpriteVersion((v) => v + 1)
      })
    }
  }, [mapState, hoveredBuilding, spriteVersion])

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const world = worldRef.current
    const app = appRef.current
    if (!world || !app) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenX = e.clientX - rect.left - world.x
    const screenY = e.clientY - rect.top - world.y
    const { gridX, gridY } = screenToGrid(screenX, screenY)

    const found = mapState.buildings.find(
      (b) => Math.abs(b.gridX - gridX) <= 1 && Math.abs(b.gridY - gridY) <= 1,
    )
    setHoveredBuilding(found?.companyId ?? null)
  }, [mapState])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const world = worldRef.current
    if (!world) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenX = e.clientX - rect.left - world.x
    const screenY = e.clientY - rect.top - world.y
    const { gridX, gridY } = screenToGrid(screenX, screenY)

    const found = mapState.buildings.find(
      (b) => Math.abs(b.gridX - gridX) <= 1 && Math.abs(b.gridY - gridY) <= 1,
    )

    if (found && onBuildingClick) {
      onBuildingClick(found.companyId)
    }
  }, [mapState, onBuildingClick])

  // Drag to pan
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !worldRef.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    worldRef.current.x += dx
    worldRef.current.y += dy
    dragStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!worldRef.current) return
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(3, worldRef.current.scale.x * delta))
    worldRef.current.scale.set(newScale, newScale)
  }, [])

  return (
    <div
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseMove={(e) => { handleMouseMove(e); handleDrag(e) }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  )
}

// === DRAWING FUNCTIONS ===

function drawRoad(container: Container, road: MapRoad) {
  const from = gridToScreen(road.fromX, road.fromY)
  const to = gridToScreen(road.toX, road.toY)
  const g = new Graphics()
  g.moveTo(from.x, from.y)
  g.lineTo(to.x, to.y)
  g.stroke({ width: 3, color: COLORS.road, alpha: 0.6 })
  g.zIndex = 0
  container.addChild(g)
}

/**
 * Render a building. Tries to use a real sprite asset if one is available in
 * the sprite cache; otherwise falls back to the procedural Graphics renderer
 * (so the game stays fully playable with zero assets installed).
 *
 * When a sprite finishes loading asynchronously, onSpriteReady is called so
 * the caller can trigger a re-render.
 */
function drawBuilding(
  container: Container,
  building: MapBuilding,
  hovered: boolean,
  onSpriteReady: () => void,
) {
  const pos = gridToScreen(building.gridX, building.gridY)
  const buildingContainer = new Container()
  buildingContainer.x = pos.x
  buildingContainer.y = pos.y
  buildingContainer.zIndex = building.gridX + building.gridY

  const spritePaths = buildingSpritePaths(building)
  const cachedSprite = firstCachedSprite(spritePaths)

  if (cachedSprite) {
    renderSprite(buildingContainer, cachedSprite, building, hovered)
  } else if (building.isHQ) {
    drawHQBuilding(buildingContainer, building, hovered)
    ensureSpriteLoaded(spritePaths, onSpriteReady)
  } else {
    const color = HEALTH_COLORS[building.healthState] ?? COLORS.exited
    const alpha = building.healthState === 'exited' ? 0.4 : building.healthState === 'destroyed' ? 0.2 : 0.8
    drawPortfolioBuilding(buildingContainer, building, color, alpha, hovered)
    ensureSpriteLoaded(spritePaths, onSpriteReady)
  }

  // Name label
  const textStyle = new TextStyle({
    fontSize: 9,
    fill: hovered ? COLORS.text : COLORS.textMuted,
    fontFamily: 'monospace',
  })
  const label = new Text({ text: building.name.substring(0, 15), style: textStyle })
  label.anchor.set(0.5, 0)
  label.y = 20
  buildingContainer.addChild(label)

  // OP indicator
  if (building.assignedOPName) {
    const opStyle = new TextStyle({ fontSize: 7, fill: COLORS.healthy, fontFamily: 'monospace' })
    const opLabel = new Text({ text: `OP: ${building.assignedOPName.split(' ')[0]}`, style: opStyle })
    opLabel.anchor.set(0.5, 0)
    opLabel.y = 30
    buildingContainer.addChild(opLabel)
  }

  // Sector badge (portfolio buildings only) — a small colored chip with a 2-letter code
  // floated above the building so you can scan sectors at-a-glance even when sprites are missing.
  if (!building.isHQ && building.sectorTyped) {
    drawSectorBadge(buildingContainer, building.sectorTyped, building.healthState)
  }

  // Add-on indicators
  if (building.addOnCount > 0 && !cachedSprite) {
    const color = HEALTH_COLORS[building.healthState] ?? COLORS.exited
    const alpha = building.healthState === 'exited' ? 0.4 : 0.8
    for (let i = 0; i < Math.min(building.addOnCount, 4); i++) {
      const addon = new Graphics()
      const offsetX = (i - building.addOnCount / 2) * 14
      addon.rect(offsetX - 4, -24, 8, 6)
      addon.fill({ color, alpha: alpha * 0.6 })
      addon.stroke({ width: 0.5, color, alpha })
      buildingContainer.addChild(addon)
    }
  }

  container.addChild(buildingContainer)
}

function buildingSpritePaths(building: MapBuilding): string[] {
  if (building.isHQ) {
    return [getHQSpritePath(building.visualTier)]
  }
  if (!building.sectorTyped) return []
  return [
    getBuildingSpritePath(
      building.sectorTyped,
      building.buildingVariant,
      building.visualTier,
      building.healthState,
    ),
    getBuildingSpriteFallbackPath(building.sectorTyped, building.buildingVariant),
  ]
}

function firstCachedSprite(paths: string[]) {
  for (const p of paths) {
    const tex = peekTexture(p)
    if (tex) return tex
  }
  return null
}

const SECTOR_BADGE_CODE: Record<import('../../types/game').Sector, string> = {
  Healthcare: 'HC',
  BusinessServices: 'BS',
  Consumer: 'CN',
  Technology: 'TC',
  Industrial: 'IN',
}

function drawSectorBadge(
  container: Container,
  sector: import('../../types/game').Sector,
  healthState: HealthState,
) {
  const palette = SECTOR_PALETTE[sector]
  const alpha = healthState === 'exited' ? 0.4 : healthState === 'destroyed' ? 0.2 : 0.92

  const chip = new Graphics()
  chip.roundRect(-12, -44, 24, 12, 3)
  chip.fill({ color: palette.primary, alpha })
  chip.stroke({ width: 1, color: palette.roof, alpha })

  const textStyle = new TextStyle({
    fontSize: 8,
    fill: 0x0a0a0f,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  })
  const label = new Text({ text: SECTOR_BADGE_CODE[sector], style: textStyle })
  label.anchor.set(0.5, 0.5)
  label.y = -38
  label.alpha = alpha

  container.addChild(chip)
  container.addChild(label)
}

function ensureSpriteLoaded(paths: string[], onReady: () => void) {
  if (paths.length === 0) return
  let done = false
  void (async () => {
    for (const p of paths) {
      const tex = await loadTexture(p)
      if (tex) {
        if (!done) {
          done = true
          onReady()
        }
        return
      }
    }
  })()
}

function renderSprite(
  container: Container,
  texture: import('pixi.js').Texture,
  building: MapBuilding,
  hovered: boolean,
) {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1)
  const baseScale = building.isHQ ? 0.7 + building.visualTier * 0.12 : 0.5 + building.visualTier * 0.1
  sprite.scale.set(baseScale, baseScale)

  const tint = HEALTH_TINT[building.healthState]
  if (tint !== null) sprite.tint = tint
  sprite.alpha = building.healthState === 'destroyed' ? 0.35 : building.healthState === 'exited' ? 0.6 : hovered ? 1 : 0.95

  container.addChild(sprite)
}

// === PROCEDURAL FALLBACKS ===

function drawHQBuilding(container: Container, building: MapBuilding, hovered: boolean) {
  const g = new Graphics()
  const tier = building.visualTier
  const width = 20 + tier * 6
  const height = 24 + tier * 8

  // Main building
  g.rect(-width / 2, -height, width, height)
  g.fill({ color: COLORS.hq, alpha: hovered ? 0.9 : 0.6 })
  g.stroke({ width: 1.5, color: COLORS.hq })

  // Windows
  for (let row = 0; row < tier + 1; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = -width / 2 + 4 + col * (width / 3 - 1)
      const wy = -height + 4 + row * 10
      g.rect(wx, wy, 4, 4)
      g.fill({ color: COLORS.window, alpha: 0.8 })
    }
  }

  container.addChild(g)
}

function drawPortfolioBuilding(
  container: Container,
  building: MapBuilding,
  color: number,
  alpha: number,
  hovered: boolean,
) {
  const g = new Graphics()
  // Scale procedural fallback with visual tier so big companies read as bigger.
  const width = 14 + building.visualTier * 3
  const height = 16 + building.visualTier * 3

  // Sector palette gives each sector its own silhouette color, tinted by health.
  const palette = building.sectorTyped ? SECTOR_PALETTE[building.sectorTyped] : null
  const wallColor = palette?.primary ?? color
  const roofColor = palette?.roof ?? color
  const healthTint = HEALTH_TINT[building.healthState]

  // Main structure
  g.rect(-width / 2, -height, width, height)
  g.fill({ color: wallColor, alpha: hovered ? Math.min(1, alpha + 0.2) : alpha })
  g.stroke({ width: 1, color: healthTint ?? color, alpha: Math.min(1, alpha + 0.2) })

  // Roof cap in sector accent
  g.rect(-width / 2 - 1, -height - 3, width + 2, 3)
  g.fill({ color: roofColor, alpha })

  // Windows (2 rows, 2 cols)
  const isLit = building.healthState === 'healthy' || building.healthState === 'stressed'
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      g.rect(-width / 2 + 2 + col * (width / 2), -height + 3 + row * (height / 2.5), 3, 3)
      g.fill({ color: isLit ? COLORS.window : COLORS.windowOff, alpha: isLit ? 0.7 : 0.3 })
    }
  }

  container.addChild(g)
}
