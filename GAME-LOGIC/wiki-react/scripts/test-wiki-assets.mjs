import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const projectRoot = resolve(import.meta.dirname, '..')

test('all generated wiki image links resolve to self-hosted public assets', async () => {
  const contentRoot = resolve(projectRoot, 'src/content')
  const failures = []
  for (const domain of await readdir(contentRoot)) {
    for (const name of await readdir(resolve(contentRoot, domain))) {
      if (!name.endsWith('.md')) continue
      const text = await readFile(resolve(contentRoot, domain, name), 'utf8')
      for (const match of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        const href = match[1]
        if (!href.startsWith('/wiki/wiki-assets/')) {
          failures.push(`${domain}/${name}:external:${href}`)
          continue
        }
        const path = resolve(projectRoot, 'public', href.replace('/wiki/', ''))
        try {
          const info = await stat(path)
          if (info.size === 0) failures.push(`${domain}/${name}:empty:${href}`)
        } catch {
          failures.push(`${domain}/${name}:missing:${href}`)
        }
      }
    }
  }
  assert.deepEqual(failures, [])
})
