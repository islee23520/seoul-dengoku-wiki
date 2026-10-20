const PATHS = Object.freeze({
  cast: 'lore/characters/Cast-Index.json',
  corridor: 'lore/characters/Cast-Corridors-Index.json',
  states: 'lore/characters/Cast-Index-S4.json',
})

// These two published display forms are explicitly reconciled in
// lore/name-pools/verify-person-id-candidates.mjs; arbitrary parentheses are not aliases.
const CORRIDOR_DISPLAY_NAMES = Object.freeze({
  '린샤오메이 (임소매)': '린샤오메이',
  '팜반득 (범반득)': '팜반득',
})

export const INDEX_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  index_document: 'source_id document_id logical_path source_status source_kind tense_ko tense_en temporal_scope',
  index_section: 'source_id table_anchor section_ordinal section_anchor section_name_ko section_name_en state_id row_count json_pointer',
  index_person: 'source_id table_anchor row_ordinal person_id match_status name_ko name_en office_ko office_en tier_ko tier_en relation_count json_pointer',
  index_corridor_person: 'source_id table_anchor row_ordinal person_id match_status name_ko name_en corridor_ko corridor_en office_ko office_en conscription_ko conscription_en arms_access_ko arms_access_en json_pointer',
  index_state_label: 'source_id state_id state_name_ko state_name_en row_ordinal json_pointer',
  index_issue: 'source_id issue_code issue_ordinal severity table_anchor row_ordinal name_ko observed_count stated_count json_pointer message',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])))

function fail(code, detail) { throw Object.assign(new Error(`${code}: ${detail}`), { code }) }
function object(value, where) { if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_INDEX_OBJECT', where); return value }
function array(value, where) { if (!Array.isArray(value)) fail('E_INDEX_ARRAY', where); return value }
function str(value, where) { if (typeof value !== 'string') fail('E_INDEX_TEXT', where); return value }
function localized(value, where) { const entry = object(value, where); return [str(entry.ko, `${where}.ko`), str(entry.en, `${where}.en`)] }
function ptr(...parts) { return `/${parts.map(String).map(part => part.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}` }
function numeric(value, where) { if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) fail('E_INDEX_COUNT', where); return Number(value) }
function addIssue(tables, source_id, issue_code, details) {
  tables.index_issue.push({ source_id, issue_code, issue_ordinal: tables.index_issue.length, severity: 'warning',
    table_anchor: details.table_anchor ?? null, row_ordinal: details.row_ordinal ?? null, name_ko: details.name_ko ?? null,
    observed_count: details.observed_count ?? null, stated_count: details.stated_count ?? null,
    json_pointer: details.json_pointer, message: details.message })
}

function filesByPath(bundle) {
  const map = new Map()
  for (const file of array(object(bundle, 'bundle').files, 'bundle.files')) {
    const path = str(object(file, 'bundle.file').logical_path, 'logical_path')
    if (map.has(path)) fail('E_INDEX_DUPLICATE_SOURCE', path)
    map.set(path, file)
  }
  return map
}

function identityNames(identity) {
  const names = new Map(), ids = new Set()
  for (const row of array(object(identity, 'identity').people, 'identity.people')) {
    const person = object(row, 'identity.person'), id = str(person.person_id, 'identity.person_id'), name = str(person.name, 'identity.name')
    if (ids.has(id)) fail('E_INDEX_IDENTITY_DUPLICATE', id)
    ids.add(id)
    const candidates = names.get(name) ?? []
    candidates.push(id)
    names.set(name, candidates)
  }
  if (!ids.size) fail('E_INDEX_IDENTITY_EMPTY', 'identity.people')
  return { names, ids }
}

function resolvePerson(name, names, allowCorridorAlias = false) {
  const normalized = allowCorridorAlias ? (CORRIDOR_DISPLAY_NAMES[name] ?? name) : name
  const candidates = names.get(normalized) ?? []
  if (candidates.length > 1) fail('E_INDEX_AMBIGUOUS_NAME', name)
  if (candidates.length === 0) return { person_id: null, match_status: 'unmatched' }
  return { person_id: candidates[0], match_status: normalized === name ? 'exact_registry_name' : 'documented_display_alias' }
}

function source(map, path, scope, tables) {
  const file = object(map.get(path), path), source_id = file.source_id
  if (!Number.isSafeInteger(source_id)) fail('E_INDEX_SOURCE_ID', path)
  const document = object(file.document, path), tense = localized(document.tense, `${path}.tense`)
  const sourceKind = str(object(document.source, `${path}.source`).kind, `${path}.source.kind`)
  const status = str(document.status, `${path}.status`)
  if (document.domain !== 'characters' || sourceKind !== 'original-fiction' || !['draft', 'approved'].includes(status)) fail('E_INDEX_SOURCE_CONTRACT', path)
  tables.index_document.push({ source_id, document_id: str(document.id, `${path}.id`), logical_path: path,
    source_status: status, source_kind: sourceKind, tense_ko: tense[0], tense_en: tense[1], temporal_scope: scope })
  return { source_id, document }
}

function stateLabels(file, tables) {
  const { source_id, document } = file
  const blocks = array(document.content, 'state.content')
  const candidates = blocks.map((block, index) => [block, index]).filter(([block]) => block.kind === 'table')
  if (candidates.length !== 1 || candidates[0][0].anchor !== 'state-names') fail('E_INDEX_STATE_TABLE', 'state-names')
  const [block, blockOrdinal] = candidates[0]
  const seen = new Set()
  for (const [rowOrdinal, cells] of array(block.rows, 'state.rows').entries()) {
    const row = array(cells, 'state.row')
    if (row.length !== 2) fail('E_INDEX_ROW_WIDTH', 'state')
    const [idKo, idEn] = localized(row[0], 'state.id'), [nameKo, nameEn] = localized(row[1], 'state.name')
    if (idKo !== idEn || !/^S(?:0[1-9]|1[0-6])$/.test(idKo) || seen.has(idKo)) fail('E_INDEX_STATE_ID', idKo)
    seen.add(idKo)
    tables.index_state_label.push({ source_id, state_id: idKo, state_name_ko: nameKo, state_name_en: nameEn,
      row_ordinal: rowOrdinal, json_pointer: ptr('content', blockOrdinal, 'rows', rowOrdinal) })
  }
  if (seen.size !== 16) fail('E_INDEX_STATE_COVERAGE', String(seen.size))
  return new Map(tables.index_state_label.map(row => [row.state_id, row]))
}

function castRows(file, labels, names, tables) {
  const { source_id, document } = file
  const blocks = array(document.content, 'cast.content')
  let heading = null, stateTableCount = 0, unaffiliated = 0
  const anchors = new Set(), seenRows = new Set()
  for (const [blockOrdinal, block] of blocks.entries()) {
    if (block.kind === 'heading' && block.depth === 2) heading = { block, blockOrdinal }
    if (block.kind !== 'table') continue
    if (!heading) fail('E_INDEX_SECTION_MISSING', str(block.anchor, 'cast.table.anchor'))
    const tableAnchor = str(block.anchor, 'cast.table.anchor')
    if (anchors.has(tableAnchor)) fail('E_INDEX_DUPLICATE_TABLE', tableAnchor)
    anchors.add(tableAnchor)
    const sectionAnchor = str(heading.block.anchor, 'cast.heading.anchor')
    const stateMatch = /^국가-(\d{2})-/.exec(sectionAnchor)
    const stateId = stateMatch ? `S${stateMatch[1]}` : null
    if (stateId !== null && !labels.has(stateId)) fail('E_INDEX_STATE_ORPHAN', stateId)
    if (stateId === null && sectionAnchor !== '무소속-인물') fail('E_INDEX_SECTION_UNKNOWN', sectionAnchor)
    const [sectionKo, sectionEn] = localized(heading.block.text, 'cast.heading.text')
    if (stateId !== null && !sectionKo.includes(labels.get(stateId).state_name_ko)) fail('E_INDEX_STATE_LABEL_MISMATCH', stateId)
    const rows = array(block.rows, 'cast.table.rows')
    tables.index_section.push({ source_id, table_anchor: tableAnchor, section_ordinal: tables.index_section.length,
      section_anchor: sectionAnchor, section_name_ko: sectionKo, section_name_en: sectionEn, state_id: stateId,
      row_count: rows.length, json_pointer: ptr('content', blockOrdinal) })
    if (stateId === null) unaffiliated += rows.length
    else stateTableCount += rows.length
    for (const [rowOrdinal, cells] of rows.entries()) {
      const row = array(cells, 'cast.row')
      if (row.length !== 4) fail('E_INDEX_ROW_WIDTH', `${tableAnchor}[${rowOrdinal}]`)
      const [nameKo, nameEn] = localized(row[0], 'cast.name')
      const [officeKo, officeEn] = localized(row[1], 'cast.office')
      const [tierKo, tierEn] = localized(row[2], 'cast.tier')
      const [countKo, countEn] = localized(row[3], 'cast.relation_count')
      if (countKo !== countEn) fail('E_INDEX_COUNT_LOCALE', `${tableAnchor}[${rowOrdinal}]`)
      const relation_count = numeric(countKo, 'cast.relation_count')
      const match = resolvePerson(nameKo, names)
      const json_pointer = ptr('content', blockOrdinal, 'rows', rowOrdinal)
      if (match.person_id === null) addIssue(tables, source_id, 'E_INDEX_UNMATCHED_PERSON', { table_anchor: tableAnchor,
        row_ordinal: rowOrdinal, name_ko: nameKo, json_pointer, message: '색인 이름이 현재 안정 ID 레지스트리와 일치하지 않습니다.' })
      else if (seenRows.has(match.person_id)) fail('E_INDEX_DUPLICATE_PERSON', match.person_id)
      if (match.person_id !== null) seenRows.add(match.person_id)
      tables.index_person.push({ source_id, table_anchor: tableAnchor, row_ordinal: rowOrdinal,
        ...match, name_ko: nameKo, name_en: nameEn, office_ko: officeKo, office_en: officeEn,
        tier_ko: tierKo, tier_en: tierEn, relation_count, json_pointer })
    }
  }
  if (tables.index_section.length !== 17) fail('E_INDEX_SECTION_COVERAGE', String(tables.index_section.length))
  return { stateTableCount, unaffiliated }
}

function corridorRows(file, names, tables) {
  const { source_id, document } = file
  const blocks = array(document.content, 'corridor.content')
  const matches = blocks.map((block, index) => [block, index]).filter(([block]) => block.kind === 'table')
  if (matches.length !== 1) fail('E_INDEX_CORRIDOR_TABLE', String(matches.length))
  const [block, blockOrdinal] = matches[0], tableAnchor = str(block.anchor, 'corridor.table.anchor')
  const seen = new Set()
  for (const [rowOrdinal, cells] of array(block.rows, 'corridor.rows').entries()) {
    const row = array(cells, 'corridor.row')
    if (row.length !== 5) fail('E_INDEX_ROW_WIDTH', `${tableAnchor}[${rowOrdinal}]`)
    const [nameKo, nameEn] = localized(row[0], 'corridor.name')
    const [corridorKo, corridorEn] = localized(row[1], 'corridor.corridor')
    const [officeKo, officeEn] = localized(row[2], 'corridor.office')
    const [conscriptionKo, conscriptionEn] = localized(row[3], 'corridor.conscription')
    const [armsKo, armsEn] = localized(row[4], 'corridor.arms_access')
    const match = resolvePerson(nameKo, names, true)
    const json_pointer = ptr('content', blockOrdinal, 'rows', rowOrdinal)
    if (match.person_id === null) addIssue(tables, source_id, 'E_INDEX_UNMATCHED_PERSON', { table_anchor: tableAnchor,
      row_ordinal: rowOrdinal, name_ko: nameKo, json_pointer, message: '회랑 색인 이름이 현재 안정 ID 레지스트리와 일치하지 않습니다.' })
    else if (seen.has(match.person_id)) fail('E_INDEX_DUPLICATE_PERSON', match.person_id)
    if (match.person_id !== null) seen.add(match.person_id)
    tables.index_corridor_person.push({ source_id, table_anchor: tableAnchor, row_ordinal: rowOrdinal,
      ...match, name_ko: nameKo, name_en: nameEn, corridor_ko: corridorKo, corridor_en: corridorEn,
      office_ko: officeKo, office_en: officeEn, conscription_ko: conscriptionKo, conscription_en: conscriptionEn,
      arms_access_ko: armsKo, arms_access_en: armsEn, json_pointer })
  }
}

export function mapIndexDomains({ bundle, identity }) {
  const tables = Object.fromEntries(Object.keys(INDEX_TABLE_COLUMNS).map(table => [table, []]))
  const files = filesByPath(bundle), { names } = identityNames(identity)
  const labels = stateLabels(source(files, PATHS.states, 'draft_state_label', tables), tables)
  const cast = source(files, PATHS.cast, 'past_draft_index', tables)
  const counts = castRows(cast, labels, names, tables)
  const corridor = source(files, PATHS.corridor, 'draft_corridor_index', tables)
  corridorRows(corridor, names, tables)
  const summary = str(object(object(cast.document.locales, 'cast.locales').ko, 'cast.locales.ko').summary, 'cast.summary')
  const stated = /무소속 장부에는 (\d+)명/.exec(summary)
  if (stated && Number(stated[1]) !== counts.unaffiliated) addIssue(tables, cast.source_id, 'E_INDEX_SUMMARY_COUNT_MISMATCH', {
    observed_count: counts.unaffiliated, stated_count: Number(stated[1]), json_pointer: '/locales/ko/summary',
    message: '원문 요약의 무소속 인원과 실제 표 행 수가 다릅니다.' })
  for (const rows of Object.values(tables)) { rows.forEach(Object.freeze); Object.freeze(rows) }
  return Object.freeze(tables)
}
