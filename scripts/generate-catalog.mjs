import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { materializeWorldAtlas } from './cast-sqlite/atlas-materializer.mjs'
import { atlasPeopleContext } from './atlas-people-context.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { publicHouseContent } from './public-house-content.mjs'
import { publicOfficeContent } from './public-office-content.mjs'
import { publicMapContent } from './public-map-content.mjs'
import { buildWorldIndex } from './build-world-index.mjs'
import { loadApprovedOrganizationAliases } from './approved-organization-aliases.mjs'
import { categoryEntities, categoryIndex, publishedRegistrationErrors, registeredCategories } from './category-registration.mjs'
import { latestUpdates } from './update-history.mjs'
import { wikiPublicationManifest } from './publication-manifest.mjs'
import { localizedDocuments } from './localized-documents.mjs'
import { glossaryDocument } from './glossary-document.mjs'
import { validatedDensities } from './region-density.mjs'
import { approvedDocuments, publishedDocuments } from './catalog-admission.mjs'
import { projectSeoulCurrentTimeline, koText } from './timeline-overview.mjs'
import { articleFeedbackRecord, privateCatalog } from './feedback-source-catalog.mjs'
import { regularLineGraph } from './regular-line-graph.mjs'
import { projectClanFamilyTree } from './cast-family-trees.mjs'
import { projectNonKoreanFamilies } from './non-korean-family-catalog.mjs'
import { hegemonsForHolders, currentBasePoint, territoryLabel } from './current-affiliation.mjs'
import { buildAdminTerritorialScale, buildAdminTerritorialScaleFromDb } from './admin-territorial-scale.mjs'
import { produceFromPersonDetailSources, projectPersonStateInputs, projectPersonHoldingsInputs } from './person-detail-inputs.mjs'
export { authenticateNonowningRights, projectCatalogOutsideOccupation, projectCatalogHoldings, loadApprovedRightsHistory, projectCatalogCurrentHoldings, currentOfficeAppointments } from './person-detail-inputs.mjs'
import { authenticateNonowningRights, projectCatalogOutsideOccupation, loadApprovedRightsHistory, currentOfficeAppointments } from './person-detail-inputs.mjs'
export { projectPersonHoldings } from './person-detail-production.mjs'
import { generatorStage } from './generate-release.mjs'
import { admitPublicPersonDetails } from './public-person-detail-admission.mjs'
import { manifestForPublicFiles, publishPublicAssets, verifiedLegacyManifest } from './seoul-public-assets.mjs'
import { projectGeographicTitles, publicGeographicScope, publicTerritorialScale } from '../src/components/geographicTitleMap.mjs'
import { isDeepStrictEqual } from 'node:util'
import { loadStationCatalogGeography, loadOutsideStationIds } from './station-catalog-geography.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readBoundaryGeometries } from './cast-sqlite/boundary-geometries.mjs'
import { readPhysicalRail } from './cast-sqlite/physical-rail.mjs'
import { readCatalogPages, readCatalogGlossary } from './cast-sqlite/catalog-pages.mjs'
import { databaseLoreReader, loadDatabasePersonProductionInputs, loadMigratedPersonInputs } from './cast-sqlite/person-detail-inputs.mjs'
import { loadCharacterProfiles } from './validate-character-profiles.mjs'
import { authenticatePersonalTierProvenance } from './personal-tier-provenance.mjs'
import { loadCiaFacilityProjection } from './cia-facility-projection-input.mjs'
import { projectCiaFacilityRegions, projectCiaFacilityHoldings, projectCiaFacilityPersonDetails } from './cia-facility-publication.mjs'
import { personFeedbackRecord } from './feedback-source-catalog.mjs'
import { readPublicCharacterProfileInputs } from './cast-sqlite/profile-inputs.mjs'
import { readPortraitDocuments } from './cast-sqlite/portrait-store.mjs'
import { readGeographyStore } from './cast-sqlite/geography-store.mjs'
import { readScopeCurrentSource } from './document-store/scope-current-source.mjs'
import { readPersonDisposition } from './cast-sqlite/person-disposition.mjs'
import { readRetirementProse, projectRetirementProse } from './cast-sqlite/retirement-prose.mjs'
import { projectActiveRoster, projectActivePersonIndex } from './person-roster-projection.mjs'
import { readCatalogMetadata, readCatalogMetadataAsync, CATEGORY_REGISTRY_PATH, OFFICIAL_SEOUL_LINES_PATH, UPDATE_HISTORY_PATH } from './cast-sqlite/catalog-metadata.mjs'
import { readPopulationDocument } from './cast-sqlite/population-document.mjs'
import { catalogWorldGraph, catalogMovementGraph, catalogPublicEdges } from './catalog-map-graph.mjs'
import { readRailSourceDocument, RAIL_SOURCE_PATHS } from './cast-sqlite/rail-source-documents.mjs'
import { readRegionContentDocument, REGION_CONTENT_PATHS } from './cast-sqlite/region-content-documents.mjs'
import { readCreativeNameDocument } from './cast-sqlite/creative-name-document.mjs'
import { readLandmarkRoleDocument } from './cast-sqlite/landmark-role-document.mjs'
import { readClanCatalogDocument } from './cast-sqlite/clan-catalog-document.mjs'
import { readRetiredTerritoryDocuments, RETIRED_TERRITORY_PATHS } from './cast-sqlite/retired-territory-documents.mjs'
import { readRegionAtlasData } from './cast-sqlite/region-atlas-document.mjs'
import { loadMapDataInput } from './map-data-input.mjs'

export const publicCatalogContent = (document, activeIds, activeRoutes) => projectActivePersonIndex(publicMapContent(publicOfficeContent(publicHouseContent(document))), activeIds, activeRoutes)

export function projectPoliticalCatalog(currentAffiliation) {
  return { hegemons: currentAffiliation.hegemons }
}

export function projectCatalogTimeline(centuryAnnalsDocument, relatedTimelineDocuments) {
  return projectSeoulCurrentTimeline(centuryAnnalsDocument.value.content, relatedTimelineDocuments)
}

export function relatedTimelineDocuments(text, territoryStates, peopleSource) {
  const related = [{ title: '서울전국 연표 2030–2126', route: '/world/Century-Annals' }]
  const add = (title, route) => { if (!related.some((entry) => entry.route === route)) related.push({ title, route }) }
  if (territoryStates.some((state) => text.includes(state.id) || text.includes(state.name)) || /열여섯|십육국|국호/u.test(text)) add('서울 십육국', '/world/Sixteen-States')
  if (/HC\d{2}|HP\d{2}|가문|총수|본관|항렬|법인 후계/u.test(text)) add('가문', '/world/Chaebol-Houses-and-Century-Factions')
  if (/교회|성당|불교|원불교|예배|신정|위령|신앙|종단|교구/u.test(text)) add('신앙과 문화의 분열', '/world/Faith-Culture-Schism')
  if (/휴머노이드|기술|무구|인가 서버|공장|제작|배터리|전지|도면|정비/u.test(text)) add('이 시대의 기술과 무구', '/world/Era-Arms-and-Tech-Level')
  if (peopleSource.some((person) => text.includes(person.name))) add('등장인물 전체', '/people')
  return related
}

export function stateTimelineEvents(content, timelineYears, territoryStates) {
  const stateEvents = new Map(territoryStates.map((state) => [state.name, []]))
  const currentEventIds = new Set(timelineYears.flatMap((entry) => entry.events.map((event) => event.id)))
  let eventYear = null
  for (const block of content) {
    if (block.kind === 'heading' && block.depth <= 3) {
      const year = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
      eventYear = Number.isInteger(year) ? year : null
    }
    if (eventYear === null || block.kind !== 'paragraph' || !currentEventIds.has(block.anchor)) continue
    const text = koText(block.text.ko)
    for (const state of territoryStates) {
      if (text.includes(state.name)) stateEvents.get(state.name).push({ year: eventYear, text, sourceRoute: `/world/Century-Annals#${eventYear}년` })
    }
  }
  return stateEvents
}


export async function writePublicPersonDetails(details, writeDetail) {
  admitPublicPersonDetails(details)
  for (const detail of details) await writeDetail(detail)
}

export function publicJurisdictionReferences(rows) {
  return rows.map(row => ({ ...row,
    ...(row.geographicScope ? { geographicScope: publicGeographicScope(row.geographicScope) } : {}),
    ...(row.jurisdiction?.countyTitleIds ? { jurisdiction: publicGeographicScope(row.jurisdiction) } : {}),
  }))
}


// Importing the real validators in tests must never run the publishing pipeline.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = projectRoot
const mapInput = process.env.WIKI_MAP_RELEASE_REQUEST === undefined ? null : await loadMapDataInput(process.env.WIKI_MAP_RELEASE_REQUEST)
// PostgreSQL mode must not load the private SQLite build environment: it is
// an SQLite-authority bootstrap input; a PG release reads no SQLite files.
if (!process.env.WIKI_DOCUMENT_DB && !process.env.WIKI_DOCUMENT_PG) {
  const environment = JSON.parse(await readFile(resolve(projectRoot,
    '.omo/private/seoul-migration/sqlite-authority-20261021/build-environment.json'), 'utf8'))
  for (const [key, value] of Object.entries(environment)) {
    if (!/^WIKI_[A-Z_]+$/u.test(key) || typeof value !== 'string') throw new Error('E_PUBLICATION_DATABASE_CONFIG')
    process.env[key] ??= value
  }
}
const typedCatalogSource = (read) => {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(projectRoot, 'data/canonical/wiki-cast.sqlite'))
  try { return read(db) } finally { db.close() }
}
// PostgreSQL release sourcing: metadata reads the release-exported snapshot
// (WIKI_GENERATION_SNAPSHOT) in one worker-owned read-only transaction.
// SQLite callers keep the original closure unchanged.
const catalogMetadata = process.env.WIKI_DOCUMENT_PG
  ? await (async () => {
      const { createReader } = await import('./cast-sqlite/db-pg.mjs')
      const reader = createReader({ connectionString: process.env.WIKI_DOCUMENT_PG, role: 'wiki_reader' })
      const importSnapshot = process.env.WIKI_GENERATION_SNAPSHOT
      try {
        return await reader.transaction(tx => readCatalogMetadataAsync(tx), {
          readOnly: true, ...(importSnapshot ? { importSnapshot } : {}),
        })
      } finally { await reader.close() }
    })()
  : (() => {
      const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(projectRoot, 'data/canonical/wiki-cast.sqlite'))
      try { return readCatalogMetadata(db) } finally { db.close() }
    })()
const sourceDatabaseBundle = process.env.WIKI_PUBLICATION_DATABASE_CONFIG
  ? await (await import('./document-store/publication-database-inputs.mjs')).openPublicationDatabaseInputs(projectRoot,
    JSON.parse(await readFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG, 'utf8'))) : null
const sourceRead = async (path, encoding) => {
  const target = path instanceof URL ? fileURLToPath(path) : path
  const bytes = sourceDatabaseBundle ? await sourceDatabaseBundle.inputs.readBytes(target) : await readFile(target)
  return encoding === 'utf8' ? Buffer.from(bytes).toString('utf8') : bytes
}
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(repoRoot, 'lore'))
let geography, territorialScale, geographicScale
{
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB)
  try {
    db.exec('BEGIN')
    geographicScale = buildAdminTerritorialScaleFromDb(db)
    geography = readGeographyStore(db)
    const offices = readScopeCurrentSource({ db, logicalPath: 'lore/offices/Offices-and-Ranks.json' })
    territorialScale = offices.data.territorialScale
    db.exec('COMMIT')
  } finally { db.close() }
}
const { root: outputRoot, writeFile } = await generatorStage(projectRoot)
const nonowningApprovalBytes = await sourceRead(new URL('./approved-daejeon-nonowning-rights.json', import.meta.url))
authenticateNonowningRights(nonowningApprovalBytes)
// Fail before touching generated output when either revision is unbound or invalid.
const worldJsonRoot = resolve(outputRoot, 'src/generated/world')
const worldEnJsonRoot = resolve(outputRoot, 'src/generated/world-en')
const generatedRoot = resolve(outputRoot, 'src/generated')
const privateGeneratedRoot = resolve(outputRoot, 'src/generated-private')
const publicRoot = resolve(outputRoot, 'public')
const publicAssetsManifestPath = resolve(privateGeneratedRoot, 'public-assets-manifest.json')
const previousPublicAssets = await readFile(publicAssetsManifestPath, 'utf8').then(JSON.parse, error => {
  if (error.code === 'ENOENT') return verifiedLegacyManifest(projectRoot)
  throw error
})
const domains = ['world']
const normalizeTitle = (markdown, fallback) =>
  markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '').trim() ?? fallback

const githubBlob = 'https://github.com/islee23520/seoul-dengoku/blob/main/'
const wikiBlob = 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/'

const stripProjectionHeader = (markdown) => {
  const lines = markdown.split('\n')
  const cleaned = lines.filter((line, index) => index >= 12 || !(
    line === '이 페이지는 World-Narrative-Atlas의 읽기 전용 투영물입니다.' ||
    /^- 원본 앵커: `LORE\/World-Narrative-Atlas\.md`$/u.test(line) ||
    /^- 원본 해시: `[a-f0-9]+`$/u.test(line)
  ))
  return cleaned.join('\n')
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
  .replace(/^#\s+.+\n+/m, '')
  .replace(/<InfoBox[\s\S]*?<\/InfoBox>/g, '')
  .replace(/<NavBox[\s\S]*?<\/NavBox>/g, ''))
  .replace(/\]\(([^)]+)\)/g, (_full, href) => `](${rewriteRelativeHref(href, domain, routeBySlug)})`)


const categoryRegistry = catalogMetadata[CATEGORY_REGISTRY_PATH]

await mkdir(worldJsonRoot, { recursive: true })
await mkdir(worldEnJsonRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })

const articleDatabasePath = process.env.WIKI_DOCUMENT_DB ?? resolve(projectRoot, 'data/canonical/wiki-cast.sqlite')
const atlasPeople = await atlasPeopleContext(loreRoot, { dbPath: articleDatabasePath })
await materializeWorldAtlas({
  atlasPath: resolve(loreRoot, 'World-Narrative-Atlas.json'),
  outDir: loreRoot,
  check: true,
  peopleContext: atlasPeople,
  dbPath: articleDatabasePath,
})
const jsonPages = typedCatalogSource(db => readCatalogPages(db)
  .map(page => ({ ...page, path: resolve(projectRoot, page.path) })))
const publishedRoutes = new Set(publishedDocuments(await approvedDocuments(loreRoot, { categoryRegistry, dbPath: articleDatabasePath })).map(({ route }) => route))
const categoryErrors = publishedRegistrationErrors(jsonPages.map((page) => ({ ...page, name: basename(page.path) })), publishedRoutes, categoryRegistry)
if (categoryErrors.length) throw new Error(categoryErrors.join('\n'))
const categoriesBySlug = new Map(jsonPages.map((page) => [page.slug, registeredCategories(page.value, categoryRegistry)]))
const pagesBySlug = new Map(jsonPages.map((page) => [page.slug, page]))
const glossaryPath = resolve(loreRoot, 'glossary.json')
const glossaryEntries = typedCatalogSource(db => readCatalogGlossary(db))
const glossaryPage = { path: glossaryPath, slug: 'Glossary', value: glossaryDocument(glossaryEntries) }
// Approved public nomenclature for a fictional organization grounds the same state leader.
const organizationAliases = await loadApprovedOrganizationAliases(projectRoot, sourceRead)
const worldIndex = buildWorldIndex({ loreRoot, organizationAliases, dbPath: articleDatabasePath })

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
const personSources = process.env.WIKI_DOCUMENT_DB ? await (async () => {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB)
  try {
    db.exec('BEGIN')
    const inputs = await loadDatabasePersonProductionInputs({ db, repoRoot,
      editorialProfileDb: process.env.WIKI_EDITORIAL_PROFILE_DB, soulAssignmentDb: process.env.WIKI_SOUL_ASSIGNMENT_DB })
    // These already-typed page Maps also contain the computed Glossary/index.
    inputs.pagesBySlug = pagesBySlug
    inputs.renderedBySlug = renderedBySlug
    db.exec('COMMIT')
    return inputs
  } finally { db.close() }
})() : await (async () => {
  const db = openReadOnly(articleDatabasePath)
  try {
    const inputs = await loadMigratedPersonInputs({ db, repoRoot })
    return { ...inputs, pagesBySlug, renderedBySlug,
      characterProfiles: await loadCharacterProfiles(repoRoot),
      personalTierPreservation: await authenticatePersonalTierProvenance(repoRoot, databaseLoreReader(db, repoRoot)),
      personFeedbackRecord }
  } finally { db.close() }
})()
const { peopleSource, lineageByName, issuedById, issuedIdByName,
  familyGraph, originalHoldings, officeAppointmentSource } = personSources

// The source decides the locales: a JSON authoring document publishes ko and en from one file,
// a Markdown-only corpus publishes its Korean body alone.
const documents = []
const englishDocuments = []
const rosterDatabasePath = process.env.WIKI_DOCUMENT_DB ?? resolve(projectRoot, 'data/canonical/wiki-cast.sqlite')
const activePersonIds = (() => {
  const db = openReadOnly(rosterDatabasePath)
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='person_disposition'").get()) return undefined
    return new Set([...readPersonDisposition(db)].filter(([, row]) => row.status === 'active').map(([id]) => id))
  } finally { db.close() }
})()
const activePersonRoutes = activePersonIds ? new Set([...activePersonIds]
  .map(id => atlasPeople.routes.get(id)?.detailRoute).filter(Boolean)) : undefined
const currentProseChanges = typedCatalogSource(db => db.prepare("SELECT 1 FROM sqlite_schema WHERE name='retirement_prose'").get()
  ? readRetirementProse(db) : [])
for (const domain of domains) {
  for (const slug of [...renderedBySlug.keys()].filter((slug) => publishedRoutes.has(`/world/${slug === 'index' ? '' : slug}`)).sort((left, right) => left.localeCompare(right))) {
    const page = pagesBySlug.get(slug)
    for (const document of localizedDocuments({
      domain,
      slug,
      json: page ? publicCatalogContent(projectRetirementProse(page.value, relative(projectRoot, page.path), currentProseChanges),
        activePersonIds, activePersonRoutes) : undefined,
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
  const original = pagesBySlug.get(document.slug)?.value
  const envelope = original ? publicCatalogContent(original) : original
  return envelope && envelope.id !== 'DOC:Glossary' ? [articleFeedbackRecord({ envelope, sourceEnvelope: original, route: document.route, locale: document.locale, blocks: publishedBlocks.get(`${document.locale}:${document.slug}`) })] : []
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
  categoryEntities(jsonPages.map((page) => ({ ...page, path: relative(repoRoot, page.path) })), documents),
)
await writeFile(resolve(generatedRoot, 'categoryIndex.ts'), `export type CategoryDocument = { readonly slug: string; readonly route: string; readonly title: string }
export type CategoryEntity = { readonly id: string; readonly title: string; readonly route: string; readonly source: string; readonly kind?: string; readonly description?: string; readonly descriptionRange?: { readonly start: number; readonly end: number; readonly unit: string }; readonly references?: readonly string[] }
export type WikiCategory = { readonly id: string; readonly label: string; readonly summary: string; readonly documents: readonly CategoryDocument[]; readonly children: readonly WikiCategory[]; readonly entities: readonly CategoryEntity[] }

export const categoryIndex = ${JSON.stringify(registeredIndex, null, 2)} as const satisfies { readonly categories: readonly WikiCategory[]; readonly uncategorized: readonly CategoryDocument[] }
`)
await writeFile(resolve(publicRoot, 'wiki-contract.json'), `${JSON.stringify({
  documents: documents.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })),
  englishDocuments: englishDocuments.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })),
}, null, 2)}\n`)

const updateHistory = catalogMetadata[UPDATE_HISTORY_PATH]
const wikiUpdates = latestUpdates(updateHistory.updates)
await writeFile(resolve(generatedRoot, 'wikiUpdates.ts'), `export type WikiUpdate = { readonly date: string; readonly sequence: number; readonly title: string; readonly category: string; readonly status: string; readonly source: string; readonly route: string }\n\nexport const wikiUpdateHistory = ${JSON.stringify(updateHistory.updates, null, 2)} as const satisfies readonly WikiUpdate[]\n\nexport const wikiUpdates = ${JSON.stringify(wikiUpdates, null, 2)} as const satisfies readonly WikiUpdate[]\n`)

const { stateSource, stateRows, stateCatalog, stateNameById, tiersByState, affiliations, stateIdByName } = projectPersonStateInputs(renderedBySlug, pagesBySlug, { organizationAliases })
await writeFile(resolve(generatedRoot, 'stateCatalog.ts'), `export type CurrentHegemon = { readonly kind: 'state'; readonly stateId: string; readonly name: string } | { readonly kind: 'union'; readonly name: string } | { readonly kind: 'neutral'; readonly name: string }\nexport type CurrentBase = { readonly kind: 'station'; readonly stationId: string; readonly name: string } | { readonly kind: 'facility'; readonly landmarkId: string; readonly name: string }\nexport type StateRecord = { currentHegemon: CurrentHegemon; currentBase: CurrentBase; currentExclusiveDistricts: 'none' | 'immediate-holdings'; slug: string; id: string; name: string; government: string; power: string; cause: string; ruler: string; capital: string; capitalName: string }\n\nexport const stateCatalog: readonly StateRecord[] = ${JSON.stringify(stateCatalog, null, 2)}\n`)

const regionAtlas = typedCatalogSource(db => readRegionAtlasData(db))
const populationSource = typedCatalogSource(db => readPopulationDocument(db))
const densityByDong = validatedDensities(regionAtlas.regions, populationSource)
const seoulGraph = catalogWorldGraph(mapInput, typedCatalogSource)
const officialLineData = catalogMetadata[OFFICIAL_SEOUL_LINES_PATH]
const regularLineSource = typedCatalogSource(db => readRailSourceDocument(db, { logicalPath: 'lore/places/regular-line-adjacency.json' }))
await writeFile(resolve(generatedRoot, 'railStationSources.ts'),
  '// Generated from typed SQLite domains by generate-catalog.mjs.\n'
  + 'export const railStationSource = ' + JSON.stringify(typedCatalogSource(db => readRailSourceDocument(db, {
    logicalPath: 'lore/places/rail-station-corrections.json',
  }))) + '\nexport const railStationIdentities = ' + JSON.stringify(typedCatalogSource(db => readRailSourceDocument(db, {
    logicalPath: 'lore/places/rail-station-identities.json',
  }))) + '\n')
const sixteenStatesLore = pagesBySlug.get('Sixteen-States').value
const stateTable = sixteenStatesLore.content.find((block) => block.anchor === 'table')
if (!stateTable || stateTable.kind !== 'table' || stateTable.rows.length !== 16) throw new Error('E_STATE_DETAIL_TABLE')
const stateDetails = new Map(stateTable.rows.map((row) => [row[0].ko, {
  name: row[1].ko,
  vassals: row[5].ko,
  religion: row[6].ko,
  foreignRelations: row[7].ko,
}]))
const relationTable = sixteenStatesLore.content.find((block) => block.anchor === 'table-gov-relations')
if (!relationTable || relationTable.kind !== 'table') throw new Error('E_GOV_RELATIONS_TABLE_MISSING')
const relationByStateName = new Map(relationTable.rows.map(([state, relation]) => {
  if (!['복속', '보좌', '독립'].includes(relation.ko)) throw new Error(`E_GOV_RELATION:${state.ko}:${relation.ko}`)
  return [state.ko, relation.ko]
}))
const stationControlLedger = typedCatalogSource(db => readRailSourceDocument(db, { logicalPath: 'lore/places/station-control-overrides.json' }))
const stationControlOverrides = new Map(stationControlLedger.overrides.map((entry) => [entry.stationId, entry]))
if (stationControlOverrides.size !== stationControlLedger.overrides.length) throw new Error('E_STATION_CONTROL_DUPLICATE')
for (const entry of stationControlLedger.overrides) {
  if (!entry.polityIds?.length || !entry.polityIds.every((id) => stateNameById.has(id)) || !entry.polityIds.includes(entry.primary)) throw new Error(`E_STATION_CONTROL_PRIMARY:${entry.stationId}`)
  if (entry.status !== (entry.polityIds.length === 1 ? 'held' : 'contested')) throw new Error(`E_STATION_CONTROL_STATUS:${entry.stationId}`)
}
proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')

const ciaFacilityProjection = await loadCiaFacilityProjection(repoRoot, sourceRead)
let regionContentById = new Map()
typedCatalogSource(db => {
    for (const logicalPath of REGION_CONTENT_PATHS) {
      const district = readRegionContentDocument(db, { logicalPath, predecessor: true })
      for (const region of district.regions) regionContentById.set(region.region_id, region.content)
    }
})
if (regionContentById.size !== 427) throw new Error(`E_REGION_CONTENT_COVERAGE:${regionContentById.size}`)
const predecessorRegionContentById = regionContentById
regionContentById = projectCiaFacilityRegions(regionContentById, ciaFacilityProjection.correction)
const surfaceHolders = (content) => content?.territory?.holders.map((holder) => holder.polity) ?? []
const creativeNameLedger = typedCatalogSource(db => readCreativeNameDocument(db))
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
const capitalNameByState = new Map(stateRows.map((row) => [row.id, row.capital.replace(/역$/u, '')]))
if (capitalNameByState.size !== 16) throw new Error(`E_CAPITAL_CANON_COVERAGE:${capitalNameByState.size}`)
const stationById = new Map(seoulGraph.stations.map((station) => [station.id, station]))
const stationCatalog = pagesBySlug.get('Seoul-Station-Catalog').value
let stationEvidenceBundle
if (process.env.WIKI_PUBLICATION_DATABASE_CONFIG) {
  const { openPublicationDatabaseInputs } = await import('./document-store/publication-database-inputs.mjs')
  stationEvidenceBundle = await openPublicationDatabaseInputs(projectRoot,
    JSON.parse(await readFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG, 'utf8')))
}
let excludedStationIds
try {
  await loadStationCatalogGeography(projectRoot, { catalog: stationCatalog,
    ...(stationEvidenceBundle ? { readBytes: stationEvidenceBundle.inputs.readBytes } : {}) })
  excludedStationIds = await loadOutsideStationIds(projectRoot, { stationAliases: stationCatalog.data.station_aliases,
    ...(stationEvidenceBundle ? { readBytes: stationEvidenceBundle.inputs.readBytes } : {}) })
} finally { stationEvidenceBundle?.close() }
const approvedStationAliases = stationCatalog.data.station_aliases
const canonicalBySourceId = new Map(approvedStationAliases.flatMap((entry) => [entry.id, ...entry.aliases].map((id) => [id, entry.id])))
if (canonicalBySourceId.size !== approvedStationAliases.reduce((count, entry) => count + 1 + entry.aliases.length, 0) || [...canonicalBySourceId.keys()].some((id) => !stationById.has(id))) throw new Error('E_STATION_ALIAS_SOURCE')
const canonicalStationId = (id) => canonicalBySourceId.get(id) ?? id
const excludedStations = new Set(excludedStationIds)
const regularGraph = catalogMovementGraph(mapInput, regularLineGraph(regularLineSource,
  seoulGraph.stations.map((station) => canonicalStationId(station.id)).filter(id => !excludedStations.has(id)),
  { excludedStationIds }), canonicalStationId, excludedStationIds)
await mkdir(resolve(outputRoot, '.omo/evidence/station-line-facts'), { recursive: true })
await writeFile(resolve(outputRoot, '.omo/evidence/station-line-facts/adjacency-coverage.json'), JSON.stringify({
  sourceUrl: regularLineSource.source.url,
  sourceSha256: regularLineSource.source.sha256,
  generatedEdges: regularGraph.edges.length,
  omittedAdjacentPairs: regularGraph.omitted,
  scope: '서울 graph의 명시적 공식 역 코드 대응만 포함한다. 제외된 외부 인접 구간을 건너뛰어 서울 역끼리 연결하지 않는다.',
}, null, 2))
const regularNeighbors = new Map()
for (const edge of regularGraph.edges) {
  for (const [id, neighbor] of [[edge.a, edge.b], [edge.b, edge.a]]) {
    if (!regularNeighbors.has(id)) regularNeighbors.set(id, new Set())
    regularNeighbors.get(id).add(neighbor)
  }
}
const stationIdByName = new Map(seoulGraph.stations.map((station) => [station.nameKo.replace(/역$/u, ''), station.id]))
for (const edge of seoulGraph.edges) {
  if (!stationById.has(edge.a) || !stationById.has(edge.b)) throw new Error(`E_SUBWAY_EDGE_STATION:${edge.a}:${edge.b}`)
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
  const lineIds = [...(regularGraph.linesByStation.get(canonicalStationId(station.id)) ?? [])]
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
    degree: regularNeighbors.get(canonicalStationId(station.id))?.size ?? 0,
    lineIds,
    surfacePolityIds: baselinePolityIds,
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
// The archived graph mislabeled Seoksu/Gwangmyeongsageori as Seoul districts;
// their coordinates are in Anyang/Gwangmyeong. Remove incident hops, never bridge.
const mapStations = sourceMapStations.filter((station) => canonicalStationId(station.id) === station.id
  && !['석수', '광명사거리'].includes(station.id)).map((station) => {
  const identity = approvedStationAliases.find((entry) => entry.id === station.id)
  if (!identity) return station
  const memberIds = [identity.id, ...identity.aliases]
  const memberSurfaces = memberIds.map((id) => {
    const source = sourceMapStations.find((entry) => entry.id === id)
    const { source: controlSource, deltaId, status, primary, surfaceRegionId, surfaceRegionName, polityIds } = source.control
    return { id, source: controlSource, deltaId, status, primary, surfaceRegionId, surfaceRegionName, polityIds, surfacePolityIds: source.surfacePolityIds }
  })
  const holders = new Set(memberSurfaces.map((entry) => `${entry.status}:${entry.primary}:${[...entry.polityIds].sort().join(',')}`))
  const regions = new Set(memberSurfaces.map((entry) => entry.surfaceRegionId))
  return {
    ...station,
    memberIds,
    lineIds: [...new Set(sourceMapStations.filter((member) => memberIds.includes(member.id)).flatMap((member) => member.lineIds))],
    degree: regularNeighbors.get(station.id)?.size ?? 0,
    control: {
      ...station.control,
      memberSurfaces,
      // 명시적 점유 원장(ControlDelta)이 있으면 별칭 구성원의 지표 소유가 달라도 원장이 이긴다.
      ...(holders.size > 1 && station.control.source !== 'control-delta' ? { status: 'unknown', polityIds: [], polityNames: [], primary: null, hierarchy: { ...station.control.hierarchy, state: '미확인', regionalAuthority: null } } : {}),
      ...(regions.size > 1 ? { surfaceRegionId: null, surfaceRegionName: null, hierarchy: { ...station.control.hierarchy, ...(holders.size > 1 && station.control.source !== 'control-delta' ? { state: '미확인' } : {}), regionalAuthority: station.control.source === 'control-delta' ? station.control.hierarchy.regionalAuthority : null } } : {}),
    },
  }
})
for (const station of mapStations) station.control.currentHegemons = hegemonsForHolders(station.control.polityIds, affiliations)
const majorStationIds = mapStations.filter((station) => station.degree >= 7 || capitalStationIds.has(station.id)).map((station) => station.id).sort((left, right) => left.localeCompare(right, 'ko'))
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
const admittedStationIds = new Set(mapStations.map(station => station.id))
const mapEdges = catalogPublicEdges(regularGraph, admittedStationIds, stationControlById, segmentControl, hegemonsForHolders, affiliations, passage2126)
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
const landmarkLedger = typedCatalogSource(db => readLandmarkRoleDocument(db))
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
const territoryStates = [...stateNameById.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([id, name]) => {
  const state = stateCatalog.find((candidate) => candidate.slug === id.toLowerCase())
  if (!state) throw new Error(`E_TERRITORY_STATE_NOT_FOUND:${id}:${name}`)
  const details = stateDetails.get(id)
  if (!details || details.name !== state.name) throw new Error(`E_STATE_DETAIL_IDENTITY:${id}`)
  const currentBase = currentBasePoint(state.currentBase, mapStations, projectedLandmarks)
  const candidates = regionAtlas.regions
    .filter((region) => state.currentExclusiveDistricts !== 'none' && surfaceHolders(regionContentById.get(region.id)).length === 1 && surfaceHolders(regionContentById.get(region.id))[0] === id)
    .map((region) => {
      const points = simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint)
      return { id: region.id, ...polygonMetrics(points) }
    })
    .sort((left, right) => right.area - left.area || left.id.localeCompare(right.id))
  const label = territoryLabel(candidates, currentBase)
  const capitalStationId = stationIdByName.get(capitalNameByState.get(id))
  const capital = mapStations.find((station) => station.id === capitalStationId)
  if (!capital) throw new Error(`E_CAPITAL_STATION_COORDINATE:${id}`)
  const capitalRegion = regionAtlas.regions.find((region) => pointInPolygon([capital.x, capital.y], simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint)))
  if (!capitalRegion) throw new Error(`E_CAPITAL_REGION_NOT_FOUND:${id}:${capitalStationId}`)
  return {
    id,
    name,
    slug: state.slug,
    currentHegemon: state.currentHegemon,
    currentBase,
    currentExclusiveDistrictCount: candidates.length,
    government: state.government,
    power: state.power,
    relation: relationByStateName.get(state.name) ?? null,
    ruler: state.ruler,
    cause: state.cause,
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
// Outside vassals no longer exist in the current world (owner decision 2026-10-15,
// .omo/evidence/seoul-lock/owner-all-vassals-inside-seoul-20261015.md). Vassalage is
// projected through approved Seoul title holdings, so the map carries no outside markers.
const vassals = []

const openingTerritories = {
  physicalRail: typedCatalogSource(db => readPhysicalRail(db)),
  geography: projectGeographicTitles(
    geography,
    typedCatalogSource(db => readBoundaryGeometries(db)),
    (longitude, latitude) => {
      const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [longitude, latitude])
      return [(east - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX) * mapWidth,
        (mapBounds.maxY - north) / (mapBounds.maxY - mapBounds.minY) * mapHeight]
    },
  ),
  hegemons: pagesBySlug.get('Sixteen-States').value.data.currentAffiliation.hegemons,
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
      currentHegemons: content.territory.authority ? [content.territory.authority] : hegemonsForHolders(polities, affiliations),
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
// Preserve observed underground geometry while projecting its index bindings
// onto the admitted Seoul-only hop set. Never bridge a removed outside hop.
const underground = JSON.parse(await readFile(resolve(publicRoot, 'underground-detail.json'), 'utf8'))
const previousTerritories = JSON.parse(await readFile(resolve(projectRoot, 'public/opening-territories.json'), 'utf8'))
const edgeIndex = new Map(mapEdges.map((edge, index) => [edge.id, index]))
underground.stations = Object.fromEntries(Object.entries(underground.stations).filter(([id]) => admittedStationIds.has(id)))
underground.paths = underground.paths.flatMap(path => {
  const oldEdge = previousTerritories.edges[path.edge]
  const index = oldEdge && edgeIndex.get(oldEdge.id)
  return index === undefined ? [] : [{ ...path, edge: index }]
})
await writeFile(resolve(publicRoot, 'underground-detail.json'), `${JSON.stringify(underground)}\n`)

const historicalRightsBytes = typedCatalogSource(db => Object.fromEntries(Object.entries({
  approval: 'scripts/approved-seoul-rights-transition.json',
  existing: 'scripts/historical-inputs/personal-holdings.json',
  allocation: 'scripts/historical-inputs/opening-feudal-allocation.json',
  control: 'scripts/historical-inputs/outside-control-2126.json',
  islands: 'scripts/historical-inputs/outside-island-occupation.json',
  geometry: 'scripts/historical-inputs/outside-admin-units.json',
  scale: 'scripts/historical-inputs/admin-territorial-scale.json',
  nonowning: 'scripts/approved-daejeon-nonowning-rights.json',
  retirement: 'scripts/approved-outside-current-retirement.json',
}).map(([key, path]) => {
  const row = db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(path)
  if (!row) throw new Error(`E_CATALOG_RIGHTS_SOURCE:${path}`)
  return [key, Buffer.from(row.raw_bytes)]
})))
const outsideGeometry = (await loadApprovedRightsHistory(historicalRightsBytes)).historical.outside
const outsideControl = typedCatalogSource(db => readRetiredTerritoryDocuments(db, { logicalPath: 'lore/regions/outside-control-2126.json' }))
const outsideIslands = typedCatalogSource(db => readRetiredTerritoryDocuments(db, { logicalPath: 'lore/regions/outside-island-occupation.json' }))
const projectedOutsideControl = await projectCatalogOutsideOccupation(outsideControl, outsideGeometry, outsideIslands,
  { approval: historicalRightsBytes.retirement, control: historicalRightsBytes.control, islands: historicalRightsBytes.islands })

const centuryAnnalsSource = renderedBySlug.get('Century-Annals')
if (!centuryAnnalsSource) throw new Error('E_CENTURY_ANNALS_MISSING')
const centuryAnnalsDocument = pagesBySlug.get('Century-Annals')?.value
const timelineYears = projectCatalogTimeline(pagesBySlug.get('Century-Annals'),
  (text) => relatedTimelineDocuments(text, territoryStates, peopleSource))
const emptyYears = timelineYears.filter((entry) => entry.summary.length === 0).map((entry) => entry.year)
if (timelineYears.length === 0 || timelineYears[0]?.year !== 2030 || timelineYears.at(-1)?.year > 2126 || emptyYears.length > 0) {
  throw new Error(`E_TIMELINE_YEAR_COVERAGE:${timelineYears.length}:${timelineYears[0]?.year}:${timelineYears.at(-1)?.year}:${emptyYears.join(',')}`)
}
const stateEvents = stateTimelineEvents(centuryAnnalsDocument.content, timelineYears, territoryStates)
for (const state of territoryStates) {
  state.chronology = stateEvents.get(state.name)
  if (state.chronology.length === 0) throw new Error(`E_STATE_CHRONOLOGY_EMPTY:${state.id}`)
}
await writeFile(resolve(publicRoot, 'opening-territories.json'), `${JSON.stringify(openingTerritories)}\n`)
await writeFile(resolve(publicRoot, 'timeline-overview.json'), `${JSON.stringify({ schema: 'seoul-timeline-overview.v1', years: timelineYears, states: territoryStates }, null, 2)}\n`)

let personalHoldings = originalHoldings
await writeFile(resolve(generatedRoot, 'politicalCatalog.ts'), 'export const politicalCatalog = ' + JSON.stringify(projectPoliticalCatalog(sixteenStatesLore.data.currentAffiliation), null, 2) + ' as const\n')
await writeFile(resolve(publicRoot, 'territorial-scale.json'), JSON.stringify(publicTerritorialScale(territorialScale), null, 2) + String.fromCharCode(10))
personalHoldings = await projectPersonHoldingsInputs(personSources, {
  repoRoot, territoryStates, openingTerritories: { ...openingTerritories,
    regions: openingTerritories.regions.map(region => ({ ...region,
      polities: surfaceHolders(predecessorRegionContentById.get(region.id)),
    })),
  }, projectedLandmarks, seoulGraph, outsideGeometry,
  projectedOutsideControl, affiliation: sixteenStatesLore.data.currentAffiliation, geography, geographicScale,
  historyBytes: historicalRightsBytes,
})
const currentPersonalHoldings = projectCiaFacilityHoldings(personalHoldings, ciaFacilityProjection.correction)
await writeFile(resolve(publicRoot, 'confirmed-person-holdings.json'), JSON.stringify({ ...currentPersonalHoldings,
  titles: publicJurisdictionReferences(currentPersonalHoldings.titles), holdings: publicJurisdictionReferences(currentPersonalHoldings.holdings),
}, null, 2) + String.fromCharCode(10))
const officeAppointments = currentOfficeAppointments(officeAppointmentSource, issuedById)
let { peopleCatalog, personDetails, retainerGraph, familyDetailRoutes, personFeedbackRecords } = await produceFromPersonDetailSources(personSources, {
  personalHoldings, stateNameById, tiersByState, officeAppointments,
})
if (process.env.WIKI_DOCUMENT_DB) {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB)
  try {
    db.exec('BEGIN')
    const profiles = readPublicCharacterProfileInputs(db)
    for (const detail of personDetails) {
      const profile = profiles.get(detail.characterId)
      if (!profile || !isDeepStrictEqual(detail.characterProfile, profile)) throw new Error(`E_PERSON_DB_PROFILE_PARITY:${detail.characterId}`)
      detail.characterProfile = profile
    }
    db.exec('COMMIT')
  } finally { db.close() }
}
const personDetailsRoot = resolve(publicRoot, 'person-details')
personDetails = projectCiaFacilityPersonDetails(personDetails, personalHoldings, ciaFacilityProjection.correction)
// Validate structure, identity and privacy before the active-roster projection.
admitPublicPersonDetails(personDetails)
if (activePersonIds) {
  const db = openReadOnly(rosterDatabasePath)
  try {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='person_disposition'").get()) {
      ;({ peopleCatalog, personDetails, retainerGraph, familyDetailRoutes, personFeedbackRecords } = projectActiveRoster(
        { peopleCatalog, personDetails, retainerGraph, familyDetailRoutes, personFeedbackRecords }, readPersonDisposition(db),
        db.prepare("SELECT 1 FROM sqlite_schema WHERE name='retirement_prose'").get() ? readRetirementProse(db) : []))
    }
  } finally { db.close() }
}
feedbackRecords.push(...personFeedbackRecords)
await writeFile(resolve(generatedRoot, 'retainerGraph.ts'), `export const retainerGraph = ${JSON.stringify(retainerGraph, null, 2)} as const\n`)
const writePersonDetail = async detail => {
  await mkdir(personDetailsRoot, { recursive: true })
  await writeFile(resolve(personDetailsRoot, `${detail.id}.json`), `${JSON.stringify({ ...detail,
    ...(detail.superiorJurisdictions ? { superiorJurisdictions: publicJurisdictionReferences(detail.superiorJurisdictions) } : {}),
    ...(detail.publicJurisdictions ? { publicJurisdictions: publicJurisdictionReferences(detail.publicJurisdictions) } : {}),
  }, null, 2)}\n`)
}
for (const detail of personDetails) await writePersonDetail(detail)
await mkdir(privateGeneratedRoot, { recursive: true })
await writeFile(resolve(privateGeneratedRoot, 'feedback-selectable-views.ko.json'), `${JSON.stringify(privateCatalog(feedbackRecords.filter((record) => record.locale === 'ko')))}\n`)
await writeFile(resolve(privateGeneratedRoot, 'feedback-selectable-views.en.json'), `${JSON.stringify(privateCatalog(feedbackRecords.filter((record) => record.locale === 'en')))}\n`)
const portraitRegistry = (() => {
    const db = openReadOnly(process.env.WIKI_PORTRAIT_DB ?? articleDatabasePath)
    try {
      db.exec('BEGIN')
      const catalog = readPortraitDocuments(db).catalog
      db.exec('COMMIT')
      return catalog
    } finally { db.close() }
  })()
const portraitIdentities = portraitRegistry.entries.map((entry) => {
  const person = peopleCatalog.find((person) => person.id === entry.personId)
  if (!person || person.name !== entry.name || issuedIdByName.get(person.name) !== entry.characterId) throw new Error(`E_PORTRAIT_IDENTITY:${entry.personId}`)
  const lineage = lineageByName.get(person.name)
  const clanId = lineage?.base_clan ?? lineage?.clan ?? null
  const stateFlag = /^S(?:0[1-9]|1[0-6])$/.test(person.state) ? `state-flags/${person.state}.webp` : null
  return { personId: person.id, characterId: entry.characterId, imageSha256: entry.imageSha256,
    stateFlag, stateName: stateFlag ? person.stateName : null, clanId,
    clanCrest: clanId ? `clan-crests/${clanId}.svg` : null,
    bongwan: clanId && lineage?.bongwan ? lineage.bongwan : null,
    nobleTitle: null }
})
await writeFile(resolve(generatedRoot, 'portraitIdentities.ts'), `export const portraitIdentities = ${JSON.stringify(portraitIdentities, null, 2)} as const\n`)

await writeFile(resolve(generatedRoot, 'peopleCatalog.ts'), `export const peopleCatalog = ${JSON.stringify(peopleCatalog, null, 2)} as const\nexport const peopleCount = ${peopleCatalog.length}\n`)
// The home page reads only the count, so it gets its own module and does not bundle the catalog.
await writeFile(resolve(generatedRoot, 'peopleCount.ts'), `export const peopleCount = ${peopleCatalog.length}\n`)

const clanTables = typedCatalogSource(db => readClanCatalogDocument(db))
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

// Each clan detail page owns the complete genealogy of its issued members: one lazily fetched JSON per clan.
const clanTreeRoot = resolve(publicRoot, 'family-trees')
await mkdir(clanTreeRoot, { recursive: true })
const personByIssuedId = new Map(peopleCatalog.map((person) => [issuedIdByName.get(person.name), person]))
// Affiliation derives from the current state contract (currentHegemon), never a hard-coded state-to-hegemon list.
const affiliationFor = (person) => {
  if (person.state === 'S00') return { kind: 'unaffiliated', name: '무소속' }
  if (person.state === 'polity:daejeon') return { kind: 'neutral', name: person.stateName }
  const hegemon = stateCatalog.find((entry) => entry.id === person.state)?.currentHegemon
  if (!hegemon) throw new Error(`E_CLAN_TREE_AFFILIATION:${person.state}`)
  if (hegemon.kind === 'state') return { kind: 'state', stateId: hegemon.stateId, name: hegemon.name }
  if (hegemon.kind === 'union') return { kind: 'union', name: hegemon.name }
  return { kind: 'neutral', name: person.stateName }
}
for (const family of clanFamilyCatalogOut) {
  if (!family.members.length) continue
  const seedIds = family.members.map((member) => {
    const issuedId = issuedIdByName.get(member.name)
    if (!issuedId) throw new Error(`E_CLAN_TREE_SEED:${family.id}:${member.name}`)
    return issuedId
  })
  const activeFamilyNodes = familyGraph.nodes.filter(node => !node.personId || personByIssuedId.has(node.personId))
  const activeFamilyIds = new Set(activeFamilyNodes.map(node => node.id))
  const tree = projectClanFamilyTree({ ...familyGraph, nodes: activeFamilyNodes,
    edges: familyGraph.edges.filter(edge => activeFamilyIds.has(edge.from) && activeFamilyIds.has(edge.to)) }, seedIds, familyDetailRoutes)
  const nodes = tree.nodes.map((node) => {
    if (!node.personId) return node
    const person = personByIssuedId.get(node.personId)
    if (!person) throw new Error(`E_CLAN_TREE_PERSON:${family.id}:${node.personId}`)
    return { ...node, affiliation: affiliationFor(person) }
  })
  await writeFile(resolve(clanTreeRoot, `${family.id}.json`), `${JSON.stringify({ clanId: family.id, personId: null, nodes, edges: tree.edges }, null, 2)}\n`)
}

await writeFile(resolve(generatedRoot, 'nonKoreanFamilyCatalog.ts'), `export const nonKoreanFamilyCatalog = ${JSON.stringify(projectNonKoreanFamilies(peopleCatalog, lineageByName), null, 2)} as const\n`)

// Portrait appearance and exact image approvals remain immutable; roles follow current canon.
for (const file of await readdir(resolve(publicRoot, 'portrait-tokens'))) {
  if (!file.endsWith('.json')) continue
  const path = resolve(publicRoot, 'portrait-tokens', file)
  const token = JSON.parse(await readFile(path, 'utf8'))
  const person = peopleCatalog.find(person => person.id === token.personId)
  if (!person && rosterRetirementApplied) continue
  if (!person || person.name !== token.name) throw new Error('E_PORTRAIT_CANON_IDENTITY:' + file)
  // Approved portraits must carry a canonical role; derived art-proposal tokens may have none yet.
  if (typeof person.position !== 'string' || !person.position.trim()) {
    if (token.image) throw new Error('E_PORTRAIT_CANON_ROLE:' + file)
    token.facts.role = null
  } else token.facts.role = person.position
  await writeFile(path, JSON.stringify(token, null, 2) + '\n')
}
await publishPublicAssets({ publicRoot, manifestPath: publicAssetsManifestPath,
  writeManifest: writeFile,
  previous: previousPublicAssets,
  generated: manifestForPublicFiles([
    'wiki-contract.json', 'opening-territories.json', 'timeline-overview.json',
    'territorial-scale.json', 'confirmed-person-holdings.json',
    ...peopleCatalog.map(person => `person-details/${person.id}.json`),
    ...clanFamilyCatalogOut.filter(family => family.members.length).map(family => `family-trees/${family.id}.json`),
  ]),
  stage: async () => {}, // Private transaction only; the release coordinator owns live promotion.
})
console.log(`
WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, worldJsonRoot)}`)
sourceDatabaseBundle?.close()
}
