import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { projectSeoulCurrentTimeline } from './timeline-overview.mjs'
import { loadTimelineReviewAuthority, validateTimelineReviewProvenance, validateTimelineReviewReceipt } from './timeline-review-authority.mjs'
import { projectCatalogTimeline, relatedTimelineDocuments, stateTimelineEvents } from './generate-catalog.mjs'
const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const koText = (leaf) => typeof leaf === 'string' ? leaf : leaf.map((run) => run.text).join('')
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const bytesDigest = (value) => createHash('sha256').update(value).digest('hex')
const sourcePath = 'lore/chronology/Century-Annals.json'

const current = { kind: 'paragraph', anchor: '2126-current', text: { ko: '인천의 옛 기록을 서울에서 대조하였다.' } }
const historical = { kind: 'paragraph', anchor: '2126-history', text: { ko: '부산에 관한 당시의 기록이 남았다.' } }
const fixture = [
  { kind: 'heading', depth: 3, anchor: '2126년', text: { ko: '2126년' } },
  { kind: 'heading', depth: 4, anchor: '2126년-서울', text: { ko: '서울' } },
  current, historical,
]
const reviewFixture = () => ({
  schema: 'seoul-timeline-event-review.v2', sourcePath, sourceSha256: bytesDigest(JSON.stringify({ content: fixture })),
  reviewer: 'fixture-independent-reviewer', approvalRef: 'fixture-review-only', reviewedAt: '2026-10-15T00:00:00Z',
  classification: 'current', decision: 'approved',
  events: [
    { id: current.anchor, sha256: digest(current), year: 2126, semanticReview: 'reviewed', scene: 'seoul-current', route: 'seoul-current' },
    { id: historical.anchor, sha256: digest(historical), year: 2126, semanticReview: 'reviewed', scene: 'historical-citation', route: 'historical-citation' },
  ],
})
const receiptFixture = (review = reviewFixture(), content = fixture) => {
  const body = JSON.stringify(review)
  return { sourcePath, sourceBytes: JSON.stringify({ content }),
    pins: [{ path: 'fixture-review.json', sha256: bytesDigest(body) }],
    evidence: [{ path: 'fixture-review.json', body }] }
}

test('fixture validation retains ordered dated IDs and distinct current scenes and historical citations without authenticating them', () => {
  const args = receiptFixture()
  const review = validateTimelineReviewReceipt(args)
  assert.equal(review.complete, true)
  assert.deepEqual(review.events, reviewFixture().events.map(event => ({ ...event, eligible: true })))
  assert.throws(() => projectSeoulCurrentTimeline(fixture, () => [], { ...args, review }), /E_TIMELINE_REVIEW_AUTHORITY/)
  assert.throws(() => projectSeoulCurrentTimeline(fixture, () => [], {
    ...args, review: structuredClone(review), isAuthenticatedReview: () => true,
  }), /E_TIMELINE_REVIEW_AUTHORITY/)
})

test('production projection rejects caller-forged predicates and missing authority', () => {
  let invoked = false
  assert.throws(() => projectSeoulCurrentTimeline(fixture, () => [], {
    sourcePath, review: reviewFixture(), isAuthenticatedReview: () => { invoked = true; return true },
  }), /E_TIMELINE_REVIEW_AUTHORITY/)
  assert.equal(invoked, false)
  assert.throws(() => projectSeoulCurrentTimeline(fixture, () => []), /E_TIMELINE_REVIEW_AUTHORITY/)
})

test('fixture validator rejects outside routes, omissions, stale hashes, reordered events, duplicate IDs and archive promotion', () => {
  for (const mutate of [
    review => { review.events[0].semanticReview = 'not-reviewed' },
    review => { review.events[0].scene = 'outside-current' },
    review => { review.events[0].route = 'outside-current' },
    review => { review.events[1].route = 'seoul-current' },
    review => { review.events[0].sha256 = digest('changed') },
    review => { review.events[0].year = 2125 },
    review => { review.events.pop() },
    review => { review.events.reverse() },
    review => { review.events[1] = { ...review.events[0] } },
    review => { review.events.push({ ...review.events[0], id: 'extra' }) },
    review => { review.classification = 'archive' },
    review => { review.sourcePath = 'lore/archive/Century-Annals.json' },
    review => { review.sourceSha256 = digest('old source') },
  ]) {
    const review = reviewFixture()
    mutate(review)
    assert.throws(() => validateTimelineReviewReceipt(receiptFixture(review)), /E_TIMELINE_(EVENT_REVIEW|OUTSIDE_CURRENT|REVIEW_COVERAGE|REVIEW_AUTHORITY|SOURCE_AUTHORITY)/)
  }
})

test('receipt pins bind exact source and receipt bytes, not merely parsed content', () => {
  const changedBytes = receiptFixture()
  changedBytes.sourceBytes += '\n'
  assert.throws(() => validateTimelineReviewReceipt(changedBytes), /E_TIMELINE_SOURCE_AUTHORITY/)
  const forgedReceipt = receiptFixture()
  forgedReceipt.evidence[0].body += '\n'
  assert.throws(() => validateTimelineReviewReceipt(forgedReceipt), /E_TIMELINE_REVIEW_AUTHORITY/)
  const injectedReceipt = receiptFixture()
  injectedReceipt.pins = []
  assert.throws(() => validateTimelineReviewReceipt(injectedReceipt), /E_TIMELINE_REVIEW_AUTHORITY/)
  const archive = receiptFixture()
  archive.sourcePath = 'lore/archive/Century-Annals.json'
  assert.throws(() => validateTimelineReviewReceipt(archive), /E_TIMELINE_SOURCE_AUTHORITY/)
  const duplicate = [...fixture, { ...current }]
  assert.throws(() => validateTimelineReviewReceipt({ sourcePath, sourceBytes: JSON.stringify({ content: duplicate }), pins: [], evidence: [] }), /E_TIMELINE_EVENT_REVIEW/)
  const reordered = [...fixture.slice(0, 2), historical, current]
  const review = reviewFixture()
  review.sourceSha256 = bytesDigest(JSON.stringify({ content: reordered }))
  assert.throws(() => validateTimelineReviewReceipt(receiptFixture(review, reordered)), /E_TIMELINE_EVENT_REVIEW/)
})

test('pure empty-pin fixture remains incomplete without creating production authority', () => {
  const { pins, sourceBytes } = receiptFixture()
  const pending = validateTimelineReviewReceipt({ sourcePath, sourceBytes, pins: [], evidence: [] })
  assert.equal(pins.length, 1)
  assert.equal(pending.complete, false)
  assert.equal(pending.receipt, null)
  assert.ok(pending.events.every(event => !event.eligible && event.semanticReview === 'not-reviewed' && event.scene === null && event.route === null))
  assert.throws(() => projectSeoulCurrentTimeline(fixture, () => [], { sourcePath, sourceBytes, review: pending }), /E_TIMELINE_REVIEW_AUTHORITY/)
})

test('production provenance binds independent review decisions and owner approval bytes', async () => {
  const sourceBytes = await readFile(new URL(`../${sourcePath}`, import.meta.url))
  const receiptBytes = await readFile(new URL('../.omo/private/seoul-migration/timeline-event-authority-integration-20261015/receipt.json', import.meta.url))
  const independentBytes = await readFile(new URL('../.omo/private/seoul-migration/timeline-three-remediation-20261015/independent.json', import.meta.url))
  const ownerBytes = await readFile(new URL('../.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', import.meta.url))
  const valid = { sourceBytes, receiptBytes, independentBytes, ownerBytes }
  assert.doesNotThrow(() => validateTimelineReviewProvenance(valid))
  for (const key of ['receiptBytes', 'independentBytes', 'ownerBytes', 'sourceBytes']) {
    assert.throws(() => validateTimelineReviewProvenance({ ...valid, [key]: Buffer.concat([valid[key], Buffer.from('\n')]) }), /E_TIMELINE_REVIEW_AUTHORITY/)
  }
  const forged = JSON.parse(receiptBytes)
  forged.events[0].scene = 'historical-citation'
  assert.throws(() => validateTimelineReviewProvenance({ ...valid, receiptBytes: JSON.stringify(forged) }), /E_TIMELINE_REVIEW_AUTHORITY/)
})

test('code-owned approved receipt covers 233 dated paragraphs but rejects clones, stale bytes and archival promotion', async () => {
  const sourceBytes = await readFile(new URL(`../${sourcePath}`, import.meta.url))
  const annals = JSON.parse(sourceBytes)
  const review = await loadTimelineReviewAuthority()
  const context = { sourcePath, sourceBytes, review }
  assert.equal(review.sourceSha256, bytesDigest(sourceBytes))
  assert.equal(review.contentSha256, digest(annals.content))
  assert.equal(review.complete, true)
  assert.match(review.receipt.approvalRef, /owner-remaining-recommendations-approval-20261015\.md#sha256=/)
  assert.equal(review.events.length, 233)
  assert.ok(review.events.every(event => event.eligible && event.semanticReview === 'reviewed' && event.scene === 'seoul-current' && event.route === 'seoul-current'))
  const expected = []
  let year = null
  for (const block of annals.content) {
    if (block.kind === 'heading' && block.depth <= 3) year = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : null
    if (year && block.kind === 'paragraph') expected.push({ id: block.anchor, sha256: digest(block), year })
  }
  assert.deepEqual(review.events.map(({ id, sha256, year }) => ({ id, sha256, year })), expected)
  assert.ok(Object.isFrozen(review) && Object.isFrozen(review.events) && review.events.every(Object.isFrozen))
  assert.throws(() => { review.events[0].eligible = true }, TypeError)
  const projected = projectSeoulCurrentTimeline(annals.content, () => [], context)
  assert.equal(projected.flatMap(year => year.events).length, 233)
  let reviewReads = 0
  const forged = structuredClone(review)
  assert.equal(projectSeoulCurrentTimeline(annals.content, () => [], {
    sourcePath, sourceBytes, get review() { return ++reviewReads === 1 ? review : forged },
  }).flatMap(year => year.events).length, 233)
  assert.equal(reviewReads, 1)
  assert.throws(() => projectSeoulCurrentTimeline(annals.content, () => [], { ...context, review: structuredClone(review), isAuthenticatedReview: () => true }), /E_TIMELINE_REVIEW_AUTHORITY/)
  assert.throws(() => projectSeoulCurrentTimeline(annals.content, () => [], { ...context, sourceBytes: Buffer.concat([sourceBytes, Buffer.from('\n')]) }), /E_TIMELINE_SOURCE_AUTHORITY/)
  assert.throws(() => projectSeoulCurrentTimeline(annals.content.slice().reverse(), () => [], context), /E_TIMELINE_SOURCE_AUTHORITY/)
  assert.throws(() => projectSeoulCurrentTimeline(annals.content, () => [], { ...context, sourcePath: 'lore/archive/Century-Annals.json' }), /E_TIMELINE_SOURCE_AUTHORITY/)
})

test('catalog timeline consumer requires code-owned event reviews for the raw current annals', async () => {
  const path = new URL(`../${sourcePath}`, import.meta.url)
  const value = JSON.parse(await readFile(path))
  let relatedCalls = 0
  const related = () => { relatedCalls += 1; return [] }
  await projectCatalogTimeline({ path, value }, related)
  assert.ok(relatedCalls > 0)
  relatedCalls = 0
  await assert.rejects(projectCatalogTimeline({ path, value: { ...value, content: value.content.slice(1) } }, related), /E_TIMELINE_SOURCE_AUTHORITY/)
  assert.equal(relatedCalls, 0)
})

test('current timeline links exclude retired outside route and state chronology excludes historical citations', () => {
  const routes = relatedTimelineDocuments('XT01 외부전구 임진 바깥 서울 십육국', [{ id: 'S01', name: '서울 십육국' }], []).map((entry) => entry.route)
  assert.ok(routes.includes('/world/Sixteen-States'))
  assert.ok(!routes.includes('/world/External-Theaters'))
  const current = { kind: 'paragraph', anchor: 'current', text: { ko: '서울 십육국의 결정.' } }
  const historical = { kind: 'paragraph', anchor: 'historical', text: { ko: '서울 십육국의 과거 기록.' } }
  const years = [{ year: 2126, events: [{ id: current.anchor }], historicalCitations: [{ id: historical.anchor }] }]
  const states = [{ name: '서울 십육국' }]
  const result = stateTimelineEvents([{ kind: 'heading', depth: 3, text: { ko: '2126년' } }, current, historical], years, states)
  assert.deepEqual(result.get(states[0].name), [{ year: 2126, text: current.text.ko, sourceRoute: '/world/Century-Annals#2126년' }])
})

test('regional-only years use their actual prose for overview fields', async () => {
  const { buildTimelineYears } = await import('./timeline-overview.mjs')
  const years = buildTimelineYears([
    { kind: 'heading', depth: 3, text: { ko: '2125년' } },
    { kind: 'heading', depth: 4, anchor: 'peninsula-example', text: { ko: '지역 사건' } },
    { kind: 'paragraph', text: { ko: '화물 운송이 중단되었다. 다른 경로를 확인하였다.' } },
  ], () => [])
  assert.equal(years[0].pressure, '화물 운송이 중단되었다.')
  assert.equal(years[0].decision, '화물 운송이 중단되었다.')
  assert.equal(years[0].immediate, '화물 운송이 중단되었다.')
  assert.equal(years[0].aftermath, years[0].immediate)
})

test('timeline overview has one causal summary for every year heading in the Century-Annals canon', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const annals = await readJson('../lore/chronology/Century-Annals.json')
  const canonYears = annals.content
    .filter((block) => block.kind === 'heading' && block.depth === 3)
    .map((block) => koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1])
    .filter(Boolean)
    .map(Number)
  assert.ok(canonYears.length > 0)
  assert.deepEqual(data.years.map((entry) => entry.year), canonYears)
  assert.equal(data.years[0].year, 2030)
  assert.ok(data.years.every((entry, index) => index === 0 || entry.year > data.years[index - 1].year))
  assert.ok(data.years.every((entry) => entry.year >= 2030 && entry.year <= 2126))
  assert.ok(data.years.every((entry) => entry.summary.length >= 40))
  assert.ok(data.years.every((entry) => entry.pressure.length > 0 && entry.decision.length > 0 && entry.immediate.length > 0 && entry.aftermath.length > 0))
  assert.ok(data.years.every((entry) => entry.sourceRoute === `/world/Century-Annals#${entry.year}년`))
  assert.ok(data.years.every((entry) => entry.relatedDocuments.length >= 1))
})

test('every timeline source anchor exists on the published Century-Annals page', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const page = await readJson('../src/generated/world/Century-Annals.json')
  const headingText = (node) => node.value ?? (node.children ?? []).map(headingText).join('')
  const anchors = new Set(page.blocks.filter((block) => block.type === 'heading').map((block) => headingText(block).trim()))
  for (const entry of data.years) assert.ok(anchors.has(`${entry.year}년`), entry.sourceRoute)
})

test('timeline overview cross-links the current 16 states and world canon', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const contract = await readJson('../public/wiki-contract.json')
  const states = data.states
  assert.equal(states.length, 16)
  assert.equal(new Set(states.map((state) => state.name)).size, 16)
  const published = new Set([...contract.documents.map((document) => document.route), '/people'])
  const routes = new Set(data.years.flatMap((entry) => entry.relatedDocuments.map((document) => document.route)))
  for (const route of routes) assert.ok(published.has(route), `unpublished related route ${route}`)
  for (const route of ['/world/Sixteen-States', '/world/Chaebol-Houses-and-Century-Factions', '/world/Faith-Culture-Schism', '/world/Era-Arms-and-Tech-Level']) assert.ok(routes.has(route), route)
})

test('dated Seoul corridor events preserve stable XT identities without outside destinations', async () => {
  const page = await readJson('../src/generated/world/External-Theaters.json')
  const headings = page.blocks.filter(block => block.type === 'heading' && block.depth === 2)
    .map(block => (block.children ?? []).map(node => node.value ?? '').join(''))
  assert.equal(headings.filter(text => /^XT0[1-5] ·/u.test(text)).length, 5)
  for (const id of ['XT01', 'XT02', 'XT03', 'XT04', 'XT05']) assert.ok(headings.some(text => text.startsWith(id + ' ·')), id)
  assert.match(page.title, /인계 회랑/u)
})

test('Scenario Timeline mounts the complete timeline overview', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/TimelineOverview.tsx', import.meta.url), 'utf8')
  assert.match(page, /Scenario-Timeline/)
  assert.match(page, /TimelineOverview/)
  assert.match(page, /locale === 'ko' && domain === 'world' && normalizedSlug === 'Scenario-Timeline' && <Suspense/)
  assert.match(component, /전체 \{data\.years\.length\}개 연도/)
  assert.doesNotMatch(component, /101개/)
  assert.match(component, /재접촉 전야 2115–2126/)
  assert.doesNotMatch(component, /개막 전야/)
  assert.match(component, /timeline-overview-year/)
  assert.match(component, /relatedDocuments/)
})
