import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { configuredVersionStore, createCharacterServer } from './mcp-character-server.mjs'
import { candidate, createVersionStore, REVISIONS, RULES_VERSION } from './original-character-api.mjs'
const runner = process.env.ORIGINAL_API_NODE_TEST === '1' ? await import('node:test') : await import('vitest')
const test = process.env.ORIGINAL_API_NODE_TEST === '1'
  ? (name, body, timeout = 30000) => runner.test(name, { timeout }, body) : runner.test
const run = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const baseline = JSON.parse(await readFile(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
// Read existing immutable Git objects in memory, never copy or rewrite a ledger.
const sources = new Map(await Promise.all(REVISIONS.map(async revision => {
  const args = process.env.ORIGINAL_API_SOURCE_GIT_DIR ? ['--git-dir=' + process.env.ORIGINAL_API_SOURCE_GIT_DIR, '--work-tree=' + root] : []
  const { stdout } = await run('git', [...args, 'show', `${revision}:lore/name-pools/gurps-cast.json`], { cwd: root, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 })
  assert.equal(hash(stdout), baseline.revisions[revision].ledgerSha256)
  return [revision, stdout]
})))
const store = createVersionStore(sources)
const revision = REVISIONS[0]
const source = { revision, ref: 'author-test:explicit-rating-proposal', reviewState: 'unreviewed' }
const proposal = () => ({ schema: 'original-character-candidate.v1', revision, audience: 'author-private',
  identity: { id: 'candidate:test-person', name: '직접 시험 후보' }, source: structuredClone(source),
  originalRatings: { rulesVersion: RULES_VERSION, reviewState: 'unreviewed', source: structuredClone(source),
    ratings: { 'original.test-skill': { value: 0, source: structuredClone(source), reviewState: 'unreviewed' },
      'original.unassigned': { value: null, source: structuredClone(source), reviewState: 'unreviewed' } }, combinedModifier: 0 } })

async function live(options, body) {
  const server = createCharacterServer(options)
  const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) })
  server.listen(0, '127.0.0.1')
  await listening
  const address = `http://127.0.0.1:${server.address().port}`
  const request = async (path, init = {}) => {
    const response = await fetch(address + path, { ...init, signal: AbortSignal.timeout(5000) })
    return { status: response.status, body: response.status === 204 ? null : await response.json(), headers: response.headers }
  }
  try { await body(request) } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) })
    server.close()
    server.closeAllConnections()
    await closed
  }
}
const pathFor = (path, selected = revision) => path + '?revision=' + selected
const json = (value, method = 'POST') => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) })

test('sealed version store rejects missing, swapped and tampered revisions and snapshots input bytes', () => {
  assert.throws(() => createVersionStore(), /E_VERSION_STORE_BINDING/)
  assert.throws(() => createVersionStore(new Map([[revision, sources.get(revision)]])), /E_VERSION_STORE_BINDING/)
  const swapped = new Map(REVISIONS.map((id, i) => [id, sources.get(REVISIONS[1 - i])]))
  assert.throws(() => createVersionStore(swapped), /E_SOURCE_HASH/)
  const changed = new Map(sources)
  changed.set(revision, Buffer.concat([sources.get(revision), Buffer.from('\n')]))
  assert.throws(() => createVersionStore(changed), /E_SOURCE_HASH/)
  const inputs = new Map([...sources].map(([id, bytes]) => [id, Buffer.from(bytes)]))
  const snapshot = createVersionStore(inputs)
  inputs.get(revision).fill(0)
  assert.deepEqual(snapshot.read(revision), JSON.parse(sources.get(revision)))
  const returned = snapshot.read(revision)
  returned.people[0].attributes = null
  assert.deepEqual(snapshot.read(revision), JSON.parse(sources.get(revision)))
  for (const invalid of [undefined, null, '', 'latest', REVISIONS[0].slice(0, 8)]) assert.throws(() => snapshot.read(invalid), /E_EXPLICIT_REVISION/)
})

test('real HTTP reads preserve every person, route, legacy number and citation in both revisions', async () => {
  const ledgerPath = new URL('../lore/name-pools/gurps-cast.json', import.meta.url)
  const before = await readFile(ledgerPath)
  await live({ versionStore: store }, async request => {
    for (const selected of REVISIONS) {
      const original = JSON.parse(sources.get(selected))
      const listed = await request(pathFor('/api/characters', selected))
      assert.equal(listed.status, 200)
      assert.equal(listed.body.count, original.people.length)
      assert.equal(listed.body.operativeRatings, null)
      assert.equal(listed.body.legacyOperative, false)
      assert.equal(listed.headers.get('access-control-allow-origin'), null)
      assert.equal(listed.headers.get('cache-control'), 'no-store')
      assert.equal(listed.headers.get('x-character-audience'), 'author-private')
      assert.deepEqual(listed.body.characters.map(x => [x.id, x.url, x.name]), original.people.map(x => [x.id, x.url, x.name]))
      for (const person of original.people) {
        const result = await request(pathFor('/api/characters/' + person.id + '/sheet', selected))
        assert.equal(result.status, 200, person.id)
        assert.equal(result.body.revision, selected)
        assert.equal(result.body.originalRatings, null)
        assert.deepEqual(result.body.legacy, person, selected + ':' + person.id)
        for (const key of ['network', 'truth', 'stagedDeath', 'coercion', 'attributes', 'cp']) assert.equal(Object.hasOwn(result.body, key), false)
      }
      for (const id of ['K088', 'K998', 'K1003', 'K1018', 'K1020', 'K1021', 'K1022']) {
        const person = original.people.find(x => x.id === id)
        const byId = await request(pathFor('/api/characters/' + id, selected))
        const byUrl = await request(pathFor('/api/characters/' + person.url.split('/').pop(), selected))
        assert.equal(byId.status, 200)
        assert.equal(byUrl.status, 200)
        assert.deepEqual(byUrl.body, byId.body)
        assert.deepEqual(byId.body.legacy, person)
      }
      const iq25 = await request(pathFor('/api/characters/K1018/sheet', selected))
      assert.equal(iq25.body.legacy.attributes.IQ.value, 25)
    }
    for (const invalid of ['person-99999', 'person-1003-extra', 'K1003/sheet/extra']) assert.equal((await request(pathFor('/api/characters/' + invalid))).status, 404)
  })
  assert.deepEqual(await readFile(ledgerPath), before)
  for (const [id, bytes] of sources) assert.equal(hash(bytes), baseline.revisions[id].ledgerSha256)
}, 120000)

test('real HTTP authoring returns usable unreviewed candidates without changing historical sheets', async () => {
  const before = await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url))
  await live({ versionStore: store }, async request => {
    const input = proposal()
    const created = await request(pathFor('/api/characters'), json(input))
    assert.equal(created.status, 201)
    assert.equal(created.body.created, false)
    assert.equal(created.body.persisted, false)
    assert.match(created.body.candidate.candidateId, /^sha256:[a-f0-9]{64}$/u)
    assert.equal(created.body.candidate.reviewState, 'unreviewed')
    assert.equal(created.body.candidate.operative, false)
    assert.deepEqual(created.body.candidate.originalRatings, input.originalRatings)
    assert.equal((await request(pathFor('/api/characters'), json(input))).body.candidate.candidateId, created.body.candidate.candidateId)
    assert.equal((await request(pathFor('/api/characters/candidate:test-person'))).status, 404)
    const existing = store.read(revision).people.find(x => x.id === 'K1018')
    for (const method of ['PATCH', 'PUT']) {
      input.identity = { id: existing.id, name: existing.name }
      input.originalRatings.ratings['original.test-skill'].value = 12
      input.originalRatings.combinedModifier = -4
      const updated = await request(pathFor('/api/characters/' + existing.url.split('/').pop()), json(input, method))
      assert.equal(updated.status, 200)
      assert.equal(updated.body.updated, false)
      assert.equal(updated.body.candidate.originalRatings.ratings['original.test-skill'].value, 12)
      assert.deepEqual((await request(pathFor('/api/characters/K1018/sheet'))).body.legacy, existing)
    }
    const batch = { revision, audience: 'author-private', candidates: [proposal()] }
    const generated = await request(pathFor('/api/settlements/test/generate-npcs'), json(batch))
    assert.equal(generated.status, 200)
    assert.equal(generated.body.candidates.length, 1)
    assert.equal(generated.body.populationEffect, 0)
    for (const key of ['population', 'npc_count', 'npcs', 'unit_eligibility', 'martial', 'cp', 'attributes']) assert.equal(Object.hasOwn(generated.body, key), false)
    batch.candidates = []
    assert.deepEqual((await request(pathFor('/api/settlements/test/generate-npcs'), json(batch))).body.candidates, [])
    batch.candidates = [proposal(), proposal()]
    assert.equal((await request(pathFor('/api/settlements/test/generate-npcs'), json(batch))).status, 409)
    batch.population = 0
    assert.equal((await request(pathFor('/api/settlements/test/generate-npcs'), json(batch))).status, 400)
    assert.equal((await request(pathFor('/api/settlements/test/npcs'))).status, 200)
  })
  assert.deepEqual(await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url)), before)
})

const mutations = [
  ['null body', () => null], ['array body', () => []],
  ['implicit revision', x => { delete x.revision }], ['different revision', x => { x.revision = REVISIONS[1] }],
  ['legacy replacement', x => { x.attributes = { IQ: 25 } }], ['legacy CP', x => { x.cp = 445 }],
  ['private world fact', x => { x.truth = 'invented' }], ['observer export', x => { x.audience = 'observer' }],
  ['missing provenance', x => { delete x.source }], ['null provenance', x => { x.source = null }],
  ['empty source', x => { x.source.ref = '' }], ['source revision mismatch', x => { x.source.revision = REVISIONS[1] }],
  ['source self approval', x => { x.source.reviewState = 'approved' }], ['fake approval', x => { x.originalRatings.reviewState = 'approved' }],
  ['legacy namespace', x => { x.originalRatings.ratings.ST = x.originalRatings.ratings['original.test-skill'] }],
  ['missing rating source', x => { delete x.originalRatings.ratings['original.test-skill'].source }],
  ['rating source mismatch', x => { x.originalRatings.ratings['original.test-skill'].source.revision = REVISIONS[1] }],
  ['rating self approval', x => { x.originalRatings.ratings['original.test-skill'].reviewState = 'approved' }],
  ['negative rating', x => { x.originalRatings.ratings['original.test-skill'].value = -1 }],
  ['too large rating', x => { x.originalRatings.ratings['original.test-skill'].value = 13 }],
  ['IQ25 coercion', x => { x.originalRatings.ratings['original.test-skill'].value = 25 }],
  ['fraction rating', x => { x.originalRatings.ratings['original.test-skill'].value = 1.5 }],
  ['string zero', x => { x.originalRatings.ratings['original.test-skill'].value = '0' }],
  ['missing value', x => { delete x.originalRatings.ratings['original.test-skill'].value }],
  ['too large combined modifier', x => { x.originalRatings.combinedModifier = 5 }],
  ['too small combined modifier', x => { x.originalRatings.combinedModifier = -5 }],
  ['modifier array', x => { x.originalRatings.combinedModifier = [4, 4] }],
  ['missing modifier', x => { delete x.originalRatings.combinedModifier }],
  ['wrong rules version', x => { x.originalRatings.rulesVersion = 'gurps' }],
  ['fake issued identity', x => { x.identity.id = 'K9999' }],
]
for (const [name, mutate] of mutations) test('caller and real HTTP reject ' + name, async () => {
  const input = proposal()
  const result = mutate(input)
  const value = result === undefined ? input : result
  assert.throws(() => candidate(value, revision, store.read(revision).people), error => error.status === 400)
  await live({ versionStore: store }, async request => {
    const response = await request(pathFor('/api/characters'), json(value))
    assert.equal(response.status, 400)
    assert.match(response.body.error, /^E_/u)
  })
})

test('real HTTP rejects unselected revision, malformed transport and private export requests', async () => {
  await live({ versionStore: store }, async request => {
    for (const query of ['', '?revision=latest', '?revision=', '?revision=' + revision + '&revision=' + revision]) {
      const response = await request('/api/characters' + query)
      assert.equal(response.status, 400)
      assert.equal(response.body.error, 'E_EXPLICIT_REVISION')
    }
    for (const audience of ['observer', 'public']) {
      const response = await request(pathFor('/api/characters/K1018/sheet') + '&audience=' + audience)
      assert.equal(response.status, 403)
      assert.deepEqual(response.body, { error: 'E_PRIVATE_AUTHOR_API' })
    }
    const origin = await request(pathFor('/api/characters'), { headers: { Origin: 'https://example.invalid' } })
    assert.equal(origin.status, 403)
    assert.equal(origin.headers.get('access-control-allow-origin'), null)
    assert.equal((await request(pathFor('/api/characters') + '&export=public')).status, 400)
    assert.equal((await request('/api/characters', { method: 'OPTIONS' })).status, 204)
    assert.equal((await request(pathFor('/api/characters'), { method: 'POST', body: '{}' })).status, 415)
    const malformed = await request(pathFor('/api/characters'), { ...json({}), body: '{' })
    assert.equal(malformed.status, 400)
    assert.equal(malformed.body.error, 'E_JSON')
    assert.equal((await request(pathFor('/api/characters/K1018/sheet'), json(proposal(), 'PATCH'))).status, 405)
    assert.equal((await request(pathFor('/api/characters'), { method: 'DELETE' })).status, 405)
    const tools = await request('/mcp/tools')
    assert.equal(tools.status, 200)
    assert.equal(tools.body.tools.length, 5)
    assert.deepEqual(tools.body.contract.revisions, REVISIONS)
    assert.equal(tools.body.contract.profile.ratingMax, 12)
    assert.equal(tools.body.contract.profile.combinedModifierMax, 4)
    assert.equal(tools.body.contract.profile.reviewState, 'approved')
    assert.equal(tools.body.contract.observerProjection, false)
  })
  await live({}, async request => {
    assert.equal((await request('/mcp/tools')).status, 200)
    const held = await request(pathFor('/api/characters'))
    assert.equal(held.status, 503)
    assert.deepEqual(held.body, { error: 'E_VERSION_STORE_BINDING' })
    assert.equal((await request('/api/characters')).status, 400)
  })
})

test('explicit null modifier and positive boundary stay distinct without numeric derivation', async () => {
  await live({ versionStore: store }, async request => {
    for (const combinedModifier of [null, 4]) {
      const input = proposal()
      input.originalRatings.combinedModifier = combinedModifier
      const response = await request(pathFor('/api/characters'), json(input))
      assert.equal(response.status, 201)
      assert.equal(response.body.candidate.originalRatings.combinedModifier, combinedModifier)
      assert.equal(response.body.candidate.originalRatings.ratings['original.test-skill'].value, 0)
      assert.equal(response.body.candidate.originalRatings.ratings['original.unassigned'].value, null)
    }
  })
  for (const value of [NaN, Infinity, -Infinity]) {
    const input = proposal()
    input.originalRatings.ratings['original.test-skill'].value = value
    assert.throws(() => candidate(input, revision, store.read(revision).people), /E_RATING_RANGE/)
  }
})

test('HTTP rejects identity replacement, duplicate issued names and oversized bodies without source leaks', async () => {
  const input = proposal()
  input.revision = 'latest'
  assert.throws(() => candidate(input, 'latest', []), /E_EXPLICIT_REVISION/)
  await live({ versionStore: store }, async request => {
    const person = store.read(revision).people.find(item => item.id === 'K1018')
    for (const identity of [{ id: 'K1018', name: 'replacement' }, { id: 'K998', name: person.name }]) {
      const altered = proposal()
      altered.identity = identity
      const result = await request(pathFor('/api/characters/K1018'), json(altered, 'PATCH'))
      assert.equal(result.status, 400)
      assert.deepEqual(result.body, { error: 'E_IDENTITY_IMMUTABLE' })
    }
    const duplicate = proposal()
    duplicate.identity.name = person.name
    assert.equal((await request(pathFor('/api/characters'), json(duplicate))).status, 409)
    const large = await request(pathFor('/api/characters'), { ...json({}), body: JSON.stringify('x'.repeat(1024 * 1024)) })
    assert.equal(large.status, 413)
    assert.deepEqual(large.body, { error: 'E_BODY_LIMIT' })
    const blocked = await request(pathFor('/api/characters'), { headers: { 'sec-fetch-site': 'cross-site' } })
    assert.equal(blocked.status, 403)
    assert.deepEqual(blocked.body, { error: 'E_PRIVATE_AUTHOR_API' })
  })
})

const configuration = () => ({
  CHARACTER_PARENT_PIN_SOURCE: process.env.CHARACTER_PARENT_PIN_SOURCE,
  CHARACTER_POPULATED_SOURCE: process.env.CHARACTER_POPULATED_SOURCE,
})

test('configured version store requires both sealed file paths and verifies their exact bytes', async () => {
  const config = configuration()
  for (const path of Object.values(config)) assert.equal(typeof path, 'string', 'explicit sealed fixture path required')
  const bound = configuredVersionStore(config)
  for (const selected of REVISIONS) assert.deepEqual(bound.read(selected), JSON.parse(sources.get(selected)))
  for (const absent of [{}, { CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE },
    { CHARACTER_POPULATED_SOURCE: config.CHARACTER_POPULATED_SOURCE },
    { ...config, CHARACTER_PARENT_PIN_SOURCE: '' }, { ...config, CHARACTER_POPULATED_SOURCE: '' }]) {
    assert.throws(() => configuredVersionStore(absent), error => error.status === 503 && error.message === 'E_VERSION_STORE_BINDING')
  }
  for (const wrong of [
    { ...config, CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_POPULATED_SOURCE },
    { ...config, CHARACTER_POPULATED_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE },
    { ...config, CHARACTER_POPULATED_SOURCE: fileURLToPath(new URL('./issued-preservation-baseline.json', import.meta.url)) },
  ]) assert.throws(() => configuredVersionStore(wrong), error => error.status === 503 && error.message === 'E_SOURCE_HASH')
  assert.throws(() => configuredVersionStore({ ...config, CHARACTER_PARENT_PIN_SOURCE: root + '/.omo/evidence/original-api/nonexistent-sealed-source.json' }), error => error.code === 'ENOENT')
  for (const [index, path] of Object.values(config).entries()) assert.deepEqual(await readFile(path), sources.get(REVISIONS[index]))
})

test('standalone CLI rejects incomplete or mismatched sources before listening', async () => {
  const config = configuration()
  const clean = { ...process.env, MCP_PORT: '0' }
  delete clean.CHARACTER_PARENT_PIN_SOURCE
  delete clean.CHARACTER_POPULATED_SOURCE
  for (const [supplied, expected] of [
    [{}, 'E_VERSION_STORE_BINDING'],
    [{ CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE }, 'E_VERSION_STORE_BINDING'],
    [{ CHARACTER_POPULATED_SOURCE: config.CHARACTER_POPULATED_SOURCE }, 'E_VERSION_STORE_BINDING'],
    [{ ...config, CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_POPULATED_SOURCE }, 'E_SOURCE_HASH'],
  ]) {
    await assert.rejects(run(process.execPath, [fileURLToPath(new URL('./mcp-character-server.mjs', import.meta.url))], {
      cwd: root, env: { ...clean, ...supplied }, timeout: 5000,
    }), error => {
      assert.equal(error.code, 1)
      assert.equal(error.killed, false)
      assert.equal(error.stdout, '')
      assert.ok(error.stderr.includes(expected), error.stderr)
      return true
    })
  }
})

test('standalone CLI binds explicit files, serves both revisions over HTTP and shuts down', async () => {
  const config = configuration()
  const before = await Promise.all(Object.values(config).map(path => readFile(path)))
  const child = spawn(process.execPath, [fileURLToPath(new URL('./mcp-character-server.mjs', import.meta.url))], {
    cwd: root, env: { ...process.env, ...config, MCP_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  })
  const closed = once(child, 'close', { signal: AbortSignal.timeout(20000) })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk })
  // Subscribe immediately to the child readiness stream; HTTP begins only after
  // its real listen callback emits the selected ephemeral loopback address.
  const listening = new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => { cleanup(); reject(new Error('CLI listening timeout: ' + stderr)) }, 5000)
    const onExit = () => { cleanup(); reject(new Error('CLI exited before listening: ' + stderr)) }
    const onError = error => { cleanup(); reject(error) }
    const onData = chunk => {
      output += chunk
      const match = output.match(/http:\/\/127\.0\.0\.1:([0-9]+)/u)
      if (match) { cleanup(); resolve(match[0]) }
    }
    function cleanup() {
      clearTimeout(timeout)
      child.off('error', onError)
      child.off('exit', onExit)
      child.stdout.off('data', onData)
    }
    child.once('error', onError)
    child.once('exit', onExit)
    child.stdout.on('data', onData)
  })
  let address
  try {
    address = await listening
    const request = async path => {
      const response = await fetch(address + path, { signal: AbortSignal.timeout(5000) })
      return { status: response.status, body: await response.json() }
    }
    for (const selected of REVISIONS) {
      const original = JSON.parse(sources.get(selected))
      const listed = await request(pathFor('/api/characters', selected))
      assert.equal(listed.status, 200)
      assert.equal(listed.body.count, original.people.length)
      assert.equal(listed.body.revision, selected)
      for (const id of ['K001', 'K998', 'K1003', 'K1018', 'K1022']) {
        const person = original.people.find(item => item.id === id)
        for (const route of [id, person.url.split('/').pop()]) {
          const result = await request(pathFor('/api/characters/' + route + '/sheet', selected))
          assert.equal(result.status, 200)
          assert.equal(result.body.revision, selected)
          assert.equal(result.body.originalRatings, null)
          assert.deepEqual(result.body.legacy, person)
        }
      }
    }
    assert.deepEqual(await request('/api/characters'), { status: 400, body: { error: 'E_EXPLICIT_REVISION' } })
    assert.deepEqual(await request(pathFor('/api/characters') + '&audience=public'), { status: 403, body: { error: 'E_PRIVATE_AUTHOR_API' } })
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    const [code, signal] = await closed
    assert.equal(code, null)
    assert.equal(signal, 'SIGTERM')
    assert.equal(stderr, '')
  }
  await assert.rejects(fetch(address + '/mcp/tools', { signal: AbortSignal.timeout(5000) }))
  for (const [index, path] of Object.values(config).entries()) assert.deepEqual(await readFile(path), before[index])
})
