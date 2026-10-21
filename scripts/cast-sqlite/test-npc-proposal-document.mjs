import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import { NPC_PROPOSAL_DOCUMENT_HASH, NPC_PROPOSAL_SOURCE_HASH, initializeNpcProposalDocument, readNpcProposalDocument } from './npc-proposal-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/settlement-npc-generator.json', NPC_PROPOSAL_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./npc-proposal-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const canonicalDbPath = new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname;
const source = JSON.parse(sourceBytes);
const expectedSourceHash = NPC_PROPOSAL_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact settlement NPC proposal preservation without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  npc_proposal_document_import: 1,
  npc_proposal_document_root: 1,
  npc_proposal_document_decision: 1,
  npc_proposal_document_generation: 1,
  npc_proposal_document_field: 1,
  npc_proposal_document_pool: 7,
  npc_proposal_document_pool_item: 30,
  npc_proposal_document_martial: 1,
  npc_proposal_document_occupation: 6,
  npc_proposal_document_style: 10,
  npc_proposal_document_eligibility: 1,
  npc_proposal_document_check_field: 3,
  npc_proposal_document_wandering: 1,
  npc_proposal_document_reason: 4,
  npc_proposal_document_settlement: 4,
  npc_proposal_document_endpoint: 1,
  npc_proposal_document_param: 2,
  npc_proposal_document_response: 2,
  npc_proposal_document_key: 78,
};
const rejected = fn => assert.throws(fn, { code: 'E_NPC_PROPOSAL_DOCUMENT' });
const read = db => readNpcProposalDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeNpcProposalDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, all 155 typed rows and exact numeric spellings', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 4482);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), NPC_PROPOSAL_DOCUMENT_HASH);
    assert.notEqual(JSON.stringify(source), sourceBytes.toString('utf8'));
    assert.deepEqual(initializeNpcProposalDocument(db, options), {
      documents: 1, decisions: 1, fields: 1, pools: 7, poolItems: 30, occupations: 6, styles: 10, settlements: 4, keys: 78, totalRows: 155,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT min_per_settlement_text FROM npc_proposal_document_generation').get().min_per_settlement_text, '3');
    assert.equal(db.prepare('SELECT max_per_settlement_text FROM npc_proposal_document_generation').get().max_per_settlement_text, '50');
    assert.equal(db.prepare('SELECT probability_text FROM npc_proposal_document_wandering').get().probability_text, '0.15');
    assert.deepEqual(db.prepare('SELECT settlement_key, npc_multiplier_text FROM npc_proposal_document_settlement ORDER BY ordinal').all().map(row => row.npc_multiplier_text), ['1.0', '0.8', '0.5', '0.3']);
    assert.equal(db.prepare("SELECT status FROM npc_proposal_document_root").get().status, 'legacy-proposal');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM npc_proposal_document_import').all();
    assert.throws(() => initializeNpcProposalDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM npc_proposal_document_import').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) for (const mode of ['missing', 'changed', 'extra']) {
  test(`${table}: ${mode} row is rejected`, () => {
    const db = fresh();
    try {
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
      if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      if (mode === 'changed') {
        const column = columns.find(name => !['document_id', 'ordinal'].includes(name));
        const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const value = info.type === 'INTEGER' || info.type === 'REAL' ? '1000' : `"${column}" || '-changed'`;
        db.exec(`UPDATE ${table} SET "${column}"=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (name === 'document_id') return '2';
          if (name === 'ordinal') return 'ordinal+100';
          if (name.endsWith('_key') || name === 'key' || name === 'object_path' || name === 'pool_key' || name === 'occupation_key' || name === 'settlement_key') return `"${name}" || '-extra'`;
          return `"${name}"`;
        });
        db.exec(`INSERT INTO ${table} (${columns.map(name => `"${name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('every typed column and key-order cell detects corruption', () => {
  const db = fresh();
  let checked = 0;
  try {
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
      db.exec('SAVEPOINT corruption');
      const numeric = column.type === 'INTEGER' || column.type === 'REAL';
      const lengthChecked = !numeric && ['source_sha256', 'document_sha256', 'row_sha256', 'receipt_sha256'].includes(column.name);
      const value = numeric ? '1000' : lengthChecked ? `'${'f'.repeat(64)}'` : "'changed'";
      db.exec(`UPDATE ${table} SET "${column.name}"=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => read(db));
      checked += 1;
      db.exec('ROLLBACK TO corruption; RELEASE corruption');
    }
    assert.equal(checked, 78);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('unknown, missing, reordered, and wrong-hash fields fail before any write', () => {
  const paths = [
    [],
    ['current_decisions'],
    ['generation_rules'],
    ['npc_fields'],
    ['occupation_pools'],
    ['martial_assignment'],
    ['martial_assignment', 'by_occupation'],
    ['unit_eligibility_check'],
    ['wandering_spawn'],
    ['settlement_types'],
    ['settlement_types', '거점'],
    ['api_endpoint'],
    ['api_endpoint', 'params'],
    ['api_endpoint', 'response'],
  ];
  for (const path of paths) for (const mode of ['unknown', 'missing', 'order']) {
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
      rejected(() => initializeNpcProposalDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.status = 'approved'; },
    document => { document.generation_rules.min_per_settlement = 4; },
    document => { document.generation_rules.max_per_settlement = '50'; },
    document => { document.wandering_spawn.probability = 0.150; },
    document => { document.settlement_types['거점'].npc_multiplier = 1; },
    document => { document.occupation_pools.general_settlement.push('추가'); },
    document => { document.martial_assignment.by_occupation['경비 당직'].reverse(); },
    document => { document.unit_eligibility_check.check_fields = ['martial', 'occupation', 'attributes']; },
    document => { document.wandering_spawn.reasons[0] = null; },
    document => { document.api_endpoint.params = []; },
    document => { document.settlement_types['야영지'].pop_range = null; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeNpcProposalDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const spelled = Buffer.from(sourceBytes.toString('utf8').replace('"npc_multiplier": 1.0', '"npc_multiplier": 1'));
  const spellingDb = new DatabaseSync(':memory:');
  try { rejected(() => initializeNpcProposalDocument(spellingDb, { ...options, sourceBytes: spelled })); }
  finally { spellingDb.close(); }
  const db = fresh();
  try {
    rejected(() => readNpcProposalDocument(db));
    rejected(() => readNpcProposalDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeNpcProposalDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeNpcProposalDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('changing typed content and its stored digest cannot replace the independent document pin', () => {
  const db = fresh();
  try {
    const changed = structuredClone(source);
    changed.current_decisions.population += ' changed';
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    db.prepare('UPDATE npc_proposal_document_decision SET population=?').run(changed.current_decisions.population);
    db.prepare('UPDATE npc_proposal_document_import SET document_sha256=?, row_sha256=?').run(hash(JSON.stringify(changed)), 'a'.repeat(64));
    assert.equal(db.prepare('SELECT source_sha256 FROM npc_proposal_document_import').get().source_sha256, expectedSourceHash);
    rejected(() => read(db));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_npc_proposal BEFORE INSERT ON npc_proposal_document_key BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_npc_proposal AFTER INSERT ON npc_proposal_document_key BEGIN UPDATE npc_proposal_document_root SET status='approved'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeNpcProposalDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch, and JSON.parse denied', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => {
    const original = object[key];
    object[key] = blocked;
    restores.push(() => { object[key] = original; });
  };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return db.prepare(sql);
      },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
    assert.equal(read(guarded).settlement_types['거점'].npc_multiplier, 1);
    assert.equal(read(guarded).wandering_spawn.probability, 0.15);
  } finally {
    restores.reverse().forEach(restore => restore());
    db.close();
  }
});

test('new tables coexist with the canonical schema inventory and the canonical database backup', () => {
  const inventory = new DatabaseSync(':memory:');
  const backup = fs.mkdtempSync(new URL('../../.vitest/npc-proposal-coexistence-', import.meta.url).pathname);
  const copyPath = `${backup}/wiki-cast.sqlite`;
  try {
    const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi)].map(match => match[1]).sort();
    assert.equal(declared.length, 44);
    assert.equal(declared.some(name => name.startsWith('npc_proposal_document_')), false);
    inventory.exec(canonicalSchemaSql);
    const canonicalNames = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(canonicalNames, declared);
    initializeNpcProposalDocument(inventory, options);
    const combined = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(combined.filter(name => !name.startsWith('npc_proposal_document_')), canonicalNames);
    assert.deepEqual(combined.filter(name => name.startsWith('npc_proposal_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(inventory)), JSON.stringify(source));
    assert.equal(inventory.prepare('SELECT count(*) AS n FROM person').get().n, 0);

    fs.copyFileSync(canonicalDbPath, copyPath);
    const canonical = new DatabaseSync(copyPath);
    try {
      const before = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.equal(before.length, 311);
      assert.equal(before.some(name => name.startsWith('npc_proposal_document_')), false);
      for (const name of canonicalNames) assert.equal(before.includes(name), true, name);
      const personCount = canonical.prepare('SELECT count(*) AS n FROM person').get().n;
      assert.ok(personCount > 0);
      initializeNpcProposalDocument(canonical, options);
      const after = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(after.filter(name => !name.startsWith('npc_proposal_document_')), before);
      assert.equal(canonical.prepare('SELECT count(*) AS n FROM person').get().n, personCount);
      assert.equal(JSON.stringify(read(canonical)), JSON.stringify(source));
      assert.equal(canonical.prepare('PRAGMA foreign_key_check').all().length, 0);
    } finally { canonical.close(); }
  } finally {
    inventory.close();
    fs.rmSync(backup, { recursive: true, force: true });
  }
});

test('a fresh process reconstructs the pinned document with runtime filesystem and JSON.parse denied', () => {
  const directory = fs.mkdtempSync(new URL('../../.vitest/npc-proposal-runtime-', import.meta.url).pathname);
  const dbPath = `${directory}/document.sqlite`;
  const db = new DatabaseSync(dbPath);
  try { initializeNpcProposalDocument(db, options); }
  finally { db.close(); }
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { DatabaseSync } from 'node:sqlite';
    import { readNpcProposalDocument, NPC_PROPOSAL_SOURCE_HASH } from ${JSON.stringify(new URL('./npc-proposal-document.mjs', import.meta.url).href)};
    const deny = () => { throw new Error('runtime source access forbidden'); };
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open','readdirSync','statSync']) fs[key] = deny;
    for (const key of ['readFile','open','readdir','stat']) fsp[key] = deny;
    JSON.parse = deny;
    globalThis.fetch = deny;
    const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
    const guarded = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /archive|source_file|json_/i); return db.prepare(sql); }, exec: deny };
    const document = readNpcProposalDocument(guarded, { expectedSourceHash: NPC_PROPOSAL_SOURCE_HASH });
    assert.equal(document.status, 'legacy-proposal');
    assert.equal(document.generation_rules.min_per_settlement, 3);
    assert.equal(document.settlement_types['거점'].npc_multiplier, 1);
    assert.equal(document.wandering_spawn.probability, 0.15);
    assert.equal(document.occupation_pools.general_settlement.length, 6);
    console.log('NPC_PROPOSAL_RUNTIME_EXACT');
    db.close();
  `], { encoding: 'utf8', timeout: 30000 });
  fs.rmSync(directory, { recursive: true, force: true });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /NPC_PROPOSAL_RUNTIME_EXACT/u);
});
