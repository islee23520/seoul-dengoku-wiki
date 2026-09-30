import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { clipSourceSegments } from '../src/feedbackSelection.ts'
import { fetchFeedbackDocument, validateFeedbackDocument } from '../src/feedbackViewApi.ts'

const literal = { kind: 'literal', path: '/text', start: 0, end: 1, unit: 'unicode-code-point', textStart: 0, textEnd: 1 }
const entity = { kind: 'entity', path: '/text', start: 1, end: 6, unit: 'unicode-code-point', textStart: 1, textEnd: 2, visibleText: 'A' }
const tail = { kind: 'literal', path: '/text', start: 6, end: 7, unit: 'unicode-code-point', textStart: 2, textEnd: 3 }
const view = { schemaVersion: 'feedback-selectable-view.v1', mappingVersion: 'selectable-text-catalog.v2', documentId: 'DOC:entity', route: '/world/Entity', locale: 'ko', sourceRevision: 'a'.repeat(64), revisionAlgorithm: 'sha256-canonical-json.v1', contentSource: { kind: 'canonical-envelope', documentId: 'DOC:entity' }, selector: 'p', viewRevision: 'b'.repeat(64), leaves: [{ leafId: 'entity:text', blockAnchor: 'entity', blockKind: 'paragraph', text: 'AAB', sourceSegments: [literal, entity, tail] }] }

test('entity overlap emits the complete token interval while literals clip linearly', () => {
  const leaf = view.leaves[0]
  assert.deepEqual(clipSourceSegments(leaf, 1, 2), [{ path: '/text', start: 1, end: 6, unit: 'unicode-code-point' }])
  assert.deepEqual(clipSourceSegments(leaf, 0, 3), [
    { path: '/text', start: 0, end: 1, unit: 'unicode-code-point' },
    { path: '/text', start: 1, end: 6, unit: 'unicode-code-point' },
    { path: '/text', start: 6, end: 7, unit: 'unicode-code-point' },
  ])
})

test('document view validation rejects wrong route, duplicate leaves and invalid entity width', () => {
  assert.equal(validateFeedbackDocument(view, '/world/Entity', 'ko').documentId, 'DOC:entity')
  assert.throws(() => validateFeedbackDocument(view, '/world/Other', 'ko'))
  assert.throws(() => validateFeedbackDocument({ ...view, leaves: [view.leaves[0], view.leaves[0]] }, '/world/Entity', 'ko'))
  assert.throws(() => validateFeedbackDocument({ ...view, leaves: [{ ...view.leaves[0], sourceSegments: [{ ...entity, visibleText: 'AB' }] }] }, '/world/Entity', 'ko'))
})

test('endpoint request uses exact router-relative route and reports excluded pages unavailable', async () => {
  const requests = []
  const ready = await fetchFeedbackDocument('/world/Entity', 'ko', { fetcher: async (url, init) => { requests.push({ url, init }); return new Response(JSON.stringify(view), { status: 200, headers: { 'content-type': 'application/json' } }) } })
  assert.equal(ready.status, 'ready')
  assert.equal(requests[0].url, '/api/feedback/selectable-view?route=%2Fworld%2FEntity&locale=ko')
  const unavailable = await fetchFeedbackDocument('/world/Glossary', 'ko', { fetcher: async () => new Response(JSON.stringify({ error: { code: 'selectable-view-excluded' } }), { status: 422, headers: { 'content-type': 'application/json' } }) })
  assert.deepEqual(unavailable, { status: 'unavailable', code: 'selectable-view-excluded' })
})

test('public generated article data and UI contain no historical projector authority', async () => {
  const generated = JSON.parse(await readFile(new URL('../src/generated/world/World-Unbinding.json', import.meta.url), 'utf8'))
  assert.equal('feedback' in generated, false)
  const selection = await readFile(new URL('../src/feedbackSelection.ts', import.meta.url), 'utf8')
  const person = await readFile(new URL('../src/pages/PersonDetailPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(selection, /personFeedbackDocument|markdownProjection|markdownLeaves/)
  assert.doesNotMatch(person, /personFeedbackDocument/)
})


test('document-view fetch forwards abort signal and cannot reuse another route response', async () => {
  const controller = new AbortController()
  let observed
  const pending = fetchFeedbackDocument('/world/Entity', 'ko', { signal: controller.signal, fetcher: async (_url, init) => { observed = init.signal; return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })) } })
  controller.abort()
  await assert.rejects(() => pending, (error) => error.name === 'AbortError')
  assert.equal(observed, controller.signal)
})
