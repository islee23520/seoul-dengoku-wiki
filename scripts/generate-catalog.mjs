import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { materializeWorldAtlas } from './materialize-world-atlas.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { buildWorldIndex } from './build-world-index.mjs'
import { categoryIndex, loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'
import { latestUpdates } from './update-history.mjs'
import { wikiPublicationManifest } from './publication-manifest.mjs'
import { localizedDocuments } from './localized-documents.mjs'
import { glossaryDocument } from './glossary-document.mjs'
import { validatedDensities } from './region-density.mjs'
import { approvedDocuments, publishedDocuments } from './catalog-admission.mjs'
import { buildTimelineYears, koText } from './timeline-overview.mjs'
import { articleFeedbackRecord, personFeedbackRecord, privateCatalog } from './feedback-source-catalog.mjs'
import { loadDataset, validate as validateRelations } from '../lore/relations/validate.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = projectRoot
const worldJsonRoot = resolve(projectRoot, 'src/generated/world')
const worldEnJsonRoot = resolve(projectRoot, 'src/generated/world-en')
const generatedRoot = resolve(projectRoot, 'src/generated')
const privateGeneratedRoot = resolve(projectRoot, 'src/generated-private')
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

const githubBlob = 'https://github.com/islee23520/seoul-dengoku/blob/main/'
const wikiBlob = 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/'

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
  if (path.includes('name-pools/')) return `${wikiBlob}lore/name-pools/${basename(path)}`
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

const outsideRoots = [process.env.SEOUL_KENSHI_ROOT, resolve(repoRoot, '..'), resolve(repoRoot, '../..')].filter(Boolean)
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
await rm(worldEnJsonRoot, { recursive: true, force: true })
await mkdir(worldEnJsonRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })
await rm(wikiAssetTarget, { recursive: true, force: true })

const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(repoRoot, 'lore'))
await materializeWorldAtlas({
  atlasPath: resolve(loreRoot, 'World-Narrative-Atlas.json'),
  outDir: loreRoot,
  check: true,
})
const jsonPages = await walkLoreJson(loreRoot)
const publishedRoutes = new Set(publishedDocuments(await approvedDocuments(loreRoot)).map(({ route }) => route))
const categoryErrors = jsonPages.flatMap((page) => registrationErrors(page.value, categoryRegistry, basename(page.path)))
if (categoryErrors.length) throw new Error(categoryErrors.join('\n'))
const categoriesBySlug = new Map(jsonPages.map((page) => [page.slug, registeredCategories(page.value, categoryRegistry)]))
const pagesBySlug = new Map(jsonPages.map((page) => [page.slug, page]))
const peopleSource = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/values-cast.json'), 'utf8')).people
const lineageByName = new Map(JSON.parse(await readFile(resolve(loreRoot, 'name-pools/cast-hangnyeol.json'), 'utf8')).people.map((person) => [person.name, person]))
const glossaryPath = resolve(loreRoot, 'glossary.json')
const glossaryPage = { path: glossaryPath, slug: 'Glossary', value: glossaryDocument(JSON.parse(await readFile(glossaryPath, 'utf8'))) }
const worldIndex = buildWorldIndex({ loreRoot, readFile: (path) => readFile(path, 'utf8') })

const renderedBySlug = new Map()
for (const page of jsonPages) {
  renderedBySlug.set(page.slug, renderLoreMarkdown(page.value, 'ko', (_domain, slug) => `${slug}.md`))
}
// The Glossary page is built in memory from the term dictionary; an authored Glossary page would be a second source.
if (pagesBySlug.has('Glossary')) throw new Error('E_GLOSSARY_JSON_UNEXPECTED')
pagesBySlug.set('Glossary', glossaryPage)
renderedBySlug.set('Glossary', renderLoreMarkdown(glossaryPage.value, 'ko', (_domain, slug) => `${slug}.md`))
renderedBySlug.set('index', worldIndex)

const projectionCategories = {
  Glossary: 'overview',
  index: 'overview',
}
for (const slug of renderedBySlug.keys()) {
  if (categoriesBySlug.has(slug)) continue
  const category = projectionCategories[slug]
  if (!category || !categoryRegistry.categories.some((entry) => entry.id === category)) throw new Error(`E_CATEGORY_PROJECTION:${slug}`)
  categoriesBySlug.set(slug, [category])
}

// The source decides the locales: a JSON authoring document publishes ko and en from one file,
// a Markdown-only corpus publishes its Korean body alone.
const documents = []
const englishDocuments = []
for (const domain of domains) {
  for (const slug of [...renderedBySlug.keys()].filter((slug) => publishedRoutes.has(`/world/${slug === 'index' ? '' : slug}`)).sort((left, right) => left.localeCompare(right))) {
    const page = pagesBySlug.get(slug)
    for (const document of localizedDocuments({
      domain,
      slug,
      json: page?.value,
      markdown: page ? undefined : renderedBySlug.get(slug),
      renderJson: (value, locale) => renderLoreMarkdown(value, locale, (_domain, target) => `${target}.md`),
      titleFallback: normalizeTitle,
    })) {
      const entry = { ...document, categories: categoriesBySlug.get(slug) ?? [], name: `${slug}.md` }
      if (document.locale === 'ko') documents.push(entry)
      else englishDocuments.push(entry)
    }
  }
}

const publicationManifest = await wikiPublicationManifest({ loreRoot, documents, registry: categoryRegistry })
const routeBySlug = new Map()
for (const document of documents) {
  routeBySlug.set(`${document.domain}:${document.slug}`, document.route)
  if (!routeBySlug.has(`any:${document.slug}`)) routeBySlug.set(`any:${document.slug}`, document.route)
}
// English pages link to the English route when the target has one, and to the Korean route otherwise.
const englishRouteBySlug = new Map(routeBySlug)
for (const document of englishDocuments) {
  englishRouteBySlug.set(`${document.domain}:${document.slug}`, document.route)
  englishRouteBySlug.set(`any:${document.slug}`, document.route)
}

const publishedBlocks = new Map()
const writeDocument = async (root, document, routes) => {
  const body = normalizeMarkdown(document.markdown, document.domain, routes)
  const blocks = fromMarkdown(body, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
  const removePositions = (node) => {
    delete node.position
    for (const child of node.children ?? []) removePositions(child)
  }
  for (const block of blocks) removePositions(block)
  publishedBlocks.set(`${document.locale}:${document.slug}`, blocks)
  await writeFile(resolve(root, `${document.slug}.json`), `${JSON.stringify({ slug: document.slug, title: document.title, route: document.route, reviewText: body, blocks })}
`)
}
for (const document of documents) await writeDocument(worldJsonRoot, document, routeBySlug)
for (const document of englishDocuments) await writeDocument(worldEnJsonRoot, document, englishRouteBySlug)

const feedbackRecords = [...documents, ...englishDocuments].flatMap((document) => {
  const envelope = pagesBySlug.get(document.slug)?.value
  return envelope && envelope.id !== 'DOC:Glossary' ? [articleFeedbackRecord({ envelope, route: document.route, locale: document.locale, blocks: publishedBlocks.get(`${document.locale}:${document.slug}`) })] : []
})

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
  'export const wikiEnglishCatalog = [',
  ...englishDocuments.map((document) => `  { domain: '${document.domain}', slug: '${document.slug}', route: '${document.route}', title: ${JSON.stringify(document.title)} },`),
  '] as const satisfies readonly WikiDocument[]',
  '',
  `export const wikiDocumentCount = ${documents.length}`,
  '',
]

await writeFile(resolve(generatedRoot, 'wikiCatalog.ts'), `${lines.join('\n')}\n`)
await writeFile(resolve(generatedRoot, 'publication-manifest.json'), `${JSON.stringify(publicationManifest, null, 2)}\n`)
const registeredIndex = categoryIndex(
  documents
    .map((document) => ({ slug: document.slug, route: document.route, title: document.title, categories: document.categories })),
  categoryRegistry,
)
await writeFile(resolve(generatedRoot, 'categoryIndex.ts'), `export type CategoryDocument = { readonly slug: string; readonly route: string; readonly title: string }
export type WikiCategory = { readonly id: string; readonly label: string; readonly summary: string; readonly documents: readonly CategoryDocument[] }

export const categoryIndex = ${JSON.stringify(registeredIndex, null, 2)} as const satisfies { readonly categories: readonly WikiCategory[]; readonly uncategorized: readonly CategoryDocument[] }
`)
await writeFile(resolve(publicRoot, 'wiki-contract.json'), `${JSON.stringify({
  documents: documents.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })),
  englishDocuments: englishDocuments.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })),
}, null, 2)}\n`)

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
  ruler: row.id === 'S04'
    ? (() => { const name = coreCharacters.match(/2126년 당회장 자리는 ([가-힣]{2,4})가 앉았다\./u)?.[1]; if (!name) throw new Error('E_S04_OPENING_RULER'); return name })()
    : row.government.match(/(?:^|[,，]\s*)회장 ([가-힣]{2,4})(?:$|[,，\s])/u)?.[1] ?? leaderForNames(coreCharacters, row.names),
  capital: row.capital,
  capitalName: row.capital,
}))
await writeFile(resolve(generatedRoot, 'stateCatalog.ts'), `export type StateRecord = { slug: string; id: string; name: string; origin: string; government: string; power: string; cause: string; ruler: string; capital: string; capitalName: string }\n\nexport const stateCatalog: readonly StateRecord[] = ${JSON.stringify(stateCatalog, null, 2)}\n`)

const genderSource = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/gender-cast.json'), 'utf8')).people
const genderByName = new Map(genderSource.map((person) => [person.name, person]))
const stateNameById = new Map(stateCatalog.map((state) => [state.slug.toUpperCase(), state.name]))
const regionAtlasSource = await readFile(process.env.WIKI_REGION_ATLAS_PATH ?? await resolveOutside('TOOL/tools/regions/data/atlas-data.js'), 'utf8')
const regionAtlas = JSON.parse(regionAtlasSource.replace(/^window\.SEOUL_REGION_ATLAS=/, '').replace(/;\s*$/, ''))
const populationSource = JSON.parse(await readFile(resolve(loreRoot, 'regions/sources/population-2026-08.json'), 'utf8'))
const densityByDong = validatedDensities(regionAtlas.regions, populationSource)
const seoulGraph = JSON.parse(await readFile(await resolveOutside('GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), 'utf8'))
const officialLineData = JSON.parse(await readFile(resolve(projectRoot, 'scripts/official-seoul-lines.json'), 'utf8'))
const sixteenStatesLore = JSON.parse(await readFile(resolve(loreRoot, 'factions/Sixteen-States.json'), 'utf8'))
const stateTable = sixteenStatesLore.content.find((block) => block.anchor === 'table')
if (!stateTable || stateTable.kind !== 'table' || stateTable.rows.length !== 16) throw new Error('E_STATE_DETAIL_TABLE')
const stateDetails = new Map(stateTable.rows.map((row) => [row[0].ko, {
  name: row[1].ko,
  founded: row[5].ko,
  vassals: row[6].ko,
  religion: row[7].ko,
  foreignRelations: row[8].ko,
}]))
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
const stationCatalog = JSON.parse(await readFile(resolve(loreRoot, 'places/Seoul-Station-Catalog.json'), 'utf8'))
const approvedStationAliases = stationCatalog.data.station_aliases
const canonicalBySourceId = new Map(approvedStationAliases.flatMap((entry) => [entry.id, ...entry.aliases].map((id) => [id, entry.id])))
if (approvedStationAliases.length !== 18 || canonicalBySourceId.size !== approvedStationAliases.reduce((count, entry) => count + 1 + entry.aliases.length, 0) || [...canonicalBySourceId.keys()].some((id) => !stationById.has(id))) throw new Error('E_STATION_ALIAS_SOURCE')
const canonicalStationId = (id) => canonicalBySourceId.get(id) ?? id
const stationIdByName = new Map(seoulGraph.stations.map((station) => [station.nameKo.replace(/역$/u, ''), station.id]))
const stationDegree = new Map(seoulGraph.stations.map((station) => [station.id, 0]))
for (const edge of seoulGraph.edges) {
  if (!stationById.has(edge.a) || !stationById.has(edge.b)) throw new Error(`E_SUBWAY_EDGE_STATION:${edge.a}:${edge.b}`)
  stationDegree.set(edge.a, (stationDegree.get(edge.a) ?? 0) + 1)
  stationDegree.set(edge.b, (stationDegree.get(edge.b) ?? 0) + 1)
}
for (const entry of approvedStationAliases) for (const alias of entry.aliases) stationIdByName.set(alias, entry.id)
const capitalStateByStationId = new Map([...capitalNameByState.entries()].map(([stateId, name]) => {
  const stationId = stationIdByName.get(name)
  if (!stationId) throw new Error(`E_CAPITAL_STATION_NOT_FOUND:${stateId}:${name}`)
  return [stationId, stateId]
}))
const capitalStationIds = new Set(capitalStateByStationId.keys())
const sourceMapStations = seoulGraph.stations.map((station) => {
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
const mapStations = sourceMapStations.filter((station) => canonicalStationId(station.id) === station.id).map((station) => {
  const identity = approvedStationAliases.find((entry) => entry.id === station.id)
  if (!identity) return station
  const memberIds = [identity.id, ...identity.aliases]
  const memberSurfaces = memberIds.map((id) => {
    const source = sourceMapStations.find((entry) => entry.id === id)
    const { source: controlSource, deltaId, status, primary, surfaceRegionId, surfaceRegionName, polityIds } = source.control
    return { id, source: controlSource, deltaId, status, primary, surfaceRegionId, surfaceRegionName, polityIds }
  })
  const holders = new Set(memberSurfaces.map((entry) => `${entry.status}:${entry.primary}:${[...entry.polityIds].sort().join(',')}`))
  const regions = new Set(memberSurfaces.map((entry) => entry.surfaceRegionId))
  return {
    ...station,
    memberIds,
    lineIds: [...new Set(sourceMapStations.filter((member) => memberIds.includes(member.id)).flatMap((member) => member.lineIds))],
    degree: new Set(seoulGraph.edges.filter((edge) => memberIds.includes(edge.a) || memberIds.includes(edge.b)).map((edge) => canonicalStationId(memberIds.includes(edge.a) ? edge.b : edge.a))).size,
    control: {
      ...station.control,
      memberSurfaces,
      // 명시적 점유 원장(ControlDelta)이 있으면 별칭 구성원의 지표 소유가 달라도 원장이 이긴다.
      ...(holders.size > 1 && station.control.source !== 'control-delta' ? { status: 'unknown', polityIds: [], polityNames: [], primary: null, hierarchy: { ...station.control.hierarchy, state: '미확인', regionalAuthority: null } } : {}),
      ...(regions.size > 1 ? { surfaceRegionId: null, surfaceRegionName: null, hierarchy: { ...station.control.hierarchy, ...(holders.size > 1 && station.control.source !== 'control-delta' ? { state: '미확인' } : {}), regionalAuthority: station.control.source === 'control-delta' ? station.control.hierarchy.regionalAuthority : null } } : {}),
    },
  }
})
const majorStationIds = mapStations.filter((station) => station.degree >= 7 || capitalStationIds.has(station.id)).map((station) => station.id).sort((left, right) => left.localeCompare(right, 'ko'))
const stationLines = new Map(sourceMapStations.map((station) => [station.id, station.lineIds]))
const stationControlById = new Map(mapStations.map((station) => [station.id, station.control]))
const segmentControlOverrides = new Map((stationControlLedger.segmentOverrides ?? []).map((entry) => [entry.segmentId, entry]))
if (segmentControlOverrides.size !== (stationControlLedger.segmentOverrides ?? []).length) throw new Error('E_SEGMENT_CONTROL_DUPLICATE')
const segmentControl = (segmentId, a, b) => {
  const delta = segmentControlOverrides.get(segmentId)
  if (delta) {
    if (!delta.polityIds?.length || !delta.polityIds.every((id) => stateNameById.has(id)) || (delta.primary !== null && !delta.polityIds.includes(delta.primary))) throw new Error(`E_SEGMENT_CONTROL_PRIMARY:${segmentId}`)
    return { source: 'control-delta', deltaId: delta.id, status: delta.status, polityIds: delta.polityIds, primary: delta.primary }
  }
  if (a.status === 'unknown' || b.status === 'unknown') return { source: 'derived-from-stations', deltaId: null, status: 'unknown', polityIds: [], primary: null }
  if ([...a.polityIds].sort().join('|') === [...b.polityIds].sort().join('|')) return { source: 'derived-from-stations', deltaId: null, status: a.status, polityIds: a.polityIds, primary: a.primary }
  return { source: 'derived-from-stations', deltaId: null, status: 'contested', polityIds: [...new Set([...a.polityIds, ...b.polityIds])].sort(), primary: null }
}
// 2126 통행(소유자 결정 2026-09-28): 양 끝 점유 세력이 같으면 통행, 다르면 검문 통행이다.
// 한강을 건너는 구간은 구간마다 소유자 결정을 받을 때까지 unknown으로 둔다. 강 북쪽·남쪽은 역의 자치구로 가른다.
const HAN_NORTH_DISTRICTS = new Set(['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구'])
const HAN_SOUTH_DISTRICTS = new Set(['강서구', '양천구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'])
const stationDistrictById = new Map(mapStations.map((station) => [station.id, station.district]))
const crossesHan = (a, b) => {
  const [da, db] = [stationDistrictById.get(a), stationDistrictById.get(b)]
  return (HAN_NORTH_DISTRICTS.has(da) && HAN_SOUTH_DISTRICTS.has(db)) || (HAN_SOUTH_DISTRICTS.has(da) && HAN_NORTH_DISTRICTS.has(db))
}
const passageDecisions = new Map((stationControlLedger.passageDecisions ?? []).map((entry) => [entry.segmentId, entry.passage2126]))
if (passageDecisions.size !== (stationControlLedger.passageDecisions ?? []).length) throw new Error('E_PASSAGE_DECISION_DUPLICATE')
for (const value of passageDecisions.values()) if (!['open', 'checkpoint', 'blocked'].includes(value)) throw new Error(`E_PASSAGE_DECISION_VALUE:${value}`)
const passage2126 = (edge, control) => {
  const id = `segment:${edge.a}~${edge.b}`
  if (crossesHan(edge.a, edge.b)) return passageDecisions.get(id) ?? 'unknown'
  return control.status === 'held' ? 'open' : control.status === 'contested' ? 'checkpoint' : 'unknown'
}
const projectedEdges = seoulGraph.edges.map((edge) => ({ a: canonicalStationId(edge.a), b: canonicalStationId(edge.b), lineIds: stationLines.get(edge.a).filter((id) => stationLines.get(edge.b).includes(id)) }))
const mapEdges = projectedEdges.filter((edge, index) => edge.a !== edge.b && projectedEdges.findIndex((other) => other.a === edge.a && other.b === edge.b && other.lineIds.join(',') === edge.lineIds.join(',')) === index).map((edge) => {
  const id = `segment:${edge.a}~${edge.b}`
  const control = segmentControl(id, stationControlById.get(edge.a), stationControlById.get(edge.b))
  return { ...edge, id, control, passage2126: passage2126(edge, control) }
})
for (const segmentId of segmentControlOverrides.keys()) if (!mapEdges.some((edge) => edge.id === segmentId)) throw new Error(`E_SEGMENT_CONTROL_UNKNOWN_SEGMENT:${segmentId}`)
for (const segmentId of passageDecisions.keys()) if (!mapEdges.some((edge) => edge.id === segmentId && crossesHan(edge.a, edge.b))) throw new Error(`E_PASSAGE_DECISION_NOT_HAN_CROSSING:${segmentId}`)
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
  const details = stateDetails.get(id)
  if (!details || details.name !== name) throw new Error(`E_STATE_DETAIL_IDENTITY:${id}`)
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
    founded: details.founded,
    vassals: details.vassals,
    religion: details.religion,
    foreignRelations: details.foreignRelations,
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
  populationAttribution: `${populationSource.source.publisher} ${populationSource.baseline} ${populationSource.source.statistic} (${populationSource.source.definition}); ${populationSource.ratio * 100}% 투영 · ${populationSource.boundary.effectiveDate} 행정동 경계 면적 · ${populationSource.source.url}`,
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
      areaM2: region.area_m2,
      density2126: densityByDong[region.id.replace(/^region:/u, '')],
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
const timelineYears = buildTimelineYears(centuryAnnalsDocument?.content ?? [], relatedTimelineDocuments)
const emptyYears = timelineYears.filter((entry) => entry.summary.length === 0).map((entry) => entry.year)
if (timelineYears.length === 0 || timelineYears[0]?.year !== 2026 || timelineYears.at(-1)?.year > 2126 || emptyYears.length > 0) {
  throw new Error(`E_TIMELINE_YEAR_COVERAGE:${timelineYears.length}:${timelineYears[0]?.year}:${timelineYears.at(-1)?.year}:${emptyYears.join(',')}`)
}
const stateEvents = new Map(territoryStates.map((state) => [state.name, []]))
let eventYear = null
for (const block of centuryAnnalsDocument.content) {
  if (block.kind === 'heading' && block.depth <= 3) {
    const year = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
    eventYear = Number.isInteger(year) ? year : null
  }
  if (eventYear === null || block.kind !== 'paragraph') continue
  const text = koText(block.text.ko)
  for (const state of territoryStates) {
    if (text.includes(state.name)) stateEvents.get(state.name).push({ year: eventYear, text, sourceRoute: `/world/Century-Annals#${eventYear}년` })
  }
}
for (const state of territoryStates) {
  state.chronology = stateEvents.get(state.name)
  if (state.chronology.length === 0) throw new Error(`E_STATE_CHRONOLOGY_EMPTY:${state.id}`)
}
await writeFile(resolve(publicRoot, 'opening-territories.json'), `${JSON.stringify(openingTerritories)}\n`)
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
    cards.push({ file: slug, body, primary: pagesBySlug.get(slug)?.value.data?.primary_detail_names?.includes(name) ?? false })
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
const courtDataset = loadDataset()
const courtErrors = validateRelations(courtDataset)
if (courtErrors.length) throw new Error(`E_COURT_RELATIONS:${courtErrors.join('; ')}`)
const issuedById = new Map(courtDataset.people.map((person) => [person.id, person]))
const issuedIdByName = new Map(courtDataset.people.map((person) => [person.name, person.id]))
const retainersById = new Map(courtDataset.config.directRetainers.map((row) => [row.personId, row]))
const courtMembersByOwner = new Map(courtDataset.config.courts.map((court) => [court.ownerPersonId,
  courtDataset.config.directRetainers.filter((row) => row.courtId === court.id)]))
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
const catalogByName = new Map(peopleCatalog.map((person) => [person.name, person]))
const graphPerson = (id) => {
  const issued = issuedById.get(id)
  const person = issued && catalogByName.get(issued.name)
  if (!person || person.name !== issued.name) throw new Error(`E_RETAINER_GRAPH_PERSON:${id}`)
  return { id, name: person.name, state: person.state, detailRoute: person.detailRoute }
}
const graphCourts = courtDataset.config.courts.filter((court) => court.stateId === 'S01')
const graphCourtIds = new Set(graphCourts.map((court) => court.id))
const graphRetainers = courtDataset.config.directRetainers.filter((row) => graphCourtIds.has(row.courtId))
const graphIds = new Set(graphCourts.map((court) => court.ownerPersonId))
for (const row of graphRetainers) {
  graphIds.add(row.personId)
  graphIds.add(row.liegePersonId)
}
const retainerGraph = {
  nodes: [...graphIds].map(graphPerson),
  edges: graphRetainers.map(({ personId, liegePersonId, courtId }) =>
    ({ fromPersonId: personId, toPersonId: liegePersonId, courtId })),
  courts: graphCourts.map(({ id, ownerPersonId, stateId }) => ({ id, ownerPersonId, stateId })),
}
await writeFile(resolve(generatedRoot, 'retainerGraph.ts'), `export const retainerGraph = ${JSON.stringify(retainerGraph, null, 2)} as const\n`)
for (const person of peopleCatalog) {
  const ledger = peopleSource.find((candidate) => candidate.name === person.name)
  const cards = personCards.get(person.name) ?? []
  const primary = primaryCard(ledger)
  const body = primary?.body ?? ''
  const sourceEnvelope = pagesBySlug.get(primary?.file)?.value
  if (!sourceEnvelope || !primary) throw new Error(`E_PERSON_FEEDBACK_SOURCE:${person.id}`)
  const lineage = lineageByName.get(person.name)
  const issuedId = issuedIdByName.get(person.name)
  if (!lineage) throw new Error(`E_PERSON_LINEAGE_MISSING:${person.name}`)
  const detail = {
    ...person,
    clan: lineage.clan ? { id: lineage.base_clan ?? lineage.clan, name: `${lineage.bongwan} ${lineage.surname}씨`, crest: `clan-crests/${lineage.base_clan ?? lineage.clan}.svg` } : null,
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
    ...(retainersById.has(issuedId) ? (() => {
      const row = retainersById.get(issuedId)
      return { directLiege: { personId: row.liegePersonId, name: issuedById.get(row.liegePersonId).name,
        courtId: row.courtId, effectiveYear: courtDataset.config.courtContract.effectiveYear } }
    })() : {}),
    ...(courtMembersByOwner.has(issuedId) ? {
      court: { id: `court:${issuedId}`,
        members: courtMembersByOwner.get(issuedId).map((row) =>
          ({ personId: row.personId, name: issuedById.get(row.personId).name })) },
    } : {}),
    relations: {
      outgoing: relations.filter((relation) => relation.from === person.name),
      incoming: relations.filter((relation) => relation.to === person.name),
    },
  }
  await writeFile(resolve(personDetailsRoot, `${person.id}.json`), `${JSON.stringify(detail, null, 2)}\n`)
  feedbackRecords.push(personFeedbackRecord({ envelope: sourceEnvelope, personId: person.id, route: person.detailRoute, headingText: primary.file === 'Core-Characters' ? person.name : `인물 ${primary.heading ?? person.name}`, locale: 'ko', sections: detail.sections }))
}
await mkdir(privateGeneratedRoot, { recursive: true })
await writeFile(resolve(privateGeneratedRoot, 'feedback-selectable-views.ko.json'), `${JSON.stringify(privateCatalog(feedbackRecords.filter((record) => record.locale === 'ko')))}\n`)
await writeFile(resolve(privateGeneratedRoot, 'feedback-selectable-views.en.json'), `${JSON.stringify(privateCatalog(feedbackRecords.filter((record) => record.locale === 'en')))}\n`)
await writeFile(resolve(generatedRoot, 'peopleCatalog.ts'), `export const peopleCatalog = ${JSON.stringify(peopleCatalog, null, 2)} as const\nexport const peopleCount = ${peopleCatalog.length}\n`)
// The home page reads only the count, so it gets its own module and does not bundle the catalog.
await writeFile(resolve(generatedRoot, 'peopleCount.ts'), `export const peopleCount = ${peopleCatalog.length}\n`)

const clanTablesText = await readFile(resolve(repoRoot, 'lore/name-pools/clan-hangnyeol-tables.json'), 'utf8')
const clanTables = JSON.parse(clanTablesText)
const crestIndexText = await readFile(resolve(publicRoot, 'clan-crests/index.json'), 'utf8')
const crestIndex = JSON.parse(crestIndexText)
const branchesByBase = new Map()
for (const branch of clanTables.clans.filter((entry) => entry.id.includes('-agreed-'))) {
  const base = branch.id.split('-agreed-')[0]
  const siblings = branchesByBase.get(base) ?? []
  siblings.push({ id: branch.id, name: branch.branch, status: '추론', members: [] })
  branchesByBase.set(base, siblings)
}

const clanFamilyCatalog = []
for (const clan of clanTables.clans) {
  if (clan.id.includes('-agreed-')) continue
  const crest = crestIndex.crests.find((entry) => entry.id === clan.id)
  const members = peopleCatalog
    .filter((person) => lineageByName.get(person.name)?.base_clan === clan.id || lineageByName.get(person.name)?.clan === clan.id)
    .map((person) => {
      const lineage = lineageByName.get(person.name)
      return {
        id: person.id,
        name: person.name,
        branchId: lineage?.base_clan ? lineage.clan : null,
        stateName: person.stateName,
        occupation: person.occupation,
        detailRoute: person.detailRoute,
      }
    })
  const branches = branchesByBase.get(clan.id) ?? []
  for (const branch of branches) branch.members = members.filter((person) => person.branchId === branch.id).map((person) => person.id)
  const family = {
    id: clan.id,
    surname: clan.surname,
    bongwan: clan.bongwan,
    hanja: clan.bongwan_hanja ?? null,
    branches,
    showBranches: clan.show_branches !== false,
    crest: crest ? { source: crest.source, motif: crest.motif } : null,
    members,
  }
  clanFamilyCatalog.push(family)
}

const clanFamilyCatalogOut = clanFamilyCatalog.sort((a, b) =>
  a.bongwan.localeCompare(b.bongwan, 'ko') || a.surname.localeCompare(b.surname, 'ko')
)
await writeFile(resolve(generatedRoot, 'clanFamilyCatalog.ts'), `export const clanFamilyCatalog = ${JSON.stringify(clanFamilyCatalogOut, null, 2)} as const\n`)

console.log(`
WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, worldJsonRoot)}`)
