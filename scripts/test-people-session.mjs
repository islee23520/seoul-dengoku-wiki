// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { test, vi } from 'vitest'
import PeoplePage from '../src/pages/PeoplePage.tsx'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
import { portraitIdentities } from '../src/generated/portraitIdentities.ts'

const key = 'wiki.people.filters.v1'
const selected = { query: '감국', state: '신내운수', commonTier: 'T5', occupation: '외곽 호송 인원·발포 권한 확인', gender: '여성' }
const defaults = { query: '', state: 'all', commonTier: 'all', occupation: 'all', gender: 'all' }

async function mount() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const root = createRoot(host)
  let navigate
  function Navigation() { navigate = useNavigate(); return null }
  await act(async () => root.render(createElement(MemoryRouter, { initialEntries: ['/people'] },
    createElement(Navigation), createElement(Routes, null,
      createElement(Route, { path: '/people', element: createElement(PeoplePage) }),
      createElement(Route, { path: '/people/:id', element: createElement('h1', null, 'Detail') })))))
  return { host, navigate: async (to) => act(async () => navigate(to)), close: async () => act(async () => root.unmount()) }
}

function values(host) {
  const [state, commonTier, occupation, gender] = [...host.querySelectorAll('.people-filters select')].map((element) => element.value)
  return { query: host.querySelector('input[type=search]').value, state, commonTier, occupation, gender }
}

async function choose(host, filters) {
  const input = host.querySelector('input[type=search]')
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, filters.query)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  for (const [index, field] of ['state', 'commonTier', 'occupation', 'gender'].entries()) {
    await act(async () => {
      const select = host.querySelectorAll('.people-filters select')[index]
      select.value = filters[field]
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
}

test('all five fields and matching rows survive detail Back Forward Back and remount', async () => {
  sessionStorage.clear()
  const localBefore = { ...localStorage }
  let page = await mount()
  try {
    await choose(page.host, selected)
    assert.deepEqual(values(page.host), selected)
    const rows = page.host.querySelector('.people-table tbody').textContent
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, 1)
    assert.equal(page.host.querySelector('.people-table a').getAttribute('href'), '/people/person-0306')
    await act(async () => page.host.querySelector('.people-table a').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })))
    assert.ok(page.host.querySelector('h1'))
    assert.equal(page.host.querySelector('.people-table'), null)
    await page.navigate(-1)
    assert.deepEqual(values(page.host), selected)
    assert.equal(page.host.querySelector('.people-table tbody').textContent, rows)
    await page.navigate(1)
    assert.equal(page.host.querySelector('.people-table'), null)
    await page.navigate(-1)
    assert.deepEqual(values(page.host), selected)
    await page.close()
    page = await mount()
    assert.deepEqual(values(page.host), selected)
    assert.equal(page.host.querySelector('.people-table tbody').textContent, rows)
    assert.deepEqual({ ...localStorage }, localBefore)
  } finally { await page.close(); sessionStorage.clear() }
})

test('empty results persist and reset removes session state across remount', async () => {
  sessionStorage.clear()
  let page = await mount()
  try {
    const empty = { ...selected, query: 'no-matching-person-0306' }
    await choose(page.host, empty)
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, 0)
    await page.close()
    page = await mount()
    assert.deepEqual(values(page.host), empty)
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, 0)
    await act(async () => page.host.querySelector('.people-filters button').click())
    assert.deepEqual(values(page.host), defaults)
    assert.equal(sessionStorage.getItem(key), null)
    await page.close()
    page = await mount()
    assert.deepEqual(values(page.host), defaults)
    assert.ok(page.host.querySelectorAll('.people-table tbody tr').length > 1)
  } finally { await page.close(); sessionStorage.clear() }
})

test('malformed session data warns and restores defaults without crashing', async () => {
  const sentinel = 'private-session-sentinel'
  sessionStorage.setItem(key, sentinel)
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  let page
  try {
    page = await mount()
    assert.deepEqual(values(page.host), defaults)
    assert.equal(sessionStorage.getItem(key), null)
    assert.equal(warning.mock.calls.length, 1)
    assert.ok(warning.mock.calls.every((args) => args.length === 1 && typeof args[0] === 'string'))
    assert.ok(!warning.mock.calls.flat().join(' ').includes(sentinel))
    assert.ok(!JSON.stringify(warning.mock.calls).includes(sentinel))
  } finally { if (page) await page.close(); warning.mockRestore(); sessionStorage.clear() }
})

test('storage write failures warn without exposing input-bearing error details', async () => {
  sessionStorage.clear()
  const sentinel = 'private-write-sentinel'
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const write = vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => { throw new Error(sentinel) })
  let page
  try {
    page = await mount()
    await choose(page.host, { ...selected, query: sentinel })
    assert.equal(values(page.host).query, sentinel)
    assert.equal(sessionStorage.getItem(key), null)
    assert.ok(warning.mock.calls.length > 0)
    assert.ok(warning.mock.calls.every((args) => args.length === 1 && typeof args[0] === 'string'))
    assert.ok(!warning.mock.calls.flat().join(' ').includes(sentinel))
    assert.ok(!JSON.stringify(warning.mock.calls).includes(sentinel))
  } finally { if (page) await page.close(); write.mockRestore(); warning.mockRestore(); sessionStorage.clear() }
})

test('unknown saved dropdown choices default independently and preserve the raw query', async () => {
  const saved = { query: '  감국  ', state: 'unknown-state', commonTier: 'T99', occupation: 'unknown-occupation', gender: 'unknown-gender' }
  sessionStorage.setItem(key, JSON.stringify(saved))
  const page = await mount()
  try {
    const expected = { ...defaults, query: saved.query }
    assert.deepEqual(values(page.host), expected)
    assert.deepEqual(JSON.parse(sessionStorage.getItem(key)), expected)
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, 1)
    assert.equal(page.host.querySelector('.people-table a').getAttribute('href'), '/people/person-0306')
  } finally { await page.close(); sessionStorage.clear() }
})

test('ordinary roster and five controls remain without featured sections or portrait links', async () => {
  sessionStorage.clear()
  const page = await mount()
  try {
    assert.equal(page.host.querySelector('.people-recommended'), null)
    assert.equal(page.host.querySelector('.people-leaders'), null)
    assert.equal(page.host.querySelectorAll('.people-row-portrait').length, portraitIdentities.length)
    assert.equal(page.host.querySelector('a[href*="portrait-tokens/"]'), null)
    assert.deepEqual(values(page.host), defaults)
    assert.equal(page.host.querySelectorAll('.people-filters select').length, 4)
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, peopleCatalog.length)
    assert.ok(page.host.querySelector('a[href="/people/draft"]'))
    assert.ok(page.host.querySelector('a[href="/tools/character-art"]'))
    await choose(page.host, selected)
    assert.deepEqual(values(page.host), selected)
    assert.equal(page.host.querySelectorAll('.people-table tbody tr').length, 1)
    assert.equal(page.host.querySelector('.people-table a').getAttribute('href'), '/people/person-0306')
  } finally { await page.close(); sessionStorage.clear() }
})


test('ordinary-row portraits bind stable IDs and ordered existing metadata without invented flags or titles', async () => {
  sessionStorage.clear()
  const page = await mount()
  try {
    for (const portrait of portraitIdentities) {
      const row = page.host.querySelector('[data-person-id="' + portrait.personId + '"]')
      const figure = row.querySelector('.people-row-portrait')
      assert.ok(figure)
      assert.equal(figure.querySelector('a').getAttribute('href'), '/people/' + portrait.personId)
      assert.ok(figure.querySelector('img').getAttribute('src').includes(portrait.personId + '.png?v=' + portrait.imageSha256))
      const expected = ['stateFlag', 'stateName', 'clanCrest', 'bongwan', 'nobleTitle'].filter(key => portrait[key] !== null)
      assert.deepEqual([...figure.querySelectorAll('[data-identity-field]')].map(node => node.dataset.identityField), expected)
      assert.equal(figure.querySelector('[data-identity-field="nobleTitle"]'), null)
    }
    const iyen = page.host.querySelector('[data-person-id="person-1004"] .people-row-portrait')
    assert.equal(iyen.querySelector('[data-identity-field="stateFlag"]'), null)
    assert.equal(iyen.querySelector('[data-identity-field="clanCrest"]'), null)
    assert.equal(iyen.querySelector('[data-identity-field="bongwan"]'), null)
    const yura = portraitIdentities.find(row => row.personId === 'person-0399')
    assert.equal(yura.characterId, 'K398')
  } finally { await page.close(); sessionStorage.clear() }
})
