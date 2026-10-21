// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, test, vi } from 'vitest'
import { portraitSourceCatalog as portraitCatalog } from '../src/generated/portraitSourceCatalog.ts'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
import PortraitPromptPanel from '../src/pages/PortraitPromptPanel.tsx'
import { fetchPortraitToken, portraitPromptApiUrl, portraitTokenApiUrl, portraitTokenStaticUrl } from '../src/portraitTokenApi.ts'

afterEach(() => vi.unstubAllGlobals())

test('API JSON wins over static fallback and URL components are encoded', async () => {
  const token = { personId: 'person-0001' }
  const request = vi.fn(async () => new Response(JSON.stringify(token), { headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', request)
  assert.deepEqual(await fetchPortraitToken(token.personId), token)
  assert.equal(request.mock.calls.length, 1)
  assert.equal(request.mock.calls[0][0], portraitTokenApiUrl(token.personId))
  assert.ok(portraitTokenApiUrl('id/with space').endsWith('/id%2Fwith%20space'))
  assert.ok(portraitPromptApiUrl('id', 'front view', 'text').endsWith('/id/prompt?view=front%20view&format=text'))
})

for (const failure of ['spa-shell', 'http-error', 'network-error']) test(`API ${failure} falls back to the published static token`, async () => {
  const token = { personId: 'person-0001' }
  const request = vi.fn().mockImplementationOnce(async () => {
    if (failure === 'network-error') throw new TypeError('offline')
    return new Response('<html></html>', { status: failure === 'http-error' ? 503 : 200, headers: { 'content-type': 'text/html' } })
  }).mockResolvedValueOnce(new Response(JSON.stringify(token)))
  vi.stubGlobal('fetch', request)
  assert.deepEqual(await fetchPortraitToken(token.personId), token)
  assert.equal(request.mock.calls.length, 2)
  assert.equal(request.mock.calls[1][0], portraitTokenStaticUrl(token.personId))
})

test('aborting an API request rejects without attempting static fallback', async () => {
  const controller = new AbortController()
  const request = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }))
  vi.stubGlobal('fetch', request)
  const pending = fetchPortraitToken('person-0001', controller.signal)
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  controller.abort()
  await rejected
  assert.equal(request.mock.calls.length, 1)
})

test('an identity without a portrait can load derived prompts and switch views', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const person = peopleCatalog.find(row => !portraitCatalog.entries.some(entry => entry.personId === row.id))
  assert.ok(person)
  const token = {
    personId: person.id, characterId: person.characterId, name: person.name, approval: 'art-proposal',
    facts: { gender: person.gender, role: null },
    artProposal: { face: 'face', hair: 'hair', upper: 'upper', lower: 'lower', footwear: 'footwear' },
    style: { referenceSha256: null, portraitShotId: 'medium-close-up-119' },
    textToImage: { model: 'test-model', views: {
      portrait: { size: '1024x1536', prompt: 'portrait-sentinel', negativePrompt: 'negative-sentinel' },
      front: { size: '1024x1536', prompt: 'front-sentinel', negativePrompt: 'front-negative-sentinel' },
    } },
  }
  const request = vi.fn(async () => new Response(JSON.stringify(token), { headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', request)
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [`/tools/character-art?person=${person.id}`] }, createElement(PortraitPromptPanel))))
    assert.equal(host.querySelector('select').value, person.id)
    assert.equal(host.querySelector('button').disabled, false)
    assert.equal(host.querySelector('[role=alert]'), null)
    assert.ok([...host.querySelectorAll('pre')].some(node => node.textContent === token.textToImage.views.portrait.prompt))
    assert.ok(host.querySelector(`a[href="${portraitTokenApiUrl(person.id)}"]`))
    await act(async () => {
      const view = host.querySelectorAll('select')[1]
      view.value = 'front'
      view.dispatchEvent(new Event('change', { bubbles: true }))
    })
    assert.ok([...host.querySelectorAll('pre')].some(node => node.textContent === token.textToImage.views.front.prompt))
    assert.ok(host.querySelector(`a[href="${portraitPromptApiUrl(person.id, 'front')}"]`))
  } finally { await act(async () => root.unmount()) }
})
