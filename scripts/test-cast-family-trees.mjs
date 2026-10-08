import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { FamilyTree } from '../src/components/FamilyTree.tsx'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'
import { importDiasporaFamilies, loadCastFamilyTrees, projectFamilyTree, validateCastFamilyTrees } from './cast-family-trees.mjs'

const sourceRefs = [{ path: 'lore/characters/Core-Characters.json' }]

test('all final foreign lane decisions preserve named endpoints and distinguish authoring from source proof', async () => {
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  assert.equal(decisions.finalOwnerAuthoredRoles.length, 385)
  for (const mapping of decisions.finalOwnerAuthoredRoles) {
    const edge = graph.edges.find(edge => edge.id === mapping.edgeId)
    assert.deepEqual([edge.from, edge.to, edge.type, edge.parentRole], [mapping.from, mapping.to, 'biological', mapping.parentRole])
    assert.equal(mapping.decisionKind, 'owner-authored')
    assert.ok(mapping.selectionRef)
  }
  assert.equal(graph.edges.filter(edge => edge.type === 'biological' && !edge.parentRole).length, 0)
  assert.equal(decisions.unresolved.length, 0)
})


test('applies all approved external ancestors without changing dates or given names', async () => {
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  for (const approved of decisions.approvedExternalMaternalAncestors) {
    const node = graph.nodes.find(node => node.id === approved.nodeId)
    assert.equal(node.name, approved.proposedAfter.name)
    assert.equal(node.birthDate, approved.birthDate)
    assert.equal(node.deathDate, approved.deathDate)
    assert.equal(node.name.slice(approved.proposedAfter.surname.length), approved.givenName)
    assert.equal(graph.edges.find(edge => edge.id === approved.edgeId).parentRole, 'father')
    assert.deepEqual(node.lineage, { surname: approved.proposedAfter.surname, bongwan: approved.proposedAfter.bongwan, clan: approved.proposedAfter.clan })
  }
  for (const approved of decisions.approvedConfirmedFatherRoles) assert.equal(graph.edges.find(edge => edge.from === approved.from && edge.to === approved.to).parentRole, 'father')
})


test('distinct historical IDs preserve namesakes and dates through projection and real rendering', () => {
  const ledger = fixture()
  const first = ledger.nodes[0]
  const second = { ...node('H-namesake', first.name, '1990-02-03', 'historical'), deathDate: '2027-01-01' }
  ledger.nodes.push(second)
  ledger.edges.push(edge(second.id, id('신준')))
  const graph = validateCastFamilyTrees(ledger, roster)
  const projected = projectFamilyTree(graph, id('신준'), new Map())
  assert.deepEqual(projected.nodes.filter(entry => entry.name === first.name).map(entry => [entry.id, entry.birthDate]), [[first.id, first.birthDate], [second.id, second.birthDate]])
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FamilyTree, { tree: projected })))
  for (const parent of [first, second]) {
    assert.ok(html.includes('data-family-node="' + parent.id + '"'))
    assert.ok(html.includes(parent.birthDate))
  }
  assert.ok(projected.edges.some(entry => entry.from === second.id && entry.to === id('신준')))
})

test('rejects conflicting identities sharing the same stable node ID', () => {
  const ledger = fixture()
  ledger.nodes.push({ ...ledger.nodes[0], name: 'different identity', birthDate: '1990-02-03' })
  assert.throws(() => validateCastFamilyTrees(ledger, roster), /E_FAMILY_DUPLICATE_NODE/)
})


test('preserves role-only mappings without inventing historical clans', async () => {
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  for (const mapping of decisions.ownerAuthoredRoleOnly) {
    assert.equal(graph.edges.find(edge => edge.id === mapping.edgeId).parentRole, mapping.parentRole)
    const external = decisions.approvedExternalMaternalAncestors?.find(node => node.nodeId === mapping.from)
    if (external) assert.deepEqual(graph.nodes.find(node => node.id === mapping.from).lineage, { surname: external.proposedAfter.surname, bongwan: external.proposedAfter.bongwan, clan: external.proposedAfter.clan })
    else assert.equal(graph.nodes.find(node => node.id === mapping.from).lineage, undefined)
  }
})

test('propagates Jinyang Jeong through two existing single-parent ancestor edges', async () => {
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  const hang = JSON.parse(await readFile(new URL('../lore/name-pools/cast-hangnyeol.json', import.meta.url), 'utf8'))
  const issued = hang.people.find(person => person.name === '정서온')
  const expected = { surname: issued.surname, bongwan: issued.bongwan, clan: issued.clan }
  for (const [from, to] of [['FH-K1005-X정일환-01', 'FH-EX-JEONG-ILHWAN'], ['FH-K1005-X정일환-02', 'FH-K1005-X정일환-01']]) {
    assert.equal(graph.edges.find(edge => edge.from === from && edge.to === to).parentRole, 'father')
    assert.deepEqual(graph.nodes.find(node => node.id === from).lineage, expected)
    assert.deepEqual(graph.nodes.find(node => node.id === to).lineage, expected)
    assert.equal(graph.edges.filter(edge => edge.to === to && edge.type === 'biological').length, 1)
  }
})

test.each(['applied-paternal-contract', 'explicit-diaspora-father', 'explicit-annals-father', 'complementary-maternal', 'owner-derived-maternal', 'owner-derived-lee-backpropagation'])('binds corrected %s roles to existing source pointers', async (category) => {
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  const corrections = decisions.sourceBoundRoleCorrections.filter(row => row.category === category)
  assert.ok(corrections.length)
  for (const correction of corrections) {
    assert.equal(graph.edges.find(edge => edge.id === correction.edgeId)?.parentRole, correction.after)
    for (const ref of correction.sourceRefs.filter(ref => ref.anchor.startsWith('/'))) {
      const document = JSON.parse(await readFile(new URL('../' + ref.path, import.meta.url), 'utf8'))
      const value = ref.anchor.slice(1).split('/').reduce((current, part) => current?.[part], document)
      assert.notEqual(value, undefined, correction.edgeId + ':' + ref.anchor)
    }
  }
})


test('source-bound corrections preserve all nineteen roles through the real loader', async () => {
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const graph = await loadCastFamilyTrees(new URL('../lore/', import.meta.url).pathname, registry)
  for (const correction of decisions.sourceBoundRoleCorrections) {
    assert.equal(graph.edges.find(edge => edge.id === correction.edgeId)?.parentRole, correction.after, correction.edgeId)
    assert.ok(correction.sourceRefs.length)
  }
  assert.equal(graph.edges.filter(edge => edge.type === 'biological').length, 5010)
  assert.equal(graph.edges.filter(edge => edge.parentRole).length, 5010)
})


test('rejects conflicting paternal clan across a historical generation', () => {
  const ledger = fixture()
  const line = { surname: '신', bongwan: '고령', clan: 'goryeong-shin' }
  ledger.nodes.find((entry) => entry.id === id('신종목')).lineage = line
  ledger.nodes.find((entry) => entry.id === id('신준')).lineage = { ...line, bongwan: '다른 본관' }
  ledger.edges.find((entry) => entry.to === id('신준')).parentRole = 'father'
  assert.throws(() => validateCastFamilyTrees(ledger, roster), /E_FAMILY_PATERNAL_LINE/)
})

test('rejects reintroduced same surname on an owner-corrected derived pair', async () => {
  const authored = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-trees.json', import.meta.url), 'utf8'))
  const decisions = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-role-decisions.json', import.meta.url), 'utf8'))
  const diaspora = JSON.parse(await readFile(new URL('../lore/name-pools/diaspora-family-lineages.json', import.meta.url), 'utf8'))
  const hang = JSON.parse(await readFile(new URL('../lore/name-pools/cast-hangnyeol.json', import.meta.url), 'utf8'))
  const pair = decisions.maternalCorrections[0]
  authored.nodes.find((entry) => entry.id === pair.motherId).lineage.surname = pair.fatherLine.surname
  // Keep the newly authored maternal paternal chain consistent so this fixture isolates co-parent surname rejection.
  for (const ancestor of decisions.approvedExternalMaternalAncestors.filter(entry => entry.motherId === pair.motherId)) authored.nodes.find(entry => entry.id === ancestor.nodeId).lineage.surname = pair.fatherLine.surname
  assert.throws(() => validateCastFamilyTrees(authored, registry, { diaspora, roleDecisions: decisions, lineages: new Map(hang.people.map((person) => [person.name, person])) }), /E_FAMILY_SAME_SURNAME/)
})

const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8')).persons
const roster = registry.filter((person) => ['신종목', '신준', '임하준', '임초원', '이연'].includes(person.name))
const id = (name) => roster.find((person) => person.name === name).id
const node = (id, name, birthDate, kind = 'person') => ({ id, personId: kind === 'historical' ? null : id, name, kind, birthDate, deathDate: null, status: 'preserved', sourceRefs,
  timeline: [{ year: kind === 'historical' ? 2026 : 2126, summary: `history-${id}`, sourceRefs }] })
const edge = (from, to, type = 'biological') => ({ id: `${from}:${to}:${type}`, from, to, type, status: 'preserved', sourceRefs })
const fixture = () => ({ schemaVersion: 1, referenceDate: '2126-12-31', collapseYear: 2026, status: 'authored', sourceRefs, imports: [],
  nodes: [node('H-test', 'ancestor', '2000-01-01', 'historical'), ...roster.map((person) => node(person.id, person.name,
    ['신종목', '임하준'].includes(person.name) ? '2080-01-01' : '2110-01-01', person.name === '이연' ? 'synthetic' : 'person'))],
  edges: [edge('H-test', id('신종목')), edge('H-test', id('임하준')), edge('H-test', id('이연'), 'custodial'),
    edge(id('신종목'), id('신준')), edge(id('임하준'), id('임초원'), 'adoptive')] })

test.each(['father', 'mother'])('rejects duplicate %s roles for one child', (parentRole) => {
  const ledger = fixture()
  ledger.edges.find((entry) => entry.to === id('신준')).parentRole = parentRole
  ledger.edges.push({ ...edge('H-test', id('신준')), parentRole })
  assert.throws(() => validateCastFamilyTrees(ledger, roster), /E_FAMILY_DUPLICATE_PARENT_ROLE/)
})

test.each([
  ['invalid value', 'biological', 'parent'],
  ['adoption', 'adoptive', 'father'],
  ['custody', 'custodial', 'mother'],
  ['household', 'household', 'father'],
])('rejects parent roles on %s', (_label, type, parentRole) => {
  const ledger = fixture()
  ledger.edges.push({ ...edge('H-test', id('신준'), type), parentRole })
  assert.throws(() => validateCastFamilyTrees(ledger, roster), /E_FAMILY_PARENT_ROLE/)
})

test('preserves explicit and unrecorded roles through validation and projection', () => {
  const ledger = fixture()
  ledger.edges.find((entry) => entry.to === id('신준')).parentRole = 'father'
  const graph = validateCastFamilyTrees(ledger, roster)
  const projected = projectFamilyTree(graph, id('신준'), new Map())
  assert.equal(projected.edges.find((entry) => entry.to === id('신준')).parentRole, 'father')
  assert.ok(projected.edges.filter((entry) => entry.to !== id('신준')).every((entry) => !('parentRole' in entry)))
  assert.deepEqual(graph.nodes, ledger.nodes)
  assert.deepEqual(graph.edges, ledger.edges)
})


test('preserves explicit biological and adoption edges without imposing numerical age gaps', () => {
  const ledger = fixture()
  ledger.nodes.find((person) => person.id === id('임초원')).birthDate = '2081-01-01'
  const graph = validateCastFamilyTrees(ledger, roster)
  assert.deepEqual(graph.edges, ledger.edges)
  assert.equal(graph.nodes.filter((person) => person.personId).length, roster.length)
})

test.each([
  ['coverage', (ledger) => ledger.nodes.pop(), /E_FAMILY_COVERAGE/],
  ['duplicate nodes', (ledger) => ledger.nodes.push(ledger.nodes[0]), /E_FAMILY_DUPLICATE_NODE/],
  ['registered identity name mismatch', (ledger) => { ledger.nodes[1].name = ledger.nodes[2].name }, /E_FAMILY_ROSTER_IDENTITY/],
  ['self parent', (ledger) => ledger.edges.push(edge('H-test', 'H-test')), /E_FAMILY_SELF_PARENT/],
  ['cycle', (ledger) => ledger.edges.push(edge(id('신준'), 'H-test', 'household')), /E_FAMILY_CYCLE/],
  ['parent birth', (ledger) => { ledger.nodes.find((n) => n.id === id('신준')).birthDate = '2070-01-01' }, /E_FAMILY_PARENT_BIRTH/],
  ['invalid calendar date', (ledger) => { ledger.nodes[0].birthDate = '2001-02-29' }, /E_BIRTH_DATE/],
  ['event before birth', (ledger) => { ledger.nodes[0].timeline[0].year = 1999 }, /E_FAMILY_EVENT_LIFETIME/],
  ['event after death', (ledger) => { ledger.nodes[0].deathDate = '2025-01-01' }, /E_FAMILY_EVENT_LIFETIME/],
  ['date after death', (ledger) => { ledger.nodes[0].deathDate = '2026-01-01'; ledger.nodes[0].timeline[0].date = '2026-10-14' }, /E_FAMILY_EVENT_DATE/],
  ['source metadata', (ledger) => { ledger.nodes[0].sourceRefs = [] }, /E_FAMILY_SOURCE_REFS/],
  ['no collapse witness', (ledger) => { ledger.nodes[0].timeline[0].year = 2027 }, /E_FAMILY_COLLAPSE_REACH/],
  ['synthetic biological parent', (ledger) => ledger.edges.push(edge('H-test', id('이연'))), /E_FAMILY_SYNTHETIC_PARENT/],
  ['synthetic kind erased', (ledger) => { ledger.nodes.find((n) => n.id === id('이연')).kind = 'person' }, /E_FAMILY_SYNTHETIC_IDENTITY/],
  ['adoption erased', (ledger) => { ledger.edges = ledger.edges.filter((e) => e.type !== 'adoptive') }, /E_FAMILY_PRESERVED_EDGE/],
  ['biological erased', (ledger) => { ledger.edges = ledger.edges.filter((e) => e.from !== id('신종목')) }, /E_FAMILY_PRESERVED_EDGE/],
])('rejects %s when graph invariants are broken', (_label, mutate, error) => {
  const ledger = fixture()
  mutate(ledger)
  assert.throws(() => validateCastFamilyTrees(ledger, roster), error)
})

test('joins roster coverage by registry IDs rather than a pinned roster count', () => {
  const ledger = fixture()
  const extra = registry.find((person) => !roster.some((p) => p.id === person.id))
  assert.throws(() => validateCastFamilyTrees(ledger, [...roster, extra]), /E_FAMILY_COVERAGE/)
})

test('rejects a graph birth conflicting with the birthday ledger', () => {
  const ledger = fixture()
  const birthdays = new Map(roster.map((p) => [p.id, { birthDate: '2100-01-01' }]))
  assert.throws(() => validateCastFamilyTrees(ledger, roster, { birthdays }), /E_FAMILY_BIRTH_CONFLICT/)
})

test('authoritative registered name and birth edits resolve through the real loader without stale graph copies', async () => {
  const root = await mkdtemp(join(tmpdir(), 'family-authority-'))
  try {
    await mkdir(join(root, 'name-pools'))
    await writeFile(join(root, 'name-pools/cast-hangnyeol.json'), JSON.stringify({ people: [] }))
    await writeFile(join(root, 'name-pools/clan-hangnyeol-tables.json'), JSON.stringify({ clans: [] }))
    await writeFile(join(root, 'name-pools/cast-family-role-decisions.json'), JSON.stringify({ derivedParentRoles: [], maternalCorrections: [] }))
    const ledger = fixture()
    const canonicalBirths = JSON.parse(await readFile(new URL('../lore/name-pools/cast-birthdays.json', import.meta.url), 'utf8')).people
    for (const node of ledger.nodes) if (node.personId) node.birthDate = canonicalBirths.find((entry) => entry.id === node.personId).birthDate
    const issued = structuredClone(roster)
    const personId = id('신준')
    issued.find((person) => person.id === personId).name = '정본 변경 이름'
    const birthdays = { schemaVersion: 1, ageAsOf: '2126-12-31', people: issued.map((person) => ({
      id: person.id, name: person.name, birthDate: person.id === personId ? '2111-02-03' : ledger.nodes.find((node) => node.id === person.id).birthDate,
      sourceStatus: 'owner-authored', sourceRefs: ['lore/characters/Core-Characters.json'],
    })) }
    await writeFile(join(root, 'name-pools/cast-family-trees.json'), JSON.stringify(ledger))
    await writeFile(join(root, 'name-pools/cast-birthdays.json'), JSON.stringify(birthdays))
    const graph = await loadCastFamilyTrees(root, issued)
    const node = graph.nodes.find((entry) => entry.id === personId)
    assert.equal(node.name, '정본 변경 이름')
    assert.equal(node.birthDate, '2111-02-03')
    assert.deepEqual(graph.nodes.find((entry) => entry.id === 'H-test'), ledger.nodes[0])
    assert.deepEqual(graph.edges, ledger.edges)
    const tree = projectFamilyTree(graph, personId, new Map())
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FamilyTree, { tree })))
    assert.ok(html.includes('정본 변경 이름') && html.includes('2111-02-03'))
    const eventConflict = structuredClone(ledger)
    eventConflict.nodes.find((entry) => entry.id === personId).timeline[0].year = 2110
    await writeFile(join(root, 'name-pools/cast-family-trees.json'), JSON.stringify(eventConflict))
    await assert.rejects(loadCastFamilyTrees(root, issued), /E_FAMILY_EVENT_LIFETIME/)
    await writeFile(join(root, 'name-pools/cast-family-trees.json'), JSON.stringify(ledger))
    for (const type of ['biological', 'adoptive']) {
      const removed = structuredClone(ledger)
      removed.edges = removed.edges.filter((edge) => !(edge.type === type && ['K1009', 'K086'].includes(edge.from)))
      await writeFile(join(root, 'name-pools/cast-family-trees.json'), JSON.stringify(removed))
      await assert.rejects(loadCastFamilyTrees(root, issued), /E_FAMILY_PRESERVED_EDGE/)
    }
    await writeFile(join(root, 'name-pools/cast-family-trees.json'), JSON.stringify(ledger))
    birthdays.people.find((person) => person.id === personId).birthDate = '2087-01-01'
    await writeFile(join(root, 'name-pools/cast-birthdays.json'), JSON.stringify(birthdays))
    await assert.rejects(loadCastFamilyTrees(root, issued), /E_FAMILY_PARENT_BIRTH/)
    birthdays.people.find((person) => person.id === personId).birthDate = '2086-12-31'
    await writeFile(join(root, 'name-pools/cast-birthdays.json'), JSON.stringify(birthdays))
    await assert.rejects(loadCastFamilyTrees(root, issued), /E_BIRTH_COHORT_RANGE/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('imports both diaspora families from their single canonical ledger and rejects duplicates', async () => {
  const diaspora = JSON.parse(await readFile(new URL('../lore/name-pools/diaspora-family-lineages.json', import.meta.url), 'utf8'))
  const imported = importDiasporaFamilies(diaspora)
  const diasporaRoster = registry.filter((person) => diaspora.lineages.some((line) => line.currentPersonId === person.id))
  const authored = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-trees.json', import.meta.url), 'utf8'))
  const importedIds = new Set(imported.nodes.map(node => node.id))
  const requiredAncestors = new Set(imported.edges.filter(edge => !importedIds.has(edge.from)).map(edge => edge.from))
  let added = true
  while (added) {
    added = false
    for (const edge of authored.edges) if (requiredAncestors.has(edge.to) && !requiredAncestors.has(edge.from)) {
      requiredAncestors.add(edge.from)
      added = true
    }
  }
  const ledger = { schemaVersion: 1, referenceDate: '2126-12-31', collapseYear: 2026, status: 'authored', sourceRefs,
    imports: [{ path: 'lore/name-pools/diaspora-family-lineages.json' }],
    nodes: authored.nodes.filter(node => requiredAncestors.has(node.id)),
    edges: authored.edges.filter(edge => requiredAncestors.has(edge.from) && requiredAncestors.has(edge.to)) }
  const graph = validateCastFamilyTrees(ledger, diasporaRoster, { diaspora })
  assert.deepEqual(graph.nodes.filter(node => importedIds.has(node.id)).map((n) => [n.id, n.birthDate]), imported.nodes.map((n) => [n.id, n.birthDate]))
  for (const edge of imported.edges) assert.ok(graph.nodes.some(node => node.id === edge.from))
  assert.equal(graph.nodes.filter((n) => n.personId).length, diasporaRoster.length)
  ledger.nodes.push(imported.nodes[0])
  assert.throws(() => validateCastFamilyTrees(ledger, diasporaRoster, { diaspora }), /E_FAMILY_DUPLICATE_NODE/)
})

test('projects linked relatives and renders typed edges, birthdays and ancestor events', () => {
  const graph = validateCastFamilyTrees(fixture(), roster)
  const routes = new Map(roster.map((person) => [person.id, `/people/test-${person.id}`]))
  const tree = projectFamilyTree(graph, id('신준'), routes)
  assert.ok(tree.nodes.some((n) => n.id === 'H-test'))
  assert.equal(tree.nodes.find((n) => n.id === id('신종목')).detailRoute, routes.get(id('신종목')))
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FamilyTree, { tree })))
  assert.match(html, /data-family-edge="biological"/)
  assert.match(html, /data-family-event-year="2026"/)
  assert.ok(html.includes(`data-family-node="${id('신준')}"`))
  assert.ok(html.includes(`href="${routes.get(id('신종목'))}"`))
  assert.ok(html.includes(tree.nodes[0].birthDate))
})

test('renders the projected graph through the actual person detail component', async () => {
  const graph = validateCastFamilyTrees(fixture(), roster)
  const routes = new Map(roster.map((person) => [person.id, `/people/test-${person.id}`]))
  const familyTree = projectFamilyTree(graph, id('신준'), routes)
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0001.json', import.meta.url), 'utf8'))
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail: { ...detail, familyTree }, personId: detail.id })))
  assert.ok(html.includes(`data-family-person-id="${id('신준')}"`))
  for (const node of familyTree.nodes) assert.ok(html.includes(`data-family-node="${node.id}"`))
  assert.ok(html.includes('data-family-event-year="2026"'))
})
