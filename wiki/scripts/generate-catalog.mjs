import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { extractAtlasJson, sha256Text } from './world-atlas-parse.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'
import { verifyAtlasPeople } from './world-atlas-verify.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { buildWorldIndex } from './build-world-index.mjs'
import { categoryIndex, loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'
import { latestUpdates } from './update-history.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// This checkout is the wiki submodule (lore/ and wiki/ at its root), not WEB/ inside the parent repo.
const repoRoot = resolve(projectRoot, '..')
const worldJsonRoot = resolve(projectRoot, 'src/generated/world')
const generatedRoot = resolve(projectRoot, 'src/generated')
const publicRoot = resolve(projectRoot, 'public')
const domains = ['world']
const wikiAssetTarget = resolve(publicRoot, 'wiki-assets')

const normalizeTitle = (markdown, fallback) =>
  markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '').trim() ?? fallback

const publicStateName = (cell) => cell.replace(/\([^)]*\)/gu, '').trim()
const namingStates = JSON.parse(await readFile(resolve(repoRoot, 'lore/editorial/Naming-Ledger.json'), 'utf8')).states

const splitCells = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim())

const rowCell = (row, prefix) => Object.entries(row).find(([key]) => key === prefix || key.startsWith(prefix))?.[1] ?? ''

const tableRows = (markdown) => {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => line.startsWith('|') && !/^\|\s*---/.test(line))
  if (start < 0) return []
  const block = []
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) break
    if (!/^\|\s*---/.test(line)) block.push(line)
  }
  const header = /국명|ID/.test(block[0] ?? '') ? splitCells(block.shift()) : null
  return block.map((line) => {
    const cells = splitCells(line)
    return header
      ? Object.fromEntries(header.map((column, index) => [column, cells[index] ?? '']))
      : { '국명': cells[0] ?? '', '기원': cells[1] ?? '', '형태': cells[2] ?? '', '강국': cells[3] ?? '', '원인': cells[4] ?? '' }
  }).filter((row) => row['국명'] && row['국명'] !== '국명')
}

const parseStateRows = (markdown) => {
  const rows = tableRows(markdown).map((row) => {
    const idCell = row.ID ?? row['식별자'] ?? ''
    const id = idCell.match(/S(?:0[1-9]|1[0-6])/u)?.[0]
    const originCell = rowCell(row, '기원') || rowCell(row, '출신')
    const embedded = (originCell.match(/중심\s*([^|()]+?)역/u) ?? originCell.match(/([가-힣]{2,8})역/u) ?? [])[1] ?? ''
    const capital = (rowCell(row, '수도역') || rowCell(row, '중심역')).replace(/역$/u, '').trim() || embedded.trim()
    const rawName = row['국명']
    const origin = namingStates.find((state) => state.id === id)?.precursor
    return {
      id,
      name: publicStateName(rawName),
      names: [...new Set([
        publicStateName(rawName), origin,
        (originCell.split(/[.]/u)[0] ?? '').trim(),
      ].filter((candidate) => candidate.length >= 2))],
      origin,
      government: rowCell(row, '정부') || rowCell(row, '형태'),
      power: (rowCell(row, '등급') || rowCell(row, '강국')).split(',')[0].trim(),
      cause: rowCell(row, '주요 관계') || rowCell(row, '원인') || rowCell(row, '인과') || rowCell(row, '유래'),
      capital,
    }
  })
  if (rows.length !== 16 || rows.some((row) => !row.name || !row.id || !row.origin) || new Set(rows.map((row) => row.id)).size !== 16) throw new Error(`E_STATE_TABLE:${rows.length}`)
  if (rows.some((row) => !row.capital)) throw new Error(`E_STATE_CAPITAL:${rows.filter((row) => !row.capital).map((row) => row.name).join(',')}`)
  return rows
}

const leaderForNames = (markdown, names) => {
  if (!markdown) return ''
  const ranked = []
  for (const match of markdown.matchAll(/^## ([^\n]+)\n\n([\s\S]*?)(?=\n## |$)/gm)) {
    const intro = match[2].split('\n', 1)[0]
    const introHit = names.some((candidate) => candidate && (intro.startsWith(candidate) || intro.includes(`${candidate} `)))
    const bodyHit = names.some((candidate) => candidate && match[2].includes(candidate))
    if (introHit || bodyHit) ranked.push({ person: match[1].trim(), score: introHit ? 2 : 1 })
  }
  ranked.sort((left, right) => right.score - left.score)
  return ranked[0]?.person ?? ''
}

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
  if (path.includes('GDD/proposals/')) return `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/locales/ko-KR/proposals/${basename(path, '.md').toLowerCase()}.json`
  if (path.includes('CONTRIBUTING.md')) return `${githubBlob}CONTRIBUTING.md`
  return `${githubBlob}${path.replace(/^\.\.\//g, '')}`
}

const normalizeMarkdown = (markdown, domain, routeBySlug) => stripProjectionHeader(markdown
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^#\s+.+\n+/, '')
  .replace(/<InfoBox[\s\S]*?<\/InfoBox>/g, '')
  .replace(/<NavBox[\s\S]*?<\/NavBox>/g, ''))
  .replace(/\]\(([^)]+)\)/g, (_full, href) => `](${rewriteRelativeHref(href, domain, routeBySlug)})`)

const firstExisting = async (candidates) => {
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {}
  }
  throw new Error(`E_SOURCE_MISSING:${candidates.join('|')}`)
}

const outsideRoots = [resolve(repoRoot, '..'), resolve(repoRoot, '../..')]
const resolveOutside = (relativePath) => firstExisting([
  resolve(repoRoot, relativePath),
  ...outsideRoots.map((root) => resolve(root, relativePath)),
])

const loreJsonDocument = (value) => value && typeof value === 'object' && !Array.isArray(value) && typeof value.domain === 'string' && Array.isArray(value.content)

const walkLoreJson = async (dir, acc = []) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['name-pools', 'regions', 'editorial', 'sources'].includes(entry.name)) continue
      await walkLoreJson(path, acc)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name.startsWith('authoring.')) continue
    const value = JSON.parse(await readFile(path, 'utf8'))
    if (loreJsonDocument(value)) acc.push({ path, value, slug: basename(entry.name, '.json') })
  }
  return acc
}

const categoryRegistry = await loadCategoryRegistry(resolve(dirname(fileURLToPath(import.meta.url)), 'category-registry.json'))

await rm(resolve(projectRoot, 'src/content'), { recursive: true, force: true })
await rm(worldJsonRoot, { recursive: true, force: true })
await mkdir(worldJsonRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })
await rm(wikiAssetTarget, { recursive: true, force: true })

const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(repoRoot, 'lore'))
const jsonPages = await walkLoreJson(loreRoot)
const categoryErrors = jsonPages.flatMap((page) => registrationErrors(page.value, categoryRegistry, basename(page.path)))
if (categoryErrors.length) throw new Error(categoryErrors.join('\n'))
const categoriesBySlug = new Map(jsonPages.map((page) => [page.slug, registeredCategories(page.value, categoryRegistry)]))
const pagesBySlug = new Map(jsonPages.map((page) => [page.slug, page]))
const atlasMarkdown = await readFile(resolve(loreRoot, 'World-Narrative-Atlas.md'), 'utf8')
const atlas = extractAtlasJson(atlasMarkdown)
if (!atlas.ok) throw new Error(`E_ATLAS_JSON:${atlas.error}`)
const peopleSource = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/values-cast.json'), 'utf8')).people
const atlasPeople = verifyAtlasPeople(atlas.value, {
  registry: JSON.parse(await readFile(resolve(loreRoot, 'name-pools/person-id-registry.json'), 'utf8')),
  candidates: JSON.parse(await readFile(resolve(loreRoot, 'name-pools/person-id-candidates.json'), 'utf8')),
  people: peopleSource,
})
if (atlasPeople.failures.length) throw new Error(atlasPeople.failures.join('\n'))
const atlasHash = sha256Text(atlasMarkdown)
const projections = projectionsFromAtlas(atlas.value, atlasHash)
const glossaryMarkdown = await readFile(resolve(loreRoot, 'Glossary.md'), 'utf8')
const worldIndex = await buildWorldIndex({ loreRoot, readFile: (path) => readFile(path, 'utf8') })

const renderedBySlug = new Map()
for (const page of jsonPages) {
  renderedBySlug.set(page.slug, renderLoreMarkdown(page.value, 'ko', (_domain, slug) => `${slug}.md`))
}
for (const [name, markdown] of Object.entries(projections)) {
  const slug = basename(name, '.md')
  if (pagesBySlug.has(slug)) throw new Error(`E_PROJECTION_COLLIDES_WITH_JSON:${slug}`)
  renderedBySlug.set(slug, markdown)
}
if (pagesBySlug.has('Glossary')) throw new Error('E_GLOSSARY_JSON_UNEXPECTED')
renderedBySlug.set('Glossary', glossaryMarkdown)
// The atlas is the hand-authored canon (no JSON twin). Its machine registry is the canonical
// JSON inside the ```json fence; the page body is that canon with reader links rewritten below.
renderedBySlug.set('World-Narrative-Atlas', atlasMarkdown)
renderedBySlug.set('index', worldIndex)

const projectionCategories = {
  'Synthetic-Actors': 'people-and-machines',
  'Operating-Houses': 'factions',
  'Regional-Physical-AI-Arcs': 'overview',
  'World-Relation-Ledger': 'factions',
  'External-Theaters': 'places',
  'World-Expansion-Index': 'overview',
  'World-Narrative-Atlas': 'overview',
  Glossary: 'overview',
  index: 'overview',
}
for (const slug of renderedBySlug.keys()) {
  if (categoriesBySlug.has(slug)) continue
  const category = slug.startsWith('Hostile-Group-') || slug === 'Hostile-Ecology-Index'
    ? 'bestiary'
    : projectionCategories[slug]
  if (!category || !categoryRegistry.categories.some((entry) => entry.id === category)) throw new Error(`E_CATEGORY_PROJECTION:${slug}`)
  categoriesBySlug.set(slug, [category])
}

const documents = []
for (const domain of domains) {
  for (const slug of [...renderedBySlug.keys()].sort((left, right) => left.localeCompare(right))) {
    const markdown = renderedBySlug.get(slug)
    documents.push({
      domain,
      slug,
      route: `/${domain}/${slug === 'index' ? '' : slug}`,
      title: pagesBySlug.get(slug)?.value.locales?.ko?.title ?? normalizeTitle(markdown, slug),
      categories: categoriesBySlug.get(slug) ?? [],
      markdown,
      name: `${slug}.md`,
    })
  }
}

const routeBySlug = new Map()
for (const document of documents) {
  routeBySlug.set(`${document.domain}:${document.slug}`, document.route)
  if (!routeBySlug.has(`any:${document.slug}`)) routeBySlug.set(`any:${document.slug}`, document.route)
}

for (const document of documents) {
  const body = normalizeMarkdown(document.markdown, document.domain, routeBySlug)
  const blocks = fromMarkdown(body, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
  const removePositions = (node) => {
    delete node.position
    for (const child of node.children ?? []) removePositions(child)
  }
  for (const block of blocks) removePositions(block)
  await writeFile(resolve(worldJsonRoot, `${document.slug}.json`), `${JSON.stringify({ slug: document.slug, title: document.title, route: document.route, reviewText: body, blocks })}
`)
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
const registeredIndex = categoryIndex(
  documents
    .map((document) => ({ slug: document.slug, route: document.route, title: document.title, categories: document.categories })),
  categoryRegistry,
)
await writeFile(resolve(generatedRoot, 'categoryIndex.ts'), `export type CategoryDocument = { readonly slug: string; readonly route: string; readonly title: string }
export type WikiCategory = { readonly id: string; readonly label: string; readonly summary: string; readonly documents: readonly CategoryDocument[] }

export const categoryIndex = ${JSON.stringify(registeredIndex, null, 2)} as const satisfies { readonly categories: readonly WikiCategory[]; readonly uncategorized: readonly CategoryDocument[] }
`)
await writeFile(resolve(publicRoot, 'wiki-contract.json'), `${JSON.stringify({ documents: documents.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })) }, null, 2)}\n`)

const updateHistory = JSON.parse(await readFile(resolve(projectRoot, 'data/update-history.json'), 'utf8'))
const wikiUpdates = latestUpdates(updateHistory.updates)
await writeFile(resolve(generatedRoot, 'wikiUpdates.ts'), `export type WikiUpdate = { readonly date: string; readonly sequence: number; readonly title: string; readonly category: string; readonly status: string; readonly source: string; readonly route: string }\n\nexport const wikiUpdateHistory = ${JSON.stringify(updateHistory.updates, null, 2)} as const satisfies readonly WikiUpdate[]\n\nexport const wikiUpdates = ${JSON.stringify(wikiUpdates, null, 2)} as const satisfies readonly WikiUpdate[]\n`)

const stateSource = renderedBySlug.get('Sixteen-States')
const officesSource = renderedBySlug.get('Offices-and-Ranks')
if (!stateSource || !officesSource) throw new Error('E_STATE_OR_OFFICE_PAGE_MISSING')
if (!pagesBySlug.get('Sixteen-States')?.value.source?.refs?.includes('lore/factions/Sixteen-States.md')) throw new Error('E_STATE_CANON_PROVENANCE')
const officeTable = officesSource.match(/\| 국가 \| 티어1 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const stateRows = parseStateRows(stateSource)
const coreCharacters = renderedBySlug.get('Core-Characters')
const stateIdByName = new Map(stateRows.flatMap((row) => [[row.name, row.id], [row.origin, row.id]]))
const tiersByState = new Map([...officeTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .filter((match) => match[1].trim() !== '국가')
  .map((match) => [stateIdByName.get(match[1].trim()) ?? match[1].trim(), match.slice(2).map((cell) => cell.split('·').map((rank) => rank.trim()))]))
if (tiersByState.size !== 16) throw new Error(`E_OFFICE_TIER_COVERAGE:${tiersByState.size}`)
const stateCatalog = stateRows.map((row) => ({
  slug: row.id.toLowerCase(),
  id: row.id,
  name: row.name,
  origin: row.origin,
  government: row.government,
  power: row.power,
  cause: row.cause,
  ruler: row.government.match(/회장 (\S+)/u)?.[1] ?? leaderForNames(coreCharacters, row.names),
  capital: row.capital,
  capitalName: row.capital,
}))
await writeFile(resolve(generatedRoot, 'stateCatalog.ts'), `export type StateRecord = { slug: string; id: string; name: string; origin: string; government: string; power: string; cause: string; ruler: string; capital: string; capitalName: string }\n\nexport const stateCatalog: readonly StateRecord[] = ${JSON.stringify(stateCatalog, null, 2)}\n`)

const genderSource = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/gender-cast.json'), 'utf8')).people
const genderByName = new Map(genderSource.map((person) => [person.name, person]))
const stateNameById = new Map(stateCatalog.map((state) => [state.slug.toUpperCase(), state.name]))
const regionAtlasSource = await readFile(process.env.WIKI_REGION_ATLAS_PATH ?? await resolveOutside('TOOL/tools/regions/data/atlas-data.js'), 'utf8')
const regionAtlas = JSON.parse(regionAtlasSource.replace(/^window\.SEOUL_REGION_ATLAS=/, '').replace(/;\s*$/, ''))
const seoulGraph = JSON.parse(await readFile(await resolveOutside('GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), 'utf8'))
const officialLineData = JSON.parse(await readFile(resolve(projectRoot, 'scripts/official-seoul-lines.json'), 'utf8'))
const sixteenStatesLore = JSON.parse(await readFile(resolve(loreRoot, 'factions/Sixteen-States.json'), 'utf8'))
const relationTable = sixteenStatesLore.content.find((block) => block.anchor === 'table-gov-relations')
if (!relationTable || relationTable.kind !== 'table') throw new Error('E_GOV_RELATIONS_TABLE_MISSING')
const relationByStateName = new Map(relationTable.rows.map(([state, relation]) => {
  if (!['복속', '보좌', '독립'].includes(relation.ko)) throw new Error(`E_GOV_RELATION:${state.ko}:${relation.ko}`)
  return [state.ko, relation.ko]
}))
const stationControlLedger = JSON.parse(await readFile(resolve(loreRoot, 'places/station-control-overrides.json'), 'utf8'))
const stationControlOverrides = new Map(stationControlLedger.overrides.map((entry) => [entry.stationId, entry]))
if (stationControlOverrides.size !== stationControlLedger.overrides.length) throw new Error('E_STATION_CONTROL_DUPLICATE')
for (const entry of stationControlLedger.overrides) {
  if (!entry.polityIds?.length || !entry.polityIds.every((id) => stateNameById.has(id)) || !entry.polityIds.includes(entry.primary)) throw new Error(`E_STATION_CONTROL_PRIMARY:${entry.stationId}`)
  if (entry.status !== (entry.polityIds.length === 1 ? 'held' : 'contested')) throw new Error(`E_STATION_CONTROL_STATUS:${entry.stationId}`)
}
proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')

const regionContentById = new Map()
for (const entry of await readdir(resolve(loreRoot, 'regions/content'), { withFileTypes: true })) {
  if (!entry.isFile() || !/^\d{5}\.json$/u.test(entry.name)) continue
  const district = JSON.parse(await readFile(resolve(loreRoot, 'regions/content', entry.name), 'utf8'))
  for (const region of district.regions) regionContentById.set(region.region_id, region.content)
}
if (regionContentById.size !== 427) throw new Error(`E_REGION_CONTENT_COVERAGE:${regionContentById.size}`)
const surfaceHolders = (content) => content?.territory?.holders.map((holder) => holder.polity) ?? []
const creativeNameLedger = JSON.parse(await readFile(await resolveOutside('RESEARCH/verification/creative-name-normalization.json'), 'utf8'))
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
const regionalBoundaries = JSON.parse(await readFile(resolve(publicRoot, 'regional-boundaries.json'), 'utf8'))
const boundaryByCity = new Map(regionalBoundaries.map((entry) => [entry.city, entry]))
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
const capitalNameByState = new Map(stateRows.map((row) => [row.id, row.capital.replace(/역$/u, '')]))
if (capitalNameByState.size !== 16) throw new Error(`E_CAPITAL_CANON_COVERAGE:${capitalNameByState.size}`)
const stationById = new Map(seoulGraph.stations.map((station) => [station.id, station]))
const stationIdByName = new Map(seoulGraph.stations.map((station) => [station.nameKo.replace(/역$/u, ''), station.id]))
const stationDegree = new Map(seoulGraph.stations.map((station) => [station.id, 0]))
for (const edge of seoulGraph.edges) {
  if (!stationById.has(edge.a) || !stationById.has(edge.b)) throw new Error(`E_SUBWAY_EDGE_STATION:${edge.a}:${edge.b}`)
  stationDegree.set(edge.a, (stationDegree.get(edge.a) ?? 0) + 1)
  stationDegree.set(edge.b, (stationDegree.get(edge.b) ?? 0) + 1)
}
const capitalStateByStationId = new Map([...capitalNameByState.entries()].map(([stateId, name]) => {
  const stationId = stationIdByName.get(name)
  if (!stationId) throw new Error(`E_CAPITAL_STATION_NOT_FOUND:${stateId}:${name}`)
  return [stationId, stateId]
}))
const capitalStationIds = new Set(capitalStateByStationId.keys())
const mapStations = seoulGraph.stations.map((station) => {
  const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [station.lon, station.lat])
  const [x, y] = mapPoint([east, north])
  if (x < 0 || x > mapWidth || y < 0 || y > mapHeight) throw new Error(`E_STATION_MAP_BOUNDS:${station.id}:${x}:${y}`)
  const region = regionAtlas.regions.find((candidate) => pointInPolygon([x, y], simplifyRing(geometryRings(candidate.map_geometry)[0]).map(mapPoint)))
  const lineIds = officialLineData.stations[station.id] ?? []
  const content = region ? regionContentById.get(region.id) : null
  const baselinePolityIds = surfaceHolders(content)
  const delta = stationControlOverrides.get(station.id) ?? null
  const capitalStateId = capitalStateByStationId.get(station.id)
  const polityIds = delta?.polityIds ?? (capitalStateId ? [capitalStateId] : baselinePolityIds)
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
      status: delta?.status ?? (!region ? 'unknown' : polityIds.length === 0 ? 'vacant' : polityIds.length === 1 ? 'held' : 'contested'),
      polityIds,
      polityNames: polityIds.map((id) => stateNameById.get(id) ?? id),
      primary: delta?.primary ?? (polityIds.length === 1 ? polityIds[0] : null),
      surfaceRegionId: region?.id ?? null,
      surfaceRegionName: region?.name ?? null,
      hierarchy: {
        state: polityIds.map((id) => stateNameById.get(id) ?? id).join(' · ') || (region ? '무주지' : '미확인'),
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
  const state = stateCatalog.find((candidate) => candidate.slug === id.toLowerCase())
  if (!state) throw new Error(`E_TERRITORY_STATE_NOT_FOUND:${id}:${name}`)
  const candidates = regionAtlas.regions
    .filter((region) => surfaceHolders(region.content).length === 1 && surfaceHolders(region.content)[0] === id)
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
    relation: relationByStateName.get(name) ?? null,
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
const vassalsTableMatch = stateSource.match(/\| 속국 \| 본국 \|[\s\S]*?(?=\n\n|$)/)?.[0] ?? ''
const vassalsRows = [...vassalsTableMatch.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => match.slice(1).map((cell) => cell.trim()))
  .filter(([name]) => name !== '속국' && !name.startsWith('---'))

const anchorRules = {
  '경기도(고양)': '3호선 대화 방면',
  '제일수문(양평)': '경의중앙 지평 방면',
  '제이수문(춘천)': '경춘선',
  '제1분공방(천안·아산, 이씨)': '1호선 남단',
  '제2분공방(시흥)': '서해선 시흥 방면',
  '제1종착(인천)': '1호선 인천',
  '제2종착(파주)': '경의중앙 문산',
  '제1경비지구(하남)': '5호선 하남',
  '제2경비지구(남양주)': '경춘선 남양주 방면',
  '제3경비지구(의정부·연천)': '1호선 북단·7호선 장암',
  '태욱중공업 성남사업장': '신분당/8호선',
  '태욱중공업 수원사업장': '수인분당',
  '영종지점(영종)': '공항철도'
}
const vassalLineIds = {
  '경기도(고양)': '4-3', '제일수문(양평)': 'K', '제이수문(춘천)': 'G',
  '제1분공방(천안·아산, 이씨)': '2-1', '제2분공방(시흥)': 'SH',
  '제1종착(인천)': '2-1', '제2종착(파주)': 'K',
  '제1경비지구(하남)': '6-5', '제2경비지구(남양주)': 'G',
  '제3경비지구(의정부·연천)': '2-1', '태욱중공업 성남사업장': 'S',
  '태욱중공업 수원사업장': 'B', '영종지점(영종)': 'A',
}

const cityRules = {
  '경기도(고양)': '고양',
  '제일수문(양평)': '양평',
  '제이수문(춘천)': '춘천',
  '제1분공방(천안·아산, 이씨)': '천안·아산',
  '제2분공방(시흥)': '시흥',
  '제1종착(인천)': '인천',
  '제2종착(파주)': '파주',
  '제1경비지구(하남)': '하남',
  '제2경비지구(남양주)': '남양주',
  '제3경비지구(의정부·연천)': '의정부·연천',
  '태욱중공업 성남사업장': '성남',
  '태욱중공업 수원사업장': '수원',
  '영종지점(영종)': '영종'
}

const mapVassalName = (rawName) => {
  if (rawName === '제1분공방(천안·아산, 이씨)') return '제1분공방'
  const match = rawName.match(/^([^(]+)\(/)
  return match ? match[1] : rawName
}

const vassals = vassalsRows.map(([rawName, suzerainName, founded, duty]) => {
  const suzerainId = stateIdByName.get(suzerainName)
  if (!suzerainId) throw new Error(`E_VASSAL_SUZERAIN_NOT_FOUND:${suzerainName}`)
  const city = cityRules[rawName] || rawName
  const boundary = boundaryByCity.get(city)
  if (!boundary) throw new Error(`E_VASSAL_BOUNDARY:${city}`)
  const [x, y] = mapPoint(boundary.centroid)
  return {
    name: mapVassalName(rawName),
    city,
    suzerain: suzerainId,
    founded,
    duty,
    anchor: anchorRules[rawName],
    lineId: vassalLineIds[rawName],
    x, y,
    east: boundary.centroid[0], north: boundary.centroid[1],
    coordinateStatus: 'surveyed',
    coordinateSource: 'vuski/admdongkor ver20260701 (CC BY 4.0; KOSTAT SGIS)'
  }
})
if (vassals.length !== 13 || vassals.some((vassal) => !vassal.anchor || !officialLineData.lines[vassal.lineId])) throw new Error('E_VASSAL_LINE_ANCHOR')

const landmarkLedger = JSON.parse(await readFile(resolve(loreRoot, 'places/landmark-roles.json'), 'utf8'))
const projectedLandmarks = landmarkLedger.sites.map((site) => {
  const region = regionAtlas.regions.find((entry) => entry.id === site.regionId)
  if (!region || !stateNameById.has(site.holderId)) throw new Error(`E_LANDMARK_OWNER:${site.id}`)
  const regionControl = surfaceHolders(regionContentById.get(region.id))
  const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [site.lon, site.lat])
  const [x, y] = mapPoint([east, north])
  if (!pointInPolygon([x, y], simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint))) throw new Error(`E_LANDMARK_REGION:${site.id}`)
  if (site.connectionStationId && !mapStations.some((station) => station.id === site.connectionStationId)) throw new Error(`E_LANDMARK_STATION:${site.id}`)
  return { ...site, x, y, surfaceHolderId: regionControl[0], isEnclave: regionControl[0] !== site.holderId }
})
if (new Set(projectedLandmarks.map((site) => site.id)).size !== projectedLandmarks.length) throw new Error('E_LANDMARK_DUPLICATE')
const openingTerritories = {
  schema: 'seoul-opening-territories.v1',
  epoch: regionAtlas.fictional_epoch,
  width: mapWidth,
  height: mapHeight,
  projection: { crs: 'EPSG:5179', minEast: mapBounds.minX, maxEast: mapBounds.maxX, minNorth: mapBounds.minY, maxNorth: mapBounds.maxY },
  attribution: regionAtlas.attribution,
  states: territoryStates,
  vassals,
  landmarks: projectedLandmarks,
  landmarkAttribution: landmarkLedger.geometryAttribution,
  lines: officialLineData.lines,
  stations: mapStations,
  edges: mapEdges,
  majorStationIds,
  regions: regionAtlas.regions.map((region) => {
    const content = regionContentById.get(region.id)
    const polities = surfaceHolders(content)
    return {
      id: region.id,
      name: region.name,
      district: region.district_name,
      path: geometryPath(region.map_geometry),
      polities,
      status: content.territory?.status ?? (polities.length === 0 ? 'vacant' : polities.length === 1 ? 'held' : 'contested'),
      openingState: normalizePublicNames(content.opening_state),
      summary: normalizePublicNames(content.summary),
      stationCount: region.station_ids.length,
    }
  }),
}
await writeFile(resolve(publicRoot, 'opening-territories.json'), `${JSON.stringify(openingTerritories)}\n`)

const centuryAnnalsSource = renderedBySlug.get('Century-Annals')
if (!centuryAnnalsSource) throw new Error('E_CENTURY_ANNALS_MISSING')
const centuryAnnalsDocument = pagesBySlug.get('Century-Annals')?.value
const relatedTimelineDocuments = (text, hasTheaterChronicle = false) => {
  const related = [{ title: '서울전국 연표 2026–2126', route: '/world/Century-Annals' }]
  const add = (title, route) => { if (!related.some((entry) => entry.route === route)) related.push({ title, route }) }
  if (territoryStates.some((state) => text.includes(state.id) || text.includes(state.name)) || /열여섯|십육국|국호/u.test(text)) add('서울 십육국', '/world/Sixteen-States')
  if (/HC\d{2}|HP\d{2}|가문|총수|본관|항렬|법인 후계/u.test(text)) add('가문', '/world/Chaebol-Houses-and-Century-Factions')
  if (/교회|성당|불교|원불교|예배|신정|위령|신앙|종단|교구/u.test(text)) add('신앙과 문화의 분열', '/world/Faith-Culture-Schism')
  if (/휴머노이드|기술|무구|인가 서버|공장|제작|배터리|전지|도면|정비/u.test(text)) add('이 시대의 기술과 무구', '/world/Era-Arms-and-Tech-Level')
  if (hasTheaterChronicle || /XT0[1-5]|외부전구|임진|서해|대한해협|두만강|인천신탁|바깥/u.test(text)) add('바깥', '/world/External-Theaters')
  if (peopleSource.some((person) => text.includes(person.name))) add('등장인물 전체', '/people')
  return related
}
const koText = (leaf) => typeof leaf === 'string' ? leaf : leaf.map((run) => run.text).join('')
const firstSentence = (text) => text.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim() ?? text.trim()
// A year is a `### YYYY년` heading in the annals; its paragraphs run until the next year or era heading,
// so every entry links to an anchor that exists on the Century-Annals page.
const byYear = new Map()
const theaterChronicleYears = new Set()
let currentYear = null
for (const block of centuryAnnalsDocument?.content ?? []) {
  if (block.kind === 'heading' && currentYear !== null && /-xt0[1-5]-/u.test(block.anchor ?? '')) theaterChronicleYears.add(currentYear)
  if (block.kind === 'heading' && block.depth <= 3) {
    const year = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
    currentYear = Number.isInteger(year) ? year : null
    if (currentYear !== null) {
      if (byYear.has(currentYear)) throw new Error(`E_TIMELINE_DUPLICATE_YEAR:${currentYear}`)
      byYear.set(currentYear, [])
    }
    continue
  }
  if (currentYear !== null && block.kind === 'paragraph') byYear.get(currentYear).push(koText(block.text.ko))
}
const timelineYears = [...byYear.entries()].sort(([left], [right]) => left - right).map(([year, prose]) => {
  const summary = prose.slice(0, 2).join(' ')
  const pressure = firstSentence(prose[0] ?? '')
  const decision = firstSentence(prose[1] ?? prose[0] ?? '')
  const immediate = firstSentence(prose.at(-1) ?? '')
  const aftermath = immediate
  return {
    year,
    summary,
    pressure,
    decision,
    immediate,
    aftermath,
    sourceRoute: `/world/Century-Annals#${year}년`,
    relatedDocuments: relatedTimelineDocuments(prose.join('\n'), theaterChronicleYears.has(year)),
  }
})
const emptyYears = timelineYears.filter((entry) => entry.summary.length === 0).map((entry) => entry.year)
if (timelineYears.length === 0 || timelineYears[0]?.year !== 2026 || timelineYears.at(-1)?.year > 2126 || emptyYears.length > 0) {
  throw new Error(`E_TIMELINE_YEAR_COVERAGE:${timelineYears.length}:${timelineYears[0]?.year}:${timelineYears.at(-1)?.year}:${emptyYears.join(',')}`)
}
await writeFile(resolve(publicRoot, 'timeline-overview.json'), `${JSON.stringify({ schema: 'seoul-timeline-overview.v1', years: timelineYears, states: territoryStates }, null, 2)}\n`)

const personCards = new Map()
const addPersonCards = (text, file, pattern) => {
  const headings = [...text.matchAll(pattern)]
  for (let index = 0; index < headings.length; index += 1) {
    const name = headings[index][1].trim()
    if (name === '부록 — 가치관 숫자' || name === '인물 카드') continue
    const nextHeading = headings[index + 1]?.index ?? (file === 'Cast-Unaffiliated.md' ? text.indexOf('\n## ', headings[index].index + headings[index][0].length) : -1)
    const body = text.slice(headings[index].index + headings[index][0].length, nextHeading >= 0 ? nextHeading : text.length).trim()
    const cards = personCards.get(name) ?? []
    const slug = file.replace('.md', '')
    cards.push({ file: slug, body, primary: pagesBySlug.get(slug)?.value.primary_detail_names?.includes(name) ?? false })
    personCards.set(name, cards)
  }
}
for (let index = 1; index <= 16; index += 1) {
  const file = `Cast-State-${String(index).padStart(2, '0')}.md`
  const text = renderedBySlug.get(basename(file, '.md'))
  if (!text) throw new Error(`E_CAST_PAGE_MISSING:${file}`)
  addPersonCards(text, file, /^### 인물 (.+)$/gm)
}
for (const [file, pattern] of [['Core-Characters.md', /^## (?!인물 목록$)(.+)$/gm], ['Cast-Unaffiliated.md', /^### 인물 (.+)$/gm]]) {
  const text = renderedBySlug.get(basename(file, '.md'))
  if (!text) throw new Error(`E_CAST_PAGE_MISSING:${file}`)
  addPersonCards(text, file, pattern)
}
const corridorText = renderedBySlug.get('Diaspora-Corridors')
if (!corridorText) throw new Error('E_CORRIDOR_PAGE_MISSING')
const corridorNames = ['린샤오메이', '팜반득', '아미라 카심', '조엘 박', '나르기즈 유수포바', '최일석']
const corridorHeadings = [...corridorText.matchAll(/^### 인물 (.+)$/gm)]
for (const [index, heading] of corridorHeadings.entries()) {
  const name = corridorNames.find((candidate) => heading[1] === candidate || heading[1].startsWith(`${candidate} (`))
  if (!name) continue
  const end = corridorHeadings[index + 1]?.index ?? corridorText.length
  const body = corridorText.slice(heading.index + heading[0].length, end).trim()
  const cards = personCards.get(name) ?? []
  cards.push({ file: 'Diaspora-Corridors', body, heading: heading[1] })
  personCards.set(name, cards)
}
const relationText = renderedBySlug.get('Cast-Relations')
if (!relationText) throw new Error('E_CAST_RELATIONS_MISSING')
const relations = [...relationText.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => ({ from: match[1].trim(), type: match[2].trim(), to: match[3].trim(), basis: match[4].trim() }))
  .filter((relation) => relation.from !== '인물' && !relation.from.startsWith('---'))
const parseCardSections = (body) => {
  const sections = {}
  const matches = [...body.matchAll(/\*\*([^*]+?)\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*#{2,3}\s|\n\s*:::|$)/g)]
  for (const match of matches) sections[match[1].trim()] = match[2].trim()
  return sections
}
const parseCardFields = (body) => Object.fromEntries(
  [...body.matchAll(/^- ([^:\n]+):\s*(.+)$/gm)].map((match) => [match[1].trim(), match[2].trim()]),
)
const primaryCard = (person) => {
  const cards = personCards.get(person.name) ?? []
  const selected = cards.find((card) => card.primary)
  if (selected) return selected
  return [...cards].sort((left, right) => right.body.length - left.body.length)[0]
}
const personDetailsRoot = resolve(publicRoot, 'person-details')
await rm(personDetailsRoot, { recursive: true, force: true })
await mkdir(personDetailsRoot, { recursive: true })
const peopleCatalog = peopleSource.map((person, index) => {
  const cards = personCards.get(person.name) ?? []
  const primary = primaryCard(person)
  const fields = parseCardFields(primary?.body ?? '')
  const sections = parseCardSections(primary?.body ?? '')
  const source = primary?.file ?? 'Cast-Index'
  const heading = source === 'Core-Characters' ? person.name : `인물-${primary?.heading ?? person.name}`
  const anchor = source === 'Diaspora-Corridors'
    ? heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
    : heading
  const office = sections['관직'] ?? ''
  const position = fields['직함'] ?? fields['직위'] ?? office.match(/직함은 ([^.]+)\./u)?.[1]?.trim() ?? person.title
  const rank = fields['품계'] ?? office.match(/품계 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const occupation = fields['생업'] ?? cards.map((card) => parseCardFields(card.body)['생업']).find(Boolean) ?? office.match(/생업 별명은 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const stateTiers = tiersByState.get(person.state)
  const tierIndex = stateTiers?.findIndex((ranks) => ranks.includes(rank)) ?? -1
  const commonTier = person.state === 'S00' ? 'T5' : tierIndex >= 0 ? `T${tierIndex + 1}` : ''
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
    stateName: stateNameById.get(person.state) ?? person.state_name,
    sourceRoute: `/world/${source}#${anchor}`,
    detailRoute: `/people/person-${String(index + 1).padStart(4, '0')}`,
  }
})
for (const person of peopleCatalog) {
  const ledger = peopleSource.find((candidate) => candidate.name === person.name)
  const cards = personCards.get(person.name) ?? []
  const primary = primaryCard(ledger)
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
console.log(`WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, worldJsonRoot)}`)
