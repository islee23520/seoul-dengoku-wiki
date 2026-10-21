import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { publicOfficeContent } from './public-office-content.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'

test('office publication hides partition references without changing the authoring source', async () => {
  const source = readCanonicalDocument('lore/offices/Offices-and-Ranks.json')
  const before = JSON.stringify(source)
  const published = publicOfficeContent(source)
  for (const locale of ['ko', 'en']) {
    const text = renderLoreMarkdown(published, locale)
    assert.doesNotMatch(text, /선거구|국회의원 지역구|constituenc|electoral|SGIS|지리 parent/iu)
    assert.ok(text.includes(locale === 'ko' ? '48개 백작령' : '48 counties'))
  }
  assert.equal(JSON.stringify(source), before)
  const modified = structuredClone(source)
  modified.content[74].text.ko += ' changed'
  assert.throws(() => publicOfficeContent(modified), /E_OFFICE_PUBLIC_PROJECTION/)
})
