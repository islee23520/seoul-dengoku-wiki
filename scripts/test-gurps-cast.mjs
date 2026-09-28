// 겁스 4판 인물 수치 검사기 시험 (node --test).
// (a) 커밋된 gurps-cast.json이 검사를 통과하고 카드에서 다시 파생한 결과와 바이트 단위로 같은지,
// (b) 승인 견본 두 사람과 K001–K1016 순서가 그대로인지, (c) 변이마다 검사가 실패하는지 본다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { ABILITY_CAP, BANDS, OUT, ROOT, TIERS, bandFor, build, serialize, stepFor, verify } from './gurps-cast.mjs'

const raw = readFileSync(join(ROOT, OUT), 'utf8')
const doc = JSON.parse(raw)
const find = (d, id) => d.people.find((p) => p.id === id)
// 근거가 있는 일반 인물 하나(행위 문장으로 IQ가 오른 사람)를 변이 대상으로 고른다.
const sample = doc.people.find((p) => p.method === 'card-lexicon' && p.attributes.IQ.value === 11 && p.skills.length >= 2)
const sampleIndex = doc.people.indexOf(sample)

test('커밋된 파일이 모든 검사를 통과한다', () => {
  assert.deepEqual(verify(doc), [])
})

test('카드에서 다시 파생한 결과가 커밋된 파일과 바이트 단위로 같다', () => {
  assert.equal(serialize(build().doc), raw)
})

test('K001–K1016 1,016명이 발급 순서대로 있고 URL은 values-cast 순번을 따른다', () => {
  assert.equal(doc.people.length, 1016)
  doc.people.forEach((p, i) => assert.equal(p.id, `K${String(i + 1).padStart(3, '0')}`))
  assert.equal(find(doc, 'K1003').url, '/people/person-1003')
  assert.equal(find(doc, 'K1009').url, '/people/person-1009')
})

test('승인 견본: 조재표 216, 신종목 207, 두 사람 모두 주역·강자', () => {
  const jo = find(doc, 'K1003')
  const shin = find(doc, 'K1009')
  assert.equal(jo.cp.total, 216)
  assert.equal(shin.cp.total, 207)
  assert.equal(jo.band, '주역·강자')
  assert.equal(shin.band, '주역·강자')
  assert.equal(shin.skills.find((s) => s.name.startsWith('Spear')).level, 16)
  assert.equal(shin.secondary.BasicSpeed, 6.25)
  assert.equal(jo.secondary.Dodge, 10)
  assert.equal(shin.secondary.Dodge, 10)
})

test('근거 없는 사람은 네 능력 10과 빈 근거 목록만 가진다', () => {
  for (const p of doc.people.filter((x) => x.baseline)) {
    assert.equal(p.cp.total, 0)
    assert.deepEqual(p.skills, [])
    for (const a of Object.values(p.attributes)) { assert.equal(a.value, 10); assert.deepEqual(a.evidence, []) }
  }
})

test('규칙표: B170 투자 단계, 등급표, 구간 경계', () => {
  assert.deepEqual([1, 2, 4, 8, 12, 16].map(stepFor), [0, 1, 2, 3, 4, 5])
  assert.equal(stepFor(3), null)
  assert.deepEqual(TIERS, { A: 12, B: 8, C: 4, D: 2 })
  assert.equal(ABILITY_CAP, 3)
  assert.deepEqual([0, 74, 75, 124, 125, 199, 200, 300].map((n) => bandFor(n)[0]), ['근거 미달', '근거 미달', '일반 인물', '일반 인물', '숙련자', '숙련자', '주역·강자', '주역·강자'])
  assert.deepEqual(bandFor(301), [])
  assert.equal(BANDS.length, 4)
})

const MUTATIONS = [
  ['기술 CP를 등급과 다르게(8→12, 수준 그대로)', (d) => { d.people[sampleIndex].skills[0].cp = 12 }],
  ['기술 등급만 B→C로(CP 그대로)', (d) => { d.people[sampleIndex].skills[0].tier = 'C' }],
  ['표에 없는 투자 CP 3', (d) => { const s = d.people[sampleIndex].skills[0]; s.cp = 3; s.tier = 'C' }],
  ['기술 수준 +1', (d) => { d.people[sampleIndex].skills[0].level += 1 }],
  ['기술 난이도 A→H', (d) => { d.people[sampleIndex].skills.find((s) => s.diff === 'A').diff = 'H' }],
  ['기술 기준 능력 IQ→DX', (d) => { d.people[sampleIndex].skills.find((s) => s.attr === 'IQ').attr = 'DX' }],
  ['근거 없는 기술 추가', (d) => { d.people[sampleIndex].skills.push({ name: 'Observation', ko: '관찰', attr: 'Per', diff: 'A', tier: 'C', cp: 4, level: 12, evidence: [] }) }],
  ['총기 기술 추가(근거 인용 재사용)', (d) => { const p = d.people[sampleIndex]; p.skills.push({ name: 'Guns/TL? (Rifle)', ko: '총기', attr: 'DX', diff: 'E', tier: 'C', cp: 4, level: 12, evidence: p.skills[0].evidence }) }],
  ['일반 인물에 A 등급', (d) => { const s = d.people[sampleIndex].skills[0]; s.tier = 'A'; s.cp = 12; s.level += 1 }],
  ['능력 +1을 근거 문장 없이', (d) => { const a = d.people[sampleIndex].attributes.DX; a.value = 11; a.cp = 20 }],
  ['같은 문장을 두 번 세어 IQ 12', (d) => { const a = d.people[sampleIndex].attributes.IQ; a.evidence.push({ ...a.evidence[0] }); a.value = 12; a.cp = 40 }],
  ['능력 상한 +3 초과(14)', (d) => { const a = find(d, 'K1009').attributes.DX; a.value = 14; a.cp = 80 }],
  ['능력 CP를 수준과 다르게', (d) => { d.people[sampleIndex].attributes.IQ.cp = 10 }],
  ['인용 한 글자 변조', (d) => { const e = d.people[sampleIndex].skills[0].evidence[0]; e.quote = e.quote.slice(0, -1) + '!' }],
  ['인용의 JSON 포인터를 다른 노드로', (d) => { const e = d.people[sampleIndex].skills[0].evidence[0]; e.pointer = '/content/0/text/ko' }],
  ['역할 표시 인용 변조', (d) => { d.people[sampleIndex].role.evidence[0].quote += ' 대장' }],
  ['총점 −1', (d) => { d.people[sampleIndex].cp.total -= 1 }],
  ['구간 이름 변경', (d) => { find(d, 'K1003').band = '숙련자' }],
  ['견본 총점 216→214(기술 한 칸 C→D)', (d) => { const p = find(d, 'K1003'); const s = p.skills.find((k) => k.name === 'Staff'); s.tier = 'D'; s.cp = 2; s.level = 12; p.cp.skills -= 2; p.cp.total -= 2 }],
  ['Combat Reflexes를 지명되지 않은 사람에게', (d) => { const p = d.people[sampleIndex]; p.traits.push({ ...find(d, 'K1003').traits.find((t) => t.rule === 'combat-reflexes') }); p.cp.advantages += 15; p.cp.total += 15; p.secondary.Dodge += 1 }],
  ['Combat Reflexes 15→10 CP', (d) => { find(d, 'K1009').traits[0].cp = 10 }],
  ['유명세 근거 없는 Reputation', (d) => { const p = d.people[sampleIndex]; p.traits.push({ name: 'Reputation +1', kind: 'advantage', rule: 'reputation', level: 1, people: 1, frequency: 1, cp: 5, evidence: p.skills[0].evidence }); p.cp.advantages += 5; p.cp.total += 5 }],
  ['단점 발급', (d) => { const p = d.people[sampleIndex]; p.traits.push({ name: 'Sense of Duty', kind: 'disadvantage', rule: 'reputation', level: -1, people: 1, frequency: 1, cp: -5, evidence: p.skills[0].evidence }); p.cp.disadvantages -= 5; p.cp.total -= 5 }],
  ['Dodge 보조 특성 +1', (d) => { d.people[sampleIndex].secondary.Dodge += 1 }],
  ['baseline 표시를 거짓으로', (d) => { d.people[sampleIndex].baseline = true }],
  ['두 사람 순서 교환', (d) => { const t = d.people[0]; d.people[0] = d.people[1]; d.people[1] = t }],
  ['한 사람 누락', (d) => { d.people.splice(500, 1); d.count -= 1 }],
  ['URL 변경', (d) => { d.people[sampleIndex].url = '/people/person-9999' }],
  ['이름 변경', (d) => { d.people[sampleIndex].name += '가' }],
  ['승인 해시 한 글자 변경', (d) => { const k = 'lore/name-pools/values-cast.json'; d.invariants[k] = '0' + d.invariants[k].slice(1) }],
  ['규칙표 등급 A 16', (d) => { d.rules.tiers.A = 16 }],
  ['견본값 규칙을 일반 인물에', (d) => { const a = d.people[sampleIndex].attributes.IQ; a.rule = 'pilot-approved' }],
]

for (const [label, mutate] of MUTATIONS) {
  test(`변이는 실패해야 한다: ${label}`, () => {
    const m = structuredClone(doc)
    mutate(m)
    const errors = verify(m)
    assert.ok(errors.length > 0, `변이가 검사를 통과했다: ${label}`)
  })
}
