import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { SIMPLE_TABLE_COLUMNS, mapSimpleData, reconstructSimpleData } from './text-data-simple.mjs';

const root = new URL('../../', import.meta.url);
const files = TEXT_DOCUMENT_MANIFEST.map(({ logical_path }, index) => ({ source_id: index + 1, logical_path,
  document: JSON.parse(readSourceArchive(logical_path)) }));
const registry = { logical_path: 'lore/name-pools/person-id-registry.json',
  document: JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json')) };
const bundle = { files: [...files, registry] };
const keys = ['symptom', 'transmission', 'exchange', 'supply', 'tier', 'consequence', 'dependency', 'layer',
  'opening_state', 'function', 'constraint', 'primary_detail_names', 'sequence', 'entries'];
test('simple domain rows reconstruct all original values without source records', () => {
  const before = structuredClone(files);
  const tables = mapSimpleData({ files, bundle });
  let count = 0;
  for (const file of files) {
    const expected = Object.fromEntries(Object.entries(file.document.data).filter(([key]) => keys.includes(key)));
    if (Object.keys(expected).length) count++;
    assert.deepEqual(reconstructSimpleData({ tables, source_id: file.source_id }), expected, file.logical_path);
  }
  assert.equal(count, 18);
  assert.deepEqual(files, before);
  assert.deepEqual(mapSimpleData({ files: [...files].reverse(), bundle }), tables);
});
test('unresolved people and new event fields fail closed', () => {
  const primary = files.find((file) => file.document.data.primary_detail_names);
  const malformed = structuredClone(primary);
  malformed.document.data.primary_detail_names = ['not in registry'];
  assert.throws(() => mapSimpleData({ files: [malformed], bundle }), { code: 'E_TEXT_DATA_SIMPLE' });
  const event = structuredClone(files.find((file) => file.document.data.sequence));
  event.document.data.sequence[0].extra = true;
  assert.throws(() => mapSimpleData({ files: [event], bundle }), { code: 'E_TEXT_DATA_SIMPLE' });
});
test('empty arrays remain present and omitted optional dates stay omitted', () => {
  const input = structuredClone(files.find((file) => file.document.data.sequence));
  input.document.data.sequence = [];
  const tables = mapSimpleData({ files: [input], bundle });
  assert.deepEqual(reconstructSimpleData({ tables, source_id: input.source_id }), { sequence: [] });
});
test('SQLite retains simple domain values and enforces person and source pointer FKs', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    for (const file of ['schema.sql', 'text-corpus-documents.sql', 'text-data-simple.sql']) db.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    const insert = (table, columns, rows) => {
      const statement = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
      for (const row of rows) statement.run(...columns.map((column) => row[column]));
    };
    const selected = files.filter((file) => Object.keys(file.document.data).some((key) => keys.includes(key)))
      .map((file) => ({ ...file, corpus_kind: file.logical_path.endsWith('authoring.example.json') ? 'example' : 'current', content_policy: 'local-corpus' }));
    for (const [ordinal, person] of registry.document.persons.entries()) db.prepare('INSERT INTO person(person_id,name,publication_ordinal,public_key,public_route,values_source_ordinal,minors) VALUES (?,?,?,?,?,?,0)')
      .run(person.id, person.name, ordinal + 1, `person-${ordinal}`, `/people/person-${ordinal}`, ordinal);
    for (const file of selected) {
      const bytes = Buffer.from(JSON.stringify(file.document));
      db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(file.source_id, file.logical_path, 'application/json', sha256(bytes), bytes.length, bytes);
      const records = flattenJson(file.document).map((row) => ({ source_id: file.source_id, ...row }));
      insert('source_record', Object.keys(records[0]), records);
      const [document] = mapTextCorpusDocuments({ files: [file] }).text_document;
      insert('text_document', Object.keys(document), [document]);
    }
    const mapped = mapSimpleData({ files: selected, bundle });
    for (const [table, columns] of Object.entries(SIMPLE_TABLE_COLUMNS)) insert(table, columns, mapped[table]);
    const stored = Object.fromEntries(Object.keys(SIMPLE_TABLE_COLUMNS).map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY json_pointer DESC`).all()]));
    for (const file of selected) assert.deepEqual(reconstructSimpleData({ tables: stored, source_id: file.source_id }), file.document.data, file.logical_path);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.throws(() => db.exec("UPDATE text_primary_detail SET person_id='missing'"), /FOREIGN KEY/);
    assert.throws(() => db.exec("UPDATE text_chronology_event SET json_pointer='/missing'"), /FOREIGN KEY/);
  } finally { db.close(); }
});
