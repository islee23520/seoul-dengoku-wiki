import assert from 'node:assert/strict'
import { writeFile, rm } from 'node:fs/promises'
import test from 'node:test'
import { loreLinkFailures } from './check-lore-links.mjs'

test('lore checker rejects a missing file and a missing anchor', async () => {
  const fixture = new URL('../../lore/.link-check-fixture.md', import.meta.url)
  await writeFile(fixture, '[file](does-not-exist.md)\n\n[anchor](Glossary.md#does-not-exist)\n')
  try {
    const failures = await loreLinkFailures()
    assert.ok(failures.some((failure) => failure.includes('missing does-not-exist.md')))
    assert.ok(failures.some((failure) => failure.includes('missing anchor Glossary.md#does-not-exist')))
  } finally {
    await rm(fixture, { force: true })
  }
})
