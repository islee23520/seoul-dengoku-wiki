import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { flattenJson, sha256 } from './sources.mjs';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { GEOGRAPHY_TABLE_COLUMNS, mapGeographyData, reconstructGeographyData } from './text-data-geography.mjs';

const keys = ['currentAffiliation', 'governance', 'territorialScale', 'station_aliases'];
const relevant = (data) => Object.fromEntries(Object.entries(data).filter(([key]) => keys.includes(key)));
const files = TEXT_DOCUMENT_MANIFEST.map((entry, index) => {
  const bytes = readFileSync(new URL('../../' + entry.logical_path, import.meta.url));
  return { ...entry, source_id: index + 1, sha256: sha256(bytes), bytes, document: JSON.parse(bytes), content_policy: 'local-corpus' };
}).filter((file) => Object.keys(relevant(file.document.data)).length);

function insert(db, table, columns, rows) {
  const statement = db.prepare('INSERT INTO ' + table + ' (' + columns + ') VALUES (' + columns.map(() => '?') + ')');
  for (const row of rows) statement.run(...columns.map((column) => row[column]));
}

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  for (const path of ['schema.sql', 'text-corpus-documents.sql', 'text-data-geography.sql']) db.exec(readFileSync(new URL('./' + path, import.meta.url), 'utf8'));
  db.exec('BEGIN');
  for (let i = 1; i <= 16; i++) db.prepare('INSERT INTO state(state_id) VALUES (?)').run('S' + String(i).padStart(2, '0'));
  for (const file of files) {
    const { source_id, document: d, bytes } = file;
    insert(db, 'source_file', ['source_id', 'logical_path', 'media_type', 'sha256', 'byte_length', 'raw_bytes'], [{ ...file, media_type: 'application/json', byte_length: bytes.length, raw_bytes: bytes }]);
    const records = flattenJson(d).map((record) => ({ source_id, ...record }));
    insert(db, 'source_record', Object.keys(records[0]), records);
    // The geography contract depends on the real document envelope and provenance,
    // not on unrelated content rendering or its link resolver.
    const envelope = { source_id, json_pointer: '', corpus_kind: file.corpus_kind, version: d.version, domain: d.domain, document_id: d.id,
      slug: d.slug, status: d.status, tense_ko: d.tense.ko, tense_en: d.tense.en, source_kind: d.source.kind, source_hash: d.source.hash ?? null,
      original_anchor: d.provenance.original_anchor, original_hash: d.provenance.original_hash, data_pointer: '/data' };
    insert(db, 'text_document', Object.keys(envelope), [envelope]);
  }
  db.exec('COMMIT');
  return db;
}

test('every actual geography payload roundtrips exactly with deterministic frozen relational rows', () => {
  assert.deepEqual(files.map((file) => file.logical_path).sort(), [
    'lore/factions/Sixteen-States.json', 'lore/factions/authoring.example.json',
    'lore/offices/Offices-and-Ranks.json', 'lore/places/Seoul-Station-Catalog.json',
  ]);
  const before = files.map((file) => ({ ...structuredClone(file), bytes: Buffer.from(file.bytes) }));
  const tables = mapGeographyData({ files, bundle: { files } });
  assert.deepEqual(tables, mapGeographyData({ bundle: { files: [...files].reverse() } }));
  assert.deepEqual(files, before);
  for (const file of files) assert.deepEqual(reconstructGeographyData({ tables, source_id: file.source_id }), relevant(file.document.data));
  assert.deepEqual(reconstructGeographyData({ tables, source_id: -1 }), {});
  assert.ok(Object.isFrozen(tables));
  for (const [table, rows] of Object.entries(tables)) {
    assert.ok(Object.isFrozen(rows));
    for (const row of rows) {
      assert.ok(Object.isFrozen(row));
      assert.deepEqual(Object.keys(row).sort(), [...GEOGRAPHY_TABLE_COLUMNS[table]].sort());
    }
  }
  assert.equal(tables.text_affiliation_hegemon.length, 3);
  assert.equal(tables.text_affiliation_member.length, 15);
  assert.equal(tables.text_affiliation_state.length, 16);
  assert.equal(tables.text_station.length, 19);
  assert.equal(tables.text_station_alias.length, 20);
});

test('SQLite rows roundtrip all actual documents and enforce provenance, state and parent FKs', () => {
  const db = database();
  try {
    const mapped = mapGeographyData({ files });
    for (const [table, columns] of Object.entries(GEOGRAPHY_TABLE_COLUMNS)) {
      assert.deepEqual(db.prepare('PRAGMA table_info(' + table + ')').all().map((row) => row.name).sort(), [...columns].sort());
      insert(db, table, columns, mapped[table]);
    }
    const tables = Object.fromEntries(Object.keys(GEOGRAPHY_TABLE_COLUMNS).map((table) => [table, db.prepare('SELECT * FROM ' + table + ' ORDER BY json_pointer DESC').all()]));
    for (const file of files) assert.deepEqual(reconstructGeographyData({ tables, source_id: file.source_id }), relevant(file.document.data));
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    for (const sql of [
      "UPDATE text_affiliation_state SET state_id='missing' WHERE ordinal=0",
      "UPDATE text_affiliation_member SET hegemon_ordinal=999 WHERE ordinal=0",
      "UPDATE text_station_alias SET station_ordinal=999 WHERE ordinal=0",
      "UPDATE text_station_line SET name_ordinal=999 WHERE ordinal=0",
      "UPDATE text_governance SET source_id=999999",
      "UPDATE text_station SET json_pointer='/missing' WHERE ordinal=0",
      "UPDATE text_territorial SET scale_implies_title_rank=2",
      "UPDATE text_territorial_parent SET political_liege_inference=2",
      "UPDATE text_territorial_slot_edition SET current_boundary_certification=0 WHERE edition_kind='currentCorrespondence'",
      "UPDATE text_territorial_slot_edition SET base_date=NULL WHERE edition_kind='dated'",
      "UPDATE text_territorial_level SET count=1 WHERE level='barony'",
      "UPDATE text_territorial_level SET partition_sha256=NULL WHERE level='kingdom'",
      "UPDATE text_territorial_political_axis SET current_centers='three'",
    ]) assert.throws(() => db.exec(sql), undefined, sql);
    assert.throws(() => db.exec('DELETE FROM source_file'));
    assert.throws(() => db.exec('DELETE FROM text_document'));
    for (const table of Object.keys(GEOGRAPHY_TABLE_COLUMNS)) assert.equal(db.prepare('PRAGMA table_list').all().find((row) => row.name === table).strict, 1);
    const hashes = db.prepare('SELECT DISTINCT s.source_id,s.sha256 FROM source_file s JOIN text_document d USING(source_id)').all();
    for (const hash of hashes) assert.equal(hash.sha256, files.find((file) => file.source_id === hash.source_id).sha256);
    assert.deepEqual(db.prepare('SELECT edition_kind,count,geometry_verified,current_boundary_certification FROM text_territorial_slot_edition ORDER BY edition_kind').all().map((row) => ({ ...row })), [
      { edition_kind: 'currentCorrespondence', count: 427, geometry_verified: 0, current_boundary_certification: null },
      { edition_kind: 'dated', count: 426, geometry_verified: 1, current_boundary_certification: 0 },
    ]);
    const territorial = files.find((file) => file.document.data.territorialScale);
    const restored = reconstructGeographyData({ tables, source_id: territorial.source_id }).territorialScale;
    assert.equal(restored.geographicParent.politicalLiegeInference, false);
    assert.equal(restored.politicalAxis.geographicKingdomEquivalence, false);
    assert.equal(Object.hasOwn(restored.slotEditions.currentCorrespondence, 'currentBoundaryCertification'), false);
    assert.equal(Object.hasOwn(restored.levels.barony, 'count'), false);
    console.log('Geography counts:', Object.fromEntries(Object.entries(mapped).map(([table, rows]) => [table, rows.length])));
  } finally { db.close(); }
});

test('empty collections, optional service maps, pointer escaping and unrelated keys remain distinct', () => {
  const data = { currentAffiliation: { hegemons: [], states: [], neutralStateIds: [] }, governance: '', unrelated: 'not mapped',
    station_aliases: [{ id: 'station', aliases: [], observed_lines: { 'a/b~c': [] }, service_lines: {}, source: '' }] };
  const tables = mapGeographyData({ files: [{ source_id: 1, document: { data } }] });
  assert.deepEqual(reconstructGeographyData({ tables, source_id: 1 }), relevant(data));
  assert.equal(tables.text_station_line_name[0].json_pointer, '/data/station_aliases/0/observed_lines/a~1b~0c');
  assert.deepEqual(mapGeographyData({ files: [{ source_id: 2, document: { data: {} } }] }).text_governance, []);
  assert.throws(() => mapGeographyData({ files: null }), { code: 'E_TEXT_GEOGRAPHY_SHAPE' });
  assert.throws(() => mapGeographyData({ files: [{ source_id: 1, document: { data: { governance: {} } } }] }), { code: 'E_TEXT_GEOGRAPHY_SHAPE' });
  const unknown = structuredClone(files.find((file) => file.document.data.territorialScale));
  unknown.document.data.territorialScale.inventedRight = true;
  assert.throws(() => mapGeographyData({ files: [unknown] }), { code: 'E_TEXT_GEOGRAPHY_SHAPE' });
});

test('current geography rejects unknown nested fields and scalar coercion', () => {
  const original = files.find((file) => file.document.data.territorialScale);
  for (const mutate of [
    (t) => { t.levels.county.count = '48'; },
    (t) => { t.levels.kingdom.partitionSha256 = null; },
    (t) => { t.slotEditions.currentCorrespondence.currentBoundaryCertification = false; },
    (t) => { t.slotEditions.dated.geometryVerified = 1; },
    (t) => { t.geographicParent.inventedRight = true; },
    (t) => { t.politicalAxis.currentCenters = '3'; },
  ]) {
    const file = structuredClone(original);
    mutate(file.document.data.territorialScale);
    assert.throws(() => mapGeographyData({ files: [file] }), { code: 'E_TEXT_GEOGRAPHY_SHAPE' });
  }
});
