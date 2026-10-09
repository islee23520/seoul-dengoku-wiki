// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { test, vi } from 'vitest'
import CharacterDraftPage from '../src/pages/CharacterDraftPage.tsx'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
import gurpsCast from '../vendor/issued-history/5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4.json'
import { createDraftLegacyStore } from '../src/pages/characterDraftExport'
import { LEGACY_REVISIONS } from '../src/data/original-trpg-options'

const repo = (name) => name === 'src/generated/peopleCatalog.ts' && process.env.DRAFT_GENERATED_CATALOG
  ? new URL('file://' + process.env.DRAFT_GENERATED_CATALOG)
  : new URL('../' + name, import.meta.url)

test('character draft route is public and stays distinct from issued person details', async () => {
  const app = await readFile(repo('src/App.tsx'), 'utf8')
  const page = await readFile(repo('src/pages/CharacterDraftPage.tsx'), 'utf8')
  const allowlist = JSON.parse(await readFile(repo('artifact-allowlist.json'), 'utf8'))
  assert.match(app, /path="\/people\/draft"/u)
  assert.ok(allowlist.routes.some(({ path, disposition }) => path === '/people/draft' && disposition === 'page'))
  assert.doesNotMatch(page, /sheet-local|issue-person-ids|localStorage|sessionStorage/u)
})

test.each(LEGACY_REVISIONS)('default mounted page loads and exports actual generated $revision without injected store', async ({ revision }) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const detail = JSON.parse(readFileSync(repo('public/person-details/person-1007.json'), 'utf8'))
  const variant = detail.personSheet.variants.find(item => item.revision === revision)
  const requests = []
  vi.stubGlobal('fetch', async (input, init) => {
    requests.push({ url: String(input), method: init?.method ?? 'GET' })
    return new Response(JSON.stringify(detail), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  const downloads = []
  const createUrl = URL.createObjectURL, revokeUrl = URL.revokeObjectURL
  const click = HTMLAnchorElement.prototype.click
  URL.createObjectURL = blob => { downloads.push(blob); return 'blob:generated-draft' }
  URL.revokeObjectURL = () => {}
  HTMLAnchorElement.prototype.click = function () {}
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  try {
    await act(async () => root.render(createElement(MemoryRouter, { initialEntries: [`/people/draft?person=${detail.id}`] }, createElement(CharacterDraftPage))))
    const button = [...host.querySelectorAll('button')].find(item => item.textContent === '초안 내보내기')
    assert.equal(button.disabled, true)
    assert.equal(requests.length, 0)
    const select = host.querySelector('select[aria-label="원본 개정"]')
    await act(async () => { select.value = revision; select.dispatchEvent(new Event('change', { bubbles: true })) })
    assert.equal(button.disabled, false)
    assert.equal(host.querySelector('input[aria-label="생일"]').value, detail.birthDate)
    assert.equal(host.querySelector('input[aria-label="인물 단계"]').value, detail.stage)
    await act(async () => button.click())
    assert.equal(downloads.length, 1)
    const exported = JSON.parse(await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(downloads[0])
    }))
    assert.equal(exported.revision, revision)
    assert.deepEqual(exported.legacy.person, variant.legacy.record)
    assert.deepEqual(exported.legacy.projection, variant)
    assert.deepEqual(exported.originalRatings.map(item => item.value), [null, null, null, null, null, null, null])
    assert.deepEqual(requests, [{ url: `${import.meta.env.BASE_URL}person-details/${detail.id}.json`, method: 'GET' }])
  } finally {
    await act(async () => root.unmount())
    host.remove()
    URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl
    HTMLAnchorElement.prototype.click = click
    vi.unstubAllGlobals()
  }
})

test('mounted draft export downloads the edit without canon writes or id issuance', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('crypto', webcrypto)
  const seeded = gurpsCast.people.find((person) => {
    const id = person.url?.split('/').at(-1)
    return id && peopleCatalog.some((entry) => entry.id === id && entry.name === person.name)
  })
  assert.ok(seeded)
  const personId = seeded.url.split('/').at(-1)
  const catalogEntry = peopleCatalog.find((entry) => entry.id === personId)
  const revision = LEGACY_REVISIONS[1].revision
  const legacyStore = await createDraftLegacyStore(new Map([[revision, readFileSync(repo('vendor/issued-history/5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4.json'), 'utf8')]]))
  const canonPaths = [
    'lore/name-pools/gurps-cast.json',
    'src/generated/peopleCatalog.ts',
    'src/pages/CharacterDraftPage.tsx',
    'src/pages/characterDraftExport.ts',
    'lore/name-pools/issue-person-ids.mjs',
  ]
  const canonBefore = new Map(canonPaths.map((path) => {
    const bytes = readFileSync(repo(path))
    return [path, { bytes, sha256: createHash('sha256').update(bytes).digest('hex') }]
  }))
  const storageBefore = {
    local: window.localStorage.length,
    session: window.sessionStorage.length,
  }
  const storageWrites = []
  const originalSetItem = Storage.prototype.setItem
  Storage.prototype.setItem = function recordStorageWrite(...args) {
    storageWrites.push(args)
    return originalSetItem.apply(this, args)
  }
  const writes = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const method = init?.method ?? 'GET'
    const url = String(input)
    if (method !== 'GET' || !url.endsWith(`/person-details/${personId}.json`)) writes.push({ kind: 'fetch', method, url })
    if (method !== 'GET') return new Response(null, { status: 405 })
    assert.equal(url.endsWith(`/person-details/${personId}.json`), true)
    return new Response(JSON.stringify({
      id: personId,
      name: catalogEntry.name,
      state: catalogEntry.state,
      rank: catalogEntry.rank,
      gender: catalogEntry.gender,
      occupation: catalogEntry.occupation,
      role: { display: catalogEntry.position },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const downloads = []
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalClick = HTMLAnchorElement.prototype.click
  URL.createObjectURL = (blob) => {
    downloads.push({ blob })
    return 'blob:draft-export'
  }
  URL.revokeObjectURL = (url) => {
    downloads.at(-1).revoked = url
  }
  HTMLAnchorElement.prototype.click = function recordDownload() {
    downloads.at(-1).href = this.href
    downloads.at(-1).download = this.download
  }
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  try {
    await act(async () => {
      root.render(createElement(MemoryRouter, { initialEntries: [`/people/draft?person=${personId}`] }, createElement(CharacterDraftPage, { legacyStore })))
    })
    const exportButton = [...host.querySelectorAll('button')].find((button) => button.textContent === '초안 내보내기')
    assert.equal(exportButton.disabled, true)
    const revisionSelect = host.querySelector('select[aria-label="원본 개정"]')
    await act(async () => {
      revisionSelect.value = revision
      revisionSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const name = host.querySelector('input[placeholder="이름 입력"]')
    assert.equal(name.value, catalogEntry.name)
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    valueSetter.call(name, '초안 수정 이름')
    await act(async () => {
      name.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const enter = async (label, value) => {
      const input = host.querySelector(`input[aria-label="${label}"]`)
      valueSetter.call(input, value)
      await act(async () => input.dispatchEvent(new Event('input', { bubbles: true })))
    }
    await enter('original.weapon 평가', '12')
    assert.equal(exportButton.disabled, true)
    await enter('original.weapon 세부 분야', 'authored weapon subdomain')
    await enter('original.weapon 기준', 'rubric:v1')
    await enter('original.weapon 근거', 'source:authored-assessment')
    await enter('합산 보정', '5')
    await enter('보정 근거', 'source:combined-effects')
    assert.equal(exportButton.disabled, true)
    await enter('합산 보정', '-4')
    await enter('배경', 'edited personal background')
    assert.equal(exportButton.disabled, false)
    await act(async () => {
      exportButton.click()
    })
    assert.equal(downloads.length, 1)
    assert.equal(downloads[0].href, 'blob:draft-export')
    assert.equal(downloads[0].download, 'character-original-draft.json')
    assert.equal(downloads[0].revoked, 'blob:draft-export')
    assert.equal(downloads[0].blob.type, 'application/json')
    const exported = JSON.parse(await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(downloads[0].blob)
    }))
    assert.equal(exported.personId, personId)
    assert.equal(exported.personal.name, '초안 수정 이름')
    assert.deepEqual(exported.legacy.person, seeded)
    assert.equal(exported.revision, revision)
    assert.equal(exported.rulesVersion, 'seoul.opposed-d10.v1')
    assert.deepEqual(exported.originalRatings.map(item => item.value), [null, null, null, null, null, null, 12])
    assert.equal(exported.originalRatings[6].subdomain, 'authored weapon subdomain')
    assert.deepEqual(exported.originalRatings[6].evidenceRefs, ['source:authored-assessment'])
    assert.equal(exported.personal.selectedBackground, 'edited personal background')
    assert.equal(exported.combinedModifier.value, -4)
    assert.equal(exported.reviewState, 'proposal')
    for (const field of ['aiKey', 'aiModel', 'aiGenerating', 'aiMessage']) assert.equal(Object.hasOwn(exported, field), false)
    assert.deepEqual(writes, [])
    assert.deepEqual(storageWrites, [])
    assert.deepEqual({ local: window.localStorage.length, session: window.sessionStorage.length }, storageBefore)
    for (const [path, before] of canonBefore) {
      const bytes = readFileSync(repo(path))
      assert.equal(createHash('sha256').update(bytes).digest('hex'), before.sha256)
      assert.deepEqual([...bytes], [...before.bytes])
    }
    await act(async () => {
      revisionSelect.value = LEGACY_REVISIONS[0].revision
      revisionSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    assert.equal(exportButton.disabled, true)
    assert.ok(host.querySelector('[role="alert"]').textContent.includes('E_VERSION_STORE_BINDING'))
    assert.equal(host.querySelector('details'), null)
    await act(async () => exportButton.click())
    assert.equal(downloads.length, 1)
  } finally {
    await act(async () => root.unmount())
    host.remove()
    Storage.prototype.setItem = originalSetItem
    globalThis.fetch = originalFetch
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    HTMLAnchorElement.prototype.click = originalClick
    vi.unstubAllGlobals()
  }
})
