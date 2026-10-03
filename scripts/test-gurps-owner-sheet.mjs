import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GurpsSheet, parseGurpsSheet } from '../src/pages/PersonDetailPage.tsx'
import { ATTR_COST, OWNER_SHEETS, ROOT, build, ownerSheet, quoteHolds, stepFor, verify } from './gurps-cast.mjs'

const entry = { id: 'K1019', name: '박성수' }
const sheet = build().doc.people.find((person) => person.id === entry.id)

test('개별 저작 시트는 실제 능력 비용과 투자 단계로 200 CP를 산출한다', () => {
  assert.deepEqual(ATTR_COST, { ST: 10, DX: 20, IQ: 20, HT: 10 })
  assert.deepEqual(Object.values(sheet.attributes).map(({ value, cp }) => [value, cp]), [[10, 0], [11, 20], [13, 60], [12, 20]])
  assert.deepEqual(sheet.cp, { attributes: 100, advantages: 0, disadvantages: 0, skills: 100, spent: 200, unspent: 0, total: 200 })
  assert.equal(sheet.band, '주역·강자')
  assert.deepEqual(sheet.skills.map(({ cp, level }) => [cp, level]), [[24, 18], [24, 18], [12, 15], [12, 16], [12, 16], [8, 15], [8, 15]])
  assert.equal(stepFor(24), 7)
  assert.equal(stepFor(20), 6)
  assert.equal(stepFor(6), null)
  assert.deepEqual(sheet.secondary, { HP: 10, Will: 13, Per: 13, FP: 12, BasicSpeed: 5.75, BasicMove: 5, BasicLift: 20, Dodge: 8 })
  assert.deepEqual(sheet.traits, [])
})

test('역할 지시와 수치 제안을 구별하고 실제 서사와 원천 해시에 결속한다', () => {
  assert.equal(sheet.method, 'owner-authored')
  assert.equal(sheet.source.kind, 'owner-authored')
  assert.equal(sheet.source.numericStatus, 'proposal')
  assert.equal(sheet.source.sha256, createHash('sha256').update(readFileSync(join(ROOT, OWNER_SHEETS))).digest('hex'))
  for (const evidence of [...sheet.source.evidence, ...sheet.source.narratives, ...sheet.skills.flatMap((skill) => skill.evidence)]) assert.ok(quoteHolds(ROOT, evidence))
  assert.throws(() => ownerSheet(ROOT, { ...entry, name: '다른 사람' }), /identity mismatch/u)
  assert.equal(ownerSheet(ROOT, { id: 'K001', name: '한재목' }), null)
})

test('독립 검사는 저작 시트의 CP·기술·보조 특성·출처 변조를 거부한다', () => {
  const doc = build().doc
  assert.deepEqual(verify(doc, ROOT, ['K1019']), [])
  for (const change of [
    (person) => { person.attributes.DX.cp = 10 },
    (person) => { person.skills[0].cp = 22 },
    (person) => { person.skills[0].level = 20 },
    (person) => { person.secondary.Dodge = 9 },
    (person) => { person.cp.disadvantages = -10 },
    (person) => { person.source.sha256 = '0'.repeat(64) },
    (person) => { person.source.numericStatus = 'approved' },
  ]) {
    const mutated = structuredClone(doc)
    change(mutated.people.find((person) => person.id === entry.id))
    assert.ok(verify(mutated, ROOT, ['K1019']).some((error) => error.startsWith('K1019 ')))
  }
})

test('실제 GURPS 투영은 박성수의 기술과 보조 특성을 그대로 렌더한다', () => {
  const result = parseGurpsSheet(sheet, 'person-1019')
  assert.ok(result.ok)
  const html = renderToStaticMarkup(React.createElement(GurpsSheet, { gurps: result.sheet }))
  for (const skill of result.sheet.skills) assert.ok(html.includes(skill.ko))
  assert.match(html, /5\.75/u)
  assert.match(html, /<span>Dodge 회피<\/span><span>8<\/span>/u)
  assert.match(html, /200 CP/u)
  assert.doesNotMatch(html, /Combat Reflexes/u)
})
