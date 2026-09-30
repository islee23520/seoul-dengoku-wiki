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
