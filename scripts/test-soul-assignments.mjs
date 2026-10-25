import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { validateSoulAssignments } from './validate-soul-assignments.mjs'
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './document-store/soul-assignment.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readAtlasIdentity } from './cast-sqlite/atlas-identity.mjs'

const root = resolve(import.meta.dirname, '..')
const souls = openSoulAssignments(process.env.WIKI_SOUL_ASSIGNMENT_DB
  ?? resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021/soul-assignments.sqlite'), {
  capability: INTERNAL_SOUL_CAPABILITY, expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256,
})
let ledger
try { ledger = souls.readDocument() } finally { souls.close() }
const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'))
let registry
try { registry = readAtlasIdentity(db).registry } finally { db.close() }
const exec = promisify(execFile)
const cli = fileURLToPath(new URL('./validate-soul-assignments.mjs', import.meta.url))

function rejectMutation(mutate, code) {
  const changedLedger = structuredClone(ledger)
  const changedRegistry = structuredClone(registry)
  mutate(changedLedger, changedRegistry)
  assert.ok(validateSoulAssignments(changedLedger, changedRegistry).some((failure) => failure.startsWith(`${code}:`)), code)
}

test('current partial ledger passes default validation without mutating fictional source kind', () => {
  const before = structuredClone(ledger)
  assert.equal(ledger.coverage.assignedPeople, ledger.assignments.length)
  assert.equal(ledger.coverage.registeredPeople, registry.persons.length)
  assert.deepEqual(validateSoulAssignments(ledger, registry), [])
  assert.equal(ledger.assignments.find(({ personId }) => personId === 'K1004').souls.find(({ id }) => id === 'diaochan').sourceKind, 'romance-character')
  assert.deepEqual(ledger, before)
})

test('complete mode rejects current missing registry people', () => {
  const partial = structuredClone(ledger)
  partial.assignments = partial.assignments.slice(0, 1)
  partial.coverage.assignedPeople = 1
  partial.coverage.complete = false
  assert.ok(validateSoulAssignments(partial, registry, { complete: true }).some((failure) => failure.startsWith(`E_INCOMPLETE: ${registry.persons.length - 1} `)))
})

test('complete mode accepts every registered person with truthful coverage', () => {
  const completeRegistry = { totalPeople: ledger.assignments.length, persons: ledger.assignments.map(({ personId, name }) => ({ id: personId, name })) }
  const completeLedger = structuredClone(ledger)
  completeLedger.coverage.registeredPeople = completeRegistry.totalPeople
  completeLedger.coverage.assignedPeople = completeRegistry.totalPeople
  completeLedger.coverage.complete = true
  assert.deepEqual(validateSoulAssignments(completeLedger, completeRegistry, { complete: true }), [])
})

for (const count of [0, 3]) {
  test(`rejects ${count} souls even if declared maximum changes`, () => {
    rejectMutation((value) => {
      value.maximumSoulsPerPerson = count
      value.assignments[0].souls = Array.from({ length: count }, (_, index) => ({ ...value.assignments[1].souls[0], id: `soul-${index}` }))
    }, 'E_SOUL_COUNT')
  })
}

test('rejects duplicate registered IDs, assignment IDs, and souls within an assignment', () => {
  rejectMutation((_, people) => people.persons.push({ ...people.persons[0] }), 'E_REGISTRY_DUPLICATE')
  rejectMutation((value) => value.assignments.push(structuredClone(value.assignments[0])), 'E_ASSIGNMENT_DUPLICATE')
  rejectMutation((value) => value.assignments[0].souls.push({ ...value.assignments[0].souls[0] }), 'E_SOUL_DUPLICATE')
})

test('permits a shared soul across different people', () => {
  const value = structuredClone(ledger)
  value.assignments[1].souls[0] = { ...value.assignments[0].souls[0] }
  assert.deepEqual(validateSoulAssignments(value, registry), [])
})

test('Korean War and World War II souls are admitted when declared', () => {
  for (const period of ['korean-war', 'world-war-ii']) {
    const value = structuredClone(ledger)
    if (!value.candidatePeriods.includes(period)) value.candidatePeriods.push(period)
    value.assignments[0].souls[0].period = period
    assert.deepEqual(validateSoulAssignments(value, registry), [])
  }
})

test('rejects mismatched names and unregistered identities', () => {
  rejectMutation((value) => { value.assignments[0].name = 'wrong-name' }, 'E_PERSON_NAME')
  rejectMutation((value) => { value.assignments[0].personId = 'K9999' }, 'E_PERSON_ID')
})

test('rejects false declared coverage and registry count', () => {
  rejectMutation((value) => { value.coverage.assignedPeople += 1 }, 'E_COVERAGE_ASSIGNED')
  rejectMutation((value) => { value.coverage.registeredPeople -= 1 }, 'E_COVERAGE_REGISTERED')
  rejectMutation((value) => { value.coverage.complete = !value.coverage.complete }, 'E_COVERAGE_COMPLETE')
  rejectMutation((_, people) => { people.totalPeople -= 1 }, 'E_REGISTRY_COUNT')
})

test('rejects invalid candidate periods, undeclared periods, and source kinds', () => {
  rejectMutation((value) => value.candidatePeriods.push('unapproved-era'), 'E_CANDIDATE_PERIODS')
  rejectMutation((value) => value.candidatePeriods.push(value.candidatePeriods[0]), 'E_CANDIDATE_PERIODS')
  rejectMutation((value) => { value.candidatePeriods = {} }, 'E_CANDIDATE_PERIODS')
  rejectMutation((value) => { value.assignments[0].souls[0].period = 'unapproved-era' }, 'E_SOUL_PERIOD')
  rejectMutation((value) => { value.candidatePeriods = value.candidatePeriods.filter((period) => period !== 'japanese-sengoku') }, 'E_SOUL_PERIOD')
  rejectMutation((value) => { value.assignments[0].souls[0].sourceKind = 'fictional-historical-person' }, 'E_SOURCE_KIND')
})

test('owner-confirmed assignments require a nonempty approval reference', () => {
  for (const approvalRef of [undefined, '', '   ']) {
    rejectMutation((value) => {
      const confirmed = value.assignments.find(assignment => assignment.status === 'owner-confirmed')
      confirmed.approvalRef = approvalRef
    }, 'E_APPROVAL')
  }
})

test('CLI exits zero by default and nonzero for incomplete or invalid usage', async () => {
  const result = await exec(process.execPath, [cli], { timeout: 10000 })
  assert.equal(result.stdout.trim(), `SOUL_ASSIGNMENTS_PASS: ${ledger.coverage.assignedPeople}/${registry.persons.length} people`)
  if (ledger.coverage.complete) {
    const completeResult = await exec(process.execPath, [cli, '--complete'], { timeout: 10000 })
    assert.equal(completeResult.stdout, result.stdout)
  } else {
    await assert.rejects(exec(process.execPath, [cli, '--complete'], { timeout: 10000 }), (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /E_INCOMPLETE:/)
      return true
    })
  }
  await assert.rejects(exec(process.execPath, [cli, '--unknown'], { timeout: 10000 }), (error) => {
    assert.equal(error.code, 1)
    return true
  })
})
