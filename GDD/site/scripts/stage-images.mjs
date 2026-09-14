import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const repoRoot = join(docsSiteRoot, '..')
const src = join(repoRoot, 'docs', 'assets', 'wiki')
const dest = join(docsSiteRoot, 'public', 'assets', 'wiki')

function runLfsGate() {
  const result = spawnSync(process.execPath, ['tools/check-lfs-hydration.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
  if (result.error || result.status !== 0) {
    console.error(
      'LFS gate failed: unhydrated Git LFS pointers detected. Aborting image staging — never copy pointer stubs.'
    )
    if (result.error) console.error(result.error.message)
    if (result.stdout) console.error(result.stdout.trimEnd())
    if (result.stderr) console.error(result.stderr.trimEnd())
    process.exit(result.status || 1)
  }
}

function listFiles(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...listFiles(full))
    else if (stat.isFile()) files.push(full)
  }
  return files
}

runLfsGate()

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })

const files = listFiles(dest)
let totalBytes = 0
for (const file of files) totalBytes += statSync(file).size
const totalMb = totalBytes / (1024 * 1024)
const mbLabel = Number.isInteger(totalMb) ? String(totalMb) : totalMb.toFixed(1)

console.log(`staged: ${files.length} files, total: ${mbLabel}MB, lfs-gate: PASS`)
