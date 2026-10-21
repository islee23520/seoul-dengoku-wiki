// This projection is deliberately a field allowlist: staging contains private
// evidence and historical rights which must never enter the browser payload.
export function publicGeographicId(id, kind) {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(id)) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n)
  return `geography:${kind}:${hash.toString(16).padStart(16, '0')}`
}

export const publicCountyName = name => name.replace(/선거구$/u, ' 백작령')

export function publicGeographicScope(scope) {
  return { ...scope, countyTitleIds: scope.countyTitleIds.map(id => publicGeographicId(id, 'county')) }
}

export function publicTerritorialScale(scale) {
  const { path, ...source } = scale.geographicSource
  return {
    ...scale, geographicSource: source,
    geographicParent: { ...scale.geographicParent,
      crossDistrictExceptions: scale.geographicParent.crossDistrictExceptions.map(row => ({ ...row, titleId: publicGeographicId(row.titleId, 'county') })),
    },
  }
}

export function publicGeographicSlot(slot) {
  const ordinary = /^region:11\d{8}$/u.test(slot.dongId)
  const dongId = ordinary ? slot.dongId : publicGeographicId(slot.dongId, 'historical-slot')
  if (!ordinary && dongId !== 'geography:historical-slot:39d9cf6109eae533') throw new Error('E_MAP_SCOPE')
  return {
    id: ordinary ? slot.slotId : publicGeographicId(slot.slotId, 'slot'),
    name: slot.name, dongId,
    fragmentId: slot.fragmentId ? publicGeographicId(slot.fragmentId, 'fragment') : null,
    status: slot.status, holderPersonId: slot.holderPersonId, geometryVerified: slot.geometryVerified,
  }
}

export function projectGeographicTitles(staging, boundaries, project) {
  const path = geometry => {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    return polygons.map(polygon => polygon.map(ring => ring.map(([x, y], index) => `${index ? 'L' : 'M'}${project(x, y).join(',')}`).join(' ') + ' Z').join(' ')).join(' ')
  }
  const geometryById = new Map(boundaries.features.map(feature => [feature.id, feature]))
  const counties = staging.titles.filter(title => title.rank === 'county')
  const publicIds = new Map(staging.titles.map(title => [title.titleId, title.rank === 'county' ? publicGeographicId(title.titleId, 'county') : title.titleId]))
  const titles = staging.titles.map(title => {
    const countyIds = title.rank === 'county' ? [title.titleId] : title.rank === 'kingdom' ? title.countyTitleIds
      : counties.filter(county => county.jurisdictionRefs.some(gu => title.jurisdictionRefs.includes(gu))).map(county => county.titleId)
    const paths = title.rank === 'duchy'
      ? boundaries.features.filter(feature => feature.properties.kind === 'dong' && title.jurisdictionRefs.includes(feature.properties.guId)).map(feature => path(feature.geometry))
      : countyIds.map(id => {
      const feature = geometryById.get(id)
      if (!feature || feature.properties.kind !== 'county') throw new Error(`E_MAP_COUNTY_GEOMETRY:${id}`)
      return path(feature.geometry)
    })
    return {
      id: publicIds.get(title.titleId), rank: title.rank, name: title.rank === 'county' ? publicCountyName(title.name) : title.name,
      parentId: publicIds.get(title.feudalParentTitleId) ?? null, countyIds: countyIds.map(id => publicIds.get(id)), path: paths.join(' '),
      holderPersonId: title.holderPersonId ?? null,
      datedSlots: (staging.countySlots.find(row => row.countyTitleId === title.titleId)?.slots ?? []).map(publicGeographicSlot),
      currentSlots: (staging.currentCorrespondenceSlots.find(row => row.countyTitleId === title.titleId)?.slots ?? []).map(publicGeographicSlot),
    }
  })
  return { spatialDate: staging.spatialSource.baseDate, currentDate: staging.editions.currentCorrespondence.administrativeCandidateDate, titles }
}

export function titlesAtRank(geography, rank) {
  if (!['county', 'duchy', 'kingdom', 'empire'].includes(rank)) throw new Error('E_MAP_GRANULARITY')
  return geography.titles.filter(title => title.rank === rank)
}

// A mixed county is not neutral territory. Missing evidence is distinct from both.
export function geographicPoliticalAffiliation(title, geography, regions) {
  const dongIds = new Set(title.countyIds.flatMap(id =>
    resolveGeographicTitle(geography, id)?.currentSlots.map(slot => slot.dongId) ?? []))
  const names = [...new Set(regions.filter(region => dongIds.has(region.id))
    .flatMap(region => region.currentHegemons.map(hegemon => hegemon.name)))].sort()
  return { kind: names.length === 0 ? 'unknown' : names.length > 1 ? 'mixed' : 'single', names }
}

export function validateGeographicMap(geography) {
  const ids = new Set(geography.titles.map(title => title.id))
  const counties = new Set(titlesAtRank(geography, 'county').map(title => title.id))
  if (ids.size !== geography.titles.length || ['county', 'duchy', 'kingdom', 'empire'].some((rank, index) => titlesAtRank(geography, rank).length !== [48, 25, 6, 1][index])
    || /선거구|constituency|electoral|election/iu.test(JSON.stringify(geography))) throw new Error('E_MAP_SCOPE')
  for (const title of geography.titles) {
    if (!['county', 'duchy', 'kingdom', 'empire'].includes(title.rank)) throw new Error('E_MAP_GRANULARITY')
    const validId = title.rank === 'empire' ? title.id === 'geography:empire:seoul'
      : title.rank === 'kingdom' ? /^geography:kingdom:seoul:0[1-6]$/u.test(title.id)
      : title.rank === 'duchy' ? /^geography:duchy:11\d{3}$/u.test(title.id)
      : /^geography:county:[0-9a-f]{16}$/u.test(title.id)
    if (!validId || (title.parentId && !ids.has(title.parentId))
      || title.countyIds.some(id => !counties.has(id))
      || [...title.datedSlots, ...title.currentSlots].some(slot => !/^region:11\d{8}$/u.test(slot.dongId) && slot.dongId !== 'geography:historical-slot:39d9cf6109eae533')) throw new Error('E_MAP_SCOPE')
  }
}

export function resolveGeographicTitle(geography, id) {
  return geography.titles.find(title => title.id === id) ?? null
}

export function resolveGeographicSelection(geography, requested) {
  const title = resolveGeographicTitle(geography, requested)
  if (title || !requested) return title
  const segments = requested.split('/')
  const selection = segments.at(-1)
  const district = segments.length > 1 ? segments.at(-2) : null
  const normalized = /^11\d{8}$/u.test(selection) ? `region:${selection}` : selection
  const counties = geography.titles.filter(entry => entry.rank === 'county' && (!district || (() => {
    const parent = resolveGeographicTitle(geography, entry.parentId)
    return parent?.name === district || parent?.id === `geography:duchy:${district}`
  })()))
  const idMatches = counties.flatMap(county => county.currentSlots.filter(slot => slot.dongId === normalized).map(() => county))
  if (idMatches.length) return idMatches.length === 1 ? idMatches[0] : null
  const nameMatches = counties.flatMap(county => county.currentSlots.filter(slot => slot.name === selection).map(() => county))
  return nameMatches.length === 1 ? nameMatches[0] : null
}

export function geographicTitleColor(id, rankIds) {
  if (rankIds) return `hsl(${Math.round(rankIds.indexOf(id) * 360 / rankIds.length)} 34% 48%)`
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.codePointAt(0)) | 0
  return `hsl(${((hash % 360) + 360) % 360} 34% 48%)`
}

export function projectPhysicalRail(subset, project) {
  if (subset.schema_version !== 'seoul-physical-rail.v1' || subset.projection !== 'EPSG:4326'
    || subset.boundary_sha256 !== '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4'
    || subset.osm_sha256 !== '70007aa979f8e362ca609fdc2d6302164c2f1379f11c8fc5fd39a7a2e79d3c17'
    || subset.station_binding_status !== 'missing-evidence' || subset.edges.length !== 0) throw new Error('E_MAP_PHYSICAL_RAIL_CONTRACT')
  return {
    projection: 'EPSG:5179', boundarySha256: subset.boundary_sha256, osmSha256: subset.osm_sha256,
    stationBindingStatus: subset.station_binding_status, passage2126: subset.passage2126,
    attribution: 'OpenStreetMap contributors · ODbL 1.0 · SGIS 2025-06-30 서울 시계 · 엄격한 내부 포함 검증 부분집합',
    paths: subset.paths.map(piece => ({
      id: piece.id, osmWay: piece.osm_way, mode: piece.mode,
      // OSM railway mode is not evidence of a numbered operating line.
      lineId: `osm:railway:${piece.mode}`,
      points: piece.points.map(([longitude, latitude]) => project(longitude, latitude)),
    })),
  }
}
