// Retained, observed display geometry. Track existence does not prove an
// operating station connection or a current-world passage permission.
export function readPhysicalRail(db) {
  const metadata = db.prepare('SELECT * FROM physical_rail_metadata WHERE singleton=1').get()
  if (!metadata) throw new Error('E_PHYSICAL_RAIL_DATA')
  const points = new Map()
  for (const row of db.prepare('SELECT * FROM physical_rail_point ORDER BY path_id,ordinal').iterate()) {
    if (!points.has(row.path_id)) points.set(row.path_id, [])
    points.get(row.path_id).push([row.east, row.north])
  }
  return { projection: metadata.projection, boundarySha256: metadata.boundary_sha256,
    osmSha256: metadata.osm_sha256, stationBindingStatus: metadata.station_binding_status,
    passage2126: metadata.passage_2126, attribution: metadata.attribution,
    paths: db.prepare('SELECT * FROM physical_rail_path ORDER BY ordinal').all().map(row => ({
      id: row.id, osmWay: row.osm_way, mode: row.mode, lineId: row.line_id, points: points.get(row.id),
    })) }
}
