export function regionalLineGraph(source, bindings, seoulStations) {
  const byCode = new Map(bindings.bindings.map((entry) => [entry.stationCode, entry]))
  if (byCode.size !== bindings.bindings.length) throw new Error('E_REGIONAL_CODE_DUPLICATE')
  const seoulById = new Map(seoulStations.map((station) => [station.id, station]))
  const endpoint = (station) => {
    const seoulId = source.stationIdsByCode[station.code]
    if (seoulId) {
      const point = seoulById.get(seoulId)
      if (!point) throw new Error(`E_REGIONAL_SEOUL_ENDPOINT:${seoulId}`)
      return { id: seoulId, name: station.name, coordinateKind: 'seoul-map', x: point.x, y: point.y }
    }
    const point = byCode.get(station.code)
    return point ? { id: `official:${point.interchangeUid}`, name: station.name, coordinateKind: 'epsg5179', east: point.east, north: point.north } : null
  }
  const edges = new Map()
  const unresolved = []
  for (const line of source.lines) {
    const lineId = line.id === '1-GA-1' ? '1-GA' : line.id
    for (const path of line.paths) {
      for (let index = 1; index < path.length; index += 1) {
        const a = endpoint(path[index - 1])
        const b = endpoint(path[index])
        if (!a || !b) {
          unresolved.push({ lineId, codes: [path[index - 1].code, path[index].code] })
          continue
        }
        if (a.id === b.id) continue
        const key = `${lineId}/${[a.id, b.id].sort().join('~')}`
        if (!edges.has(key)) edges.set(key, { id: key, lineId, a, b })
      }
    }
  }
  return { edges: [...edges.values()], unresolved }
}
