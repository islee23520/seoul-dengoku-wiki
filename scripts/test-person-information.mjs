import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const issued = read('../lore/name-pools/gurps-cast.json').people
const registry = new Map(read('../lore/name-pools/person-id-registry.json').persons.map((row) => [row.id, row]))
const detailFor = (row) => read(`../public/person-details/${row.url.split('/').pop()}.json`)
const projection = (row) => ({
  id: row.id, personId: row.url.split('/').pop(), band: row.band,
  attributes: Object.fromEntries(Object.entries(row.attributes).map(([key, attr]) => [key, { value: attr.value, cp: attr.cp }])),
  traits: row.traits.map(({ name, kind, cp, rule }) => ({ name, kind, cp, ...(rule === undefined ? {} : { rule }) })),
  skills: row.skills.map(({ name, ko, level, cp }) => ({ name, ...(ko === undefined ? {} : { ko }), level, cp })),
  cp: row.cp, secondary: row.secondary,
})
const render = (detail) => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(PersonDetailContent, { detail, personId: detail.id }))))

test.each(['K002', 'K233'])('confirmed holding scope takes precedence over legacy sheet territory: %s', (id) => {
  const row = issued.find((entry) => entry.id === id)
  const detail = detailFor(row)
  const holdings = read('../lore/relations/personal-holdings.json').holdings.filter((holding) => holding.holderPersonId === id)
  const dom = render({ ...detail, confirmedHoldings: holdings, territory: { fief_name: 'LEGACY_SCOPE', type: 'legacy', station: 'legacy', state: row.state, settlement: { name: 'legacy', type: 'legacy', description: 'legacy' }, note: 'legacy' } })
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('.gurps-territory'), null)
    const panel = document.querySelector('[data-confirmed-holdings]')
    assert.ok(panel)
    assert.equal(panel.querySelectorAll('[data-holding-id]').length, holdings.length)
    for (const holding of holdings) {
      const item = panel.querySelector(`[data-holding-id="${holding.id}"]`)
      assert.ok(item.textContent.includes(holding.name.ko))
      assert.equal(item.querySelectorAll('[data-admin-ref]').length, holding.adminRefs.length)
      assert.deepEqual([...item.querySelectorAll('[data-admin-ref]')].map((element) => element.getAttribute('data-admin-ref')), holding.adminRefs.map((region) => region.id))
      if (holding.facilityRef) assert.equal(item.querySelector('[data-facility-layer]').getAttribute('data-facility-layer'), holding.facilityRef.layerId)
    }
    assert.equal(panel.textContent.includes('LEGACY_SCOPE'), false)
  } finally { dom.window.close() }
})

test('generated person sheets preserve every issued identity and numeric field without API access', () => {
  for (const row of issued) {
    const detail = detailFor(row)
    assert.equal(detail.name, registry.get(row.id)?.name, row.id)
    assert.equal(detail.name, row.name, row.id)
    assert.equal(detail.detailRoute, row.url, row.id)
    assert.deepEqual(detail.gurps, projection(row), row.id)
  }
  const offset = issued.find((row) => row.id === 'K088')
  assert.equal(detailFor(offset).gurps.personId, 'person-0089')
})

for (const key of ['unit', 'territory', 'wandering_force']) {
  test(`generated person ${key} preserves each existing ledger value and absence`, () => {
    for (const row of issued) assert.deepEqual(detailFor(row)[key], row[key], `${row.id}:${key}`)
  })
}

for (const id of ['K007', 'K1003', 'K088']) {
  test(`person component renders issued stats and holdings without a character API: ${id}`, () => {
    const row = issued.find((entry) => entry.id === id)
    const dom = render({ ...detailFor(row), gurps: projection(row), unit: row.unit, territory: row.territory, wandering_force: row.wandering_force })
    const document = dom.window.document
    try {
      for (const key of ['ST', 'DX', 'IQ', 'HT']) {
        const attr = [...document.querySelectorAll('.gurps-attr')].find((node) => node.querySelector('.attr-key').textContent === key)
        assert.ok(attr, `${id}:${key}`)
        assert.equal(attr.querySelector('.attr-value').firstChild.textContent, String(row.attributes[key].value))
      }
      assert.equal(document.querySelector('.cp-number').textContent, String(row.cp.total))
      const unit = document.querySelector('.gurps-unit')
      assert.ok(unit?.textContent.includes(`${row.unit.size}명`))
      for (const value of [row.unit.type, row.unit.quality, row.unit.note, ...row.unit.composition]) assert.ok(unit.textContent.includes(value))
      const territory = document.querySelector('.gurps-territory')
      assert.equal(Boolean(territory), Boolean(row.territory))
      if (row.territory) for (const value of [row.territory.fief_name, row.territory.station, row.territory.settlement.name, row.territory.settlement.description]) assert.ok(territory.textContent.includes(value))
      const camp = document.querySelector('.gurps-wandering')
      assert.equal(Boolean(camp), Boolean(row.wandering_force))
      if (row.wandering_force) for (const value of [row.wandering_force.current_location, row.wandering_force.camp.name, row.wandering_force.camp.description, row.wandering_force.camp.pack_up_time, ...row.wandering_force.camp.facilities]) assert.ok(camp.textContent.includes(value))
    } finally { dom.window.close() }
  })
}

test('generated-to-person-page integration exposes all four information classes', () => {
  const selectors = new Set()
  for (const id of ['K007', 'K1003', 'K088']) {
    const row = issued.find((entry) => entry.id === id)
    const dom = render(detailFor(row))
    try {
      for (const selector of ['.gurps-sheet', '.gurps-unit', '.gurps-territory', '.gurps-wandering']) {
        if (dom.window.document.querySelector(selector)) selectors.add(selector)
      }
      assert.equal(dom.window.document.querySelector('.cp-number')?.textContent, String(row.cp.total))
    } finally { dom.window.close() }
  }
  assert.deepEqual(selectors, new Set(['.gurps-sheet', '.gurps-unit', '.gurps-territory', '.gurps-wandering']))
})

test('unissued holdings remain absent on the generated person page', () => {
  const row = issued.find((entry) => !entry.unit && !entry.territory && !entry.wandering_force)
  assert.ok(row)
  const dom = render(detailFor(row))
  try {
    assert.ok(dom.window.document.querySelector('.gurps-sheet'))
    assert.equal(dom.window.document.querySelector('.gurps-unit, .gurps-territory, .gurps-wandering'), null)
  } finally { dom.window.close() }
})
