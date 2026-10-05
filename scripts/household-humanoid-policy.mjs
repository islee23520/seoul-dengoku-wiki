import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const householdHumanoidPolicy = JSON.parse(readFileSync(new URL('../lore/name-pools/household-humanoid-policy.json', import.meta.url), 'utf8'))

/** @typedef {{path: string, anchor?: string}} SourceRef */
/** @typedef {{status: 'christian'|'non-christian'|'unknown', sourceRefs: SourceRef[]}} Faith */
/** @typedef {{ownerPersonId: string, ownerGender: '남성'|'여성', orientation: string|null, personFaith: Faith, houseFaith?: Faith, scope: 'household'|'facility-maintenance', existing: boolean, existingGender: '남성'|'여성'|null, seed: string, roleKey: string}} Request */

function validateFaith(faith, label) {
  if (!faith || !householdHumanoidPolicy.faithStates.includes(faith.status) || !Array.isArray(faith.sourceRefs)) throw new Error('E_HOUSEHOLD_FAITH:' + label)
  if (faith.status !== 'unknown' && !faith.sourceRefs.length) throw new Error('E_HOUSEHOLD_FAITH_SOURCE:' + label)
  if (faith.sourceRefs.some(ref => typeof ref.path !== 'string' || !ref.path.trim() || (ref.anchor !== undefined && (typeof ref.anchor !== 'string' || !ref.anchor.trim())))) throw new Error('E_HOUSEHOLD_FAITH_SOURCE:' + label)
}

/** Eligibility is independent of preference; this function never changes an actor or assignment.
 * @param {Request} request
 */
export function evaluateHouseholdHumanoid(request) {
  if (!/^K\d{3,}$/u.test(request.ownerPersonId) || !['남성', '여성'].includes(request.ownerGender) || !['household', 'facility-maintenance'].includes(request.scope) || typeof request.existing !== 'boolean' || ![null, '남성', '여성'].includes(request.existingGender) || (!request.existing && request.existingGender !== null) || typeof request.roleKey !== 'string' || !request.roleKey.trim() || typeof request.seed !== 'string' || !request.seed.trim()) throw new Error('E_HOUSEHOLD_REQUEST')
  validateFaith(request.personFaith, 'person')
  if (request.houseFaith !== undefined) validateFaith(request.houseFaith, 'house')
  if (request.orientation !== null && request.orientation !== '미확인' && !householdHumanoidPolicy.knownOrientations.includes(request.orientation)) throw new Error('E_HOUSEHOLD_ORIENTATION')
  const faiths = [request.personFaith, request.houseFaith ?? { status: 'unknown', sourceRefs: [] }]
  if (request.scope === 'facility-maintenance') return { eligibility: 'not-applicable', reason: 'facility-maintenance-not-household', preference: 'not-applicable', preferredGender: null, existingGender: request.existingGender, assignmentAction: 'preserve' }
  if (faiths.some(faith => faith.status === 'christian')) return { eligibility: 'excluded', reason: 'christian-household', preference: 'not-applicable', preferredGender: null, existingGender: request.existingGender, assignmentAction: request.existing ? 'report-conflict' : 'do-not-assign' }
  if (faiths.some(faith => faith.status === 'unknown')) return { eligibility: 'unresolved', reason: 'faith-unknown', preference: 'not-evaluated', preferredGender: null, existingGender: request.existingGender, assignmentAction: request.existing ? 'preserve-pending-review' : 'defer' }
  if (request.existing) return { eligibility: 'eligible', reason: 'evidenced-non-christian', preference: 'preserved', preferredGender: null, existingGender: request.existingGender, assignmentAction: 'preserve' }
  if (request.orientation === null || request.orientation === '미확인') return { eligibility: 'eligible', reason: 'evidenced-non-christian', preference: 'unknown', preferredGender: null, existingGender: null, assignmentAction: 'defer-preference' }
  const preferredGender = request.orientation === '이성'
    ? request.ownerGender === '남성' ? '여성' : '남성'
    : ['남성', '여성'][createHash('sha256').update(JSON.stringify(['household-humanoid-gender:v1', request.seed, request.ownerPersonId, request.roleKey])).digest()[0] % 2]
  return { eligibility: 'eligible', reason: 'evidenced-non-christian', preference: request.orientation === '이성' ? 'opposite-gender' : 'seeded-random', preferredGender, existingGender: null, assignmentAction: 'proposal-only' }
}

/** Existing authored assignments, not tier quotas, are the quantity contract.
 * @param {{courts: object[], directRetainers: object[]}} baseline
 * @param {{courts: object[], directRetainers: object[]}} proposed
 */
export function validateExistingHouseholdCounts(baseline, proposed) {
  const errors = []
  for (const key of ['courts', 'directRetainers']) {
    if (!Array.isArray(baseline[key]) || !Array.isArray(proposed[key])) throw new Error('E_HOUSEHOLD_COUNT_INPUT:' + key)
    const rows = value => value.map(row => JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))).sort()
    if (JSON.stringify(rows(baseline[key])) !== JSON.stringify(rows(proposed[key]))) errors.push('E_HOUSEHOLD_EXISTING_ASSIGNMENTS:' + key)
  }
  return errors
}

/** Preserve complete existing H records, including gender and custody, without automatic reassignment.
 * @param {object[]} baseline
 * @param {object[]} proposed
 */
export function validateExistingHumanoidAssignments(baseline, proposed) {
  const byId = new Map(proposed.map(actor => [actor.id, actor]))
  const errors = []
  if (proposed.length !== baseline.length || byId.size !== proposed.length || proposed.some(actor => !baseline.some(existing => existing.id === actor.id))) errors.push('E_HOUSEHOLD_EXISTING_HUMANOID_IDS')
  for (const actor of baseline) {
    const candidate = byId.get(actor.id)
    if (!candidate || JSON.stringify(candidate) !== JSON.stringify(actor)) errors.push('E_HOUSEHOLD_EXISTING_HUMANOID:' + actor.id)
  }
  return errors
}
