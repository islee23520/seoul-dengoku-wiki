#!/usr/bin/env node
// seed-export.mjs — PostgreSQL wiki 스키마의 공개 seed 데이터를 db/seeds로 반출한다.
//
// 계약(db/seeds/README.md 참조):
// - 대상은 server/wiki-table-allowlist.mjs의 isPublicTable이 허용하는 wiki 테이블만.
// - wiki_private은 조회하지 않는다. 접속 문자열은 환경(WIKI_SEEDS_PG[_FILE],
//   WIKI_SEEDS_PSQL)으로만 전달하고 출력·파일에 남기지 않는다.
// - 출력은 결정적이다: PK 오름차순 row_to_json 원문 라인, 도메인별 파일,
//   40,000행 샤드, 타임스탬프 없는 manifest. 같은 DB 상태 → 같은 바이트.
// - 데이터 델타는 이 디렉터리의 git diff가 곧 가시적 마이그레이션 이력이다.
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SHARD_ROWS,
  SEEDS_DIR,
  domainOf,
  jsonLines,
  makePgExecutor,
  makePsqlExecutor,
  quoteIdent,
  sanitizeError,
  seedTableCatalog,
} from './seed-core.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedsRoot = resolve(projectRoot, SEEDS_DIR)

async function pickExecutor() {
  if (process.env.WIKI_SEEDS_PSQL !== undefined && process.env.WIKI_SEEDS_PSQL.trim() !== '') {
    return makePsqlExecutor(process.env.WIKI_SEEDS_PSQL)
  }
  const exec = await makePgExecutor()
  if (exec === undefined) {
    throw new Error(
      'E_SEED_CONFIG: 연결을 지정하라 — WIKI_SEEDS_PG(URL) / WIKI_SEEDS_PG_FILE(0600 파일) / WIKI_SEEDS_PSQL(읽기 psql 트랜스포트 명령행)',
    )
  }
  return exec
}

function tableExportSql(entry) {
  const cols = entry.columns.map((c) => quoteIdent(c.name)).join(', ')
  const order = entry.primary_key.map((c) => quoteIdent(c)).join(', ')
  return jsonLines(
    `SELECT ${cols} FROM ${quoteIdent('wiki')}.${quoteIdent(entry.table)} ORDER BY ${order}`,
  )
}

async function sha256Of(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function exportTable(exec, entry, stagingRoot) {
  const lines = await exec.jsonLines(tableExportSql(entry))
  const domain = domainOf(entry.table)
  const dir = resolve(stagingRoot, domain)
  await mkdir(dir, { recursive: true })
  const files = []
  const shards = Math.max(1, Math.ceil(lines.length / SHARD_ROWS))
  for (let i = 0; i < shards; i += 1) {
    const part = lines.slice(i * SHARD_ROWS, (i + 1) * SHARD_ROWS)
    const rel = shards === 1
      ? `${domain}/${entry.table}.jsonl`
      : `${domain}/${entry.table}.part-${String(i + 1).padStart(3, '0')}.jsonl`
    const abs = resolve(stagingRoot, rel)
    await writeFile(abs, `${part.join('\n')}\n`, { encoding: 'utf8', flag: 'wx' })
    files.push({ file: rel, rows: part.length, sha256: await sha256Of(abs) })
  }
  return {
    table: entry.table,
    domain,
    columns: entry.columns.map((c) => c.name),
    primary_key: entry.primary_key,
    rows: lines.length,
    files,
  }
}

function manifestOf(entries) {
  return {
    format: 'wiki-seeds/1',
    schema: 'wiki',
    boundary: { module: 'server/wiki-table-allowlist.mjs' },
    shard_rows: SHARD_ROWS,
    tables: entries,
  }
}

// 이전 manifest가 추적한 파일만 지운다(미추적 파일은 건드리지 않는다).
async function removePreviousOutputs() {
  let previous = null
  try {
    previous = JSON.parse(await readFile(resolve(seedsRoot, 'manifest.json'), 'utf8'))
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
    return
  }
  for (const table of previous.tables ?? []) {
    for (const { file } of table.files ?? []) {
      await rm(resolve(seedsRoot, file), { force: true })
    }
  }
}

async function pruneEmptyDirs(root) {
  for (const name of await readdir(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === '.staging') continue
    const dir = resolve(root, name.name)
    const left = await readdir(dir)
    if (left.length === 0) await rm(dir, { recursive: true })
  }
}

async function main() {
  const exec = await pickExecutor()
  const staging = resolve(seedsRoot, '.staging')
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })
  try {
    const catalog = await seedTableCatalog(exec)
    const entries = []
    for (const entry of catalog) {
      entries.push(await exportTable(exec, entry, staging))
    }
    entries.sort((a, b) => a.table.localeCompare(b.table))
    const manifest = manifestOf(entries)
    await writeFile(resolve(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })

    await mkdir(seedsRoot, { recursive: true })
    await removePreviousOutputs()
    for (const table of manifest.tables) {
      for (const { file } of table.files) {
        const target = resolve(seedsRoot, file)
        await mkdir(dirname(target), { recursive: true })
        await rename(resolve(staging, file), target)
      }
    }
    await rename(resolve(staging, 'manifest.json'), resolve(seedsRoot, 'manifest.json'))
    await pruneEmptyDirs(seedsRoot)

    const rows = entries.reduce((sum, t) => sum + t.rows, 0)
    const files = entries.reduce((sum, t) => sum + t.files.length, 0)
    console.log(JSON.stringify({ event: 'seed-export', tables: entries.length, rows, files }))
  } finally {
    await exec.close()
    await rm(staging, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`E_SEED_EXPORT_FAILED: ${sanitizeError(error)}`)
  process.exit(1)
})
