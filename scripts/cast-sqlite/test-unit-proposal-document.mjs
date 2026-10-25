import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { readFile, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { readSourceArchive } from './source-archive.mjs';
import { UNIT_PROPOSAL_SOURCE_HASH, UNIT_PROPOSAL_DOCUMENT_HASH, initializeUnitProposalDocument, readUnitProposalDocument } from './unit-proposal-document.mjs';

const dir = await mkdtemp(join(tmpdir(), 'unit-proposal-document-'));
after(() => rm(dir, { recursive: true, force: true }));
const dbPath = join(dir, 'unit-roster.sqlite');
const db = new DatabaseSync(dbPath);
after(() => db.close());
db.exec("PRAGMA foreign_keys=ON; CREATE TABLE untouched (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO untouched VALUES (1, 'unchanged')");
const sourceBytes = readSourceArchive('lore/name-pools/unit-roster.json', UNIT_PROPOSAL_SOURCE_HASH);
const schemaSql = await readFile(new URL('./unit-proposal-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
const expected = JSON.parse(sourceBytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const options = { schemaSql, sourceBytes, expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH, actor: 'unit-proposal-document-test', reason: 'Verify bounded full source without changing approval' };
const typed = connection => new Proxy(connection, { get(target, property, receiver) {
  if (property !== 'prepare') return Reflect.get(target, property, receiver);
  return sql => {
    assert.match(sql, /^SELECT /u);
    assert.doesNotMatch(sql, /\bsource_file\b|\bsource_record\b|\bjson_(?:extract|each|tree)\b/iu);
    return target.prepare(sql);
  };
} });
initializeUnitProposalDocument(db, options);
const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'unit_proposal_document%' ORDER BY name").all().map(row => row.name);

const CANONICAL_TABLE_COUNT = 311;
const CANONICAL_SENTINELS = ['build_metadata', 'source_file', 'source_record', 'family_role_decision', 'family_role_decision_fact', 'family_role_decision_source', 'household_manifest', 'person', 'state'];

test('whole actual source serialized parity and the fixed unit denominators', () => {
  const actual = readUnitProposalDocument(db, { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH });
  assert.equal(sourceBytes.length, 11704);
  assert.equal(hash(sourceBytes), UNIT_PROPOSAL_SOURCE_HASH);
  assert.notEqual(UNIT_PROPOSAL_SOURCE_HASH, UNIT_PROPOSAL_DOCUMENT_HASH);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(hash(JSON.stringify(actual)), UNIT_PROPOSAL_DOCUMENT_HASH);
  assert.deepEqual(Object.keys(actual), ['schema', 'status', 'note', 'design_source', 'squad_structure', 'unit_types', 'settlement_composition', 'hero_integration']);
  assert.equal(actual.status, 'legacy-proposal');
  assert.equal(actual.unit_types.length, 10);
  assert.deepEqual(actual.unit_types.map(unit => unit.id), ['UT-bayonet', 'UT-sword', 'UT-spear', 'UT-archer', 'UT-thrown', 'UT-scout', 'UT-guard', 'UT-medic', 'UT-engineer', 'UT-ronin']);
  assert.deepEqual(actual.unit_types.map(unit => unit.max_size), [30, 20, 25, 20, 15, 10, 15, 10, 15, 25]);
  assert.deepEqual(actual.unit_types.map(unit => unit.base_size), [15, 10, 12, 10, 8, 5, 8, 5, 8, 10]);
  assert.equal(actual.unit_types.filter(unit => unit.member_match.martial_any.length === 0).length, 2);
  assert.equal(actual.design_source.owner_decisions.length, 1);
  assert.equal(actual.squad_structure.recruitment.sources.length, 3);
  assert.equal(actual.hero_integration.classes.length, 6);
  assert.deepEqual(Object.keys(actual.settlement_composition.scale_by_settlement), ['대거점', '중거점', '소거점', '초소']);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_unit').get().n, 10);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_unit_string').get().n, 86);
  assert.equal(db.prepare("SELECT count(*) AS n FROM unit_proposal_document_unit_string WHERE list_kind='martial_any'").get().n, 24);
  assert.equal(db.prepare("SELECT count(*) AS n FROM unit_proposal_document_unit_string WHERE list_kind='occupation_any'").get().n, 33);
  assert.equal(db.prepare("SELECT count(*) AS n FROM unit_proposal_document_unit_string WHERE list_kind='equipment'").get().n, 29);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_attribute').get().n, 20);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_gurps').get().n, 10);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_owner_decision').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_recruitment_source').get().n, 3);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_hero_class').get().n, 6);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_import').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_design').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_squad').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_settlement').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM unit_proposal_document_hero').get().n, 1);
  assert.equal(db.prepare("SELECT value FROM untouched").get().value, 'unchanged');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  console.log('UNIT_PROPOSAL_DENOMINATORS units=10; strings=86; martial=24; occupation=33; equipment=29; attributes=20; gurps=10; decisions=1; sources=3; classes=6; emptyMartialUnits=2');
});

test('missing, changed, and extra rows on every consumed table and authored scalar column fail closed', () => {
  assert.deepEqual(tables, [
    'unit_proposal_document',
    'unit_proposal_document_attribute',
    'unit_proposal_document_design',
    'unit_proposal_document_gurps',
    'unit_proposal_document_hero',
    'unit_proposal_document_hero_class',
    'unit_proposal_document_import',
    'unit_proposal_document_key',
    'unit_proposal_document_owner_decision',
    'unit_proposal_document_recruitment_source',
    'unit_proposal_document_settlement',
    'unit_proposal_document_squad',
    'unit_proposal_document_unit',
    'unit_proposal_document_unit_string',
  ]);
  let mutations = 0;
  const reject = (sql, params = []) => {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON; PRAGMA ignore_check_constraints=ON');
    try {
      const change = db.prepare(sql).run(...params);
      assert.ok(change.changes > 0, sql);
      assert.throws(() => readUnitProposalDocument(typed(db), { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' }, sql);
      mutations++;
    } finally { db.exec('ROLLBACK; PRAGMA ignore_check_constraints=OFF'); }
  };
  for (const table of tables) {
    reject('DELETE FROM ' + table + ' WHERE rowid=(SELECT max(rowid) FROM ' + table + ')');
    const row = db.prepare('SELECT rowid AS mutation_rowid, * FROM ' + table + ' ORDER BY rowid LIMIT 1').get();
    for (const [key, value] of Object.entries(row)) {
      if (key === 'mutation_rowid') continue;
      if (table === 'unit_proposal_document_import' && ['actor', 'reason'].includes(key)) {
        reject('UPDATE ' + table + ' SET "' + key + '"=? WHERE rowid=?', ['', row.mutation_rowid]);
        continue;
      }
      const replacement = value === null
        ? (key.endsWith('_present') || ['st', 'dx', 'iq', 'ht', 'ordinal', 'singleton', 'unit_ordinal'].includes(key) ? 100000 : 'changed-null')
        : typeof value === 'number'
          ? (Number.isInteger(value) ? value + 100000 : value + 0.5)
          : value + ' changed';
      reject('UPDATE ' + table + ' SET "' + key + '"=? WHERE rowid=?', [replacement, row.mutation_rowid]);
    }
    const inserted = db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid LIMIT 1').get();
    const keys = Object.keys(inserted);
    if (table === 'unit_proposal_document_key') { inserted.ordinal = 999; inserted.key = 'unknown-extra'; }
    else if (table === 'unit_proposal_document_unit') { inserted.ordinal = 999; inserted.id = 'UT-extra'; }
    else if (table === 'unit_proposal_document_unit_string') inserted.ordinal = 999;
    else if (table === 'unit_proposal_document_attribute') inserted.owner_kind = 'extra';
    else if (table === 'unit_proposal_document_gurps') inserted.unit_ordinal = 999;
    else if (Object.hasOwn(inserted, 'ordinal')) inserted.ordinal = 999;
    else inserted.singleton = 2;
    reject('INSERT INTO ' + table + ' (' + keys.map(key => '"' + key + '"').join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')', Object.values(inserted));
  }
  assert.equal(JSON.stringify(readUnitProposalDocument(db, { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH })), JSON.stringify(expected));
  console.log('UNIT_PROPOSAL_REJECTED_MUTATIONS ' + mutations);
});

test('wrong pins, simultaneous typed-content and digest substitution, unknown fields and invalid nested types reject', () => {
  assert.throws(() => readUnitProposalDocument(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' });
  assert.throws(() => readUnitProposalDocument(db, { expectedSourceHash: undefined }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' });
  for (const changes of [{ actor: '' }, { reason: ' ' }, { schemaSql: undefined }, { expectedSourceHash: undefined },
    { expectedSourceHash: '0'.repeat(64) }, { sourceBytes: Buffer.from('{}') }, { sourceBytes: Buffer.concat([sourceBytes, Buffer.from('\n')]) }, { sourceBytes: 'not bytes' }])
    assert.throws(() => initializeUnitProposalDocument(db, { ...options, ...changes }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' });
  const edits = [
    document => { document.unknown = true; },
    document => { document.unit_types[0].unknown = true; },
    document => { document.unit_types[0].gurps_resolution.unknown = 'extra'; },
    document => { document.unit_types[0].member_match.attributes_min.unknown = 1; },
    document => { delete document.status; },
    document => { delete document.unit_types[0].id; },
    document => { delete document.unit_types[0].gurps_resolution.attack; },
    document => { document.unit_types = null; },
    document => { document.unit_types[0].member_match.martial_any = null; },
    document => { document.unit_types[0].max_size = '30'; },
    document => { document.unit_types[0].member_match.attributes_min.DX = 10.5; },
    document => { document.unit_types[7].member_match.martial_any = [1]; },
    document => { document.unit_types[0].gurps_resolution.attack = null; },
  ];
  for (const edit of edits) {
    const changed = structuredClone(expected);
    edit(changed);
    assert.throws(() => initializeUnitProposalDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }), /unknown field|missing field|array:|type:|source bytes\/hash/u);
  }
  db.exec('BEGIN; PRAGMA ignore_check_constraints=ON');
  try {
    db.prepare("UPDATE unit_proposal_document SET status='approved-changed'").run();
    db.prepare('UPDATE unit_proposal_document_import SET document_sha256=?').run('a'.repeat(64));
    assert.throws(() => readUnitProposalDocument(typed(db), { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' });
  } finally { db.exec('ROLLBACK; PRAGMA ignore_check_constraints=OFF'); }
  db.exec('BEGIN');
  try { assert.throws(() => initializeUnitProposalDocument(db, options), /explicit SQL\/transaction/u); }
  finally { db.exec('ROLLBACK'); }
  assert.throws(() => initializeUnitProposalDocument(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  assert.equal(JSON.stringify(readUnitProposalDocument(db, { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH })), JSON.stringify(expected));
});

test('failed post-insert full-document validation rolls back DDL and all writes', () => {
  const fresh = new DatabaseSync(':memory:');
  fresh.exec("CREATE TABLE untouched (value TEXT); INSERT INTO untouched VALUES ('unchanged')");
  try {
    const badSql = schemaSql + "\nCREATE TRIGGER change_import AFTER INSERT ON unit_proposal_document_import BEGIN UPDATE unit_proposal_document SET status='changed'; END;";
    assert.throws(() => initializeUnitProposalDocument(fresh, { ...options, schemaSql: badSql }), { code: 'E_UNIT_PROPOSAL_DOCUMENT' });
    assert.equal(fresh.isTransaction, false);
    assert.deepEqual(fresh.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['untouched']);
    assert.equal(fresh.prepare('SELECT value FROM untouched').get().value, 'unchanged');
    initializeUnitProposalDocument(fresh, options);
    assert.equal(JSON.stringify(readUnitProposalDocument(fresh, { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH })), JSON.stringify(expected));
  } finally { fresh.close(); }
});

test('fresh runtime imports and repeated read-only reopen work with source filesystem and JSON parser denied', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite'; import { createHash } from 'node:crypto';
    const deny = () => { throw Error('source filesystem/parser denied'); };
    const original = fs.readFileSync;
    const originalOpen = fs.openSync;
    fs.readFileSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? original(p, ...a) : deny();
    fs.openSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? originalOpen(p, ...a) : deny();
    for (const key of ['readFile', 'readdir', 'readdirSync', 'open', 'stat', 'statSync', 'access', 'accessSync']) fs[key] = deny;
    for (const key of ['readFile', 'readdir', 'open', 'stat', 'access']) fsp[key] = deny;
    syncBuiltinESMExports(); JSON.parse = deny;
    const { readUnitProposalDocument } = await import(${JSON.stringify(new URL('./unit-proposal-document.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
      const typed = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /source_file|source_record|json_extract|json_each|json_tree/i); return db.prepare(sql); } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readUnitProposalDocument(typed, { expectedSourceHash: ${JSON.stringify(UNIT_PROPOSAL_SOURCE_HASH)} }))).digest('hex'), ${JSON.stringify(UNIT_PROPOSAL_DOCUMENT_HASH)});
      db.close();
    }
    console.log('UNIT_PROPOSAL_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /UNIT_PROPOSAL_DB_ONLY_EXACT/u);
});

test('new tables coexist with the canonical schema inventory and a canonical database copy', () => {
  const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+("?)([A-Za-z0-9_]+)/gu)].map(match => match[2]);
  assert.equal(declared.length, 44);
  assert.equal(declared.some(name => name.startsWith('unit_proposal_document')), false);
  const memory = new DatabaseSync(':memory:');
  try {
    memory.exec('PRAGMA foreign_keys=ON');
    memory.exec(canonicalSchemaSql);
    const before = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(before, declared.slice().sort());
    initializeUnitProposalDocument(memory, options);
    const after = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('unit_proposal_document')), before);
    assert.deepEqual(after.filter(name => name.startsWith('unit_proposal_document')), tables);
    assert.equal(JSON.stringify(readUnitProposalDocument(typed(memory), { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH })), JSON.stringify(expected));
    assert.equal(memory.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(memory.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { memory.close(); }

  const copyPath = join(dir, 'wiki-cast.copy.sqlite');
  return copyFile(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url), copyPath).then(() => {
    const canonical = new DatabaseSync(copyPath);
    try {
      const inventory = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.equal(inventory.length, CANONICAL_TABLE_COUNT);
      for (const sentinel of CANONICAL_SENTINELS) assert.equal(inventory.includes(sentinel), true, sentinel);
      assert.equal(inventory.some(name => name.startsWith('unit_proposal_document')), false);
      const fingerprints = Object.fromEntries(CANONICAL_SENTINELS.map(name => [name, canonical.prepare('SELECT count(*) AS n FROM "' + name + '"').get().n]));
      initializeUnitProposalDocument(canonical, options);
      const grown = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(grown.filter(name => !name.startsWith('unit_proposal_document')), inventory);
      assert.deepEqual(grown.filter(name => name.startsWith('unit_proposal_document')), tables);
      for (const [name, count] of Object.entries(fingerprints)) assert.equal(canonical.prepare('SELECT count(*) AS n FROM "' + name + '"').get().n, count, name);
      assert.equal(JSON.stringify(readUnitProposalDocument(typed(canonical), { expectedSourceHash: UNIT_PROPOSAL_SOURCE_HASH })), JSON.stringify(expected));
      assert.equal(canonical.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
      assert.deepEqual(canonical.prepare('PRAGMA foreign_key_check').all(), []);
      console.log('UNIT_PROPOSAL_COEXISTENCE canonicalTables=' + inventory.length + '; added=' + tables.length);
    } finally { canonical.close(); }
  });
});
