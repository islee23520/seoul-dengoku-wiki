import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { serialize } from 'node:v8';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { initializeScopeContractStore, readScopeContract, SCOPE_CONTRACT_SOURCE_SHA256 } from './scope-contract-store.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-mapping-family-source-20261020.sqlite';
const sourceBytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, 'lore/editorial/Seoul-Scope-Contract.json', SCOPE_CONTRACT_SOURCE_SHA256);
const source = JSON.parse(sourceBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const command = { sourceBytes, expectedSha256: SCOPE_CONTRACT_SOURCE_SHA256, actor: 'scope-contract-test', reason: 'fixed actual source migration on copy only' };
const connect = path => new DatabaseSync(path, { enableForeignKeyConstraints: true });
const quote = name => `"${name.replaceAll('"', '""')}"`;
const tables = db => db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
function snapshot(db, names) {
  return Object.fromEntries(names.map(name => {
    const digest = createHash('sha256'); let count = 0;
    for (const row of db.prepare(`SELECT * FROM ${quote(name)}`).iterate()) { digest.update(serialize(row)); count++; }
    return [name, { count, sha256: digest.digest('hex') }];
  }));
}
async function fileHash(path) {
  const digest = createHash('sha256');
  for await (const bytes of createReadStream(path)) digest.update(bytes);
  return digest.digest('hex');
}
function memory(fn) {
  const db = connect(':memory:');
  try { return fn(db); } finally { db.close(); }
}
function countBy(rows, key) {
  return rows.reduce((counts, row) => { counts[row[key]] = (counts[row[key]] ?? 0) + 1; return counts; }, {});
}
function allKeys(value, path = '', result = []) {
  if (Array.isArray(value)) value.forEach((entry, index) => allKeys(entry, `${path}/${index}`, result));
  else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach((key, ordinal) => result.push([path, ordinal, key]));
    for (const [key, entry] of Object.entries(value)) allKeys(entry, `${path}/${key}`, result);
  }
  return result;
}

test('entire fixed actual contract on authority COPY preserves every field, order, null and all existing domain rows', async () => {
  assert.equal(hash(sourceBytes), '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8');
  const originalHash = await fileHash(authority);
  const dir = mkdtempSync(join(tmpdir(), 'scope-contract-copy-')); const path = join(dir, 'copy.sqlite');
  copyFileSync(authority, path);
  let db = connect(path);
  try {
    const originalSchema = db.prepare('SELECT * FROM sqlite_schema ORDER BY type,name').all();
    const existing = tables(db).map(r => r.name); const before = snapshot(db, existing);
    const result = initializeScopeContractStore(db, command);
    assert.deepEqual(result, { sourceSha256: SCOPE_CONTRACT_SOURCE_SHA256, entities: 1634, documents: 322, dispositions: 3043, editable: true });
    const stored = readScopeContract(db);
    assert.deepEqual(stored, source); assert.equal(JSON.stringify(stored), JSON.stringify(source));
    assert.deepEqual(allKeys(stored), allKeys(source));
    assert.deepEqual(countBy(stored.entities, 'kind'), { person: 1022, title: 200, holding: 204, state: 17, event: 191 });
    assert.deepEqual(countBy(stored.documents, 'status'), { control: 13, active: 254, excluded: 13, preserved: 42 });
    assert.deepEqual(countBy(stored.dispositions, 'set'), { persons: 1022, titles: 200, holdings: 25, grants: 179, bindings: 7, states: 16, polities: 1, events: 191, relations: 1388, courts: 14 });
    assert.equal(stored.entities.filter(r => r.batchId === null).length, 440);
    assert.equal(stored.documents.filter(r => r.batchId === null).length, 42);
    assert.equal(stored.documents.filter(r => r.reviewReceipt === null).length, 68);
    assert.equal(db.prepare('SELECT count(*) n FROM scope_contract_entity_location').get().n, 1283);
    assert.equal(db.prepare('SELECT count(*) n FROM scope_contract_entity_jurisdiction').get().n, 2880);
    assert.equal(db.prepare('SELECT count(*) n FROM scope_contract_disposition_target').get().n, 1401);
    assert.equal(db.prepare('SELECT count(*) n FROM scope_contract_document_review').get().n, 254);
    assert.deepEqual(stored.rail, { stationRefs: [], edgeRefs: [] });
    assert.deepEqual(snapshot(db, existing), before);
    assert.deepEqual(db.prepare("SELECT * FROM sqlite_schema WHERE tbl_name NOT GLOB 'scope_contract_*' ORDER BY type,name").all(), originalSchema);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    const scopeTables = tables(db).filter(r => r.name.startsWith('scope_contract_'));
    assert.equal(scopeTables.length, 14);
    assert.ok(scopeTables.every(r => r.sql.endsWith('STRICT')));
    assert.ok(scopeTables.every(r => !/\b(BLOB|ANY)\b/i.test(r.sql)));
    assert.throws(() => initializeScopeContractStore(db, command), /already initialized/);
    const expectedDigest = hash(JSON.stringify(stored));
    db.close(); db = null;
    const child = spawn(process.execPath, ['--input-type=module', '-e', `
      import fs from 'node:fs';
      import fsp from 'node:fs/promises';
      import { syncBuiltinESMExports } from 'node:module';
      import { createHash } from 'node:crypto';
      import { DatabaseSync } from 'node:sqlite';
      const originalRead = fs.readFileSync;
      fs.readFileSync = (...args) => { if (String(args[0]).endsWith('.json')) throw Error('source read denied'); return originalRead(...args); };
      syncBuiltinESMExports();
      const { readScopeContract } = await import(${JSON.stringify(new URL('./scope-contract-store.mjs', import.meta.url).href)});
      fs.readFileSync = () => { throw Error('filesystem denied'); };
      fsp.readFile = () => { throw Error('filesystem denied'); };
      syncBuiltinESMExports();
      JSON.parse = () => { throw Error('JSON.parse denied'); };
      const db = new DatabaseSync(process.argv[1], { readOnly: true, enableForeignKeyConstraints: true });
      const selectOnly = { prepare(sql) { if (!/^SELECT\\b/i.test(sql)) throw Error('non SELECT denied'); return db.prepare(sql); } };
      const stored = readScopeContract(selectOnly);
      if (createHash('sha256').update(JSON.stringify(stored)).digest('hex') !== process.argv[2]) throw Error('fresh reader mismatch');
      db.close();
    `, path, expectedDigest], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
    const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    assert.equal(exit, 0, output);
    assert.equal(await fileHash(authority), originalHash);
  } finally { db?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('wrong fixed pins, altered actual bytes, unknown command fields and absent provenance leave no schema', () => {
  for (const altered of [
    { ...command, expectedSha256: '0'.repeat(64) },
    { ...command, sourceBytes: Buffer.from(`${sourceBytes} `) },
    { ...command, sourceBytes: Buffer.from('{}'), expectedSha256: hash('{}') },
    { ...command, actor: ' ' }, { ...command, reason: '' }, { ...command, approval: true },
  ]) memory(db => {
    assert.throws(() => initializeScopeContractStore(db, altered), /E_SCOPE_CONTRACT/);
    assert.equal(tables(db).length, 0);
  });
  memory(db => assert.throws(() => readScopeContract(db), /no such table/));
});

test('all terminal tables are required, including empty rail tables; missing values and keys fail closed', () => memory(db => {
  initializeScopeContractStore(db, command);
  db.exec('PRAGMA foreign_keys=OFF');
  for (const table of tables(db).map(r => r.name)) {
    db.exec('BEGIN');
    try { db.exec(`DROP TABLE ${quote(table)}`); assert.throws(() => readScopeContract(db), /no such table|E_SCOPE_CONTRACT/); }
    finally { db.exec('ROLLBACK'); }
  }
  for (const sql of [
    'DELETE FROM scope_contract_document_review WHERE sourcePath=(SELECT sourcePath FROM scope_contract_document_review LIMIT 1)',
    "DELETE FROM scope_contract_key_order WHERE object_pointer='' AND ordinal=0",
    'DELETE FROM scope_contract_boundary', 'DELETE FROM scope_contract_rail',
    "DELETE FROM scope_contract_entity_location WHERE entity_id='K001' AND ordinal=0",
  ]) {
    db.exec('BEGIN'); try { db.exec(sql); assert.throws(() => readScopeContract(db), /E_SCOPE_CONTRACT/); } finally { db.exec('ROLLBACK'); }
  }
}));

test('typed mutable domain edits drive reader without changing receipt or existing authority; invalid kinds and types rejected', () => memory(db => {
  initializeScopeContractStore(db, command);
  const receipt = db.prepare('SELECT * FROM scope_contract_receipt').get();
  const mutations = [
    "UPDATE scope_contract_root SET baselineSha256='" + 'f'.repeat(64) + "'",
    "UPDATE scope_contract_boundary SET edition='typed-edition'",
    "UPDATE scope_contract_entity SET basis='typed entity basis',batchId=NULL WHERE id='K001'",
    "UPDATE scope_contract_entity_location SET ref='region:typed-location' WHERE entity_id='K001' AND ordinal=0",
    "UPDATE scope_contract_entity_jurisdiction SET ref='region:typed-jurisdiction' WHERE entity_id='K001' AND ordinal=0",
    "UPDATE scope_contract_document SET basis='typed document basis' WHERE ordinal=0",
    "UPDATE scope_contract_document_review SET reviewedAt='typed-review-date' WHERE sourcePath=(SELECT sourcePath FROM scope_contract_document WHERE review_receipt_is_null=0 ORDER BY ordinal LIMIT 1)",
    "UPDATE scope_contract_disposition SET basis='typed disposition basis' WHERE ordinal=0",
    "UPDATE scope_contract_disposition_target SET target_id='typed-target' WHERE disposition_set='persons' AND disposition_id='K001' AND ordinal=0",
  ];
  mutations.forEach(sql => db.exec(sql));
  const stored = readScopeContract(db);
  assert.equal(stored.baselineSha256, 'f'.repeat(64)); assert.equal(stored.boundarySource.edition, 'typed-edition');
  assert.equal(stored.entities[0].basis, 'typed entity basis'); assert.equal(stored.entities[0].batchId, null);
  assert.equal(stored.entities[0].locationRefs[0], 'region:typed-location'); assert.equal(stored.entities[0].jurisdictionRefs[0], 'region:typed-jurisdiction');
  assert.equal(stored.documents[0].basis, 'typed document basis');
  assert.equal(stored.documents.find(r => r.reviewReceipt !== null).reviewReceipt.reviewedAt, 'typed-review-date');
  assert.equal(stored.dispositions[0].basis, 'typed disposition basis'); assert.equal(stored.dispositions[0].targetIds[0], 'typed-target');
  db.exec("INSERT INTO scope_contract_rail_station VALUES(0,1,'station:typed'); INSERT INTO scope_contract_rail_edge VALUES(0,1,'edge:typed')");
  assert.deepEqual(readScopeContract(db).rail, { stationRefs: ['station:typed'], edgeRefs: ['edge:typed'] });
  assert.deepEqual(db.prepare('SELECT * FROM scope_contract_receipt').get(), receipt);
  for (const sql of [
    "UPDATE scope_contract_entity SET kind='invented'", "UPDATE scope_contract_entity SET status='approved'",
    "UPDATE scope_contract_document SET status='approved'", "UPDATE scope_contract_disposition SET disposition_set='invented'",
    "UPDATE scope_contract_entity SET basis=x'01'", "UPDATE scope_contract_entity SET ordinal='not-an-integer'",
    "UPDATE scope_contract_document SET review_receipt_is_null=2", "UPDATE scope_contract_receipt SET actor='changed'",
  ]) assert.throws(() => db.exec(sql), /constraint|cannot store|immutable/i);
}));

test('late SQL failure and full precommit readback mismatch roll back schema and every write', () => {
  for (const mode of ['sql', 'readback']) memory(db => {
    db.exec('CREATE TABLE existing_authority(id INTEGER PRIMARY KEY,value TEXT NOT NULL) STRICT; INSERT INTO existing_authority VALUES(1,\'untouched\')');
    const before = snapshot(db, ['existing_authority']); let injected = false;
    const wrapper = {
      get isTransaction() { return db.isTransaction; },
      exec(sql) { db.exec(sql); },
      prepare(sql) {
        if (!injected && ((mode === 'sql' && sql.startsWith('INSERT INTO scope_contract_disposition_target'))
          || (mode === 'readback' && sql === 'SELECT * FROM scope_contract_receipt WHERE singleton=1'))) {
          injected = true;
          if (mode === 'sql') throw new Error('injected late SQL failure');
          db.exec("UPDATE scope_contract_root SET baselineSha256='" + '0'.repeat(64) + "'");
        }
        return db.prepare(sql);
      },
    };
    assert.throws(() => initializeScopeContractStore(wrapper, command), mode === 'sql' ? /injected late SQL failure/ : /full precommit round trip mismatch/);
    assert.ok(injected); assert.equal(db.isTransaction, false);
    assert.deepEqual(tables(db).map(r => r.name), ['existing_authority']);
    assert.deepEqual(snapshot(db, ['existing_authority']), before);
  });
});
