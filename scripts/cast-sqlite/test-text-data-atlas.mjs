import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { ATLAS_TABLE_COLUMNS, mapAtlasData, reconstructAtlasData } from './text-data-atlas.mjs';

const paths = ['lore/World-Narrative-Atlas.json', 'lore/authoring.example.json'];
const files = paths.map((logical_path, index) => {
  const raw_bytes = readSourceArchive(logical_path);
  return { source_id: index + 1, logical_path, raw_bytes, sha256: sha256(raw_bytes), document: JSON.parse(raw_bytes),
    corpus_kind: index ? 'example' : 'current', content_policy: 'local-corpus' };
});
const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json'));
const values = JSON.parse(readSourceArchive('lore/name-pools/values-cast.json'));
const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: registry },
  { logical_path: 'lore/name-pools/values-cast.json', document: values }] };
const expected = (document) => Object.fromEntries(['atlas', 'registry'].filter((key) => Object.hasOwn(document.data, key)).map((key) => [key, document.data[key]]));

test('every actual atlas and root registry roundtrips exactly without source mutation', () => {
  const before = files.map((f) => ({ ...f, raw_bytes: Buffer.from(f.raw_bytes), document: structuredClone(f.document) }));
  const tables = mapAtlasData({ files, bundle });
  assert.deepEqual(files, before);
  assert.deepEqual(tables, mapAtlasData({ files: [...files].reverse(), bundle }));
  for (const file of files) assert.deepEqual(reconstructAtlasData({ tables, source_id: file.source_id }), expected(file.document), file.logical_path);
  for (const [table, columns] of Object.entries(ATLAS_TABLE_COLUMNS)) {
    assert.ok(Object.isFrozen(tables[table]));
    for (const row of tables[table]) {
      assert.ok(Object.isFrozen(row));
      assert.deepEqual(Object.keys(row).sort(), [...columns].sort());
      assert.ok(row.row_key.includes(files.find((f) => f.source_id === row.source_id).document.id));
    }
  }
  assert.deepEqual(reconstructAtlasData({ tables, source_id: 999 }), {});
  assert.ok(tables.text_atlas_additional_people.some((row) => row.person_ref));
  const stateIds = new Set(values.people.map((p) => p.state));
  for (const row of tables.text_atlas_states) assert.equal(row.state_ref, stateIds.has(row.id) ? row.id : null);
  for (const row of tables.text_atlas_humans) assert.equal(row.state_ref, stateIds.has(row.state_id) ? row.state_id : null);
  assert.ok(tables.text_atlas_humans.some((row) => row.state_ref));
  assert.ok(Object.values(mapAtlasData({ files, bundle: { files: [] } })).flat().every((r) => r.state_ref === null && r.person_ref === null));
});

test('temporary SQLite stores all actual rows with provenance and parent FKs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'text-atlas-'));
  const db = new DatabaseSync(join(directory, 'atlas.sqlite'));
  try {
    db.exec('PRAGMA foreign_keys=ON');
    for (const name of ['schema.sql', 'text-corpus-documents.sql', 'text-data-atlas.sql']) db.exec(readFileSync(new URL(name, import.meta.url), 'utf8'));
    db.exec('BEGIN');
    for (const state of new Set(values.people.map((p) => p.state))) db.prepare('INSERT INTO state(state_id) VALUES (?)').run(state);
    for (const [index, p] of registry.persons.entries()) db.prepare('INSERT INTO person (person_id,name,publication_ordinal,public_key,public_route,source_kind,minors,values_source_ordinal) VALUES (?,?,?,?,?,?,?,?)').run(p.id, p.name, index + 1, p.id, '/test/' + p.id, 'original-fiction', 0, index);
    const sourceInsert = db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)');
    const recordColumns = ['source_id', 'json_pointer', 'parent_pointer', 'ordinal', 'field_name', 'json_type', 'text_value', 'integer_value', 'real_value', 'boolean_value'];
    const recordInsert = db.prepare(`INSERT INTO source_record (${recordColumns}) VALUES (${recordColumns.map(() => '?')})`);
    for (const file of files) {
      sourceInsert.run(file.source_id, file.logical_path, 'application/json', file.sha256, file.raw_bytes.length, file.raw_bytes);
      for (const r of flattenJson(file.document)) recordInsert.run(...recordColumns.map((c) => c === 'source_id' ? file.source_id : r[c]));
    }
    const documentTables = mapTextCorpusDocuments({ files });
    const atlasTables = mapAtlasData({ files, bundle });
    for (const [table, columns] of Object.entries({ ...TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS, ...ATLAS_TABLE_COLUMNS })) {
      assert.deepEqual(db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name).sort(), [...columns].sort());
      const insert = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
      for (const row of documentTables[table] ?? atlasTables[table]) insert.run(...columns.map((c) => row[c]));
    }
    db.exec('COMMIT');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    const stored = Object.fromEntries(Object.keys(ATLAS_TABLE_COLUMNS).map((t) => [t, db.prepare(`SELECT * FROM ${t}`).all().map((r) => ({ ...r }))]));
    for (const file of files) assert.deepEqual(reconstructAtlasData({ tables: stored, source_id: file.source_id }), expected(file.document));
    const theaterFields = ['record_status', 'current_operational_claim', 'historical_display_name', 'projection_display_name'];
    const theaterColumns = ATLAS_TABLE_COLUMNS.text_atlas_theaters.filter((column) => theaterFields.some((field) => column === field || column.startsWith(field + '__')));
    assert.deepEqual(db.prepare('PRAGMA table_info(text_atlas_theaters)').all().map((row) => row.name)
      .filter((column) => theaterFields.some((field) => column === field || column.startsWith(field + '__'))), theaterColumns);
    for (const row of stored.text_atlas_theaters.filter((row) => row.source_id === files[0].source_id)) {
      assert.equal(row.current_operational_claim__type, 'boolean');
      assert.equal(row.current_operational_claim, 0);
    }
    for (const sql of ["UPDATE text_atlas SET source_id=999", "UPDATE text_atlas SET json_pointer='/missing'", "UPDATE text_atlas_houses SET parent_key='missing'", "UPDATE text_atlas_humans SET person_ref='missing'", "UPDATE text_atlas_states SET state_ref='missing'", 'UPDATE text_atlas_houses SET ordinal=-1']) assert.throws(() => db.exec(sql), undefined, sql);
    console.log(JSON.stringify({ tables: Object.keys(ATLAS_TABLE_COLUMNS).length, rows: Object.values(atlasTables).reduce((n, rows) => n + rows.length, 0), sections: Object.keys(files[0].document.data.atlas).length,
      matched_people: atlasTables.text_atlas_humans.filter((r) => r.person_ref).length + atlasTables.text_atlas_additional_people.filter((r) => r.person_ref).length,
      uninterpreted_people: atlasTables.text_atlas_humans.filter((r) => !r.person_ref).length + atlasTables.text_atlas_additional_people.filter((r) => !r.person_ref).length }));
  } finally {
    db.close();
    rmSync(directory, { recursive: true });
  }
});

test('unknown shapes fail rather than silently dropping fields', () => {
  const file = structuredClone(files[1]);
  file.document.data.atlas.unrecognized = 'do not lose';
  assert.throws(() => mapAtlasData({ files: [file], bundle }), { code: 'E_ATLAS_SHAPE' });
});

test('every actual relation roundtrips with its endpoint display intact', () => {
  for (const source of files) {
    const file = structuredClone(source);
    file.document.data = { atlas: { relations: file.document.data.atlas.relations } };
    const tables = mapAtlasData({ files: [file], bundle });
    assert.deepEqual(reconstructAtlasData({ tables, source_id: file.source_id }), expected(file.document));
  }
});

test('relation endpoint display preserves typed values, absence, and explicit null', () => {
  const displays = [undefined, null, {}, { from: null, to: null }, { from: {}, to: {} },
    { from: { en: null, ko: null }, to: { en: null, ko: null } },
    { from: { en: 'From', ko: 'From ko' }, to: { en: 'To', ko: 'To ko' } }];
  const file = structuredClone(files[1]);
  file.document.data = { atlas: { relations: displays.map((endpoint_display) => endpoint_display === undefined
    ? {} : { endpoint_display }) } };
  const tables = mapAtlasData({ files: [file], bundle });
  assert.deepEqual(reconstructAtlasData({ tables, source_id: file.source_id }), expected(file.document));
  const rows = tables.text_atlas_relations;
  assert.equal(rows[0].endpoint_display__type, null);
  assert.equal(rows[1].endpoint_display__type, 'null');
  assert.equal(rows[2].endpoint_display__type, 'object');
  assert.equal(rows[2].endpoint_display__from__type, null);
  assert.equal(rows[3].endpoint_display__from__type, 'null');
  assert.equal(rows[4].endpoint_display__from__en__type, null);
  assert.equal(rows[5].endpoint_display__from__en__type, 'null');
  for (const side of ['from', 'to']) for (const language of ['en', 'ko']) {
    const column = `endpoint_display__${side}__${language}`;
    assert.equal(rows[6][column + '__type'], 'string');
    assert.equal(rows[6][column], displays[6][side][language]);
  }
  const db = new DatabaseSync(':memory:');
  try {
    for (const name of ['schema.sql', 'text-corpus-documents.sql', 'text-data-atlas.sql']) db.exec(readFileSync(new URL(name, import.meta.url), 'utf8'));
    db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(file.source_id, file.logical_path,
      'application/json', file.sha256, file.raw_bytes.length, file.raw_bytes);
    const recordColumns = ['source_id', 'json_pointer', 'parent_pointer', 'ordinal', 'field_name', 'json_type', 'text_value', 'integer_value', 'real_value', 'boolean_value'];
    const recordInsert = db.prepare(`INSERT INTO source_record (${recordColumns}) VALUES (${recordColumns.map(() => '?')})`);
    for (const row of flattenJson(file.document)) recordInsert.run(...recordColumns.map((column) => column === 'source_id' ? file.source_id : row[column]));
    const documentTables = mapTextCorpusDocuments({ files: [file] });
    for (const [table, columns] of Object.entries({ ...TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS, ...ATLAS_TABLE_COLUMNS })) {
      const insert = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
      for (const row of documentTables[table] ?? tables[table]) insert.run(...columns.map((column) => row[column]));
    }
    const columns = ATLAS_TABLE_COLUMNS.text_atlas_relations;
    const displayColumns = columns.filter((column) => column.startsWith('endpoint_display__'));
    assert.deepEqual(db.prepare('PRAGMA table_info(text_atlas_relations)').all()
      .map((row) => row.name).filter((column) => column.startsWith('endpoint_display__')), displayColumns);
    const stored = db.prepare('SELECT * FROM text_atlas_relations ORDER BY ordinal').all();
    assert.deepEqual(stored.map((row) => Object.fromEntries(displayColumns.map((column) => [column, row[column]]))),
      rows.map((row) => Object.fromEntries(displayColumns.map((column) => [column, row[column]]))));
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {
    db.close();
  }
});

test('relation endpoint display rejects unreviewed fields and types at every level', () => {
  for (const endpoint_display of [{ extra: 'unreviewed' }, { from: { extra: 'unreviewed' } },
    { to: { extra: 'unreviewed' } }, [], { from: [] }, { to: 'invalid' },
    { from: { en: 1 } }, { from: { ko: true } }, { to: { en: [] } }, { to: { ko: {} } }]) {
    const file = structuredClone(files[1]);
    file.document.data = { atlas: { relations: [{ endpoint_display }] } };
    assert.throws(() => mapAtlasData({ files: [file], bundle }), { code: 'E_ATLAS_SHAPE' });
  }
});

test('theater current metadata preserves absence, null, historical names, and false claims', () => {
  const theaters = [{}, { record_status: null, current_operational_claim: null,
    historical_display_name: null, projection_display_name: null },
  { record_status: 'historical-provenance', current_operational_claim: false,
    historical_display_name: {}, projection_display_name: {} },
  { current_operational_claim: true, historical_display_name: { en: null, ko: null },
    projection_display_name: { en: null, ko: null } },
  ...files[0].document.data.atlas.theaters];
  const file = structuredClone(files[1]);
  file.document.data = { atlas: { theaters } };
  const tables = mapAtlasData({ files: [file], bundle });
  assert.deepEqual(reconstructAtlasData({ tables, source_id: file.source_id }), expected(file.document));
  const rows = tables.text_atlas_theaters;
  for (const field of ['record_status', 'current_operational_claim', 'historical_display_name', 'projection_display_name']) {
    assert.equal(rows[0][field + '__type'], null);
    assert.equal(rows[1][field + '__type'], 'null');
  }
  assert.equal(rows[2].current_operational_claim__type, 'boolean');
  assert.equal(rows[2].current_operational_claim, 0);
  assert.equal(rows[3].current_operational_claim, 1);
  for (const field of ['historical_display_name', 'projection_display_name']) for (const language of ['en', 'ko']) {
    assert.equal(rows[2][`${field}__${language}__type`], null);
    assert.equal(rows[3][`${field}__${language}__type`], 'null');
  }
  for (const row of rows.slice(4)) assert.equal(row.current_operational_claim, 0);
});

test('theater current metadata rejects unreviewed fields and invalid types', () => {
  for (const theater of [{ record_status: false }, { current_operational_claim: 0 },
    { historical_display_name: [] }, { projection_display_name: 'invalid' },
    { historical_display_name: { extra: 'unreviewed' } }, { projection_display_name: { extra: 'unreviewed' } },
    { historical_display_name: { en: false } }, { historical_display_name: { ko: [] } },
    { projection_display_name: { en: 0 } }, { projection_display_name: { ko: {} } }, { extra: 'unreviewed' }]) {
    const file = structuredClone(files[1]);
    file.document.data = { atlas: { theaters: [theater] } };
    assert.throws(() => mapAtlasData({ files: [file], bundle }), { code: 'E_ATLAS_SHAPE' });
  }
});
