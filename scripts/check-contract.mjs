import { spawnSync } from 'node:child_process'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { approvedDocuments, approvedDocumentsAsync, publishedDocuments, catalogFields, readerFields, unknownFields } from './catalog-admission.mjs'
import { personRouteFailures } from './person-publication-contract.mjs'
import { buildAdminTerritorialScale, validateAdminTerritorialScale, buildAdminTerritorialScaleFromDb, buildAdminTerritorialScaleFromDbAsync, readOfficesTerritorialSourceAsync } from './admin-territorial-scale.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readGeographyStore, readGeographyStoreAsync } from './cast-sqlite/geography-store.mjs'
import { readScopeCurrentSource } from './document-store/scope-current-source.mjs'
import { validatePublishedGeographyMap } from './published-geography-map.mjs'
import { publicTerritorialScale } from '../src/components/geographicTitleMap.mjs'
import { readPersonDisposition, readPersonDispositionAsync } from './cast-sqlite/person-disposition.mjs'
import { readAtlasIdentity, readAtlasValuesDocument, readAtlasIdentityAsync, readAtlasValuesDocumentAsync } from './cast-sqlite/atlas-identity.mjs'
import { createReader, hasPgConnection } from './cast-sqlite/db-pg.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (!hasPgConnection()) process.env.WIKI_DOCUMENT_DB ??= resolve(projectRoot, 'data/canonical/wiki-cast.sqlite')
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(projectRoot, 'lore'))
const domains = ['world']
const outputArg = process.argv.indexOf('--json')
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null

async function pgSource(read) {
  const reader = createReader({ role: 'wiki_reader' })
  const importSnapshot = process.env.WIKI_GENERATION_SNAPSHOT
  try {
    return await reader.transaction(read, { readOnly: true, ...(importSnapshot ? { importSnapshot } : {}) })
  } finally { await reader.close() }
}

const documents = []
for (const domain of domains) {
  const sourceDir = resolve(projectRoot, 'src/generated/world')
  const names = (await readdir(sourceDir)).filter((name) => extname(name) === '.json').sort()
  for (const name of names) {
    const page = JSON.parse(await readFile(resolve(sourceDir, name), 'utf8'))
    const heading = page.title ?? basename(name, '.json')
    documents.push({ domain, slug: basename(name, '.json'), title: heading.trim(), route: page.route })
  }
}

const appSource = await readFile(resolve(projectRoot, 'src/App.tsx'), 'utf8')
const linksSource = await readFile(resolve(projectRoot, 'src/wikiLinks.ts'), 'utf8')
const articleSource = await readFile(resolve(projectRoot, 'src/pages/ArticlePage.tsx'), 'utf8')
const catalogPath = resolve(projectRoot, 'src/generated/wikiCatalog.ts')
const publicContractPath = resolve(projectRoot, 'public/wiki-contract.json')

let catalogSource = ''
try {
  catalogSource = await readFile(catalogPath, 'utf8')
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
}

let publicContract = null
try {
  publicContract = JSON.parse(await readFile(publicContractPath, 'utf8'))
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
}

const failures = []
try {
  let descriptor, geographicScale, geography
  if (hasPgConnection()) {
    ({ descriptor, geographicScale, geography } = await pgSource(async (tx) => ({
      descriptor: (await readOfficesTerritorialSourceAsync(tx)).data.territorialScale,
      geographicScale: await buildAdminTerritorialScaleFromDbAsync(tx),
      geography: await readGeographyStoreAsync(tx),
    })))
  } else if (process.env.WIKI_DOCUMENT_DB) {
    const db = openReadOnly(process.env.WIKI_DOCUMENT_DB)
    try {
      db.exec('BEGIN')
      geographicScale = buildAdminTerritorialScaleFromDb(db)
      geography = readGeographyStore(db)
      const offices = readScopeCurrentSource({ db, logicalPath: 'lore/offices/Offices-and-Ranks.json' })
      descriptor = offices.data.territorialScale
      db.exec('COMMIT')
    } finally { db.close() }
  } else {
    const offices = JSON.parse(await readFile(resolve(loreRoot, 'offices/Offices-and-Ranks.json'), 'utf8'))
    const geographyBytes = await readFile(resolve(loreRoot, 'regions/seoul-electoral-titles.json'))
    descriptor = offices.data.territorialScale
    geographicScale = buildAdminTerritorialScale({ geographyBytes, territorialScale: descriptor })
    validateAdminTerritorialScale(geographicScale, { geographyBytes, territorialScale: descriptor })
    geography = JSON.parse(geographyBytes.toString())
  }
  const publishedDescriptor = JSON.parse(await readFile(resolve(projectRoot, 'public/territorial-scale.json'), 'utf8'))
  if (JSON.stringify(publishedDescriptor) !== JSON.stringify(publicTerritorialScale(descriptor))) failures.push('territorial-scale-descriptor-drift')
  const map = JSON.parse(await readFile(resolve(projectRoot, 'public/opening-territories.json'), 'utf8')).geography
  validatePublishedGeographyMap(map, geography, geographicScale)
} catch (error) {
  failures.push('territorial-scale-contract:' + error.message)
}
const approved = publishedDocuments(hasPgConnection()
  ? await pgSource(tx => approvedDocumentsAsync(loreRoot, { tx }))
  : await approvedDocuments(loreRoot))
const peopleSource = await readFile(resolve(projectRoot, 'src/generated/peopleCatalog.ts'), 'utf8')
const people = JSON.parse(peopleSource.split('export const peopleCatalog = ')[1].split(' as const')[0])
const { sourcePeople, issued } = hasPgConnection()
  ? await pgSource(async (tx) => ({ sourcePeople: (await readAtlasValuesDocumentAsync(tx)).people, issued: (await readAtlasIdentityAsync(tx)).registry.persons }))
  : (() => {
    const db = openReadOnly(process.env.WIKI_DOCUMENT_DB)
    try { return { sourcePeople: readAtlasValuesDocument(db).people, issued: readAtlasIdentity(db).registry.persons } }
    finally { db.close() }
  })()
const detailRoot = resolve(projectRoot, 'public/person-details')
const details = new Map()
for (const name of (await readdir(detailRoot)).filter((name) => extname(name) === '.json')) {
  details.set(basename(name, '.json'), JSON.parse(await readFile(resolve(detailRoot, name), 'utf8')))
}
let dispositions
if (hasPgConnection()) {
  dispositions = await pgSource(async (tx) => (await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='person_disposition'")) ? await readPersonDispositionAsync(tx) : undefined)
} else {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(projectRoot, 'data/canonical/wiki-cast.sqlite'))
  try {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='person_disposition'").get()) dispositions = readPersonDisposition(db)
  } finally { db.close() }
}
failures.push(...personRouteFailures(people, details, sourcePeople, issued, dispositions))
const expectedRoutes = approved.map(({ route }) => route)
const publishedRoutes = documents.map(({ route }) => route).sort()
if (JSON.stringify(publishedRoutes) !== JSON.stringify(expectedRoutes)) failures.push('published-routes-differ-from-approved-lore-set')
const routesIn = (source) => [...source.matchAll(/route: '([^']+)'/g)].map((match) => match[1]).sort()
const catalogRoutes = routesIn(catalogSource)
if (JSON.stringify(catalogRoutes) !== JSON.stringify(expectedRoutes)) failures.push('catalog-routes-differ-from-approved-lore-set')
if (catalogSource.includes('wikiEnglishCatalog')) failures.push('unexpected-generated-english-catalog')
const englishFiles = await readdir(resolve(projectRoot, 'src/generated/world-en'), { recursive: true, withFileTypes: true }).catch((error) => {
  if (error.code === 'ENOENT') return []
  throw error
})
if (englishFiles.some((entry) => !entry.isDirectory())) failures.push('unexpected-generated-english-files:src/generated/world-en')
if (publicContract) {
  if (unknownFields(publicContract, ['documents']).length) failures.push(`public-contract-extra-fields:${unknownFields(publicContract, ['documents']).join(',')}`)
  if (!Array.isArray(publicContract.documents)) failures.push('public-contract-documents-invalid')
  else {
    const contractRoutes = publicContract.documents.map((document) => document.route).sort()
    if (JSON.stringify(contractRoutes) !== JSON.stringify(expectedRoutes)) failures.push('public-contract-routes-differ-from-approved-lore-set')
    for (const document of publicContract.documents) {
      const extra = unknownFields(document, catalogFields)
      if (extra.length) failures.push(`public-contract-document-extra-fields:${document.route}:${extra.join(',')}`)
    }
  }
}
const relations = spawnSync(process.execPath, [resolve(loreRoot, 'relations/validate.mjs')], { encoding: 'utf8' })
if (relations.status !== 0) failures.push(`relation-contract:${(relations.stderr || relations.stdout || relations.error?.message || 'missing validator').trim()}`)
if (documents.length === 0) failures.push('document-count:0')
if (!appSource.includes('path="/:domain/:slug"')) failures.push('missing-react-document-route')
if (!articleSource.includes('createDocumentController')) failures.push('article-not-backed-by-document-api')
if (/<ArticlePage\b[^>]*\blocale=['"]en['"]/.test(appSource)) failures.push('unexpected-english-article-renderer')
if (!catalogSource.includes('export const wikiCatalog')) failures.push('missing-generated-catalog')
if (!publicContract || publicContract.documents?.length !== documents.length) failures.push('missing-public-contract-manifest')
if (/\.html['"]/.test(linksSource)) failures.push('legacy-html-links-in-react')
if (!(await readFile(resolve(projectRoot, 'vite.config.ts'), 'utf8')).includes("base: '/wiki/'")) failures.push('missing-wiki-vite-base')

for (const document of documents) {
  const route = `/${document.domain}/${document.slug === 'index' ? '' : document.slug}`
  if (!catalogSource.includes(`route: '${route}'`)) failures.push(`missing-route:${route}`)
  if (!catalogSource.includes(`title: ${JSON.stringify(document.title)}`)) failures.push(`missing-title:${route}`)
}

for (const domain of domains) {
  for (const [folder, prefix] of [['world', '']]) {
    const contentDir = resolve(projectRoot, `src/generated/${folder}`)
    const names = (await readdir(contentDir)).filter((name) => extname(name) === '.json')
    for (const name of names) {
      const page = JSON.parse(await readFile(resolve(contentDir, name), 'utf8'))
      const extra = unknownFields(page, readerFields)
      if (extra.length) failures.push(`reader-json-extra-fields:${domain}/${name}:${extra.join(',')}`)
      const slug = basename(name, '.json')
      const route = `${prefix}/${domain}/${slug === 'index' ? '' : slug}`
      if (page.slug !== slug || page.route !== route || typeof page.title !== 'string') failures.push(`reader-json-identity:${folder}/${name}`)
      if ('body' in page || !Array.isArray(page.blocks) || page.blocks.length === 0 || typeof page.reviewText !== 'string') failures.push(`unstructured-content:${folder}/${name}`)
      else {
        const parsed = fromMarkdown(page.reviewText, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
        const withoutPosition = (node) => {
          delete node.position
          for (const child of node.children ?? []) withoutPosition(child)
        }
        for (const block of parsed) withoutPosition(block)
        if (JSON.stringify(parsed) !== JSON.stringify(page.blocks)) failures.push(`review-text-drift:${folder}/${name}`)
      }
      const links = []
      const visit = (node) => {
        if (node.url && node.type === 'link') links.push(node.url)
        for (const child of node.children ?? []) visit(child)
      }
      for (const block of page.blocks ?? []) visit(block)
      for (const href of links) {
        if (!href.startsWith('http') && /\.html(?:#|$)/i.test(href)) failures.push(`legacy-content-link:${folder}/${name}:${href}`)
        if (!href.startsWith('/') && !href.startsWith('#') && !href.startsWith('http')) failures.push(`relative-content-link:${folder}/${name}:${href}`)
        if (/^\/(?:en\/)?world\//.test(href)) {
          const route = href.split('#', 1)[0]
          if (!catalogSource.includes(`route: '${route}'`)) failures.push(`unregistered-content-link:${folder}/${name}:${href}`)
        }
      }
    }
  }
}

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  documents: documents.length,
  failures,
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (outputPath) await writeFile(resolve(process.cwd(), outputPath), json)
console.log(json.trim())
if (failures.length > 0) process.exit(1)
