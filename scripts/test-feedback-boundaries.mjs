import assert from 'node:assert/strict'
import { test } from 'vitest'
import { FeedbackApiError, submitFeedback } from '../src/feedbackApi.ts'

const payload = { anchor: {}, body: 'body', reason: '기타' }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

test('submission obtains session CSRF and sends a stable idempotency key', async () => {
  const calls = []
  const record = await submitFeedback(payload, { idempotencyKey: 'stable-request-key', fetcher: async (url, init) => {
    calls.push({ url, init })
    return url.endsWith('/session') ? json({ identity: { githubId: '1', login: 'reader' }, csrfToken: 'csrf-token' }) : json({ id: 7, status: 'received' }, 201)
  } })
  assert.deepEqual(record, { id: 7, status: 'received' })
  assert.equal(calls[0].url, '/api/feedback/auth/session')
  assert.equal(calls[1].init.headers['x-csrf-token'], 'csrf-token')
  assert.equal(calls[1].init.headers['idempotency-key'], 'stable-request-key')
  assert.equal(calls[1].init.credentials, 'include')
})

test('HTML 200 and malformed JSON are not acknowledgements', async () => {
  for (const response of [new Response('<html>login</html>', { status: 200, headers: { 'content-type': 'text/html' } }), new Response('{bad', { status: 201, headers: { 'content-type': 'application/json' } })]) {
    let count = 0
    await assert.rejects(() => submitFeedback(payload, { idempotencyKey: 'stable-request-key', fetcher: async () => ++count === 1 ? json({ csrfToken: 'csrf-token' }) : response }), FeedbackApiError)
  }
})

test('nested source-changed response preserves reconfirmation state', async () => {
  let count = 0
  await assert.rejects(() => submitFeedback(payload, { idempotencyKey: 'stable-request-key', fetcher: async () => ++count === 1 ? json({ csrfToken: 'csrf-token' }) : json({ error: { code: 'source-changed', message: 'source-changed', reconfirmationRequired: true } }, 422) }), (error) => error instanceof FeedbackApiError && error.code === 'source-changed' && error.reconfirmationRequired)
})

test('abort signal reaches both session and submission requests', async () => {
  const controller = new AbortController()
  const signals = []
  await submitFeedback(payload, { idempotencyKey: 'stable-request-key', signal: controller.signal, fetcher: async (url, init) => { signals.push(init.signal); return url.endsWith('/session') ? json({ csrfToken: 'csrf-token' }) : json({ id: 1, status: 'received' }, 201) } })
  assert.deepEqual(signals, [controller.signal, controller.signal])
})

test('person Markdown leaves retain exact source offsets for section and biography lists', async () => {
  const { personFeedbackDocument } = await import('../src/feedbackSelection.ts')
  const detail = { id: 'person-0029', sections: { 관계: '한재목에게 펌프 부품을 댄다.\n\n- 소속: 규격맹\n- 생업: 공방 제작 조정' }, biography: '**관계.** 한재목에게 펌프 부품을 댄다.\n\n- 소속: 규격맹' }
  const document = await personFeedbackDocument(detail)
  for (const leaf of document.selectableLeaves) {
    const source = leaf.sourceSpans[0].path === '/biography' ? detail.biography : detail.sections.관계
    const visible = leaf.sourceSpans.map((span) => Array.from(source).slice(span.start, span.end).join('')).join('').replaceAll('**', '')
    assert.equal(visible, leaf.text, leaf.leafId)
  }
  const sectionList = document.selectableLeaves.find((leaf) => leaf.leafId === 'section:관계:list:1')
  assert.equal(sectionList.sourceSpans[0].start, Array.from(detail.sections.관계).findIndex((_, index) => Array.from(detail.sections.관계).slice(index).join('').startsWith(sectionList.text)))
  const biographyList = document.selectableLeaves.find((leaf) => leaf.leafId === 'biography:list:1')
  assert.equal(biographyList.text, '소속: 규격맹')
})

test('actual person biography link label projects rendered text to label-only source spans', async () => {
  const { readFile } = await import('node:fs/promises')
  const { personFeedbackDocument, clipSourceSpans } = await import('../src/feedbackSelection.ts')
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0998.json', import.meta.url), 'utf8'))
  const document = await personFeedbackDocument(detail)
  const leaf = document.selectableLeaves.find((candidate) => candidate.leafId === 'biography:list:6')
  assert.equal(leaf.text, '기여자: islee23520')
  assert.doesNotMatch(leaf.text, /https:|[\[\]()]/u)
  const source = Array.from(detail.biography)
  assert.equal(leaf.sourceSpans.map((span) => source.slice(span.start, span.end).join('')).join(''), leaf.text)
  const labelStart = Array.from(leaf.text).indexOf('i')
  const clipped = clipSourceSpans(leaf, labelStart, labelStart + Array.from('islee23520').length)
  assert.equal(clipped.map((span) => source.slice(span.start, span.end).join('')).join(''), 'islee23520')
})

test('formatted emoji link labels keep rendered order and exact source controls', async () => {
  const { personFeedbackDocument } = await import('../src/feedbackSelection.ts')
  const biography = '- 기여자: [**이😀름**](https://example.invalid/profile) 뒤'
  const document = await personFeedbackDocument({ id: 'person-link-fixture', sections: {}, biography })
  const leaf = document.selectableLeaves[0]
  assert.equal(leaf.text, '기여자: 이😀름 뒤')
  assert.equal(leaf.sourceSpans.map((span) => Array.from(biography).slice(span.start, span.end).join('')).join(''), leaf.text)
})
