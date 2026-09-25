import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { extractAtlasJson } from './world-atlas-parse.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'
import { verifyAtlasPeople } from './world-atlas-verify.mjs'
import { materializeWorldAtlas } from './materialize-world-atlas.mjs'

const lore = new URL('../../lore/', import.meta.url)
const markdown = await readFile(new URL('World-Narrative-Atlas.md', lore), 'utf8')
const ids = ['K1003', 'K1004', 'K1008', 'K1009', 'K1010']

test('atlas parses unaffiliated IDs separately from the frozen state prefix', () => {
  const parsed = extractAtlasJson(markdown)
  assert.equal(parsed.ok, true, parsed.error)
  assert.deepEqual(Object.keys(parsed.value.unaffiliated), ids)
  assert.equal(parsed.value.humans.length, 422)
  assert.equal(parsed.value.states.length, 16)
})

test('expansion projection links every unaffiliated ID to its actual person route', () => {
  const parsed = extractAtlasJson(markdown)
  assert.equal(parsed.ok, true, parsed.error)
  const projection = projectionsFromAtlas(parsed.value, 'test')['World-Expansion-Index.md']
  const links = [...projection.matchAll(/\]\((\/people\/person-\d{4})\)/g)].map((match) => match[1])
  assert.deepEqual(links, ids.map((id) => '/people/person-' + id.slice(1).padStart(4, '0')))
})

test('theater projection retains sourced route, rumor, player-entry and unknown fields', () => {
  const parsed = extractAtlasJson(markdown)
  assert.equal(parsed.ok, true, parsed.error)
  const projection = projectionsFromAtlas(parsed.value, 'test')['External-Theaters.md']
  for (const theater of parsed.value.theaters) {
    assert.ok(projection.includes(`## ${theater.id} · ${theater.display_name}`), theater.id)
    for (const value of [theater.verified, theater.inference, theater.original_fiction,
      theater.seoul_route.verified_geography, theater.seoul_route.outbound_boundary,
      theater.seoul_route.fixed_duration, theater.travel_constraints.rule,
      theater.language_rumor_protocol.prohibited_inference,
      theater.opening_event.player_decision, ...theater.explicit_unknowns]) {
      assert.ok(projection.includes(value), `${theater.id}: ${value}`)
    }
    for (const entry of theater.player_entry_points) assert.ok(projection.includes(entry.first_decision), entry.id)
    for (const rumor of theater.language_rumor_protocol.rumor_reliability) assert.ok(projection.includes(rumor.rule), `${theater.id}: ${rumor.tier}`)
  }
})

const context = {
  registry: JSON.parse(await readFile(new URL('name-pools/person-id-registry.json', lore), 'utf8')),
  candidates: JSON.parse(await readFile(new URL('name-pools/person-id-candidates.json', lore), 'utf8')),
  people: JSON.parse(await readFile(new URL('name-pools/values-cast.json', lore), 'utf8')).people,
}
const atlas = extractAtlasJson(markdown).value

test('aggregate validation counts 422 state people plus five issued unaffiliated people', () => {
  assert.deepEqual(verifyAtlasPeople(atlas, context), {
    failures: [], stateCount: 422, unaffiliatedCount: 5, total: 427,
  })
  assert.deepEqual(atlas.humans.map(({ id, name }) => ({ id, name })), context.candidates.existingK)
})

for (const [name, mutate, code] of [
  ['missing collection', (value) => { delete value.unaffiliated }, 'E_UNAFFILIATED_COLLECTION'],
  ['array collection', (value) => { value.unaffiliated = [] }, 'E_UNAFFILIATED_COLLECTION'],
  ['missing card', (value) => { delete value.unaffiliated.K1008 }, 'E_UNAFFILIATED_MISSING:'],
  ['missing character ID', (value) => { delete value.unaffiliated.K1008.character_id }, 'E_UNAFFILIATED_FIELDS:'],
  ['empty character ID', (value) => { value.unaffiliated.K1008.character_id = ' ' }, 'E_UNAFFILIATED_FIELDS:'],
  ['state field on unaffiliated card', (value) => { value.unaffiliated.K1008.state_id = 'S00' }, 'E_UNAFFILIATED_FIELDS:'],
  ['biography on registry row', (value) => { value.unaffiliated.K1008.biography = 'invented' }, 'E_UNAFFILIATED_FIELDS:'],
  ['changed alias', (value) => { value.unaffiliated.K1003.character_id = 'K1003' }, 'E_UNAFFILIATED_CHARACTER_ID:'],
  ['unissued ID', (value) => { value.unaffiliated.K1011 = value.unaffiliated.K1008; delete value.unaffiliated.K1008 }, 'E_UNAFFILIATED_ISSUED_ID:'],
  ['duplicate state ID', (value) => { value.unaffiliated.K001 = value.unaffiliated.K1008; delete value.unaffiliated.K1008 }, 'E_PERSON_DUPLICATE:'],
  ['duplicate character ID', (value) => { value.unaffiliated.K1008.character_id = value.unaffiliated.K1003.character_id }, 'E_PERSON_DUPLICATE:'],
  ['seventeenth state', (value) => { value.states.push({ id: 'S00' }) }, 'E_ATLAS_STATES'],
  ['frozen prefix renamed', (value) => { value.humans[0].name = 'changed' }, 'E_K_MAP:'],
  ['unaffiliated appended to humans', (value) => { value.humans.push({ id: 'K1008', name: '민웅기' }) }, 'E_K_MAP'],
]) {
  test('verifier rejects ' + name, () => {
    const mutated = structuredClone(atlas)
    mutate(mutated)
    const result = verifyAtlasPeople(mutated, context)
    assert.ok(result.failures.some((failure) => failure.startsWith(code)), JSON.stringify(result))
  })
}

test('verifier rejects a non-S00 issued member at the same ID', () => {
  const changed = structuredClone(context)
  changed.people[1007].state = 'S14'
  assert.ok(verifyAtlasPeople(atlas, changed).failures.includes('E_UNAFFILIATED_MEMBERSHIP:K1008'))
})

test('a namesake with a distinct issued ID remains a separate person', () => {
  const changedAtlas = structuredClone(atlas)
  const changed = structuredClone(context)
  const name = changedAtlas.humans[0].name
  changedAtlas.unaffiliated.K1008.name = name
  changed.registry.persons[1007].name = name
  changed.people[1007].name = name
  assert.deepEqual(verifyAtlasPeople(changedAtlas, changed).failures, [])
})

test('verifier rejects a person route that points at another catalog row', () => {
  const changed = structuredClone(context)
  ;[changed.people[1007], changed.people[1008]] = [changed.people[1008], changed.people[1007]]
  assert.ok(verifyAtlasPeople(atlas, changed).failures.includes('E_UNAFFILIATED_ROUTE:K1008'))
})

const registrySection = markdown.slice(0, markdown.indexOf('\n## 무소속'))
const unaffiliatedSection = markdown.slice(markdown.indexOf('## 무소속'))
for (const [name, source, code] of [
  ['missing heading', registrySection, 'E_UNAFFILIATED_HEADING'],
  ['repeated heading', markdown + '\n## 무소속\n', 'E_UNAFFILIATED_HEADING'],
  ['collection before registry', unaffiliatedSection + '\n' + registrySection, 'E_UNAFFILIATED_POSITION'],
  ['collection before another section', markdown + '\n## following\n', 'E_UNAFFILIATED_POSITION'],
  ['missing JSON fence', registrySection + '\n## 무소속\n{}', 'E_UNAFFILIATED_FENCE'],
  ['duplicate JSON ID', markdown.replace('"K1004": {', '"K1003": {'), 'E_UNAFFILIATED_DUPLICATE_ID'],
  ['second collection owner', markdown.replace('"schema":', '"unaffiliated": {}, "schema":'), 'E_UNAFFILIATED_COLLECTION'],
]) {
  test('parser rejects ' + name, () => {
    assert.deepEqual(extractAtlasJson(source), { ok: false, error: code })
  })
}

test('projection write and check agree, and a changed projection is rejected', async () => {
  const fixtureRoot = new URL('../../.omo/evidence/wiki-issues/i11/', import.meta.url)
  await mkdir(fixtureRoot, { recursive: true })
  const directory = await mkdtemp(new URL('projection-', fixtureRoot))
  const options = { atlasPath: fileURLToPath(new URL('World-Narrative-Atlas.md', lore)), outDir: directory, projection: 'World-Expansion-Index.md' }
  try {
    const written = await materializeWorldAtlas(options)
    assert.deepEqual(await materializeWorldAtlas({ ...options, check: true }), written)
    await writeFile(resolve(directory, options.projection), 'stale')
    await assert.rejects(materializeWorldAtlas({ ...options, check: true }), /E_PROJECTION_STALE/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('materializer rejects paths outside the projection vocabulary', async () => {
  await assert.rejects(materializeWorldAtlas({ projection: '../World-Narrative-Atlas.md' }), /E_PROJECTION_NAME/)
})
