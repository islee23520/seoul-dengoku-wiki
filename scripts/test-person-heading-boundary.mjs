import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))

test('adjacent renamed heading keeps its world alias without changing either person biography', async () => {
  const document = await json('lore/characters/Cast-State-08.json')
  const previous = await json('public/person-details/person-0703.json')
  const renamed = await json('public/person-details/person-0719.json')
  const headings = document.content.flatMap((node, index) => node.kind === 'heading' && node.depth === 3 ? [{ node, index }] : [])
  const index = headings.findIndex(({ node }) => node.text.ko === `인물 ${renamed.name}`)
  assert.ok(index > 0)
  assert.equal(headings[index - 1].node.text.ko, `인물 ${previous.name}`)
  const alias = headings[index].node.anchor
  const naturalAnchor = `인물-${renamed.name}`
  assert.notEqual(alias, naturalAnchor)
  const world = renderLoreMarkdown(document, 'ko')
  assert.ok(world.includes(`<a id="${alias}"></a>\n\n### 인물 ${renamed.name}`))
  for (const [detail, headingIndex] of [[previous, index - 1], [renamed, index]]) {
    const start = headings[headingIndex].index + 1
    const end = headings[headingIndex + 1]?.index ?? document.content.length
    const expected = renderLoreMarkdown({ ...document, content: document.content.slice(start, end) }, 'ko').trim()
    assert.equal(detail.biography, expected, detail.id)
    const html = renderToStaticMarkup(createElement(MemoryRouter, {},
      createElement(PersonDetailContent, { detail, personId: detail.id })))
    assert.ok(html.includes(detail.name))
    assert.ok(html.includes('<details><summary>'))
    assert.ok(!html.includes(alias), detail.id + ' must not display the world heading alias')
  }
  assert.equal(renamed.sourceRoute, `/world/Cast-State-08#${naturalAnchor}`)
})
