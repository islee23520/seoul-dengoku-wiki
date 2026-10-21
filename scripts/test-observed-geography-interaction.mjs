// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { test, vi } from 'vitest'
import GeographyPage from '../src/pages/GeographyPage.tsx'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// This excluded reference surface is not a published asset. Exercise its actual
// producer in memory rather than requiring a forbidden public JSON file.
const producerUrl = pathToFileURL(resolve('scripts/seoul-observed-geography.mjs')).href
const { stdout: observedBytes } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e',
  `import { buildObservedGeography, readObservedSources } from ${JSON.stringify(producerUrl)}; console.log(JSON.stringify(buildObservedGeography(await readObservedSources())));`], { maxBuffer: 32 * 1024 * 1024 })
const observedFixture = JSON.parse(observedBytes)

function nextMutation(host, predicate) {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (predicate()) { observer.disconnect(); clearTimeout(deadline); resolve() }
    })
    const deadline = setTimeout(() => { observer.disconnect(); reject(new Error('Expected DOM state was not rendered')) }, 5000)
    observer.observe(host, { subtree: true, childList: true, attributes: true, characterData: true })
  })
}

async function mount() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(GeographyPage))))
  return { host, async close() { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals() } }
}

test('real React county click, Enter, Space and select share selection; slots never become map targets', async () => {
  const data = structuredClone(observedFixture)
  let deliver
  const fetch = vi.fn(() => new Promise(resolve => { deliver = resolve }))
  vi.stubGlobal('fetch', fetch)
  const { host, close } = await mount()
  try {
    assert.ok(host.querySelector('[role="status"]'))
    assert.equal(host.querySelector('[data-geography-status]').dataset.geographyStatus, 'loading')
    const loaded = nextMutation(host, () => host.querySelector('[data-geography-status="ready"]'))
    await act(async () => { deliver({ ok: true, json: async () => data }) })
    await loaded
    assert.equal(host.querySelectorAll('svg path').length, data.counties.length)
    assert.equal(fetch.mock.calls.length, 1)
    assert.equal(fetch.mock.calls[0][0], `${import.meta.env.BASE_URL}seoul-observed-geography.json`)
    assert.equal(host.querySelector('svg').getAttribute('viewBox'), '0 0 1000 1000')
    assert.equal(host.querySelectorAll('svg [role="button"]').length, data.counties.length)
    assert.equal(host.querySelectorAll('[data-slot-id]').length, 0)
    assert.equal(host.querySelectorAll('.geography-sources a').length, data.sources.length)
    for (const [index, trigger] of ['click', 'Enter', ' ', 'select'].entries()) {
      const county = data.counties[index]
      const path = [...host.querySelectorAll('svg path')].find(path => path.dataset.countyId === county.id)
      const changed = nextMutation(host, () => host.querySelector('#geography-detail-title').textContent === county.name)
      await act(async () => {
        if (trigger === 'select') {
          const select = host.querySelector('select'); select.value = county.id
          select.dispatchEvent(new Event('change', { bubbles: true }))
        } else path.dispatchEvent(trigger === 'click' ? new MouseEvent('click', { bubbles: true }) : new KeyboardEvent('keydown', { key: trigger, bubbles: true, cancelable: true }))
      })
      await changed
      assert.equal(host.querySelector('select').value, county.id)
      assert.equal(path.getAttribute('aria-pressed'), 'true')
      assert.equal(host.querySelectorAll('svg [aria-pressed="true"]').length, 1)
      assert.deepEqual([...host.querySelectorAll('[data-slot-id]')].map(slot => slot.dataset.slotId), county.slots.map(slot => slot.id))
      assert.equal(host.querySelectorAll('svg [data-slot-id], svg [data-dong-id]').length, 0)
    }
    assert.ok(fetch.mock.calls.every(([url]) => url.endsWith('seoul-observed-geography.json')))
  } finally { await close() }
})

test.each(['http', 'network', 'schema', 'edition', 'shape'])('load failure %s is visible and retry renders actual geography', async failure => {
  const data = structuredClone(observedFixture)
  const fetch = vi.fn()
  if (failure === 'network') fetch.mockRejectedValueOnce(new Error('offline'))
  else fetch.mockResolvedValueOnce({ ok: failure !== 'http', status: 503, json: async () => failure === 'schema' ? { ...data, schema: 'unexpected' } : failure === 'edition' ? { ...data, sourceEdition: 'sgis-20260101' } : failure === 'shape' ? { ...data, counties: null } : data })
  fetch.mockResolvedValueOnce({ ok: true, json: async () => data })
  vi.stubGlobal('fetch', fetch)
  const { host, close } = await mount()
  try {
    assert.ok(host.querySelector('[role="alert"]'))
    assert.equal(host.querySelector('[data-geography-status]').dataset.geographyStatus, 'error')
    assert.equal(host.querySelector('svg'), null)
    const loaded = nextMutation(host, () => host.querySelectorAll('svg path').length === data.counties.length)
    await act(async () => { host.querySelector('button').click() })
    await loaded
    assert.equal(host.querySelector('[role="alert"]'), null)
    assert.equal(fetch.mock.calls.length, 2)
  } finally { await close() }
})

test('split slots preserve fragment identity only in detail and unmount aborts the request', async () => {
  const data = structuredClone(observedFixture)
  const county = data.counties[0]
  data.counties = [{ ...county, slots: [{ ...county.slots[0], fragmentId: 'fragment-fixture' }] }]
  const fetch = vi.fn(async () => ({ ok: true, json: async () => data }))
  vi.stubGlobal('fetch', fetch)
  const { host, close } = await mount()
  try {
    const changed = nextMutation(host, () => host.querySelector('[data-slot-id]'))
    await act(async () => host.querySelector('svg path').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    await changed
    assert.ok([...host.querySelectorAll('dd')].some(element => element.textContent === 'fragment-fixture'))
    assert.equal(host.querySelectorAll('svg path').length, 1)
  } finally { const signal = fetch.mock.calls[0][1].signal; await close(); assert.equal(signal.aborted, true) }
})
