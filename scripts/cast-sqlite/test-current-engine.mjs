import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import {
  ENGINE_PRIVATE_SOURCE_PATHS,
  ENGINE_TABLE_COLUMNS,
  mapEngineDomains,
} from './current-engine.mjs'
import { publicCharacterProfile } from '../character-profile.mjs'

const abilityIds = ['leadership', 'strategy', 'negotiation', 'management', 'insight', 'learning', 'prowess', 'endurance']
const bodyPartIds = ['left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso']
const localized = (value) => ({ ko: `한국어 ${value}`, en: `English ${value}` })

function profile(personId = 'K001', name = '가람') {
  return {
    personId,
    name,
    status: 'PRIVATE-STATUS-SENTINEL',
    souls: [{ id: 'PRIVATE-SOUL-SENTINEL', historicalMotif: 'PRIVATE-HISTORY-SENTINEL' }],
    evidence: { privateQuote: 'PRIVATE-EVIDENCE-SENTINEL' },
    abilities: Object.fromEntries(abilityIds.map((id, index) => [id, { base: index + 1, effective: index + 1, basis: 'PRIVATE-BASIS-SENTINEL' }])),
    skills: [{ id: 'skill-one', name: localized('숙련'), rating: 99.9 }],
    traits: [{
      id: 'trait-one', name: localized('특성'), description: localized('설명'), behavior: localized('행동'),
      stress: localized('스트레스'), relationship: localized('관계'), effects: [],
    }],
    narrative: localized('서사'),
    health: {
      status: null,
      bodyParts: bodyPartIds.map((id) => ({ id, severity: id === 'head' ? null : 'none', function: 'normal' })),
      diseases: [{ id: null, progression: null }],
    },
  }
}

function fixture() {
  const paths = [
    'lore/editorial/profile-batches/special.json',
    ...Array.from({ length: 8 }, (_, index) => `lore/editorial/profile-batches/state-${String(index * 2 + 1).padStart(2, '0')}-${String(index * 2 + 2).padStart(2, '0')}.json`),
  ]
  const documents = paths.map((logical_path) => ({ logical_path, document: { profiles: [] }, sha256: 'a'.repeat(64), byte_length: 10 }))
  documents[0].document.profiles.push(profile())
  return {
    bundle: { engineFiles: documents },
    identity: { people: [{ person_id: 'K001', name: '가람' }] },
  }
}

test('public engine projection maps normalized rows and excludes private values', () => {
  const input = fixture()
  const before = structuredClone(input)
  const output = mapEngineDomains(input)
  assert.deepEqual(Object.keys(output), Object.keys(ENGINE_TABLE_COLUMNS))
  assert.deepEqual(Object.fromEntries(Object.entries(output).map(([table, rows]) => [table, rows.length])), {
    current_engine_source: 9, current_profile: 1, ability: 8, skill: 1, trait: 1,
    effect: 0, health: 1, body: 6, disease: 1, narrative: 1,
  })
  assert.deepEqual(output.current_profile[0], {
    person_id: 'K001', engine_source_id: 'engine-source-0001', json_pointer: '/profiles/0', source_ordinal: 0,
  })
  assert.equal(output.health[0].status_presence, 'null')
  assert.equal(output.body.find((row) => row.body_part_id === 'head').severity_presence, 'null')
  assert.equal(output.disease[0].disease_id_presence, 'null')
  const serialized = JSON.stringify(output)
  for (const secret of ['PRIVATE-STATUS-SENTINEL', 'PRIVATE-SOUL-SENTINEL', 'PRIVATE-HISTORY-SENTINEL', 'PRIVATE-EVIDENCE-SENTINEL', 'PRIVATE-BASIS-SENTINEL', 'souls', 'historicalMotif']) {
    assert.equal(serialized.includes(secret), false, secret)
  }
  assert.deepEqual(input, before)
  assert.ok(Object.isFrozen(output) && Object.values(output).every((rows) => Object.isFrozen(rows)))
  assert.match(output.current_engine_source[0].projection_sha256, /^[a-f0-9]{64}$/u)
  const expectedProjection = JSON.stringify([{ personId: 'K001', profile: publicCharacterProfile(input.bundle.engineFiles[0].document.profiles[0]) }])
  assert.equal(output.current_engine_source[0].projection_sha256, createHash('sha256').update(expectedProjection).digest('hex'))
  const statusChanged = fixture()
  statusChanged.bundle.engineFiles[0].document.profiles[0].status = 'A-DIFFERENT-PRIVATE-STATUS'
  assert.equal(mapEngineDomains(statusChanged).current_engine_source[0].projection_sha256, output.current_engine_source[0].projection_sha256)
})

test('missing and explicit null public health fields remain distinct', () => {
  const input = fixture()
  const row = input.bundle.engineFiles[0].document.profiles[0]
  delete row.health.status
  delete row.health.bodyParts[0].severity
  delete row.health.diseases[0].progression
  const output = mapEngineDomains(input)
  assert.deepEqual([output.health[0].status_presence, output.health[0].status], ['missing', null])
  assert.deepEqual([output.body[0].severity_presence, output.body[0].severity], ['missing', null])
  assert.deepEqual([output.disease[0].progression_presence, output.disease[0].progression], ['missing', null])
  assert.deepEqual([output.disease[0].disease_id_presence, output.disease[0].disease_id], ['null', null])
})

test('historical GURPS numbers and approval-like metadata cannot become current engine facts', () => {
  const baseline = fixture()
  const injected = fixture()
  const privateProfile = injected.bundle.engineFiles[0].document.profiles[0]
  privateProfile.gurps = {
    ST: 987654321,
    DX: 876543210,
    skills: [{ name: 'PRIVATE-GURPS-SKILL', level: 765432109 }],
  }
  privateProfile.approvalStatus = 'PRIVATE-FAKE-OWNER-APPROVAL'
  injected.bundle.engineFiles[0].document.approvalStatus = 'PRIVATE-BATCH-APPROVAL'

  const expected = mapEngineDomains(baseline)
  const actual = mapEngineDomains(injected)
  assert.deepEqual(actual, expected)
  assert.equal(actual.ability[0].base_value, 1)
  assert.equal(actual.ability[0].effective_value, 1)
  const serialized = JSON.stringify(actual)
  for (const forbidden of ['987654321', '876543210', '765432109', 'PRIVATE-GURPS-SKILL', 'PRIVATE-FAKE-OWNER-APPROVAL', 'PRIVATE-BATCH-APPROVAL']) {
    assert.equal(serialized.includes(forbidden), false, forbidden)
  }
})

test('invalid boundaries and effective-effect mismatch fail closed', async (t) => {
  const cases = [
    ['base', (row) => { row.abilities.leadership.base = 21 }, 'E_BASE'],
    ['effective', (row) => { row.abilities.leadership.effective = 101 }, 'E_EFFECTIVE'],
    ['skill', (row) => { row.skills[0].rating = 99.99 }, 'E_SKILL'],
    ['body', (row) => { row.health.bodyParts.pop() }, 'E_BODY_PARTS'],
    ['effect total', (row) => { row.traits[0].effects.push({ ability: 'leadership', delta: 2 }) }, 'E_EFFECT_TOTAL'],
  ]
  for (const [name, mutate, code] of cases) await t.test(name, () => {
    const input = fixture()
    mutate(input.bundle.engineFiles[0].document.profiles[0])
    assert.throws(() => mapEngineDomains(input), (error) => error.code === 'E_ENGINE_PROFILE' && error.message.includes(code))
  })
})

test('source and identity boundaries reject drift without exposing source values', () => {
  const duplicate = fixture()
  duplicate.bundle.engineFiles.push(structuredClone(duplicate.bundle.engineFiles[0]))
  assert.throws(() => mapEngineDomains(duplicate), { code: 'E_ENGINE_SOURCE_SET' })
  const badHash = fixture()
  badHash.bundle.engineFiles[0].sha256 = 'PRIVATE-SOUL-SENTINEL'
  assert.throws(() => mapEngineDomains(badHash), { code: 'E_ENGINE_SOURCE_HASH' })
  const mismatch = fixture()
  mismatch.identity.people[0].name = '다른 이름'
  assert.throws(() => mapEngineDomains(mismatch), { code: 'E_ENGINE_IDENTITY' })
})

test('actual authored corpus maps exactly and inserts into STRICT SQLite with no privacy leak', async (t) => {
  const root = resolve(import.meta.dirname, '..', '..')
  const registry = JSON.parse(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json'), 'utf8'))
  const engineFiles = await Promise.all(ENGINE_PRIVATE_SOURCE_PATHS.map(async (logical_path) => {
    const bytes = await readFile(resolve(root, logical_path))
    return {
      logical_path,
      document: JSON.parse(bytes.toString('utf8')),
      sha256: createHash('sha256').update(bytes).digest('hex'),
      byte_length: (await stat(resolve(root, logical_path))).size,
    }
  }))
  const output = mapEngineDomains({
    bundle: { engineFiles },
    identity: { people: registry.persons.map(({ id, name }) => ({ person_id: id, name })) },
  })
  const counts = Object.fromEntries(Object.entries(output).map(([table, rows]) => [table, rows.length]))
  assert.deepEqual(counts, {
    current_engine_source: 9, current_profile: 1022, ability: 8176, skill: 1290, trait: 2012,
    effect: 6, health: 1022, body: 6132, disease: 0, narrative: 1022,
  })
  assert.equal(new Set(output.current_profile.map((row) => row.person_id)).size, registry.persons.length)
  assert.equal(output.body.every((row) => bodyPartIds.includes(row.body_part_id)), true)
  const serialized = JSON.stringify(output)
  for (const forbidden of ['"souls":', '"soulRevisionRef":', '"historicalMotif":', '"basis":', '"evidence":']) assert.equal(serialized.includes(forbidden), false, forbidden)

  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT;')
  const insertPerson = db.prepare('INSERT INTO person(person_id) VALUES (?)')
  for (const person of registry.persons) insertPerson.run(person.id)
  db.exec(await readFile(resolve(import.meta.dirname, 'current-engine.sql'), 'utf8'))
  for (const [table, columns] of Object.entries(ENGINE_TABLE_COLUMNS)) {
    const statement = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
    for (const row of output[table]) statement.run(...columns.map((column) => row[column]))
  }
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
  assert.equal(db.prepare('SELECT count(*) AS count FROM current_profile').get().count, 1022)
  const dump = JSON.stringify(Object.keys(ENGINE_TABLE_COLUMNS).flatMap((table) => db.prepare(`SELECT * FROM ${table}`).all()))
  for (const forbidden of ['"souls"', '"historicalMotif"', 'soulRevisionRef']) assert.equal(dump.includes(forbidden), false, forbidden)
  db.close()
  t.diagnostic(JSON.stringify(counts))
})

test('SQL constraints independently reject invalid ranges and broken pointers', async () => {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT; INSERT INTO person VALUES (\'K001\');')
  db.exec(await readFile(resolve(import.meta.dirname, 'current-engine.sql'), 'utf8'))
  db.prepare('INSERT INTO current_engine_source VALUES (?,?,?,?,?,?,?)').run('engine-source-0001', ENGINE_PRIVATE_SOURCE_PATHS[0], 'a'.repeat(64), 1, 'public-character-profile.v1', 'b'.repeat(64), 1)
  db.prepare('INSERT INTO current_profile VALUES (?,?,?,?)').run('K001', 'engine-source-0001', '/profiles/0', 0)
  assert.throws(() => db.prepare('INSERT INTO ability VALUES (?,?,?,?,?,?)').run('K001', 0, 'leadership', 21, 21, '/profiles/0/abilities/leadership'))
  assert.throws(() => db.prepare('INSERT INTO skill VALUES (?,?,?,?,?,?,?,?)').run('K001', 0, 'value', 'x', '숙련', 'Skill', 99.99, '/profiles/0/skills/0'))
  assert.throws(() => db.prepare('INSERT INTO narrative VALUES (?,?,?,?)').run('K001', '한글', 'English', 'profiles/0/narrative'))
  db.close()
})
