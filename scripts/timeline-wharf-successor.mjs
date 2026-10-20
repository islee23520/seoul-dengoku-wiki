import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export const TIMELINE_SOURCE = 'lore/chronology/Scenario-Timeline.json'
export const TIMELINE_DIRECTORY = '.omo/private/seoul-migration/timeline-wharf-successor-20261020/'
export const TIMELINE_RECEIPT = TIMELINE_DIRECTORY + 'source-before-after.json'
export const TIMELINE_RECEIPT_SHA256 = 'bb0349ca43fb2392b9552af7a655a99e8e122d2354843647df081945017e1c46'
export const TIMELINE_BEFORE = 'f991bb923a8a63c971df9a8bcd85415cbe51d3837737a26d587e19964fc99f8c'
export const TIMELINE_AFTER = '0615b7d071f085a5ee0bffff7c76505cbf7adf6fe2bdc1c828bca4080f2f0c3d'
export const TIMELINE_REVIEW = TIMELINE_DIRECTORY + 'review.json'
export const TIMELINE_REVIEW_SHA256 = '8cf3d7450e63d6a50f2b532ce84a10f24e82735013c76aea44135d42d6dff917'
const hash = value => createHash('sha256').update(value).digest('hex')
const check = (value, path) => { if (!value) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path }) }

// Authenticate the exact owner-approved replacement, then replay old receipts
// against their original bytes. No historical receipt or registry row is edited.
export async function authenticateTimelineWharfSuccessor(root, reader = readFile) {
  const raw = await reader(resolve(root, TIMELINE_RECEIPT))
  check(hash(raw) === TIMELINE_RECEIPT_SHA256, TIMELINE_RECEIPT)
  const receipt = JSON.parse(raw)
  check(receipt.schema === 'timeline-wharf-successor.v1' && receipt.sourcePath === TIMELINE_SOURCE
    && receipt.beforeSha256 === TIMELINE_BEFORE && receipt.afterSha256 === TIMELINE_AFTER
    && receipt.operations.length === 2, TIMELINE_RECEIPT)
  for (const binding of [receipt.approval, receipt.candidate, ...receipt.historicalReceipts])
    check(hash(await reader(resolve(root, binding.path))) === binding.sha256, binding.path)
  const before = Buffer.from(await reader(resolve(root, TIMELINE_DIRECTORY + 'before.json')))
  const current = Buffer.from(await reader(resolve(root, TIMELINE_SOURCE)))
  check(hash(before) === TIMELINE_BEFORE && before.length === receipt.beforeBytes, TIMELINE_DIRECTORY + 'before.json')
  check(hash(current) === TIMELINE_AFTER && current.length === receipt.afterBytes, TIMELINE_SOURCE)
  const document = JSON.parse(before), after = JSON.parse(current)
  check(document.content[14].anchor === receipt.anchor && after.content[14].anchor === receipt.anchor, TIMELINE_SOURCE)
  let replay = before.toString(), inverse = current.toString()
  for (const [index, locale] of ['ko', 'en'].entries()) {
    const operation = receipt.operations[index]
    check(operation.pointer === `/content/14/text/${locale}`
      && document.content[14].text[locale] === operation.before
      && after.content[14].text[locale] === operation.after, TIMELINE_SOURCE + '#' + operation.pointer)
    const oldToken = JSON.stringify(operation.before), newToken = JSON.stringify(operation.after)
    check(replay.split(oldToken).length === 2 && inverse.split(newToken).length === 2, operation.pointer)
    replay = replay.replace(oldToken, newToken)
    inverse = inverse.replace(newToken, oldToken)
    document.content[14].text[locale] = operation.after
  }
  check(Buffer.from(replay).equals(current) && Buffer.from(inverse).equals(before)
    && JSON.stringify(document) === JSON.stringify(after), TIMELINE_SOURCE)
  return { before, current, receipt, sha256: TIMELINE_RECEIPT_SHA256 }
}

export async function authenticateTimelineWharfPublicationReview(root, reader = readFile) {
  const bytes = await reader(resolve(root, TIMELINE_REVIEW))
  check(hash(bytes) === TIMELINE_REVIEW_SHA256, TIMELINE_REVIEW)
  const review = JSON.parse(bytes)
  check(review.schema === 'seoul-timeline-event-review.v2' && review.sourcePath === TIMELINE_SOURCE
    && review.sourceSha256 === TIMELINE_AFTER && review.predecessorSha256 === TIMELINE_BEFORE
    && review.sourceBytes === 94867 && review.verdict === 'reviewed' && review.findings.length === 0
    && review.reviewer.model === 'gemini-3.8-flash-high' && review.reviewer.taskId === 'st_01a157c6'
    && review.evidenceRef.taskId === review.reviewer.taskId, TIMELINE_REVIEW)
  return { review, sha256: TIMELINE_REVIEW_SHA256 }
}

export async function timelineWharfPredecessorReader(root, reader = readFile) {
  let bytes
  try { bytes = await reader(resolve(root, TIMELINE_SOURCE)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (!bytes || hash(bytes) !== TIMELINE_AFTER) return reader
  const successor = await authenticateTimelineWharfSuccessor(root, reader)
  const predecessor = async path => resolve(path) === resolve(root, TIMELINE_SOURCE) ? successor.before : reader(path)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  return predecessor
}
