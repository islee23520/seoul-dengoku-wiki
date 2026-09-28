import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { approvedDocuments } from './catalog-admission.mjs'
import { localizedDocuments, localizedRoute } from './localized-documents.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { pageFailures, privateLinkFailures } from './gate.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const source = JSON.parse(readFileSync(resolve(wikiRoot, 'lore/culture/Martial-Paths.json'), 'utf8'))
const renderJson = (value, locale) => renderLoreMarkdown(value, locale, (_domain, slug) => `${slug}.md`)
const titleFallback = (markdown, slug) => markdown.match(/^#\s+(.+)$/m)?.[1] ?? slug
const fixtureDocument = ({ id, slug, domain = 'root', categories, sourceKind = 'computed' }) => ({
  version: 1, domain, id, slug, status: 'approved', categories,
  tense: { en: 'present', ko: 'present' },
  locales: {
    en: { title: `${slug} EN`, summary: `${slug} summary`, tense: 'present' },
    ko: { title: `${slug} KO`, summary: `${slug} 요약`, tense: 'present' },
  },
  source: { kind: sourceKind, refs: ['lore/World-Narrative-Atlas.json'] },
  provenance: { original_anchor: 'lore/World-Narrative-Atlas.json', original_hash: null, history: [] },
  content: [{
    kind: 'heading', anchor: `${slug.toLowerCase()}-heading`, depth: 1,
    text: { en: `${slug} EN`, ko: `${slug} KO` },
  }],
  data: slug === 'World-Narrative-Atlas'
    ? { atlas: { schema: 'world-narrative-atlas.v2', document: { id: 'WNA-001' } } }
    : {},
})

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
  const documents = localizedDocuments({ domain: 'world', slug: 'Markdown-Corpus', markdown: '# 용어집\n\n본문\n', renderJson, titleFallback })
  assert.deepEqual(documents.map(({ locale, route, title }) => [locale, route, title]), [['ko', '/world/Markdown-Corpus', '용어집']])
})

test('one corpus is never published from both Markdown and JSON', () => {
  assert.throws(() => localizedDocuments({ domain: 'world', slug: 'Martial-Paths', json: source, markdown: '# 무공\n', renderJson, titleFallback }), /E_DUAL_SOURCE:Martial-Paths/)
})

test('an atlas JSON source and two JSON projections produce matching KO and EN route sets', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-t14-fixture-'))
  await mkdir(resolve(root, 'bestiary/groups'), { recursive: true })
  const fixtures = [
    fixtureDocument({ id: 'WNA-001', slug: 'World-Narrative-Atlas', categories: ['overview'], sourceKind: 'original-fiction' }),
    fixtureDocument({ id: 'DOC:Operating-Houses', slug: 'Operating-Houses', categories: ['factions'] }),
    fixtureDocument({ id: 'G01', slug: 'Hostile-Group-G01', domain: 'bestiary', categories: ['bestiary'] }),
  ]
  await writeFile(resolve(root, 'World-Narrative-Atlas.json'), JSON.stringify(fixtures[0]))
  await writeFile(resolve(root, 'Operating-Houses.json'), JSON.stringify(fixtures[1]))
  await writeFile(resolve(root, 'bestiary/groups/Hostile-Group-G01.json'), JSON.stringify(fixtures[2]))
  const admitted = await approvedDocuments(root, { checkAtlas: async () => {}, includeWorldIndex: false })
  const localized = []
  for (const { source: sourcePath, route } of admitted) {
    const value = JSON.parse(await readFile(resolve(wikiRoot, sourcePath.replace(/^lore\//, `${root}/`)), 'utf8'))
    localized.push(...localizedDocuments({ domain: 'world', slug: route.split('/').at(-1), json: value, renderJson, titleFallback }))
  }
  assert.deepEqual(localized.filter(({ locale }) => locale === 'ko').map(({ route }) => route).sort(), [
    '/world/Hostile-Group-G01', '/world/Operating-Houses', '/world/World-Narrative-Atlas',
  ])
  assert.deepEqual(localized.filter(({ locale }) => locale === 'en').map(({ route }) => route).sort(), [
    '/en/world/Hostile-Group-G01', '/en/world/Operating-Houses', '/en/world/World-Narrative-Atlas',
  ])
})

test('the generated contract carries both locale routes of the JSON document', () => {
  const contract = JSON.parse(readFileSync(resolve(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  assert.ok(contract.documents.some(({ route }) => route === '/world/Martial-Paths'))
  assert.ok(contract.englishDocuments.some(({ route }) => route === '/en/world/Martial-Paths'))
  // The Glossary page is generated from lore/glossary.json, so it publishes both locales too.
  assert.ok(contract.documents.some(({ route, title }) => route === '/world/Glossary' && title === '용어 사전'))
  assert.ok(contract.englishDocuments.some(({ route, title }) => route === '/en/world/Glossary' && title === 'Glossary'))
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
