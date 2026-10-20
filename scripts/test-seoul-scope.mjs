import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { gunzipSync, gzipSync } from 'node:zlib'
import { test } from 'vitest'
import { ENTITY_SETS, KINGDOM_SUCCESSOR_BINDING, RELATION_COURT_BULK_RETIREMENT, RELATION_COURT_DISPOSITION, STAGING_GEOGRAPHY_SCHEMA, STAGING_SOURCES, approvedKingdomGeography, authenticateRightsTransition, baselineDocuments, canonicalProposal, checkStagingGeography, materializeRelationCourtBulkRetirement, materializeRelationCourtDispositions, materializeRetiredRightsDispositions, proposalHash, publicationGeography, selectedScopeRow, sha256, stagingGeography, validateSeoulScope } from './seoul-scope.mjs'
import { TASK2_BINDING, loadAppliedBatches, loadTask2Geography, compareCensusCategories, createDependencyResolver, dependencyDispositions, documentReviewReceipts, extractDependencies, extractCurrentCategories, extractEntityRecords, isAuthenticatedPublicationReview, loadRequiredProvenance, materializeIndependentReview, validateCensusProducts, validateDependencyClosure, validateDocumentPublicationReview, validateIndependentReview, walkCensus } from './seoul-census.mjs'
import { projectPrivateSeoulScope } from './seoul-private-projection.mjs'
import { loadScopeInput, refreshTechnicalExcludedDocument } from './check-seoul-scope.mjs'
import { TECHNICAL_DOCUMENT, validateTechnicalDocumentCoverage } from './seoul-scope.mjs'
import { NATIONAL_DRESS_PATH, authenticateNationalDressAdmission } from './national-dress-admission-successor.mjs'
import { BATCH_ID as DOC247_RECEIPT_WAVE_BATCH_ID, COVERAGE_PATH as DOC247_RECEIPT_WAVE_COVERAGE_PATH, FIX_CONFIRMATION as DOC247_FIX_CONFIRMATION, RECEIPTS_PATH as DOC247_RECEIPT_WAVE_RECEIPTS_PATH, REPIN_SUCCESSOR as DOC247_REPIN_SUCCESSOR, VERDICT_SOURCES as DOC247_VERDICT_SOURCES, authenticateReceiptWave as authenticateHistoricalReceiptWave, buildReceiptWave as buildHistoricalReceiptWave, materializeReceiptWaveContract } from '../.omo/private/seoul-migration/doc247-receipt-wave-20261019/materialize.mjs'
import { validatorPredecessorReader } from './seoul-census.mjs'
import { stationCatalogPredecessorReader } from './station-catalog-scope-successor.mjs'
import { reviewWordingPredecessorReader } from './review-wording-successor.mjs'
import { k176PredecessorReader } from './k176-label-successor.mjs'
import { climateLinkPredecessorReader } from './climate-link-successor.mjs'
import { timelineWharfPredecessorReader } from './timeline-wharf-successor.mjs'
import { BATCH_ID as DOC247_FINAL_BATCH_ID, COHORT_PATH as DOC247_FINAL_COHORT_PATH, RECEIPTS_PATH as DOC247_FINAL_RECEIPTS_PATH,
  REGION_HASHES as DOC247_FINAL_REGION_HASHES, REGION_REVIEW as DOC247_FINAL_REGION_REVIEW,
  SUCCESSOR_PATH as DOC247_FINAL_SUCCESSOR_PATH, TECHNICAL_REVIEW_PATH as DOC247_FINAL_TECHNICAL_REVIEW_PATH,
  authenticateFinalClosure, buildFinalClosure, materializeFinalClosureContract } from '../.omo/private/seoul-migration/doc247-final-closure-20261019/materialize.mjs'

const sourcePath = 'lore/current.json'
const sealedPath = 'vendor/issued-history/old.json'
const sourceBody = '{"id":"current","ko":"서울","en":"Seoul"}\n'
const sealedBody = '{"id":"sealed"}\n'
const boundary = { path: 'boundary.json', sha256: sha256('independent boundary fixture'), edition: 'fixture-2026' }
const districtRefs = ['gu:A', 'gu:B']
const dongRefs = Array.from({ length: 7 }, (_, index) => `dong:${index + 1}`)
const code = result => result.errors[0]?.code
const clone = structuredClone

async function historicalReceiptReader(root, reader = readFile) {
  reader = await validatorPredecessorReader(root, reader)
  reader = await stationCatalogPredecessorReader(root, reader)
  reader = await reviewWordingPredecessorReader(root, reader)
  reader = await k176PredecessorReader(root, reader)
  const timeline = await timelineWharfPredecessorReader(root, readFile)
  const source = resolve(root, 'lore/chronology/Scenario-Timeline.json')
  return path => resolve(path) === source ? timeline(path) : reader(path)
}
const buildReceiptWave = async (root, options = {}) => buildHistoricalReceiptWave(root,
  { ...options, readBytes: await historicalReceiptReader(root, options.readBytes) })
const authenticateReceiptWave = async (root, options = {}) => authenticateHistoricalReceiptWave(root,
  { ...options, readBytes: await historicalReceiptReader(root, options.readBytes) })

test('complete new-source inventory has only the exact excluded issuer helper and authenticated dress registration', async () => {
  const { readdir } = await import('node:fs/promises')
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baselineBytes = await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json'))
  const baseline = JSON.parse(baselineBytes)
  const originalPeople = JSON.stringify(baseline.currentEntitySets)
  const known = new Set(baseline.files.map(row => row.path))
  const metadata = new Set(['lore/regions/seoul-electoral-titles.json', 'lore/editorial/Seoul-Scope-Contract.json',
    'lore/editorial/Seoul-Relocation-Ledger.json', 'lore/editorial/Seoul-Narrative-Review.json',
    'lore/editorial/seoul-narrative-census-events.json', 'lore/Research-Sources.json'])
  const added = []
  async function visit(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      const path = directory + '/' + entry.name
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile() && !known.has(path) && !metadata.has(path)) added.push(path)
    }
  }
  for (const directory of ['lore', 'docs', 'scripts/data', 'snapshots/build-inputs', 'vendor/issued-history']) await visit(directory)
  assert.deepEqual(added.sort(), [NATIONAL_DRESS_PATH, TECHNICAL_DOCUMENT.sourcePath, 'docs/wiki-cast-sqlite-plan.md'].sort())
  const { authenticateMainDocAdmission } = await import('./main-doc-admission-successor.mjs')
  const mainDocs = await authenticateMainDocAdmission(root, baseline)
  assert.ok(mainDocs.some(admission => admission.row.sourcePath === 'docs/wiki-cast-sqlite-plan.md'
    && admission.row.status === 'excluded' && admission.row.reviewReceipt === null))
  const dress = await authenticateNationalDressAdmission(root, baseline)
  assert.equal(dress.row.status, 'excluded')
  const sourceHashes = { [TECHNICAL_DOCUMENT.sourcePath]: sha256(await readFile(resolve(root, TECHNICAL_DOCUMENT.sourcePath))) }
  assert.deepEqual(validateTechnicalDocumentCoverage({ technicalDocuments: [TECHNICAL_DOCUMENT] }, sourceHashes), [TECHNICAL_DOCUMENT])
  for (const field of ['currentSha256', 'status', 'reviewReceipt', 'batchId', 'basis']) {
    const forged = clone(TECHNICAL_DOCUMENT); forged[field] = 'forged'
    assert.throws(() => validateTechnicalDocumentCoverage({ technicalDocuments: [forged] }, sourceHashes), { code: 'E_REVIEW_HASH' })
  }
  assert.throws(() => validateTechnicalDocumentCoverage({ technicalDocuments: [TECHNICAL_DOCUMENT, TECHNICAL_DOCUMENT] }, sourceHashes), { code: 'E_REVIEW_HASH' })
  assert.equal(JSON.stringify(baseline.currentEntitySets), originalPeople)
  assert.deepEqual(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')), baselineBytes)
})

test('technical excluded tooling refresh preserves absent batches and authenticates every existing proposal reference', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const document = contract.documents.find(row => row.sourcePath === 'lore/name-pools/issue-person-ids.mjs')
  const before = '823ddd506e15b3bd70ee1b1343f0980b38fab756c0567ca4ebb76eb861124c80'
  const after = '224dedd3b4eb709fd270ccc515e68f7a118ef6d96ed6eef81b0f6eb1a64a4651'
  assert.equal(document.status, 'excluded')
  assert.equal(document.batchId, 'doc247-excluded-documents-20261019')
  const absent = clone(document)
  refreshTechnicalExcludedDocument(absent, [], before, after)
  assert.equal(absent.status, 'excluded'); assert.equal(absent.reviewReceipt, null)
  assert.ok(absent.basis.includes(after))
  const batches = ['owner', 'chained'].map(id => {
    const proposal = { entities: [], documents: [clone(document)], dispositions: [], geography: null }
    return { id, proposal, approval: { bodySha256: proposalHash(proposal) } }
  })
  const refreshed = clone(document)
  refreshTechnicalExcludedDocument(refreshed, batches, before, after)
  const once = JSON.stringify({ refreshed, batches })
  refreshTechnicalExcludedDocument(refreshed, batches, before, after)
  assert.equal(JSON.stringify({ refreshed, batches }), once)
  for (const batch of batches) {
    assert.equal(batch.approval.bodySha256, proposalHash(batch.proposal))
    assert.ok(batch.proposal.documents[0].basis.includes(after))
  }
  for (const kind of ['hash', 'source']) {
    const forged = clone(batches)
    if (kind === 'hash') forged[1].approval.bodySha256 = '0'.repeat(64)
    else {
      forged[1].proposal.documents[0].basis = forged[1].proposal.documents[0].basis.replace(after, '0'.repeat(64))
      forged[1].approval.bodySha256 = proposalHash(forged[1].proposal)
    }
    assert.throws(() => refreshTechnicalExcludedDocument(clone(document), forged, before, after), { code: 'E_REVIEW_HASH', id: 'chained' })
  }
})

test('doc247 final closure authenticates 24 reviewed and 2 technical receipts', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const closure = await authenticateFinalClosure(root, { contract, readBytes: readFile })
  assert.deepEqual(closure.receipts.counts, { receipts: 26, regions: 24, technical: 2 })
  assert.equal(closure.successor.transitions.length, 25)
  assert.equal(closure.technicalReview.documents.find(row => row.sourcePath === 'lore/name-pools/gurps-cast.json')?.verdict, 'TECHNICAL')
  assert.equal(closure.cohortAfter.baselineRegistrySha256, sha256(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json'))))
})

test('doc247 final closure rejects a forged region review', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, DOC247_FINAL_REGION_REVIEW.path)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(buildFinalClosure(root, { readBytes: reader }),
    { code: 'E_PUBLICATION_REVIEW_AUTHORITY', path: DOC247_FINAL_REGION_REVIEW.path })
})

test('doc247 final closure rejects a wrong reviewed document hash', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, 'lore/regions/content/11230.json')
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(buildFinalClosure(root, { readBytes: reader }),
    { code: 'E_REVIEW_HASH', path: 'lore/regions/content/11230.json' })
})

test('doc247 final closure materialization is idempotent', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const closure = await buildFinalClosure(root, { contract, readBytes: readFile })
  const once = materializeFinalClosureContract(contract, closure)
  const twice = materializeFinalClosureContract(once, closure)
  assert.deepEqual(twice, once)
  assert.equal(once.documents.filter(row => row.batchId === DOC247_FINAL_BATCH_ID).length, 26)
  assert.equal(once.documents.filter(row => row.status === 'pending').length, 0)
})

for (const binding of [DOC247_FINAL_REGION_HASHES, { path: DOC247_FINAL_SUCCESSOR_PATH },
  { path: DOC247_FINAL_TECHNICAL_REVIEW_PATH }, { path: DOC247_FINAL_RECEIPTS_PATH }]) {
  test(`doc247 final closure rejects tampered ${binding.path}`, async () => {
    const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
    const target = resolve(root, binding.path)
    const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
    const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
    await assert.rejects(authenticateFinalClosure(root, { contract, readBytes: reader }),
      { code: /E_PUBLICATION_REVIEW_AUTHORITY/ })
  })
}

test('primed applied-batch final closure reauthenticates every artifact and region authority per reader', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  await loadAppliedBatches(readFile, root)
  for (const binding of [DOC247_FINAL_REGION_REVIEW, DOC247_FINAL_REGION_HASHES,
    { path: DOC247_FINAL_SUCCESSOR_PATH }, { path: DOC247_FINAL_TECHNICAL_REVIEW_PATH },
    { path: DOC247_FINAL_RECEIPTS_PATH }]) {
    const target = resolve(root, binding.path)
    const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
    await assert.rejects(loadAppliedBatches(reader, root), {
      code: /E_PUBLICATION_REVIEW_AUTHORITY/,
    }, binding.path)
  }
})

test('applied-batch final closure reuse is invocation-local and concurrent readers remain isolated', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, DOC247_FINAL_SUCCESSOR_PATH)
  let reads = 0
  const genuine = async path => {
    if (path === target) reads += 1
    return readFile(path)
  }
  const forged = async path => path === target
    ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  const [accepted, rejected] = await Promise.allSettled([
    loadAppliedBatches(genuine, root), loadAppliedBatches(forged, root),
  ])
  assert.equal(accepted.status, 'fulfilled')
  const atlas = accepted.value.at(-1).sourceBeforeAfter.sources.find(row => row.sourcePath === 'lore/World-Narrative-Atlas.json')
  assert.equal(atlas.beforeSha256, 'ebb14a41baf48b45efd6bff7ca9bb97ff6a6f713fa18ddea4ff60fd5b4614f43')
  assert.equal(atlas.afterSha256, sha256(await readFile(resolve(root, atlas.sourcePath))))
  assert.equal(reads, 1)
  assert.equal(rejected.status, 'rejected')
  assert.equal(rejected.reason.code, 'E_PUBLICATION_REVIEW_AUTHORITY')
  assert.equal(rejected.reason.path, DOC247_FINAL_SUCCESSOR_PATH)
  await loadAppliedBatches(genuine, root)
  assert.equal(reads, 2)
})

test('doc247 receipt wave covers exactly 169 eligible and 26 pending rows', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const wave = await authenticateReceiptWave(root, { contract, readBytes: readFile })
  assert.deepEqual(wave.coverage.counts, { denominator: 195, eligible: 169, keptPending: 26, excluded: 13, preserved: 42 })
  assert.equal(wave.receiptBundle.documents.length, 169)
  assert.equal(wave.coverage.rows.filter(row => row.disposition === 'kept-pending').length, 26)
  for (const path of ['lore/World-Narrative-Atlas.json', 'lore/World-Relation-Ledger.json', 'lore/authoring.atlas.schema.json'])
    assert.equal(wave.coverage.rows.find(row => row.path === path)?.reason, 'atlas-known-world-fix-reviewed')
  assert.equal(wave.coverage.rows.find(row => row.path === 'lore/name-pools/gurps-cast.json')?.disposition, 'kept-pending')
  assert.equal(wave.coverage.rows.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')?.disposition, 'kept-pending')
  assert.equal(wave.coverage.rows.find(row => row.path === 'lore/editorial/Writing-Rules.md')?.reason, 'repin-successor-covered')
})

test('doc247 receipt wave rejects a wrong current document hash', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, 'docs/editorial/2026-09-26/martial-name-audit-and-revision.md')
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(buildReceiptWave(root, { readBytes: reader }), { code: 'E_REVIEW_HASH', path: 'docs/editorial/2026-09-26/martial-name-audit-and-revision.md' })
})

test('doc247 receipt wave rejects a forged verdict source', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, DOC247_VERDICT_SOURCES[0].path)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(buildReceiptWave(root, { readBytes: reader }), { code: 'E_PUBLICATION_REVIEW_AUTHORITY', path: DOC247_VERDICT_SOURCES[0].path })
})

test('doc247 receipt wave materialization is idempotent', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const wave = await buildReceiptWave(root, { contract, readBytes: readFile })
  const once = materializeReceiptWaveContract(contract, wave)
  const twice = materializeReceiptWaveContract(once, wave)
  assert.deepEqual(twice, once)
  assert.equal(once.documents.filter(row => row.batchId === DOC247_RECEIPT_WAVE_BATCH_ID).length, 169)
})

test('doc247 receipt wave cannot activate a non-eligible row', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const wave = await buildReceiptWave(root, { contract, readBytes: readFile })
  const pending = wave.coverage.rows.find(row => row.path === 'lore/World-Narrative-Atlas.json')
  wave.receiptBundle.documents.push({ path: pending.path, currentSha256: pending.currentSha256,
    verdictSource: { path: pending.verdictSource, sha256: pending.verdictSourceSha256, rowPointer: pending.rowPointer }, verdict: pending.verdict })
  assert.throws(() => materializeReceiptWaveContract(contract, wave), { code: 'E_REVIEW_COVERAGE' })
})

for (const binding of [...DOC247_VERDICT_SOURCES, DOC247_FIX_CONFIRMATION, DOC247_REPIN_SUCCESSOR,
  { path: DOC247_RECEIPT_WAVE_COVERAGE_PATH }, { path: DOC247_RECEIPT_WAVE_RECEIPTS_PATH }]) {
  test(`doc247 receipt wave rejects tampered ${binding.path}`, async () => {
    const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
    const target = resolve(root, binding.path)
    const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
    const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
    await assert.rejects(authenticateReceiptWave(root, { contract, readBytes: reader }), { code: /E_PUBLICATION_REVIEW_AUTHORITY/ })
  })
}

test('registry109 retains the archived 99-batch exact source-chain prefix', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const batches = await loadAppliedBatches(readFile, root)
  // Approved projection-refresh and doc247-atlas successors append to the immutable 109 prefix.
  assert.equal(batches.length, 111)
  assert.deepEqual(batches.slice(109).map(row => row.batchId), ['atlas-projection-refresh-successor-33', 'doc247-atlas-known-world-successor-20261019'])
  assert.equal(batches[75].batchId, 'publication-v4-two-source-application-32')
  assert.deepEqual(batches[75].sourceBeforeAfter.sources.map(row => row.sourcePath), [
    'lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json',
  ])
  assert.equal(batches[76].batchId, 's01-reviewed-source-application-115')
  assert.deepEqual(batches[76].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/characters/Cast-State-01.json'])
  assert.equal(batches[77].batchId, 'core-four-reviewed-source-application-39')
  assert.deepEqual(batches[77].sourceBeforeAfter.sources.map(row => row.sourcePath), [
    'lore/characters/Core-Characters.json', 'lore/characters/Cast-State-03.json',
    'lore/characters/Cast-State-08.json', 'lore/characters/Cast-State-14.json',
    'lore/characters/Cast-State-15.json',
  ])
  assert.equal(batches[78].batchId, 'atlas-v5-reviewed-source-application-1365')
  assert.deepEqual(batches[78].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/World-Narrative-Atlas.json'])
  assert.equal(batches[78].sourceBeforeAfter.sources[0].afterSha256, 'c5bb0c8263e8723857e3b10653789929abac87ab592bd4771266b375898d0596')
  assert.equal(batches[79].batchId, 's02-reviewed-source-application-577')
  assert.equal(batches[79].personIds.length, 65)
  assert.deepEqual(batches[79].sourceBeforeAfter.sources.map(row => row.sourcePath), [
    'lore/characters/Cast-State-02.json', 'lore/factions/Diaspora-Corridors.json',
  ])
  assert.deepEqual(batches[79].sourceBeforeAfter.sources.map(row => row.afterSha256), [
    '2dd50da979a8b3f9d1f3a2123adc765a9e9d35eac2240f0e149aac187e3c33ea',
    'b2378f2b7324ba1502627c65d85a9f59bd6ddf8ed381d50425642eeb0ea2370d',
  ])
  assert.equal(batches[80].batchId, 's03-reviewed-source-application-922')
  assert.equal(batches[80].personIds.length, 66)
  assert.deepEqual(batches[80].sourceBeforeAfter.sources.map(row => row.sourcePath), [
    'lore/characters/Cast-State-03.json', 'lore/characters/Core-Characters.json',
  ])
  assert.deepEqual(batches[80].sourceBeforeAfter.sources.map(row => row.afterSha256), [
    '2a3792784ff9a0c0ed971cd1285a63b16b2b34231dab79f1731fac8df42da762',
    '586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46',
  ])
  assert.equal(batches[81].batchId, 'atlas82-groups-index-source-application-406')
  assert.deepEqual(batches[81].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/World-Narrative-Atlas.json'])
  assert.equal(batches[81].sourceBeforeAfter.sources[0].beforeSha256, batches[78].sourceBeforeAfter.sources[0].afterSha256)
  assert.equal(batches[81].sourceBeforeAfter.sources[0].afterSha256, 'e0629757dda584b773a4c4589c1c91be12efd2494ad3ba6cd3ba8ceb2263e8e7')
  assert.equal(batches[82].batchId, 'atlas83-four-track-source-application-334')
  assert.deepEqual(batches[82].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/World-Narrative-Atlas.json'])
  assert.equal(batches[82].sourceBeforeAfter.sources[0].beforeSha256, batches[81].sourceBeforeAfter.sources[0].afterSha256)
  assert.equal(batches[82].sourceBeforeAfter.sources[0].afterSha256, 'ebb14a41baf48b45efd6bff7ca9bb97ff6a6f713fa18ddea4ff60fd5b4614f43')
  assert.equal(batches[83].batchId, 'renderer-heading-code-successor-1')
  assert.deepEqual(batches[83].sourceBeforeAfter.sources.map(row => row.sourcePath), ['scripts/world-atlas-render.mjs'])
  assert.equal(batches[83].sourceBeforeAfter.sources[0].beforeSha256, 'ba0b7ca01576059d0943269d4a32ab8b97851e65c60a6c9a91acfec76e9bd8ee')
  assert.equal(batches[83].sourceBeforeAfter.sources[0].afterSha256, '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33')
  assert.equal(batches[84].batchId, 'style-v4-two-samples-source-application-19')
  assert.deepEqual(batches[84].personIds, [])
  assert.deepEqual(batches[84].sourceBeforeAfter.sources.map(row => row.afterSha256), [
    '5c12ee7082fa93b107b2aea0465a0eb996b79138d4ae7bffb951c0db1d90928b',
    '73f9c6067833e235c57abe494a654f37efca565f75502a9c073daf64d9ccc1b9',
  ])
  assert.equal(batches[85].batchId, 's06-v2-reviewed-source-application-932')
  assert.deepEqual(batches[85].personIds, [])
  assert.deepEqual(batches[85].sourceBeforeAfter.sources.map(row => row.afterSha256),
    ['93270e81963d51852616f42bae5bb72d8dc7e2942d79f1aaef4f0e3f93903adb'])
  assert.equal(batches[86].batchId, 's05-v2-reviewed-source-application-931')
  assert.equal(batches[87].batchId, 's04-v4-reviewed-source-application-644')
  assert.deepEqual(batches[87].sourceBeforeAfter.sources.map(row => row.afterSha256),
    ['cbc04cbb9623fdd7a2af24da671a49dbffb52a2b82cfc242178a0042b13e3974'])
  assert.equal(batches[88].batchId, 's08-v2-reviewed-source-application-475')
  assert.deepEqual(batches[88].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/characters/Cast-State-08.json'])
  assert.equal(batches[88].sourceBeforeAfter.sources[0].beforeSha256, '2b286b7f382b57fef344e0bd28d06b75fbfc00d4348e9d3359e81bda08fa61ca')
  assert.equal(batches[88].sourceBeforeAfter.sources[0].afterSha256, 'd83497eecd7002f20fcc72e1f15fca27399b29bceb61acb7a1bea254a4c5fa98')
  assert.equal(batches[89].batchId, 's07-v2-reviewed-source-application-766')
  assert.deepEqual(batches[89].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/characters/Cast-State-07.json'])
  assert.equal(batches[89].sourceBeforeAfter.sources[0].beforeSha256, '0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474')
  assert.equal(batches[89].sourceBeforeAfter.sources[0].afterSha256, 'a87e2da6d1ca0911ae244b1aab68ba1673bf5df2876aed76c4c7bb50133a3781')
  assert.equal(batches[90].batchId, 's09-v3-reviewed-source-application-617')
  assert.deepEqual(batches[90].sourceBeforeAfter.sources.map(row => row.sourcePath), ['lore/characters/Cast-State-09.json'])
  assert.equal(batches[90].sourceBeforeAfter.sources[0].beforeSha256, '74310bfc1bcd09ad8a5263f3506a83d01aed315e24ed0d6c67a7586b87cd14b7')
  assert.equal(batches[90].sourceBeforeAfter.sources[0].afterSha256, '4afe8de9a60eb61aaed5c1da19a2047c3ceca293ae5d886545a0790a88c9d624')
  assert.equal(batches[91].batchId, 'profile-two-reference-repair-source-successor-2')
  assert.deepEqual(batches[91].personIds, [])
  assert.equal(batches[92].batchId, 's11-reviewed-source-application-476')
  assert.deepEqual(batches[92].personIds, [])
  assert.deepEqual(batches[92].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/characters/Cast-State-11.json',
    beforeSha256: '0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9',
    beforeBytes: 457140,
    afterSha256: 'c49f05f15da3e64d9242e473db5cd6fd3136d6b92d41216e37ca4923e9159099',
    afterBytes: 311019,
  }])
  assert.equal(batches[93].batchId, 's10-reviewed-source-application-900')
  assert.deepEqual(batches[93].personIds, [])
  assert.deepEqual(batches[93].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/characters/Cast-State-10.json',
    beforeSha256: 'b4694e6f1e33adff1c1a0689a092aae7e82e904a79f2e7fbbe743f8d50051502',
    beforeBytes: 484578,
    afterSha256: '3c48806bbbf11efd9434b780fb0b337c57d7f50de8ca1588a02a5f03d90f616e',
    afterBytes: 458439,
  }])
  assert.equal(batches[94].batchId, 's13-reviewed-source-application-925')
  assert.deepEqual(batches[94].personIds, [])
  assert.deepEqual(batches[94].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/characters/Cast-State-13.json',
    beforeSha256: '3ad14dc5568713d7cf35e4f43a2e1b85aaab6094f4ce835501dc9bf9f58681df',
    beforeBytes: 487198,
    afterSha256: '8ef3cb0d386b5c9e3523e305e3a934cf1a45aed93edfcdf7425c2892c46a5ad7',
    afterBytes: 489235,
  }])
  assert.equal(batches[95].batchId, 's12-reviewed-source-application-928')
  assert.deepEqual(batches[95].personIds, [])
  assert.deepEqual(batches[95].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/characters/Cast-State-12.json',
    beforeSha256: '603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39',
    beforeBytes: 480070,
    afterSha256: '7b0135b25b4bee46bf224fb148477cf46d2379baa8575a5c9fcb99c1a912959b',
    afterBytes: 514331,
  }])
  assert.equal(batches[96].batchId, 's14-reviewed-source-application-682')
  assert.deepEqual(batches[96].personIds, [])
  assert.deepEqual(batches[96].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/characters/Cast-State-14.json',
    beforeSha256: 'e460476ea290655c345a6908e565406898d1f1f11ec76a43caa200572aa8b34a',
    beforeBytes: 469676,
    afterSha256: 'ee13436646edfee5c522bb709914090bf10cdb142635e333fe30465c4d276686',
    afterBytes: 500583,
  }, {
    sourcePath: 'lore/characters/Core-Characters.json',
    beforeSha256: '586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46',
    beforeBytes: 118973,
    afterSha256: '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96',
    afterBytes: 119071,
  }])
  assert.equal(batches[97].batchId, 'soul-assignments-evidence-rebind-source-successor-1')
  assert.deepEqual(batches[97].personIds, [])
  assert.deepEqual(batches[97].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/editorial/Soul-Assignments.json',
    beforeSha256: 'f0a1e5073356a46081fc89604a108d9d9ec51e9b243099aac1a1fe0698a43b7d',
    beforeBytes: 3211291,
    afterSha256: 'e56e9b40c1b22ec75f41f4ce5cb7495e280d074ad8429a693b45f89149969387',
    afterBytes: 3220173,
  }])
  assert.equal(batches[98].batchId, 'soul-batches-special-evidence-rebind-source-successor-1')
  assert.deepEqual(batches[98].personIds, [])
  assert.deepEqual(batches[98].sourceBeforeAfter.sources, [{
    sourcePath: 'lore/editorial/soul-batches/special.json',
    beforeSha256: '9037acf1b951d54a4eb6701a822a17a975ad0111312bc0e48a7ab7249f9c3dbb',
    beforeBytes: 152261,
    afterSha256: 'c6ee0569471f0bca3058391e3c7af2102d543cb25036ea7f8e3bb418aa5aaac6',
    afterBytes: 153250,
  }])
})

for (const relativePath of [
  'before-raw.json', 'input-pins.json', 'application-packet.json', 'source-before-after.json',
  '../atlas79-group-minimal-corrections-v2-20261016/independent-v5.json',
  '../atlas79-group-minimal-corrections-v2-20261016/final-composite-bindings-v5.json',
  ...['proposal.json', 'correction-v3.json', 'correction-v4.json',
    'index-confirmed-typos-v1.json', 'index-g25-g26-correction-v1.json',
    'index-subject-tense-correction-v1.json', 'index-remainder-correction-v1.json',
    'index-context-binding-v1.json'].map(name => `../atlas79-group-minimal-corrections-v2-20261016/${name}`),
  '../../../evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
  '../../../../scripts/world-atlas-render.mjs', '../../../../lore/World-Narrative-Atlas.json',
]) test(`Atlas 82 rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/atlas82-groups-index-source-application-20261016', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before-raw.json', 'application-packet.json', 'source-before-after.json',
  '../s03-reviewed-location-prose-candidate-v2-20261016/proposal.json',
  '../s03-reviewed-location-prose-candidate-v2-20261016/correction-v3.json',
  '../s03-reviewed-location-prose-candidate-v2-20261016/independent-v3.json',
  '../s03-reviewed-location-prose-candidate-v2-20261016/final-full-card-bindings-v3.json',
  '../s03-reviewed-location-prose-candidate-v2-20261016/operations-01.jsonl',
  '../../../evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
]) test(`S03 successor rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/s03-reviewed-source-application-20261016', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before-raw.json', 'application-packet.json', 'source-before-after.json',
  '../s02-reviewed-location-prose-candidate-20261015/proposal-v4.json',
  '../s02-reviewed-location-prose-candidate-20261015/correction-v5.json',
  '../s02-reviewed-location-prose-candidate-20261015/independent-v5.json',
  '../s02-reviewed-location-prose-candidate-20261015/final-full-card-bindings-v5.json',
  '../../../evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
]) test(`S02 successor rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/s02-reviewed-source-application-20261016', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before-raw.json', 'application-packet.json', 'source-before-after.json',
  '../atlas-current-causal-repair-v3-20261015/proposal.json',
  '../atlas-current-causal-repair-v3-20261015/correction-v4.json',
  '../atlas-current-causal-repair-v3-20261015/correction-v5.json',
  '../atlas-current-causal-repair-v3-20261015/independent-v5.json',
]) test(`Atlas v5 successor rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/atlas-v5-source-application-20261016', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before-raw.json', 'application-packet.json', 'source-before-after.json',
  '../core-four-cross-source-causal-candidate-20261015/proposal.json',
  '../core-four-cross-source-causal-candidate-20261015/correction-v2.json',
  '../core-four-cross-source-causal-candidate-20261015/independent-v2.json',
]) test(`Core four successor rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/core-four-reviewed-source-application-20261016', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before-raw.json', 'application-packet.json', 'source-before-after.json',
  '../s01-reviewed-location-prose-candidate-20261015/proposal-v2.json',
  '../s01-reviewed-location-prose-candidate-20261015/independent-v2.json',
  '../s01-reviewed-location-prose-candidate-20261015/independent-v2-pin-resolution.json',
]) test(`S01 successor rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/s01-reviewed-source-application-20261015', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH|E_ARCHIVE_HASH/ })
})

for (const relativePath of [
  'before/lore/ailments/Ailments.json',
  'before/lore/culture/Food-Culture.json',
  'application-packet.json',
  'source-before-after.json',
]) test(`publication v4 rejects tampered ${relativePath}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const target = resolve(root, '.omo/private/seoul-migration/publication-v4-source-application-20261015', relativePath)
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), { code: /E_REVIEW_HASH|E_APPROVAL_BATCH/ })
})

test('primed link-retarget cache still authenticates a different reader', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  await loadAppliedBatches(readFile, root)
  const target = resolve(root, '.omo/private/seoul-migration/publication-link-retarget-application-20261017/application-packet.json')
  const reader = async path => path === target ? Buffer.concat([await readFile(path), Buffer.from(' ')]) : readFile(path)
  await assert.rejects(loadAppliedBatches(reader, root), {
    code: 'E_REVIEW_HASH',
    path: '.omo/private/seoul-migration/publication-link-retarget-application-20261017/',
  })
})

function approve(batch) {
  const approval = (kind, bytes) => ({ kind, batchId: batch.id, bodySha256: bytes, messageRef: 'fixture:owner-message' })
  batch.approval = approval('batch-allocation', proposalHash(batch.proposal))
  batch.articleSample = { body: '# Article\n\nSeoul.\n', approval: null }
  batch.articleSample.approval = approval('article-style', sha256(batch.articleSample.body))
  batch.cardSample = { body: '# Card\n\nPerson.\n', approval: null }
  batch.cardSample.approval = approval('card-style', sha256(batch.cardSample.body))
}

function bindBatch(input, id = 'batch:a') {
  const { contract, geography } = input
  const batch = {
    id,
    proposal: clone({ entities: contract.entities.filter(row => row.batchId === id), documents: contract.documents.filter(row => row.batchId === id), dispositions: contract.dispositions.filter(row => row.batchId === id), geography }),
    approval: null, articleSample: null, cardSample: null,
    entityKeys: contract.entities.filter(row => row.batchId === id).map(row => `${row.kind}:${row.id}`),
    documentPaths: contract.documents.filter(row => row.batchId === id).map(row => row.sourcePath),
    dispositionKeys: contract.dispositions.filter(row => row.batchId === id).map(row => JSON.stringify([row.set, row.id])), dependencyBatchIds: [],
  }
  approve(batch)
  input.batches = input.batches.filter(row => row.id !== id).concat(batch)
}

function fixture() {
  // The expected IDs are declared independently of contract/current arrays.
  const expected = { persons: ['K001', 'K002'], titles: ['title:old'], holdings: ['holding:old'], grants: ['grant:old'], bindings: ['binding:old'],
    states: ['S01'], polities: ['polity:daejeon'], events: ['event:one'], relations: ['relation:one'], courts: ['court:one'] }
  const baseline = { schema: 'seoul-pre-edit-baseline.v1', immutable: true,
    currentEntitySets: clone(expected), identitySetHashes: Object.fromEntries(ENTITY_SETS.map(set => [set, sha256(JSON.stringify(expected[set]))])),
    files: [{ path: sourcePath, kind: 'authored-lore', sha256: sha256(sourceBody) }, { path: sealedPath, kind: 'sealed-history', sha256: sha256(sealedBody) }],
    archives: { 'phase-base.tar.gz': { path: 'archive.txt', sha256: sha256('archived fixture bytes\n') } },
  }
  const row = (kind, id, refs) => ({ kind, id, sourcePath, status: 'active', locationRefs: kind === 'person' ? refs : [], jurisdictionRefs: kind === 'person' ? [] : refs, basis: 'fixture reviewed allocation', batchId: 'batch:a' })
  const contract = { schema: 'seoul-scope.v1', baselineSha256: sha256(JSON.stringify(baseline)), boundarySource: clone(boundary),
    entities: [row('person', 'K001', ['dong:1']), row('person', 'K002', ['dong:2']), row('title', 'title:old', ['gu:A']), row('holding', 'holding:old', ['dong:3']),
      row('holding', 'grant:old', ['dong:4']), row('state', 'S01', ['gu:A']), row('state', 'polity:daejeon', ['gu:B']), row('event', 'event:one', ['dong:5'])],
    documents: [{ sourcePath, status: 'active', reviewReceipt: { currentSha256: sha256(sourceBody), evidencePath: '.omo/evidence/read.md', reviewedAt: '2026-10-13' }, batchId: 'batch:a', basis: 'fixture full review' },
      { sourcePath: sealedPath, status: 'preserved', reviewReceipt: null, batchId: null, basis: 'sealed archive' }],
    dispositions: ENTITY_SETS.flatMap(set => expected[set].map(id => ({ set, id, status: 'active', targetIds: [id], batchId: 'batch:a', basis: 'fixture retained identity' }))),
    rail: { stationRefs: ['station:a', 'station:b'], edgeRefs: ['edge:ab'] },
  }
  const title = (titleId, rank, parentTitleId, jurisdictionRefs) => ({ titleId, rank, parentTitleId, jurisdictionRefs, basis: 'fixture geography, not a grant' })
  const parts = dongRefs.map(dongId => ({ dongId, fragmentId: null, geometryRefs: [dongId] }))
  const geography = { sourceEdition: 'fixture-2026', kingdomStatus: 'approved', mapMinimumRank: 'county', mapTitleIds: ['county:a'], parentExceptions: [],
    titles: [title('empire:seoul', 'empire', null, districtRefs), title('kingdom:one', 'kingdom', 'empire:seoul', districtRefs),
      title('duchy:a', 'duchy', 'kingdom:one', ['gu:A']), title('duchy:b', 'duchy', 'kingdom:one', ['gu:B']), title('county:a', 'county', 'duchy:a', dongRefs),
      title('barony:1', 'barony', 'county:a', ['dong:1'])],
    countySlots: [{ countyTitleId: 'county:a', slots: parts.map(part => ({ slotId: `slot:${part.dongId}`, ...clone(part), sourceEdition: 'fixture-2026', holdingRefs: [], status: 'unassigned', holderPersonId: null })) }],
  }
  const input = { contract, baseline, baselineSha256: contract.baselineSha256, current: { entitySets: clone(expected), documentPaths: [sourcePath, sealedPath],
      rights: [{ id: 'holding:old', holderPersonId: 'K001', slotStatus: 'vassal' }, { id: 'grant:old', holderPersonId: 'K001', slotStatus: null }] },
    boundary: clone(boundary), archiveHashes: { 'phase-base.tar.gz': sha256('archived fixture bytes\n') }, sourceHashes: { [sourcePath]: sha256(sourceBody), [sealedPath]: sha256(sealedBody) },
    refs: [...dongRefs.map(id => ({ id, kind: 'region' })), ...districtRefs.map(id => ({ id, kind: 'district' })), ...['station:a', 'station:b'].map(id => ({ id, kind: 'station' }))]
      .map(row => ({ ...row, inside: true, boundarySha256: boundary.sha256 })).concat({ id: 'region:1111111111-outside', kind: 'region', inside: false, boundarySha256: boundary.sha256 }),
    edges: [{ id: 'edge:ab', a: 'station:a', b: 'station:b', inside: true, physical: true, boundarySha256: boundary.sha256 }],
    geography, facts: { sourceEdition: 'fixture-2026', counties: [{ titleId: 'county:a', districtRefs: ['gu:A'], parts }], districtRefs: clone(districtRefs), dongRefs: clone(dongRefs) }, batches: [],
    review: { originalKeys: [{ key: 'ko-original', batchId: 'batch:a' }, { key: 'en-original', batchId: 'batch:a' }],
      currentKeys: [{ key: 'ko-current', sha256: sha256('서울'), batchId: 'batch:a' }, { key: 'en-current', sha256: sha256('Seoul'), batchId: 'batch:a' }],
      receipts: [{ coveredKeys: ['ko-original', 'en-original'], currentHashes: [{ key: 'ko-current', sha256: sha256('서울') }, { key: 'en-current', sha256: sha256('Seoul') }], disposition: 'revised', batchId: 'batch:a', evidencePath: '.omo/evidence/review.md', reviewedAt: '2026-10-13' }] },
  }
  bindBatch(input)
  return input
}

test('current rights accept only closed source-selector digest bindings', () => {
  const input = fixture()
  input.current.rights[0].sourceRefs = { stationRef: sha256('source station selector') }
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  input.current.rights[0].sourceRefs.stationRef = { stationId: 'raw-selector' }
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_SHAPE')
  input.current.rights[0].sourceRefs = { arbitraryRef: sha256('forged selector kind') }
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_SHAPE')
})

test('current rights correspondence mappings require admitted source and target references', () => {
  const input = fixture()
  input.current.rights[0].referenceMappings = { [dongRefs[0]]: [dongRefs[1]] }
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  input.current.rights[0].referenceMappings[dongRefs[0]] = ['unknown-dong']
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_REF')
})

async function bibliographyReplacementFixture() {
  const input = fixture()
  const evidencePath = '.omo/private/seoul-migration/bibliography-authoring-transition-20261015.json'
  const reviewBody = await readFile(new URL('../' + evidencePath, import.meta.url), 'utf8')
  const receipt = JSON.parse(reviewBody)
  const row = { sourcePath: receipt.after.path, currentSha256: receipt.after.sha256,
    batchId: 'bibliography-json-authoring-transition', evidencePath, evidenceSha256: sha256(reviewBody), reviewBody }
  input.current.createdDocuments = [row]
  input.current.documentPaths.push(row.sourcePath)
  input.sourceHashes[row.sourcePath] = row.currentSha256
  return input
}

test('exact bibliography replacement retains creation proof and nine JSON aliases', async () => {
  const input = await bibliographyReplacementFixture()
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  // Independent document publication review is required before pending-state evaluation.
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
})

for (const mutation of ['unregistered', 'identity', 'anchor', 'hash', 'before', 'extra-document']) {
  test('exact bibliography replacement rejects ' + mutation, async () => {
    const input = await bibliographyReplacementFixture(); const row = input.current.createdDocuments[0]
    const receipt = JSON.parse(row.reviewBody)
    if (mutation === 'unregistered') row.batchId = 'unregistered-json-creation'
    if (mutation === 'identity') receipt.identity.id = 'DOC:Other'
    if (mutation === 'anchor') receipt.anchorMapping[0].targets[0].jsonPointer = '/content/3'
    if (mutation === 'hash') { row.currentSha256 = sha256('other'); input.sourceHashes[row.sourcePath] = row.currentSha256 }
    if (mutation === 'before') receipt.before.originalMarkdown += 'changed'
    if (mutation === 'extra-document') input.current.documentPaths.push('lore/Research-Sources.md')
    if (['identity', 'anchor', 'before'].includes(mutation)) { row.reviewBody = JSON.stringify(receipt); row.evidenceSha256 = sha256(row.reviewBody) }
    assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, false)
  })
}

function createdDocumentReview(input, eligiblePath) {
  const documents = input.current.documentPaths.map(path => ({ sourcePath: path, currentSha256: input.sourceHashes[path],
    classification: path === sealedPath ? 'sealed-history' : 'current-pending', eligible: false,
    reason: path === sealedPath ? 'sealed-history' : 'missing-authenticated-review', receipt: null }))
  Object.assign(documents.find(row => row.sourcePath === eligiblePath), { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review',
    receipt: { path: 'fixture-only-review.json', sha256: sha256('fixture-only review'), approvalRef: 'fixture-only:exact-review' } })
  return { schema: 'seoul-document-publication-eligibility.v1', semanticReview: 'not-reviewed', complete: false, documents }
}

test('only the authenticated JSON replacement may carry an eligible review row without a baseline scope row', async () => {
  const input = await bibliographyReplacementFixture()
  input.current.publicationReview = createdDocumentReview(input, 'lore/Research-Sources.json')
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_PUBLICATION_REVIEW_AUTHORITY')
  input.current.publicationReview.documents.find(row => row.sourcePath === 'lore/Research-Sources.json').currentSha256 = sha256('other')
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_REVIEW_HASH')
  const markdown = fixture()
  const evidencePath = '.omo/private/seoul-migration/wildlife-census-registration-20261015/review.json'
  const reviewBody = await readFile(new URL('../' + evidencePath, import.meta.url), 'utf8')
  const row = { sourcePath: 'lore/Research-Sources.md', currentSha256: '25d2e35d381da6393d4430b218280ba1a9393fbc91f238bdc27c131eeaa32ca6',
    batchId: 'wildlife-source-authoring', evidencePath, evidenceSha256: sha256(reviewBody), reviewBody }
  markdown.current.createdDocuments = [row]; markdown.current.documentPaths.push(row.sourcePath); markdown.sourceHashes[row.sourcePath] = row.currentSha256
  markdown.current.publicationReview = createdDocumentReview(markdown, 'lore/Research-Sources.md')
  assert.equal(code(validateSeoulScope(markdown, { mode: 'inspection' })), 'E_SCOPE_ADMISSION')
})

test('exact bibliography replacement preserves the original Markdown creation contract', async () => {
  const input = fixture()
  const evidencePath = '.omo/private/seoul-migration/wildlife-census-registration-20261015/review.json'
  const reviewBody = await readFile(new URL('../' + evidencePath, import.meta.url), 'utf8')
  const row = { sourcePath: 'lore/Research-Sources.md', currentSha256: '25d2e35d381da6393d4430b218280ba1a9393fbc91f238bdc27c131eeaa32ca6',
    batchId: 'wildlife-source-authoring', evidencePath, evidenceSha256: sha256(reviewBody), reviewBody }
  input.current.createdDocuments = [row]; input.current.documentPaths.push(row.sourcePath); input.sourceHashes[row.sourcePath] = row.currentSha256
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  row.evidenceSha256 = sha256('unapproved')
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, false)
})

function stagingFixture() {
  const input = fixture()
  const source = { id: 'official-membership', sha256: sha256('independent fixture membership'), role: 'statutory-electoral-membership' }
  const membership = {
    schema: 'seoul-constituency-membership.v1', geometryVerified: false,
    sources: [source, { id: 'candidate', sha256: boundary.sha256, role: 'candidate-only', officialAuthority: false }],
    editions: { electoral: { id: 'election', sourceRefs: [source.id] }, currentLaw: { id: 'law', sourceRefs: [source.id] },
      currentCorrespondence: { id: 'current', codeAndNameSourceRef: 'candidate' } },
    gu: [{ guId: 'gu:A', name: 'A', electoralDongCount: 1, currentCorrespondenceCount: 1, sourceRefs: [source.id] },
      { guId: 'gu:B', name: 'B', electoralDongCount: 1, currentCorrespondenceCount: 1, sourceRefs: [source.id] }],
    constituencies: [{ constituencyId: 'twoGu', name: 'Two gu county', jurisdictionGuRefs: ['gu:A', 'gu:B'], sourceEdition: 'election', sourceRefs: [source.id],
      membershipConfidence: 'primary-confirmed', geometryVerified: false,
      electoralDongs: ['A', 'B'].map((gu, i) => ({ guId: `gu:${gu}`, sourceName: `Dong ${i}`, electoralDongId: `electoral:${i}`, fragmentId: null,
        currentCorrespondences: [{ candidateAdminId: `${i}`, candidateName: `Dong ${i}`, sourceEdition: 'current', geometryVerified: false,
          codeConfidence: 'dated-candidate-name-code-match', membershipSourceRefs: [source.id] }], membershipSourceRefs: [source.id] })) }],
  }
  // Independent two-gu/two-dong denominator; never read it back from geography slots.
  const census = { schema: 'task-2-seoul-correspondence-census.v1',
    guCounts: [{ gu: 'A', guId: 'gu:A', electoralVintageDongs: 1, geometryRows: 1 }, { gu: 'B', guId: 'gu:B', electoralVintageDongs: 1, geometryRows: 1 }],
    constituencies: [{ name: 'Two gu county', correspondences: [
      { gu: 'A', officialDong: 'Dong 0', fragmentId: null, candidateAdminIds: ['0'], candidateNames: ['Dong 0'] },
      { gu: 'B', officialDong: 'Dong 1', fragmentId: null, candidateAdminIds: ['1'], candidateNames: ['Dong 1'] },
    ] }],
  }
  const right = (id, dong, pointer) => {
    const original = { id, adminRefs: [{ id: `region:${dong}` }] }
    return { original, source: { path: sourcePath, pointer, recordSha256: sha256(JSON.stringify(original)) }, audit: { category: 'direct-admin-property' } }
  }
  const rights = { schema: 'task-2-existing-rights-audit.v1', sources: [{ path: sourcePath, sha256: sha256(sourceBody) }],
    titles: [{ original: { id: 'title:old' } }], bindings: [{ original: { holdingId: 'old', titleId: 'old' } }],
    holdings: [right('holding:old', '0', '/holdings/0')], grants: [right('grant:old', '1', '/grants/0')],
    counties: [{ name: 'Two gu county', jurisdictionGuRefs: ['gu:A', 'gu:B'], dongs: [
      { dongId: 'region:0', officialElectoralDong: 'Dong 0', fragmentId: null, holdingRefs: ['holding:old'] },
      { dongId: 'region:1', officialElectoralDong: 'Dong 1', fragmentId: null, holdingRefs: ['grant:old'] },
    ] }],
  }
  const binding = JSON.stringify(['old', 'old'])
  input.baseline.currentEntitySets.bindings = [binding]
  input.baseline.identitySetHashes.bindings = sha256(JSON.stringify([binding]))
  input.current.entitySets.bindings = [binding]
  Object.assign(input.contract.dispositions.find(row => row.set === 'bindings'), { id: binding, targetIds: [binding] })
  input.baselineSha256 = input.contract.baselineSha256 = sha256(JSON.stringify(input.baseline))
  input.facts = { schema: STAGING_GEOGRAPHY_SCHEMA, sources: Object.fromEntries(Object.entries({ membership, census, rights }).map(([kind, data]) => {
    const body = JSON.stringify(data)
    return [kind, { path: `fixture:${kind}`, sha256: sha256(body), body }]
  })) }
  input.refs.push(...['region:0', 'region:1'].map(id => ({ id, kind: 'region', inside: true, boundarySha256: boundary.sha256 })))
  const geography = stagingGeography(input.facts, input.baseline, input.boundary)
  input.geography = geography
  bindBatch(input)
  return { ...input, geography }
}

test('staged two-gu county keeps independent membership, pending feudal parents and historical rights; only inspection admits it', () => {
  const input = stagingFixture()
  const before = clone(input)
  assert.deepEqual(validateSeoulScope(input, { mode: 'inspection' }), { ok: true, errors: [] })
  const county = input.geography.titles.find(t => t.rank === 'county')
  assert.deepEqual(county.jurisdictionRefs, ['gu:A', 'gu:B'])
  assert.equal(county.feudalParentTitleId, null)
  assert.equal(input.geography.titles.filter(t => t.rank === 'kingdom').length, 0)
  assert.equal(input.geography.countySlots[0].slots.length, 2)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
  assert.deepEqual(input, before)
  for (const row of input.contract.entities.filter(row => row.kind === 'holding')) Object.assign(row, { status: 'pending', batchId: null, basis: null })
  for (const row of input.contract.dispositions.filter(row => ['holdings', 'grants'].includes(row.set))) Object.assign(row, { status: 'pending', batchId: null, basis: null, targetIds: [] })
  input.current.rights = []
  bindBatch(input)
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
})

for (const [name, mutate, expected] of [
  ['invented empire superior', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:empire:seoul' }, 'E_SLOT_EDITION'],
  ['invented chosen duchy', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:duchy:gu:A' }, 'E_SLOT_EDITION'],
  ['missing geographic gu', i => { i.geography.titles.at(-1).jurisdictionRefs.pop() }, 'E_SLOT_COVERAGE'],
  ['invented kingdom proposal', i => { i.geography.kingdomStatus = 'proposed' }, 'E_SLOT_EDITION'],
  ['claimed official extent', i => { i.geography.officialExtentStatus = 'verified' }, 'E_SLOT_EDITION'],
  ['claimed geometry verification', i => { i.geography.countySlots[0].slots[0].geometryVerified = true }, 'E_SLOT_EDITION'],
  ['candidate promoted to geometry', i => { i.geography.countySlots[0].slots[0].geometryRefs = ['region:0'] }, 'E_SLOT_COVERAGE'],
  ['historical promoted to holding', i => { i.geography.countySlots[0].slots[0].holdingRefs = ['holding:old'] }, 'E_SLOT_COVERAGE'],
  ['invented holder', i => { i.geography.countySlots[0].slots[0].holderPersonId = 'K001' }, 'E_SLOT_EDITION'],
  ['unknown historical right', i => { i.geography.countySlots[0].slots[0].historicalHoldingRefs[0].id = 'missing' }, 'E_SLOT_EDITION'],
  ['stale historical hash', i => { i.geography.countySlots[0].slots[0].historicalHoldingRefs[0].recordSha256 = sha256('stale') }, 'E_SLOT_EDITION'],
  ['unknown membership source', i => { i.geography.titles.at(-1).sourceRefs[0] = 'missing' }, 'E_SLOT_EDITION'],
  ['unknown edition', i => { i.geography.countySlots[0].slots[0].sourceEdition = 'missing' }, 'E_SLOT_EDITION'],
  ['wrong source pointer', i => { i.geography.countySlots[0].slots[0].sourcePointer = '/missing' }, 'E_SLOT_EDITION'],
  ['untyped metadata', i => { i.geography.approved = true }, 'E_SCOPE_SHAPE'],
  ['stale independent input', i => { i.facts.sources.census.body += ' ' }, 'E_SLOT_EDITION'],
  ['missing independent right', i => { i.baseline.currentEntitySets.holdings = []; i.baseline.identitySetHashes.holdings = sha256('[]') }, 'E_CENSUS_RIGHT'],
  ['missing candidate reference', i => { i.refs = i.refs.filter(r => r.id !== 'region:0') }, 'E_SCOPE_REF'],
]) test(`staging rejects ${name}`, () => {
  const input = stagingFixture()
  mutate(input)
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), expected)
})

test('staging checks membership against the independently retained census, not its own slot assignments', () => {
  const input = stagingFixture()
  const source = input.facts.sources.membership
  const changed = JSON.parse(source.body)
  changed.constituencies[0].electoralDongs[0].currentCorrespondences[0].candidateAdminId = 'invented'
  source.body = JSON.stringify(changed); source.sha256 = sha256(source.body)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SLOT_COVERAGE')
})

function spatialFixture() {
  const input = stagingFixture()
  const membership = JSON.parse(input.facts.sources.membership.body)
  const spatial = {
    schema: 'seoul-sgis-spatial-edition.v1', edition: 'sgis-20250630', baseDate: '2025-06-30',
    authority: 'official-SGIS-statistical-boundary', legalSurveyCertification: false, current2026Geometry: false,
    membership: { sha256: input.facts.sources.membership.sha256 }, archive: { sha256: sha256('official fixture archive') },
    geometry: { path: 'official.json', sha256: sha256('official fixture geometry'), crs: 'OGC:CRS84' },
    gu: [{ guId: 'gu:A' }, { guId: 'gu:B' }],
    dongs: [{ electoralDongId: 'electoral:0', dongId: 'region:0', guId: 'gu:A', officialName: 'Dong 0', officialCode: '0',
      geometryId: 'official:0', countyTitleId: 'geography:county:twoGu' },
    { electoralDongId: 'electoral:1', dongId: 'region:1', guId: 'gu:B', officialName: 'Dong 1', officialCode: '1',
      geometryId: 'official:1', countyTitleId: 'geography:county:twoGu' }],
    counties: [{ geometryId: 'geography:county:twoGu', jurisdictionGuRefs: ['gu:A', 'gu:B'], officialDongCodes: ['0', '1'] }],
  }
  assert.equal(membership.constituencies[0].electoralDongs.length, 2)
  const body = JSON.stringify(spatial)
  input.facts.sources.spatial = { path: 'fixture:spatial', sha256: sha256(body), body }
  input.geography = stagingGeography(input.facts, input.baseline, input.boundary)
  bindBatch(input)
  return input
}

test('pinned spatial slots preserve current correspondence rights and pending two-gu parent without publication admission', () => {
  const input = spatialFixture()
  const before = clone(input)
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  assert.equal(input.geography.countySlots.length, 1)
  assert.deepEqual(input.geography.currentCorrespondenceSlots, stagingFixture().geography.countySlots)
  const slot = input.geography.countySlots[0].slots[0]
  assert.equal(slot.sourceEdition, 'sgis-20250630')
  assert.equal(slot.geometryVerified, true)
  assert.deepEqual(slot.historicalHoldingRefs, [])
  assert.deepEqual(slot.holdingRefs, [])
  assert.equal(slot.holderPersonId, null)
  assert.equal(input.geography.titles.at(-1).feudalParentTitleId, null)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
  assert.deepEqual(input, before)
})

for (const [name, mutate, expected] of [
  ['missing spatial slot', i => i.geography.countySlots[0].slots.pop(), 'E_SLOT_COVERAGE'],
  ['missing retained current right', i => i.geography.currentCorrespondenceSlots[0].slots[0].historicalHoldingRefs.pop(), 'E_SLOT_COVERAGE'],
  ['current derivative promoted', i => { i.geography.countySlots[0].slots[0].geometryRefs[0] = 'region:0' }, 'E_SLOT_EDITION'],
  ['new spatial grant', i => { i.geography.countySlots[0].slots[0].holdingRefs.push('holding:old') }, 'E_SLOT_COVERAGE'],
  ['invented spatial parent', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:empire:seoul' }, 'E_SLOT_EDITION'],
  ['stale spatial body', i => { i.facts.sources.spatial.body += ' ' }, 'E_SLOT_EDITION'],
]) test(`official spatial staging rejects ${name}`, () => {
  const input = spatialFixture()
  mutate(input); bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), expected)
})

test('independent spatial edition cannot omit or reassign an electoral dong', () => {
  for (const mutate of [s => s.dongs.pop(), s => { s.dongs[0].countyTitleId = 'wrong' }]) {
    const input = spatialFixture()
    const spatial = JSON.parse(input.facts.sources.spatial.body)
    mutate(spatial)
    const body = JSON.stringify(spatial)
    input.facts.sources.spatial = { path: 'fixture:spatial', sha256: sha256(body), body }
    assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), spatial.dongs.length === 1 ? 'E_SLOT_COVERAGE' : 'E_SLOT_EDITION')
  }
})

test('retained real spatial edition uses old Yongsin while preserving both current stable slots and source hashes', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const load = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
  const membership = await load('data/geography/elections/sources/seoul-constituency-membership.json')
  const spatial = await load('data/geography/elections/sources/seoul-sgis-20250630.json')
  const geography = await load('lore/regions/seoul-electoral-titles.json')
  const officialSlots = geography.countySlots.flatMap(c => c.slots)
  const currentSlots = geography.currentCorrespondenceSlots.flatMap(c => c.slots)
  assert.equal(officialSlots.length, spatial.dongs.length)
  assert.equal(currentSlots.length, membership.constituencies.flatMap(c => c.electoralDongs.flatMap(d => d.currentCorrespondences)).length)
  assert.equal(currentSlots.length, officialSlots.length + 1)
  const yongsin = officialSlots.find(s => s.name === '용신동')
  assert.equal(yongsin.electoralDongId, 'electoral-dong:22:11230:용신동')
  assert.deepEqual(yongsin.currentCorrespondenceSlotIds, ['slot:region:1123051500', 'slot:region:1123053300'])
  assert.deepEqual(yongsin.geometryRefs, ['sgis:20250630:dong:11060810'])
  for (const id of yongsin.currentCorrespondenceSlotIds) assert.ok(currentSlots.some(s => s.slotId === id && s.geometryVerified === false))
  assert.ok(officialSlots.every(s => s.holderPersonId === null && s.holdingRefs.length === 0 && s.historicalHoldingRefs.length === 0))
  assert.equal(sha256(await readFile(resolve(root, spatial.geometry.path))), spatial.geometry.sha256)
  assert.equal(sha256(await readFile(resolve(root, geography.evidence.spatial.path))), geography.evidence.spatial.sha256)
})

async function kingdomFixture() {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const bytes = new Map()
  const paths = [TASK2_BINDING.geography.path, KINGDOM_SUCCESSOR_BINDING.beforeArchivePath,
    KINGDOM_SUCCESSOR_BINDING.proposal.path, KINGDOM_SUCCESSOR_BINDING.approval.path,
    '.omo/private/seoul-migration/kingdom-partition-6/application-receipt.json',
    '.omo/evidence/seoul-lock/kingdom-partition-independent-20261015.md',
    '.omo/private/seoul-migration/baseline.json', ...Object.values(STAGING_SOURCES).map(s => s.path)]
  for (const path of paths) bytes.set(resolve(root, path), await readFile(resolve(root, path)))
  const geography = JSON.parse(bytes.get(resolve(root, TASK2_BINDING.geography.path)))
  const approval = JSON.parse(bytes.get(resolve(root, KINGDOM_SUCCESSOR_BINDING.approval.path)))
  for (const path of [approval.evidenceFile.path, geography.spatialSource.geometry.path]) bytes.set(resolve(root, path), await readFile(resolve(root, path)))
  const baseline = JSON.parse(bytes.get(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const boundary = { sha256: JSON.parse(bytes.get(resolve(root, STAGING_SOURCES.membership.path))).sources
    .find(s => s.id === 'admdongkor-20260701-candidate-lookup').sha256 }
  const facts = { schema: STAGING_GEOGRAPHY_SCHEMA, sources: Object.fromEntries(Object.entries(STAGING_SOURCES)
    .map(([kind, source]) => [kind, { ...source, body: bytes.get(resolve(root, source.path)).toString() }])) }
  const refs = geography.currentCorrespondenceSlots.flatMap(c => c.slots).map(s => ({ id: s.dongId, kind: 'region', inside: true, boundarySha256: boundary.sha256 }))
  const originalBytes = gunzipSync(Buffer.from(bytes.get(resolve(root, KINGDOM_SUCCESSOR_BINDING.beforeArchivePath)).toString().trim(), 'base64'))
  return { root, bytes, geography, originalBytes, facts, input: { baseline, boundary, refs }, readBytes: async path => {
    assert.ok(bytes.has(path), `Unexpected dependency: ${path}`)
    return bytes.get(path)
  } }
}

test('authenticated six-kingdom successor preserves Task 2 proof, dated slots and the private stage', async () => {
  const f = await kingdomFixture()
  const before = JSON.parse(f.originalBytes)
  assert.equal(sha256(f.originalBytes), TASK2_BINDING.geography.sha256)
  assert.deepEqual(stagingGeography(f.facts, f.input.baseline, f.input.boundary), before)
  const result = await loadTask2Geography(f.root, f.readBytes)
  assert.equal(result.binding.geography.sha256, TASK2_BINDING.geography.sha256)
  assert.equal(result.binding.successor.geography.sha256, sha256(f.bytes.get(resolve(f.root, TASK2_BINDING.geography.path))))
  assert.equal(checkStagingGeography(f.geography, f.facts, f.input, 'inspection'), null)
  for (const mode of ['publication', 'migration']) assert.equal(checkStagingGeography(f.geography, f.facts, f.input, mode).geography.kingdomStatus, 'approved')
  assert.deepEqual(f.geography.countySlots, before.countySlots)
  assert.deepEqual(f.geography.currentCorrespondenceSlots, before.currentCorrespondenceSlots)
  assert.deepEqual(f.geography.titles.filter(t => t.rank === 'kingdom').map(k => [k.jurisdictionRefs.length, k.countyTitleIds.length]), [[4, 4], [6, 12], [3, 6], [3, 7], [4, 7], [5, 12]])
  assert.equal(f.geography.countySlots.flatMap(c => c.slots).length, 426)
  assert.equal(f.geography.currentCorrespondenceSlots.flatMap(c => c.slots).length, 427)
  assert.equal(f.geography.titles.length, 80)
  assert.deepEqual(f.geography.mapTitleIds, f.geography.titles.map(t => t.titleId))
  assert.equal(f.geography.mapMinimumRank, 'county')
  const cross = f.geography.titles.find(t => t.rank === 'county' && t.jurisdictionRefs.length > 1)
  assert.equal(cross.feudalParentTitleId, 'geography:empire:seoul')
  assert.equal(cross.geographicParentException, 'cross-district-empire-direct')
  assert.ok(f.geography.titles.find(t => t.titleId === 'geography:kingdom:seoul:01').countyTitleIds.includes(cross.titleId))
  for (const kingdom of f.geography.titles.filter(t => t.rank === 'kingdom')) {
    assert.equal(kingdom.feudalParentTitleId, 'geography:empire:seoul')
    assert.equal(kingdom.holderPersonId, null)
    for (const gu of kingdom.jurisdictionRefs) assert.equal(f.geography.titles.find(t => t.titleId === `geography:duchy:${gu}`).feudalParentTitleId, kingdom.titleId)
  }
  f.bytes.set(resolve(f.root, TASK2_BINDING.geography.path), f.originalBytes)
  const historical = await loadTask2Geography(f.root, f.readBytes)
  assert.equal(historical.binding.successor, undefined)
  assert.deepEqual(historical.geography, before)
})

for (const [name, mutate, expected] of [
  ['altered partition even with a recomputed hash', g => { g.successor.partition[0].jurisdictionRefs[0] = '11215'; g.successor.partitionSha256 = sha256(JSON.stringify(g.successor.partition)) }, 'E_KINGDOM_PARTITION'],
  ['altered duchy parent', g => { g.titles[1].feudalParentTitleId = 'geography:kingdom:seoul:06' }, 'E_REVIEW_HASH'],
  ['cross-district county assigned to one duchy', g => { g.titles.find(t => t.rank === 'county' && t.jurisdictionRefs.length > 1).feudalParentTitleId = 'geography:duchy:11140' }, 'E_REVIEW_HASH'],
  ['altered empire parent', g => { g.titles[0].feudalParentTitleId = 'geography:kingdom:seoul:01' }, 'E_REVIEW_HASH'],
  ['altered historical hash', g => { g.successor.previousSha256 = sha256('replacement history') }, 'E_APPROVAL_BATCH'],
  ['unapproved successor', g => { g.successor.batchId = 'unapproved' }, 'E_APPROVAL_BATCH'],
  ['successor omitted', g => { delete g.successor }, 'E_REVIEW_HASH'],
  ['new kingdom holder', g => { g.titles.at(-1).holderPersonId = 'K001' }, 'E_REVIEW_HASH'],
  ['slot silently reassigned', g => { g.countySlots[0].slots[0].holderPersonId = 'K001' }, 'E_REVIEW_HASH'],
  ['map title omitted', g => { g.mapTitleIds.pop() }, 'E_REVIEW_HASH'],
  ['inspection promoted to publication', g => { g.status = 'active' }, 'E_REVIEW_HASH'],
]) test(`kingdom successor rejects ${name}`, async () => {
  const f = await kingdomFixture()
  mutate(f.geography)
  f.bytes.set(resolve(f.root, TASK2_BINDING.geography.path), Buffer.from(JSON.stringify(f.geography, null, 2) + '\n'))
  await assert.rejects(loadTask2Geography(f.root, f.readBytes), { code: expected })
  assert.throws(() => checkStagingGeography(f.geography, f.facts, f.input, 'inspection'))
  assert.throws(() => checkStagingGeography(f.geography, f.facts, f.input, 'publication'))
})

for (const [name, path, mutate, expected] of [
  ['proposal bytes', KINGDOM_SUCCESSOR_BINDING.proposal.path, b => Buffer.concat([b, Buffer.from(' ')]), 'E_APPROVAL_BATCH'],
  ['owner approval removal', KINGDOM_SUCCESSOR_BINDING.approval.path, b => { const a = JSON.parse(b); a.approvals = a.approvals.filter(r => r.batchId !== 'kingdom-partition-6'); return Buffer.from(JSON.stringify(a)) }, 'E_APPROVAL_BATCH'],
  ['owner evidence bytes', '.omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md', b => Buffer.concat([b, Buffer.from(' ')]), 'E_APPROVAL_BATCH'],
  ['valid gzip with altered historical bytes', KINGDOM_SUCCESSOR_BINDING.beforeArchivePath, () => Buffer.from(gzipSync(Buffer.from('{}\n')).toString('base64')), 'E_ARCHIVE_HASH'],
]) test(`kingdom successor authenticates ${name}`, async () => {
  const f = await kingdomFixture()
  const full = resolve(f.root, path)
  f.bytes.set(full, mutate(f.bytes.get(full)))
  await assert.rejects(loadTask2Geography(f.root, f.readBytes), { code: expected })
})

test('authenticated six-kingdom successor projects one exact publication geography outside inspection', async () => {
  const f = await kingdomFixture()
  const recomputed = approvedKingdomGeography(stagingGeography(f.facts, f.input.baseline, f.input.boundary), f.geography.successor)
  const publication = publicationGeography(recomputed)
  for (const mode of ['publication', 'migration']) assert.deepEqual(checkStagingGeography(f.geography, f.facts, f.input, mode), publication)
  assert.deepEqual(publicationGeography(f.geography), publication)
  const { geography, facts } = publication
  assert.deepEqual(Object.keys(geography), ['sourceEdition', 'titles', 'countySlots', 'kingdomStatus', 'mapMinimumRank', 'mapTitleIds', 'parentExceptions'])
  assert.deepEqual(Object.keys(facts), ['sourceEdition', 'counties', 'districtRefs', 'dongRefs'])
  assert.equal(geography.sourceEdition, 'sgis-20250630')
  assert.equal(facts.sourceEdition, 'sgis-20250630')
  assert.equal(f.geography.spatialSource.geometry.sha256, '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4')
  assert.equal(f.geography.spatialSource.legalSurveyCertification, false)
  assert.equal(f.geography.spatialSource.current2026Geometry, false)
  assert.equal(geography.kingdomStatus, 'approved')
  assert.equal(geography.mapMinimumRank, 'county')
  assert.deepEqual(geography.titles.map(t => t.titleId), f.geography.titles.map(t => t.titleId))
  assert.equal(geography.titles.length, 80)
  assert.deepEqual(geography.mapTitleIds, f.geography.mapTitleIds)
  assert.deepEqual(geography.countySlots.map(c => c.countyTitleId), f.geography.countySlots.map(c => c.countyTitleId))
  assert.equal(geography.countySlots.length, 48)
  const slots = geography.countySlots.flatMap(c => c.slots)
  assert.deepEqual(slots.map(s => s.slotId), f.geography.countySlots.flatMap(c => c.slots.map(s => s.slotId)))
  assert.equal(slots.length, 426)
  assert.ok(slots.every(s => s.status === 'unassigned' && s.holderPersonId === null && s.holdingRefs.length === 0
    && s.sourceEdition === 'sgis-20250630' && s.geometryRefs.length === 1 && s.fragmentId === null))
  assert.deepEqual(Object.keys(slots[0]), ['slotId', 'dongId', 'fragmentId', 'sourceEdition', 'geometryRefs', 'holdingRefs', 'status', 'holderPersonId'])
  assert.equal(facts.districtRefs.length, 25)
  assert.equal(facts.dongRefs.length, 426)
  assert.equal(facts.counties.length, 48)
  const cross = f.geography.titles.find(t => t.rank === 'county' && t.jurisdictionRefs.length > 1)
  assert.deepEqual(geography.parentExceptions, [{ titleId: cross.titleId, policy: KINGDOM_SUCCESSOR_BINDING.crossDistrictParentPolicy,
    parentTitleId: 'geography:empire:seoul', kingdomTitleId: 'geography:kingdom:seoul:01' }])
  for (const title of geography.titles) {
    const source = f.geography.titles.find(t => t.titleId === title.titleId)
    assert.deepEqual(Object.keys(title), ['titleId', 'rank', 'parentTitleId', 'jurisdictionRefs', 'basis'])
    assert.equal(title.parentTitleId, source.feudalParentTitleId)
    assert.deepEqual(title.jurisdictionRefs, source.jurisdictionRefs)
    if (title.rank === 'kingdom') assert.equal(title.parentTitleId, 'geography:empire:seoul')
    if (title.rank === 'county' && title.titleId !== cross.titleId) assert.equal(title.parentTitleId, `geography:duchy:${title.jurisdictionRefs[0]}`)
  }
  assert.deepEqual(geography.titles.filter(t => t.rank === 'kingdom').map(k => k.jurisdictionRefs), f.geography.successor.partition.map(k => k.jurisdictionRefs))
  // The real projection passes the publication validator, including the exception, and the gate moves on to review authority.
  const input = fixture()
  input.geography = clone(geography); input.facts = clone(facts)
  input.refs.push(...facts.districtRefs.map(id => ({ id, kind: 'district', inside: true, boundarySha256: boundary.sha256 })),
    ...facts.counties.flatMap(c => c.parts.flatMap(p => p.geometryRefs)).map(id => ({ id, kind: 'geometry', inside: true, boundarySha256: boundary.sha256 })))
  bindBatch(input)
  assert.deepEqual(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }), { ok: true, errors: [] })
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  input.geography.parentExceptions = []
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_TITLE_HIERARCHY')
})

test('publication mode authenticates the staged geography before projecting it', async () => {
  const f = await kingdomFixture()
  const single = g => g.titles.find(t => t.rank === 'county' && t.jurisdictionRefs.length === 1)
  for (const [name, mutate, expected] of [
    ['wrong spatial edition', g => { g.spatialSource.edition = 'sgis-20240630' }, 'E_SLOT_EDITION'],
    ['wrong geometry hash', g => { g.spatialSource.geometry.sha256 = sha256('other geometry') }, 'E_SLOT_EDITION'],
    ['missing county', g => { g.countySlots.pop() }, 'E_SLOT_COVERAGE'],
    ['missing slot', g => { g.countySlots[0].slots.pop() }, 'E_SLOT_COVERAGE'],
    ['missing title', g => { g.titles.pop() }, 'E_SLOT_COVERAGE'],
    ['forged exception', g => { single(g).geographicParentException = 'cross-district-empire-direct' }, 'E_SCOPE_SHAPE'],
    ['unapproved rank skip', g => { single(g).feudalParentTitleId = 'geography:empire:seoul' }, 'E_SLOT_EDITION'],
    ['forged exception policy', g => { g.successor.crossDistrictParentPolicy = 'duchy-choice' }, 'E_APPROVAL_BATCH'],
    ['slot silently granted', g => { Object.assign(g.countySlots[0].slots[0], { status: 'direct', holderPersonId: 'K001' }) }, 'E_SLOT_EDITION'],
    ['kingdom status downgraded', g => { g.kingdomStatus = 'pending' }, 'E_SLOT_EDITION'],
  ]) {
    const geography = clone(f.geography)
    mutate(geography)
    assert.throws(() => checkStagingGeography(geography, f.facts, f.input, 'publication'), { code: expected }, name)
  }
  const facts = clone(f.facts)
  facts.sources.spatial.body += ' '
  assert.throws(() => checkStagingGeography(f.geography, facts, f.input, 'publication'), { code: 'E_SLOT_EDITION' }, 'stale spatial source')
})

test('publication projection refuses pending, unverified or forged successor states', async () => {
  const f = await kingdomFixture()
  const base = approvedKingdomGeography(stagingGeography(f.facts, f.input.baseline, f.input.boundary), f.geography.successor)
  const county = (g, cross) => g.titles.find(t => t.rank === 'county' && (t.jurisdictionRefs.length > 1) === cross)
  for (const [name, mutate, expected] of [
    ['pending kingdom partition', g => { g.kingdomStatus = 'pending' }, 'E_SCOPE_PENDING'],
    ['missing successor', g => { delete g.successor }, 'E_SCOPE_PENDING'],
    ['unverified official extent', g => { g.officialExtentStatus = 'unverified' }, 'E_SCOPE_PENDING'],
    ['legal certification claimed', g => { g.spatialSource.legalSurveyCertification = true }, 'E_SLOT_EDITION'],
    ['current 2026 geometry claimed', g => { g.spatialSource.current2026Geometry = true }, 'E_SLOT_EDITION'],
    ['pending duchy parent', g => { Object.assign(g.titles.find(t => t.rank === 'duchy'), { feudalParentTitleId: null, feudalParentStatus: 'pending' }) }, 'E_SCOPE_PENDING'],
    ['stale slot edition', g => { g.countySlots[0].slots[0].sourceEdition = 'sgis-20240630' }, 'E_SLOT_EDITION'],
    ['unverified slot geometry', g => { g.countySlots[0].slots[0].geometryVerified = false }, 'E_SLOT_EDITION'],
    ['exception on a single-district county', g => { county(g, false).geographicParentException = 'cross-district-empire-direct' }, 'E_TITLE_HIERARCHY'],
    ['cross-district county forced under a duchy', g => { county(g, true).feudalParentTitleId = 'geography:duchy:11140' }, 'E_TITLE_HIERARCHY'],
    ['cross-district county outside its kingdom', g => { g.successor.partition[0].countyTitleIds = g.successor.partition[0].countyTitleIds.filter(id => id !== county(g, true).titleId) }, 'E_TITLE_HIERARCHY'],
  ]) {
    const recomputed = clone(base)
    mutate(recomputed)
    assert.throws(() => publicationGeography(recomputed), { code: expected }, name)
  }
})

function crossDistrictFixture() {
  const input = fixture()
  // The approved exception: a county spanning both fixture districts is the empire's direct
  // geographic child while kingdom:one keeps its map membership.
  Object.assign(input.geography.titles.find(t => t.titleId === 'county:a'), { parentTitleId: 'empire:seoul', jurisdictionRefs: clone(districtRefs) })
  input.facts.counties[0].districtRefs = clone(districtRefs)
  input.geography.parentExceptions = [{ titleId: 'county:a', policy: KINGDOM_SUCCESSOR_BINDING.crossDistrictParentPolicy, parentTitleId: 'empire:seoul', kingdomTitleId: 'kingdom:one' }]
  bindBatch(input)
  return input
}

test('approved cross-district exception admits an empire-direct county with kingdom map membership', () => {
  const input = crossDistrictFixture()
  const before = clone(input)
  assert.deepEqual(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }), { ok: true, errors: [] })
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  assert.deepEqual(input, before)
})

for (const [name, mutate, expected] of [
  ['unapproved rank skip without exception', i => { i.geography.parentExceptions = [] }, 'E_TITLE_HIERARCHY'],
  ['exception with an unapproved policy', i => { i.geography.parentExceptions[0].policy = 'duchy-choice' }, 'E_TITLE_HIERARCHY'],
  ['exception naming a duchy parent', i => { i.geography.parentExceptions[0].parentTitleId = 'duchy:a' }, 'E_TITLE_HIERARCHY'],
  ['exception on a single-district county', i => { i.facts.counties[0].districtRefs = ['gu:A']; i.geography.titles.find(t => t.titleId === 'county:a').jurisdictionRefs = ['gu:A'] }, 'E_TITLE_HIERARCHY'],
  ['exception jurisdiction narrower than facts', i => { i.geography.titles.find(t => t.titleId === 'county:a').jurisdictionRefs = ['gu:A'] }, 'E_TITLE_HIERARCHY'],
  ['exception for an unknown county', i => { i.geography.parentExceptions[0].titleId = 'county:z' }, 'E_TITLE_HIERARCHY'],
  ['duplicate exception', i => { i.geography.parentExceptions.push(clone(i.geography.parentExceptions[0])) }, 'E_TITLE_HIERARCHY'],
  ['exception kingdom that is a duchy', i => { i.geography.parentExceptions[0].kingdomTitleId = 'duchy:a' }, 'E_KINGDOM_PARTITION'],
  ['exception kingdom missing', i => { i.geography.parentExceptions[0].kingdomTitleId = 'kingdom:missing' }, 'E_KINGDOM_PARTITION'],
  ['multi-district facts forced under one duchy', i => { i.geography.parentExceptions = []; i.geography.titles.find(t => t.titleId === 'county:a').parentTitleId = 'duchy:a' }, 'E_TITLE_HIERARCHY'],
  ['untyped exception metadata', i => { i.geography.parentExceptions[0].approved = true }, 'E_SCOPE_SHAPE'],
  ['exceptions omitted from the contract', i => { delete i.geography.parentExceptions }, 'E_SCOPE_SHAPE'],
]) test(`publication geography rejects ${name}`, () => {
  const input = crossDistrictFixture()
  mutate(input); bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), expected)
})

test('complete structural Seoul fixture needs authenticated publication review; seven source dongs yield seven slots', () => {
  const input = fixture()
  const before = clone(input)
  assert.deepEqual(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }), { ok: true, errors: [] })
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  assert.deepEqual(input, before)
  assert.equal(input.geography.countySlots[0].slots.length, 7)
})

test('publication excludes retired entities from active admission', () => {
  const input = fixture()
  Object.assign(input.contract.entities[2], {
    status: 'retired', locationRefs: [], jurisdictionRefs: [],
    basis: 'approved retirement evidence: fixture title has no current Seoul successor', batchId: null,
  })
  input.batches[0].entityKeys = input.batches[0].entityKeys.filter(key => key !== 'title:title:old')
  input.batches[0].proposal.entities = input.batches[0].proposal.entities.filter(row => row.id !== 'title:old')
  approve(input.batches[0])
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
})

test('publication still rejects pending entities', () => {
  const input = fixture()
  Object.assign(input.contract.entities[2], { status: 'pending', locationRefs: [], jurisdictionRefs: [], basis: null, batchId: null })
  input.batches[0].entityKeys = input.batches[0].entityKeys.filter(key => key !== 'title:title:old')
  input.batches[0].proposal.entities = input.batches[0].proposal.entities.filter(row => row.id !== 'title:old')
  approve(input.batches[0])
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
})

test('retired entities require explicit retirement evidence', () => {
  const input = fixture()
  Object.assign(input.contract.entities[2], { status: 'retired', locationRefs: [], jurisdictionRefs: [], basis: '', batchId: null })
  input.batches[0].entityKeys = input.batches[0].entityKeys.filter(key => key !== 'title:title:old')
  input.batches[0].proposal.entities = input.batches[0].proposal.entities.filter(row => row.id !== 'title:old')
  approve(input.batches[0])
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_ADMISSION')
})

test('actual authenticated rights materializer preserves 306 retirements and activates exactly eight approved mappings idempotently', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const sourceHashes = Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)]))
  const materialized = materializeRetiredRightsDispositions(contract, baseline, proof, sourceHashes)
  assert.deepEqual(materialized, contract)
  // Owner rights receipt covers 306 rights; bulk relation/court receipt separately adds 1336.
  const retired = contract.dispositions.filter(row => row.status === 'retired' && row.batchId === 'approved-rights-transition')
  assert.deepEqual({ titles: retired.filter(row => row.set === 'titles').length, grants: retired.filter(row => row.set === 'grants').length }, { titles: 158, grants: 148 })
  assert.ok(retired.every(row => row.targetIds.length === 0 && row.batchId === 'approved-rights-transition'
    && row.basis === 'authenticated retired-current mapping; no current Seoul successor'))
  const active = contract.dispositions.filter(row => row.status === 'active' && row.batchId === 'approved-rights-transition')
  assert.deepEqual(active, [
    { set: 'titles', id: 'title:kingdom-daejeon', status: 'active', targetIds: ['title:kingdom-daejeon'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:daejeon-daedeok","title:duchy-gu-30230-polity-daejeon"]', status: 'active', targetIds: ['["holding:daejeon-daedeok","proposal:superior-jurisdiction:seoul:daejeon-daedeok"]'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:daejeon-dong","title:duchy-gu-30110-polity-daejeon"]', status: 'active', targetIds: ['["holding:daejeon-dong","proposal:superior-jurisdiction:seoul:daejeon-dong"]'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:daejeon-jung","title:duchy-gu-30140-polity-daejeon"]', status: 'active', targetIds: ['["holding:daejeon-jung","proposal:superior-jurisdiction:seoul:daejeon-jung"]'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:daejeon-seo","title:duchy-gu-30170-polity-daejeon"]', status: 'active', targetIds: ['["holding:daejeon-seo","proposal:superior-jurisdiction:seoul:daejeon-seo"]'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:daejeon-yuseong","title:duchy-gu-30200-polity-daejeon"]', status: 'active', targetIds: ['["holding:daejeon-yuseong","proposal:superior-jurisdiction:seoul:daejeon-yuseong"]'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping' },
    { set: 'bindings', id: '["holding:yangcheon","title:duchy-gu-11470-S01"]', status: 'active', targetIds: ['["holding:yangcheon","title:duchy-gu-11470-S01"]'], batchId: 'approved-rights-transition', basis: 'authenticated retained-current current mapping' },
    { set: 'bindings', id: '["holding:yangpyeong2","title:barony-holding-yangpyeong2-S01"]', status: 'active', targetIds: ['["holding:yangpyeong2","title:barony-holding-yangpyeong2-S01"]'], batchId: 'approved-rights-transition', basis: 'authenticated retained-current current mapping' },
  ])
})

async function relationCourtFixture() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const receiptBody = await readFile(resolve(root, RELATION_COURT_DISPOSITION.receipt.path), 'utf8')
  const receipt = JSON.parse(receiptBody)
  const proposalRoot = '.omo/private/seoul-migration/relation-court-disposition-proposal-20261018/'
  const proof = { receiptBody,
    manifestBody: await readFile(resolve(root, proposalRoot + 'manifest.json'), 'utf8'),
    reviewJsonBody: await readFile(resolve(root, proposalRoot + 'independent-review.json'), 'utf8'),
    reviewMarkdownBody: await readFile(resolve(root, proposalRoot + 'independent-review.md'), 'utf8'),
    parts: await Promise.all(receipt.proposal.parts.map(async row => ({ path: row.path, body: await readFile(resolve(root, row.path), 'utf8') }))),
    // Exact-66 owner receipt predates later source successors; exercise its immutable source bytes, not today's prose.
    sources: await Promise.all(Object.values(receipt.sourceBindings).map(async row => {
      const archive = row.path === 'lore/characters/Cast-Relations.json'
        ? '.omo/private/seoul-migration/recommendations-application-20261015/characters/after/Cast-Relations.json'
        : '.omo/private/seoul-migration/combined-evidence-rebind-candidate-20261017/candidate/lore/relations/relations.json'
      const body = await readFile(resolve(root, archive), 'utf8')
      assert.equal(sha256(body), row.sha256, archive)
      return { path: row.path, body }
    })),
  }
  return { contract, proof, sourceHashes: Object.fromEntries(proof.sources.map(row => [row.path, sha256(row.body)])) }
}

test('actual exact-66 relation/court materializer is idempotent and preserves bounded pending state', async () => {
  const { contract, proof, sourceHashes } = await relationCourtFixture()
  assert.deepEqual(materializeRelationCourtDispositions(contract, proof, sourceHashes), contract)
  const active = contract.dispositions.filter(row => row.batchId === RELATION_COURT_DISPOSITION.batchId)
  assert.equal(active.length, 66)
  assert.deepEqual({ relations: active.filter(row => row.set === 'relations').length, courts: active.filter(row => row.set === 'courts').length }, { relations: 53, courts: 13 })
  assert.ok(active.every(row => row.status === 'active' && row.targetIds.length === 1 && row.targetIds[0] === row.id
    && row.basis === 'authenticated owner exact-66 same-ID current disposition'))
  assert.deepEqual(Object.fromEntries(['active', 'pending', 'retired'].map(status => [status, contract.dispositions.filter(row => row.status === status).length])),
    // publication-activation-1194 activates the remaining 133 events; bulk receipt retires 306+1336=1642.
    { active: 1401, pending: 0, retired: 1642 })
  assert.deepEqual(contract.dispositions.find(row => row.id === 'court:K1008'),
    { set: 'courts', id: 'court:K1008', status: 'retired', targetIds: [], batchId: RELATION_COURT_BULK_RETIREMENT.batchId,
      basis: RELATION_COURT_BULK_RETIREMENT.basis })
  const event = contract.dispositions.find(row => row.id === 'E:2030년-대정전-발발')
  assert.equal(event.status, 'active')
  assert.deepEqual(event.targetIds, [event.id])
  // event133-owner-approved is the exact owner event-disposition successor, not document activation.
  assert.equal(event.batchId, 'event133-owner-approved')
})

for (const [name, mutate, error] of [
  ['wrong authority', ({ proof }) => { const receipt = JSON.parse(proof.receiptBody); receipt.ownerDecision.messageRef = 'forged'; proof.receiptBody = JSON.stringify(receipt) }, 'E_APPROVAL_BATCH'],
  ['wrong receipt raw hash', ({ proof }) => { proof.receiptBody += '\n' }, 'E_APPROVAL_BATCH'],
  ['wrong review hash', ({ proof }) => { proof.reviewJsonBody += '\n' }, 'E_REVIEW_HASH'],
  ['wrong proposal path', ({ proof }) => { proof.parts[0].path = 'wrong.json' }, 'E_APPROVAL_BATCH'],
  ['wrong current target', ({ proof }) => { const part = JSON.parse(proof.parts[0].body); const row = part.rows.find(item => item.currentSemanticMapping.status === 'proposed-same-current'); row.currentSemanticMapping.targetIds = ['court:K001']; proof.parts[0].body = JSON.stringify(part) }, 'E_REVIEW_HASH'],
  ['changed source', ({ proof }) => { proof.sources[0].body += '\n' }, 'E_REVIEW_HASH'],
]) test(`exact-66 relation/court materializer rejects ${name}`, async () => {
  const fixture = await relationCourtFixture(); mutate(fixture)
  assert.throws(() => materializeRelationCourtDispositions(fixture.contract, fixture.proof, fixture.sourceHashes), { code: error })
})

test('exact-66 relation/court materializer rejects an arbitrary extra activation', async () => {
  const { contract, proof, sourceHashes } = await relationCourtFixture()
  const changed = clone(contract)
  // Bulk owner retirement replaced pending relations; unauthorized activation must still be rejected.
  Object.assign(changed.dispositions.find(row => row.set === 'relations' && row.status === 'retired'), {
    status: 'active', targetIds: ['R:s2-직능거점-관계-table3:1'], batchId: RELATION_COURT_DISPOSITION.batchId,
    basis: 'authenticated owner exact-66 same-ID current disposition',
  })
  assert.throws(() => materializeRelationCourtDispositions(changed, proof, sourceHashes), { code: 'E_CENSUS_RIGHT' })
})

async function bulkRetirementFixture() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const { contract, proof, sourceHashes } = await relationCourtFixture()
  const predecessor = materializeRelationCourtDispositions(contract, proof, sourceHashes)
  const receiptBody = await readFile(resolve(root, RELATION_COURT_BULK_RETIREMENT.receipt.path), 'utf8')
  return { predecessor, receiptBody }
}

test('owner bulk retirement derives and retires exactly 1,335 pending relations plus court K1008 idempotently', async () => {
  const { predecessor, receiptBody } = await bulkRetirementFixture()
  const materialized = materializeRelationCourtBulkRetirement(predecessor, receiptBody)
  assert.equal(materialized.dispositions.filter(row => row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId && row.set === 'relations').length, 1335)
  assert.deepEqual(materialized.dispositions.filter(row => row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId && row.set === 'courts').map(row => row.id), ['court:K1008'])
  assert.ok(materialized.dispositions.filter(row => row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId)
    .every(row => row.status === 'retired' && row.targetIds.length === 0 && row.basis === RELATION_COURT_BULK_RETIREMENT.basis))
  // publication-activation-1194 later admitted all 133 formerly pending event dispositions.
  assert.equal(materialized.dispositions.filter(row => row.status === 'pending' && row.set === 'events').length, 0)
  assert.equal(materialized.dispositions.filter(row => row.status === 'active' && row.set === 'events').length, 191)
  assert.equal(materialized.dispositions.filter(row => row.batchId === RELATION_COURT_DISPOSITION.batchId && row.status === 'active').length, 66)
  assert.deepEqual(materializeRelationCourtBulkRetirement(materialized, receiptBody), materialized)
})

test('owner bulk retirement rejects a forged raw receipt', async () => {
  const { predecessor, receiptBody } = await bulkRetirementFixture()
  assert.throws(() => materializeRelationCourtBulkRetirement(predecessor, receiptBody + '\n'), { code: 'E_APPROVAL_BATCH' })
})

for (const [name, mutate] of [
  ['pending event', contract => { const row = contract.dispositions.find(item => item.set === 'events'); Object.assign(row, { status: 'retired', batchId: RELATION_COURT_BULK_RETIREMENT.batchId, basis: RELATION_COURT_BULK_RETIREMENT.basis }) }],
  ['active exact-66 row', contract => { const row = contract.dispositions.find(item => item.batchId === RELATION_COURT_DISPOSITION.batchId); Object.assign(row, { status: 'retired', targetIds: [], batchId: RELATION_COURT_BULK_RETIREMENT.batchId, basis: RELATION_COURT_BULK_RETIREMENT.basis }) }],
]) test(`owner bulk retirement rejects wrong set containing ${name}`, async () => {
  const { predecessor, receiptBody } = await bulkRetirementFixture()
  const changed = clone(predecessor); mutate(changed)
  assert.throws(() => materializeRelationCourtBulkRetirement(changed, receiptBody), { code: 'E_CENSUS_RIGHT' })
})

test('selected retirement migration accepts the authenticated batch and publication does not demand active targets', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const transition = authenticateRightsTransition(baseline, proof, Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)])))
  // Keep the exact rights receipt denominator independent from later relation/court retirements.
  const retired = contract.dispositions.filter(row => row.status === 'retired' && row.batchId === 'approved-rights-transition')
  assert.equal(retired.length, transition.retired.size)
  assert.ok(retired.every(row => transition.retired.has(JSON.stringify([row.set, row.id]))))
  assert.ok(retired.every(row => row.status === 'retired' && row.targetIds.length === 0))
  assert.ok(retired.filter(row => row.batchId === 'approved-rights-transition').length === 306)
  assert.ok(retired.every(row => selectedScopeRow(row, 'migration', 'approved-rights-transition')))
  assert.ok(retired.every(row => !selectedScopeRow(row, 'publication', null)))
})

let authenticatedInspectionInput
const retirementInspectionInput = () => authenticatedInspectionInput ??= loadScopeInput({
  root: resolve(fileURLToPath(new URL('..', import.meta.url))),
  baselinePath: resolve(fileURLToPath(new URL('../.omo/private/seoul-migration/baseline.json', import.meta.url))),
  mode: 'inspection',
})

test('inspection validates the complete authenticated retirement batch allocation', async () => {
  // Given: the real scope input with all authenticated retired-current mappings.
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const input = await retirementInspectionInput()
  assert.equal(input.error, undefined)
  const { dependencies, dependencyReport, ...scopeInput } = input

  // When: the complete validator reaches allocation-batch disposition checks.
  const result = validateSeoulScope(scopeInput, { mode: 'inspection' })

  // Then: the authenticated retirement batch is accepted without weakening its exact key set.
  assert.deepEqual(result, { ok: true, errors: [] })
})

test('complete retirement batch validation rejects wrong keys, wrong batch, and pending rows at exact paths', async () => {
  // Given: one authenticated scope input that reaches the complete batch loop.
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const loaded = await retirementInspectionInput()
  assert.equal(loaded.error, undefined)
  const { dependencies, dependencyReport, ...scopeInput } = loaded
  const retirementBatch = scopeInput.batches.find(row => row.id === 'approved-rights-transition')
  const retired = scopeInput.contract.dispositions.find(row => row.status === 'retired')
  const active = scopeInput.contract.dispositions.find(row => row.status === 'active' && row.batchId === retirementBatch.id)

  // When/Then: an arbitrary key cannot replace the authenticated exact batch set.
  const wrongMapping = clone(scopeInput)
  wrongMapping.batches.find(row => row.id === retirementBatch.id).dispositionKeys[0] = JSON.stringify(['titles', 'title:arbitrary-retirement'])
  assert.deepEqual(validateSeoulScope(wrongMapping, { mode: 'inspection' }).errors[0], {
    code: 'E_APPROVAL_BATCH', path: '/batches/dispositionKeys', id: retirementBatch.dispositionKeys[0],
  })

  // When/Then: an authenticated retirement cannot be assigned to another batch.
  const wrongBatch = clone(scopeInput)
  wrongBatch.contract.dispositions.find(row => row.set === retired.set && row.id === retired.id).batchId = 'wrong-batch'
  assert.deepEqual(validateSeoulScope(wrongBatch, { mode: 'inspection' }).errors[0], {
    code: 'E_CENSUS_RIGHT', path: '/dispositions/retirement', id: retired.id,
  })

  // When/Then: a non-retired disposition in the approved batch still cannot remain pending.
  const pending = clone(scopeInput)
  const pendingRow = pending.contract.dispositions.find(row => row.set === active.set && row.id === active.id)
  Object.assign(pendingRow, { status: 'pending', targetIds: [], basis: null })
  const pendingBatch = pending.batches.find(row => row.id === retirementBatch.id)
  pendingBatch.proposal.dispositions = clone(pending.contract.dispositions.filter(row => row.batchId === retirementBatch.id))
  pendingBatch.approval.bodySha256 = proposalHash(pendingBatch.proposal)
  assert.deepEqual(validateSeoulScope(pending, { mode: 'inspection' }).errors[0], {
    code: 'E_SCOPE_PENDING', path: '/batches/dispositionKeys', id: JSON.stringify([active.set, active.id]),
  })
})

for (const [name, mutate] of [
  ['missing mapping', approval => { approval.records.splice(approval.records.findIndex(row => row.disposition === 'retired-current'), 1) }],
  ['arbitrary holding retirement', approval => { approval.records.find(row => row.set === 'holdings').disposition = 'retired-current'; approval.records.find(row => row.set === 'holdings').currentId = null; delete approval.records.find(row => row.set === 'holdings').current }],
  ['active-current retirement', approval => { const row = approval.records.find(item => item.disposition === 'retired-current'); row.currentId = row.oldId }],
  ['person retirement injection', approval => { approval.records.push({ set: 'persons', oldId: 'K001', disposition: 'retired-current', currentId: null, sourceValueSha256: '0'.repeat(64) }) }],
]) test(`authenticated retirement rejects ${name}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const approval = JSON.parse(proof.approvalBody); mutate(approval); proof.approvalBody = JSON.stringify(approval)
  const sourceHashes = Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)]))
  assert.throws(() => authenticateRightsTransition(baseline, proof, sourceHashes), { code: /E_APPROVAL_BATCH|E_CENSUS_RIGHT/ })
})

test('retirement contract rejects wrong batch and nonempty target', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const sourceHashes = Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)]))
  for (const mutation of [row => { row.batchId = 'wrong-batch' }, row => { row.targetIds = [row.id] }]) {
    const changed = clone(contract); mutation(changed.dispositions.find(row => row.status === 'retired'))
    assert.throws(() => materializeRetiredRightsDispositions(changed, baseline, proof, sourceHashes), { code: 'E_CENSUS_RIGHT' })
  }
})

for (const [name, mutation] of [
  ['swapped binding', row => { row.targetIds = ['["proposal:superior-jurisdiction:seoul:daejeon-dong","holding:daejeon-dong"]'] }],
  ['old Daejeon title composite', row => { row.targetIds = [row.id] }],
  ['holding-only binding id', row => { row.targetIds = ['holding:daejeon-dong'] }],
  ['wrong batch', row => { row.batchId = 'publication-activation-1194' }],
  ['wrong basis', row => { row.basis = 'confirmed publication activation' }],
  ['nonexistent target', row => { row.targetIds = ['["holding:daejeon-dong","proposal:missing"]'] }],
]) test(`approved disposition materializer rejects ${name}`, async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const changed = clone(contract)
  mutation(changed.dispositions.find(row => row.id === '["holding:daejeon-dong","title:duchy-gu-30110-polity-daejeon"]'))
  assert.throws(() => materializeRetiredRightsDispositions(changed, baseline, proof,
    Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)]))), { code: 'E_CENSUS_RIGHT' })
})

test('approved disposition materializer rejects an arbitrary ninth activation and retired-to-active change', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const baseline = JSON.parse(await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json')))
  const contract = JSON.parse(await readFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')))
  const proof = { approvalBody: await readFile(resolve(root, 'scripts/approved-seoul-rights-transition.json'), 'utf8'),
    receiptBody: await readFile(resolve(root, '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md'), 'utf8'),
    sources: [{ sourcePath: 'lore/relations/personal-holdings.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/personal-holdings.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/personal-holdings.json'), 'utf8') },
      { sourcePath: 'lore/relations/opening-feudal-allocation.json', beforeBody: await readFile(resolve(root, 'scripts/historical-inputs/opening-feudal-allocation.json'), 'utf8'), afterBody: await readFile(resolve(root, 'lore/relations/opening-feudal-allocation.json'), 'utf8') }] }
  const sourceHashes = Object.fromEntries(proof.sources.map(row => [row.sourcePath, sha256(row.afterBody)]))
  // publication-activation-1194 resolved pending events; mutate an admitted event to test an unauthorized ninth rights mapping.
  const ninth = clone(contract); Object.assign(ninth.dispositions.find(row => row.set === 'events' && row.status === 'active'), {
    status: 'active', targetIds: ['event:invented'], batchId: 'approved-rights-transition', basis: 'authenticated retained-current current mapping',
  })
  assert.throws(() => materializeRetiredRightsDispositions(ninth, baseline, proof, sourceHashes), { code: 'E_CENSUS_RIGHT' })
  const unretired = clone(contract); Object.assign(unretired.dispositions.find(row => row.status === 'retired'), {
    status: 'active', targetIds: ['title:kingdom-daejeon'], batchId: 'approved-rights-transition', basis: 'authenticated approved-nonowning current mapping',
  })
  assert.throws(() => materializeRetiredRightsDispositions(unretired, baseline, proof, sourceHashes), { code: 'E_CENSUS_RIGHT' })
})

for (const [name, mutate, expected] of [
  ['external person', input => { input.contract.entities[0].locationRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['external title', input => { input.contract.entities[2].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['external holding', input => { input.contract.entities[3].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['empty location', input => { input.contract.entities[0].locationRefs = [] }, 'E_SCOPE_LOCATION'],
  ['unknown ref', input => { input.contract.entities[0].locationRefs = ['not-known'] }, 'E_SCOPE_REF'],
  ['missing baseline person', input => { input.contract.entities.splice(0, 1) }, 'E_CENSUS_PERSON'],
  ['deleted source person', input => { input.current.entitySets.persons.pop() }, 'E_CENSUS_PERSON'],
  ['extra source person', input => { input.current.entitySets.persons.push('K003') }, 'E_CENSUS_PERSON'],
  ['preserved current person', input => { input.contract.entities[0].status = 'preserved' }, 'E_CENSUS_PERSON'],
  ['missing political identity', input => { input.current.entitySets.polities = [] }, 'E_CENSUS_RIGHT'],
  ['missing right disposition', input => { input.contract.dispositions.pop() }, 'E_CENSUS_RIGHT'],
  ['pending current', input => { input.contract.entities[0].status = 'pending' }, 'E_SCOPE_PENDING'],
  ['missing basis', input => { input.contract.entities[0].basis = '' }, 'E_SCOPE_ADMISSION'],
  ['extra contract key', input => { input.contract.approved = true }, 'E_SCOPE_SHAPE'],
  ['duplicate person', input => { input.contract.entities.push(clone(input.contract.entities[0])) }, 'E_SCOPE_ADMISSION'],
  ['null entity', input => { input.contract.entities.push(null) }, 'E_SCOPE_SHAPE'],
  ['wrong refs type', input => { input.contract.entities[0].locationRefs = 'dong:1' }, 'E_SCOPE_SHAPE'],
  ['stale archive', input => { input.archiveHashes['phase-base.tar.gz'] = sha256('changed') }, 'E_ARCHIVE_HASH'],
  ['stale baseline set', input => { input.baseline.currentEntitySets.persons.pop() }, 'E_ARCHIVE_HASH'],
  ['sealed current promotion', input => { input.contract.documents[1].status = 'active' }, 'E_SCOPE_ADMISSION'],
  ['sealed bytes changed', input => { input.sourceHashes[sealedPath] = sha256('changed') }, 'E_ARCHIVE_HASH'],
  ['unpublished source omitted', input => { input.contract.documents.pop() }, 'E_REVIEW_COVERAGE'],
  ['unclassified new source', input => { input.current.documentPaths.push('lore/editorial/new.json') }, 'E_REVIEW_COVERAGE'],
  ['stale reviewed bytes', input => { input.sourceHashes[sourcePath] = sha256('changed') }, 'E_REVIEW_HASH'],
  ['missing slot', input => { input.geography.countySlots[0].slots.pop() }, 'E_SLOT_COVERAGE'],
  ['duplicate slot identity', input => { input.geography.countySlots[0].slots[1].slotId = 'slot:dong:1' }, 'E_SLOT_DUPLICATE'],
  ['slot edition mismatch', input => { input.geography.countySlots[0].slots[0].sourceEdition = 'stale' }, 'E_SLOT_EDITION'],
  ['rank inversion', input => { input.geography.titles[4].parentTitleId = 'barony:1' }, 'E_TITLE_HIERARCHY'],
  ['kingdom missing district', input => { input.geography.titles[1].jurisdictionRefs = ['gu:A'] }, 'E_KINGDOM_PARTITION'],
  ['wrong county gu parent', input => { input.geography.titles[4].parentTitleId = 'duchy:b' }, 'E_TITLE_HIERARCHY'],
  ['barony map selection', input => { input.geography.mapTitleIds.push('barony:1') }, 'E_MAP_GRANULARITY'],
  ['map minimum barony', input => { input.geography.mapMinimumRank = 'barony' }, 'E_MAP_GRANULARITY'],
  ['invented unassigned holder', input => { input.geography.countySlots[0].slots[0].holderPersonId = 'K001' }, 'E_SCOPE_ADMISSION'],
  ['rail shortcut', input => { input.edges[0].physical = false }, 'E_SCOPE_OUTSIDE'],
  ['external segment', input => { input.edges[0].inside = false }, 'E_SCOPE_OUTSIDE'],
  ['approval wrong kind', input => { input.batches[0].approval.kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['stale proposal', input => { input.batches[0].proposal.entities[0].basis = 'changed' }, 'E_APPROVAL_BATCH'],
  ['stale exact body newline', input => { input.batches[0].articleSample.body = input.batches[0].articleSample.body.trimEnd() }, 'E_APPROVAL_BATCH'],
  ['style type reuse', input => { input.batches[0].cardSample.approval.kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['wrong approval batch', input => { input.batches[0].approval.batchId = 'other' }, 'E_APPROVAL_BATCH'],
  ['missing closure member', input => { input.batches[0].entityKeys.pop() }, 'E_APPROVAL_BATCH'],
  ['missing EN coverage', input => { input.review.receipts[0].coveredKeys.pop() }, 'E_REVIEW_COVERAGE'],
  ['missing current block', input => { input.review.receipts[0].currentHashes.pop() }, 'E_REVIEW_COVERAGE'],
  ['stale current leaf', input => { input.review.receipts[0].currentHashes[0].sha256 = sha256('stale') }, 'E_REVIEW_HASH'],
]) test(name, () => {
  const input = fixture()
  mutate(input)
  assert.equal(code(validateSeoulScope(input)), expected)
})

test('inspection permits pending but exact full current sets cannot shrink', () => {
  const input = fixture()
  input.contract.entities.forEach(row => { row.status = 'pending'; row.locationRefs = []; row.jurisdictionRefs = []; row.batchId = null; row.basis = null })
  input.contract.dispositions.forEach(row => { row.status = 'pending'; row.targetIds = []; row.batchId = null; row.basis = null })
  input.contract.documents[0] = { sourcePath, status: 'pending', reviewReceipt: null, batchId: null, basis: null }
  input.geography = null; input.facts = null; input.batches = []; input.review = null
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  input.contract.entities.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_CENSUS_RIGHT')
})

test('selected migration validates its complete approved closure while unrelated pending stays in denominator', () => {
  const input = fixture()
  Object.assign(input.contract.entities[1], { status: 'pending', locationRefs: [], basis: null, batchId: 'batch:b' })
  Object.assign(input.contract.dispositions.find(row => row.set === 'persons' && row.id === 'K002'), { status: 'pending', targetIds: [], basis: null, batchId: 'batch:b' })
  bindBatch(input)
  assert.equal(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }).ok, true)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  input.current.entitySets.persons.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_CENSUS_PERSON')
})

test('current ref edits cannot reuse an approved proposal even when still inside Seoul', () => {
  const input = fixture()
  input.contract.entities[0].locationRefs = ['dong:2']
  assert.equal(code(validateSeoulScope(input)), 'E_APPROVAL_BATCH')
})

test('selected entities cannot borrow a pending source from another reapproved batch', () => {
  const input = fixture()
  Object.assign(input.contract.documents[0], { status: 'pending', batchId: 'batch:b', basis: null, reviewReceipt: null })
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
})

test('reviewed cross-batch sources require approved dependencies and their complete review coverage', () => {
  const input = fixture()
  input.contract.documents[0].batchId = 'batch:b'
  for (const rows of Object.values(input.review)) for (const row of rows) row.batchId = 'batch:b'
  bindBatch(input); bindBatch(input, 'batch:b')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_APPROVAL_BATCH')
  input.batches.find(row => row.id === 'batch:a').dependencyBatchIds = ['batch:b']
  assert.equal(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }).ok, true)
  input.review.receipts[0].coveredKeys.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_REVIEW_COVERAGE')
})

test('assigned slots resolve independent active rights and exact holder/status', () => {
  const input = fixture()
  const slot = input.geography.countySlots[0].slots[0]
  Object.assign(slot, { status: 'direct', holderPersonId: 'K001', holdingRefs: ['unknown:right'] })
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_REF')
  slot.holdingRefs = ['holding:old']; bindBatch(input)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights = [{ id: 'holding:old', holderPersonId: 'K001', slotStatus: 'direct' }]
  assert.equal(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }).ok, true)
  assert.equal(code(validateSeoulScope(input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  input.current.rights[0].holderPersonId = 'K002'
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights[0].holderPersonId = 'K001'
  input.current.rights[0].slotStatus = 'vassal'
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights[0].slotStatus = 'direct'
  input.contract.dispositions.find(row => row.id === 'holding:old').status = 'pending'
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_PENDING')
})

test('a whole dong cannot be claimed by two counties even with different slot IDs', () => {
  const input = fixture()
  input.geography.titles.push({ titleId: 'county:b', rank: 'county', parentTitleId: 'duchy:a', jurisdictionRefs: ['dong:1'], basis: 'fixture geography' })
  input.facts.counties.push({ titleId: 'county:b', districtRefs: ['gu:A'], parts: [clone(input.facts.counties[0].parts[0])] })
  const slot = clone(input.geography.countySlots[0].slots[0])
  slot.slotId = 'slot:other-id'
  input.geography.countySlots.push({ countyTitleId: 'county:b', slots: [slot] })
  assert.equal(code(validateSeoulScope(input)), 'E_SLOT_DUPLICATE')
})

test('inspection never turns active rows into an approval bypass', () => {
  const input = fixture()
  input.batches = []
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_APPROVAL_BATCH')
})

test('proposal serialization is deterministic across key and ID ordering, without modifying exact sample bytes', () => {
  assert.equal(proposalHash({ z: 1, rows: [{ id: 'b', n: 2 }, { id: 'a', n: 1 }] }), proposalHash({ rows: [{ n: 1, id: 'a' }, { n: 2, id: 'b' }], z: 1 }))
  assert.deepEqual(canonicalProposal({ b: 2, a: 1 }), { a: 1, b: 2 })
  assert.notEqual(sha256('body\n'), sha256('body'))
  assert.deepEqual(baselineDocuments(fixture().baseline), [sourcePath, sealedPath])
})

function censusFixture() {
  // This denominator is declared before and independently of the mutable product.
  const original = { leaves: [['lore/unpublished.json', '/content/0/text/ko', 'dialogue', 'ko', sha256('대사')],
    ['lore/unpublished.json', '/content/0/text/en', 'dialogue', 'en', sha256('Dialogue')]],
  blocks: [{ sourcePath: 'lore/unpublished.json', jsonPointer: '/content/0', anchor: 'dialogue', locale: 'neutral', originalSha256: sha256('block') }],
  cards: [{ sourcePath: 'lore/duplicate.json', jsonPointer: '/content/3', anchor: 'duplicate', locale: 'en', originalSha256: sha256('duplicate card') }] }
  const current = clone(original)
  const index = compareCensusCategories(original, current)
  const docs = [...new Set(index.original.map(r => r.sourcePath))].map(sourcePath => ({ sourcePath, currentSha256: sha256(sourcePath), classification: 'current-pending',
    originalIndex: index.original.filter(r => r.sourcePath === sourcePath), currentIndex: index.current.filter(r => r.sourcePath === sourcePath) }))
  docs.push({ sourcePath: sealedPath, currentSha256: sha256(sealedBody), classification: 'sealed-history', originalIndex: [], currentIndex: [] })
  const ledger = { schema: 'seoul-relocation-census.v1', binding: { baselineSha256: sha256('independent') },
    people: ['K001', 'K002'].map(personId => ({ personId, status: 'pending', batchId: null, approval: null, proposedLocationRefs: [], proposedHoldingRefs: [], titleChanges: [], narrativeChanges: [], preservedFacts: [], changedFacts: [] })),
    originalRights: [{ set: 'holdings', id: 'right:original' }],
    cardOccurrences: [{ originalKey: 'duplicate-en-card', currentHash: sha256('duplicate card') }], connectedGroups: [{ personIds: ['K001', 'K002'] }], sharedSourceGroups: [{ personIds: ['K001', 'K002'] }] }
  const review = { schema: 'seoul-narrative-census.v1', binding: clone(ledger.binding), documents: docs, mapping: index, receipts: [], approvals: [] }
  const expected = { ledger, review, dependencies: [{ fromKey: 'K001', toKey: 'K002', kind: 'family' }] }
  return { expected, actual: clone(expected), original, current }
}

test('independent complete census admits pending extraction without semantic approval', () => {
  const { actual, expected } = censusFixture()
  assert.deepEqual(validateCensusProducts(actual, expected), { ok: true, errors: [] })
  assert.equal(actual.ledger.people.every(row => row.approval === null), true)
})

for (const [name, mutate, error] of [
  ['missing issued person', a => a.ledger.people.pop(), 'E_CENSUS_PERSON'],
  ['missing original right', a => a.ledger.originalRights.pop(), 'E_CENSUS_RIGHT'],
  ['missing duplicate card', a => a.ledger.cardOccurrences.pop(), 'E_REVIEW_COVERAGE'],
  ['missing unpublished block', a => { const doc = a.review.documents.find(d => d.sourcePath === 'lore/unpublished.json'); doc.originalIndex = doc.originalIndex.filter(r => r.category !== 'blocks') }, 'E_REVIEW_COVERAGE'],
  ['missing EN leaf', a => { a.review.documents.find(d => d.sourcePath === 'lore/unpublished.json').currentIndex.find(r => r.category === 'leaves').count -= 1 }, 'E_REVIEW_COVERAGE'],
  ['stale independently bound leaf hash', a => { a.review.documents[0].currentIndex[0].sha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['stale card', a => { a.ledger.cardOccurrences[0].currentHash = sha256('stale') }, 'E_REVIEW_HASH'],
  ['sealed promotion', a => { a.review.documents.at(-1).classification = 'current-pending' }, 'E_SCOPE_ADMISSION'],
  ['wrong approval kind', a => { a.ledger.people[0].approval = { kind: 'article-style' } }, 'E_APPROVAL_KIND'],
  ['invented owner approval', a => { a.ledger.people[0].approval = { kind: 'batch-allocation' } }, 'E_APPROVAL_BATCH'],
  ['omitted relation dependency', a => a.dependencies.pop(), 'E_REVIEW_COVERAGE'],
  ['unreviewed applied row', a => { a.ledger.people[0].status = 'applied' }, 'E_SCOPE_PENDING'],
  ['unknown unchecked metadata', a => { a.review.approved = true }, 'E_SCOPE_SHAPE'],
]) test(`census rejects ${name}`, () => {
  const { actual, expected } = censusFixture()
  mutate(actual)
  assert.equal(code(validateCensusProducts(actual, expected)), error)
})

test('recursive census includes escaped pointers, nearest anchor, EN dialogue and all kind objects', () => {
  const input = { anchor: 'root', source: { kind: 'original-fiction' }, content: [{ kind: 'list', anchor: 'nested', items: [{ ko: '대사', en: 'Dialogue' }] }], data: { 'a/b~c': { en: 'Unpublished' } } }
  const result = walkCensus(input, 'lore/unpublished.json')
  assert.equal(result.blocks.length, 2)
  assert.deepEqual(result.leaves.find(r => r[1] === '/data/a~1b~0c/en'), ['lore/unpublished.json', '/data/a~1b~0c/en', 'root', 'en', sha256('Unpublished')])
  assert.equal(result.leaves.find(r => r[1] === '/content/0/items/0/en')[2], 'nested')
})

test('independent review rejects caller shrinking or forging the current denominator', () => {
  const { original, current } = censusFixture()
  const doc = [{ sourcePath: 'lore/unpublished.json', batchId: 'a' }, { sourcePath: 'lore/duplicate.json', batchId: 'a' }]
  const rows = cats => Object.values(cats).flat().map(raw => {
    const [sourcePath, jsonPointer, , locale, originalSha256] = Array.isArray(raw) ? raw : [raw.sourcePath, raw.jsonPointer, raw.anchor, raw.locale, raw.originalSha256]
    return { key: JSON.stringify([sourcePath, jsonPointer, locale, originalSha256]), sha256: originalSha256, batchId: 'a' }
  })
  const review = { originalKeys: rows(original).map(({ key, batchId }) => ({ key, batchId })), currentKeys: rows(current), receipts: [] }
  assert.doesNotThrow(() => validateIndependentReview(review, original, current, doc))
  const missing = clone(review); missing.originalKeys.pop()
  assert.throws(() => validateIndependentReview(missing, original, current, doc), { code: 'E_REVIEW_COVERAGE' })
  const stale = clone(review); stale.currentKeys[0].sha256 = sha256('stale')
  assert.throws(() => validateIndependentReview(stale, original, current, doc), { code: 'E_REVIEW_HASH' })
  const batch = clone(review); batch.currentKeys[0].batchId = 'other'
  assert.throws(() => validateIndependentReview(batch, original, current, doc), { code: 'E_APPROVAL_BATCH' })
})

function publicationFixture() {
  const input = fixture()
  const sources = new Map([[sourcePath, { sha256: sha256(sourceBody) }], [sealedPath, { sha256: sha256(sealedBody) }]])
  const original = {}; const current = {}
  for (const category of ['leaves', 'blocks', 'headings', 'cards', 'markdown', 'lines']) {
    original[category] = [...sources.keys()].map(path => [path, `/${category}`, null, 'neutral', sha256(`original:${path}:${category}`)])
    current[category] = [...sources.keys()].map(path => [path, `/${category}`, null, 'neutral', sha256(`current:${path}:${category}`)])
  }
  const keys = (categories, path) => Object.values(categories).flat().filter(row => row[0] === path)
    .map(([sourcePath, jsonPointer, , locale, hash]) => ({ key: JSON.stringify([sourcePath, jsonPointer, locale, hash]), sha256: hash }))
  const receipt = { schema: 'seoul-document-publication-review.v1', reviewer: 'synthetic-independent-reviewer', approvalRef: 'fixture-only:exact-review',
    reviewedAt: '2026-10-15T00:00:00Z', documents: [...sources.keys()].map(path => ({ sourcePath: path, currentSha256: sources.get(path).sha256,
      classification: path === sealedPath ? 'archive' : 'current', decision: 'approved',
      originalKeys: keys(original, path).map(row => row.key), currentKeys: keys(current, path) })) }
  const args = { sources, original, current, documents: input.contract.documents, pins: [], evidence: [] }
  const pin = () => {
    const body = JSON.stringify(receipt)
    args.pins = [{ path: 'fixture-only-review.json', sha256: sha256(body) }]
    args.evidence = [{ path: 'fixture-only-review.json', body }]
  }
  pin()
  return { input, args, receipt, pin }
}

test('synthetic exact review validates all categories but cannot mint production authentication', () => {
  const f = publicationFixture()
  const review = validateDocumentPublicationReview(f.args)
  assert.equal(review.complete, true)
  assert.equal(review.semanticReview, 'reviewed')
  assert.equal(review.documents[0].eligible, true)
  assert.deepEqual(review.documents[0].receipt, { ...f.args.pins[0], approvalRef: f.receipt.approvalRef })
  assert.equal(review.documents[1].eligible, false)
  assert.equal(review.documents[1].reason, 'sealed-history')
  assert.equal(isAuthenticatedPublicationReview(review), false)
  f.input.current.publicationReview = review
  assert.equal(code(validateSeoulScope(f.input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  assert.equal(code(validateSeoulScope(f.input, { mode: 'inspection' })), 'E_PUBLICATION_REVIEW_AUTHORITY')
})

test('empty publication pins preserve 323 sources and 42 seals without issuing a decision', () => {
  const sources = new Map(Array.from({ length: 323 }, (_, i) => [i < 42 ? `vendor/issued-history/${i}.json` : `lore/${i}.json`, { sha256: sha256(String(i)) }]))
  const result = validateDocumentPublicationReview({ sources, original: {}, current: {}, documents: [], pins: [], evidence: [] })
  assert.equal(result.documents.length, 323)
  assert.equal(result.documents.filter(row => row.classification === 'sealed-history').length, 42)
  assert.equal(result.documents.every(row => row.eligible === false && row.receipt === null), true)
  assert.equal(result.documents.filter(row => row.reason === 'missing-authenticated-review').length, 281)
  assert.equal(result.semanticReview, 'not-reviewed')
  assert.equal(result.complete, false)
})

for (const [name, mutate, expected] of [
  ['caller-injected receipt outside closed pins', f => { f.args.pins = [] }, 'E_PUBLICATION_REVIEW_AUTHORITY'],
  ['duplicate authority pin', f => { f.args.pins.push(clone(f.args.pins[0])) }, 'E_PUBLICATION_REVIEW_AUTHORITY'],
  ['altered pinned evidence bytes', f => { f.args.evidence[0].body += '\n' }, 'E_PUBLICATION_REVIEW_AUTHORITY'],
  ['stale full source hash', f => { f.receipt.documents[0].currentSha256 = sha256('stale'); f.pin() }, 'E_REVIEW_HASH'],
  ['invalid source hash', f => { f.receipt.documents[0].currentSha256 = 'invalid'; f.pin() }, 'E_REVIEW_HASH'],
  ['missing original key', f => { f.receipt.documents[0].originalKeys.pop(); f.pin() }, 'E_REVIEW_COVERAGE'],
  ['missing current key', f => { f.receipt.documents[0].currentKeys.pop(); f.pin() }, 'E_REVIEW_COVERAGE'],
  ['forged current leaf hash', f => { f.receipt.documents[0].currentKeys[0].sha256 = sha256('forged'); f.pin() }, 'E_REVIEW_HASH'],
  ['duplicate original key', f => { f.receipt.documents[0].originalKeys.push(f.receipt.documents[0].originalKeys[0]); f.pin() }, 'E_REVIEW_COVERAGE'],
  ['duplicate current key', f => { f.receipt.documents[0].currentKeys.push(clone(f.receipt.documents[0].currentKeys[0])); f.pin() }, 'E_REVIEW_COVERAGE'],
  ['duplicate document', f => { f.receipt.documents.push(clone(f.receipt.documents[0])); f.pin() }, 'E_REVIEW_COVERAGE'],
  ['unknown receipt field', f => { f.receipt.approved = true; f.pin() }, 'E_SCOPE_SHAPE'],
  ['unknown document field', f => { f.receipt.documents[0].eligible = true; f.pin() }, 'E_SCOPE_SHAPE'],
  ['unknown source path', f => { f.receipt.documents[0].sourcePath = 'lore/unknown.json'; f.pin() }, 'E_REVIEW_COVERAGE'],
  ['archive hides a current document', f => { f.receipt.documents[0].classification = 'archive'; f.pin() }, 'E_SCOPE_ADMISSION'],
  ['sealed history promoted to current', f => { f.receipt.documents[1].classification = 'current'; f.pin() }, 'E_SCOPE_ADMISSION'],
  ['archive promoted by current review', f => { f.args.documents[0].status = 'preserved' }, 'E_SCOPE_ADMISSION'],
  ['approved review lacks active scope', f => { f.args.documents[0].status = 'pending' }, 'E_SCOPE_PENDING'],
  ['approved review lacks matching scope hash', f => { f.args.documents[0].reviewReceipt.currentSha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['shrunken independent source denominator', f => { f.args.sources.delete(sourcePath) }, 'E_REVIEW_COVERAGE'],
  ['conflicting receipts', f => {
    const other = clone(f.receipt); other.documents[0].decision = 'pending'
    const body = JSON.stringify(other)
    f.args.pins.push({ path: 'conflicting.json', sha256: sha256(body) }); f.args.evidence.push({ path: 'conflicting.json', body })
  }, 'E_REVIEW_COVERAGE'],
]) test('publication receipt rejects ' + name, () => {
  const f = publicationFixture(); mutate(f)
  assert.throws(() => validateDocumentPublicationReview(f.args), { code: expected })
})

test('pending and archive decisions cannot authorize current publication', () => {
  const f = publicationFixture()
  f.receipt.documents[0].decision = 'pending'; f.pin()
  const pending = validateDocumentPublicationReview(f.args)
  assert.equal(pending.complete, false)
  assert.equal(pending.documents[0].reason, 'pending-review')
  assert.equal(pending.documents[0].eligible, false)
  f.receipt.documents[0].decision = 'approved'; f.receipt.documents[0].classification = 'archive'
  f.args.documents[0].status = 'preserved'; f.pin()
  const archived = validateDocumentPublicationReview(f.args)
  assert.equal(archived.documents[0].classification, 'archive-reviewed')
  assert.equal(archived.documents[0].reason, 'archive-only')
  assert.equal(archived.documents[0].eligible, false)
  assert.equal(archived.complete, false)
})

function materializedReviewFixture(mutate = () => {}) {
  const f = publicationFixture()
  mutate(f)
  const publicationReview = validateDocumentPublicationReview(f.args)
  const evidence = { closure: { evidencePath: 'closure-receipt.json', reviewedAt: '2026-10-19', controls: [], excluded: [] },
    baseline: { evidencePath: 'baseline.json', reviewedAt: '2026-10-13T00:00:00Z' } }
  const receipts = documentReviewReceipts({ documents: f.input.contract.documents, publicationReview, createdDocuments: [], baseline: f.input.baseline, evidence })
  const review = materializeIndependentReview({ original: f.args.original, current: f.args.current, documents: f.input.contract.documents, sources: f.args.sources, receipts })
  // The synthetic publication review cannot mint authority, so the review block
  // is exercised in migration mode where publication authority is not demanded.
  f.input.review = review
  delete f.input.current.publicationReview
  const validate = input => validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })
  return { f, publicationReview, receipts, review, validate }
}

test('machine coverage review derives every extracted key and covers only authenticated receipts', () => {
  const { f, receipts, review, validate } = materializedReviewFixture()
  assert.deepEqual(receipts.map(row => [row.sourcePath, row.disposition, row.evidencePath, row.reviewedAt]),
    [[sourcePath, 'reviewed', '.omo/evidence/read.md', '2026-10-13'], [sealedPath, 'preserved', 'baseline.json', '2026-10-13T00:00:00Z']])
  assert.equal(review.originalKeys.length, 12)
  assert.equal(review.currentKeys.length, 12)
  assert.deepEqual(review.receipts.map(row => [row.coveredKeys.length, row.currentHashes.length, row.disposition, row.batchId]),
    [[6, 6, 'reviewed', 'batch:a'], [6, 6, 'preserved', null]])
  assert.equal(review.receipts[0].currentHashes.every(entry => review.currentKeys.some(key => key.key === entry.key && key.sha256 === entry.sha256)), true)
  assert.doesNotThrow(() => validateIndependentReview(review, f.args.original, f.args.current, f.input.contract.documents))
  assert.deepEqual(validate(f.input), { ok: true, errors: [] })
  const changed = materializedReviewFixture(fixture => { fixture.input.baseline.files[0].sha256 = sha256('older bytes') })
  assert.equal(changed.receipts[0].disposition, 'revised')
  assert.deepEqual(changed.validate(changed.f.input), { ok: true, errors: [] })
})

test('machine coverage review leaves a document without an authenticated receipt uncovered', () => {
  const { f, receipts, review, validate } = materializedReviewFixture(fixture => { fixture.receipt.documents[0].decision = 'pending'; fixture.pin() })
  assert.deepEqual(receipts.map(row => row.sourcePath), [sealedPath])
  assert.equal(review.originalKeys.length, 12)
  assert.doesNotThrow(() => validateIndependentReview(review, f.args.original, f.args.current, f.input.contract.documents))
  assert.deepEqual(validate(f.input).errors[0], { code: 'E_REVIEW_COVERAGE', path: '/review/originalKeys', id: review.originalKeys[0].key })
  f.input.review = null
  assert.deepEqual(validate(f.input).errors[0], { code: 'E_SCOPE_SHAPE', path: '/review', id: '' })
})

for (const [name, mutate, expected] of [
  ['tampered original key', review => { review.originalKeys[0].key = review.originalKeys[0].key.replace('neutral', 'forged') }, 'E_REVIEW_COVERAGE'],
  ['omitted current key', review => { review.currentKeys.shift() }, 'E_REVIEW_COVERAGE'],
  ['stale current hash', review => { review.currentKeys[0].sha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['wrong owner batch', review => { review.originalKeys[0].batchId = 'other' }, 'E_APPROVAL_BATCH'],
]) test(`materialized review rejects ${name} after derivation`, () => {
  const { f, review, validate } = materializedReviewFixture()
  mutate(review)
  assert.throws(() => validateIndependentReview(review, f.args.original, f.args.current, f.input.contract.documents), { code: expected })
  assert.notEqual(validate(f.input).ok, true)
})

for (const [name, mutate, expected] of [
  ['forged receipt for an unknown source', receipts => { receipts.push({ ...receipts[0], sourcePath: 'lore/unknown.json' }) }, 'E_REVIEW_COVERAGE'],
  ['duplicate receipt', receipts => { receipts.push(clone(receipts[0])) }, 'E_REVIEW_COVERAGE'],
  ['stale receipt hash', receipts => { receipts[0].currentSha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['invented disposition', receipts => { receipts[0].disposition = 'approved' }, 'E_REVIEW_COVERAGE'],
  ['empty evidence', receipts => { receipts[0].evidencePath = ' ' }, 'E_REVIEW_COVERAGE'],
  ['unknown receipt field', receipts => { receipts[0].approved = true }, 'E_SCOPE_SHAPE'],
]) test(`materializer rejects ${name}`, () => {
  const { f, receipts } = materializedReviewFixture()
  mutate(receipts)
  assert.throws(() => materializeIndependentReview({ original: f.args.original, current: f.args.current, documents: f.input.contract.documents, sources: f.args.sources, receipts }), { code: expected })
})

test('inspection exposes exact ineligible rows while publication rejects self-asserted eligibility', () => {
  const f = publicationFixture(); f.args.pins = []; f.args.evidence = []
  const review = validateDocumentPublicationReview(f.args)
  f.input.current.publicationReview = review
  assert.equal(validateSeoulScope(f.input, { mode: 'inspection' }).ok, true)
  assert.equal(code(validateSeoulScope(f.input)), 'E_PUBLICATION_REVIEW_AUTHORITY')
  for (const [mutate, expected] of [
    [r => { r.documents.pop() }, 'E_REVIEW_COVERAGE'],
    [r => { r.documents.push(clone(r.documents[0])) }, 'E_REVIEW_COVERAGE'],
    [r => { r.documents[0].currentSha256 = sha256('stale') }, 'E_REVIEW_HASH'],
    [r => { r.documents[1].eligible = true }, 'E_SCOPE_ADMISSION'],
    [r => { r.complete = true }, 'E_SCOPE_SHAPE'],
    [r => { r.semanticReview = 'reviewed' }, 'E_SCOPE_SHAPE'],
    [r => { r.approved = true }, 'E_SCOPE_SHAPE'],
    [r => { Object.assign(r.documents[0], { eligible: true, classification: 'current-reviewed', reason: 'approved-exact-review',
      receipt: { path: 'source-registration.json', sha256: sha256('self-asserted'), approvalRef: 'not-semantic-review' } }) }, 'E_PUBLICATION_REVIEW_AUTHORITY'],
  ]) {
    f.input.current.publicationReview = clone(review); mutate(f.input.current.publicationReview)
    assert.equal(code(validateSeoulScope(f.input, { mode: 'inspection' })), expected)
  }
})

test('current card body boundaries come from actual headings, not archived span end', () => {
  const document = { content: [{ kind: 'heading', depth: 3, anchor: 'card', text: { ko: '인물 A', en: 'Person A' } }, { kind: 'paragraph', text: { ko: '새 대사', en: 'New dialogue' } }, { kind: 'heading', depth: 3 }] }
  const row = { sourcePath, jsonPointer: '/content/0', anchor: 'card', locale: 'en', startBlock: 0, endBlockExclusive: 1, originalSha256: sha256('old') }
  const categories = { leaves: [], blocks: [], headings: ['en', 'ko'].map(locale => ({ sourcePath, jsonPointer: '/content/0', anchor: 'card', locale, startBlock: 0, endBlockExclusive: 2, originalSha256: sha256(JSON.stringify(document.content[0])) })), cards: [row], markdown: [], lines: [] }
  const current = extractCurrentCategories(new Map([[sourcePath, { value: document }]]), categories)
  assert.equal(current.cards[0].endBlockExclusive, 2)
  assert.equal(current.cards[0].originalSha256, sha256(JSON.stringify(document.content.slice(0, 2))))
})

test('shared source dependencies cannot be divided into independently approved person batches', () => {
  const input = fixture()
  const dependencies = { sharedSourceGroups: [{ personIds: ['K001', 'K002'], nodes: ['K001', 'K002', `file:${sourcePath}`] }] }
  // Closure cross-batch admission is a publication contract; inspection only diagnoses unresolved refs.
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'publication' }))
  input.contract.entities[1].status = 'pending'
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'publication' }), { code: 'E_SCOPE_PENDING' })
  input.contract.entities[1].status = 'active'; input.contract.entities[1].batchId = 'batch:b'
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'publication' }), { code: 'E_APPROVAL_BATCH' })
  bindBatch(input); bindBatch(input, 'batch:b')
  input.batches[0].dependencyBatchIds = ['batch:b']; input.batches[1].dependencyBatchIds = ['batch:a']
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'publication' }))
  input.contract.documents[0].status = 'pending'
  // Required unresolved reader refs fail publication even when their source remains pending/private.
  dependencies.unresolved = [{ sourcePath, jsonPointer: '/reader', required: true }]
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'publication' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
})

test('current headings and cards follow unique stable anchors after block insertion', () => {
  const first = { kind: 'heading', depth: 3, anchor: 'first', text: { ko: '인물 A', en: 'Person A' } }
  const second = { kind: 'heading', depth: 3, anchor: 'second', text: { ko: '인물 B', en: 'Person B' } }
  const paragraph = { kind: 'paragraph', text: { ko: '본문', en: 'Body' } }
  const rows = [first, second].flatMap((block, i) => ['en', 'ko'].map(locale => ({ sourcePath, jsonPointer: `/content/${i * 2}`, anchor: block.anchor, locale, startBlock: i * 2, endBlockExclusive: i * 2 + 2, originalSha256: sha256(JSON.stringify(block)) })))
  const original = { leaves: [], blocks: [], headings: clone(rows), cards: clone(rows), markdown: [], lines: [] }
  const saved = clone(original)
  const value = { content: [first, paragraph, paragraph, second, paragraph] }
  const sources = new Map([[sourcePath, { value }]])
  const actual = extractCurrentCategories(sources, original)
  assert.deepEqual(actual.headings.map(row => row.jsonPointer), ['/content/0', '/content/0', '/content/3', '/content/3'])
  assert.equal(actual.cards[2].startBlock, 3)
  assert.equal(actual.cards[2].endBlockExclusive, 5)
  assert.equal(actual.cards[2].originalSha256, sha256(JSON.stringify(value.content.slice(3))))
  assert.deepEqual(original, saved)
  second.text.en = 'Person Renamed'
  assert.equal(extractCurrentCategories(sources, original).headings[2].name, 'Person Renamed')
  assert.deepEqual(original, saved)
  value.content.push(second)
  assert.throws(() => extractCurrentCategories(sources, original), { code: 'E_REVIEW_COVERAGE' })
  value.content.pop()
  value.content[3] = { ...second, anchor: 'unapproved-new-card' }
  assert.throws(() => extractCurrentCategories(sources, original), { code: 'E_REVIEW_COVERAGE' })
})

test('large source traversal is not bounded by the engine function argument limit', () => {
  const value = { content: Array.from({ length: 140000 }, (_, i) => `dialogue:${i}`) }
  const original = { leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  const actual = extractCurrentCategories(new Map([[sourcePath, { value }]]), original)
  assert.equal(actual.leaves.length, value.content.length)
  assert.equal(actual.leaves.at(-1)[4], sha256('dialogue:139999'))
})

test('archived event identity survives prose rewriting but not deletion or anchor replacement', () => {
  const documents = {
    'lore/name-pools/person-id-registry.json': { persons: [] },
    'lore/relations/opening-feudal-allocation.json': { titles: [], grants: [], existingTitleBindings: [] },
    'lore/relations/personal-holdings.json': { holdings: [], polities: [] },
    'lore/relations/relations.json': { courts: [] },
    'lore/factions/Sixteen-States.json': { content: [] },
    'lore/characters/Cast-Relations.json': { content: [] },
    'lore/chronology/Century-Annals.json': { content: [{ kind: 'paragraph', anchor: 'event-a', text: { ko: '새 서사', en: 'Revised narrative' } }] },
  }
  const sources = new Map(Object.entries(documents).map(([path, value]) => [path, { value, sha256: sha256(JSON.stringify(value)) }]))
  const originalIds = ['E:event-a']
  assert.deepEqual(extractEntityRecords(sources, originalIds).events.map(row => row.id), originalIds)
  assert.equal(extractEntityRecords(sources).events.length, 0)
  documents['lore/chronology/Century-Annals.json'].content[0].anchor = 'replacement'
  assert.equal(extractEntityRecords(sources, originalIds).events.length, 0)
  documents['lore/chronology/Century-Annals.json'].content = []
  assert.equal(extractEntityRecords(sources, originalIds).events.length, 0)
  assert.deepEqual(originalIds, ['E:event-a'])
})

test('unindexed person headings fail at every depth and with rich-text titles', () => {
  const original = { leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  for (const depth of [2, 3, 4]) for (const title of ['인물 새 인물', [{ text: '인물 ' }, { text: '새 인물', strong: true }]]) {
    const value = { content: [{ kind: 'heading', depth, anchor: 'unindexed', text: { ko: title, en: 'New heading' } }] }
    assert.throws(() => extractCurrentCategories(new Map([[sourcePath, { value }]]), original), { code: 'E_REVIEW_COVERAGE' })
  }
  const block = { kind: 'heading', depth: 2, anchor: 'index', text: { ko: '인물 총람', en: 'Cast index' } }
  const value = { content: [block] }
  original.blocks = [{ sourcePath, jsonPointer: '/content/0', anchor: 'index', locale: 'neutral', originalSha256: sha256(JSON.stringify(block)) }]
  assert.doesNotThrow(() => extractCurrentCategories(new Map([[sourcePath, { value }]]), original))
  block.text.ko = '인물 새 인물'
  assert.throws(() => extractCurrentCategories(new Map([[sourcePath, { value }]]), original), { code: 'E_REVIEW_COVERAGE' })
})

const cli = resolve(fileURLToPath(new URL('./check-seoul-scope.mjs', import.meta.url)))
function dependencyFixture() {
  const documents = {
    'lore/characters/Cast-Relations.json': { content: [] },
    'lore/name-pools/cast-family-trees.json': { nodes: [{ id: 'FH-A' }], edges: [] },
    'lore/relations/relations.json': { courts: [], directRetainers: [], ownerLieges: { edges: [] }, courtMemberships: { memberships: [] } },
    'lore/name-pools/cast-household-relations.json': { people: [] },
    'lore/name-pools/cast-prose-contacts.json': { records: [] },
    'lore/relations/personal-holdings.json': { holdings: [{ id: 'h', facilityRef: {
      sourcePath: 'lore/regions/station-interiors.json', stationName: 'A', stationIdentity: { district: 'D', lat: 1, lon: 2 }, layerId: 'concourse',
      siteSourcePath: 'lore/regions/content/site.json', siteAnchor: 'osm:node:1',
    } }] },
    'lore/regions/station-interiors.json': { stations: [{ name: 'A', district: 'D', lat: 1, lon: 2, layers: [{ id: 'concourse' }] }] },
    'lore/regions/content/site.json': { regions: [{ content: { buildings: [{ anchor_ref: 'osm:node:1' }] } }] },
    'lore/relations/opening-feudal-allocation.json': { titles: [{ id: 'child', parentTitleId: 'parent' }], existingTitleBindings: [{ holdingId: 'h', titleId: 'child' }] },
    'lore/relations/opening-office-appointments.json': { appointments: [{ personId: 'K001', stateId: 'S01' }] },
    'lore/name-pools/diaspora-family-lineages.json': { lineages: [{ key: 'family', members: [{ key: 'ancestor' }, { key: 'child', parentKeys: ['ancestor'] }] }] },
    'lore/editorial/Soul-Candidates.json': { candidates: [{ id: 'candidate', careerSummary: { ko: 'career' } }] },
    'lore/target.json': { content: [{ kind: 'heading', anchor: 'block', publicAnchors: ['alias'], text: { ko: '제목', en: 'Natural Heading' } }] },
    'lore/consumer.json': { refs: [
      { path: 'lore/name-pools/cast-family-trees.json', anchor: 'FH-A' },
      { path: 'lore/editorial/Soul-Candidates.json', anchor: 'candidates/candidate/careerSummary' },
      { path: 'lore/name-pools/diaspora-family-lineages.json', anchor: 'family/child' },
      { text: 'linked', link: { domain: 'root', slug: 'target', anchor: 'natural-heading' } },
      'GDD/canon/source.json#unknown', { repository: 'external', path: 'source.json', commit: 'revision', sha256: sha256('unread') },
      'lore/target.json#/content/99',
    ] },
  }
  return new Map(Object.entries(documents).map(([path, value]) => { const bytes = Buffer.from(JSON.stringify(value)); return [path, { value, bytes, sha256: sha256(bytes) }] }))
}

test('typed facility pairs resolve station layer and site independently, never a crossed anchor', () => {
  const sources = dependencyFixture()
  const graph = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  const refs = graph.references.filter(r => r.source.jsonPointer === '/holdings/0/facilityRef')
  assert.deepEqual(refs.map(r => [r.vocabulary, r.targets[0].sourcePath, r.targets[0].jsonPointer]), [
    ['station-layer', 'lore/regions/station-interiors.json', '/stations/0/layers/0'],
    ['site', 'lore/regions/content/site.json', '/regions/0/content/buildings/0/anchor_ref'],
  ])
  const value = sources.get('lore/relations/personal-holdings.json').value.holdings[0].facilityRef
  ;[value.sourcePath, value.siteSourcePath] = [value.siteSourcePath, value.sourcePath]
  const wrong = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  assert.equal(wrong.unresolved.filter(r => ['station-layer', 'site'].includes(r.vocabulary)).length, 2)
})

test('source contracts resolve keyed candidates, family and lineage without accepting duplicates', () => {
  const sources = dependencyFixture(); const resolveRef = createDependencyResolver(sources)
  for (const [path, selector, pointer] of [
    ['lore/editorial/Soul-Candidates.json', 'candidates/candidate', '/candidates/0'],
    ['lore/editorial/Soul-Candidates.json', 'candidates/candidate/careerSummary', '/candidates/0/careerSummary'],
    ['lore/name-pools/cast-family-trees.json', 'FH-A', '/nodes/0'],
    ['lore/name-pools/diaspora-family-lineages.json', 'family/child', '/lineages/0/members/1'],
  ]) assert.equal(resolveRef(path, 'lore/consumer.json', selector).targets[0].jsonPointer, pointer)
  sources.get('lore/name-pools/cast-family-trees.json').value.nodes.push({ id: 'FH-A' })
  assert.equal(createDependencyResolver(sources)('lore/name-pools/cast-family-trees.json', '', 'FH-A').reason, 'selector-not-unique')
})

test('renderer natural headings and aliases retain record targets while missing fragments and external evidence stay unresolved', () => {
  const sources = dependencyFixture(); const graph = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  const link = graph.references.find(r => r.vocabulary === 'renderer')
  assert.equal(link.status, 'resolved'); assert.equal(link.targets[0].jsonPointer, '/content/0')
  assert.equal(createDependencyResolver(sources)('lore/target.json', '', 'alias', 'renderer').status, 'resolved')
  assert.ok(graph.unresolved.some(r => r.target === 'lore/target.json#/content/99'))
  const external = graph.unresolved.filter(r => r.external)
  assert.equal(external.length, 2); assert.equal(external[1].external.revision, 'revision')
  assert.equal(external[1].external.targetSha256, sha256('unread'))
})

test('schema edges retain separate title, holding, state and lineage namespaces', () => {
  const graph = extractDependencies(dependencyFixture(), [{ id: 'K001', name: 'A' }], {})
  for (const [kind, fromKey, toKey] of [
    ['title-parent', 'entity:titles:child', 'entity:titles:parent'],
    ['holding-title-binding', 'entity:holdings:h', 'entity:titles:child'],
    ['appointment-person-state', 'identity:K001', 'entity:states:S01'],
    ['lineage-parent', 'lineage:family:ancestor', 'lineage:family:child'],
  ]) {
    const edge = graph.edges.find(e => e.kind === kind)
    assert.equal(edge.fromKey, fromKey); assert.equal(edge.toKey, toKey)
    const { actual, expected } = censusFixture()
    actual.dependencies = clone(graph); expected.dependencies = graph
    actual.dependencies.edges = actual.dependencies.edges.filter(e => e.kind !== kind)
    assert.equal(code(validateCensusProducts(actual, expected)), 'E_REVIEW_COVERAGE')
  }
})

test('original diagnostic dispositions reject stale source bytes and keep raw targets', () => {
  const sources = dependencyFixture(); const path = 'lore/consumer.json'; const value = sources.get(path).value.refs[0]
  const original = { sourcePath: path, jsonPointer: '/refs/0', sourceSha256: sources.get(path).sha256,
    recordSha256: sha256(JSON.stringify(value)), target: `${value.path}#${value.anchor}`, reviewStatus: 'not-reviewed' }
  const row = { key: JSON.stringify([path, '/refs/0', original.target, original.recordSha256]), original,
    classification: 'parser-vocabulary', currentResolution: 'family-node-id' }
  const result = dependencyDispositions(sources, [row], createDependencyResolver(sources))
  assert.deepEqual(result[0].original, original); assert.equal(result[0].status, 'resolved')
  const { actual, expected } = censusFixture(); actual.dependencies = clone(result); expected.dependencies = result
  actual.dependencies.pop()
  assert.equal(code(validateCensusProducts(actual, expected)), 'E_REVIEW_COVERAGE')
  sources.get(path).sha256 = sha256('changed')
  assert.throws(() => dependencyDispositions(sources, [row], createDependencyResolver(sources)), { code: 'E_REVIEW_HASH' })
})

test('changed current evidence does not inherit a stale historical coordinate disposition', () => {
  const sources = dependencyFixture(); const path = 'lore/consumer.json'; const before = sources.get(path)
  const original = { sourcePath: path, jsonPointer: '/refs/0', sourceSha256: before.sha256,
    recordSha256: sha256(JSON.stringify(before.value.refs[0])), target: 'lore/missing.json' }
  const triage = [{ key: JSON.stringify([path, '/refs/0', original.target, original.recordSha256]), original,
    classification: 'actual-dangling-current', currentResolution: 'stale-current-coordinate-with-sealed-evidence', targets: [] }]
  const value = clone(before.value)
  value.refs[0] = { path: 'lore/target.json', pointer: '/content/0', quote: '제목' }
  const bytes = Buffer.from(JSON.stringify(value)); sources.set(path, { value, bytes, sha256: sha256(bytes) })
  const graph = extractDependencies(sources, [], {}, triage, new Map(), new Map([[path, { beforeSha256: before.sha256, afterSha256: sha256(bytes) }]]))
  assert.equal(graph.dispositions[0].status, 'unresolved')
  assert.equal(graph.references.find(row => row.source.sourcePath === path && row.source.jsonPointer === '/refs/0').status, 'resolved')
})

test('typed explicit issued-history evidence resolves only the sealed namespace', () => {
  const sources = dependencyFixture(); const path = 'vendor/issued-history/corpus/lore/old.json'
  const value = { content: [{ text: { ko: 'old evidence' } }] }; const bytes = Buffer.from(JSON.stringify(value))
  sources.set(path, { value, bytes, sha256: sha256(bytes) })
  const resolver = createDependencyResolver(sources)
  assert.equal(resolver(path, '', '/content/0/text/ko', 'typed:path').status, 'sealed-evidence')
  assert.equal(resolver('lore/old.json', '', '/content/0/text/ko', 'typed:path').status, 'unresolved')
  assert.equal(resolver(path, '', '/content/99/text/ko', 'typed:path').status, 'unresolved')
})

test('unchanged typed selector keeps its authenticated fragment-form correspondence', () => {
  const sources = dependencyFixture(); const path = 'lore/consumer.json'; const source = sources.get(path)
  const value = source.value.refs[0]
  const original = { sourcePath: path, jsonPointer: '/refs/0', sourceSha256: source.sha256,
    recordSha256: sha256(JSON.stringify(value)), target: `${value.path}#${value.anchor}` }
  const target = { sourcePath: value.path, jsonPointer: '/nodes/0', sourceSha256: sources.get(value.path).sha256,
    recordSha256: sha256(JSON.stringify(sources.get(value.path).value.nodes[0])) }
  const triage = [{ key: JSON.stringify([path, '/refs/0', original.target, original.recordSha256]), original,
    classification: 'parser-vocabulary', currentResolution: 'explicit-moved-provenance', targets: [target] }]
  const graph = extractDependencies(sources, [], {}, triage)
  const ref = graph.references.find(row => row.source.sourcePath === path && row.source.jsonPointer === '/refs/0')
  assert.equal(ref.status, 'provenance-correspondence')
  assert.deepEqual(ref.targets, [target])
})

const provenanceRoot = resolve(import.meta.dirname, '..')
const provenanceReceiptPath = '.omo/private/seoul-migration/required-provenance-bindings-20261015.json'
async function requiredProvenanceFixture(readBytes = readFile) {
  const receipt = JSON.parse(await readFile(resolve(provenanceRoot, provenanceReceiptPath)))
  const paths = [...new Set(receipt.bindings.flatMap(row => [row.sourcePath, ...(row.targets ?? []).map(target => target.sourcePath)]))]
  const sources = new Map(await Promise.all(paths.map(async path => {
    const bytes = await readBytes(resolve(provenanceRoot, path))
    return [path, { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) }]
  })))
  return { receipt, sources }
}

for (const mutation of ['authentic', 'tampered', 'missing']) {
  test(`required provenance recovers final region predecessor without recursion: ${mutation}`, async () => {
    const climateReader = await climateLinkPredecessorReader(provenanceRoot, readFile)
    const { sources } = await requiredProvenanceFixture(climateReader)
    // Match the checker's authenticated pre-retrofit provenance input.
    const archive = JSON.parse(await readFile(resolve(provenanceRoot,
      '.omo/private/seoul-migration/office-retrofit-candidate-20261017/source-before.json')))
    for (const entry of archive.files) {
      const bytes = gunzipSync(Buffer.from(entry.gzipBase64, 'base64'))
      assert.equal(sha256(bytes), entry.rawSha256)
      sources.set(entry.path, { bytes, sha256: entry.rawSha256, value: JSON.parse(bytes) })
    }
    const region = 'lore/regions/content/11305.json'
    let currentReads = 0; let preimageReads = 0
    const reader = async path => {
      if (path === resolve(provenanceRoot, region)) {
        assert.ok(++currentReads <= 1000, 'historical recovery repeated the same current-byte lookup')
      }
      return climateReader(path)
    }
    const readGit = async binding => {
      if (binding.path === region) {
        preimageReads += 1
        assert.equal(binding.revision, '6754735a88420f68830308658206c1e9b2d971a5')
        if (mutation === 'tampered') return Buffer.from('{}\n')
        if (mutation === 'missing') throw Object.assign(new Error('missing preserved preimage'), { code: 'ENOENT' })
      }
      const bytes = (await promisify(execFile)('git', ['-C', binding.repositoryRoot, 'show', `${binding.revision}:${binding.path}`],
        { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
      if (binding.path === region) assert.equal(sha256(bytes), 'f68e0906488a59b07b100e1d6db351f750c48b481c515c809e5768a99740d5f2')
      return bytes
    }
    const result = loadRequiredProvenance(provenanceRoot, sources, reader, readGit)
    if (mutation === 'authentic') {
      const resolved = await result
      const removed = [...resolved].filter(([key]) => JSON.parse(key)[0] === region)
      assert.equal(removed.length, 3)
      assert.ok(removed.every(([, row]) => row.status === 'removed-by-authenticated-source-successor'))
      for (const path of ['lore/characters/Cast-Relations.json', 'lore/name-pools/cast-family-trees.json',
        'lore/relations/relations.json', 'lore/name-pools/cast-household-relations.json',
        'lore/name-pools/cast-prose-contacts.json', 'lore/relations/personal-holdings.json',
        'lore/relations/opening-feudal-allocation.json']) {
        if (sources.has(path)) continue
        const bytes = await readFile(resolve(provenanceRoot, path))
        sources.set(path, { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) })
      }
      assert.doesNotThrow(() => extractDependencies(sources, [], {}, [], new Map(), new Map(), resolved))
      const forged = new Map(resolved)
      for (const [key, disposition] of removed) forged.set(key, structuredClone(disposition))
      assert.throws(() => extractDependencies(sources, [], {}, [], new Map(), new Map(), forged),
        { code: 'E_REVIEW_COVERAGE', path: '/census/requiredProvenance' })
    }
    else await assert.rejects(result, { code: mutation === 'missing' ? 'ENOENT' : 'E_REVIEW_HASH' })
    assert.ok(preimageReads > 0)
  }, 120000)
}

test('current provenance consumes moved pointers and the reviewed bilingual counterpart without fact authority', async () => {
  const climateReader = await climateLinkPredecessorReader(provenanceRoot, readFile)
  const { receipt, sources } = await requiredProvenanceFixture(climateReader)
  // This historical post-S14 contract pins the approved S14 candidate; later Core prose belongs to subsequent successor tests.
  const corePath = 'lore/characters/Core-Characters.json'
  const coreBytes = await readFile(resolve(provenanceRoot, '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/core-source-candidate.json'))
  assert.equal(sha256(coreBytes), '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96')
  sources.set(corePath, { bytes: coreBytes, sha256: sha256(coreBytes), value: JSON.parse(coreBytes) })
  const resolved = await loadRequiredProvenance(provenanceRoot, sources, climateReader)
  assert.equal(resolved.size, 224)
  // post108/combined owner-approved successors remove or move source leaves; pin the complete exact key inventory, including 47 removed bindings.
  assert.equal(sha256(JSON.stringify([...resolved.keys()])), '75dc267a3cc2715408338a440ebe2c52e7421619d06da8f64ff265a6a49bc722')
  const foodPath = 'lore/culture/Food-Culture.json'
  const english = sources.get(foodPath).value.content[3].text.en[1]
  assert.ok(resolved.has(JSON.stringify([foodPath, '/content/3/text/en/1', 'GDD/rules/Rules-EconomyLogistics', sha256(JSON.stringify(english))])))
  const counts = {}
  // Historical repin records lack boundary metadata; pin all 18 exact identities rather than minting current semantic authority.
  const withoutBoundary = [...resolved].filter(([, row]) => !row.provenanceBoundary)
  assert.equal(withoutBoundary.length, 18)
  assert.equal(sha256(JSON.stringify(withoutBoundary.map(([key]) => key))), '9c5112e7c4a1dfb044eded5a21df27120462b70b84815e7e86eab173a7967337')
  for (const row of resolved.values()) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
    if (row.status === 'unresolved') {
      // Owner-preserved legacy sheet evidence is not a current semantic authority; exact unresolved key stays visible.
      assert.equal(row.provenanceBoundary, undefined)
      assert.deepEqual(row.targets, [])
      continue
    }
    if (!row.provenanceBoundary) {
      assert.ok(['resolved', 'sealed-evidence', 'external-provenance'].includes(row.status))
      assert.ok(row.targets.every(target => target.sourceSha256 && target.recordSha256))
      continue
    }
    if (row.status === 'removed-by-authenticated-source-successor') {
      // final-closure metadata corrections and fullbody successor removals have distinct authenticated review boundaries.
      assert.ok(['independent-fullbody-approved', 'reviewed-reference-metadata-correction'].includes(row.provenanceBoundary.semanticReview))
    } else assert.equal(row.provenanceBoundary.semanticReview, row.status === 'removed-by-owner-authority' ? 'owner-authorized-removal' : 'not-reviewed')
    assert.equal(row.provenanceBoundary.currentFactAuthority, false)
  }
  assert.deepEqual(counts, { 'historical-observation': 5, 'external-provenance': 149, resolved: 16, 'sealed-evidence': 2,
    'removed-by-owner-authority': 8, unresolved: 1, 'removed-by-authenticated-source-successor': 39, 'historical-provenance': 4 })
  const special = resolved.get(JSON.stringify(['lore/editorial/soul-batches/special.json', '/assignments/26/evidence/2',
    'lore/characters/Core-Characters.json', '1eb9b72917f643bd7fd24009e846b202dab7b172b4a6a8c5e6b5eebcefb884c8']))
  assert.equal(special.status, 'resolved')
  assert.equal(special.targets[0].sourceSha256, '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96')
  assert.equal(special.targets[0].recordSha256, 'be7f99ed01f87a08bbddf97ca9e2a7859baf279b174bfa5556dbd7120b92a3f3')
  const fiction = receipt.bindings.filter(row => row.target.endsWith('#SRC-SEOUL-FICTION-BOUNDARY'))
  assert.equal(fiction.length, 111)
  for (const row of fiction) {
    const key = [...resolved.keys()].find(key => { const value = JSON.parse(key); return value[0] === row.sourcePath && value[2] === row.target })
    assert.equal(resolved.get(key).targets[0].jsonPointer, 'JSON.parse(/blocks/5/text)/records/1')
  }
  for (const path of ['lore/characters/Cast-Relations.json', 'lore/name-pools/cast-family-trees.json',
    'lore/relations/relations.json', 'lore/name-pools/cast-household-relations.json',
    'lore/name-pools/cast-prose-contacts.json', 'lore/relations/personal-holdings.json',
    'lore/relations/opening-feudal-allocation.json']) {
    if (sources.has(path)) continue
    const bytes = await readFile(resolve(provenanceRoot, path))
    sources.set(path, { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) })
  }
  assert.doesNotThrow(() => extractDependencies(sources, [], {}, [], new Map(), new Map(), resolved))
})

for (const mutation of ['wrong-reference-value', 'unapproved-rehashed-successor', 'forged-parsed-neighbor', 'historical-before-bytes', 'successor-receipt', 'core-successor-leaf', 'core-successor-archive'])
  test(`required provenance rejects ${mutation} even with valid current source hashes`, async () => {
    const { receipt, sources } = await requiredProvenanceFixture()
    const path = 'lore/characters/Cast-Corridors-Index.json'
    const row = receipt.bindings.find(binding => binding.sourcePath === path)
    const source = sources.get(path)
    if (mutation === 'forged-parsed-neighbor') {
      source.value.content[1].text.ko = 'forged neighboring edit without matching raw bytes'
    }
    if (mutation === 'wrong-reference-value') {
      source.value.content[4].items[0].ko[0].link.slug = 'rules/Invented'
      source.bytes = Buffer.from(JSON.stringify(source.value))
      source.sha256 = sha256(source.bytes)
    }
    if (mutation === 'unapproved-rehashed-successor') {
      source.value.content[1].text.ko = 'unapproved neighboring edit'
      source.bytes = Buffer.from(JSON.stringify(source.value))
      source.sha256 = sha256(source.bytes)
    }
    if (mutation === 'core-successor-leaf') {
      const core = sources.get('lore/characters/Core-Characters.json')
      core.value.content[152].text.ko += ' altered outside exact approved replacement'
      core.bytes = Buffer.from(JSON.stringify(core.value))
      core.sha256 = sha256(core.bytes)
    }
    const reader = async path => {
      const bytes = await readFile(path)
      if (mutation === 'historical-before-bytes' && path.endsWith(`/six-doc-remediation-20261015/before/${row.sourcePath}`)) return Buffer.from('{}')
      if (mutation === 'successor-receipt' && path.endsWith('/current-provenance-successor-20261015/receipt-v2.json')) return Buffer.concat([bytes, Buffer.from(' ')])
      if (mutation === 'core-successor-archive' && path.endsWith('/core-six-reviewed-source-application-20261015/before.core-characters.json.gz.b64')) return Buffer.concat([bytes, Buffer.from(' ')])
      return bytes
    }
    // The post-S14 successor receipt authenticates current Core bytes before
    // dependency resolution, so an unapproved leaf edit fails at that seal.
    await assert.rejects(loadRequiredProvenance(provenanceRoot, sources, reader), { code: 'E_REVIEW_HASH' })
  })

for (const [path, archive] of [
  ['lore/offices/Offices-and-Ranks.json', '/reload-mass-phase-20261015/offices/Offices-and-Ranks.before.json'],
  ['lore/relations/state-formation-contract.json', '/formation-current-repair-20261015/before.json'],
]) test(`required provenance rejects altered historical archive for ${path}`, async () => {
  const { sources } = await requiredProvenanceFixture()
  const reader = async file => file.endsWith(archive) ? Buffer.from('{}') : readFile(file)
  await assert.rejects(loadRequiredProvenance(provenanceRoot, sources, reader), { code: 'E_REVIEW_HASH' })
})

for (const mutation of ['receipt-path', 'receipt-record-hash', 'external-bytes', 'local-record', 'local-hash', 'sealed-target', 'historical-bytes'])
  test('required provenance rejects tampered ' + mutation, async () => {
    const { receipt, sources } = await requiredProvenanceFixture()
    const proof = receipt.bindings.find(row => row.kind === 'repaired-current-coordinate')
    if (mutation === 'local-record') sources.get(proof.sourcePath).value.assignments[1009].evidence[2].anchor = 'missing'
    if (mutation === 'local-hash') sources.get(proof.sourcePath).sha256 = '0'.repeat(64)
    if (mutation === 'sealed-target') sources.get('vendor/issued-history/corpus/lore/characters/Core-Characters.json').value.content[176].text.ko = 'changed'
    const reader = async path => {
      const bytes = await readFile(path)
      if (path === resolve(provenanceRoot, provenanceReceiptPath) && mutation.startsWith('receipt-')) {
        const value = JSON.parse(bytes)
        if (mutation === 'receipt-path') value.bindings[0].target = 'invented'
        else value.bindings[0].recordSha256 = '0'.repeat(64)
        return Buffer.from(JSON.stringify(value))
      }
      if (mutation === 'external-bytes' && path.includes('/seoul-dengoku-gdd/')) return Buffer.concat([bytes, Buffer.from(' ')])
      return bytes
    }
    await assert.rejects(loadRequiredProvenance(provenanceRoot, sources, reader,
      mutation === 'historical-bytes' ? async () => Buffer.from('wrong pinned object') : undefined),
    mutation === 'local-hash' ? { code: 'E_REVIEW_HASH' } : error => /^E_/.test(error.code))
  })

test('required unresolved evidence is visible in inspection but blocks publication and an approved batch', () => {
  const input = fixture(); input.contract.entities.forEach(e => { e.status = 'pending' })
  input.contract.documents[0].status = 'pending'; input.batches = []
  const dependencies = { unresolved: [{ sourcePath, jsonPointer: '/missing', required: true }], sharedSourceGroups: [] }
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, [], dependencies, { mode: 'inspection' }))
  assert.throws(() => validateDependencyClosure(input.contract, [], dependencies, { mode: 'publication' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
  bindBatch(input)
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'inspection' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'migration', batchId: 'batch:a' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
})

function profileCitationFixture(field = 'skills') {
  const sources = dependencyFixture()
  const path = `lore/editorial/profile-batches/state-${field === 'skills' ? '09-10' : '15-16'}.json`
  const target = `lore/characters/Cast-State-${field === 'skills' ? '09' : '15'}.json`
  const anchor = `인물-A-p${field === 'skills' ? '3' : '4'}`
  const basis = field === 'skills' ? `${target}#${anchor}, 인물-A-p4; 근거.` : `${target}#${anchor}와 관계·가치 기록. 근거.`
  const put = (path, value) => { const bytes = Buffer.from(JSON.stringify(value)); sources.set(path, { value, bytes, sha256: sha256(bytes) }) }
  put(target, { content: [{ kind: 'paragraph', anchor, text: { ko: [{ text: '실제 기록' }], en: 'Actual record' } },
    ...(field === 'skills' ? [{ kind: 'paragraph', anchor: '인물-A-p4', text: { ko: '별도 일화' } }] : [])] })
  put(path, { profiles: [{ [field]: [{ basis }], evidence: [{ path: target, anchor, quote: '실제 기록' }] }] })
  return { sources, path, target, field, anchor, basis, put }
}

for (const field of ['skills', 'traits']) test(`profile ${field} delimiters preserve raw diagnostics and exact quoted target hashes`, () => {
  const input = profileCitationFixture(field)
  const graph = extractDependencies(input.sources, [], {})
  const row = graph.profileCitationDispositions[0]
  assert.equal(graph.profileCitationDispositions.length, 1)
  assert.equal(row.status, 'supported-correspondence')
  assert.equal(row.original.target, `${input.target}#${input.anchor}${field === 'skills' ? ',' : '와'}`)
  assert.equal(row.original.reason, 'selector-missing')
  assert.equal(row.original.recordSha256, sha256(JSON.stringify(input.basis)))
  assert.equal(row.original.sourceSha256, input.sources.get(input.path).sha256)
  assert.equal(row.original.required, true)
  assert.equal(row.reviewStatus, 'not-reviewed')
  assert.equal(row.targets.length, field === 'skills' ? 2 : 1)
  for (const [i, target] of row.targets.entries()) {
    assert.equal(target.jsonPointer, `/content/${i}`)
    assert.equal(target.sourceSha256, input.sources.get(input.target).sha256)
    assert.equal(target.recordSha256, sha256(JSON.stringify(input.sources.get(input.target).value.content[i])))
  }
  const reference = graph.references.find(r => r.source.jsonPointer === `/profiles/0/${field}/0/basis`)
  assert.equal(reference.raw, row.original.target)
  assert.deepEqual(reference.targets, row.targets)
  assert.ok(graph.unresolved.some(r => r.target === 'lore/target.json#/content/99'))
})

for (const [name, field, mutate] of [
  ['missing intended anchor', 'skills', i => { i.sources.get(i.target).value.content[0].anchor = 'absent' }],
  ['duplicate intended anchor', 'traits', i => { i.sources.get(i.target).value.content.push(clone(i.sources.get(i.target).value.content[0])) }],
  ['missing second list anchor', 'skills', i => { i.sources.get(i.target).value.content.pop() }],
  ['non-delimiter comma', 'skills', i => { i.sources.get(i.path).value.profiles[0].skills[0].basis = `${i.target}#${i.anchor},suffix` }],
  ['non-delimiter conjunction', 'traits', i => { i.sources.get(i.path).value.profiles[0].traits[0].basis = `${i.target}#${i.anchor}와붙은문자` }],
  ['unquoted evidence', 'traits', i => { i.sources.get(i.path).value.profiles[0].evidence[0].quote = '다른 기록' }],
  ['duplicate corroboration', 'skills', i => { i.sources.get(i.path).value.profiles[0].evidence.push(clone(i.sources.get(i.path).value.profiles[0].evidence[0])) }],
  ['generic consumer', 'skills', i => { i.put('lore/consumer.json', i.sources.get(i.path).value); i.sources.delete(i.path) }],
]) test(`profile delimiter correspondence rejects ${name}`, () => {
  const input = profileCitationFixture(field); mutate(input)
  const graph = extractDependencies(input.sources, [], {})
  assert.equal(graph.profileCitationDispositions.length, 0)
  assert.ok(graph.unresolved.some(r => r.jsonPointer === `/profiles/0/${field}/0/basis` && r.required))
})

for (const field of ['skills', 'traits']) test(`literal ${field === 'skills' ? 'comma' : '와'} anchor wins over profile delimiter interpretation`, () => {
  const input = profileCitationFixture(field)
  const literal = `${input.anchor}${field === 'skills' ? ',' : '와'}`
  input.sources.get(input.target).value.content.push({ kind: 'paragraph', anchor: literal, text: { ko: '실제 앵커' } })
  const graph = extractDependencies(input.sources, [], {})
  const reference = graph.references.find(r => r.source.jsonPointer === `/profiles/0/${field}/0/basis`)
  assert.equal(graph.profileCitationDispositions.length, 0)
  assert.equal(reference.status, 'resolved')
  assert.equal(reference.targets[0].jsonPointer, field === 'skills' ? '/content/2' : '/content/1')
})

let localProvenanceInputs
async function localProvenanceFixture() {
  const sources = dependencyFixture()
  const comparisonPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
  const paths = ['lore/regions/sources/selection.json', 'scripts/data/admin-territorial-catalog.json',
    'snapshots/build-inputs/creative-name-normalization.json', 'snapshots/build-inputs/source-manifest.json',
    'snapshots/build-inputs/SeoulWorldGraph.json', comparisonPath]
  localProvenanceInputs ??= Promise.all(paths.map(async path => [path, await readFile(new URL('../' + path, import.meta.url))]))
  const provenanceSources = new Map()
  for (const [path, bytes] of await localProvenanceInputs) {
    const record = { bytes: Buffer.from(bytes), value: JSON.parse(bytes), sha256: sha256(bytes) }
    ;(path === comparisonPath ? provenanceSources : sources).set(path, record)
  }
  const rebind = path => {
    const source = sources.get(path) ?? provenanceSources.get(path)
    source.bytes = Buffer.from(JSON.stringify(source.value)); source.sha256 = sha256(source.bytes)
  }
  const graph = () => extractDependencies(sources, [], {}, [], provenanceSources)
  return { sources, provenanceSources, comparisonPath, rebind, graph }
}

test('household political rights resolve only through the pinned nonowning contract', async () => {
  const input = await localProvenanceFixture()
  const policy = 'lore/name-pools/household-humanoid-policy.json'
  const contract = 'scripts/approved-daejeon-nonowning-rights.json'
  for (const path of [policy, contract]) {
    const bytes = await readFile(resolve(provenanceRoot, path))
    ;(path === policy ? input.sources : input.provenanceSources).set(path,
      { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) })
  }
  const coordinate = '/politicalPositionContext/polity:daejeon/rightsBasis'
  const reference = input.graph().references.find(row => row.source.sourcePath === policy && row.source.jsonPointer === coordinate)
  assert.equal(reference.status, 'provenance-correspondence')
  assert.equal(reference.targets[0].jsonPointer, '/contract')
  input.sources.get(policy).value.politicalPositionContext['polity:daejeon'].rightsBasis.approvalRef = 'forged'
  input.rebind(policy)
  assert.ok(input.graph().unresolved.some(row => row.sourcePath === policy && row.jsonPointer === coordinate))
})

for (const [path, jsonPointer, targetCount] of [
  ['lore/regions/sources/selection.json', '/comparison_boundary', 1],
  ['scripts/data/admin-territorial-catalog.json', '/sourceRef', 1],
  ['snapshots/build-inputs/creative-name-normalization.json', '/references/2', 3],
]) test('local provenance keeps exact original diagnostic at ' + path + jsonPointer, async () => {
  const input = await localProvenanceFixture(); const graph = input.graph()
  const row = graph.localProvenanceDispositions.find(r => r.original.sourcePath === path)
  assert.equal(graph.localProvenanceDispositions.length, 3)
  assert.equal(row.original.jsonPointer, jsonPointer)
  assert.equal(row.original.sourceSha256, input.sources.get(path).sha256)
  assert.equal(row.original.required, true)
  assert.equal(row.original.reviewStatus, 'not-reviewed')
  assert.equal(row.reviewStatus, 'not-reviewed')
  assert.equal(row.status, 'provenance-correspondence')
  assert.equal(row.targets.length, targetCount)
  for (const ref of row.targets) {
    const source = input.sources.get(ref.sourcePath) ?? input.provenanceSources.get(ref.sourcePath)
    const value = ref.jsonPointer === '' ? source.value : ref.jsonPointer.slice(1).split('/').reduce((v, k) => v[k], source.value)
    assert.equal(ref.sourceSha256, sha256(source.bytes))
    assert.equal(ref.recordSha256, sha256(JSON.stringify(value)))
  }
  const reference = graph.references.find(r => r.source.sourcePath === path && r.source.jsonPointer === jsonPointer)
  assert.equal(reference.raw, row.original.target)
  assert.deepEqual(reference.targets, row.targets)
  assert.equal(graph.unresolved.some(r => r.sourcePath === path && r.jsonPointer === jsonPointer), false)
  if (jsonPointer === '/comparison_boundary') assert.equal(row.provenanceBoundary.currentBoundary, false)
  if (jsonPointer === '/references/2') {
    assert.equal(row.original.target, 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    assert.equal(row.provenanceBoundary.canonicalPath, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    assert.equal(row.provenanceBoundary.currentRuntime, false)
  }
})

for (const [name, path, jsonPointer, mutate] of [
  ['comparison declared hash mismatch', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.sha256 = sha256('other'); i.rebind('lore/regions/sources/selection.json')
  }],
  ['comparison source bytes mismatch', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.provenanceSources.get(i.comparisonPath).bytes = Buffer.from('{}')
  }],
  ['comparison cannot be current geometry', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.current_boundary = true; i.rebind('lore/regions/sources/selection.json')
  }],
  ['comparison wrong source root', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.source_root = '../other'; i.rebind('lore/regions/sources/selection.json')
  }],
  ['admin hash mismatch', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    i.sources.get('scripts/data/admin-territorial-catalog.json').value.sourceSha256 = sha256('other'); i.rebind('scripts/data/admin-territorial-catalog.json')
  }],
  ['missing top-level member despite generic anchor', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    const value = i.sources.get('lore/regions/sources/selection.json').value
    delete value.selected_boundary; value.content = [{ anchor: 'selected_boundary' }]; i.rebind('lore/regions/sources/selection.json')
  }],
  ['duplicate top-level source contract', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    const source = i.sources.get('lore/regions/sources/selection.json')
    source.bytes = Buffer.from('{"selected_boundary":' + JSON.stringify(source.value.selected_boundary) + ',' + source.bytes.toString().slice(1))
    source.value = JSON.parse(source.bytes); source.sha256 = sha256(source.bytes)
  }],
  ['missing manifest', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => i.sources.delete('snapshots/build-inputs/source-manifest.json')],
  ['missing manifest file member', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files.shift(); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['duplicate manifest file contract', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    const files = i.sources.get('snapshots/build-inputs/source-manifest.json').value.files
    files.push(clone(files[0])); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['snapshot hash mismatch', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/SeoulWorldGraph.json').bytes = Buffer.from('{}')
  }],
  ['manifest snapshot hash mismatch', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files[0].sha256 = sha256('other'); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['wrong repository', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.repository = 'other/repository'; i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['wrong revision', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.commit = '0'.repeat(40); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['noncanonical Game producer path', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.path = 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json'; i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['unbound originating import', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files[2].sha256 = sha256('other'); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
]) test('local provenance rejects ' + name, async () => {
  const input = await localProvenanceFixture(); mutate(input)
  const graph = input.graph()
  assert.equal(graph.localProvenanceDispositions.some(r => r.original.sourcePath === path && r.original.jsonPointer === jsonPointer), false)
  assert.ok(graph.unresolved.some(r => r.sourcePath === path && r.jsonPointer === jsonPointer && r.required && r.reviewStatus === 'not-reviewed'))
})

test('local provenance is not a generic member or missing-path fallback', async () => {
  const input = await localProvenanceFixture()
  const value = { refs: [input.sources.get('scripts/data/admin-territorial-catalog.json').value.sourceRef,
    { path: 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json' },
    { path: 'boundaries-kostat-2013/seoul_municipalities_geo.json' }] }
  const bytes = Buffer.from(JSON.stringify(value))
  input.sources.set('lore/unauthorized.json', { value, bytes, sha256: sha256(bytes) })
  const graph = input.graph()
  assert.equal(graph.unresolved.filter(r => r.sourcePath === 'lore/unauthorized.json').length, 3)
  assert.equal(graph.localProvenanceDispositions.length, 3)
})

async function supportingContractFixture() {
  const sources = dependencyFixture(); const provenance = new Map()
  for (const path of ['lore/offices/Offices-and-Ranks.json', 'lore/offices/authoring.schema.json',
    'lore/relations/opening-office-appointments.json', 'lore/regions/seoul-electoral-titles.json',
    'scripts/approved-seoul-rights-transition.json', 'scripts/approved-daejeon-nonowning-rights.json']) {
    const bytes = await readFile(new URL('../' + path, import.meta.url))
    const record = { bytes, sha256: sha256(bytes), value: JSON.parse(bytes) }
    ;(path === 'lore/regions/seoul-electoral-titles.json' || path.startsWith('scripts/') ? provenance : sources).set(path, record)
  }
  const graph = () => extractDependencies(sources, [], {}, [], provenance)
  const rebind = path => {
    const record = sources.get(path) ?? provenance.get(path)
    record.bytes = Buffer.from(JSON.stringify(record.value)); record.sha256 = sha256(record.bytes)
  }
  return { sources, provenance, graph, rebind }
}

test('ten exact local supporting references retain source and selected target hashes', async () => {
  const input = await supportingContractFixture(); const graph = input.graph()
  const rows = graph.localProvenanceDispositions.filter(r => r.provenanceBoundary.kind === 'pinned-supporting-local-contract')
  assert.equal(rows.length, 10)
  for (const row of rows) {
    const source = input.sources.get(row.original.sourcePath)
    const target = row.targets[0]; const record = input.provenance.get(target.sourcePath)
    const value = target.jsonPointer ? target.jsonPointer.slice(1).split('/').reduce((v, key) => v[key], record.value) : record.value
    assert.equal(row.original.sourceSha256, sha256(source.bytes))
    assert.equal(target.sourceSha256, sha256(record.bytes))
    assert.equal(target.recordSha256, sha256(JSON.stringify(value)))
    assert.equal(graph.unresolved.some(r => r.sourcePath === row.original.sourcePath && r.jsonPointer === row.original.jsonPointer), false)
  }
  assert.deepEqual(rows.map(r => r.targets[0].jsonPointer).sort(), ['', '', '', '/records/0', '/records/1', '/records/2',
    '/contract/politicalTitle', '/contract/rights/2', '/contract/rights/3', '/contract/rights/4'].sort())
})

for (const [name, mutate, pointer] of [
  ['target byte mismatch', i => { i.provenance.get('scripts/approved-seoul-rights-transition.json').bytes = Buffer.from('{}') }, '/appointments/1/current/evidence/0'],
  ['wrong appointment selector', i => { i.sources.get('lore/relations/opening-office-appointments.json').value.appointments[1].current.evidence[0].jsonPointer = '/records/1'; i.rebind('lore/relations/opening-office-appointments.json') }, '/appointments/1/current/evidence/0'],
  ['unknown supporting path', i => { i.sources.get('lore/relations/opening-office-appointments.json').value.appointments[1].current.evidence[0].path = 'scripts/unapproved-rights.json'; i.rebind('lore/relations/opening-office-appointments.json') }, '/appointments/1/current/evidence/0'],
  ['geography hash mismatch', i => { i.sources.get('lore/offices/Offices-and-Ranks.json').value.data.territorialScale.geographicSource.sha256 = sha256('wrong'); i.rebind('lore/offices/Offices-and-Ranks.json') }, '/data/territorialScale/geographicSource'],
  ['geography target byte mismatch', i => { i.provenance.get('lore/regions/seoul-electoral-titles.json').bytes = Buffer.from('{}') }, '/data/territorialScale/geographicSource'],
]) test('supporting local contracts reject ' + name, async () => {
  const input = await supportingContractFixture(); mutate(input)
  const graph = input.graph()
  assert.equal(graph.localProvenanceDispositions.some(r => r.original.jsonPointer === pointer && r.provenanceBoundary.kind === 'pinned-supporting-local-contract'), false)
  assert.ok(graph.unresolved.some(r => r.jsonPointer === pointer && r.required))
})

test('supporting contracts do not admit an unrelated consumer', async () => {
  const input = await supportingContractFixture()
  const value = { path: 'scripts/approved-seoul-rights-transition.json', jsonPointer: '/records/0' }
  const bytes = Buffer.from(JSON.stringify(value))
  input.sources.set('lore/unauthorized.json', { value, bytes, sha256: sha256(bytes) })
  const graph = input.graph()
  assert.ok(graph.unresolved.some(r => r.sourcePath === 'lore/unauthorized.json' && r.required))
})

async function runCli(args) {
  // Subscribe before triggering process execution; no sleeps, polling or success-log inference.
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (status, signal) => resolveResult({ status, signal, stdout, stderr }))
  })
}

async function writeFixture(root, input) {
  await mkdir(resolve(root, 'lore/editorial'), { recursive: true })
  await mkdir(resolve(root, 'vendor/issued-history'), { recursive: true })
  await writeFile(resolve(root, sourcePath), sourceBody)
  await writeFile(resolve(root, sealedPath), sealedBody)
  await writeFile(resolve(root, 'archive.txt'), 'archived fixture bytes\n')
  await writeFile(resolve(root, 'baseline.json'), JSON.stringify(input.baseline))
  await writeFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'), JSON.stringify(input.contract))
  const { baseline, baselineSha256, contract, archiveHashes, sourceHashes, ...context } = input
  const fixtureDependencies = { unresolved: [], sharedSourceGroups: [
    { personIds: ['K001'], nodes: ['K001', `file:${sourcePath}`] },
    { personIds: ['K002'], nodes: ['K002', `file:${sourcePath}`] },
  ] }
  await writeFile(resolve(root, 'scope-input.json'), JSON.stringify({ ...context, dependencies: fixtureDependencies }))
  // Migration-mode CLI runs read this file; a staged or pending fixture cannot
  // produce one, and any parseable placeholder then surfaces the contract's own
  // pending error instead of an input ENOENT.
  try { await writeFile(resolve(root, 'private-projection.json'), JSON.stringify(projectPrivateSeoulScope(input, fixtureDependencies, 'batch:a'))) }
  catch { await writeFile(resolve(root, 'private-projection.json'), '{}') }
}

test('real CLI fixture-root commands return exact exit codes and machine errors; interruption leftovers never count as output', async () => {
  const owned = resolve(fileURLToPath(new URL('../.omo/tmp', import.meta.url)))
  await mkdir(owned, { recursive: true })
  const root = await mkdtemp(resolve(owned, 'seoul-scope-test-'))
  try {
    for (const [name, mutate, expected] of [
      ['complete-structure-without-authenticated-review', () => {}, 'E_PUBLICATION_REVIEW_AUTHORITY'],
      ['outside-person', i => { i.contract.entities[0].locationRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['outside-title', i => { i.contract.entities[2].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['outside-holding', i => { i.contract.entities[3].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['empty', i => { i.contract.entities[0].locationRefs = [] }, 'E_SCOPE_LOCATION'],
      ['unknown', i => { i.contract.entities[0].locationRefs = ['unknown'] }, 'E_SCOPE_REF'],
      ['missing', i => { i.contract.entities.splice(0, 1) }, 'E_CENSUS_PERSON'],
      ['pending', i => { i.contract.entities[0].status = 'pending' }, 'E_SCOPE_PENDING'],
    ]) {
      const input = fixture(); mutate(input); await writeFixture(root, input)
      await writeFile(resolve(root, 'success.partial'), '{"ok":true}')
      const result = await runCli(['--fixture-root', root])
      assert.equal(result.signal, null, name)
      assert.equal(result.status, expected ? 1 : 0, `${name}: ${result.stderr}`)
      const parsed = JSON.parse(result.stdout)
      assert.equal(code(parsed), expected ?? undefined, name)
      assert.equal(parsed.ok, !expected, name)
      console.log(`CLI ${name} exit=${result.status} ${expected ?? 'OK'}`)
    }
    const migration = fixture()
    Object.assign(migration.contract.entities[1], { status: 'pending', locationRefs: [], basis: null, batchId: 'batch:b' })
    Object.assign(migration.contract.dispositions.find(row => row.set === 'persons' && row.id === 'K002'), { status: 'pending', targetIds: [], basis: null, batchId: 'batch:b' })
    bindBatch(migration)
    await writeFixture(root, migration)
    const selected = await runCli(['--fixture-root', root, '--migration-batch', 'batch:a'])
    assert.equal(selected.status, 0, selected.stdout)
    assert.equal(JSON.parse(selected.stdout).ok, true)
    const all = await runCli(['--fixture-root', root])
    assert.equal(all.status, 1)
    assert.equal(code(JSON.parse(all.stdout)), 'E_SCOPE_PENDING')
    await writeFixture(root, stagingFixture())
    for (const [args, status] of [[['--inspection'], 0], [[], 1], [['--migration-batch', 'batch:a'], 1]]) {
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, status, result.stdout)
      assert.equal(code(JSON.parse(result.stdout)), status ? 'E_SCOPE_PENDING' : undefined)
      console.log(`CLI staged ${args.join(' ') || 'publication'} exit=${status}`)
    }
    await writeFixture(root, spatialFixture())
    for (const [args, status] of [[['--inspection'], 0], [[], 1], [['--migration-batch', 'batch:a'], 1]]) {
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, status, result.stdout)
      assert.equal(code(JSON.parse(result.stdout)), status ? 'E_SCOPE_PENDING' : undefined)
      console.log(`CLI spatial ${args.join(' ') || 'publication'} exit=${status}`)
    }
    for (const [name, mutate, args, expected] of [
      ['pending-source', input => { Object.assign(input.contract.documents[0], { status: 'pending', batchId: 'batch:b', basis: null, reviewReceipt: null }) }, ['--migration-batch', 'batch:a'], 'E_SCOPE_PENDING'],
      ['unknown-right', input => { Object.assign(input.geography.countySlots[0].slots[0], { status: 'direct', holderPersonId: 'K001', holdingRefs: ['unknown:right'] }) }, [], 'E_SCOPE_REF'],
    ]) {
      const input = fixture(); mutate(input); bindBatch(input); await writeFixture(root, input)
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, 1, name)
      assert.equal(code(JSON.parse(result.stdout)), expected, name)
      console.log(`CLI ${name} exit=${result.status} ${expected}`)
    }
    await writeFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'), '{invalid')
    const malformed = await runCli(['--fixture-root', root])
    assert.equal(malformed.status, 1)
    assert.equal(code(JSON.parse(malformed.stdout)), 'E_SCOPE_INPUT')
    for (const args of [['--unknown'], ['--fixture-root'], ['--inspection', '--migration-batch', 'a'], ['--inspection', '--inspection']]) {
      const invalid = await runCli(args)
      assert.equal(invalid.status, 1)
      assert.equal(code(JSON.parse(invalid.stdout)), 'E_SCOPE_INPUT')
    }
  } finally {
    await rm(root, { recursive: true })
    await assert.rejects(readFile(resolve(root, 'baseline.json')), { code: 'ENOENT' })
    console.log(`CLEANUP removed ${root}`)
  }
})
