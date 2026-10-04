// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createElement as h, act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Link, useLocation } from 'react-router-dom'
import { test, vi } from 'vitest'
import FeedbackComposer from '../src/components/FeedbackComposer.tsx'
import { FeedbackSurface } from '../src/components/FeedbackSurface.tsx'

const revision = 'a'.repeat(64)
const texts = ['한글😀 구절. 다음 문장.\n줄바꿈 끝.', '동일한 문장.', '동일한 문장.', '표 설명 첫째.', '표 설명 둘째.']
const info = (route) => ({ schemaVersion: 'feedback-selectable-view.v1', mappingVersion: 'selectable-text-catalog.v2', documentId: route, route, locale: 'ko', sourceRevision: revision, revisionAlgorithm: 'sha256-canonical-json.v1', selector: 'p, td', viewRevision: revision, leaves: texts.map((text, i) => ({ leafId: `leaf:${i}`, blockAnchor: `block:${i}`, blockKind: i < 3 ? 'paragraph' : 'table-cell', text, sourceSegments: [{ kind: 'literal', path: `/content/${i}/text/ko`, start: 0, end: Array.from(text).length, unit: 'unicode-code-point', textStart: 0, textEnd: Array.from(text).length }] })) })
const draftKey = route => `wiki-feedback-draft.v1:${route}`
function Reader() {
  const { pathname } = useLocation(), rootRef = useRef(null)
  const view = info(pathname)
  return h('div', null,
    h(FeedbackSurface, { rootRef, documentInfo: view },
      h('p', null, texts[0]), h('p', null, texts[1]), h('p', null, texts[2]),
      h('table', null, h('tbody', null, h('tr', null, h('td', null, texts[3]), h('td', null, texts[4]))))),
    h(Link, { to: pathname === '/world/A' ? '/people/B' : '/world/A' }, '다른 문서'),
    h(FeedbackComposer, { rootRef, documentInfo: view, locale: 'ko' }))
}
async function mounted(run) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div'), root = createRoot(host)
  document.body.append(host)
  try {
    await act(async () => root.render(h(MemoryRouter, { initialEntries: ['/world/A'] }, h(Reader))))
    await run(host, root)
  } finally {
    await act(async () => root.unmount())
    host.remove(); window.getSelection().removeAllRanges()
    localStorage.removeItem(draftKey('/world/A')); localStorage.removeItem(draftKey('/people/B'))
    vi.restoreAllMocks()
  }
}
function select(host, first, start, last = first, end = texts[last].length) {
  const leaves = host.querySelectorAll('[data-feedback-leaf]')
  const range = document.createRange()
  range.setStart(leaves[first].firstChild, start); range.setEnd(leaves[last].firstChild, end)
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
}
const capture = host => host.querySelector('.feedback-heading button').click()
const submit = host => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
async function fill(host, text) {
  await act(async () => {
    const input = host.querySelector('textarea')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

test('Korean astral phrase, multiple sentences and authored line break retain exact offsets', async () => mounted(async host => {
  select(host, 0, 2, 0, texts[0].length - 1)
  const before = window.getSelection().toString()
  await act(async () => capture(host))
  const part = JSON.parse(localStorage.getItem(draftKey('/world/A'))).anchor.selections[0]
  assert.equal(part.exactQuote, '😀 구절. 다음 문장.\n줄바꿈 끝')
  assert.equal(part.range.start, 2)
  assert.equal(part.range.end, Array.from(texts[0]).length - 1)
  assert.deepEqual(part.sourceSpans, [{ path: '/content/0/text/ko', start: 2, end: Array.from(texts[0]).length - 1, unit: 'unicode-code-point' }])
  assert.equal(host.querySelector('.feedback-preview').textContent, part.exactQuote)
  assert.equal(window.getSelection().toString(), before)
}))

test('table range and repeated identical sentences bind their exact structural occurrence', async () => mounted(async host => {
  select(host, 3, 2, 4, 4)
  await act(async () => capture(host))
  let parts = JSON.parse(localStorage.getItem(draftKey('/world/A'))).anchor.selections
  assert.deepEqual(parts.map(p => [p.leafId, p.exactQuote, p.sourceSpans[0].path]), [['leaf:3', '설명 첫째.', '/content/3/text/ko'], ['leaf:4', '표 설명', '/content/4/text/ko']])
  select(host, 2, 0)
  await act(async () => capture(host))
  parts = JSON.parse(localStorage.getItem(draftKey('/world/A'))).anchor.selections
  assert.equal(parts[0].blockAnchor, 'block:2')
  assert.equal(parts[0].leafId, 'leaf:2')
  assert.equal(parts[0].sourceSpans[0].path, '/content/2/text/ko')
  assert.equal(host.querySelectorAll('mark, u').length, 0)
}))

test('normal Link navigation leaves independent drafts and anchors recoverable on return', async () => mounted(async host => {
  select(host, 1, 0); await act(async () => capture(host)); await fill(host, '기사 초안')
  const first = JSON.parse(localStorage.getItem(draftKey('/world/A')))
  await act(async () => host.querySelector('a').click())
  assert.equal(host.querySelector('form'), null)
  select(host, 2, 0); await act(async () => capture(host)); await fill(host, '인물 초안')
  const second = JSON.parse(localStorage.getItem(draftKey('/people/B')))
  await act(async () => host.querySelector('a').click())
  assert.equal(host.querySelector('textarea').value, first.body)
  assert.deepEqual(JSON.parse(localStorage.getItem(draftKey('/world/A'))).anchor, first.anchor)
  assert.deepEqual(JSON.parse(localStorage.getItem(draftKey('/people/B'))).anchor, second.anchor)
  assert.notEqual(first.anchor.route, second.anchor.route)
  assert.equal(host.querySelectorAll('mark, u').length, 0)
}))

test('held submission prevents duplicate POST and cancellation ignores late acceptance', async () => mounted(async host => {
  select(host, 1, 0); await act(async () => capture(host)); await fill(host, '제출할 초안')
  const started = Promise.withResolvers(), response = Promise.withResolvers()
  let posts = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    if (url.endsWith('/session')) return new Response(JSON.stringify({ csrfToken: 'csrf' }), { headers: { 'content-type': 'application/json' } })
    posts++; started.resolve(); return response.promise
  })
  await act(async () => { submit(host); submit(host); await started.promise })
  assert.equal(posts, 1)
  assert.equal(host.querySelector('textarea').disabled, true)
  assert.equal(host.querySelector('.feedback-heading button').disabled, true)
  await act(async () => host.querySelector('button[type=button]:not([disabled])').click())
  assert.equal(host.querySelector('form'), null)
  select(host, 2, 0); await act(async () => capture(host)); await fill(host, '취소 후 새 초안')
  await act(async () => response.resolve(new Response(JSON.stringify({ id: 11, status: 'received' }), { headers: { 'content-type': 'application/json' } })))
  assert.equal(host.querySelector('textarea').value, '취소 후 새 초안')
  assert.equal(JSON.parse(localStorage.getItem(draftKey('/world/A'))).anchor.selections[0].leafId, 'leaf:2')
  assert.equal(host.querySelector('.feedback-success'), null)
}))
