import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'
import { loadCastBirthdays } from './cast-birthdays.mjs'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const issued = read('../lore/name-pools/gurps-cast.json').people
const registry = new Map(read('../lore/name-pools/person-id-registry.json').persons.map((row) => [row.id, row]))
const birthdays = await loadCastBirthdays(fileURLToPath(new URL('../lore/', import.meta.url)), [...registry.values()])
const detailFor = (row) => read(`../public/person-details/${row.url.split('/').pop()}.json`)
const projection = (row) => ({
  id: row.id, personId: row.url.split('/').pop(), band: row.band,
  ...(row.source?.numericStatus === 'proposal' ? { numericStatus: 'proposal' } : {}),
  attributes: Object.fromEntries(Object.entries(row.attributes).map(([key, attr]) => [key, { value: attr.value, cp: attr.cp }])),
  traits: row.traits.map(({ name, kind, cp, rule }) => ({ name, kind, cp, ...(rule === undefined ? {} : { rule }) })),
  skills: row.skills.map(({ name, ko, level, cp }) => ({ name, ...(ko === undefined ? {} : { ko }), level, cp })),
  cp: row.cp, secondary: row.secondary,
})
const render = (detail) => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(PersonDetailContent, { detail, personId: detail.id }))))

test('generated details preserve birth ledger values for every issued identity', () => {
  assert.equal(issued.length, registry.size)
  for (const row of issued) {
    const detail = detailFor(row)
    const birth = birthdays.get(row.id)
    assert.ok(birth, row.id)
    for (const [key, value] of Object.entries(birth)) assert.deepEqual(detail[key], value, `${row.id}:${key}`)
  }
})

test('unrecorded parents remain explicit while existing parent relationships survive', () => {
  for (const [id, status, parentId, type] of [
    ['K087', 'biological-parents-unrecorded', 'K086', 'adoptive'],
    ['K1010', 'maternal-parent-unrecorded', 'K1009', 'biological'],
  ]) {
    const detail = detailFor(issued.find(row => row.id === id))
    assert.equal(detail.familyTree.parentStatus, status)
    assert.ok(detail.familyTree.edges.some(edge => edge.from === parentId && edge.to === id && edge.type === type))
  }
})

test('identity table renders birthday and completed age with its date basis', () => {
  const row = issued.find((entry) => entry.id === 'K088')
  const detail = detailFor(row)
  const dom = render(detail)
  try {
    const rows = new Map([...dom.window.document.querySelectorAll('.person-data-table tbody tr')]
      .map((node) => [node.querySelector('th').textContent, node.querySelector('td').textContent]))
    assert.equal(rows.get('생년월일'), detail.birthDate)
    assert.equal(rows.get('생일'), detail.birthday)
    assert.equal(rows.get('나이'), `만 ${detail.age}세`)
    assert.equal(rows.get('나이 기준일'), detail.ageAsOf)
  } finally { dom.window.close() }
})

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

test('existing prose contacts retain source meaning without becoming contract or command edges', () => {
  const row = issued.find(entry => entry.id === 'K085')
  const detail = detailFor(row)
  assert.equal(detail.proseContacts[0].recipientId, 'K057')
  assert.equal(detail.relations.outgoing.length, 0)
  const dom = render(detail)
  try {
    assert.ok(dom.window.document.querySelector('.person-data-panel').textContent.includes(detail.proseContacts[0].basis))
  } finally { dom.window.close() }
})

test('existing regional cooperation is visible at both endpoints without invented contract edges', () => {
  const amira = detailFor(issued.find(entry => entry.id === 'K1013'))
  const joel = detailFor(issued.find(entry => entry.id === 'K1014'))
  const outgoing = amira.proseContacts.find(contact => contact.recipientId === 'K1014')
  const incoming = joel.proseContacts.find(contact => contact.recipientId === 'K1013')
  assert.ok(outgoing)
  assert.ok(incoming)
  assert.deepEqual(incoming.sourceRef, outgoing.sourceRef)
  assert.equal(incoming.basis, outgoing.basis)
  assert.equal(amira.relations.outgoing.some(contact => contact.recipientId === 'K1014'), false)
  assert.equal(joel.relations.outgoing.some(contact => contact.recipientId === 'K1013'), false)
})

test('every issued person has an actual person contact or preserved court connection', () => {
  assert.equal(issued.length, registry.size)
  for (const row of issued) {
    const detail = detailFor(row)
    assert.ok(detail.relations.outgoing.length || detail.relations.incoming.length || detail.proseContacts.length || detail.court?.members.length || detail.directLiege, row.id)
  }
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

test('household proposals remain separate from existing direct-retainer assignments', () => {
  const row = issued.find(entry => entry.id === 'K998')
  const detail = detailFor(row)
  assert.equal(detail.householdProposal.status, 'draft')
  const dom = render(detail)
  try {
    const section = dom.window.document.querySelector('.person-household-proposal')
    assert.ok(section)
    for (const link of detail.householdProposal.links) {
      assert.ok(section.textContent.includes(link.recipientName))
      if (link.type === 'contract') assert.ok(section.textContent.includes(link.basis))
    }
    assert.equal(detail.directLiege, undefined)
    assert.deepEqual(detail.court.members.map(member => member.personId), ['K425', 'K441'])
    assert.equal(detail.householdProposal.household.humanoidAdmission, 'deferred')
  } finally { dom.window.close() }
})
