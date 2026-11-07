// Public projection oracle. Keep policy in the existing catalog/API predicates.
import { basename } from 'node:path'
import { admissionDocuments, catalogSourceEligible, publicationEligible, publishedDocuments } from './catalog-publication.mjs'
import { registrationErrors } from './category-publication.mjs'

export function publicAdmission({ identities, pages, registry, computed = [] }) {
  const eligible = identities.filter(catalogSourceEligible)
  const discovery = admissionDocuments(registry)
  const candidates = []
  for (const identity of eligible) {
    const slug = basename(identity.logical_path, '.json')
    if (discovery.slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`)
    const page = pages.find(row => row.path === identity.logical_path && row.value.id === identity.document_id && row.value.domain === identity.domain)
    if (!page) continue
    candidates.push(page)
    discovery.addPage({ ...page, slug })
  }
  discovery.addWorldIndex()
  const documents = []
  for (const document of discovery.sorted()) {
    try {
      // publicationEligible deliberately admits category-valid drafts. The
      // API additionally checks registration even on approved envelopes.
      if (!publicationEligible(document) || !publishedDocuments([document]).length) continue
    } catch (error) {
      if (error.code === 'E_PUBLICATION_DISCOVERY') continue
      throw error
    }
    const page = candidates.find(row => row.path === document.source)
    if (page) {
      const slug = basename(page.path, '.json')
      if (registrationErrors(page.value, registry, slug).length) continue
      const matching = eligible.filter(row => row.logical_path === page.path && row.document_id === page.value.id && row.domain === page.value.domain)
      if (matching.length !== 1 || !/^\/world\/[\p{L}\p{N}_-]+$/u.test(document.route)) continue
      documents.push({ ...document, sourceId: String(matching[0].source_id), identity: matching[0], document: page.value })
    } else if (computed.some(row => row.route === document.route && row.source === document.source)) {
      documents.push({ ...document })
    }
  }
  return { documents, sourceIds: new Set(documents.flatMap(row => row.sourceId === undefined ? [] : [row.sourceId])) }
}

// Same internal discovery and tolerated schema failures as wiki-document-api.
// No EXISTS-only document_publication_admission shortcut and no new draft rule.
export async function readPublicAdmission(tx) {
  const { listDocumentsAsync, readDocumentAsync } = await import('./cast-sqlite/document-read.mjs')
  const { orderDocumentKeysAsync } = await import('./cast-sqlite/document-key-order.mjs')
  const { readCatalogMetadataDocumentAsync, CATEGORY_REGISTRY_PATH } = await import('./cast-sqlite/catalog-metadata.mjs')
  const { readComputedArticleAsync } = await import('./cast-sqlite/computed-articles.mjs')
  const identities = await listDocumentsAsync(tx, { corpusKind: 'current', visibility: 'internal' })
  const registry = await readCatalogMetadataDocumentAsync(tx, CATEGORY_REGISTRY_PATH)
  const pages = []
  const slugs = new Set()
  for (const identity of identities.filter(catalogSourceEligible)) {
    const slug = basename(identity.logical_path, '.json')
    if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`)
    slugs.add(slug)
    await tx.exec('SAVEPOINT public_candidate')
    try {
      const document = await readDocumentAsync(tx, { corpusKind: 'current', domain: identity.domain, documentId: identity.document_id, visibility: 'internal' })
      if (document?.readMetadata.source_id === identity.source_id) pages.push({ path: identity.logical_path, slug, value: await orderDocumentKeysAsync(tx, identity.source_id, document) })
    } catch (error) {
      await tx.exec('ROLLBACK TO SAVEPOINT public_candidate')
      if (!['E_DOCUMENT_SCHEMA_GAP', 'E_DOCUMENT_AMBIGUOUS'].includes(error.code)) throw error
    } finally { await tx.exec('RELEASE SAVEPOINT public_candidate') }
  }
  const ordinary = publicAdmission({ identities, pages, registry })
  const mappings = ordinary.documents.map(row => ({ ...row.identity, route: row.route, document: row.document, titles: { ko: row.document.locales.ko.title } }))
  const computed = []
  const routes = await tx.all("SELECT route,source_id,derivation,derivation_json FROM wiki.article_route WHERE derivation IN ('computed-index','computed-glossary') ORDER BY route COLLATE \"C\"")
  for (const mapping of routes) {
    await tx.exec('SAVEPOINT public_computed')
    try {
      if (await readComputedArticleAsync(tx, mapping, mappings, 'ko')) computed.push({ route: mapping.route, source: mapping.derivation === 'computed-glossary' ? 'lore/glossary.json' : 'scripts/build-world-index.mjs' })
    } catch (error) {
      await tx.exec('ROLLBACK TO SAVEPOINT public_computed')
      if (!['E_DOCUMENT_SCHEMA_GAP', 'E_DOCUMENT_AMBIGUOUS', 'E_GLOSSARY_NOT_FOUND', 'E_GLOSSARY_REVISION'].includes(error.code)
        && !/^E_COMPUTED/u.test(error.code ?? error.message)) throw error
    } finally { await tx.exec('RELEASE SAVEPOINT public_computed') }
  }
  return publicAdmission({ identities, pages, registry, computed })
}

// Closure uses raw JSON tokens for IDs; seed bytes themselves never round-trip
// through Number or JSON.stringify. Public-scratch roundtrips omit this hook.
export function seedRowAdmitted(table, row, closure) {
  if ('source_id' in row && !closure.sourceIds.has(String(row.source_id))) return false
  for (const key of ['person_id', 'from_person_id', 'to_person_id']) {
    if (row[key] != null && !closure.personIds.has(String(row[key]))) return false
  }
  if (table.startsWith('region_content_') && !closure.regionPaths.has(row.logical_path)) return false
  if (table.startsWith('glossary_')) {
    if (!closure.glossaryRevision || row.revision_id !== closure.glossaryRevision) return false
    if ('term_id' in row && !closure.glossaryTerms.has(row.term_id)) return false
  }
  return true
}

export async function readSeedClosure(tx, admission) {
  const { REGION_CONTENT_PATHS } = await import('./cast-sqlite/region-content-documents.mjs')
  const { readPersonDispositionAsync } = await import('./cast-sqlite/person-disposition.mjs')
  const { listGlossaryEntriesAsync, readGlossaryHeadAsync } = await import('./cast-sqlite/glossary-store.mjs')
  const people = await tx.all('SELECT person_id FROM wiki.person')
  const hasDisposition = await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='person_disposition'")
  const disposition = hasDisposition ? await readPersonDispositionAsync(tx) : null
  const glossary = admission.documents.some(row => row.route === '/world/Glossary')
  return {
    sourceIds: admission.sourceIds,
    personIds: new Set(people.filter(row => !disposition || disposition.get(row.person_id)?.status === 'active').map(row => row.person_id)),
    regionPaths: new Set(REGION_CONTENT_PATHS),
    glossaryRevision: glossary ? (await readGlossaryHeadAsync(tx)).revision : null,
    glossaryTerms: new Set(glossary ? (await listGlossaryEntriesAsync(tx, { visibility: 'public' })).map(row => row.term_id) : []),
  }
}

export function assertRouteCoverage(expected, actual) {
  const routes = rows => rows.map(row => typeof row === 'string' ? row : row.route).sort()
  const left = routes(expected), right = routes(actual)
  if (new Set(right).size !== right.length || JSON.stringify(left) !== JSON.stringify(right)) throw new Error('E_PUBLIC_ROUTE_COVERAGE')
}
