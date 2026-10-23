import assert from 'node:assert/strict'
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { test } from 'vitest'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPersonDisposition } from './cast-sqlite/person-disposition.mjs'
import { currentOfficeAppointments, loadPersonDetailSources, loadPersonHoldingsContext,
  projectPersonStateInputs, produceFromPersonDetailSources } from './person-detail-inputs.mjs'
import { preservedPersonalTier } from './person-detail-production.mjs'
import { assertPersonalTierPreservation, PERSONAL_TIER_PRESERVATION_IDS } from './personal-tier-provenance.mjs'
import { projectActiveRoster } from './person-roster-projection.mjs'
import { loadApprovedOrganizationAliases } from './approved-organization-aliases.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

function readCurrentIdentities() {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'))
  try {
    const dispositions = readPersonDisposition(db)
    const registry = readCanonicalDocument('lore/name-pools/person-id-registry.json').persons
    const sheets = readCanonicalDocument('lore/name-pools/gurps-cast.json').people
    const routes = new Map(sheets.map(person => [person.id, person.url.split('/').pop()]))
    const states = new Map(db.prepare('SELECT person_id, state_id FROM person').all().map(person => [person.person_id, person.state_id]))
    const stateIds = new Set(db.prepare('SELECT state_id FROM state').all().map(state => state.state_id))
    const identities = new Map(registry.map(person => [person.id, { name: person.name, publicId: routes.get(person.id), stateId: states.get(person.id) }]))
    assert.equal(identities.size, registry.length)
    assert.equal(routes.size, sheets.length)
    assert.deepEqual([...identities.keys()].sort(), [...dispositions.keys()].sort())
    return { dispositions, identities, stateIds, active: new Map([...identities].filter(([id]) => dispositions.get(id).status === 'active')) }
  } finally { db.close() }
}

function assertTierProjection(details, identities, appointments, stateIds) {
  assert.equal(details.length, identities.size, 'identity coverage')
  assert.equal(new Set(details.map(person => person.id)).size, details.length, 'unique public IDs')
  assert.equal(new Set(details.map(person => person.characterId)).size, details.length, 'unique character IDs')
  assert.deepEqual(details.map(person => person.characterId).sort(), [...identities.keys()].sort(), 'identity set')
  for (const person of details) {
    const identity = identities.get(person.characterId)
    assert.equal(person.id, identity.publicId, person.characterId)
    assert.equal(person.name, identity.name, person.characterId)
    for (const field of ['id', 'characterId', 'name', 'state', 'sourceRoute', 'detailRoute']) {
      assert.equal(typeof person[field], 'string', field)
      assert.ok(person[field].trim(), field)
    }
    // state.state_id is nonempty, trimmed text; person.state_id references that registry.
    assert.equal(person.state, person.state.trim(), `${person.characterId}:state format`)
    assert.ok(stateIds.has(person.state), `${person.characterId}:registered state`)
    assert.equal(person.state, identity.stateId, `${person.characterId}:identity state`)
    // Unappointed people legitimately have empty position and rank strings.
    for (const field of ['position', 'rank']) assert.equal(typeof person[field], 'string', field)
    assert.equal(typeof person.commonTier, 'string', person.characterId)
    assert.match(person.commonTier, /^T[1-5]$/u, person.characterId)
    const appointment = appointments.get(person.characterId)
    if (appointment) {
      for (const field of ['position', 'rank', 'commonTier']) assert.equal(person[field], appointment[field], `${person.characterId}:${field}`)
      assert.equal(person.state, appointment.stateId, person.characterId)
    }
  }
}

test('tier invariants accept changed valid tiers and independently changed identity sets', () => {
  const stateIds = new Set(['S01', 'S00', 'polity:fixture'])
  const check = (details, identities, appointments) => assertTierProjection(details, identities, appointments, stateIds)
  const identity = { name: 'fixture person', publicId: 'person-fixture', stateId: 'S01' }
  const identities = new Map([['fixture-id', identity]])
  const person = { id: identity.publicId, characterId: 'fixture-id', name: identity.name, state: identity.stateId,
    sourceRoute: '/world/fixture', detailRoute: '/people/person-fixture', position: '', rank: '', commonTier: 'T1' }
  for (const commonTier of ['T1', 'T2', 'T3', 'T4', 'T5']) check([{ ...person, commonTier }], identities, new Map())
  for (const stateId of stateIds) {
    check([{ ...person, state: stateId }], new Map([[person.characterId, { ...identity, stateId }]]), new Map())
  }
  // Membership follows the supplied registry, not a frozen list of current states.
  assertTierProjection([{ ...person, state: 'S17' }], new Map([[person.characterId, { ...identity, stateId: 'S17' }]]), new Map(), new Set(['S17']))
  check([], new Map(), new Map())
  const second = { ...person, id: 'person-second', characterId: 'second-id', name: 'second fixture', state: 'polity:fixture', commonTier: 'T3' }
  const expanded = new Map([...identities, [second.characterId, { name: second.name, publicId: second.id, stateId: second.state }]])
  check([person, second], expanded, new Map())
  check([second], new Map([[second.characterId, expanded.get(second.characterId)]]), new Map())
  const appointment = { stateId: person.state, position: 'fixture office', rank: 'fixture rank', commonTier: 'T4' }
  const appointments = new Map([[person.characterId, appointment]])
  const appointed = { ...person, ...appointment }
  check([appointed], identities, appointments)
  for (const changed of [[], [person, person], [{ ...person, commonTier: 'T9' }], [{ ...person, rank: undefined }],
    [{ ...person, state: '' }], [{ ...person, characterId: 'unknown' }], [{ ...person, id: 'substituted' }]]) {
    assert.throws(() => check(changed, identities, new Map()), assert.AssertionError)
  }
  for (const state of ['', ' ', ' S01', 'S01 ', 'S01\n']) {
    // Even a matching identity/registry cannot legitimize malformed state text.
    assert.throws(() => assertTierProjection([{ ...person, state }],
      new Map([[person.characterId, { ...identity, stateId: state }]]), new Map(), new Set([state])), assert.AssertionError)
  }
  assert.throws(() => check([{ ...person, state: 'unregistered' }],
    new Map([[person.characterId, { ...identity, stateId: 'unregistered' }]]), new Map()), /registered state/)
  assert.throws(() => check([{ ...person, state: 'S00' }], identities, new Map()), /identity state/)
  assert.throws(() => check([person], identities, new Map([[person.characterId, { ...appointment, stateId: 'S00', commonTier: person.commonTier, position: '', rank: '' }]])), assert.AssertionError)
  for (const field of ['position', 'rank', 'commonTier']) {
    assert.throws(() => check([{ ...appointed, [field]: 'disagreement' }], identities, appointments), assert.AssertionError)
  }
  for (const field of ['id', 'characterId', 'name', 'state', 'sourceRoute', 'detailRoute', 'position', 'rank', 'commonTier']) {
    const missing = { ...person }
    delete missing[field]
    assert.throws(() => check([missing], identities, new Map()), assert.AssertionError)
  }
  assert.throws(() => check([person, { ...second, id: person.id }], expanded, new Map()), /unique public IDs/)
  assert.throws(() => check([person, { ...second, characterId: person.characterId }], expanded, new Map()), /unique character IDs/)
})

test('synthetic untrusted personal-tier maps are rejected at the production boundary', () => {
  const input = { personId: 'fixture-id', publicId: 'person-fixture', name: 'fixture person', stateId: 'S01',
    source: 'fixture-source', envelope: { content: [] } }
  for (const map of [undefined, new Map(), new Map([[input.personId, { ...input, commonTier: 'T3' }]])]) {
    assert.throws(() => preservedPersonalTier(input, map), /E_PERSON_TIER_PRESERVATION_MAP/)
    assert.throws(() => assertPersonalTierPreservation(map), /E_PERSON_TIER/)
  }
})

test('synthetic personal-tier consumer preserves bound evidence and rejects substitutions', () => {
  const block = { anchor: 'fixture-role', kind: 'paragraph', text: { ko: 'fixture role', en: 'fixture role' } }
  const input = { personId: 'fixture-id', publicId: 'person-fixture', name: 'fixture person', stateId: 'S01',
    source: 'fixture-source', envelope: { content: [block] } }
  const evidence = { ...input, commonTier: 'T3', provenance: { currentRoleBlocks: [{ anchor: block.anchor,
    sha256: createHash('sha256').update(JSON.stringify(block)).digest('hex') }] } }
  // Satisfy the consumer's existing map precondition with synthetic padding;
  // neither current identities nor their tiers are used as expected data.
  const preservation = new Map(Array.from({ length: PERSONAL_TIER_PRESERVATION_IDS.length }, (_, index) =>
    [`fixture-padding-${index}`, { publicId: `padding-public-${index}`, name: `padding name ${index}` }]))
  preservation.delete('fixture-padding-0')
  preservation.set(input.personId, evidence)
  for (const commonTier of ['T1', 'T2', 'T3', 'T4', 'T5']) {
    const changed = new Map(preservation).set(input.personId, { ...evidence, commonTier })
    assert.equal(preservedPersonalTier(input, changed), commonTier)
  }
  assert.throws(() => assertPersonalTierPreservation(preservation), /E_PERSON_TIER/)
  for (const change of [{ personId: 'unknown' }, { publicId: 'substituted' }, { name: 'substituted' },
    { stateId: 'substituted' }, { source: 'substituted' }, { appointment: { commonTier: 'T3' } },
    { envelope: {} }, { envelope: { content: [] } }, { envelope: { content: [block, block] } },
    { envelope: { content: [{ ...block, text: { ko: 'changed', en: 'changed' } }] } }]) {
    assert.throws(() => preservedPersonalTier({ ...input, ...change }, preservation), /E_PERSON_TIER_PRESERVATION_BINDING/)
  }
  for (const change of [{ personId: 'substituted' }, { commonTier: 'T9' }, { commonTier: undefined },
    { provenance: undefined }, { provenance: { currentRoleBlocks: [] } }]) {
    const changed = new Map(preservation).set(input.personId, { ...evidence, ...change })
    assert.throws(() => preservedPersonalTier(input, changed), /E_PERSON_TIER_PRESERVATION_BINDING/)
  }
  assert.equal(preservedPersonalTier({ ...input, personId: 'unpreserved', publicId: 'unpreserved-public', name: 'unpreserved person' }, preservation), undefined)
})

test('actual producer covers authoritative identities without a filesystem baseline', async () => {
  const { dispositions, identities, active, stateIds } = readCurrentIdentities()
  const directory = resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021')
  const defaults = {
    WIKI_DOCUMENT_DB: resolve(root, 'data/canonical/wiki-cast.sqlite'),
    WIKI_TIER_EVIDENCE_DB: resolve(directory, 'person-tier-dependencies-evidence-20261020.sqlite'),
    WIKI_TIER_HISTORY_DB: resolve(directory, 'person-tier-history-evidence-20261020.sqlite'),
    WIKI_EDITORIAL_PROFILE_DB: resolve(directory, 'editorial-profiles.sqlite'),
    WIKI_SOUL_ASSIGNMENT_DB: resolve(directory, 'soul-assignments.sqlite'),
  }
  const before = Object.fromEntries(Object.keys(defaults).map(key => [key, process.env[key]]))
  const isolatedRoot = await mkdtemp(resolve(tmpdir(), 'common-tiers-'))
  try {
    for (const [key, path] of Object.entries(defaults)) process.env[key] ??= path
    await assert.rejects(access(resolve(isolatedRoot, '.omo/private/seoul-migration/baseline.json')), { code: 'ENOENT' })
    const sources = await loadPersonDetailSources({ repoRoot: isolatedRoot })
    const organizationAliases = await loadApprovedOrganizationAliases(process.env.WIKI_ORGANIZATION_ALIAS_ROOT ?? root)
    const state = projectPersonStateInputs(sources.renderedBySlug, sources.pagesBySlug, { organizationAliases })
    const beforeAppointments = structuredClone(sources.officeAppointmentSource)
    const appointments = currentOfficeAppointments(sources.officeAppointmentSource, sources.issuedById)
    const context = await loadPersonHoldingsContext(sources, { repoRoot: isolatedRoot, ...state })
    const result = await produceFromPersonDetailSources(sources, { ...state, personalHoldings: context.personalHoldings, officeAppointments: appointments })
    assertTierProjection(result.personDetails, identities, appointments, stateIds)
    const current = projectActiveRoster(result, dispositions)
    assertTierProjection(current.personDetails, active, appointments, stateIds)
    assert.deepEqual(sources.officeAppointmentSource, beforeAppointments)
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await rm(isolatedRoot, { recursive: true, force: true })
  }
}, 120000)

test('published details cover every active identity exactly once with current appointments', async () => {
  const { active, stateIds } = readCurrentIdentities()
  const people = readCanonicalDocument('lore/name-pools/gurps-cast.json').people
  const source = readCanonicalDocument('lore/relations/opening-office-appointments.json')
  const before = structuredClone(source)
  const appointments = currentOfficeAppointments(source, new Map(people.map(person => [person.id, person])))
  const directory = new URL('../public/person-details/', import.meta.url)
  const files = (await readdir(directory)).filter(name => name.endsWith('.json'))
  const details = await Promise.all(files.map(async file => {
    const person = JSON.parse(await readFile(new URL(file, directory), 'utf8'))
    assert.equal(file, `${person.id}.json`)
    return person
  }))
  assertTierProjection(details, active, appointments, stateIds)
  assert.deepEqual(source, before)
})

function appointmentFixture() {
  const pair = ko => ({ ko, en: ko })
  const row = { personId: 'fixture-id', stateId: 'S01',
    history: { personId: 'fixture-id', stateId: 'S01', position: pair('former office'), rank: pair('former rank'),
      commonTier: 'T3', approvalRef: 'fixture-approval' },
    current: { status: 'existing-function', position: pair('current function'), rank: null, commonTier: 'T3',
      evidence: [{ kind: 'existing-function', path: 'fixture.json', jsonPointer: '/function' }] } }
  return { schema: 'opening-office-appointments.v2', appointments: [row] }
}

test('current appointment mechanics accept valid changed tiers and reject inconsistent inputs', () => {
  const issued = new Map([['fixture-id', {}]])
  for (const commonTier of ['T1', 'T2', 'T3', 'T4', 'T5']) {
    const source = appointmentFixture()
    source.appointments[0].history.commonTier = commonTier
    source.appointments[0].current.commonTier = commonTier
    const before = structuredClone(source)
    const projected = currentOfficeAppointments(source, issued).get('fixture-id')
    assert.deepEqual(projected, { personId: 'fixture-id', stateId: 'S01', position: 'current function', rank: '', commonTier })
    assert.deepEqual(source, before)
  }
  for (const mutate of [
    draft => { draft.schema = 'opening-office-appointments.v1' },
    draft => { draft.appointments[0].current.status = 'retired' },
    draft => { draft.appointments[0].current.rank = draft.appointments[0].history.rank },
    draft => { draft.appointments[0].current.commonTier = 'T9' },
    draft => { draft.appointments[0].current.commonTier = 'T2' },
    draft => { draft.appointments[0].current.evidence = [] },
    draft => { draft.appointments[0].history.personId = 'unknown' },
    draft => { delete draft.appointments[0].current.commonTier },
    draft => { draft.appointments.push(structuredClone(draft.appointments[0])) },
  ]) {
    const source = appointmentFixture()
    mutate(source)
    assert.throws(() => currentOfficeAppointments(source, issued), /E_OPENING_OFFICE/)
  }
  assert.throws(() => currentOfficeAppointments(appointmentFixture(), new Map()), /E_OPENING_OFFICE/)
})

test('people page filters by common tier and not by position', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /공통 티어/)
  assert.match(page, /commonTier/)
  assert.doesNotMatch(page, /직위<select/)
})
