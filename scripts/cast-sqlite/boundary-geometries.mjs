const fields = {
  kind: 'kind', sourceEdition: 'source_edition', officialCode: 'official_code',
  officialName: 'official_name', dongId: 'dong_id', electoralDongId: 'electoral_dong_id',
  countyTitleId: 'county_title_id', guId: 'gu_id', name: 'name'
}

export function readBoundaryGeometries(db) {
  const source = db.prepare('SELECT * FROM boundary_geometry_source WHERE source_path=?')
    .get('data/geography/boundaries/seoul-sgis-20250630.geojson')
  if (!source)
    throw new Error('E_BOUNDARY_GEOMETRY_SOURCE')
  const propertyRows = db.prepare('SELECT * FROM boundary_geometry_property ORDER BY feature_id,ordinal').all()
  const dongRows = db.prepare('SELECT * FROM boundary_geometry_dong ORDER BY feature_id,ordinal').all()
  const guRows = db.prepare('SELECT * FROM boundary_geometry_gu ORDER BY feature_id,ordinal').all()
  const points = new Map()
  for (const row of db.prepare('SELECT * FROM boundary_geometry_point ORDER BY feature_id,polygon_ordinal,ring_ordinal,ordinal').iterate()) {
    const key = JSON.stringify([row.feature_id, row.polygon_ordinal, row.ring_ordinal])
    if (!points.has(key)) points.set(key, [])
    points.get(key).push([row.longitude, row.latitude])
  }
  const polygons = db.prepare('SELECT * FROM boundary_geometry_polygon ORDER BY feature_id,ordinal').all()
  const rings = db.prepare('SELECT * FROM boundary_geometry_ring ORDER BY feature_id,polygon_ordinal,ordinal').all()
  return {
    type: source.collection_type, features: db.prepare('SELECT * FROM boundary_geometry_feature ORDER BY ordinal').all().map(row => {
      const properties = Object.fromEntries(propertyRows.filter(property => property.feature_id === row.id).map(property => {
        const value = property.name === 'officialDongCodes' ? dongRows.filter(dong => dong.feature_id === row.id).map(dong => dong.code)
          : property.name === 'jurisdictionGuRefs' ? guRows.filter(gu => gu.feature_id === row.id).map(gu => gu.gu_ref)
            : row[fields[property.name]]
        return [property.name, value]
      }))
      const coordinates = polygons.filter(polygon => polygon.feature_id === row.id).map(polygon =>
        rings.filter(ring => ring.feature_id === row.id && ring.polygon_ordinal === polygon.ordinal)
          .map(ring => points.get(JSON.stringify([row.id, polygon.ordinal, ring.ordinal]))))
      return {
        type: row.feature_type, id: row.id, properties,
        geometry: { type: row.geometry_type, coordinates: row.geometry_type === 'Polygon' ? coordinates[0] : coordinates }
      }
    })
  }
}

/** Async PostgreSQL twin with the same source validation and geometry reconstruction. */
export async function readBoundaryGeometriesAsync(tx) {
  const source = await tx.get('SELECT * FROM wiki.boundary_geometry_source WHERE source_path=$1',
    ['data/geography/boundaries/seoul-sgis-20250630.geojson'])
  if (!source)
    throw new Error('E_BOUNDARY_GEOMETRY_SOURCE')
  const propertyRows = await tx.all('SELECT * FROM wiki.boundary_geometry_property ORDER BY feature_id,ordinal')
  const dongRows = await tx.all('SELECT * FROM wiki.boundary_geometry_dong ORDER BY feature_id,ordinal')
  const guRows = await tx.all('SELECT * FROM wiki.boundary_geometry_gu ORDER BY feature_id,ordinal')
  const points = new Map()
  for (const row of await tx.all('SELECT * FROM wiki.boundary_geometry_point ORDER BY feature_id,polygon_ordinal,ring_ordinal,ordinal')) {
    const key = JSON.stringify([row.feature_id, row.polygon_ordinal, row.ring_ordinal])
    if (!points.has(key)) points.set(key, [])
    points.get(key).push([row.longitude, row.latitude])
  }
  const polygons = await tx.all('SELECT * FROM wiki.boundary_geometry_polygon ORDER BY feature_id,ordinal')
  const rings = await tx.all('SELECT * FROM wiki.boundary_geometry_ring ORDER BY feature_id,polygon_ordinal,ordinal')
  return {
    type: source.collection_type, features: (await tx.all('SELECT * FROM wiki.boundary_geometry_feature ORDER BY ordinal')).map(row => {
      const properties = Object.fromEntries(propertyRows.filter(property => property.feature_id === row.id).map(property => {
        const value = property.name === 'officialDongCodes' ? dongRows.filter(dong => dong.feature_id === row.id).map(dong => dong.code)
          : property.name === 'jurisdictionGuRefs' ? guRows.filter(gu => gu.feature_id === row.id).map(gu => gu.gu_ref)
            : row[fields[property.name]]
        return [property.name, value]
      }))
      const coordinates = polygons.filter(polygon => polygon.feature_id === row.id).map(polygon =>
        rings.filter(ring => ring.feature_id === row.id && ring.polygon_ordinal === polygon.ordinal)
          .map(ring => points.get(JSON.stringify([row.id, polygon.ordinal, ring.ordinal]))))
      return {
        type: row.feature_type, id: row.id, properties,
        geometry: { type: row.geometry_type, coordinates: row.geometry_type === 'Polygon' ? coordinates[0] : coordinates }
      }
    })
  }
}
