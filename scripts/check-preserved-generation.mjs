// Integration check: invoke the real standard entrypoints, never a test-only generator.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
delete env.WIKI_PERSON_SHEET_SOURCES
delete env.CHARACTER_PARENT_PIN_SOURCE
delete env.CHARACTER_POPULATED_SOURCE
const run = script => {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { cwd: root, env, stdio: 'inherit', timeout: 600000 })
  if (result.error) throw result.error
  assert.equal(result.status, 0, `standard ${script} failed`)
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const snapshots = () => readdirSync(join(root, 'public/person-details')).filter(file => file.endsWith('.json')).sort().map(file => [file, hash(readFileSync(join(root, 'public/person-details', file)))])
run('build')
const first = snapshots()
assert.equal(first.length, 1022)
run('generate')
assert.deepEqual(snapshots(), first, 'person projection generation must be byte-deterministic')
console.log(JSON.stringify({ check: 'standard-no-sheet-env-build-and-determinism', count: first.length, sha256: hash(JSON.stringify(first)), status: 'PASS' }))
