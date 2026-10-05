import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { toString } from 'mdast-util-to-string'
import { gfm } from 'micromark-extension-gfm'

import { renderLoreMarkdown } from './lore-json-render.mjs'

const loreRoot = resolve(import.meta.dirname, '../lore')
const parse = (markdown) => fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })

function loreDocuments(dir = loreRoot) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue // tool scratch such as the link checker's fixtures, never a document
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
// The reader's heading ID (src/wikiDocument.ts).
const headingId = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
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

test('published hangnyeol counts match the clan register and issued cast', () => {
  const clan = JSON.parse(readFileSync(join(loreRoot, 'name-pools/cast-hangnyeol.json'), 'utf8'))
  const cast = JSON.parse(readFileSync(join(loreRoot, 'name-pools/values-cast.json'), 'utf8'))
  const page = JSON.parse(readFileSync(join(loreRoot, 'characters/Hangnyeol-and-Bon-gwan.json'), 'utf8'))
  const names = new Set(cast.people.map((person) => person.name))
  const assigned = new Set(clan.people.map((person) => person.name))
  assert.equal(names.size, cast.people.length)
  assert.equal(assigned.size, clan.people.length)
  for (const name of assigned) assert.ok(names.has(name), name)
  const statuses = ['applied', 'inferred', 'free', 'unused', 'no-bongwan']
  const table = page.content.find((block) => block.anchor === '캐스트-적용-결과-table3')
  assert.deepEqual(table.rows.map((row) => row[1].ko), statuses.map((status) => String(clan.people.filter((person) => person.status === status).length)))
  const summary = page.content.find((block) => block.anchor === '캐스트-적용-결과-p1').text
  assert.ok(summary.ko.includes(`${clan.people.length.toLocaleString('en-US')}명`))
  assert.ok(summary.ko.includes(`${cast.people.length.toLocaleString('en-US')}명`))
  assert.ok(summary.en.includes(clan.people.length.toLocaleString('en-US')))
  assert.ok(summary.en.includes(cast.people.length.toLocaleString('en-US')))
})

test('state-name years agree across the Korean and English table cells', () => {
  const page = JSON.parse(readFileSync(join(loreRoot, 'factions/Sixteen-States.json'), 'utf8'))
  const table = page.content.find((block) => block.kind === 'table' && block.columns[0].ko === 'ID')
  assert.ok(table)
  assert.equal(table.rows.length, 16)
  for (const row of table.rows) {
    const years = (text) => [...text.matchAll(/(?<!\d)(?:20|21)\d{2}(?!\d)/gu)].map((match) => match[0])
    assert.deepEqual(years(row[5].en), years(row[5].ko), row[0].ko)
  }
})

test('every authored lore document gives each content block a unique anchor', () => {
  for (const { path, document } of documents) {
    const anchors = document.content.map((block) => block.anchor)
    assert.equal(new Set(anchors).size, anchors.length, path)
  }
})

for (const { path, document } of documents) {
  for (const locale of ['ko', 'en']) {
    test(`${document.id} renders to Markdown that keeps every block (${locale})`, () => {
      const tree = parse(renderLoreMarkdown(document, locale))
      // A heading's legacy event anchor and public aliases that its locale's heading IDs do not already
      // provide are published once, as an anchor-only paragraph directly before that heading.
      const published = new Set(document.content.filter((node) => node.kind === 'heading').map((node) => headingId(leafText(node.text[locale]))))
      for (const node of document.content.filter((node) => node.kind === 'paragraph')) {
        for (const match of leafText(node.text[locale]).matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) published.add(match[1])
      }
      const aliasesOf = (node) => {
        if (node.kind !== 'heading' && !(node.publicAnchors?.length || node.kind === 'paragraph' && document.domain === 'technology' && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(node.anchor))) return []
        return [node.anchor, ...(node.publicAnchors ?? [])].filter((alias) => !published.has(alias) && published.add(alias))
      }
      let cursor = 0
      document.content.forEach((node) => {
        const where = `${path} ${node.anchor}`
        const aliases = aliasesOf(node)
        if (aliases.length) {
          const block = tree.children[cursor++]
          assert.equal(block?.type, 'paragraph', where)
          assert.ok(block.children.every((child) => child.type === 'html' || (child.type === 'text' && !child.value.trim())), where)
          assert.deepEqual(block.children.map((child) => child.value.match(/^<a id="([^"]+)">$/u)?.[1]).filter(Boolean), aliases, where)
        }
        assertBlock(node, tree.children[cursor++], locale, where)
      })
      assert.equal(tree.children.length, cursor, path)
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

test('renamed headings expose their safe canonical and old public fragments once', () => {
  const document = { domain: 'technology', content: [{ kind: 'heading', depth: 2, anchor: 'original-heading', publicAnchors: ['original-heading', 'previous-title'], text: { ko: '새 제목', en: 'New title' } }] }
  for (const locale of ['ko', 'en']) {
    const markdown = renderLoreMarkdown(document, locale)
    assert.equal((markdown.match(/id="original-heading"/g) ?? []).length, 1)
    assert.equal((markdown.match(/id="previous-title"/g) ?? []).length, 1)
  }
  document.content[0].anchor = 'unsafe" onclick="x'
  assert.throws(() => renderLoreMarkdown(document, 'ko'), /unsafe public anchor/)
})

test('publication removes only the h1 title after leading canonical aliases', () => {
  const source = renderLoreMarkdown({ domain: 'technology', content: [
    { kind: 'heading', depth: 1, anchor: 'canonical-title', text: { ko: '새 표제' } },
    { kind: 'paragraph', anchor: 'body', text: { ko: '본문' } },
    { kind: 'heading', depth: 2, anchor: 'section', text: { ko: '절 제목' } },
  ] }, 'ko')
  const published = source.replace(/^#\s+.+\n+/m, '')
  assert.ok(published.includes('<a id="canonical-title"></a>'))
  assert.ok(!published.includes('# 새 표제'))
  assert.ok(published.includes('## 절 제목'))
  assert.deepEqual(parse(published).children.filter((block) => block.type === 'heading' || block.type === 'paragraph' && block.children.some((child) => child.type === 'text')).map(toString), ['본문', '절 제목'])
})

test('technology narrative retains a former heading canonical fragment without visible markup text', () => {
  const source = { domain: 'technology', content: [{ kind: 'paragraph', anchor: 'original-section', text: { ko: '기체가 명령을 반복한다.', en: 'The chassis repeats its order.' } }] }
  for (const locale of ['ko', 'en']) {
    const markdown = renderLoreMarkdown(source, locale)
    const blocks = parse(markdown).children
    assert.equal(blocks[0].children[0].value, '<a id="original-section">')
    assert.equal(toString(blocks[1]), source.content[0].text[locale])
  }
})

test('paragraph public aliases retain semantic pointers once in both locales', () => {
  const source = { domain: 'factions', content: [{ kind: 'paragraph', anchor: 'election-p1', publicAnchors: ['election-p1', 'election-p2'], text: { ko: '선출과 열쇠', en: 'Election and keys' } }] }
  for (const locale of ['ko', 'en']) {
    const markdown = renderLoreMarkdown(source, locale)
    assert.equal((markdown.match(/id="election-p1"/g) ?? []).length, 1)
    assert.equal((markdown.match(/id="election-p2"/g) ?? []).length, 1)
    assert.equal(toString(parse(markdown).children[1]), source.content[0].text[locale])
  }
})

test('merged bibliography lists expose explicitly authored old public anchors', () => {
  const source = { domain: 'technology', content: [{ kind: 'list', anchor: '연결-list1', publicAnchors: ['출처-list1'], items: [{ ko: '관련 자료', en: 'Related source' }] }] }
  for (const locale of ['ko', 'en']) {
    const markdown = renderLoreMarkdown(source, locale)
    assert.equal((markdown.match(/id="출처-list1"/g) ?? []).length, 1)
    assert.equal(parse(markdown).children[1].type, 'list')
    assert.equal(toString(parse(markdown).children[1]), source.content[0].items[0][locale])
  }
})

test('an authored compatibility anchor remains separate from a renamed visible heading', () => {
  const document = {
    domain: 'culture',
    content: [
      { kind: 'paragraph', anchor: 'legacy-link', text: { ko: '<a id="강단발"></a>' } },
      { kind: 'heading', depth: 2, anchor: '강단발', text: { ko: '강단호명법' } },
    ],
  }
  const tree = parse(renderLoreMarkdown(document, 'ko'))
  assert.equal(tree.children.length, 2)
  assert.equal(tree.children[0].children[0].value, '<a id="강단발">')
  assert.ok(tree.children[0].children.every((node) => node.type === 'html'))
  assert.equal(toString(tree.children[1]), '강단호명법')
})

test('public aliases render once in both locales without changing ordinary headings', () => {
  const document = { domain: 'bestiary', content: [
    { kind: 'heading', depth: 2, anchor: 'entry', publicAnchors: ['g01e01', '옛-이름'], text: { ko: '새 이름', en: 'New Name' } },
    { kind: 'heading', depth: 2, anchor: 'next', publicAnchors: ['g01e01'], text: { ko: '다음', en: 'Next' } },
  ] }
  for (const locale of ['ko', 'en']) {
    assert.throws(() => renderLoreMarkdown(document, locale), /duplicate public anchor g01e01/)
    document.content[1].publicAnchors = ['다음']
    const markdown = renderLoreMarkdown(document, locale)
    assert.equal((markdown.match(/<a id="g01e01"><\/a>/gu) ?? []).length, 1)
    assert.equal((markdown.match(/<a id="옛-이름"><\/a>/gu) ?? []).length, 1)
    assert.equal((markdown.match(/<a id="다음"><\/a>/gu) ?? []).length, locale === 'ko' ? 0 : 1)
    document.content[1].publicAnchors = ['g01e01']
  }
  const legacy = { domain: 'bestiary', content: [{ kind: 'heading', depth: 2, anchor: 'entry', text: { ko: '새 이름' } }] }
  assert.equal(renderLoreMarkdown(legacy, 'ko'), '<a id="entry"></a>\n\n## 새 이름\n')
  document.content[1].publicAnchors = ['bad" onclick="x']
  assert.throws(() => renderLoreMarkdown(document, 'ko'), /unsafe public anchor/)
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
