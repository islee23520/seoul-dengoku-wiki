// Explicit maintenance command. Normal generation reads only the committed files.
// Import exact historical bytes; never derive or rebaseline historical allocations.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseline = JSON.parse(readFileSync(resolve(root, 'scripts/issued-preservation-baseline.json'), 'utf8'))
const corpusRevision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const entries = [
  ...Object.entries(baseline.revisions).map(([revision, seal]) => ({ revision, source: 'lore/name-pools/gurps-cast.json', target: revision + '.json', hash: seal.ledgerSha256 })),
  ...Object.entries(baseline.sourceHashes).map(([source, hash]) => ({ revision: corpusRevision, source, target: 'corpus/' + source, hash })),
]
// Validate the entire import before publishing any file.
const verified = entries.map(entry => {
  const bytes = execFileSync('git', ['show', `${entry.revision}:${entry.source}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 })
  if (createHash('sha256').update(bytes).digest('hex') !== entry.hash) throw new Error('E_HISTORY_IMPORT_HASH:' + entry.source)
  return { ...entry, bytes }
})
for (const { target, bytes } of verified) {
  const path = resolve(root, 'vendor/issued-history', target)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, bytes)
}
console.log(`Imported ${verified.length} sealed historical files without modifying canon`)
