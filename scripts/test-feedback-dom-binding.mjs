// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { test } from 'vitest'
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
