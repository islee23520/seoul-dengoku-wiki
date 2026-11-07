#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { checkRenderSnapshot, checkSeeds } from './check-render-snapshot.mjs'
import { publicAdmission } from './public-admission.mjs'
import { parseSeedRow, seedRowKey } from './seed-lossless.mjs'
import { assertPublicBytes, regularBytes, safePath, sha256, treeFiles } from './render-export.mjs'

const exec = promisify(execFile)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function committedTree(root, ref = 'HEAD') {
  if (ref !== 'HEAD' && !/^[a-f0-9]{40}$/u.test(ref)) throw new Error('E_STATIC_REF')
  const { stdout } = await exec('git', ['-C', root, 'ls-tree', '-rz', '--full-tree', ref], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  return new Map(stdout.split('\0').filter(Boolean).map(line => {
    const [header, ...path] = line.split('\t'), [mode, type, hash] = header.split(' ')
    return [path.join('\t'), { mode, type, hash }]
  }))
}

export async function committedBytes(root, path, tree) {
  safePath(path)
  const entry = tree.get(path)
  if (!entry || entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) throw new Error(`E_STATIC_UNCOMMITTED: ${path}`)
  const bytes = await regularBytes(root, path)
  const hash = createHash(entry.hash.length === 40 ? 'sha1' : 'sha256').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
  if (hash !== entry.hash) {
    const { stdout } = await exec('git', ['-C', root, 'cat-file', 'blob', entry.hash], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
    const pointer = stdout.match(/^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\n$/u)
    if (!pointer || sha256(bytes) !== pointer[1] || BigInt(bytes.length) !== BigInt(pointer[2])) throw new Error(`E_STATIC_UNCOMMITTED: ${path}`)
  }
  if (bytes.toString('utf8', 0, 100).startsWith('version https://git-lfs.github.com/spec/v1\n')) throw new Error(`E_STATIC_LFS_POINTER: ${path}`)
  return bytes
}

// Public C1: independently compare *each* export to Git objects, not merely A=B.
// Admission cannot be established from public seeds and is not claimed here.
export async function compareCommittedSeeds({ root, exports, ref = 'HEAD' }) {
  if (!Array.isArray(exports) || exports.length < 2) throw new Error('E_STATIC_EXPORT_PAIR')
  const tree = await committedTree(root, ref)
  const committed = [...tree.keys()].filter(path => path.startsWith('db/seeds/') && path !== 'db/seeds/README.md').sort()
  if (!committed.includes('db/seeds/manifest.json')) throw new Error('E_STATIC_SEED_BASELINE')
  let bytes = 0
  for (const out of exports) {
    await checkSeeds(out)
    const paths = (await treeFiles(out)).filter(path => path !== 'README.md').map(path => `db/seeds/${path}`).sort()
    if (JSON.stringify(paths) !== JSON.stringify(committed)) throw new Error('E_STATIC_SEED_DRIFT')
    for (const path of committed) {
      const actual = await regularBytes(out, path.slice('db/seeds/'.length))
      const entry = tree.get(path)
      const digest = createHash(entry.hash.length === 40 ? 'sha1' : 'sha256').update(`blob ${actual.length}\0`).update(actual).digest('hex')
      if (entry.type !== 'blob' || entry.mode !== '100644' || digest !== entry.hash) throw new Error('E_STATIC_SEED_DRIFT')
      bytes += actual.length
    }
  }
  return { status: 'passed', exports: exports.length, files: committed.length, comparedBytes: bytes, changedBytes: 0, admission: 'not-assessed-public-scratch' }
}

// Changes to documentation, tests and CI do not invalidate a projection. Actual
// renderer/runtime/build inputs do, including deletions and new input files.
export const projectionInput = path => /^(?:src\/|server\/|snapshots\/build-inputs\/|data\/geography\/|db\/migrations\/|vendor\/[^/]+\.tgz$)/u.test(path)
  || (path.startsWith('scripts/') && !/^scripts\/(?:test-|qa\/|check-static-snapshot\.mjs$)/u.test(path))
  || /^(?:package(?:-lock)?\.json|artifact-allowlist\.json|index\.html|(?:vite|tailwind|postcss)\.config\.[\w.]+|tsconfig(?:\.[\w-]+)?\.json)$/u.test(path)

export async function checkStaticSnapshot({ root = projectRoot, admissionFixture } = {}) {
  root = resolve(root)
  const snapshot = join(root, 'renders'), seeds = join(root, 'db/seeds')
  const tree = await committedTree(root)
  const receiptBytes = await committedBytes(root, 'db/provenance/public-snapshot.json', tree)
  assertPublicBytes(receiptBytes)
  const receipt = JSON.parse(receiptBytes)
  if (receipt.format !== 'wiki-public-snapshot/1' || !/^[a-f0-9]{40}$/u.test(receipt.producerCodeRef)
    || !Number.isFinite(Date.parse(receipt.producedAt))
    || !['seedManifestSha256', 'renderManifestSha256', 'checkedBuildArtifactDigest'].every(key => /^sha256:[a-f0-9]{64}$/u.test(receipt[key]))
    || Object.keys(receipt).sort().join() !== ['format', 'producerCodeRef', 'producedAt', 'seedManifestSha256', 'renderManifestSha256', 'checkedBuildArtifactDigest'].sort().join()) throw new Error('E_STATIC_RECEIPT')
  const admission = admissionFixture ? publicAdmission(admissionFixture) : undefined
  const checked = await checkRenderSnapshot({ root, snapshot, seeds, admission })
  if (checked.seedManifestSha256 !== receipt.seedManifestSha256 || checked.renderManifestSha256 !== receipt.renderManifestSha256) throw new Error('E_STATIC_STALE_SNAPSHOT')
  const manifest = JSON.parse(await regularBytes(snapshot, 'manifest.json'))
  const paths = new Set(['renders/manifest.json', 'db/seeds/manifest.json', 'artifact-allowlist.json'])
  for (const file of manifest.files) paths.add(file.storage === 'tracked' ? file.source : `renders/${file.path}`)
  const seedManifest = JSON.parse(await regularBytes(seeds, 'manifest.json'))
  for (const table of seedManifest.tables) {
    const seen = new Set()
    for (const file of table.files) {
      paths.add(`db/seeds/${file.file}`)
      for (const line of (await regularBytes(seeds, file.file)).toString('utf8').split('\n').filter(Boolean)) {
        const row = parseSeedRow(line)
        if (Object.keys(row.tokens).sort().join() !== [...table.columns].sort().join()) throw new Error('E_STATIC_SEED_COLUMNS')
        const key = seedRowKey(row, table.primary_key)
        if (seen.has(key)) throw new Error('E_STATIC_SEED_DUPLICATE')
        seen.add(key)
      }
    }
  }
  for (const path of paths) await committedBytes(root, path, tree)
  await exec('git', ['-C', root, 'merge-base', '--is-ancestor', receipt.producerCodeRef, 'HEAD'])
  const produced = await committedTree(root, receipt.producerCodeRef)
  const inputs = rows => [...rows].filter(([path]) => projectionInput(path)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
  if (JSON.stringify(inputs(tree)) !== JSON.stringify(inputs(produced))) throw new Error('E_STATIC_STALE_PRODUCER')
  for (const [path] of inputs(tree)) await committedBytes(root, path, tree)
  return { ...checked, format: 'wiki-static-snapshot/1', producerCodeRef: receipt.producerCodeRef,
    snapshotCommitted: true, admission: admission ? 'oracle-fixture' : 'checked-generation-receipt', databaseSemantics: 'not-assessed-offline' }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log('Usage: node scripts/check-static-snapshot.mjs\nCheck committed renders/, seeds and public receipt against HEAD: hashes, inventory, public allowlist, routes, private sentinels and producer input freshness. No database or network. Live admission semantics require full scratch C1; fixtures use the shared public-admission oracle.')
  else if (args.length) { console.error('E_STATIC_ARGUMENT'); process.exitCode = 1 }
  else checkStaticSnapshot().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1 })
}
