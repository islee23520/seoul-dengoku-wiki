import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

export function verifyCenturyAnnals(markdown) {
  const years = [...markdown.matchAll(/^### (\d{4})년$/gm)].map((match) => Number(match[1]))
  const expected = Array.from({ length: 101 }, (_, index) => 2026 + index)
  assert.deepEqual(years, expected)
  for (const year of expected) {
    const body = markdown.split(`### ${year}년\n`)[1]?.split(/^### \d{4}년$/m)[0] ?? ''
    assert.match(body, /(?:^\|[^\n]+\|[^\n]+\|$)|(?:^- [^:]+:)/m, `${year}: structured record missing`)
  }
}

test('2026-2126 century annals contain every year exactly once', async () => {
  verifyCenturyAnnals(await readFile(resolve('LORE/chronology/Century-Annals.md'), 'utf8'))
})

test('removing the opening year is rejected', async () => {
  const markdown = await readFile(resolve('LORE/chronology/Century-Annals.md'), 'utf8')
  assert.throws(() => verifyCenturyAnnals(markdown.replace(/^### 2126년[\s\S]*$/m, '')), assert.AssertionError)
})
