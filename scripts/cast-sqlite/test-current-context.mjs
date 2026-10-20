import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs'
import { RIGHTS_PATHS } from './current-rights.mjs'
import { parseDocument } from './sources.mjs'

const CONTEXT_PATHS = Object.freeze([
  'lore/relations/relations.json',
  'lore/relations/personal-holdings.json',
  'lore/relations/opening-office-appointments.json',
  'lore/name-pools/cast-prose-contacts.json',
])

async function corpus() {
  const root = resolve(import.meta.dirname, '..', '..')
  const registry = JSON.parse(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json'), 'utf8'))
  const offices = JSON.parse(await readFile(resolve(root, 'lore/relations/opening-office-appointments.json')))
  const paths = [...new Set([...CONTEXT_PATHS, ...Object.values(RIGHTS_PATHS), ...offices.appointments.flatMap(row => row.current.evidence.map(ref => ref.path))])]
  const files = await Promise.all(paths.map(async (logical_path, index) => {
    const raw_bytes = await readFile(resolve(root, logical_path))
    const parsed = parseDocument(raw_bytes.toString('utf8'))
    return { source_id: index + 1, logical_path, document: parsed.document, records: parsed.records,
      sha256: createHash('sha256').update(raw_bytes).digest('hex'), byte_length: raw_bytes.length, raw_bytes }
  }))
  return { bundle: { files, records: files.flatMap(file => file.records.map(record => ({ ...record, source_id: file.source_id }))) }, identity: { people: registry.persons.map(({ id, name }) => ({ person_id: id, name })) } }
}

function database(input) {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT; CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT; CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;')
  const person = db.prepare('INSERT INTO person(person_id) VALUES (?)')
  for (const row of input.identity.people) person.run(row.person_id)
  const file = db.prepare('INSERT INTO source_file(source_id,logical_path) VALUES (?,?)')
  const record = db.prepare('INSERT INTO source_record(source_id,json_pointer) VALUES (?,?)')
  for (const source of input.bundle.files) { file.run(source.source_id, source.logical_path); for (const row of source.records) record.run(source.source_id, row.json_pointer) }
  return db
}

function insertRows(db, tables) {
  db.exec('BEGIN')
  for (const [table, columns] of Object.entries(CONTEXT_TABLE_COLUMNS)) {
    const insert = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
    for (const row of tables[table]) insert.run(...columns.map((column) => row[column]))
  }
  db.exec('COMMIT')
}

test('actual context corpus maps directed relations and non-invented holding validity into STRICT SQLite', async (t) => {
  // Given: the active catalog inputs and the issued person registry.
  const input = await corpus()
  const before = JSON.stringify({ identity: input.identity, documents: input.bundle.files.map(({ logical_path, document }) => ({ logical_path, document })) })

  // When: source rows are normalized without deriving inverse relations or new Seoul grants.
  const tables = mapContextDomains(input)
  const db = database(input)
  db.exec(await readFile(resolve(import.meta.dirname, 'current-context.sql'), 'utf8'))
  insertRows(db, tables)

  // Then: current rows remain source-directed and the superseded/unresolved holdings stay queryable but excluded from current validity.
  assert.deepEqual(Object.keys(tables), Object.keys(CONTEXT_TABLE_COLUMNS))
  assert.deepEqual({ courts: tables.context_court.length, retainers: tables.context_direct_retainer.length,
    lieges: tables.context_owner_liege.length, memberships: tables.context_court_membership.length,
    holdings: tables.context_holding.length, dispositions: tables.context_opening_disposition.length,
    offices: tables.context_office_appointment.length, contacts: tables.context_prose_contact.length },
  { courts: 14, retainers: 48, lieges: 16, memberships: 6, holdings: 25, dispositions: 3, offices: 95, contacts: 15 })
  assert.deepEqual({ organizations: tables.context_organization.length, events: tables.context_event_link.length,
    polities: tables.context_polity.length, retinues: tables.context_retinue_group.length,
    duties: tables.context_retinue_duty.length, limits: tables.context_retinue_technical_limit.length,
    basis: tables.context_owner_liege_source_basis.length, approvals: tables.context_court_approval.length },
  { organizations: 4, events: 3, polities: 1, retinues: 1, duties: 4, limits: 3, basis: 2, approvals: 2 })
  assert.equal(tables.context_event_link.find((row) => row.person_id === 'K1007').organization_id, 'O01')
  assert.equal(tables.context_polity[0].sovereign_person_id, 'K1008')
  assert.equal(tables.context_retinue_group[0].current_validity, 'unresolved')
  assert.equal(tables.context_holding.find((row) => row.holding_id === 'holding:yangcheon').designation_ko, '양천구 영주')
  const facility = tables.context_holding_reference.find((row) => row.holding_id === 'holding:yeongdeungpo-concourse')
  assert.equal(facility.station_name, '영등포')
  assert.equal(facility.station_district, '영등포구')
  assert.equal(facility.station_lat, 37.51536)
  assert.equal(facility.station_lon, 126.90693)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'current_seoul_evidenced').length, 20)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'current_seoul_nonowning').length, 5)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'unresolved').length, 0)
  assert.equal(tables.context_issue.filter((row) => row.code === 'E_CONTEXT_HOLDING_SUPERSEDED_OUTSIDE_SEOUL').length, 0)
  assert.equal(tables.context_issue.filter((row) => row.code === 'E_CONTEXT_HOLDING_UNRESOLVED').length, 0)
  assert.deepEqual({ approvals: tables.context_rights_approval.length, transitions: tables.context_rights_transition.length,
    retired: tables.context_outside_retirement.length, titles: tables.context_feudal_title.length, grants: tables.context_feudal_grant.length,
    bindings: tables.context_feudal_binding.length, identities: tables.context_political_identity.length,
    scopes: tables.context_holding_geographic_scope.length, counties: tables.context_holding_scope_county.length, powers: tables.context_holding_power.length },
    { approvals: 3, transitions: 411, retired: 1426, titles: 42, grants: 31, bindings: 7, identities: 158, scopes: 5, counties: 12, powers: 10 })
  assert.equal(input.identity.people.length, 1022)
  assert.equal(tables.context_polity[0].current_validity, 'current_nonterritorial')
  assert.equal(tables.context_polity[0].territorial_scale, null)
  for (const id of ['K151', 'K176', 'K355']) {
    const office = tables.context_office_appointment.find(row => row.person_id === id)
    assert.equal(office.status, 'unappointed'); assert.equal(office.position_ko, null); assert.equal(office.rank_ko, null)
    assert.ok(tables.context_office_history.find(row => row.person_id === id).position_ko)
  }
  assert.deepEqual(tables.context_holding_geographic_scope.map(scope => {
    const holding = tables.context_holding.find(row => row.holding_id === scope.holding_id)
    return [holding.holder_person_id, holding.direct_liege_person_id, scope.gu_ref,
      tables.context_holding_scope_county.filter(row => row.holding_id === holding.holding_id).length]
  }), [['K1008', null, '11680', 3], ['K1008', null, '11650', 2], ['K035', 'K1008', '11215', 2], ['K039', 'K1008', '11710', 3], ['K038', 'K1008', '11740', 2]])
  assert.equal(tables.context_direct_retainer.some((row) => row.person_id === row.liege_person_id), false)
  assert.equal(tables.context_prose_contact.some((row) => row.person_id === row.recipient_person_id), false)
  assert.equal(db.prepare("SELECT count(*) AS count FROM context_holding WHERE current_validity='current_seoul_evidenced'").get().count, 20)
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
  assert.equal(JSON.stringify({ identity: input.identity, documents: input.bundle.files.map(({ logical_path, document }) => ({ logical_path, document })) }), before)
  db.close()
  t.diagnostic(JSON.stringify(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length]))))
})

test('mapping rejects an orphan holder and a duplicate directed retainer at the source boundary', async () => {
  // Given: otherwise valid current context inputs.
  const orphan = await corpus()
  orphan.bundle.files.find((file) => file.logical_path.endsWith('/personal-holdings.json')).document.holdings[0].holderPersonId = 'K9999'
  const duplicate = await corpus()
  const relations = duplicate.bundle.files.find((file) => file.logical_path.endsWith('/relations.json')).document
  relations.directRetainers.push(structuredClone(relations.directRetainers[0]))

  // When/Then: both malformed source conditions fail before a database write.
  assert.throws(() => mapContextDomains(orphan), { code: 'E_CONTEXT_PERSON_ORPHAN' })
  assert.throws(() => mapContextDomains(duplicate), { code: 'E_CONTEXT_DUPLICATE_DIRECT_RETAINER' })
})

test('mapping rejects an unknown organization and an unauthenticated facility coordinate', async () => {
  // Given: two independently corrupted references in actual corpus envelopes.
  const orphan = await corpus()
  orphan.bundle.files.find((file) => file.logical_path.endsWith('/relations.json')).document.eventLinks[1].organizationId = 'O404'
  const invalid = await corpus()
  invalid.bundle.files.find((file) => file.logical_path.endsWith('/personal-holdings.json')).document.holdings.find((holding) => holding.facilityRef?.stationIdentity).facilityRef.stationIdentity.lat = 900

  // When/Then: the typed mapping boundary rejects both before SQLite insertion.
  assert.throws(() => mapContextDomains(orphan), { code: 'E_CONTEXT_ORGANIZATION_ORPHAN' })
  assert.throws(() => mapContextDomains(invalid), { code: 'E_CONTEXT_RIGHTS_SUCCESSOR' })
})

test('mapping rejects a polity differing from the authenticated successor', async () => {
  // Given: a future polity added to an older, outside-Seoul holdings envelope.
  const input = await corpus()
  input.bundle.files.find((file) => file.logical_path.endsWith('/personal-holdings.json')).document.polities[0].id = 'polity:new'

  // When/Then: the exporter refuses to label it superseded without evidence.
  assert.throws(() => mapContextDomains(input), { code: 'E_CONTEXT_RIGHTS_SUCCESSOR' })
})

test('context SQL rejects a normalized holding with an absent source pointer', async () => {
  // Given: the smallest referenced person and raw-source envelopes.
  const db = new DatabaseSync(':memory:')
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT; CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT; CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT; INSERT INTO person VALUES ('K001'); INSERT INTO source_file VALUES (1,'fixture.json'); INSERT INTO source_record VALUES (1,'');")
  db.exec(await readFile(resolve(import.meta.dirname, 'current-context.sql'), 'utf8'))

  // When/Then: source provenance cannot point to a record that was never captured.
  assert.throws(() => db.prepare("INSERT INTO context_holding(holding_id,name_ko,holder_person_id,polity_id,current_validity,canon_status,authority_ref,source_schema,opening_year,transition_set,transition_old_id,source_id,json_pointer) VALUES ('holding:test','test','K001','S01','unresolved','unresolved','ref','fixture',2126,'holdings','old',1,'/absent')").run(), /FOREIGN KEY/)
  db.close()
})

const mutateFile = (input, path) => input.bundle.files.find(file => file.logical_path === path).document
for (const [label, mutate, code] of [
  ['retained holder', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings[0].holderPersonId = 'K002' }, 'E_CONTEXT_RIGHTS_SUCCESSOR'],
  ['geography only', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings[0].stateId = 'S06' }, 'E_CONTEXT_RIGHTS_SUCCESSOR'],
  ['nonowning ownership', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings.find(row => row.kind === 'superior-jurisdiction').directOwnership = true }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['tax power', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings.find(row => row.kind === 'superior-jurisdiction').powers.push('tax') }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['activation status', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings.find(row => row.kind === 'superior-jurisdiction').status = 'active' }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['activation decision', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings.find(row => row.kind === 'superior-jurisdiction').activationDecisionIds = [] }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['personal liege', input => { mutateFile(input, RIGHTS_PATHS.currentExisting).holdings.find(row => row.kind === 'superior-jurisdiction').directLiegePersonId = 'K001' }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['political parent', input => { mutateFile(input, RIGHTS_PATHS.currentAllocation).titles.find(row => row.kind === 'superior-jurisdiction').politicalParentTitleId = 'title:kingdom-s06' }, 'E_CONTEXT_NONOWNING_CONTRACT'],
  ['transition hash', input => { mutateFile(input, RIGHTS_PATHS.transition).records[0].sourceValueSha256 = '0'.repeat(64) }, 'E_CONTEXT_RIGHTS_HASH'],
  ['duplicate disposition', input => { const d = mutateFile(input, RIGHTS_PATHS.transition); d.records.push(structuredClone(d.records[0])) }, 'E_CONTEXT_RIGHTS_HASH'],
  ['missing disposition', input => { mutateFile(input, RIGHTS_PATHS.transition).records.pop() }, 'E_CONTEXT_RIGHTS_HASH'],
  ['person retirement', input => { mutateFile(input, RIGHTS_PATHS.transition).records.push({ set: 'persons', oldId: 'K151' }) }, 'E_CONTEXT_RIGHTS_HASH'],
  ['archive byte', input => { input.bundle.files.find(file => file.logical_path === RIGHTS_PATHS.existing).raw_bytes = Buffer.from('{}') }, 'E_CONTEXT_RIGHTS_HASH'],
  ['identity loss', input => { input.identity.people.pop() }, 'E_CONTEXT_RIGHTS_PERSON_CHANGE'],
  ['office fallback', input => { const office = mutateFile(input, 'lore/relations/opening-office-appointments.json').appointments.find(row => row.personId === 'K151'); office.current.position = office.history.position }, 'E_CONTEXT_OFFICE'],
]) test('current admission rejects ' + label, async () => {
  // Given: real loaded approved inputs, with one independently corrupted field.
  const input = await corpus()
  mutate(input)
  // When/Then: admission fails before any normalized insert.
  assert.throws(() => mapContextDomains(input), { code })
})

test('normalized nonowning rows reject ownership, tax powers and missing transition targets', async () => {
  // Given: a valid real-corpus relational projection.
  const input = await corpus(), tables = mapContextDomains(input), db = database(input)
  db.exec(await readFile(resolve(import.meta.dirname, 'current-context.sql'), 'utf8'))
  insertRows(db, tables)
  // When/Then: SQL protects ownership and evidence even outside the mapper.
  assert.throws(() => db.prepare("UPDATE context_holding SET direct_ownership=1 WHERE current_validity='current_seoul_nonowning'").run(), /CHECK/)
  assert.throws(() => db.prepare("UPDATE context_holding SET direct_ownership=2").run(), /CHECK/)
  assert.throws(() => db.prepare("UPDATE context_holding_power SET power='tax'").run(), /CHECK/)
  assert.throws(() => db.prepare("UPDATE context_holding SET transition_old_id='absent'").run(), /FOREIGN KEY/)
  db.close()
})

test('normalized context column order exactly matches the exported schema manifest', async () => {
  // Given: the standalone schema and a real registry/source envelope.
  const db = database(await corpus())
  db.exec(await readFile(resolve(import.meta.dirname, 'current-context.sql'), 'utf8'))
  // When/Then: all current-context tables retain exact declared column order.
  for (const [table, columns] of Object.entries(CONTEXT_TABLE_COLUMNS)) {
    assert.deepEqual(db.prepare('PRAGMA table_info(' + table + ')').all().map(row => row.name), columns, table)
  }
  db.close()
})
