import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { FeedbackApiError, submitFeedback } from '../src/feedbackApi.ts'
import { clipSourceSegments } from '../src/feedbackSelection.ts'

const literalLeaf = {
  leafId: 'formatted', blockAnchor: 'b', blockKind: 'paragraph', text: '생애. 2126년',
  sourceSegments: [
    { kind: 'literal', path: '/runs/0/text', start: 0, end: 3, unit: 'unicode-code-point', textStart: 0, textEnd: 3 },
    { kind: 'literal', path: '/runs/1/text', start: 0, end: 7, unit: 'unicode-code-point', textStart: 3, textEnd: 10 },
  ],
}

test('literal source clipping preserves ordered cross-format code-point spans', () => {
  assert.deepEqual(clipSourceSegments(literalLeaf, 1, 8), [
    { path: '/runs/0/text', start: 1, end: 3, unit: 'unicode-code-point' },
    { path: '/runs/1/text', start: 0, end: 5, unit: 'unicode-code-point' },
  ])
})

test('adapter uses the U1 endpoint and never converts auth errors into success', async () => {
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
