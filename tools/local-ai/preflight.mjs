import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, realpath, stat, statfs } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const roles = {
  unimate: ['v3-config', 'v3-stats', 'v3-checkpoint', 'flan-t5-base'],
  uniforge3d: ['pipeline', 'structure', 'structure-vggt', 'structure-base', 'structure-decoder',
    'shape512', 'shape512-adapter', 'shape1024', 'shape1024-adapter', 'shape-decoder',
    'texture', 'texture-adapter', 'texture-decoder', 'conditioner', 'dinov3', 'rmbg'],
}
const packages = {
  unimate: { torch: '2.5.1+cu124', torchvision: '0.20.1+cu124', transformers: '5.16.1', numpy: '2.2.6' },
  uniforge3d: { torch: '2.6.0', torchvision: '0.21.0', transformers: '4.57.3', 'flash-attn': '2.7.3' },
}
const modules = {
  unimate: ['torch', 'torchvision', 'transformers', 'numpy', 'torch_geometric', 'torchdiffeq', 'sentencepiece', 'spacy', 'en_core_web_sm', 'tyro'],
  uniforge3d: ['torch', 'torchvision', 'transformers', 'flash_attn', 'cumesh', 'flex_gemm', 'nvdiffrast', 'o_voxel', 'safetensors', 'peft'],
}
class Rejected extends Error {
  constructor(code) { super(code); this.code = code }
}
const reject = code => { throw new Rejected(code) }
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
function exact(value, keys) {
  if (!record(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) reject('INVALID_CONFIG')
}
const pathValue = value => typeof value === 'string' && isAbsolute(value) && !/[\r\n\0]/u.test(value)
const inside = (root, path) => { const rest = relative(root, path); return rest === '' || (!isAbsolute(rest) && rest !== '..' && !rest.startsWith(`..${sep}`)) }
const label = value => typeof value === 'string' && /^[a-zA-Z0-9._/-]{1,160}$/u.test(value)
async function pinnedPath(path, root) {
  if (!inside(root, resolve(path))) reject('PATH_REJECTED')
  const actual = await realpath(path)
  if (!inside(root, actual)) reject('PATH_REJECTED')
  return actual
}
async function digest(path) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
async function jsonFile(path) {
  if ((await stat(path)).size > 4 * 1024 * 1024) reject('INVALID_CONFIG')
  return JSON.parse(await readFile(path, 'utf8'))
}
function parseConfig(raw, tool) {
  exact(raw, ['schemaVersion', 'tool', 'roots', 'forbiddenRoots', 'interpreter', 'modelManifest', 'minimumFreeBytes'])
  exact(raw.roots, ['source', 'runtime', 'models', 'data'])
  if (raw.schemaVersion !== 1 || raw.tool !== tool || !Object.values(raw.roots).every(pathValue)
    || !Array.isArray(raw.forbiddenRoots) || raw.forbiddenRoots.length === 0 || !raw.forbiddenRoots.every(pathValue)
    || !pathValue(raw.interpreter) || !pathValue(raw.modelManifest)
    || !Number.isSafeInteger(raw.minimumFreeBytes) || raw.minimumFreeBytes < 0) reject('INVALID_CONFIG')
  return raw
}
function parseManifest(raw, tool) {
  exact(raw, ['schemaVersion', 'tool', 'files'])
  if (raw.schemaVersion !== 1 || raw.tool !== tool || !Array.isArray(raw.files) || raw.files.length > 10000) reject('INVALID_MANIFEST')
  const seen = new Set()
  for (const file of raw.files) {
    exact(file, ['role', 'path', 'sha256', 'bytes', 'revision', 'license', 'access'])
    if (!roles[tool].includes(file.role) || !label(file.path) || isAbsolute(file.path) || file.path.split('/').includes('..')
      || !/^[a-f0-9]{64}$/u.test(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes < 1
      || !label(file.revision) || !label(file.license) || !['granted', 'required'].includes(file.access)
      || seen.has(file.path)) reject('INVALID_MANIFEST')
    seen.add(file.path)
  }
  return raw.files
}

function modelCoverage(files, tool) {
  const missing = []
  const requireFile = (role, suffix) => {
    if (!files.some(file => file.role === role && (file.path === suffix || file.path.endsWith(`/${suffix}`)))) missing.push({ role, code: 'INCOMPLETE_BUNDLE' })
  }
  switch (tool) {
    case 'unimate':
      requireFile('v3-config', 'config.json')
      requireFile('v3-stats', 'dataset_stats.npy')
      if (!files.some(file => file.role === 'v3-checkpoint' && /\/checkpoints\/checkpoint_step_\d+\.pt$/u.test(`/${file.path}`))) missing.push({ role: 'v3-checkpoint', code: 'INCOMPLETE_BUNDLE' })
      requireFile('flan-t5-base', 'spiece.model')
      requireFile('flan-t5-base', 'tokenizer_config.json')
      break
    case 'uniforge3d':
      requireFile('pipeline', 'pipeline.json')
      for (const role of ['structure-decoder', 'shape-decoder', 'texture-decoder']) {
        if (!files.some(file => file.role === role && file.path.endsWith('.json') && files.some(other => other.role === role && other.path === file.path.replace(/\.json$/u, '.safetensors')))) missing.push({ role, code: 'INCOMPLETE_DECODER' })
      }
      if (!files.some(file => file.role === 'rmbg' && file.path.endsWith('.py'))) missing.push({ role: 'rmbg', code: 'REMOTE_CODE_NOT_PINNED' })
      break
    default: reject('INVALID_TOOL')
  }
  for (const role of tool === 'unimate' ? ['flan-t5-base'] : ['dinov3', 'rmbg']) {
    requireFile(role, 'config.json')
    if (!files.some(file => file.role === role && /\.(safetensors|bin|index\.json)$/u.test(file.path))) missing.push({ role, code: 'INCOMPLETE_WEIGHTS' })
  }
  return missing
}

// Standard-library metadata/spec discovery only. Never import torch, native extensions or project modules.
const probe = `import sys,json,importlib.metadata as m,importlib.machinery as p
names=json.loads(sys.argv[1]); mods=json.loads(sys.argv[2])
versions={}
for n in names:
 try: versions[n]=m.version(n)
 except m.PackageNotFoundError: versions[n]=None
origins={}
for n in mods:
 s=p.PathFinder.find_spec(n); origins[n]=s.origin if s else None
print(json.dumps(dict(version=list(sys.version_info[:3]),prefix=sys.prefix,executable=sys.executable,versions=versions,origins=origins)))`

/** Read-only, CPU/file preconditions for trusted local adapters. No runtime readiness authority. */
export async function preflight({ tool, configPath }) {
  const result = { schemaVersion: 1, tool: Object.hasOwn(roles, tool) ? tool : null, status: 'NOT_CONFIGURED', ready: false,
    missingModels: [], licenseRequired: [], hashMismatch: [], runtimePrerequisite: [], verifiedModels: [], gpuProbe: 'NOT_RUN', runtimeProof: 'TASK12_REQUIRED' }
  try {
    if (!Object.hasOwn(roles, tool)) reject('INVALID_TOOL')
    if (!configPath) return result
    if (!pathValue(configPath)) reject('INVALID_CONFIG')
    const config = parseConfig(await jsonFile(configPath), tool)
    const roots = {}
    for (const [name, path] of Object.entries(config.roots)) {
      try { roots[name] = await realpath(path) }
      catch (error) {
        if (error.code !== 'ENOENT') throw error
        result.runtimePrerequisite.push({ code: 'ROOT_MISSING', component: name })
      }
    }
    // Resolve root aliases before comparing isolation boundaries.
    for (const [name, root] of Object.entries(roots)) {
      if (!(await stat(root)).isDirectory()) reject('PATH_REJECTED')
      for (const denied of config.forbiddenRoots) {
        let actual = resolve(denied)
        try { actual = await realpath(denied) } catch (error) { if (error.code !== 'ENOENT') throw error }
        if (inside(actual, root) || inside(root, actual)) reject('ISOLATION_REJECTED')
      }
      for (const [other, otherRoot] of Object.entries(roots)) {
        if (other !== name && (inside(root, otherRoot) || inside(otherRoot, root))) reject('ISOLATION_REJECTED')
      }
    }
    const files = parseManifest(await jsonFile(config.modelManifest), tool)
    result.missingModels.push(...modelCoverage(files, tool))
    for (const role of roles[tool]) if (!files.some(file => file.role === role)) result.missingModels.push({ role, code: 'UNDECLARED' })
    for (const file of files) {
      if (file.access !== 'granted') result.licenseRequired.push({ role: file.role, code: 'ACCESS_REQUIRED' })
      if (!roots.models) { result.missingModels.push({ role: file.role, code: 'ROOT_MISSING' }); continue }
      try {
        const path = await pinnedPath(resolve(roots.models, file.path), roots.models)
        const before = await stat(path)
        if (!before.isFile()) reject('PATH_REJECTED')
        const sha256 = await digest(path)
        const after = await stat(path)
        if (before.size !== file.bytes || sha256 !== file.sha256 || before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
          result.hashMismatch.push({ role: file.role, code: 'CONTENT_MISMATCH' }); continue
        }
        result.verifiedModels.push({ role: file.role, sha256, bytes: before.size, revision: file.revision, license: file.license })
        if (file.role === 'pipeline') {
          const pipeline = await jsonFile(path)
          const references = JSON.stringify(pipeline).match(/"(?:uniforge3d\/[^"\s]+\.(?:pt|safetensors))"/gu) ?? []
          for (const reference of references.map(value => JSON.parse(value))) {
            if (!files.some(candidate => candidate.path === reference || candidate.path.endsWith(`/${reference}`))) result.missingModels.push({ role: 'pipeline', code: 'UNDECLARED_DEPENDENCY' })
          }
          for (const stage of ['sparse_structure', 'structured_latent_512', 'structured_latent_1024', 'texture']) {
            const section = pipeline[stage]
            if (!record(section)) reject('INVALID_MANIFEST')
            const refs = [...Object.values(section.weights ?? {}), section.decoder?.checkpoint, section.shape_decoder_checkpoint, section.texture_decoder_checkpoint]
            for (const reference of refs.filter(value => record(value) && 'repo_id' in value)) {
              if (!label(reference.filename) || !label(reference.revision)) reject('INVALID_MANIFEST')
              const suffixes = /\.(pt|safetensors)$/u.test(reference.filename) ? [reference.filename] : [`${reference.filename}.json`, `${reference.filename}.safetensors`]
              for (const suffix of suffixes) if (!files.some(candidate => candidate.revision === reference.revision && (candidate.path === suffix || candidate.path.endsWith(`/${suffix}`)))) result.missingModels.push({ role: 'pipeline', code: 'UNDECLARED_DEPENDENCY' })
            }
          }
        }
        if (file.path.endsWith('.index.json')) {
          const index = await jsonFile(path)
          if (!record(index.weight_map)) reject('INVALID_MANIFEST')
          for (const shard of new Set(Object.values(index.weight_map))) {
            if (typeof shard !== 'string' || !files.some(candidate => candidate.path === relative(roots.models, resolve(path, '..', shard)).split(sep).join('/'))) {
              result.missingModels.push({ role: file.role, code: 'UNDECLARED_SHARD' })
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        result.missingModels.push({ role: file.role, code: 'FILE_MISSING' })
      }
    }
    if (roots.data) {
      const disk = await statfs(roots.data, { bigint: true })
      if (disk.bavail * disk.bsize < BigInt(config.minimumFreeBytes)) result.runtimePrerequisite.push({ code: 'INSUFFICIENT_DISK' })
    }
    if (roots.runtime) {
      try {
        const interpreter = await pinnedPath(config.interpreter, roots.runtime)
        const { stdout } = await execute(interpreter, ['-I', '-B', '-c', probe, JSON.stringify(Object.keys(packages[tool])), JSON.stringify(modules[tool])], {
          cwd: roots.runtime, timeout: 15000, maxBuffer: 65536, windowsHide: true,
          env: { ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}), CUDA_VISIBLE_DEVICES: '', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', PYTHONNOUSERSITE: '1' },
        })
        const info = JSON.parse(stdout)
        if (info.version?.[0] !== 3 || info.version?.[1] !== 10) result.runtimePrerequisite.push({ code: 'PYTHON_VERSION' })
        if (!pathValue(info.prefix) || await realpath(info.prefix) !== roots.runtime || !inside(roots.runtime, await realpath(info.executable))) reject('ISOLATION_REJECTED')
        for (const [name, expected] of Object.entries(packages[tool])) {
          if (info.versions?.[name]?.split('+')[0] !== expected.split('+')[0] || (expected.includes('+') && info.versions[name] !== expected)) result.runtimePrerequisite.push({ code: 'PACKAGE_VERSION', component: name })
        }
        for (const name of modules[tool]) {
          const origin = info.origins?.[name]
          if (!origin) result.runtimePrerequisite.push({ code: 'IMPORT_MISSING', component: name })
          else if (!inside(roots.runtime, await realpath(origin))) reject('IMPORT_CONTAMINATION')
        }
        result.runtime = { python: info.version, packages: info.versions, importDiscovery: 'SPEC_ONLY_NO_MODULE_EXECUTION' }
      } catch (error) {
        if (error instanceof Rejected) throw error
        result.runtimePrerequisite.push({ code: 'INTERPRETER_PROBE_FAILED' })
      }
    }
    result.runtimePrerequisite.push({ code: 'TASK12_RUNTIME_PROOF_REQUIRED' })
    result.status = 'BLOCKED'
    return result
  } catch (error) {
    result.status = 'REJECTED'
    result.runtimePrerequisite.push({ code: error instanceof Rejected ? error.code : 'CONFIG_UNREADABLE' })
    return result
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const valid = (args.length === 3 || args.length === 5) && args[0] === '--tool' && args[2] === '--json'
    && (args.length === 3 || args[3] === '--config')
  const result = valid ? await preflight({ tool: args[1], configPath: args[4] })
    : { status: 'REJECTED', ready: false, runtimePrerequisite: [{ code: 'INVALID_ARGUMENTS' }] }
  console.log(JSON.stringify(result))
  process.exitCode = 2
}
