import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('all 1007 people have a common T1-T5 tier', async () => {
  const root = new URL('../public/person-details/', import.meta.url)
  const files = (await readdir(root)).filter((name) => name.endsWith('.json'))
  assert.equal(files.length, 1007)
  for (const file of files) {
    const person = JSON.parse(await readFile(new URL(file, root), 'utf8'))
    assert.match(person.commonTier, /^T[1-5]$/u, file)
  }
})

test('people page filters by common tier and not by position', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /공통 티어/)
  assert.match(page, /commonTier/)
  assert.doesNotMatch(page, /직위<select/)
})
