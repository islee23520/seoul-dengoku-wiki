import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'
import { STATES } from '../../../TOOL/tools/wiki/world-atlas-schema.mjs'
import { latestUpdates } from './update-history.mjs'
import { assertAllowed } from './check-publisher.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(projectRoot, '../..')
const contentRoot = resolve(projectRoot, 'src/content')
const generatedRoot = resolve(projectRoot, 'src/generated')
const publicRoot = resolve(projectRoot, 'public')
const domains = ['world']
for (const domain of domains) assertAllowed(domain)
const wikiAssetTarget = resolve(publicRoot, 'wiki-assets')

const normalizeTitle = (markdown, fallback) =>
  markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '').trim() ?? fallback

const githubBlob = 'https://github.com/islee23520/seoul-kenshi/blob/main/'

const stripProjectionHeader = (markdown) => {
  const lines = markdown.split('\n')
  const cleaned = lines.filter((line, index) => index >= 12 || !(
    line === '이 페이지는 World-Narrative-Atlas의 읽기 전용 투영물입니다.' ||
    /^- 원본 앵커: `LORE\/World-Narrative-Atlas\.md`$/u.test(line) ||
    /^- 원본 해시: `[a-f0-9]+`$/u.test(line)
  ))
  return cleaned.join('\n').replace(/^- 출처층:\s*original-fiction\s*\n/gmu, '')
}

const rewriteRelativeHref = (href, domain, routeBySlug) => {
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return href

  const [path, hash = ''] = href.split('#', 2)
  const slug = basename(path, extname(path))
  const documentRoute = routeBySlug.get(`${domain}:${slug}`) ?? routeBySlug.get(`any:${slug}`)
  if (documentRoute) return `${documentRoute}${hash ? `#${hash}` : ''}`

  if (path.includes('regions/')) return '/world/World-and-Subway-Layers'
  if (path.includes('GAME-REFERENCE/ui-layout-moodboard')) return '/ui-layout-moodboard/'
  if (path.includes('GAME-REFERENCE/ui-ux-refs')) return '/ui-ux-refs/'
  if (path.includes('.omo/decisions/issue-101')) return '/ui-ux-refs/'
  if (path.includes('name-pools/')) return `${githubBlob}LORE/name-pools/${basename(path)}`
  if (path.includes('GDD/proposals/')) return `${githubBlob}GDD/proposals/${basename(path)}`
  if (path.includes('CONTRIBUTING.md')) return `${githubBlob}CONTRIBUTING.md`
  return `${githubBlob}${path.replace(/^\.\.\//g, '')}`
}

const normalizeMarkdown = (markdown, domain, routeBySlug) => stripProjectionHeader(markdown
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^#\s+.+\n+/, '')
  .replace(/<InfoBox[\s\S]*?<\/InfoBox>/g, '')
  .replace(/<NavBox[\s\S]*?<\/NavBox>/g, ''))
  .replace(/\]\(([^)]+)\)/g, (_full, href) => `](${rewriteRelativeHref(href, domain, routeBySlug)})`)

await rm(contentRoot, { recursive: true, force: true })
await mkdir(contentRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })
await rm(wikiAssetTarget, { recursive: true, force: true })

const documents = []
for (const domain of domains) {
  const sourceDir = resolve(repoRoot, 'WEB/wiki-source', domain)
  const names = (await readdir(sourceDir)).filter((name) => extname(name) === '.md').sort()
  for (const name of names) {
    const slug = basename(name, '.md')
    const markdown = await readFile(resolve(sourceDir, name), 'utf8')
    documents.push({
      domain,
      slug,
      route: `/${domain}/${slug === 'index' ? '' : slug}`,
      title: normalizeTitle(markdown, slug),
      markdown,
      name,
    })
  }
}

const routeBySlug = new Map()
for (const document of documents) {
  routeBySlug.set(`${document.domain}:${document.slug}`, document.route)
  if (!routeBySlug.has(`any:${document.slug}`)) routeBySlug.set(`any:${document.slug}`, document.route)
}

for (const document of documents) {
  const targetDir = resolve(contentRoot, document.domain)
  await mkdir(targetDir, { recursive: true })
  await writeFile(resolve(targetDir, document.name), normalizeMarkdown(document.markdown, document.domain, routeBySlug))
}

const lines = [
  'export type WikiDomain = \'world\'',
  '',
  'export type WikiDocument = {',
  '  readonly domain: WikiDomain',
  '  readonly slug: string',
  '  readonly route: string',
  '  readonly title: string',
  '}',
  '',
  'export const wikiCatalog = [',
  ...documents.map((document) => `  { domain: '${document.domain}', slug: '${document.slug}', route: '${document.route}', title: ${JSON.stringify(document.title)} },`),
  '] as const satisfies readonly WikiDocument[]',
  '',
  `export const wikiDocumentCount = ${documents.length}`,
  '',
]

await writeFile(resolve(generatedRoot, 'wikiCatalog.ts'), `${lines.join('\n')}\n`)
await writeFile(resolve(publicRoot, 'wiki-contract.json'), `${JSON.stringify({ documents: documents.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })) }, null, 2)}\n`)

const updateHistory = JSON.parse(await readFile(resolve(projectRoot, 'data/update-history.json'), 'utf8'))
const wikiUpdates = latestUpdates(updateHistory.updates)
await writeFile(resolve(generatedRoot, 'wikiUpdates.ts'), `export type WikiUpdate = { readonly date: string; readonly sequence: number; readonly title: string; readonly category: string; readonly status: string; readonly source: string; readonly route: string }\n\nexport const wikiUpdateHistory = ${JSON.stringify(updateHistory.updates, null, 2)} as const satisfies readonly WikiUpdate[]\n\nexport const wikiUpdates = ${JSON.stringify(wikiUpdates, null, 2)} as const satisfies readonly WikiUpdate[]\n`)

const stateSource = await readFile(resolve(repoRoot, 'LORE/factions/Sixteen-States.md'), 'utf8')
const officesSource = await readFile(resolve(repoRoot, 'LORE/offices/Offices-and-Ranks.md'), 'utf8')
const officeTable = officesSource.match(/\| 국가 \| 티어1 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const tiersByState = new Map([...officeTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => [match[1].trim(), match.slice(2).map((rank) => rank.trim())]))
const stateTable = stateSource.match(/\| 국명 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const stateRows = [...stateTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => match.slice(1).map((cell) => cell.trim()))
  .filter(([name]) => name !== '국명' && !name.startsWith('---'))
const rulerByState = new Map([
  ['대한민국정부', '윤서린'], ['여의도출자연합회', '최지우'], ['서초전산그룹', '이홍원'], ['양재기공주식회사', '정호준'],
  ['설교명부정', '오경재'], ['본당인준정', '남윤경'], ['승가구휼정', '백온'], ['교헌필사정', '오해린'],
  ['정동노동총연맹', '정유라'], ['급수계약정', '한재목'], ['규격동맹', '강민서'], ['선로후계정', '박태겸'],
  ['호위보호정', '배우진'], ['관문군정', '고서준'], ['중립호송시', '장세화'], ['의약중립맹', '류은비'],
])
const stateSlug = (index) => `s${String(index + 1).padStart(2, '0')}`
const stateCatalog = stateRows.map(([name, origin, government, power, cause], index) => ({
  slug: stateSlug(index), name, origin, government, power, cause, ruler: rulerByState.get(name) ?? '',
}))
await writeFile(resolve(generatedRoot, 'stateCatalog.ts'), `export const stateCatalog = ${JSON.stringify(stateCatalog, null, 2)} as const\n`)

const peopleSource = JSON.parse(await readFile(resolve(repoRoot, 'LORE/name-pools/values-cast.json'), 'utf8')).people
const genderSource = JSON.parse(await readFile(resolve(repoRoot, 'LORE/name-pools/gender-cast.json'), 'utf8')).people
const genderByName = new Map(genderSource.map((person) => [person.name, person]))
const stateNameById = new Map(peopleSource.filter((person) => /^S(?:0[1-9]|1[0-6])$/u.test(person.state)).map((person) => [person.state, person.state_name]))
const regionAtlasSource = await readFile(resolve(repoRoot, 'TOOL/tools/regions/data/atlas-data.js'), 'utf8')
const regionAtlas = JSON.parse(regionAtlasSource.replace(/^window\.SEOUL_REGION_ATLAS=/, '').replace(/;\s*$/, ''))
const seoulGraph = JSON.parse(await readFile(resolve(repoRoot, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), 'utf8'))
const officialLineData = JSON.parse(await readFile(resolve(repoRoot, 'WEB/wiki/scripts/official-seoul-lines.json'), 'utf8'))
const stationControlLedger = JSON.parse(await readFile(resolve(repoRoot, 'LORE/places/station-control-overrides.json'), 'utf8'))
const stationControlOverrides = new Map(stationControlLedger.overrides.map((entry) => [entry.stationId, entry]))
proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')

const regionContentById = new Map()
for (const entry of await readdir(resolve(repoRoot, 'LORE/regions/content'), { withFileTypes: true })) {
  if (!entry.isFile() || !/^\d{5}\.json$/u.test(entry.name)) continue
  const district = JSON.parse(await readFile(resolve(repoRoot, 'LORE/regions/content', entry.name), 'utf8'))
  for (const region of district.regions) regionContentById.set(region.region_id, region.content)
}
if (regionContentById.size !== 427) throw new Error(`E_REGION_CONTENT_COVERAGE:${regionContentById.size}`)
const creativeNameLedger = JSON.parse(await readFile(resolve(repoRoot, 'RESEARCH/verification/creative-name-normalization.json'), 'utf8'))
const normalizePublicNames = (text) => {
  let normalized = text
  for (const entry of [...creativeNameLedger.replacements].sort((left, right) => right.old.length - left.old.length)) {
    if (entry.old !== entry.new) normalized = normalized.split(entry.old).join(entry.new)
  }
  for (const entry of creativeNameLedger.pattern_replacements) normalized = normalized.replace(new RegExp(entry.pattern, 'gu'), entry.new)
  return normalized
}
const geometryRings = (geometry) => geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
const allMapPoints = regionAtlas.regions.flatMap((region) => geometryRings(region.map_geometry).flat())
const mapBounds = allMapPoints.reduce((bounds, [x, y]) => ({
  minX: Math.min(bounds.minX, x), maxX: Math.max(bounds.maxX, x),
  minY: Math.min(bounds.minY, y), maxY: Math.max(bounds.maxY, y),
}), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
const mapWidth = 1200
const mapHeight = Math.round(mapWidth * (mapBounds.maxY - mapBounds.minY) / (mapBounds.maxX - mapBounds.minX))
const simplifyRing = (ring) => {
  const step = Math.max(1, Math.floor(ring.length / 80))
  const selected = ring.filter((_, index) => index % step === 0)
  if (selected.at(-1) !== ring.at(-1)) selected.push(ring.at(-1))
  return selected
}
const mapPoint = ([x, y]) => [
  Number(((x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX) * mapWidth).toFixed(2)),
  Number(((mapBounds.maxY - y) / (mapBounds.maxY - mapBounds.minY) * mapHeight).toFixed(2)),
]
const geometryPath = (geometry) => geometryRings(geometry).map((ring) => {
  const points = simplifyRing(ring).map(mapPoint)
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z'
}).join(' ')
const pointInPolygon = ([x, y], points) => {
  let inside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [currentX, currentY] = points[index]
    const [previousX, previousY] = points[previous]
    if ((currentY > y) !== (previousY > y) && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) inside = !inside
  }
  return inside
}
const capitalSource = await readFile(resolve(repoRoot, 'LORE/factions/Sixteen-States.md'), 'utf8')
const stateIdByName = new Map(STATES.map((state) => [state.name, state.id]))
const capitalNameByState = new Map([...capitalSource.matchAll(/^\| ([^|]+) \| ([^|]*?중심\s+([^|()]+?)역(?:\([^|]*\))?[^|]*) \|/gm)]
  .map((match) => [stateIdByName.get(match[1].trim()), match[3].trim()])
  .filter(([stateId]) => stateId !== undefined))
if (capitalNameByState.size !== 16) throw new Error(`E_CAPITAL_CANON_COVERAGE:${capitalNameByState.size}`)
const stationById = new Map(seoulGraph.stations.map((station) => [station.id, station]))
const stationIdByName = new Map(seoulGraph.stations.map((station) => [station.nameKo.replace(/역$/u, ''), station.id]))
const stationDegree = new Map(seoulGraph.stations.map((station) => [station.id, 0]))
for (const edge of seoulGraph.edges) {
  if (!stationById.has(edge.a) || !stationById.has(edge.b)) throw new Error(`E_SUBWAY_EDGE_STATION:${edge.a}:${edge.b}`)
  stationDegree.set(edge.a, (stationDegree.get(edge.a) ?? 0) + 1)
  stationDegree.set(edge.b, (stationDegree.get(edge.b) ?? 0) + 1)
}
const capitalStationIds = new Set([...capitalNameByState.entries()].map(([stateId, name]) => {
  const stationId = stationIdByName.get(name)
  if (!stationId) throw new Error(`E_CAPITAL_STATION_NOT_FOUND:${stateId}:${name}`)
  return stationId
}))
const mapStations = seoulGraph.stations.map((station) => {
  const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [station.lon, station.lat])
  const [x, y] = mapPoint([east, north])
  if (x < 0 || x > mapWidth || y < 0 || y > mapHeight) throw new Error(`E_STATION_MAP_BOUNDS:${station.id}:${x}:${y}`)
  const region = regionAtlas.regions.find((candidate) => pointInPolygon([x, y], simplifyRing(geometryRings(candidate.map_geometry)[0]).map(mapPoint)))
  const lineIds = officialLineData.stations[station.id] ?? []
  const content = region ? regionContentById.get(region.id) : null
  const baselinePolityIds = content?.polity_contexts ?? []
  const delta = stationControlOverrides.get(station.id) ?? null
  const polityIds = delta?.polityIds ?? baselinePolityIds
  return {
    id: station.id,
    name: station.nameKo,
    district: station.district,
    x,
    y,
    degree: stationDegree.get(station.id) ?? 0,
    lineIds,
    control: {
      source: delta ? 'control-delta' : region ? 'derived-from-surface' : 'outside-surface-atlas',
      deltaId: delta?.id ?? null,
      status: delta?.status ?? (!region ? 'unknown' : polityIds.length === 1 ? 'held' : 'contested'),
      polityIds,
      polityNames: polityIds.map((id) => stateNameById.get(id) ?? id),
      surfaceRegionId: region?.id ?? null,
      surfaceRegionName: region?.name ?? null,
      hierarchy: {
        state: polityIds.map((id) => stateNameById.get(id) ?? id).join(' · ') || '미확인',
        regionalAuthority: delta?.regionalAuthority ?? (region ? `${region.district_name} 권역 책임자` : '서울 영토 원장 밖 · 미확인'),
        stationManager: delta?.stationManager ?? `${station.nameKo.replace(/역$/u, '')}역장`,
      },
    },
  }
})
const majorStationIds = mapStations.filter((station) => station.degree >= 7 || capitalStationIds.has(station.id)).map((station) => station.id).sort((left, right) => left.localeCompare(right, 'ko'))
const stationLines = new Map(mapStations.map((station) => [station.id, station.lineIds]))
const mapEdges = seoulGraph.edges.map((edge) => ({
  ...edge,
  lineIds: stationLines.get(edge.a).filter((lineId) => stationLines.get(edge.b).includes(lineId)),
}))
const polygonMetrics = (points) => {
  let twiceArea = 0
  let weightedX = 0
  let weightedY = 0
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    const cross = x1 * y2 - x2 * y1
    twiceArea += cross
    weightedX += (x1 + x2) * cross
    weightedY += (y1 + y2) * cross
  }
  const area = Math.abs(twiceArea) / 2
  if (area === 0) throw new Error('E_TERRITORY_ZERO_AREA')
  return {
    area,
    x: Number((weightedX / (3 * twiceArea)).toFixed(2)),
    y: Number((weightedY / (3 * twiceArea)).toFixed(2)),
  }
}
const territoryStates = [...stateNameById.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([id, name]) => {
  const state = stateCatalog.find((candidate) => candidate.name === name)
  if (!state) throw new Error(`E_TERRITORY_STATE_NOT_FOUND:${id}:${name}`)
  const candidates = regionAtlas.regions
    .filter((region) => region.content.polity_contexts.length === 1 && region.content.polity_contexts[0] === id)
    .map((region) => {
      const points = simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint)
      return { id: region.id, ...polygonMetrics(points) }
    })
    .sort((left, right) => right.area - left.area || left.id.localeCompare(right.id))
  const label = candidates[0]
  if (!label) throw new Error(`E_TERRITORY_LABEL_NOT_FOUND:${id}:${name}`)
  const capitalStationId = stationIdByName.get(capitalNameByState.get(id))
  const capital = mapStations.find((station) => station.id === capitalStationId)
  if (!capital) throw new Error(`E_CAPITAL_STATION_COORDINATE:${id}`)
  const capitalRegion = regionAtlas.regions.find((region) => pointInPolygon([capital.x, capital.y], simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint)))
  if (!capitalRegion) throw new Error(`E_CAPITAL_REGION_NOT_FOUND:${id}:${capitalStationId}`)
  return {
    id,
    name,
    slug: state.slug,
    origin: state.origin,
    government: state.government,
    power: state.power,
    ruler: state.ruler,
    cause: state.cause,
    labelX: label.x,
    labelY: label.y,
    capitalStationId,
    capitalRegionId: capitalRegion.id,
    capitalX: capital.x,
    capitalY: capital.y,
  }
})
const openingTerritories = {
  schema: 'seoul-opening-territories.v1',
  epoch: regionAtlas.fictional_epoch,
  width: mapWidth,
  height: mapHeight,
  attribution: regionAtlas.attribution,
  states: territoryStates,
  lines: officialLineData.lines,
  stations: mapStations,
  edges: mapEdges,
  majorStationIds,
  regions: regionAtlas.regions.map((region) => {
    const content = regionContentById.get(region.id)
    const polities = content.polity_contexts
    return {
      id: region.id,
      name: region.name,
      district: region.district_name,
      path: geometryPath(region.map_geometry),
      polities,
      status: polities.length === 1 ? 'held' : 'contested',
      openingState: normalizePublicNames(content.opening_state),
      summary: normalizePublicNames(content.summary),
      stationCount: region.station_ids.length,
    }
  }),
}
await writeFile(resolve(publicRoot, 'opening-territories.json'), `${JSON.stringify(openingTerritories)}\n`)

const centuryAnnalsSource = await readFile(resolve(repoRoot, 'LORE/chronology/Century-Annals.md'), 'utf8')
const timelineField = (body, field) => body.match(new RegExp(`^- ${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
  ?? body.match(new RegExp(`^\\| ${field} \\| (.+) \\|$`, 'm'))?.[1]?.trim()
  ?? ''
const firstSentence = (text) => text.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim() ?? text.trim()
const relatedTimelineDocuments = (text) => {
  const related = [{ title: '서울전국 백년실록', route: '/world/Century-Annals' }]
  const add = (title, route) => { if (!related.some((entry) => entry.route === route)) related.push({ title, route }) }
  if (territoryStates.some((state) => text.includes(state.id) || text.includes(state.name)) || /열여섯|십육국|국호/u.test(text)) add('서울 십육국', '/world/Sixteen-States')
  if (/HC\d{2}|HP\d{2}|가문|총수|본관|항렬|법인 후계/u.test(text)) add('가문', '/world/Chaebol-Houses-and-Century-Factions')
  if (/교회|성당|불교|원불교|예배|신정|위령|신앙|종단|교구/u.test(text)) add('신앙과 문화의 분열', '/world/Faith-Culture-Schism')
  if (/휴머노이드|기술|무구|인가 서버|공장|제작|배터리|전지|도면|정비/u.test(text)) add('이 시대의 기술과 무구', '/world/Era-Arms-and-Tech-Level')
  if (/XT0[1-5]|외부전구|임진|서해|대한해협|두만강|인천신탁|바깥/u.test(text)) add('바깥', '/world/External-Theaters')
  if (peopleSource.some((person) => text.includes(person.name))) add('등장인물 전체', '/people')
  return related
}
const yearHeadings = [...centuryAnnalsSource.matchAll(/^### (20\d{2}|21\d{2})년$/gm)]
const timelineYears = yearHeadings.map((heading, index) => {
  const year = Number(heading[1])
  const body = centuryAnnalsSource.slice(heading.index + heading[0].length, yearHeadings[index + 1]?.index ?? centuryAnnalsSource.length).trim()
  const prose = body.split(/\n(?=[-|])/u)[0].split(/\n\s*\n/u).map((paragraph) => paragraph.trim()).filter(Boolean)
  const summary = prose.slice(0, 2).join(' ')
  const pressure = timelineField(body, '압력') || firstSentence(prose[0] ?? '')
  const decision = timelineField(body, '결정') || firstSentence(prose[1] ?? prose[0] ?? '')
  const immediate = timelineField(body, '즉시') || firstSentence(prose.at(-1) ?? '')
  const aftermath = timelineField(body, '뒤') || immediate
  return {
    year,
    summary,
    pressure,
    decision,
    immediate,
    aftermath,
    sourceRoute: `/world/Century-Annals#${year}년`,
    relatedDocuments: relatedTimelineDocuments(`${body}\n${summary}`),
  }
})
if (timelineYears.length !== 101 || timelineYears[0]?.year !== 2026 || timelineYears.at(-1)?.year !== 2126) throw new Error(`E_TIMELINE_YEAR_COVERAGE:${timelineYears.length}`)
await writeFile(resolve(publicRoot, 'timeline-overview.json'), `${JSON.stringify({ schema: 'seoul-timeline-overview.v1', years: timelineYears, states: territoryStates }, null, 2)}\n`)

const personCards = new Map()
const addPersonCards = (text, file, pattern) => {
  const headings = [...text.matchAll(pattern)]
  for (let index = 0; index < headings.length; index += 1) {
    const name = headings[index][1].trim()
    if (name === '부록 — 가치관 숫자' || name === '인물 카드') continue
    const body = text.slice(headings[index].index + headings[index][0].length, headings[index + 1]?.index ?? text.length).trim()
    const cards = personCards.get(name) ?? []
    cards.push({ file: file.replace('.md', ''), body })
    personCards.set(name, cards)
  }
}
for (let index = 1; index <= 16; index += 1) {
  const file = `Cast-State-${String(index).padStart(2, '0')}.md`
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  addPersonCards(text, file, /^### 인물 (.+)$/gm)
}
for (const [file, pattern] of [['Core-Characters.md', /^## (?!인물 목록$)(.+)$/gm], ['Cast-Unaffiliated.md', /^### 인물 (.+)$/gm]]) {
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  addPersonCards(text, file, pattern)
}
const relationText = await readFile(resolve(repoRoot, 'LORE/characters/Cast-Relations.md'), 'utf8')
const relations = [...relationText.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => ({ from: match[1].trim(), type: match[2].trim(), to: match[3].trim(), basis: match[4].trim() }))
  .filter((relation) => relation.from !== '인물' && !relation.from.startsWith('---'))
const parseCardSections = (body) => {
  const sections = {}
  const matches = [...body.matchAll(/\*\*([^*]+?)\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*:::|$)/g)]
  for (const match of matches) sections[match[1].trim()] = match[2].trim()
  return sections
}
const parseCardFields = (body) => Object.fromEntries(
  [...body.matchAll(/^- ([^:\n]+):\s*(.+)$/gm)].map((match) => [match[1].trim(), match[2].trim()]),
)
const personDetailsRoot = resolve(publicRoot, 'person-details')
await rm(personDetailsRoot, { recursive: true, force: true })
await mkdir(personDetailsRoot, { recursive: true })
const peopleCatalog = peopleSource.map((person, index) => {
  const cards = personCards.get(person.name) ?? []
  const primary = [...cards].sort((left, right) => right.body.length - left.body.length)[0]
  const fields = parseCardFields(primary?.body ?? '')
  const sections = parseCardSections(primary?.body ?? '')
  const source = primary?.file ?? 'Cast-Index'
  const anchor = source === 'Core-Characters' ? person.name : `인물-${person.name}`
  const office = sections['관직'] ?? ''
  const position = fields['직함'] ?? fields['직위'] ?? office.match(/직함은 ([^.]+)\./u)?.[1]?.trim() ?? person.title
  const rank = fields['품계'] ?? office.match(/품계 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const occupation = fields['생업'] ?? office.match(/생업 별명은 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const stateTiers = tiersByState.get(person.state_name)
  const tierIndex = stateTiers?.indexOf(rank) ?? -1
  const commonTier = person.state === 'S00' ? 'T5' : tierIndex >= 0 ? `T${tierIndex + 1}` : (() => { throw new Error(`E_PERSON_TIER_MISSING:${person.name}:${person.state_name}:${rank}`) })()
  return {
    id: `person-${String(index + 1).padStart(4, '0')}`,
    name: person.name,
    title: person.title,
    position,
    rank,
    commonTier,
    occupation,
    gender: genderByName.get(person.name)?.gender ?? (() => { throw new Error(`E_PERSON_GENDER_MISSING:${person.name}`) })(),
    stage: person.stage,
    state: person.state,
    stateName: person.state_name,
    sourceRoute: `/world/${source}#${anchor}`,
    detailRoute: `/people/person-${String(index + 1).padStart(4, '0')}`,
  }
})
for (const person of peopleCatalog) {
  const ledger = peopleSource.find((candidate) => candidate.name === person.name)
  const cards = personCards.get(person.name) ?? []
  const primary = [...cards].sort((left, right) => right.body.length - left.body.length)[0]
  const body = primary?.body ?? ''
  const detail = {
    ...person,
    generation: ledger.generation,
    minors: ledger.minors,
    sourceKind: ledger.source,
    locked: ledger.locked,
    values: ledger.values,
    desire: ledger.desire,
    fields: parseCardFields(body),
    sections: parseCardSections(body),
    biography: body,
    sources: cards.map((card) => card.file),
    relations: {
      outgoing: relations.filter((relation) => relation.from === person.name),
      incoming: relations.filter((relation) => relation.to === person.name),
    },
  }
  await writeFile(resolve(personDetailsRoot, `${person.id}.json`), `${JSON.stringify(detail, null, 2)}\n`)
}
await writeFile(resolve(generatedRoot, 'peopleCatalog.ts'), `export const peopleCatalog = ${JSON.stringify(peopleCatalog, null, 2)} as const\nexport const peopleCount = ${peopleCatalog.length}\n`)
console.log(`WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, contentRoot)}`)
