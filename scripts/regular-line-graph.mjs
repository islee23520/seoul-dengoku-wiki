export function regularLineGraph(source, stationIds) {
  const allowed = new Set(stationIds)
  const linesByStation = new Map()
  const edges = new Map()
  const omitted = []
  for (const line of source.lines) {
    const lineId = line.id === '1-GA-1' ? '1-GA' : line.id
    for (const path of line.paths) {
      for (const station of path) {
        const id = source.stationIdsByCode[station.code]
        if (!id) continue
        if (!allowed.has(id)) throw new Error(`E_REGULAR_LINE_STATION:${station.code}:${id}`)
        if (!linesByStation.has(id)) linesByStation.set(id, new Set())
        linesByStation.get(id).add(lineId)
      }
      for (let index = 1; index < path.length; index += 1) {
        const previous = path[index - 1]
        const current = path[index]
        const a = source.stationIdsByCode[previous.code]
        const b = source.stationIdsByCode[current.code]
        if (!a || !b) {
          omitted.push({ lineId, codes: [previous.code, current.code], names: [previous.name, current.name] })
          continue
        }
        if (a === b) continue
        const endpoints = [a, b].sort()
        const key = endpoints.join('\0')
        if (!edges.has(key)) edges.set(key, { a: endpoints[0], b: endpoints[1], lineIds: [], sourceCodes: [] })
        const edge = edges.get(key)
        if (!edge.lineIds.includes(lineId)) edge.lineIds.push(lineId)
        edge.sourceCodes.push({ lineId, a: previous.code, b: current.code })
      }
    }
  }
  return { edges: [...edges.values()], linesByStation, omitted }
}
