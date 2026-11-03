// seed-core.mjs — db/seeds 공유 계약: 경계·도메인·스키마 내성·연결 해석
//
// 경계 단일 출처: server/wiki-table-allowlist.mjs의 isPublicTable가 seed 대상을
// 결정한다(owner 결정, PR #666). 이 모듈은 두 번째 허용목록을 만들지 않는다.
// wiki_private 스키마는 어떤 경로로도 조회하지 않는다.
//
// 실행 어댑터 계약: 두 모드 모두 파라미터 없는 정적 SQL만 사용하며,
// 모든 조회는 `SELECT row_to_json(r)::text AS line FROM (...) r` 형태로
// JSON 라인 배열을 돌려준다(jsonLines). 값 리터럴을 SQL에 조립하지 않는다.
import { spawnSync } from 'node:child_process'
import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs'
import pg from 'pg'
import { isPublicTable } from '../server/wiki-table-allowlist.mjs'
import { isSeedTable } from './seed-scope.mjs'

export const SEED_SCHEMA = 'wiki'
export const SEEDS_DIR = 'db/seeds'
export const SHARD_ROWS = 40000
export const APPLY_BATCH_ROWS = 1000

// row_to_json으로 그대로 반출해도 손실 없는 컬럼 타입만 허용한다.
export const SAFE_COLUMN_TYPES = new Set(['text', 'bigint', 'double precision', 'bytea'])

const DOMAIN_RULES = [
  ['document-revisions', (t) => t.startsWith('document_revision_text_')],
  ['current-documents', (t) => t.startsWith('text_')],
  ['region-content', (t) => t.startsWith('region_content_')],
  ['people', (t) => t === 'person' || t === 'profile' || t.startsWith('person_')],
  ['glossary', (t) => t.startsWith('glossary_')],
  ['geography', (t) => t.startsWith('geography_')],
  ['catalog', (t) => t.startsWith('catalog_')],
  ['document-heads', (t) => t.startsWith('document_')],
  ['public-map', (t) => t.startsWith('public_')],
  ['relations', (t) => t.startsWith('relation')],
  ['misc', () => true],
]

export function domainOf(tableName) {
  for (const [domain, match] of DOMAIN_RULES) if (match(tableName)) return domain
  return 'misc'
}

export function quoteIdent(name) {
  return `"${String(name).replace(/"/gu, '""')}"`
}

export function jsonLines(innerSql) {
  return `SELECT row_to_json(r)::text AS line FROM (${innerSql}) r`
}

// db-migrate.mjs와 동일한 연결 해석: WIKI_SEEDS_PG 또는 WIKI_SEEDS_PG_FILE(0600).
export function connectionString(env = process.env) {
  if (env.WIKI_SEEDS_PG !== undefined && env.WIKI_SEEDS_PG_FILE !== undefined) {
    throw new Error('E_SEED_CONFIG: WIKI_SEEDS_PG와 WIKI_SEEDS_PG_FILE 중 하나만 지정한다')
  }
  if (env.WIKI_SEEDS_PG !== undefined && env.WIKI_SEEDS_PG.trim() !== '') return env.WIKI_SEEDS_PG.trim()
  if (env.WIKI_SEEDS_PG_FILE !== undefined) {
    let fd
    try {
      fd = openSync(env.WIKI_SEEDS_PG_FILE, constants.O_RDONLY)
      const info = fstatSync(fd)
      if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error('mode')
      return readFileSync(fd, 'utf8').trim()
    } catch {
      throw new Error('E_SEED_CONFIG: WIKI_SEEDS_PG_FILE은 그룹·기타가 읽을 수 없는 일반 파일이어야 한다')
    } finally {
      if (fd !== undefined) closeSync(fd)
    }
  }
  return undefined
}

export function sanitizeError(error) {
  return String(error?.message ?? error).replace(/postgres(ql)?:\/\/\S+/giu, '<url>')
}

// psql 트랜스포트: WIKI_SEEDS_PSQL = 명령행(공백 분리). 예)
//   WIKI_SEEDS_PSQL='docker exec wiki-postgres psql -U wiki_owner -d seoul'
// 쿼리는 -c 인자로 전달하며 stdin을 사용하지 않는다(포트 미공개 호스트용).
export function makePsqlExecutor(command, { timeoutMs = 300000 } = {}) {
  const argv = command.trim().split(/\s+/u).filter((part) => part !== '')
  if (argv.length === 0) throw new Error('E_SEED_CONFIG: WIKI_SEEDS_PSQL이 비어 있다')
  return {
    mode: 'psql',
    async jsonLines(sql) {
      const res = spawnSync(argv[0], [...argv.slice(1), '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-A', '-t', '-c', sql], {
        env: process.env,
        stdin: 'ignore',
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 1024,
      })
      const err = res.stderr?.toString() ?? ''
      if (res.error || res.status !== 0) throw new Error(`E_SEED_QUERY: psql 실행 실패 — ${sanitizeError(err || res.error)}`)
      return res.stdout.toString().split('\n').filter((line) => line !== '')
    },
    async close() {},
  }
}

export async function makePgExecutor(env = process.env) {
  const url = connectionString(env)
  if (url === undefined) return undefined
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  return {
    mode: 'pg',
    async jsonLines(sql) {
      const res = await pool.query(sql)
      return res.rows.map((row) => row.line)
    },
    async close() {
      await pool.end()
    },
  }
}

// — 스키마 내성(읽기 전용): 시드 범위(컨텐츠) 테이블의 컬럼·PK (3회 일괄 조회) —
// 이중 검사: 공개 허용목록(#666) AND 컨텐츠 범위(seed-scope, 소유자 2026-11-03).
export async function seedTableCatalog(exec) {
  const tableRows = (await exec.jsonLines(jsonLines(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'wiki' AND table_type = 'BASE TABLE' ORDER BY table_name`,
  ))).map((r) => JSON.parse(r).table_name).filter((t) => isPublicTable(t) && isSeedTable(t))
  const columnRows = (await exec.jsonLines(jsonLines(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'wiki' ORDER BY table_name, ordinal_position`,
  ))).map((r) => JSON.parse(r))
  const pkRows = (await exec.jsonLines(jsonLines(
    `SELECT c.relname AS table_name, a.attname FROM pg_index i
     JOIN pg_class c ON c.oid = i.indrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'wiki'
     JOIN LATERAL unnest(i.indkey) WITH ORDINALITY k(attnum, ord) ON true
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
     WHERE i.indisprimary ORDER BY c.relname, k.ord`,
  ))).map((r) => JSON.parse(r))
  const columnsByTable = new Map()
  for (const row of columnRows) {
    if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, [])
    columnsByTable.get(row.table_name).push({ name: row.column_name, type: row.data_type })
  }
  const pkByTable = new Map()
  for (const row of pkRows) {
    if (!pkByTable.has(row.table_name)) pkByTable.set(row.table_name, [])
    pkByTable.get(row.table_name).push(row.attname)
  }
  const out = tableRows.map((table) => ({
    table,
    columns: columnsByTable.get(table) ?? [],
    primary_key: pkByTable.get(table) ?? [],
  }))
  const noPk = out.filter((t) => t.primary_key.length === 0).map((t) => t.table)
  if (noPk.length > 0) throw new Error(`E_SEED_NO_PK: PK 없는 허용 테이블 — ${noPk.join(', ')}`)
  const badType = out.flatMap((t) =>
    t.columns.filter((c) => !SAFE_COLUMN_TYPES.has(c.type)).map((c) => `${t.table}.${c.name}(${c.type})`),
  )
  if (badType.length > 0) throw new Error(`E_SEED_COLUMN_TYPE: 안전하지 않은 컬럼 타입 — ${badType.join(', ')}`)
  return out
}
