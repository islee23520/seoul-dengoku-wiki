import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { clipSourceSpans } from '../src/feedbackSelection.ts'
import { FeedbackApiError, submitFeedback } from '../src/feedbackApi.ts'

const generated = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

test('generated article leaves bind stable id, canonical revision, block anchor and formatted source spans', async () => {
  const article = await generated('../src/generated/world/World-Unbinding.json')
  assert.match(article.feedback.documentId, /^DOC:/)
  assert.match(article.feedback.sourceRevision, /^[a-f0-9]{64}$/)
  const formatted = article.feedback.selectableLeaves.find((leaf) => leaf.sourceSpans.length > 1)
  assert.ok(formatted)
  assert.ok(formatted.blockAnchor)
  assert.equal(formatted.sourceSpans[0].textStart, 0)
  assert.equal(formatted.sourceSpans.at(-1).textEnd, Array.from(formatted.text).length)
  assert.ok(formatted.sourceSpans.every((span) => span.path.startsWith('/content/')))
})

test('table cells are distinct visible leaves and never gain synthetic separators', async () => {
  const article = await generated('../src/generated/world/World-Unbinding.json')
  const cells = article.feedback.selectableLeaves.filter((leaf) => leaf.leafId.includes(':cell:'))
  assert.ok(cells.length > 10)
  assert.equal(new Set(cells.map((leaf) => leaf.leafId)).size, cells.length)
  assert.ok(cells.every((leaf) => !leaf.text.includes('\t')))
  assert.ok(cells.some((leaf) => /:cell:1:1$/.test(leaf.leafId)))
})

test('source clipping preserves ordered cross-format spans with code-point end-exclusive offsets', () => {
  const leaf = {
    leafId: 'x', blockAnchor: 'b', blockKind: 'paragraph', text: '생애. 2126년',
    sourceSpans: [
      { path: '/runs/0/text', start: 0, end: 3, unit: 'unicode-code-point', textStart: 0, textEnd: 3 },
      { path: '/runs/1/text', start: 0, end: 7, unit: 'unicode-code-point', textStart: 3, textEnd: 10 },
    ],
  }
  assert.deepEqual(clipSourceSpans(leaf, 1, 8), [
    { path: '/runs/0/text', start: 1, end: 3, unit: 'unicode-code-point' },
    { path: '/runs/1/text', start: 0, end: 5, unit: 'unicode-code-point' },
  ])
})

test('adapter uses the U1 endpoint and never converts auth or server errors into success', async () => {
  const requests = []
  await assert.rejects(() => submitFeedback({ anchor: {}, body: 'x', reason: '기타' }, { idempotencyKey: 'stable-test-key', fetcher: async (url, init) => {
    requests.push({ url, init })
    return url.endsWith('/session')
      ? new Response(JSON.stringify({ csrfToken: 'csrf' }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(JSON.stringify({ error: { code: 'authentication-required', message: '로그인 필요' } }), { status: 401, headers: { 'content-type': 'application/json' } })
  } }), (error) => error instanceof FeedbackApiError && error.status === 401)
  assert.equal(requests[1].url, '/api/feedback/submissions')
  assert.equal(requests[1].init.credentials, 'include')
  assert.equal(requests[1].init.method, 'POST')
})

test('public pages expose the composer but no annotation or underline data path', async () => {
  const article = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const person = await readFile(new URL('../src/pages/PersonDetailPage.tsx', import.meta.url), 'utf8')
  for (const source of [article, person]) {
    assert.match(source, /FeedbackComposer/)
    assert.doesNotMatch(source, /annotation|underline|reviewQueue/i)
  }
})
