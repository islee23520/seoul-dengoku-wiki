import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import test from 'node:test';
import { NAMING_LEDGER_SOURCE_HASH, initializeNamingLedgerDocument, readNamingLedgerDocument } from './naming-ledger-document.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from '../document-store/evidence.mjs';

const evidencePath = join(import.meta.dirname, '../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite');
assert.equal(fs.statSync(evidencePath).mode & 0o777, 0o600);
const evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
let sourceBytes;
try { sourceBytes = evidence.getEvidence('scope-read:lore/editorial/Naming-Ledger.json', NAMING_LEDGER_SOURCE_HASH); }
finally { evidence.close(); }
const schemaSql = fs.readFileSync(new URL('./naming-ledger-document.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const documentHash = 'c71924b028ee7f653dbb5ecf4895e655c8a4b453229287b326258f14afdb37f1';
const options = { schemaSql, sourceBytes, expectedSourceHash: NAMING_LEDGER_SOURCE_HASH, actor: 'unit-test', reason: 'Exact existing source preservation' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  naming_ledger_document: 1, naming_ledger_document_state: 16, naming_ledger_document_state_source: 16,
  naming_ledger_document_school: 75, naming_ledger_document_office: 16, naming_ledger_document_office_tier: 80,
  naming_ledger_document_series: 2, naming_ledger_document_retired_form: 5, naming_ledger_document_retired_except: 2,
};
const tables = Object.keys(counts);
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeNamingLedgerDocument(db, options);
  return db;
}
const read = db => readNamingLedgerDocument(db, { expectedSourceHash: NAMING_LEDGER_SOURCE_HASH });
const rejected = fn => assert.throws(fn, { code: 'E_NAMING_LEDGER_DOCUMENT' });
function allKeys(value, path = '', result = []) {
  if (Array.isArray(value)) value.forEach((entry, index) => allKeys(entry, `${path}/${index}`, result));
  else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach((key, ordinal) => result.push([path, ordinal, key]));
    for (const [key, entry] of Object.entries(value)) allKeys(entry, `${path}/${key}`, result);
  }
  return result;
}

test('actual entire source has fixed byte and document hashes, exact order, nulls and all 213 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES ('untouched')");
  try {
    assert.equal(sourceBytes.length, 19634);
    assert.equal(hash(sourceBytes), NAMING_LEDGER_SOURCE_HASH);
    assert.equal(hash(JSON.stringify(source)), documentHash);
    assert.notEqual(JSON.stringify(source), sourceBytes.toString('utf8'));
    assert.deepEqual(initializeNamingLedgerDocument(db, options), {
      documents: 1, states: 16, stateSources: 16, schools: 75, offices: 16, tiers: 80, series: 2, retiredForms: 5, exceptSources: 2, totalRows: 213,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(allKeys(document), allKeys(source));
    assert.equal(document.historicalMartialSchools.every(school => school.alias === null), true);
    assert.equal(document.historicalMartialBranch.formalName, null);
    assert.equal(document.historicalMartialBranch.rightsStatus, 'retired');
    assert.equal(document.retiredPublicForms.every(form => form.rightsStatus === 'retired'), true);
    assert.deepEqual(document.retiredPublicForms[3].exceptSources, ['Martial-Paths']);
    assert.equal('exceptSources' in document.retiredPublicForms[0], false);
    assert.deepEqual(Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'untouched');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const schema = db.prepare("SELECT name, sql FROM sqlite_schema WHERE type='table' AND name LIKE 'naming_ledger_document%' ORDER BY name").all();
    assert.equal(schema.length, 9);
    assert.ok(schema.every(entry => entry.sql.endsWith('STRICT') && !/\b(BLOB|ANY|JSON)\b/i.test(entry.sql)));
    const before = db.prepare('SELECT * FROM naming_ledger_document').all();
    rejected(() => initializeNamingLedgerDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeNamingLedgerDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM naming_ledger_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of tables) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        db.exec('PRAGMA foreign_keys=OFF');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(entry => entry.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(name => !['document_id', 'ordinal', 'state_ordinal', 'office_ordinal', 'form_ordinal'].includes(name) && name !== 'version');
          db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(name => {
            if (['document_id', 'ordinal', 'state_ordinal', 'office_ordinal', 'form_ordinal'].includes(name)) return `${name}+100`;
            if (['id', 'name', 'formal_name', 'state', 'form'].includes(name)) return `${name} || '-extra'`;
            return name;
          });
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('simultaneous data and stored digest substitution is rejected', () => {
  const db = fresh();
  try {
    const forged = structuredClone(source);
    forged.historicalMartialBranch.name += ' substituted';
    const forgedHash = hash(JSON.stringify(forged));
    db.exec('PRAGMA ignore_check_constraints=ON');
    db.exec(`UPDATE naming_ledger_document SET branch_name=branch_name || ' substituted', source_sha256='${forgedHash}', receipt_sha256='${forgedHash}'`);
    rejected(() => read(db));
    rejected(() => readNamingLedgerDocument(db, { expectedSourceHash: forgedHash }));
  } finally { db.close(); }
});

test('unknown and missing fields, absent versus null, wrong pins and bad input fail closed', () => {
  const paths = [[], ['states', 0], ['historicalMartialSchools', 0], ['historicalMartialBranch'], ['offices', 0], ['seriesTitles', 0], ['retiredPublicForms', 0], ['retiredPublicForms', 4]];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeNamingLedgerDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.historicalMartialSchools[0].alias = 'invented'; },
    document => { delete document.historicalMartialSchools[0].alias; },
    document => { document.historicalMartialBranch.formalName = 'invented'; },
    document => { document.states = []; },
    document => { document.version = 2; },
    document => { document.retiredPublicForms[0].exceptSources = []; },
    document => { delete document.retiredPublicForms[4].exceptSources; },
    document => { document.retiredPublicForms[0].rightsStatus = null; },
  ]) {
    const changed = structuredClone(source); mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeNamingLedgerDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readNamingLedgerDocument(db));
    rejected(() => readNamingLedgerDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeNamingLedgerDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    rejected(() => initializeNamingLedgerDocument(db, { ...options, sourceBytes: Buffer.from('{}'), expectedSourceHash: hash('{}') }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeNamingLedgerDocument(db, { ...options, ...overrides }));
    }
    db.exec('BEGIN');
    rejected(() => initializeNamingLedgerDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_ledger BEFORE INSERT ON naming_ledger_document_retired_except BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_ledger AFTER INSERT ON naming_ledger_document_retired_except BEGIN UPDATE naming_ledger_document SET branch_name='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES ('retained')");
      assert.throws(() => initializeNamingLedgerDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(entry => entry.name), ['canonical_coexistence']);
      assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', async () => {
  const db = fresh();
  const expected = hash(JSON.stringify(read(db)));
  db.close();
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { createHash } from 'node:crypto';
    import { DatabaseSync } from 'node:sqlite';
    const blocked = () => { throw new Error('runtime source access forbidden'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (...args) => { if (String(args[0]).endsWith('.json')) throw new Error('source read denied'); return originalRead(...args); };
    syncBuiltinESMExports();
    const { readNamingLedgerDocument, NAMING_LEDGER_SOURCE_HASH } = await import(${JSON.stringify(new URL('./naming-ledger-document.mjs', import.meta.url).href)});
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open']) fs[key] = blocked;
    for (const key of ['readFile','open']) fsp[key] = blocked;
    syncBuiltinESMExports();
    JSON.parse = blocked;
    globalThis.fetch = blocked;
    const db = new DatabaseSync(':memory:');
    db.exec(${JSON.stringify(schemaSql)});
    const source = ${JSON.stringify(source)};
    db.prepare('INSERT INTO naming_ledger_document VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      1, NAMING_LEDGER_SOURCE_HASH, source.version, source.historicalMartialBranch.name, null, source.historicalMartialBranch.source, source.historicalMartialBranch.rightsStatus,
      'unit-test', 'Exact existing source preservation', createHash('sha256').update(JSON.stringify([NAMING_LEDGER_SOURCE_HASH, process.argv[1], 'unit-test', 'Exact existing source preservation'])).digest('hex'));
    source.states.forEach((state, ordinal) => {
      db.prepare('INSERT INTO naming_ledger_document_state VALUES (?,?,?)').run(ordinal, state.id, state.name);
      state.sources.forEach((value, sourceOrdinal) => db.prepare('INSERT INTO naming_ledger_document_state_source VALUES (?,?,?)').run(ordinal, sourceOrdinal, value));
    });
    source.historicalMartialSchools.forEach((school, ordinal) => db.prepare('INSERT INTO naming_ledger_document_school VALUES (?,?,?,?,?)').run(ordinal, school.formalName, school.hanja, null, school.source));
    source.offices.forEach((office, ordinal) => {
      db.prepare('INSERT INTO naming_ledger_document_office VALUES (?,?,?)').run(ordinal, office.state, office.source);
      office.tiers.forEach((tier, tierOrdinal) => db.prepare('INSERT INTO naming_ledger_document_office_tier VALUES (?,?,?)').run(ordinal, tierOrdinal, tier));
    });
    source.seriesTitles.forEach((series, ordinal) => db.prepare('INSERT INTO naming_ledger_document_series VALUES (?,?,?)').run(ordinal, series.form, series.source));
    source.retiredPublicForms.forEach((form, ordinal) => {
      db.prepare('INSERT INTO naming_ledger_document_retired_form VALUES (?,?,?,?)').run(ordinal, form.form, form.source, form.rightsStatus);
      (form.exceptSources ?? []).forEach((value, sourceOrdinal) => db.prepare('INSERT INTO naming_ledger_document_retired_except VALUES (?,?,?)').run(ordinal, sourceOrdinal, value));
    });
    const selectOnly = { prepare(sql) { if (!/^SELECT\\b/i.test(sql) || /archive|source_file|json_/i.test(sql)) throw new Error('non SELECT denied'); return db.prepare(sql); }, exec() { throw new Error('exec denied'); } };
    const stored = readNamingLedgerDocument(selectOnly, { expectedSourceHash: NAMING_LEDGER_SOURCE_HASH });
    if (createHash('sha256').update(JSON.stringify(stored)).digest('hex') !== process.argv[2]) throw new Error('fresh reader mismatch');
    db.close();
  `, documentHash, expected], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  assert.equal(exit, 0, output);
});
