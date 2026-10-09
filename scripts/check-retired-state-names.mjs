import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
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
  const files = new Set(tracked.filter(path => !path.startsWith('.omo/') && /\.(?:json|md|mjs|cjs|js|ts|tsx|html|css|py|txt|csv|yml|yaml)$/.test(path)))
  const collect = path => { if (!existsSync(path)) return; for (const entry of readdirSync(path, { withFileTypes: true })) { const file = resolve(path, entry.name); if (entry.isDirectory()) collect(file); else if (/\.(?:json|md|mjs|cjs|js|ts|tsx|html|css|py|txt|csv|yml|yaml)$/.test(file)) files.add(relative(directory, file)) } }
  for (const path of ['src/generated', 'src/generated-private', 'dist']) collect(resolve(directory, path))
  const failures = []
  for (const path of files) {
    const text = readFileSync(resolve(directory, path), 'utf8')
    for (const offset of retiredStateOffsets(text)) failures.push({ path, line: text.slice(0, offset).split('\n').length, offset })
  }
  return { scanned: files.size, failures }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkRetiredStateNames()
  console.log(JSON.stringify(result, null, 2))
  if (result.failures.length) process.exitCode = 1
}
