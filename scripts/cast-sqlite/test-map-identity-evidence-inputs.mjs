import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readMapIdentityEvidenceInputs } from './map-identity-evidence-inputs.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(`CREATE TABLE source_file(source_id INTEGER,logical_path TEXT,sha256 TEXT);
    CREATE TABLE text_document(source_id INTEGER,document_id TEXT,domain TEXT,corpus_kind TEXT,status TEXT);
    CREATE TABLE document_head(source_id INTEGER,revision_id TEXT);
    CREATE TABLE document_revision(source_id INTEGER,revision_id TEXT,parent_revision TEXT,semantic_sha256 TEXT,algorithm TEXT,sequence INTEGER);
    CREATE TABLE document_revision_seal(revision_id TEXT);`);
  const parent = '1e7bcf057b554cf6b52ea50dd5645da515b0513f04a30adcb5f461e3af462474';
  const revision = 'e6068bd3321de8b142db54adb8f92501296cf269b75682191596aa8c349faa4b';
  db.prepare('INSERT INTO source_file VALUES(84,?,?)').run('lore/factions/Sixteen-States.json', '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c');
  db.exec("INSERT INTO text_document VALUES(84,'DOC:Sixteen-States','factions','current','draft')");
  db.prepare('INSERT INTO document_head VALUES(84,?)').run(revision);
  const insert = db.prepare('INSERT INTO document_revision VALUES(84,?,?,?,?,?)');
  insert.run(parent, null, '8d43c418de8b4318240ea066ba0fdf9e75430e2723fbfa272d48653fb352f415', 'typed-envelope-v1', 1);
  insert.run(revision, parent, '79ec7c8b148500dfb835b8b1032f14701525c96041ecb7c0f43274c222338734', 'typed-envelope-v1', 9);
  for (const id of [parent, revision]) db.prepare('INSERT INTO document_revision_seal VALUES(?)').run(id);
  for (const name of ['hegemon', 'member', 'state', 'neutral']) {
    const fields = name === 'member' ? 'hegemon_ordinal INTEGER,ordinal INTEGER,state_id TEXT'
      : name === 'hegemon' ? 'ordinal INTEGER,kind TEXT,state_id TEXT,name TEXT'
        : name === 'state' ? 'ordinal INTEGER,state_id TEXT,current_name TEXT' : 'ordinal INTEGER,state_id TEXT';
    db.exec(`CREATE TABLE text_affiliation_${name}(source_id INTEGER,json_pointer TEXT,${fields});
      CREATE TABLE document_revision_text_affiliation_${name}(revision_id TEXT,source_id INTEGER,json_pointer TEXT,${fields});`);
  }
  return { db, revision };
}

test('exact selected private successor yields incomplete protected evidence without public admission tables', t => {
  // Given: independently specified authored tuple and real SQLite metadata, no public grants.
  const { db, revision } = fixture(t);
  // When: prepare the narrow identity evidence slice.
  const result = readMapIdentityEvidenceInputs(db);
  // Then: no completed provider or public authority is claimed.
  assert.equal(result.source.revision_id, revision);
  assert.equal(result.complete, false);
  assert.equal(result.publicAdmission, 'NOT_GRANTED');
  assert.deepEqual(result.requiredNextAuthority, ['authenticated-person-field-mappings', 'exact-union-source-record-crosswalk']);
});

test('populated successor slices preserve typed order and null union identity and reject member drift', t => {
  // Given: synthetic affiliation rows shaped like the neighboring typed fixture,
  // inserted out of order. No production membership or union crosswalk is claimed.
  const { db, revision } = fixture(t);
  const p = '/data/currentAffiliation';
  const expected = {
    text_affiliation_hegemon: [
      { source_id: 84, json_pointer: `${p}/hegemons/0`, ordinal: 0, kind: 'state', state_id: 'S01', name: 'Fixture state group' },
      { source_id: 84, json_pointer: `${p}/hegemons/1`, ordinal: 1, kind: 'union', state_id: null, name: 'Fixture union' },
    ],
    text_affiliation_member: [
      { source_id: 84, json_pointer: `${p}/hegemons/0/memberStateIds/0`, hegemon_ordinal: 0, ordinal: 0, state_id: 'S01' },
      { source_id: 84, json_pointer: `${p}/hegemons/0/memberStateIds/1`, hegemon_ordinal: 0, ordinal: 1, state_id: 'S03' },
      { source_id: 84, json_pointer: `${p}/hegemons/1/memberStateIds/0`, hegemon_ordinal: 1, ordinal: 0, state_id: 'S02' },
    ],
    text_affiliation_state: [
      { source_id: 84, json_pointer: `${p}/states/0`, ordinal: 0, state_id: 'S01', current_name: 'Fixture one' },
      { source_id: 84, json_pointer: `${p}/states/1`, ordinal: 1, state_id: 'S03', current_name: 'Fixture three' },
      { source_id: 84, json_pointer: `${p}/states/2`, ordinal: 2, state_id: 'S02', current_name: 'Fixture two' },
      { source_id: 84, json_pointer: `${p}/states/3`, ordinal: 3, state_id: 'S16', current_name: 'Fixture neutral' },
    ],
    text_affiliation_neutral: [
      { source_id: 84, json_pointer: `${p}/neutralStateIds/0`, ordinal: 0, state_id: 'S16' },
    ],
  };
  for (const [table, rows] of Object.entries(expected)) {
    for (const row of [...rows].reverse()) {
      const values = Object.values(row), placeholders = values.map(() => '?').join(',');
      db.prepare(`INSERT INTO ${table} VALUES(${placeholders})`).run(...values);
      db.prepare(`INSERT INTO document_revision_${table} VALUES(?,${placeholders})`).run(revision, ...values);
    }
  }
  // When: execute the actual four-table current/sealed projection.
  const result = readMapIdentityEvidenceInputs(db);
  // Then: all selected values, parent/member ordering and explicit null survive.
  const plain = Object.fromEntries(Object.entries(result.affiliation)
    .map(([table, rows]) => [table, rows.map(row => ({ ...row }))]));
  assert.deepEqual(plain, expected);
  assert.equal(result.complete, false);
  assert.equal(result.publicAdmission, 'NOT_GRANTED');
  // A current-only value change must fail the real reader, not a fixture check.
  db.exec("UPDATE text_affiliation_member SET state_id='S04' WHERE hegemon_ordinal=0 AND ordinal=1");
  assert.throws(() => readMapIdentityEvidenceInputs(db), /E_IDENTITY_EVIDENCE: current identity drift/u);
});

for (const [name, sql] of [
  ['unknown current revision', "UPDATE document_head SET revision_id='unknown'"],
  ['missing seal', 'DELETE FROM document_revision_seal'],
  ['wrong source pin', "UPDATE source_file SET sha256='wrong'"],
  ['wrong semantic', "UPDATE document_revision SET semantic_sha256='wrong' WHERE sequence=9"],
  ['wrong algorithm', "UPDATE document_revision SET algorithm='other' WHERE sequence=9"],
  ['old import', 'UPDATE document_revision SET parent_revision=NULL WHERE sequence=9'],
  ['public status as authority', "UPDATE text_document SET status='approved'"],
  ['non-increasing sequence', 'UPDATE document_revision SET sequence=1 WHERE sequence=9'],
  ['current slice drift', "INSERT INTO text_affiliation_neutral VALUES(84,'/data/currentAffiliation/neutralStateIds/0',0,'S01')"],
]) test(`evidence selection rejects ${name}`, t => {
  // Given: a mutated independent tuple, without changing the authored expectation.
  const { db } = fixture(t); db.exec(sql);
  // When / Then: exact private selection fails, with no fallback to old/public authority.
  assert.throws(() => readMapIdentityEvidenceInputs(db), /E_IDENTITY_EVIDENCE/u);
});
