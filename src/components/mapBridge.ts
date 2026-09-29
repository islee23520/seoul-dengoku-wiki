import { stationAliases } from './stationPresentation'
import { selectAtCoordinates } from './mapCoordinateSelection'

export type MapSelectionKind = 'region' | 'state' | 'station' | 'segment' | 'landmark' | 'vassal' | 'outside-unit'
export type MapSelection = { kind: MapSelectionKind; id: string }
export type WikiMapMessage = { type: 'select'; selection: MapSelection | null }
export type UnityMapMessage = { type: 'selected'; selection: MapSelection | null }

export type MapCatalog = {
  regions: Array<{ id: string }>
  states: Array<{ id: string }>
  stations: Array<{ id: string }>
  edges: Array<{ id: string }>
  landmarks: Array<{ id: string }>
  vassals: Array<{ name: string }>
  outsideUnits: Array<{ id: string }>
}

export type MapTransport = {
  send: (message: WikiMapMessage) => void
  subscribe: (receive: (message: unknown) => void) => () => void
}

export type TerrainStatus = { type: 'ready'; tile: string; sourceSha256: string; manifestSha256: string } |
  { type: 'error'; code: string; message: string }

export function terrainStatus(message: unknown, tileHashes: ReadonlyMap<string, string>, manifestSha256: string): TerrainStatus | null {
  if (!message || typeof message !== 'object') return null
  const event = message as Record<string, unknown>
  if (event.schema !== 'janseon-wiki-map.v1') return null
  if (event.type === 'error' && typeof event.code === 'string' && typeof event.message === 'string')
    return { type: 'error', code: event.code, message: event.message }
  if (event.type !== 'ready' || event.projection !== 'EPSG:5179' ||
      typeof event.selection !== 'object' || event.selection === null) return null
  const selection = event.selection as Record<string, unknown>
  if (selection.kind !== 'regional-terrain-tile' || typeof selection.id !== 'string' ||
      !selection.id.startsWith('regional:')) return null
  const tile = selection.id.slice('regional:'.length)
  if (tileHashes.get(tile) !== event.sourceSha256 || event.manifestSha256 !== manifestSha256) return null
  return { type: 'ready', tile, sourceSha256: event.sourceSha256 as string, manifestSha256 }
}

export function selectionAtUnityCoordinate(message: unknown,
  manifest: { detailTiles: Array<{ key: string; sha256: string; bboxEPSG5179: number[] }> },
  manifestSha256: string,
  map: { width: number; height: number; projection: { minEast: number; maxEast: number; minNorth: number; maxNorth: number }; regions: Array<{ id: string; path: string }> },
  outside: Array<{ id: string; path: string }>): MapSelection | null {
  if (!message || typeof message !== 'object') return null
  const event = message as Record<string, unknown>
  if (event.schema !== 'janseon-wiki-map.v1' || event.type !== 'coordinate-selection' || event.projection !== 'EPSG:5179' ||
      event.manifestSha256 !== manifestSha256 || typeof event.east !== 'number' || typeof event.north !== 'number' ||
      !event.selection || typeof event.selection !== 'object') return null
  const selection = event.selection as Record<string, unknown>
  if (selection.kind !== 'regional-terrain-tile' || typeof selection.id !== 'string' || !selection.id.startsWith('regional:')) return null
  const tileId = selection.id.slice('regional:'.length)
  const tile = manifest.detailTiles.find((item) => item.key === tileId)
  if (!tile || tile.sha256 !== event.sourceSha256 || tile.bboxEPSG5179.length !== 4 ||
      event.east < tile.bboxEPSG5179[0] || event.east > tile.bboxEPSG5179[2] ||
      event.north < tile.bboxEPSG5179[1] || event.north > tile.bboxEPSG5179[3]) return null
  return selectAtCoordinates(event.east, event.north, map, outside)
}

export function createMapBridge(catalog: MapCatalog, transport: MapTransport, onSelected: (selection: MapSelection | null) => void) {
  const displayStations = new Set(catalog.stations.map(({ id }) => id))
  const gameToDisplay = new Map([...displayStations].map((id) => [id, id]))
  for (const [alias, primary] of Object.entries(stationAliases)) {
    if (displayStations.has(primary)) gameToDisplay.set(alias, primary)
  }
  const ids: Record<MapSelectionKind, Set<string>> = {
    region: new Set(catalog.regions.map(({ id }) => id)),
    state: new Set(catalog.states.map(({ id }) => id)),
    station: displayStations,
    segment: new Set(catalog.edges.map(({ id }) => id)),
    landmark: new Set(catalog.landmarks.map(({ id }) => id)),
    vassal: new Set(catalog.vassals.map(({ name }) => name)),
    'outside-unit': new Set(catalog.outsideUnits.map(({ id }) => id)),
  }
  const displaySelection = (value: unknown): MapSelection | null | undefined => {
    if (value === null) return null
    if (!value || typeof value !== 'object') return undefined
    const { kind, id } = value as Record<string, unknown>
    if (typeof kind !== 'string' || typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(ids, kind)) return undefined
    const displayId = kind === 'station' ? gameToDisplay.get(id) : ids[kind as MapSelectionKind].has(id) ? id : undefined
    return displayId ? { kind: kind as MapSelectionKind, id: displayId } : undefined
  }
  let active = true
  const unsubscribe = transport.subscribe((message) => {
    if (!active || !message || typeof message !== 'object') return
    const event = message as Record<string, unknown>
    if (event.type !== 'selected') return
    const selected = displaySelection(event.selection)
    if (selected !== undefined) onSelected(selected)
  })
  return {
    select(selection: MapSelection | null) {
      if (!active) return
      const selected = displaySelection(selection)
      if (selected === undefined || (selection?.kind === 'station' && !displayStations.has(selection.id))) return
      transport.send({ type: 'select', selection: selected })
    },
    dispose() {
      if (!active) return
      active = false
      unsubscribe()
    },
  }
}
