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
const stagingRoot = resolve(seedsRoot, '.staging')
const journalPath = resolve(seedsRoot, '.promote-pending.json')
const readmeName = 'README.md'
// repo→PG 적용 마커(seed-sync)는 반출 청소 대상이 아니다: merge 후 적용기(wiki-sync)가
// 소비할 때까지 트리에 남아 있어야 한다.
const markerFile = '.sync-request.json'

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

async function exportTable(exec, entry) {
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
  const listed = new Set(['manifest.json', readmeName, '.staging', markerFile])
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

async function main() {
  const exec = await pickExecutor()
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

    // 승격: 저널 선표시 → 파일 rename → manifest 교체 → 만료 청소 → 저널 제거.
    // 저널은 성공적인 청소 이후에만 제거된다: 어느 단계에서 실패해도 저널이 남아
    // 소비자를 차단하고, 다음 성공적인 반출이 전체를 복구한 뒤에야 해제한다.
    await writeFile(journalPath, `${JSON.stringify({ pending: true, tables: entries.length })}\n`, { encoding: 'utf8' })
    for (const table of manifest.tables) {
      for (const { file } of table.files) {
        const target = resolve(seedsRoot, file)
        await mkdir(dirname(target), { recursive: true })
        await rename(resolve(stagingRoot, file), target)
      }
    }
    await rename(resolve(stagingRoot, 'manifest.json'), resolve(seedsRoot, 'manifest.json'))
    const swept = await sweepUnlisted(manifest)
    await rm(journalPath, { force: true })

    const rows = entries.reduce((sum, t) => sum + t.rows, 0)
    const files = entries.reduce((sum, t) => sum + t.files.length, 0)
    console.log(JSON.stringify({ event: 'seed-export', tables: entries.length, rows, files, swept }))
  } finally {
    await exec.close()
    await rm(stagingRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`E_SEED_EXPORT_FAILED: ${sanitizeError(error)}`)
  process.exit(1)
})
