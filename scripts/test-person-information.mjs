import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const registry = new Map(readCanonicalDocument('lore/name-pools/person-id-registry.json').persons.map((row) => [row.id, row]))
const details = readdirSync(new URL('../public/person-details/', import.meta.url))
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(`../public/person-details/${name}`, import.meta.url), 'utf8')))
const detailFor = (id) => {
  const detail = details.find((row) => row.characterId === id)
  assert.ok(detail, id)
  return detail
}
const content = (detail) => createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: detail.id }))
const render = (detail) => new JSDOM(renderToStaticMarkup(content(detail)))

async function withDetail(detail, check) {
  const browser = new JSDOM('<!doctype html><html><body></body></html>')
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']
  const previous = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key))
  globalThis.window = browser.window
  globalThis.document = browser.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const reactRoot = createRoot(host)
  try {
    await act(async () => { reactRoot.render(content(detail)) })
    assert.equal(host.querySelector('[data-person-id]').dataset.personId, detail.id)
    await check(host)
  } finally {
    await act(async () => reactRoot.unmount())
    keys.forEach((key, index) => {
      if (previous[index]) Object.defineProperty(globalThis, key, previous[index])
      else delete globalThis[key]
    })
    browser.window.close()
  }
}

test.each(['K002', 'K233'])('confirmed holding scope renders its issued references: %s', (id) => {
  const detail = detailFor(id)
  const holdings = readCanonicalDocument('lore/relations/personal-holdings.json').holdings.filter((holding) => holding.holderPersonId === id)
  assert.ok(holdings.length > 0, id)
  const dom = render({ ...detail, confirmedHoldings: holdings })
  try {
    const panel = dom.window.document.querySelector('[data-confirmed-holdings]')
    assert.ok(panel)
    assert.equal(panel.querySelectorAll('[data-holding-id]').length, holdings.length)
    for (const holding of holdings) {
      const item = panel.querySelector(`[data-holding-id="${holding.id}"]`)
      assert.equal(item.querySelector('h3').textContent, holding.name.ko)
      assert.deepEqual([...item.querySelectorAll('[data-admin-ref]')].map((element) => element.getAttribute('data-admin-ref')), holding.adminRefs.map((region) => region.id))
      if (holding.stationRef) assert.equal(item.querySelector('[data-owned-station]').dataset.ownedStation, holding.stationRef.stationId)
      if (holding.facilityRef) assert.equal(item.querySelector('[data-facility-layer]').dataset.facilityLayer, holding.facilityRef.layerId)
      assert.deepEqual([...item.querySelectorAll('[data-component-ref]')].map((element) => element.dataset.componentRef), (holding.componentRefs ?? []).map((ref) => `${ref.unitId}:${ref.componentIndex}`))
    }
  } finally { dom.window.close() }
})

test('generated current person details preserve registered identities and stable routes', () => {
  assert.ok(details.length > 0)
  assert.equal(new Set(details.map((detail) => detail.characterId)).size, details.length)
  assert.equal(new Set(details.map((detail) => detail.id)).size, details.length)
  for (const detail of details) {
    assert.equal(detail.name, registry.get(detail.characterId)?.name, detail.characterId)
    assert.equal(detail.detailRoute, `/people/${detail.id}`, detail.characterId)
    assert.ok(detail.characterProfile, detail.characterId)
  }
  assert.equal(detailFor('K088').id, 'person-0089')
})

test.each(['K007', 'K1003', 'K088'])('mounted person page binds current profile and rights to the issued identity: %s', async (id) => {
  const detail = detailFor(id)
  await withDetail(detail, (host) => {
    assert.equal(host.querySelector('h1').textContent, detail.name)
    const profile = host.querySelector('[data-character-profile]')
    assert.ok(profile)
    assert.deepEqual([...profile.querySelector('table').tBodies[0].rows].map((row) => [...row.querySelectorAll('td')].map((cell) => Number(cell.textContent))), Object.values(detail.characterProfile.abilities).map(({ base, effective }) => [base, effective]))
    assert.equal(host.querySelector('a[href^="/tools/character-art?"]').getAttribute('href'), `/tools/character-art?person=${encodeURIComponent(detail.id)}`)
    const permissions = host.querySelector('[data-person-permissions]')
    assert.equal(Boolean(permissions), Boolean(detail.rightsPermissions))
    if (detail.rightsPermissions) {
      for (const scope of ['nameUse', 'likenessUse']) {
        const permission = detail.rightsPermissions[scope]
        const row = permissions.querySelector(`[data-permission-scope="${scope}"]`)
        assert.equal(row.dataset.permissionStatus, permission.status)
        assert.deepEqual([...row.querySelectorAll('time')].map((time) => time.dateTime), [permission.date, permission.recordedOn].filter(Boolean))
        assert.deepEqual([...row.querySelectorAll('[data-prior-license-source]')].map((license) => [...license.querySelectorAll('a')].map((link) => link.getAttribute('href'))), (permission.priorLicenses ?? []).map((license) => [license.sourceRef, license.licenseRef, license.conditionsRef]))
      }
      assert.equal(permissions.querySelector('[data-external-reuse-permission]').dataset.externalReusePermission, 'required')
    }
  })
})

test('a person with no confirmed holdings still renders the current profile', async () => {
  const detail = details.find((row) => !row.confirmedHoldings?.length)
  assert.ok(detail)
  await withDetail(detail, (host) => {
    assert.ok(host.querySelector('[data-character-profile]'))
    assert.equal(host.querySelector('[data-confirmed-holdings]'), null)
  })
})
