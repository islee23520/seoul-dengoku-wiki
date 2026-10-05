// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PersonDetailContent, PersonSections } from '../src/pages/PersonDetailPage.tsx'
import { personFeedbackRecord } from './feedback-source-catalog.mjs'
import { bindFeedbackLeaves } from '../src/feedbackBinding.ts'
import { captureFeedbackAnchor } from '../src/feedbackSelection.ts'

const segment = (path) => [{ kind: 'literal', path, start: 0, end: 4, unit: 'unicode-code-point', textStart: 0, textEnd: 4 }]
const documentInfo = {
  schemaVersion: 'feedback-selectable-view.v1', mappingVersion: 'selectable-text-catalog.v2', documentId: 'DOC:duplicate', route: '/world/Duplicate', locale: 'ko', sourceRevision: 'a'.repeat(64), revisionAlgorithm: 'sha256-canonical-json.v1', selector: 'li, p', viewRevision: 'b'.repeat(64),
  leaves: [
    { leafId: 'item:0', blockAnchor: 'list', blockKind: 'list', text: 'same', sourceSegments: segment('/content/0/items/0/ko') },
    { leafId: 'item:1', blockAnchor: 'list', blockKind: 'list', text: 'same', sourceSegments: segment('/content/0/items/1/ko') },
  ],
}

test('every nonempty renderer-selected person section has ordered source-bound targets', async () => {
  const catalog = JSON.parse(await readFile('src/generated-private/feedback-selectable-views.ko.json', 'utf8'))
  for (const [id, record] of Object.entries(catalog.documents).filter(([id]) => id.startsWith('PERSON:'))) {
    const detail = JSON.parse(await readFile(`public/person-details/${id.slice(7)}.json`, 'utf8'))
    const root = document.createElement('div')
    root.innerHTML = renderToStaticMarkup(createElement(PersonSections, { sections: detail.sections, feedback: true }))
    const selected = [...root.querySelectorAll('[data-feedback-section]')].filter((section) =>
      [...section.querySelectorAll('p, li')].some((element) => element.textContent.trim()))
    const leaves = record.revisions[record.currentRevision].leaves.filter((leaf) => leaf.blockAnchor.startsWith('section:'))
    assert.deepEqual([...new Set(leaves.map((leaf) => leaf.blockAnchor))], selected.map((section) => `section:${section.dataset.feedbackSection}`), id)
    assert.ok(leaves.every((leaf) => leaf.sourceSegments.length > 0), id)
    const bindings = bindFeedbackLeaves(root, record.selector, leaves)
    assert.ok(bindings, id)
    assert.deepEqual(bindings.map(([element, leafId]) => [element.textContent, leafId]), leaves.map((leaf) => [leaf.text, leaf.leafId]), id)
  }
})

test.each([
  ['person-1003', 'K1003', 4, 46],
  ['person-1004', 'K1004', 7, 66],
])('full reader sections and biography bind distinct guard occurrences for %s', async (id, issuedId, blockIndex, sourceEnd) => {
  const envelope = JSON.parse(await readFile('lore/characters/Cast-Unaffiliated.json', 'utf8'))
  const detail = JSON.parse(await readFile(`public/person-details/${id}.json`, 'utf8'))
  assert.equal(detail.gurps.id, issuedId)
  const record = personFeedbackRecord({ envelope, personId: id, route: detail.detailRoute, headingText: `인물 ${detail.name}`, locale: 'ko', sections: detail.sections })
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: id, feedback: record })))
  const bindings = bindFeedbackLeaves(root, record.selector, record.leaves)
  assert.ok(bindings, id)
  assert.deepEqual(bindings.map(([element, leafId]) => [element.textContent, leafId]), record.leaves.map((leaf) => [leaf.text, leaf.leafId]))
  assert.equal(new Set(bindings.map(([, leafId]) => leafId)).size, record.leaves.length)
  const guard = record.leaves.find((leaf) => leaf.leafId === 'section:호위 대열:paragraph:0')
  const biography = record.leaves.find((leaf) => leaf.leafId === `biography:${envelope.content[blockIndex].anchor}:text`)
  assert.ok(guard && biography)
  assert.notEqual(guard.leafId, biography.leafId)
  const path = `/content/${blockIndex}/text/ko/1/text`
  assert.deepEqual(guard.sourceSegments, [{ kind: 'literal', path, start: 1, end: sourceEnd, unit: 'unicode-code-point', textStart: 0, textEnd: sourceEnd - 1 }])
  assert.ok(biography.sourceSegments.some((segment) => segment.path === path))
  for (const leaf of [guard, biography]) for (const segment of leaf.sourceSegments) {
    const source = segment.path.split('/').slice(1).reduce((value, part) => value[part.replaceAll('~1', '/').replaceAll('~0', '~')], envelope)
    assert.equal(segment.unit, 'unicode-code-point')
    assert.equal(Array.from(source).slice(segment.start, segment.end).join(''), Array.from(leaf.text).slice(segment.textStart, segment.textEnd).join(''))
  }
  bindings.forEach(([element, leafId]) => { element.dataset.feedbackLeaf = leafId })
  const guardElement = bindings.find(([, leafId]) => leafId === guard.leafId)[0]
  const range = document.createRange(); range.selectNodeContents(guardElement)
  const anchor = captureFeedbackAnchor(root, record, detail.detailRoute, 'ko', { rangeCount: 1, isCollapsed: false, getRangeAt: () => range })
  assert.equal(anchor.selections[0].leafId, guard.leafId)
  assert.deepEqual(anchor.selections[0].sourceSpans, [{ path, start: 1, end: sourceEnd, unit: 'unicode-code-point' }])
  assert.equal(bindFeedbackLeaves(root, record.selector, record.leaves.filter((leaf) => leaf !== guard)), null)
  const reversed = [...record.leaves]; [reversed[0], reversed[1]] = [reversed[1], reversed[0]]
  assert.equal(bindFeedbackLeaves(root, record.selector, reversed), null)
})

test('loose duplicate list items bind one canonical identity per visible occurrence', () => {
  const root = document.createElement('div')
  root.innerHTML = '<ul><li><p>same</p></li><li><p>same</p></li></ul>'
  const bindings = bindFeedbackLeaves(root, documentInfo.selector, documentInfo.leaves)
  assert.ok(bindings)
  assert.deepEqual(bindings.map(([element, id]) => [element.tagName, id]), [['LI', 'item:0'], ['LI', 'item:1']])
  bindings.forEach(([element, id]) => { element.dataset.feedbackLeaf = id })
  const second = root.querySelectorAll('li')[1]
  const range = document.createRange(); range.selectNodeContents(second)
  const selection = { rangeCount: 1, isCollapsed: false, getRangeAt: () => range }
  const anchor = captureFeedbackAnchor(root, documentInfo, '/world/Duplicate', 'ko', selection)
  assert.equal(anchor.selections[0].leafId, 'item:1')
  assert.equal(anchor.selections[0].sourceSpans[0].path, '/content/0/items/1/ko')
})

test('ambiguous extra identical occurrence fails closed with no bindings', () => {
  const root = document.createElement('div')
  root.innerHTML = '<p>same</p><p>same</p>'
  const one = { ...documentInfo, selector: 'p', leaves: documentInfo.leaves.slice(0, 1) }
  assert.equal(bindFeedbackLeaves(root, one.selector, one.leaves), null)
  assert.equal(root.querySelectorAll('[data-feedback-leaf]').length, 0)
})

test('empty anchor paragraphs and table cells do not shift selectable occurrence identities', () => {
  const root = document.createElement('div')
  root.innerHTML = '<p><span id="anchor"></span>\n<span id="alias"></span></p><p>same</p><table><tbody><tr><td></td><td>same</td></tr></tbody></table>'
  const bindings = bindFeedbackLeaves(root, 'p, td', documentInfo.leaves)
  assert.ok(bindings)
  assert.deepEqual(bindings.map(([element, id]) => [element.tagName, id]), [['P', 'item:0'], ['TD', 'item:1']])
  assert.equal(root.querySelector('#anchor').id, 'anchor')
  root.querySelector('td').textContent = 'unexpected'
  assert.equal(bindFeedbackLeaves(root, 'p, td', documentInfo.leaves), null)
  root.querySelector('td').textContent = ''
  root.querySelector('p:nth-of-type(2)').textContent = ' same'
  assert.equal(bindFeedbackLeaves(root, 'p, td', documentInfo.leaves), null)
})

test('actual person contributor list item keeps inline link text and canonical identity', () => {
  const root = document.createElement('div')
  root.innerHTML = '<details><ul><li>기여자: <a href="https://github.com/islee23520">islee23520</a></li></ul></details>'
  const person = { ...documentInfo, selector: 'li, p', leaves: [{ leafId: 'biography:인물-이일섭-list2:item:5', blockAnchor: 'biography', blockKind: 'person-biography-list-item', text: '기여자: islee23520', sourceSegments: [
    { kind: 'literal', path: '/content/709/items/5/ko', start: 0, end: 5, unit: 'unicode-code-point', textStart: 0, textEnd: 5 },
    { kind: 'literal', path: '/content/709/items/5/ko', start: 6, end: 16, unit: 'unicode-code-point', textStart: 5, textEnd: 15 },
  ] }] }
  const bindings = bindFeedbackLeaves(root, person.selector, person.leaves)
  assert.ok(bindings)
  assert.equal(bindings[0][0].tagName, 'LI')
  assert.equal(bindings[0][1], person.leaves[0].leafId)
  bindings[0][0].dataset.feedbackLeaf = bindings[0][1]
  const linkText = root.querySelector('a').firstChild
  const range = document.createRange(); range.selectNodeContents(linkText)
  const anchor = captureFeedbackAnchor(root, person, '/world/Duplicate', 'ko', { rangeCount: 1, isCollapsed: false, getRangeAt: () => range })
  assert.equal(anchor.selections[0].exactQuote, 'islee23520')
  assert.equal(anchor.selections[0].leafId, person.leaves[0].leafId)
  assert.equal(anchor.selections[0].sourceSpans[0].path, '/content/709/items/5/ko')
})
