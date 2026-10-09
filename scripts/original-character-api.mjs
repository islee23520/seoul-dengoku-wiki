import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Private authoring contract, not a game-observer projection. Never mount this
// store or its responses in public exports. No legacy value is an original rating.
const baseline = JSON.parse(readFileSync(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
export const REVISIONS = Object.freeze(Object.keys(baseline.revisions))
export const RULES_VERSION = 'seoul.opposed-d10.v1'
export const PROFILE = Object.freeze({ resolution: 'opposed-d10', ratingMin: 0, ratingMax: 12,
  combinedModifierMin: -4, combinedModifierMax: 4, reviewState: 'approved',
  approvalRef: 'call_KEbyFRfpYhPcDagvgygW6RRA' })

export class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status }
}
const reject = (code) => { throw new ApiError(400, code) }
const record = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)
const text = (x) => typeof x === 'string' && x.trim().length > 0
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')

export function exactFields(value, keys, code) {
  if (!record(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(value, key))) reject(code)
}

export function explicitRevision(revision) {
  if (!REVISIONS.includes(revision)) reject('E_EXPLICIT_REVISION')
  return revision
}

// Composition root injects Map<revision, Buffer> of the TWO sealed historical
// ledgers. Bytes are snapshotted and checked, not opened from an HTTP-supplied path.
// No binding is inferred from cwd, latest, or the mutable current ledger.
export function createVersionStore(sources) {
  if (!(sources instanceof Map) || sources.size !== REVISIONS.length || REVISIONS.some(revision => !sources.has(revision))) {
    throw new ApiError(503, 'E_VERSION_STORE_BINDING')
  }
  const snapshots = new Map()
  for (const revision of REVISIONS) {
    const input = sources.get(revision)
    if (!Buffer.isBuffer(input)) throw new ApiError(503, 'E_SOURCE_BYTES')
    const bytes = Buffer.from(input)
    if (hash(bytes) !== baseline.revisions[revision].ledgerSha256) throw new ApiError(503, 'E_SOURCE_HASH')
    snapshots.set(revision, bytes.toString('utf8'))
  }
  return Object.freeze({ read(revision) {
    explicitRevision(revision)
    return JSON.parse(snapshots.get(revision))
  } })
}

export const matchesCharacter = (character, id) => character.id === id || character.personId === id || character.url === '/people/' + id

export function sourceReference(source, revision) {
  exactFields(source, ['revision', 'ref', 'reviewState'], 'E_SOURCE')
  if (source.revision !== revision || !text(source.ref) || source.reviewState !== 'unreviewed') reject('E_SOURCE')
}

// Candidate values are authored explicitly and never adopted into operative
// gameplay. null means unassigned; zero is a real authored rating, not a default.
export function originalRatings(value, revision) {
  exactFields(value, ['rulesVersion', 'reviewState', 'source', 'ratings', 'combinedModifier'], 'E_ORIGINAL_RATINGS')
  if (value.rulesVersion !== RULES_VERSION || value.reviewState !== 'unreviewed') reject('E_ORIGINAL_REVIEW')
  sourceReference(value.source, revision)
  if (!record(value.ratings)) reject('E_RATINGS')
  for (const [key, rating] of Object.entries(value.ratings)) {
    if (!/^original\.[a-z][a-z0-9-]*$/u.test(key)) reject('E_RATING_NAMESPACE')
    exactFields(rating, ['value', 'source', 'reviewState'], 'E_RATING')
    if (rating.value !== null && (!Number.isInteger(rating.value) || rating.value < 0 || rating.value > 12)) reject('E_RATING_RANGE')
    if (rating.reviewState !== 'unreviewed') reject('E_RATING_REVIEW')
    sourceReference(rating.source, revision)
  }
  if (value.combinedModifier !== null && (!Number.isInteger(value.combinedModifier) || Math.abs(value.combinedModifier) > 4)) reject('E_MODIFIER_RANGE')
  return structuredClone(value)
}

export function candidate(payload, revision, people, existing) {
  explicitRevision(revision)
  exactFields(payload, ['schema', 'revision', 'audience', 'identity', 'source', 'originalRatings'], 'E_CANDIDATE_ENVELOPE')
  if (payload.schema !== 'original-character-candidate.v1' || payload.revision !== revision || payload.audience !== 'author-private') reject('E_CANDIDATE_ENVELOPE')
  sourceReference(payload.source, revision)
  exactFields(payload.identity, ['id', 'name'], 'E_IDENTITY')
  if (!text(payload.identity.name)) reject('E_IDENTITY')
  if (existing) {
    if (payload.identity.id !== existing.id || payload.identity.name !== existing.name) reject('E_IDENTITY_IMMUTABLE')
  } else {
    if (!/^candidate:[a-z0-9][a-z0-9-]*$/u.test(payload.identity.id)) reject('E_CANDIDATE_ID')
    if (people.some(person => matchesCharacter(person, payload.identity.id) || person.name === payload.identity.name)) throw new ApiError(409, 'E_EXISTING_IDENTITY')
  }
  const ratings = originalRatings(payload.originalRatings, revision)
  const draft = { ...structuredClone(payload), originalRatings: ratings, reviewState: 'unreviewed', operative: false, persisted: false }
  return { candidateId: 'sha256:' + hash(JSON.stringify(draft)), ...draft }
}

// This machine-readable contract is served by /mcp/tools. The full POST/PATCH/PUT
// envelope is required; PATCH does NOT merge fields or replace the historical sheet.
export function apiContract() {
  return { schema: 'original-character-api.v1', audience: 'author-private', observerProjection: false,
    revisions: REVISIONS, revisionSelector: 'exactly one ?revision=<sealed revision> on every data request',
    versionStore: 'injected createVersionStore(Map<revision, Buffer>); standalone requires CHARACTER_PARENT_PIN_SOURCE and CHARACTER_POPULATED_SOURCE sealed files before listen; unbound embedded routes return 503',
    profile: PROFILE, rulesVersion: RULES_VERSION, operativeRatings: null,
    candidate: { schema: 'original-character-candidate.v1', revision: 'explicit selected revision', audience: 'author-private',
      identity: { id: 'existing K ID for update; candidate:<local-id> for create', name: 'explicit name; existing name immutable' },
      source: { revision: 'same selected revision', ref: 'nonempty author source reference; assertion not approval', reviewState: 'unreviewed' },
      originalRatings: { rulesVersion: RULES_VERSION, reviewState: 'unreviewed', source: 'same source shape',
        ratings: { 'original.<authored-key>': { value: 'integer 0..12 or null', source: 'same source shape', reviewState: 'unreviewed' } },
        combinedModifier: 'integer -4..4 or null; combined total, never clamped' } },
    writes: 'returns content-addressed unreviewed candidate; caller retains it; no persistence, approval, numeric mapping or legacy ledger writes',
    sheet: 'legacy contains the complete unchanged historical person, including every number and citation; operative false',
    export: 'public and observer audiences are rejected; deployment/authentication and public projection are not provided here',
    settlement: { input: { revision: 'explicit selected revision', audience: 'author-private', candidates: 'array of complete create envelopes' },
      output: 'unreviewed proposals only; settlement ID is proposed association, not population, residence or eligibility' } }
}
