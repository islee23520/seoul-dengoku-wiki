#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync, gunzipSync } from 'node:zlib'
import { loadAndValidateCensus } from './seoul-census.mjs'
import { sha256 } from './seoul-scope.mjs'

const root = resolve(import.meta.dirname, '..')
const outputDirectory = '.omo/private/seoul-migration/post96-census-sync-20261016'
const dependencyPath = '.omo/private/seoul-migration/task-7-census/dependencies-post96-20261016.json.txt'
const ledgerPath = 'lore/editorial/Seoul-Relocation-Ledger.json'
const reviewPath = 'lore/editorial/Seoul-Narrative-Review.json'

const { openPublicationDatabaseInputs } = await import('./document-store/publication-database-inputs.mjs')
const databaseConfig = JSON.parse(await readFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG
  ?? resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021/publication-config.json'), 'utf8'))
const sourceBundle = await openPublicationDatabaseInputs(root, databaseConfig)
const readSource = path => sourceBundle.inputs.readBytes(resolve(root, path))
const digestFile = async path => sha256(await readSource(path))
const countBy = (rows, key) => Object.fromEntries(rows.reduce((counts, row) => {
  counts.set(row[key], (counts.get(row[key]) ?? 0) + 1)
  return counts
}, new Map()))
const archive = raw => gzipSync(raw).toString('base64') + '\n'
const fail = message => { throw new Error(message) }

const baselineBytes = await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json'))
const baseline = JSON.parse(baselineBytes)
const contract = JSON.parse(await readSource('lore/editorial/Seoul-Scope-Contract.json'))
const liveLedger = await readSource(ledgerPath)
const liveReview = await readSource(reviewPath)
const products = []
const result = await loadAndValidateCensus({
  root,
  readBytes: sourceBundle.inputs.readBytes,
  baseline,
  baselineSha256: sha256(baselineBytes),
  contract,
  batches: [],
  review: null,
  mode: 'inspection',
  syncProducts: async files => products.push(...files),
})
if (!result.ok || result.errors.length !== 0) fail(`census validation failed: ${JSON.stringify(result.errors)}`)
if (result.dependencyReport.unresolved !== 0 || result.dependencies.unresolved.length !== 0) {
  fail(`unresolved dependencies remain: ${JSON.stringify(result.dependencies.unresolved)}`)
}

const dependency = products.find(product => product.path === dependencyPath)
const ledger = products.find(product => product.path === ledgerPath)
const review = products.find(product => product.path === reviewPath)
if (!dependency?.raw || !ledger?.value || !review?.value) fail('missing synchronized census product')

const candidateLedger = Buffer.from(JSON.stringify(ledger.value, null, 2) + '\n')
const candidateReview = Buffer.from(JSON.stringify(review.value, null, 2) + '\n')
const classifications = countBy(review.value.documents, 'classification')
const publicationOverlay = countBy(result.publicationReview.documents, 'classification')
const metadataReviewStatuses = [...new Set(review.value.documents.map(document => document.semanticReview))]
if (ledger.value.people.length !== 1022 || review.value.documents.length !== 323
  || classifications['current-pending'] !== 281 || classifications['sealed-history'] !== 42
  || publicationOverlay['current-pending'] !== 271 || publicationOverlay['current-reviewed'] !== 10
  || publicationOverlay['sealed-history'] !== 42 || metadataReviewStatuses.length !== 1
  || metadataReviewStatuses[0] !== 'not-reviewed') fail('post96 census invariants changed')

await mkdir(resolve(root, outputDirectory), { recursive: true })
const files = new Map([
  [dependencyPath, dependency.raw],
  [`${outputDirectory}/metadata-before-ledger.json.gz.b64`, archive(liveLedger)],
  [`${outputDirectory}/metadata-before-review.json.gz.b64`, archive(liveReview)],
  [`${outputDirectory}/metadata-candidate-ledger.json.gz.b64`, archive(candidateLedger)],
  [`${outputDirectory}/metadata-candidate-review.json.gz.b64`, archive(candidateReview)],
])
for (const [path, body] of files) await writeFile(resolve(root, path), body)

const registryPath = '.omo/private/seoul-migration/applied-batches.json'
const registryBytes = await readFile(resolve(root, registryPath))
const registry = JSON.parse(registryBytes)
const sourcePaths = [
  'lore/World-Narrative-Atlas.json',
  'lore/authoring.atlas.schema.json',
  'lore/overview/World-Unbinding.json',
  'lore/characters/Cast-State-01.json',
  'lore/characters/Cast-State-04.json',
  'lore/characters/Cast-State-05.json',
  'lore/characters/Cast-State-06.json',
  'lore/characters/Cast-State-07.json',
  'lore/characters/Cast-State-08.json',
  'lore/characters/Cast-State-09.json',
  'lore/characters/Cast-State-10.json',
  'lore/characters/Cast-State-11.json',
  'lore/characters/Cast-State-12.json',
  'lore/characters/Cast-State-13.json',
  'lore/editorial/profile-batches/state-09-10.json',
]
const metadata = []
for (const [name, livePath, liveRaw, candidateRaw] of [
  ['ledger', ledgerPath, liveLedger, candidateLedger],
  ['review', reviewPath, liveReview, candidateReview],
]) {
  const beforeArchive = `${outputDirectory}/metadata-before-${name}.json.gz.b64`
  const candidateArchive = `${outputDirectory}/metadata-candidate-${name}.json.gz.b64`
  const beforeEncoded = await readFile(resolve(root, beforeArchive))
  const candidateEncoded = await readFile(resolve(root, candidateArchive))
  if (!gunzipSync(Buffer.from(beforeEncoded.toString().trim(), 'base64')).equals(liveRaw)
    || !gunzipSync(Buffer.from(candidateEncoded.toString().trim(), 'base64')).equals(candidateRaw)) fail(`archive round trip failed: ${name}`)
  metadata.push({
    livePath,
    beforeSha256: sha256(liveRaw),
    beforeRawBytes: liveRaw.length,
    beforeArchive,
    beforeArchiveSha256: sha256(beforeEncoded),
    candidateArchive,
    candidateArchiveSha256: sha256(candidateEncoded),
    candidateRawSha256: sha256(candidateRaw),
    candidateRawBytes: candidateRaw.length,
  })
}
const dependencyEncoded = await readFile(resolve(root, dependencyPath))
const dependencyPayload = gunzipSync(Buffer.from(dependencyEncoded.toString().replace(/\s/g, ''), 'base64'))
const receipt = {
  schema: 'seoul-post96-census-candidate.v1',
  status: 'private-candidate-only; live metadata not replaced',
  registry: {
    path: registryPath,
    sha256: sha256(registryBytes),
    count: registry.batches.length,
    lastBatchId: registry.batches.at(-1).batchId,
    lastBatchState: registry.batches.at(-1).state,
    lastSourceBeforeAfterPath: registry.batches.at(-1).sourceBeforeAfterPath,
    lastSourceBeforeAfterSha256: await digestFile(registry.batches.at(-1).sourceBeforeAfterPath),
  },
  sourcePins: await Promise.all(sourcePaths.map(async path => ({ path, sha256: await digestFile(path) }))),
  metadata,
  dependency: {
    path: dependencyPath,
    sha256: sha256(dependencyEncoded),
    payloadSha256: sha256(dependencyPayload),
    encodedBytes: dependencyEncoded.length,
    payloadBytes: dependencyPayload.length,
    references: result.dependencyReport.references,
    unresolved: result.dependencyReport.unresolved,
    byVocabulary: result.dependencyReport.byVocabulary,
  },
  unresolvedDependencies: result.dependencies.unresolved,
  historicDependencies: await Promise.all([
    'dependencies-v17-five-water-review.json.txt',
    'dependencies-post85-20261016.json.txt',
    'dependencies-post91-20261016.json.txt',
    'dependencies-post92-20261016.json.txt',
    'dependencies-post94-20261016.json.txt',
  ].map(async name => ({
    path: `.omo/private/seoul-migration/task-7-census/${name}`,
    sha256: await digestFile(`.omo/private/seoul-migration/task-7-census/${name}`),
    untouched: true,
  }))),
  invariants: {
    peopleAppliedBeforeAndAfter: ledger.value.people.length,
    documentsBeforeAndAfter: review.value.documents.length,
    classificationsBeforeAndAfter: classifications,
    metadataReviewStatusBeforeAndAfter: metadataReviewStatuses[0],
    publicationReviewOverlay: publicationOverlay,
    note: 'The registry96 world yields zero required unresolved dependencies. Authenticated publication receipts remain unchanged and metadata classifications were not promoted.',
  },
  verification: 'fresh loadAndValidateCensus inspection with in-memory sync outputs, actual new dependency artifact and live sources: ok true, errors empty; unresolved zero; no public generation and no live metadata replacement',
  applicationGate: 'Root must inspect hashes and explicitly authorize routine replacement; verify registry/source pins and live before hashes immediately before applying only the two metadata candidate raw bytes.',
}
await writeFile(resolve(root, `${outputDirectory}/post96-candidate-receipt.json`), JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify({ receiptSha256: await digestFile(`${outputDirectory}/post96-candidate-receipt.json`), ...receipt }, null, 2))

sourceBundle.close()
