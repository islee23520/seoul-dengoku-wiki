import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { ageInYears, assertBirthCohortContract, loadCastBirthdays, validateCastBirthdays } from './cast-birthdays.mjs'

const roster = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8')).persons
const fixture = () => ({ schemaVersion: 1, ageAsOf: '2126-12-31', people: roster.map(({ id, name }) =>
  ({ id, name, birthDate: '2100-03-01', sourceStatus: 'owner-authored', sourceRefs: ['owner:test-fixture'] })) })

test('approved assigned cohort endpoints accept and cross-band edits reject without reassignment', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/name-pools/cast-birthdays.json', import.meta.url), 'utf8'))
  const contract = JSON.parse(await readFile(new URL('../lore/name-pools/cast-birth-cohorts.json', import.meta.url), 'utf8'))
  for (const cohort of contract.cohorts) {
    const assignment = contract.assignments.find((entry) => entry.cohort === cohort.id)
    if (!assignment) continue
    for (const date of [`${cohort.startYear}-01-01`, `${cohort.endYear}-12-31`]) {
      const ledger = structuredClone(source)
      ledger.people.find((entry) => entry.id === assignment.personId).birthDate = date
      assert.ok(validateCastBirthdays(ledger, roster).has(assignment.personId))
    }
    for (const date of [`${cohort.startYear - 1}-12-31`, `${cohort.endYear + 1}-01-01`]) {
      const ledger = structuredClone(source)
      ledger.people.find((entry) => entry.id === assignment.personId).birthDate = date
      assert.throws(() => validateCastBirthdays(ledger, roster), /E_BIRTH_COHORT_RANGE/)
      const root = await mkdtemp(join(tmpdir(), 'birth-cohort-'))
      try {
        await mkdir(join(root, 'name-pools'))
        await writeFile(join(root, 'name-pools/cast-birthdays.json'), JSON.stringify(ledger))
        await assert.rejects(loadCastBirthdays(root, roster), /E_BIRTH_COHORT_RANGE/)
      } finally { await rm(root, { recursive: true, force: true }) }
    }
  }
  assert.equal(contract.approvalRef, 'call_8veISBTZpdFe0urlej1pwQ5t')
  const malicious = structuredClone(contract)
  const original = JSON.stringify(contract, null, 2) + '\n'
  assertBirthCohortContract(original)
  assert.equal(malicious.assignments[0].cohort, contract.assignments[0].cohort)
  malicious.assignments[0].cohort = contract.assignments[0].cohort === 4 ? 3 : 4
  assert.notEqual(malicious.assignments[0].cohort, contract.assignments[0].cohort)
  assert.throws(() => assertBirthCohortContract(JSON.stringify(malicious, null, 2) + '\n'), /E_BIRTH_COHORT_APPROVAL/)
})

test('diaspora birthday sources resolve to the same permanent identity card', async () => {
  const ledger = JSON.parse(await readFile(new URL('../lore/name-pools/cast-birthdays.json', import.meta.url), 'utf8'))
  const document = JSON.parse(await readFile(new URL('../lore/factions/Diaspora-Corridors.json', import.meta.url), 'utf8'))
  const families = JSON.parse(await readFile(new URL('../lore/name-pools/diaspora-family-lineages.json', import.meta.url), 'utf8'))
  for (const person of ledger.people.filter(row => /^K101[1-6]$/u.test(row.id))) {
    const refs = person.sourceRefs.filter(ref => ref.startsWith('lore/factions/Diaspora-Corridors.json#/'))
    if (person.sourceRefs.includes('lore/name-pools/diaspora-family-lineages.json')) {
      const members = families.lineages.flatMap(lineage => lineage.members).filter(member => member.personId === person.id)
      assert.equal(members.length, 1, person.id)
      assert.equal(members[0].birthDate, person.birthDate, person.id)
      assert.equal(members[0].name.ko, person.name, person.id)
    } else assert.ok(refs.length > 0, person.id)
    for (const ref of refs) {
      const pointer = ref.split('#')[1]
      const block = pointer.split('/').slice(1).reduce((value, key) => value?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], document)
      assert.ok(block?.kind === 'list', person.id)
      assert.ok(block.items.some(item => item.ko === `캐릭터 ID: ${person.id}`), person.id)
    }
  }
})

test.each([
  ['2100-03-01', '2126-02-28', 25], ['2100-03-01', '2126-03-01', 26],
  ['2100-03-01', '2126-03-02', 26], ['2126-12-31', '2126-12-31', 0],
  ['2096-02-29', '2125-02-28', 28], ['2096-02-29', '2125-03-01', 29],
  ['2000-02-29', '2004-02-29', 4],
])('completed calendar years from %s to %s equal %i', (birthDate, ageAsOf, age) => {
  const actual = ageInYears(birthDate, ageAsOf)
  assert.equal(actual, age)
})

test.each(['2100-02-29', '2126-02-29', '2126-04-31', '2126-00-10', '2126-13-01', '2126-01-00', '0000-01-01', '2126-1-01', null])('rejects invalid calendar date %s', (date) => {
  assert.throws(() => ageInYears(date, '2126-12-31'), /E_BIRTH_DATE/)
})

test('rejects invalid reference dates and births after reference', () => {
  assert.throws(() => ageInYears('2100-01-01', '2126-02-30'), /E_BIRTH_DATE/)
  assert.throws(() => ageInYears('2127-01-01', '2126-12-31'), /E_BIRTH_AFTER_REFERENCE/)
})

test('projects the complete issued roster with canonical IDs and source metadata', () => {
  const ledger = fixture()
  ledger.people[0].sourceStatus = 'existing-canon'
  const births = validateCastBirthdays(ledger, roster, { enforceAssignedCohort: false })
  assert.equal(births.size, roster.length)
  for (const person of ledger.people) assert.deepEqual(births.get(person.id), {
    birthDate: person.birthDate, birthday: '03-01', age: 26, ageAsOf: ledger.ageAsOf,
    sourceStatus: person.sourceStatus, sourceRefs: person.sourceRefs,
  })
})

test.each([
  ['missing coverage', (ledger) => ledger.people.pop(), /E_BIRTH_COVERAGE/],
  ['duplicate ID', (ledger) => ledger.people.push({ ...ledger.people[0] }), /E_BIRTH_DUPLICATE_ID/],
  ['duplicate name', (ledger) => { ledger.people[1].name = ledger.people[0].name }, /E_BIRTH_DUPLICATE_NAME/],
  ['name mismatch', (ledger) => { ledger.people[0].name = 'unknown' }, /E_BIRTH_IDENTITY/],
  ['ordinal ID', (ledger) => { ledger.people[0].id = 'person-0001' }, /E_BIRTH_IDENTITY/],
  ['unknown ID', (ledger) => { ledger.people[0].id = 'K9999' }, /E_BIRTH_IDENTITY/],
  ['invalid status', (ledger) => { ledger.people[0].sourceStatus = 'inferred' }, /E_BIRTH_SOURCE_STATUS/],
  ['empty refs', (ledger) => { ledger.people[0].sourceRefs = [] }, /E_BIRTH_SOURCE_REFS/],
  ['blank ref', (ledger) => { ledger.people[0].sourceRefs = [' '] }, /E_BIRTH_SOURCE_REFS/],
  ['nonstring ref', (ledger) => { ledger.people[0].sourceRefs = [null] }, /E_BIRTH_SOURCE_REFS/],
  ['schema version', (ledger) => { ledger.schemaVersion = 2 }, /E_BIRTH_LEDGER_SCHEMA/],
  ['invalid birth', (ledger) => { ledger.people[0].birthDate = '2100-02-29' }, /E_BIRTH_DATE/],
  ['future birth', (ledger) => { ledger.people[0].birthDate = '2127-01-01' }, /E_BIRTH_AFTER_REFERENCE/],
])('rejects %s', (_label, mutate, error) => {
  const ledger = fixture()
  mutate(ledger)
  assert.throws(() => validateCastBirthdays(ledger, roster, { enforceAssignedCohort: false }), error)
})
