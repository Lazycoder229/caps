import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react"

type Props = {
  latitude: number | null
  longitude: number | null
  busy: boolean
  onSelect: (latitude: number, longitude: number) => void
  onCurrentLocation: () => void
}

type Point = { latitude: number; longitude: number }
type DragState = { x: number; y: number; centerX: number; centerY: number; moved: boolean }

const TILE_SIZE = 256
const DEFAULT_CENTER = { latitude: 14.5995, longitude: 120.9842 }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function toWorld(point: Point, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const latitude = clamp(point.latitude, -85.05112878, 85.05112878)
  const sin = Math.sin(latitude * Math.PI / 180)
  return {
    x: (point.longitude + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

function fromWorld(x: number, y: number, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom
  const longitude = x / scale * 360 - 180
  const n = Math.PI - 2 * Math.PI * y / scale
  const latitude = 180 / Math.PI * Math.atan(Math.sinh(n))
  return { latitude: clamp(latitude, -85.05112878, 85.05112878), longitude: clamp(longitude, -180, 180) }
}

export default function DeliveryMap({ latitude, longitude, busy, onSelect, onCurrentLocation }: Props) {
  const initialPoint = latitude != null && longitude != null ? { latitude, longitude } : DEFAULT_CENTER
  const [center, setCenter] = useState<Point>(initialPoint)
  const [zoom, setZoom] = useState(latitude != null && longitude != null ? 15 : 12)
  const [size, setSize] = useState({ width: 600, height: 240 })
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingSelectionRef = useRef<Point | null>(null)
  const pickerStartRef = useRef<Point>(initialPoint)
  const centerWorld = useMemo(() => toWorld(center, zoom), [center, zoom])
  const selectedWorld = latitude != null && longitude != null ? toWorld({ latitude, longitude }, zoom) : null
  const markerX = selectedWorld ? size.width / 2 + selectedWorld.x - centerWorld.x : size.width / 2
  const markerY = selectedWorld ? size.height / 2 + selectedWorld.y - centerWorld.y : size.height / 2
  const tileCount = 2 ** zoom

  useEffect(() => {
    const element = mapRef.current
    if (!element) return
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = mapRef.current
    if (!element) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom(value => clamp(value + (event.deltaY < 0 ? 1 : -1), 3, 19))
    }

    element.addEventListener("wheel", handleWheel, { passive: false })
    return () => element.removeEventListener("wheel", handleWheel)
  }, [])

  useEffect(() => {
    if (latitude == null || longitude == null) return
    const pendingSelection = pendingSelectionRef.current
    if (pendingSelection && Math.abs(pendingSelection.latitude - latitude) < 0.000001 && Math.abs(pendingSelection.longitude - longitude) < 0.000001) {
      pendingSelectionRef.current = null
      return
    }
    const timer = setTimeout(() => {
      setCenter({ latitude, longitude })
    }, 0)
    return () => clearTimeout(timer)
  }, [latitude, longitude])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return
    const world = toWorld(center, zoom)
    dragRef.current = { x: event.clientX, y: event.clientY, centerX: world.x, centerY: world.y, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 4 && !drag.moved) {
      drag.moved = true
      setIsDragging(true)
    }
    if (drag.moved) setCenter(fromWorld(drag.centerX - dx, drag.centerY - dy, zoom))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.moved) {
      if (!isFullscreen) {
        pickerStartRef.current = latitude != null && longitude != null ? { latitude, longitude } : center
        setIsFullscreen(true)
      } else {
        const rect = event.currentTarget.getBoundingClientRect()
        const mapWidth = rect.width
        const mapHeight = rect.height
        setSize({ width: mapWidth, height: mapHeight })
        const point = fromWorld(centerWorld.x + event.clientX - rect.left - mapWidth / 2, centerWorld.y + event.clientY - rect.top - mapHeight / 2, zoom)
        setCenter(point)
        setZoom(value => Math.max(value, 15))
      }
    } else {
      // Panning changes only the visible map area; it must not change the saved pin.
    }
    dragRef.current = null
    setIsDragging(false)
  }

  const firstTileX = Math.floor((centerWorld.x - size.width / 2) / TILE_SIZE)
  const lastTileX = Math.floor((centerWorld.x + size.width / 2) / TILE_SIZE)
  const firstTileY = Math.floor((centerWorld.y - size.height / 2) / TILE_SIZE)
  const lastTileY = Math.floor((centerWorld.y + size.height / 2) / TILE_SIZE)
  const tiles = []
  for (let tileY = firstTileY; tileY <= lastTileY; tileY++) {
    if (tileY < 0 || tileY >= tileCount) continue
    for (let tileX = firstTileX; tileX <= lastTileX; tileX++) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount
      tiles.push({ key: `${zoom}-${tileX}-${tileY}`, x: size.width / 2 + tileX * TILE_SIZE - centerWorld.x, y: size.height / 2 + tileY * TILE_SIZE - centerWorld.y, url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png` })
    }
  }

  const buttonStyle: CSSProperties = { border: 0, width: 34, height: 34, borderRadius: 5, background: "#fff", color: "#222", fontSize: 22, lineHeight: "28px", boxShadow: "0 1px 4px #0005", cursor: "pointer" }
  const openPicker = () => {
    pickerStartRef.current = latitude != null && longitude != null ? { latitude, longitude } : center
    if (latitude != null && longitude != null) setCenter({ latitude, longitude })
    setIsFullscreen(true)
  }
  const confirmPicker = () => {
    pendingSelectionRef.current = center
    onSelect(center.latitude, center.longitude)
    setIsFullscreen(false)
  }
  const cancelPicker = () => {
    setCenter(pickerStartRef.current)
    setIsFullscreen(false)
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div
      ref={mapRef}
      role="application"
      aria-label="Interactive delivery map. Drag to move the map and tap to place the pin."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragRef.current = null; setIsDragging(false) }}
      style={{ position: isFullscreen ? "fixed" : "relative", inset: isFullscreen ? 0 : undefined, zIndex: isFullscreen ? 10000 : undefined, width: isFullscreen ? "100vw" : "100%", height: isFullscreen ? "100dvh" : 230, overflow: "hidden", borderRadius: isFullscreen ? 0 : 10, background: "#e8e5df", touchAction: "none", cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
    >
      {tiles.map(tile => <img key={tile.key} alt="" draggable={false} src={tile.url} style={{ position: "absolute", width: TILE_SIZE, height: TILE_SIZE, left: tile.x, top: tile.y, pointerEvents: "none" }} />)}
      {(isFullscreen || (latitude != null && longitude != null)) && <svg aria-hidden="true" viewBox="0 0 32 42" style={{ position: "absolute", zIndex: 2, left: isFullscreen ? "50%" : markerX, top: isFullscreen ? "50%" : markerY, width: 32, height: 42, transform: "translate(-50%, -100%)", filter: "drop-shadow(0 2px 2px #0006)", pointerEvents: "none" }}>
        <path d="M16 1C7.7 1 1 7.7 1 16c0 11.2 15 25 15 25s15-13.8 15-25C31 7.7 24.3 1 16 1Z" fill="#d92332" stroke="#fff" strokeWidth="2" />
        <circle cx="16" cy="16" r="5" fill="#fff" />
      </svg>}
      <div style={{ position: "absolute", right: 10, top: 10, zIndex: 3, display: "flex", flexDirection: "column", gap: 5 }}>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom(value => clamp(value + 1, 3, 19))} style={buttonStyle}>+</button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom(value => clamp(value - 1, 3, 19))} style={buttonStyle}>−</button>
      </div>
      <div style={{ position: "absolute", bottom: 3, left: 5, zIndex: 3, padding: "2px 5px", background: "#ffffffd9", color: "#333", fontSize: 10 }}>© OpenStreetMap contributors</div>
      {isFullscreen && <>
        <div style={{ position: "absolute", left: 12, top: 12, zIndex: 4, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "#fff", boxShadow: "0 1px 5px #0004" }}>
          <button type="button" onClick={cancelPicker} aria-label="Cancel location selection" style={{ border: 0, background: "transparent", fontSize: 22, cursor: "pointer" }}>‹</button>
          <strong>Select delivery location</strong>
        </div>
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 18, zIndex: 4, display: "flex", justifyContent: "center", gap: 10, padding: 10, borderRadius: 12, background: "#fff", boxShadow: "0 1px 8px #0004" }}>
          <button type="button" disabled={busy} onClick={onCurrentLocation} style={{ flex: 1, border: "1px solid #ff9900", borderRadius: 8, padding: "12px 10px", background: "#fff", color: "#171717", fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "Getting location…" : "My location"}</button>
          <button type="button" onClick={confirmPicker} style={{ flex: 1, border: 0, borderRadius: 8, padding: "12px 10px", background: "#e96032", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Confirm location</button>
        </div>
      </>}
    </div>
    {!isFullscreen && <button type="button" onClick={openPicker} style={{ alignSelf: "flex-start", background: "#e96032", color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Select location on map</button>}
    {!isFullscreen && <button type="button" disabled={busy} onClick={onCurrentLocation} style={{ alignSelf: "flex-start", background: "#ff9900", color: "#171717", border: 0, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, opacity: busy ? 0.6 : 1, cursor: busy ? "default" : "pointer" }}>
      {busy ? "Getting location…" : "Use my current location"}
    </button>}
  </div>
}
