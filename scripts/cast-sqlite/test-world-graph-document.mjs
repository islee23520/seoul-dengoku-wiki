import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  WORLD_GRAPH_DOCUMENT_HASH,
  WORLD_GRAPH_SOURCE_BYTE_LENGTH,
  WORLD_GRAPH_SOURCE_HASH,
  WORLD_GRAPH_TABLES,
  initializeWorldGraphDocument,
  readWorldGraphDocument,
} from './world-graph-document.mjs';

const sourceBytes = readFileSync(new URL('../../snapshots/build-inputs/SeoulWorldGraph.json', import.meta.url));
const schemaSql = readFileSync(new URL('./world-graph-document.sql', import.meta.url), 'utf8');
const canonicalSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const original = JSON.parse(sourceBytes.toString('utf8'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  return db;
}

function options(patch = {}) {
  return {
    schemaSql,
    sourceBytes,
    expectedSourceHash: WORLD_GRAPH_SOURCE_HASH,
    actor: 'census-writer',
    reason: 'preserve the supplied world graph bytes',
    ...patch,
  };
}

function load(db = database(), patch = {}) {
  return { db, document: initializeWorldGraphDocument(db, options(patch)) };
}

function throws(fn, code) {
  assert.throws(fn, (error) => error && error.code === code);
}

test('actual source bytes and ordered document pins are independent constants', () => {
  assert.equal(sourceBytes.length, WORLD_GRAPH_SOURCE_BYTE_LENGTH);
  assert.equal(sha(sourceBytes), WORLD_GRAPH_SOURCE_HASH);
  assert.equal(sha(JSON.stringify(original)), WORLD_GRAPH_DOCUMENT_HASH);
  assert.notEqual(WORLD_GRAPH_SOURCE_HASH, WORLD_GRAPH_DOCUMENT_HASH);
  assert.deepEqual(
    [original.districts.length, original.stations.length, original.edges.length, Object.keys(original.aliases).length],
    [25, 334, 409, 3],
  );
});

test('full actual source serializes and rereads in original order', () => {
  const { db, document } = load();
  assert.equal(JSON.stringify(document), JSON.stringify(original));
  assert.equal(JSON.stringify(readWorldGraphDocument(db, { expectedSourceHash: WORLD_GRAPH_SOURCE_HASH })), JSON.stringify(original));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  const counts = Object.fromEntries(WORLD_GRAPH_TABLES.map((table) => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n]));
  assert.equal(counts.world_graph_document_district, 25);
  assert.equal(counts.world_graph_document_station, 334);
  assert.equal(counts.world_graph_document_edge, 409);
  assert.equal(counts.world_graph_document_alias, 3);
  assert.equal(counts.world_graph_document_replacement, 24);
  assert.equal(counts.world_graph_document_replacement_chain, 86);
  assert.equal(counts.world_graph_document_replacement_code, 86);
  assert.equal(counts.world_graph_document_excluded, 5);
  assert.equal(counts.world_graph_document_excluded_missing, 1);
  assert.equal(counts.world_graph_document_excluded_endpoint, 10);
  assert.equal(counts.world_graph_document_excluded_evidence_ref, 1);
  assert.equal(counts.world_graph_document_excluded_skipped, 1);
  assert.equal(counts.world_graph_document_excluded_skipped_code, 3);
  assert.equal(counts.world_graph_document_hub, 94);
  assert.equal(counts.world_graph_document_hub_official_code, 195);
  assert.equal(counts.world_graph_document_hub_permanent_id, 116);
  assert.equal(counts.world_graph_document_hub_line_id, 198);
  assert.equal(counts.world_graph_document_hub_evidence, 234);
  const outside = document.stations.filter((station) => station.id === '석수' || station.id === '광명사거리');
  assert.deepEqual(outside.map((station) => [station.id, station.district]), [['광명사거리', '구로구'], ['석수', '금천구']]);
  assert.equal(document.source.railAdjacency.excluded[1].missing[0], 'official:2749');
  assert.equal(Object.hasOwn(document.source.railAdjacency.excluded[0], 'missing'), false);
  assert.equal(Object.hasOwn(document.source.railAdjacency.excluded[1], 'reason'), false);
  db.close();
});

test('strict unknown and missing fields fail before any write', () => {
  const documents = [];
  const unknown = structuredClone(original);
  unknown.stations[0].extra = 'not in the source contract';
  documents.push(unknown);
  const missing = structuredClone(original);
  delete missing.stations[0].lon;
  documents.push(missing);
  const nullName = structuredClone(original);
  nullName.stations[0].nameEn = null;
  documents.push(nullName);
  const swapped = structuredClone(original);
  const first = swapped.stations[0];
  swapped.stations[0] = {
    nameKo: first.nameKo, id: first.id, nameEn: first.nameEn, district: first.district, lat: first.lat, lon: first.lon,
  };
  documents.push(swapped);
  for (const document of documents) {
    const source = Buffer.from(JSON.stringify(document));
    const db = database();
    throws(() => initializeWorldGraphDocument(db, options({ sourceBytes: source, expectedSourceHash: sha(source) })), 'E_WORLD_GRAPH_SHAPE');
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name LIKE 'world_graph_document_%'").get().n, 0);
    db.close();
  }
  throws(() => load(database(), { sourceBytes: Buffer.from('{'), expectedSourceHash: sha(Buffer.from('{')) }), 'E_WORLD_GRAPH_SHAPE');
  throws(() => load(database(), { actor: '   ' }), 'E_WORLD_GRAPH_AUDIT');
  throws(() => load(database(), { reason: '' }), 'E_WORLD_GRAPH_AUDIT');
  throws(() => load(database(), { schemaSql: 'SELECT 1' }), 'E_WORLD_GRAPH_SCHEMA');
  throws(() => load(database(), { sourceBytes: 'not-bytes' }), 'E_WORLD_GRAPH_BYTES');
  throws(() => load(database(), { expectedSourceHash: 'a'.repeat(64) }), 'E_WORLD_GRAPH_PIN');
  throws(() => initializeWorldGraphDocument(database(), null), 'E_WORLD_GRAPH_OPTIONS');
});

test('changed source bytes and a wrong caller pin are rejected independently', () => {
  const changed = Buffer.from(sourceBytes);
  changed[changed.length - 2] = changed[changed.length - 2] === 0x20 ? 0x21 : 0x20;
  assert.notEqual(sha(changed), WORLD_GRAPH_SOURCE_HASH);
  throws(() => load(database(), { sourceBytes: changed }), 'E_WORLD_GRAPH_PIN');
  throws(() => load(database(), { expectedSourceHash: sha(changed) }), 'E_WORLD_GRAPH_PIN');
  const db = database();
  assert.throws(() => readWorldGraphDocument(db, { expectedSourceHash: 'b'.repeat(64) }), (error) => error.code === 'E_WORLD_GRAPH_PIN');
  db.close();
});

test('missing, changed, and extra rows and ordinal gaps fail closed on read', () => {
  const cases = [
    ['missing station', (db) => db.prepare('DELETE FROM world_graph_document_station WHERE ordinal = 10').run()],
    ['changed district', (db) => db.prepare("UPDATE world_graph_document_district SET name = '없는구' WHERE ordinal = 0").run()],
    ['changed REAL latitude only', (db) => db.prepare('UPDATE world_graph_document_station SET lat=1.25 WHERE ordinal=0').run()],
    ['changed REAL longitude only', (db) => db.prepare('UPDATE world_graph_document_station SET lon=1.25 WHERE ordinal=0').run()],
    ['changed latitude text only', (db) => db.prepare("UPDATE world_graph_document_station SET lat_text='1.25' WHERE ordinal=0").run()],
    ['extra edge', (db) => db.prepare('INSERT INTO world_graph_document_edge(ordinal, endpoint_a, endpoint_b) VALUES (409, ?, ?)').run('A', 'B')],
    ['ordinal gap', (db) => db.prepare('UPDATE world_graph_document_alias SET ordinal = 4 WHERE ordinal = 2').run()],
    ['hub evidence gap', (db) => db.prepare('DELETE FROM world_graph_document_hub_evidence WHERE hub_ordinal = 0 AND ordinal = 0').run()],
    ['reason presence lie', (db) => db.prepare("UPDATE world_graph_document_excluded SET reason_presence = 'missing', reason = NULL WHERE ordinal = 0").run()],
  ];
  for (const [name, mutate] of cases) {
    const { db } = load();
    mutate(db);
    assert.throws(() => readWorldGraphDocument(db, { expectedSourceHash: WORLD_GRAPH_SOURCE_HASH }), (error) => {
      assert.ok(['E_WORLD_GRAPH_INTEGRITY', 'E_WORLD_GRAPH_DIGEST'].includes(error.code), `${name}: ${error.code}`);
      return true;
    }, name);
    db.close();
  }
});

test('simultaneous typed data and stored digest substitution is rejected', () => {
  const { db } = load();
  const before = db.prepare('SELECT lat, lat_text, name_ko FROM world_graph_document_station WHERE ordinal = 0').get();
  db.prepare('UPDATE world_graph_document_station SET lat = 1.25, lat_text = ? WHERE ordinal = 0').run('1.25');
  db.prepare('UPDATE world_graph_document_import SET document_sha256 = ?').run('c'.repeat(64));
  assert.throws(() => readWorldGraphDocument(db, { expectedSourceHash: WORLD_GRAPH_SOURCE_HASH }), (error) => error.code === 'E_WORLD_GRAPH_INTEGRITY');
  const stored = db.prepare('SELECT lat, lat_text FROM world_graph_document_station WHERE ordinal = 0').get();
  assert.equal(stored.lat, 1.25);
  assert.equal(stored.lat_text, '1.25');
  assert.notEqual(stored.lat_text, before.lat_text);
  assert.equal(db.prepare('SELECT document_sha256 FROM world_graph_document_import').get().document_sha256, 'c'.repeat(64));
  db.close();
});

test('a failed initialization rolls back and leaves no partial document', () => {
  const db = database();
  db.exec('BEGIN');
  db.exec('CREATE TABLE sentinel(value TEXT)');
  db.prepare('INSERT INTO sentinel(value) VALUES (?)').run('kept');
  const blocked = schemaSql.replace(
    'CREATE TABLE world_graph_document_station (',
    'CREATE TABLE world_graph_document_station (blocked INTEGER NOT NULL,',
  );
  assert.throws(() => initializeWorldGraphDocument(db, options({ schemaSql: blocked })), (error) => {
    assert.equal(error.code, 'ERR_SQLITE_ERROR');
    assert.match(error.message, /NOT NULL/);
    return true;
  });
  assert.equal(db.isTransaction, true);
  assert.equal(db.prepare('SELECT value FROM sentinel').get().value, 'kept');
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name LIKE 'world_graph_document_%'").get().n, 0);
  db.exec('ROLLBACK');
  db.close();

  const inner = database();
  throws(() => initializeWorldGraphDocument(inner, options({ schemaSql: 'SELECT 1' })), 'E_WORLD_GRAPH_SCHEMA');
  assert.equal(inner.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name LIKE 'world_graph_document_%'").get().n, 0);
  inner.close();
});

test('world graph tables coexist with the canonical cast schema', () => {
  const db = database();
  db.exec(canonicalSql);
  const document = initializeWorldGraphDocument(db, options());
  assert.equal(document.stations.length, 334);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'person'").get().n, 1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name LIKE 'world_graph_document_%'").get().n, WORLD_GRAPH_TABLES.length);
  const overlap = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name LIKE 'world_graph_document_%' AND name NOT LIKE 'world_graph_document_%'
  `).all();
  assert.deepEqual(overlap, []);
  db.close();
});

test('runtime read does not touch files, archives, or JSON.parse', async () => {
  const { db } = load();
  const payload = db.serialize();
  db.close();
  const { writeFileSync, mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const directory = mkdtempSync(join(tmpdir(), 'world-graph-denial-'));
  const databasePath = join(directory, 'graph.sqlite');
  const hookPath = join(directory, 'deny-file-parse.mjs');
  writeFileSync(databasePath, payload);
  writeFileSync(hookPath, [
    'const denied = new Set(["node:fs", "node:fs/promises", "fs", "fs/promises"]);',
    'export async function resolve(specifier, context, next) {',
    '  if (denied.has(specifier)) throw new Error("runtime file denied: " + specifier);',
    '  return next(specifier, context);',
    '}',
    'export async function load(url, context, next) {',
    '  const loaded = await next(url, context);',
    '  if (!url.endsWith("/world-graph-document.mjs")) return loaded;',
    '  const source = "function deniedJsonParse() { throw new Error(\\"runtime parser denied\\"); }\\n" + String(loaded.source).replace("JSON.parse(", "deniedJsonParse(");',
    '  return { ...loaded, source };',
    '}',
  ].join('\n'));
  const { spawnSync } = await import('node:child_process');
  const script = [
    'import { DatabaseSync } from "node:sqlite";',
    'import { readWorldGraphDocument } from ' + JSON.stringify(new URL('./world-graph-document.mjs', import.meta.url).href) + ';',
    'const db = new DatabaseSync(' + JSON.stringify(databasePath) + ', { readOnly: true });',
    'db.exec("PRAGMA foreign_keys=ON");',
    'const document = readWorldGraphDocument(db, { expectedSourceHash: ' + JSON.stringify(WORLD_GRAPH_SOURCE_HASH) + ' });',
    'if (document.edges.length !== 409 || document.stations.length !== 334) throw new Error("reconstructed counts drifted");',
    'db.close();',
  ].join('\n');
  const child = spawnSync(process.execPath, ['--experimental-strip-types', '--loader', pathToFileURL(hookPath).href, '--input-type=module', '-e', script], {
    encoding: 'utf8',
    cwd: new URL('../..', import.meta.url).pathname,
  });
  rmSync(directory, { recursive: true, force: true });
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assert.doesNotMatch(child.stderr, /runtime file denied|deniedJsonParse/);
});

test('sqlite rejects a coordinate text that is not the stored REAL rendering contract at read', () => {
  const { db } = load();
  db.prepare("UPDATE world_graph_document_station SET lat_text = '37.64934080' WHERE ordinal = 0").run();
  assert.throws(() => readWorldGraphDocument(db, { expectedSourceHash: WORLD_GRAPH_SOURCE_HASH }), (error) => error.code === 'E_WORLD_GRAPH_INTEGRITY' || error.code === 'E_WORLD_GRAPH_DIGEST');
  db.close();
});
