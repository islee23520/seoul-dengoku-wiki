import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GurpsSheet, parseGurpsSheet } from '../src/pages/PersonDetailPage.tsx'
import { build } from './gurps-cast.mjs'

const issued = JSON.parse(readFileSync(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), 'utf8')).people
const produced = build().doc.people
const issuedBy = (id) => issued.find((entry) => entry.id === id)
const routeId = (entry) => entry.url.split('/').pop()
const markup = (sheet) => renderToStaticMarkup(React.createElement(GurpsSheet, { gurps: sheet }))
const parseOrThrow = (payload, id) => {
  const result = parseGurpsSheet(payload, id)
  assert.ok(result.ok, `${id}: ${JSON.stringify(result)}`)
  return result.sheet
}

const assertRenderedSecondary = (html, secondary) => {
  for (const [label, key] of [['HP 체력', 'HP'], ['FP 피로', 'FP'], ['Will 의지', 'Will'], ['Per 지각', 'Per'], ['Speed', 'BasicSpeed'], ['Dodge 회피', 'Dodge']]) {
    assert.ok(html.includes(`<span>${label}</span><span>${secondary[key]}</span>`))
  }
}

test('발급된 Speed·Dodge·특성·미사용 CP를 값 그대로 그린다', () => {
  for (const id of ['K1003', 'K1009']) {
    const record = issuedBy(id)
    const sheet = parseOrThrow(record, routeId(record))
    assert.deepEqual(sheet.secondary, Object.fromEntries(['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'Dodge']
      .filter((key) => typeof record.secondary[key] === 'number').map((key) => [key, record.secondary[key]])))
    const html = markup(sheet)
    assertRenderedSecondary(html, record.secondary)
  }
  const jo = markup(parseOrThrow(issuedBy('K1003'), 'person-1003'))
  const baselineRecord = produced.find((entry) => entry.baseline)
  const baseline = markup(parseOrThrow(baselineRecord, routeId(baselineRecord)))
  assert.match(jo, /Combat Reflexes/u)
  assert.match(baseline, /<span>미사용<\/span><span>75 CP<\/span>/u)
})

test('Speed와 Dodge는 능력치 공식 대신 발급된 값을 보존한다', () => {
  const record = { ...issuedBy('K1003'), secondary: { ...issuedBy('K1003').secondary, BasicSpeed: 4.25, Dodge: 8 } }
  const sheet = parseOrThrow(record, routeId(record))
  assert.equal(sheet.secondary.BasicSpeed, 4.25)
  assert.equal(sheet.secondary.Dodge, 8)
  const html = markup(sheet)
  assert.match(html, /<span>Speed<\/span><span>4\.25<\/span>/u)
  assert.match(html, /<span>Dodge 회피<\/span><span>8<\/span>/u)
  assertRenderedSecondary(html, record.secondary)
  for (const key of ['BasicSpeed', 'Dodge']) {
    const wrong = { ...sheet, secondary: { ...sheet.secondary, [key]: issuedBy('K1003').secondary[key] } }
    assert.throws(() => assertRenderedSecondary(markup(wrong), record.secondary), assert.AssertionError)
  }
})

test('경계는 잘못된 traits와 다른 인물 응답을 명시적으로 거부한다', () => {
  const malformed = parseGurpsSheet({ ...issuedBy('K1003'), traits: { kind: 'advantage' } }, 'person-1003')
  assert.equal(malformed.ok, false)
  assert.equal(parseGurpsSheet(issuedBy('K1009'), 'person-1003').ok, false)
  assert.equal(parseGurpsSheet(null, 'person-1003').ok, false)
  assert.ok(parseGurpsSheet(issuedBy('K088'), 'person-0089').ok)
  assert.ok(parseGurpsSheet({ ...issuedBy('K088'), personId: 'person-0089' }, 'person-0089').ok)
})

test('실제 API가 발급한 전체 레코드가 경계 계약을 통과한다', () => {
  for (const record of issued) {
    const result = parseGurpsSheet(record, routeId(record))
    assert.ok(result.ok, `${record.id}: ${JSON.stringify(result)}`)
  }
})

test('경계는 프로듀서가 내지 않는 값을 만들지 않는다', () => {
  const sparse = markup(parseOrThrow({ url: '/people/person-1003', attributes: {}, skills: [], traits: [], cp: {}, secondary: {} }, 'person-1003'))
  assert.doesNotMatch(sparse, /class="cp-note"|class="gurps-advantages"|class="gurps-disadvantages"/u)
  assert.match(sparse, /<span>Speed<\/span><span>—<\/span>/u)
  assert.match(sparse, /<span>Dodge 회피<\/span><span>—<\/span>/u)
  assert.match(sparse, /<span>미사용<\/span><span>— CP<\/span>/u)
})

test('발급 레코드의 부대·영지·정착지 증강 필드는 시트에 노출되지 않는다', () => {
  const record = issuedBy('K1003')
  assert.equal(typeof record.unit?.note, 'string')
  const augmented = { ...record, settlement: { id: 'ST-PROBE', name: '정착지-프로브' }, territory: 'T-PROBE' }
  const sheet = parseOrThrow(augmented, 'person-1003')
  const html = markup(sheet)
  assert.ok(!html.includes(record.unit.note))
  assert.ok(!html.includes('ST-PROBE') && !html.includes('정착지-프로브') && !html.includes('T-PROBE'))
  const effect = issuedBy('K1008').skills.find((skill) => typeof skill.effect === 'string')?.effect
  assert.equal(typeof effect, 'string')
  assert.ok(!markup(parseOrThrow(issuedBy('K1008'), 'person-1008')).includes(effect))
  assert.deepEqual(Object.keys(sheet).sort(), ['attributes', 'band', 'cp', 'secondary', 'skills', 'traits'])
})
