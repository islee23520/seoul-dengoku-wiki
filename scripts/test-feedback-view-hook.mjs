// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { test } from 'vitest'
import { useFeedbackDocument } from '../src/hooks/useFeedbackDocument.ts'

const view = (route, locale, id) => ({ schemaVersion: 'feedback-selectable-view.v1', mappingVersion: 'selectable-text-catalog.v2', documentId: id, route, locale, sourceRevision: 'a'.repeat(64), revisionAlgorithm: 'sha256-canonical-json.v1', contentSource: { kind: 'canonical-envelope', documentId: id }, selector: 'p', viewRevision: 'b'.repeat(64), leaves: [{ leafId: `${id}:p`, blockAnchor: id, blockKind: 'paragraph', text: id, sourceSegments: [{ kind: 'literal', path: '/text', start: 0, end: id.length, unit: 'unicode-code-point', textStart: 0, textEnd: id.length }] }] })
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }

function Probe({ route, locale }) {
  const state = useFeedbackDocument(route, locale)
  return createElement('output', { 'data-status': state.status, 'data-document': state.status === 'ready' ? state.document.documentId : '' })
}

test('mounted route and locale change clears authority and ignores an old response released last', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const oldResponse = deferred(), newResponse = deferred(), calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = (url, init) => {
    const params = new URL(`http://local${url}`).searchParams, route = params.get('route'), locale = params.get('locale')
    calls.push({ route, locale, signal: init.signal })
    return route === '/world/Old' ? oldResponse.promise : newResponse.promise
  }
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => { root.render(createElement(Probe, { route: '/world/Old', locale: 'ko' })) })
    assert.equal(host.querySelector('output').dataset.status, 'loading')
    await act(async () => { root.render(createElement(Probe, { route: '/en/world/New', locale: 'en' })) })
    assert.equal(calls[0].signal.aborted, true)
    assert.equal(host.querySelector('output').dataset.status, 'loading')
    await act(async () => { newResponse.resolve(new Response(JSON.stringify(view('/en/world/New', 'en', 'DOC:New')), { status: 200, headers: { 'content-type': 'application/json' } })); await newResponse.promise })
    assert.equal(host.querySelector('output').dataset.document, 'DOC:New')
    await act(async () => { oldResponse.resolve(new Response(JSON.stringify(view('/world/Old', 'ko', 'DOC:Old')), { status: 200, headers: { 'content-type': 'application/json' } })); await oldResponse.promise })
    assert.equal(host.querySelector('output').dataset.document, 'DOC:New')
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = originalFetch
  }
})
