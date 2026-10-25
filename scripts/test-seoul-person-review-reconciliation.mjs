import { afterAll } from 'vitest'
import { describe, expect, it } from 'vitest'
import { readFile as readDiskFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { materializePersonReviewReconciliation, PERSON_REVIEW_RECONCILIATION } from './seoul-person-review-reconciliation.mjs'
import { reviewWordingPredecessorReader } from './review-wording-successor.mjs'
import { k176PredecessorReader } from './k176-label-successor.mjs'

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

const reconcile = async input => {
  let reader = await reviewWordingPredecessorReader(input.root, input.readBytes ?? readFile)
  reader = await k176PredecessorReader(input.root, reader)
  return materializePersonReviewReconciliation({ ...input, readBytes: reader })
}

const root = resolve(import.meta.dirname, '..')
const paths = {
  contract: 'lore/editorial/Seoul-Scope-Contract.json',
  ledger: 'lore/editorial/Seoul-Relocation-Ledger.json',
  review: 'lore/editorial/Seoul-Narrative-Review.json',
}
const bytes = path => readFile(resolve(root, path))
const load = async () => Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) =>
  [key, JSON.parse(await bytes(path))])))

describe('task10 person review reconciliation', () => {
  it('binds all 19 documents and 2,076 bilingual card occurrences without dispositions', async () => {
    const input = await load()
    const beforeDispositions = JSON.stringify(input.contract.dispositions)
    const result = await reconcile({ root, ...input })
    const targetPaths = new Set(result.manifest.documents.map(row => row.sourcePath))
    const documents = result.contract.documents.filter(row => targetPaths.has(row.sourcePath))
    const cards = result.ledger.cardOccurrences.filter(row => targetPaths.has(row.sourcePath))
    expect(documents).toHaveLength(19)
    expect(documents.every(row => row.status === 'active' && row.reviewReceipt !== null)).toBe(true)
    expect(cards).toHaveLength(2076)
    expect(cards.filter(row => row.locale === 'ko')).toHaveLength(1038)
    expect(cards.filter(row => row.locale === 'en')).toHaveLength(1038)
    expect(cards.every(row => row.classification === 'current-reviewed' && row.reviewStatus === 'reviewed')).toBe(true)
    expect(result.review.documents.filter(row => targetPaths.has(row.sourcePath)).every(row =>
      row.classification === 'current-reviewed' && row.semanticReview === 'reviewed')).toBe(true)
    expect(JSON.stringify(result.contract.dispositions)).toBe(beforeDispositions)
  })

  it('rejects a wrong manifest hash with the exact code and path', async () => {
    const input = await load()
    const manifestPath = resolve(root, PERSON_REVIEW_RECONCILIATION.manifest.path)
    const readBytes = async path => path === manifestPath ? Buffer.from('{}\n') : readFile(path)
    await expect(reconcile({ root, ...input, readBytes })).rejects.toMatchObject({
      code: 'E_REVIEW_HASH', path: PERSON_REVIEW_RECONCILIATION.manifest.path,
    })
  })

  it('rejects a wrong authenticated review artifact hash', async () => {
    const input = await load()
    const manifest = JSON.parse(await bytes(PERSON_REVIEW_RECONCILIATION.manifest.path))
    const reviewPath = resolve(root, manifest.documents[0].batchChain[0].reviewArtifact.path)
    const readBytes = async path => path === reviewPath ? Buffer.from('{}\n') : readFile(path)
    await expect(reconcile({ root, ...input, readBytes })).rejects.toMatchObject({
      code: 'E_REVIEW_HASH', path: manifest.documents[0].batchChain[0].reviewArtifact.path,
    })
  })

  it('is same-ID no-op idempotent', async () => {
    const input = await load()
    const first = await reconcile({ root, ...input })
    const second = await reconcile({ root, contract: first.contract, ledger: first.ledger, review: first.review })
    expect(second.contract).toEqual(first.contract)
    expect(second.ledger).toEqual(first.ledger)
    expect(second.review).toEqual(first.review)
  })

  it.each(['append', 'prepend'])('rejects a bogus duplicate reconciliation receipt on %s', async position => {
    const input = await load()
    const bogus = { schema: 'seoul-person-review-reconciliation-receipt.v1', bogus: true }
    if (position === 'append') input.review.receipts.push(bogus)
    else input.review.receipts.unshift(bogus)
    await expect(reconcile({ root, ...input })).rejects.toMatchObject({
      code: 'E_REVIEW_COVERAGE', path: '/review/receipts', id: 'expected exactly one reconciliation receipt',
    })
  })
})
