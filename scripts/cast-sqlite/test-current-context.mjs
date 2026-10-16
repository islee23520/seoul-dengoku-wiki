import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs'
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
  const files = await Promise.all(CONTEXT_PATHS.map(async (logical_path, index) => {
    const raw_bytes = await readFile(resolve(root, logical_path))
    const parsed = parseDocument(raw_bytes.toString('utf8'))
    return { source_id: index + 1, logical_path, document: parsed.document, records: parsed.records,
      sha256: createHash('sha256').update(raw_bytes).digest('hex'), byte_length: raw_bytes.length, raw_bytes }
  }))
  return { bundle: { files }, identity: { people: registry.persons.map(({ id, name }) => ({ person_id: id, name })) } }
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
  for (const [table, columns] of Object.entries(CONTEXT_TABLE_COLUMNS)) {
    const insert = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
    for (const row of tables[table]) insert.run(...columns.map((column) => row[column]))
  }
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
  assert.equal(tables.context_retinue_group[0].current_validity, 'superseded_outside_seoul')
  assert.equal(tables.context_holding.find((row) => row.holding_id === 'holding:yangcheon').designation_ko, '양천구 영주')
  const facility = tables.context_holding_reference.find((row) => row.holding_id === 'holding:yeongdeungpo-concourse')
  assert.equal(facility.station_name, '영등포')
  assert.equal(facility.station_district, '영등포구')
  assert.equal(facility.station_lat, 37.51536)
  assert.equal(facility.station_lon, 126.90693)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'current_seoul_evidenced').length, 0)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'superseded_outside_seoul').length, 5)
  assert.equal(tables.context_holding.filter((row) => row.current_validity === 'unresolved').length, 20)
  assert.equal(tables.context_issue.filter((row) => row.code === 'E_CONTEXT_HOLDING_SUPERSEDED_OUTSIDE_SEOUL').length, 5)
  assert.equal(tables.context_issue.filter((row) => row.code === 'E_CONTEXT_HOLDING_UNRESOLVED').length, 20)
  assert.equal(tables.context_direct_retainer.some((row) => row.person_id === row.liege_person_id), false)
  assert.equal(tables.context_prose_contact.some((row) => row.person_id === row.recipient_person_id), false)
  assert.equal(db.prepare("SELECT count(*) AS count FROM context_holding WHERE current_validity='current_seoul_evidenced'").get().count, 0)
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

test('mapping rejects an event linked to an unknown organization and an invalid facility coordinate', async () => {
  // Given: two independently corrupted references in actual corpus envelopes.
  const orphan = await corpus()
  orphan.bundle.files.find((file) => file.logical_path.endsWith('/relations.json')).document.eventLinks[1].organizationId = 'O404'
  const invalid = await corpus()
  invalid.bundle.files.find((file) => file.logical_path.endsWith('/personal-holdings.json')).document.holdings.find((holding) => holding.facilityRef?.stationIdentity).facilityRef.stationIdentity.lat = 900

  // When/Then: the typed mapping boundary rejects both before SQLite insertion.
  assert.throws(() => mapContextDomains(orphan), { code: 'E_CONTEXT_ORGANIZATION_ORPHAN' })
  assert.throws(() => mapContextDomains(invalid), { code: 'E_CONTEXT_COORDINATE' })
})

test('mapping requires a new polity to receive an explicit Seoul-validity review', async () => {
  // Given: a future polity added to an older, outside-Seoul holdings envelope.
  const input = await corpus()
  input.bundle.files.find((file) => file.logical_path.endsWith('/personal-holdings.json')).document.polities[0].id = 'polity:new'

  // When/Then: the exporter refuses to label it superseded without evidence.
  assert.throws(() => mapContextDomains(input), { code: 'E_CONTEXT_POLITY_REVIEW_REQUIRED' })
})

test('context SQL rejects a normalized holding with an absent source pointer', async () => {
  // Given: the smallest referenced person and raw-source envelopes.
  const db = new DatabaseSync(':memory:')
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT; CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT; CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT; INSERT INTO person VALUES ('K001'); INSERT INTO source_file VALUES (1,'fixture.json'); INSERT INTO source_record VALUES (1,'');")
  db.exec(await readFile(resolve(import.meta.dirname, 'current-context.sql'), 'utf8'))

  // When/Then: source provenance cannot point to a record that was never captured.
  assert.throws(() => db.prepare('INSERT INTO context_holding VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('holding:test', '시험', null, 'K001', null, 'S01', null, null, null, null, null, null, null, 'unresolved', 'unresolved', '2026-10-13', 'WORLD_BUILDING_GUIDE.md', 'confirmed-person-holdings.v1', 2126, 1, '/missing'), /FOREIGN KEY/)
  db.close()
})
