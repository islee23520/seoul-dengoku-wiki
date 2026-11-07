import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { readMigrationInventory, verifyLedger, ledgerDigest, verifySnapshot } from './check-migration-provenance.mjs'
import { runMigrations, PROJECTION_ENV, verifyProjectionStatePrecondition, triggerPostRefreshService } from './db-migrate.mjs'
import { sha256, jsonBytes, projectRoot } from './seed-sync.mjs'
import { assertScratchTarget, publicSchemaSql } from './scratch-bootstrap.mjs'

async function migrationFixture(t, statements = ['SELECT fixture_write']) {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-provenance-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(resolve(root, 'db/migrations/meta'), { recursive: true })
  const journal = { version: '7', dialect: 'postgresql', entries: [] }
  let prevId = '00000000-0000-0000-0000-000000000000'
  for (const [idx, text] of statements.entries()) {
    const prefix = String(idx).padStart(4, '0'), id = randomUUID()
    journal.entries.push({ idx, version: '7', when: 1000 + idx, tag: `${prefix}_fixture`, breakpoints: true })
    await writeFile(resolve(root, `db/migrations/${prefix}_fixture.sql`), text)
    await writeFile(resolve(root, `db/migrations/meta/${prefix}_snapshot.json`), jsonBytes({ id, prevId, version: '7', dialect: 'postgresql', tables: {} }))
    prevId = id
  }
  await writeFile(resolve(root, 'db/migrations/meta/_journal.json'), jsonBytes(journal))
  return { root, journal, entries: await readMigrationInventory({ root }) }
}

// Runs the actual pinned Drizzle dialect/session transaction over a small PG
// protocol fixture. SQL semantics/guards are reserved for real P3 scratch E2E.
class FixtureClient {
  constructor({ failWrite = false, failGrant = false, ledger = [] } = {}) {
    this.rows = []; this.ledger = structuredClone(ledger); this.events = []
    this.failWrite = failWrite; this.failGrant = failGrant; this.ledgerExists = ledger.length > 0
  }
  async query(query, values = []) {
    const sql = typeof query === 'string' ? query : query.text
    const normalized = sql.trim().toLowerCase()
    this.events.push(normalized)
    if (normalized === 'begin') this.saved = { rows: [...this.rows], ledger: structuredClone(this.ledger) }
    else if (normalized === 'commit') this.saved = null
    else if (normalized === 'rollback') { if (this.saved) Object.assign(this, this.saved); this.saved = null }
    else if (normalized.startsWith('select to_regclass')) return { rows: [{ ledger: this.ledgerExists ? 'wiki_migrations.__drizzle_migrations' : null }] }
    else if (normalized.startsWith('create table if not exists')) this.ledgerExists = true
    else if (normalized.includes('select id, hash, created_at')) return { rows: this.ledger.slice(-1) }
    else if (normalized.startsWith('select hash, created_at')) return { rows: structuredClone(this.ledger) }
    else if (normalized.startsWith('insert into "wiki_migrations"')) this.ledger.push({ hash: values[0], created_at: String(values[1]) })
    else if (normalized === 'select fixture_write') this.rows.push('changed')
    else if (normalized === 'select fixture_fail' || this.failWrite && normalized === 'select fixture_write') throw Error('E_FIXTURE_SQL_FAILURE')
    else if (normalized.startsWith('grant') && this.failGrant) throw Error('E_FIXTURE_GRANT')
    return { rows: [], rowCount: 1 }
  }
}

test('ledger requires exact hash/time prefix, no duplicate, hole or orphan', async t => {
  const { entries } = await migrationFixture(t, ['SELECT 1', 'SELECT 2'])
  const ledger = entries.map(e => ({ hash: e.hash, created_at: String(e.when) }))
  assert.equal(verifyLedger(entries, ledger).applied, 2)
  assert.equal(verifyLedger(entries, ledger.slice(0, 1), { allowPending: true }).pending.length, 1)
  for (const bad of [[ledger[1]], [ledger[0], ledger[0]], [{ ...ledger[0], hash: '0'.repeat(64) }], [...ledger, { hash: 'f'.repeat(64), created_at: '2000' }]]) assert.throws(() => verifyLedger(entries, bad), /E_PROVENANCE_LEDGER/)
  assert.throws(() => verifyLedger(entries, ledger.slice(0, 1)), /E_PROVENANCE_LEDGER_MISSING/)
  assert.equal(ledgerDigest(ledger), ledgerDigest([...ledger].reverse()))
})

for (const [label, tamper, code] of [
  ['duplicate when', j => { j.entries[1].when = j.entries[0].when }, 'JOURNAL'],
  ['renumber', j => { j.entries[1].idx = 8 }, 'JOURNAL'],
  ['path traversal', j => { j.entries[0].tag = '../secret' }, 'JOURNAL'],
  ['nonmonotone', j => { j.entries[1].when = 1 }, 'JOURNAL'],
]) test(`journal ${label} refuses before rows or ledger are touched`, async t => {
  const { root, journal } = await migrationFixture(t, ['SELECT fixture_write', 'SELECT 2'])
  tamper(journal)
  await writeFile(resolve(root, 'db/migrations/meta/_journal.json'), jsonBytes(journal))
  const client = new FixtureClient()
  await assert.rejects(runMigrations({ root, client, env: {}, log() {} }), new RegExp(`E_PROVENANCE_${code}`))
  assert.deepEqual(client.rows, []); assert.deepEqual(client.ledger, []); assert.deepEqual(client.events, [])
})

test('SQL orphan, missing file and broken snapshot chain fail preflight', async t => {
  const { root } = await migrationFixture(t)
  await writeFile(resolve(root, 'db/migrations/orphan.sql'), 'SELECT 2')
  await assert.rejects(readMigrationInventory({ root }), /E_PROVENANCE_SQL_ORPHAN/)
  await rm(resolve(root, 'db/migrations/orphan.sql'))
  const meta = resolve(root, 'db/migrations/meta/0000_snapshot.json')
  const snapshot = JSON.parse(await readFile(meta, 'utf8')); snapshot.prevId = randomUUID()
  await writeFile(meta, jsonBytes(snapshot))
  await assert.rejects(readMigrationInventory({ root }), /E_PROVENANCE_META/)
  snapshot.prevId = '00000000-0000-0000-0000-000000000000'; await writeFile(meta, jsonBytes(snapshot))
  await rm(resolve(root, 'db/migrations/0000_fixture.sql'))
  await assert.rejects(readMigrationInventory({ root }), /ENOENT/)
})

test('already applied SQL byte tamper refuses before write and ledger stays unchanged', async t => {
  const { root, entries } = await migrationFixture(t)
  const client = new FixtureClient({ ledger: [{ hash: entries[0].hash, created_at: '1000' }] })
  const before = structuredClone(client.ledger)
  await writeFile(resolve(root, 'db/migrations/0000_fixture.sql'), 'SELECT fixture_write ')
  await assert.rejects(runMigrations({ root, client, env: {}, log() {} }), /E_PROVENANCE_LEDGER_MISMATCH/)
  assert.deepEqual(client.rows, []); assert.deepEqual(client.ledger, before)
  assert.ok(!client.events.includes('begin'))
  assert.match(client.events.at(-1), /pg_advisory_unlock/)
})

test('real pinned Drizzle transaction rolls back both earlier DML and ledger on middle failure', async t => {
  const { root } = await migrationFixture(t, ['SELECT fixture_write', 'SELECT fixture_fail'])
  const client = new FixtureClient(), logs = []
  await assert.rejects(runMigrations({ root, client, env: {}, log: s => logs.push(JSON.parse(s)) }), error => error.migrationOutcome === 'rolled-back')
  assert.deepEqual(client.rows, []); assert.deepEqual(client.ledger, [])
  assert.ok(client.events.includes('rollback')); assert.ok(!client.events.includes('commit'))
  assert.equal(logs.at(-1).outcome, 'rolled-back')
})

test('precommit observer sees pending ledger; failure rolls back rows and ledger', async t => {
  const { root } = await migrationFixture(t), client = new FixtureClient()
  await assert.rejects(runMigrations({ root, client, env: {}, log() {}, beforeCommit: async receipt => {
    assert.equal(receipt.applied, 1); assert.equal(client.ledger.length, 1)
    assert.ok(!client.events.includes('commit')); throw Error('E_FIXTURE_BEFORE_COMMIT')
  } }), /E_FIXTURE_BEFORE_COMMIT/)
  assert.deepEqual(client.rows, []); assert.deepEqual(client.ledger, [])
})

test('post-GRANT failure is committed and never reported as rollback', async t => {
  const { root } = await migrationFixture(t), client = new FixtureClient({ failGrant: true })
  await assert.rejects(runMigrations({ root, client, env: {}, log() {} }), error => error.code === 'E_MIGRATE_POST_COMMIT' && error.migrationOutcome === 'applied-awaiting-projection')
  assert.deepEqual(client.rows, ['changed']); assert.equal(client.ledger.length, 1)
  assert.ok(client.events.includes('commit')); assert.ok(!client.events.includes('rollback'))
})

test('no-op reapply uses ledger and refresh runs only after both post-commit GRANTs', async t => {
  const { root } = await migrationFixture(t), client = new FixtureClient()
  let refreshes = 0
  const refresh = async () => { assert.match(client.events.at(-1), /grant select/); refreshes++ }
  assert.equal((await runMigrations({ root, client, env: {}, log() {}, refresh })).applied, 1)
  assert.equal((await runMigrations({ root, client, env: {}, log() {}, refresh })).applied, 0)
  assert.equal(client.rows.length, 1); assert.equal(client.ledger.length, 1); assert.equal(refreshes, 2)
  assert.match(client.events[0], /pg_advisory_lock/)
})

test('P4 exact environment contract verifies durable pending without writing it', async t => {
  assert.deepEqual(PROJECTION_ENV, { stateFile: 'WIKI_PROJECTION_STATE_FILE', codeRef: 'WIKI_MIGRATE_CODE_REF', refreshService: 'WIKI_MIGRATE_POST_REFRESH_SERVICE' })
  const { root } = await migrationFixture(t), path = resolve(root, 'state.json'), sha = 'a'.repeat(40)
  const env = { WIKI_PROJECTION_STATE_FILE: path, WIKI_MIGRATE_CODE_REF: sha, WIKI_MIGRATE_POST_REFRESH_SERVICE: 'seoul-wiki-project.service' }
  for (const state of [null, '{bad', jsonBytes({ status: 'current', pendingWatermark: sha }), jsonBytes({ status: 'applied-awaiting-projection', pendingWatermark: 'b'.repeat(40) })]) {
    if (state !== null) await writeFile(path, state)
    const client = new FixtureClient()
    await assert.rejects(runMigrations({ root, client, env, log() {} }), /E_PROJECTION_STATE_PRECONDITION/)
    assert.deepEqual(client.rows, []); assert.deepEqual(client.ledger, []); assert.deepEqual(client.events, [])
  }
  const bytes = jsonBytes({ status: 'applied-awaiting-projection', pendingWatermark: sha })
  await writeFile(path, bytes)
  await verifyProjectionStatePrecondition(env)
  const client = new FixtureClient()
  await runMigrations({ root, client, env, log() {}, refresh: async passed => { assert.equal(passed, env) } })
  assert.equal(await readFile(path, 'utf8'), bytes)
  const calls = []
  await triggerPostRefreshService(env, async (...args) => calls.push(args))
  assert.deepEqual(calls[0].slice(0, 2), ['systemctl', ['start', '--no-block', 'seoul-wiki-project.service']])
  await assert.rejects(triggerPostRefreshService({ WIKI_MIGRATE_POST_REFRESH_SERVICE: 'bad;command' }), /E_MIGRATE_REFRESH_SERVICE/)
})

test('pending remains on rollback and refresh failure/commit crash simulation', async t => {
  const { root } = await migrationFixture(t), path = resolve(root, 'state.json')
  const bytes = jsonBytes({ status: 'applied-awaiting-projection', pendingWatermark: 'c'.repeat(40) })
  await writeFile(path, bytes)
  const env = { WIKI_PROJECTION_STATE_FILE: path, WIKI_MIGRATE_CODE_REF: 'c'.repeat(40) }
  const rolled = new FixtureClient()
  await assert.rejects(runMigrations({ root, client: rolled, env, log() {}, beforeCommit: async () => { throw Error('fail') } }))
  assert.deepEqual(rolled.rows, []); assert.deepEqual(rolled.ledger, [])
  assert.equal(await readFile(path, 'utf8'), bytes)
  const committed = new FixtureClient()
  await assert.rejects(runMigrations({ root, client: committed, env, log() {}, refresh: async () => { throw Error('crash-after-commit') } }), /E_MIGRATE_POST_COMMIT/)
  assert.equal(committed.ledger.length, 1)
  assert.equal(await readFile(path, 'utf8'), bytes)
})

test('snapshot hashes derive from actual bytes; extra/private fields and forged hashes fail', () => {
  const entries = [{ when: 1000, hash: 'a'.repeat(64) }], seedManifestText = '{"seed":1}\n', renderManifestText = '{"render":1}\n'
  const snapshot = { format: 'wiki-public-snapshot/1', producerCodeSha: 'b'.repeat(40), seedManifestSha256: sha256(seedManifestText), renderInventorySha256: sha256(renderManifestText), ledgerDigest: ledgerDigest(entries) }
  assert.equal(verifySnapshot(snapshot, { entries, seedManifestText, renderManifestText }).ok, true)
  for (const input of [{ ...snapshot, seedManifestSha256: 'c'.repeat(64) }, { ...snapshot, privateReceipt: 'secret' }]) assert.throws(() => verifySnapshot(input, { entries, seedManifestText, renderManifestText }), /E_PROVENANCE_SNAPSHOT/)
  assert.throws(() => verifySnapshot(snapshot, { entries, seedManifestText: seedManifestText + ' ', renderManifestText }), /E_PROVENANCE_SNAPSHOT/)
})

test('public scratch refuses production, external host, implicit port and libpq overrides', () => {
  assert.deepEqual(assertScratchTarget('postgresql://owner@127.0.0.1:55433/seoul_scratch_fixture'), { database: 'seoul_scratch_fixture', port: 55433 })
  for (const url of ['postgresql://owner@127.0.0.1:55433/seoul', 'postgresql://owner@127.0.0.1:15433/seoul_scratch_fixture', 'postgresql://owner@example.com:55433/seoul_scratch_fixture', 'postgresql://owner@127.0.0.1/seoul_scratch_fixture', 'postgresql://owner@127.0.0.1:55433/seoul_scratch_fixture?host=production']) assert.throws(() => assertScratchTarget(url), /E_SCRATCH_TARGET/)
})

test('public bootstrap uses real immutable guards and schema, not private rows or fake ledger', async () => {
  const prefix = resolve(projectRoot, 'scripts/postgres-migration/schema-pg')
  const sql = publicSchemaSql(await readFile(resolve(prefix, 'tables.sql'), 'utf8'), await readFile(resolve(prefix, 'guards.sql'), 'utf8'), await readFile(resolve(prefix, 'constraints.sql'), 'utf8'))
  assert.match(sql.guards, /CREATE TRIGGER "current_right_retirement_no_update" BEFORE UPDATE/)
  assert.match(sql.guards, /CREATE TRIGGER "current_region_disposition_no_update" BEFORE UPDATE/)
  assert.doesNotMatch(sql.tables + sql.guards + sql.constraints, /CREATE TABLE wiki_private|CREATE FUNCTION wiki_private|INSERT INTO.*__drizzle_migrations/)
  assert.match(sql.constraints, /fk_state_label_0/)
})
