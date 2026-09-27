import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DocumentContent, fromWikiBlocks } from '@seoul-dengoku/document-renderer'
import { resolveWikiContentHref } from '../src/wikiRouting.ts'

const worldRoot = new URL('../src/generated/world/', import.meta.url)
const blocks = async (name) => JSON.parse(await readFile(new URL(name, worldRoot), 'utf8')).blocks
const render = (nodes) => renderToStaticMarkup(createElement(DocumentContent, {
  content: fromWikiBlocks(nodes), locale: 'ko', resolveHref: resolveWikiContentHref,
}))

test('every published WIKI document adapts without dropping an unsupported node', async () => {
  const names = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  assert.equal(names.length, 83)
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

test('renderer preserves article table semantics and WIKI page uses shared viewport', async () => {
  const html = render((await blocks('World-Unbinding.json')).filter((node) => node.type === 'table').slice(0, 1))
  assert.match(html, /<table><thead><tr><th scope="col">/)
  assert.match(html, /<tbody><tr><td>/)
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /fromWikiBlocks\(blocks\)/)
  assert.match(page, /<DocumentContent content=\{\[node\]\}/)
  assert.match(page, /<TableViewport key=\{index\} label="본문 표">/)
  assert.doesNotMatch(page, /WorldBlocks/)
})
