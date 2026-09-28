import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { DocumentContent, fromWikiBlocks } from '@seoul-dengoku/document-renderer'
import { resolveWikiContentHref } from '../src/wikiRouting.ts'
import { renderLoreMarkdown } from './lore-json-render.mjs'

const worldRoot = new URL('../src/generated/world/', import.meta.url)
const blocks = async (name) => JSON.parse(await readFile(new URL(name, worldRoot), 'utf8')).blocks
const render = (nodes) => renderToStaticMarkup(createElement(DocumentContent, {
  content: fromWikiBlocks(nodes), locale: 'ko', resolveHref: resolveWikiContentHref,
}))

test('every published WIKI document adapts without dropping an unsupported node', async () => {
  const names = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  const published = JSON.parse(await readFile(new URL('../public/wiki-contract.json', import.meta.url), 'utf8'))
    .documents.map(({ slug }) => `${slug}.json`)
  assert.ok(published.length > 0)
  assert.deepEqual(names.sort(), published.sort())
  for (const name of names) assert.equal(fromWikiBlocks(await blocks(name)).length, (await blocks(name)).length, name)
})

test('rendered links keep WIKI routes, hub routes, and fragments', async () => {
  const html = render(await blocks('Ailments.json'))
  assert.match(html, /href="\/wiki\/world\/World-Unbinding"/)
  assert.equal(resolveWikiContentHref('/world/Other.md#section'), '/wiki/world/Other#section')
  assert.equal(resolveWikiContentHref('/gdd/rules/War'), '/gdd/rules/War')
  assert.equal(resolveWikiContentHref('#2126년'), '#2126년')
})

test('rendered heading and year anchors retain timeline destinations', async () => {
  const html = render(await blocks('Century-Annals.json'))
  assert.match(html, /<h3 id="2026년">2026년<\/h3>/)
  assert.equal((html.match(/id="2026년"/g) ?? []).length, 1)
  assert.match(render([
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 시작' }] },
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 반복' }] },
  ]), /^<p id="2126년">2126년 시작<\/p><p>2126년 반복<\/p>$/)
})

test('regional timeline links reach unique anchors in both rendered locales', async () => {
  const timeline = JSON.parse(await readFile(new URL('../public/timeline-overview.json', import.meta.url), 'utf8'))
  const routes = timeline.years.flatMap((entry) => entry.regionalEvents.map((event) => event.sourceRoute))
  assert.equal(routes.length, 16)
  for (const localeRoot of ['world', 'world-en']) {
    const page = JSON.parse(await readFile(new URL(`../src/generated/${localeRoot}/Century-Annals.json`, import.meta.url), 'utf8'))
    const html = render(page.blocks)
    for (const route of routes) {
      const anchor = decodeURIComponent(route.split('#')[1])
      assert.equal(html.split(`id="${anchor}"`).length - 1, 1, `${localeRoot}: ${route}`)
    }
  }
})

test('actual document renderer exposes aliases and natural headings in both locales', () => {
  const document = { domain: 'bestiary', content: [
    { kind: 'heading', depth: 2, anchor: 'entry', publicAnchors: ['g01e01', 'old-name'], text: { ko: '괴물 이름', en: 'Monster Name' } },
  ] }
  for (const [locale, natural] of [['ko', '괴물-이름'], ['en', 'monster-name']]) {
    const nodes = fromMarkdown(renderLoreMarkdown(document, locale)).children
    const html = renderToStaticMarkup(createElement(DocumentContent, { content: fromWikiBlocks(nodes), locale, resolveHref: resolveWikiContentHref }))
    for (const id of ['g01e01', 'old-name', natural]) assert.equal((html.match(new RegExp(`id="${id}"`, 'gu')) ?? []).length, 1, html)
    assert.doesNotMatch(html, /&lt;a id=/u)
    assert.doesNotMatch(html, /<a id="g01e01"><\/a><\/p>/u)
  }
})

test('renderer preserves article table semantics and WIKI page uses shared viewport', async () => {
  const html = render((await blocks('World-Unbinding.json')).filter((node) => node.type === 'table').slice(0, 1))
  assert.match(html, /<table><thead><tr><th scope="col">/)
  assert.match(html, /<tbody><tr><td>/)
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /fromWikiBlocks\(blocks\)/)
  assert.match(page, /<DocumentContent content=\{\[node\]\}/)
  assert.match(page, /<TableViewport key=\{index\} label=\{text\.table\}>/)
  assert.match(page, /table: '본문 표'/)
  assert.doesNotMatch(page, /WorldBlocks/)
})
