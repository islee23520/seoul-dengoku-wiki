#!/usr/bin/env node
// db-pg.mjs — PostgreSQL 판독 퍼사드 (postgres-migration Todo 6).
//
// 비동기 전용 계약 (Wave-4 공용, Main 확정 2026-10-27):
//   createReader({ connectionString = WIKI_DOCUMENT_PG, role } = {}) → reader
//     role: 세션이 SET ROLE 할 역할(예: 'wiki_reader'). 부트스트랩 역할은 전부
//     NOLOGIN이므로 개발 trust 소켓에서는 현재 사용자로 접속해 역할 권한 경계를
//     연결 시작 시점(startup options)에 적용한다. 실패는 연결 실패로 크게 드러난다.
//   reader / tx 공통 5종:
//     query(sql, params) → pg.Result (원형: { rows, rowCount, command, oid, fields })
//     all(sql, params)   → rows 배열
//     get(sql, params)   → 첫 행 객체 또는 null
//     run(sql, params)   → rowCount (number)
//     exec(sqlText)      → void — 플레이스홀더 변환 없이 그대로 실행(단순 프로토콜)
//   transaction(fn, { readOnly = false, isolation = 'REPEATABLE READ' } = {})
//     — 풀에서 leased connection 하나를 빌려 awaited BEGIN/COMMIT/ROLLBACK.
//       fn(tx)의 tx는 같은 5종 메서드를 그 연결에 묶어 제공한다(중첩 금지).
//   정산: close() → pool.end().
//
// SQL 규칙: `?` 플레이스홀더는 자동으로 $n으로 변환한다(문자열 리터럴·따옴표
// 식별자·주석·$tag$ 본문은 건너뛴다). 이미 $n을 쓰는 SQL은 그대로 통과하되 `?`와
// 혼용은 거부한다. 변환된 ? SQL의 최상위 세미콜론(다중 문)도 거부한다 — 다중 문은
// exec()로만. 테이블은 wiki.… 처럼 스키마 한정으로 쓴다(역할 search_path 없음).
// SQLite 자동 fallback은 없다: 연결 실패·설정 누락은 즉시 크게 실패한다.
//
// 값 규칙: int8(int2/int4 포함 정수 경계)은 JS number로 — node:sqlite 판독 호환.
// 2^53 을 넘는 값은 조용한 정밀도 손실 대신 E_PG_INT64_UNSAFE로 실패한다.
// bytea는 Buffer(Uint8Array 하위클래스)로 도착한다.

import { createRequire } from 'node:module';
import pg from 'pg';

const ISOLATION_LEVELS = new Set(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);
const ROLE_NAME = /^[a-z_][a-z0-9_]*$/i;
// Resolve the same parser pg uses, rather than maintaining a second URL/config
// interpretation. Parse once and never pass connectionString to Pool: pg merges
// its parsed fields over explicit config, including the startup role options.
const parseConnectionString = createRequire(import.meta.resolve('pg'))('pg-connection-string').parse;
const CONNECTION_OVERRIDES = new Set([
  'user', 'password', 'host', 'port', 'options', 'role', 'session_authorization',
  'connectionstring', '__proto__', 'prototype', 'constructor',
]);

function readerConnectionConfig(text, role) {
  try {
    if (/%(?![0-9a-f]{2})|[\u0000-\u001f\u007f]/i.test(text)) throw new Error();
    // pg also supports a bare Unix socket path followed by a database name.
    if (!text.startsWith('/')) {
      const url = new URL(text);
      if (!['postgres:', 'postgresql:', 'socket:'].includes(url.protocol) || url.hash) throw new Error();
      for (const [key] of url.searchParams) {
        if (!/^[a-z_][a-z0-9_]*$/i.test(key) || CONNECTION_OVERRIDES.has(key.toLowerCase())) throw new Error();
      }
    } else if (/[?#]/.test(text)) {
      throw new Error();
    }
    const config = parseConnectionString(text);
    // Defense against parser changes introducing another interpretation of a
    // startup-options override. SSL fields remain exactly as pg parsed them.
    if (Object.hasOwn(config, 'options') || Object.hasOwn(config, 'connectionString')) throw new Error();
    return role === undefined ? { ...config } : { ...config, options: `-c role=${role}` };
  } catch {
    // Parser errors can contain credentials or SSL file paths; do not relay them.
    throw Object.assign(new Error('E_PG_CONFIG: invalid PostgreSQL connection string or forbidden identity/startup override'), { code: 'E_PG_CONFIG' });
  }
}


// int8 → Number. 모듈 로드 시 한 번 (node:pg 타입 파서는 프로세스 전역).
pg.types.setTypeParser(20, (value) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw Object.assign(
      new Error(`E_PG_INT64_UNSAFE: bigint ${value} exceeds the JavaScript safe integer range`),
      { code: 'E_PG_INT64_UNSAFE' },
    );
  }
  return number;
});

/** Convert SQLite-style `?` placeholders to PostgreSQL `$n`.
 * Tracks string literals ('' escape), quoted identifiers, -- and block comments,
 * and $tag$ dollar-quoted bodies. Returns { sql, params, mixed, multiStatement }. */
export function dollarPlaceholders(text) {
  if (typeof text !== 'string' || !text.includes('?')) {
    return { sql: text, params: 0, mixed: false, multiStatement: false };
  }
  let out = '';
  let params = 0;
  let mixed = false;
  let topLevelSemicolon = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "'" || c === '"') {
      const quote = c;
      out += c;
      i += 1;
      while (i < text.length) {
        out += text[i];
        if (text[i] === quote) {
          if (text[i + 1] === quote) { out += text[i + 1]; i += 2; continue; }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (c === '-' && text[i + 1] === '-') {
      while (i < text.length && text[i] !== '\n') { out += text[i]; i += 1; }
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      out += '/*';
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { out += text[i]; i += 1; }
      if (i < text.length) { out += '*/'; i += 2; }
      continue;
    }
    if (c === '$') {
      const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i));
      if (tag) {
        const end = text.indexOf(tag[0], i + tag[0].length);
        const stop = end === -1 ? text.length : end + tag[0].length;
        out += text.slice(i, stop);
        i = stop;
        continue;
      }
      if (/^\$\d/.test(text.slice(i))) mixed = true;
      out += c;
      i += 1;
      continue;
    }
    if (c === '?') { params += 1; out += `$${params}`; i += 1; continue; }
    if (c === ';') { topLevelSemicolon = true; out += c; i += 1; continue; }
    out += c;
    i += 1;
  }
  return { sql: out, params, mixed: mixed && params > 0, multiStatement: topLevelSemicolon && params > 0 };
}

const translated = new Map();
function translate(text) {
  let sql = translated.get(text);
  if (sql === undefined) {
    const converted = dollarPlaceholders(text);
    if (converted.mixed) {
      throw Object.assign(new Error('E_PG_PLACEHOLDER_MIX: use either ? or $n placeholders, not both'), { code: 'E_PG_PLACEHOLDER_MIX' });
    }
    if (converted.multiStatement) {
      throw Object.assign(new Error('E_PG_MULTI_STATEMENT: placeholder SQL must be a single statement; use exec() for raw multi-statement text'), { code: 'E_PG_MULTI_STATEMENT' });
    }
    sql = converted.sql;
    if (translated.size < 2048) translated.set(text, sql);
  }
  return sql;
}

function methodsOn(queryRaw) {
  const query = (sql, params) => queryRaw(translate(sql), params);
  return {
    query,
    all: async (sql, params) => (await query(sql, params)).rows,
    get: async (sql, params) => ((await query(sql, params)).rows[0]) ?? null,
    run: async (sql, params) => (await query(sql, params)).rowCount,
    exec: (sqlText) => queryRaw(sqlText),
  };
}

/** Open an async PostgreSQL reader. No SQLite fallback: a missing connection
 * string or an unreachable server fails loudly at first use. */
export function createReader({ connectionString = process.env.WIKI_DOCUMENT_PG, role } = {}) {
  const url = typeof connectionString === 'string' ? connectionString.trim() : '';
  if (!url) {
    throw Object.assign(
      new Error('E_PG_CONFIG: a PostgreSQL connection string is required (env WIKI_DOCUMENT_PG or { connectionString }); there is no SQLite fallback'),
      { code: 'E_PG_CONFIG' },
    );
  }
  if (role !== undefined && (typeof role !== 'string' || !ROLE_NAME.test(role))) {
    throw Object.assign(new Error(`E_PG_CONFIG: invalid role name ${JSON.stringify(role)}`), { code: 'E_PG_CONFIG' });
  }
  const pool = new pg.Pool(readerConnectionConfig(url, role));

  const base = methodsOn((sql, params) => pool.query(sql, params));
  const transaction = async (fn, { readOnly = false, isolation = 'REPEATABLE READ', importSnapshot } = {}) => {
    if (!ISOLATION_LEVELS.has(isolation)) {
      throw Object.assign(new Error(`E_PG_ISOLATION: unknown isolation level ${JSON.stringify(isolation)}`), { code: 'E_PG_ISOLATION' });
    }
    if (importSnapshot !== undefined && (typeof importSnapshot !== 'string' || !/^[0-9A-F]+-[0-9A-F]+-[0-9]+$/i.test(importSnapshot))) {
      throw Object.assign(new Error('E_PG_SNAPSHOT: importSnapshot must be a snapshot id string like 00000001-00000002-1'), { code: 'E_PG_SNAPSHOT' });
    }
    const client = await pool.connect();
    let begun = false;
    let broken = null;
    try {
      await client.query(`BEGIN ISOLATION LEVEL ${isolation}${readOnly ? ' READ ONLY' : ''}`);
      begun = true;
      if (importSnapshot !== undefined) {
        // Same consistent read view as the exporting transaction: the
        // importer must SET TRANSACTION SNAPSHOT before its first query and
        // stay inside this one transaction (PostgreSQL contract).
        await client.query(`SET TRANSACTION SNAPSHOT '${importSnapshot}'`);
      }
      const tx = { ...methodsOn((sql, params) => client.query(sql, params)),
        transaction: () => { throw Object.assign(new Error('E_PG_NESTED_TRANSACTION: lease one connection per transaction; nested transaction() is rejected'), { code: 'E_PG_NESTED_TRANSACTION' }); },
        isTransaction: true };
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (begun) {
        try { await client.query('ROLLBACK'); }
        catch (rollbackError) { broken = rollbackError; error.rollbackError = rollbackError; }
      }
      throw error;
    } finally {
      client.release(broken ?? undefined);
    }
  };

  /** Export this pool's REPEATABLE READ snapshot id. The exporting
   * transaction stays open (leased connection) until release() so other
   * processes can SET TRANSACTION SNAPSHOT against the same read view. */
  const exportSnapshot = async () => {
    const client = await pool.connect();
    let released = false;
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const id = (await client.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
    return {
      id,
      release: async () => {
        if (released) return;
        released = true;
        try { await client.query('ROLLBACK'); }
        finally { client.release(); }
      },
    };
  };

  return { pool, ...base, transaction, exportSnapshot, close: () => pool.end() };
}

/** db.mjs 이름 호환 별칭 (기계적 import 치환용). 인자는 연결 문자열 또는 createReader 옵션 객체. */
export const openReadOnly = (source) => createReader(typeof source === 'string' ? { connectionString: source } : (source ?? {}));
export const openWritable = (source) => createReader(typeof source === 'string' ? { connectionString: source } : (source ?? {}));
export const withTransaction = (reader, fn, options) => reader.transaction(fn, options);
