import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import { localizedDocuments, localizedRoute } from './localized-documents.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { pageFailures, privateLinkFailures } from './gate.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const source = JSON.parse(readFileSync(resolve(wikiRoot, 'lore/culture/Martial-Paths.json'), 'utf8'))
const renderJson = (value, locale) => renderLoreMarkdown(value, locale, (_domain, slug) => `${slug}.md`)
const titleFallback = (markdown, slug) => markdown.match(/^#\s+(.+)$/m)?.[1] ?? slug

test('one JSON source document produces an English route and keeps the Korean URL', () => {
  const [ko, en, ...rest] = localizedDocuments({ domain: 'world', slug: 'Martial-Paths', json: source, renderJson, titleFallback })
  assert.deepEqual(rest, [])
  assert.equal(ko.route, '/world/Martial-Paths')
  assert.equal(en.route, '/en/world/Martial-Paths')
  assert.equal(ko.title, source.locales.ko.title)
  assert.equal(en.title, source.locales.en.title)
  assert.equal(ko.markdown, renderJson(source, 'ko'))
  assert.equal(en.markdown, renderJson(source, 'en'))
  assert.match(en.markdown, new RegExp(`^# ${source.content[0].text.en}$`, 'm'))
  assert.equal(localizedRoute('ko', 'world', 'index'), '/world/')
})

test('an unmigrated Markdown corpus keeps its single Korean path', () => {
  const documents = localizedDocuments({ domain: 'world', slug: 'Glossary', markdown: '# 용어집\n\n본문\n', renderJson, titleFallback })
  assert.deepEqual(documents.map(({ locale, route, title }) => [locale, route, title]), [['ko', '/world/Glossary', '용어집']])
})

test('one corpus is never published from both Markdown and JSON', () => {
  assert.throws(() => localizedDocuments({ domain: 'world', slug: 'Martial-Paths', json: source, markdown: '# 무공\n', renderJson, titleFallback }), /E_DUAL_SOURCE:Martial-Paths/)
})

test('the generated contract carries both locale routes of the JSON document', () => {
  const contract = JSON.parse(readFileSync(resolve(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  assert.ok(contract.documents.some(({ route }) => route === '/world/Martial-Paths'))
  assert.ok(contract.englishDocuments.some(({ route }) => route === '/en/world/Martial-Paths'))
  assert.ok(!contract.englishDocuments.some(({ slug }) => slug === 'Glossary'))
  const english = JSON.parse(readFileSync(resolve(wikiRoot, 'src/generated/world-en/Martial-Paths.json'), 'utf8'))
  assert.equal(english.route, '/en/world/Martial-Paths')
})

const page = (url) => ({
  title: 'Martial Paths',
  reviewText: 'Body',
  blocks: [{ type: 'paragraph', children: [{ type: 'link', url, children: [{ type: 'text', value: 'link' }] }] }],
})
const routes = new Set(['/world/Martial-Paths', '/en/world/Martial-Paths'])

test('a private-document link fails the gate in every locale and link form', () => {
  for (const href of [
    '/en/world/Cast-Profile-Contract',
    '/world/Cast-Profile-Contract#section',
    'https://github.com/islee23520/seoul-kenshi/blob/main/lore/characters/Cast-Profile-Contract.md',
  ]) {
    const failures = pageFailures(page(href), 'src/generated/world-en/Martial-Paths.json', routes)
    assert.ok(failures.includes(`FAIL private-link: src/generated/world-en/Martial-Paths.json -> ${href}`), href)
  }
  assert.deepEqual(privateLinkFailures('/en/world/Martial-Paths', 'fixture'), [])
})

test('a published English route passes and a missing English route fails the gate', () => {
  assert.deepEqual(pageFailures(page('/en/world/Martial-Paths'), 'src/generated/world-en/Martial-Paths.json', routes), [])
  assert.deepEqual(pageFailures(page('/en/world/Missing'), 'src/generated/world-en/Martial-Paths.json', routes), [
    'FAIL broken-link: src/generated/world-en/Martial-Paths.json -> /en/world/Missing',
  ])
})
