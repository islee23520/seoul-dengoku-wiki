import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const SOURCE_PATH = 'lore/chronology/Century-Annals.json'
// The 191-entry event manifest is a separate contract, not the review denominator.
const REVIEW_PROOF = Object.freeze({
  path: '.omo/private/seoul-migration/timeline-three-remediation-20261015/independent.json',
  sha256: '61ffd3bd97129ae9021e5a25607c146da64437da6cc2b889984214bbfc6fe285',
})
const OWNER_APPROVAL = Object.freeze({
  path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
  sha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
})
const APPROVED_EVENT_REVIEW_RECEIPTS = Object.freeze([Object.freeze({
  path: '.omo/private/seoul-migration/timeline-event-authority-integration-20261015/receipt.json',
  sha256: 'e6dfb195e53925a70adc037a39b6187151993fbeeb97114b4beb5cb53591ec83',
})])
const authenticatedReviews = new WeakSet()
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const contentHash = (value) => hash(JSON.stringify(value))
const fail = (code, id = '') => { throw new Error(`${code}:${id}`) }
const text = (value) => typeof value === 'string' && value.trim().length > 0
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
const exactShape = (value, keys, code) => {
  if (!value || Array.isArray(value) || typeof value !== 'object'
    || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) fail(code)
}

/**
 * Scene describes the reviewed paragraph; route is its publication disposition,
 * not a location inferred from names or a transport route. Historical citations
 * cannot be promoted into current scenes. Outside-current scenes/routes block.
 * @typedef {{id: string, sha256: string, year: number, semanticReview: 'reviewed',
 *   scene: 'seoul-current'|'historical-citation'|'outside-current',
 *   route: 'seoul-current'|'historical-citation'|'outside-current'}} TimelineEventReview
 * @typedef {{schema: 'seoul-timeline-event-review.v2', reviewer: string,
 *   approvalRef: string, reviewedAt: string, classification: 'current', decision: 'approved',
 *   sourcePath: string, sourceSha256: string, events: TimelineEventReview[]}} TimelineReviewReceipt
 * @typedef {{schema: 'seoul-timeline-event-eligibility.v1', sourcePath: string,
 *   sourceSha256: string, contentSha256: string, complete: boolean,
 *   events: Array<{id: string, sha256: string, year: number, eligible: boolean,
 *     semanticReview: 'reviewed'|'not-reviewed', scene: string|null, route: string|null}>,
 *   receipt: {path: string, sha256: string, approvalRef: string}|null}} TimelineReviewAuthority
 */

function datedEvents(content) {
  if (!Array.isArray(content)) fail('E_TIMELINE_SOURCE_AUTHORITY')
  const events = []
  const ids = new Set()
  const years = new Set()
  let year = null
  for (const block of content) {
    if (block.kind === 'heading' && block.depth <= 3) {
      const leaf = block.text?.ko
      const label = typeof leaf === 'string' ? leaf : Array.isArray(leaf) ? leaf.map(run => run.text).join('') : ''
      const candidate = block.depth === 3 ? Number(label.match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
      year = Number.isInteger(candidate) ? candidate : null
      if (year !== null) {
        if (years.has(year)) fail('E_TIMELINE_DUPLICATE_YEAR', year)
        years.add(year)
      }
    }
    if (year === null || block.kind !== 'paragraph') continue
    if (!text(block.anchor) || ids.has(block.anchor)) fail('E_TIMELINE_EVENT_REVIEW', block.anchor)
    ids.add(block.anchor)
    events.push({ id: block.anchor, sha256: contentHash(block), year })
  }
  if (!events.length) fail('E_TIMELINE_REVIEW_COVERAGE')
  return events
}

// Pure fixture validator: caller pins may exercise the contract but can never
// mint production authority. The private loader alone brands frozen results.
/** @returns {TimelineReviewAuthority} */
export function validateTimelineReviewReceipt({ sourcePath, sourceBytes, pins, evidence }) {
  if (sourcePath !== SOURCE_PATH || !(typeof sourceBytes === 'string' || Buffer.isBuffer(sourceBytes))) fail('E_TIMELINE_SOURCE_AUTHORITY')
  const source = JSON.parse(sourceBytes.toString())
  const expected = datedEvents(source.content)
  const sourceSha256 = hash(sourceBytes)
  if (!Array.isArray(pins) || !Array.isArray(evidence) || pins.length > 1 || evidence.length !== pins.length) fail('E_TIMELINE_REVIEW_AUTHORITY')
  let receipt = null
  let decisions = null
  if (pins.length) {
    const pin = pins[0]
    exactShape(pin, ['path', 'sha256'], 'E_TIMELINE_REVIEW_AUTHORITY')
    const entry = evidence[0]
    exactShape(entry, ['path', 'body'], 'E_TIMELINE_REVIEW_AUTHORITY')
    if (!text(pin.path) || !digest(pin.sha256) || entry.path !== pin.path
      || !(typeof entry.body === 'string' || Buffer.isBuffer(entry.body)) || hash(entry.body) !== pin.sha256) fail('E_TIMELINE_REVIEW_AUTHORITY')
    const review = JSON.parse(entry.body.toString())
    exactShape(review, ['schema', 'reviewer', 'approvalRef', 'reviewedAt', 'classification', 'decision', 'sourcePath', 'sourceSha256', 'events'], 'E_TIMELINE_REVIEW_AUTHORITY')
    if (review.schema !== 'seoul-timeline-event-review.v2' || !text(review.reviewer) || !text(review.approvalRef)
      || typeof review.reviewedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/u.test(review.reviewedAt)
      || !Number.isFinite(Date.parse(review.reviewedAt))) fail('E_TIMELINE_REVIEW_AUTHORITY')
    if (review.sourcePath !== SOURCE_PATH || review.sourceSha256 !== sourceSha256) fail('E_TIMELINE_SOURCE_AUTHORITY')
    if (review.classification !== 'current' || review.decision !== 'approved') fail('E_TIMELINE_REVIEW_AUTHORITY')
    if (!Array.isArray(review.events) || review.events.length !== expected.length) fail('E_TIMELINE_REVIEW_COVERAGE')
    decisions = review.events
    for (const [index, event] of decisions.entries()) {
      exactShape(event, ['id', 'sha256', 'year', 'semanticReview', 'scene', 'route'], 'E_TIMELINE_EVENT_REVIEW')
      const wanted = expected[index]
      if (event.id !== wanted.id || event.sha256 !== wanted.sha256 || event.year !== wanted.year
        || event.semanticReview !== 'reviewed') fail('E_TIMELINE_EVENT_REVIEW', event.id)
      if (!['seoul-current', 'historical-citation'].includes(event.scene)
        || event.route !== event.scene) fail('E_TIMELINE_OUTSIDE_CURRENT', event.id)
    }
    receipt = { ...pin, approvalRef: review.approvalRef }
  }
  return {
    schema: 'seoul-timeline-event-eligibility.v1', sourcePath, sourceSha256, contentSha256: contentHash(source.content),
    complete: decisions !== null,
    events: expected.map((event, index) => ({ ...event, eligible: decisions !== null,
      semanticReview: decisions ? 'reviewed' : 'not-reviewed',
      scene: decisions?.[index].scene ?? null, route: decisions?.[index].route ?? null })),
    receipt,
  }
}

// Pure provenance validator; supplied bytes never receive the loader's brand.
export function validateTimelineReviewProvenance({ sourceBytes, receiptBytes, independentBytes, ownerBytes }) {
  if (hash(receiptBytes) !== APPROVED_EVENT_REVIEW_RECEIPTS[0].sha256
    || hash(independentBytes) !== REVIEW_PROOF.sha256 || hash(ownerBytes) !== OWNER_APPROVAL.sha256) fail('E_TIMELINE_REVIEW_AUTHORITY')
  const independent = JSON.parse(independentBytes.toString())
  const approved = ownerBytes.toString()
  const receipt = JSON.parse(receiptBytes.toString())
  if (independent.schema !== 'seoul-timeline-independent-review-evidence.v1'
    || independent.decision !== 'PASS' || independent.classification !== 'current'
    || independent.sourcePath !== SOURCE_PATH || independent.sourceSha256 !== hash(sourceBytes)
    || independent.denominator?.actualDatedParagraphs !== 233
    || independent.counts?.reviewed !== 233 || independent.counts?.seoulCurrent !== 233
    || independent.counts?.unreviewed !== 0 || independent.counts?.omittedIds !== 0
    || independent.counts?.duplicateIds !== 0 || independent.counts?.outsideCurrent !== 0
    || independent.counts?.historicalCitation !== 0
    || independent.contentSha256 !== contentHash(JSON.parse(sourceBytes.toString()).content)
    || !Array.isArray(independent.events) || independent.events.length !== 233
    || JSON.stringify(receipt.events) !== JSON.stringify(independent.events)
    || receipt.reviewer !== 'timeline-three-remediation-20261015/independent.json'
    || receipt.approvalRef !== `${OWNER_APPROVAL.path}#sha256=${OWNER_APPROVAL.sha256}`
    || !approved.includes('나머지 모든것들은 너의 추천안으로 할게 완성 해줘 이제')
    || !approved.includes('정확 후보가 준비되는 항목은 후보 바이트와 해시를 이 승인에 결속해 기록하며 같은 추천을 다시 승인받지 않는다.')) fail('E_TIMELINE_REVIEW_AUTHORITY')
}

/**
 * Reads this checkout's current annals and code-owned receipt pins only. There
 * is no caller-supplied root, reader, evidence, predicate, or pin injection.
 * @returns {Promise<TimelineReviewAuthority>}
 */
export async function loadTimelineReviewAuthority() {
  const sourceBytes = await readFile(new URL(`../${SOURCE_PATH}`, import.meta.url))
  const evidence = []
  for (const pin of APPROVED_EVENT_REVIEW_RECEIPTS) evidence.push({ path: pin.path, body: await readFile(new URL(`../${pin.path}`, import.meta.url)) })
  validateTimelineReviewProvenance({ sourceBytes, receiptBytes: evidence[0].body,
    independentBytes: await readFile(new URL(`../${REVIEW_PROOF.path}`, import.meta.url)),
    ownerBytes: await readFile(new URL(`../${OWNER_APPROVAL.path}`, import.meta.url)) })
  const review = validateTimelineReviewReceipt({ sourcePath: SOURCE_PATH, sourceBytes, pins: APPROVED_EVENT_REVIEW_RECEIPTS, evidence })
  for (const event of review.events) Object.freeze(event)
  Object.freeze(review.events)
  if (review.receipt) Object.freeze(review.receipt)
  Object.freeze(review)
  authenticatedReviews.add(review)
  return review
}

/** @param {{sourcePath: string, sourceBytes: Buffer|string, review: TimelineReviewAuthority}} context */
export function assertTimelineReviewAuthority(content, context) {
  const review = context?.review
  if (!authenticatedReviews.has(review)) fail('E_TIMELINE_REVIEW_AUTHORITY')
  const { sourcePath, sourceBytes } = context
  if (sourcePath !== SOURCE_PATH || !(typeof sourceBytes === 'string' || Buffer.isBuffer(sourceBytes))
    || hash(sourceBytes) !== review.sourceSha256 || contentHash(content) !== review.contentSha256) fail('E_TIMELINE_SOURCE_AUTHORITY')
  if (!review.complete || !review.events.every(event => event.eligible)) fail('E_TIMELINE_REVIEW_PENDING')
  return review
}
