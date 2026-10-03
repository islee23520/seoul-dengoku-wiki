// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, test, vi } from 'vitest'
import { StateFlag } from '../src/components/StateFlag.tsx'
import { ClanCrest } from '../src/components/ClanCrest.tsx'

const originalFetch = globalThis.fetch
const registry = (states = {}, clans = {}) => ({ schemaVersion: 1, states, clans, people: {} })
const flag = { path: 'state-flags/S01.webp', sha256: 'a'.repeat(64) }
const crest = { path: 'clan-crests/known.svg', sha256: 'b'.repeat(64) }

afterEach(() => { vi.unstubAllGlobals(); globalThis.fetch = originalFetch })

async function mount(element, initial) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  let snapshot = initial
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => snapshot })))
  const host = document.createElement('div')
  const root = createRoot(host)
  await act(async () => root.render(element))
  return {
    host,
    update: async next => { snapshot = next; await act(async () => window.dispatchEvent(new Event('focus'))) },
    failRegistry: async () => {
      globalThis.fetch.mockImplementationOnce(async () => ({ ok: false, status: 503 }))
      await act(async () => window.dispatchEvent(new Event('focus')))
    },
    close: async () => act(async () => root.unmount()),
  }
}

test('broken existing flag and crest display load failures, then recover after a new revision loads', async () => {
  const page = await mount(createElement('div', null,
    createElement(StateFlag, { stateId: 'S01', title: '수문국 국기' }),
    createElement(ClanCrest, { clanId: 'known', title: '시험 가문 문장' })), registry({ S01: flag }, { known: crest }))
  try {
    const originalFlag = page.host.querySelector('.state-flag')
    const originalCrest = page.host.querySelector('img:not(.state-flag)')
    assert.ok(originalFlag)
    assert.ok(originalCrest)
    await act(async () => {
      originalFlag.dispatchEvent(new Event('error'))
      originalCrest.dispatchEvent(new Event('error'))
    })
    assert.ok(originalFlag.hidden)
    assert.ok(originalCrest.hidden)
    assert.match(page.host.textContent, /국기 불러오기 실패/u)
    assert.match(page.host.textContent, /가문 문장 불러오기 실패/u)
    await page.update(registry({ S01: flag }, { known: crest }))
    assert.ok(page.host.querySelector('.state-flag').hidden)
    assert.ok(page.host.querySelector('img:not(.state-flag)').hidden)
    assert.match(page.host.textContent, /국기 불러오기 실패/u)
    assert.match(page.host.textContent, /가문 문장 불러오기 실패/u)
    const revisedFlag = { ...flag, sha256: 'c'.repeat(64) }
    const revisedCrest = { path: 'clan-crests/revised.svg', sha256: 'd'.repeat(64) }
    await page.update(registry({ S01: revisedFlag }, { known: revisedCrest }))
    const newFlag = page.host.querySelector('.state-flag')
    const newCrest = page.host.querySelector('img:not(.state-flag)')
    assert.ok(newFlag)
    assert.ok(newCrest)
    assert.notEqual(newFlag, originalFlag)
    assert.notEqual(newCrest, originalCrest)
    assert.ok(newFlag.getAttribute('src').endsWith('?v=' + revisedFlag.sha256))
    assert.ok(newCrest.getAttribute('src').endsWith('revised.svg?v=' + revisedCrest.sha256))
    assert.equal(newFlag.hidden, false)
    assert.equal(newCrest.hidden, false)
    assert.doesNotMatch(page.host.textContent, /불러오기 실패/u)
    await act(async () => { newFlag.dispatchEvent(new Event('load')); newCrest.dispatchEvent(new Event('load')) })
    assert.doesNotMatch(page.host.textContent, /불러오기 실패/u)
    assert.equal(newFlag.hidden, false)
    assert.equal(newCrest.hidden, false)
  } finally { await page.close() }
})

test('missing valid state and unknown clan show explicit unset without inventing a flag', async () => {
  const page = await mount(createElement('div', null,
    createElement(StateFlag, { stateId: 'S01' }),
    createElement(ClanCrest, { clanId: 'absent', title: '없는 가문 문장' })), registry({ S02: flag }))
  try {
    assert.equal(page.host.querySelectorAll('img').length, 0)
    assert.ok(page.host.querySelector('[data-heraldry-unset="state"]'))
    assert.ok(page.host.querySelector('[data-heraldry-unset="clan"]'))
    assert.doesNotMatch(page.host.textContent, /불러오기 실패/u)
  } finally { await page.close() }
})

test('S00 and unknown states never render a substituted or rogue registry flag', async () => {
  const page = await mount(createElement('div', null,
    createElement(StateFlag, { stateId: 'S00' }),
    createElement(StateFlag, { stateId: 'S99' })), registry({ S00: flag, S01: flag, S99: flag }))
  try {
    assert.equal(page.host.querySelectorAll('img').length, 0)
    assert.equal(page.host.querySelectorAll('[data-heraldry-unset="state"]').length, 0)
  } finally { await page.close() }
})

test('loading the failed URL clears the failure without changing its revision', async () => {
  const page = await mount(createElement('div', null,
    createElement(StateFlag, { stateId: 'S01' }),
    createElement(ClanCrest, { clanId: 'known', title: '시험 가문 문장' })), registry({ S01: flag }, { known: crest }))
  try {
    const [stateImage, clanImage] = page.host.querySelectorAll('img')
    await act(async () => { stateImage.dispatchEvent(new Event('error')); clanImage.dispatchEvent(new Event('error')) })
    assert.ok(stateImage.hidden && clanImage.hidden)
    await act(async () => { stateImage.dispatchEvent(new Event('load')); clanImage.dispatchEvent(new Event('load')) })
    assert.equal(stateImage.hidden, false)
    assert.equal(clanImage.hidden, false)
    assert.doesNotMatch(page.host.textContent, /불러오기 실패/u)
  } finally { await page.close() }
})

test('registry fetch failure remains explicit beside the last good image', async () => {
  const page = await mount(createElement('div', null,
    createElement(StateFlag, { stateId: 'S01' }),
    createElement(ClanCrest, { clanId: 'known', title: '시험 가문 문장' })), registry({ S01: flag }, { known: crest }))
  try {
    await page.failRegistry()
    assert.equal(page.host.querySelectorAll('img').length, 2)
    assert.match(page.host.textContent, /국기 갱신 실패/u)
    assert.match(page.host.textContent, /가문 문장 갱신 실패/u)
  } finally { await page.close() }
})
