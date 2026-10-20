import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
// These seals bind the existing preservation declarations, not arbitrary manifests
// supplied by the scanned tree. A public copy never inherits its source's status.
const historyManifests = [
  { path: 'scripts/issued-preservation-baseline.json', sha256: 'cb2339a544090a471a876642abe2b09166bd3195860db33f672b6a2443b73623',
    entries: value => [...Object.entries(value.revisions).map(([revision, seal]) => [`vendor/issued-history/${revision}.json`, seal.ledgerSha256]),
      ...Object.entries(value.sourceHashes).map(([path, hash]) => [`vendor/issued-history/corpus/${path}`, hash])] },
  { path: 'snapshots/build-inputs/source-manifest.json', sha256: '0a6285b54cd9f1566704e97785518b2053d531fcf8d1fe2e6d428616d578ca1e',
    entries: value => value.files.map(row => [`snapshots/build-inputs/${row.path}`, row.sha256]) },
]
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprints = JSON.parse(readFileSync(new URL('./retired-state-fingerprints.json', import.meta.url), 'utf8')).fingerprints
const candidatesByPrefix = new Map()
for (const row of fingerprints) candidatesByPrefix.set(row.prefix, [...(candidatesByPrefix.get(row.prefix) ?? []), row])
export function retiredStateOffsets(text) {
  const matches = []
  for (let offset = 0; offset + 1 < text.length; offset++) {
    const prefix = (text.charCodeAt(offset) << 16) | text.charCodeAt(offset + 1)
    const candidates = candidatesByPrefix.get(prefix)
    if (!candidates) continue
    for (const row of candidates) {
      if (createHash('sha256').update(text.slice(offset, offset + row.length)).digest('hex') === row.sha256) matches.push(offset)
    }
  }
  return matches.sort((a, b) => a - b)
}
export function checkRetiredStateNames(directory = root) {
  const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: directory, encoding: 'utf8' }).split('\0').filter(Boolean)
  const deleted = new Set(execFileSync('git', ['ls-files', '--deleted', '-z'], { cwd: directory, encoding: 'utf8' }).split('\0').filter(Boolean))
  const files = new Set(tracked.filter(path => !path.startsWith('.omo/') && /\.(?:json|md|mjs|cjs|js|ts|tsx|html|css|py|txt|csv|yml|yaml)$/.test(path)))
  const collect = path => { if (!existsSync(path)) return; for (const entry of readdirSync(path, { withFileTypes: true })) { const file = resolve(path, entry.name); if (entry.isDirectory()) collect(file); else if (/\.(?:json|md|mjs|cjs|js|ts|tsx|html|css|py|txt|csv|yml|yaml)$/.test(file)) files.add(relative(directory, file)) } }
  for (const path of ['src/generated', 'src/generated-private', 'public', 'dist']) collect(resolve(directory, path))
  const preserved = []
  for (const manifest of historyManifests) {
    if (!files.has(manifest.path)) continue
    const manifestBytes = readFileSync(resolve(directory, manifest.path))
    if (sha256(manifestBytes) !== manifest.sha256) throw new Error('E_RETIRED_HISTORY_MANIFEST_HASH:' + manifest.path)
    for (const [path, expected] of manifest.entries(JSON.parse(manifestBytes.toString('utf8')))) {
      const bytes = readFileSync(resolve(directory, path))
      if (sha256(bytes) !== expected) throw new Error('E_RETIRED_HISTORY_HASH:' + path)
      preserved.push({ path, sha256: expected, retiredMatches: retiredStateOffsets(bytes.toString('utf8')).length })
      files.delete(path)
    }
  }
  const failures = []
  let scanned = 0
  for (const path of files) {
    let text
    try { text = readFileSync(resolve(directory, path), 'utf8') }
    catch (error) {
      if (error.code === 'ENOENT' && deleted.has(path)) continue
      throw error
    }
    scanned++
    for (const offset of retiredStateOffsets(text)) failures.push({ path, line: text.slice(0, offset).split('\n').length, offset })
  }
  return { scanned, failures, preserved: { count: preserved.length, files: preserved } }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkRetiredStateNames()
  console.log(JSON.stringify(result, null, 2))
  if (result.failures.length) process.exitCode = 1
}
