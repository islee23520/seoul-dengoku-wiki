import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { flattenJson, sha256 } from './sources.mjs';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { BESTIARY_TABLE_COLUMNS, mapBestiaryData, reconstructBestiaryData } from './text-data-bestiary.mjs';
import { readSourceArchive } from './source-archive.mjs';

// Preserve manifest/bundle source numbering, including gaps between bestiary files.
const files = TEXT_DOCUMENT_MANIFEST.flatMap((entry, index) => {
  if (!entry.logical_path.startsWith('lore/bestiary/')) return [];
  const raw_bytes = readSourceArchive(entry.logical_path);
  return [{ ...entry, source_id: index + 1, raw_bytes, sha256: sha256(raw_bytes),
    document: JSON.parse(raw_bytes), content_policy: 'local-corpus' }];
});
const current = files.filter((file) => file.corpus_kind === 'current');
const map = (files) => mapBestiaryData({ files });

function insert(db, table, columns, rows) {
  const statement = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  for (const row of rows) statement.run(...columns.map((column) => row[column]));
}

test('all 27 current documents and authoring example round-trip exactly from relational rows', () => {
  const before = files.map((file) => ({ ...structuredClone(file), raw_bytes: Buffer.from(file.raw_bytes) }));
  const tables = map(files);
  assert.equal(current.length, 27);
  assert.equal(files.length, 28);
  for (const file of files) assert.deepEqual(reconstructBestiaryData({ tables, source_id: file.source_id }), file.document.data, file.logical_path);
  assert.deepEqual(files, before);
  assert.deepEqual(tables, map([...files].reverse()));
  assert.deepEqual(tables, mapBestiaryData({ bundle: { files } }));
  assert.equal(tables.text_ecology_variant.length, 250);
  assert.equal(tables.text_integration_excluded.length, 78);
  assert.equal(tables.text_ecology_data.length, 28);
  assert.equal(tables.text_ecology.length, 27);
  assert.equal(tables.text_ecology_description.length, 54);
  assert.equal(tables.text_integration.length, 27);
  assert.ok(tables.text_ecology_variant.every((row) => row.target_source_id === null));
  assert.ok(tables.text_integration_excluded.every((row) => row.target_source_id === null));
  assert.ok(Object.isFrozen(tables));
  for (const [table, rows] of Object.entries(tables)) {
    assert.ok(Object.isFrozen(rows));
    for (const row of rows) {
      assert.ok(Object.isFrozen(row));
      assert.deepEqual(Object.keys(row).sort(), [...BESTIARY_TABLE_COLUMNS[table]].sort());
    }
  }
});

test('rich descriptions, duplicate entries, empty arrays and optional owned keys remain lossless', () => {
  const file = structuredClone(current[1]);
  file.document.data.ecology.description.en = [
    { text: ' space\n', strong: true },
    { text: 'linked', link: { domain: 'bestiary', slug: 'groups/Hostile-Group-G02', anchor: 'anchor' } },
    { text: 'plain link', link: { domain: 'test', slug: 'Page' } },
    { text: 'external', href: 'https://example.org/' },
  ];
  file.document.data.ecology.variants.push(structuredClone(file.document.data.ecology.variants[0]));
  file.document.data.integration.excluded.push(structuredClone(file.document.data.integration.excluded[0]));
  const tables = map([file]);
  for (const rows of Object.values(tables)) assert.ok(Array.isArray(rows));
  assert.deepEqual(reconstructBestiaryData({ tables, source_id: file.source_id }), file.document.data);
  const index = structuredClone(current[0]);
  for (const data of [{}, { ecology: { description: { en: 'e', ko: 'k' }, variants: [] } },
    { integration: { manifest: file.document.data.integration.manifest, excluded: [] } }]) {
    index.document.data = data;
    assert.deepEqual(reconstructBestiaryData({ tables: map([index]), source_id: index.source_id }), data);
  }
});

test('exact unique local domain identities resolve, while ambiguous identifiers remain unlinked', () => {
  const group = structuredClone(current[1]);
  const target = structuredClone(current[2]);
  target.document.id = group.document.data.ecology.variants[0].id;
  group.document.data.integration.excluded.push({ id: 'G01', kind: 'groups' });
  let tables = map([group, target]);
  assert.equal(tables.text_ecology_variant[0].target_source_id, target.source_id);
  assert.equal(tables.text_integration_excluded.find((row) => row.kind === 'groups').target_source_id, group.source_id);
  const duplicate = structuredClone(target);
  duplicate.source_id = 10000;
  tables = map([group, target, duplicate]);
  assert.equal(tables.text_ecology_variant[0].target_source_id, null);
});

test('invalid source metadata and malformed owned data shapes fail before insertion', () => {
  for (const mutate of [
    (f) => { f.source_id = 0; }, (f) => { f.sha256 = 'invalid'; }, (f) => { delete f.logical_path; },
    (f) => { f.document.data = null; }, (f) => { f.document.data.extra = {}; },
    (f) => { delete f.document.data.ecology; }, (f) => { f.document.data.ecology.extra = true; },
    (f) => { delete f.document.data.ecology.description.en; }, (f) => { f.document.data.ecology.description.en = ''; },
    (f) => { f.document.data.ecology.description.en = []; }, (f) => { f.document.data.ecology.description.en = [{ text: 'x', strong: false }]; },
    (f) => { f.document.data.ecology.description.en = [{ text: 'x', link: { domain: 'test', slug: 'Page', anchor: 'bad.anchor' } }]; },
    (f) => { f.document.data.ecology.description.en = [{ text: 'x', href: 'http://example.org/' }]; },
    (f) => { f.document.data.ecology.description.en = [{ text: 'x', href: 'https://example.org/', link: { domain: 'test', slug: 'Page' } }]; },
    (f) => { f.document.data.ecology.variants = {}; }, (f) => { f.document.data.ecology.variants[0].id = 'invalid'; },
    (f) => { f.document.data.ecology.variants[0].source_batch = 'M007'; },
    (f) => { f.document.data.ecology.variants[0].extra = true; },
    (f) => { f.document.data.integration.manifest = 'other.json'; }, (f) => { f.document.data.integration.excluded = null; },
    (f) => { f.document.data.integration.excluded[0].kind = 'unknown'; },
    (f) => { f.document.data.integration.excluded[0].id = 'B017'; },
    (f) => { f.document.data.integration.excluded[0].extra = true; },
  ]) {
    const file = structuredClone(current[1]);
    mutate(file);
    assert.throws(() => map([file]), { code: 'E_BESTIARY_SHAPE' });
  }
  assert.throws(() => mapBestiaryData(), { code: 'E_BESTIARY_SHAPE' });
  assert.throws(() => map([current[1], current[1]]), { code: 'E_BESTIARY_SHAPE' });
  assert.equal(map([{ source_id: 1, document: { domain: 'other' } }]).text_ecology_data.length, 0);
});

test('SQLite enforces document, pointer, parent and target FKs and preserves every actual document', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    for (const name of ['schema.sql', 'text-corpus-documents.sql', 'text-data-bestiary.sql']) db.exec(readFileSync(new URL(name, import.meta.url), 'utf8'));
    for (const file of files) {
      db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(file.source_id, file.logical_path, 'application/json', file.sha256, file.raw_bytes.length, file.raw_bytes);
      const records = flattenJson(file.document).map((row) => ({ source_id: file.source_id, ...row }));
      insert(db, 'source_record', Object.keys(records[0]), records);
    }
    const documents = mapTextCorpusDocuments({ files });
    for (const [table, columns] of Object.entries(TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS)) insert(db, table, columns, documents[table]);
    const tables = map(files);
    for (const [table, columns] of Object.entries(BESTIARY_TABLE_COLUMNS)) insert(db, table, columns, tables[table]);
    const stored = Object.fromEntries(Object.keys(BESTIARY_TABLE_COLUMNS).map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY source_id,json_pointer DESC`).all()]));
    for (const file of files) assert.deepEqual(reconstructBestiaryData({ tables: stored, source_id: file.source_id }), file.document.data);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    const id = current[1].source_id;
    assert.throws(() => db.prepare('UPDATE text_ecology SET source_id=99999 WHERE source_id=?').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('UPDATE text_ecology_variant SET target_source_id=99999 WHERE source_id=? AND ordinal=0').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('UPDATE text_integration_excluded SET kind=\'groups\',target_source_id=99999 WHERE source_id=? AND ordinal=0').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('DELETE FROM text_ecology WHERE source_id=?').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('DELETE FROM text_integration WHERE source_id=?').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('DELETE FROM source_record WHERE source_id=? AND json_pointer=\'/data/ecology/variants/0\'').run(id), /FOREIGN KEY/);
    assert.throws(() => db.prepare('UPDATE text_ecology_variant SET json_pointer=\'/missing\' WHERE source_id=? AND ordinal=0').run(id), /CHECK|FOREIGN KEY/);
    assert.throws(() => db.prepare('DELETE FROM text_document WHERE source_id=?').run(id), /FOREIGN KEY/);
    const hash = db.prepare('SELECT sha256 FROM source_file JOIN text_ecology_data USING(source_id) WHERE source_id=?').get(id).sha256;
    assert.equal(hash, current[1].sha256);
  } finally { db.close(); }
});
