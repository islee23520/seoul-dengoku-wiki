import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { revisionTableDefinition, sealHistoryTable } from './document-structure-authority.mjs';
import { readAffiliationIdentityInputs } from './map-identity-inputs.mjs';

const path = 'lore/factions/Sixteen-States.json';
const rawSha = '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c';
const semanticSha = '9524c36db6daed1e36e4eecf2b4812eca5f60ce9261a5479d851af349d19a068';
const revision = 'a'.repeat(64);
const p = '/data/currentAffiliation';
const tables = ['text_document', 'text_affiliation', 'text_affiliation_hegemon', 'text_affiliation_member', 'text_affiliation_state', 'text_affiliation_neutral'];
const sqlFile = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const definition = (sql, table) => {
  const match = sql.match(new RegExp(`CREATE TABLE ${table} \\([\\s\\S]*?\\) STRICT;`, 'u'));
  assert.ok(match, table);
  return match[0];
};

// Synthetic values deliberately do not claim to be the protected current rows.
// Use the actual relevant DDL, with its constraints and revision transformation,
// but never create map/private tables or read any source archive.
function fixture(t, change = () => {}) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const base = sqlFile('./schema.sql');
  for (const table of ['source_file', 'source_record', 'state']) db.exec(definition(base, table));
  const text = sqlFile('./text-corpus-documents.sql');
  const affiliation = sqlFile('./text-data-geography.sql');
  for (const table of tables) db.exec(definition(table === 'text_document' ? text : affiliation, table));
  db.exec(sqlFile('./excluded-sources.sql'));
  const insert = (table, row) => {
    const names = Object.keys(row);
    db.prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map(() => '?')})`).run(...Object.values(row));
  };
  insert('source_file', { source_id: 84, logical_path: path, media_type: 'application/json', sha256: rawSha, byte_length: 0, raw_bytes: Buffer.alloc(0) });
  const coordinate = json_pointer => insert('source_record', { source_id: 84, json_pointer, ordinal: 0, json_type: 'object' });
  coordinate(''); coordinate('/data'); coordinate(p);
  insert('text_document', { source_id: 84, json_pointer: '', corpus_kind: 'current', version: 1, domain: 'factions', document_id: 'DOC:Sixteen-States',
    slug: 'Sixteen-States', status: 'approved', tense_ko: 'present', tense_en: 'past', source_kind: 'observed', original_anchor: 'fixture', data_pointer: '/data' });
  insert('text_affiliation', { source_id: 84, json_pointer: p });
  for (let i = 0; i < 16; i++) {
    const state_id = `S${String(i + 1).padStart(2, '0')}`;
    insert('state', { state_id, name_ko: `Fixture state ${i + 1}` });
    coordinate(`${p}/states/${i}`);
    insert('text_affiliation_state', { source_id: 84, json_pointer: `${p}/states/${i}`, ordinal: i, state_id, current_name: `Fixture state ${i + 1}`,
      base_kind: 'facility', landmark_id: 'unused-fixture', base_name: 'not read', exclusive_districts: 'none' });
  }
  insert('state', { state_id: 'S00', name_ko: 'unplaced-not-a-neutral-state' });
  const groups = [['state', 'S01', ['S01', 'S03', 'S02']], ['union', null, Array.from({ length: 12 }, (_, i) => `S${String(i + 4).padStart(2, '0')}`)]];
  groups.forEach(([kind, state_id, members], ordinal) => {
    const json_pointer = `${p}/hegemons/${ordinal}`;
    coordinate(json_pointer);
    insert('text_affiliation_hegemon', { source_id: 84, json_pointer, ordinal, kind, state_id, name: `Fixture ${kind}`,
      center_region: 'not read', ai_position: 'not read', color: 'not read' });
    members.forEach((id, i) => {
      const memberPointer = `${json_pointer}/memberStateIds/${i}`;
      coordinate(memberPointer);
      insert('text_affiliation_member', { source_id: 84, json_pointer: memberPointer, hegemon_ordinal: ordinal, ordinal: i, state_id: id });
    });
  });
  coordinate(`${p}/neutralStateIds/0`);
  insert('text_affiliation_neutral', { source_id: 84, json_pointer: `${p}/neutralStateIds/0`, ordinal: 0, state_id: 'S16' });
  change(db);
  db.exec(sqlFile('./document-authority.sql'));
  insert('document_revision', { revision_id: revision, source_id: 84, actor: 'fixture', reason: 'fixture', recorded_at: 'fixture', semantic_sha256: semanticSha, algorithm: 'typed-envelope-v1', sequence: 0 });
  insert('document_head', { source_id: 84, revision_id: revision, public_admission: 'unrecorded' });
  for (const table of tables) {
    db.exec(revisionTableDefinition(definition(table === 'text_document' ? text : affiliation, table), table, tables));
    db.prepare(`INSERT INTO document_revision_${table} SELECT ?,* FROM ${table}`).run(revision);
    sealHistoryTable(db, table);
  }
  insert('document_revision_seal', { revision_id: revision });
  db.exec(sqlFile('./document-admission.sql'));
  insert('document_publication_admission', { source_id: 84, revision_id: revision, source_path: path, source_sha256: rawSha, semantic_sha256: semanticSha,
    classification: 'current-reviewed', reason: 'approved-exact-review', receipt_path: 'fixture-only', receipt_sha256: 'b'.repeat(64), approval_ref: 'fixture-only', recorded_at: 'fixture' });
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  return db;
}

function read(db) {
  db.exec('PRAGMA query_only=ON; BEGIN');
  try {
    return readAffiliationIdentityInputs({ prepare(sql) {
      assert.match(sql, /^SELECT\s/u);
      assert.doesNotMatch(sql, /\*|\b(?:raw_bytes|source_record|center_region|ai_position|color|base_kind|base_name|station_id|landmark_id|exclusive_districts|person|public_route)\b/iu);
      for (const [, table] of sql.matchAll(/\b(?:FROM|JOIN)\s+(\w+)/gu)) {
        assert.ok(['source_file', 'text_document', 'document_head', 'document_revision', 'document_revision_seal', 'document_publication_admission', 'excluded_source', 'state',
          ...tables.filter(t => t !== 'text_document'), ...tables.map(t => `document_revision_${t}`)].includes(table), table);
      }
      return db.prepare(sql);
    } });
  } finally { db.exec('ROLLBACK; PRAGMA query_only=OFF'); }
}

test('admitted identity-only slice works without map/private tables and preserves source order, known, neutral and unresolved meaning', t => {
  const db = fixture(t);
  const result = read(db);
  assert.equal(result.source.revision_id, revision);
  assert.equal(result.source.semantic_sha256, semanticSha);
  assert.equal(result.verification, 'trusted-snapshot/sealed-admitted-revision-projection');
  assert.deepEqual(result.hegemons[0].memberStateIds, ['S01', 'S03', 'S02']);
  assert.equal(result.states[0].affiliation.stateId, 'S01');
  assert.equal(result.states[0].affiliation.membershipStatus, 'known');
  assert.deepEqual(result.states[15].affiliation, { membershipStatus: 'neutral', hegemonRef: null });
  assert.equal(result.states[3].affiliation.membershipStatus, 'unresolved-source-binding');
  assert.equal(Object.hasOwn(result.hegemons[1], 'id'), false);
  assert.doesNotMatch(JSON.stringify(result), /union:religious|not read|S00|public_route/u);
  assert.deepEqual(read(db), result);
});

test('exactly admitted draft remains supported rather than using status as approval', t => {
  const db = fixture(t, db => db.exec("UPDATE text_document SET status='draft'"));
  assert.equal(read(db).source.status, 'draft');
});

test('current identity drift is rejected even with an unchanged head and seal', t => {
  const db = fixture(t);
  db.exec("UPDATE text_affiliation_state SET current_name='changed' WHERE ordinal=0");
  assert.throws(() => read(db), /current identity drift/u);
});

test('changed head cannot fall back to the old admitted revision', t => {
  const db = fixture(t);
  db.prepare(`INSERT INTO document_revision VALUES(?,84,?,'fixture','fixture','fixture',?,'typed-envelope-v1',1)`).run('c'.repeat(64), revision, semanticSha);
  db.prepare('UPDATE document_head SET revision_id=?').run('c'.repeat(64));
  assert.throws(() => read(db), /missing exact current sealed admission/u);
});

for (const [label, sql] of [
  ['excluded source', `INSERT INTO excluded_source VALUES('${path}','${rawSha}',0,'private-editorial-sample')`],
  ['historical corpus', "UPDATE text_document SET corpus_kind='historical'"],
  ['wrong document', "UPDATE text_document SET document_id='other'"],
  ['wrong domain', "UPDATE text_document SET domain='other'"],
  ['excluded status', "UPDATE text_document SET status='excluded'"],
  ['missing seal', 'DROP TRIGGER document_revision_seal_no_delete; DELETE FROM document_revision_seal'],
  ['wrong admission source', "DROP TRIGGER document_publication_admission_no_update; UPDATE document_publication_admission SET source_path='other'"],
  ['missing admission', 'DROP TRIGGER document_publication_admission_no_delete; DELETE FROM document_publication_admission'],
]) test(`rejects ${label}`, t => {
  const db = fixture(t);
  db.exec(sql);
  assert.throws(() => read(db), /missing exact current sealed admission/u);
});

for (const [label, sql, error] of [
  ['unknown member', "UPDATE text_affiliation_member SET state_id='S00' WHERE hegemon_ordinal=0 AND ordinal=1", /unknown\/duplicate membership/u],
  ['duplicate membership', "UPDATE text_affiliation_member SET state_id='S01' WHERE hegemon_ordinal=0 AND ordinal=1", /unknown\/duplicate membership/u],
  ['missing member', 'DELETE FROM text_affiliation_member WHERE hegemon_ordinal=0 AND ordinal=2', /affiliation coverage/u],
  ['ordinal gap', 'UPDATE text_affiliation_member SET ordinal=20 WHERE hegemon_ordinal=0 AND ordinal=2', /source order\/pointer/u],
  ['pointer mismatch', `UPDATE text_affiliation_hegemon SET json_pointer='${p}/states/0' WHERE ordinal=0`, /source order\/pointer/u],
  ['wrong label', "UPDATE text_affiliation_state SET current_name='wrong' WHERE ordinal=0", /state identity\/name/u],
  ['missing state', 'DELETE FROM text_affiliation_state WHERE ordinal=15', /affiliation coverage/u],
]) test(`rejects internally matching sealed/current ${label}`, t => {
  const db = fixture(t, db => db.exec(sql));
  assert.throws(() => read(db), error);
});

test('caller summaries cannot self-approve union crosswalks or person display mappings', t => {
  const db = fixture(t);
  const result = readAffiliationIdentityInputs(db, { unionCrosswalk: { id: 'union:religious', approved: true }, personMappings: { approved: true } });
  assert.equal(result.hegemons[1].resolution, 'unresolved-source-binding');
  assert.equal(Object.hasOwn(result, 'persons'), false);
  assert.doesNotMatch(JSON.stringify(result), /union:religious/u);
});
