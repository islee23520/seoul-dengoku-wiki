import { stationAliases } from './stationPresentation'

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
