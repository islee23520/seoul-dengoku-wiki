import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { loadHouseholdSourceDocuments, validateCastHouseholdRelations, projectCastHouseholdRelations } from './cast-household-relations.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const ledger = JSON.parse(await readFile(new URL('../lore/name-pools/cast-household-relations.json', import.meta.url), 'utf8'))
const documents = await loadHouseholdSourceDocuments(root, ledger)

test('actual Ilseob draft resolves parents, contracts and preserved facility custody', () => {
  assert.equal(validateCastHouseholdRelations(ledger, documents), ledger)
  const result = projectCastHouseholdRelations(ledger, documents, 'K998')
  assert.deepEqual(result.links.filter(link => link.type === 'contract').map(link => link.recipientId), ['K039', 'K035', 'K038'])
  assert.deepEqual(result.links.filter(link => link.type === 'kin').map(link => link.recipientId).sort(), ['FH-EX-LEE-SANGGYE', 'FH-K998-M-01'].sort())
  assert.equal(result.household.humanoidAdmission, 'deferred')
  assert.deepEqual(result.knownLinks.filter(link => link.direction === 'outgoing' && link.type === '계약').map(link => link.recipientId), ['K039', 'K035', 'K038'])
  assert.equal(result.deficits.normalizedSocialContact, false)
  result.links.pop()
  assert.equal(ledger.people.find(person => person.personId === 'K998').links.length, 5)
  assert.equal(projectCastHouseholdRelations(ledger, documents, 'K085').deficits.normalizedSocialContact, true)
})

test('FK, source anchor, kin pointer, unrelated party and private appointments fail', () => {
  for (const [mutate, code] of [
    [d => { d.people[0].links[2].recipientId = 'K9999' }, 'E_HOUSEHOLD_RECIPIENT'],
    [d => { d.people[0].links[2].sourceRefs[1].anchor = 'missing' }, 'E_HOUSEHOLD_SOURCE_ANCHOR'],
    [d => { d.people[0].links[0].sourceRefs[0].anchor = '/edges/999999' }, 'E_HOUSEHOLD_SOURCE_POINTER'],
    [d => { d.people[0].links[2].sourceRefs[1].anchor = '인물-허다온-p3' }, 'E_HOUSEHOLD_PARTY_SOURCE'],
    [d => { d.people[0].household.newPrivateRetainers.push('K039') }, 'E_HOUSEHOLD_PRIVATE_APPOINTMENT'],
    [d => { d.people[0].links[2].type = 'servant' }, 'E_HOUSEHOLD_RECIPIENT'],
    [d => { d.people[0].household.personFaith = { status: 'non-christian', sourceRefs: [] } }, 'E_HOUSEHOLD_FAITH'],
    [d => { d.people[0].household.humanoidAdmission = 'admitted' }, 'E_HOUSEHOLD_ADMISSION'],
    [d => { d.existingHumanoidContext[0].custodianPersonId = 'K998' }, 'E_HOUSEHOLD_H_CUSTODY'],
    [d => { d.quantityContract.directRetainers += 1 }, 'E_HOUSEHOLD_QUANTITY'],
  ]) {
    const draft = structuredClone(ledger)
    const ilseob = draft.people.find(person => person.personId === 'K998')
    const scoped = { ...draft, people: [ilseob] }
    mutate(scoped)
    assert.throws(() => validateCastHouseholdRelations(draft, documents), new RegExp(code))
  }
})

test('all current people, source links and unchanged court roles are projected', () => {
  const registry = documents.get('lore/name-pools/person-id-registry.json')
  assert.deepEqual(ledger.people.map(person => person.personId), registry.persons.map(person => person.id))
  const appointments = documents.get('lore/relations/relations.json')
  assert.equal(ledger.people.filter(person => person.court).length, appointments.courts.length)
  assert.equal(ledger.people.filter(person => person.directRetainer).length, appointments.directRetainers.length)
  const ilseobCourt = projectCastHouseholdRelations(ledger, documents, 'K998').court
  assert.deepEqual(ilseobCourt.retainers.map(person => person.personId), ['K425', 'K441'])
  const familyContact = projectCastHouseholdRelations(ledger, documents, 'K089')
  assert.ok(familyContact.knownLinks.some(link => link.recipientId === 'K086' && link.type === 'household' && link.sourceRefs.some(ref => ref.path === 'lore/name-pools/cast-family-trees.json')))
  assert.ok(familyContact.knownLinks.some(link => link.recipientId === 'K699' && link.type === '계약'))
  for (const id of ['K086', 'K373', 'K423']) assert.equal(ledger.people.find(person => person.personId === id).household.humanoidAdmission, 'excluded')
  const christianHouse = projectCastHouseholdRelations(ledger, documents, 'K423')
  assert.equal(christianHouse.household.houseFaith.status, 'christian')
  assert.equal(christianHouse.deficits.faithUnresolved, false)
  assert.equal(ledger.people.find(person => person.personId === 'K001').deficits.faithUnresolved, true)
  for (const [mutate, code] of [
    [d => { d.people.pop(); d.scope.coveredPersonIds.pop() }, 'E_HOUSEHOLD_COHORT_COVERAGE'],
    [d => { d.people[0].knownLinks.pop() }, 'E_HOUSEHOLD_KNOWN_COVERAGE'],
    [d => { d.people[0].knownLinks[0].role = 'invented' }, 'E_HOUSEHOLD_KNOWN_SOURCE'],
    [d => { d.people.find(person => person.court).court.retainers[0].role = 'invented' }, 'E_HOUSEHOLD_RETAINER_PROJECTION'],
    [d => { d.people[0].deficits.normalizedSocialContact = true }, 'E_HOUSEHOLD_DEFICIT'],
  ]) {
    const draft = structuredClone(ledger)
    mutate(draft)
    assert.throws(() => validateCastHouseholdRelations(draft, documents), new RegExp(code))
  }
})

test('source loader blocks paths outside lore before reading them', async () => {
  const draft = structuredClone(ledger)
  draft.people[0].sourceRefs[0].path = '../outside.json'
  await assert.rejects(loadHouseholdSourceDocuments(root, draft), /E_HOUSEHOLD_SOURCE_PATH/)
})

test('parent composition rejects any count or direct retainer reassignment', () => {
  const proposed = structuredClone(documents.get('lore/relations/relations.json'))
  proposed.directRetainers[0].liegePersonId = 'K998'
  assert.throws(() => projectCastHouseholdRelations(ledger, documents, 'K998', proposed), /E_HOUSEHOLD_EXISTING_COUNTS/)
})

test('every existing humanoid stays in facility context exactly once, not household admission', () => {
  const actors = documents.get('lore/World-Narrative-Atlas.json').data.atlas.synthetics.filter(actor => actor.cls === 'H')
  assert.deepEqual(ledger.existingHumanoidContext.map(row => row.actorId).sort(), actors.map(actor => actor.id).sort())
  for (const [mutate, code] of [
    [draft => { draft.existingHumanoidContext.pop() }, 'E_HOUSEHOLD_H_COVERAGE'],
    [draft => { draft.existingHumanoidContext.push(structuredClone(draft.existingHumanoidContext[0])) }, 'E_HOUSEHOLD_H_CUSTODY'],
    [draft => { draft.existingHumanoidContext[0].scope = 'household' }, 'E_HOUSEHOLD_H_CUSTODY'],
  ]) {
    const draft = structuredClone(ledger)
    mutate(draft)
    assert.throws(() => validateCastHouseholdRelations(draft, documents), new RegExp(code))
  }
})
