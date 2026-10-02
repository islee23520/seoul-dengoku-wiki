// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { test, vi } from 'vitest'
import FeedbackComposer from '../src/components/FeedbackComposer.tsx'

const route = '/world/Local'
const key = `wiki-feedback-draft.v1:${route}`
const anchor = { schemaVersion: 'feedback-anchor.v1', documentId: 'DOC:Local', route, locale: 'ko', sourceRevision: 'a'.repeat(64), selections: [{ blockAnchor: 'p', blockKind: 'paragraph', leafId: 'p', exactQuote: '문장', prefix: '', suffix: '', range: { start: 0, end: 2, unit: 'unicode-code-point' }, sourceSpans: [{ path: '/text', start: 0, end: 2, unit: 'unicode-code-point' }] }] }
const documentInfo = { documentId: anchor.documentId, route, locale: 'ko', sourceRevision: anchor.sourceRevision }
const draft = { anchor, reason: '기타', body: '검토', alternative: '', idempotencyKey: 'local-fixture-key', reconfirmationRequired: false, editVersion: 0, authorityVersion: 'document-view.v1' }

test('unavailable browser storage does not crash the composer or expose private errors', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('private-storage-error') })
  const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('private-storage-error') })
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(FeedbackComposer, { rootRef: { current: null }, documentInfo, locale: 'ko' }))))
    assert.ok(host.querySelector('.feedback-composer button'))
    assert.equal(host.textContent.includes('private-storage-error'), false)
  } finally { await act(async () => root.unmount()); read.mockRestore(); remove.mockRestore() }
})

test('stored draft from another document revision requires reselection and sends no request', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  localStorage.setItem(key, JSON.stringify(draft))
  const fetcher = vi.spyOn(globalThis, 'fetch')
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(FeedbackComposer, { rootRef: { current: null }, documentInfo: { ...documentInfo, sourceRevision: 'b'.repeat(64) }, locale: 'ko' }))))
    assert.equal(host.querySelector('button[type=submit]').disabled, true)
    assert.equal(JSON.parse(localStorage.getItem(key)).reconfirmationRequired, true)
    assert.equal(fetcher.mock.calls.length, 0)
    assert.equal(host.querySelectorAll('mark, u').length, 0)
  } finally { await act(async () => root.unmount()); fetcher.mockRestore(); localStorage.removeItem(key) }
})
