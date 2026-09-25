import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { StateFlag } from './StateFlag'
import { resolveRegionSelection } from '../wikiRouting'
import { TerrainTileCache, visibleTerrainTiles } from './terrainTileCache'
import type { TerrainTile, TileCounts } from './terrainTileCache'
import './OpeningTerritoryMap.css'

type State = { id: string; name: string; slug: string; origin: string; government: string; power: string; relation: '복속' | '보좌' | '독립' | null; ruler: string; cause: string; labelX: number; labelY: number; capitalStationId: string; capitalRegionId: string; capitalX: number; capitalY: number }
type Region = { id: string; name: string; district: string; path: string; polities: string[]; status: 'held' | 'contested' | 'vacant'; openingState: string; summary: string; stationCount: number }
type LineDefinition = { name: string; color: string }
type StationControl = { source: 'derived-from-surface' | 'outside-surface-atlas' | 'control-delta'; deltaId: string | null; status: 'held' | 'contested' | 'vacant' | 'unknown'; polityIds: string[]; polityNames: string[]; surfaceRegionId: string | null; surfaceRegionName: string | null; hierarchy: { state: string; regionalAuthority: string; stationManager: string } }
type Station = { id: string; name: string; district: string; x: number; y: number; degree: number; lineIds: string[]; control: StationControl }
type SubwayEdge = { a: string; b: string; lineIds: string[] }
type Vassal = { name: string; city: string; suzerain: string; founded: string; duty: string; anchor: string; lineId: string; x: number; y: number; east: number; north: number; coordinateStatus: 'surveyed'; coordinateSource: string }
type Projection = { crs: 'EPSG:5179'; minEast: number; maxEast: number; minNorth: number; maxNorth: number }
type TerritoryData = { width: number; height: number; projection: Projection; epoch: { label: string }; states: State[]; vassals: Vassal[]; lines: Record<string, LineDefinition>; stations: Station[]; edges: SubwayEdge[]; majorStationIds: string[]; regions: Region[]; attribution: string }
type TerrainLayer = TerrainTile & { name: string; zoom: number; minElevation: number; maxElevation: number }
type WaterFeature = { id: string; kind: 'polygon' | 'line'; tag: Record<string, string>; coordinates: number[][] | number[][][] }
type DetailTile = TerrainTile & { waterFile: string }
type RegionalData = { meta: { layers: TerrainLayer[]; detailTiles: DetailTile[]; farWaterFile: string; attribution: string }; coarse: Uint16Array; farWater: { features: WaterFeature[] }; boundaries: Array<{ city: string; centroid: [number, number]; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } }>; rail: { paths: Array<{ lineId: string; points: [number, number][] }>; stations: Array<{ name: string; east: number; north: number; lineIds: string[] }> } }
type TerritoryLayer = 'surface' | 'subway'
type MarkerPosition = { left: number; top: number; anchorLeft: number; anchorTop: number; visible: boolean }
type RegionMesh = THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial> & { userData: { regionId: string; baseColor: string } }
type StateEdgeLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> & { userData: { holderId: string | null; lineIds: string[] } }
type MapRuntime = {
  reset: () => void
  pan: (x: number, z: number) => void
  orbit: (radians: number) => void
  zoom: (factor: number) => void
  framePeninsula: () => void
  meshes: RegionMesh[]
  lineMaterials: Map<string, THREE.LineBasicMaterial>
  vassalLineMaterials: Array<{ lineId: string; material: THREE.LineBasicMaterial }>
  render: () => void
  byLineSegments: THREE.LineSegments[]
  stateEdgeLines: StateEdgeLine[]
  stationColorAttribute: THREE.BufferAttribute | null
  stationMaterial: THREE.PointsMaterial
  capitalMaterial: THREE.PointsMaterial
  vassalGroup: THREE.Group
  undergroundGroup: THREE.Group
  base: THREE.Mesh
  applyLayer: (layer: TerritoryLayer) => void
}

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']
const tierColors: Record<string, string> = { 강국: '#b54b4b', 약국: '#956f28', 소국: '#64708a' }
const contestedStationColor = '#9aa7ad'
const unknownStationColor = '#5d6f78'
const vacantColor = '#6f7a7f'
const surfaceStationColor = '#f8f1cf'
const undergroundLevels = { station: -1.8, platform: -4.4, tunnel: -7 } as const

const compassLabel = (x: number, y: number, width: number, height: number) => {
  const degrees = ((Math.atan2(x - width / 2, height / 2 - y) * 180 / Math.PI) + 360) % 360
  const labels = ['북쪽', '북동쪽', '동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽']
  return labels[Math.round(degrees / 45) % 8]
}

const resolveMarkerCollisions = (markers: Array<{ id: string; left: number; top: number; visible: boolean }>, width: number, height: number) => {
  const placed: Array<{ id: string; left: number; top: number; anchorLeft: number; anchorTop: number; visible: boolean }> = []
  const markerWidth = width < 500 ? Math.round(width * 0.24) : Math.min(148, Math.round(width * 0.16))
  const markerHeight = Math.round(markerWidth * 0.42)
  const gap = 6
  const offsets: Array<[number, number]> = [[0, 0]]
  for (const radius of [1, 2, 3, 4, 5, 6]) {
    for (const [x, y] of [[radius, 0], [-radius, 0], [0, -radius], [0, radius], [radius, -radius], [radius, radius], [-radius, -radius], [-radius, radius]]) {
      offsets.push([x * (markerWidth + gap), y * (markerHeight + gap)])
    }
  }
  for (const marker of [...markers].sort((a, b) => a.top - b.top || a.left - b.left || a.id.localeCompare(b.id))) {
    const anchorX = marker.left / 100 * width
    const anchorY = marker.top / 100 * height
    let candidateX = anchorX
    let candidateY = anchorY
    for (const [offsetX, offsetY] of offsets) {
      const x = THREE.MathUtils.clamp(anchorX + offsetX, markerWidth / 2 + gap, width - markerWidth / 2 - gap)
      const y = THREE.MathUtils.clamp(anchorY + offsetY, markerHeight + gap, height - gap)
      const collision = placed.some((other) => {
        const otherX = other.left / 100 * width
        const otherY = other.top / 100 * height
        return Math.abs(otherX - x) < markerWidth + gap && Math.abs(otherY - y) < markerHeight + gap
      })
      if (collision) continue
      candidateX = x
      candidateY = y
      break
    }
    placed.push({ ...marker, left: candidateX / width * 100, top: candidateY / height * 100, anchorLeft: marker.left, anchorTop: marker.top })
  }
  return Object.fromEntries(placed.map((marker) => [marker.id, marker]))
}

const placeVassalLabels = (anchors: Record<string, MarkerPosition>, vassals: Vassal[], capitals: Array<{ left: number; top: number; visible: boolean }>, width: number, height: number) => {
  const occupied = capitals.filter((capital) => capital.visible).map((capital) => ({ x: capital.left / 100 * width - 13, y: capital.top / 100 * height - 13, width: 26, height: 26 }))
  occupied.push({ x: width - 232, y: height - 126, width: 232, height: 126 })
  const positions: Record<string, { left: number; top: number }> = {}
  for (const vassal of vassals) {
    const anchor = anchors[vassal.name]
    if (!anchor?.visible) continue
    const labelWidth = Math.min(190, Math.max(94, (vassal.name.length + vassal.city.length + 3) * 11))
    const labelHeight = 25
    const x = anchor.anchorLeft / 100 * width
    const y = anchor.anchorTop / 100 * height
    const side = x < width / 2 ? 1 : -1
    const candidates = [0, -29, 29, -58, 58, -87, 87, -116, 116, -145, 145]
      .flatMap((offset) => [side, -side].map((direction) => ({
        x: THREE.MathUtils.clamp(x + direction * (labelWidth / 2 + 11), labelWidth / 2 + 6, width - labelWidth / 2 - 6),
        y: THREE.MathUtils.clamp(y + offset, labelHeight / 2 + 6, height - labelHeight / 2 - 6),
      })))
    const chosen = candidates.find((candidate) => occupied.every((other) =>
      candidate.x + labelWidth / 2 + 4 <= other.x || candidate.x - labelWidth / 2 - 4 >= other.x + other.width ||
      candidate.y + labelHeight / 2 + 4 <= other.y || candidate.y - labelHeight / 2 - 4 >= other.y + other.height,
    )) ?? candidates[0]
    occupied.push({ x: chosen.x - labelWidth / 2, y: chosen.y - labelHeight / 2, width: labelWidth, height: labelHeight })
    positions[vassal.name] = { left: chosen.x / width * 100, top: chosen.y / height * 100 }
  }
  return positions
}

const parseTerritoryPath = (path: string) => {
  if (!/^M-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?(?: L-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)+ Z$/u.test(path)) throw new Error('E_TERRITORY_PATH')
  const points = [...path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])] as const)
  if (points.length < 3 || points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) throw new Error('E_TERRITORY_POINTS')
  return points
}

const terrainHeight = (elevation: number, sea = false) => sea ? -0.48 : Math.min(Math.max(elevation, -100), 2900) * 0.0045

const terrainSample = (layer: TerrainTile, grid: Uint16Array, east: number, north: number) => {
  const [minEast, minNorth, maxEast, maxNorth] = layer.bboxEPSG5179
  const col = THREE.MathUtils.clamp(Math.round((east - minEast) / (maxEast - minEast) * (layer.width - 1)), 0, layer.width - 1)
  const row = THREE.MathUtils.clamp(Math.round((maxNorth - north) / (maxNorth - minNorth) * (layer.height - 1)), 0, layer.height - 1)
  return grid[(row * layer.width + col) * 2] - 500
}

export default function OpeningTerritoryMap() {
  const [searchParams] = useSearchParams()
  const requestedRegion = searchParams.get('region')
  const [data, setData] = useState<TerritoryData | null>(null)
  const [regional, setRegional] = useState<RegionalData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedVassal, setSelectedVassal] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedLine, setSelectedLine] = useState('all')
  const [layer, setLayer] = useState<TerritoryLayer>('surface')
  const [markerPositions, setMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [stationMarkerPositions, setStationMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [vassalMarkerPositions, setVassalMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [vassalLabelPositions, setVassalLabelPositions] = useState<Record<string, { left: number; top: number }>>({})
  const [hoveredStation, setHoveredStation] = useState<{ station: Station; left: number; top: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [cameraPortrait, setCameraPortrait] = useState(false)
  const [tileCounts, setTileCounts] = useState<TileCounts>({ desired: 0, requests: 0, loaded: 0, inFlight: 0, decodedBytes: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<MapRuntime | null>(null)
  const selectedLineRef = useRef(selectedLine)
  const layerRef = useRef(layer)
  layerRef.current = layer
  useEffect(() => { selectedLineRef.current = selectedLine }, [selectedLine])
  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}opening-territories.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`E_TERRITORY_HTTP:${response.status}`)
        return response.json() as Promise<TerritoryData>
      })
      .then((value) => { setData(value) })
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!data) return
    const controller = new AbortController()
    const asset = (name: string) => fetch(`${import.meta.env.BASE_URL}${name}`, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error(`E_REGIONAL_ASSET:${name}:${response.status}`)
      return response
    })
    void asset('regional-terrain.json').then((response) => response.json() as Promise<RegionalData['meta']>).then(async (meta) => {
      const [boundaries, rail, coarse, farWater] = await Promise.all([
        asset('regional-boundaries.json').then((response) => response.json() as Promise<RegionalData['boundaries']>),
        asset('regional-rail.json').then((response) => response.json() as Promise<RegionalData['rail']>),
        asset(meta.layers.find((entry) => entry.name === 'peninsula')!.file).then((response) => response.arrayBuffer()),
        asset(meta.farWaterFile).then((response) => response.json() as Promise<RegionalData['farWater']>),
      ])
      setRegional({ meta, boundaries, rail, coarse: new Uint16Array(coarse), farWater })
    }).catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [data])

  useEffect(() => {
    if (!data) return
    setSelectedId(resolveRegionSelection(data.regions, requestedRegion))
  }, [data, requestedRegion])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  const vassals = data?.vassals ?? []
  const selected = data?.regions.find((region) => region.id === selectedId)
  const selectedState = stateFilter === 'all' ? null : states.get(stateFilter) ?? null
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { 강국: 0, 약국: 0, 소국: 0 }
    for (const state of data?.states ?? []) counts[state.power] = (counts[state.power] ?? 0) + 1
    return counts
  }, [data])
  const selectState = (state: State) => {
    setSelectedVassal(null)
    setStateFilter(state.id)
    setSelectedId(state.capitalRegionId)
  }
  const selectVassal = (vassal: Vassal) => {
    setSelectedVassal(vassal.name)
    setStateFilter('all')
    setSelectedId(null)
  }

  useEffect(() => {
    if (!data || !regional || !canvasRef.current || !shellRef.current) return
    const canvas = canvasRef.current
    const shell = shellRef.current
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x07151c, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x07151c, 7000, 10500)
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 12000)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = false
    controls.screenSpacePanning = false
    controls.minPolarAngle = Math.PI * 0.16
    controls.maxPolarAngle = Math.PI * 0.47
    controls.minDistance = 42
    controls.maxDistance = 6500
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE

    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x18262c, 2.1))
    const key = new THREE.DirectionalLight(0xffe6bd, 3.4)
    key.position.set(-45, 70, 52)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x72c7db, 1.6)
    rim.position.set(65, 30, -55)
    scene.add(rim)

    const scale = 100 / data.width
    const mapWorldHeight = data.height * scale
    const { minEast, maxEast, minNorth, maxNorth } = data.projection
    const worldAt = (east: number, north: number) => ({ x: (east - minEast) / (maxEast - minEast) * 100 - 50, z: (maxNorth - north) / (maxNorth - minNorth) * mapWorldHeight - mapWorldHeight / 2 })
    const projectedAt = (x: number, z: number) => ({ east: minEast + (x + 50) / 100 * (maxEast - minEast), north: maxNorth - (z + mapWorldHeight / 2) / mapWorldHeight * (maxNorth - minNorth) })
    const coarseLayer = regional.meta.layers.find((entry) => entry.name === 'peninsula')!
    const surfaceY = (x: number, z: number) => {
      const { east, north } = projectedAt(x, z)
      const [e0, n0, e1, n1] = coarseLayer.bboxEPSG5179
      if (east < e0 || east > e1 || north < n0 || north > n1) return 0
      return terrainHeight(terrainSample(coarseLayer, regional.coarse, east, north))
    }
    const stationById = new Map(data.stations.map((station) => [station.id, station]))
    const meshes: RegionMesh[] = []
    const disposables: Array<{ dispose: () => void }> = []
    const vassalByCity = new Map(vassals.map((entry) => [entry.city, entry]))
    const terrainGroup = new THREE.Group()
    scene.add(terrainGroup)
    const buildTerrain = (terrain: TerrainTile, grid: Uint16Array, detail = false) => {
      const vertices: number[] = []
      const colors: number[] = []
      const indices: number[] = []
      const [e0, n0, e1, n1] = terrain.bboxEPSG5179
      for (let row = 0; row < terrain.height; row += 1) {
        const north = n1 - row / (terrain.height - 1) * (n1 - n0)
        for (let col = 0; col < terrain.width; col += 1) {
          const east = e0 + col / (terrain.width - 1) * (e1 - e0)
          const { x, z } = worldAt(east, north)
          const index = (row * terrain.width + col) * 2
          const elevation = grid[index] - 500
          const territoryIndex = grid[index + 1] & 0x7fff
          const living = territoryIndex > 0
          const sea = (grid[index + 1] & 0x8000) !== 0
          const color = new THREE.Color(sea ? '#14394d' : living ? elevation > 550 ? '#68857e' : '#4f7364' : elevation > 900 ? '#66665f' : '#4a524f')
          const variation = Math.min(0.2, Math.max(0, elevation) / 3600)
          color.offsetHSL(0, 0, variation)
          if (!sea && territoryIndex >= 2) {
            const vassal = vassalByCity.get(regional.boundaries[territoryIndex - 2]?.city)
            const suzerain = vassal && states.get(vassal.suzerain)
            if (suzerain) color.lerp(new THREE.Color(suzerain.color), 0.78)
          }
          vertices.push(x, terrainHeight(elevation, sea) + (detail ? 0.035 : 0), z)
          colors.push(color.r, color.g, color.b)
        }
      }
      for (let row = 0; row < terrain.height - 1; row += 1) for (let col = 0; col < terrain.width - 1; col += 1) {
        const a = row * terrain.width + col
        const b = a + 1
        const c = a + terrain.width
        indices.push(a, c, b, b, c, c + 1)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: detail, polygonOffsetFactor: -1 })
      const mesh = new THREE.Mesh(geometry, material)
      if (detail) mesh.renderOrder = 1
      terrainGroup.add(mesh)
      if (!detail) disposables.push(geometry, material)
      return mesh
    }
    buildTerrain(coarseLayer, regional.coarse)
    const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x2088ac, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
    const waterGroup = new THREE.Group()
    terrainGroup.add(waterGroup)
    waterGroup.visible = false
    disposables.push(waterMaterial)
    const buildWater = (features: WaterFeature[], terrain: TerrainTile, grid: Uint16Array, parent: THREE.Group, far = false) => {
      let count = 0
      const geometries: THREE.BufferGeometry[] = []
      for (const feature of features) {
        const point = ([east, north]: number[]) => {
          const { x, z } = worldAt(east, north)
          const elevation = terrainSample(terrain, grid, east, north)
          return new THREE.Vector3(x, terrainHeight(elevation) + (far ? 0.07 : 0.11), z)
        }
        if (feature.kind === 'polygon') {
          const rings = feature.coordinates as number[][][]
          if (rings[0]?.length < 3) continue
          const outline = rings[0].map(([east, north]) => worldAt(east, north))
          const shape = new THREE.Shape(outline.map(({ x, z }) => new THREE.Vector2(x, -z)))
          for (const hole of rings.slice(1)) shape.holes.push(new THREE.Path(hole.map(([east, north]) => { const { x, z } = worldAt(east, north); return new THREE.Vector2(x, -z) })))
          const geometry = new THREE.ShapeGeometry(shape)
          const positions = geometry.getAttribute('position')
          for (let index = 0; index < positions.count; index += 1) {
            const x = positions.getX(index)
            const z = -positions.getY(index)
            const { east, north } = projectedAt(x, z)
            positions.setXYZ(index, x, terrainHeight(terrainSample(terrain, grid, east, north)) + (far ? 0.07 : 0.11), z)
          }
          positions.needsUpdate = true
          geometries.push(geometry)
        } else {
          const coordinates = feature.coordinates as number[][]
          if (coordinates.length < 2) continue
          const vertices: number[] = []
          const width = far ? 0.32 : feature.tag.waterway === 'river' ? 0.22 : 0.085
          for (let i = 0; i < coordinates.length; i += 1) {
            const current = point(coordinates[i])
            const previous = point(coordinates[Math.max(0, i - 1)])
            const next = point(coordinates[Math.min(coordinates.length - 1, i + 1)])
            const dx = next.x - previous.x
            const dz = next.z - previous.z
            const magnitude = Math.hypot(dx, dz) || 1
            vertices.push(current.x - dz / magnitude * width, current.y, current.z + dx / magnitude * width,
              current.x + dz / magnitude * width, current.y, current.z - dx / magnitude * width)
          }
          const indices: number[] = []
          for (let i = 0; i < coordinates.length - 1; i += 1) indices.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
          geometry.setIndex(indices)
          geometries.push(geometry)
        }
      }
      for (const geometry of geometries) {
        const mesh = new THREE.Mesh(geometry, waterMaterial)
        mesh.renderOrder = 4
        parent.add(mesh)
        count += 1
      }
      return { geometries, count }
    }
    const farWater = buildWater(regional.farWater.features.filter((feature) => feature.tag.waterway === 'river' && feature.kind === 'line'), coarseLayer, regional.coarse, waterGroup, true)
    disposables.push(...farWater.geometries)
    const detailGroups = new Map<string, { group: THREE.Group; geometries: THREE.BufferGeometry[]; waterMeshes: number }>()
    const detailCache = new TerrainTileCache<{ grid: Uint16Array; water: { features: WaterFeature[] }; tile: DetailTile }>(
      async (tile, signal) => {
        const detail = tile as DetailTile
        const [heightResponse, waterResponse] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}${detail.file}`, { signal }),
          fetch(`${import.meta.env.BASE_URL}${detail.waterFile}`, { signal }),
        ])
        if (!heightResponse.ok || !waterResponse.ok) throw new Error(`E_REGIONAL_DETAIL:${detail.key}`)
        const [buffer, water] = await Promise.all([heightResponse.arrayBuffer(), waterResponse.json() as Promise<{ features: WaterFeature[] }>])
        if (buffer.byteLength !== tile.width * tile.height * 4) throw new Error(`E_REGIONAL_DETAIL_LENGTH:${tile.key}`)
        return { value: { tile: detail, grid: new Uint16Array(buffer), water }, bytes: buffer.byteLength + JSON.stringify(water).length * 2 }
      },
      (key, value) => {
        const group = new THREE.Group()
        const mesh = buildTerrain(value.tile, value.grid, true)
        terrainGroup.remove(mesh)
        group.add(mesh)
        const water = buildWater(value.water.features, value.tile, value.grid, group)
        terrainGroup.add(group)
        detailGroups.set(key, { group, geometries: [mesh.geometry, ...water.geometries], waterMeshes: water.count })
        render()
      },
      (key) => {
        const detail = detailGroups.get(key)
        if (!detail) return
        terrainGroup.remove(detail.group)
        for (const geometry of detail.geometries) geometry.dispose()
        for (const child of detail.group.children) if (child instanceof THREE.Mesh && child.material !== waterMaterial) child.material.dispose()
        detailGroups.delete(key)
      },
      (counts) => setTileCounts((current) => current.desired === counts.desired && current.requests === counts.requests && current.loaded === counts.loaded && current.inFlight === counts.inFlight && current.decodedBytes === counts.decodedBytes ? current : counts),
    )
    for (const region of data.regions) {
      const points = parseTerritoryPath(region.path)
      const shape = new THREE.Shape()
      points.forEach(([svgX, svgY], index) => {
        const x = (svgX - data.width / 2) * scale
        const y = (data.height / 2 - svgY) * scale
        if (index === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      })
      shape.closePath()
      const depth = (region.status === 'held' ? 0.82 : region.status === 'vacant' ? 0.3 : 0.46) + Math.min(region.stationCount * 0.035, 0.28)
      const geometry = new TessellateModifier(1.8, 5).modify(new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false }))
      geometry.rotateX(-Math.PI / 2)
      const positions = geometry.getAttribute('position')
      for (let index = 0; index < positions.count; index += 1) positions.setY(index, positions.getY(index) + surfaceY(positions.getX(index), positions.getZ(index)) + 0.14)
      positions.needsUpdate = true
      geometry.computeVertexNormals()
      const baseColor = region.status === 'vacant' ? vacantColor : region.status === 'contested' ? '#9f9276' : states.get(region.polities[0])?.color ?? '#777777'
      const material = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.68, metalness: 0.08, emissive: 0x061016, emissiveIntensity: 0.18 })
      const mesh = new THREE.Mesh(geometry, material) as RegionMesh
      mesh.renderOrder = 2
      mesh.userData = { regionId: region.id, baseColor }
      scene.add(mesh)
      meshes.push(mesh)
      disposables.push(geometry, material)
    }

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(106, 1.2, mapWorldHeight + 6),
      new THREE.MeshStandardMaterial({ color: 0x10242c, roughness: 0.88, metalness: 0.02 }),
    )
    base.position.y = -0.72
    scene.add(base)
    disposables.push(base.geometry, base.material)

    const undergroundGroup = new THREE.Group()
    scene.add(undergroundGroup)
    for (const [level, depth] of Object.entries(undergroundLevels)) {
      const geometry = new THREE.PlaneGeometry(104, mapWorldHeight + 4)
      geometry.rotateX(-Math.PI / 2)
      const material = new THREE.MeshBasicMaterial({ color: level === 'station' ? 0x1d4955 : level === 'platform' ? 0x163844 : 0x102b39, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })
      const plane = new THREE.Mesh(geometry, material)
      plane.position.y = depth - 0.2
      undergroundGroup.add(plane)
      disposables.push(geometry, material)
    }
    const stationStacks = new THREE.Group()
    undergroundGroup.add(stationStacks)
    const stackGeometry = new THREE.CylinderGeometry(0.12, 0.12, undergroundLevels.station - undergroundLevels.tunnel, 6)
    const stackMaterial = new THREE.MeshBasicMaterial({ color: 0x79adb9, transparent: true, opacity: 0.45 })
    const stacks = new THREE.InstancedMesh(stackGeometry, stackMaterial, data.stations.length)
    const stackMatrix = new THREE.Matrix4()
    data.stations.forEach((station, index) => {
      stackMatrix.makeTranslation((station.x - data.width / 2) * scale, (undergroundLevels.station + undergroundLevels.tunnel) / 2, (station.y - data.height / 2) * scale)
      stacks.setMatrixAt(index, stackMatrix)
    })
    stationStacks.add(stacks)
    disposables.push(stackGeometry, stackMaterial)
    for (const [level, depth] of [['station', undergroundLevels.station], ['platform', undergroundLevels.platform]] as const) {
      const geometry = new THREE.CylinderGeometry(level === 'station' ? 0.47 : 0.34, level === 'station' ? 0.47 : 0.34, 0.16, 8)
      const material = new THREE.MeshBasicMaterial({ color: level === 'station' ? 0xb7eaf4 : 0xffffff, vertexColors: false })
      const discs = new THREE.InstancedMesh(geometry, material, data.stations.length)
      data.stations.forEach((station, index) => {
        stackMatrix.makeTranslation((station.x - data.width / 2) * scale, depth, (station.y - data.height / 2) * scale)
        discs.setMatrixAt(index, stackMatrix)
        if (level === 'platform') discs.setColorAt(index, new THREE.Color(data.lines[station.lineIds[0]]?.color ?? '#8ca7ad'))
      })
      stationStacks.add(discs)
      disposables.push(geometry, material)
    }

    const subwayPositionsByLine = new Map<string, number[]>()
    for (const edge of data.edges) {
      const a = stationById.get(edge.a)
      const b = stationById.get(edge.b)
      if (!a || !b) continue
      const lineIds = edge.lineIds.length > 0 ? edge.lineIds : ['unclassified']
      for (const lineId of lineIds) {
        if (!subwayPositionsByLine.has(lineId)) subwayPositionsByLine.set(lineId, [])
        const ax = (a.x - data.width / 2) * scale
        const az = (a.y - data.height / 2) * scale
        const bx = (b.x - data.width / 2) * scale
        const bz = (b.y - data.height / 2) * scale
        subwayPositionsByLine.get(lineId)!.push(
          ax, surfaceY(ax, az) + 1.38, az,
          bx, surfaceY(bx, bz) + 1.38, bz,
        )
      }
    }
    const lineMaterials = new Map<string, THREE.LineBasicMaterial>()
    const byLineSegments: THREE.LineSegments[] = []
    const vassalLineMaterials: Array<{ lineId: string; material: THREE.LineBasicMaterial }> = []
    const regionalRailGroup = new THREE.Group()
    scene.add(regionalRailGroup)
    const regionalByLine = new Map<string, number[]>()
    for (const path of regional.rail.paths) {
      if (path.points.length < 2) continue
      const positions = regionalByLine.get(path.lineId) ?? []
      const points = path.points.map(([east, north]) => {
        const { x, z } = worldAt(east, north)
        return [x, surfaceY(x, z) + 0.75, z]
      })
      for (let index = 1; index < points.length; index += 1) positions.push(...points[index - 1], ...points[index])
      regionalByLine.set(path.lineId, positions)
    }
    for (const [lineId, positions] of regionalByLine) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const material = new THREE.LineBasicMaterial({ color: data.lines[lineId]?.color ?? '#d1b976', transparent: true, opacity: 0.85 })
      const line = new THREE.LineSegments(geometry, material)
      line.renderOrder = 5
      line.userData.lineId = lineId
      regionalRailGroup.add(line)
      vassalLineMaterials.push({ lineId, material })
      disposables.push(geometry, material)
      const tunnelGeometry = new THREE.BufferGeometry()
      tunnelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.map((value, index) => index % 3 === 1 ? undergroundLevels.tunnel : value), 3))
      const tunnel = new THREE.LineSegments(tunnelGeometry, material)
      undergroundGroup.add(tunnel)
      disposables.push(tunnelGeometry)
    }
    for (const [lineId, positions] of subwayPositionsByLine) {
      const subwayGeometry = new THREE.BufferGeometry()
      subwayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const subwayMaterial = new THREE.LineBasicMaterial({ color: data.lines[lineId]?.color ?? '#78868a', transparent: true, opacity: 0.72 })
      const subwayLines = new THREE.LineSegments(subwayGeometry, subwayMaterial)
      subwayLines.userData.lineId = lineId
      subwayLines.renderOrder = 5
      scene.add(subwayLines)
      lineMaterials.set(lineId, subwayMaterial)
      byLineSegments.push(subwayLines)
      disposables.push(subwayGeometry, subwayMaterial)
      const tunnelGeometry = new THREE.BufferGeometry()
      const tunnelPositions = positions.map((value, index) => index % 3 === 1 ? undergroundLevels.tunnel : value)
      tunnelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tunnelPositions, 3))
      const tunnel = new THREE.LineSegments(tunnelGeometry, subwayMaterial)
      tunnel.userData.lineId = lineId
      tunnel.renderOrder = 4
      undergroundGroup.add(tunnel)
      disposables.push(tunnelGeometry)
    }

    const holderMaterials = new Map<string | null, THREE.LineBasicMaterial>()
    const holderMaterial = (holderId: string | null) => {
      if (!holderMaterials.has(holderId)) {
        const material = new THREE.LineBasicMaterial({ color: holderId ? states.get(holderId)?.color ?? '#78868a' : '#8b98a1', transparent: true, opacity: 0.9 })
        holderMaterials.set(holderId, material)
        disposables.push(material)
      }
      return holderMaterials.get(holderId)!
    }
    const stateEdgeLines: StateEdgeLine[] = []
    for (const edge of data.edges) {
      const a = stationById.get(edge.a)
      const b = stationById.get(edge.b)
      if (!a || !b) continue
      const holderA = a.control.polityIds.length === 1 ? a.control.polityIds[0] : null
      const holderB = b.control.polityIds.length === 1 ? b.control.polityIds[0] : null
      const holderId = holderA !== null && holderA === holderB ? holderA : null
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3((a.x - data.width / 2) * scale, 1.38, (a.y - data.height / 2) * scale),
        new THREE.Vector3((b.x - data.width / 2) * scale, 1.38, (b.y - data.height / 2) * scale),
      ])
      const line = new THREE.Line(geometry, holderMaterial(holderId)) as StateEdgeLine
      line.userData = { holderId, lineIds: edge.lineIds }
      line.renderOrder = 3
      line.visible = false
      scene.add(line)
      stateEdgeLines.push(line)
      disposables.push(geometry)
    }

    const stationPositions = data.stations.flatMap((station) => {
      const x = (station.x - data.width / 2) * scale
      const z = (station.y - data.height / 2) * scale
      return [x, surfaceY(x, z) + 1.52, z]
    })
    const stationGeometry = new THREE.BufferGeometry()
    stationGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stationPositions, 3))
    stationGeometry.setAttribute('stationIndex', new THREE.Float32BufferAttribute(data.stations.map((_, index) => index), 1))
    const stationColorAttribute = new THREE.Float32BufferAttribute(new Array(data.stations.length * 3).fill(1), 3)
    stationGeometry.setAttribute('color', stationColorAttribute)
    const stationMaterial = new THREE.PointsMaterial({ color: 0xffffff, vertexColors: true, size: 0.38, sizeAttenuation: true })
    const stationPoints = new THREE.Points(stationGeometry, stationMaterial)
    stationPoints.renderOrder = 4
    scene.add(stationPoints)
    disposables.push(stationGeometry, stationMaterial)

    const capitalPositions = data.states.flatMap((state) => {
      const x = (state.capitalX - data.width / 2) * scale
      const z = (state.capitalY - data.height / 2) * scale
      return [x, surfaceY(x, z) + 2.25, z]
    })
    const capitalGeometry = new THREE.BufferGeometry()
    capitalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(capitalPositions, 3))
    const capitalMaterial = new THREE.PointsMaterial({ color: 0xffd66b, size: 1.65, sizeAttenuation: true })
    const capitalPoints = new THREE.Points(capitalGeometry, capitalMaterial)
    capitalPoints.renderOrder = 5
    scene.add(capitalPoints)
    disposables.push(capitalGeometry, capitalMaterial)

    const regionalStationGeometry = new THREE.BufferGeometry()
    const regionalStationCoordinates = regional.rail.stations.flatMap((station) => {
      const { x, z } = worldAt(station.east, station.north)
      return [x, surfaceY(x, z) + 0.95, z]
    })
    regionalStationGeometry.setAttribute('position', new THREE.Float32BufferAttribute(regionalStationCoordinates, 3))
    const regionalStationMaterial = new THREE.PointsMaterial({ color: 0xf7eac1, size: 0.85, sizeAttenuation: true })
    const regionalStationCloud = new THREE.Points(regionalStationGeometry, regionalStationMaterial)
    regionalStationCloud.renderOrder = 5
    scene.add(regionalStationCloud)
    disposables.push(regionalStationGeometry, regionalStationMaterial)

    const vassalGroup = new THREE.Group()
    const vassalAnchors = new Map<string, THREE.Vector3>()
    for (const vassal of vassals) {
      const suzerain = states.get(vassal.suzerain)
      const { x, z } = worldAt(vassal.east, vassal.north)
      const anchor = new THREE.Vector3(x, surfaceY(x, z) + 1.8, z)
      vassalAnchors.set(vassal.name, anchor)
      const geometry = new THREE.OctahedronGeometry(1.3)
      const material = new THREE.MeshStandardMaterial({ color: suzerain?.color ?? '#78868a', roughness: 0.5, emissive: 0x11151a, emissiveIntensity: 0.3 })
      const marker = new THREE.Mesh(geometry, material)
      marker.position.copy(anchor)
      marker.renderOrder = 6
      vassalGroup.add(marker)
      disposables.push(geometry, material)
    }
    scene.add(vassalGroup)

    const applyLayer = (activeLayer: TerritoryLayer) => {
      layerRef.current = activeLayer
      if (activeLayer === 'subway') { selectionKey = ''; detailCache.update([]) }
      undergroundGroup.visible = activeLayer === 'subway'
      base.visible = false
      terrainGroup.visible = activeLayer === 'surface'
      regionalRailGroup.visible = activeLayer === 'surface'
      regionalStationCloud.visible = activeLayer === 'surface'
      for (const mesh of meshes) mesh.visible = activeLayer === 'surface'
      stationPoints.position.y = activeLayer === 'subway' ? undergroundLevels.station - 1.52 : 0
      capitalPoints.visible = activeLayer === 'surface'
      for (const segment of byLineSegments) segment.visible = activeLayer === 'surface'
      for (const edgeLine of stateEdgeLines) edgeLine.visible = false
      const surfaceColor = new THREE.Color(surfaceStationColor)
      const stationColors = data.stations.map((station) => {
        if (activeLayer === 'surface') return surfaceColor
        if (station.control.polityIds.length === 1) return new THREE.Color(states.get(station.control.polityIds[0])?.color ?? contestedStationColor)
        return new THREE.Color(station.control.status === 'unknown' ? unknownStationColor : station.control.status === 'vacant' ? vacantColor : contestedStationColor)
      })
      stationColors.forEach((color, index) => stationColorAttribute.setXYZ(index, color.r, color.g, color.b))
      stationColorAttribute.needsUpdate = true
      stationMaterial.size = activeLayer === 'subway' ? 0.62 : 0.38
      capitalMaterial.size = activeLayer === 'subway' ? 2.1 : 1.65
    }

    let selectionKey = ''
    const render = () => {
      const distance = camera.position.distanceTo(controls.target)
      waterGroup.visible = distance > 420 && layerRef.current === 'surface'
      if (layerRef.current === 'subway' || distance > 420) {
        if (selectionKey !== '') { selectionKey = ''; detailCache.update([]) }
      }
      else {
        const corners: Array<{ east: number; north: number }> = []
        for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
          const ray = new THREE.Raycaster()
          ray.setFromCamera(new THREE.Vector2(x, y), camera)
          const hit = new THREE.Vector3()
          if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) corners.push(projectedAt(hit.x, hit.z))
        }
        if (corners.length) {
          const margin = 25000
          const footprint: [number, number, number, number] = [
            Math.min(...corners.map((point) => point.east)) - margin,
            Math.min(...corners.map((point) => point.north)) - margin,
            Math.max(...corners.map((point) => point.east)) + margin,
            Math.max(...corners.map((point) => point.north)) + margin,
          ]
          const center = projectedAt(controls.target.x, controls.target.z)
          const selectedTiles = visibleTerrainTiles(regional.meta.detailTiles, footprint, [center.east, center.north])
          const nextKey = selectedTiles.map((tile) => tile.key).join(',')
          if (nextKey !== selectionKey) { selectionKey = nextKey; detailCache.update(selectedTiles) }
        }
      }
      renderer.render(scene, camera)
      const cameraDistance = camera.position.distanceTo(controls.target)
      const projectedStates = data.states.map((state) => {
        const x = (state.capitalX - data.width / 2) * scale
        const z = (state.capitalY - data.height / 2) * scale
        const vector = new THREE.Vector3(x, surfaceY(x, z) + 2.75, z).project(camera)
        return {
          id: state.id,
          left: (vector.x * 0.5 + 0.5) * 100,
          top: (-vector.y * 0.5 + 0.5) * 100,
          visible: cameraDistance < 420 && vector.x >= -1 && vector.x <= 1 && vector.y >= -1 && vector.y <= 1 && vector.z > -1 && vector.z < 1,
        }
      })
      setMarkerPositions(resolveMarkerCollisions(projectedStates, Math.max(shell.clientWidth, 1), Math.max(shell.clientHeight, 1)))
      const nextStations: Record<string, MarkerPosition> = {}
      for (const station of data.stations) {
        const x = (station.x - data.width / 2) * scale
        const z = (station.y - data.height / 2) * scale
        const vector = new THREE.Vector3(x, layerRef.current === 'subway' ? undergroundLevels.station + 0.3 : surfaceY(x, z) + 1.82, z).project(camera)
        const left = (vector.x * 0.5 + 0.5) * 100
        const top = (-vector.y * 0.5 + 0.5) * 100
        nextStations[station.id] = {
          left,
          top,
          anchorLeft: left,
          anchorTop: top,
          visible: cameraDistance < 420 && vector.x >= -1 && vector.x <= 1 && vector.y >= -1 && vector.y <= 1 && vector.z > -1 && vector.z < 1,
        }
      }
      setStationMarkerPositions(nextStations)
      const nextVassals: Record<string, MarkerPosition> = {}
      for (const [name, anchor] of vassalAnchors) {
        const vector = anchor.clone().project(camera)
        const left = (vector.x * 0.5 + 0.5) * 100
        const top = (-vector.y * 0.5 + 0.5) * 100
        nextVassals[name] = {
          left,
          top,
          anchorLeft: (vector.x * 0.5 + 0.5) * 100,
          anchorTop: (-vector.y * 0.5 + 0.5) * 100,
          visible: cameraDistance < 780 && vector.x >= -0.98 && vector.x <= 0.98 && vector.y >= -0.98 && vector.y <= 0.98 && vector.z > -1 && vector.z < 1,
        }
      }
      setVassalMarkerPositions(nextVassals)
      setVassalLabelPositions(placeVassalLabels(nextVassals, vassals, projectedStates, Math.max(shell.clientWidth, 1), Math.max(shell.clientHeight, 1)))
    }
    const reset = () => {
      const portrait = camera.aspect < 0.9
      camera.fov = portrait ? 55 : 40
      camera.position.set(0, portrait ? 122 : 135, portrait ? 148 : 180)
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 1)
      controls.update()
      render()
    }
    const framePeninsula = () => {
      const layer = regional.meta.layers.find((entry) => entry.name === 'peninsula')!
      const [e0, n0, e1, n1] = layer.bboxEPSG5179
      const center = worldAt((e0 + e1) / 2, (n0 + n1) / 2)
      controls.target.set(center.x, 0, center.z)
      camera.position.set(center.x, 1950, center.z + 1650)
      controls.update()
      render()
    }
    const pan = (x: number, z: number) => {
      const delta = new THREE.Vector3(x, 0, z)
      camera.position.add(delta)
      controls.target.add(delta)
      controls.update()
      render()
    }
    const orbit = (radians: number) => {
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), radians)
      camera.position.copy(controls.target).add(offset)
      camera.lookAt(controls.target)
      controls.update()
      render()
    }
    const zoom = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target)
      const distance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(offset.setLength(distance))
      controls.update()
      render()
    }
    runtimeRef.current = { reset, pan, orbit, zoom, framePeninsula, meshes, lineMaterials, vassalLineMaterials, render, byLineSegments, stateEdgeLines, stationColorAttribute, stationMaterial, capitalMaterial, vassalGroup, undergroundGroup, base, applyLayer }
    applyLayer(layer)

    let pointerStart: [number, number] | null = null
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerDown = (event: PointerEvent) => { pointerStart = [event.clientX, event.clientY] }
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return
      const rect = canvas.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(meshes, false)[0]?.object as RegionMesh | undefined
      if (hit?.userData.regionId) setSelectedId(hit.userData.regionId)
    }
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.params.Points.threshold = 1.25
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(stationPoints, false)[0]
      const station = hit && Number.isInteger(hit.index) ? data.stations[hit.index!] : null
      setHoveredStation(station ? { station, left: event.clientX - rect.left, top: event.clientY - rect.top } : null)
    }
    const onPointerLeave = () => setHoveredStation(null)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    controls.addEventListener('change', render)

    const resize = () => {
      const width = Math.max(1, shell.clientWidth)
      const height = Math.max(1, shell.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.fov = camera.aspect < 0.9 ? 55 : 40
      camera.updateProjectionMatrix()
      vassalGroup.visible = camera.aspect >= 0.9
      shell.dataset.portrait = String(camera.aspect < 0.9)
      setCameraPortrait(camera.aspect < 0.9)
      render()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(shell)
    framePeninsula()
    resize()

    return () => {
      detailCache.dispose()
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      for (const disposable of disposables) disposable.dispose()
      renderer.dispose()
      runtimeRef.current = null
    }
  }, [data, regional, states])

  useEffect(() => {
    if (!data || !runtimeRef.current) return
    for (const mesh of runtimeRef.current.meshes) {
      const region = data.regions.find((candidate) => candidate.id === mesh.userData.regionId)
      if (!region) continue
      const visible = stateFilter === 'all' || region.polities.includes(stateFilter)
      mesh.material.color.set(selectedId === region.id ? '#f8e9a3' : visible ? mesh.userData.baseColor : '#23343a')
      mesh.material.emissiveIntensity = selectedId === region.id ? 0.62 : visible ? 0.18 : 0.05
    }
    runtimeRef.current.render()
  }, [data, selectedId, stateFilter, layer])

  useEffect(() => {
    if (!runtimeRef.current) return
    for (const [lineId, material] of runtimeRef.current.lineMaterials) {
      const selected = selectedLine === 'all' || lineId === selectedLine
      material.opacity = selected ? (selectedLine === 'all' ? 0.72 : 1) : 0.08
    }
    for (const { lineId, material } of runtimeRef.current.vassalLineMaterials) material.opacity = selectedLine === 'all' || lineId === selectedLine ? 0.95 : 0.08
    runtimeRef.current.applyLayer(layer)
    runtimeRef.current.render()
  }, [selectedLine, layer])

  if (failed) return <p className="wiki-domain-label">3D 서울 영토 지도를 불러오지 못했습니다. 페이지를 새로고침한 뒤에도 계속되면 다른 브라우저에서 다시 시도해 주세요.</p>
  if (!data || !regional) return <div className="wiki-loading">서울 427개 동과 한반도 지형을 불러오고 있습니다.</div>

  return (
    <section className="territory-map-section" aria-labelledby="opening-territory-title">
      <header><p className="wiki-domain-label">한반도 지형 · 서울 전철 연결권 · 2126 시점</p><h2 id="opening-territory-title">3D 2126 시점 영토 지도</h2><p>한반도 전체 지형과 서울 연결 전철권의 상세 지형을 표시합니다. 서울의 427개 동과 속국 13개 시·군만 영토색으로 칠했습니다. 왼쪽 드래그는 팬, 오른쪽 드래그는 오빗, 휠은 줌입니다.</p></header>
      <div className="territory-toolbar">
        <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => { const state = states.get(event.target.value); if (state) selectState(state); else setStateFilter('all') }}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
        <label className="territory-filter"><span>노선 필터</span><select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}><option value="all">전체 노선</option>{Object.entries(data.lines).map(([lineId, line]) => <option key={lineId} value={lineId}>{line.name}</option>)}</select></label>
        <label className="territory-filter"><span>지역 선택</span><select value={selectedId ?? ''} onChange={(event) => { setSelectedVassal(null); setSelectedId(event.target.value) }}><option value="">선택 안 함</option>{data.regions.map((region) => <option key={region.id} value={region.id}>{region.district} · {region.name}</option>)}</select></label>
        <span className="territory-controls-help">왼쪽 드래그 팬 · 오른쪽 드래그 오빗 · 휠 줌</span>
      </div>
      <div className="territory-tier-legend" aria-label="국력 등급 범례">
        {(['강국', '약국', '소국'] as const).map((tier) => <span key={tier} className="territory-tier-chip" data-tier={tier}><span className="territory-tier-dot" style={{ backgroundColor: tierColors[tier] }} />{tier} {tierCounts[tier] ?? 0}</span>)}
        <span className="territory-tier-note">지하 터널 색은 공식 노선 색 · 역 표시는 지배 상태 색</span>
        <span className="territory-tier-note">폐허: 서울과 전철로 이어지지 않은 땅</span>
        <span className="territory-relation-legend">정부와의 관계: 복속 · 보좌 · 독립</span>
      </div>
      <div className="territory-map-layout">
        <div className="territory-map-canvas territory-map-canvas-3d" ref={shellRef} data-three-territory-map>
          <canvas ref={canvasRef} aria-label="서울 427개 동 Three.js 2126 시점 영토 지도" onContextMenu={(event) => event.preventDefault()} />
          <output className="territory-terrain-stats" aria-label="지형 타일 상태">타일 {tileCounts.loaded}/{tileCounts.desired} · 요청 {tileCounts.requests} · 진행 {tileCounts.inFlight} · {(tileCounts.decodedBytes / 1048576).toFixed(2)} MiB</output>
          <div className="territory-layer-toggle territory-layer-overlay" role="group" aria-label="지도 층 선택">
            <button type="button" aria-pressed={layer === 'surface'} onClick={() => setLayer('surface')}>지상</button>
            <button type="button" aria-pressed={layer === 'subway'} onClick={() => { setLayer('subway'); runtimeRef.current?.reset() }}>지하</button>
          </div>
          {layer === 'subway' && <div className="territory-underground-levels" aria-label="지하 세 층"><span>역 · 대합실</span><span>승강장</span><span>터널 · 공식 노선 색</span></div>}
          <div className="territory-camera-controls territory-camera-overlay" role="group" aria-label="3D 지도 카메라 조작">
            <button type="button" onClick={() => runtimeRef.current?.pan(0, -6)}>팬 북쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.pan(-6, 0)}>팬 서쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.pan(6, 0)}>팬 동쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.pan(0, 6)}>팬 남쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.orbit(-Math.PI / 12)}>오빗 왼쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.orbit(Math.PI / 12)}>오빗 오른쪽</button>
            <button type="button" onClick={() => runtimeRef.current?.zoom(0.78)}>줌인</button>
            <button type="button" onClick={() => runtimeRef.current?.zoom(1.28)}>줌아웃</button>
            <button type="button" onClick={() => runtimeRef.current?.framePeninsula()}>한반도 보기</button>
            <button type="button" onClick={() => runtimeRef.current?.reset()}>서울 보기</button>
          </div>
          <div className="territory-state-markers" aria-label="16국 수도 위치">
            {data.states.map((state) => {
              const position = markerPositions[state.id]
              const capital = data.stations.find((station) => station.id === state.capitalStationId)
              return <button key={state.id} type="button" className="territory-state-marker territory-capital-marker" data-capital-station-id={state.capitalStationId} aria-pressed={stateFilter === state.id} aria-label={`${state.id} ${state.name} 수도역 ${capital?.name ?? state.capitalStationId}`} title={`${state.id} ${state.name} · 수도역 ${capital?.name ?? state.capitalStationId}`} style={{ left: `${position?.anchorLeft ?? state.capitalX / data.width * 100}%`, top: `${position?.anchorTop ?? state.capitalY / data.height * 100}%`, backgroundColor: states.get(state.id)?.color, visibility: position?.visible === false ? 'hidden' : 'visible' }} onClick={() => selectState(state)}><StateFlag stateId={state.id} /></button>
            })}
          </div>
          <div className="territory-vassal-markers" aria-hidden={cameraPortrait ? 'true' : undefined} aria-label="속국 13 본국 연결 지점">
            {vassals.map((vassal) => {
              const position = vassalMarkerPositions[vassal.name]
              const suzerain = states.get(vassal.suzerain)
              if (!suzerain || cameraPortrait) return null
              const label = vassalLabelPositions[vassal.name]
              return <div key={vassal.name}>
                <span className="territory-vassal-marker" style={{ left: `${position?.left ?? 50}%`, top: `${position?.top ?? 50}%`, backgroundColor: data.lines[vassal.lineId]?.color ?? suzerain.color, visibility: position?.visible === false ? 'hidden' : 'visible' }} />
                {label && position?.visible && <button type="button" className="territory-vassal-label" aria-pressed={selectedVassal === vassal.name} style={{ left: `${label.left}%`, top: `${label.top}%`, borderColor: data.lines[vassal.lineId]?.color ?? suzerain.color }} aria-label={`${vassal.name} ${vassal.city} 본국 ${suzerain.name} 속국`} title={`${vassal.name}(${vassal.city}) · ${vassal.anchor} · 본국 ${suzerain.name}`} onClick={() => selectVassal(vassal)}>{vassal.name} · {vassal.city}</button>}
              </div>
            })}
          </div>
          <div className="territory-station-markers" aria-label="주요 지하철역 이름">
            {data.majorStationIds.map((stationId) => {
              const station = data.stations.find((candidate) => candidate.id === stationId)
              const position = stationMarkerPositions[stationId]
              if (!station) return null
              if (selectedLine !== 'all' && !station.lineIds.includes(selectedLine)) return null
              return <span key={station.id} className="territory-station-marker" data-station-id={station.id} style={{ left: `${position?.left ?? station.x / data.width * 100}%`, top: `${position?.top ?? station.y / data.height * 100}%`, visibility: position?.visible === false ? 'hidden' : 'visible' }}>{station.name}</span>
            })}
          </div>
          <div className="territory-station-hit-targets" aria-label="334개 역 점령 정보">
            {data.stations.map((station) => {
              const position = stationMarkerPositions[station.id]
              if (!position || position.visible === false || (selectedLine !== 'all' && !station.lineIds.includes(selectedLine))) return null
              const showTooltip = () => setHoveredStation({ station, left: position.left / 100 * (shellRef.current?.clientWidth ?? 1), top: position.top / 100 * (shellRef.current?.clientHeight ?? 1) })
              const lineColor = data.lines[station.lineIds[0]]?.color ?? '#f8f1cf'
              return <button key={station.id} type="button" className="territory-station-hit" data-station-id={station.id} aria-label={`${station.name} 역 정보`} style={{ left: `${position.left}%`, top: `${position.top}%`, borderColor: lineColor }} onPointerEnter={showTooltip} onPointerLeave={() => setHoveredStation(null)} onFocus={showTooltip} onBlur={() => setHoveredStation(null)} />
            })}
          </div>
          {hoveredStation && <div className="territory-station-tooltip" role="status" style={{ left: hoveredStation.left, top: hoveredStation.top }}>
            <strong>{hoveredStation.station.name}</strong>
            <div className="territory-tooltip-lines">{hoveredStation.station.lineIds.length > 0 ? hoveredStation.station.lineIds.map((lineId) => <span key={lineId} style={{ borderColor: data.lines[lineId]?.color, color: data.lines[lineId]?.color }}>{data.lines[lineId]?.name ?? lineId}</span>) : <span>노선 미확인</span>}</div>
            <dl>
              <div><dt>점령 상태</dt><dd>{hoveredStation.station.control.status === 'held' ? '단독 지배' : hoveredStation.station.control.status === 'contested' ? '경합' : hoveredStation.station.control.status === 'vacant' ? '무주지' : '미확인'}</dd></div>
              <div><dt>지배 국가</dt><dd>{hoveredStation.station.control.hierarchy.state}</dd></div>
              <div><dt>지배 계층</dt><dd>{hoveredStation.station.control.hierarchy.state} → {hoveredStation.station.control.hierarchy.regionalAuthority} → {hoveredStation.station.control.hierarchy.stationManager}</dd></div>
              <div><dt>점령 원장</dt><dd>{hoveredStation.station.control.source === 'derived-from-surface' ? '지표 영토 기반 초안' : hoveredStation.station.control.source === 'control-delta' ? `역 점령 변경 기록${hoveredStation.station.control.deltaId ? ` · ${hoveredStation.station.control.deltaId}` : ''}` : '서울 영토 원장 밖 · 미확인'}</dd></div>
            </dl>
          </div>}
        </div>
        <div className="territory-state-index" aria-label="16국 수도 목록">
          <p className="territory-vassal-inset-title">16국 · 수도</p>
          <ul>
            {data.states.map((state) => {
              const capital = data.stations.find((station) => station.id === state.capitalStationId)
              return <li key={state.id}><button type="button" aria-pressed={stateFilter === state.id} onClick={() => selectState(state)}><span className="territory-state-swatch" style={{ backgroundColor: states.get(state.id)?.color }} /><StateFlag stateId={state.id} />{state.id} {state.name}<span className="territory-state-capital">{capital?.name ?? state.capitalStationId}</span></button></li>
            })}
          </ul>
        </div>
        <div className="territory-vassal-inset" aria-label="속국 13 목록">
          <p className="territory-vassal-inset-title">속국 13 · 본국 연결</p>
          <ul>
            {vassals.map((vassal) => {
              const suzerain = states.get(vassal.suzerain)
              if (!suzerain) return null
              return <li key={vassal.name}><button type="button" aria-pressed={selectedVassal === vassal.name} onClick={() => selectVassal(vassal)} title={`선 해 ${vassal.founded} · ${vassal.duty} · ${vassal.anchor} · ${vassal.coordinateSource}`}><span className="territory-vassal-dot" style={{ backgroundColor: data.lines[vassal.lineId]?.color }} />{vassal.name}<span className="territory-vassal-city">{compassLabel(vassal.x, vassal.y, data.width, data.height)} · {vassal.city} · {suzerain.name}</span></button></li>
            })}
          </ul>
        </div>
        <aside className="territory-detail" aria-live="polite">
          {selectedVassal && (() => { const vassal = vassals.find((entry) => entry.name === selectedVassal)!; return <section aria-labelledby="selected-vassal-title"><p className="wiki-domain-label">선택된 속국 · {vassal.city}</p><h3 id="selected-vassal-title">{vassal.name}</h3><table className="person-data-table"><tbody><tr><th>본국</th><td>{states.get(vassal.suzerain)?.name}</td></tr><tr><th>연결 노선</th><td>{data.lines[vassal.lineId]?.name}</td></tr><tr><th>설립</th><td>{vassal.founded}</td></tr><tr><th>역할</th><td>{vassal.duty}</td></tr></tbody></table><p>{vassal.coordinateSource}</p></section> })()}
          {selected && <section aria-labelledby="selected-region-title"><p className="wiki-domain-label">선택된 지역 · {selected.district}</p><h3 id="selected-region-title">{selected.name}</h3><table className="person-data-table"><tbody><tr><th>지배 상태</th><td>{selected.status === 'held' ? '단독 지배' : selected.status === 'vacant' ? '무주지' : '경합·공동 영향권'}</td></tr><tr><th>영토국</th><td>{selected.polities.map((id) => states.get(id)?.name ?? id).join(' · ') || '없음'}</td></tr><tr><th>역 객체</th><td>{selected.stationCount}개</td></tr></tbody></table><h4>2126 시점 상태</h4><p>{selected.openingState}</p><h4>지역 개요</h4><p>{selected.summary}</p></section>}
          {selectedState && <section aria-labelledby="selected-state-title"><p className="wiki-domain-label">선택 국가 · {selectedState.id}</p><h3 id="selected-state-title">{selectedState.name}</h3><table className="person-data-table"><tbody><tr><th>수장</th><td>{selectedState.ruler}</td></tr><tr><th>기원·중심역</th><td>{selectedState.origin}</td></tr><tr><th>정부 형태</th><td>{selectedState.government}</td></tr><tr><th>국력</th><td>{selectedState.power}</td></tr>{selectedState.relation && <tr><th>정부와의 관계</th><td>{selectedState.relation}</td></tr>}</tbody></table><h4>형성 인과</h4><p>{selectedState.cause}</p><Link to={`/states/${selectedState.slug}`} className="territory-state-link">{selectedState.id} {selectedState.name} 상세 읽기</Link></section>}
        </aside>
      </div>
      <p className="wiki-domain-label">{regional.meta.attribution}</p>
      <div className="territory-legend">{data.states.map((state) => <button key={state.id} type="button" data-tier={state.power} onClick={() => selectState(state)} aria-pressed={stateFilter === state.id}><span className="territory-legend-swatch" style={{ backgroundColor: states.get(state.id)?.color }} /><StateFlag stateId={state.id} /><span>{state.id} {state.name}</span></button>)}</div>
      <div className="territory-line-legend" aria-label="서울 지하철 노선 색상"><button type="button" aria-pressed={selectedLine === 'all'} onClick={() => setSelectedLine('all')}>전체 노선</button>{Object.entries(data.lines).map(([lineId, line]) => <button key={lineId} type="button" aria-pressed={selectedLine === lineId} onClick={() => setSelectedLine(lineId)}><span style={{ backgroundColor: line.color }} />{line.name}</button>)}</div>
      <details className="territory-flag-provenance"><summary>16국 깃발 콘셉트 시트와 채택 자산</summary><p>CLIProxy Gemini로 생성한 4×4 콘셉트 시트를 Artkit으로 16개 셀에 분리해 지도·범례의 실제 깃발 자산으로 사용합니다.</p><img src={`${import.meta.env.BASE_URL}state-flags/concept-sheet.webp`} alt="16국 깃발 4×4 콘셉트 시트" loading="lazy" /></details>
      <p className="wiki-domain-label">{data.epoch.label} · 지형 높이는 가독성용 과장 · {data.attribution} · {regional.meta.attribution}</p>
    </section>
  )
}
