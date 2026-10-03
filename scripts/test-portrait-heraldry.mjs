import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { PortraitHeraldry } from '../src/components/PortraitHeraldry.tsx'
import { heraldryUrl } from '../src/hooks/useHeraldryAssets.ts'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

test('shared registry binds every issued identity and the exact existing heraldry assets', () => {
  const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
  const assets = json('public/heraldry-assets.json')
  const catalog = json('heraldry-catalog.json')
  const registry = json('lore/name-pools/person-id-registry.json')
  const people = Object.entries(assets.people)
  assert.equal(people.length, registry.persons.length)
  assert.equal(new Set(people.map(([, person]) => person.characterId)).size, registry.persons.length)
  assert.equal(Object.keys(assets.states).length, 16)
  assert.deepEqual(Object.keys(assets.clans).sort(), json('public/clan-crests/index.json').crests.map(crest => crest.id).sort())
  for (const kind of ['states', 'clans']) for (const [id, asset] of Object.entries(assets[kind])) {
    assert.equal(asset.path, catalog[kind][id].path)
    assert.equal(asset.sha256, createHash('sha256').update(readFileSync(new URL('../public/' + asset.path, import.meta.url))).digest('hex'))
  }
  for (const [personId, identity] of people) {
    const person = registry.persons.find(person => person.id === identity.characterId)
    const detail = json('public/person-details/' + personId + '.json')
    assert.equal(identity.name, person.name)
    assert.equal(identity.state, detail.state)
    assert.equal(identity.stateName, detail.stateName || '무소속')
    assert.equal(identity.clan?.id ?? null, detail.clan?.id ?? null)
    if (identity.state !== 'S00') assert.ok(assets.states[identity.state], identity.characterId)
    if (identity.clan && assets.clans[identity.clan.id]) assert.equal(assets.clans[identity.clan.id].path, catalog.clans[identity.clan.id].path)
  }
})

test('current affiliation changes only the flag and unaffiliated retains the family crest', () => {
  const clan = { id: 'test-clan', name: '시험 가문', crest: 'clan-crests/test-clan.svg' }
  const render = state => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PortraitHeraldry, { person: { id: 'test-person', state, stateName: '시험국', clan } }))))
  const first = render('S01'), changed = render('S02'), independent = render('S00')
  try {
    assert.ok(first.window.document.querySelector('[data-identity-field="stateFlag"]'))
    assert.ok(changed.window.document.querySelector('[data-identity-field="stateFlag"]'))
    assert.equal(independent.window.document.querySelector('[data-identity-field="stateFlag"]'), null)
    for (const dom of [first, changed, independent]) assert.equal(dom.window.document.querySelector('[data-identity-field="clanCrest"]').getAttribute('href'), '/families/test-clan')
  } finally { first.window.close(); changed.window.close(); independent.window.close() }
})

test('asset URLs follow JSON paths and actual revision hashes', () => {
  const before = heraldryUrl({ path: 'existing/flag.webp', sha256: 'a'.repeat(64) })
  const after = heraldryUrl({ path: 'existing/flag.webp', sha256: 'b'.repeat(64) })
  assert.notEqual(before, after)
  assert.ok(before.endsWith('existing/flag.webp?v=' + 'a'.repeat(64)))
  assert.ok(heraldryUrl({ path: 'updated/crest.svg', sha256: 'c'.repeat(64) }).endsWith('updated/crest.svg?v=' + 'c'.repeat(64)))
})
