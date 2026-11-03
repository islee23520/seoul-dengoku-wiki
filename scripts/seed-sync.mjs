#!/usr/bin/env node
// seed-sync.mjs — repo 편집(db/seeds) → 운영 PostgreSQL 적용 경로.
// 설계: docs/repo-edit-apply-path.md(소유자 승인 D1–D10, 2026-11-03).
//
// 계약 요약(절차 전문은 db/seeds/README.md "repo 편집 → 운영 반영"):
// - 기본값은 dry-run. repo JSONL과 PG를 읽기 전용으로 대조한 typed diff만 낸다.
// - DELETE는 영구 미지원(D2(a)). repo에서 행을 지운 것은 감지 후 적용 거부다
//   (E_SYNC_DELETE_PRESENT). DELETE/TRUNCATE/DROP 문은 이 도구에 없다.
// - v1 범위(scripts/seed-sync-scope.mjs, D1(a)) 밖 표의 repo 편집은
//   E_SYNC_OUT_OF_SCOPE로 거부한다.
// - `--apply`는 db/seeds/.sync-request.json 마커(merge 승인)가 있을 때만,
//   단일 트랜잭션에서 INSERT(ON CONFLICT DO NOTHING)와 전 컬럼 baseline
//   UPDATE(D6)만 수행한다. base가 움직였으면 E_SYNC_BASE_MOVED로 전체 rollback.
// - 적용 직후 같은 트랜잭션에서 결정적 재반출이 repo와 바이트 동일한지 확인하고
//   다르면 E_SYNC_DRIFT로 전체 rollback한다(설계 §2.1 7단계의 강화 구현:
//   rollback이 가능한 시점에 검사해 조용한 이탈을 원천 차단한다).
// - 출처는 행이 아니라 wiki.seed_sync_log에 기록한다(D3·D7 — 공개 스키마,
//   비공개 표, 공개 API 비노출, 무기한 보존).
// - manifest 재계산은 도구만 한다(D5): `--manifest-write`. 편집자가 manifest를
//   손으로 고치는 것은 금지다.
// - 연결: 읽기(dry-run/manifest-write/drift)는 WIKI_SEEDS_PG[_FILE](0600).
//   `--apply`는 WIKI_SYNC_PG[_FILE], 없으면 WIKI_SEEDS_PG[_FILE] — appliance는
//   wiki_sync_writer 자격(INSERT/UPDATE만)으로 연결한다. 값 리터럴을 SQL에
//   조립하지 않고 json_populate_recordset 파라미터로만 행을 전달한다.
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { APPLY_BATCH_ROWS, SEEDS_DIR, SHARD_ROWS, quoteIdent, sanitizeError, connectionString as seedsConnectionString } from './seed-core.mjs'
import { isSyncV1Table, syncScopeViolations, SYNC_V1_TABLES } from './seed-sync-scope.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const markerName = '.sync-request.json'

// — 인자 —
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const seedsRootArg = value('--seeds-root')
const seedsRoot = resolve(seedsRootArg ?? resolve(projectRoot, SEEDS_DIR))

function syncConnectionString(env = process.env) {
  if (env.WIKI_SYNC_PG !== undefined && env.WIKI_SYNC_PG_FILE !== undefined) {
    throw new Error('E_SYNC_CONFIG: WIKI_SYNC_PG와 WIKI_SYNC_PG_FILE 중 하나만 지정한다')
  }
  if (env.WIKI_SYNC_PG !== undefined && env.WIKI_SYNC_PG.trim() !== '') return env.WIKI_SYNC_PG.trim()
  if (env.WIKI_SYNC_PG_FILE !== undefined) {
    let fd
    try {
      fd = openSync(env.WIKI_SYNC_PG_FILE, constants.O_RDONLY)
      const info = fstatSync(fd)
      if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error('mode')
      return readFileSync(fd, 'utf8').trim()
    } catch {
      throw new Error('E_SYNC_CONFIG: WIKI_SYNC_PG_FILE은 그룹·기타가 읽을 수 없는 일반 파일이어야 한다')
    } finally {
      if (fd !== undefined) closeSync(fd)
    }
  }
  const fallback = seedsConnectionString(env)
  if (fallback === undefined) {
    throw new Error('E_SYNC_CONFIG: 연결을 지정하라 — WIKI_SEEDS_PG(URL) / WIKI_SEEDS_PG_FILE(0600 파일), 적용은 WIKI_SYNC_PG[_FILE] 재정의')
  }
  return fallback
}

async function sha256OfBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

async function readManifest() {
  let manifest
  try {
    manifest = JSON.parse(await readFile(resolve(seedsRoot, 'manifest.json'), 'utf8'))
  } catch (error) {
    throw new Error(`E_SYNC_MANIFEST: ${sanitizeError(error)} (npm run seed:export 먼저)`)
  }
  const violations = syncScopeViolations(SYNC_V1_TABLES)
  if (violations.length > 0) {
    throw new Error(`E_SYNC_SCOPE: sync v1 범위가 이중 경계(공개 AND 시드)를 벗어났다 — ${violations.join(', ')}`)
  }
  return manifest
}

async function assertNoPendingJournal() {
  try {
    await stat(resolve(seedsRoot, '.promote-pending.json'))
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  throw new Error('E_SEED_PROMOTE_PENDING: 반출 승격이 중단된 상태다 — npm run seed:export를 재실행해 완료하라')
}

// manifest가 등록한 파일 외에 존재하는 *.jsonl(편집자가 새로 만든 파일)과
// 파일 sha 불일치를 찾는다. v1 범위 밖 표의 변경은 여기서 걸린다.
async function repoDivergence(manifest) {
  const listed = new Set()
  for (const table of manifest.tables) for (const { file } of table.files) listed.add(file)
  const walked = []
  const walk = async (relDir) => {
    for (const entry of await readdir(resolve(seedsRoot, relDir), { withFileTypes: true })) {
      const rel = relDir === '' ? entry.name : `${relDir}/${entry.name}`
      if (entry.isDirectory()) await walk(rel)
      else if (rel.endsWith('.jsonl')) walked.push(rel)
    }
  }
  await walk('')
  const unlistedFiles = walked.filter((rel) => !listed.has(rel))
  const shaMismatches = []
  for (const table of manifest.tables) {
    for (const { file, sha256 } of table.files) {
      const bytes = await readFile(resolve(seedsRoot, file))
      if (await sha256OfBytes(bytes) !== sha256) shaMismatches.push({ table: table.table, file })
    }
  }
  return { unlistedFiles, shaMismatches }
}

function outOfScopeDetail(manifest, divergence) {
  const tables = new Set(divergence.shaMismatches.filter((m) => !isSyncV1Table(m.table)).map((m) => m.table))
  const unscopedUnlisted = divergence.unlistedFiles.map((file) => {
    const base = file.split('/').pop().replace(/\.part-\d+\.jsonl$/, '').replace(/\.jsonl$/, '')
    return { file, table: base }
  })
  return { tables: [...tables].sort(), unlisted_files: unscopedUnlisted }
}

async function readRepoLines(entry) {
  const lines = []
  for (const { file } of entry.files) {
    const text = await readFile(resolve(seedsRoot, file), 'utf8')
    for (const line of text.split('\n')) if (line !== '') lines.push(line)
  }
  return lines
}

const pkMatch = (aliasA, aliasB, pk) =>
  pk.map((c) => `${quoteIdent(aliasA)}.${quoteIdent(c)} IS NOT DISTINCT FROM ${quoteIdent(aliasB)}.${quoteIdent(c)}`).join(' AND ')
const allColsMatch = (aliasA, aliasB, cols) =>
  cols.map((c) => `${quoteIdent(aliasA)}.${quoteIdent(c)} IS NOT DISTINCT FROM ${quoteIdent(aliasB)}.${quoteIdent(c)}`).join(' AND ')
const anyColDiffers = (aliasA, aliasB, cols) =>
  cols.map((c) => `${quoteIdent(aliasA)}.${quoteIdent(c)} IS DISTINCT FROM ${quoteIdent(aliasB)}.${quoteIdent(c)}`).join(' OR ')

// 범위 표 한 개의 typed diff. 값은 전부 PG 타입으로 비교한다(JS 숫자 왕복 없음).
async function diffTable(client, entry, repoLines) {
  const t = quoteIdent('wiki') + '.' + quoteIdent(entry.table)
  const cols = entry.columns
  const pk = entry.primary_key
  const repoJson = `[${repoLines.join(',')}]`
  const order = pk.map((c) => quoteIdent('p') + '.' + quoteIdent(c)).join(', ')
  const insertRows = (await client.query(
    `SELECT row_to_json(x)::text AS line FROM (
       SELECT ${cols.map((c) => quoteIdent('r') + '.' + quoteIdent(c)).join(', ')}
       FROM json_populate_recordset(NULL::${t}, $1::json) AS r
       WHERE NOT EXISTS (SELECT 1 FROM ${t} AS p WHERE ${pkMatch('p', 'r', pk)})
     ) AS x ORDER BY ${pk.map((c) => quoteIdent('x') + '.' + quoteIdent(c)).join(', ')}`,
    [repoJson],
  )).rows.map((row) => row.line)
  const deleteRows = (await client.query(
    `SELECT row_to_json(p)::text AS line FROM ${t} AS p
     WHERE NOT EXISTS (SELECT 1 FROM json_populate_recordset(NULL::${t}, $1::json) AS r WHERE ${pkMatch('p', 'r', pk)})
     ORDER BY ${order}`,
    [repoJson],
  )).rows.map((row) => row.line)
  const updateRows = (await client.query(
    `SELECT row_to_json(p)::text AS base, row_to_json(r)::text AS next
     FROM ${t} AS p
     JOIN json_populate_recordset(NULL::${t}, $1::json) AS r ON ${pkMatch('p', 'r', pk)}
     WHERE ${anyColDiffers('p', 'r', cols)}
     ORDER BY ${order}`,
    [repoJson],
  )).rows
  return { insert: insertRows, delete: deleteRows, update: updateRows }
}

// 적용 검증용 재반출: seed-export와 동일한 SQL로 바이트를 만든다.
function reexportSql(entry) {
  const cols = entry.columns.map((c) => quoteIdent('x') + '.' + quoteIdent(c)).join(', ')
  const order = entry.primary_key.map((c) => quoteIdent('x') + '.' + quoteIdent(c)).join(', ')
  return `SELECT row_to_json(x)::text AS line FROM (SELECT ${entry.columns.map((c) => quoteIdent(c)).join(', ')} FROM ${quoteIdent('wiki')}.${quoteIdent(entry.table)}) AS x ORDER BY ${order}`
}

// repo 행을 PG 타입으로 정규화해 결정적 순서(PK 오름차순)로 돌려준다.
// --manifest-write 가 이 출력으로 JSONL 을 다시 쓴다(편집자 형식 노이즈 제거).
async function canonicalLines(client, entry, repoLines) {
  const t = quoteIdent('wiki') + '.' + quoteIdent(entry.table)
  const order = entry.primary_key.map((c) => quoteIdent('x') + '.' + quoteIdent(c)).join(', ')
  const rows = (await client.query(
    `SELECT row_to_json(x)::text AS line FROM (SELECT * FROM json_populate_recordset(NULL::${t}, $1::json) AS r) AS x ORDER BY ${order}`,
    [`[${repoLines.join(',')}]`],
  )).rows
  return rows.map((row) => row.line)
}

function pkOf(line, pk) {
  const row = JSON.parse(line)
  const out = {}
  for (const c of pk) out[c] = row[c]
  return out
}

async function computeDiff(client, manifest) {
  const divergence = await repoDivergence(manifest)
  const outOfScope = outOfScopeDetail(manifest, divergence)
  const entries = manifest.tables.filter((t) => isSyncV1Table(t.table))
  const missing = SYNC_V1_TABLES.filter((name) => !entries.some((e) => e.table === name))
  if (missing.length > 0) throw new Error(`E_SYNC_SCOPE: manifest에 v1 범위 표가 없다 — ${missing.join(', ')} (npm run seed:export 먼저)`)
  const tables = []
  const plan = new Map()
  for (const entry of entries) {
    const repoLines = await readRepoLines(entry)
    const d = await diffTable(client, entry, repoLines)
    plan.set(entry.table, { entry, repoLines, diff: d })
    tables.push({
      table: entry.table,
      insert: d.insert.map((line) => ({ pk: pkOf(line, entry.primary_key), row: JSON.parse(line) })),
      update: d.update.map((r) => ({ pk: pkOf(r.base, entry.primary_key), base: JSON.parse(r.base), next: JSON.parse(r.next) })),
      delete: d.delete.map((line) => ({ pk: pkOf(line, entry.primary_key), row: JSON.parse(line) })),
      out_of_scope: [],
    })
  }
  const deleteTables = tables.filter((t) => t.delete.length > 0).map((t) => ({ table: t.table, rows: t.delete.length }))
  let reason = null
  let detail = null
  if (outOfScope.tables.length > 0 || outOfScope.unlisted_files.length > 0) {
    reason = 'E_SYNC_OUT_OF_SCOPE'
    detail = outOfScope
  } else if (deleteTables.length > 0) {
    reason = 'E_SYNC_DELETE_PRESENT'
    detail = { tables: deleteTables }
  }
  const manifestBytes = await readFile(resolve(seedsRoot, 'manifest.json'))
  const artifact = {
    event: 'seed-sync-diff',
    base: { manifest_sha256: await sha256OfBytes(manifestBytes), pg_read_at: new Date().toISOString() },
    tables,
    refused: { reason, detail },
  }
  // diff_sha256는 시각 같은 휘발 값 없이 안정 부분만으로 계산한다: 같은 repo·PG 상태에서는
  // 마커 생성 시점과 적용 시점에 같은 해시가 나와야 재검증이 성립한다.
  const stable = {
    event: artifact.event,
    base: { manifest_sha256: artifact.base.manifest_sha256 },
    tables: artifact.tables,
    refused: artifact.refused,
  }
  artifact.diff_sha256 = await sha256OfBytes(Buffer.from(JSON.stringify(stable), 'utf8'))
  return { artifact, plan, divergence, outOfScope }
}

// — 모드: dry-run(기본) —
async function dryRun(pool, manifest) {
  const client = await pool.connect()
  try {
    const { artifact } = await computeDiff(client, manifest)
    return artifact
  } finally {
    client.release()
  }
}

// — 모드: --manifest-write (D5: manifest 재계산은 도구만) —
async function manifestWrite(pool, manifest) {
  const client = await pool.connect()
  try {
    const changed = []
    for (const entry of manifest.tables.filter((t) => isSyncV1Table(t.table))) {
      const repoLines = await readRepoLines(entry)
      const canonical = await canonicalLines(client, entry, repoLines)
      const current = entry.files.map((f) => f.file).join('|')
      const shards = Math.max(1, Math.ceil(canonical.length / SHARD_ROWS))
      const newFiles = []
      for (let i = 0; i < shards; i += 1) {
        const part = canonical.slice(i * SHARD_ROWS, (i + 1) * SHARD_ROWS)
        const domain = entry.domain
        const rel = shards === 1
          ? `${domain}/${entry.table}.jsonl`
          : `${domain}/${entry.table}.part-${String(i + 1).padStart(3, '0')}.jsonl`
        const bytes = Buffer.from(`${part.join('\n')}\n`, 'utf8')
        await mkdir(dirname(resolve(seedsRoot, rel)), { recursive: true })
        await writeFile(resolve(seedsRoot, rel), bytes)
        newFiles.push({ file: rel, rows: part.length, sha256: await sha256OfBytes(bytes) })
      }
      const newSignature = newFiles.map((f) => f.file).join('|')
      const rowsChanged = entry.rows !== canonical.length
      const shaChanged = newFiles.some((nf) => { const old = entry.files.find((f) => f.file === nf.file); return old === undefined || old.sha256 !== nf.sha256 })
      if (newSignature !== current || rowsChanged || shaChanged) {
        for (const old of entry.files) if (!newFiles.some((nf) => nf.file === old.file)) await rm(resolve(seedsRoot, old.file), { force: true })
        entry.files = newFiles
        entry.rows = canonical.length
        changed.push({ table: entry.table, rows: canonical.length, files: newFiles })
      }
    }
    if (changed.length > 0) {
      await writeFile(resolve(seedsRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8' })
    }
    return { event: 'seed-sync-manifest', changed_tables: changed.length, tables: changed }
  } finally {
    client.release()
  }
}

// — 모드: --write-marker <pr> —
async function writeMarker(pool, manifest, pr) {
  const artifact = await dryRun(pool, manifest)
  if (artifact.refused.reason !== null) {
    throw new Error(`E_SYNC_REFUSED: 거부된 diff에는 마커를 쓸 수 없다 — ${artifact.refused.reason}`)
  }
  const changes = artifact.tables.reduce((sum, t) => sum + t.insert.length + t.update.length, 0)
  if (changes === 0) throw new Error('E_SYNC_MARKER_EMPTY: 변경이 없는 diff에는 마커를 쓰지 않는다')
  const marker = { base_manifest_sha256: artifact.base.manifest_sha256, diff_sha256: artifact.diff_sha256, pr }
  await writeFile(resolve(seedsRoot, markerName), `${JSON.stringify(marker, null, 2)}\n`, { encoding: 'utf8' })
  return { event: 'seed-sync-marker', path: `${SEEDS_DIR}/${markerName}`, ...marker }
}

// — 모드: --apply —
async function applyFlow(pool, manifest) {
  const mergeSha = value('--merge-sha') ?? process.env.WIKI_SYNC_MERGE_SHA
  if (mergeSha === undefined || mergeSha.trim() === '') throw new Error('E_SYNC_CONFIG: --merge-sha 또는 WIKI_SYNC_MERGE_SHA가 필요하다(출처 로그)')
  const dumpSha = value('--pre-apply-dump-sha256') ?? null
  let marker
  try {
    marker = JSON.parse(await readFile(resolve(seedsRoot, markerName), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`E_SYNC_MARKER_MISSING: ${SEEDS_DIR}/${markerName} 마커(merge 승인)가 없다 — 적용은 merge된 마커를 통해서만`)
    throw new Error(`E_SYNC_MARKER_INVALID: ${sanitizeError(error)}`)
  }
  const manifestBytes = await readFile(resolve(seedsRoot, 'manifest.json'))
  const manifestSha = await sha256OfBytes(manifestBytes)
  if (manifestSha !== marker.base_manifest_sha256) {
    throw new Error('E_SYNC_MARKER_MISMATCH: 마커의 base_manifest_sha256가 현재 트리와 다르다 — diff·마커를 다시 만들어라')
  }
  const client = await pool.connect()
  try {
    const already = await client.query('SELECT 1 FROM wiki.seed_sync_log WHERE diff_sha256 = $1 LIMIT 1', [marker.diff_sha256])
    if ((already.rowCount ?? 0) > 0) throw new Error('E_SYNC_ALREADY_APPLIED: 이 diff는 이미 적용됐다(seed_sync_log 참조)')
    const present = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='wiki' AND table_type='BASE TABLE'`)
    const names = new Set(present.rows.map((r) => r.table_name))
    const missing = SYNC_V1_TABLES.filter((t) => !names.has(t))
    if (missing.length > 0) throw new Error(`E_SYNC_SCHEMA_MISSING: 대상에 없는 테이블 — ${missing.join(', ')}`)
    if (!names.has('seed_sync_log')) throw new Error('E_SYNC_SCHEMA_MISSING: wiki.seed_sync_log가 없다 — npm run db:migrate 먼저')

    const { artifact, plan } = await computeDiff(client, manifest)
    if (artifact.refused.reason !== null) {
      throw new Error(`E_SYNC_REFUSED: ${artifact.refused.reason} — ${JSON.stringify(artifact.refused.detail)}`)
    }
    if (artifact.diff_sha256 !== marker.diff_sha256) {
      throw new Error('E_SYNC_MARKER_MISMATCH: 현재 diff가 마커의 diff_sha256와 다르다 — PG가 움직였다. diff를 다시 만들어 rebase하라')
    }
    // 정규형 검사: 적용 검증은 바이트 비교이므로 repo JSONL이 PG 정규형이어야 한다.
    for (const { entry, repoLines } of plan.values()) {
      const canonical = await canonicalLines(client, entry, repoLines)
      if (canonical.length !== repoLines.length || canonical.some((line, i) => line !== repoLines[i])) {
        throw new Error(`E_SYNC_NOT_CANONICAL: ${entry.table} JSONL이 PG 정규형이 아니다 — npm run seed:sync -- --manifest-write 먼저`)
      }
    }

    const inserts = artifact.tables.reduce((s, t) => s + t.insert.length, 0)
    const updates = artifact.tables.reduce((s, t) => s + t.update.length, 0)
    await client.query('BEGIN')
    try {
      for (const { entry, diff } of plan.values()) {
        const t = quoteIdent('wiki') + '.' + quoteIdent(entry.table)
        const cols = entry.columns.map((c) => quoteIdent(c)).join(', ')
        const selCols = entry.columns.map((c) => `${quoteIdent('s')}.${quoteIdent(c)}`).join(', ')
        const setCols = entry.columns.map((c) => `${quoteIdent(c)} = ${quoteIdent('r')}.${quoteIdent(c)}`).join(', ')
        for (let i = 0; i < diff.insert.length; i += APPLY_BATCH_ROWS) {
          const batch = diff.insert.slice(i, i + APPLY_BATCH_ROWS)
          await client.query(
            `INSERT INTO ${t} (${cols}) SELECT ${selCols} FROM json_populate_recordset(NULL::${t}, $1::json) AS s ON CONFLICT DO NOTHING`,
            [`[${batch.join(',')}]`],
          )
        }
        for (const row of diff.update) {
          const res = await client.query(
            `UPDATE ${t} AS p SET ${setCols}
             FROM json_populate_recordset(NULL::${t}, $1::json) AS r, json_populate_recordset(NULL::${t}, $2::json) AS b
             WHERE ${pkMatch('p', 'r', entry.primary_key)} AND ${pkMatch('p', 'b', entry.primary_key)} AND ${allColsMatch('p', 'b', entry.columns)}`,
            [`[${row.next}]`, `[${row.base}]`],
          )
          if ((res.rowCount ?? 0) !== 1) {
            throw new Error(`E_SYNC_BASE_MOVED: ${entry.table} baseline 불일치 — 리뷰 후 적용 전에 PG가 움직였다. seed:export로 rebase하라`)
          }
        }
      }
      // 재수렴 검증: 적용된 PG에서 결정적 재반출이 repo와 바이트 동일해야 한다.
      for (const { entry, repoLines } of plan.values()) {
        const lines = (await client.query(reexportSql(entry))).rows.map((row) => row.line)
        if (lines.length !== repoLines.length || lines.some((line, i) => line !== repoLines[i])) {
          throw new Error(`E_SYNC_DRIFT: ${entry.table} 적용 후 재반출이 repo와 바이트가 다르다`)
        }
      }
      await client.query(
        `INSERT INTO wiki.seed_sync_log
           (merge_sha, pr, tables, rows, diff_sha256, base_manifest_sha256, pre_apply_dump_sha256, outcome)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, 'applied')`,
        [mergeSha, marker.pr, JSON.stringify(artifact.tables.map((t) => t.table)),
          JSON.stringify({ insert: inserts, update: updates }), marker.diff_sha256, marker.base_manifest_sha256, dumpSha],
      )
      await client.query('COMMIT')
      return {
        event: 'seed-sync-apply', outcome: 'applied', merge_sha: mergeSha, pr: marker.pr,
        tables: artifact.tables.map((t) => t.table), rows: { insert: inserts, update: updates },
        diff_sha256: marker.diff_sha256, pre_apply_dump_sha256: dumpSha,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      if (String(error.message).startsWith('E_SYNC_DRIFT')) {
        // drift도 출처 로그에 남긴다(D9): 시도 자체가 운영 이력이다.
        try {
          await client.query(
            `INSERT INTO wiki.seed_sync_log
               (merge_sha, pr, tables, rows, diff_sha256, base_manifest_sha256, pre_apply_dump_sha256, outcome, notes)
             VALUES ($1, $2, '[]'::jsonb, '{}'::jsonb, $3, $4, $5, 'drift', $6)`,
            [mergeSha, marker.pr, marker.diff_sha256, marker.base_manifest_sha256, dumpSha, sanitizeError(error)],
          )
        } catch (logError) {
          console.error(`E_SYNC_LOG_WRITE_FAILED: ${sanitizeError(logError)}`)
        }
      }
      throw error
    }
  } finally {
    client.release()
  }
}

// — 모드: --drift (D8: repo↔PG 이탈 감시, appliance 주간 실행) —
async function driftFlow(pool, manifest) {
  const client = await pool.connect()
  try {
    const rows = []
    for (const entry of manifest.tables) {
      const fileBytes = await Promise.all(entry.files.map(async (f) => await readFile(resolve(seedsRoot, f.file))))
      const repoBytes = Buffer.concat(fileBytes)
      const repoConcatSha = await sha256OfBytes(repoBytes)
      let repoEdited = false
      for (let i = 0; i < entry.files.length; i += 1) {
        if (await sha256OfBytes(fileBytes[i]) !== entry.files[i].sha256) { repoEdited = true; break }
      }
      const pgLines = (await client.query(reexportSql(entry))).rows.map((row) => row.line)
      const pgSha = await sha256OfBytes(Buffer.from(`${pgLines.join('\n')}\n`, 'utf8'))
      let status = 'match'
      if (repoEdited && pgSha === repoConcatSha) status = 'repo-edited'
      else if (!repoEdited && pgSha !== repoConcatSha) status = 'pg-drift'
      else if (repoEdited && pgSha !== repoConcatSha) status = 'diverged'
      rows.push({ table: entry.table, status, rows: pgLines.length })
    }
    const summary = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})
    return { event: 'seed-sync-drift', checked_at: new Date().toISOString(), summary, mismatched: rows.filter((r) => r.status !== 'match') }
  } finally {
    client.release()
  }
}

async function main() {
  const manifest = await readManifest()
  await assertNoPendingJournal()
  const url = syncConnectionString()
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  try {
    if (flag('--drift')) console.log(JSON.stringify(await driftFlow(pool, manifest)))
    else if (flag('--manifest-write')) console.log(JSON.stringify(await manifestWrite(pool, manifest)))
    else if (flag('--write-marker')) {
      const pr = Number(value('--write-marker'))
      if (!Number.isInteger(pr) || pr <= 0) throw new Error('E_SYNC_CONFIG: --write-marker <PR 번호>가 필요하다')
      console.log(JSON.stringify(await writeMarker(pool, manifest, pr)))
    } else if (flag('--apply')) console.log(JSON.stringify(await applyFlow(pool, manifest)))
    else console.log(JSON.stringify(await dryRun(pool, manifest)))
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(`E_SYNC_FAILED: ${sanitizeError(error)}`)
  process.exit(1)
})
