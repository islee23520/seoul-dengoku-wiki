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

test('accepted submission keeps acknowledgement when local draft cleanup fails', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  localStorage.setItem(key, JSON.stringify(draft))
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => new Response(JSON.stringify(url.endsWith('/auth/session') ? { csrfToken: 'fixture-csrf' } : { id: 71, status: 'received' }), { headers: { 'content-type': 'application/json' } }))
  const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('cleanup-denied', 'SecurityError') })
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(FeedbackComposer, { rootRef: { current: null }, documentInfo, locale: 'ko' }))))
    await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    assert.equal(fetcher.mock.calls.length, 2)
    assert.equal(host.querySelector('form'), null)
    assert.ok(host.querySelector('.feedback-success'))
    assert.ok(host.querySelector('.feedback-storage-warning'))
    assert.equal(host.textContent.includes('cleanup-denied'), false)
  } finally { await act(async () => root.unmount()); fetcher.mockRestore(); remove.mockRestore(); localStorage.removeItem(key) }
})

test('failed local draft write preserves the editable body and selected quote', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  localStorage.setItem(key, JSON.stringify(draft))
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('write-denied', 'QuotaExceededError') })
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [route] }, createElement(FeedbackComposer, { rootRef: { current: null }, documentInfo, locale: 'ko' }))))
    assert.equal(host.querySelector('textarea').value, draft.body)
    assert.equal(host.querySelector('.feedback-preview').textContent, anchor.selections[0].exactQuote)
    assert.equal(host.querySelector('textarea').disabled, false)
    assert.ok(host.querySelector('.feedback-storage-warning'))
    assert.equal(host.textContent.includes('write-denied'), false)
  } finally { await act(async () => root.unmount()); write.mockRestore(); localStorage.removeItem(key) }
})

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
