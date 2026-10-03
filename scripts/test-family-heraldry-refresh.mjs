// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { test, vi } from 'vitest'
import FamilyDetailPage from '../src/pages/FamilyDetailPage.tsx'

test('current family membership and state labels follow common JSON after focus refresh', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const root = createRoot(host)
  let registry = JSON.parse(readFileSync(resolve('public/heraldry-assets.json'), 'utf8'))
  const clanId = registry.people['person-0001'].clan.id
  const newcomerId = Object.keys(registry.people).find(id => registry.people[id].clan?.id !== clanId)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => registry })))
  const memberLink = id => host.querySelector(`tbody a[href="/people/${id}"]`)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: ['/families/' + clanId] },
      createElement(Routes, null, createElement(Route, { path: '/families/:clanId', element: createElement(FamilyDetailPage) })))))
    assert.ok(memberLink('person-0001'))
    registry = structuredClone(registry)
    registry.people['person-0001'].stateName = '갱신된 소속'
    registry.clans[clanId].sha256 = 'a'.repeat(64)
    await act(async () => window.dispatchEvent(new Event('focus')))
    assert.ok(memberLink('person-0001').closest('tr').textContent.includes('갱신된 소속'))
    assert.ok(host.querySelector('.wiki-header img').src.endsWith('?v=' + 'a'.repeat(64)))
    registry = structuredClone(registry)
    registry.people['person-0001'].clan = null
    registry.people[newcomerId].clan = { id: clanId, name: '기존 가문' }
    await act(async () => window.dispatchEvent(new Event('focus')))
    assert.equal(memberLink('person-0001'), null)
    assert.ok(memberLink(newcomerId))
    assert.equal(host.querySelectorAll('tbody tr').length, Object.values(registry.people).filter(person => person.clan?.id === clanId).length)
  } finally { await act(async () => root.unmount()); vi.unstubAllGlobals() }
})
