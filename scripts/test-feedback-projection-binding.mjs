import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { articleFeedbackRecord, canonicalRevision, readerLeaves } from './feedback-source-catalog.mjs'
import { publicHouseContent } from './public-house-content.mjs'
import { publicOfficeContent } from './public-office-content.mjs'
import { publicMapContent } from './public-map-content.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { captureFeedbackAnchor, clipSourceSegments } from '../src/feedbackSelection.ts'
import { validateFeedbackDocument } from '../src/feedbackViewApi.ts'
import { loadSelectableViews, selectableView, validateAnchor } from '../../../seoul-dengoku-tools/TOOL/feedback-service/src/views.mjs'

const project = source => publicMapContent(publicOfficeContent(publicHouseContent(source)))
const at = (source, path) => path.split('/').slice(1).reduce((node, key) => node?.[key], source)
const points = text => Array.from(text)
const load = async path => readCanonicalDocument(`lore/${path}`)

function assertSourceBounds(record, source) {
  assert.equal(record.sourceRevision, canonicalRevision(source))
  for (const leaf of record.leaves) for (const segment of leaf.sourceSegments) {
    const original = at(source, segment.path)
    assert.equal(typeof original, 'string', segment.path)
    assert.ok(segment.start >= 0 && segment.end > segment.start && segment.end <= points(original).length, segment.path)
    const token = points(original).slice(segment.start, segment.end).join('')
    const visible = points(leaf.text).slice(segment.textStart, segment.textEnd).join('')
    if (segment.kind === 'literal') assert.equal(token, visible)
    else if (segment.kind === 'entity') {
      assert.equal(token, segment.sourceToken)
      assert.equal(visible, segment.visibleText)
    } else {
      assert.equal(segment.kind, 'approved-projection')
      assert.equal(leaf.sourceSegments.length, 1)
      assert.equal(token, leaf.projection.before.text)
      assert.equal(segment.path, leaf.projection.before.path)
      assert.equal(visible, leaf.text)
      assert.equal(segment.visibleText, leaf.text)
      const { hash, ...metadata } = leaf.projection
      assert.equal(hash, canonicalRevision(metadata))
    }
  }
}

test('house metadata deletion keeps published item identity but binds original item offsets', () => {
  const source = { id: 'DOC:minimal', slug: 'Operating-Houses', content: [
    { kind: 'heading', depth: 2, anchor: 'house', text: { ko: 'House' } },
    { kind: 'list', anchor: 'metadata', items: [{ ko: 'first' }, { ko: 'second' }, { ko: '출처층: original-fiction', en: 'Source layer: original-fiction' }, { ko: 'A longer retained description 🐉' }] },
  ] }
  const envelope = project(source)
  const record = articleFeedbackRecord({ envelope, sourceEnvelope: source, route: '/world/minimal', locale: 'ko' })
  const retained = record.leaves.find(leaf => leaf.leafId === 'metadata:item:2')
  assert.equal(retained.text, source.content[1].items[3].ko)
  assert.equal(retained.sourceSegments[0].path, '/content/1/items/3/ko')
  assertSourceBounds(record, source)
  assert.throws(() => articleFeedbackRecord({ envelope: { ...envelope, content: [] }, sourceEnvelope: source, locale: 'ko' }), /E_FEEDBACK_PROJECTION_MISMATCH/)
})

for (const path of ['Operating-Houses.json', 'offices/Offices-and-Ranks.json', 'places/World-Map-Construction.json']) {
  test(`actual ${path} projection preserves reader text and original source bounds in both locales`, async () => {
    const source = await load(path), envelope = project(source)
    for (const locale of ['ko', 'en']) {
      const markdown = renderLoreMarkdown(envelope, locale)
      const blocks = fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children.filter(node => node.type !== 'heading' || node.depth !== 1)
      const record = articleFeedbackRecord({ envelope, sourceEnvelope: source, route: '/world/projected', locale, blocks })
      assert.deepEqual(record.leaves.map(leaf => ({ kind: leaf.blockKind, text: leaf.text })), readerLeaves(blocks))
      assertSourceBounds(record, source)
      if (source.slug !== 'Operating-Houses') {
        assert.ok(record.leaves.some(leaf => leaf.projection))
        for (const leaf of record.leaves.filter(leaf => leaf.projection)) {
          const ruleFile = readCanonicalDocument(leaf.projection.file)
          const rule = at(ruleFile, leaf.projection.pointer)
          assert.equal(typeof rule.before === 'string' ? rule.before : rule.before[locale], leaf.projection.before.text)
          assert.equal(typeof rule.after === 'string' ? rule.after : rule.after[locale], leaf.projection.after.text)
          assert.equal(at(envelope, leaf.projection.after.path), leaf.projection.after.text)
          assert.equal(leaf.projection.revision, canonicalRevision(envelope))
        }
      }
      const drifted = structuredClone(envelope)
      drifted.content.find(block => block.kind === 'paragraph' && typeof block.text?.[locale] === 'string').text[locale] += ' drift'
      assert.throws(() => articleFeedbackRecord({ envelope: drifted, sourceEnvelope: source, locale }), /E_FEEDBACK_PROJECTION_MISMATCH/)
    }
    assert.notEqual(canonicalRevision(source), canonicalRevision(envelope))
  })
}

test('stale approved source and unapproved projected copies fail closed', async () => {
  const source = await load('places/World-Map-Construction.json'), envelope = project(source)
  const stale = structuredClone(source)
  const changed = envelope.content.find(block => source.content.find(original => original.anchor === block.anchor)?.text?.ko !== block.text?.ko)
  stale.content.find(block => block.anchor === changed.anchor).text.ko += ' stale'
  assert.throws(() => articleFeedbackRecord({ envelope, sourceEnvelope: stale, locale: 'ko' }), /E_MAP_PUBLIC_PROJECTION/)
  const arbitrary = { id: 'DOC:arbitrary', slug: 'arbitrary', content: [{ kind: 'paragraph', anchor: 'p', text: { ko: 'before' } }] }
  const forged = structuredClone(arbitrary); forged.content[0].text.ko = 'after'
  assert.throws(() => articleFeedbackRecord({ envelope: forged, sourceEnvelope: arbitrary, locale: 'ko' }), /E_FEEDBACK_PROJECTION_MISMATCH/)
  assert.deepEqual(articleFeedbackRecord({ envelope: arbitrary, locale: 'ko' }), articleFeedbackRecord({ envelope: arbitrary, sourceEnvelope: arbitrary, locale: 'ko' }))
})

test('actual projected catalogs load and full, partial and backward DOM selections validate atomically without private pins', async () => {
  const root = mkdtempSync(join(tmpdir(), 'feedback-projection-'))
  try {
    for (const path of ['offices/Offices-and-Ranks.json', 'places/World-Map-Construction.json']) {
      const source = await load(path), envelope = project(source)
      for (const locale of ['ko', 'en']) {
        const route = '/world/projected'
        const record = articleFeedbackRecord({ envelope, sourceEnvelope: source, route, locale })
        const privateCatalog = { schemaVersion: 'selectable-text-catalog.v2', documents: { [record.documentId]: { ...record, currentRevision: record.sourceRevision, revisions: { [record.sourceRevision]: { leaves: record.leaves } } } } }
        const file = join(root, 'catalog.json')
        writeFileSync(file, JSON.stringify(privateCatalog))
        const catalog = loadSelectableViews([file]), view = selectableView(catalog, locale, route).value
        validateFeedbackDocument(view, route, locale)
        for (const original of record.leaves.filter(leaf => leaf.projection)) {
          const leaf = view.leaves.find(leaf => leaf.leafId === original.leafId)
          assert.equal(leaf.projection, undefined)
          assert.deepEqual(Object.keys(leaf.sourceSegments[0]).sort(), ['kind', 'path', 'start', 'end', 'unit', 'textStart', 'textEnd', 'visibleText'].sort())
          for (const mutate of [leaf => leaf.sourceSegments[0].visibleText += 'x', leaf => leaf.sourceSegments[0].textEnd--, leaf => leaf.sourceSegments.push({ ...leaf.sourceSegments[0] })]) {
            const forged = structuredClone(view)
            mutate(forged.leaves.find(candidate => candidate.leafId === leaf.leafId))
            assert.throws(() => validateFeedbackDocument(forged, route, locale), /invalid selectable view/)
          }
          const span = { path: original.projection.before.path, start: 0, end: points(original.projection.before.text).length, unit: 'unicode-code-point' }
          const host = document.createElement('div'), element = document.createElement('p')
          element.dataset.feedbackLeaf = leaf.leafId; element.textContent = leaf.text; host.append(element)
          document.body.append(host)
          try {
            for (const [start, end] of [[0, points(leaf.text).length], [1, 3]]) {
              assert.deepEqual(clipSourceSegments(leaf, start, end), [span])
              for (const reverse of [false, true]) {
                const selection = window.getSelection(), a = points(leaf.text).slice(0, start).join('').length, b = points(leaf.text).slice(0, end).join('').length
                selection.setBaseAndExtent(element.firstChild, reverse ? b : a, element.firstChild, reverse ? a : b)
                const anchor = captureFeedbackAnchor(host, view, route, locale, selection)
                assert.ok(anchor)
                assert.deepEqual(anchor.selections[0].sourceSpans, [span])
                assert.deepEqual(validateAnchor(catalog, anchor), { ok: true })
                for (const mutate of [part => part.sourceSpans[0].end--, part => part.sourceSpans.push(span), part => part.sourceSpans[0].path = '/foreign', part => [part.range.start, part.range.end] = [part.range.end, part.range.start]]) {
                  const forged = structuredClone(anchor); mutate(forged.selections[0]); assert.equal(validateAnchor(catalog, forged).ok, false)
                }
              }
            }
          } finally { window.getSelection().removeAllRanges(); host.remove() }
          for (const mutate of [leaf => delete leaf.projection, leaf => leaf.projection.before.text += 'drift', leaf => leaf.projection.pointer += 'x', leaf => leaf.projection.revision = 'x', leaf => leaf.sourceSegments[0].visibleText += 'x', leaf => leaf.sourceSegments[0].end--, leaf => leaf.sourceSegments.push({ ...leaf.sourceSegments[0] })]) {
            const forged = structuredClone(privateCatalog), target = forged.documents[record.documentId].revisions[record.sourceRevision].leaves.find(leaf => leaf.leafId === original.leafId)
            mutate(target); writeFileSync(file, JSON.stringify(forged))
            assert.throws(() => loadSelectableViews([file]), /invalid selectable text catalog mapping/)
          }
        }
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
