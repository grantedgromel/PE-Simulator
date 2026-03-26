import { useEffect, useRef, useCallback, useState } from 'react'
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js'
import { useGameStore } from '../../store/gameStore'
import {
  generateMapState,
  gridToScreen,
  screenToGrid,
  type MapBuilding,
  type MapRoad,
} from '../../engine/isometricMap'

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

    // Draw buildings
    for (const building of mapState.buildings) {
      drawBuilding(world, building, building.companyId === hoveredBuilding)
    }
  }, [mapState, hoveredBuilding])

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

function drawBuilding(container: Container, building: MapBuilding, hovered: boolean) {
  const pos = gridToScreen(building.gridX, building.gridY)
  const buildingContainer = new Container()
  buildingContainer.x = pos.x
  buildingContainer.y = pos.y
  buildingContainer.zIndex = building.gridX + building.gridY

  const color = building.isHQ ? COLORS.hq : HEALTH_COLORS[building.healthState] ?? COLORS.exited
  const alpha = building.healthState === 'exited' ? 0.4 : building.healthState === 'destroyed' ? 0.2 : 0.8

  if (building.isHQ) {
    drawHQBuilding(buildingContainer, building, hovered)
  } else {
    drawPortfolioBuilding(buildingContainer, building, color, alpha, hovered)
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

  // Add-on indicators
  if (building.addOnCount > 0) {
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

function drawHQBuilding(container: Container, building: MapBuilding, hovered: boolean) {
  const g = new Graphics()
  const tier = building.healthState === 'healthy' ? 3 : 1 // simplified
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
  const width = 16
  const height = 18

  // Main structure
  g.rect(-width / 2, -height, width, height)
  g.fill({ color, alpha: hovered ? Math.min(1, alpha + 0.2) : alpha })
  g.stroke({ width: 1, color, alpha: Math.min(1, alpha + 0.2) })

  // Windows (2 rows, 2 cols)
  const isLit = building.healthState === 'healthy' || building.healthState === 'stressed'
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      g.rect(-width / 2 + 2 + col * 8, -height + 3 + row * 8, 4, 4)
      g.fill({ color: isLit ? COLORS.window : COLORS.windowOff, alpha: isLit ? 0.7 : 0.3 })
    }
  }

  container.addChild(g)
}
