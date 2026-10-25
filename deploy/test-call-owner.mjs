import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { callOwner } from './call-owner.mjs'

const sha = 'a'.repeat(40)
const token = 'test-private-token'
const options = { url: 'http://owner.invalid/deploy', token, sha }
const record = (status, commit = sha) => JSON.stringify({ status, sha: commit })
const withResponse = (body, init) => ({ ...options, fetchImpl: async () => new Response(body, init) })

test('POSTs the exact SHA with bearer auth and awaits a streamed terminal record', { timeout: 5000 }, async () => {
  const server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, 'POST')
      assert.equal(request.url, '/deploy')
      assert.equal(request.headers.authorization, `Bearer ${token}`)
      assert.equal(request.headers['content-type'], 'application/json')
      assert.equal(request.headers.accept, 'application/x-ndjson')
      let body = ''
      for await (const chunk of request) body += chunk
      assert.deepEqual(JSON.parse(body), { sha })
      response.writeHead(200, { 'content-type': 'application/x-ndjson' })
      response.write('\n{"status":"running"}\r\n')
      response.write(record('success').slice(0, 20))
      response.end(record('success').slice(20))
    } catch {
      response.writeHead(500)
      response.end()
    }
  })
  const listening = once(server, 'listening')
  server.listen(0, '127.0.0.1')
  await listening
  try {
    assert.deepEqual(await callOwner({ ...options, url: `http://127.0.0.1:${server.address().port}/deploy` }), { status: 'success', sha })
  } finally {
    const closed = once(server, 'close')
    server.close()
    server.closeAllConnections()
    await closed
  }
})

test('success ends the read and cancels an open stream without waiting for EOF', async () => {
  let cancelled = false
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(`${record('running')}\n${record('success')}\n`)) },
    cancel() { cancelled = true },
  })
  assert.deepEqual(await callOwner(withResponse(body)), { status: 'success', sha })
  assert.equal(cancelled, true)
})

for (const status of ['failed', 'rolled-back']) test(`rejects terminal ${status}`, async () => {
  await assert.rejects(callOwner(withResponse(record(status))), /E_DEPLOY_FAILED/)
})

for (const status of ['success', 'running', 'failed', 'rolled-back']) test(`rejects mismatched SHA in ${status}`, async () => {
  await assert.rejects(callOwner(withResponse(`${record(status, 'b'.repeat(40))}\n`)), /E_DEPLOY_SHA/)
})

for (const body of ['', '{"status":"running"}\n', '\n\r\n']) test(`rejects missing terminal: ${JSON.stringify(body)}`, async () => {
  await assert.rejects(callOwner(withResponse(body)), /E_DEPLOY_TERMINAL/)
})

for (const body of ['not-json', 'null', '[]', '{"status":"queued"}', '{"status":"success"}']) test(`rejects invalid terminal: ${body}`, async () => {
  await assert.rejects(callOwner(withResponse(body)), /E_DEPLOY_(JSON|STATUS|SHA)/)
})

test('rejects HTTP failure without leaking the response body', async () => {
  await assert.rejects(callOwner(withResponse(token, { status: 403 })), error => {
    assert.match(error.message, /E_DEPLOY_HTTP/)
    assert.ok(!error.message.includes(token))
    return true
  })
})

test('redacts upstream errors, even if they resemble internal errors', async () => {
  await assert.rejects(callOwner({ ...options, fetchImpl: async () => { throw new Error(`E_DEPLOY_${token}`) } }), /^Error: E_DEPLOY_REQUEST: owner request or response failed$/)
})

test('rejects oversized lines and oversized responses', async () => {
  await assert.rejects(callOwner(withResponse('x'.repeat(65537))), /E_DEPLOY_LIMIT/)
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(8 * 1024 * 1024 + 1)) } })
  await assert.rejects(callOwner(withResponse(body)), /E_DEPLOY_LIMIT/)
})

for (const key of ['url', 'token', 'sha']) test(`requires ${key} before sending a request`, async () => {
  await assert.rejects(callOwner({ ...options, [key]: '', fetchImpl: () => assert.fail('request must not be sent') }), /E_DEPLOY_ENV/)
})

for (const phase of ['headers', 'body']) test(`125-minute deadline aborts stalled ${phase}`, async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  let started
  const ready = new Promise(resolve => { started = resolve })
  let signal
  const fetchImpl = async (_url, init) => {
    signal = init.signal
    if (phase === 'headers') {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        started()
      })
    }
    return new Response(new ReadableStream({
      start(controller) { signal.addEventListener('abort', () => controller.error(signal.reason), { once: true }) },
      pull() { started() },
    }))
  }
  const result = callOwner({ ...options, fetchImpl })
  const rejected = assert.rejects(result, /E_DEPLOY_TIMEOUT/)
  await ready
  context.mock.timers.tick(125 * 60 * 1000 - 1)
  assert.equal(signal.aborted, false)
  context.mock.timers.tick(1)
  await rejected
  assert.equal(signal.aborted, true)
})
