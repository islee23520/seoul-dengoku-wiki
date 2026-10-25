import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { publicMapContent, mapProjection as projection } from './public-map-content.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { publicCatalogContent } from './generate-catalog.mjs'
import { localizedDocuments } from './localized-documents.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { articleFeedbackRecord } from './feedback-source-catalog.mjs'

const loadSource = async () => readCanonicalDocument('lore/places/World-Map-Construction.json')
const referenceTerms = /지역구|선거구|국회의원|행정동|constituenc|congressional|electoral|administrative-dong|KOSTAT|GeoJSON/iu

test('map publication projects both locale bodies, summaries and feedback without mutating authoring', async () => {
  const source = await loadSource()
  const before = structuredClone(source)
  const published = publicCatalogContent(source)
  assert.deepEqual(published, publicMapContent(source))
  const changedAnchors = new Set(projection.blocks.map(row => row.anchor))
  assert.deepEqual(published.content.filter(node => !changedAnchors.has(node.anchor)), source.content.filter(node => !changedAnchors.has(node.anchor)))
  assert.deepEqual({ ...published, content: source.content, locales: source.locales }, source)
  for (const row of projection.blocks) {
    const node = published.content.find(node => node.anchor === row.anchor)
    if (row.after === null) assert.equal(node, undefined)
    else assert.deepEqual(node.text, row.after)
  }
  const documents = localizedDocuments({ domain: 'world', slug: 'World-Map-Construction', json: published, renderJson: renderLoreMarkdown })
  assert.deepEqual(documents.map(document => document.locale), ['ko', 'en'])
  for (const document of documents) {
    assert.doesNotMatch(document.markdown, referenceTerms)
    assert.doesNotMatch(document.summary, referenceTerms)
    const blocks = fromMarkdown(document.markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
      .filter(node => node.type !== 'heading' || node.depth !== 1)
    const record = articleFeedbackRecord({ envelope: publicCatalogContent(source), route: document.route, locale: document.locale, blocks })
    assert.ok(record.leaves.length > 0)
    assert.doesNotMatch(record.leaves.map(leaf => leaf.text).join('\n'), referenceTerms)
  }
  assert.deepEqual(source, before)
})

test('map projection fails closed for changed, missing or duplicate anchor and summary inputs', async () => {
  const source = await loadSource()
  for (const row of projection.blocks) {
    for (const locale of Object.keys(row.before)) {
      const changed = structuredClone(source)
      changed.content.find(node => node.anchor === row.anchor).text[locale] += ' changed'
      assert.throws(() => publicMapContent(changed), /E_MAP_PUBLIC_PROJECTION/)
    }
    const missing = structuredClone(source)
    missing.content = missing.content.filter(node => node.anchor !== row.anchor)
    assert.throws(() => publicMapContent(missing), /E_MAP_PUBLIC_PROJECTION/)
    const duplicate = structuredClone(source)
    duplicate.content.push(structuredClone(duplicate.content.find(node => node.anchor === row.anchor)))
    assert.throws(() => publicMapContent(duplicate), /E_MAP_PUBLIC_PROJECTION/)
  }
  for (const row of projection.summaries) {
    const changed = structuredClone(source)
    changed.locales[row.locale].summary += ' changed'
    assert.throws(() => publicMapContent(changed), /E_MAP_PUBLIC_PROJECTION/)
  }
  const unrelated = { slug: 'unrelated' }
  assert.equal(publicMapContent(unrelated), unrelated)
})
