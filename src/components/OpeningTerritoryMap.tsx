import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { StateFlag } from './StateFlag'
import { presentationStations } from './stationPresentation'
import { resolveRegionSelection } from '../wikiRouting'
import './OpeningTerritoryMap.css'

type State = { id: string; name: string; slug: string; origin: string; government: string; power: string; relation: string | null; ruler: string; cause: string; labelX: number; labelY: number; capitalStationId: string; capitalRegionId: string; capitalX: number; capitalY: number }
type Region = { id: string; name: string; district: string; path: string; polities: string[]; status: string; openingState: string; summary: string; stationCount: number; density2126: number }
type StationControl = { source: string; status: string; polityIds: string[]; polityNames: string[]; primary: string | null; surfaceRegionName: string | null; hierarchy: { state: string; regionalAuthority: string; stationManager: string } }
type Station = { id: string; name: string; district: string; x: number; y: number; degree: number; lineIds: string[]; control: StationControl }
type DisplayStation = Station & { memberIds: string[]; names: string[] }
type Vassal = { name: string; city: string; suzerain: string; founded: string; duty: string; lineId: string; x: number; y: number; east: number; north: number; coordinateSource: string }
type Landmark = { id: string; name: string; holderId: string; surfaceHolderId: string; role: string; detail: string; fortification: string; x: number; y: number; connectionStationId: string | null }
type TerritoryData = { width: number; height: number; projection: { minEast: number; maxEast: number; minNorth: number; maxNorth: number }; epoch: { label: string }; states: State[]; vassals: Vassal[]; landmarks: Landmark[]; lines: Record<string, { name: string; color: string }>; stations: Station[]; edges: Array<{ a: string; b: string; lineIds: string[] }>; majorStationIds: string[]; regions: Region[]; attribution: string; populationAttribution: string }
type Polygon = { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
type Boundary = { city: string; geometry: Polygon }
type Rail = { paths: Array<{ lineId: string; points: [number, number][] }>; stations: Array<{ name: string; east: number; north: number; lineIds: string[] }> }
type NorthernRail = { source: { snapshot: string; license: string }; paths: Array<{ mode: string; points: [number, number][] }>; stations: Array<{ name: string; east: number; north: number; mode: string }> }
type Water = { features: Array<{ id: string; kind: string; tag: Record<string, string>; coordinates: number[][] | number[][][] }> }
type Terrain = { layers: Array<{ name: string; file: string; width: number; height: number; bboxEPSG5179: [number, number, number, number] }>; farWaterFile: string; attribution: string }
type Underground = { stations: Record<string, Record<string, { platformM: number | null; railM: number | null; floors: string | null; platformType: string | null; exits: number | null; transfers: string[] | null }>> }
type Box = { x: number; y: number; width: number; height: number }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']
const tierColors: Record<string, string> = { 강국: '#b54b4b', 약국: '#956f28', 소국: '#64708a' }

const regionBorders = (regions: Region[]) => {
  const segments = new Map<string, { a: [number, number]; b: [number, number]; holders: Set<string> }>()
  for (const region of regions) {
    const points = [...region.path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])] as [number, number])
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index]
      const b = points[(index + 1) % points.length]
      const key = [a.join(','), b.join(',')].sort().join('|')
      const segment = segments.get(key)
      if (segment) region.polities.forEach((holder) => segment.holders.add(holder))
      else segments.set(key, { a, b, holders: new Set(region.polities) })
    }
  }
  return [...segments.values()].filter((segment) => segment.holders.size > 1).map(({ a, b }) => `M${a.join(',')} L${b.join(',')}`).join(' ')
}

const insideRing = ([x, y]: [number, number], ring: number[][]) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const insideBoundary = (point: [number, number], geometry: Polygon) => {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as number[][][]] : geometry.coordinates as number[][][][]
  return polygons.some(([outer, ...holes]) => insideRing(point, outer) && holes.every((ring) => !insideRing(point, ring)))
}

const trace = (geometry: Polygon, project: (east: number, north: number) => [number, number]) => {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates as number[][][]] : geometry.coordinates as number[][][][]
  return polygons.flatMap((polygon) => polygon.map((ring) => ring.map(([east, north], index) => `${index ? 'L' : 'M'}${project(east, north).join(',')}`).join(' ') + ' Z')).join(' ')
}

const reliefImage = (bytes: ArrayBuffer, layer: Terrain['layers'][number]) => {
  const samples = new Uint16Array(bytes)
  const canvas = document.createElement('canvas')
  canvas.width = layer.width
  canvas.height = layer.height
  const context = canvas.getContext('2d')!
  const image = context.createImageData(layer.width, layer.height)
  for (let index = 0; index < layer.width * layer.height; index += 1) {
    const elevation = samples[index * 2] - 500
    const sea = Boolean(samples[index * 2 + 1] & 0x8000)
    const tint = Math.min(1, Math.max(0, elevation) / 1700)
    const color = sea ? [29, 63, 78] : [117 + tint * 78, 137 + tint * 66, 111 + tint * 55]
    for (let channel = 0; channel < 3; channel += 1) image.data[index * 4 + channel] = color[channel]
    image.data[index * 4 + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export default function OpeningTerritoryMap() {
  const [params] = useSearchParams()
  const [data, setData] = useState<TerritoryData | null>(null)
  const [terrain, setTerrain] = useState<Terrain | null>(null)
  const [relief, setRelief] = useState('')
  const [water, setWater] = useState<Water | null>(null)
  const [boundaries, setBoundaries] = useState<Boundary[]>([])
  const [rail, setRail] = useState<Rail | null>(null)
  const [northern, setNorthern] = useState<NorthernRail | null>(null)
  const [underground, setUnderground] = useState<Underground | null>(null)
  const [frame, setFrame] = useState<'seoul' | 'peninsula'>('seoul')
  const [box, setBox] = useState<Box | null>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })
  const [labelBoxes, setLabelBoxes] = useState<Array<Box & { id: string }>>([])
  const [showRail, setShowRail] = useState(false)
  const [selectedLine, setSelectedLine] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRegionDetail, setShowRegionDetail] = useState(true)
  const [selectedStation, setSelectedStation] = useState<DisplayStation | null>(null)
  const [regionalStation, setRegionalStation] = useState<Rail['stations'][number] | null>(null)
  const [selectedVassal, setSelectedVassal] = useState<string | null>(null)
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null)
  const [showStations, setShowStations] = useState(true)
  const [showLandmarks, setShowLandmarks] = useState(false)
  const [showVassals, setShowVassals] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const start = useRef<{ x: number; y: number; box: Box; moved: boolean } | null>(null)
  const dragged = useRef(false)
  const mapRef = useRef<SVGSVGElement>(null)
  const textMeshRef = useRef<HTMLDivElement>(null)
  const requestedRegion = params.get('region')
  // The WebGL label scene depends only on the data; panning and zooming move its camera through these refs.
  const boxRef = useRef<Box | null>(null)
  const drawRef = useRef<(() => void) | null>(null)
  const pendingBox = useRef<Box | null>(null)
  const frameRequest = useRef(0)
  const handlers = useRef<{ chooseRegion: (region: Region) => void; chooseState: (state: State) => void; selectStation: (station: DisplayStation) => void } | null>(null)

  useEffect(() => {
    boxRef.current = box
    drawRef.current?.()
  }, [box])

  useEffect(() => () => cancelAnimationFrame(frameRequest.current), [])

  useEffect(() => {
    if (!data || !water || !textMeshRef.current) return
    const host = textMeshRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera()
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)
    const meshes: THREE.Mesh[] = []
    const textures: THREE.CanvasTexture[] = []
    const placed: Array<{ id: string; x: number; y: number; width: number; height: number }> = []
    const statesByArea = [...data.states].sort((left, right) => {
      const count = (id: string) => data.regions.filter((region) => region.polities.includes(id)).length
      return count(left.id) - count(right.id)
    })
    for (const state of statesByArea) {
      const held = data.regions.filter((region) => region.polities.includes(state.id)).map((region) => ({
        points: [...region.path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])] as [number, number]),
      }))
      const centers: [number, number][] = [[state.labelX, state.labelY], ...held.map(({ points }) => [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length] as [number, number])]
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      context.font = '900 74px sans-serif'
      canvas.width = Math.ceil(context.measureText(state.name).width) + 16
      canvas.height = 100
      context.font = '900 74px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.lineWidth = 8
      context.strokeStyle = '#10242d'
      context.fillStyle = '#fff6de'
      context.strokeText(state.name, canvas.width / 2, canvas.height / 2)
      context.fillText(state.name, canvas.width / 2, canvas.height / 2)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const glyph: [number, number][] = []
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3]) glyph.push([(x + 0.5) / canvas.width - 0.5, (y + 0.5) / canvas.height - 0.5])
      }
      let fit = { width: 0, x: state.labelX, y: state.labelY, height: 0 }
      for (const [x, y] of centers) for (let width = 220; width >= 40; width -= 10) {
        const height = width * canvas.height / canvas.width
        const inside = Array.from({ length: 13 * 5 }, (_, index) => [x - width / 2 + (index % 13 + 0.5) * width / 13, y - height / 2 + (Math.floor(index / 13) + 0.5) * height / 5] as [number, number]).every((point) => held.some(({ points }) => insideRing(point, points)))
        const overlaps = placed.some((other) => Math.abs(x - other.x) < (width + other.width) / 2 + 8 && Math.abs(y - other.y) < (height + other.height) / 2 + 8)
        if (inside && !overlaps && width > fit.width) fit = { width, x, y, height }
      }
      const minimumWidth = fit.width * 0.8
      while (fit.width > minimumWidth && glyph.filter(([u, v]) => !held.some(({ points }) => insideRing([fit.x + u * fit.width, fit.y + v * fit.height], points))).length > glyph.length * 0.005) {
        fit.width *= 0.95
        fit.height *= 0.95
      }
      if (fit.width) placed.push({ id: state.id, ...fit })
      const texture = new THREE.CanvasTexture(canvas)
      textures.push(texture)
      const width = fit.width
      const height = fit.height
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
      for (const region of held) {
        const points = region.points.map(([x, y]) => [x, -y])
        const shape = new THREE.Shape(points.map(([x, py]) => new THREE.Vector2(x, py)))
        const geometry = new THREE.ShapeGeometry(shape)
        const positions = geometry.getAttribute('position')
        const uvs = geometry.getAttribute('uv')
        for (let index = 0; index < positions.count; index++) {
          uvs.setXY(index, (positions.getX(index) - (fit.x - width / 2)) / width, (positions.getY(index) - (-fit.y - height / 2)) / height)
        }
        const mesh = new THREE.Mesh(geometry, material)
        mesh.userData.stateId = state.id
        scene.add(mesh)
        meshes.push(mesh)
      }
    }
    setLabelBoxes(placed.map(({ id, x, y, width, height }) => ({ id, x: x - width / 2, y: y - height / 2, width, height })))
    const draw = () => {
      const box = boxRef.current
      const { width, height } = host.getBoundingClientRect()
      if (!box || !width || !height) return
      setMapSize((size) => size.width === width && size.height === height ? size : { width, height })
      renderer.setSize(width, height)
      const aspect = width / height
      const mapAspect = box.width / box.height
      const viewWidth = aspect > mapAspect ? box.height * aspect : box.width
      const viewHeight = aspect > mapAspect ? box.height : box.width / aspect
      camera.left = box.x + (box.width - viewWidth) / 2
      camera.right = camera.left + viewWidth
      camera.top = -box.y + (viewHeight - box.height) / 2
      camera.bottom = camera.top - viewHeight
      camera.position.z = 1
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    drawRef.current = draw
    const resize = new ResizeObserver(draw)
    resize.observe(host)
    draw()
    return () => { drawRef.current = null; resize.disconnect(); meshes.forEach((mesh) => mesh.geometry.dispose()); textures.forEach((texture) => texture.dispose()); scene.children.forEach((child) => (child as THREE.Mesh).material && ((child as THREE.Mesh).material as THREE.Material).dispose()); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [data, water])

  useEffect(() => {
    const controller = new AbortController()
    const asset = async <T,>(name: string) => {
      const response = await fetch(`${import.meta.env.BASE_URL}${name}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`E_MAP_ASSET:${name}:${response.status}`)
      return response.json() as Promise<T>
    }
    void Promise.all([asset<TerritoryData>('opening-territories.json'), asset<Terrain>('regional-terrain.json'), asset<Boundary[]>('regional-boundaries.json')])
      .then(async ([territories, meta, regions]) => {
        const layer = meta.layers.find((entry) => entry.name === 'peninsula')!
        const bytes = await fetch(`${import.meta.env.BASE_URL}${layer.file}`, { signal: controller.signal }).then((response) => response.arrayBuffer())
        setData(territories)
        setTerrain(meta)
        setBoundaries(regions)
        setRelief(reliefImage(bytes, layer))
        setBox({ x: 0, y: 0, width: territories.width, height: territories.height })
        return asset<Water>(meta.farWaterFile)
      }).then(setWater).catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!showRail) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}regional-rail.json`, { signal: controller.signal }).then((response) => response.json() as Promise<Rail>).then(setRail)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [showRail])

  useEffect(() => {
    if (!showRail || frame !== 'peninsula') return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}northern-rail.json`, { signal: controller.signal }).then((response) => response.json() as Promise<NorthernRail>).then(setNorthern)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [showRail, frame])

  useEffect(() => {
    if (!selectedStation) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}underground-detail.json`, { signal: controller.signal }).then((response) => response.json() as Promise<Underground>).then(setUnderground)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [selectedStation])

  useEffect(() => {
    if (data) setSelectedId(resolveRegionSelection(data.regions, requestedRegion))
  }, [data, requestedRegion])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  const stations = useMemo(() => presentationStations(data?.stations ?? []), [data])
  const borders = useMemo(() => regionBorders(data?.regions ?? []), [data])
  const projectToMap = useMemo(() => data ? (east: number, north: number): [number, number] => [
    (east - data.projection.minEast) / (data.projection.maxEast - data.projection.minEast) * data.width,
    (data.projection.maxNorth - north) / (data.projection.maxNorth - data.projection.minNorth) * data.height,
  ] : null, [data])
  const regionPoints = useMemo(() => new Map((data?.regions ?? []).map((region) => [region.id, [...region.path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])])])), [data])
  const flagAnchors = useMemo(() => new Map((data?.states ?? []).map((state) => {
    const held = (data?.regions ?? []).filter((region) => region.polities.includes(state.id)).map((region) => regionPoints.get(region.id) ?? [])
    const candidates: [number, number][] = []
    for (const distance of [55, 80, 110, 145, 190]) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) candidates.push([state.labelX + dx * distance, state.labelY + dy * distance])
    const anchor = candidates.find(([x, y]) =>
      held.some((points) => insideRing([x, y], points)) &&
      labelBoxes.every((label) => x < label.x - 28 || x > label.x + label.width + 28 || y < label.y - 24 || y > label.y + label.height + 24)
    ) ?? [state.labelX, state.labelY] as [number, number]
    return [state.id, anchor]
  })), [data, regionPoints, labelBoxes])
  // Everything drawn inside the SVG is independent of the viewport, so panning only changes its viewBox.
  const svgLayers = useMemo(() => {
    if (!data || !terrain || !relief || !water || !projectToMap) return null
    const toMap = projectToMap
    const peninsulaLayer = terrain.layers.find((entry) => entry.name === 'peninsula')!
    const [e0, n0, e1, n1] = peninsulaLayer.bboxEPSG5179
    const [px, py] = toMap(e0, n1)
    const [pr, pb] = toMap(e1, n0)
    const riverPaths = water.features.filter((feature) => feature.kind === 'line' && feature.tag.waterway === 'river')
    const displayedRail = rail?.paths.filter((path) => selectedLine === 'all' || path.lineId === selectedLine) ?? []
    return <>
        <image href={relief} x={px} y={py} width={pr - px} height={pb - py} preserveAspectRatio="none" imageRendering="auto" />
        {boundaries.map((boundary) => { const vassal = data.vassals.find((item) => item.city === boundary.city); return <path key={boundary.city} d={trace(boundary.geometry, toMap)} fill={vassal ? states.get(vassal.suzerain)?.color : 'none'} fillOpacity={vassal ? 0.55 : 0} stroke={vassal ? states.get(vassal.suzerain)?.color : 'none'} strokeWidth="3" vectorEffect="non-scaling-stroke" onClick={() => { if (vassal && !dragged.current) { setSelectedVassal(vassal.name); setDetailOpen(true) } }} /> })}
        {data.regions.map((region) => <path key={region.id} d={region.path} className="territory-flat-region" data-region-id={region.id} data-state-id={region.polities[0]} role="button" tabIndex={0} aria-label={`${region.district} ${region.name} · ${states.get(region.polities[0])?.name ?? '영토'} 보기`} fill={states.get(region.polities[0])?.color ?? '#77858a'} fillOpacity={selectedId === region.id ? 0.95 : stateFilter === 'all' || region.polities.includes(stateFilter) ? 0.72 : 0.24} stroke="#35434b" strokeWidth="0.6" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.chooseRegion(region) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.chooseRegion(region) } }} />)}
        <path d={borders} className="territory-national-borders" fill="none" stroke="#18252d" strokeWidth="3.6" vectorEffect="non-scaling-stroke" pointerEvents="none" />
        {riverPaths.map((feature) => <polyline key={feature.id} className="territory-flat-river" points={(feature.coordinates as number[][]).map(([east, north]) => toMap(east, north).join(',')).join(' ')} fill="none" stroke="#36a8c4" strokeWidth="2.4" vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {showRail && displayedRail.map((path, index) => <polyline key={`metro-${index}`} className="territory-metro-line" data-line-id={path.lineId} points={path.points.map(([east, north]) => toMap(east, north).join(',')).join(' ')} fill="none" stroke={data.lines[path.lineId]?.color ?? '#d5e5e8'} strokeWidth={selectedLine === 'all' ? '2.8' : '4'} vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {showRail && frame === 'peninsula' && northern && <path d={northern.paths.map((path) => path.points.map(([east, north], index) => `${index ? 'L' : 'M'}${toMap(east, north).join(',')}`).join(' ')).join(' ')} fill="none" stroke="#e7d397" strokeWidth="1.2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
        {showRail && data.edges.flatMap((edge, index) => edge.lineIds.filter((id) => selectedLine === 'all' || selectedLine === id).map((id) => { const a = data.stations.find((station) => station.id === edge.a), b = data.stations.find((station) => station.id === edge.b); return a && b ? <line key={`seoul-${index}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={data.lines[id]?.color ?? '#eee'} strokeWidth="3.2" vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null }))}
        {showRail && rail?.stations.filter((station) => station.lineIds.length > 1 && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station, index) => { const [x, y] = toMap(station.east, station.north); return <circle key={`transfer-${index}`} className="territory-transfer-marker" cx={x} cy={y} r="4.8" fill="#fff" stroke="#1d3038" strokeWidth="2.5" vectorEffect="non-scaling-stroke" onClick={() => { setRegionalStation(station); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{station.name} · 환승역</title></circle> })}
        {showRail && showStations && rail?.stations.filter((station) => !data.stations.some((seoul) => seoul.name === station.name) && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station, index) => { const [x, y] = toMap(station.east, station.north); return <circle key={`outer-${index}`} className="territory-regional-station" cx={x} cy={y} r="3.3" fill="#f6ecd0" stroke={data.lines[station.lineIds[0]]?.color ?? '#345'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" onClick={() => { setRegionalStation(station); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{station.name} · 광역철도</title></circle> })}
        {showStations && stations.filter((station) => station.memberIds.some((id) => data.majorStationIds.includes(id)) && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station) => <g key={station.id} className="territory-flat-station" data-station-id={station.id} onClick={() => handlers.current?.selectStation(station)}><circle cx={station.x} cy={station.y} r={station.lineIds.length > 1 ? 6 : 4} fill="#fff" stroke={data.lines[station.lineIds[0]]?.color ?? '#264655'} strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{station.names.join(' · ')} · {station.lineIds.map((id) => data.lines[id]?.name).join(' · ')}</title></g>)}
        {showLandmarks && data.landmarks.map((site) => <circle key={site.id} cx={site.x} cy={site.y} r="5" fill={states.get(site.holderId)?.color} stroke="#fff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" onClick={() => { setSelectedLandmark(site.id); setDetailOpen(true) }}><title>{site.name} · {site.role}</title></circle>)}
        {showVassals && data.vassals.map((vassal) => <g key={vassal.name} onClick={() => { setSelectedVassal(vassal.name); setDetailOpen(true) }}><circle cx={toMap(vassal.east, vassal.north)[0]} cy={toMap(vassal.east, vassal.north)[1]} r="8" fill={states.get(vassal.suzerain)?.color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{vassal.name} · {vassal.city}</title></g>)}
        {data.states.map((state) => <g key={state.id} className="territory-flat-capital" data-capital-station-id={state.capitalStationId} onClick={() => handlers.current?.chooseState(state)}><circle cx={state.capitalX} cy={state.capitalY} r="7" fill={states.get(state.id)?.color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{state.id} {state.name} · 수도역 {state.capitalStationId}</title></g>)}
    </>
  }, [data, terrain, relief, water, projectToMap, boundaries, states, stations, borders, rail, northern, frame, showRail, showStations, showLandmarks, showVassals, selectedLine, selectedId, stateFilter])
  if (failed) return <p className="wiki-domain-label">영토 지도를 불러오지 못했습니다. 새로고침해 주세요.</p>
  if (!data || !terrain || !relief || !water || !box) return <div className="wiki-loading">서울 영토와 강줄기를 불러오고 있습니다.</div>

  const toMap = projectToMap!
  const peninsula = terrain.layers.find((entry) => entry.name === 'peninsula')!
  const [e0, n0, e1, n1] = peninsula.bboxEPSG5179
  const [px, py] = toMap(e0, n1)
  const [pr, pb] = toMap(e1, n0)
  const framePeninsula = () => { setFrame('peninsula'); setBox({ x: px, y: py, width: pr - px, height: pb - py }) }
  const frameSeoul = () => { setFrame('seoul'); setBox({ x: 0, y: 0, width: data.width, height: data.height }) }
  const chooseState = (state: State) => { setSelectedId(state.capitalRegionId); setShowRegionDetail(false); setStateFilter(state.id); setSelectedStation(null); setRegionalStation(null); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseRegion = (region: Region) => {
    setSelectedId(region.id)
    setShowRegionDetail(true)
    const state = states.get(region.polities[0])
    setStateFilter(state?.id ?? 'all')
    setSelectedStation(null); setRegionalStation(null); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true)
  }
  const selectStation = (station: DisplayStation) => { setSelectedStation(station); setRegionalStation(null); setSelectedId(null); setStateFilter('all'); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true) }
  handlers.current = { chooseRegion, chooseState, selectStation }
  // Pointer and wheel events can arrive several times per frame; apply at most one viewport change per frame.
  const scheduleBox = (next: Box) => {
    pendingBox.current = next
    if (frameRequest.current) return
    frameRequest.current = requestAnimationFrame(() => {
      frameRequest.current = 0
      if (pendingBox.current) setBox(pendingBox.current)
      pendingBox.current = null
    })
  }
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => { dragged.current = false; start.current = { x: event.clientX, y: event.clientY, box, moved: false } }
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = start.current
    if (!gesture) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = (event.clientX - gesture.x) / rect.width * gesture.box.width
    const dy = (event.clientY - gesture.y) / rect.height * gesture.box.height
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) { gesture.moved = true; dragged.current = true }
    scheduleBox({ ...gesture.box, x: gesture.box.x - dx, y: gesture.box.y - dy })
  }
  const onPointerUp = () => { start.current = null }
  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const factor = event.deltaY > 0 ? 1.18 : 0.84
    const base = pendingBox.current ?? box
    const width = Math.max(100, Math.min(pr - px, base.width * factor))
    const height = base.height * width / base.width
    scheduleBox({ x: base.x + x * (base.width - width), y: base.y + y * (base.height - height), width, height })
  }
  const zoom = (factor: number) => { const width = Math.max(100, Math.min(pr - px, box.width * factor)); const height = box.height * width / box.width; setBox({ x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }) }
  const selected = data.regions.find((region) => region.id === selectedId)
  const selectedState = states.get(stateFilter)
  const selectedVassalData = data.vassals.find((vassal) => vassal.name === selectedVassal)
  const selectedLandmarkData = data.landmarks.find((landmark) => landmark.id === selectedLandmark)
  const selectedRegionalHolder = regionalStation && boundaries.find((boundary) => insideBoundary([regionalStation.east, regionalStation.north], boundary.geometry))
  const mapScale = Math.min(mapSize.width / box.width, mapSize.height / box.height)
  const flagPosition = (x: number, y: number) => ({
    left: `${50 + (x - box.x - box.width / 2) * mapScale / mapSize.width * 100}%`,
    top: `${50 + (y - box.y - box.height / 2) * mapScale / mapSize.height * 100}%`,
  })
  const selectedSuzerain = data.vassals.find((vassal) => vassal.city === selectedRegionalHolder?.city)
  const stationDetail = selectedStation && underground?.stations[selectedStation.id]

  return <section className="territory-map-section" aria-labelledby="opening-territory-title">
    <header><p className="wiki-domain-label">한반도 지형 · 서울 전철 연결권 · 2126 시점</p><h2 id="opening-territory-title">2126 시점 영토 지도</h2><p>서울 427개 동의 국가 권역과 강줄기를 한눈에 봅니다. 노선 표시는 별도로 켜고 끌 수 있습니다.</p></header>
    <div className="territory-toolbar">
      <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => { const state = states.get(event.target.value); if (state) chooseState(state); else setStateFilter('all') }}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
      <label className="territory-filter"><span>노선 필터</span><select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}><option value="all">전체 노선</option>{Object.entries(data.lines).map(([id, line]) => <option key={id} value={id}>{line.name}</option>)}</select></label>
      <label className="territory-rail-toggle"><input type="checkbox" checked={showRail} onChange={(event) => setShowRail(event.target.checked)} />지하철 노선 표시</label>
      <label className="territory-filter"><span>지역 선택</span><select value={selectedId ?? ''} onChange={(event) => { const region = data.regions.find((item) => item.id === event.target.value); if (region) chooseRegion(region) }}><option value="">선택 안 함</option>{data.regions.map((region) => <option key={region.id} value={region.id}>{region.district} · {region.name}</option>)}</select></label>
      <fieldset className="territory-marker-filters"><legend>지도 표시</legend><label><input type="checkbox" checked={showStations} onChange={(event) => setShowStations(event.target.checked)} />역</label><label><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} />시설</label><label><input type="checkbox" checked={showVassals} onChange={(event) => setShowVassals(event.target.checked)} />속국</label></fieldset>
      <span className="territory-controls-help">드래그 이동 · 휠 확대/축소</span>
    </div>
    <div className="territory-tier-legend" aria-label="국력 등급 범례">{(['강국', '약국', '소국'] as const).map((tier) => <span key={tier} className="territory-tier-chip" data-tier={tier}><span className="territory-tier-dot" style={{ backgroundColor: tierColors[tier] }} />{tier} {data.states.filter((state) => state.power === tier).length}</span>)}<span className="territory-tier-note">굵은 선: 국가 경계 · 색상 선: 전철 노선</span></div>
    <div className="territory-map-layout"><div className="territory-map-canvas territory-map-flat" data-flat-territory-map>
      <div className="territory-flat-controls" role="group" aria-label="지도 범위"><button type="button" onClick={frameSeoul} aria-pressed={frame === 'seoul'}>서울 전체</button><button type="button" onClick={framePeninsula} aria-pressed={frame === 'peninsula'}>한반도 보기</button><button type="button" onClick={() => zoom(0.8)}>줌인</button><button type="button" onClick={() => zoom(1.25)}>줌아웃</button></div>
      <svg ref={mapRef} className="territory-flat-svg" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="img" aria-label="서울 국가 경계와 강줄기, 선택 가능한 역과 노선" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}>
        {svgLayers}
      </svg>
      <div ref={textMeshRef} className="territory-surface-text-mesh" aria-hidden="true" />
      <div className="territory-faction-flags" aria-label="16국 영토 깃발">
        {data.states.map((state) => { const [x, y] = flagAnchors.get(state.id) ?? [state.labelX, state.labelY]; return <button key={state.id} type="button" className="territory-faction-flag" data-territory-flag={state.id} aria-label={`${state.name} 영토 보기`} aria-pressed={stateFilter === state.id} style={{ ...flagPosition(x, y), borderColor: states.get(state.id)?.color }} onClick={() => chooseState(state)}><StateFlag stateId={state.id} /></button> })}
      </div>
      {(selectedState || selectedStation || regionalStation || selectedLandmark || selectedVassal || selected) && <button type="button" className="territory-detail-toggle" aria-expanded={detailOpen} aria-controls="territory-detail-panel" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? '정보 접기' : '정보 펼치기'}</button>}
      {detailOpen && <aside id="territory-detail-panel" className="territory-detail" aria-label="선택 정보" aria-live="polite"><button type="button" className="territory-detail-close" onClick={() => setDetailOpen(false)}>정보 접기</button>
        {selectedState && !showRegionDetail && <section><p className="wiki-domain-label">선택 국가 · {selectedState.id}</p><h3>{selectedState.name}</h3><table className="person-data-table"><tbody><tr><th>수장</th><td>{selectedState.ruler}</td></tr><tr><th>중심역</th><td>{selectedState.capitalStationId}</td></tr><tr><th>정부 형태</th><td>{selectedState.government}</td></tr><tr><th>국력</th><td>{selectedState.power}</td></tr></tbody></table><p>{selectedState.cause}</p><Link to={`/states/${selectedState.slug}`} className="territory-state-link">{selectedState.name} 국가 상세 보기</Link></section>}
        {selected && showRegionDetail && <section><p className="wiki-domain-label">선택된 지역 · {selected.district}</p><h3>{selected.name}</h3><p>2126년 인구 밀도 {Math.round(selected.density2126).toLocaleString('ko-KR')}명/km²</p><p className="wiki-domain-label">{data.populationAttribution}</p><p>{selected.openingState}</p><p>{selected.summary}</p></section>}
        {selectedStation && <section><p className="wiki-domain-label">서울 역 정보</p><h3>{selectedStation.names.join(' · ')}</h3><table className="person-data-table"><tbody><tr><th>구</th><td>{selectedStation.district}</td></tr><tr><th>노선·환승</th><td>{selectedStation.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ')}</td></tr><tr><th>역 상태</th><td>{selectedStation.control.status === 'held' ? '점유' : selectedStation.control.status === 'contested' ? '분쟁' : selectedStation.control.status === 'vacant' ? '무주지' : '상태 기록 없음'}</td></tr><tr><th>관여 국가</th><td>{selectedStation.control.polityNames.join(' · ') || '기록 없음'}</td></tr><tr><th>경비·통행 우선</th><td>{selectedStation.control.primary ? states.get(selectedStation.control.primary)?.name ?? selectedStation.control.primary : '기록 없음'}</td></tr><tr><th>지배 계층</th><td>{selectedStation.control.hierarchy.state} → {selectedStation.control.hierarchy.regionalAuthority} → {selectedStation.control.hierarchy.stationManager}</td></tr>{selectedStation.lineIds.map((id) => { const entry = stationDetail?.[id] ?? selectedStation.memberIds.map((member) => underground?.stations[member]?.[id]).find(Boolean); return entry ? <tr key={id}><th>{data.lines[id]?.name ?? id} 승강장</th><td>{entry.floors ?? '층 기록 없음'} · {entry.platformM == null ? '심도 기록 없음' : `${entry.platformM} m`} · 출구 {entry.exits ?? '기록 없음'}</td></tr> : null })}</tbody></table></section>}
        {regionalStation && <section><p className="wiki-domain-label">광역철도 역 정보</p><h3>{regionalStation.name}</h3><table className="person-data-table"><tbody><tr><th>노선·환승</th><td>{regionalStation.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ')}</td></tr><tr><th>지표 권역</th><td>{selectedRegionalHolder?.city ?? '서울 외 지도 권역'}</td></tr>{selectedSuzerain && <tr><th>속국·본국</th><td>{selectedSuzerain.name} · {states.get(selectedSuzerain.suzerain)?.name}</td></tr>}</tbody></table><p>현행 철도 위치 자료의 역이다. 국가 통제는 별도 역 점령 원장으로 확인한다.</p></section>}
        {selectedVassalData && <section><p className="wiki-domain-label">선택된 속국 · {selectedVassalData.city}</p><h3>{selectedVassalData.name}</h3><p>본국 {states.get(selectedVassalData.suzerain)?.name} · {data.lines[selectedVassalData.lineId]?.name}</p><p>{selectedVassalData.duty}</p></section>}
        {selectedLandmarkData && <section><p className="wiki-domain-label">주요 시설</p><h3>{selectedLandmarkData.name}</h3><p>{selectedLandmarkData.role}</p><p>{selectedLandmarkData.detail}</p></section>}
      </aside>}
    </div></div>
    <div className="territory-legend">{data.states.map((state) => <button key={state.id} type="button" onClick={() => chooseState(state)} aria-pressed={stateFilter === state.id}><span className="territory-legend-swatch" style={{ backgroundColor: states.get(state.id)?.color }} /><StateFlag stateId={state.id} /><span>{state.id} {state.name}</span></button>)}</div>
    {showRail && <div className="territory-line-legend" aria-label="광역철도 노선 색상"><button type="button" aria-pressed={selectedLine === 'all'} onClick={() => setSelectedLine('all')}>전체 노선</button>{Object.entries(data.lines).map(([id, line]) => <button key={id} type="button" aria-pressed={selectedLine === id} onClick={() => setSelectedLine(id)}><span style={{ backgroundColor: line.color }} />{line.name}</button>)}</div>}
    <p className="wiki-domain-label">{data.epoch.label} · {data.attribution} · {terrain.attribution}{northern && frame === 'peninsula' && showRail ? ` · 북측 철도 ${northern.source.snapshot} · ${northern.source.license}` : ''}</p>
  </section>
}
