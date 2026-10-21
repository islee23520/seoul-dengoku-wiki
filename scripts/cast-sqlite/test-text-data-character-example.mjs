import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { flattenJson, sha256 } from './sources.mjs';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { CHARACTER_EXAMPLE_TABLE_COLUMNS, mapCharacterExampleData, reconstructCharacterExampleData } from './text-data-character-example.mjs';

const logical_path = 'lore/characters/authoring.example.json';
const source_id = TEXT_DOCUMENT_MANIFEST.findIndex((entry) => entry.logical_path === logical_path) + 1;
const raw_bytes = readSourceArchive(logical_path);
const file = { ...TEXT_DOCUMENT_MANIFEST[source_id - 1], source_id, raw_bytes, sha256: sha256(raw_bytes),
  document: JSON.parse(raw_bytes), content_policy: 'local-corpus' };
const registry = JSON.parse(readSourceArchive('lore/name-pools/values-cast.json'));
const map = (f = file) => mapCharacterExampleData({ files: [f] });
const reconstruct = (tables) => reconstructCharacterExampleData({ tables, source_id });
function insert(db, table, columns, rows) {
  const statement = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  for (const row of rows) statement.run(...columns.map((column) => row[column]));
}

test('original character example round-trips exactly with stable source identity and registry axes', () => {
  const before = structuredClone(file.document);
  const tables = map();
  assert.ok(source_id > 0);
  assert.deepEqual(reconstruct(tables), file.document.data);
  assert.deepEqual(file.document, before);
  assert.deepEqual(tables, mapCharacterExampleData({ bundle: { files: [file] } }));
  assert.deepEqual(tables.text_character_example_value.map((row) => row.axis_name), registry.axes);
  assert.deepEqual(tables.text_character_example_desire.filter((row) => row.value_kind === 'integer').map((row) => row.axis_name), registry.desire_axes);
  for (const row of tables.text_character_example_desire) assert.ok(Object.hasOwn(registry.people[0].desire, row.axis_name));
  assert.deepEqual(Object.values(tables).map((rows) => rows.length), [1, 1, 1, 10, 10, 7, 6, 1, 0]);
  assert.deepEqual(reconstruct(tables).relations.value, []);
  assert.deepEqual(reconstructCharacterExampleData({ tables, source_id: 999999 }), {});
  for (const [table, rows] of Object.entries(tables)) {
    assert.ok(Object.isFrozen(rows));
    for (const row of rows) {
      assert.ok(Object.isFrozen(row));
      assert.equal(row.source_id, source_id);
      assert.deepEqual(Object.keys(row).sort(), [...CHARACTER_EXAMPLE_TABLE_COLUMNS[table]].sort());
    }
  }
});

test('missing properties, all assertion states, numeric zero and relation order remain distinct', () => {
  for (const field of Object.keys(file.document.data)) {
    const changed = structuredClone(file);
    delete changed.document.data[field];
    assert.deepEqual(reconstruct(map(changed)), changed.document.data);
  }
  for (const status of ['unknown', 'undecided', 'not-applicable']) {
    const changed = structuredClone(file);
    changed.document.data.values.authority = { status, reason: 'Unasserted score' };
    changed.document.data.desires.orientation = { status, reason: 'Unasserted orientation' };
    changed.document.data.relations = { status, reason: 'Unasserted relations' };
    assert.deepEqual(reconstruct(map(changed)), changed.document.data);
    assert.ok(!Object.hasOwn(reconstruct(map(changed)).relations, 'value'));
  }
  const changed = structuredClone(file);
  changed.document.data.relations.value = [{ type: 'kinship', target_id: 'K001' }, { type: 'debt', target_id: 'K001' }];
  changed.document.data.desires.orientation = { status: 'known', value: '이성', origin: 'source-fact' };
  assert.deepEqual(reconstruct(map(changed)), changed.document.data);
  const unrelated = { ...file, logical_path: 'lore/characters/Other.json' };
  assert.ok(Object.values(map(unrelated)).every((rows) => !rows.length));
});

test('malformed owned shapes fail before insertion', () => {
  for (const mutate of [
    (f) => { f.source_id = 0; }, (f) => { f.sha256 = 'bad'; },
    (f) => { f.document.data.extra = true; }, (f) => { f.document.data.identity.generation = 'bad'; },
    (f) => { f.document.data.values.authority.value = 101; },
    (f) => { f.document.data.occupation.value = 'should be absent'; },
    (f) => { f.document.data.desires.orientation = { status: 'known', value: 0, origin: 'computed' }; },
    (f) => { f.document.data.relations.value = [{ type: 'bad', target_id: 'K001' }]; },
  ]) {
    const changed = structuredClone(file);
    mutate(changed);
    assert.throws(() => map(changed), { code: 'E_CHARACTER_EXAMPLE_SHAPE' });
  }
  assert.throws(() => mapCharacterExampleData(), { code: 'E_CHARACTER_EXAMPLE_SHAPE' });
  assert.throws(() => mapCharacterExampleData({ files: [file, file] }), { code: 'E_CHARACTER_EXAMPLE_SHAPE' });
});

test('SQLite round-trip enforces source, pointer and axis foreign keys and assertion constraints', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    for (const name of ['schema.sql', 'text-corpus-documents.sql', 'text-data-character-example.sql']) db.exec(readFileSync(new URL(name, import.meta.url), 'utf8'));
    db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(source_id, logical_path, 'application/json', file.sha256, raw_bytes.length, raw_bytes);
    const records = flattenJson(file.document).map((row) => ({ source_id, ...row }));
    insert(db, 'source_record', Object.keys(records[0]), records);
    const documents = mapTextCorpusDocuments({ files: [file] });
    for (const [table, columns] of Object.entries(TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS)) insert(db, table, columns, documents[table]);
    registry.axes.forEach((axis, ordinal) => db.prepare('INSERT INTO value_axis VALUES (?,?)').run(axis, ordinal));
    Object.keys(registry.people[0].desire).forEach((axis, ordinal) => db.prepare('INSERT INTO desire_axis VALUES (?,?,?)').run(axis, ordinal, registry.desire_axes.includes(axis) ? 'integer' : 'text'));
    const tables = map();
    for (const [table, columns] of Object.entries(CHARACTER_EXAMPLE_TABLE_COLUMNS)) insert(db, table, columns, tables[table]);
    const stored = Object.fromEntries(Object.keys(CHARACTER_EXAMPLE_TABLE_COLUMNS).map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY json_pointer DESC`).all()]));
    assert.deepEqual(reconstruct(stored), file.document.data);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.throws(() => db.prepare('DELETE FROM text_document WHERE source_id=?').run(source_id), /FOREIGN KEY/);
    assert.throws(() => db.prepare("DELETE FROM source_record WHERE source_id=? AND json_pointer='/data/identity/name'").run(source_id), /FOREIGN KEY/);
    assert.throws(() => db.prepare("DELETE FROM value_axis WHERE axis_name='권위'").run(), /FOREIGN KEY/);
    assert.throws(() => db.prepare("DELETE FROM desire_axis WHERE axis_name='지향'").run(), /FOREIGN KEY/);
    assert.throws(() => db.prepare('UPDATE text_character_example SET source_id=999999').run(), /FOREIGN KEY/);
    assert.throws(() => db.prepare("UPDATE text_character_example_fact SET field='bad' WHERE field='occupation'").run(), /CHECK/);
    assert.throws(() => db.prepare("UPDATE text_character_example_fact SET status='known' WHERE field='occupation'").run(), /CHECK/);
    assert.throws(() => db.prepare("UPDATE text_character_example_value SET integer_value=101 WHERE axis='authority'").run(), /CHECK/);
    assert.equal(db.prepare('SELECT sha256 FROM source_file JOIN text_character_example USING(source_id)').get().sha256, file.sha256);
  } finally { db.close(); }
});
