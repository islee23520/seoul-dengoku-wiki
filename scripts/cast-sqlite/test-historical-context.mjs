import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { HISTORICAL_CONTEXT_TABLE_COLUMNS, mapHistoricalContext } from './historical-context.mjs'
import { parseDocument } from './sources.mjs'

const PATHS = [
  'scripts/historical-inputs/opening-feudal-allocation.json',
  'scripts/historical-inputs/outside-control-2126.json',
  'lore/regions/seoul-electoral-titles.json',
]

async function corpus() {
  const root = resolve(import.meta.dirname, '..', '..')
  const registry = JSON.parse(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json')))
  const files = await Promise.all(PATHS.map(async (logical_path, ordinal) => {
    const text = await readFile(resolve(root, logical_path), 'utf8')
    return { source_id: ordinal + 1, logical_path, ...parseDocument(text) }
  }))
  return { bundle: { files }, identity: { people: registry.persons.map(({ id, name }) => ({ person_id: id, name })) } }
}

test('actual superseded rights remain person-linked history, while inspection geography grants no rights', async () => {
  // Given: all three public historical/staging source files and the stable registry.
  const input = await corpus()
  const before = JSON.stringify(input.bundle.files.map(({ document }) => document))

  // When: the person-linked historical data are mapped into typed rows.
  const tables = mapHistoricalContext(input)

  // Then: all old holder links survive, but every right has an explicit obsolete status.
  assert.deepEqual(Object.keys(tables), Object.keys(HISTORICAL_CONTEXT_TABLE_COLUMNS))
  assert.deepEqual(Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.length])), {
    historical_source_scope: 3,
    historical_feudal_title: 200,
    historical_feudal_jurisdiction: 4074,
    historical_feudal_grant: 179,
    historical_feudal_grant_admin: 1730,
    historical_feudal_grant_component: 108,
    historical_feudal_binding: 7,
    historical_outside_person_control: 82,
  })
  assert.equal(tables.historical_source_scope.find((row) => row.logical_path.endsWith('seoul-electoral-titles.json')).classification, 'inspection_only_no_person_right')
  assert.equal(tables.historical_feudal_title.every((row) => row.current_validity === 'superseded_pre_seoul_rebase'), true)
  assert.equal(tables.historical_feudal_grant.every((row) => row.current_validity === 'superseded_pre_seoul_rebase'), true)
  assert.equal(tables.historical_outside_person_control.every((row) => row.current_validity === 'superseded_outside_seoul'), true)
  assert.equal(JSON.stringify(input.bundle.files.map(({ document }) => document)), before)

  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT; CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT; CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;')
  const person = db.prepare('INSERT INTO person VALUES (?)')
  for (const row of input.identity.people) person.run(row.person_id)
  const sourceFile = db.prepare('INSERT INTO source_file VALUES (?,?)')
  const sourceRecord = db.prepare('INSERT INTO source_record VALUES (?,?)')
  for (const file of input.bundle.files) {
    sourceFile.run(file.source_id, file.logical_path)
    for (const row of file.records) sourceRecord.run(file.source_id, row.json_pointer)
  }
  db.exec(await readFile(resolve(import.meta.dirname, 'historical-context.sql'), 'utf8'))
  for (const [table, columns] of Object.entries(HISTORICAL_CONTEXT_TABLE_COLUMNS)) {
    const statement = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
    for (const row of tables[table]) statement.run(...columns.map((column) => row[column]))
  }
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
  assert.throws(() => db.prepare("UPDATE historical_feudal_title SET current_validity='current_seoul_evidenced' WHERE title_id=?").run(tables.historical_feudal_title[0].title_id), /CHECK constraint failed/)
  assert.throws(() => db.prepare("UPDATE historical_outside_person_control SET json_pointer='/assignments/999999' WHERE admin_unit_id=?").run(tables.historical_outside_person_control[0].admin_unit_id), /FOREIGN KEY constraint failed/)
  db.close()
})

test('unknown historical holder ID and inspection-only source promotion both fail', async () => {
  // Given: the real files with one changed person ID or changed staging status.
  const orphan = await corpus()
  orphan.bundle.files[0].document.titles[0].holderPersonId = 'K9999'
  const promoted = await corpus()
  promoted.bundle.files[2].document.status = 'approved'

  // When/Then: invalid ownership and a change to the staging contract are rejected.
  assert.throws(() => mapHistoricalContext(orphan), { code: 'E_HISTORICAL_PERSON_ORPHAN' })
  assert.throws(() => mapHistoricalContext(promoted), { code: 'E_HISTORICAL_STAGING_STATUS' })
})
