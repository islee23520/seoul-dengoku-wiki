#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256 } from './seoul-scope.mjs'

export const PERSON_REVIEW_RECONCILIATION = Object.freeze({
  manifest: {
    path: '.omo/private/seoul-migration/task10-person-review-reconciliation-20261018/manifest.json',
    sha256: 'be9809a32b8a7fbefcef52a8f9197388ad5f0fcae7f0c1928789982f352c0800',
  },
  verifier: {
    path: '.omo/private/seoul-migration/task10-person-review-reconciliation-20261018/verifier.json',
  },
  documentIndexes: [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 97, 149],
  documents: 19,
  cardOccurrences: 2076,
  ko: 1038,
  en: 1038,
})

const failure = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id = '') => { if (!condition) failure(code, path, id) }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const cardCoverageHashes = rows => ({
  coverageKeysSha256: sha256(JSON.stringify(rows.map(row => row.originalKey))),
  currentHashesSha256: sha256(JSON.stringify(rows.map(row => [row.originalKey, row.currentHash]))),
})

async function verifiedBytes(root, binding, readBytes, code = 'E_REVIEW_HASH') {
  const body = await readBytes(resolve(root, binding.path))
  check(sha256(body) === binding.sha256, code, binding.path)
  return body
}

export async function authenticatePersonReviewReconciliation({ root, ledger, review, contract, readBytes = readFile, appliedBatches = null }) {
  const manifestBytes = await readBytes(resolve(root, PERSON_REVIEW_RECONCILIATION.manifest.path))
  check(sha256(manifestBytes) === PERSON_REVIEW_RECONCILIATION.manifest.sha256,
    'E_REVIEW_HASH', PERSON_REVIEW_RECONCILIATION.manifest.path)
  const manifest = JSON.parse(manifestBytes)
  const verifier = JSON.parse(await readBytes(resolve(root, PERSON_REVIEW_RECONCILIATION.verifier.path)))
  check(verifier.schema === 'seoul-person-review-reconciliation-verifier.v1'
    && eq(verifier.manifest, PERSON_REVIEW_RECONCILIATION.manifest)
    && eq(verifier.expected.contractDocumentIndexes, PERSON_REVIEW_RECONCILIATION.documentIndexes)
    && verifier.expected.documents === PERSON_REVIEW_RECONCILIATION.documents
    && verifier.expected.cardOccurrences === PERSON_REVIEW_RECONCILIATION.cardOccurrences
    && verifier.expected.ko === PERSON_REVIEW_RECONCILIATION.ko
    && verifier.expected.en === PERSON_REVIEW_RECONCILIATION.en,
  'E_REVIEW_COVERAGE', PERSON_REVIEW_RECONCILIATION.verifier.path)
  check(manifest.schema === 'seoul-person-review-reconciliation.v1'
    && manifest.authority.startsWith('Projection-only reconciliation')
    && manifest.documents.length === PERSON_REVIEW_RECONCILIATION.documents
    && eq(manifest.documents.map(row => row.contractIndex), PERSON_REVIEW_RECONCILIATION.documentIndexes)
    && eq(manifest.totals, { documents: 19, cardOccurrences: 2076, ko: 1038, en: 1038 }),
  'E_REVIEW_COVERAGE', PERSON_REVIEW_RECONCILIATION.manifest.path)

  const reviewArtifacts = new Map([[manifest.statusBatch.reviewArtifact.path, manifest.statusBatch.reviewArtifact]])
  for (const document of manifest.documents) for (const binding of document.batchChain) {
    const existing = reviewArtifacts.get(binding.reviewArtifact.path)
    check(!existing || existing.sha256 === binding.reviewArtifact.sha256,
      'E_REVIEW_HASH', binding.reviewArtifact.path)
    reviewArtifacts.set(binding.reviewArtifact.path, binding.reviewArtifact)
  }
  for (const binding of reviewArtifacts.values()) await verifiedBytes(root, binding, readBytes)

  const batches = appliedBatches ?? await (async () => {
    const { loadAppliedBatches } = await import('./seoul-census.mjs')
    return loadAppliedBatches(readBytes, root)
  })()
  check([109, 110, 111].includes(batches.length), 'E_APPROVAL_BATCH', '/applied/person-review/registry')
  const byId = new Map(batches.map(row => [row.batchId, row]))
  const activation = byId.get(manifest.statusBatch.batchId)
  check(activation?.approvalModel === manifest.statusBatch.approvalModel
    && activation.packetPath === manifest.statusBatch.packetPath
    && activation.packetSha256 === manifest.statusBatch.packetSha256
    && activation.applicationReview?.evidencePath === manifest.statusBatch.reviewArtifact.path
    && activation.applicationReview?.evidenceSha256 === manifest.statusBatch.reviewArtifact.sha256,
  'E_APPROVAL_BATCH', manifest.statusBatch.packetPath)
  await verifiedBytes(root, { path: manifest.statusBatch.packetPath, sha256: manifest.statusBatch.packetSha256 }, readBytes, 'E_APPROVAL_BATCH')

  const contractPaths = PERSON_REVIEW_RECONCILIATION.documentIndexes.map(index => contract.documents[index]?.sourcePath)
  check(eq(contractPaths, manifest.documents.map(row => row.sourcePath)), 'E_REVIEW_COVERAGE', '/documents/indexes')
  const ledgerRows = new Map(manifest.documents.map(document => [document.sourcePath,
    ledger.cardOccurrences.filter(row => row.sourcePath === document.sourcePath)]))
  const reviewDocuments = new Map(review.documents.map(row => [row.sourcePath, row]))
  let cardOccurrences = 0; let ko = 0; let en = 0
  for (const document of manifest.documents) {
    check(digest(document.currentSha256) && digest(document.cardCoverage.coverageKeysSha256)
      && digest(document.cardCoverage.currentHashesSha256), 'E_REVIEW_COVERAGE', '/manifest/documents', document.sourcePath)
    const currentBytes = await readBytes(resolve(root, document.sourcePath))
    check(sha256(currentBytes) === document.currentSha256, 'E_REVIEW_HASH', document.sourcePath)
    const censusDocument = reviewDocuments.get(document.sourcePath)
    check(censusDocument?.currentSha256 === document.currentSha256, 'E_REVIEW_HASH', '/review/documents', document.sourcePath)
    const cards = ledgerRows.get(document.sourcePath)
    const counts = { count: cards.length, ko: cards.filter(row => row.locale === 'ko').length, en: cards.filter(row => row.locale === 'en').length }
    const hashes = cardCoverageHashes(cards)
    check(eq(counts, { count: document.cardCoverage.count, ko: document.cardCoverage.ko, en: document.cardCoverage.en })
      && hashes.coverageKeysSha256 === document.cardCoverage.coverageKeysSha256
      && hashes.currentHashesSha256 === document.cardCoverage.currentHashesSha256,
    'E_REVIEW_COVERAGE', '/ledger/cardOccurrences', document.sourcePath)
    cardOccurrences += counts.count; ko += counts.ko; en += counts.en
    for (const binding of document.batchChain) {
      const batch = byId.get(binding.batchId)
      check(batch && batch.applicationReview?.evidencePath === binding.reviewArtifact.path
        && batch.applicationReview?.evidenceSha256 === binding.reviewArtifact.sha256,
      'E_APPROVAL_BATCH', '/applied/person-review/batch', binding.batchId)
      const source = batch.sourceBeforeAfter?.sources?.find(row => row.sourcePath === document.sourcePath)
      check(source?.afterSha256 === binding.afterSha256, 'E_REVIEW_HASH', document.sourcePath, binding.batchId)
    }
    check(document.batchChain.at(-1)?.afterSha256 === document.currentSha256,
      'E_REVIEW_HASH', '/manifest/batchChain', document.sourcePath)
  }
  check(cardOccurrences === PERSON_REVIEW_RECONCILIATION.cardOccurrences
    && ko === PERSON_REVIEW_RECONCILIATION.ko && en === PERSON_REVIEW_RECONCILIATION.en,
  'E_REVIEW_COVERAGE', '/manifest/totals')
  return { manifest, manifestSha256: PERSON_REVIEW_RECONCILIATION.manifest.sha256, cardOccurrences, ko, en }
}

export async function materializePersonReviewReconciliation(input) {
  const authenticated = await authenticatePersonReviewReconciliation(input)
  const { manifest } = authenticated
  const contract = structuredClone(input.contract)
  const ledger = structuredClone(input.ledger)
  const review = structuredClone(input.review)
  const targetPaths = new Set(manifest.documents.map(row => row.sourcePath))
  const receipt = document => ({
    path: PERSON_REVIEW_RECONCILIATION.manifest.path,
    sha256: PERSON_REVIEW_RECONCILIATION.manifest.sha256,
    approvalRef: document.batchChain.at(-1).reviewArtifact.path,
  })
  for (const document of manifest.documents) {
    const scope = contract.documents[document.contractIndex]
    const pending = scope.status === 'pending' && scope.reviewReceipt === null && scope.batchId === null && scope.basis === null
    const active = scope.status === 'active' && scope.reviewReceipt?.currentSha256 === document.currentSha256
      && scope.reviewReceipt?.evidencePath === document.batchChain.at(-1).reviewArtifact.path
      && scope.reviewReceipt?.reviewedAt === manifest.reviewedAt
      && scope.batchId === document.batchChain.at(-1).batchId
      && scope.basis === 'authenticated full-card review and applied exact-source successor chain'
    check(pending || active, 'E_REVIEW_COVERAGE', '/contract/documents', document.sourcePath)
    Object.assign(scope, { status: 'active', reviewReceipt: { currentSha256: document.currentSha256,
      evidencePath: document.batchChain.at(-1).reviewArtifact.path, reviewedAt: manifest.reviewedAt },
    batchId: document.batchChain.at(-1).batchId, basis: 'authenticated full-card review and applied exact-source successor chain' })

    const census = review.documents.find(row => row.sourcePath === document.sourcePath)
    check(census, 'E_REVIEW_COVERAGE', '/review/documents', document.sourcePath)
    Object.assign(census, { classification: 'current-reviewed', disposition: 'reviewed',
      revisedByBatch: document.batchChain.at(-1).batchId, reviewedAt: manifest.reviewedAt,
      receipt: receipt(document), semanticReview: 'reviewed' })
  }
  for (const card of ledger.cardOccurrences.filter(row => targetPaths.has(row.sourcePath))) {
    card.classification = 'current-reviewed'
    card.reviewStatus = 'reviewed'
  }
  const projectedReceipt = { schema: 'seoul-person-review-reconciliation-receipt.v1',
    evidencePath: PERSON_REVIEW_RECONCILIATION.manifest.path, evidenceSha256: PERSON_REVIEW_RECONCILIATION.manifest.sha256,
    reviewedAt: manifest.reviewedAt, documents: manifest.documents.map(document => ({ sourcePath: document.sourcePath,
      currentSha256: document.currentSha256, cardOccurrences: document.cardCoverage.count,
      approvalRef: document.batchChain.at(-1).reviewArtifact.path })) }
  const existing = review.receipts.filter(row => row.schema === projectedReceipt.schema)
  check(existing.length <= 1, 'E_REVIEW_COVERAGE', '/review/receipts', 'expected exactly one reconciliation receipt')
  if (existing.length === 1) check(eq(existing[0], projectedReceipt), 'E_REVIEW_COVERAGE', '/review/receipts')
  else review.receipts.push(projectedReceipt)
  return { contract, ledger, review, publicationDecisions: manifest.documents.map(document => ({
    sourcePath: document.sourcePath, currentSha256: document.currentSha256, receipt: receipt(document),
  })), ...authenticated }
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const paths = ['lore/editorial/Seoul-Scope-Contract.json', 'lore/editorial/Seoul-Relocation-Ledger.json', 'lore/editorial/Seoul-Narrative-Review.json']
  const [contract, ledger, review] = await Promise.all(paths.map(async path => JSON.parse(await readFile(resolve(root, path)))))
  const materialized = await materializePersonReviewReconciliation({ root, contract, ledger, review })
  await Promise.all([[paths[0], materialized.contract], [paths[1], materialized.ledger], [paths[2], materialized.review]]
    .map(([path, value]) => writeFile(resolve(root, path), JSON.stringify(value, null, 2) + '\n')))
  process.stdout.write(JSON.stringify({ ok: true, documents: materialized.manifest.documents.length,
    cardOccurrences: materialized.cardOccurrences, ko: materialized.ko, en: materialized.en }) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  process.stderr.write(JSON.stringify({ ok: false, code: error.code ?? error.name, message: error.message,
    path: error.path ?? '', id: error.id ?? '', stack: error.stack }) + '\n')
  process.exitCode = 1
})
