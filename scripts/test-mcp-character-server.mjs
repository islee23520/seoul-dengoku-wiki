import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { candidate, createVersionStore, REVISIONS } from './original-character-api.mjs'
import { draftAbilityIds } from './character-profile-draft.mjs'
import { baseline, hash, json, live, pathFor, proposal, revision, sources, store, test } from './character-api-test-fixtures.mjs'

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
        assert.equal(result.body.originalProfile, null)
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
    assert.deepEqual(created.body.candidate.originalProfile, input.originalProfile)
    assert.equal((await request(pathFor('/api/characters'), json(input))).body.candidate.candidateId, created.body.candidate.candidateId)
    assert.equal((await request(pathFor('/api/characters/candidate:test-person'))).status, 404)
    const existing = store.read(revision).people.find(x => x.id === 'K1018')
    for (const method of ['PATCH', 'PUT']) {
      input.identity = { id: existing.id, name: existing.name }
      input.originalProfile.profile.abilities.prowess.base = 20
      input.originalProfile.profile.abilities.prowess.effective = 100
      const updated = await request(pathFor('/api/characters/' + existing.url.split('/').pop()), json(input, method))
      assert.equal(updated.status, 200)
      assert.equal(updated.body.updated, false)
      assert.deepEqual(updated.body.candidate.originalProfile.profile.abilities.prowess, { base: 20, effective: 100 })
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
  ['source self approval', x => { x.source.reviewState = 'approved' }], ['fake approval', x => { x.originalProfile.reviewState = 'approved' }],
  ['legacy namespace', x => { x.originalProfile.profile.abilities.ST = { base: 10, effective: 10 } }],
  ['missing profile source', x => { delete x.originalProfile.source }],
  ['profile source mismatch', x => { x.originalProfile.source.revision = REVISIONS[1] }],
  ['ability self approval', x => { x.originalProfile.profile.abilities.leadership.reviewState = 'approved' }],
  ['negative base', x => { x.originalProfile.profile.abilities.leadership.base = -1 }],
  ['too large base', x => { x.originalProfile.profile.abilities.leadership.base = 21 }],
  ['IQ25 coercion', x => { x.originalProfile.profile.abilities.leadership.base = 25 }],
  ['fraction base', x => { x.originalProfile.profile.abilities.leadership.base = 1.5 }],
  ['string zero', x => { x.originalProfile.profile.abilities.leadership.base = '0' }],
  ['missing base', x => { delete x.originalProfile.profile.abilities.leadership.base }],
  ['too large effective', x => { x.originalProfile.profile.abilities.leadership.effective = 101 }],
  ['negative effective', x => { x.originalProfile.profile.abilities.leadership.effective = -1 }],
  ['missing ability', x => { delete x.originalProfile.profile.abilities.insight }],
  ['legacy modifier', x => { x.originalProfile.combinedModifier = 4 }],
  ['resolution formula', x => { x.originalProfile.profile.resolutionFormula = 'd10' }],
  ['private soul', x => { x.originalProfile.profile.souls = [{ id: 'private' }] }],
  ['missing body part', x => { x.originalProfile.profile.health.bodyParts.pop() }],
  ['skill precision', x => { x.originalProfile.profile.skills = [{ id: 'repair', name: { ko: '정비', en: 'Repair' }, rating: 12.34 }] }],
  ['skill title grant', x => { x.originalProfile.profile.skills = [{ id: 'repair', name: { ko: '정비', en: 'Repair' }, rating: 100 }] }],
  ['wrong rules version', x => { x.originalProfile.rulesVersion = 'gurps' }],
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
    assert.deepEqual(tools.body.contract.profile.abilities, draftAbilityIds)
    assert.equal(tools.body.contract.profile.base.maximum, 20)
    assert.equal(tools.body.contract.profile.effective.maximum, 100)
    assert.equal(tools.body.contract.profile.skills.maximum, 99.9)
    assert.deepEqual(tools.body.contract.profile.formulas, { resolution: null, effectComposition: null, skillGrowth: null })
    assert.equal(Object.hasOwn(tools.body.contract.profile, 'approvalRef'), false)
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

test('explicit null zero and canonical endpoints stay distinct without numeric derivation', async () => {
  await live({ versionStore: store }, async request => {
    for (const rating of [{ base: null, effective: null }, { base: 0, effective: 0 }, { base: 20, effective: 100 }]) {
      // Given
      const input = proposal()
      input.originalProfile.profile.abilities.prowess = rating
      // When
      const response = await request(pathFor('/api/characters'), json(input))
      // Then
      assert.equal(response.status, 201)
      assert.deepEqual(response.body.candidate.originalProfile.profile.abilities.prowess, rating)
      assert.deepEqual(response.body.candidate.originalProfile.profile.abilities.insight, { base: null, effective: null })
      assert.deepEqual(response.body.candidate.formulas, { resolution: null, effectComposition: null, skillGrowth: null })
    }
  })
  for (const base of [NaN, Infinity, -Infinity]) {
    const input = proposal()
    input.originalProfile.profile.abilities.prowess.base = base
    assert.throws(() => candidate(input, revision, store.read(revision).people), /E_BASE:prowess/)
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
