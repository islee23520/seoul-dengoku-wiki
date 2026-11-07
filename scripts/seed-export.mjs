#!/usr/bin/env node
// seed-export.mjs — PostgreSQL wiki 스키마의 공개 컨텐츠 seed를 db/seeds로 반출한다.
//
// 계약(db/seeds/README.md 참조):
// - 대상은 공개 허용목록(server/wiki-table-allowlist.mjs) AND 컨텐츠 범위
//   (scripts/seed-scope.mjs, 소유자 결정 2026-11-03)을 모두 통과하는 wiki 테이블만.
// - wiki_private은 조회하지 않는다. 접속 문자열은 환경(WIKI_SEEDS_PG[_FILE],
//   WIKI_SEEDS_PSQL)으로만 전달하고 출력·파일에 남기지 않는다.
// - 출력은 결정적이다: PK 오름차순 row_to_json 원문 라인, 도메인별 파일,
//   40,000행 샤드, 타임스탬프 없는 manifest. 같은 DB 상태 → 같은 바이트.
// - 승격은 저널로 보호한다: .promote-pending.json 이 남아 있으면 소비자(seed:apply)는
//   트리를 신뢰하지 않고(E_SEED_PROMOTE_PENDING), 다음 반출이 결정적으로 복구한다.
// - 데이터 델타는 이 디렉터리의 git diff가 곧 가시적 마이그레이션 이력이다.
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseSeedLine } from './seed-lossless.mjs'
import { readPublicAdmission, readSeedClosure, seedRowAdmitted } from './public-admission.mjs'
import {
  SHARD_ROWS,
  SEEDS_DIR,
  connectionString,
  domainOf,
  jsonLines,
  makePsqlExecutor,
  quoteIdent,
  sanitizeError,
  seedTableCatalog,
} from './seed-core.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export async function exportSeeds({ out = resolve(projectRoot, SEEDS_DIR), check = false, executor, closure, checkpoint = async () => {} } = {}) {
const seedsRoot = resolve(out)
const stagingRoot = resolve(seedsRoot, '.staging')
const journalPath = resolve(seedsRoot, '.promote-pending.json')
const readmeName = 'README.md'

async function pickExecutor() {
  if (process.env.WIKI_SEEDS_PSQL !== undefined && process.env.WIKI_SEEDS_PSQL.trim() !== '') {
    return makePsqlExecutor(process.env.WIKI_SEEDS_PSQL)
  }
  throw new Error('E_SEED_CONFIG: WIKI_SEEDS_PSQL transport required')
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

async function exportTable(exec, entry) {
  const raw = await exec.jsonLines(tableExportSql(entry))
  const lines = closure ? raw.filter(line => seedRowAdmitted(entry.table, parseSeedLine(line), closure)) : raw
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
    boundary: {
      public: 'server/wiki-table-allowlist.mjs',
      content: 'scripts/seed-scope.mjs',
      rule: 'isPublicTable AND isSeedTable (컨텐츠 범위는 소유자 결정 2026-11-03)',
    },
    shard_rows: SHARD_ROWS,
    tables: entries,
  }
}

// 이전 승격이 중단된 경우(저널 잔존)에도 특별한 복구 경로를 두지 않는다:
// 저널이 남아 있는 동안 소비자(seed:apply)는 트리를 신뢰하지 않고, 이후의 성공적인
// 반출이 전체 파일·manifest·만료 청소를 결정적으로 다시 수행한 뒤에야 저널이
// 제거된다. 부분 상태를 조기에 푸는 경로가 존재하면 혼합 상태가 무겁게 노출된다.

// manifest에 등록된 파일과 README를 제외한 모든 파일을 지운다(만료분·고아 정리).
// 멱등하므로 실패 후 재실행이 같은 결과로 수렴한다.
async function sweepUnlisted(manifest) {
  const listed = new Set(['manifest.json', readmeName, '.staging', '.promote-pending.json'])
  for (const table of manifest.tables) {
    for (const { file } of table.files) listed.add(file)
  }
  const victims = []
  const walk = async (relDir) => {
    const abs = resolve(seedsRoot, relDir)
    for (const entry of await readdir(abs, { withFileTypes: true })) {
      const rel = relDir === '' ? entry.name : `${relDir}/${entry.name}`
      if (entry.isDirectory()) {
        if (!listed.has(rel)) await walk(rel)
      } else if (!listed.has(rel)) {
        victims.push(rel)
      }
    }
  }
  await walk('')
  for (const rel of victims) await rm(resolve(seedsRoot, rel), { force: true })
  // 빈 도메인 디렉터리 정리
  for (const entry of await readdir(seedsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.staging') continue
    const dir = resolve(seedsRoot, entry.name)
    if ((await readdir(dir)).length === 0) await rm(dir, { recursive: true })
  }
  return victims.length
}

async function main(exec) {
  await mkdir(seedsRoot, { recursive: true })
  await rm(stagingRoot, { recursive: true, force: true })
  await mkdir(stagingRoot, { recursive: true })
  try {
    const catalog = await seedTableCatalog(exec)
    const entries = []
    for (const entry of catalog) {
      entries.push(await exportTable(exec, entry))
    }
    entries.sort((a, b) => a.table.localeCompare(b.table))
    const manifest = manifestOf(entries)
    await writeFile(resolve(stagingRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })

    if (check) {
      if (await readFile(journalPath).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error })) throw new Error('E_SEED_PROMOTE_PENDING')
      for (const file of ['manifest.json', ...entries.flatMap(table => table.files.map(row => row.file))]) {
        if (await sha256Of(resolve(stagingRoot, file)) !== await sha256Of(resolve(seedsRoot, file))) throw new Error(`E_SEED_DRIFT:${file}`)
      }
      const listed = new Set(['manifest.json', 'README.md', ...entries.flatMap(table => table.files.map(row => row.file))])
      const walk = async (directory = '') => {
        for (const row of await readdir(resolve(seedsRoot, directory), { withFileTypes: true })) {
          const path = directory ? `${directory}/${row.name}` : row.name
          if (path === '.staging') continue
          if (row.isDirectory()) await walk(path)
          else if (!listed.has(path)) throw new Error(`E_SEED_DRIFT:${path}`)
        }
      }
      await walk()
      return manifest
    }

    // 승격: 저널 선표시 → 파일 rename → manifest 교체 → 만료 청소 → 저널 제거.
    // 저널은 성공적인 청소 이후에만 제거된다: 어느 단계에서 실패해도 저널이 남아
    // 소비자를 차단하고, 다음 성공적인 반출이 전체를 복구한 뒤에야 해제한다.
    await writeFile(journalPath, `${JSON.stringify({ pending: true, tables: entries.length })}\n`, { encoding: 'utf8' })
    await checkpoint('prepared')
    for (const table of manifest.tables) {
      for (const { file } of table.files) {
        const target = resolve(seedsRoot, file)
        await mkdir(dirname(target), { recursive: true })
        await rename(resolve(stagingRoot, file), target)
        await checkpoint('promotion', file)
      }
    }
    await rename(resolve(stagingRoot, 'manifest.json'), resolve(seedsRoot, 'manifest.json'))
    const swept = await sweepUnlisted(manifest)
    await rm(journalPath, { force: true })

    const rows = entries.reduce((sum, t) => sum + t.rows, 0)
    const files = entries.reduce((sum, t) => sum + t.files.length, 0)
    console.log(JSON.stringify({ event: 'seed-export', tables: entries.length, rows, files, swept }))
    return manifest
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
  }
}

if (executor) return main(executor)
if (process.env.WIKI_SEEDS_PSQL?.trim()) {
  if (process.env.WIKI_GENERATION_SNAPSHOT) throw new Error('E_SEED_PSQL_SNAPSHOT_UNSUPPORTED')
  const exec = await pickExecutor()
  try { return await main(exec) } finally { await exec.close() }
}
const { createReader } = await import('./cast-sqlite/db-pg.mjs')
const url = connectionString()
if (!url) throw new Error('E_SEED_CONFIG: WIKI_SEEDS_PG or WIKI_SEEDS_PG_FILE required')
const reader = createReader({ connectionString: url })
try {
  return await reader.transaction(async tx => {
    // Public scratch intentionally has none of the source/admission metadata.
    // Full stores must run the oracle; missing half of the metadata fails closed.
    const tables = await tx.all("SELECT table_name FROM information_schema.tables WHERE table_schema='wiki' AND table_name IN ('source_file','excluded_source','document_publication_admission')")
    if (tables.length && tables.length !== 3) throw new Error('E_SEED_ADMISSION_SCHEMA')
    if (tables.length) closure ??= await readSeedClosure(tx, await readPublicAdmission(tx))
    return main({ jsonLines: async sql => (await tx.all(sql)).map(row => row.line) })
  },
    { readOnly: true, importSnapshot: process.env.WIKI_GENERATION_SNAPSHOT })
} finally { await reader.close() }
}

async function cli() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) { console.log('Usage: node scripts/seed-export.mjs [--out DIR] [--check]'); return }
  const options = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') options.check = true
    else if (args[i] === '--out' && args[i + 1] && !args[i + 1].startsWith('--')) options.out = args[++i]
    else throw new Error('E_SEED_ARGUMENT')
  }
  await exportSeeds(options)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli().catch((error) => {
  console.error(`E_SEED_EXPORT_FAILED: ${sanitizeError(error)}`)
  process.exit(1)
})
