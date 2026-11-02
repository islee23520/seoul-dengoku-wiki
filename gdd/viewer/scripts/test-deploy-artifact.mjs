import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { test, onTestFinished } from 'vitest'
import { deployArtifact } from './deploy-artifact.mjs'

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'gdd-deploy-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const artifactRoot = resolve(root, 'artifact'), siteRoot = resolve(root, 'site')
  const sourceCommit = 'a'.repeat(40)
  await mkdir(artifactRoot)
  await mkdir(resolve(siteRoot, 'gdd'), { recursive: true })
  await writeFile(resolve(artifactRoot, 'index.html'), '<script src="/gdd/assets/app.js"></script>')
  await writeFile(resolve(artifactRoot, 'build.json'), JSON.stringify({ repository: 'islee23520/seoul-dengoku-gdd', sourceCommit, publicPath: '/gdd/' }))
  await writeFile(resolve(siteRoot, 'gdd/index.html'), 'old gdd')
  await writeFile(resolve(siteRoot, 'wiki.html'), 'untouched wiki')
  await writeFile(resolve(siteRoot, 'deployment-manifest.json'), JSON.stringify({ files: 2, artifacts: [{ path: 'gdd/index.html' }, { path: 'wiki.html', sha256: 'unchanged' }] }))
  return { artifactRoot, siteRoot, sourceCommit }
}

test('deploys only GDD and preserves other hub manifest entries', async () => {
  const input = await fixture()
  let checked = false
  await deployArtifact({ ...input, verify: async (identity) => { checked = true; assert.equal(identity.sourceCommit, input.sourceCommit) } })
  assert.ok(checked)
  assert.equal(await readFile(resolve(input.siteRoot, 'wiki.html'), 'utf8'), 'untouched wiki')
  const manifest = JSON.parse(await readFile(resolve(input.siteRoot, 'deployment-manifest.json'), 'utf8'))
  assert.deepEqual(manifest.artifacts.find((entry) => entry.path === 'wiki.html'), { path: 'wiki.html', sha256: 'unchanged' })
  assert.equal(manifest.gdd.sourceCommit, input.sourceCommit)
  assert.equal(manifest.files, 3)
})

test('restores GDD and manifest bytes after origin verification fails', async () => {
  const input = await fixture()
  const before = await readFile(resolve(input.siteRoot, 'deployment-manifest.json'))
  await assert.rejects(deployArtifact({ ...input, verify: async () => { throw new Error('origin failed') } }), /origin failed/)
  assert.equal(await readFile(resolve(input.siteRoot, 'gdd/index.html'), 'utf8'), 'old gdd')
  assert.deepEqual(await readFile(resolve(input.siteRoot, 'deployment-manifest.json')), before)
})

test('rejects a different commit before replacing the live GDD', async () => {
  const input = await fixture()
  await assert.rejects(deployArtifact({ ...input, sourceCommit: 'b'.repeat(40), verify: async () => assert.fail('must not verify') }), /identity mismatch/)
  assert.equal(await readFile(resolve(input.siteRoot, 'gdd/index.html'), 'utf8'), 'old gdd')
})
