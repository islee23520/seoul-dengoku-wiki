import { readWorldGraphDocument } from './cast-sqlite/world-graph-document.mjs'

// Shared by the actual catalog worker and staged integration tests. Keep the
// native source document intact; display joins are still owned by the catalog.
export function catalogWorldGraph(mapInput, typedSource) {
  return mapInput === null ? typedSource(db => readWorldGraphDocument(db))
    : structuredClone(mapInput.graph)
}

export function catalogMovementGraph(mapInput, regularGraph, canonicalStationId, excludedStationIds) {
  if (mapInput === null) return regularGraph
  const excluded = new Set(excludedStationIds)
  const sourcePairs = new Set(mapInput.graph.edges.map(edge => JSON.stringify([canonicalStationId(edge.a), canonicalStationId(edge.b)].sort())))
  const metadata = new Map(regularGraph.edges.map(edge => [JSON.stringify([edge.a, edge.b].sort()), edge]))
  const edges = []
  for (const key of sourcePairs) {
    const [a, b] = JSON.parse(key)
    if (a === b || excluded.has(a) || excluded.has(b)) continue
    const row = metadata.get(key)
    if (!row) throw new Error(`E_MAP_GRAPH_LINE_METADATA:${a}:${b}`)
    edges.push({ ...row, a, b })
  }
  const linesByStation = new Map()
  for (const edge of edges) for (const id of [edge.a, edge.b]) {
    if (!linesByStation.has(id)) linesByStation.set(id, new Set())
    for (const line of edge.lineIds) linesByStation.get(id).add(line)
  }
  return { ...regularGraph, edges, linesByStation }
}

export function catalogPublicEdges(regularGraph, admittedStationIds, stationControlById, segmentControl, hegemons, affiliations, passage2126) {
  const projectedEdges = regularGraph.edges.filter(edge => admittedStationIds.has(edge.a) && admittedStationIds.has(edge.b))
    .map(edge => ({ a: edge.a, b: edge.b, lineIds: edge.lineIds, sourceCodes: edge.sourceCodes }))
  return projectedEdges.filter((edge, index) => edge.a !== edge.b && projectedEdges.findIndex(other =>
    other.a === edge.a && other.b === edge.b && other.lineIds.join(',') === edge.lineIds.join(',')) === index).map(edge => {
    const id = `segment:${edge.a}~${edge.b}`
    const control = segmentControl(id, stationControlById.get(edge.a), stationControlById.get(edge.b), edge)
    return { ...edge, id, control: { ...control, currentHegemons: hegemons(control.polityIds, affiliations) }, passage2126: passage2126(edge, control) }
  })
}

// Opening-day segments carry no dispute (owner decision #651). Segments whose
// endpoints differ go to the hub station (higher regular-line degree); equal
// degree falls back to the polity effectively holding more of the surface the
// segment passes under. An unresolved tie fails closed and needs a ledger entry.
export function resolveOpeningSegmentControl(segmentId, a, b, stationA, stationB, surfaceShare) {
  if (a?.status !== 'held' || b?.status !== 'held' || a.polityIds.length !== 1 || b.polityIds.length !== 1) throw new Error(`E_OPENING_SEGMENT_ENDPOINT:${segmentId}`)
  if (a.primary === b.primary) return { source: 'derived-from-stations', deltaId: null, status: 'held', polityIds: [a.primary], primary: a.primary, basis: 'same-holder' }
  let primary = stationA.degree > stationB.degree ? a.primary : stationB.degree > stationA.degree ? b.primary : null
  let basis = 'hub-station'
  if (!primary) {
    const [shareA, shareB] = [surfaceShare(stationA, stationB, a.primary), surfaceShare(stationA, stationB, b.primary)]
    primary = shareA > shareB ? a.primary : shareB > shareA ? b.primary : null
    basis = 'surface-majority'
  }
  if (!primary) throw new Error(`E_OPENING_SEGMENT_TIE:${segmentId}`)
  return { source: 'derived-from-stations', deltaId: null, status: 'held', polityIds: [primary], primary, basis }
}
