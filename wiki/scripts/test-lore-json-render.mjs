import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { toString } from 'mdast-util-to-string'
import { gfm } from 'micromark-extension-gfm'

import { renderLoreMarkdown } from './lore-json-render.mjs'

const loreRoot = resolve(import.meta.dirname, '../../lore')
const parse = (markdown) => fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })

function loreDocuments(dir = loreRoot) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...loreDocuments(path))
    else if (name.endsWith('.json') && !name.startsWith('authoring.')) {
      const document = JSON.parse(readFileSync(path, 'utf8'))
      if (document && typeof document === 'object' && Array.isArray(document.content) && document.domain) out.push({ path, document })
    }
  }
  return out
}

// The visible text a reader sees for one JSON leaf: its runs' text, parsed as inline Markdown.
const leafText = (leaf) => (typeof leaf === 'string' ? leaf : leaf.map((run) => run.text).join(''))
// Prefix every line so a leaf such as '#' or '1.' is read as inline text, as it is inside its block.
const visible = (leaf) => toString(parse(leafText(leaf).replace(/^/gm, 'a'))).replace(/^a/gm, '')
const links = (node) => {
  const found = []
  const walk = (n) => { if (n.type === 'link') found.push(n.url); (n.children ?? []).forEach(walk) }
  walk(node)
  return found
}
const leafLinkCount = (leaf) => (typeof leaf === 'string' ? 0 : leaf.filter((run) => run.link || run.href).length)

function assertBlock(node, block, locale, where) {
  switch (node.kind) {
    case 'heading':
      assert.equal(block.type, 'heading', where); assert.equal(block.depth, node.depth, where)
      assert.equal(toString(block), visible(node.text[locale]), where); assert.equal(links(block).length, leafLinkCount(node.text[locale]), where)
      break
    case 'paragraph':
      assert.equal(block.type, 'paragraph', where)
      assert.equal(toString(block), visible(node.text[locale]), where); assert.equal(links(block).length, leafLinkCount(node.text[locale]), where)
      break
    case 'quote':
      assert.equal(block.type, 'blockquote', where); assert.equal(block.children.length, 1, where)
      assert.equal(toString(block), visible(node.text[locale]), where)
      break
    case 'rule':
      assert.equal(block.type, 'thematicBreak', where)
      break
    case 'list':
      assert.equal(block.type, 'list', where); assert.equal(block.ordered, node.ordered === true, where)
      if (node.ordered) assert.equal(block.start, node.start ?? 1, where)
      assert.equal(block.children.length, node.items.length, where)
      block.children.forEach((item, i) => assert.equal(toString(item), visible(node.items[i][locale]), `${where} item ${i}`))
      break
    case 'table': {
      assert.equal(block.type, 'table', where)
      const [header, ...rows] = block.children
      assert.deepEqual(header.children.map((cell) => toString(cell)), node.columns.map((cell) => visible(cell[locale])), where)
      assert.equal(rows.length, node.rows.length, where)
      rows.forEach((row, r) => assert.deepEqual(row.children.map((cell) => toString(cell)), node.rows[r].map((cell) => visible(cell[locale])), `${where} row ${r}`))
      break
    }
    case 'code':
      assert.equal(block.type, 'code', where); assert.equal(block.lang, node.language, where)
      assert.equal(block.meta ?? undefined, node.info, where); assert.equal(block.value, node.text[locale], where)
      break
    default:
      assert.fail(`${where}: unexpected kind ${node.kind}`)
  }
}

const documents = loreDocuments()

test('the corpus has lore JSON documents to render', () => {
  assert.ok(documents.length > 0)
})

for (const { path, document } of documents) {
  for (const locale of ['ko', 'en']) {
    test(`${document.id} renders to Markdown that keeps every block (${locale})`, () => {
      const tree = parse(renderLoreMarkdown(document, locale))
      const eventAnchors = document.content.filter((node) => node.kind === 'heading' && /-xt0[1-5]-/u.test(node.anchor ?? '')).map((node) => node.anchor)
      const publishedAnchors = tree.children.filter((block) => block.type === 'paragraph' && block.children.length === 2 && block.children[0].type === 'html' && block.children[1].type === 'html' && /^<a id="[^"]+">$/u.test(block.children[0].value ?? ''))
      assert.deepEqual(publishedAnchors.map((block) => block.children[0].value.match(/^<a id="([^"]+)">$/u)[1]), eventAnchors, path)
      const contentBlocks = tree.children.filter((block) => !publishedAnchors.includes(block))
      assert.equal(contentBlocks.length, document.content.length, path)
      document.content.forEach((node, i) => assertBlock(node, contentBlocks[i], locale, `${path} ${node.anchor}`))
    })
  }
}

test('lore links render as paths relative to the page and keep their anchor', () => {
  const document = {
    domain: 'culture',
    content: [{ kind: 'paragraph', anchor: 'p1', text: { en: [{ text: 'a', link: { domain: 'overview', slug: 'World-Unbinding', anchor: 'x' } }, { text: ' b', link: { domain: 'gdd', slug: 'rules/Warfare-and-Sieges' } }], ko: 'k' } }],
  }
  assert.equal(renderLoreMarkdown(document, 'en'), '[a](../overview/World-Unbinding.md#x)[ b](/gdd/rules/Warfare-and-Sieges)\n')
})

test('unmounted GDD proposals resolve to their JSON canon', () => {
  const document = {
    domain: 'chronology',
    content: [{ kind: 'paragraph', anchor: 'p1', text: { en: [{ text: 'proposal', link: { domain: 'gdd', slug: 'proposals/Narrative-Direction' } }], ko: '제안' } }],
  }
  assert.equal(renderLoreMarkdown(document, 'en'), '[proposal](https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/locales/ko-KR/proposals/narrative-direction.json)\n')
})

test('hub links such as /gdd/ are not placed under the wiki base', async () => {
  const { toWikiPath } = await import('../src/wikiRouting.ts')
  assert.equal(toWikiPath('/gdd/rules/Rules-FactionsWarfare'), '/gdd/rules/Rules-FactionsWarfare')
  assert.equal(toWikiPath('/play/'), '/play/')
  assert.equal(toWikiPath('/world/Sixteen-States'), '/wiki/world/Sixteen-States')
})
