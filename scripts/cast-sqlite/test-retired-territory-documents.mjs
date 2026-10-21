import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  RETIRED_TERRITORY_DOCUMENT_HASHES,
  RETIRED_TERRITORY_SOURCE_HASHES,
  initializeRetiredTerritoryDocuments,
  readRetiredTerritoryDocuments,
} from './retired-territory-documents.mjs';

const paths = Object.keys(RETIRED_TERRITORY_SOURCE_HASHES);
const schemaSql = fs.readFileSync(new URL('./retired-territory-documents.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const canonicalDbPath = process.env.WIKI_DOCUMENT_DB ?? new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bytesOf = logicalPath => new Uint8Array(readSourceArchive(logicalPath, RETIRED_TERRITORY_SOURCE_HASHES[logicalPath]));
const parsed = logicalPath => JSON.parse(new TextDecoder().decode(bytesOf(logicalPath)));
const sources = Object.fromEntries(paths.map(logicalPath => [logicalPath, {
  bytes: bytesOf(logicalPath),
  expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[logicalPath],
}]));
const actor = 'unit-test';
const reason = 'Exact existing source normalization';
const multiple = { schemaSql, sources, actor, reason };
const rejected = fn => assert.throws(fn, { code: 'E_RETIRED_TERRITORY_DOCUMENTS' });
const expectedCounts = { imports: 2, controls: 1, islands: 1, keys: 6, totalRows: 10 };
const tables = {
  retired_territory_documents_import: 2,
  retired_territory_documents_key: 6,
  retired_territory_documents_control: 1,
  retired_territory_documents_island: 1,
};

function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeRetiredTerritoryDocuments(db, multiple);
  return db;
}
const read = (db, logicalPath) => readRetiredTerritoryDocuments(db, {
  logicalPath, expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[logicalPath],
});

test('the two retired shells have fixed byte and ordered document hashes', () => {
  assert.deepEqual(paths, [
    'lore/regions/outside-control-2126.json',
    'lore/regions/outside-island-occupation.json',
  ]);
  assert.equal(sources[paths[0]].bytes.length, 63);
  assert.equal(sources[paths[1]].bytes.length, 211);
  for (const logicalPath of paths) {
    assert.equal(hash(sources[logicalPath].bytes), RETIRED_TERRITORY_SOURCE_HASHES[logicalPath]);
    assert.equal(hash(JSON.stringify(parsed(logicalPath))), RETIRED_TERRITORY_DOCUMENT_HASHES[logicalPath]);
  }
  assert.deepEqual(parsed(paths[0]), { schema: 'outside-control-2126.v3', assignments: [] });
  assert.equal(Object.hasOwn(parsed(paths[0]), 'basis'), false);
  assert.deepEqual(parsed(paths[1]), {
    schema: 'outside-island-occupation.v1',
    geometrySource: 'public/outside-admin-units.json',
    geometrySourceSha256: 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f',
    units: [],
  });
  assert.equal(Object.hasOwn(parsed(paths[1]), 'openingDecision'), false);
});

test('multiple-source import stores both shells and reconstructs complete serialized order', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeRetiredTerritoryDocuments(db, multiple), expectedCounts);
    for (const logicalPath of paths) {
      const document = read(db, logicalPath);
      assert.equal(JSON.stringify(document), JSON.stringify(parsed(logicalPath)));
      assert.deepEqual(document, parsed(logicalPath));
    }
    assert.deepEqual(Object.fromEntries(Object.keys(tables).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), tables);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(db.prepare('SELECT logical_path, source_role FROM retired_territory_documents_import ORDER BY logical_path').all().map(row => ({
      logical_path: row.logical_path, source_role: row.source_role,
    })), paths.map(logicalPath => ({ logical_path: logicalPath, source_role: 'retired-current' })));
    const before = db.prepare('SELECT count(*) AS n FROM retired_territory_documents_import').get().n;
    rejected(() => initializeRetiredTerritoryDocuments(db, multiple));
    assert.equal(db.prepare('SELECT count(*) AS n FROM retired_territory_documents_import').get().n, before);
  } finally { db.close(); }
});

test('single-source API imports and reads one shell by its fixed hash', () => {
  for (const logicalPath of paths) {
    const db = new DatabaseSync(':memory:');
    try {
      const counts = initializeRetiredTerritoryDocuments(db, {
        schemaSql, sourceBytes: sources[logicalPath].bytes, expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[logicalPath], actor, reason,
      });
      assert.equal(counts.imports, 1);
      assert.equal(counts.totalRows, logicalPath === paths[0] ? 4 : 6);
      const document = readRetiredTerritoryDocuments(db, { expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[logicalPath] });
      assert.equal(JSON.stringify(document), JSON.stringify(parsed(logicalPath)));
      rejected(() => readRetiredTerritoryDocuments(db, { expectedSourceHash: '0'.repeat(64) }));
      rejected(() => readRetiredTerritoryDocuments(db, {
        logicalPath: paths.find(path => path !== logicalPath),
        expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[logicalPath],
      }));
    } finally { db.close(); }
  }
});

test('wrong hash, unknown fields, mixed APIs, and partial path maps are rejected before commit', () => {
  const db = new DatabaseSync(':memory:');
  try {
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sourceBytes: sources[paths[0]].bytes, expectedSourceHash: '0'.repeat(64), actor, reason,
    }));
    const tampered = new Uint8Array(sources[paths[0]].bytes.length + 1);
    tampered.set(sources[paths[0]].bytes);
    tampered[tampered.length - 1] = 32;
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sourceBytes: tampered, expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[0]], actor, reason,
    }));
    const unknown = parsed(paths[0]);
    unknown.status = 'retired-current';
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sourceBytes: new TextEncoder().encode(JSON.stringify(unknown)), expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[0]], actor, reason,
    }));
    const missing = parsed(paths[1]);
    delete missing.geometrySource;
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sourceBytes: new TextEncoder().encode(JSON.stringify(missing)), expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[1]], actor, reason,
    }));
    const withBasis = parsed(paths[0]);
    withBasis.basis = 'not retired';
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sourceBytes: new TextEncoder().encode(JSON.stringify(withBasis)), expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[0]], actor, reason,
    }));
    rejected(() => initializeRetiredTerritoryDocuments(db, { ...multiple, sources: { [paths[0]]: sources[paths[0]] } }));
    rejected(() => initializeRetiredTerritoryDocuments(db, {
      schemaSql, sources, sourceBytes: sources[paths[0]].bytes, expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[0]], actor, reason,
    }));
    rejected(() => initializeRetiredTerritoryDocuments(db, { schemaSql, actor: ' ', reason, sources }));
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'retired_territory_documents_%'").get().n, 0);
  } finally { db.close(); }
});

test('a failing write rolls back the whole multi-source transaction', () => {
  const db = new DatabaseSync(':memory:');
  const broken = schemaSql.replace(
    'CREATE TABLE retired_territory_documents_island',
    'CREATE TABLE retired_territory_documents_island_removed',
  );
  try {
    assert.throws(() => initializeRetiredTerritoryDocuments(db, { ...multiple, schemaSql: broken }));
    assert.equal(db.isTransaction, false);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'retired_territory_documents_%'").get().n, 0);
  } finally { db.close(); }
});

for (const [table, count] of Object.entries(tables)) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
        if (mode === 'missing') {
          db.exec('PRAGMA foreign_keys=OFF');
          const scope = columns.includes('logical_path')
            ? `WHERE rowid IN (SELECT max(rowid) FROM ${table} GROUP BY logical_path)`
            : `WHERE rowid=(SELECT max(rowid) FROM ${table})`;
          db.exec(`DELETE FROM ${table} ${scope}`);
        }
        if (mode === 'changed') {
          const mutable = {
            retired_territory_documents_import: 'actor',
            retired_territory_documents_key: 'key',
            retired_territory_documents_control: 'schema',
            retired_territory_documents_island: 'geometry_source',
          }[table];
          db.exec(`UPDATE ${table} SET "${mutable}"="${mutable}" || '-changed'`);
        }
        if (mode === 'extra') {
          const values = columns.map(name => {
            if (name === 'logical_path' && table !== 'retired_territory_documents_key') return `'extra.json'`;
            if (name === 'ordinal') return 'ordinal+10';
            if (name === 'key' || name === 'object_path') return `'-extra-' || ${name}`;
            return name;
          });
          db.exec('PRAGMA foreign_keys=OFF');
          db.exec(`INSERT INTO ${table} (${columns.map(name => `"${name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        const owned = mode === 'changed' && table.endsWith('_control') ? [paths[0]]
          : mode === 'changed' && table.endsWith('_island') ? [paths[1]]
            : paths;
        const survived = [];
        for (const logicalPath of owned) {
          try { read(db, logicalPath); survived.push(logicalPath); }
          catch (error) { if (error.code !== 'E_RETIRED_TERRITORY_DOCUMENTS') throw error; }
        }
        assert.deepEqual(survived, []);
        assert.ok(count > 0);
      } finally { db.close(); }
    });
  }
}

test('runtime reconstruction is SELECT-only with filesystem, archive, and JSON.parse denied', () => {
  const directory = fs.mkdtempSync(new URL('../../.vitest/retired-territory-runtime-', import.meta.url).pathname);
  const dbPath = `${directory}/document.sqlite`;
  const db = new DatabaseSync(dbPath);
  try {
    initializeRetiredTerritoryDocuments(db, multiple);
  } finally { db.close(); }
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { DatabaseSync } from 'node:sqlite';
    import { readRetiredTerritoryDocuments, RETIRED_TERRITORY_SOURCE_HASHES } from ${JSON.stringify(new URL('./retired-territory-documents.mjs', import.meta.url).href)};
    const deny = () => { throw new Error('runtime source access forbidden'); };
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open','readdirSync','statSync']) fs[key] = deny;
    for (const key of ['readFile','open','readdir','stat']) fsp[key] = deny;
    JSON.parse = deny;
    globalThis.fetch = deny;
    const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
    const guarded = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /archive|source_file|json_/i); return db.prepare(sql); }, exec: deny };
    const paths = Object.keys(RETIRED_TERRITORY_SOURCE_HASHES);
    const control = readRetiredTerritoryDocuments(guarded, { logicalPath: paths[0], expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[0]] });
    const islands = readRetiredTerritoryDocuments(guarded, { logicalPath: paths[1], expectedSourceHash: RETIRED_TERRITORY_SOURCE_HASHES[paths[1]] });
    assert.deepEqual(control, { schema: 'outside-control-2126.v3', assignments: [] });
    assert.deepEqual(islands, {
      schema: 'outside-island-occupation.v1',
      geometrySource: 'public/outside-admin-units.json',
      geometrySourceSha256: 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f',
      units: [],
    });
    console.log('RETIRED_TERRITORY_RUNTIME_EXACT');
    db.close();
  `], { encoding: 'utf8', timeout: 30000 });
  fs.rmSync(directory, { recursive: true, force: true });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /RETIRED_TERRITORY_RUNTIME_EXACT/u);
});

test('retired territory tables coexist with the canonical schema and the canonical database', () => {
  const inventory = new DatabaseSync(':memory:');
  const backup = fs.mkdtempSync(new URL('../../.vitest/retired-territory-coexistence-', import.meta.url).pathname);
  const copyPath = `${backup}/wiki-cast.sqlite`;
  try {
    const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi)].map(match => match[1]).sort();
    assert.equal(declared.length, 44);
    assert.equal(declared.some(name => name.startsWith('retired_territory_documents_')), false);
    inventory.exec(canonicalSchemaSql);
    const canonicalNames = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(canonicalNames, declared);
    initializeRetiredTerritoryDocuments(inventory, multiple);
    const combined = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(combined.filter(name => !name.startsWith('retired_territory_documents_')), canonicalNames);
    assert.deepEqual(combined.filter(name => name.startsWith('retired_territory_documents_')).sort(), Object.keys(tables).sort());
    assert.equal(JSON.stringify(read(inventory, paths[0])), JSON.stringify(parsed(paths[0])));
    assert.equal(inventory.prepare('SELECT count(*) AS n FROM person').get().n, 0);

    fs.copyFileSync(canonicalDbPath, copyPath);
    const canonical = new DatabaseSync(copyPath);
    try {
      const before = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.ok(before.length >= declared.length);
      assert.deepEqual(before.filter(name => name.startsWith('retired_territory_documents_')).sort(), Object.keys(tables).sort());
      for (const name of canonicalNames) assert.equal(before.includes(name), true, name);
      const personCount = canonical.prepare('SELECT count(*) AS n FROM person').get().n;
      assert.ok(personCount > 0);
      assert.deepEqual(Object.fromEntries(Object.keys(tables).map(table => [table, canonical.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), tables);
      for (const logicalPath of paths) {
        assert.equal(JSON.stringify(read(canonical, logicalPath)), JSON.stringify(parsed(logicalPath)));
      }
      const after = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(after, before);
      assert.equal(canonical.prepare('SELECT count(*) AS n FROM person').get().n, personCount);
      assert.equal(JSON.stringify(read(canonical, paths[1])), JSON.stringify(parsed(paths[1])));
      assert.equal(canonical.prepare('PRAGMA foreign_key_check').all().length, 0);
    } finally { canonical.close(); }
  } finally {
    inventory.close();
    fs.rmSync(backup, { recursive: true, force: true });
  }
});
