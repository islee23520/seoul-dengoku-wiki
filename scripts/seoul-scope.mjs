import { createHash } from 'node:crypto'

export const SEOUL_SCOPE_SCHEMA = 'seoul-scope.v1'
export const BASELINE_SHA256 = '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223'
export const STAGING_GEOGRAPHY_SCHEMA = 'seoul-geography-staging.v1'
export const STAGING_GEOGRAPHY_PATH = 'lore/regions/seoul-electoral-titles.json'
// Independently reviewed task-2 inputs, not a denominator computed from new definitions.
export const STAGING_SOURCES = {
  membership: { path: 'data/geography/elections/sources/seoul-constituency-membership.json', sha256: '5c082aad68af1145dca138d8bf048a9b16e5a13b8618aa7c8c2e79bfc3db74f1' },
  census: { path: '.omo/private/seoul-migration/task-2-source-audit/correspondence-census.json', sha256: '6e278a5ba60ecb3660363bd9605dd436f17925f564fc943041954e5b4235ed94' },
  rights: { path: '.omo/private/seoul-migration/task-2-source-audit/existing-rights-inventory.json', sha256: '23551e091a271b6873739fa059da8c20d98d4c20c4ea69df230dcd0628f215ac' },
}
export const RANKS = ['barony', 'county', 'duchy', 'kingdom', 'empire']
export const ENTITY_SETS = ['persons', 'titles', 'holdings', 'grants', 'bindings', 'states', 'polities', 'events', 'relations', 'courts']
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const text = value => typeof value === 'string' && value.trim().length > 0
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const requireValue = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
const list = (value, path) => { requireValue(Array.isArray(value), 'E_SCOPE_SHAPE', path); return value }
const strings = (value, path) => { list(value, path); requireValue(value.every(text), 'E_SCOPE_SHAPE', path); return value }
function shape(value, fields, path) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), 'E_SCOPE_SHAPE', path)
  for (const key of Object.keys(value)) requireValue(fields.includes(key), 'E_SCOPE_SHAPE', `${path}/${key}`)
  for (const key of fields) requireValue(Object.hasOwn(value, key), 'E_SCOPE_SHAPE', `${path}/${key}`)
}
function unique(rows, key, path, code = 'E_SCOPE_ADMISSION') {
  const index = new Map()
  for (const row of rows) {
    const id = key(row)
    requireValue(text(id) && !index.has(id), code, path, id)
    index.set(id, row)
  }
  return index
}
function exact(actual, expected, code, path) {
  const a = unique(actual, x => x, path, code)
  const b = unique(expected, x => x, path, code)
  for (const id of b.keys()) requireValue(a.has(id), code, path, id)
  for (const id of a.keys()) requireValue(b.has(id), code, path, id)
}

// Proposal arrays are sets of ID/key-addressed records. Body bytes are never canonicalized.
export function canonicalProposal(value) {
  if (Array.isArray(value)) return value.map(canonicalProposal).sort((a, b) => {
    const key = x => JSON.stringify(x && typeof x === 'object' ? x.id ?? x.key ?? x : x)
    return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
  })
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalProposal(value[key])]))
  return value
}
export const proposalHash = value => sha256(JSON.stringify(canonicalProposal(value)))
export const coverageKey = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.locale, row.originalSha256])

// This denominator includes unpublished, editorial, machine and sealed sources, never catalog admission.
export function baselineDocuments(baseline) {
  return baseline.files.filter(file => ['authored-doc', 'authored-lore', 'machine-source', 'snapshot-source', 'sealed-history'].includes(file.kind)
    || !file.path.includes('/') && /\.md$/.test(file.path)).map(file => file.path).sort()
}

function checkApproval(approval, kind, batchId, hash, path) {
  shape(approval, ['kind', 'batchId', 'bodySha256', 'messageRef'], path)
  requireValue(approval.kind === kind, 'E_APPROVAL_KIND', path, batchId)
  requireValue(approval.batchId === batchId && approval.bodySha256 === hash && digest(hash) && text(approval.messageRef), 'E_APPROVAL_BATCH', path, batchId)
}

// This version only represents private preparation. It has no ready/public state and
// cannot supply an approved parent, official geometry or an active right by inference.
export function stagingGeography(facts, baseline, boundary) {
  shape(facts, ['schema', 'sources'], '/facts')
  requireValue(facts.schema === STAGING_GEOGRAPHY_SCHEMA, 'E_SCOPE_SHAPE', '/facts/schema')
  shape(facts.sources, ['membership', 'census', 'rights'], '/facts/sources')
  const inputs = {}
  const evidence = {}
  for (const [kind, source] of Object.entries(facts.sources)) {
    shape(source, ['path', 'sha256', 'body'], `/facts/sources/${kind}`)
    requireValue(text(source.path) && digest(source.sha256) && typeof source.body === 'string'
      && sha256(source.body) === source.sha256, 'E_SLOT_EDITION', `/facts/sources/${kind}`)
    try { inputs[kind] = JSON.parse(source.body) }
    catch { fail('E_SCOPE_SHAPE', `/facts/sources/${kind}/body`) }
    evidence[kind] = { path: source.path, sha256: source.sha256 }
  }
  const { membership, census, rights } = inputs
  requireValue(membership.schema === 'seoul-constituency-membership.v1'
    && census.schema === 'task-2-seoul-correspondence-census.v1'
    && rights.schema === 'task-2-existing-rights-audit.v1', 'E_SCOPE_SHAPE', '/facts/sources/schema')
  const sourceIndex = unique(list(membership.sources, '/facts/membership/sources'), row => row.id, '/facts/membership/sources', 'E_SCOPE_REF')
  for (const source of sourceIndex.values()) requireValue(digest(source.sha256) && text(source.role), 'E_SCOPE_SHAPE', '/facts/membership/sources', source.id)
  // All source references, including edition/bridge references, resolve by exact ID.
  function sourceRefs(value, key = '') {
    if (key === 'sourceRefs' || key.endsWith('SourceRefs') || key.endsWith('SourceRef')) {
      for (const id of Array.isArray(value) ? value : [value]) requireValue(sourceIndex.has(id), 'E_SCOPE_REF', '/facts/membership/sourceRefs', id)
    } else if (value && typeof value === 'object') for (const [child, row] of Object.entries(value)) sourceRefs(row, child)
  }
  sourceRefs(membership)
  const editions = membership.editions
  const editionIds = Object.values(editions).map(row => row.id)
  unique(editionIds, id => id, '/facts/editions', 'E_SLOT_EDITION')
  const lookup = sourceIndex.get(editions.currentCorrespondence.codeAndNameSourceRef)
  requireValue(lookup?.sha256 === boundary.sha256 && lookup.officialAuthority === false
    && membership.geometryVerified === false, 'E_SCOPE_GEOMETRY', '/facts/candidateGeometry')
  exact(membership.gu.map(g => JSON.stringify([g.guId, g.name, g.electoralDongCount, g.currentCorrespondenceCount])),
    census.guCounts.map(g => JSON.stringify([g.guId, g.gu, g.electoralVintageDongs, g.geometryRows])), 'E_SLOT_COVERAGE', '/facts/gu')
  const guIds = new Map(membership.gu.map(g => [g.name, g.guId]))
  exact(membership.constituencies.map(c => c.name), census.constituencies.map(c => c.name), 'E_SLOT_COVERAGE', '/facts/counties')
  exact(membership.constituencies.flatMap(c => c.electoralDongs.flatMap(d => d.currentCorrespondences.map(r =>
    JSON.stringify([c.name, d.guId, d.sourceName, d.fragmentId, r.candidateAdminId, r.candidateName])))),
  census.constituencies.flatMap(c => c.correspondences.flatMap(d => d.candidateAdminIds.map((id, i) =>
    JSON.stringify([c.name, guIds.get(d.gu), d.officialDong, d.fragmentId, id, d.candidateNames[i]])))), 'E_SLOT_COVERAGE', '/facts/membership')
  for (const set of ['titles', 'holdings', 'grants', 'bindings']) {
    exact(rights[set].map(row => set === 'bindings' ? JSON.stringify([row.original.holdingId, row.original.titleId]) : row.original.id),
      baseline.currentEntitySets[set], 'E_CENSUS_RIGHT', `/facts/rights/${set}`)
  }
  const rightIndex = unique([...rights.holdings, ...rights.grants], row => row.original.id, '/facts/rights', 'E_SCOPE_REF')
  const rightSources = unique(rights.sources, row => row.path, '/facts/rights/sources', 'E_SCOPE_REF')
  for (const right of rightIndex.values()) {
    const original = baseline.files.find(file => file.path === right.source.path)
    requireValue(original && rightSources.get(right.source.path)?.sha256 === original.sha256
      && right.source.recordSha256 === sha256(JSON.stringify(right.original)), 'E_ARCHIVE_HASH', '/facts/rights/source', right.original.id)
  }
  const countyRights = unique(rights.counties, row => row.name, '/facts/rights/counties', 'E_SCOPE_REF')
  exact([...countyRights.keys()], membership.constituencies.map(c => c.name), 'E_SLOT_COVERAGE', '/facts/rights/counties')
  const definition = (titleId, rank, name, jurisdictionRefs, sourcePointer, sourceRefs) => ({
    titleId, rank, name, jurisdictionRefs, sourcePointer, sourceRefs,
    feudalParentTitleId: null, feudalParentStatus: rank === 'empire' ? 'not-applicable' : 'pending',
  })
  const titles = [definition('geography:empire:seoul', 'empire', '서울특별시', membership.gu.map(g => g.guId), '/gu', editions.currentLaw.sourceRefs),
    ...membership.gu.map((g, i) => definition(`geography:duchy:${g.guId}`, 'duchy', g.name, [g.guId], `/gu/${i}`, g.sourceRefs))]
  const countySlots = []
  for (const [index, county] of membership.constituencies.entries()) {
    requireValue(county.sourceEdition === editions.electoral.id && county.membershipConfidence === 'primary-confirmed'
      && county.geometryVerified === false, 'E_SLOT_EDITION', '/facts/counties', county.constituencyId)
    exact(county.jurisdictionGuRefs, [...new Set(county.electoralDongs.map(d => d.guId))], 'E_TITLE_HIERARCHY', '/facts/jurisdictionGuRefs')
    const titleId = `geography:county:${county.constituencyId}`
    titles.push(definition(titleId, 'county', county.name, county.jurisdictionGuRefs, `/constituencies/${index}`, county.sourceRefs))
    const historic = countyRights.get(county.name)
    exact(historic.jurisdictionGuRefs, county.jurisdictionGuRefs, 'E_TITLE_HIERARCHY', '/facts/rights/jurisdictionGuRefs')
    const slots = county.electoralDongs.flatMap((dong, d) => dong.currentCorrespondences.map((row, r) => {
      requireValue(row.sourceEdition === editions.currentCorrespondence.id && row.geometryVerified === false
        && row.codeConfidence === 'dated-candidate-name-code-match' && dong.fragmentId === null,
      'E_SLOT_EDITION', '/facts/correspondence', row.candidateAdminId)
      const dongId = `region:${row.candidateAdminId}`
      const past = historic.dongs.find(item => item.dongId === dongId && item.fragmentId === dong.fragmentId)
      requireValue(past && past.officialElectoralDong === dong.sourceName, 'E_SCOPE_REF', '/facts/rights/dong', dongId)
      const historicalHoldingRefs = past.holdingRefs.map(id => {
        const right = rightIndex.get(id)
        requireValue(right && right.audit.category === 'direct-admin-property'
          && right.original.adminRefs.some(ref => ref.id.replace(/^region:/, '') === row.candidateAdminId), 'E_SCOPE_REF', '/facts/rights/holding', id)
        return { id, sourcePath: right.source.path, jsonPointer: right.source.pointer,
          sourceSha256: rightSources.get(right.source.path).sha256, recordSha256: right.source.recordSha256,
          scopeKind: 'historical-direct-admin-property', status: 'pending-new-seoul-correspondence' }
      })
      unique(historicalHoldingRefs, ref => ref.id, '/facts/rights/holding', 'E_SCOPE_REF')
      return { slotId: `slot:${dongId}`, dongId, name: row.candidateName, jurisdictionGuRef: dong.guId,
        electoralDongId: dong.electoralDongId, fragmentId: null, sourceEdition: row.sourceEdition,
        sourcePointer: `/constituencies/${index}/electoralDongs/${d}/currentCorrespondences/${r}`,
        sourceRefs: row.membershipSourceRefs, candidateGeometryRefs: [dongId], geometryRefs: [], geometryVerified: false,
        historicalHoldingRefs, holdingRefs: [], status: 'unassigned', holderPersonId: null }
    }))
    exact(historic.dongs.map(d => JSON.stringify([d.dongId, d.fragmentId])), slots.map(s => JSON.stringify([s.dongId, s.fragmentId])), 'E_SLOT_COVERAGE', '/facts/rights/dongs')
    countySlots.push({ countyTitleId: titleId, slots })
  }
  unique(titles, t => t.titleId, '/facts/titles', 'E_TITLE_HIERARCHY')
  unique(countySlots.flatMap(g => g.slots), s => s.slotId, '/facts/slots', 'E_SLOT_DUPLICATE')
  return { schema: STAGING_GEOGRAPHY_SCHEMA, status: 'inspection-only', evidence, editions,
    sourceRecords: membership.sources.map(({ id, sha256, role }) => ({ id, sha256, role })),
    officialExtentStatus: 'unverified', kingdomStatus: 'pending', mapMinimumRank: 'county', mapTitleIds: [], titles, countySlots }
}

function checkStagingGeography(geography, facts, input, mode) {
  requireValue(mode === 'inspection', 'E_SCOPE_PENDING', '/geography/status')
  const expected = stagingGeography(facts, input.baseline, input.boundary)
  // Exact nested shapes: no unchecked metadata, approval fields, invented parents or holders.
  function compare(actual, source, path) {
    if (Array.isArray(source)) {
      list(actual, path)
      requireValue(actual.length === source.length, 'E_SLOT_COVERAGE', path)
      source.forEach((row, i) => compare(actual[i], row, `${path}/${i}`))
    } else if (source && typeof source === 'object') {
      shape(actual, Object.keys(source), path)
      for (const key of Object.keys(source)) compare(actual[key], source[key], `${path}/${key}`)
    } else requireValue(actual === source, 'E_SLOT_EDITION', path)
  }
  compare(geography, expected, '/geography')
  for (const slot of geography.countySlots.flatMap(group => group.slots)) {
    const ref = input.refs.find(row => row.id === slot.dongId)
    requireValue(ref?.kind === 'region' && ref.inside === true && ref.boundarySha256 === input.boundary.sha256,
      'E_SCOPE_REF', '/geography/candidateGeometryRefs', slot.dongId)
  }
}

function checkGeography(geography, facts, resolveRef, final, people, resolveHolding) {
  shape(geography, ['sourceEdition', 'titles', 'countySlots', 'kingdomStatus', 'mapMinimumRank', 'mapTitleIds'], '/geography')
  shape(facts, ['sourceEdition', 'counties', 'districtRefs', 'dongRefs'], '/facts')
  requireValue(geography.sourceEdition === facts.sourceEdition, 'E_SLOT_EDITION', '/geography/sourceEdition')
  const titles = unique(list(geography.titles, '/geography/titles'), t => t.titleId, '/geography/titles', 'E_TITLE_HIERARCHY')
  for (const title of titles.values()) {
    shape(title, ['titleId', 'rank', 'parentTitleId', 'jurisdictionRefs', 'basis'], '/geography/titles')
    requireValue(RANKS.includes(title.rank) && text(title.basis), 'E_TITLE_HIERARCHY', '/geography/titles', title.titleId)
    const refs = strings(title.jurisdictionRefs, '/geography/jurisdictionRefs')
    requireValue(refs.length > 0, 'E_TITLE_HIERARCHY', '/geography/jurisdictionRefs', title.titleId)
    refs.forEach(ref => resolveRef(ref, '/geography/jurisdictionRefs', title.titleId))
    if (title.rank === 'empire') requireValue(title.parentTitleId === null, 'E_TITLE_HIERARCHY', '/geography/parentTitleId', title.titleId)
    else {
      const parent = titles.get(title.parentTitleId)
      requireValue(parent && RANKS.indexOf(parent.rank) === RANKS.indexOf(title.rank) + 1,
        'E_TITLE_HIERARCHY', '/geography/parentTitleId', title.titleId)
    }
  }
  requireValue([...titles.values()].filter(t => t.rank === 'empire').length === 1, 'E_TITLE_HIERARCHY', '/geography/titles')
  const counties = list(facts.counties, '/facts/counties')
  counties.forEach(county => {
    shape(county, ['titleId', 'districtRef', 'parts'], '/facts/counties')
    list(county.parts, '/facts/parts').forEach(part => {
      shape(part, ['dongId', 'fragmentId', 'geometryRefs'], '/facts/parts')
      requireValue(part.fragmentId === null || text(part.fragmentId), 'E_SLOT_EDITION', '/facts/parts')
      strings(part.geometryRefs, '/facts/geometryRefs')
    })
  })
  exact([...titles.values()].filter(t => t.rank === 'county').map(t => t.titleId), counties.map(t => t.titleId), 'E_SLOT_COVERAGE', '/geography/counties')
  const groups = unique(list(geography.countySlots, '/geography/countySlots'), x => x.countyTitleId, '/geography/countySlots', 'E_SLOT_DUPLICATE')
  exact([...groups.keys()], counties.map(t => t.titleId), 'E_SLOT_COVERAGE', '/geography/countySlots')
  const allSlots = [...groups.values()].flatMap(group => list(group.slots, '/geography/slots'))
  unique(allSlots, slot => slot.slotId, '/geography/slots', 'E_SLOT_DUPLICATE')
  unique(allSlots, slot => JSON.stringify([slot.dongId, slot.fragmentId]), '/geography/slots', 'E_SLOT_DUPLICATE')
  const sourceParts = counties.flatMap(county => county.parts)
  unique(sourceParts, part => JSON.stringify([part.dongId, part.fragmentId]), '/facts/parts', 'E_SLOT_DUPLICATE')
  for (const dong of facts.dongRefs) {
    const fragments = sourceParts.filter(part => part.dongId === dong)
    requireValue(fragments.length === 1 || fragments.every(part => part.fragmentId !== null), 'E_SLOT_COVERAGE', '/facts/parts', dong)
    unique(fragments.flatMap(part => part.geometryRefs), id => id, '/facts/geometryRefs', 'E_SLOT_DUPLICATE')
  }
  const slotIds = new Set()
  const parts = new Set()
  for (const county of counties) {
    const title = titles.get(county.titleId)
    const parent = titles.get(title.parentTitleId)
    exact(parent.jurisdictionRefs, [county.districtRef], 'E_TITLE_HIERARCHY', `/geography/${county.titleId}/parent`)
    const slots = list(groups.get(county.titleId).slots, '/geography/slots')
    shape(groups.get(county.titleId), ['countyTitleId', 'slots'], '/geography/countySlots')
    exact(slots.map(s => JSON.stringify([s.dongId, s.fragmentId])), county.parts.map(s => JSON.stringify([s.dongId, s.fragmentId])), 'E_SLOT_COVERAGE', `/geography/${county.titleId}`)
    for (const slot of slots) {
      shape(slot, ['slotId', 'dongId', 'fragmentId', 'sourceEdition', 'geometryRefs', 'holdingRefs', 'status', 'holderPersonId'], '/geography/slots')
      const key = JSON.stringify([slot.dongId, slot.fragmentId])
      requireValue(!slotIds.has(slot.slotId) && !parts.has(key), 'E_SLOT_DUPLICATE', '/geography/slots', slot.slotId)
      slotIds.add(slot.slotId); parts.add(key)
      requireValue(slot.slotId === `slot:${slot.dongId}${slot.fragmentId === null ? '' : `:${slot.fragmentId}`}`, 'E_SLOT_EDITION', '/geography/slotId', slot.slotId)
      requireValue(slot.sourceEdition === facts.sourceEdition, 'E_SLOT_EDITION', '/geography/slots', slot.slotId)
      exact(slot.geometryRefs, county.parts.find(p => JSON.stringify([p.dongId, p.fragmentId]) === key).geometryRefs, 'E_SLOT_EDITION', '/geography/geometryRefs')
      slot.geometryRefs.forEach(ref => resolveRef(ref, '/geography/geometryRefs', slot.slotId))
      strings(slot.holdingRefs, '/geography/holdingRefs')
      requireValue(['direct', 'vassal', 'unassigned'].includes(slot.status), 'E_SCOPE_SHAPE', '/geography/status', slot.slotId)
      requireValue(slot.status === 'unassigned' ? slot.holderPersonId === null && slot.holdingRefs.length === 0 : people.has(slot.holderPersonId) && slot.holdingRefs.length > 0,
        'E_SCOPE_ADMISSION', '/geography/holderPersonId', slot.slotId)
      for (const id of slot.holdingRefs) resolveHolding(id, slot)
    }
  }
  exact([...new Set(counties.flatMap(c => c.parts.map(p => p.dongId)))], facts.dongRefs, 'E_SLOT_COVERAGE', '/facts/dongRefs')
  const duchies = [...titles.values()].filter(t => t.rank === 'duchy')
  exact(duchies.flatMap(t => t.jurisdictionRefs), facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/duchies')
  requireValue(['proposed', 'approved'].includes(geography.kingdomStatus), 'E_SCOPE_SHAPE', '/geography/kingdomStatus')
  if (final) requireValue(geography.kingdomStatus === 'approved', 'E_SCOPE_PENDING', '/geography/kingdomStatus')
  const kingdoms = [...titles.values()].filter(t => t.rank === 'kingdom')
  for (const kingdom of kingdoms) requireValue(kingdom.jurisdictionRefs.length > 1, 'E_KINGDOM_PARTITION', '/geography/kingdoms', kingdom.titleId)
  exact(kingdoms.flatMap(t => t.jurisdictionRefs), facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/kingdoms')
  for (const duchy of duchies) requireValue(titles.get(duchy.parentTitleId).jurisdictionRefs.includes(duchy.jurisdictionRefs[0]), 'E_KINGDOM_PARTITION', '/geography/parentTitleId', duchy.titleId)
  exact([...titles.values()].find(t => t.rank === 'empire').jurisdictionRefs, facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/empire')
  requireValue(geography.mapMinimumRank === 'county', 'E_MAP_GRANULARITY', '/geography/mapMinimumRank')
  for (const id of strings(geography.mapTitleIds, '/geography/mapTitleIds')) requireValue(titles.has(id) && titles.get(id).rank !== 'barony', 'E_MAP_GRANULARITY', '/geography/mapTitleIds', id)
}

// Pure entry point: I/O, archive bytes, current source extraction and source facts belong to the caller.
export function validateSeoulScope(input, { mode = 'publication', batchId = null } = {}) {
  const errors = []
  try {
    requireValue(['inspection', 'migration', 'publication'].includes(mode) && (mode === 'migration' ? text(batchId) : batchId === null), 'E_SCOPE_INPUT', '/mode')
    shape(input, ['contract', 'baseline', 'baselineSha256', 'current', 'boundary', 'archiveHashes', 'sourceHashes', 'review', 'batches', 'geography', 'facts', 'refs', 'edges'], '/input')
    const { contract, baseline, current, boundary, archiveHashes, sourceHashes, review, batches, geography, facts, refs, edges } = input
    requireValue(baseline?.schema === 'seoul-pre-edit-baseline.v1' && baseline.immutable === true, 'E_ARCHIVE_HASH', '/baseline')
    requireValue(baseline.archives && baseline.currentEntitySets && baseline.identitySetHashes && Array.isArray(baseline.files), 'E_ARCHIVE_HASH', '/baseline')
    shape(current, ['entitySets', 'documentPaths', ...(Object.hasOwn(current, 'rights') ? ['rights'] : [])], '/current')
    requireValue(current.entitySets && archiveHashes && sourceHashes, 'E_SCOPE_SHAPE', '/input')
    for (const set of ENTITY_SETS) list(current.entitySets[set], `/current/${set}`)
    list(current.documentPaths, '/current/documentPaths')
    shape(boundary, ['path', 'sha256', 'edition'], '/boundary')
    for (const [name, archive] of Object.entries(baseline.archives)) requireValue(archiveHashes[name] === archive.sha256, 'E_ARCHIVE_HASH', '/archives', name)
    shape(contract, ['schema', 'baselineSha256', 'boundarySource', 'entities', 'documents', 'dispositions', 'rail'], '/contract')
    requireValue(contract.schema === SEOUL_SCOPE_SCHEMA && contract.baselineSha256 === input.baselineSha256 && digest(input.baselineSha256), 'E_ARCHIVE_HASH', '/contract/baselineSha256')
    shape(contract.boundarySource, ['path', 'sha256', 'edition'], '/contract/boundarySource')
    requireValue(contract.boundarySource.sha256 === boundary.sha256 && contract.boundarySource.path === boundary.path && contract.boundarySource.edition === boundary.edition, 'E_SCOPE_GEOMETRY', '/boundarySource')
    list(contract.entities, '/entities').forEach(row => shape(row, ['id', 'kind', 'sourcePath', 'status', 'locationRefs', 'jurisdictionRefs', 'basis', 'batchId'], '/entities'))
    const entityByKey = unique(contract.entities, row => `${row.kind}:${row.id}`, '/entities')
    const personIds = new Set(baseline.currentEntitySets.persons)
    const expectedEntities = {
      person: baseline.currentEntitySets.persons, title: baseline.currentEntitySets.titles,
      holding: [...baseline.currentEntitySets.holdings, ...baseline.currentEntitySets.grants],
      state: [...baseline.currentEntitySets.states, ...baseline.currentEntitySets.polities], event: baseline.currentEntitySets.events,
    }
    for (const set of ENTITY_SETS) {
      const code = set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT'
      const expected = strings(baseline.currentEntitySets[set], `/baseline/currentEntitySets/${set}`)
      requireValue(sha256(JSON.stringify(expected)) === baseline.identitySetHashes[set], 'E_ARCHIVE_HASH', '/baseline/identitySetHashes', set)
      exact(current.entitySets[set], expected, code, `/current/${set}`)
    }
    for (const [kind, ids] of Object.entries(expectedEntities)) exact(contract.entities.filter(e => e.kind === kind).map(e => e.id), ids, kind === 'person' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/entities/${kind}`)
    const refIndex = unique(list(refs, '/refs'), row => row.id, '/refs', 'E_SCOPE_REF')
    function resolveRef(id, path, entityId) {
      const ref = refIndex.get(id)
      requireValue(ref, 'E_SCOPE_REF', path, id)
      requireValue(ref.inside === true && ref.boundarySha256 === boundary.sha256, 'E_SCOPE_OUTSIDE', path, entityId || id)
      return ref
    }
    for (const ref of refs) {
      shape(ref, ['id', 'kind', 'inside', 'boundarySha256'], '/refs')
      requireValue(['region', 'station', 'constituency', 'district', 'geometry'].includes(ref.kind) && typeof ref.inside === 'boolean', 'E_SCOPE_SHAPE', '/refs', ref.id)
    }
    const selected = row => mode === 'publication' || mode === 'migration' && row.batchId === batchId
    for (const row of contract.entities) {
      shape(row, ['id', 'kind', 'sourcePath', 'status', 'locationRefs', 'jurisdictionRefs', 'basis', 'batchId'], '/entities')
      requireValue(Object.hasOwn(expectedEntities, row.kind) && text(row.id) && text(row.sourcePath) && ['pending', 'active', 'preserved'].includes(row.status), 'E_SCOPE_SHAPE', '/entities', row.id)
      requireValue(baseline.files.some(file => file.path === row.sourcePath) && sourceHashes[row.sourcePath], 'E_SCOPE_REF', '/entities/sourcePath', row.id)
      requireValue(row.batchId === null || text(row.batchId), 'E_SCOPE_SHAPE', '/entities/batchId', row.id)
      strings(row.locationRefs, '/entities/locationRefs'); strings(row.jurisdictionRefs, '/entities/jurisdictionRefs')
      requireValue(row.status !== 'preserved', row.kind === 'person' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', '/entities/status', row.id)
      if (selected(row)) requireValue(row.status === 'active', 'E_SCOPE_PENDING', '/entities/status', row.id)
      if (row.status !== 'active') continue
      requireValue(text(row.basis) && text(row.batchId), 'E_SCOPE_ADMISSION', '/entities/basis', row.id)
      if (row.kind === 'person') requireValue(row.locationRefs.length > 0, 'E_SCOPE_LOCATION', '/entities/locationRefs', row.id)
      else requireValue(row.locationRefs.length + row.jurisdictionRefs.length > 0, 'E_SCOPE_LOCATION', '/entities/jurisdictionRefs', row.id)
      for (const ref of [...row.locationRefs, ...row.jurisdictionRefs]) resolveRef(ref, '/entities/refs', row.id)
    }
    const dispositionKeys = []
    for (const row of list(contract.dispositions, '/dispositions')) {
      shape(row, ['set', 'id', 'status', 'targetIds', 'batchId', 'basis'], '/dispositions')
      requireValue(ENTITY_SETS.includes(row.set) && ['pending', 'active'].includes(row.status), 'E_SCOPE_SHAPE', '/dispositions', row.id)
      dispositionKeys.push(JSON.stringify([row.set, row.id]))
      strings(row.targetIds, '/dispositions/targetIds')
      if (selected(row)) requireValue(row.status === 'active', 'E_SCOPE_PENDING', '/dispositions/status', row.id)
      if (row.status === 'active') requireValue(text(row.basis) && row.targetIds.length > 0 && text(row.batchId)
        && row.targetIds.every(id => current.entitySets[row.set].includes(id)), 'E_CENSUS_RIGHT', '/dispositions', row.id)
    }
    exact(dispositionKeys, ENTITY_SETS.flatMap(set => baseline.currentEntitySets[set].map(id => JSON.stringify([set, id]))), 'E_CENSUS_RIGHT', '/dispositions')
    const docs = baselineDocuments(baseline)
    exact(current.documentPaths, docs, 'E_REVIEW_COVERAGE', '/current/documents')
    list(contract.documents, '/documents').forEach(row => shape(row, ['sourcePath', 'status', 'reviewReceipt', 'batchId', 'basis'], '/documents'))
    exact(contract.documents.map(row => row.sourcePath), docs, 'E_REVIEW_COVERAGE', '/documents')
    for (const row of contract.documents) {
      shape(row, ['sourcePath', 'status', 'reviewReceipt', 'batchId', 'basis'], '/documents')
      requireValue(['pending', 'active', 'preserved'].includes(row.status), 'E_SCOPE_SHAPE', '/documents/status', row.sourcePath)
      const original = baseline.files.find(file => file.path === row.sourcePath)
      if (original.kind === 'sealed-history') {
        requireValue(row.status === 'preserved' && text(row.basis), 'E_SCOPE_ADMISSION', '/documents/status', row.sourcePath)
        requireValue(sourceHashes[row.sourcePath] === original.sha256, 'E_ARCHIVE_HASH', '/documents', row.sourcePath)
      } else {
        requireValue(row.status !== 'preserved', 'E_REVIEW_COVERAGE', '/documents/status', row.sourcePath)
        if (selected(row)) requireValue(row.status === 'active', 'E_SCOPE_PENDING', '/documents/status', row.sourcePath)
        if (row.status === 'active') {
          requireValue(text(row.basis) && text(row.batchId), 'E_SCOPE_ADMISSION', '/documents', row.sourcePath)
          shape(row.reviewReceipt, ['currentSha256', 'evidencePath', 'reviewedAt'], '/documents/reviewReceipt')
          requireValue(digest(row.reviewReceipt.currentSha256) && row.reviewReceipt.currentSha256 === sourceHashes[row.sourcePath], 'E_REVIEW_HASH', '/documents/reviewReceipt', row.sourcePath)
          requireValue(text(row.reviewReceipt.evidencePath) && text(row.reviewReceipt.reviewedAt), 'E_REVIEW_COVERAGE', '/documents/reviewReceipt', row.sourcePath)
        }
      }
    }
    const documentIndex = new Map(contract.documents.map(row => [row.sourcePath, row]))
    for (const entity of contract.entities.filter(row => row.status === 'active')) {
      const document = documentIndex.get(entity.sourcePath)
      requireValue(document, 'E_SCOPE_REF', '/entities/sourcePath', entity.id)
      requireValue(document.status === 'active', 'E_SCOPE_PENDING', '/entities/sourcePath', entity.sourcePath)
    }
    shape(contract.rail, ['stationRefs', 'edgeRefs'], '/rail')
    for (const id of strings(contract.rail.stationRefs, '/rail/stationRefs')) requireValue(resolveRef(id, '/rail/stationRefs').kind === 'station', 'E_SCOPE_REF', '/rail/stationRefs', id)
    const edgeIndex = unique(list(edges, '/edges'), edge => edge.id, '/edges')
    for (const id of strings(contract.rail.edgeRefs, '/rail/edgeRefs')) {
      const edge = edgeIndex.get(id)
      requireValue(edge, 'E_SCOPE_REF', '/rail/edgeRefs', id)
      requireValue(edge.inside === true && edge.physical === true && edge.boundarySha256 === boundary.sha256, 'E_SCOPE_OUTSIDE', '/rail/edgeRefs', id)
      for (const station of [edge.a, edge.b]) requireValue(contract.rail.stationRefs.includes(station), 'E_SCOPE_REF', '/rail/edgeRefs', station)
    }
    const rights = unique(list(current.rights ?? [], '/current/rights'), row => row.id, '/current/rights', 'E_SCOPE_REF')
    for (const right of rights.values()) {
      shape(right, ['id', 'holderPersonId', 'slotStatus'], '/current/rights')
      requireValue([...current.entitySets.holdings, ...current.entitySets.grants].includes(right.id), 'E_SCOPE_REF', '/current/rights', right.id)
    }
    function resolveHolding(id, slot) {
      const holding = entityByKey.get(`holding:${id}`)
      requireValue(holding, 'E_SCOPE_REF', '/geography/holdingRefs', id)
      const disposition = contract.dispositions.find(row => ['holdings', 'grants'].includes(row.set) && row.targetIds.includes(id))
      requireValue(holding.status === 'active' && disposition?.status === 'active', 'E_SCOPE_PENDING', '/geography/holdingRefs', id)
      const right = rights.get(id)
      requireValue(right, 'E_SCOPE_ADMISSION', '/current/rights', id)
      requireValue(right.holderPersonId === slot.holderPersonId && right.slotStatus === slot.status,
        'E_SCOPE_ADMISSION', '/geography/holderPersonId', id)
    }
    if (geography?.schema === STAGING_GEOGRAPHY_SCHEMA) checkStagingGeography(geography, facts, input, mode)
    else if (geography !== null) checkGeography(geography, facts, resolveRef, mode === 'publication', personIds, resolveHolding)
    else requireValue(mode === 'inspection', 'E_SCOPE_PENDING', '/geography')
    const requiredBatches = new Set([...contract.entities, ...contract.documents, ...contract.dispositions].filter(row => row.status === 'active').map(row => row.batchId))
    if (mode === 'migration') requiredBatches.add(batchId)
    const batchIndex = unique(list(batches, '/batches'), row => row.id, '/batches', 'E_APPROVAL_BATCH')
    const reviewBatches = new Set(mode === 'migration' ? [batchId] : requiredBatches)
    for (const id of requiredBatches) {
      const batch = batchIndex.get(id)
      requireValue(batch, 'E_APPROVAL_BATCH', '/batches', id)
      shape(batch, ['id', 'proposal', 'approval', 'articleSample', 'cardSample', 'entityKeys', 'documentPaths', 'dispositionKeys', 'dependencyBatchIds'], '/batches')
      checkApproval(batch.approval, 'batch-allocation', id, proposalHash(batch.proposal), '/batches/approval')
      requireValue(proposalHash(batch.proposal) === proposalHash({
        entities: contract.entities.filter(row => row.batchId === id),
        documents: contract.documents.filter(row => row.batchId === id),
        dispositions: contract.dispositions.filter(row => row.batchId === id),
        geography,
      }), 'E_APPROVAL_BATCH', '/batches/proposal', id)
      for (const [key, kind] of [['articleSample', 'article-style'], ['cardSample', 'card-style']]) {
        shape(batch[key], ['body', 'approval'], `/batches/${key}`)
        requireValue(text(batch[key].body), 'E_APPROVAL_BATCH', `/batches/${key}`, id)
        checkApproval(batch[key].approval, kind, id, sha256(batch[key].body), `/batches/${key}/approval`)
      }
      exact(batch.entityKeys, contract.entities.filter(row => row.batchId === id).map(row => `${row.kind}:${row.id}`), 'E_APPROVAL_BATCH', '/batches/entityKeys')
      exact(batch.documentPaths, contract.documents.filter(row => row.batchId === id).map(row => row.sourcePath), 'E_APPROVAL_BATCH', '/batches/documentPaths')
      exact(batch.dispositionKeys, contract.dispositions.filter(row => row.batchId === id).map(row => JSON.stringify([row.set, row.id])), 'E_APPROVAL_BATCH', '/batches/dispositionKeys')
      for (const dependency of strings(batch.dependencyBatchIds, '/batches/dependencyBatchIds')) requireValue(requiredBatches.has(dependency), 'E_APPROVAL_BATCH', '/batches/dependencyBatchIds', dependency)
      for (const key of batch.entityKeys) requireValue(entityByKey.get(key)?.status === 'active', 'E_SCOPE_PENDING', '/batches/entityKeys', key)
      for (const path of batch.documentPaths) requireValue(contract.documents.find(row => row.sourcePath === path)?.status === 'active', 'E_SCOPE_PENDING', '/batches/documentPaths', path)
      for (const key of batch.dispositionKeys) requireValue(contract.dispositions.find(row => JSON.stringify([row.set, row.id]) === key)?.status === 'active', 'E_SCOPE_PENDING', '/batches/dispositionKeys', key)
    }
    for (const id of requiredBatches) {
      const closure = new Set([id])
      for (const dependency of closure) {
        for (const next of batchIndex.get(dependency).dependencyBatchIds) closure.add(next)
      }
      for (const entity of contract.entities.filter(row => row.status === 'active' && row.batchId === id)) {
        const document = documentIndex.get(entity.sourcePath)
        requireValue(closure.has(document.batchId), 'E_APPROVAL_BATCH', '/entities/sourcePath', entity.id)
      }
      if (mode === 'migration' && id === batchId) for (const dependency of closure) reviewBatches.add(dependency)
    }
    if (mode !== 'inspection') {
      shape(review, ['originalKeys', 'currentKeys', 'receipts'], '/review')
      const relevant = row => mode === 'publication' || reviewBatches.has(row.batchId)
      const receipts = list(review.receipts, '/review/receipts').filter(relevant)
      exact(receipts.flatMap(row => row.coveredKeys), review.originalKeys.filter(relevant).map(row => row.key), 'E_REVIEW_COVERAGE', '/review/originalKeys')
      exact(receipts.flatMap(row => row.currentHashes.map(item => item.key)), review.currentKeys.filter(relevant).map(row => row.key), 'E_REVIEW_COVERAGE', '/review/currentKeys')
      for (const row of receipts) {
        shape(row, ['coveredKeys', 'currentHashes', 'disposition', 'batchId', 'evidencePath', 'reviewedAt'], '/review/receipts')
        requireValue(['revised', 'reviewed', 'preserved'].includes(row.disposition) && text(row.evidencePath) && text(row.reviewedAt), 'E_REVIEW_COVERAGE', '/review/receipts')
        for (const entry of row.currentHashes) requireValue(review.currentKeys.some(key => key.key === entry.key && key.sha256 === entry.sha256), 'E_REVIEW_HASH', '/review/currentHashes', entry.key)
      }
    }
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/input', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    errors.push({ code: error.code, path: error.path, id: error.id })
  }
  return { ok: errors.length === 0, errors }
}
