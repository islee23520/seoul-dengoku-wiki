import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createFeedbackViewController } from '../src/feedbackViewController.ts'

const view = (route, locale, id) => ({ schemaVersion: 'feedback-selectable-view.v1', mappingVersion: 'selectable-text-catalog.v2', documentId: id, route, locale, sourceRevision: 'a'.repeat(64), revisionAlgorithm: 'sha256-canonical-json.v1', contentSource: { kind: 'canonical-envelope', documentId: id }, selector: 'p', viewRevision: 'b'.repeat(64), leaves: [{ leafId: `${id}:p`, blockAnchor: id, blockKind: 'paragraph', text: id, sourceSegments: [{ kind: 'literal', path: '/text', start: 0, end: id.length, unit: 'unicode-code-point', textStart: 0, textEnd: id.length }] }] })

test('route change clears authority, aborts old request and ignores its late release', async () => {
  const pending = new Map(), calls = []
  const fetcher = (url, init) => new Promise((resolve, reject) => {
    const route = new URL(`http://local${url}`).searchParams.get('route')
    calls.push({ route, signal: init.signal })
    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    pending.set(route, resolve)
  })
  const states = [], controller = createFeedbackViewController((state) => states.push(state), fetcher)
  const oldLoad = controller.load('/world/Old', 'ko')
  assert.equal(states.at(-1).status, 'loading')
  const newLoad = controller.load('/en/world/New', 'en')
  assert.equal(calls[0].signal.aborted, true)
  assert.equal(states.at(-1).status, 'loading')
  pending.get('/en/world/New')(new Response(JSON.stringify(view('/en/world/New', 'en', 'DOC:New')), { status: 200, headers: { 'content-type': 'application/json' } }))
  await newLoad
  assert.equal(states.at(-1).document.documentId, 'DOC:New')
  // The old request's abort rejection resolves its task without publishing authority.
  await oldLoad
  assert.equal(states.at(-1).document.documentId, 'DOC:New')
  assert.equal(states.some((state) => state.status === 'ready' && state.document.documentId === 'DOC:Old'), false)
})

test('dispose during a pending native abort rejects silently without reading cleared controller state', async () => {
  let rejectFetch, signal
  const fetcher = (_url, init) => new Promise((_resolve, reject) => { signal = init.signal; rejectFetch = reject })
  const states = [], controller = createFeedbackViewController((state) => states.push(state), fetcher)
  const load = controller.load('/world/Pending', 'ko')
  controller.dispose()
  assert.equal(signal.aborted, true)
  rejectFetch(new DOMException('Aborted', 'AbortError'))
  await load
  assert.deepEqual(states.map((state) => state.status), ['loading'])
})
