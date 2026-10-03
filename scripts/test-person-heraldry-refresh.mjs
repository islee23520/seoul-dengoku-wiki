// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, test, vi } from 'vitest'
import PersonDetailPage from '../src/pages/PersonDetailPage.tsx'

const json = path => JSON.parse(readFileSync(resolve(path), 'utf8'))
const originalDetail = json('public/person-details/person-0001.json')
const registry = json('public/heraldry-assets.json')
afterEach(() => vi.unstubAllGlobals())
async function mount({ delayed = false, delayedRegistry = false } = {}) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const root = createRoot(host)
  const requests = []
  const registryRequests = []
  let current = structuredClone(registry)
  let failDetail = false
  vi.stubGlobal('fetch', vi.fn(async url => {
    if (String(url).includes('heraldry-assets.json')) {
      if (delayedRegistry) return new Promise(resolve => registryRequests.push(resolve))
      return { ok: true, json: async () => current }
    }
    if (String(url).includes('person-details/person-0001.json')) {
      if (failDetail) return { ok: false, status: 503 }
      if (delayed) return new Promise(resolve => requests.push(detail => resolve({ ok: true, json: async () => detail })))
      return { ok: true, json: async () => structuredClone(originalDetail) }
    }
    return { ok: false, status: 404 }
  }))
  await act(async () => root.render(createElement(MemoryRouter, { initialEntries: ['/people/person-0001'] },
    createElement(Routes, null,
      createElement(Route, { path: '/people/:personId', element: createElement(PersonDetailPage) }),
      createElement(Route, { path: '/people', element: createElement('div', { 'data-list-redirect': true }) })))))
  return { host, requests, registryRequests, setRegistry: value => { current = value }, fail: () => { failDetail = true },
    focus: () => act(async () => window.dispatchEvent(new Event('focus'))),
    close: () => act(async () => root.unmount()) }
}
const basic = host => new Map([...host.querySelectorAll('.person-data-table tr')].map(row => [row.querySelector('th')?.textContent, row.querySelector('td')?.textContent]))

test('new focus supersedes a held registry response across the composed person aside', async () => {
  const page = await mount({ delayedRegistry: true })
  const response = value => ({ ok: true, json: async () => value })
  const snapshot = (state, clanId) => {
    const next = structuredClone(registry)
    next.people[originalDetail.id] = { ...next.people[originalDetail.id], state, stateName: state, clan: { id: clanId, name: clanId } }
    return next
  }
  const clans = Object.keys(registry.clans)
  let closed = false
  try {
    assert.equal(page.registryRequests.length, 1, 'shared consumers must use one mount request')
    await act(async () => page.registryRequests[0](response(registry)))
    const portrait = page.host.querySelector('.people-portrait').getAttribute('src')
    const permissions = page.host.querySelector('[data-person-permissions]')?.outerHTML
    await page.focus()
    await page.focus()
    assert.equal(page.registryRequests.length, 2, 'focus requests coalesce while pending')
    await act(async () => page.registryRequests[1](response(snapshot('S02', clans[0]))))
    assert.notEqual(basic(page.host).get('국가 ID'), 'S02', 'superseded response must not be published')
    assert.equal(page.registryRequests.length, 3, 'newest focus must start one queued refresh')
    await act(async () => page.registryRequests[2](response(snapshot('S03', clans[1]))))
    assert.equal(basic(page.host).get('국가 ID'), 'S03')
    assert.ok(page.host.querySelector('.wiki-article-header').textContent.includes('S03'))
    assert.ok(page.host.querySelector('[data-identity-field="stateFlag"] img').src.includes('S03.webp'))
    assert.equal(page.host.querySelector('.person-clan-line a').getAttribute('href'), '/families/' + clans[1])
    assert.equal(page.host.querySelector('[data-identity-field="clanCrest"]').getAttribute('href'), '/families/' + clans[1])
    assert.equal(page.host.querySelector('.people-portrait').getAttribute('src'), portrait)
    assert.equal(page.host.querySelector('[data-person-permissions]')?.outerHTML, permissions)
    await page.focus()
    await act(async () => page.registryRequests[3]({ ok: false, status: 503 }))
    assert.equal(basic(page.host).get('국가 ID'), 'S03')
    assert.ok(page.host.textContent.includes('소속·가문 정보 갱신 실패'))
    await page.focus()
    await page.focus()
    await page.close()
    closed = true
    await act(async () => page.registryRequests[4](response(snapshot('S02', clans[0]))))
    const count = page.registryRequests.length
    await page.focus()
    assert.equal(page.registryRequests.length, count, 'unmount removes listener and queued refresh')
  } finally {
    if (!closed) await page.close()
    await act(async () => page.registryRequests.forEach(resolve => resolve(response(registry))))
  }
})

test('one common revision drives detail header table and both clan displays without changing portrait', async () => {
  const page = await mount()
  try {
    const portrait = page.host.querySelector('.people-portrait').getAttribute('src')
    const next = structuredClone(registry)
    const clanId = Object.keys(next.clans).find(id => id !== originalDetail.clan.id)
    next.people[originalDetail.id] = { ...next.people[originalDetail.id], state: 'S02', stateName: '규격맹', clan: { id: clanId, name: '연결된 가문' } }
    page.setRegistry(next)
    await page.focus()
    assert.equal(basic(page.host).get('국가'), '규격맹')
    assert.equal(basic(page.host).get('국가 ID'), 'S02')
    assert.match(page.host.querySelector('.wiki-article-header').textContent, /규격맹/u)
    assert.equal(page.host.querySelector('.person-clan-line a').getAttribute('href'), '/families/' + clanId)
    assert.equal(page.host.querySelector('[data-identity-field="clanCrest"]').getAttribute('href'), '/families/' + clanId)
    assert.ok(page.host.querySelector('[data-identity-field="stateFlag"] img').src.includes('S02.webp'))
    assert.equal(page.host.querySelector('.people-portrait').getAttribute('src'), portrait)
  } finally { await page.close() }
})

test('a late initial detail response cannot overwrite the newer focus response', async () => {
  const page = await mount({ delayed: true })
  try {
    assert.equal(page.requests.length, 1)
    await page.focus()
    assert.equal(page.requests.length, 2)
    await act(async () => page.requests[1]({ ...originalDetail, title: 'newest response' }))
    assert.match(page.host.querySelector('.wiki-article-header').textContent, /newest response/u)
    await act(async () => page.requests[0]({ ...originalDetail, title: 'stale response' }))
    assert.match(page.host.querySelector('.wiki-article-header').textContent, /newest response/u)
    assert.doesNotMatch(page.host.querySelector('.wiki-article-header').textContent, /stale response/u)
  } finally { await page.close() }
})

test('background detail failure retains loaded person and reports failure instead of redirecting', async () => {
  const page = await mount()
  try {
    const portrait = page.host.querySelector('.people-portrait').getAttribute('src')
    page.fail()
    await page.focus()
    assert.equal(page.host.querySelector('[data-list-redirect]'), null)
    assert.equal(page.host.querySelector('h1').textContent, originalDetail.name)
    assert.ok([...page.host.querySelectorAll('[role="status"]')].some(node => node.textContent.includes('인물 정보 갱신 실패')))
    assert.equal(page.host.querySelector('.people-portrait').getAttribute('src'), portrait)
  } finally { await page.close() }
})
