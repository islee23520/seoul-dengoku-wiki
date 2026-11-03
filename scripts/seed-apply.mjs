#!/usr/bin/env node
// seed-apply.mjs — db/seeds의 공개 seed 데이터를 대상 PostgreSQL에 적재한다.
//
// 계약(db/seeds/README.md 참조):
// - 적재는 INSERT ... ON CONFLICT DO NOTHING. 이미 있는 행은 건드리지 않으므로
//   재실행은 no-op로 수렴한다(멱등). 갱신·삭제 경로는 존재하지 않는다.
// - 운영 데이터 흐름은 PG → repo(seed:export)가 정방향이다. 이 스크립트는
//   스크래치·리허설 환경 부트스트랩용이며 테이블 변경(db/migrations)과 무관하다.
// - FK 제약은 schema-pg 계약상 데이터 적재 이후에 설치한다. 이 스크립트는
//   제약 없는 빈 환경을 전제로 임의 순서 적재를 허용한다.
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { APPLY_BATCH_ROWS, SEEDS_DIR, connectionString, quoteIdent, sanitizeError } from './seed-core.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedsRoot = resolve(projectRoot, SEEDS_DIR)
const verifyOnly = process.argv.includes('--verify')

async function readManifest() {
  try {
    return JSON.parse(await readFile(resolve(seedsRoot, 'manifest.json'), 'utf8'))
  } catch (error) {
    throw new Error(`E_SEED_MANIFEST: db/seeds/manifest.json을 읽을 수 없다 — ${sanitizeError(error)} (seed:export 먼저)`)
  }
}

async function assertTables(client, manifest) {
  const present = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'wiki' AND table_type = 'BASE TABLE'`,
  )
  const names = new Set(present.rows.map((r) => r.table_name))
  const missing = manifest.tables.filter((t) => !names.has(t.table)).map((t) => t.table)
  if (missing.length > 0) {
    throw new Error(`E_SEED_SCHEMA_MISSING: 대상에 없는 테이블 — ${missing.join(', ')} (schema-pg/apply.sql 부트스트랩 먼저)`)
  }
}

async function applyTable(client, table) {
  const cols = table.columns.map((c) => quoteIdent(c)).join(', ')
  const selectCols = table.columns.map((c) => `${quoteIdent('s')}.${quoteIdent(c)}`).join(', ')
  const sql = `INSERT INTO ${quoteIdent('wiki')}.${quoteIdent(table.table)} (${cols})
    SELECT ${selectCols} FROM json_populate_recordset(NULL::${quoteIdent('wiki')}.${quoteIdent(table.table)}, $1::json) AS s
    ON CONFLICT DO NOTHING`
  let inserted = 0
  const lines = []
  for (const { file } of table.files) {
    const text = await readFile(resolve(seedsRoot, file), 'utf8')
    for (const line of text.split('\n')) if (line !== '') lines.push(line)
  }
  for (let i = 0; i < lines.length; i += APPLY_BATCH_ROWS) {
    const batch = lines.slice(i, i + APPLY_BATCH_ROWS)
    const res = await client.query(sql, [`[${batch.join(',')}]`])
    inserted += res.rowCount ?? 0
  }
  return { table: table.table, rows: table.rows, files: table.files.length, inserted }
}

async function verifyTable(client, table) {
  const res = await client.query(
    `SELECT count(*)::int AS n FROM ${quoteIdent('wiki')}.${quoteIdent(table.table)}`,
  )
  const actual = res.rows[0].n
  if (actual !== table.rows) {
    throw new Error(`E_SEED_VERIFY: ${table.table} 행수 불일치 — manifest ${table.rows} / actual ${actual}`)
  }
  return { table: table.table, rows: actual, ok: true }
}

async function main() {
  const url = connectionString()
  if (url === undefined) throw new Error('E_SEED_CONFIG: 대상 연결을 지정하라 — WIKI_SEEDS_PG / WIKI_SEEDS_PG_FILE(0600)')
  const manifest = await readManifest()
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  try {
    const client = await pool.connect()
    try {
      await assertTables(client, manifest)
      const results = []
      if (verifyOnly) {
        for (const table of manifest.tables) results.push(await verifyTable(client, table))
        console.log(JSON.stringify({ event: 'seed-verify', tables: results.length, rows: results.reduce((s, r) => s + r.rows, 0), ok: true }))
      } else {
        for (const table of manifest.tables) {
          await client.query('BEGIN')
          try {
            results.push(await applyTable(client, table))
            await client.query('COMMIT')
          } catch (error) {
            await client.query('ROLLBACK')
            throw error
          }
        }
        console.log(JSON.stringify({ event: 'seed-apply', tables: results.length, rows: results.reduce((s, r) => s + r.rows, 0), inserted: results.reduce((s, r) => s + r.inserted, 0) }))
        for (const r of results) if (r.inserted !== r.rows) console.log(JSON.stringify({ event: 'seed-apply-skip', table: r.table, rows: r.rows, inserted: r.inserted }))
      }
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(`E_SEED_APPLY_FAILED: ${sanitizeError(error)}`)
  process.exit(1)
})
