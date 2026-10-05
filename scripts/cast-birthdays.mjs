import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

// Owner approved the numeric bands. This candidate pins their derived assignment
// snapshot; its byte hash is computed evidence, not a separate human hash approval.
const approvedCohortSha256 = '55c6c45e23a2b91abf7cea9f8470e45cac259f08226d86735f5c70df0ea4c758'
const cohortText = await readFile(new URL('../lore/name-pools/cast-birth-cohorts.json', import.meta.url), 'utf8')
export function assertBirthCohortContract(text) {
  if (createHash('sha256').update(text).digest('hex') !== approvedCohortSha256) throw new Error('E_BIRTH_COHORT_APPROVAL')
}
assertBirthCohortContract(cohortText)
const cohortContract = JSON.parse(cohortText)
const assignedCohorts = new Map(cohortContract.assignments.map((entry) => [entry.personId, cohortContract.cohorts.find((cohort) => cohort.id === entry.cohort)]))

const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string' && value.trim().length > 0

const calendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) throw new Error(`E_BIRTH_DATE:${value}`)
  const [year, month, day] = value.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) throw new Error(`E_BIRTH_DATE:${value}`)
  return { year, birthday: value.slice(5) }
}

export function ageInYears(birthDate, ageAsOf) {
  const birth = calendarDate(birthDate)
  const reference = calendarDate(ageAsOf)
  if (birthDate > ageAsOf) throw new Error(`E_BIRTH_AFTER_REFERENCE:${birthDate}:${ageAsOf}`)
  return reference.year - birth.year - Number(reference.birthday < birth.birthday)
}

export function validateCastBirthdays(ledger, roster, { enforceAssignedCohort = true } = {}) {
  if (!record(ledger) || ledger.schemaVersion !== 1 || !Array.isArray(ledger.people)) throw new Error('E_BIRTH_LEDGER_SCHEMA')
  calendarDate(ledger.ageAsOf)
  const issuedById = new Map()
  const issuedNames = new Set()
  for (const person of roster) {
    if (!record(person) || !/^K\d{3,4}$/u.test(person.id) || !text(person.name)) throw new Error('E_BIRTH_ROSTER_IDENTITY')
    if (issuedById.has(person.id) || issuedNames.has(person.name)) throw new Error(`E_BIRTH_ROSTER_DUPLICATE:${person.id}`)
    issuedById.set(person.id, person.name)
    issuedNames.add(person.name)
  }
  const births = new Map()
  const names = new Set()
  for (const person of ledger.people) {
    if (!record(person) || !text(person.id) || !text(person.name)) throw new Error('E_BIRTH_IDENTITY')
    if (births.has(person.id)) throw new Error(`E_BIRTH_DUPLICATE_ID:${person.id}`)
    if (names.has(person.name)) throw new Error(`E_BIRTH_DUPLICATE_NAME:${person.name}`)
    if (issuedById.get(person.id) !== person.name) throw new Error(`E_BIRTH_IDENTITY:${person.id}:${person.name}`)
    if (!['owner-authored', 'existing-canon'].includes(person.sourceStatus)) throw new Error(`E_BIRTH_SOURCE_STATUS:${person.id}`)
    if (!Array.isArray(person.sourceRefs) || !person.sourceRefs.length || !person.sourceRefs.every(text)) throw new Error(`E_BIRTH_SOURCE_REFS:${person.id}`)
    const age = ageInYears(person.birthDate, ledger.ageAsOf)
    if (enforceAssignedCohort) {
      const cohort = assignedCohorts.get(person.id)
      const year = Number(person.birthDate.slice(0, 4))
      if (!cohort || year < cohort.startYear || year > cohort.endYear) throw new Error(`E_BIRTH_COHORT_RANGE:${person.id}`)
    }
    births.set(person.id, { birthDate: person.birthDate, birthday: person.birthDate.slice(5), age,
      ageAsOf: ledger.ageAsOf, sourceStatus: person.sourceStatus, sourceRefs: [...person.sourceRefs] })
    names.add(person.name)
  }
  const missing = roster.filter((person) => !births.has(person.id)).map((person) => person.id)
  if (missing.length) throw new Error(`E_BIRTH_COVERAGE:${missing.join(',')}`)
  return births
}

export async function loadCastBirthdays(loreRoot, roster) {
  const ledger = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/cast-birthdays.json'), 'utf8'))
  return validateCastBirthdays(ledger, roster, { enforceAssignedCohort: true })
}
