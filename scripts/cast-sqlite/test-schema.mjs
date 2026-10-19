import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { APPLICATION_ID, SCHEMA_VERSION, applySchema, openReadOnly, openWritableNew, runIntegrityChecks, withTransaction } from './db.mjs';
import { FAMILY_TABLE_COLUMNS } from './current-family.mjs';
import { ENGINE_TABLE_COLUMNS } from './current-engine.mjs';
import { CONTEXT_TABLE_COLUMNS } from './current-context.mjs';
import { INDEX_TABLE_COLUMNS } from './current-index.mjs';
import { HISTORICAL_CONTEXT_TABLE_COLUMNS } from './historical-context.mjs';
import { IDENTITY_PROVENANCE_TABLE_COLUMNS } from './current-identity-provenance.mjs';
import { SOURCE_CLOSURE_TABLE_COLUMNS } from './source-closure.mjs';
import { EXCLUDED_SOURCE_TABLE_COLUMNS } from './excluded-sources.mjs';
import { TEXT_CORPUS_TABLE_COLUMNS } from './text-corpus.mjs';

const evidenceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.omo/evidence/sqlite');
const tableNames = ['build_metadata', 'source_file', 'source_record', 'state', 'state_label', 'person', 'person_alias', 'value_axis', 'person_value', 'desire_axis', 'person_desire', 'person_gender', 'clan', 'clan_source', 'clan_hangnyeol_row', 'person_lineage', 'person_lineage_source_clan', 'lineage_node', 'lineage_parent', 'lineage_founder_sesu', 'lineage_clan_assignment', 'profile', 'profile_node', 'profile_field', 'relation_type', 'relation', 'gurps_profile', 'gurps_attribute', 'gurps_secondary', 'gurps_trait', 'gurps_trait_application_boundary', 'gurps_skill', 'gurps_language', 'gurps_advantage', 'gurps_disadvantage', 'gurps_territory', 'gurps_unit', 'gurps_unit_composition', 'gurps_wandering_force', 'gurps_wandering_facility', 'evidence', 'source_check_run', 'source_check_issue', 'quality_issue', ...Object.keys(FAMILY_TABLE_COLUMNS), ...Object.keys(ENGINE_TABLE_COLUMNS), ...Object.keys(CONTEXT_TABLE_COLUMNS), ...Object.keys(INDEX_TABLE_COLUMNS), ...Object.keys(HISTORICAL_CONTEXT_TABLE_COLUMNS), ...Object.keys(IDENTITY_PROVENANCE_TABLE_COLUMNS), ...Object.keys(SOURCE_CLOSURE_TABLE_COLUMNS), ...Object.keys(EXCLUDED_SOURCE_TABLE_COLUMNS), ...Object.keys(TEXT_CORPUS_TABLE_COLUMNS)];
function fixture(t) {
  mkdirSync(evidenceRoot, { recursive: true });
  const directory = mkdtempSync(join(evidenceRoot, 'task-1-temp-'));
  const path = join(directory, 'cast.sqlite');
  let db;
  t.after(() => {
    if (db?.isOpen) db.close();
    const resolved = resolve(directory);
    assert.ok(resolved.startsWith(evidenceRoot + sep));
    rmSync(resolved, { recursive: true });
  });
  db = openWritableNew(path);
  applySchema(db);
  return { path, directory, get db() { return db; }, reopen() { db.close(); db = openReadOnly(path); return db; } };
}
function addPerson(db, id = 'K001', ordinal = 1) {
  db.prepare('INSERT INTO person (person_id,name,publication_ordinal,public_key,public_route,values_source_ordinal,minors) VALUES (?,?,?,?,?,?,?)')
    .run(id, `인물 ${id}`, ordinal, `person-${String(ordinal).padStart(4,'0')}`, `/people/person-${String(ordinal).padStart(4,'0')}`, ordinal - 1, 0);
}
function addSource(db) {
  const raw = Buffer.from('{}');
  db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(1, 'fixture.json', 'application/json', createHash('sha256').update(raw).digest('hex'), raw.length, raw);
  db.prepare('INSERT INTO source_record VALUES (?,?,?,?,?,?,?,?,?,?)').run(1, '', null, 0, null, 'object', null, null, null, null);
}

test('creates every STRICT table with required indexes and connection pragmas', (t) => {
  const { db } = fixture(t);
  assert.equal(SCHEMA_VERSION, 4);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  assert.equal(db.prepare('PRAGMA application_id').get().application_id, APPLICATION_ID);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'delete');
  const tables = db.prepare('PRAGMA table_list').all().filter((row) => !row.name.startsWith('sqlite_'));
  assert.deepEqual(tables.map((row) => row.name).sort(), [...tableNames].sort());
  assert.ok(tables.every((row) => row.strict === 1));
  for (const name of ['person_state_idx','profile_person_primary_idx','profile_field_key_idx','relation_from_idx','relation_to_idx','evidence_person_subject_idx','quality_issue_dataset_idx']) {
    assert.ok(db.prepare("SELECT name FROM sqlite_schema WHERE type='index' AND name=?").get(name), name);
  }
  assert.deepEqual(runIntegrityChecks(db), { integrity_check: 'ok', foreign_key_violations: 0 });
});

test('rejects orphan rows and invalid boolean, scalar and bounded value types', (t) => {
  const { db } = fixture(t);
  assert.throws(() => db.prepare('INSERT INTO person_alias VALUES (?,?,?)').run('K999','고아',0), /FOREIGN KEY/);
  addPerson(db);
  assert.throws(() => db.prepare('UPDATE person SET minors=2').run(), /CHECK/);
  assert.throws(() => db.prepare('UPDATE person SET locked=7').run(), /CHECK/);
  assert.throws(() => db.prepare("UPDATE person SET minors='wrong'").run(), /cannot store TEXT/);
  assert.throws(() => db.prepare('UPDATE person SET publication_ordinal=1.5').run(), /cannot store REAL/);
  db.prepare('INSERT INTO value_axis VALUES (?,?)').run('권위',0);
  assert.throws(() => db.prepare('INSERT INTO person_value VALUES (?,?,?)').run('K001','권위',101), /CHECK/);
  db.prepare('INSERT INTO person_value VALUES (?,?,?)').run('K001','권위',-100);
});

test('preserves optional source fields without invented boolean and lineage defaults', (t) => {
  const { db } = fixture(t);
  addPerson(db);
  assert.equal(db.prepare('SELECT locked FROM person').get().locked, null);
  db.prepare('INSERT INTO person_lineage (person_id,surname,status,position,sesu) VALUES (?,?,?,?,?)').run('K001','한','free','second',null);
  assert.deepEqual({ ...db.prepare('SELECT position,sesu,bongwan_hanja FROM person_lineage').get() }, { position:'second', sesu:null, bongwan_hanja:null });
});

test('source records enforce JSON scalar representation and parent provenance', (t) => {
  const { db } = fixture(t);
  addSource(db);
  const insert = db.prepare('INSERT INTO source_record VALUES (?,?,?,?,?,?,?,?,?,?)');
  insert.run(1,'/empty','',0,'empty','text','',null,null,null);
  insert.run(1,'/null','',1,'null','null',null,null,null,null);
  insert.run(1,'/boolean','',2,'boolean','boolean',null,null,null,0);
  insert.run(1,'/integer','',3,'integer','integer',null,7,null,null);
  insert.run(1,'/real','',4,'real','real',null,null,1.25,null);
  assert.throws(() => insert.run(1,'/bad','',5,'bad','text',null,1,null,null), /CHECK/);
  assert.throws(() => insert.run(1,'/bad','',5,'bad','null','',null,null,null), /CHECK/);
  assert.throws(() => insert.run(1,'/bad','',5,'bad','boolean',null,null,null,2), /CHECK/);
  assert.throws(() => insert.run(1,'/missing/child','/missing',5,'child','null',null,null,null,null), /FOREIGN KEY/);
  assert.throws(() => db.prepare("UPDATE source_file SET byte_length=999").run(), /CHECK/);
});

test('desire values agree with numeric and qualitative axis kinds', (t) => {
  const { db } = fixture(t);
  addPerson(db);
  db.prepare('INSERT INTO desire_axis VALUES (?,?,?)').run('갈망',0,'integer');
  db.prepare('INSERT INTO desire_axis VALUES (?,?,?)').run('지향',1,'text');
  const insert = db.prepare('INSERT INTO person_desire (person_id,axis_name,value_kind,integer_value,text_value) VALUES (?,?,?,?,?)');
  insert.run('K001','갈망','integer',20,null);
  insert.run('K001','지향','text',null,'');
  db.prepare("UPDATE person_desire SET text_value=NULL WHERE axis_name='지향'").run();
  assert.equal(db.prepare("SELECT text_value FROM person_desire WHERE axis_name='지향'").get().text_value,null);
  assert.throws(() => db.prepare("UPDATE person_desire SET value_kind='text', integer_value=NULL,text_value='bad' WHERE axis_name='갈망'").run(), /FOREIGN KEY/);
  assert.throws(() => db.prepare("UPDATE person_desire SET text_value='bad' WHERE axis_name='갈망'").run(), /CHECK/);
});

test('composite state-label parent key rejects mismatched case and missing pairs', (t) => {
  const { db } = fixture(t);
  db.prepare('INSERT INTO state VALUES (?,?)').run('S01', null);
  db.prepare('INSERT INTO state_label VALUES (?,?)').run('S01', '서울');
  addPerson(db);
  db.prepare('UPDATE person SET state_id=?,state_name=? WHERE person_id=?').run('S01', '서울', 'K001');
  assert.throws(() => db.prepare('UPDATE person SET state_name=? WHERE person_id=?').run('서울 ', 'K001'), /FOREIGN KEY/);
  assert.throws(() => db.prepare('UPDATE person SET state_name=? WHERE person_id=?').run('seoul', 'K001'), /FOREIGN KEY/);
  assert.deepEqual(runIntegrityChecks(db), { integrity_check: 'ok', foreign_key_violations: 0 });
});

test('rejects duplicate primary profile and source row identities', (t) => {
  const { db } = fixture(t);
  addPerson(db); addSource(db);
  const insert = db.prepare('INSERT INTO profile (profile_id,person_id,source_id,heading_pointer,source_kind,source_ordinal,heading_depth,node_start,node_end,is_primary) VALUES (?,?,?,?,?,?,?,?,?,?)');
  insert.run('profile-1','K001',1,'','core',0,2,0,1,1);
  assert.throws(() => insert.run('profile-2','K001',1,'','state',1,3,0,1,1), /UNIQUE/);
  insert.run('profile-2','K001',1,'','state',1,3,0,1,0);
  assert.throws(() => insert.run('profile-3','K001',1,'','state',1,3,0,1,0), /UNIQUE/);
});

test('readOnly rejects INSERT and preserves bytes with foreign keys enabled', (t) => {
  const f = fixture(t);
  addPerson(f.db);
  f.db.close();
  const before = readFileSync(f.path);
  const beforeMtime = statSync(f.path).mtimeMs;
  const db = openReadOnly(f.path);
  try {
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.equal(db.prepare('PRAGMA query_only').get().query_only, 1);
    assert.equal(db.prepare('PRAGMA application_id').get().application_id, APPLICATION_ID);
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
    assert.throws(() => db.prepare('INSERT INTO build_metadata VALUES (?,?)').run('key','value'), /readonly|read-only/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n, 1);
    assert.deepEqual(runIntegrityChecks(db), { integrity_check: 'ok', foreign_key_violations: 0 });
  } finally { db.close(); }
  assert.deepEqual(readFileSync(f.path), before);
  assert.equal(statSync(f.path).mtimeMs, beforeMtime);
  assert.deepEqual(readdirSync(f.directory), ['cast.sqlite']);
});

test('existing output is never clobbered or accepted for writable access', (t) => {
  const f = fixture(t);
  f.db.close();
  const before = readFileSync(f.path);
  assert.throws(() => openWritableNew(f.path), { code: 'E_OUTPUT_EXISTS' });
  assert.deepEqual(readFileSync(f.path), before);
  const sentinel = join(f.directory,'sentinel.sqlite');
  writeFileSync(sentinel,'keep these bytes');
  assert.throws(() => openWritableNew(sentinel), { code: 'E_OUTPUT_EXISTS' });
  assert.equal(readFileSync(sentinel,'utf8'),'keep these bytes');
});

test('transaction commits success and rolls back all rows after failure', (t) => {
  const { db } = fixture(t);
  const value = withTransaction(db, () => { addPerson(db); return 'committed'; });
  assert.equal(value,'committed');
  const failure = new Error('injected failure');
  assert.throws(() => withTransaction(db, () => { addPerson(db,'K002',2); throw failure; }), (error) => error === failure);
  assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n,1);
  assert.equal(db.isTransaction,false);
  assert.deepEqual(runIntegrityChecks(db), { integrity_check: 'ok', foreign_key_violations: 0 });
});

test('transaction rejects async and nested callbacks without losing outer state', (t) => {
  const { db } = fixture(t);
  assert.throws(() => withTransaction(db, () => Promise.resolve()), { code:'E_TRANSACTION_ASYNC' });
  assert.equal(db.isTransaction,false);
  withTransaction(db, () => {
    addPerson(db);
    assert.throws(() => withTransaction(db, () => addPerson(db,'K002',2)), { code:'E_TRANSACTION_ACTIVE' });
  });
  assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n,1);
});

test('a concurrent writer cannot enter an active immediate transaction', (t) => {
  const f = fixture(t);
  const second = new DatabaseSync(f.path);
  try {
    second.exec('PRAGMA busy_timeout=1');
    f.db.exec('BEGIN IMMEDIATE');
    assert.throws(() => withTransaction(second, () => addPerson(second)), /database is locked/);
    assert.equal(second.isTransaction, false);
    f.db.exec('ROLLBACK');
    withTransaction(second, () => addPerson(second));
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM person').get().n, 1);
  } finally {
    if (f.db.isTransaction) f.db.exec('ROLLBACK');
    second.close();
  }
});

test('refuses incompatible versions and foreign application IDs without changes', (t) => {
  const f = fixture(t);
  f.db.exec('PRAGMA user_version=999');
  f.db.close();
  const before = readFileSync(f.path);
  assert.throws(() => openReadOnly(f.path), { code:'E_SCHEMA_VERSION' });
  assert.deepEqual(readFileSync(f.path),before);
  const raw = new DatabaseSync(f.path);
  raw.exec(`PRAGMA user_version=${SCHEMA_VERSION}; PRAGMA application_id=123`);
  raw.close();
  assert.throws(() => openReadOnly(f.path), { code:'E_APPLICATION_ID' });
});

test('applySchema never drops or migrates an already initialized database', (t) => {
  const { db } = fixture(t);
  addPerson(db);
  assert.throws(() => applySchema(db), { code:'E_SCHEMA_EXISTS' });
  assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n,1);
});

test('detects foreign key corruption and truncated database files', (t) => {
  const f = fixture(t);
  f.db.exec("PRAGMA foreign_keys=OFF; INSERT INTO person_alias VALUES ('K999','고아',0); PRAGMA foreign_keys=ON");
  assert.throws(() => runIntegrityChecks(f.db), { code:'E_DB_INTEGRITY' });
  f.db.close();
  const corruptPath = join(f.directory,'truncated.sqlite');
  writeFileSync(corruptPath, readFileSync(f.path).subarray(0,200));
  assert.throws(() => openReadOnly(corruptPath), { code:'E_DB_INTEGRITY' });
  assert.throws(() => openReadOnly(join(f.directory,'missing.sqlite')), { code:'E_DB_OPEN' });
  assert.deepEqual(readdirSync(f.directory).sort(),['cast.sqlite','truncated.sqlite']);
});


test('lineage reference names preserve unregistered ancestors without adding people', (t) => {
  const { db } = fixture(t);
  addPerson(db);
  db.prepare('INSERT INTO lineage_node VALUES (?,?)').run('등록 인물','K001');
  db.prepare('INSERT INTO lineage_node VALUES (?,?)').run('기록 속 조상',null);
  db.prepare('INSERT INTO lineage_parent VALUES (?,?)').run('등록 인물','기록 속 조상');
  db.prepare('INSERT INTO lineage_founder_sesu VALUES (?,?)').run('기록 속 조상',40);
  assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n,1);
  assert.equal(db.prepare('SELECT person_id FROM lineage_node WHERE name=?').get('기록 속 조상').person_id,null);
  assert.throws(() => db.prepare('INSERT INTO lineage_parent VALUES (?,?)').run('등록 인물','없는 이름'), /FOREIGN KEY/);
  assert.deepEqual(runIntegrityChecks(db), { integrity_check:'ok', foreign_key_violations:0 });
});

test('one outer transaction can include schema and all data, including deferred clan links', (t) => {
  const f = fixture(t);
  const path = join(f.directory,'outer.sqlite');
  const db = openWritableNew(path);
  try {
    withTransaction(db, () => {
      applySchema(db);
      addPerson(db);
      db.prepare('INSERT INTO clan (clan_id,base_clan_id) VALUES (?,?)').run('branch','root');
      db.prepare('INSERT INTO clan (clan_id,base_clan_id) VALUES (?,?)').run('root',null);
    });
    assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n,1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan').get().n,2);
    assert.throws(() => withTransaction(db, () => db.prepare('INSERT INTO clan (clan_id,base_clan_id) VALUES (?,?)').run('invalid','missing')), /FOREIGN KEY/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan').get().n,2);
    assert.equal(db.isTransaction,false);
  } finally { db.close(); }
  const reopened = openReadOnly(path);
  try { assert.deepEqual(runIntegrityChecks(reopened), { integrity_check:'ok', foreign_key_violations:0 }); }
  finally { reopened.close(); }
});


test('preserves multiple state labels without choosing an invented canonical name', (t) => {
  const { db } = fixture(t);
  db.prepare('INSERT INTO state VALUES (?,?)').run('S00',null);
  db.prepare('INSERT INTO state_label VALUES (?,?)').run('S00','무소속');
  db.prepare('INSERT INTO state_label VALUES (?,?)').run('S00','이주민 회랑');
  addPerson(db);
  db.prepare('UPDATE person SET state_id=?,state_name=?').run('S00','이주민 회랑');
  assert.equal(db.prepare('SELECT name_ko FROM state').get().name_ko,null);
  assert.equal(db.prepare('SELECT state_name FROM person').get().state_name,'이주민 회랑');
  assert.equal(db.prepare('SELECT count(*) AS n FROM state_label').get().n,2);
  assert.throws(() => db.prepare('UPDATE person SET state_name=?').run('만든 이름'), /FOREIGN KEY/);
});

test('accepts source-defined external polity identifiers without assigning Seoul rights', (t) => {
  const { db } = fixture(t);
  db.prepare('INSERT INTO state (state_id,name_ko) VALUES (?,?)').run('polity:daejeon', '대전');
  assert.equal(db.prepare('SELECT name_ko FROM state WHERE state_id=?').get('polity:daejeon').name_ko, '대전');
  assert.throws(() => db.prepare('INSERT INTO state (state_id,name_ko) VALUES (?,?)').run(' ', '공백'));
});

test('preserves per-row English relation variants and untranslated unused types', (t) => {
  const { db } = fixture(t);
  addPerson(db); addPerson(db,'K002',2); addSource(db);
  db.prepare('INSERT INTO relation_type VALUES (?,?,?)').run('친족','kin',0);
  db.prepare('INSERT INTO relation_type VALUES (?,?,?)').run('양자',null,1);
  db.prepare('INSERT INTO relation (relation_id,source_id,row_ordinal,from_person_id,to_person_id,type_ko,type_en,grounds_ko,grounds_en,json_pointer) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run('relation-0001',1,0,'K001','K002','친족','kinship','','','');
  assert.equal(db.prepare('SELECT type_en FROM relation').get().type_en,'kinship');
  assert.equal(db.prepare("SELECT type_en FROM relation_type WHERE type_ko='양자'").get().type_en,null);
  assert.deepEqual(runIntegrityChecks(db), { integrity_check:'ok', foreign_key_violations:0 });
});


test('preserves clan metadata and ordered source and hangnyeol rows with nullable hanja', (t) => {
  const { db } = fixture(t);
  db.prepare('INSERT INTO clan (clan_id,base_clan_id,surname,bongwan,bongwan_hanja,branch,provenance,hangnyeol_unconfirmed_reason) VALUES (?,?,?,?,?,?,?,?)')
    .run('clan-1',null,'성','창녕',null,'열차정비분파','creative',null);
  const source = db.prepare('INSERT INTO clan_source VALUES (?,?,?)');
  source.run('clan-1',0,'source-first');
  source.run('clan-1',1,'source-second');
  const row = db.prepare('INSERT INTO clan_hangnyeol_row VALUES (?,?,?,?,?,?)');
  row.run('clan-1',0,42,'현',null,'second');
  row.run('clan-1',1,43,'섭','燮','first');
  assert.equal(db.prepare('SELECT surname FROM clan').get().surname,'성');
  assert.equal(db.prepare('SELECT bongwan_hanja FROM clan').get().bongwan_hanja,null);
  assert.deepEqual(db.prepare('SELECT source_ref FROM clan_source ORDER BY ordinal').all().map(r=>r.source_ref),['source-first','source-second']);
  assert.deepEqual(db.prepare('SELECT hanja FROM clan_hangnyeol_row ORDER BY ordinal').all().map(r=>r.hanja),[null,'燮']);
  assert.throws(() => source.run('missing-clan',0,'source'), /FOREIGN KEY/);
  assert.throws(() => row.run('missing-clan',0,1,'현',null,'second'), /FOREIGN KEY/);
  assert.throws(() => row.run('clan-1',1,44,'현',null,'second'), /UNIQUE/);
  assert.throws(() => row.run('clan-1',2,1.5,'현',null,'second'), /cannot store REAL/);
  assert.throws(() => source.run('clan-1',-1,'source'), /CHECK/);
  assert.deepEqual(runIntegrityChecks(db), { integrity_check:'ok', foreign_key_violations:0 });
});
