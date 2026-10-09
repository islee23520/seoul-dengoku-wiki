import { readFile } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
import { validateExistingHouseholdCounts } from './household-humanoid-policy.mjs'
import { validateCastFamilyTrees } from './cast-family-trees.mjs'

const fail = (code, id = '') => { throw new Error(code + ':' + id) }
const nonempty = value => typeof value === 'string' && value.trim().length > 0

export async function loadHouseholdSourceDocuments(root, ledger) {
  const paths = new Set(['lore/name-pools/person-id-registry.json', 'lore/name-pools/cast-family-trees.json', 'lore/name-pools/diaspora-family-lineages.json', 'lore/World-Narrative-Atlas.json', 'lore/relations/relations.json', 'lore/characters/Cast-Relations.json'])
  for (const person of ledger.people) for (const ref of [...person.sourceRefs, ...person.links.flatMap(link => link.sourceRefs), ...person.knownLinks.flatMap(link => link.sourceRefs), ...person.household.personFaith.sourceRefs, ...person.household.houseFaith.sourceRefs]) paths.add(ref.path)
  for (const row of ledger.existingHumanoidContext) for (const ref of row.sourceRefs) paths.add(ref.path)
  const documents = new Map()
  for (const path of paths) {
    const local = relative(root, resolve(root, path))
    if (isAbsolute(path) || local.startsWith('..') || !path.startsWith('lore/')) fail('E_HOUSEHOLD_SOURCE_PATH', path)
    documents.set(path, JSON.parse(await readFile(resolve(root, path), 'utf8')))
  }
  return documents
}

function resolveRef(ref, documents) {
  const doc = documents.get(ref.path)
  if (!doc || !nonempty(ref.anchor)) fail('E_HOUSEHOLD_SOURCE_REF', ref.path)
  if (ref.path === 'lore/name-pools/diaspora-family-lineages.json' && !ref.anchor.startsWith('/')) {
    const [lineageKey, memberKey] = ref.anchor.split('/')
    const member = doc.lineages.find(lineage => lineage.key === lineageKey)?.members.find(member => member.key === memberKey)
    if (!member) fail('E_HOUSEHOLD_SOURCE_ANCHOR', ref.anchor)
    return member
  }
  if (ref.anchor.startsWith('/')) {
    let value = doc
    for (const key of ref.anchor.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))) value = value?.[key]
    if (value === undefined) fail('E_HOUSEHOLD_SOURCE_POINTER', ref.anchor)
    return value
  }
  const block = doc.content?.find(block => block.anchor === ref.anchor)
  if (!block) fail('E_HOUSEHOLD_SOURCE_ANCHOR', ref.anchor)
  return block
}

/** Validate a draft only; source evidence does not turn authored contacts into existing facts.
 * @param {object} ledger
 * @param {Map<string, object>} documents
 */
export function validateCastHouseholdRelations(ledger, documents) {
  if (ledger.schema !== 'seoul-dengoku.cast-household-relations.v1' || ledger.status !== 'draft' || !Array.isArray(ledger.people) || !Array.isArray(ledger.existingHumanoidContext)) fail('E_HOUSEHOLD_LEDGER')
  const registry = documents.get('lore/name-pools/person-id-registry.json')
  const authoredFamily = documents.get('lore/name-pools/cast-family-trees.json')
  const family = validateCastFamilyTrees(authoredFamily, registry.persons, { diaspora: documents.get('lore/name-pools/diaspora-family-lineages.json') })
  const atlas = documents.get('lore/World-Narrative-Atlas.json').data.atlas
  const config = documents.get('lore/relations/relations.json')
  const people = new Map(registry.persons.map(person => [person.id, person]))
  const nodes = new Map(family.nodes.map(node => [node.id, node]))
  if (ledger.quantityContract.mode !== 'existing-only' || ledger.quantityContract.courts !== config.courts.length || ledger.quantityContract.directRetainers !== config.directRetainers.length) fail('E_HOUSEHOLD_QUANTITY')
  const seenPeople = new Set()
  const seenLinks = new Set()
  for (const person of ledger.people) {
    if (people.get(person.personId)?.name !== person.name || seenPeople.has(person.personId)) fail('E_HOUSEHOLD_PERSON', person.personId)
    seenPeople.add(person.personId)
    if (!person.sourceRefs.length) fail('E_HOUSEHOLD_SOURCE_REF', person.personId)
    person.sourceRefs.forEach(ref => resolveRef(ref, documents))
    if (person.household.newPrivateRetainers.length) fail('E_HOUSEHOLD_PRIVATE_APPOINTMENT', person.personId)
    for (const faith of [person.household.personFaith, person.household.houseFaith]) {
      if (!['unknown', 'christian', 'non-christian'].includes(faith.status) || !Array.isArray(faith.sourceRefs) || (faith.status !== 'unknown' && !faith.sourceRefs.length)) fail('E_HOUSEHOLD_FAITH', person.personId)
      faith.sourceRefs.forEach(ref => resolveRef(ref, documents))
    }
    const hostile = person.household.politicalPosition === 'enemy'
    if (person.household.humanoidAdmission !== (hostile ? 'excluded' : 'deferred') || person.household.genderPreference !== (hostile ? 'not-applicable' : 'individual-review')) fail('E_HOUSEHOLD_ADMISSION', person.personId)
    for (const link of person.links) {
      if (!nonempty(link.id) || seenLinks.has(link.id) || !nonempty(link.role) || !nonempty(link.basis) || !['preserved', 'owner-authored'].includes(link.status) || !link.sourceRefs.length) fail('E_HOUSEHOLD_LINK', link.id)
      seenLinks.add(link.id)
      const refs = link.sourceRefs.map(ref => resolveRef(ref, documents))
      if (link.recipientId === person.personId) fail('E_HOUSEHOLD_SELF_LINK', link.id)
      if (link.recipientKind === 'person') {
        const recipient = people.get(link.recipientId)
        if (!recipient || link.type !== 'contract' || link.status !== 'owner-authored') fail('E_HOUSEHOLD_RECIPIENT', link.id)
        // Both parties need actual card blocks, not a whole-document citation or unrelated pointer.
        for (const name of [person.name, recipient.name]) if (!refs.some(block => block.anchor?.startsWith('인물-' + name + '-') || block.anchor?.startsWith(name + '-'))) fail('E_HOUSEHOLD_PARTY_SOURCE', link.id)
      } else if (link.recipientKind === 'family-node') {
        if (!nodes.has(link.recipientId) || link.type !== 'kin' || !refs.some(edge => edge.from === link.recipientId && edge.to === person.personId && edge.type === 'biological')) fail('E_HOUSEHOLD_KIN_SOURCE', link.id)
      } else fail('E_HOUSEHOLD_RECIPIENT_KIND', link.id)
    }
  }
  if (JSON.stringify([...seenPeople].sort()) !== JSON.stringify([...ledger.scope.coveredPersonIds].sort())) fail('E_HOUSEHOLD_SCOPE')
  if (seenPeople.size !== people.size || [...people.keys()].some(id => !seenPeople.has(id))) fail('E_HOUSEHOLD_COHORT_COVERAGE')
  const relations = documents.get('lore/characters/Cast-Relations.json')
  const idByName = new Map(registry.persons.map(person => [person.name, person.id]))
  const normalized = relations.content.flatMap((block, index) => block.kind === 'table' ? block.rows.map((row, sourceRow) => ({
    from: idByName.get(row[0].ko) ?? row[0].ko, to: idByName.get(row[2].ko) ?? row[2].ko,
    type: row[1].ko, role: row[3].ko, path: 'lore/characters/Cast-Relations.json', anchor: `/content/${index}/rows/${sourceRow}`,
  })) : [])
  const commandRows = relations.content.find(block => block.anchor === config.courtContract.sourceAnchor).rows
  const checkRetainer = row => {
    const baseline = config.directRetainers.find(entry => entry.personId === row.personId)
    if (!baseline || Object.keys(baseline).some(key => baseline[key] !== row[key]) || row.role !== commandRows[baseline.sourceRow][3].ko || !row.sourceRefs.some(ref => resolveRef(ref, documents).personId === row.personId) || !row.sourceRefs.some(ref => Array.isArray(resolveRef(ref, documents)) && resolveRef(ref, documents)[3]?.ko === row.role)) fail('E_HOUSEHOLD_RETAINER_PROJECTION', row.personId)
  }
  for (const person of ledger.people) {
    const expected = [
      ...family.edges.flatMap((edge, index) => edge.from === person.personId || edge.to === person.personId ? [{ recipientId: edge.from === person.personId ? edge.to : edge.from, type: edge.type, direction: edge.from === person.personId ? 'outgoing' : 'incoming', role: edge.type, ...(index < authoredFamily.edges.length ? { path: 'lore/name-pools/cast-family-trees.json', anchor: `/edges/${index}` } : edge.sourceRefs[0]) }] : []),
      ...normalized.flatMap(row => row.from === person.personId || row.to === person.personId ? [{ recipientId: row.from === person.personId ? row.to : row.from, type: row.type, direction: row.from === person.personId ? 'outgoing' : 'incoming', role: row.role, path: row.path, anchor: row.anchor }] : []),
    ]
    if (person.knownLinks.length !== expected.length) fail('E_HOUSEHOLD_KNOWN_COVERAGE', person.personId)
    for (const [index, link] of person.knownLinks.entries()) {
      const source = expected[index]
      if (link.status !== 'source-projection' || ['recipientId', 'type', 'direction', 'role'].some(key => link[key] !== source[key]) || !link.sourceRefs.some(ref => ref.path === source.path && ref.anchor === source.anchor)) fail('E_HOUSEHOLD_KNOWN_SOURCE', person.personId)
      link.sourceRefs.forEach(ref => resolveRef(ref, documents))
      if (!people.has(link.recipientId) && !nodes.has(link.recipientId)) fail('E_HOUSEHOLD_KNOWN_FK', link.recipientId)
    }
    const hasSocial = normalized.some(row => row.from === person.personId || row.to === person.personId)
    if (person.deficits.normalizedSocialContact !== !hasSocial || person.deficits.familyParent !== !family.edges.some(edge => edge.to === person.personId) || person.deficits.faithUnresolved !== [person.household.personFaith, person.household.houseFaith].some(faith => faith.status === 'unknown')) fail('E_HOUSEHOLD_DEFICIT', person.personId)
    const court = config.courts.find(court => court.ownerPersonId === person.personId)
    if (!!person.court !== !!court) fail('E_HOUSEHOLD_COURT_PROJECTION', person.personId)
    if (court) {
      if (Object.keys(court).some(key => person.court[key] !== court[key])) fail('E_HOUSEHOLD_COURT_PROJECTION', person.personId)
      const members = config.directRetainers.filter(row => row.courtId === court.id)
      if (person.court.retainers.length !== members.length || members.some(row => !person.court.retainers.some(member => member.personId === row.personId))) fail('E_HOUSEHOLD_COURT_MEMBERS', person.personId)
      person.court.retainers.forEach(checkRetainer)
    }
    const direct = config.directRetainers.find(row => row.personId === person.personId)
    if (!!direct !== !!person.directRetainer) fail('E_HOUSEHOLD_RETAINER_PROJECTION', person.personId)
    if (direct) checkRetainer(person.directRetainer)
  }
  const seenActors = new Set()
  for (const row of ledger.existingHumanoidContext) {
    const actor = atlas.synthetics.find(actor => actor.id === row.actorId && actor.cls === 'H')
    if (!actor || seenActors.has(row.actorId) || row.custodianPersonId !== actor.relations.find(ref => ref.kind === 'custodian')?.target || row.stewardHouseId !== actor.house_id || row.scope !== 'facility-maintenance' || row.assignmentAction !== 'preserve' || !row.sourceRefs.some(ref => resolveRef(ref, documents).id === actor.id)) fail('E_HOUSEHOLD_H_CUSTODY', row.actorId)
    seenActors.add(row.actorId)
  }
  if (seenActors.size !== atlas.synthetics.filter(actor => actor.cls === 'H').length) fail('E_HOUSEHOLD_H_COVERAGE')
  return ledger
}

/** Return separate draft links for parent composition; never merge them into authored courts or Cast-Relations. */
export function projectCastHouseholdRelations(ledger, documents, personId, proposedCourtConfig) {
  validateCastHouseholdRelations(ledger, documents)
  const baseline = documents.get('lore/relations/relations.json')
  if (validateExistingHouseholdCounts(baseline, proposedCourtConfig ?? baseline).length) fail('E_HOUSEHOLD_EXISTING_COUNTS')
  const person = ledger.people.find(person => person.personId === personId)
  return person ? { status: 'draft', personId, links: structuredClone(person.links), household: structuredClone(person.household), knownLinks: structuredClone(person.knownLinks), court: structuredClone(person.court), directRetainer: structuredClone(person.directRetainer), deficits: structuredClone(person.deficits) } : null
}
