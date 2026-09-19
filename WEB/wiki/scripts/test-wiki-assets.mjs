import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const projectRoot = resolve(import.meta.dirname, '..')

test('retired GAME-REFERENCE assets never appear in generated wiki content', async () => {
  const contentRoot = resolve(projectRoot, 'src/content')
  const failures = []
  for (const domain of await readdir(contentRoot)) {
    for (const name of await readdir(resolve(contentRoot, domain))) {
      if (!name.endsWith('.md')) continue
      const text = await readFile(resolve(contentRoot, domain, name), 'utf8')
      for (const match of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        const href = match[1]
        const retiredReferencePath = ['GAME-REFERENCE', 'assets'].join('/')
        if (href.includes(retiredReferencePath) || href.startsWith('/wiki/wiki-assets/')) failures.push(`${domain}/${name}:${href}`)
      }
    }
  }
  assert.deepEqual(failures, [])
})
