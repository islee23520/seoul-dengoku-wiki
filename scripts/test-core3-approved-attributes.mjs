import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { GurpsSheet, PersonDetailContent, selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'

const approved = [
  ['person-0998', [11, 12, 15, 14], 190, 352],
  ['person-1007', [10, 10, 20, 11], 210, 338],
  ['person-1008', [10, 14, 20, 11], 290, 429],
]

const revision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const roots = JSON.parse(process.env.WIKI_PERSON_SHEET_SOURCES ?? 'null')
const baseline = JSON.parse(await readFile(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
assert.deepEqual(Object.keys(roots ?? {}).sort(), Object.keys(baseline.revisions).sort())
const bytes = await readFile(roots[revision].ledgerPath)
assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[revision].ledgerSha256)
const issued = JSON.parse(bytes).people

const assertProjectedCP = (cp, record, total) => {
  assert.equal(cp.total, total)
  assert.deepEqual(cp, record.cp)
  assert.equal(cp.total, cp.attributes + cp.advantages + cp.disadvantages + cp.skills + (cp.unspent ?? 0))
}

for (const [id, values, attributeCP, total] of approved) {
  test(`${id} projects and renders owner-approved attributes and total`, async () => {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
    const record = issued.find((entry) => entry.url === `/people/${id}`)
    assert.ok(record)
    assert.deepEqual(detail.gurps, { id: record.id, personId: id })
    const selected = selectPreservedSheet(detail.personSheet, { id: detail.characterId, personId: id, name: detail.name, state: detail.state }, revision)
    assert.ok(selected.ok, JSON.stringify(selected))
    assert.equal(selected.revision, revision)
    assert.deepEqual(selected.record, record)
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((name) => selected.sheet.attributes[name])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(selected.sheet.cp.attributes, attributeCP)
    assertProjectedCP(selected.sheet.cp, record, total)
    const page = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(PersonDetailContent, { detail, personId: id })))
    assert.ok(page.includes(`data-person-id="${id}"`))
    assert.ok(!page.includes('class="gurps-sheet"'))
    const html = renderToStaticMarkup(createElement(GurpsSheet, { gurps: selected.sheet }))
    assert.ok(html.includes(`<span class="cp-number">${total}</span>`))
    assert.ok(html.includes(`<span>합계</span><span>${total} CP</span>`))
    for (const value of values) assert.ok(html.includes(String(value)))
  })
}

test('CP guards reject a wrong projection, allocation and approved total', () => {
  const record = issued.find((entry) => entry.url === '/people/person-0998')
  for (const mutate of [
    (cp) => { cp.total += 1 },
    (cp) => { cp.skills += 1 },
    (cp) => { cp.skills += 1; cp.disadvantages -= 1 },
  ]) {
    const cp = structuredClone(record.cp)
    mutate(cp)
    assert.throws(() => assertProjectedCP(cp, record, 352), assert.AssertionError)
  }
  const inconsistent = { ...record, cp: { ...record.cp, skills: record.cp.skills + 1 } }
  assert.throws(() => assertProjectedCP(inconsistent.cp, inconsistent, 352), assert.AssertionError)
  const drifted = { ...record, cp: { ...record.cp, total: 360, skills: record.cp.skills + 8 } }
  assert.throws(() => assertProjectedCP(drifted.cp, drifted, 352), assert.AssertionError)
})
