#!/usr/bin/env node
// Local QA driver only. Never connects to a source database or starts on 15433.
// Public seed import is NOT full C2; full mode requires a protected custom dump.
import { randomBytes } from 'node:crypto'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { chmod, lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { assertScratchTarget, publicSchemaSql } from '../scratch-bootstrap.mjs'
import { checkSeeds } from '../check-render-snapshot.mjs'
import { readMigrationInventory } from '../check-migration-provenance.mjs'

const exec = promisify(execFile)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const shell = value => `'${String(value).replaceAll("'", "'\\''")}'`
const unavailable = () => Object.assign(new Error('qa-scratch-unavailable'), { exitCode: 3 })

export function scratchEnvironment(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !/^(?:PG|WIKI_|DATABASE_URL|NODE_OPTIONS|NODE_PATH)/u.test(key)))
}

export async function findPg17({ env = process.env, platform = process.platform } = {}) {
  if (platform === 'win32') throw unavailable()
  const tools = ['pg_ctl', 'initdb', 'postgres', 'pg_restore']
  for (const directory of ['/usr/lib/postgresql/17/bin', ...(env.PATH ?? '').split(delimiter).filter(Boolean)]) {
    const paths = Object.fromEntries(tools.map(tool => [tool, join(directory, tool)]))
    try {
      for (const path of Object.values(paths)) {
        const { stdout } = await exec(path, ['--version'], { env: scratchEnvironment(env) })
        if (!/\(PostgreSQL\) 17(?:\.|\s)/u.test(stdout)) throw new Error('E_QA_PG_VERSION')
      }
      return paths
    } catch (error) { if (!['ENOENT', 'EACCES'].includes(error.code) && error.message !== 'E_QA_PG_VERSION') throw error }
  }
  throw unavailable()
}

export function validateSession(session, path, tempRoot = tmpdir()) {
  const home = dirname(resolve(path)), rel = relative(resolve(tempRoot), home)
  if (session.format !== 'wiki-qa-scratch/1' || !/^[a-f0-9]{32}$/u.test(session.id)
    || !rel || rel.startsWith('..') || isAbsolute(rel) || !home.endsWith(`wiki-qa-${session.id}`)
    || resolve(path) !== join(home, 'session.json') || session.home !== home
    || session.data !== join(home, 'data') || session.socket !== join(home, 'socket')
    || session.database !== `seoul_scratch_${session.id}` || !Number.isInteger(session.port)
    || session.port < 1024 || session.port > 65535 || session.port === 15433
    || !['public', 'full'].includes(session.mode)) throw new Error('E_QA_SESSION')
  assertScratchTarget(`postgresql://qa@127.0.0.1:${session.port}/${session.database}`)
  return session
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  if (port === 15433 || port < 1024) throw new Error('E_QA_PORT')
  return port
}

async function protectedFile(path) {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077) || (process.getuid && info.uid !== process.getuid())) throw new Error('E_QA_PRIVATE_FILE')
  return path
}

async function run(command, args, env, cwd) {
  // Keep potentially private dump and SQL error text in the protected session,
  // never echo credentials or dump contents into CI/public reports.
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, cwd, stdio: ['ignore', 'ignore', 'ignore'] })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`E_QA_COMMAND_FAILED:${code}`)))
  })
}

export function c2Commands({ root, envFile, codeRef, mode }) {
  const commands = [
    '# Run in a disposable QA worktree at the recorded base SHA; edit only the planned crest motif first.',
    `cd ${shell(root)}`,
    `set -a; . ${shell(envFile)}; set +a`,
    `BASE_SHA=${shell(codeRef)}`,
    '# Change clan_crest_motif clan=ac15-c9c4-c8fc motif=wreath to leaf; fail if the baseline differs.',
    'npm run seed:sync -- --base-ref "$BASE_SHA" --emit-migration --name qa_crest_motif --actor qa --reason scratch-roundtrip --change-id qa-crest-roundtrip',
    // The operator must refresh the pending watermark for each exact code tree.
    'WIKI_MIGRATE_CODE_REF="$BASE_SHA" npm run db:migrate',
    'npm run seed:export -- --out .omo/evidence/repo-pg/c2-export',
  ]
  if (mode === 'full') commands.push('# Commit the verified QA seed/migration changes in the disposable branch before projection (projector requires a clean exact tree).',
    'QA_SHA=$(git rev-parse HEAD)',
    'node scripts/project-public-snapshot.mjs --scratch-only --code-ref "$QA_SHA" --out .omo/evidence/repo-pg/c2-projection',
    '# Compare the crest SVG hash and index motif, row delta, ledger +1 and replay +0. Commands alone are not C2 PASS.')
  else commands.push('# Public imported state only: no metadata/private admission sources. Full C2 generation remains NOT RUN.')
  return commands
}

export async function cleanupScratch(path, { env = process.env } = {}) {
  path = resolve(path)
  await protectedFile(path)
  const session = validateSession(JSON.parse(await readFile(path, 'utf8')), path)
  for (const directory of [session.home, session.data, session.socket]) {
    const info = await lstat(directory)
    if (!info.isDirectory() || info.isSymbolicLink() || await realpath(directory) !== directory || info.uid !== process.getuid()) throw new Error('E_QA_SESSION_OWNER')
  }
  if ((await readFile(join(session.home, 'owner'), 'utf8')).trim() !== session.id) throw new Error('E_QA_SESSION_OWNER')
  const pid = await readFile(join(session.data, 'postmaster.pid'), 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error })
  if (pid) {
    const lines = pid.split('\n')
    if (Number(lines[0]) !== session.pid || lines[1] !== session.data || Number(lines[3]) !== session.port || lines[4] !== session.socket) throw new Error('E_QA_SESSION_PID')
    const binaries = await findPg17({ env })
    await run(binaries.pg_ctl, ['-D', session.data, '-m', 'fast', '-w', 'stop'], scratchEnvironment(env), session.home)
  }
  await rm(session.home, { recursive: true })
  return { status: 'cleaned', database: session.database }
}

export async function prepareScratch({ mode = 'public', backupFileEnv, root = projectRoot, env = process.env } = {}) {
  if (!['public', 'full'].includes(mode) || (mode === 'full') !== Boolean(backupFileEnv)) throw new Error('E_QA_MODE_BACKUP')
  if (backupFileEnv && (!/^[A-Z][A-Z0-9_]*$/u.test(backupFileEnv) || !env[backupFileEnv])) throw new Error('E_QA_BACKUP_ENV')
  const binaries = await findPg17({ env })
  if (process.getuid?.() === 0) throw new Error('E_QA_NONROOT_REQUIRED')
  let backup
  if (mode === 'full') {
    backup = await protectedFile(resolve(env[backupFileEnv]))
    const rel = relative(resolve(root), backup)
    if (!rel.startsWith('..') && !isAbsolute(rel)) throw new Error('E_QA_BACKUP_IN_REPO')
    // Custom archive only: no psql meta-command can redirect to a live DB.
    const handle = await import('node:fs/promises').then(fs => fs.open(backup, 'r'))
    try { const magic = Buffer.alloc(5); await handle.read(magic, 0, 5, 0); if (magic.toString() !== 'PGDMP') throw new Error('E_QA_CUSTOM_DUMP_REQUIRED') }
    finally { await handle.close() }
  }
  const inventory = await readMigrationInventory({ root })
  if (mode === 'public' && (inventory.length !== 1 || inventory[0].tag !== '0000_public_read_baseline')) throw new Error('E_QA_IMMUTABLE_SEED_BASELINE_REQUIRED')
  if (mode === 'public') await checkSeeds(join(root, 'db/seeds'))
  const codeRef = (await exec('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' })).stdout.trim()
  const id = randomBytes(16).toString('hex'), home = join(await realpath(tmpdir()), `wiki-qa-${id}`)
  await mkdir(home, { mode: 0o700 }); await chmod(home, 0o700)
  const session = { format: 'wiki-qa-scratch/1', id, home, data: join(home, 'data'), socket: join(home, 'socket'),
    database: `seoul_scratch_${id}`, port: await freePort(), mode, codeRef, pid: null }
  await mkdir(session.socket, { mode: 0o700 })
  const save = (name, text) => writeFile(join(home, name), text, { mode: 0o600, flag: 'wx' })
  await save('owner', id + '\n')
  const password = randomBytes(32).toString('hex'), childEnv = scratchEnvironment(env)
  await save('password', password + '\n')
  await save('session.json', JSON.stringify(session, null, 2) + '\n')
  let started = false, client
  try {
    await run(binaries.pg_ctl, ['initdb', '-D', session.data, '-o', `--username=qa_admin --auth-local=scram-sha-256 --auth-host=scram-sha-256 --pwfile=${shell(join(home, 'password'))}`], childEnv, home)
    // pg_ctl can time out after launching postgres. Failure cleanup must still
    // look for this owned data directory's postmaster, not abandon a live child.
    started = true
    await run(binaries.pg_ctl, ['-D', session.data, '-l', join(home, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${session.port} -k ${shell(session.socket)}`, '-w', 'start'], childEnv, home)
    session.pid = Number((await readFile(join(session.data, 'postmaster.pid'), 'utf8')).split('\n')[0])
    await writeFile(join(home, 'session.json'), JSON.stringify(session, null, 2) + '\n', { mode: 0o600 })
    const url = database => `postgresql://qa_admin:${password}@127.0.0.1:${session.port}/${database}`
    const { default: pg } = await import('pg')
    client = new pg.Client({ connectionString: url('postgres') }); await client.connect()
    await client.query(`CREATE DATABASE "${session.database}"`)
    await client.end(); client = new pg.Client({ connectionString: url(session.database) }); await client.connect()
    assertScratchTarget(url(session.database))
    const identity = (await client.query('SELECT current_database() AS db, inet_server_port() AS port, inet_server_addr()::text AS host')).rows[0]
    if (identity.db !== session.database || identity.port !== session.port || identity.host !== '127.0.0.1') throw new Error('E_QA_SERVER_IDENTITY')
    await client.query('CREATE ROLE wiki_owner NOLOGIN; CREATE ROLE wiki_reader NOLOGIN; CREATE ROLE wiki_private_owner NOLOGIN; CREATE ROLE orbat_reader NOLOGIN; GRANT wiki_private_owner, wiki_reader, orbat_reader TO wiki_owner')
    await save('migrate.url', url(session.database) + '\n')
    await save('projection-state.json', JSON.stringify({ status: 'applied-awaiting-projection', pendingWatermark: codeRef }) + '\n')
    const migrateEnv = { ...childEnv, WIKI_MIGRATE_PG_FILE: join(home, 'migrate.url'), WIKI_MIGRATE_CODE_REF: codeRef, WIKI_PROJECTION_STATE_FILE: join(home, 'projection-state.json') }
    let schema
    if (mode === 'full') {
      await client.query('CREATE ROLE wiki_generation_reader NOLOGIN; CREATE ROLE wiki_generation_login NOLOGIN; CREATE ROLE wiki_runtime_reader NOLOGIN')
      await save('pgpass', `127.0.0.1:${session.port}:*:qa_admin:${password}\n`)
      await run(binaries.pg_restore, ['--exit-on-error', '--single-transaction', '--host=127.0.0.1', `--port=${session.port}`, '--username=qa_admin', `--dbname=${session.database}`, backup], { ...childEnv, PGPASSFILE: join(home, 'pgpass') }, home)
      // Restore preserves original owners, constraints, guards and migration
      // ledger. Missing dump roles fail instead of silently rewriting ownership.
    } else {
      const base = join(root, 'scripts/postgres-migration/schema-pg')
      schema = publicSchemaSql(await readFile(join(base, 'tables.sql'), 'utf8'), await readFile(join(base, 'guards.sql'), 'utf8'), await readFile(join(base, 'constraints.sql'), 'utf8'))
      await client.query(`CREATE SCHEMA wiki_private AUTHORIZATION wiki_private_owner; ${schema.tables}\nRESET ROLE;`)
    }
    await run(process.execPath, [join(root, 'scripts/db-migrate.mjs')], migrateEnv, root)
    if (mode === 'public') {
      await run(process.execPath, [join(root, 'scripts/seed-apply.mjs')], { ...childEnv, WIKI_SEEDS_PG_FILE: join(home, 'migrate.url') }, root)
      await client.query(`${schema.constraints}\n${schema.guards}`)
    }
    await client.query(`RESET ROLE; CREATE ROLE qa_public LOGIN PASSWORD '${password}'; GRANT wiki_reader TO qa_public;
      GRANT USAGE ON SCHEMA wiki TO wiki_reader; GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader;
      GRANT USAGE ON SCHEMA wiki_migrations TO qa_public; GRANT SELECT ON ALL TABLES IN SCHEMA wiki_migrations TO qa_public;
      REVOKE ALL ON SCHEMA wiki_private FROM PUBLIC, wiki_reader;
      ALTER ROLE qa_public SET default_transaction_read_only = on`)
    await save('reader.url', `postgresql://qa_public:${password}@127.0.0.1:${session.port}/${session.database}\n`)
    const settings = { WIKI_MIGRATE_PG_FILE: join(home, 'migrate.url'), WIKI_DOCUMENT_PG_FILE: join(home, 'reader.url'), WIKI_SEEDS_PG_FILE: join(home, 'reader.url'),
      WIKI_MIGRATE_CODE_REF: codeRef, WIKI_PROJECTION_STATE_FILE: join(home, 'projection-state.json'), WIKI_PROJECTION_HOST_RECEIPT_FILE: join(home, 'projection-receipt.json') }
    if (mode === 'full') {
      // Reuse the production role's exact private table allowlist, not a broad
      // SELECT on every private table. db-pg explicitly SET ROLEs this reader.
      const policy = await readFile(join(root, 'scripts/postgres-migration/generation-reader-login.sql'), 'utf8')
      const values = policy.match(/INSERT INTO generation_private_allowlist VALUES([\s\S]*?);/u)?.[1]
      if (!values) throw new Error('E_QA_PRIVATE_POLICY')
      const names = [...values.matchAll(/\('([a-z_]+)'\)/gu)].map(match => match[1])
      if (!names.length) throw new Error('E_QA_PRIVATE_POLICY')
      await client.query(`GRANT USAGE ON SCHEMA wiki_private TO wiki_generation_reader;
        GRANT SELECT ON ${names.map(name => `wiki_private."${name}"`).join(', ')} TO wiki_generation_reader;
        ALTER ROLE wiki_generation_login LOGIN PASSWORD '${password}'; GRANT wiki_generation_reader TO wiki_generation_login;
        ALTER ROLE wiki_generation_login SET default_transaction_read_only = on`)
      await save('private-reader.url', `postgresql://wiki_generation_login:${password}@127.0.0.1:${session.port}/${session.database}\n`)
      settings.WIKI_GENERATION_PRIVATE_PG_FILE = join(home, 'private-reader.url')
    }
    await save('scratch.env', Object.entries(settings).map(([key, value]) => `export ${key}=${shell(value)}`).join('\n') + '\n')
    await client.end(); client = null
    return { status: 'prepared', mode, state: mode === 'full' ? 'restored-backup' : 'imported-snapshot', fullC2: 'not-run', session: join(home, 'session.json'), envFile: join(home, 'scratch.env'),
      commands: c2Commands({ root, envFile: join(home, 'scratch.env'), codeRef, mode }), cleanup: `node scripts/qa/prepare-full-scratch.mjs --cleanup ${shell(join(home, 'session.json'))}` }
  } catch (error) {
    if (client) await client.end().catch(() => {})
    if (started) {
      const pid = await readFile(join(session.data, 'postmaster.pid'), 'utf8').catch(e => { if (e.code === 'ENOENT') return null; throw e })
      if (pid && session.pid === null) {
        session.pid = Number(pid.split('\n')[0])
        await writeFile(join(home, 'session.json'), JSON.stringify(session, null, 2) + '\n', { mode: 0o600 })
      }
      await cleanupScratch(join(home, 'session.json'), { env })
    }
    else await rm(home, { recursive: true, force: true })
    throw error
  }
}

async function cli() {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/qa/prepare-full-scratch.mjs [--mode public|full] [--backup-file-env NAME]\n       node scripts/qa/prepare-full-scratch.mjs --cleanup SESSION\nNon-root PostgreSQL 17 second cluster only; missing binaries: exit 3 qa-scratch-unavailable. Default public mode loads schema, real baseline migration, seeds and guards (NOT full C2). Full mode requires an owner-only custom pg_dump outside the repo and preserves backup metadata/private rows/ledger/constraints. Never reads or writes live PG. Prints protected scratch env/session paths and manual C2 commands; cleanup only accepts its owned temp session.')
    return
  }
  if (args.length === 2 && args[0] === '--cleanup') return console.log(JSON.stringify(await cleanupScratch(args[1])))
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!['--mode', '--backup-file-env'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('E_QA_ARGUMENT')
    options[args[i] === '--mode' ? 'mode' : 'backupFileEnv'] = args[i + 1]
  }
  console.log(JSON.stringify(await prepareScratch(options)))
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) cli().catch(error => {
  console.error(JSON.stringify({ status: error.exitCode === 3 ? 'skipped' : 'failed', code: error.message.startsWith('E_QA_') || error.exitCode === 3 ? error.message : 'E_QA_PREPARE_FAILED' }))
  process.exitCode = error.exitCode ?? 1
})
