import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'
import { preflight } from '../preflight.mjs'

const execute = promisify(execFile)
const cli = resolve(import.meta.dirname, '../preflight.mjs')
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'local-ai-preflight-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const roots = Object.fromEntries(['source', 'runtime', 'models', 'data'].map(name => [name, join(root, name)]))
  for (const path of Object.values(roots)) await mkdir(path)
  const configPath = join(root, 'private.json')
  const modelManifest = join(root, 'models.json')
  const config = { schemaVersion: 1, tool: 'unimate', roots, forbiddenRoots: [join(root, 'old-runtime')], interpreter: join(roots.runtime, 'python.exe'), modelManifest, minimumFreeBytes: 0 }
  const definitions = [['v3-config', 'v3/config.json'], ['v3-stats', 'v3/dataset_stats.npy'], ['v3-checkpoint', 'v3/checkpoints/checkpoint_step_150000.pt'],
    ['flan-t5-base', 't5/config.json'], ['flan-t5-base', 't5/spiece.model'], ['flan-t5-base', 't5/tokenizer_config.json'], ['flan-t5-base', 't5/model.safetensors']]
  const files = []
  for (const [role, path] of definitions) {
    const bytes = Buffer.from(`tiny-${path}`)
    await mkdir(join(roots.models, path, '..'), { recursive: true })
    await writeFile(join(roots.models, path), bytes)
    files.push({ role, path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), revision: 'test-revision', license: 'CC-BY-NC-4.0', access: 'granted' })
  }
  const manifest = { schemaVersion: 1, tool: 'unimate', files }
  await writeFile(modelManifest, JSON.stringify(manifest))
  await writeFile(configPath, JSON.stringify(config))
  return { root, config, configPath, manifest }
}

test('fails closed when config is absent and rejects unknown secret-bearing fields without echo', async t => {
  // Given: no implicit runtime and an explicit invalid private input.
  const f = await fixture(t)
  await writeFile(f.configPath, JSON.stringify({ ...f.config, token: 'CANARY_SECRET_DO_NOT_PRINT' }))
  // When: the same boundary receives absent and malformed configurations.
  const results = await Promise.all([preflight({ tool: 'unimate' }), preflight({ tool: 'unimate', configPath: f.configPath })])
  // Then: neither can authorize execution or leak input.
  assert.deepEqual(results.map(value => value.status), ['NOT_CONFIGURED', 'REJECTED'])
  assert.equal(JSON.stringify(results).includes('CANARY_SECRET'), false)
})

test('full bytes, missing shards, and access rights independently block readiness', async t => {
  // Given: tiny real model files, one altered in the middle, a missing file, a gated encoder and a shard index.
  const f = await fixture(t)
  const checkpoint = f.manifest.files.find(file => file.role === 'v3-checkpoint')
  const original = Buffer.from(`tiny-${checkpoint.path}`)
  original[Math.floor(original.length / 2)] ^= 1
  await writeFile(join(f.config.roots.models, checkpoint.path), original)
  await rm(join(f.config.roots.models, 'v3/dataset_stats.npy'))
  f.manifest.files.find(file => file.role === 'flan-t5-base').access = 'required'
  const index = Buffer.from(JSON.stringify({ weight_map: { weight: 'missing-00001.safetensors' } }))
  await writeFile(join(f.config.roots.models, 't5/model.safetensors.index.json'), index)
  f.manifest.files.push({ ...f.manifest.files.at(-1), path: 't5/model.safetensors.index.json', bytes: index.length, sha256: createHash('sha256').update(index).digest('hex') })
  await writeFile(f.config.modelManifest, JSON.stringify(f.manifest))
  // When: preflight inspects every declared byte.
  const result = await preflight({ tool: 'unimate', configPath: f.configPath })
  // Then: reasons remain separate and no runtime/GPU readiness is claimed.
  assert.deepEqual(result.hashMismatch, [{ role: 'v3-checkpoint', code: 'CONTENT_MISMATCH' }])
  assert.ok(result.missingModels.some(value => value.code === 'FILE_MISSING'))
  assert.ok(result.missingModels.some(value => value.code === 'UNDECLARED_SHARD'))
  assert.equal(result.licenseRequired.length, 1)
  assert.equal(result.gpuProbe, 'NOT_RUN')
  assert.equal(result.ready, false)
})

test('rejects an actual runtime junction into the old environment before spawning', async t => {
  // Given: a runtime alias that points to another environment.
  const f = await fixture(t)
  await mkdir(f.config.forbiddenRoots[0])
  await rm(f.config.roots.runtime, { recursive: true })
  await symlink(f.config.forbiddenRoots[0], f.config.roots.runtime, 'junction')
  // When: preflight resolves actual filesystem identities.
  const result = await preflight({ tool: 'unimate', configPath: f.configPath })
  // Then: the environment is rejected, not merely missing dependencies.
  assert.equal(result.status, 'REJECTED')
  assert.deepEqual(result.runtimePrerequisite, [{ code: 'ISOLATION_REJECTED' }])
})

test('rejects model junction escape and traversal at the file boundary', async t => {
  const f = await fixture(t)
  await mkdir(join(f.root, 'outside'))
  await symlink(join(f.root, 'outside'), join(f.config.roots.models, 'escape'), 'junction')
  await writeFile(join(f.root, 'outside', 'weights.pt'), 'outside')
  f.manifest.files[0].path = 'escape/weights.pt'
  await writeFile(f.config.modelManifest, JSON.stringify(f.manifest))
  const result = await preflight({ tool: 'unimate', configPath: f.configPath })
  assert.equal(result.status, 'REJECTED')
  assert.ok(result.runtimePrerequisite.some(value => value.code === 'PATH_REJECTED'))
})

test('actual CLI reports honest missing interpreter even with fully verified tiny models', async t => {
  // Given: all model roles hash correctly but no candidate interpreter exists.
  const f = await fixture(t)
  // When: the actual CLI executes, not an injected subprocess mock.
  let failure
  try { await execute(process.execPath, [cli, '--tool', 'unimate', '--json', '--config', f.configPath]) }
  catch (error) { failure = error }
  // Then: nonzero exit, complete hashes and task12 requirement prevent false READY.
  assert.equal(failure.code, 2)
  const result = JSON.parse(failure.stdout)
  assert.equal(result.status, 'BLOCKED')
  assert.equal(result.verifiedModels.length, f.manifest.files.length)
  assert.deepEqual(result.missingModels, [])
  assert.ok(result.runtimePrerequisite.some(value => value.code === 'INTERPRETER_PROBE_FAILED'))
  assert.ok(result.runtimePrerequisite.some(value => value.code === 'TASK12_RUNTIME_PROOF_REQUIRED'))
  assert.equal(result.ready, false)
})

test('UniForge declarations cannot substitute pipeline-only bytes for decoder and external bundles', async t => {
  // Given: a local pipeline that references a real dependency but declares only itself.
  const f = await fixture(t)
  const pipeline = Buffer.from(JSON.stringify({ sparse_structure: { weights: { checkpoint: 'uniforge3d/missing.pt', dit_base: { repo_id: 'microsoft/TRELLIS.2-4B', filename: 'ckpts/base.safetensors', revision: 'abc' } } }, structured_latent_512: {}, structured_latent_1024: {}, texture: {} }))
  await writeFile(join(f.config.roots.models, 'pipeline.json'), pipeline)
  await writeFile(f.config.modelManifest, JSON.stringify({ schemaVersion: 1, tool: 'uniforge3d', files: [{ ...f.manifest.files[0], role: 'pipeline', path: 'pipeline.json', bytes: pipeline.length, sha256: createHash('sha256').update(pipeline).digest('hex') }] }))
  await writeFile(f.configPath, JSON.stringify({ ...f.config, tool: 'uniforge3d' }))
  // When: the UniForge boundary checks its full model graph.
  const result = await preflight({ tool: 'uniforge3d', configPath: f.configPath })
  // Then: implicit network dependencies and absent decoders cannot become readiness.
  assert.ok(result.missingModels.some(value => value.code === 'UNDECLARED_DEPENDENCY'))
  assert.ok(result.missingModels.some(value => value.code === 'INCOMPLETE_DECODER'))
  assert.ok(result.missingModels.some(value => value.role === 'dinov3'))
  assert.ok(result.missingModels.some(value => value.role === 'rmbg'))
  assert.equal(result.ready, false)
})
