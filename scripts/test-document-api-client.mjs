import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createDocumentController, fetchWikiDocument } from '../src/documentApi.ts'

const document = (slug = 'Example', locale = 'ko') => ({
  title: `DB ${slug}`, route: `${locale === 'en' ? '/en' : ''}/world/${slug === 'index' ? '' : slug}`,
  blocks: [{ type: 'paragraph', children: [{ type: 'text', value: 'Database body' }] }], reviewText: 'Database body',
})
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

test('fetches only the fixed world endpoint and accepts the database document in either locale and index', async () => {
  for (const [slug, locale] of [['Example', 'ko'], ['서울', 'en'], ['index', 'ko'], ['index', 'en']]) {
    const abort = new AbortController()
    const result = await fetchWikiDocument(slug, locale, { signal: abort.signal, fetcher: async (url, init) => {
      assert.equal(url, `/wiki/api/documents/world/${encodeURIComponent(slug)}?locale=${locale}`)
      assert.equal(init.signal, abort.signal)
      assert.equal(init.method, 'GET')
      assert.equal(init.headers.accept, 'application/json')
      return json(document(slug, locale))
    } })
    assert.deepEqual(result, document(slug, locale))
  }
})

test('rejects arbitrary paths before issuing a fetch', async () => {
  for (const slug of ['../Example', 'https://other/Example', 'Example?locale=en', 'Example/Other', '%2e%2e', '']) {
    await assert.rejects(fetchWikiDocument(slug, 'ko', { fetcher: () => assert.fail('must not fetch') }), /Invalid document selector/)
  }
})

test('accepts Markdown unordered lists whose start is null', async () => {
  const value = { ...document(), blocks: [{ type: 'list', ordered: false, start: null,
    children: [{ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'item' }] }] }] }] }
  assert.deepEqual(await fetchWikiDocument('Example', 'ko', { fetcher: async () => json(value) }), value)
})

test('only an actual JSON 404 is not found; service and transport failures remain errors', async () => {
  assert.equal(await fetchWikiDocument('Example', 'ko', { fetcher: async () => json({ error: 'Not found' }, 404) }), null)
  await assert.rejects(fetchWikiDocument('Example', 'ko', { fetcher: async () => json({ error: 'Documents unavailable' }, 503) }), /503/)
  await assert.rejects(fetchWikiDocument('Example', 'ko', { fetcher: async () => { throw new TypeError('network unavailable') } }), /network unavailable/)
})

test('rejects HTML fallback, deceptive content types, malformed JSON and invalid document shapes', async () => {
  for (const response of [
    new Response('<html>SPA fallback</html>', { headers: { 'content-type': 'text/html' } }),
    new Response('{}', { headers: { 'content-type': 'application/jsonp' } }),
    new Response('{', { headers: { 'content-type': 'application/json' } }),
    json(null), json({ ...document(), title: '' }), json({ ...document(), route: '/world/Other' }),
    json({ ...document(), route: '/en/world/Example' }), json({ ...document(), reviewText: null }),
    json({ ...document(), blocks: [null] }), json({ ...document(), blocks: [{ type: 'paragraph', children: [{}] }] }),
    json({ ...document(), blocks: [{ type: 'text', value: {} }] }),
  ]) await assert.rejects(fetchWikiDocument('Example', 'ko', { fetcher: async () => response }))
})

test('new slug aborts the old request and ignores its late response even if fetch ignores abort', async () => {
  const pending = [], states = []
  const controller = createDocumentController((state) => states.push(state), (_url, init) => new Promise((resolve) => pending.push({ resolve, signal: init.signal })))
  const old = controller.load('Old', 'ko')
  const next = controller.load('New', 'ko')
  assert.equal(pending[0].signal.aborted, true)
  assert.deepEqual(states.at(-1), { slug: 'New', locale: 'ko', status: 'loading' })
  pending[1].resolve(json(document('New')))
  await next
  pending[0].resolve(json(document('Old')))
  await old
  assert.equal(states.at(-1).document.title, 'DB New')
  assert.deepEqual(states.map((state) => state.status), ['loading', 'loading', 'ready'])
})

test('locale changes and repeated same-slug requests reject stale responses by request identity', async () => {
  const pending = [], states = []
  const controller = createDocumentController((state) => states.push(state), () => new Promise((resolve) => pending.push(resolve)))
  const first = controller.load('Example', 'ko')
  const second = controller.load('Example', 'en')
  const third = controller.load('Example', 'ko')
  pending[2](json(document()))
  await third
  pending[1](json(document('Example', 'en')))
  pending[0](json({ error: 'Not found' }, 404))
  await Promise.all([first, second])
  assert.equal(states.at(-1).locale, 'ko')
  assert.deepEqual(states.map((state) => state.status), ['loading', 'loading', 'loading', 'ready'])
})

test('dispose aborts pending work and suppresses its abort rejection', async () => {
  let rejectFetch, signal
  const states = []
  const controller = createDocumentController((state) => states.push(state), (_url, init) => new Promise((_resolve, reject) => { rejectFetch = reject; signal = init.signal }))
  const load = controller.load('Example', 'ko')
  controller.dispose()
  assert.equal(signal.aborted, true)
  rejectFetch(new DOMException('Aborted', 'AbortError'))
  await load
  assert.deepEqual(states.map((state) => state.status), ['loading'])
})

test('controller publishes distinct not-found and error states from real response statuses', async () => {
  for (const [status, expected] of [[404, 'not-found'], [503, 'error']]) {
    const states = []
    const controller = createDocumentController((state) => states.push(state), async () => json({ error: 'Unavailable' }, status))
    await controller.load('Example', 'ko')
    assert.deepEqual(states.map((state) => state.status), ['loading', expected])
  }
})
