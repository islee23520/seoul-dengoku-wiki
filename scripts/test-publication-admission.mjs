import { afterAll } from 'vitest'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile as readDiskFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { afterEach, test } from 'vitest'
import { approvedDocuments, atlasDocumentPaths, publicationEligible, publishedDocuments } from './catalog-admission.mjs'
import { loadCategoryRegistry, publishedRegistrationErrors, registrationErrors } from './category-registration.mjs'
import { wikiPublicationManifest } from './publication-manifest.mjs'
import { isAuthenticatedPublicationReview, validateDocumentPublicationReview, walkCensus, loadAndValidateCensus, loadRequiredProvenance, extractCensusSources, loadAppliedBatches } from './seoul-census.mjs'
import { coverageKey, sha256 } from './seoul-scope.mjs'
import { validateSeoulScope } from './seoul-scope.mjs'
import { loadScopeInput } from './check-seoul-scope.mjs'
import { requireSeoulPublication } from './check-seoul-scope.mjs'
import { wikiLinks } from '../src/wikiLinks.ts'
import { wikiCatalog, wikiEnglishCatalog } from '../src/generated/wikiCatalog.ts'
import { k176PredecessorReader, K176_SOURCE, K176_BEFORE } from './k176-label-successor.mjs'

test('direct census reader authenticates K176 predecessors without bypassing receipt mutations', async () => {
  const root = resolve(import.meta.dirname, '..')
  const reader = await k176PredecessorReader(root, readFile)
  assert.equal(sha256(await reader(resolve(root, K176_SOURCE))), K176_BEFORE)
  const receiptPath = resolve(root, '.omo/private/seoul-migration/k176-label-successor-20261019/owner-decision.json')
  await assert.rejects(k176PredecessorReader(root, async path => {
    const bytes = await readFile(path)
    return path === receiptPath ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes
  }), { message: 'E_REVIEW_HASH', path: '.omo/private/seoul-migration/k176-label-successor-20261019/owner-decision.json' })
})

test('authenticated current-reviewed articles publish when approved or category-ready drafts', async () => {
  const root = resolve(import.meta.dirname, '..')
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const review = await requireSeoulPublication(root)
  const discovered = await approvedDocuments(resolve(root, 'lore'))
  const published = publishedDocuments(discovered, review)
  const manifest = JSON.parse(await readFile(resolve(root, 'public/wiki-contract.json')))
  assert.deepEqual(manifest.documents.map(row => row.route).sort(), published.map(row => row.route).sort())
  for (const document of discovered.filter(row => !/^\/world\/(?:Cast-|Core-Characters$)/u.test(row.route))) {
    const decision = review.documents.find(row => row.sourcePath === document.source)
    if (decision?.eligible && decision.classification === 'current-reviewed') {
      const value = JSON.parse(await readFile(resolve(root, document.source)))
      if (!Array.isArray(value.content)) continue
      const ready = value.status === 'approved' || registrationErrors({ ...value, slug: document.route.split('/').at(-1) }, registry).length === 0
      assert.equal(published.includes(document), ready, document.source)
    }
  }
  for (const slug of ['World-Unbinding', 'Scenario-Timeline']) {
    for (const [catalog, directory, prefix] of [[wikiCatalog, 'world', ''], [wikiEnglishCatalog, 'world-en', '/en']]) {
      const route = `${prefix}/world/${slug}`
      assert.ok(catalog.some(row => row.route === route), route)
      const body = JSON.parse(await readFile(resolve(root, `src/generated/${directory}/${slug}.json`)))
      assert.equal(body.route, route)
      assert.ok(body.reviewText.trim().length > 0, route)
      assert.ok(body.blocks.length > 0, route)
    }
  }
})

test('authenticated review holds incomplete category drafts back without excluding ready draft articles', async () => {
  const root = resolve(import.meta.dirname, '..')
  const review = await requireSeoulPublication(root)
  const discovered = await approvedDocuments(resolve(root, 'lore'))
  const published = publishedDocuments(discovered, review)
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const held = discovered.find(row => row.source === 'lore/Research-Sources.json')
  assert.ok(held)
  const value = JSON.parse(await readFile(resolve(root, held.source)))
  assert.equal(value.status, 'draft')
  assert.equal(value.domain, 'root')
  assert.equal(Object.hasOwn(value, 'categories'), false)
  assert.equal(review.documents.find(row => row.sourcePath === held.source).eligible, true)
  assert.deepEqual(registrationErrors(value, registry, 'Research-Sources.json'), ['E_CATEGORY_SHAPE:Research-Sources.json'])
  assert.equal(publicationEligible(held, review), false)
  assert.equal(published.includes(held), false)
  for (const slug of ['World-Unbinding', 'Scenario-Timeline']) {
    const document = discovered.find(row => row.route === `/world/${slug}`)
    assert.ok(document, slug)
    const draft = JSON.parse(await readFile(resolve(root, document.source)))
    assert.equal(draft.status, 'draft', slug)
    assert.equal(publicationEligible(document, review), true, slug)
    assert.ok(published.includes(document), slug)
  }
})

test('every wikiLinks target resolves to a published article or registered application page', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const appRoutes = [...app.matchAll(/<Route path="([^"]+)" element=\{<(?!Navigate\b|ArticlePage\b|LegacyRegionPage\b)/gu)]
    .map(match => match[1]).filter(route => !/[:*]/u.test(route))
  const routes = new Set([...appRoutes, ...wikiCatalog.map(row => row.route), ...wikiEnglishCatalog.map(row => row.route)])
  for (const [name, route] of Object.entries(wikiLinks)) assert.ok(routes.has(route), `${name}: ${route}`)
})

const inputRoot = new URL('../', import.meta.url).pathname
const { openPublicationDatabaseInputs } = await import('./document-store/publication-database-inputs.mjs')
const inputConfig = JSON.parse(await readDiskFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG ?? new URL('../.omo/private/seoul-migration/sqlite-authority-20261021/publication-config.json', import.meta.url), 'utf8'))
const inputBundle = await openPublicationDatabaseInputs(inputRoot, inputConfig)
const readFile = async (path, encoding) => {
  const absolute = path instanceof URL ? path.pathname : path
  if (!absolute.startsWith(inputRoot + 'lore/') && !String(path).startsWith('lore/')) return readDiskFile(path, encoding)
  const bytes = await inputBundle.inputs.readBytes(absolute.startsWith(inputRoot) ? absolute : new URL('../' + path, import.meta.url).pathname)
  return encoding === 'utf8' ? bytes.toString() : bytes
}
afterAll(() => inputBundle.close())

const roots = []
test('authenticated document scope does not require entity allocation or complete publication', async () => {
  const root = resolve(import.meta.dirname, '..')
  const loaded = await loadScopeInput({ root, baselinePath: resolve(root, '.omo/private/seoul-migration/baseline.json'), mode: 'inspection' })
  const { dependencyReport, dependencies, ...input } = loaded
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  const cloned = { ...input, current: { ...input.current, publicationReview: structuredClone(input.current.publicationReview) } }
  assert.equal(validateSeoulScope(cloned, { mode: 'inspection' }).errors[0].code, 'E_PUBLICATION_REVIEW_AUTHORITY')
  const partial = { ...input, current: { ...input.current } }
  delete partial.current.publicationReview
  assert.equal(validateSeoulScope(partial, { mode: 'inspection' }).ok, true)
  const publication = validateSeoulScope(partial, { mode: 'publication' })
  assert.equal(publication.ok, false)
  assert.equal(publication.errors[0].code, 'E_PUBLICATION_REVIEW_AUTHORITY')
  const entityInput = { ...input, contract: structuredClone(input.contract) }
  const entity = entityInput.contract.entities.find(row => row.kind === 'state')
  entity.status = 'active'; entity.batchId = 'unapproved-entity-allocation'
  assert.equal(validateSeoulScope(entityInput, { mode: 'inspection' }).ok, false)
})
test('partial review authenticates exact keys and rejects evidence tampering', async () => {
  const f = await fixture()
  assert.equal(f.review.complete, false)
  assert.equal(f.review.semanticReview, 'not-reviewed')
  assert.equal(f.review.documents.find(row => row.sourcePath === 'lore/Current.json').eligible, true)
  assert.equal(f.review.documents.find(row => row.sourcePath === 'lore/Pending.json').eligible, false)
  assert.equal(f.review.documents.find(row => row.sourcePath === 'lore/Pending.json').reason, 'missing-authenticated-review')
  assert.equal(isAuthenticatedPublicationReview(f.review), false)
  assert.throws(() => publishedDocuments(f.documents, f.review), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' })
  const evidence = f.args.evidence.map(row => ({ ...row, body: row.body + ' ' }))
  assert.throws(() => validateDocumentPublicationReview({ ...f.args, evidence }), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' })
})

test('unpinned successor receipt grants no authority while pure comparisons reject changed coverage', async () => {
  const root = resolve(import.meta.dirname, '..')
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const args = { root, baseline, baselineSha256: contract.baselineSha256, contract, batches: [], review: null, mode: 'inspection' }
  const receiptPath = '.omo/private/seoul-migration/stable-three-current-publication-receipts-20261015/publication-review.json'
  const receipt = JSON.parse(await readFile(resolve(root, receiptPath)))
  assert.deepEqual(receipt.documents.map(row => row.sourcePath), [
    'lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json', 'lore/places/World-Map-Construction.json',
  ])
  const partial = await fixture()
  const unpinned = validateDocumentPublicationReview({ ...partial.args, pins: [], evidence: [] })
  assert.equal(unpinned.documents.filter(row => row.eligible).length, 0)
  assert.ok(unpinned.documents.filter(row => partial.args.documents.find(document => document.sourcePath === row.sourcePath)?.status === 'active')
    .every(row => row.reason === 'missing-authenticated-review'))
  const decode = key => { const [sourcePath, jsonPointer, locale, originalSha256] = JSON.parse(key); return { sourcePath, jsonPointer, locale, originalSha256 } }
  const original = { leaves: receipt.documents.flatMap(row => row.originalKeys.map(decode)), blocks: [] }
  const current = { leaves: receipt.documents.flatMap(row => row.currentKeys.map(item => decode(item.key))), blocks: [] }
  const sources = new Map(receipt.documents.map(row => [row.sourcePath, { sha256: row.currentSha256 }]))
  const documents = receipt.documents.map(row => ({ sourcePath: row.sourcePath, status: 'pending', reviewReceipt: null }))
  const body = JSON.stringify(receipt)
  const pins = [{ path: receiptPath, sha256: sha256(body) }]
  const evidence = [{ path: receiptPath, body }]
  const superseded = new Map(receipt.documents.map(row => [row.sourcePath, { sourceRawSha256: '0'.repeat(64), afterRawSha256: row.currentSha256 }]))
  const review = validateDocumentPublicationReview({ sources, original, current, documents, pins, evidence, superseded })
  assert.equal(review.documents.filter(row => row.eligible).length, 0)
  for (const index of [0, 1, 2]) for (const kind of ['original-key-drop', 'current-key-drop', 'key-hash', 'source-hash', 'decision']) {
    const changed = structuredClone(receipt)
    const row = changed.documents[index]
    if (kind === 'original-key-drop') row.originalKeys.pop()
    if (kind === 'current-key-drop') row.currentKeys.pop()
    if (kind === 'key-hash') row.currentKeys[0].sha256 = '0'.repeat(64)
    if (kind === 'source-hash') row.currentSha256 = '1'.repeat(64)
    if (kind === 'decision') row.decision = 'pending'
    const changedBody = JSON.stringify(changed)
    const changedPins = [{ path: receiptPath, sha256: sha256(changedBody) }]
    if (kind === 'decision') {
      const pending = validateDocumentPublicationReview({ sources, original, current, documents, pins: changedPins,
        evidence: [{ path: receiptPath, body: changedBody }], superseded })
      assert.equal(pending.documents[index].eligible, false)
    } else assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents, pins: changedPins,
      evidence: [{ path: receiptPath, body: changedBody }], superseded }),
    { code: kind.endsWith('drop') ? 'E_REVIEW_COVERAGE' : 'E_REVIEW_HASH' })
  }
  const staleScope = documents.map(row => ({ ...row, status: 'active', reviewReceipt: { currentSha256: '0'.repeat(64) } }))
  assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents: staleScope, pins, evidence, superseded }), { code: 'E_REVIEW_HASH' })
  assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents: documents.map(row => ({ ...row, status: 'active' })),
    pins, evidence, superseded }), { code: 'E_REVIEW_HASH' })
})

test('four status successors authenticate all twelve unchanged historical records and reject altered inputs', async () => {
  const root = resolve(import.meta.dirname, '..')
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const batches = await loadAppliedBatches(readFile, root)
  const sources = await extractCensusSources(baseline, path => readFile(resolve(root, path)), batches)
  const officeRetrofit = batches.find(batch => batch.approvalModel === 'office-rank-retrofit-734')
  const archived = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/office-retrofit-candidate-20261017/source-before.json')))
  for (const source of officeRetrofit.sourceBeforeAfter.sources) {
    const entry = archived.files.find(row => row.path === source.sourcePath)
    const bytes = gunzipSync(Buffer.from(entry.gzipBase64, 'base64'))
    assert.equal(sha256(bytes), source.beforeSha256)
    sources.set(source.sourcePath, { bytes, sha256: source.beforeSha256, value: JSON.parse(bytes) })
  }
  const post108 = batches.find(batch => batch.approvalModel === 'post108-eight-document-source-application-31')
  if (post108) for (const source of post108.sourceBeforeAfter.sources.filter(row => row.changed)) {
    const bytes = await readFile(resolve(root, '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/before/' + source.sourcePath))
    assert.equal(sha256(bytes), source.beforeSha256)
    sources.set(source.sourcePath, { bytes, sha256: source.beforeSha256, value: JSON.parse(bytes) })
  }
  const authentic = await loadRequiredProvenance(root, sources)
  assert.equal(authentic.size, 224)
  const packetPath = '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/application-packet.json'
  const packet = JSON.parse(await readFile(resolve(root, packetPath)))
  const blocks = packet.sources.flatMap(row => {
    const before = JSON.parse(gunzipSync(Buffer.from(row.beforeGzipBase64, 'base64')))
    const after = JSON.parse(gunzipSync(Buffer.from(row.afterGzipBase64, 'base64')))
    const original = walkCensus(before, row.sourcePath).blocks
    const current = walkCensus(after, row.sourcePath).blocks
    assert.deepEqual(current, original)
    return current
  })
  assert.equal(blocks.length, 76)
  const paths = [packetPath, '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/source-before-after.json']
  for (const path of paths) await assert.rejects(loadRequiredProvenance(root, sources, async target => {
    const bytes = await readFile(target)
    return target === resolve(root, path) ? Buffer.concat([bytes, Buffer.from('\n')]) : bytes
  }), { code: 'E_REVIEW_HASH' })
  const changedReference = new Map(sources)
  const targetPath = packet.sources[0].sourcePath
  const source = changedReference.get(targetPath)
  const altered = structuredClone(source.value)
  altered.content[4].items[0].ko[0].link.slug = 'rules/altered-target'
  const alteredBytes = Buffer.from(JSON.stringify(altered))
  changedReference.set(targetPath, { value: altered, bytes: alteredBytes, sha256: sha256(alteredBytes) })
  await assert.rejects(loadRequiredProvenance(root, changedReference), { code: 'E_REVIEW_HASH' })
  const changedNeighbor = new Map(sources)
  const neighbor = structuredClone(source.value)
  neighbor.content[0].anchor += '-altered'
  const neighborBytes = Buffer.from(JSON.stringify(neighbor))
  changedNeighbor.set(targetPath, { value: neighbor, bytes: neighborBytes, sha256: sha256(neighborBytes) })
  await assert.rejects(loadRequiredProvenance(root, changedNeighbor), { code: 'E_REVIEW_HASH' })
})

test.each(['.omo/private/seoul-migration/post67-rebind-20261015/two-source-technical-review-v1.json',
    '.omo/private/seoul-migration/post62-registration-20261015/fullbody-two-source-coverage-v1.json',
    '.omo/private/seoul-migration/recommendations-application-20261015/independent.json',
    '.omo/private/seoul-migration/post67-rebind-20261015/sixteen-states-publication-review-v3.json',
    '.omo/evidence/seoul-lock/sixteen-states-fullbody-independent-review-addendum-20261015.md',
    '.omo/private/seoul-migration/post67-rebind-20261015/water-five-publication-review-v2.json',
    '.omo/evidence/seoul-lock/water-structures-fullbody-final-current-addendum-20261015.md',
    '.omo/private/seoul-migration/water-structures-final-route-owner-20261015/owner-approved-two-field-applied.json',
    '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/application-packet.json',
    '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/publication-review.json',
    '.omo/private/seoul-migration/six-doc-remediation-20261015/absolute-worktree-independent.json',
    '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'])('production review rejects tampered %s', async path => {
    const root = resolve(import.meta.dirname, '..')
    const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
    const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
    const args = { root, baseline, baselineSha256: contract.baselineSha256, contract, batches: [], review: null, mode: 'inspection' }
    await assert.rejects(loadAndValidateCensus({ ...args, readBytes: async target => {
      const bytes = await readFile(target)
      return target === resolve(root, path) ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes
    } }), path.includes('owner-remaining-recommendations-approval')
      ? { message: 'E_REVIEW_HASH', path }
      : { code: path.includes('application-packet.json')
      ? 'E_APPROVAL_BATCH' : path.includes('owner-approved-two-field-applied.json')
      || path.includes('recommendations-application-20261015/independent.json')
      || path.includes('four-reviewed-documents-admission-20261015/publication-review.json')
      || path.includes('six-doc-remediation-20261015/absolute-worktree-independent.json')
      ? 'E_REVIEW_HASH' : 'E_PUBLICATION_REVIEW_AUTHORITY' })
})

test('four reviewed documents require complete production string-leaf keys', async () => {
  const root = resolve(import.meta.dirname, '..')
  const path = '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/publication-review.json'
  const receipt = JSON.parse(await readFile(resolve(root, path)))
  const decode = key => { const [sourcePath, jsonPointer, locale, originalSha256] = JSON.parse(key); return { sourcePath, jsonPointer, locale, originalSha256 } }
  const original = { leaves: receipt.documents.flatMap(row => row.originalKeys.map(decode)) }
  const current = { leaves: receipt.documents.flatMap(row => row.currentKeys.map(item => decode(item.key))) }
  const sources = new Map(receipt.documents.map(row => [row.sourcePath, { sha256: row.currentSha256 }]))
  const documents = receipt.documents.map(row => ({ sourcePath: row.sourcePath, status: 'active', reviewReceipt: { currentSha256: row.currentSha256 } }))
  for (const index of [0, 1, 2, 3]) for (const kind of ['coverage', 'hash', 'source']) {
    const changed = structuredClone(receipt)
    if (kind === 'coverage') changed.documents[index].originalKeys.pop()
    if (kind === 'hash') changed.documents[index].currentKeys[0].sha256 = '0'.repeat(64)
    if (kind === 'source') changed.documents[index].currentSha256 = '0'.repeat(64)
    const body = JSON.stringify(changed)
    assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents,
      pins: [{ path, sha256: sha256(body) }], evidence: [{ path, body }] }), { code: kind === 'coverage' ? 'E_REVIEW_COVERAGE' : 'E_REVIEW_HASH' })
  }
})

test('single reviewed document rejects missing recursive coverage and wrong hashes', async () => {
  const root = resolve(import.meta.dirname, '..')
  const path = '.omo/private/seoul-migration/post67-rebind-20261015/sixteen-states-publication-review-v3.json'
  const receipt = JSON.parse(await readFile(resolve(root, path)))
  const decision = receipt.documents[0]
  const decode = key => { const [sourcePath, jsonPointer, locale, originalSha256] = JSON.parse(key); return { sourcePath, jsonPointer, locale, originalSha256 } }
  const original = { leaves: decision.originalKeys.map(decode) }
  const current = { leaves: decision.currentKeys.map(row => decode(row.key)) }
  const sources = new Map([[decision.sourcePath, { sha256: decision.currentSha256 }]])
  const documents = [{ sourcePath: decision.sourcePath, status: 'active', reviewReceipt: { currentSha256: decision.currentSha256 } }]
  for (const kind of ['coverage', 'keyHash', 'sourceHash']) {
    const changed = structuredClone(receipt)
    if (kind === 'coverage') changed.documents[0].currentKeys.pop()
    if (kind === 'keyHash') changed.documents[0].currentKeys[0].sha256 = '0'.repeat(64)
    if (kind === 'sourceHash') changed.documents[0].currentSha256 = '0'.repeat(64)
    const body = JSON.stringify(changed)
    assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents,
      pins: [{ path, sha256: sha256(body) }], evidence: [{ path, body }] }), { code: kind === 'coverage' ? 'E_REVIEW_COVERAGE' : 'E_REVIEW_HASH' })
  }
})
test('five water documents reject incomplete production coverage and tampered current hashes', async () => {
  const root = resolve(import.meta.dirname, '..')
  const path = '.omo/private/seoul-migration/post67-rebind-20261015/water-five-publication-review-v2.json'
  const receipt = JSON.parse(await readFile(resolve(root, path)))
  const decode = key => { const [sourcePath, jsonPointer, locale, originalSha256] = JSON.parse(key); return { sourcePath, jsonPointer, locale, originalSha256 } }
  const original = { leaves: receipt.documents.flatMap(row => row.originalKeys.map(decode)) }
  const current = { leaves: receipt.documents.flatMap(row => row.currentKeys.map(item => decode(item.key))) }
  const sources = new Map(receipt.documents.map(row => [row.sourcePath, { sha256: row.currentSha256 }]))
  const documents = receipt.documents.map(row => ({ sourcePath: row.sourcePath, status: 'active', reviewReceipt: { currentSha256: row.currentSha256 } }))
  for (const index of [0, 1, 2, 3, 4]) for (const kind of ['coverage', 'hash']) {
    const changed = structuredClone(receipt)
    if (kind === 'coverage') changed.documents[index].originalKeys.pop()
    else changed.documents[index].currentKeys[0].sha256 = '0'.repeat(64)
    const body = JSON.stringify(changed)
    assert.throws(() => validateDocumentPublicationReview({ sources, original, current, documents,
      pins: [{ path, sha256: sha256(body) }], evidence: [{ path, body }] }), { code: kind === 'coverage' ? 'E_REVIEW_COVERAGE' : 'E_REVIEW_HASH' })
  }
})
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-publication-'))
  roots.push(root)
  const sources = new Map()
  for (const [slug, status] of [['Current', 'approved'], ['Draft', 'draft'], ['Pending', 'approved'], ['Research', 'approved'],
    ['Core-Characters', 'approved'], ['Sixteen-States', 'approved'], ['Scenario-Timeline', 'approved']]) {
    const bytes = JSON.stringify({ id: `DOC:${slug}`, domain: 'root', status, content: [{ kind: 'paragraph', text: { ko: slug, en: slug } }] })
    await writeFile(resolve(root, `${slug}.json`), bytes)
    sources.set(`lore/${slug}.json`, { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) })
  }
  await writeFile(resolve(root, 'glossary.json'), '[]')
  sources.set('lore/glossary.json', { bytes: '[]', sha256: sha256('[]'), value: [] })
  const sealedPath = 'vendor/issued-history/research.json'
  sources.set(sealedPath, { bytes: '{}', sha256: sha256('{}'), value: {} })
  const original = { leaves: [...sources].flatMap(([path, source]) => walkCensus(source.value, path).leaves) }
  const current = structuredClone(original)
  const scopeDocuments = [...sources].map(([sourcePath, source]) => ({ sourcePath,
    status: sourcePath === sealedPath || sourcePath === 'lore/Research.json' ? 'preserved' : 'active',
    reviewReceipt: { currentSha256: source.sha256 } }))
  const receipt = { schema: 'seoul-document-publication-review.v1', reviewer: 'synthetic-fixture', approvalRef: 'fixture:review',
    reviewedAt: '2026-10-15T00:00:00Z', documents: [...sources].filter(([path]) => path !== 'lore/Pending.json').map(([sourcePath, source]) => ({
      sourcePath, currentSha256: source.sha256,
      classification: scopeDocuments.find(row => row.sourcePath === sourcePath).status === 'preserved' ? 'archive' : 'current',
      decision: 'approved', originalKeys: original.leaves.filter(row => row[0] === sourcePath).map(row => coverageKey({ sourcePath: row[0], jsonPointer: row[1], locale: row[3], originalSha256: row[4] })),
      currentKeys: current.leaves.filter(row => row[0] === sourcePath).map(row => ({ key: coverageKey({ sourcePath: row[0], jsonPointer: row[1], locale: row[3], originalSha256: row[4] }), sha256: row[4] })),
    })) }
  const body = JSON.stringify(receipt)
  const args = { sources, original, current, documents: scopeDocuments,
    pins: [{ path: 'fixture:review.json', sha256: sha256(body) }], evidence: [{ path: 'fixture:review.json', body }] }
  const review = validateDocumentPublicationReview(args)
  const documents = await approvedDocuments(root, { checkAtlas: async () => {} })
  return { root, sources, args, review, documents, find: slug => documents.find(row => row.route === `/world/${slug}`) }
}

test('publication eligibility keeps approved current sources and excludes draft, pending and archived sources', async () => {
  const f = await fixture()
  const eligible = f.documents.filter(document => publicationEligible(document, f.review)).map(row => row.route)
  assert.deepEqual(eligible, ['/world/', '/world/Core-Characters', '/world/Current', '/world/Glossary', '/world/Scenario-Timeline', '/world/Sixteen-States'])
  assert.equal(f.review.documents.find(row => row.sourcePath === 'vendor/issued-history/research.json').reason, 'sealed-history')
  assert.equal(f.review.documents.find(row => row.sourcePath === 'lore/Research.json').reason, 'archive-only')
  assert.equal(await readFile(resolve(f.root, 'Research.json'), 'utf8'), f.sources.get('lore/Research.json').bytes)
  assert.equal(f.sources.has('vendor/issued-history/research.json'), true)
})

test('approved sources with invalid categories still reach publication validation', async () => {
  const f = await fixture()
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  assert.equal(publicationEligible(f.find('Current'), f.review), true)
  assert.deepEqual(publishedRegistrationErrors([
    { slug: 'Current', value: f.sources.get('lore/Current.json').value },
  ], new Set(['/world/Current']), registry), ['E_CATEGORY_SHAPE:Current'])
})

test('publication admission rejects missing, synthetic and cloned review authority', async () => {
  const f = await fixture()
  f.args.sources.delete('lore/Pending.json')
  f.args.documents = f.args.documents.filter(row => row.sourcePath !== 'lore/Pending.json')
  f.args.original.leaves = f.args.original.leaves.filter(row => row[0] !== 'lore/Pending.json')
  f.args.current.leaves = f.args.current.leaves.filter(row => row[0] !== 'lore/Pending.json')
  const complete = validateDocumentPublicationReview(f.args)
  assert.equal(complete.complete, true)
  assert.equal(isAuthenticatedPublicationReview(f.review), false)
  for (const review of [undefined, f.review, complete, structuredClone(complete)]) {
    assert.throws(() => publishedDocuments(f.documents, review), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' })
  }
})

test('publication manifest rejects synthetic authority before reading or publishing routes', async () => {
  const f = await fixture()
  await assert.rejects(wikiPublicationManifest({ loreRoot: resolve(f.root, 'absent'), publicationReview: f.review,
    documents: [{ slug: 'Draft', route: '/world/Draft', title: 'Draft', summary: '', categories: [] }], registry: { categories: [] } }),
  { code: 'E_PUBLICATION_REVIEW_AUTHORITY' })
})

test('publication eligibility rejects a source changed after exact review', async () => {
  const f = await fixture()
  await writeFile(resolve(f.root, 'Current.json'), f.sources.get('lore/Current.json').bytes + '\n')
  const documents = await approvedDocuments(f.root, { checkAtlas: async () => {} })
  assert.throws(() => publicationEligible(documents.find(row => row.route === '/world/Current'), f.review), { code: 'E_REVIEW_HASH' })
})

test('publication eligibility rejects source identity injection and missing review coverage', async () => {
  const f = await fixture()
  assert.throws(() => publicationEligible({ ...f.find('Current') }, f.review), { code: 'E_PUBLICATION_DISCOVERY' })
  const sources = new Map(f.sources); sources.delete('lore/Current.json')
  const review = validateDocumentPublicationReview({ sources, original: {}, current: {}, documents: [], pins: [], evidence: [] })
  assert.throws(() => publicationEligible(f.find('Current'), review), { code: 'E_REVIEW_COVERAGE' })
})

test('derived world index requires every contributing document review', async () => {
  const f = await fixture()
  const review = validateDocumentPublicationReview({ ...f.args, pins: [], evidence: [] })
  assert.equal(publicationEligible(f.find(''), review), false)
  assert.equal(publicationEligible(f.find('Glossary'), review), false)
})

test('structural discovery preserves all atlas projection identities without semantic admission', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-atlas-discovery-'))
  roots.push(root)
  for (const path of atlasDocumentPaths) {
    await mkdir(resolve(root, path, '..'), { recursive: true })
    await writeFile(resolve(root, path), JSON.stringify({ domain: 'root', status: 'draft', id: 'source-id', content: [] }))
  }
  const documents = await approvedDocuments(root, { checkAtlas: async () => {}, includeWorldIndex: false })
  assert.equal(documents.length, 34)
  assert.equal(documents.filter(row => row.source !== 'lore/World-Narrative-Atlas.json').length, 33)
  assert.ok(documents.every(row => row.id === `wiki:${row.route.split('/').at(-1)}`))
  assert.throws(() => publishedDocuments(documents), { code: 'E_PUBLICATION_REVIEW_AUTHORITY' })
})


test('post108 successor reviews exact final eight and rejects unknown historical or coverage mutations', async () => {
  const root = resolve(import.meta.dirname, '..')
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const args = { root, baseline, baselineSha256: contract.baselineSha256, contract, batches: [], review: null, mode: 'inspection' }
  const loaded = await loadAndValidateCensus(args)
  assert.equal(loaded.ok, true)
  const expected = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/post108-eight-document-application-20261018/publication-review.json')))
  const bySourcePath = (a, b) => a[0].localeCompare(b[0])
  assert.deepEqual(loaded.publicationReview.documents.filter(row => expected.documents.some(document => document.sourcePath === row.sourcePath))
    .map(row => [row.sourcePath, row.eligible, row.currentSha256]).sort(bySourcePath),
  expected.documents.map(row => [row.sourcePath, true, row.currentSha256]).sort(bySourcePath))
  const path = '.omo/private/seoul-migration/post108-eight-document-application-20261018/publication-review.json'
  for (const kind of ['unknown-prior-hash', 'coverage']) await assert.rejects(loadAndValidateCensus({ ...args, readBytes: async target => {
    const bytes = await readFile(target)
    if (target !== resolve(root, path)) return bytes
    const receipt = JSON.parse(bytes)
    if (kind === 'unknown-prior-hash') receipt.documents[0].currentSha256 = '0'.repeat(64)
    else receipt.documents[0].currentKeys.pop()
    return Buffer.from(JSON.stringify(receipt))
  } }), { code: 'E_REVIEW_HASH' })
})
