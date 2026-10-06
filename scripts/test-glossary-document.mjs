import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'vitest'

import { glossaryDocument, glossarySections } from './glossary-document.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const entries = JSON.parse(readFileSync(resolve(wikiRoot, 'lore/glossary.json'), 'utf8'))
const render = (locale, value = entries) => renderLoreMarkdown(glossaryDocument(value), locale, (_domain, slug) => `${slug}.md`)
const entry = (overrides = {}) => ({
  term_id: 'fixture-01',
  display_name_ko: '시험어',
  reader_definition_ko: '시험용 정의.',
  display_name_en: 'Test term',
  reader_definition_en: 'A test definition.',
  aliases_en: [],
  category: 'event',
  owner_path: 'lore/chronology/Century-Annals.json',
  allowed_context: ['all'],
  aliases: [],
  status: 'generic-unregistered',
  ...overrides,
})

test('the Korean page renders the canonical terms, definitions, aliases and section order', () => {
  const markdown = render('ko')
  assert.match(markdown, /^<a id="glossary"><\/a>\n\n# 용어 사전\n/u)
  const headingAnchors = [...markdown.matchAll(/^<a id="([^"]+)"><\/a>$/gmu)].map((match) => match[1])
  assert.deepEqual(headingAnchors, ['glossary', ...glossarySections.map((_, index) => `glossary-s${index + 1}`)])
  const headings = [...markdown.matchAll(/^## (.+)$/gmu)].map((match) => match[1])
  assert.deepEqual(headings, glossarySections
    .filter((section) => entries.some(({ category }) => section.categories.includes(category)))
    .map(({ ko }) => ko))
  const actualEntries = [...markdown.matchAll(/^- \*\*(.+?)\*\*: (.+)$/gmu)].map((match) => [match[1], match[2]])
  assert.deepEqual(actualEntries, entries.map(({ display_name_ko, reader_definition_ko, aliases }) => [
    display_name_ko,
    `${reader_definition_ko}${aliases.length ? ` (별칭: ${aliases.join(', ')})` : ''}`,
  ]))
})

test('the English page renders every entry under the English section labels in the same order', () => {
  const english = render('en')
  assert.match(english, /^# Glossary\n/u)
  assert.deepEqual([...english.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), [
    'States (the sixteen)', 'Houses and organizations', 'People and posts', 'Technology and equipment',
    'Martial arts and tactics', 'Facilities and geography', 'Events and eras', 'Ailments',
  ])
  for (const { display_name_en: name, reader_definition_en: definition, aliases_en: aliases } of entries) {
    const suffix = aliases.length ? ` (also called: ${aliases.join(', ')})` : ''
    assert.ok(english.includes(`\n- **${name}**: ${definition}${suffix}\n`), name)
  }
  const martial = JSON.parse(readFileSync(resolve(wikiRoot, 'lore/culture/Martial-Paths.json'), 'utf8'))
  const ledger = JSON.parse(readFileSync(resolve(wikiRoot, 'lore/editorial/Naming-Ledger.json'), 'utf8'))
  const pair = martial.content.find(({ anchor }) => anchor === '아홉-유파-table1').rows.find((row) => row[2].ko === '저시궁')
  const aiming = entries.find(({ term_id }) => term_id === 'martial-aiming')
  assert.deepEqual([pair[2].ko, pair[3].ko, pair[4].ko, pair[5].ko], ledger.martialSchools.filter(({ formalName }) => [pair[2].ko, pair[4].ko].includes(formalName)).map(({ formalName, hanja }) => [formalName, hanja]).flat())
  assert.equal(aiming.display_name_en, pair[2].en)
  assert.ok(aiming.reader_definition_en.includes(pair[4].en))
  assert.doesNotMatch(english.replaceAll(pair[2].en, '').replaceAll(pair[4].en, ''), /[가-힣]/u)
})

test('the approved martial school has no field aliases in either locale', () => {
  const aiming = entries.find(({ term_id }) => term_id === 'martial-aiming')
  assert.ok(aiming)
  assert.deepEqual(aiming.aliases, [])
  assert.deepEqual(aiming.aliases_en, [])
})

test('the document is an in-memory root page with both locale titles', () => {
  const document = glossaryDocument(entries)
  assert.equal(document.id, 'DOC:Glossary')
  assert.equal(document.domain, 'root')
  assert.equal(document.slug, 'Glossary')
  assert.deepEqual(document.locales, { ko: { title: '용어 사전' }, en: { title: 'Glossary' } })
  assert.deepEqual(document.source.refs, ['lore/glossary.json'])
  assert.equal(glossarySections.length, 8)
})

test('section order is fixed; entries keep their dictionary order inside a section; empty sections are left out', () => {
  const korean = render('ko', [
    entry({ term_id: 'b', display_name_ko: '나중', category: 'ailment' }),
    entry({ term_id: 'c', display_name_ko: '둘째 사건' }),
    entry({ term_id: 'a', display_name_ko: '첫째 사건' }),
  ])
  assert.deepEqual([...korean.matchAll(/^(?:## (.+)|- \*\*(.+?)\*\*)/gmu)].map((match) => match[1] ?? match[2]), [
    '사건 및 연대', '둘째 사건', '첫째 사건', '질병', '나중',
  ])
})

test('several aliases are listed in one parenthesis', () => {
  const value = [entry({ aliases: ['갑', '을'], aliases_en: ['A', 'B'] })]
  assert.match(render('ko', value), /^- \*\*시험어\*\*: 시험용 정의\. \(별칭: 갑, 을\)$/mu)
  assert.match(render('en', value), /^- \*\*Test term\*\*: A test definition\. \(also called: A, B\)$/mu)
})

test('a malformed dictionary fails instead of publishing a partial page', () => {
  assert.throws(() => glossaryDocument({}), /E_GLOSSARY_SHAPE/u)
  assert.throws(() => glossaryDocument([entry({ category: 'weather' })]), /E_GLOSSARY_CATEGORY:fixture-01:weather/u)
  for (const field of ['display_name_ko', 'reader_definition_ko', 'display_name_en', 'reader_definition_en']) {
    assert.throws(() => glossaryDocument([entry({ [field]: '' })]), new RegExp(`E_GLOSSARY_FIELD:fixture-01:${field}`, 'u'))
  }
  for (const field of ['aliases', 'aliases_en']) {
    assert.throws(() => glossaryDocument([entry({ [field]: 'x' })]), new RegExp(`E_GLOSSARY_FIELD:fixture-01:${field}`, 'u'))
  }
  assert.throws(() => glossaryDocument([entry(), entry()]), /E_GLOSSARY_DUPLICATE:fixture-01/u)
})
