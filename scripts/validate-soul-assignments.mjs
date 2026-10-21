import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './document-store/soul-assignment.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readAtlasIdentity } from './cast-sqlite/atlas-identity.mjs'

const candidatePeriods = new Set([
  'japanese-sengoku',
  'meiji-restoration',
  'chinese-warlord-era',
  'chinese-three-kingdoms',
  'korean-three-kingdoms',
  'korean-later-three-kingdoms',
  'korean-war',
  'world-war-ii',
])
const sourceKinds = new Set(['historical-person', 'romance-character'])
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

// Return failures without modifying either editorial input. Soul reuse across
// different people is permitted; duplicate souls within one assignment are not.
export function validateSoulAssignments(ledger, registry, { complete = false } = {}) {
  const failures = []
  if (!Array.isArray(registry?.persons)) failures.push('E_REGISTRY: persons must be an array')
  if (!Array.isArray(ledger?.assignments)) failures.push('E_ASSIGNMENTS: assignments must be an array')
  if (failures.length) return failures

  const people = new Map()
  for (const person of registry.persons) {
    if (!nonempty(person?.id) || !nonempty(person?.name)) {
      failures.push('E_REGISTRY_IDENTITY: registered person requires id and name')
      continue
    }
    if (people.has(person.id)) failures.push(`E_REGISTRY_DUPLICATE: ${person.id}`)
    people.set(person.id, person.name)
  }
  if (registry.totalPeople !== people.size) failures.push('E_REGISTRY_COUNT: totalPeople does not match unique registered people')
  if (ledger.maximumSoulsPerPerson !== 2) failures.push('E_SOUL_LIMIT: maximumSoulsPerPerson must be 2')

  if (!Array.isArray(ledger.candidatePeriods) || !ledger.candidatePeriods.length) {
    failures.push('E_CANDIDATE_PERIODS: candidatePeriods must be a nonempty array')
  }
  const declaredPeriods = new Set(Array.isArray(ledger.candidatePeriods) ? ledger.candidatePeriods : [])
  if (Array.isArray(ledger.candidatePeriods)) {
    if (declaredPeriods.size !== ledger.candidatePeriods.length) failures.push('E_CANDIDATE_PERIODS: duplicate period')
    for (const period of declaredPeriods) {
      if (!candidatePeriods.has(period)) failures.push(`E_CANDIDATE_PERIODS: unsupported period ${period}`)
    }
  }

  const assigned = new Set()
  for (const assignment of ledger.assignments) {
    const personId = assignment?.personId
    if (!nonempty(personId) || !people.has(personId)) failures.push(`E_PERSON_ID: unregistered person ${personId}`)
    if (assigned.has(personId)) failures.push(`E_ASSIGNMENT_DUPLICATE: ${personId}`)
    assigned.add(personId)
    if (!nonempty(assignment?.name) || assignment.name !== people.get(personId)) failures.push(`E_PERSON_NAME: ${personId} does not match registry`)
    if (assignment?.status === 'owner-confirmed' && !nonempty(assignment.approvalRef)) {
      failures.push(`E_APPROVAL: ${personId} requires approvalRef`)
    }
    if (!Array.isArray(assignment?.souls) || assignment.souls.length < 1 || assignment.souls.length > 2) {
      failures.push(`E_SOUL_COUNT: ${personId} must have 1-2 souls`)
      continue
    }
    const soulIds = new Set()
    for (const soul of assignment.souls) {
      if (!nonempty(soul?.id)) failures.push(`E_SOUL_ID: ${personId} requires nonempty soul id`)
      if (soulIds.has(soul?.id)) failures.push(`E_SOUL_DUPLICATE: ${personId} ${soul?.id}`)
      soulIds.add(soul?.id)
      if (!candidatePeriods.has(soul?.period) || !declaredPeriods.has(soul?.period)) failures.push(`E_SOUL_PERIOD: ${personId} ${soul?.period}`)
      if (!sourceKinds.has(soul?.sourceKind)) failures.push(`E_SOURCE_KIND: ${personId} ${soul?.sourceKind}`)
    }
  }

  const missing = [...people.keys()].filter((id) => !assigned.has(id))
  const covered = missing.length === 0 && assigned.size === people.size
  if (ledger.coverage?.registeredPeople !== people.size) failures.push('E_COVERAGE_REGISTERED: registeredPeople does not match registry')
  if (ledger.coverage?.assignedPeople !== assigned.size) failures.push('E_COVERAGE_ASSIGNED: assignedPeople does not match unique assignments')
  if (ledger.coverage?.complete !== covered) failures.push('E_COVERAGE_COMPLETE: complete does not match registry coverage')
  if (complete && missing.length) failures.push(`E_INCOMPLETE: ${missing.length} registered people missing assignments: ${missing.join(', ')}`)
  return failures
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.some((arg) => arg !== '--complete')) throw new Error('Usage: node scripts/validate-soul-assignments.mjs [--complete]')
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
    const failures = validateSoulAssignments(ledger, registry, { complete: args.includes('--complete') })
    process.exitCode = failures.length ? 1 : 0
    if (failures.length) console.error(`SOUL_ASSIGNMENTS_FAIL (${failures.length}):\n${failures.join('\n')}`)
    else console.log(`SOUL_ASSIGNMENTS_PASS: ${ledger.coverage.assignedPeople}/${ledger.coverage.registeredPeople} people`)
  } catch (error) {
    console.error(`SOUL_ASSIGNMENTS_FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
