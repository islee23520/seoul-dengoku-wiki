import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const approved = [
  ['person-0998', [11, 12, 15, 14], 190, 352],
  ['person-1007', [10, 10, 20, 11], 210, 338],
  ['person-1008', [10, 14, 20, 11], 290, 429],
]

const issued = JSON.parse(await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), 'utf8')).people

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
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((name) => detail.gurps.attributes[name])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(detail.gurps.cp.attributes, attributeCP)
    assertProjectedCP(detail.gurps.cp, record, total)
    const html = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(PersonDetailContent, { detail, personId: id })))
    assert.ok(html.includes(`data-person-id="${id}"`))
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
