import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { stageHub } from './hub-deploy.mjs'
import { files, prepare, verifyArtifact } from './wiki-workers/artifact.mjs'

const artifact = fileURLToPath(new URL('./wiki-workers/artifact.mjs', import.meta.url))
const retain = fileURLToPath(new URL('./wiki-workers/retain-build.mjs', import.meta.url))
const env = { ...process.env, GIT_ALLOW_PROTOCOL: 'file' }
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { env, encoding: 'utf8' }).trim()
const run = (script, args) => spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8', timeout: 30000 })

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'retained-hub-'))
  t.onTestFinished(() => rm(root, { recursive: true, force: true }))
  const source = join(root, 'source'), wiki = join(root, 'wiki-origin'), siteInput = join(root, 'site-input'), site = join(root, 'site')
  for (const directory of [source, wiki]) {
    await mkdir(directory)
    git(directory, 'init', '-b', 'main')
    git(directory, 'config', 'user.name', 'Fixture')
    git(directory, 'config', 'user.email', 'fixture@example.invalid')
  }
  await writeFile(join(wiki, 'source.txt'), 'wiki source')
  git(wiki, 'add', 'source.txt')
  git(wiki, 'commit', '-m', 'fixture')
  git(source, 'submodule', 'add', wiki, 'WIKI')
  git(source, 'commit', '-am', 'fixture source')
  const sha = git(source, 'rev-parse', 'HEAD'), wikiSha = git(wiki, 'rev-parse', 'HEAD')
  git(source, 'remote', 'add', 'origin', source)
  git(source, 'update-ref', 'refs/remotes/origin/main', sha)
  await mkdir(join(siteInput, 'wiki'), { recursive: true })
  await writeFile(join(siteInput, 'index.html'), '<h1>fixture hub</h1>')
  await writeFile(join(siteInput, 'wiki/index.html'), '<h1>fixture wiki</h1>')
  await stageHub({ root: siteInput, output: site, hubIndex: 'index.html', wikiDist: 'wiki', pages: [] })
  const receipt = join(root, 'receipt.json')
  const created = run(artifact, ['receipt', source, site, sha, receipt])
  assert.equal(created.status, 0, created.stderr)
  return { root, source, site, receipt, sha, wikiSha, artifactRoot: join(root, 'artifacts'), sourceRoot: join(root, 'sources') }
}

test('real retained source and artifacts survive disposable cleanup despite failed historical review metadata', async t => {
  const f = await fixture(t)
  const receipt = JSON.parse(await readFile(f.receipt, 'utf8'))
  assert.equal(receipt.parentCommit, f.sha)
  assert.equal(receipt.wikiCommit, f.wikiSha)
  assert.equal(receipt.gates, undefined)
  receipt.gates = { 'patina-ko': 'FAIL', 'patina-en': 'FAIL' }
  receipt.testStatus = 'FAIL'
  await writeFile(f.receipt, JSON.stringify(receipt))
  const retained = []
  for (const runId of ['20261002T120000Z-1', '20261002T120001Z-2']) {
    const result = run(retain, [f.source, f.site, f.receipt, runId, f.sha, f.artifactRoot, f.sourceRoot])
    assert.equal(result.status, 0, result.stderr)
    const directory = join(f.artifactRoot, runId)
    const tuple = JSON.parse(await readFile(join(directory, 'published-tuple.json'), 'utf8'))
    const verified = await verifyArtifact(join(directory, 'wiki-upload'), f.sha)
    assert.deepEqual(tuple, { buildRunId: runId, sha: f.sha, wikiSha: f.wikiSha, artifactDigest: verified.manifestSha256 })
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'verified-build-receipt.json'), 'utf8')), receipt)
    retained.push(directory)
  }
  const before = await readFile(join(retained[0], 'published-tuple.json'), 'utf8')
  const duplicate = run(retain, [f.source, f.site, f.receipt, '20261002T120000Z-1', f.sha, f.artifactRoot, f.sourceRoot])
  assert.notEqual(duplicate.status, 0)
  assert.match(duplicate.stderr, /retained run already exists/)
  assert.equal(await readFile(join(retained[0], 'published-tuple.json'), 'utf8'), before)
  await rm(f.source, { recursive: true })
  await rm(f.site, { recursive: true })
  const keptSource = join(f.sourceRoot, f.sha)
  assert.equal(git(keptSource, 'rev-parse', 'HEAD'), f.sha)
  assert.equal(git(join(keptSource, 'WIKI'), 'rev-parse', 'HEAD'), f.wikiSha)
  assert.equal(git(keptSource, 'status', '--porcelain'), '')
  assert.equal(await readFile(join(retained[0], 'site/wiki/index.html'), 'utf8'), '<h1>fixture wiki</h1>')
  await verifyArtifact(join(retained[1], 'wiki-upload'), f.sha)
  assert.deepEqual((await readdir(f.sourceRoot)).sort(), [f.sha])
})

test('retention rejects changed, missing and symlinked artifact bytes without publishing a run', async t => {
  const f = await fixture(t)
  const wikiIndex = join(f.site, 'wiki/index.html')
  await writeFile(wikiIndex, 'changed')
  const changed = run(retain, [f.source, f.site, f.receipt, '20261002T120002Z-3', f.sha, f.artifactRoot, f.sourceRoot])
  assert.notEqual(changed.status, 0)
  assert.match(changed.stderr, /hub artifact integrity mismatch/)
  assert.deepEqual(await readdir(f.artifactRoot), [])
  await rm(wikiIndex)
  await assert.rejects(prepare(f.site, f.receipt, join(f.root, 'missing'), f.sha), /hub artifact integrity mismatch/)
  await symlink(f.receipt, wikiIndex)
  await assert.rejects(prepare(f.site, f.receipt, join(f.root, 'symlink'), f.sha), /unsupported filesystem entry/)
})

test('artifact root aliases reject without reading through or changing outside artifacts', async t => {
  const f = await fixture(t)
  const outside = join(f.root, 'outside-upload'), owned = join(f.root, 'owned')
  await prepare(f.site, f.receipt, outside, f.sha)
  await mkdir(owned)
  const alias = join(owned, 'artifact')
  await symlink(outside, alias, 'dir')
  const before = await files(outside)
  const verified = await verifyArtifact(outside, f.sha)
  await assert.rejects(verifyArtifact(alias, f.sha), /artifact directory must be regular/)
  const cli = run(artifact, ['verify', alias, f.sha])
  assert.notEqual(cli.status, 0)
  assert.match(cli.stderr, /artifact directory must be regular/)
  assert.deepEqual(await files(outside), before)
  assert.deepEqual(await verifyArtifact(outside, f.sha), verified)
})

test('retained source identity, canonical run ID and uploaded wiki hashes remain mandatory', async t => {
  const f = await fixture(t)
  const invalid = run(retain, [f.source, f.site, f.receipt, '../caller', f.sha, f.artifactRoot, f.sourceRoot])
  assert.notEqual(invalid.status, 0)
  assert.match(invalid.stderr, /canonical build run id/)
  const wrong = run(artifact, ['receipt', f.source, f.site, 'a'.repeat(40), join(f.root, 'wrong.json')])
  assert.notEqual(wrong.status, 0)
  assert.match(wrong.stderr, /source HEAD mismatch/)
  const output = join(f.root, 'wiki-upload')
  await prepare(f.site, f.receipt, output, f.sha)
  await writeFile(join(output, 'assets/wiki/index.html'), 'tampered')
  await assert.rejects(verifyArtifact(output, f.sha), /artifact content mismatch/)
})
