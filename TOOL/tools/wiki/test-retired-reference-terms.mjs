import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(import.meta.dirname, '../../..')
const roots = ['LORE', 'GDD', 'TOOL/tools']
const forbidden = [
  /일본삼국/u, /日本三國/u, /日本三国/u, /小学館/u,
  /Shogakukan/iu, /nippon-sangoku/iu, /Nippon Sangoku/iu,
  /Unofficial-Fan-AU-Notice/iu, /비공식\s*(?:·|·비상업\s*)?팬\s*AU/u, /AU 고지/u,
]
const selfPath = fileURLToPath(import.meta.url)

const walk = async (directory) => {
  const rows = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) rows.push(...await walk(path))
    else if (/\.(?:md|json|mjs|js|ts|tsx|html|txt)$/u.test(entry.name)) rows.push(path)
  }
  return rows
}

test('retired reference and AU language is absent from current canon and tooling', async () => {
  const failures = []
  for (const root of roots) {
    for (const path of await walk(resolve(repoRoot, root))) {
      if (path === selfPath || path.includes('/policy/fixtures/')) continue
      const text = await readFile(path, 'utf8')
      for (const pattern of forbidden) {
        if (pattern.test(text)) failures.push(`${relative(repoRoot, path)}:${pattern}`)
      }
    }
  }
  assert.deepEqual(failures, [])
})
