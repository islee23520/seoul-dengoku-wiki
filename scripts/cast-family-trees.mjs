import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ageInYears } from './cast-birthdays.mjs'

const text = (value) => typeof value === 'string' && value.trim().length > 0
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const types = ['biological', 'adoptive', 'custodial', 'creation', 'household']
const statuses = ['authored', 'preserved', 'reviewed']
const diasporaPath = 'lore/name-pools/diaspora-family-lineages.json'
const fail = (code, id = '') => { throw new Error(`${code}:${id}`) }
const sources = (refs, id) => {
  if (!Array.isArray(refs) || !refs.length || refs.some((ref) => !record(ref) || !text(ref.path) || (ref.anchor !== undefined && !text(ref.anchor)))) fail('E_FAMILY_SOURCE_REFS', id)
}
const metadata = (value, id) => {
  if (!statuses.includes(value.status)) fail('E_FAMILY_STATUS', id)
  sources(value.sourceRefs, id)
}

// Imported records retain canonical keys and dates; they are never copied into the authored graph.
export function importDiasporaFamilies(document) {
  if (!record(document) || !Array.isArray(document.lineages) || !text(document.sourceDocument)) fail('E_FAMILY_IMPORT_SCHEMA')
  const nodes = []
  const edges = []
  for (const lineage of document.lineages) {
    if (!text(lineage.key) || !Array.isArray(lineage.members)) fail('E_FAMILY_IMPORT_SCHEMA')
    for (const member of lineage.members) {
      const sourceRefs = [{ path: diasporaPath, anchor: `${lineage.key}/${member.key}` }]
      if (!text(member.key) || !text(member.name?.ko) || !Array.isArray(member.events) || !Array.isArray(member.parentKeys)) fail('E_FAMILY_IMPORT_MEMBER', member.key)
      const summary = member.timelineBio?.ko ?? member.narrative?.ko
      if (!text(summary)) fail('E_FAMILY_IMPORT_TIMELINE', member.key)
      nodes.push({ id: member.key, personId: member.personId ?? null, kind: member.personId ? 'person' : 'historical',
        name: member.name.ko, birthDate: member.birthDate, deathDate: member.deathDate ?? null,
        status: 'preserved', sourceRefs, timeline: member.events.map((event) => ({ year: event.year, ...(event.date ? { date: event.date } : {}), summary, sourceRefs })) })
      for (const parent of member.parentKeys) edges.push({ id: `${parent}:${member.key}:biological`, from: parent, to: member.key, type: 'biological', status: 'preserved', sourceRefs })
    }
  }
  return { nodes, edges }
}

export function validateCastFamilyTrees(ledger, roster, { diaspora, birthdays, preservedEdges = [] } = {}) {
  if (!record(ledger) || ledger.schemaVersion !== 1 || ledger.collapseYear !== 2026 || ledger.referenceDate !== '2126-12-31' || !Array.isArray(ledger.nodes) || !Array.isArray(ledger.edges) || !Array.isArray(ledger.imports)) fail('E_FAMILY_SCHEMA')
  metadata(ledger, 'ledger')
  let nodes = [...ledger.nodes]
  let edges = [...ledger.edges]
  const importPaths = new Set()
  for (const entry of ledger.imports) {
    if (!record(entry) || entry.path !== diasporaPath || importPaths.has(entry.path) || !diaspora) fail('E_FAMILY_IMPORT', entry?.path)
    importPaths.add(entry.path)
    const imported = importDiasporaFamilies(diaspora)
    nodes.push(...imported.nodes)
    edges.push(...imported.edges)
  }
  if (diaspora && !importPaths.has(diasporaPath)) fail('E_FAMILY_IMPORT_REQUIRED')
  const rosterById = new Map(roster.map((person) => [person.id, person]))
  const rosterByName = new Map(roster.map((person) => [person.name, person]))
  // These explicit parent contracts are recorded in Core-Characters, not inferred from a clan.
  const canonicalParents = [['신종목', '신준', 'biological'], ['임하준', '임초원', 'adoptive']]
  const requiredEdges = [...preservedEdges]
  for (const [parentName, childName, type] of canonicalParents) {
    const parent = rosterByName.get(parentName)
    const child = rosterByName.get(childName)
    if (parent && child) requiredEdges.push({ from: parent.id, to: child.id, type })
  }
  const byId = new Map()
  const byPersonId = new Map()
  const names = new Set()
  for (const node of nodes) {
    if (!record(node) || !text(node.id) || !text(node.name) || !['person', 'historical', 'synthetic'].includes(node.kind) || !Array.isArray(node.timeline) || !node.timeline.length) fail('E_FAMILY_NODE', node?.id)
    if (byId.has(node.id)) fail('E_FAMILY_DUPLICATE_NODE', node.id)
    if (names.has(node.name)) fail('E_FAMILY_DUPLICATE_NAME', node.id)
    names.add(node.name)
    metadata(node, node.id)
    ageInYears(node.birthDate, ledger.referenceDate)
    if (node.deathDate !== null) ageInYears(node.birthDate, node.deathDate)
    if (node.kind === 'historical') {
      if (node.personId !== null || /^K\d+$/u.test(node.id)) fail('E_FAMILY_HISTORICAL_ID', node.id)
    } else {
      const person = rosterById.get(node.personId)
      if (!person || node.id !== node.personId || person.name !== node.name) fail('E_FAMILY_ROSTER_IDENTITY', node.id)
      if (byPersonId.has(node.personId)) fail('E_FAMILY_DUPLICATE_PERSON', node.personId)
      if (person.name === '이연' && node.kind !== 'synthetic') fail('E_FAMILY_SYNTHETIC_IDENTITY', node.id)
      if (birthdays && birthdays.get(node.personId)?.birthDate !== node.birthDate) fail('E_FAMILY_BIRTH_CONFLICT', node.id)
      byPersonId.set(node.personId, node)
    }
    if (node.generationException !== undefined) {
      if (!record(node.generationException) || !text(node.generationException.reason)) fail('E_FAMILY_GENERATION_EXCEPTION', node.id)
      sources(node.generationException.sourceRefs, node.id)
    }
    for (const event of node.timeline) {
      if (!record(event) || !Number.isInteger(event.year) || !text(event.summary)) fail('E_FAMILY_EVENT', node.id)
      sources(event.sourceRefs, node.id)
      if (event.year < Number(node.birthDate.slice(0, 4)) || (node.deathDate && event.year > Number(node.deathDate.slice(0, 4)))) fail('E_FAMILY_EVENT_LIFETIME', node.id)
      if (event.date !== undefined) {
        ageInYears(node.birthDate, event.date)
        if (Number(event.date.slice(0, 4)) !== event.year || (node.deathDate && event.date > node.deathDate)) fail('E_FAMILY_EVENT_DATE', node.id)
      }
    }
    byId.set(node.id, node)
  }
  const missing = roster.filter((person) => !byPersonId.has(person.id)).map((person) => person.id)
  if (missing.length) fail('E_FAMILY_COVERAGE', missing.join(','))
  const edgeIds = new Set()
  const edgeKeys = new Set()
  const parents = new Map(nodes.map((node) => [node.id, []]))
  for (const edge of edges) {
    if (!record(edge) || !text(edge.id) || !types.includes(edge.type) || !byId.has(edge.from) || !byId.has(edge.to)) fail('E_FAMILY_EDGE', edge?.id)
    metadata(edge, edge.id)
    const key = `${edge.from}:${edge.to}:${edge.type}`
    if (edgeIds.has(edge.id) || edgeKeys.has(key)) fail('E_FAMILY_DUPLICATE_EDGE', edge.id)
    edgeIds.add(edge.id)
    edgeKeys.add(key)
    if (edge.from === edge.to) fail('E_FAMILY_SELF_PARENT', edge.id)
    const parent = byId.get(edge.from)
    const child = byId.get(edge.to)
    if (edge.type === 'biological' && child.kind === 'synthetic') fail('E_FAMILY_SYNTHETIC_PARENT', edge.to)
    // Thirty years is an authoring baseline, not a minimum gap for preserved dates.
    if (['biological', 'adoptive'].includes(edge.type) && parent.birthDate >= child.birthDate) fail('E_FAMILY_PARENT_BIRTH', edge.id)
    parents.get(edge.to).push(edge.from)
  }
  for (const edge of requiredEdges) if (!edgeKeys.has(`${edge.from}:${edge.to}:${edge.type}`)) fail('E_FAMILY_PRESERVED_EDGE', edge.id ?? edge.to)
  const visiting = new Set()
  const complete = new Set()
  const reachesCollapse = new Map()
  const visit = (id) => {
    if (visiting.has(id)) fail('E_FAMILY_CYCLE', id)
    if (complete.has(id)) return reachesCollapse.get(id)
    visiting.add(id)
    const node = byId.get(id)
    // An unknown death date is not evidence of living for a century: an explicit 2026 event is required.
    let reaches = node.birthDate <= '2026-12-31' && (node.deathDate ? node.deathDate >= '2026-01-01' : node.timeline.some((event) => event.year === 2026))
    for (const parent of parents.get(id)) reaches = visit(parent) || reaches
    visiting.delete(id)
    complete.add(id)
    reachesCollapse.set(id, reaches)
    return reaches
  }
  for (const node of nodes) visit(node.id)
  for (const person of roster) if (!reachesCollapse.get(byPersonId.get(person.id).id)) fail('E_FAMILY_COLLAPSE_REACH', person.id)
  return { ...ledger, nodes, edges }
}

export async function loadCastFamilyTrees(loreRoot, roster, options = {}) {
  const ledger = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/cast-family-trees.json'), 'utf8'))
  const diaspora = ledger.imports?.some((entry) => entry.path === diasporaPath)
    ? JSON.parse(await readFile(resolve(loreRoot, 'name-pools/diaspora-family-lineages.json'), 'utf8')) : undefined
  return validateCastFamilyTrees(ledger, roster, { ...options, diaspora })
}

export function projectFamilyTree(graph, personId, detailRoutes) {
  const included = new Set([personId])
  let changed = true
  while (changed) {
    changed = false
    for (const edge of graph.edges) if (included.has(edge.to) && !included.has(edge.from)) { included.add(edge.from); changed = true }
  }
  // Show current relatives sharing an explicit parent, never people sharing only a surname or clan.
  const ancestors = new Set(included)
  for (const edge of graph.edges) if (ancestors.has(edge.from)) included.add(edge.to)
  return { personId, nodes: graph.nodes.filter((node) => included.has(node.id)).map((node) => ({ ...node, detailRoute: node.personId ? detailRoutes.get(node.personId) ?? null : null })),
    edges: graph.edges.filter((edge) => included.has(edge.from) && included.has(edge.to)) }
}
