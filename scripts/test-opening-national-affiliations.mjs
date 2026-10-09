// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { test } from 'vitest'
import PeoplePage from '../src/pages/PeoplePage.tsx'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
const expected = [["K1008","민웅기","polity:daejeon","대전"],["K1009","신종목","S14","아관사"],["K1010","신준","S14","아관사"],["K1011","린샤오메이","S02","규격맹"],["K1012","팜반득","S02","규격맹"],["K1013","아미라 카심","S07","환적국"],["K1014","조엘 박","S07","환적국"],["K1015","나르기즈 유수포바","S10","안국총림"],["K1016","최일석","S06","대한민국정부"],["K1018","고예진","S16","정동노총"],["K1019","박성수","S06","대한민국정부"],["K1020","한서경","S16","정동노총"],["K1022","문도현","S07","환적국"]]
const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
test('approved opening countries retain issued identity and actual Aside state', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const values = json('lore/name-pools/values-cast.json').people
  const registry = json('lore/name-pools/person-id-registry.json').persons
  const sheets = json('lore/name-pools/gurps-cast.json').people
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    for (const [id, name, state, stateName] of expected) {
      assert.equal(registry.find(p => p.id === id).name, name)
      assert.equal(values.find(p => p.name === name).state, state)
      const sheet = sheets.find(p => p.id === id)
      assert.equal(sheet.state, state)
      const catalog = peopleCatalog.find(p => p.detailRoute === sheet.url)
      assert.equal(catalog.name, name)
      assert.equal(catalog.state, state)
      assert.equal(catalog.stateName, stateName)
      const detail = json('public/person-details/' + catalog.id + '.json')
      assert.equal(detail.state, state)
      assert.equal(detail.stateName, stateName)
      assert.equal(detail.commonTier, 'T5')
      for (const field of ['unit', 'territory', 'wandering_force']) assert.deepEqual(detail[field], sheet[field])
      await act(async () => root.render(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: catalog.id }))))
      const aside = host.querySelector('aside[aria-label="인물 구조화 데이터"]')
      assert.ok(aside)
      const rows = [...aside.querySelectorAll('tr')]
      assert.ok(rows.some(row => row.textContent === '국가' + stateName))
      assert.ok(rows.some(row => row.textContent === '국가 ID' + state))
    }
  } finally { await act(async () => root.unmount()) }
})
test('actual people state filter returns each approved identity and excludes pending cards', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  sessionStorage.clear()
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, null, createElement(PeoplePage))))
    for (const [id, name, state, stateName] of expected) {
      const select = host.querySelector('.people-filters select')
      await act(async () => { select.value = stateName; select.dispatchEvent(new Event('change', { bubbles: true })) })
      const person = peopleCatalog.find(p => p.name === name)
      assert.equal(person.state, state)
      const row = host.querySelector('[data-person-id="' + person.id + '"]')
      assert.ok(row, id)
      assert.equal(row.querySelector('a').getAttribute('href'), person.detailRoute)
      assert.equal(row.querySelector('[data-label="국가"]').textContent, stateName)
    }
    for (const name of ['지연희', '차유선']) assert.equal(peopleCatalog.find(p => p.name === name).state, 'S00')
  } finally { await act(async () => root.unmount()); sessionStorage.clear() }
})
