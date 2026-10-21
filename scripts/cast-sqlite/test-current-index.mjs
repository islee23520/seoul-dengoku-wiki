import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { INDEX_TABLE_COLUMNS, mapIndexDomains } from './current-index.mjs'
import { readSourceArchive } from './source-archive.mjs'

const root = new URL('../..', import.meta.url)
const read = path => JSON.parse(readSourceArchive(path))
const identities = read('lore/name-pools/person-id-registry.json').persons.map(({ id, name }) => ({ person_id: id, name }))
const paths = ['Cast-Index-S4', 'Cast-Index', 'Cast-Corridors-Index']
const fixture = () => ({
  bundle: { files: paths.map((name, index) => ({ source_id: index + 1,
    logical_path: `lore/characters/${name}.json`, document: read(`lore/characters/${name}.json`) })) },
  identity: { people: structuredClone(identities) },
})

test('all index rows retain bilingual values, source position and honest identity status', () => {
  const rows = mapIndexDomains(fixture())
  assert.deepEqual(Object.fromEntries(Object.entries(rows).map(([table, records]) => [table, records.length])), {
    index_document: 3, index_section: 17, index_person: 438, index_corridor_person: 6,
    index_state_label: 16, index_issue: 2,
  })
  assert.equal(rows.index_person.filter(row => row.relation_count > 0).length, 407)
  assert.equal(rows.index_person.filter(row => row.person_id !== null).length, 437)
  assert.deepEqual(rows.index_person.filter(row => row.person_id === null).map(row => [row.name_ko, row.match_status]), [['오도윤', 'unmatched']])
  assert.deepEqual(rows.index_corridor_person.map(row => [row.person_id, row.match_status]), [
    ['K1011', 'documented_display_alias'], ['K1012', 'documented_display_alias'],
    ['K1013', 'exact_registry_name'], ['K1014', 'exact_registry_name'],
    ['K1015', 'exact_registry_name'], ['K1016', 'exact_registry_name'],
  ])
  assert.equal(rows.index_document.find(row => row.logical_path.endsWith('/Cast-Index.json')).tense_ko, 'past')
  assert.equal(rows.index_document.find(row => row.logical_path.endsWith('/Cast-Index.json')).temporal_scope, 'past_draft_index')
  assert.deepEqual(rows.index_issue.map(row => row.issue_code), ['E_INDEX_UNMATCHED_PERSON', 'E_INDEX_SUMMARY_COUNT_MISMATCH'])
  assert.deepEqual(rows.index_issue[1].observed_count, 11)
  assert.deepEqual(rows.index_issue[1].stated_count, 5)
  assert.equal(rows.index_state_label[0].state_name_en, 'The Sluice')
  assert.ok(rows.index_person.every(row => row.json_pointer.startsWith('/content/')))
})

test('unlisted display aliases and ambiguous registry names are never guessed', () => {
  const changed = fixture()
  changed.bundle.files[2].document.content.find(block => block.kind === 'table').rows[0][0].ko = '새 인물 (가명)'
  const rows = mapIndexDomains(changed)
  assert.equal(rows.index_corridor_person[0].person_id, null)
  assert.equal(rows.index_corridor_person[0].match_status, 'unmatched')
  assert.equal(rows.index_issue.length, 3)

  const duplicate = fixture()
  duplicate.identity.people[1].name = duplicate.identity.people[0].name
  assert.throws(() => mapIndexDomains(duplicate), { code: 'E_INDEX_AMBIGUOUS_NAME' })
})

test('authored draft and approved statuses are preserved without promoting index scope', () => {
  const actual = fixture()
  const baseline = mapIndexDomains(actual)
  assert.deepEqual(baseline.index_document.map(row => row.source_status), actual.bundle.files.map(file => file.document.status))
  for (const status of ['draft', 'approved']) {
    const changed = fixture()
    for (const file of changed.bundle.files) file.document.status = status
    const rows = mapIndexDomains(changed)
    assert.deepEqual(rows.index_document, baseline.index_document.map(row => ({ ...row, source_status: status })))
    for (const table of Object.keys(INDEX_TABLE_COLUMNS).filter(table => table !== 'index_document')) {
      assert.deepEqual(rows[table], baseline[table])
    }
  }
})

test('changed table shape or unsupported source contract does not silently alter normalization', () => {
  const width = fixture()
  width.bundle.files[1].document.content.find(block => block.kind === 'table').rows[0].pop()
  assert.throws(() => mapIndexDomains(width), { code: 'E_INDEX_ROW_WIDTH' })
  for (const index of paths.keys()) {
    for (const change of [{ status: 'unknown' }, { source: { kind: 'external-reference' } }, { domain: 'unknown' }]) {
      const source = fixture()
      Object.assign(source.bundle.files[index].document, change)
      assert.throws(() => mapIndexDomains(source), { code: 'E_INDEX_SOURCE_CONTRACT' })
    }
  }
})

test('STRICT SQL schema accepts the full indexed corpus and preserves FK links', () => {
  const rows = mapIndexDomains(fixture())
  const db = new DatabaseSync(':memory:')
  try {
    db.exec('PRAGMA foreign_keys=ON')
    db.exec('CREATE TABLE source_file(source_id INTEGER PRIMARY KEY) STRICT; CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer)) STRICT; CREATE TABLE state(state_id TEXT PRIMARY KEY) STRICT; CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT;')
    for (const row of rows.index_document) db.prepare('INSERT INTO source_file VALUES (?)').run(row.source_id)
    for (const row of rows.index_state_label) db.prepare('INSERT INTO state VALUES (?)').run(row.state_id)
    const person = db.prepare('INSERT INTO person VALUES (?)')
    for (const row of identities) person.run(row.person_id)
    const pointer = db.prepare('INSERT OR IGNORE INTO source_record VALUES (?,?)')
    for (const records of Object.values(rows)) for (const row of records) if (row.json_pointer !== undefined) pointer.run(row.source_id, row.json_pointer)
    db.exec(readFileSync(new URL('./current-index.sql', import.meta.url), 'utf8'))
    const order = ['index_document', 'index_state_label', 'index_section', 'index_person', 'index_corridor_person', 'index_issue']
    for (const table of order) {
      const cols = INDEX_TABLE_COLUMNS[table]
      const insert = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
      for (const row of rows[table]) insert.run(...cols.map(column => row[column]))
    }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    assert.equal(db.prepare('SELECT count(*) AS n FROM index_person WHERE person_id IS NULL').get().n, 1)
    assert.equal(db.prepare('SELECT count(*) AS n FROM index_corridor_person WHERE match_status=?').get('documented_display_alias').n, 2)
    assert.throws(() => db.prepare('INSERT INTO index_person(source_id,table_anchor,row_ordinal,person_id,match_status,name_ko,name_en,office_ko,office_en,tier_ko,tier_en,relation_count,json_pointer) VALUES (2,?,999,?, ?,?,?,?,?,?,?,0,?)').run(rows.index_section[0].table_anchor, 'K9999', 'exact_registry_name', 'x', 'x', 'x', 'x', 'x', 'x', '/content/0'))
  } finally { db.close() }
})
