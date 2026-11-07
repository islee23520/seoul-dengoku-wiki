import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { checkStaticSnapshot, committedBytes, committedTree, compareCommittedSeeds } from './check-static-snapshot.mjs'
import { assertOfflineEnvironment, compileCheck, materializeStatic } from '../deploy/compile-check.mjs'
import { jsonBytes, renderExport, sha256 } from './render-export.mjs'
import { publicAdmission } from './public-admission.mjs'
import { parseSeedRow } from './seed-lossless.mjs'
import { parseTableRows } from './seed-sync.mjs'
import { c2Commands, findPg17, scratchEnvironment, validateSession } from './qa/prepare-full-scratch.mjs'

const exec = promisify(execFile)
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const put = async (root, path, bytes) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes) }
const temp = async t => { const root = await mkdtemp(join(tmpdir(), 'wiki-static-fixture-')); t.after(() => rm(root, { recursive: true, force: true })); return root }
const git = async (root, args) => (await exec('git', ['-C', root, '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' })).stdout.trim()
const commit = async root => { await git(root, ['add', '.']); await git(root, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgSign=false', 'commit', '-m', 'fixture']) }
const registry = { categories: [{ id: 'world', label: 'world', requiredKinds: ['paragraph'] }] }
function oracle(status = 'approved', categories = ['world']) {
  return { registry,
    identities: [{ source_id: 1, document_id: 'doc:1', domain: 'world', status, corpus_kind: 'current', logical_path: 'lore/world/Page1.json', excluded: false, head: 2, admission: 'old' }],
    pages: [{ path: 'lore/world/Page1.json', slug: 'Page1', value: { id: 'doc:1', domain: 'world', status, categories,
      source: { kind: 'original', refs: ['public-origin'] }, locales: { ko: { title: 'Title', summary: 'Summary' }, en: { title: 'Title', summary: 'Summary' } }, content: [{ kind: 'paragraph' }] } }],
  }
}
async function seeds(root, line = '{"ordinal":9223372036854775807,"ref":null}') {
  const bytes = `${line}\n`, file = 'geography/geography_map_title.jsonl'
  await put(root, file, bytes)
  await put(root, 'manifest.json', jsonBytes({ format: 'wiki-seeds/1', schema: 'wiki', tables: [{ table: 'geography_map_title', columns: ['ordinal', 'ref'], primary_key: ['ordinal'], rows: 1, files: [{ file, rows: 1, sha256: sha256(bytes) }] }] }))
}
async function fixture(t) {
  const root = await temp(t)
  await git(root, ['init'])
  await put(root, '.gitignore', 'node_modules/\n')
  const body = { slug: 'Page1', title: 'Title', route: '/world/Page1', reviewText: 'Public body', blocks: [{ type: 'paragraph', children: [{ type: 'text', value: 'Public body' }] }] }
  const documents = [{ slug: body.slug, route: body.route, title: body.title, contentRef: 'src/generated/world/Page1.json' }]
  const outputs = {
    'src/generated/world/Page1.json': jsonBytes(body),
    'src/generated/publication-manifest.json': jsonBytes({ documents, categories: [] }),
    'src/generated/wikiCatalog.ts': 'export const wikiCatalog = []\n',
    'public/wiki-contract.json': jsonBytes({ documents }),
  }
  await put(root, 'artifact-allowlist.json', jsonBytes({ rootFiles: ['index.html', 'wiki-contract.json'], directories: {}, assets: { appChunks: ['index'], pattern: '^(.+)-[A-Za-z0-9_-]{8}\\.(?:js|css)$', libraryDirectory: 'lib' }, routes: [] }))
  await put(root, 'index.html', '<!doctype html><div id="app"></div><script type="module" src="/src/main.ts"></script>\n')
  await put(root, 'package.json', '{"type":"module"}\n')
  await put(root, 'tsconfig.json', '{"compilerOptions":{"target":"ES2020","module":"ESNext","moduleResolution":"bundler","resolveJsonModule":true,"noEmit":true,"types":[]},"include":["src"]}\n')
  await put(root, 'src/main.ts', "import body from './generated/world/Page1.json'\ndocument.querySelector('#app')!.textContent = body.reviewText\n")
  await put(root, 'src/App.tsx', 'export const app = true\n')
  await seeds(join(root, 'db/seeds'))
  // Generation inputs are fixture staging only; they never enter the Git tree.
  const generation = await temp(t)
  await put(generation, 'artifact-allowlist.json', await readFile(join(root, 'artifact-allowlist.json')))
  for (const [path, bytes] of Object.entries(outputs)) await put(generation, path, bytes)
  const ownership = jsonBytes({ schema: 1, files: Object.entries(outputs).map(([path, bytes]) => ({ path, sha256: sha256(bytes) })) })
  await put(generation, 'src/generated-private/generation-release-manifest.json', ownership)
  await commit(root)
  const producerCodeRef = await git(root, ['rev-parse', 'HEAD'])
  await renderExport({ root: generation, out: join(root, 'renders'), admission: publicAdmission(oracle()), tracked: new Set(), receipt: { format: 'wiki-checked-build/1', status: 'passed', generationManifestSha256: sha256(ownership) } })
  await bindReceipt(root, producerCodeRef)
  await commit(root)
  return root
}
async function bindReceipt(root, producerCodeRef) {
  await put(root, 'db/provenance/public-snapshot.json', jsonBytes({ format: 'wiki-public-snapshot/1', producerCodeRef,
    producedAt: '2026-11-07T00:00:00.000Z', seedManifestSha256: `sha256:${sha256(await readFile(join(root, 'db/seeds/manifest.json')))}`,
    renderManifestSha256: `sha256:${sha256(await readFile(join(root, 'renders/manifest.json')))}`, checkedBuildArtifactDigest: `sha256:${'a'.repeat(64)}` }))
}

test('committed snapshot validates inventory, hashes, routes and zero private sentinels', async t => {
  const root = await fixture(t), report = await checkStaticSnapshot({ root, admissionFixture: oracle() })
  assert.equal(report.coverage, 1); assert.equal(report.privateSentinels, 0); assert.equal(report.snapshotCommitted, true)
  assert.equal(report.databaseSemantics, 'not-assessed-offline')
})

test('rev3 valid draft retains coverage; invalid category with old admission is excluded', async t => {
  const root = await fixture(t)
  await checkStaticSnapshot({ root, admissionFixture: oracle('draft') })
  await assert.rejects(checkStaticSnapshot({ root, admissionFixture: oracle('draft', ['unknown']) }), /E_PUBLIC_ROUTE_COVERAGE/u)
})

test('private sentinel and extra generated output fail even when local manifest looks plausible', async t => {
  const root = await fixture(t)
  await put(root, 'renders/documents/Page1.md', 'PRIVATE_SENTINEL')
  await assert.rejects(checkStaticSnapshot({ root }), /E_RENDER_PRIVATE_SENTINEL/u)
  await put(root, 'renders/documents/Page1.md', '# Title\n\nPublic body\n')
  await put(root, 'renders/public/extra.json', '{}')
  await assert.rejects(checkStaticSnapshot({ root }), /E_RENDER_EXTRA_FILE/u)
})

test('missing output, forbidden source, dangling route and wrong manifest hash fail', async t => {
  const root = await fixture(t), path = 'renders/manifest.json'
  const original = JSON.parse(await readFile(join(root, path)))
  for (const [mutate, expected] of [
    [m => { m.files[0].sha256 = '0'.repeat(64) }, /E_RENDER_HASH/u],
    [m => { m.files[0].source = 'public/secret.env' }, /E_RENDER_PUBLIC_ALLOWLIST/u],
    [m => { m.routes[0].files.push('public/absent.json') }, /E_RENDER_DANGLING_REF/u],
  ]) {
    const changed = structuredClone(original); mutate(changed)
    await put(root, path, jsonBytes(changed))
    await assert.rejects(checkStaticSnapshot({ root }), expected)
  }
  await put(root, path, jsonBytes(original))
  await rm(join(root, 'renders/generated/world/Page1.json'))
  await assert.rejects(checkStaticSnapshot({ root }), /ENOENT/u)
})

test('uncommitted snapshot and tracked frontend changes cannot be compiled', async t => {
  const root = await fixture(t)
  await put(root, 'src/main.ts', 'throw new Error("dirty")\n')
  await assert.rejects(checkStaticSnapshot({ root }), /E_STATIC_UNCOMMITTED/u)
})

test('stale receipt after a committed seed edit is rejected', async t => {
  const root = await fixture(t)
  await seeds(join(root, 'db/seeds'), '{"ordinal":9223372036854775807,"ref":"changed"}')
  await commit(root)
  await assert.rejects(checkStaticSnapshot({ root }), /E_STATIC_STALE_SNAPSHOT/u)
})

test('producer input edits invalidate snapshot; docs and CI commits do not', async t => {
  const root = await fixture(t)
  await put(root, 'README.md', 'docs only\n'); await put(root, '.woodpecker/ci.yaml', 'steps: []\n'); await commit(root)
  await checkStaticSnapshot({ root })
  await put(root, 'src/main.ts', 'export const changed = true\n'); await commit(root)
  await assert.rejects(checkStaticSnapshot({ root }), /E_STATIC_STALE_PRODUCER/u)
})

test('migration or journal changes require a fresh checked projection', async t => {
  const root = await fixture(t)
  await put(root, 'db/migrations/0001_data_fixture.sql', 'SELECT 1;\n'); await commit(root)
  await assert.rejects(checkStaticSnapshot({ root }), /E_STATIC_STALE_PRODUCER/u)
})

test('rev2 B3 each A/B export compares independently with committed Git bytes', async t => {
  const root = await fixture(t), outside = await temp(t), a = join(outside, 'a'), b = join(outside, 'b')
  for (const out of [a, b]) await cp(join(root, 'db/seeds'), out, { recursive: true })
  assert.equal((await compareCommittedSeeds({ root, exports: [a, b] })).changedBytes, 0)
  // Matching A/B and matching working tree are insufficient if Git differs.
  for (const out of [a, b, join(root, 'db/seeds')]) await seeds(out, '{"ordinal":9223372036854775807,"ref":"same-but-wrong"}')
  await assert.rejects(compareCommittedSeeds({ root, exports: [a, b] }), /E_STATIC_SEED_DRIFT/u)
})

test('valid NULL/bigint/quotes retain exact bytes through independent export comparison', async t => {
  const root = await temp(t); await git(root, ['init'])
  const valid = '{"ordinal":-9223372036854775808,"ref":' + JSON.stringify('quote " and newline\n') + '}'
  await seeds(join(root, 'db/seeds'), valid); await commit(root)
  const outside = await temp(t), a = join(outside, 'a'), b = join(outside, 'b')
  for (const out of [a, b]) await cp(join(root, 'db/seeds'), out, { recursive: true })
  assert.equal(parseSeedRow(valid).values.ordinal, -9223372036854775808n)
  assert.equal(parseSeedRow('{"ordinal":9223372036854775807,"ref":null}').values.ref, null)
  assert.equal((await compareCommittedSeeds({ root, exports: [a, b] })).exports, 2)
})

test('refused NULL PK and out-of-range bigint are distinct from valid lossless input', () => {
  const definition = { table: 'geography_map_title', columns: [{ name: 'ordinal', type: 'bigint', nullable: false }, { name: 'ref', type: 'text', nullable: true }], primary_key: ['ordinal'], foreignKeys: [] }
  for (const [line, error] of [['{"ordinal":null,"ref":null}\n', /E_SYNC_NULL/u], ['{"ordinal":9223372036854775808,"ref":null}\n', /E_SYNC_BIGINT/u]]) assert.throws(() => parseTableRows([line], definition), error)
  assert.throws(() => parseSeedRow('{"ordinal":1,"ordinal":2}'), /E_SYNC_DUPLICATE_COLUMN/u)
})

test('offline compiler rejects PostgreSQL variables before reading any snapshot', async () => {
  for (const key of ['PGHOST', 'PGSERVICE', 'WIKI_MIGRATE_PG', 'WIKI_DOCUMENT_PG_FILE', 'WIKI_SEEDS_PSQL', 'DATABASE_URL']) {
    assert.throws(() => assertOfflineEnvironment({ [key]: '' }), /E_STATIC_PG_ENV/u)
    await assert.rejects(compileCheck({ root: 'missing', env: { [key]: 'x' } }), /E_STATIC_PG_ENV/u)
  }
  assert.throws(() => assertOfflineEnvironment({ NODE_OPTIONS: '--require=untrusted' }), /E_STATIC_NODE_ENV/u)
  assertOfflineEnvironment({ PATH: 'local' })
})

test('materialization consumes snapshot only and excludes untracked public, env and private inputs', async t => {
  const root = await fixture(t), stage = await temp(t)
  await put(root, 'public/private.json', 'PRIVATE_SENTINEL'); await put(root, 'src/generated-private/secret.json', 'PRIVATE_SENTINEL')
  await put(root, '.env.production', 'SECRET=private')
  await materializeStatic({ root, snapshot: join(root, 'renders'), stage })
  assert.match(await readFile(join(stage, 'src/generated/world/Page1.json'), 'utf8'), /Public body/u)
  for (const path of ['public/private.json', 'src/generated-private/secret.json', '.env.production']) await assert.rejects(readFile(join(stage, path)), /ENOENT/u)
})

test('committed LFS pointer requires actual matching object bytes', async t => {
  const root = await temp(t); await git(root, ['init'])
  const bytes = Buffer.from('fixture asset')
  await put(root, 'public/asset.bin', `version https://git-lfs.github.com/spec/v1\noid sha256:${sha256(bytes)}\nsize ${bytes.length}\n`)
  await commit(root)
  const tree = await committedTree(root)
  await assert.rejects(committedBytes(root, 'public/asset.bin', tree), /E_STATIC_LFS_POINTER/u)
  await put(root, 'public/asset.bin', bytes)
  assert.deepEqual(await committedBytes(root, 'public/asset.bin', tree), bytes)
  await put(root, 'public/asset.bin', 'wrong')
  await assert.rejects(committedBytes(root, 'public/asset.bin', tree), /E_STATIC_UNCOMMITTED/u)
})

test('real local tsc/Vite compiles snapshot fixture twice to identical artifact digest', async t => {
  const root = await fixture(t), independent = await fixture(t), toolchain = await temp(t)
  // Shared Windows/WSL checkouts can contain foreign native Rolldown bindings.
  // Install from the exact repo lock in this platform's disposable directory;
  // neither compile consumes or modifies the shared repo's node_modules.
  for (const name of ['package.json', 'package-lock.json']) await cp(join(repo, name), join(toolchain, name))
  const { dependencies } = JSON.parse(await readFile(join(toolchain, 'package.json'), 'utf8'))
  for (const spec of Object.values(dependencies).filter(value => value.startsWith('file:'))) {
    const path = spec.slice('file:'.length)
    await mkdir(dirname(join(toolchain, path)), { recursive: true })
    await cp(join(repo, path), join(toolchain, path))
  }
  const nodeDir = dirname(process.execPath)
  const npmPackage = createRequire(import.meta.url).resolve('npm/package.json', { paths: [nodeDir, resolve(nodeDir, '../lib')] })
  const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') ?? 'PATH'
  await exec(process.execPath, [join(dirname(npmPackage), 'bin/npm-cli.js'), 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: toolchain, env: { ...process.env, [pathKey]: `${nodeDir}${delimiter}${process.env[pathKey] ?? ''}` },
    timeout: 180000, maxBuffer: 8 * 1024 * 1024,
  })
  for (const directory of [root, independent]) await symlink(join(toolchain, 'node_modules'), join(directory, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:PG|WIKI_|DATABASE_URL|NODE_OPTIONS|NODE_PATH)/u.test(key)))
  const a = await compileCheck({ root, env }), b = await compileCheck({ root: independent, env })
  assert.equal(a.status, 'passed'); assert.equal(a.artifactDigest, b.artifactDigest)
  assert.equal(a.format, 'wiki-static-compile/1')
  assert.equal(a.database, 'not-used'); assert.ok(a.artifactFiles >= 3)
})

test('scratch driver unavailable platform exits explicitly without launching a cluster', async () => {
  await assert.rejects(findPg17({ platform: 'win32', env: {} }), error => error.exitCode === 3 && error.message === 'qa-scratch-unavailable')
  assert.deepEqual(scratchEnvironment({ PATH: 'local', PGHOST: 'live', WIKI_DOCUMENT_PG: 'live', WIKI_MIGRATE_POST_REFRESH_SERVICE: 'live.service', NODE_OPTIONS: 'inject' }), { PATH: 'local' })
})

test('scratch cleanup accepts only owned temp geometry and rejects live targets', () => {
  const id = 'a'.repeat(32), home = join(tmpdir(), `wiki-qa-${id}`), path = join(home, 'session.json')
  const session = { format: 'wiki-qa-scratch/1', id, home, data: join(home, 'data'), socket: join(home, 'socket'), database: `seoul_scratch_${id}`, port: 25433, mode: 'public' }
  assert.equal(validateSession(session, path), session)
  for (const change of [{ port: 15433 }, { database: 'seoul' }, { data: tmpdir() }, { socket: tmpdir() }, { home: tmpdir() }, { id: '../live' }]) assert.throws(() => validateSession({ ...session, ...change }, path), /E_QA_SESSION/u)
})

test('scratch C2 command sequence distinguishes imported public state and full backup', () => {
  const options = { root: '/fixture', envFile: '/protected/scratch.env', codeRef: 'a'.repeat(40) }
  const publicCommands = c2Commands({ ...options, mode: 'public' }).join('\n'), full = c2Commands({ ...options, mode: 'full' }).join('\n')
  assert.match(publicCommands, /Full C2 generation remains NOT RUN/u)
  assert.doesNotMatch(publicCommands, /project-public-snapshot/u)
  assert.match(full, /--scratch-only/u); assert.match(full, /--code-ref "\$QA_SHA"/u)
  assert.match(full, /seed:sync/u); assert.match(full, /db:migrate/u)
})
