import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, mkdtemp, rm, cp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseSeedRow, seedRowKey } from './seed-lossless.mjs'
import { SEED_EDIT_OPERATIONS, assertSeedEdit } from './seed-edit-scope.mjs'
import { projectRoot, sha256, jsonBytes, readSeedSnapshot, diffSnapshots, buildPayload, migrationSql, sqlJson, orderChanges, parseTableRows, emitMigration, validateDomains } from './seed-sync.mjs'
import { verifyDataPayload, readMigrationInventory } from './check-migration-provenance.mjs'

const exec = promisify(execFile)
const schema = (table = 'state', columns = [{ name: 'state_id', type: 'text', nullable: false }, { name: 'name_ko', type: 'text', nullable: true }], primary_key = ['state_id']) => ({ table, columns, primary_key, foreignKeys: [] })
async function snapshot(lines, definition = schema()) {
  const text = `${lines.join('\n')}\n`, file = `misc/${definition.table}.jsonl`
  const entry = { table: definition.table, domain: 'misc', columns: definition.columns.map(c => c.name), primary_key: definition.primary_key, rows: lines.length, files: [{ file, rows: lines.length, sha256: sha256(text) }] }
  const manifestText = jsonBytes({ format: 'wiki-seeds/1', schema: 'wiki', tables: [entry] })
  const catalog = new Map([[definition.table, definition]])
  return { value: await readSeedSnapshot({ manifestText, read: async () => text, catalog, baseline: true }), catalog }
}
async function fixture(before = ['{"state_id":"a","name_ko":"before"}'], after = ['{"state_id":"a","name_ko":"after"}'], definition = schema()) {
  const a = await snapshot(before, definition), b = await snapshot(after, definition)
  return { base: a.value, next: b.value, catalog: a.catalog }
}
const payloadOf = f => buildPayload({ ...f, changes: diffSnapshots(f.base, f.next, f.catalog), baseRef: 'a'.repeat(40), actor: 'qa', reason: 'fixture', changeId: 'fixture-change' })

// A transaction model for refusal invariants only. It does NOT claim to execute
// PL/pgSQL or replace the later P3 native PostgreSQL scratch acceptance.
function modelApply(state, payload, { failAt = -1 } = {}) {
  const draft = structuredClone(state)
  for (const change of payload.delta.filter(c => c.operation === 'insert')) if (draft.rows.includes(change.after)) throw Error('E_SYNC_INSERT_EXISTS')
  for (const table of payload.tables) if (JSON.stringify(draft.rows) !== JSON.stringify(table.before)) throw Error('E_SYNC_BASE_MOVED')
  for (const [i, change] of payload.delta.entries()) {
    if (i === failAt) throw Error('E_FIXTURE_MID_MIGRATION')
    if (change.operation === 'insert') draft.rows.push(change.after)
    else draft.rows[draft.rows.indexOf(change.before)] = change.after
  }
  draft.ledger.push(sha256(migrationSql(payload)))
  Object.assign(state, draft)
}

test('explicit per-table operation matrix keeps both immutable tables INSERT-only', () => {
  assert.equal(Object.keys(SEED_EDIT_OPERATIONS).length, 12)
  for (const table of ['current_region_disposition', 'current_right_retirement']) {
    assert.deepEqual(SEED_EDIT_OPERATIONS[table], ['insert'])
    assert.throws(() => assertSeedEdit(table, 'update'), /E_SYNC_OPERATION/)
  }
  assert.throws(() => assertSeedEdit('text_document', 'insert'), /E_SYNC_OUT_OF_SCOPE/)
})

test('lossless bigint, NULL, float, bytea, quotes and newline keep original numeric tokens', () => {
  const line = '{"id":9223372036854775807,"negative":-9223372036854775808,"float":1.2345678901234567e-20,"empty":null,"bytes":"\\\\x00ff","text":"한글 \\"\\n"}'
  // Construct the text string with JSON.stringify so the fixture itself is valid.
  const valid = line.slice(0, line.indexOf(',"text"')) + ',"text":' + JSON.stringify('한글 "\n') + '}'
  const row = parseSeedRow(valid)
  assert.equal(row.values.id, 9223372036854775807n)
  assert.equal(row.tokens.float, '1.2345678901234567e-20')
  assert.equal(row.values.empty, null)
  assert.equal(row.values.bytes, '\\x00ff')
  assert.equal(seedRowKey(row, ['id']), '[9223372036854775807]')
  assert.deepEqual(parseSeedRow(row.canonical), row)
})

test('duplicate columns, malformed JSON and invalid text are refused', () => {
  for (const text of ['{"a":1,"a":2}', '{"a":1,}', '{"a":[]}', '{"a":1} garbage', '{"a":"\\u0000"}', '{"a":"\\ud800"}']) assert.throws(() => parseSeedRow(text), /E_SYNC_/)
})

test('out of range bigint, duplicate PK, row order, NULL PK and schema edits fail', () => {
  const s = schema('geography_map_title', [{ name: 'ordinal', type: 'bigint', nullable: false }, { name: 'ref', type: 'text', nullable: true }], ['ordinal'])
  for (const [text, code] of [
    ['{"ordinal":9223372036854775808,"ref":null}\n', 'BIGINT'],
    ['{"ordinal":1,"ref":null}\n{"ordinal":1,"ref":"a"}\n', 'DUPLICATE_PK'],
    ['{"ordinal":2,"ref":null}\n{"ordinal":1,"ref":"a"}\n', 'ROW_ORDER'],
    ['{"ordinal":null,"ref":null}\n', 'NULL'],
    ['{"ordinal":1,"extra":"a"}\n', 'SCHEMA_CHANGED'],
  ]) assert.throws(() => parseTableRows([text], s), new RegExp(`E_SYNC_${code}`))
})

test('baseline manifest bytes and row counts are independently verified', async () => {
  const { value, catalog } = await snapshot(['{"state_id":"a","name_ko":"before"}'])
  await assert.rejects(readSeedSnapshot({ manifestText: value.manifestText, read: async () => '{"state_id":"a","name_ko":"tampered"}\n', catalog, baseline: true }), /E_SYNC_BASE_MANIFEST/)
})

test('historical text collation order is preserved rather than guessed from UTF-8', async () => {
  const before = ['{"state_id":"z","name_ko":"z"}', '{"state_id":"a","name_ko":"a"}']
  const f = await fixture(before, [before[0], '{"state_id":"a","name_ko":"changed"}'])
  assert.equal(payloadOf(f).delta.length, 1)
  const reordered = await fixture(before, [...before].reverse())
  assert.throws(() => payloadOf(reordered), /E_SYNC_ROW_ORDER/)
})

for (const [name, before, after, definition, code] of [
  ['DELETE', ['{"state_id":"a","name_ko":"before"}'], [], schema(), 'E_SYNC_DELETE_PRESENT'],
  ['PK change', ['{"state_id":"a","name_ko":"before"}'], ['{"state_id":"b","name_ko":"before"}'], schema(), 'E_SYNC_PK_CHANGE'],
  ['state_label name is part of PK', ['{"state_id":"a","name_ko":"before"}'], ['{"state_id":"a","name_ko":"after"}'], schema('state_label', schema().columns, ['state_id', 'name_ko']), 'E_SYNC_PK_CHANGE'],
  ['out-of-scope text edit', ['{"state_id":"a","name_ko":"before"}'], ['{"state_id":"a","name_ko":"after"}'], schema('text_document'), 'E_SYNC_OUT_OF_SCOPE'],
  ['immutable UPDATE', ['{"state_id":"a","name_ko":"before"}'], ['{"state_id":"a","name_ko":"after"}'], schema('current_region_disposition'), 'E_SYNC_OPERATION'],
]) test(`${name} refusal leaves fixture rows and ledger untouched`, async () => {
  const f = await fixture(before, after, definition), state = { rows: before, ledger: [] }, original = structuredClone(state)
  assert.throws(() => payloadOf(f), new RegExp(code))
  assert.deepEqual(state, original)
})

test('baseline drift refuses atomically; valid non-PK UPDATE has full baseline lock SQL', async () => {
  const payload = payloadOf(await fixture())
  const state = { rows: ['{"name_ko":"moved","state_id":"a"}'], ledger: [] }, original = structuredClone(state)
  assert.throws(() => modelApply(state, payload), /E_SYNC_BASE_MOVED/)
  assert.deepEqual(state, original)
  const sql = migrationSql(payload)
  assert.match(sql, /FOR UPDATE OF t/)
  assert.match(sql, /t\."name_ko" IS NOT DISTINCT FROM b\."name_ko"/)
  assert.match(sql, /t\."state_id" IS NOT DISTINCT FROM b\."state_id"/)
  assert.match(sql, /GET DIAGNOSTICS affected = ROW_COUNT/)
  assert.match(sql, /SHARE ROW EXCLUSIVE MODE/)
  assert.equal((sql.match(/sha256\(convert_to/g) ?? []).length, 4)
})

test('INSERT PK conflict refuses with rows and ledger untouched', async () => {
  const payload = payloadOf(await fixture([], ['{"state_id":"a","name_ko":"after"}']))
  const state = { rows: [payload.delta[0].after], ledger: [] }, original = structuredClone(state)
  assert.throws(() => modelApply(state, payload), /E_SYNC_INSERT_EXISTS/)
  assert.deepEqual(state, original)
  assert.match(migrationSql(payload), /EXCEPTION WHEN unique_violation/)
  assert.doesNotMatch(migrationSql(payload), /ON CONFLICT DO NOTHING/)
})

test('middle migration failure rolls fixture rows and ledger back', async () => {
  const payload = payloadOf(await fixture([], ['{"state_id":"a","name_ko":"a"}', '{"state_id":"b","name_ko":"b"}']))
  const state = { rows: [], ledger: [] }
  assert.throws(() => modelApply(state, payload, { failAt: 1 }), /E_FIXTURE_MID_MIGRATION/)
  assert.deepEqual(state, { rows: [], ledger: [] })
})

test('quotation injection is encoded data, never SQL or a Drizzle delimiter', async () => {
  const attack = "'); DELETE FROM wiki.state; --\n$sync$\n--> statement-breakpoint"
  const f = await fixture(undefined, [JSON.stringify({ state_id: 'a', name_ko: attack })])
  const payload = payloadOf(f), sql = migrationSql({ ...payload, actor: attack, reason: attack })
  assert.ok(!sql.includes(attack)); assert.ok(!sql.includes('DELETE FROM'))
  const encoded = sqlJson(payload.delta[0].after).match(/decode\('([a-f0-9]+)'/)[1]
  assert.equal(parseSeedRow(Buffer.from(encoded, 'hex').toString()).values.name_ko, attack)
  const state = { rows: [...payload.tables[0].before], ledger: [] }
  modelApply(state, payload)
  assert.equal(state.rows[0], payload.delta[0].after)
  assert.equal(state.ledger.length, 1)
})

test('dependency sort orders parent INSERT first and refuses self/cyclic rows', () => {
  const s = schema(); s.foreignKeys = [{ columns: ['name_ko'], table: 'state', references: ['state_id'] }]
  const catalog = new Map([['state', s]])
  const child = { table: 'state', operation: 'insert', after: '{"state_id":"a","name_ko":"z"}' }, parent = { table: 'state', operation: 'insert', after: '{"state_id":"z","name_ko":null}' }
  assert.deepEqual(orderChanges([child, parent], catalog), [parent, child])
  assert.throws(() => orderChanges([child, { ...parent, after: '{"state_id":"z","name_ko":"a"}' }], catalog), /E_SYNC_FK_CYCLE/)
})

test('domain reader rejects invented retirement decisions instead of relaxing fixed approval rules', async () => {
  await assert.rejects(validateDomains({ tables: new Map() }, [{ table: 'current_right_retirement' }]), /E_CIA_CURRENT_RIGHTS/)
  await assert.rejects(validateDomains({ tables: new Map() }, [{ table: 'retirement_prose' }]), /E_RETIREMENT_PROSE/)
})

test('pinned custom generator produces journal/meta and independently reproducible payload', async t => {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-seed-sync-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const dir of ['db/migrations/meta', 'db/seeds/misc', 'scripts/postgres-migration/schema-pg']) await mkdir(resolve(root, dir), { recursive: true })
  await cp(resolve(projectRoot, 'db/migrations'), resolve(root, 'db/migrations'), { recursive: true })
  await symlink(resolve(projectRoot, 'node_modules'), resolve(root, 'node_modules'), 'junction')
  const f = await fixture(), definition = 'CREATE TABLE wiki."state" (\n  "state_id" text NOT NULL,\n  "name_ko" text,\n  PRIMARY KEY ("state_id")\n);\n'
  await writeFile(resolve(root, 'scripts/postgres-migration/schema-pg/tables.sql'), definition)
  await writeFile(resolve(root, 'scripts/postgres-migration/schema-pg/constraints.sql'), '')
  await writeFile(resolve(root, 'db/seeds/manifest.json'), f.base.manifestText)
  await writeFile(resolve(root, 'db/seeds/misc/state.jsonl'), f.base.files.get('misc/state.jsonl'))
  await exec('git', ['init', root]); await exec('git', ['-C', root, 'add', 'db', 'scripts'])
  await exec('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture baseline'])
  const baseRef = (await exec('git', ['-C', root, 'rev-parse', 'HEAD'])).stdout.trim()
  const payload = buildPayload({ ...f, changes: diffSnapshots(f.base, f.next, f.catalog), baseRef, actor: 'qa', reason: 'fixture', changeId: 'fixture-change' })
  await writeFile(resolve(root, 'db/seeds/misc/state.jsonl'), f.next.files.get('misc/state.jsonl'))
  const emitted = await emitMigration({ root, name: 'fixture', payload, targetManifestText: f.next.manifestText })
  assert.match(emitted.tag, /^0001_data_fixture$/)
  const inventory = await readMigrationInventory({ root })
  assert.equal(inventory.length, 2)
  assert.equal(inventory[1].payload.baseSeedManifestSha256, sha256(f.base.manifestText))
  assert.equal(inventory[1].payload.actor, 'qa')
  await assert.rejects(verifyDataPayload(root, { ...payload, baseSeedManifestSha256: '0'.repeat(64) }, migrationSql(payload)), /E_PROVENANCE_BASE_MANIFEST/)
  await assert.rejects(verifyDataPayload(root, payload, migrationSql(payload) + ' '), /E_PROVENANCE_REPRODUCTION/)
  await assert.rejects(emitMigration({ root, name: 'fixture', payload, targetManifestText: f.next.manifestText }), /E_SYNC_CHANGE_ID_EXISTS/)
})
