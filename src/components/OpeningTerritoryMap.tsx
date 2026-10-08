import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { StateFlag } from './StateFlag'
import { presentationStations } from './stationPresentation'
import { resolveRegionSelection } from '../wikiRouting'
import { segmentPointerChoices } from './segmentPointerSelection'
import HoldingSelectionPanel, { type ConfirmedHoldings } from './HoldingSelectionPanel'
import gtxProjects from '../../lore/places/gtx-project-connections.json'
import { correctedRailStations } from './railStationCorrections'
import type { CurrentHegemon, CurrentBase } from '../generated/stateCatalog'
import './OpeningTerritoryMap.css'

type State = { historicalName: string; currentHegemon: CurrentHegemon; currentBase: CurrentBase & { x: number; y: number }; currentExclusiveDistrictCount: number; id: string; name: string; slug: string; origin: string; government: string; power: string; relation: string | null; ruler: string; cause: string; founded: string; vassals: string; religion: string; foreignRelations: string; chronology: Array<{ year: number; text: string; sourceRoute: string }>; labelX: number; labelY: number; capitalStationId: string; capitalRegionId: string; capitalX: number; capitalY: number }
type Region = { currentHegemons: CurrentHegemon[]; id: string; name: string; district: string; path: string; polities: string[]; status: string; openingState: string; summary: string; stationCount: number; density2126: number }
type StationControl = { currentHegemons: CurrentHegemon[]; source: string; status: string; polityIds: string[]; polityNames: string[]; primary: string | null; surfaceRegionName: string | null; memberSurfaces?: Array<{ id: string; surfacePolityIds: string[]; surfaceRegionName: string | null; polityIds: string[] }>; hierarchy: { state: string; regionalAuthority: string | null; stationManager: string } }
type Station = { id: string; name: string; district: string; x: number; y: number; degree: number; lineIds: string[]; control: StationControl }
type DisplayStation = Station & { memberIds: string[]; names: string[] }
type Vassal = { name: string; city: string; suzerain: string; founded: string; duty: string; anchor: string; lineId: string; x: number; y: number; east: number; north: number; coordinateSource: string }
type Landmark = { id: string; name: string; holderId: string; surfaceHolderId: string; role: string; detail: string; fortification: string; x: number; y: number; connectionStationId: string | null }
type SegmentControl = { currentHegemons: CurrentHegemon[]; source: string; deltaId: string | null; status: string; polityIds: string[]; primary: string | null }
type Segment = { id: string; a: string; b: string; lineIds: string[]; control: SegmentControl; passage2126: string }
type TerritoryData = { width: number; height: number; projection: { minEast: number; maxEast: number; minNorth: number; maxNorth: number }; epoch: { label: string }; states: State[]; vassals: Vassal[]; landmarks: Landmark[]; lines: Record<string, { name: string; color: string }>; stations: Station[]; edges: Segment[]; majorStationIds: string[]; regions: Region[]; attribution: string; populationAttribution: string }
type Polygon = { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
type Boundary = { city: string; geometry: Polygon }
type OutsideUnit = { id: string; name: string; province: string; district: string; path: string; holder2126: string | null }
type OutsideUnits = { source: string; sourceSha256: string; units: OutsideUnit[] }
type OutsideControl = { assignments: Array<{ unitId: string; vassal: string; suzerain: string; station: string }> }
type Rail = { paths: Array<{ lineId: string; points: [number, number][] }>; stations: Array<{ name: string; east: number; north: number; lineIds: string[] }> }
type RegionalEndpoint = { readonly id: string; readonly name: string } & ({ readonly coordinateKind: 'seoul-map'; readonly x: number; readonly y: number } | { readonly coordinateKind: 'epsg5179'; readonly east: number; readonly north: number })
type RegionalConnections = { readonly edges: readonly { readonly id: string; readonly lineId: string; readonly a: RegionalEndpoint; readonly b: RegionalEndpoint }[] }
type NorthernRail = { source: { snapshot: string; license: string }; paths: Array<{ mode: string; points: [number, number][] }>; stations: Array<{ name: string; east: number; north: number; mode: string }> }
type Water = { features: Array<{ id: string; kind: string; tag: Record<string, string>; coordinates: number[][] | number[][][] }> }
type Terrain = { layers: Array<{ name: string; file: string; width: number; height: number; bboxEPSG5179: [number, number, number, number] }>; farWaterFile: string; attribution: string }
type Underground = { stations: Record<string, Record<string, { platformM: number | null; railM: number | null; floors: string | null; platformType: string | null; exits: number | null; transfers: string[] | null }>> }
type Box = { x: number; y: number; width: number; height: number }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']
const tierColors: Record<string, string> = { 강국: '#b54b4b', 약국: '#956f28', 소국: '#64708a' }
const contestedColor = '#f0c05a'
const unassignedColor = '#8a969b'
const gtxStationIds: Readonly<Record<string, string>> = { 신도림: 'Sindorim', 가산: '가산디지털단지', DMC: '디지털미디어시티' }
const projectStatusLabel = (status: string) => {
  switch (status) {
    case 'partially-operational': return '일부 개통 · 잔여 사업 진행'
    case 'under-construction': return '공사 중'
    case 'construction-planned': return '착공 예정'
    case 'announced-proposal': return '발표 구상'
    default: throw new Error(`E_GTX_PROJECT_STATUS:${status}`)
  }
}
const passageLabel = (passage: string) => passage === 'open' ? '통행' : passage === 'checkpoint' ? '검문 통행' : '기록 없음'
const segmentStatusLabel = (status: string) => status === 'contested' ? '경계' : controlLabel(status)
const controlLabel = (status: string) => status === 'held' ? '점유' : status === 'contested' ? '분쟁' : status === 'vacant' ? '무주지' : '미배정'

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
  const [holdings, setHoldings] = useState<ConfirmedHoldings | null>(null)
  const [holdingLoadFailed, setHoldingLoadFailed] = useState(false)
  const [terrain, setTerrain] = useState<Terrain | null>(null)
  const [relief, setRelief] = useState('')
  const [water, setWater] = useState<Water | null>(null)
  const [boundaries, setBoundaries] = useState<Boundary[]>([])
  const [outsideUnits, setOutsideUnits] = useState<OutsideUnits | null>(null)
  const [outsideControl, setOutsideControl] = useState<OutsideControl | null>(null)
  const [rail, setRail] = useState<Rail | null>(null)
  const [regularConnections, setRegularConnections] = useState<RegionalConnections | null>(null)
  const [northern, setNorthern] = useState<NorthernRail | null>(null)
  const [underground, setUnderground] = useState<Underground | null>(null)
  const [frame, setFrame] = useState<'seoul' | 'peninsula'>('seoul')
  const [layer, setLayer] = useState<'surface' | 'underground'>('surface')
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [segmentChoices, setSegmentChoices] = useState<string[]>([])
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
  const [selectedOutsideUnit, setSelectedOutsideUnit] = useState<string | null>(null)
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null)
  const [showStations, setShowStations] = useState(true)
  const [showLandmarks, setShowLandmarks] = useState(false)
  const [showVassals, setShowVassals] = useState(true)
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
  const handlers = useRef<{ chooseRegion: (region: Region) => void; chooseState: (state: State) => void; chooseVassal: (vassal: Vassal) => void; chooseOutsideUnit: (unit: OutsideUnit) => void; selectStation: (station: DisplayStation) => void; selectSegment: (segment: Segment) => void } | null>(null)

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
      if (state.currentExclusiveDistrictCount === 0) continue
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
    void Promise.all([asset<TerritoryData>('opening-territories.json'), asset<Terrain>('regional-terrain.json'), asset<Boundary[]>('regional-boundaries.json'), asset<OutsideUnits>('outside-admin-units.json'), asset<OutsideControl>('outside-control-2126.json')])
      .then(async ([territories, meta, regions, outside, control]) => {
        const layer = meta.layers.find((entry) => entry.name === 'peninsula')!
        const bytes = await fetch(`${import.meta.env.BASE_URL}${layer.file}`, { signal: controller.signal }).then((response) => response.arrayBuffer())
        setData(territories)
        setTerrain(meta)
        setBoundaries(regions)
        setOutsideUnits(outside)
        setOutsideControl(control)
        setRelief(reliefImage(bytes, layer))
        setBox({ x: 0, y: 0, width: territories.width, height: territories.height })
        return asset<Water>(meta.farWaterFile)
      }).then(setWater).catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!showRail) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}regional-rail.json`, { signal: controller.signal }).then((response) => response.json() as Promise<Rail>).then((value) => setRail({ ...value, stations: correctedRailStations(value.stations) }))
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [showRail])

  useEffect(() => {
    if (!showRail) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}regular-regional-connections.json`, { signal: controller.signal }).then((response) => response.json() as Promise<RegionalConnections>).then(setRegularConnections)
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

  useEffect(() => {
    setSegmentChoices([])
  }, [layer, selectedLine, selectedSegmentId, selectedId, selectedStation, regionalStation, selectedVassal, selectedOutsideUnit, selectedLandmark, stateFilter])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}confirmed-person-holdings.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('holding-data'); return response.json() as Promise<ConfirmedHoldings> })
      .then(setHoldings)
      .catch(() => { if (!controller.signal.aborted) setHoldingLoadFailed(true) })
    return () => controller.abort()
  }, [])
  const selectedHolding = useMemo(() => holdings?.holdings.find(holding => {
    const stationId = holding.stationRef?.stationId ?? (holding.facilityRef ? holding.facilityRef.stationId ?? holding.facilityRef.stationName : null)
    return stationId ? selectedStation?.memberIds.includes(stationId) : holding.adminRefs.some(ref => ref.id === selectedId)
  }), [holdings, selectedId, selectedStation])
  const selectedHoldingRegions = useMemo(() => new Set(selectedHolding?.adminRefs.map(ref => ref.id) ?? []), [selectedHolding])
  const stations = useMemo(() => presentationStations(data?.stations ?? []), [data])
  const seoulStationNames = useMemo(() => new Set(stations.flatMap((station) => station.memberIds.concat(station.names))), [stations])
  const borders = useMemo(() => regionBorders(data?.regions ?? []), [data])
  const outsideAssignments = useMemo(() => new Map(outsideControl?.assignments.map((entry) => [entry.unitId, entry]) ?? []), [outsideControl])
  const stationPoints = useMemo(() => new Map((data?.stations ?? []).map((station) => [station.id, station])), [data])
  const projectToMap = useMemo(() => data ? (east: number, north: number): [number, number] => [
    (east - data.projection.minEast) / (data.projection.maxEast - data.projection.minEast) * data.width,
    (data.projection.maxNorth - north) / (data.projection.maxNorth - data.projection.minNorth) * data.height,
  ] : null, [data])
  const regionPoints = useMemo(() => new Map((data?.regions ?? []).map((region) => [region.id, [...region.path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])])])), [data])
  const flagAnchors = useMemo(() => new Map((data?.states ?? []).map((state) => {
    const held = (data?.regions ?? []).filter((region) => region.polities.includes(state.id)).map((region) => regionPoints.get(region.id) ?? [])
    if (state.currentExclusiveDistrictCount === 0) return [state.id, [state.currentBase.x, state.currentBase.y] as [number, number]]
    const candidates: [number, number][] = []
    for (const distance of [55, 80, 110, 145, 190]) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) candidates.push([state.labelX + dx * distance, state.labelY + dy * distance])
    const anchor = candidates.find(([x, y]) =>
      held.some((points) => insideRing([x, y], points)) &&
      labelBoxes.every((label) => x < label.x - 28 || x > label.x + label.width + 28 || y < label.y - 24 || y > label.y + label.height + 24)
    ) ?? [state.labelX, state.labelY] as [number, number]
    return [state.id, anchor]
  })), [data, regionPoints, labelBoxes])
  const segmentColor = (control: { status: string; polityIds: string[] }) => control.status === 'held' ? states.get(control.polityIds[0])?.color ?? unassignedColor : control.status === 'contested' ? contestedColor : unassignedColor
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
    const endpointPoint = (point: RegionalEndpoint): readonly [number, number] => {
      switch (point.coordinateKind) {
        case 'seoul-map': return [point.x, point.y]
        case 'epsg5179': return toMap(point.east, point.north)
      }
    }
    const officialExternalStations = new Map<string, { name: string; east: number; north: number; lineIds: string[] }>()
    for (const edge of regularConnections?.edges ?? []) {
      for (const point of [edge.a, edge.b]) {
        if (point.coordinateKind !== 'epsg5179') continue
        const existing = officialExternalStations.get(point.id)
        if (existing) {
          if (!existing.lineIds.includes(edge.lineId)) existing.lineIds.push(edge.lineId)
        } else officialExternalStations.set(point.id, { name: point.name, east: point.east, north: point.north, lineIds: [edge.lineId] })
      }
    }
    const projectPoint = (name: string) => {
      const station = data.stations.find((station) => station.id === (gtxStationIds[name] ?? name))
      if (station) return station
      const official = [...officialExternalStations.values()].filter((station) => station.name === name)
      if (official.length === 1) {
        const [x, y] = toMap(official[0].east, official[0].north)
        return { name, x, y }
      }
      if (official.length > 1) return null
      const matches = rail?.stations.filter((station) => station.name === name) ?? []
      if (matches.length !== 1) return null
      const [x, y] = toMap(matches[0].east, matches[0].north)
      return { name, x, y }
    }
    const projectSegments = gtxProjects.projects.flatMap((project) => project.paths.flatMap((path, pathIndex) => path.slice(1).flatMap((name, index) => {
      const a = projectPoint(path[index])
      const b = projectPoint(name)
      return a && b ? [{ project, a, b, key: `${project.id}/${pathIndex}/${index}` }] : []
    })))
    return <>
        <image href={relief} x={px} y={py} width={pr - px} height={pb - py} preserveAspectRatio="none" imageRendering="auto" />
        {layer === 'surface' && frame === 'peninsula' && outsideUnits?.units.map((unit) => { const assignment = outsideAssignments.get(unit.id); const holder = assignment?.suzerain; const title = `${unit.name} · ${assignment ? `${assignment.vassal} / ${states.get(holder!)?.name ?? holder}` : '2126 지배 기록 없음'}`; return <path key={unit.id} d={unit.path} data-outside-unit={unit.id} data-control-status={assignment ? 'held' : 'unassigned'} role="button" tabIndex={0} aria-label={title} className="territory-outside-unit" fill={holder ? states.get(holder)?.color ?? unassignedColor : unassignedColor} fillOpacity={selectedOutsideUnit === unit.id ? 0.55 : assignment ? 0.55 : 0.1} stroke={selectedOutsideUnit === unit.id ? '#ffe18c' : '#8a969b'} strokeOpacity="0.55" strokeWidth="0.65" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.chooseOutsideUnit(unit) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.chooseOutsideUnit(unit) } }}><title>{title}</title></path> })}
        {layer === 'surface' && showVassals && boundaries.map((boundary) => { const vassal = data.vassals.find((item) => item.city === boundary.city); return <path key={boundary.city} data-vassal-boundary={boundary.city} d={trace(boundary.geometry, toMap)} fill="none" stroke={vassal ? states.get(vassal.suzerain)?.color : 'none'} strokeOpacity={selectedVassal === vassal?.name ? 1 : 0.8} strokeWidth={selectedVassal === vassal?.name ? '3' : '1.5'} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" pointerEvents="none"><title>{boundary.city} 행정 경계 · 속국 소재지, 전역 지배 미확정</title></path> })}
        {layer === 'underground' && data.regions.map((region) => <path key={region.id} d={region.path} className="territory-underground-ground" fill="#27343a" fillOpacity="0.6" stroke="#3c4a51" strokeWidth="0.5" vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {layer === 'surface' && data.regions.map((region) => <path key={region.id} d={region.path} className="territory-flat-region" data-region-id={region.id} data-state-id={region.polities[0]} role="button" tabIndex={0} aria-label={`${region.district} ${region.name} · ${states.get(region.polities[0])?.name ?? '영토'} 보기`} fill={states.get(region.polities[0])?.color ?? '#77858a'} fillOpacity={selectedId === region.id ? 0.95 : selectedHoldingRegions.has(region.id) ? 0.86 : stateFilter === 'all' || region.polities.includes(stateFilter) ? 0.72 : 0.24} stroke="#35434b" strokeWidth="0.6" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.chooseRegion(region) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.chooseRegion(region) } }} />)}
        {layer === 'surface' && selectedHolding && data.regions.filter(region => selectedHoldingRegions.has(region.id)).map(region => <path key={`holding-${region.id}`} data-holding-region={region.id} data-holding-id={selectedHolding.id} d={region.path} fill="none" stroke="var(--wiki-accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {layer === 'surface' && <path d={borders} className="territory-national-borders" fill="none" stroke="#18252d" strokeWidth="3.6" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
        {layer === 'surface' && showRail && projectSegments.map(({ project, a, b, key }) => <line key={key} data-gtx-project-segment={project.id} data-project-status={project.status} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--wiki-accent)" strokeWidth="3" strokeDasharray="7 5" vectorEffect="non-scaling-stroke" pointerEvents="none"><title>{project.id} · {a.name}–{b.name} · {projectStatusLabel(project.status)} · 사업 연결 도식</title></line>)}
        {layer === 'surface' && showRail && regularConnections?.edges.filter((edge) => selectedLine === 'all' || edge.lineId === selectedLine).map((edge) => { const a = endpointPoint(edge.a), b = endpointPoint(edge.b); return <line key={edge.id} data-regular-regional-segment={edge.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={data.lines[edge.lineId]?.color ?? 'var(--wiki-muted)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" pointerEvents="none"><title>{data.lines[edge.lineId]?.name ?? edge.lineId} · {edge.a.name}–{edge.b.name} · 일반 인접 연결 도식</title></line> })}
        {riverPaths.map((feature) => <polyline key={feature.id} className="territory-flat-river" points={(feature.coordinates as number[][]).map(([east, north]) => toMap(east, north).join(',')).join(' ')} fill="none" stroke="#36a8c4" strokeWidth="2.4" vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {layer === 'surface' && showRail && displayedRail.map((path, index) => <polyline key={`metro-${index}`} className="territory-metro-line" data-line-id={path.lineId} points={path.points.map(([east, north]) => toMap(east, north).join(',')).join(' ')} fill="none" stroke={data.lines[path.lineId]?.color ?? '#d5e5e8'} strokeWidth={selectedLine === 'all' ? '2.8' : '4'} vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {layer === 'surface' && showRail && frame === 'peninsula' && northern && <path d={northern.paths.map((path) => path.points.map(([east, north], index) => `${index ? 'L' : 'M'}${toMap(east, north).join(',')}`).join(' ')).join(' ')} fill="none" stroke="#e7d397" strokeWidth="1.2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
        {layer === 'surface' && showRail && !rail && data.edges.flatMap((edge, index) => edge.lineIds.filter((id) => selectedLine === 'all' || selectedLine === id).map((id) => { const a = data.stations.find((station) => station.id === edge.a), b = data.stations.find((station) => station.id === edge.b); return a && b ? <line key={`seoul-${index}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={data.lines[id]?.color ?? '#eee'} strokeWidth="3.2" vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null }))}
        {layer === 'surface' && showRail && !regularConnections && rail?.stations.filter((station) => !seoulStationNames.has(station.name) && station.lineIds.length > 1 && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station, index) => { const [x, y] = toMap(station.east, station.north); return <circle key={`transfer-${index}`} className="territory-transfer-marker" cx={x} cy={y} r="4.8" fill="#fff" stroke="#1d3038" strokeWidth="2.5" vectorEffect="non-scaling-stroke" onClick={() => { setRegionalStation(station); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{station.name} · 환승역</title></circle> })}
        {layer === 'surface' && showRail && showStations && !regularConnections && rail?.stations.filter((station) => !seoulStationNames.has(station.name) && station.lineIds.length <= 1 && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station, index) => { const [x, y] = toMap(station.east, station.north); return <circle key={`outer-${index}`} className="territory-regional-station" cx={x} cy={y} r="3.3" fill="#f6ecd0" stroke={data.lines[station.lineIds[0]]?.color ?? '#345'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" onClick={() => { setRegionalStation(station); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{station.name} · 광역철도</title></circle> })}
        {layer === 'surface' && showRail && showStations && [...officialExternalStations].filter(([, station]) => selectedLine === 'all' || station.lineIds.includes(selectedLine)).map(([id, station]) => { const [x, y] = toMap(station.east, station.north); return <circle key={id} data-official-regional-station={id} className="territory-regional-station" cx={x} cy={y} r={station.lineIds.length > 1 ? 4.8 : 3.3} fill="var(--wiki-paper)" stroke={data.lines[station.lineIds[0]]?.color ?? 'var(--wiki-muted)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" onClick={() => { setRegionalStation(station); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{station.name} · {station.lineIds.map((lineId) => data.lines[lineId]?.name ?? lineId).join(' · ')}</title></circle> })}
        {layer === 'surface' && showLandmarks && data.landmarks.map((site) => <circle key={site.id} cx={site.x} cy={site.y} r="5" fill={states.get(site.holderId)?.color} stroke="#fff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" onClick={() => { setSelectedLandmark(site.id); setDetailOpen(true) }}><title>{site.name} · {site.role}</title></circle>)}
        {layer === 'surface' && showVassals && data.vassals.map((vassal) => <g key={vassal.city} data-vassal-marker={vassal.city} role="button" tabIndex={0} aria-label={`${vassal.city} · ${vassal.name} · 본국 ${states.get(vassal.suzerain)?.name}`} onClick={() => { if (!dragged.current) handlers.current?.chooseVassal(vassal) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.chooseVassal(vassal) } }}><circle cx={toMap(vassal.east, vassal.north)[0]} cy={toMap(vassal.east, vassal.north)[1]} r="8" fill={states.get(vassal.suzerain)?.color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{vassal.name} · {vassal.city} · 본국 {states.get(vassal.suzerain)?.name}</title></g>)}
        {layer === 'underground' && data.edges.filter((edge) => selectedLine === 'all' || edge.lineIds.includes(selectedLine)).map((edge) => { const a = stationPoints.get(edge.a), b = stationPoints.get(edge.b); if (!a || !b) return null; const color = segmentColor(edge.control); return <line key={edge.id} className="territory-underground-segment" data-underground-segment={edge.id} data-control-status={edge.control.status} role="button" tabIndex={0} aria-label={`${a.name}–${b.name} 구간 · ${controlLabel(edge.control.status)}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={selectedSegmentId === edge.id ? '7' : '4'} strokeDasharray={edge.control.status === 'held' ? undefined : edge.control.status === 'contested' ? '7 4' : '3 4'} vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.selectSegment(edge) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.selectSegment(edge) } }}><title>{a.name}–{b.name} · {controlLabel(edge.control.status)}</title></line> })}
        {layer === 'underground' && showStations && stations.filter((station) => selectedLine === 'all' || station.lineIds.includes(selectedLine)).map((station) => <circle key={station.id} className="territory-station-area" data-station-area={station.id} data-control-status={station.control.status} cx={station.x} cy={station.y} r={station.lineIds.length > 1 ? 5.5 : 3.8} fill={segmentColor(station.control)} stroke="#f4fbff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.selectStation(station) }}><title>{station.names.join(' · ')} 역 구역 · {controlLabel(station.control.status)}</title></circle>)}
        {data.states.map((state) => <g key={state.id} className="territory-flat-capital" data-capital-station-id={state.capitalStationId} onClick={() => handlers.current?.chooseState(state)}><circle cx={state.capitalX} cy={state.capitalY} r="7" fill={states.get(state.id)?.color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{state.id} {state.historicalName} · 역사적 수도 보유 {state.capitalStationId}</title></g>)}
        {showStations && stations.filter((station) => (station.lineIds.length > 1 || station.memberIds.length > 1 || data.majorStationIds.includes(station.id)) && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station) => <g key={station.id} className="territory-flat-station" data-station-id={station.id} onClick={() => handlers.current?.selectStation(station)}><circle cx={station.x} cy={station.y} r={station.lineIds.length > 1 ? 6 : 4} fill="#fff" stroke={data.lines[station.lineIds[0]]?.color ?? '#264655'} strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{station.names.join(' · ')} · {station.lineIds.map((id) => data.lines[id]?.name).join(' · ')}</title></g>)}
    </>
  }, [selectedHolding, selectedHoldingRegions, data, terrain, relief, water, projectToMap, boundaries, outsideUnits, outsideAssignments, selectedOutsideUnit, states, stations, seoulStationNames, stationPoints, borders, rail, regularConnections, northern, frame, layer, selectedSegmentId, selectedVassal, showRail, showStations, showLandmarks, showVassals, selectedLine, selectedId, stateFilter])
  if (failed) return <p className="wiki-domain-label">영토 지도를 불러오지 못했습니다. 새로고침해 주세요.</p>
  if (!data || !terrain || !relief || !water || !box) return <div className="wiki-loading">서울 영토와 강줄기를 불러오고 있습니다.</div>

  const toMap = projectToMap!
  const peninsula = terrain.layers.find((entry) => entry.name === 'peninsula')!
  const [e0, n0, e1, n1] = peninsula.bboxEPSG5179
  const [px, py] = toMap(e0, n1)
  const [pr, pb] = toMap(e1, n0)
  const framePeninsula = () => { setFrame('peninsula'); setBox({ x: px, y: py, width: pr - px, height: pb - py }) }
  const frameSeoul = () => { setFrame('seoul'); setBox({ x: 0, y: 0, width: data.width, height: data.height }) }
  const chooseState = (state: State) => { setSelectedOutsideUnit(null); setSelectedSegmentId(null); setSelectedId(state.capitalRegionId); setShowRegionDetail(false); setStateFilter(state.id); setSelectedStation(null); setRegionalStation(null); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseVassal = (vassal: Vassal) => { const width = data.width * 2.5; const height = width * box.height / box.width; const [x, y] = toMap(vassal.east, vassal.north); setFrame('peninsula'); setBox({ x: x - width / 2, y: y - height / 2, width, height }); setSelectedVassal(vassal.name); setSelectedOutsideUnit(null); setStateFilter('all'); setSelectedId(null); setSelectedStation(null); setRegionalStation(null); setSelectedSegmentId(null); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseOutsideUnit = (unit: OutsideUnit) => { setSelectedOutsideUnit(unit.id); setSelectedVassal(null); setSelectedId(null); setSelectedStation(null); setRegionalStation(null); setSelectedSegmentId(null); setSelectedLandmark(null); setStateFilter('all'); setDetailOpen(true) }
  const chooseRegion = (region: Region) => {
    setSelectedOutsideUnit(null)
    setSelectedSegmentId(null)
    setSelectedId(region.id)
    setShowRegionDetail(true)
    const state = states.get(region.polities[0])
    setStateFilter(state?.id ?? 'all')
    setSelectedStation(null); setRegionalStation(null); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true)
  }
  const selectStation = (station: DisplayStation) => { setSelectedOutsideUnit(null); setSelectedSegmentId(null); setSelectedStation(station); setRegionalStation(null); setSelectedId(null); setStateFilter('all'); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true) }
  const selectSegment = (segment: Segment) => { setSelectedOutsideUnit(null); setSelectedSegmentId(segment.id); setSelectedStation(null); setRegionalStation(null); setSelectedId(null); setStateFilter('all'); setSelectedVassal(null); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseLayer = (next: 'surface' | 'underground') => {
    if (next === layer) return
    setLayer(next)
    setSelectedOutsideUnit(null)
    setSelectedSegmentId(null)
    setSelectedId(null)
    setSelectedStation(null)
    setStateFilter('all')
    setRegionalStation(null)
    setSelectedVassal(null)
    setSelectedLandmark(null)
    setDetailOpen(false)
  }
  handlers.current = { chooseRegion, chooseState, chooseVassal, chooseOutsideUnit, selectStation, selectSegment }
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
  const selectedOutsideUnitData = outsideUnits?.units.find((unit) => unit.id === selectedOutsideUnit)
  const selectedOutsideAssignment = selectedOutsideUnit && outsideAssignments.get(selectedOutsideUnit)
  const selectedLandmarkData = data.landmarks.find((landmark) => landmark.id === selectedLandmark)
  const selectedRegionalHolder = regionalStation && boundaries.find((boundary) => insideBoundary([regionalStation.east, regionalStation.north], boundary.geometry))
  const mapScale = Math.min(mapSize.width / box.width, mapSize.height / box.height)
  const flagPosition = (x: number, y: number) => ({
    left: `${50 + (x - box.x - box.width / 2) * mapScale / mapSize.width * 100}%`,
    top: `${50 + (y - box.y - box.height / 2) * mapScale / mapSize.height * 100}%`,
  })
  const selectedSuzerain = data.vassals.find((vassal) => vassal.city === selectedRegionalHolder?.city)
  const stationDetail = selectedStation && underground?.stations[selectedStation.id]
  const selectedSegment = data.edges.find((edge) => edge.id === selectedSegmentId)
  const segmentCounts = (status: string) => data.edges.filter((edge) => status === 'unassigned' ? !['held', 'contested', 'vacant'].includes(edge.control.status) : edge.control.status === status).length

  return <section className="territory-map-section" aria-labelledby="opening-territory-title">
    <header><p className="wiki-domain-label">한반도 지형 · 서울 전철 연결권 · 2126 시점</p><h2 id="opening-territory-title">2126 시점 영토 지도</h2><p>서울 427개 동의 국가 권역과 강줄기를 봅니다. 한반도 보기에서는 서울 밖 행정 경계와 속국 소재지도 확인할 수 있습니다.</p></header>
    <details className="territory-project-connections">
      <summary>GTX 건설·계획 연결</summary>
      <p>공식 사업 자료의 경로입니다. 사업 단계와 자료 시점은 현재 운행 및 2126년 영토·통행 정보와 구분합니다.</p>
      {gtxProjects.projects.map((project) => <section key={project.id} data-gtx-project={project.id} data-project-status={project.status}>
        <h3>{project.id} · {projectStatusLabel(project.status)}</h3>
        <p className="wiki-domain-label">{'statusAsOf' in project ? `사업 상태 기준: ${project.statusAsOf}` : 'sourceYear' in project ? `발표 자료: ${project.sourceYear}년` : `자료 기준: ${gtxProjects.asOf}`}</p>
        <ul>{project.paths.map((path, index) => <li key={index}>{path.join(' → ')}</li>)}</ul>
        <a href={project.sourceUrl}>공식 사업 자료</a>
      </section>)}
    </details>
    <div className="territory-toolbar">
      <div className="territory-layer-toggle" role="group" aria-label="영토 층"><button type="button" onClick={() => chooseLayer('surface')} aria-pressed={layer === 'surface'}>지상 영토</button><button type="button" onClick={() => chooseLayer('underground')} aria-pressed={layer === 'underground'}>지하 영토</button></div>
      <p className="wiki-domain-label">지도 색상은 역사적·직접 보유를 나타냅니다. 현재 종주 소속은 국가·지역·역의 선택 정보에 표시됩니다.</p>
      <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => { const state = states.get(event.target.value); if (state) chooseState(state); else setStateFilter('all') }}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
      <label className="territory-filter"><span>노선 필터</span><select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}><option value="all">전체 노선</option>{Object.entries(data.lines).map(([id, line]) => <option key={id} value={id}>{line.name}</option>)}</select></label>
      {layer === 'surface' && <label className="territory-rail-toggle"><input type="checkbox" checked={showRail} onChange={(event) => setShowRail(event.target.checked)} />지하철 노선 표시</label>}
      <label className="territory-filter"><span>개인 영지</span><select value={selectedHolding?.id ?? ''} disabled={!holdings} onChange={event => {
        const holding = holdings?.holdings.find(item => item.id === event.target.value)
        if (holding?.stationRef || holding?.facilityRef) {
          const stationId = holding.stationRef?.stationId ?? (holding.facilityRef ? holding.facilityRef.stationId ?? holding.facilityRef.stationName : null)
          if (stationId === null) return
          const station = stations.find(item => item.memberIds.includes(stationId))
          if (station) selectStation(station)
        } else {
          const region = holding && data.regions.find(item => item.id === holding.adminRefs[0]?.id)
          if (region) chooseRegion(region)
        }
      }}><option value="">영지 선택</option>{holdings?.holdings.map(holding => <option key={holding.id} value={holding.id}>{holding.name.ko} · {holding.holderPersonId}</option>)}</select></label>
      {holdingLoadFailed && <p role="status" className="wiki-domain-label">개인 영지 정보를 불러오지 못했습니다.</p>}
      <label className="territory-filter"><span>지역 선택</span><select value={selectedId ?? ''} onChange={(event) => { const region = data.regions.find((item) => item.id === event.target.value); if (region) chooseRegion(region) }}><option value="">선택 안 함</option>{data.regions.map((region) => <option key={region.id} value={region.id}>{region.district} · {region.name}</option>)}</select></label>
      {layer === 'surface' && <label className="territory-filter"><span>서울 밖 속국</span><select value={selectedVassal ?? ''} onChange={(event) => { const vassal = data.vassals.find((item) => item.name === event.target.value); if (vassal) chooseVassal(vassal) }}><option value="">선택 안 함</option>{data.vassals.map((vassal) => <option key={vassal.city} value={vassal.name}>{vassal.city} · {vassal.name}</option>)}</select></label>}
      <fieldset className="territory-marker-filters"><legend>지도 표시</legend><label><input type="checkbox" checked={showStations} onChange={(event) => setShowStations(event.target.checked)} />역</label>{layer === 'surface' && <><label><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} />시설</label><label><input type="checkbox" checked={showVassals} onChange={(event) => setShowVassals(event.target.checked)} />속국</label></>}</fieldset>
      <span className="territory-controls-help">드래그 이동 · 휠 확대/축소</span>
    </div>
    <div className="territory-tier-legend" aria-label="국력 등급 범례">{(['강국', '약국', '소국'] as const).map((tier) => <span key={tier} className="territory-tier-chip" data-tier={tier}><span className="territory-tier-dot" style={{ backgroundColor: tierColors[tier] }} />{tier} {data.states.filter((state) => state.power === tier).length}</span>)}<span className="territory-tier-note">{layer === 'surface' ? '굵은 선: 서울 국가 경계 · 색칠된 서울 밖 행정구역: 확정 지배 · 회색 경계: 지배 기록 없음 · 점선: 속국 소재지 · 색상 선: 전철 노선' : '점: 역 구역 · 선: 역 사이 구간 · 색: 지배 국가'}</span></div>
    {layer === 'underground' && <div className="territory-underground-legend" aria-label="지하 구간 지배 범례"><span><span className="territory-underground-swatch" data-control-status="held" />점유 {segmentCounts('held')}</span><span><span className="territory-underground-swatch" data-control-status="contested" style={{ backgroundColor: contestedColor }} />분쟁 {segmentCounts('contested')}</span><span><span className="territory-underground-swatch" data-control-status="unassigned" style={{ backgroundColor: unassignedColor }} />미배정 {segmentCounts('unassigned')}</span><span className="territory-tier-note">구간 지배는 양 끝 역 지배가 같으면 그 국가, 다르면 분쟁으로 정합니다.</span></div>}
    <div className="territory-map-layout"><div className="territory-map-canvas territory-map-flat" data-flat-territory-map data-territory-layer={layer}>
      <div className="territory-flat-controls" role="group" aria-label="지도 범위"><button type="button" onClick={frameSeoul} aria-pressed={frame === 'seoul'}>서울 전체</button><button type="button" onClick={framePeninsula} aria-pressed={frame === 'peninsula'}>한반도 보기</button><button type="button" onClick={() => zoom(0.8)}>줌인</button><button type="button" onClick={() => zoom(1.25)}>줌아웃</button></div>
      <svg ref={mapRef} className="territory-flat-svg" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="img" aria-label={layer === 'surface' ? '서울 국가 경계와 강줄기, 서울 밖 행정구역과 속국 소재지' : '서울 지하 역 구역과 역 사이 구간의 지배'} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}>
        <g onKeyDownCapture={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof SVGElement && event.target.hasAttribute('data-underground-segment')) setSegmentChoices([])
        }} onClickCapture={(event) => {
          if (layer !== 'underground' || !(event.target instanceof SVGElement) || !event.target.hasAttribute('data-underground-segment') || event.detail === 0) return
          event.stopPropagation()
          if (dragged.current) return
          const lines = Array.from(event.currentTarget.querySelectorAll<SVGLineElement>('line[data-underground-segment]'))
          const candidates = segmentPointerChoices({ x: event.clientX, y: event.clientY }, lines.flatMap((line) => {
            const matrix = line.getScreenCTM()
            const localMatrix = line.getCTM()
            const id = line.getAttribute('data-underground-segment')
            const style = getComputedStyle(line)
            if (!matrix || !localMatrix || !id || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || Number(style.strokeOpacity) === 0 || style.stroke === 'none') return []
            const a = new DOMPoint(line.x1.baseVal.value, line.y1.baseVal.value).matrixTransform(matrix)
            const b = new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(matrix)
            // non-scaling-stroke excludes the SVG viewBox scale, but not outer CSS scale.
            const cssScale = Math.hypot(matrix.a, matrix.b) / Math.hypot(localMatrix.a, localMatrix.b)
            const strokeScale = style.vectorEffect === 'non-scaling-stroke' ? cssScale : Math.hypot(matrix.a, matrix.b)
            return [{ id, a, b, strokeWidth: Number.parseFloat(style.strokeWidth) * strokeScale }]
          }))
          if (candidates.length === 1) {
            const segment = data.edges.find((edge) => edge.id === candidates[0])
            if (segment) selectSegment(segment)
            setSegmentChoices([])
          } else if (candidates.length > 1) {
            setDetailOpen(false)
            setSegmentChoices(candidates)
          } else {
            setSegmentChoices([])
          }
        }}>{svgLayers}</g>
      </svg>
      {segmentChoices.length > 1 && <div className="territory-segment-choices" role="group" aria-label="겹친 지하 구간 선택">
        <p>지하 구간 선택</p>
        {segmentChoices.map((id) => {
          const segment = data.edges.find((edge) => edge.id === id)
          return segment && <button key={id} type="button" className="territory-segment-choice" data-segment-choice={id} onClick={() => { selectSegment(segment); setSegmentChoices([]) }}>{stationPoints.get(segment.a)?.name ?? segment.a}–{stationPoints.get(segment.b)?.name ?? segment.b}</button>
        })}
        <button type="button" className="territory-segment-choice" onClick={() => setSegmentChoices([])}>닫기</button>
      </div>}
      <div ref={textMeshRef} className="territory-surface-text-mesh" aria-hidden="true" />
      <div className="territory-faction-flags" aria-label="16국 영토 깃발">
        {data.states.map((state) => { const [x, y] = flagAnchors.get(state.id) ?? [state.labelX, state.labelY]; return <button key={state.id} type="button" className="territory-faction-flag" data-territory-flag={state.id} aria-label={`${state.name} 영토 보기`} aria-pressed={stateFilter === state.id} style={{ ...flagPosition(x, y), borderColor: states.get(state.id)?.color }} onClick={() => chooseState(state)}><StateFlag stateId={state.id} /></button> })}
      </div>
      {(selectedState || selectedStation || selectedSegment || regionalStation || selectedLandmark || selectedVassal || selectedOutsideUnitData || selected) && <button type="button" className="territory-detail-toggle" aria-expanded={detailOpen} aria-controls="territory-detail-panel" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? '정보 접기' : '정보 펼치기'}</button>}
      {detailOpen && <aside id="territory-detail-panel" className="territory-detail" aria-label="선택 정보" aria-live="polite"><button type="button" className="territory-detail-close" onClick={() => setDetailOpen(false)}>정보 접기</button>
        {selectedState && !showRegionDetail && <section><p className="wiki-domain-label">선택 국가 · {selectedState.id}</p><h3>{selectedState.name}</h3><table className="person-data-table"><tbody><tr><th>수장</th><td>{selectedState.ruler}</td></tr><tr><th>국호를 정한 해</th><td>{selectedState.founded}</td></tr><tr><th>기원</th><td>{selectedState.origin}</td></tr><tr><th>역사적 국명</th><td>{selectedState.historicalName}</td></tr><tr><th>현재 종주 소속</th><td>{selectedState.currentHegemon.name}</td></tr><tr><th>현재 거점</th><td>{selectedState.currentBase.name}</td></tr><tr><th>역사적 수도 보유</th><td>{selectedState.capitalStationId}</td></tr><tr><th>현재 독점 관할</th><td>{selectedState.currentExclusiveDistrictCount}개 동</td></tr><tr><th>정부와 승계</th><td>{selectedState.government}</td></tr><tr><th>정부와의 관계</th><td>{selectedState.relation ?? '해당 없음'}</td></tr><tr><th>속국</th><td>{selectedState.vassals}</td></tr><tr><th>국교</th><td>{selectedState.religion}</td></tr><tr><th>국력</th><td>{selectedState.power}</td></tr></tbody></table>{selectedState.cause !== selectedState.foreignRelations && <p>{selectedState.cause}</p>}<h4>국가 간 관계</h4><p>{selectedState.foreignRelations}</p><h4>연대기</h4><ol>{selectedState.chronology.map((event, index) => <li key={`${event.year}-${index}`}><Link to={event.sourceRoute}>{event.year}년</Link> · {event.text}</li>)}</ol><Link to={`/states/${selectedState.slug}`} className="territory-state-link">{selectedState.name} 국가 상세 보기</Link></section>}
        {selectedHolding && holdings && (selectedStation || selected && showRegionDetail) && <HoldingSelectionPanel holding={selectedHolding} openingYear={holdings.openingYear} selectedRegionId={selected?.id ?? ''} onSelectRegion={id => { const region = data.regions.find(item => item.id === id); if (region) chooseRegion(region) }} />}
        {selected && showRegionDetail && <section><p className="wiki-domain-label">선택된 지역 · {selected.district}</p><h3>{selected.name}</h3><dl><dt>역사적·직접 보유</dt><dd>{selected.polities.map(id => states.get(id)?.name ?? id).join(' · ')}</dd><dt>현재 종주 소속</dt><dd>{selected.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</dd></dl><p>2126년 인구 밀도 {Math.round(selected.density2126).toLocaleString('ko-KR')}명/km²</p><p className="wiki-domain-label">{data.populationAttribution}</p><p>{selected.openingState}</p><p>{selected.summary}</p></section>}
        {selectedStation && <section><p className="wiki-domain-label">서울 역 정보</p><h3>{selectedStation.names.join(' · ')}</h3><p>역사적·직접 보유: {selectedStation.control.polityNames.join(' · ')}<br />현재 종주 소속: {selectedStation.control.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</p><table className="person-data-table"><tbody><tr><th>구</th><td>{selectedStation.district}</td></tr>{selectedStation.control.memberSurfaces && new Set(selectedStation.control.memberSurfaces.map((entry) => entry.surfaceRegionName)).size > 1 && <tr><th>지표 관측</th><td>{selectedStation.control.memberSurfaces.map((entry) => `${entry.id}: ${entry.surfaceRegionName ?? '범위 밖'} · ${entry.surfacePolityIds.map((id) => states.get(id)?.name ?? id).join(' · ') || '기록 없음'}`).join(' / ')}</td></tr>}<tr><th>노선·환승</th><td>{selectedStation.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ')}</td></tr><tr><th>역 상태</th><td>{selectedStation.control.status === 'held' ? '점유' : selectedStation.control.status === 'contested' ? '분쟁' : selectedStation.control.status === 'vacant' ? '무주지' : '상태 기록 없음'}</td></tr><tr><th>직접 관여 세력</th><td>{selectedStation.control.polityNames.join(' · ') || '기록 없음'}</td></tr><tr><th>경비·통행 우선</th><td>{selectedStation.control.primary ? states.get(selectedStation.control.primary)?.name ?? selectedStation.control.primary : '기록 없음'}</td></tr><tr><th>지배 계층</th><td>{selectedStation.control.hierarchy.state} → {selectedStation.control.hierarchy.regionalAuthority} → {selectedStation.control.hierarchy.stationManager}</td></tr>{selectedStation.lineIds.map((id) => { const entry = stationDetail?.[id] ?? selectedStation.memberIds.map((member) => underground?.stations[member]?.[id]).find(Boolean); return entry ? <tr key={id}><th>{data.lines[id]?.name ?? id} 승강장</th><td>{entry.floors ?? '층 기록 없음'} · {entry.platformM == null ? '심도 기록 없음' : `${entry.platformM} m`} · 출구 {entry.exits ?? '기록 없음'}</td></tr> : null })}</tbody></table></section>}
        {selectedSegment && <section><p className="wiki-domain-label">지하 역 사이 구간</p><h3>{stationPoints.get(selectedSegment.a)?.name ?? selectedSegment.a}–{stationPoints.get(selectedSegment.b)?.name ?? selectedSegment.b}</h3><table className="person-data-table"><tbody><tr><th>노선</th><td>{selectedSegment.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ') || '기록 없음'}</td></tr><tr><th>구간 상태</th><td>{segmentStatusLabel(selectedSegment.control.status)}</td></tr><tr><th>관여 국가</th><td>{selectedSegment.control.polityIds.map((id) => states.get(id)?.name ?? id).join(' · ') || '미배정'}</td></tr><tr><th>현재 종주 소속</th><td>{selectedSegment.control.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</td></tr><tr><th>지배 근거</th><td>{selectedSegment.control.source === 'control-delta' ? '구간 원장' : '양 끝 역 지배'}</td></tr><tr><th>2126 통행</th><td>{passageLabel(selectedSegment.passage2126)}</td></tr></tbody></table></section>}
        {regionalStation && <section><p className="wiki-domain-label">광역철도 역 정보</p><h3>{regionalStation.name}</h3><table className="person-data-table"><tbody><tr><th>노선·환승</th><td>{regionalStation.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ')}</td></tr><tr><th>지표 권역</th><td>{selectedRegionalHolder?.city ?? '서울 외 지도 권역'}</td></tr>{selectedSuzerain && <tr><th>속국·본국</th><td>{selectedSuzerain.name} · {states.get(selectedSuzerain.suzerain)?.name}</td></tr>}</tbody></table><p>현행 철도 위치 자료의 역이다. 국가 통제는 별도 역 점령 원장으로 확인한다.</p></section>}
        {selectedVassalData && <section><p className="wiki-domain-label">선택된 속국 · {selectedVassalData.city}</p><h3>{selectedVassalData.name}</h3><table className="person-data-table"><tbody><tr><th>본국</th><td>{states.get(selectedVassalData.suzerain)?.name}</td></tr><tr><th>성립</th><td>{selectedVassalData.founded}</td></tr><tr><th>하는 일</th><td>{selectedVassalData.duty}</td></tr><tr><th>선로 방향</th><td>{selectedVassalData.anchor}</td></tr></tbody></table><p>점선은 {selectedVassalData.city} 행정 경계입니다. 이 안의 각 읍·면·동 지배는 별도 확인 대상입니다.</p><p className="wiki-domain-label">경계: {selectedVassalData.coordinateSource}</p></section>}
        {selectedOutsideUnitData && <section><p className="wiki-domain-label">서울 밖 행정구역 · {selectedOutsideUnitData.province}</p><h3>{selectedOutsideUnitData.name}</h3><table className="person-data-table"><tbody><tr><th>행정 단위</th><td>{selectedOutsideUnitData.district} · {selectedOutsideUnitData.id}</td></tr><tr><th>2126 지배</th><td>{selectedOutsideAssignment ? `${selectedOutsideAssignment.vassal} · ${states.get(selectedOutsideAssignment.suzerain)?.name ?? selectedOutsideAssignment.suzerain}` : '기록 없음'}</td></tr>{selectedOutsideAssignment && <tr><th>중심역</th><td>{selectedOutsideAssignment.station}</td></tr>}</tbody></table><p>표시된 경계는 2026년 행정 경계입니다. {!selectedOutsideAssignment && '속국 소재지와 해당 읍·면·동 전체의 지배는 별개의 사실입니다.'}</p><p className="wiki-domain-label">경계: {outsideUnits?.source} · SHA-256 {outsideUnits?.sourceSha256}</p></section>}
        {selectedLandmarkData && <section><p className="wiki-domain-label">주요 시설</p><h3>{selectedLandmarkData.name}</h3><p>{selectedLandmarkData.role}</p><p>{selectedLandmarkData.detail}</p></section>}
      </aside>}
    </div></div>
    <div className="territory-legend">{data.states.map((state) => <button key={state.id} type="button" onClick={() => chooseState(state)} aria-pressed={stateFilter === state.id}><span className="territory-legend-swatch" style={{ backgroundColor: states.get(state.id)?.color }} /><StateFlag stateId={state.id} /><span>{state.id} {state.name}</span></button>)}</div>
    {showRail && <div className="territory-line-legend" aria-label="광역철도 노선 색상"><button type="button" aria-pressed={selectedLine === 'all'} onClick={() => setSelectedLine('all')}>전체 노선</button>{Object.entries(data.lines).map(([id, line]) => <button key={id} type="button" aria-pressed={selectedLine === id} onClick={() => setSelectedLine(id)}><span style={{ backgroundColor: line.color }} />{line.name}</button>)}</div>}
    <p className="wiki-domain-label">{data.epoch.label} · {data.attribution} · {terrain.attribution}{northern && frame === 'peninsula' && showRail ? ` · 북측 철도 ${northern.source.snapshot} · ${northern.source.license}` : ''}</p>
  </section>
}
