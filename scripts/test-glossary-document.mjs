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

// Reader-facing snapshot of the canonical Korean glossary, including its section order and spacing.
const koreanPage = `# 용어 사전

## 국가 (16개국)

- **수문국**: 양평역을 수도로 삼고 서부 급수를 맡는 강국.
- **대한민국정부**: 광화문을 중심으로 종로·중구의 명부와 배급, 도장·인지세, 청사 경비대를 직접 관리하는 십육국 제일의 강국. (별칭: 정부)
- **정동노총**: 시청역 앞 파업 명부를 지키는 소국.

## 가문 및 조직

- **영등포수문가**: 영등포 일대의 지하 수로와 제어 밸브를 장악한 기술자 가문. (별칭: 수문가)
- **여의도전산가**: 구 여의도의 금융 전산망과 데이터 센터를 통제하는 기업 가문. (별칭: 전산가)

## 인물 및 직책

- **렌즈 착용자**: 항상 렌즈를 착용하고 기계와 동기화된 채 살아가는 자.

## 기술 및 장비

- **피지컬 에이아이**: 물리적 신체를 가지고 전술 작전을 수행하는 기계 지능. (별칭: PAI)
- **렌즈**: 착용자의 시야에 전장 정보와 기계 상태를 겹쳐 보여주는 증강 장비. (별칭: 전술렌즈)

## 무공 및 전술

- **감응조준법**: 피지컬 에이아이 렌즈의 센서 정보와 자신의 시각을 동기화하여 사격하는 사격술. (별칭: 감응조준)
- **수문호흡법**: 유독 가스가 섞인 하층 공기에서 효율적으로 산소를 확보하는 호흡 기술.

## 시설 및 지리

- **심층 터널**: 환승 통로 밑바닥에 위치한 가장 깊은 구역으로, 빛이 들지 않고 환기가 되지 않는다. (별칭: 심층)

## 사건 및 연대

- **대정전**: 2026년 10월 14일 21:47경 호출망과 원격 제어가 끊기고 전력 공급이 무너진 사건. 일부 시설은 사람의 수동 운전으로 버텼다.
- **2126년**: 서울 열여섯 나라의 개막 시점. (별칭: 현재)

## 질병

- **포자감염**: 저온 환경의 지하 균류 포자가 폐에 자리 잡아 호흡기를 굳게 만드는 치명적 증상. (별칭: 포자병)
`

test('the Korean page renders the canonical terms, definitions, aliases and section order', () => {
  assert.equal(render('ko'), koreanPage)
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
  assert.doesNotMatch(english, /[가-힣]/u)
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
