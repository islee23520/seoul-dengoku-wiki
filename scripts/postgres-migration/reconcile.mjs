#!/usr/bin/env node
// reconcile.mjs — cast:pg-verify: 정본 아카이브(SQLite) ↔ PostgreSQL 데이터 대사 (Todo 5).
// 독립 검증 CLI다(테스트 프레임워크 아님). node >= 24.15(node:sqlite bigint 판독).
//
// 검증 체인:
//  (1) 결속(binding): 아카이브 sha256 == inventory sha256 == metadata.json source_sha256
//  (2) 테이블별 행수: SQLite 아카이브 ↔ PG wiki 스키마(전체 원천 1006테이블)
//  (3) 테이블별 내용 sha256: PK 정렬 typed 직렬화 스트리밍(정수 십진법·불린 t/f·
//      bytea 원시 옥텟·REAL IEEE754 비트패턴 16진·NULL/빈문자열 구분 센티넬)
//  (4) 골든 스폿: source_record 원천별 수, source_file 길이+sha256,
//      boundary_geometry_point 도형별 수, person 명부 투영 해시
//  (5) PG FK 신규 스윕: 제약별 고아행 수 = 0
//  (6) wiki.meta 식별: code_commit/source_sha256/schema_version/migration_id == metadata.json
// 보고서 JSON + 표준출력 요약. 전 통과 시에만 exit 0, 아니면 exit 1(첫 실패 지목).
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { pipeline } from 'node:stream/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCHEMA_DIR = join(ROOT, 'scripts/postgres-migration/schema-pg');
const DEFAULT_DB = '/Users/ilseoblee/wiki-archives/wiki-cast-a3c3edc3.sqlite';
const DEFAULT_PG = 'postgresql://localhost:5432/seoul';
const PG_FETCH_BATCH = 2000;      // 일반 테이블 FETCH 크기
const PG_FETCH_BATCH_BLOB = 50;   // BLOB 열 포함 테이블(source_file ~86MB 총량) 메모리 상한
const SQLITE_SOURCE_SCHEMA = 'wiki'; // 원천 비교 대상 PG 스키마(wiki.meta는 제외, BY VALUE 비교)

const q = (s) => `"${String(s).replaceAll('"', '""')}"`;
const fail = (msg) => { throw new Error(msg); };

function options() {
  const args = process.argv.slice(2);
  const get = (key, fallback) => {
    const i = args.indexOf(key);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
  };
  const tablesArg = get('--tables', null);
  const out = get('--out', null);
  return {
    db: resolve(get('--db', DEFAULT_DB)),
    pg: get('--pg', DEFAULT_PG),
    tables: tablesArg ? tablesArg.split(',').map((s) => s.trim()).filter(Boolean) : null,
    out: out ? resolve(out) : null,
    batch: Math.max(1, Number(get('--batch', PG_FETCH_BATCH)) || PG_FETCH_BATCH),
  };
}

async function sha256File(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), async function* (source) { for await (const chunk of source) hash.update(chunk); });
  return hash.digest('hex');
}

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch { return '[unparsed connection string]'; }
}

const floatBuf = new ArrayBuffer(8);
const floatView = new DataView(floatBuf);
function floatHex(n) {
  // IEEE 754 비트패턴 16진: 양쪽이 같은 비트면 같은 값이다(-0.0/지수 표현 차이까지 구분).
  floatView.setFloat64(0, n, false);
  const hex = floatView.getBigUint64(0, false).toString(16);
  return '0'.repeat(16 - hex.length) + hex;
}

// typed 직렬화. 직렬화 규칙은 load.mjs의 COPY 직렬화(pgText)와 동일하게 맞춘다:
// SQLite 동적 타입 저장(예: TEXT 열의 정수 저장)은 적재 시 String() 강제로 PG에 반영됐으므로
// 대사도 같은 정규화를 적용해 "PG가 실제로 보유한 값"과 비교한다.
class RowEncoder {
  constructor(columns) { this.columns = columns; }

  feedSqlite(hash, row, anomalies) {
    for (const col of this.columns) {
      const v = row[col.name];
      if (v === null || v === undefined) { hash.update('n'); continue; } // NULL 센티넬(빈 문자열과 구분)
      switch (col.sqlite_type) {
        case 'INTEGER':
          if (typeof v !== 'bigint') this.note(anomalies, col.name, v);
          hash.update('I' + (typeof v === 'bigint' ? v : BigInt(v)).toString(10));
          break;
        case 'REAL':
          if (typeof v !== 'number') this.note(anomalies, col.name, v);
          hash.update('R' + floatHex(typeof v === 'bigint' ? Number(v) : v));
          break;
        case 'BLOB':
          if (!(v instanceof Uint8Array)) this.note(anomalies, col.name, v);
          if (v instanceof Uint8Array) { hash.update('B' + v.byteLength + ':'); hash.update(v); }
          else { const b = Buffer.from(String(v), 'utf8'); hash.update('B' + b.length + ':'); hash.update(b); }
          break;
        default: { // TEXT
          if (typeof v !== 'string') this.note(anomalies, col.name, v);
          const s = v instanceof Uint8Array
            ? '\\x' + Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex') // load.mjs pgText 규칙
            : String(v);
          hash.update('T' + Buffer.byteLength(s, 'utf8') + ':');
          hash.update(s, 'utf8');
        }
      }
    }
    hash.update('\n');
  }

  feedPg(hash, row) {
    for (const col of this.columns) {
      const v = row[col.name];
      if (v === null || v === undefined) { hash.update('n'); continue; }
      switch (col.sqlite_type) {
        case 'INTEGER': hash.update('I' + BigInt(v).toString(10)); break;
        case 'REAL': hash.update('R' + floatHex(typeof v === 'number' ? v : Number(v))); break;
        case 'BLOB': hash.update('B' + v.length + ':'); hash.update(v); break;
        default: { // TEXT / boolean(t/f)
          if (typeof v === 'boolean') { hash.update(v ? 't' : 'f'); break; }
          const s = String(v);
          hash.update('T' + Buffer.byteLength(s, 'utf8') + ':');
          hash.update(s, 'utf8');
        }
      }
    }
    hash.update('\n');
  }

  note(anomalies, colName) {
    if (!anomalies) return;
    anomalies[colName] = (anomalies[colName] || 0) + 1;
  }
}

// 정렬 키: SQLite BINARY(바이트 비교) == PG COLLATE "C". NULL은 양쪽 모두 NULLS FIRST로 통일.
function orderSqlite(keys) {
  return keys.map((k) => `${q(k)} ASC NULLS FIRST`).join(', ');
}
function orderPg(columns, keys) {
  return keys.map((k) => {
    const col = columns.find((c) => c.name === k);
    const collate = col && col.sqlite_type === 'TEXT' ? ' COLLATE "C"' : '';
    return `${q(k)}${collate} ASC NULLS FIRST`;
  }).join(', ');
}

function orderKeysFor(table) {
  // PK가 없는 테이블(10종 history)은 전체 열 정렬로 다중집합 비교한다.
  return table.primary_key && table.primary_key.length > 0 ? table.primary_key : table.columns.map((c) => c.name);
}

function sqliteCount(db, name) {
  return Number(db.prepare(`SELECT count(*) AS n FROM ${q(name)}`).get().n);
}

function sqliteTableHash(db, table, anomalies) {
  const keys = orderKeysFor(table);
  const select = table.columns.map((c) => q(c.name)).join(', ');
  const stmt = db.prepare(`SELECT ${select} FROM ${q(table.name)} ORDER BY ${orderSqlite(keys)}`);
  stmt.setReadBigInts(true); // 64비트 정수 보존
  const enc = new RowEncoder(table.columns);
  const hash = createHash('sha256');
  let rows = 0;
  for (const row of stmt.iterate()) { enc.feedSqlite(hash, row, anomalies); rows++; } // 커서 스트리밍(전체 구체화 없음)
  return { sha256: hash.digest('hex'), rows };
}

async function pgTableHash(client, table, batch) {
  const keys = orderKeysFor(table);
  const select = table.columns.map((c) => q(c.name)).join(', ');
  const hasBlob = table.columns.some((c) => c.sqlite_type === 'BLOB');
  const fetchN = hasBlob ? Math.min(batch, PG_FETCH_BATCH_BLOB) : batch;
  const enc = new RowEncoder(table.columns);
  const hash = createHash('sha256');
  let rows = 0;
  await client.query(`DECLARE reconcile_cur NO SCROLL CURSOR FOR SELECT ${select} FROM ${SQLITE_SOURCE_SCHEMA}.${q(table.pg_name)} ORDER BY ${orderPg(table.columns, keys)}`);
  try {
    for (;;) {
      const res = await client.query(`FETCH ${fetchN} FROM reconcile_cur`);
      if (res.rows.length === 0) break;
      for (const row of res.rows) enc.feedPg(hash, row);
      rows += res.rows.length;
      if (res.rows.length < fetchN) break;
    }
  } finally {
    await client.query('CLOSE reconcile_cur').catch(() => {});
  }
  return { sha256: hash.digest('hex'), rows };
}

async function pgCount(client, pgName) {
  const res = await client.query(`SELECT count(*) AS n FROM ${SQLITE_SOURCE_SCHEMA}.${q(pgName)}`);
  return Number(res.rows[0].n);
}

// ---- 골든 스푿 -----------------------------------------------------------------
function mapEntries(rows, keyName) {
  return rows.map((r) => [String(r[keyName]), Number(r.n)]);
}

async function goldenSpots(db, client, log) {
  const spots = {};
  const cmpCounts = (label, sqliteRows, pgRows) => {
    const a = mapEntries(sqliteRows, label.key);
    const b = mapEntries(pgRows.rows, label.key);
    const bad = [];
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const [ka, va] = a[i] || ['<missing>', -1];
      const [kb, vb] = b[i] || ['<missing>', -1];
      if (ka !== kb || va !== vb) bad.push({ sqlite: { [ka]: va }, pg: { [kb]: vb } });
    }
    return { ok: bad.length === 0, groups: a.length, sqlite_groups: a.length, pg_groups: b.length, mismatches: bad.slice(0, 20), per_group: a };
  };

  // (a) source_record 원천별 행수
  spots.source_record_per_source = cmpCounts(
    { key: 'source_id' },
    db.prepare('SELECT source_id, count(*) AS n FROM source_record GROUP BY source_id ORDER BY source_id ASC NULLS FIRST').all(),
    await client.query('SELECT source_id, count(*) AS n FROM wiki.source_record GROUP BY source_id ORDER BY source_id ASC NULLS FIRST'),
  );

  // (b) source_file: 파일별 octet_length + sha256(byte_length 열과 실측 옥텟 일치도 함께 검증)
  const sfSQLite = db.prepare('SELECT logical_path, sha256, byte_length, length(raw_bytes) AS octets FROM source_file ORDER BY logical_path ASC NULLS FIRST').all();
  const sfPg = (await client.query(`SELECT logical_path, sha256, byte_length, octet_length(raw_bytes) AS octets FROM wiki.source_file ORDER BY logical_path COLLATE "C" ASC NULLS FIRST`)).rows;
  const sfBad = [];
  const files = [];
  for (let i = 0; i < Math.max(sfSQLite.length, sfPg.length); i++) {
    const a = sfSQLite[i];
    const b = sfPg[i];
    if (!a || !b) { sfBad.push({ sqlite: a || null, pg: b || null }); continue; }
    const entry = { logical_path: a.logical_path, sha256: a.sha256, octets: Number(a.octets) };
    files.push(entry);
    if (a.logical_path !== b.logical_path || a.sha256 !== b.sha256
      || Number(a.byte_length) !== Number(b.byte_length) || Number(a.octets) !== Number(b.octets)
      || Number(a.byte_length) !== Number(a.octets)) {
      sfBad.push({ sqlite: { logical_path: a.logical_path, sha256: a.sha256, byte_length: Number(a.byte_length), octets: Number(a.octets) }, pg: { logical_path: b.logical_path, sha256: b.sha256, byte_length: Number(b.byte_length), octets: Number(b.octets) } });
    }
  }
  spots.source_file = { ok: sfBad.length === 0, files: files.length, sqlite_files: sfSQLite.length, pg_files: sfPg.length, mismatches: sfBad.slice(0, 20), per_file: files };

  // (c) boundary_geometry_point 도형(feature)별 행수
  spots.boundary_geometry_point_per_geometry = cmpCounts(
    { key: 'feature_id' },
    db.prepare('SELECT feature_id, count(*) AS n FROM boundary_geometry_point GROUP BY feature_id ORDER BY feature_id ASC NULLS FIRST').all(),
    await client.query(`SELECT feature_id, count(*) AS n FROM wiki.boundary_geometry_point GROUP BY feature_id ORDER BY feature_id COLLATE "C" ASC NULLS FIRST`),
  );

  // (d) person 명부 투영(id+name) 해시
  const rosterProjection = (rows) => {
    const hash = createHash('sha256');
    for (const r of rows) hash.update(`${r.person_id}\t${r.name === null ? '\\N' : r.name}\n`, 'utf8');
    return hash.digest('hex');
  };
  const rosterSQLite = rosterProjection(db.prepare('SELECT person_id, name FROM person ORDER BY person_id ASC NULLS FIRST').all());
  const rosterPg = rosterProjection((await client.query(`SELECT person_id, name FROM wiki.person ORDER BY person_id COLLATE "C" ASC NULLS FIRST`)).rows);
  const rosterCount = sqliteCount(db, 'person');
  spots.person_roster = {
    ok: rosterSQLite === rosterPg,
    roster: rosterCount,
    sqlite_sha256: rosterSQLite,
    pg_sha256: rosterPg,
  };

  spots.ok = Object.values(spots).every((s) => s && s.ok === true);
  log(`golden: source_record[${spots.source_record_per_source.groups} sources] source_file[${spots.source_file.files} files] boundary[${spots.boundary_geometry_point_per_geometry.groups} features] person_roster[${rosterCount}] ${spots.ok ? 'ok' : 'MISMATCH'}`);
  return spots;
}

// ---- FK 신규 스윕 ----------------------------------------------------------------
async function fkSweep(client, log) {
  const fks = (await client.query(`
    SELECT con.conname, con.conrelid, con.confrelid, con.conkey, con.confkey, con.convalidated
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.contype = 'f' AND n.nspname = '${SQLITE_SOURCE_SCHEMA}'
    ORDER BY c.relname, con.conname`)).rows;
  const relCache = new Map();
  const relInfo = async (oid) => {
    if (relCache.has(oid)) return relCache.get(oid);
    const cols = (await client.query(
      `SELECT a.attnum, a.attname, c.relname, n.nspname
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE a.attrelid = $1 AND a.attnum > 0 AND NOT a.attisdropped`,
      [oid],
    )).rows;
    const info = {
      schema: cols[0].nspname,
      name: cols[0].relname,
      colByAttnum: new Map(cols.map((r) => [r.attnum, r.attname])),
    };
    relCache.set(oid, info);
    return info;
  };
  const failures = [];
  let swept = 0;
  for (const fk of fks) {
    const child = await relInfo(fk.conrelid);
    const parent = await relInfo(fk.confrelid);
    const ccols = fk.conkey.map((a) => child.colByAttnum.get(a));
    const pcols = fk.confkey.map((a) => parent.colByAttnum.get(a));
    // MATCH SIMPLE: 자식 키 전부 non-NULL인 행만 검사한다.
    const nullGuard = `(${ccols.map((c) => `c.${q(c)}`).join(', ')}) IS NOT NULL`;
    const join = pcols.map((p, i) => `p.${q(p)} IS NOT DISTINCT FROM c.${q(ccols[i])}`).join(' AND ');
    const sql = `SELECT count(*) AS n FROM ONLY ${q(child.schema)}.${q(child.name)} AS c
                 WHERE ${nullGuard} AND NOT EXISTS (
                   SELECT 1 FROM ONLY ${q(parent.schema)}.${q(parent.name)} AS p WHERE ${join})`;
    const orphans = Number((await client.query(sql)).rows[0].n);
    swept++;
    if (orphans > 0) failures.push({ constraint: `${child.name}.${fk.conname}`, parent: parent.name, orphans });
    if (swept % 250 === 0) log(`fk sweep: ${swept}/${fks.length}`);
  }
  const result = {
    ok: failures.length === 0,
    fk_count: swept,
    convalidated: fks.filter((f) => f.convalidated).length,
    orphans_total: failures.reduce((s, f) => s + f.orphans, 0),
    failures: failures.slice(0, 50),
  };
  log(`fk sweep: ${result.fk_count} constraints (convalidated=${result.convalidated}), orphans=${result.orphans_total} ${result.ok ? 'ok' : 'MISMATCH'}`);
  return result;
}

// ---- wiki.meta 식별 ----------------------------------------------------------------
async function metaIdentity(client, metadata, archiveSha, log) {
  const row = (await client.query(
    'SELECT code_commit, source_sha256, schema_version, migration_id FROM wiki.meta WHERE migration_id = $1',
    [metadata.migration_id],
  )).rows[0];
  if (!row) {
    log('wiki.meta identity: ROW MISSING');
    return { ok: false, wiki_meta: null, metadata: { ...metadata }, mismatches: ['wiki.meta row missing'] };
  }
  const wikiMeta = {
    code_commit: row.code_commit,
    source_sha256: row.source_sha256,
    schema_version: Number(row.schema_version),
    migration_id: row.migration_id,
  };
  const expected = {
    code_commit: metadata.code_commit,
    source_sha256: metadata.source_sha256,
    schema_version: Number(metadata.schema_version),
    migration_id: metadata.migration_id,
  };
  const mismatches = Object.keys(expected).filter((k) => wikiMeta[k] !== expected[k]);
  // 결속 사슬: wiki.meta.source_sha256는 현재 아카이브 해시와도 일치해야 한다.
  if (wikiMeta.source_sha256 !== archiveSha) mismatches.push('wiki.meta.source_sha256 != archive sha256');
  const result = { ok: mismatches.length === 0, wiki_meta: wikiMeta, metadata: expected, mismatches };
  log(`wiki.meta identity: ${result.ok ? 'ok' : `MISMATCH ${mismatches.join(', ')}`} (code_commit=${wikiMeta.code_commit} migration_id=${wikiMeta.migration_id})`);
  return result;
}

// ---- main ----------------------------------------------------------------
async function main() {
  const opts = options();
  const started = new Date();
  const t0 = process.hrtime.bigint();
  const log = (line) => process.stdout.write(`[cast:pg-verify] ${line}\n`);
  const inventory = JSON.parse(await readFile(join(SCHEMA_DIR, 'inventory.json'), 'utf8'));
  const metadata = JSON.parse(await readFile(join(SCHEMA_DIR, 'metadata.json'), 'utf8'));
  const canonical = inventory.sources.canonical;
  const failures = [];
  const failCheck = (check, detail) => failures.push({ check, ...detail });

  // (1) 결속 — 시작 시 재확인(stale_state 방어). 실패 시 PG 조회 없이 즉시 종료.
  const archiveSha = await sha256File(opts.db);
  const binding = {
    ok: archiveSha === canonical.sha256 && archiveSha === metadata.source_sha256 && inventory.migration_id === metadata.migration_id,
    archive_sha256: archiveSha,
    inventory_sha256: canonical.sha256,
    metadata_sha256: metadata.source_sha256,
    inventory_migration_id: inventory.migration_id,
    metadata_migration_id: metadata.migration_id,
  };
  log(`binding: archive sha256 ${binding.ok ? 'ok' : 'MISMATCH'} (${archiveSha})`);

  const report = {
    ok: false,
    tool: 'cast:pg-verify',
    started_at: started.toISOString(),
    archive: { path: opts.db, sha256: archiveSha },
    pg: { url: redactUrl(opts.pg), source_schema: SQLITE_SOURCE_SCHEMA },
    binding,
  };

  if (!binding.ok) {
    failCheck('binding', { archive_sha256: archiveSha, expected: canonical.sha256, metadata_sha256: metadata.source_sha256 });
    report.failures = failures;
    report.finished_at = new Date().toISOString();
    report.duration_ms = Number(process.hrtime.bigint() - t0) / 1e6;
    report.ok = false;
    await writeReport(opts, report, log);
    summaryAndExit(report, failures, log);
    return;
  }

  const patterns = opts.tables;
  const globToRegExp = (p) => new RegExp('^' + p.replaceAll(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.') + '$');
  const tables = patterns
    ? canonical.tables.filter((t) => patterns.some((p) => (p.includes('*') || p.includes('?') ? globToRegExp(p).test(t.name) : p === t.name)))
    : canonical.tables;
  if (tables.length === 0) fail(`no inventory tables match --tables ${patterns.join(',')}`);
  const subset = patterns !== null;
  log(`scope=${subset ? 'subset' : 'full'} tables=${tables.length}/${canonical.tables.length} fetch_batch=${opts.batch}`);

  const db = new DatabaseSync(opts.db, { readOnly: true });
  const client = new pg.Client({ connectionString: opts.pg, statement_timeout: 0 }); // statement_timeout 0: 스트리밍 커서가 끊기지 않게
  await client.connect();
  let wikiPrivateTables = null;
  try {
    await client.query('SET statement_timeout = 0');
    await client.query('SET extra_float_digits = 3'); // REAL 왕복 정확 십진 표기
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ'); // 대사 중 스냅샷 고정

    // wiki_private: 온디맨드 스토어(물리 파일 없음, 소유자 확인) — 아카이브 비교 대상 아님. 테이블 수만 보고.
    wikiPrivateTables = Number((await client.query("SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'wiki_private'")).rows[0].n);

    // (2) 테이블별 행수
    const countFailures = [];
    for (const table of tables) {
      try {
        const n = sqliteCount(db, table.name);
        const p = await pgCount(client, table.pg_name);
        if (n !== p || n !== table.row_count) {
          countFailures.push({ table: table.name, pg_name: table.pg_name, sqlite: n, pg: p, inventory: table.row_count });
        }
      } catch (error) {
        countFailures.push({ table: table.name, error: error.message });
      }
    }
    report.counts = { ok: countFailures.length === 0, checked: tables.length, failures: countFailures };
    log(`counts: ${tables.length - countFailures.length}/${tables.length} tables equal${countFailures.length ? ` (first mismatch: ${countFailures[0].table})` : ''}`);
    for (const f of countFailures) failCheck('counts', f);

    // (3) 테이블별 내용 sha256(PK 정렬 typed 직렬화 스트리밍)
    const contentFailures = [];
    const anomalies = [];
    const tableHashes = {};
    let hashedRows = 0;
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const tableAnomalies = {};
      let s, p;
      try {
        s = sqliteTableHash(db, table, tableAnomalies);
      } catch (error) {
        contentFailures.push({ table: table.name, sqlite_error: error.message });
        continue;
      }
      try {
        p = await pgTableHash(client, table, opts.batch);
      } catch (error) {
        contentFailures.push({ table: table.name, pg_error: error.message });
        continue;
      }
      hashedRows += s.rows;
      tableHashes[table.name] = { rows: s.rows, sha256: s.sha256, pg_sha256: p.sha256 };
      if (s.sha256 !== p.sha256 || s.rows !== p.rows) {
        contentFailures.push({ table: table.name, pg_name: table.pg_name, sqlite_rows: s.rows, pg_rows: p.rows, sqlite_sha256: s.sha256, pg_sha256: p.sha256 });
      }
      if (Object.keys(tableAnomalies).length > 0) anomalies.push({ table: table.name, columns: tableAnomalies });
      if ((i + 1) % 50 === 0 || i === tables.length - 1) log(`content: ${i + 1}/${tables.length} (${table.name}) ${contentFailures.length ? `mismatches=${contentFailures.length}` : 'ok so far'}`);
    }
    report.content = {
      ok: contentFailures.length === 0,
      checked: tables.length,
      rows_hashed_per_side: hashedRows,
      serialization: 'PK-sorted typed: I<dec> T<len>:<utf8> R<ieee754hex16> B<len>:<octets> n(NULL) / row \\n; PG text ORDER BY COLLATE "C" ASC NULLS FIRST == SQLite BINARY',
      storage_class_anomalies: anomalies,
      failures: contentFailures,
      tables: tableHashes,
    };
    log(`content: ${tables.length - contentFailures.length}/${tables.length} tables sha256-equal, rows/side=${hashedRows}${contentFailures.length ? ` (first mismatch: ${contentFailures[0].table})` : ''}${anomalies.length ? ` storage-anomalies=${anomalies.length}` : ''}`);
    for (const f of contentFailures) failCheck('content', f);

    if (subset) {
      // --tables 리허설 스코프: 골든 스폿/FK 스윕/wiki.meta는 전체 원천이 로드된 상태에서만 의미가 있다.
      report.golden = { skipped: true, reason: '--tables subset scope: full-run-only check' };
      report.fk_sweep = { skipped: true, reason: '--tables subset scope: full-run-only check' };
      report.meta_identity = { skipped: true, reason: '--tables subset scope: full-run-only check' };
      log('golden/fk_sweep/meta_identity: skipped (--tables subset scope)');
    } else {
      // (4) 골든 스폿
      report.golden = await goldenSpots(db, client, log);
      if (!report.golden.ok) {
        const bad = Object.entries(report.golden).filter(([, v]) => v && v.ok === false).map(([k]) => k);
        failCheck('golden', { failed_spots: bad });
      }
      // (5) FK 신규 스윕
      report.fk_sweep = await fkSweep(client, log);
      if (!report.fk_sweep.ok) failCheck('fk_sweep', { failures: report.fk_sweep.failures });
      // (6) wiki.meta 식별(백필된 식별자 인증)
      report.meta_identity = await metaIdentity(client, metadata, archiveSha, log);
      if (!report.meta_identity.ok) failCheck('meta_identity', { mismatches: report.meta_identity.mismatches });
    }

    report.wiki_private = { table_count: wikiPrivateTables, compared: false, note: '온디맨드 스토어(물리 파일 없음·소유자 확인) — 아카이브 비교 대상 아님, 테이블 수만 보고' };

    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* 연결 실패 시 ROLLBACK 불가 */ }
    failCheck('runtime', { error: error.message });
    report.runtime_error = error.message;
  } finally {
    db.close();
    await client.end().catch(() => {});
  }

  report.wiki_private = report.wiki_private || { table_count: wikiPrivateTables, compared: false };
  report.failures = failures;
  report.finished_at = new Date().toISOString();
  report.duration_ms = Number(process.hrtime.bigint() - t0) / 1e6;
  report.ok = failures.length === 0;
  await writeReport(opts, report, log);
  summaryAndExit(report, failures, log);
}

async function writeReport(opts, report, log) {
  const date = report.started_at.slice(0, 10);
  const out = opts.out || join(ROOT, '.omo', 'evidence', 'postgres-migration', `reconcile-${date}.json`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  log(`report: ${out}`);
}

function summaryAndExit(report, failures, log) {
  if (report.ok) {
    log(`PASS ok=true tables=${report.content?.checked ?? 0} duration=${(report.duration_ms / 1000).toFixed(1)}s`);
    process.exit(0);
  }
  const first = failures[0];
  const where = first.table ? `${first.check}:${first.table}` : first.check;
  log(`FAIL first=${where} failures=${failures.length}${first.error ? ` error=${first.error}` : ''} duration=${(report.duration_ms / 1000).toFixed(1)}s`);
  process.exit(1);
}

main().catch((error) => {
  console.error(`[cast:pg-verify] FATAL ${error.message}`);
  process.exit(1);
});
