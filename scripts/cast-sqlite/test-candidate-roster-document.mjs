import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  CANDIDATE_ROSTER_DOCUMENT_HASH,
  CANDIDATE_ROSTER_SOURCE_HASH,
  initializeCandidateRosterDocument,
  readCandidateRosterDocument,
} from './candidate-roster-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/roster-100.json', CANDIDATE_ROSTER_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./candidate-roster-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = CANDIDATE_ROSTER_SOURCE_HASH;
const options = {
  schemaSql,
  sourceBytes,
  expectedSourceHash,
  actor: 'unit-test',
  reason: 'Exact candidate roster preservation without approval',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  candidate_roster_document_root: 1,
  candidate_roster_document_provenance: 1,
  candidate_roster_document_state_count: 16,
  candidate_roster_document_livelihood_count: 7,
  candidate_roster_document_person: 100,
  candidate_roster_document_key: 8 + 8 + 16 + 7 + 100 * 26,
};
const rejected = fn => assert.throws(fn, { code: 'E_CANDIDATE_ROSTER_DOCUMENT' });
const read = db => readCandidateRosterDocument(db, { expectedSourceHash });
const scratch = await mkdtemp(join(tmpdir(), 'candidate-roster-document-'));
after(() => rm(scratch, { recursive: true, force: true }));

function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeCandidateRosterDocument(db, options);
  return db;
}

test('actual entire roster preserves ordered serialization, independent pins and exact typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 144176);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.notEqual(CANDIDATE_ROSTER_SOURCE_HASH, CANDIDATE_ROSTER_DOCUMENT_HASH);
    assert.equal(hash(JSON.stringify(source)), CANDIDATE_ROSTER_DOCUMENT_HASH);
    assert.deepEqual(initializeCandidateRosterDocument(db, options), {
      documents: 1, provenance: 1, states: 16, livelihoods: 7, people: 100, keys: 2639, totalRows: 2764,
    });
    const document = read(db);
    assert.deepEqual(document, source);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.equal(hash(JSON.stringify(document)), CANDIDATE_ROSTER_DOCUMENT_HASH);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(document.provenance.status, 'candidate-pool-pending-owner');
    assert.equal(document.provenance.license, 'pending-owner');
    assert.equal(document.n, 100);
    assert.equal(document.hangnyeol_on, 7);
    assert.equal(document.people.filter(person => person['본관'] !== null).length, 7);
    assert.equal(document.people.filter(person => person['항렬자'] !== null).length, 7);
    assert.equal(document.people.filter(person => person['회랑'] === null).length, 100);
    assert.equal(new Set(document.people.map(person => person.id)).size, 100);
    assert.equal(new Set(document.people.map(person => person.source_uuid)).size, 100);
    assert.deepEqual(Object.keys(document.by_state), Object.keys(source.by_state));
    assert.deepEqual(Object.keys(document.by_livelihood), Object.keys(source.by_livelihood));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM candidate_roster_document_root').all();
    assert.throws(() => initializeCandidateRosterDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM candidate_roster_document_root').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) for (const mode of ['missing', 'changed', 'extra']) {
  test(`${table}: ${mode} row is rejected`, () => {
    const db = fresh();
    try {
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      if (mode === 'changed') {
        const column = columns.find(row => !['document_id', 'ordinal'].includes(row.name));
        const replacement = column.type === 'INTEGER' ? '1000000' : `${column.name} || '-changed'`;
        db.exec(`UPDATE ${table} SET "${column.name}"=${replacement} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(row => {
          if (row.name === 'document_id' || row.name === 'ordinal') return '1000000';
          if (['id', 'source_uuid', 'state_key', 'livelihood_key', 'object_path', 'key'].includes(row.name)) return `"${row.name}" || '-extra'`;
          return `"${row.name}"`;
        });
        db.exec(`INSERT INTO ${table} (${columns.map(row => `"${row.name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('unknown fields, missing fields, reordered keys, null/absent swaps and wrong hashes fail before writes', () => {
  const targets = [[], ['provenance'], ['by_state'], ['by_livelihood'], ['people', 0]];
  for (const path of targets) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(source);
    const target = path.reduce((value, key) => value[key], changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') {
      const key = Object.keys(target)[0];
      const value = target[key];
      delete target[key];
      target[key] = value;
    }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeCandidateRosterDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  const indexed = source.people.findIndex(person => person['본관'] !== null);
  for (const mutate of [
    document => { delete document.people[0]['본관']; },
    document => { document.people[0]['본관'] = ''; },
    document => { document.people[indexed]['본관'] = null; document.hangnyeol_on = 6; },
    document => { document.people[0]['회랑'] = 'absent-filled'; },
    document => { document.people.pop(); },
    document => { document.people[0].age = 76.5; },
    document => { document.people[0].id = ''; },
    document => { document.by_state['동방사'] = '5'; },
    document => { document.n = 99; },
    document => { document.provenance.status = 'approved'; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeCandidateRosterDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readCandidateRosterDocument(db));
    rejected(() => readCandidateRosterDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeCandidateRosterDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeCandidateRosterDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('simultaneous typed-content and mutable digest substitution is rejected', () => {
  const db = fresh();
  try {
    db.exec('BEGIN; PRAGMA ignore_check_constraints=ON');
    db.prepare("UPDATE candidate_roster_document_provenance SET status='approved-changed'").run();
    db.prepare('UPDATE candidate_roster_document_root SET document_sha256=?').run('a'.repeat(64));
    rejected(() => read(db));
  } finally {
    db.exec('ROLLBACK; PRAGMA ignore_check_constraints=OFF');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    db.close();
  }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_candidate_roster BEFORE INSERT ON candidate_roster_document_person BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_candidate_roster AFTER INSERT ON candidate_roster_document_person BEGIN UPDATE candidate_roster_document_root SET n=0; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeCandidateRosterDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch and JSON.parse access blocked', () => {
  const dbPath = join(scratch, 'roster.sqlite');
  const seeded = new DatabaseSync(dbPath);
  initializeCandidateRosterDocument(seeded, options);
  seeded.close();
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('source filesystem/parser denied'); };
    const original = fs.readFileSync;
    const originalOpen = fs.openSync;
    fs.readFileSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? original(p, ...a) : deny();
    fs.openSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? originalOpen(p, ...a) : deny();
    for (const key of ['readFile', 'readdir', 'readdirSync', 'open', 'stat', 'statSync', 'access', 'accessSync', 'createReadStream']) fs[key] = deny;
    for (const key of ['readFile', 'readdir', 'open', 'stat', 'access']) fsp[key] = deny;
    syncBuiltinESMExports();
    JSON.parse = deny;
    globalThis.fetch = deny;
    const { readCandidateRosterDocument } = await import(${JSON.stringify(new URL('./candidate-roster-document.mjs', import.meta.url).href)});
    const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return db.prepare(sql);
      },
      exec: deny,
    };
    const document = readCandidateRosterDocument(guarded, { expectedSourceHash: ${JSON.stringify(expectedSourceHash)} });
    assert.equal(createHash('sha256').update(JSON.stringify(document)).digest('hex'), ${JSON.stringify(CANDIDATE_ROSTER_DOCUMENT_HASH)});
    assert.equal(document.people.length, 100);
    db.close();
    console.log('CANDIDATE_ROSTER_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /CANDIDATE_ROSTER_DB_ONLY_EXACT/u);
  const live = new DatabaseSync(':memory:');
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => {
    const original = object[key];
    object[key] = blocked;
    restores.push(() => { object[key] = original; });
  };
  try {
    initializeCandidateRosterDocument(live, options);
    live.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return live.prepare(sql);
      },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
  } finally {
    restores.reverse().forEach(restore => restore());
    live.close();
  }
});

test('candidate roster tables coexist with the canonical schema and a canonical database copy', async () => {
  const declared = [...canonicalSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+("?)([A-Za-z0-9_]+)/gu)].map(match => match[2]);
  assert.equal(declared.length, 44);
  assert.equal(declared.includes('person'), true);
  assert.equal(declared.some(name => name.startsWith('candidate_roster_document_')), false);
  const memory = new DatabaseSync(':memory:');
  try {
    memory.exec(canonicalSql);
    const before = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(before, declared.slice().sort());
    initializeCandidateRosterDocument(memory, options);
    const after = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('candidate_roster_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('candidate_roster_document_')), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(memory)), JSON.stringify(source));
    assert.equal(memory.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { memory.close(); }

  const copyPath = join(scratch, 'wiki-cast.copy.sqlite');
  await copyFile(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url), copyPath);
  const canonical = new DatabaseSync(copyPath);
  try {
    const inventory = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.equal(inventory.some(name => name.startsWith('candidate_roster_document_')), false);
    assert.equal(inventory.includes('person'), true);
    const personCount = canonical.prepare('SELECT count(*) AS n FROM person').get().n;
    initializeCandidateRosterDocument(canonical, options);
    const grown = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(grown.filter(name => !name.startsWith('candidate_roster_document_')), inventory);
    assert.deepEqual(grown.filter(name => name.startsWith('candidate_roster_document_')), Object.keys(counts).sort());
    assert.equal(canonical.prepare('SELECT count(*) AS n FROM person').get().n, personCount);
    assert.equal(JSON.stringify(read(canonical)), JSON.stringify(source));
    assert.equal(canonical.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(canonical.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { canonical.close(); }
});
