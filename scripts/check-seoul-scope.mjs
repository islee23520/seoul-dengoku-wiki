#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { loadStationCatalogGeography } from './station-catalog-geography.mjs'
import { authenticateStationCatalogSuccessor, STATION_RECEIPT, STATION_BEFORE, STATION_AFTER } from './station-catalog-scope-successor.mjs'
import { STATION_CATALOG_PATH } from './station-catalog-geography.mjs'
import { authenticateK176LabelSuccessor, K176_SOURCE, K176_BEFORE, K176_AFTER } from './k176-label-successor.mjs'
import { authenticateReviewWordingSuccessor, WORDING_RECEIPT } from './review-wording-successor.mjs'
import { refreshK176PublicationReview, refreshReviewWordingPublicationReview, refreshStationCatalogPublicationReview, refreshTechnicalCodePublicationReview, refreshClimateLinkPublicationReview, refreshTimelineWharfPublicationReview } from './seoul-census.mjs'
import { authenticateClimateLinkSuccessor, CLIMATE_SOURCE, CLIMATE_BEFORE, CLIMATE_AFTER, CLIMATE_RECEIPT } from './climate-link-successor.mjs'
import { authenticateTimelineWharfSuccessor, TIMELINE_SOURCE, TIMELINE_BEFORE, TIMELINE_AFTER, TIMELINE_RECEIPT } from './timeline-wharf-successor.mjs'
import { authenticateNationalDressAdmission } from './national-dress-admission-successor.mjs'
import { authenticateMainDocAdmission } from './main-doc-admission-successor.mjs'
import { BASELINE_SHA256, RELATION_COURT_BULK_RETIREMENT, RELATION_COURT_DISPOSITION, STAGING_GEOGRAPHY_PATH, STAGING_GEOGRAPHY_SCHEMA, STAGING_SOURCES, TECHNICAL_DOCUMENT, baselineDocuments, materializeRelationCourtBulkRetirement, materializeRelationCourtDispositions, materializeRetiredRightsDispositions, proposalHash, sha256, validateSeoulScope } from './seoul-scope.mjs'
import { materializePersonReviewReconciliation } from './seoul-person-review-reconciliation.mjs'
import { CENSUS_PATHS, loadAndValidateCensus, loadAppliedBatches, validatorPredecessorReader } from './seoul-census.mjs'
import { PRIVATE_PROJECTION_PATH, validatePrivateSeoulProjection } from './seoul-private-projection.mjs'
import { RECEIPT_PATH as DOC247_CLOSURE_RECEIPT_PATH, authenticateClosureReceipt, materializeClosureContract } from '../.omo/private/seoul-migration/doc247-mechanical-20261019/materialize.mjs'
import { BATCH_ID as DOC247_RECEIPT_WAVE_BATCH_ID, authenticateReceiptWave, materializeReceiptWaveContract } from '../.omo/private/seoul-migration/doc247-receipt-wave-20261019/materialize.mjs'
import { BATCH_ID as DOC247_FINAL_BATCH_ID, authenticateFinalClosure, materializeFinalClosureContract } from '../.omo/private/seoul-migration/doc247-final-closure-20261019/materialize.mjs'

const json = async path => JSON.parse(await readFile(path, 'utf8'))
const hashFile = async path => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
const inputError = (path, id = '') => ({ ok: false, errors: [{ code: 'E_SCOPE_INPUT', path, id }] })
const BASELINE_PATH = '.omo/private/seoul-migration/baseline.json'

export function refreshTechnicalExcludedDocument(document, batches, beforeSha256, afterSha256) {
  const oldMarker = `currentSha256=${beforeSha256}`
  const newMarker = `currentSha256=${afterSha256}`
  if (document.status !== 'excluded' || document.reviewReceipt !== null
    || ![oldMarker, newMarker].some(marker => document.basis?.includes(marker)))
    throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path: document.sourcePath })
  const references = batches.flatMap(batch => (batch.proposal?.documents ?? [])
    .filter(row => row.sourcePath === document.sourcePath).map(row => ({ batch, row })))
  for (const { batch, row } of references) {
    if (batch.approval?.bodySha256 !== proposalHash(batch.proposal)
      || row.status !== 'excluded' || row.reviewReceipt !== null
      || ![oldMarker, newMarker].some(marker => row.basis?.includes(marker)))
      throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path: document.sourcePath, id: batch.id })
  }
  document.basis = document.basis.replace(oldMarker, newMarker)
  for (const { batch, row } of references) {
    row.basis = row.basis.replace(oldMarker, newMarker)
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal) }
  }
}

export async function loadScopeInput({ root, baselinePath, fixture = false, mode = 'publication', batchId = null }) {
  if (!fixture) await loadStationCatalogGeography(root)
  const diskRead = (await import('node:fs/promises')).readFile
  const technicalRead = fixture ? diskRead : await validatorPredecessorReader(root, diskRead)
  const climate = fixture ? null : await authenticateClimateLinkSuccessor(root, diskRead)
  const timeline = fixture ? null : await authenticateTimelineWharfSuccessor(root, diskRead)
  const stationSuccessor = fixture ? null : await authenticateStationCatalogSuccessor(root, diskRead)
  const wording = fixture ? null : await authenticateReviewWordingSuccessor(root, diskRead)
  const k176 = fixture ? null : await authenticateK176LabelSuccessor(root, diskRead)
  const readFile = async (path, options) => {
    const before = wording?.files.get(resolve(path))?.before
      ?? (climate && resolve(path) === resolve(root, CLIMATE_SOURCE) ? climate.before : null)
      ?? (stationSuccessor && resolve(path) === resolve(root, STATION_CATALOG_PATH) ? stationSuccessor.before : null)
      ?? (k176 && resolve(path) === resolve(root, K176_SOURCE) ? k176.before : null)
      ?? (timeline && resolve(path) === resolve(root, TIMELINE_SOURCE) ? timeline.before : null)
    if (before) return options === 'utf8' ? before.toString() : before
    const bytes = await technicalRead(path)
    return options === 'utf8' ? bytes.toString() : bytes
  }
  const baselineBytes = await readFile(baselinePath)
  const baseline = JSON.parse(baselineBytes)
  if (!fixture && sha256(baselineBytes) !== BASELINE_SHA256) return { error: { ok: false, errors: [{ code: 'E_ARCHIVE_HASH', path: baselinePath, id: '' }] } }
  const nationalDress = fixture ? null : await authenticateNationalDressAdmission(root, baseline, diskRead)
  const mainDocs = fixture ? [] : await authenticateMainDocAdmission(root, baseline, diskRead)
  const contract = await json(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'))
  // Synthetic CLI fixtures validate the pure contract, not repository-owned
  // doc247 receipts. Real publication always authenticates the receipts below.
  if (fixture) {
    const archiveHashes = {}
    for (const [name, archive] of Object.entries(baseline.archives)) archiveHashes[name] = await hashFile(resolve(dirname(baselinePath), archive.path))
    const sourceHashes = {}
    for (const path of baselineDocuments(baseline)) sourceHashes[path] = await hashFile(resolve(root, path))
    return { ...await json(resolve(root, 'scope-input.json')), baseline, baselineSha256: sha256(baselineBytes), contract, archiveHashes, sourceHashes }
  }
  const reviewRead = async path => k176 && resolve(path) === resolve(root, K176_SOURCE) ? k176.before : readFile(path)
  const closureReceipt = await authenticateClosureReceipt(root, readFile)
  const preReceiptWaveContract = structuredClone(contract)
  for (const row of preReceiptWaveContract.documents.filter(row => [DOC247_RECEIPT_WAVE_BATCH_ID, DOC247_FINAL_BATCH_ID].includes(row.batchId)))
    Object.assign(row, { status: 'pending', reviewReceipt: null, batchId: null, basis: null })
  const closureContract = materializeClosureContract(preReceiptWaveContract, closureReceipt)
  if (JSON.stringify(preReceiptWaveContract) !== JSON.stringify(closureContract))
    return { error: { ok: false, errors: [{ code: 'E_REVIEW_COVERAGE', path: '/doc247MechanicalClosure', id: '' }] } }
  const receiptWave = await authenticateReceiptWave(root, { contract, readBytes: readFile })
  const receiptWaveContract = materializeReceiptWaveContract(contract, receiptWave)
  if (JSON.stringify(contract) !== JSON.stringify(receiptWaveContract))
    return { error: { ok: false, errors: [{ code: 'E_REVIEW_COVERAGE', path: '/doc247ReceiptWave', id: '' }] } }
  const preFinalContract = structuredClone(contract)
  for (const row of preFinalContract.documents.filter(row => row.batchId === DOC247_FINAL_BATCH_ID))
    Object.assign(row, { status: 'pending', reviewReceipt: null, batchId: null, basis: null })
  const finalClosure = await authenticateFinalClosure(root, { contract: preFinalContract, readBytes: readFile })
  const finalContract = materializeFinalClosureContract(preFinalContract, finalClosure)
  if (JSON.stringify(contract) !== JSON.stringify(finalContract))
    return { error: { ok: false, errors: [{ code: 'E_REVIEW_COVERAGE', path: '/doc247FinalClosure', id: '' }] } }
  const [ledger, narrativeReview] = await Promise.all([
    json(resolve(root, 'lore/editorial/Seoul-Relocation-Ledger.json')),
    json(resolve(root, 'lore/editorial/Seoul-Narrative-Review.json')),
  ])
  const reconciliation = await materializePersonReviewReconciliation({ root, contract, ledger, review: narrativeReview, readBytes: readFile })
  if (JSON.stringify(contract) !== JSON.stringify(reconciliation.contract)
    || JSON.stringify(ledger) !== JSON.stringify(reconciliation.ledger)
    || JSON.stringify(narrativeReview) !== JSON.stringify(reconciliation.review))
    return { error: { ok: false, errors: [{ code: 'E_REVIEW_COVERAGE', path: '/personReviewReconciliation', id: '' }] } }
  const archiveHashes = {}
  for (const [name, archive] of Object.entries(baseline.archives)) archiveHashes[name] = await hashFile(resolve(dirname(baselinePath), archive.path))
  const sourceHashes = {}
  for (const path of baselineDocuments(baseline)) {
    try { sourceHashes[path] = await hashFile(resolve(root, path)) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (fixture) return { ...await json(resolve(root, 'scope-input.json')), baseline, baselineSha256: sha256(baselineBytes), contract, archiveHashes, sourceHashes }

  const { loadDataset } = await import(pathToFileURL(resolve(root, 'lore/relations/validate.mjs')))
  const dataset = loadDataset()
  const allocation = await json(resolve(root, 'lore/relations/opening-feudal-allocation.json'))
  const holdings = await json(resolve(root, 'lore/relations/personal-holdings.json'))
  const entitySets = {
    persons: dataset.sources.registry.persons.map(row => row.id), titles: allocation.titles.map(row => row.id),
    holdings: holdings.holdings.map(row => row.id), grants: allocation.grants.map(row => row.id),
    bindings: allocation.existingTitleBindings.map(row => JSON.stringify([row.holdingId, row.titleId])),
    states: dataset.states.map(row => row.id), polities: holdings.polities.map(row => row.id),
    events: dataset.events.map(row => row.id), relations: dataset.relations.map(row => row.id), courts: dataset.config.courts.map(row => row.id),
  }
  const documentPaths = Object.keys(sourceHashes)
  for (const admission of mainDocs) {
    sourceHashes[admission.row.sourcePath] = admission.source.sha256
    documentPaths.push(admission.row.sourcePath)
  }
  // A new authored file is not silently admitted. The contract itself is metadata, not a lore document.
  async function discover(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) await discover(path)
      else if (entry.isFile() && !documentPaths.includes(path) && !['lore/editorial/Seoul-Scope-Contract.json', STAGING_GEOGRAPHY_PATH, ...CENSUS_PATHS].includes(path)) documentPaths.push(path)
    }
  }
  for (const directory of ['lore', 'docs', 'scripts/data', 'snapshots/build-inputs', 'vendor/issued-history']) await discover(directory)
  const boundaryPath = contract.boundarySource.path
  const boundaryBytes = await readFile(resolve(root, boundaryPath))
  const boundary = { path: boundaryPath, edition: 'admdongkor-20260701', sha256: sha256(boundaryBytes) }
  const geo = JSON.parse(boundaryBytes)
  const refs = geo.features.map(feature => ({
    id: `region:${feature.properties.adm_cd2}`, kind: 'region',
    inside: feature.properties.sido === '11' && feature.properties.sidonm === '서울특별시', boundarySha256: boundary.sha256,
  }))
  const pinned = await json(resolve(root, 'data/geography/boundaries/seoul-sgis-20250630.geojson'))
  for (const feature of pinned.features.filter(feature => feature.properties.kind === 'dong')) if (!refs.some(ref => ref.id === feature.properties.dongId)) refs.push({
    id: feature.properties.dongId, kind: 'region', inside: true, boundarySha256: boundary.sha256,
  })
  // A private stage provides geography/review/approval inputs, never the current census or archive hashes.
  // Missing metadata is honest pending state, not an invented approval.
  let context = { refs, edges: [], geography: null, facts: null, batches: [], review: null }
  try {
    const staged = await json(resolve(root, '.omo/private/seoul-migration/scope-input.json'))
    if (Object.keys(staged).some(key => !Object.hasOwn(context, key))) return { error: inputError('/staging/context') }
    if (staged.refs) {
      const independent = new Map(refs.map(ref => [ref.id, ref]))
      for (const ref of staged.refs) if (independent.has(ref.id) && JSON.stringify(ref) !== JSON.stringify(independent.get(ref.id))) return { error: inputError('/staging/refs', ref.id) }
      staged.refs = [...refs, ...staged.refs.filter(ref => !independent.has(ref.id))]
    }
    context = { ...context, ...staged }
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  let geographyBytes
  try { geographyBytes = await readFile(resolve(root, STAGING_GEOGRAPHY_PATH), 'utf8') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (geographyBytes !== undefined) {
    // Metadata is excluded from authored-document discovery only through this strict
    // consumer. Private context cannot replace independent facts or bypass this file.
    if (context.geography !== null || context.facts !== null) return { error: inputError('/staging/geography') }
    const sources = {}
    for (const [kind, source] of Object.entries(STAGING_SOURCES)) {
      const path = ['membership', 'spatial'].includes(kind) ? resolve(root, source.path)
        : resolve(dirname(baselinePath), 'task-2-source-audit', source.path.split('/').at(-1))
      const body = await readFile(path, 'utf8')
      if (sha256(body) !== source.sha256) return { error: { ok: false, errors: [{ code: 'E_SLOT_EDITION', path: source.path, id: kind }] } }
      sources[kind] = { ...source, body }
    }
    const spatial = JSON.parse(sources.spatial.body)
    if (await hashFile(resolve(root, spatial.geometry.path)) !== spatial.geometry.sha256) return { error: { ok: false, errors: [{ code: 'E_SCOPE_GEOMETRY', path: spatial.geometry.path, id: spatial.edition }] } }
    const official = await json(resolve(root, spatial.geometry.path))
    const features = official.features
    const expected = [...spatial.dongs, ...spatial.counties, ...spatial.gu, spatial.city]
    if (features.length !== expected.length || new Set(features.map(f => f.id)).size !== expected.length
      || expected.some(row => !features.some(f => f.id === row.geometryId))) return { error: { ok: false, errors: [{ code: 'E_SLOT_COVERAGE', path: spatial.geometry.path, id: spatial.edition }] } }
    // Publication geography resolves official district and geometry IDs only through this
    // hash-verified pinned edition, never through private context refs.
    for (const row of spatial.gu) context.refs.push({ id: row.guId, kind: 'district', inside: true, boundarySha256: boundary.sha256 })
    for (const feature of features) context.refs.push({ id: feature.id, kind: 'geometry', inside: true, boundarySha256: boundary.sha256 })
    context.geography = JSON.parse(geographyBytes)
    if (context.geography.schema !== STAGING_GEOGRAPHY_SCHEMA) return { error: inputError('/staging/geography/schema') }
    context.facts = { schema: STAGING_GEOGRAPHY_SCHEMA, sources }
  }
  const appliedRegistry = await loadAppliedBatches(readFile, root)
  const activation = appliedRegistry.find(batch => batch.approvalModel === 'publication-activation-1194')
  if (activation) {
    const id = activation.batchId
    const proposal = { entities: contract.entities.filter(row => row.batchId === id), documents: contract.documents.filter(row => row.batchId === id),
      dispositions: contract.dispositions.filter(row => row.batchId === id), geography: context.geography }
    context.batches.push({ id, proposal,
      approval: { kind: 'batch-allocation', batchId: id, bodySha256: proposalHash(proposal), messageRef: activation.packetPath },
      articleSample: { body: '# Publication activation\n\nNo prose change.\n', approval: null },
      cardSample: { body: '# Publication activation card\n\nNo prose change.\n', approval: null },
      entityKeys: activation.entityKeys, documentPaths: activation.documentPaths, dispositionKeys: activation.dispositionKeys,
      // Activation publishes entities whose evidence lives in every previously
      // admitted active document, so the dependency closure reaches those batches.
      dependencyBatchIds: [...new Set(contract.documents.filter(row => row.status === 'active' && row.batchId !== id)
        .map(row => row.batchId))].sort(),
    })
    for (const [key, kind] of [['articleSample', 'article-style'], ['cardSample', 'card-style']]) context.batches.at(-1)[key].approval = {
      kind, batchId: id, bodySha256: sha256(context.batches.at(-1)[key].body), messageRef: activation.packetPath,
    }
    // Publication mode validates every active batch id, not only activation.
    // Materialize the remaining active document batches from the applied
    // registry: same proposal shape, approvals bound to each registered packet.
    for (const other of [...new Set([...contract.entities, ...contract.documents, ...contract.dispositions]
      .filter(row => row.status === 'active').map(row => row.batchId))].sort()) {
      if (other === id || other === RELATION_COURT_DISPOSITION.batchId || context.batches.some(batch => batch.id === other)) continue
      const applied = appliedRegistry.find(batch => batch.batchId === other)
      const messageRef = applied?.packetPath ?? '.omo/private/seoul-migration/applied-batches.json'
      const slice = kind => contract[kind].filter(row => row.batchId === other)
      const documents = slice('documents')
      const activeDocuments = documents.filter(row => row.status === 'active')
      const otherProposal = { entities: slice('entities'), documents, dispositions: slice('dispositions'), geography: context.geography }
      const articleBody = `# ${other}\n\nNo prose change.\n`
      const cardBody = `# ${other} card\n\nNo prose change.\n`
      context.batches.push({ id: other, proposal: otherProposal,
        approval: { kind: 'batch-allocation', batchId: other, bodySha256: proposalHash(otherProposal), messageRef },
        articleSample: { body: articleBody, approval: { kind: 'article-style', batchId: other, bodySha256: sha256(articleBody), messageRef } },
        cardSample: { body: cardBody, approval: { kind: 'card-style', batchId: other, bodySha256: sha256(cardBody), messageRef } },
        entityKeys: slice('entities').map(row => `${row.kind}:${row.id}`),
        documentPaths: activeDocuments.map(row => row.sourcePath),
        dispositionKeys: slice('dispositions').map(row => JSON.stringify([row.set, row.id])),
        dependencyBatchIds: other === id ? [] : [id],
      })
    }
  }
  const rights = [...holdings.holdings, ...allocation.grants].map(row => ({
    id: row.id, holderPersonId: row.holderPersonId, slotStatus: row.slotStatus ?? null,
    // Raw producer identifiers are source-bound selectors, not admitted region
    // IDs. The corresponding contract entity supplies their reviewed geography.
    sourceRefs: Object.fromEntries(['stationRef', 'facilityRef', 'landmarkRef']
      .filter(key => row[key] != null).map(key => [key, sha256(JSON.stringify(row[key]))])),
  }))
  // Preserve raw producer IDs while exposing the authenticated edition bridge.
  // A correspondence slot may resolve to more than one official fragment.
  for (const right of rights) {
    const row = [...holdings.holdings, ...allocation.grants].find(row => row.id === right.id)
    const mappings = Object.fromEntries((row.adminRefs ?? []).map(ref => [ref.id,
      (context.geography?.countySlots ?? []).flatMap(group => group.slots)
        .filter(slot => slot.currentCorrespondenceSlotIds?.includes(`slot:${ref.id}`)).map(slot => slot.dongId)]).filter(([, refs]) => refs.length))
    if (Object.keys(mappings).length) right.referenceMappings = mappings
  }
  // Exclusion above is conditional on this mandatory strict consumer. Neither a
  // private scope-input override nor inspection mode can supply its denominator.
  const syncMode = process.argv.includes('--sync-census-products')
  // Review evidence names only artifacts authenticated above: the doc247 closure
  // receipt for control and excluded rows and the pinned baseline for sealed
  // history. The census derives the machine coverage review from them and from
  // the contract's own exact review receipts; it never reads a staged review file.
  const census = await loadAndValidateCensus({ root, baseline, baselineSha256: sha256(baselineBytes), contract, batches: context.batches, review: context.review, mode, batchId, readBytes: reviewRead, nationalDress,
    reviewEvidence: {
      closure: { evidencePath: DOC247_CLOSURE_RECEIPT_PATH, reviewedAt: closureReceipt.date,
        controls: closureReceipt.controlAmendment.documents.map(({ sourcePath, currentSha256 }) => ({ sourcePath, currentSha256 })),
        excluded: closureReceipt.excludedDocumentAmendment.documents.map(({ sourcePath, currentSha256, evidencePath }) => ({ sourcePath, currentSha256, evidencePath })) },
      baseline: { evidencePath: BASELINE_PATH, reviewedAt: baseline.createdAt },
    },
    syncProducts: syncMode ? async files => { for (const file of files) await writeFile(resolve(root, file.path), file.raw ?? JSON.stringify(file.value, null, 2) + '\n') } : null })
  if (!census.ok) return { error: census }
  sourceHashes[nationalDress.row.sourcePath] = nationalDress.source.sha256
  if (k176) {
    const document = contract.documents.find(row => row.sourcePath === K176_SOURCE)
    if (document.reviewReceipt.currentSha256 !== K176_BEFORE) return { error: inputError('/k176/predecessor') }
    const batch = context.batches.find(row => row.id === document.batchId)
    if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/k176/batch-predecessor') }
    document.reviewReceipt.currentSha256 = K176_AFTER
    // The authenticated two-label successor changes this exact document's
    // review binding, including the batch proposal that references that row.
    const proposedDocument = batch.proposal.documents.find(row => row.sourcePath === K176_SOURCE)
    if (!proposedDocument) return { error: inputError('/k176/batch-document') }
    proposedDocument.reviewReceipt.currentSha256 = K176_AFTER
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal),
      messageRef: '.omo/private/seoul-migration/k176-label-successor-20261019/owner-decision.json' }
    sourceHashes[K176_SOURCE] = K176_AFTER
    census.publicationReview = await refreshK176PublicationReview(census.publicationReview, root)
  }
  if (wording) {
    for (const file of wording.files.values()) {
      const document = contract.documents.find(row => row.sourcePath === file.sourcePath)
      if (document?.reviewReceipt?.currentSha256 !== file.beforeSha256) return { error: inputError('/wording/predecessor', file.sourcePath) }
      const batch = context.batches.find(row => row.id === document.batchId)
      if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/wording/batch-predecessor', file.sourcePath) }
      const proposedDocument = batch.proposal.documents.find(row => row.sourcePath === file.sourcePath)
      if (!proposedDocument) return { error: inputError('/wording/batch-document', file.sourcePath) }
      document.reviewReceipt.currentSha256 = file.afterSha256
      proposedDocument.reviewReceipt.currentSha256 = file.afterSha256
      batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal), messageRef: WORDING_RECEIPT }
      sourceHashes[file.sourcePath] = file.afterSha256
    }
    census.publicationReview = await refreshReviewWordingPublicationReview(census.publicationReview, root)
  }
  if (stationSuccessor) {
    const document = contract.documents.find(row => row.sourcePath === STATION_CATALOG_PATH)
    if (document?.reviewReceipt?.currentSha256 !== STATION_BEFORE) return { error: inputError('/station/predecessor') }
    const batch = context.batches.find(row => row.id === document.batchId)
    if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/station/batch-predecessor') }
    const proposedDocument = batch.proposal.documents.find(row => row.sourcePath === STATION_CATALOG_PATH)
    if (!proposedDocument) return { error: inputError('/station/batch-document') }
    document.reviewReceipt.currentSha256 = STATION_AFTER
    proposedDocument.reviewReceipt.currentSha256 = STATION_AFTER
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal), messageRef: STATION_RECEIPT }
    sourceHashes[STATION_CATALOG_PATH] = STATION_AFTER
    census.publicationReview = await refreshStationCatalogPublicationReview(census.publicationReview, root)
  }
  if (climate) {
    const document = contract.documents.find(row => row.sourcePath === CLIMATE_SOURCE)
    if (document?.reviewReceipt?.currentSha256 !== CLIMATE_BEFORE) return { error: inputError('/climate/predecessor') }
    const batch = context.batches.find(row => row.id === document.batchId)
    if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/climate/batch-predecessor') }
    const proposed = batch.proposal.documents.find(row => row.sourcePath === CLIMATE_SOURCE)
    if (!proposed) return { error: inputError('/climate/batch-document') }
    document.reviewReceipt.currentSha256 = CLIMATE_AFTER
    proposed.reviewReceipt.currentSha256 = CLIMATE_AFTER
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal), messageRef: CLIMATE_RECEIPT }
    sourceHashes[CLIMATE_SOURCE] = CLIMATE_AFTER
    census.publicationReview = await refreshClimateLinkPublicationReview(census.publicationReview, root)
  }
  if (timeline) {
    const document = contract.documents.find(row => row.sourcePath === TIMELINE_SOURCE)
    if (document?.reviewReceipt?.currentSha256 !== TIMELINE_BEFORE) return { error: inputError('/timeline/predecessor') }
    const batch = context.batches.find(row => row.id === document.batchId)
    if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/timeline/batch-predecessor') }
    const proposed = batch.proposal.documents.find(row => row.sourcePath === TIMELINE_SOURCE)
    if (!proposed) return { error: inputError('/timeline/batch-document') }
    document.reviewReceipt.currentSha256 = TIMELINE_AFTER
    proposed.reviewReceipt.currentSha256 = TIMELINE_AFTER
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal), messageRef: TIMELINE_RECEIPT }
    sourceHashes[TIMELINE_SOURCE] = TIMELINE_AFTER
    census.publicationReview = await refreshTimelineWharfPublicationReview(census.publicationReview, root)
  }
  for (const sourcePath of ['lore/relations/validate.mjs', 'lore/places/test-station-alias-candidates.mjs',
    'lore/name-pools/issue-person-ids.mjs', 'lore/name-pools/verify-person-id-candidates.mjs', 'lore/name-pools/verify-person-id-registry.mjs']) {
    const before = await technicalRead(resolve(root, sourcePath))
    const current = await diskRead(resolve(root, sourcePath))
    if (sha256(before) === sha256(current)) continue
    const document = contract.documents.find(row => row.sourcePath === sourcePath)
    if (document?.status === 'excluded') {
      refreshTechnicalExcludedDocument(document, context.batches, sha256(before), sha256(current))
      sourceHashes[sourcePath] = sha256(current)
      continue
    }
    if (document?.reviewReceipt?.currentSha256 !== sha256(before)) return { error: inputError('/technical-code/predecessor', sourcePath) }
    const batch = context.batches.find(row => row.id === document.batchId)
    if (!batch || batch.approval.bodySha256 !== proposalHash(batch.proposal)) return { error: inputError('/technical-code/batch-predecessor', sourcePath) }
    const proposed = batch.proposal.documents.find(row => row.sourcePath === sourcePath)
    if (!proposed) return { error: inputError('/technical-code/batch-document', sourcePath) }
    document.reviewReceipt.currentSha256 = sha256(current)
    proposed.reviewReceipt.currentSha256 = sha256(current)
    batch.approval = { ...batch.approval, bodySha256: proposalHash(batch.proposal) }
    sourceHashes[sourcePath] = sha256(current)
  }
  census.publicationReview = await refreshTechnicalCodePublicationReview(census.publicationReview, root, diskRead)
  sourceHashes[TECHNICAL_DOCUMENT.sourcePath] = await hashFile(resolve(root, TECHNICAL_DOCUMENT.sourcePath))
  context.review = census.review
  for (const document of census.createdDocuments) sourceHashes[document.sourcePath] = await hashFile(resolve(root, document.sourcePath))
  if (census.rightsTransition) {
    const materialized = materializeRetiredRightsDispositions(contract, baseline, census.rightsTransition, sourceHashes)
    if (JSON.stringify(contract) !== JSON.stringify(materialized)) return { error: { ok: false, errors: [{ code: 'E_CENSUS_RIGHT', path: '/dispositions/retirement', id: '' }] } }
  }
  const proposalRoot = '.omo/private/seoul-migration/relation-court-disposition-proposal-20261018/'
  const receiptBody = await readFile(resolve(root, RELATION_COURT_DISPOSITION.receipt.path), 'utf8')
  const manifestBody = await readFile(resolve(root, proposalRoot + 'manifest.json'), 'utf8')
  const reviewJsonBody = await readFile(resolve(root, proposalRoot + 'independent-review.json'), 'utf8')
  const reviewMarkdownBody = await readFile(resolve(root, proposalRoot + 'independent-review.md'), 'utf8')
  const receipt = JSON.parse(receiptBody)
  const relationCourtProof = {
    receiptBody, manifestBody, reviewJsonBody, reviewMarkdownBody,
    parts: await Promise.all(receipt.proposal.parts.map(async row => ({ path: row.path, body: await readFile(resolve(root, row.path), 'utf8') }))),
    sources: await Promise.all(Object.values(receipt.sourceBindings).map(async row => ({ path: row.path, body: await readFile(resolve(root,
      row.path === 'lore/relations/relations.json'
        ? '.omo/private/seoul-migration/combined-evidence-rebind-candidate-20261017/candidate/lore/relations/relations.json'
        : row.path), 'utf8') }))),
  }
  const relationCourtSourceHashes = Object.fromEntries(relationCourtProof.sources.map(row => [row.path, sha256(row.body)]))
  const relationCourtContract = materializeRelationCourtDispositions(contract, relationCourtProof, relationCourtSourceHashes)
  if (JSON.stringify(contract) !== JSON.stringify(relationCourtContract)) return { error: { ok: false, errors: [{ code: 'E_CENSUS_RIGHT', path: '/dispositions/relationCourt', id: '' }] } }
  const bulkReceiptBody = await readFile(resolve(root, RELATION_COURT_BULK_RETIREMENT.receipt.path), 'utf8')
  const bulkRetiredContract = materializeRelationCourtBulkRetirement(contract, bulkReceiptBody)
  if (JSON.stringify(contract) !== JSON.stringify(bulkRetiredContract)) return { error: { ok: false, errors: [{ code: 'E_CENSUS_RIGHT', path: '/dispositions/relationCourtBulkRetirement', id: '' }] } }
  const relationCourtProposal = { entities: [], documents: [],
    dispositions: contract.dispositions.filter(row => row.batchId === RELATION_COURT_DISPOSITION.batchId), geography: context.geography }
  const noProse = '# Relation and court current dispositions\n\nNo prose change.\n'
  context.batches.push({ id: RELATION_COURT_DISPOSITION.batchId, proposal: relationCourtProposal,
    approval: { kind: 'batch-allocation', batchId: RELATION_COURT_DISPOSITION.batchId,
      bodySha256: proposalHash(relationCourtProposal), messageRef: RELATION_COURT_DISPOSITION.receipt.path },
    articleSample: { body: noProse, approval: { kind: 'article-style', batchId: RELATION_COURT_DISPOSITION.batchId,
      bodySha256: sha256(noProse), messageRef: RELATION_COURT_DISPOSITION.receipt.path } },
    cardSample: { body: noProse, approval: { kind: 'card-style', batchId: RELATION_COURT_DISPOSITION.batchId,
      bodySha256: sha256(noProse), messageRef: RELATION_COURT_DISPOSITION.receipt.path } },
    entityKeys: [], documentPaths: [], dispositionKeys: relationCourtProposal.dispositions.map(row => JSON.stringify([row.set, row.id])), dependencyBatchIds: [],
  })
  return { contract, baseline, baselineSha256: sha256(baselineBytes), current: { entitySets, documentPaths, rights,
    ...(census.rightsTransition ? { rightsTransition: census.rightsTransition } : {}), createdDocuments: census.createdDocuments,
    technicalDocuments: [TECHNICAL_DOCUMENT], successorDocuments: census.successorDocuments, publicationReview: census.publicationReview }, boundary,
    archiveHashes, sourceHashes, ...context, dependencies: census.dependencies, dependencyReport: census.dependencyReport }
}

export async function runScopeCli(argv) {
  const options = { root: resolve(dirname(fileURLToPath(import.meta.url)), '..'), mode: 'publication', batchId: null, fixture: false }
  const seen = new Set()
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (seen.has(flag)) return inputError('/argv', flag)
    seen.add(flag)
    if (flag === '--inspection') options.mode = 'inspection'
    else if (flag === '--sync-census-products') { if (!seen.has('--inspection')) return inputError('/argv', flag) }
    else if (['--root', '--baseline', '--fixture-root', '--migration-batch'].includes(flag)) {
      const value = argv[++index]
      if (!value || value.startsWith('--')) return inputError('/argv', flag)
      if (flag === '--migration-batch') { options.mode = 'migration'; options.batchId = value }
      else if (flag === '--baseline') options.baselinePath = resolve(value)
      else { options.root = resolve(value); options.fixture = flag === '--fixture-root' }
    } else return inputError('/argv', flag)
  }
  if (seen.has('--inspection') && seen.has('--migration-batch') || seen.has('--root') && seen.has('--fixture-root')) return inputError('/argv')
  try {
    if (options.fixture) options.baselinePath ??= resolve(options.root, 'baseline.json')
    else if (!options.baselinePath) {
      const { stdout } = await promisify(execFile)('git', ['-C', options.root, 'rev-parse', '--path-format=absolute', '--git-common-dir'])
      options.baselinePath = resolve(dirname(stdout.trim()), BASELINE_PATH)
    }
    if (options.mode === 'migration' && !options.fixture) {
      const stage = resolve(options.root, '.omo/private/seoul-migration', options.batchId)
      if (relative(resolve(options.root, '.omo/private/seoul-migration'), stage).startsWith('..')) return inputError('/batchId', options.batchId)
      if (!(await stat(stage)).isDirectory()) return inputError('/migration', options.batchId)
      // Staging uses the same source-root format. It cannot write public outputs.
      options.root = stage
    }
    const input = await loadScopeInput(options)
    const { dependencyReport, dependencies, ...scopeInput } = input
    let result = input.error ?? validateSeoulScope(scopeInput, { mode: options.mode, batchId: options.batchId })
    if (result.ok && options.mode === 'migration') {
      const projection = await json(resolve(options.root, PRIVATE_PROJECTION_PATH))
      result = validatePrivateSeoulProjection(projection, scopeInput, dependencies, options.batchId)
    }
    return dependencyReport && (result.ok || options.mode === 'inspection')
      ? { ...result, dependencyReport, publicationReview: scopeInput.current.publicationReview } : result
  } catch (error) {
    if (error.code?.startsWith('E_')) return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id ?? '' }] }
    return inputError(error.path ?? '/input', error.code ?? error.name)
  }
}

// Both generation entry points call this before their first public/generated
// write. Pending preparation never authorizes even a partial public generation.
export async function requireSeoulPublication(root) {
  const result = await runScopeCli(['--root', root])
  if (!result.ok) throw Object.assign(new Error(JSON.stringify(result)), result.errors[0])
  return result.publicationReview
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runScopeCli(process.argv.slice(2))
  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = result.ok ? 0 : 1
}
