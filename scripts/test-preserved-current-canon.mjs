import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { loadPreservedPersonSheets, preservedSheetSources, projectPreservedPersonSheet, projectPublicHistoricalRecord } from './preserved-person-sheet.mjs'
import { profileFailures } from './character-profile.mjs'

const versions = loadPreservedPersonSheets()
for (const id of ['K035', 'K038', 'K039', 'K1008']) test(`${id}: current identity and profile remain independent of sealed historical affiliations`, () => {
  const historical = versions[0].people.get(id)
  const personId = historical.url.split('/').pop()
  const detail = JSON.parse(readFileSync(new URL('../public/person-details/' + personId + '.json', import.meta.url), 'utf8'))
  assert.equal(detail.characterId, id)
  assert.equal(detail.state, 'S02')
  assert.equal(detail.stateName, '규격맹')
  assert.deepEqual(profileFailures(detail.characterProfile), [])
  const identity = { id, personId, name: detail.name, state: detail.state, url: detail.detailRoute }
  const produced = projectPreservedPersonSheet(versions, identity)
  assert.equal(produced.currentState, detail.state)
  for (const version of versions) {
    const original = version.people.get(id)
    assert.equal(original.state, 'S02')
    const variant = produced.variants.find(entry => entry.revision === version.revision)
    assert.deepEqual(variant.legacy.record, projectPublicHistoricalRecord(original))
    assert.equal(variant.historicalState, original.state)
    assert.equal(variant.legacy.operative, false)
  }
  // Public selector and draft-import mutation cases retired with public historical sheets.
  // The archival producer still rejects an invalid current identity or historical affiliation.
  for (const changed of [
    { ...identity, name: '다른 인물' },
    { ...identity, url: '/people/person-9999' },
    { ...identity, state: 'unknown' },
  ]) assert.throws(() => projectPreservedPersonSheet(versions, changed))
  for (const mutate of [
    record => { record.name = '다른 인물' },
    record => { record.url = '/people/person-9999' },
    record => { record.state = 'polity:daejeon' },
  ]) {
    const malformed = structuredClone(versions)
    mutate(malformed[0].people.get(id))
    assert.throws(() => projectPreservedPersonSheet(malformed, identity))
  }
})

test('committed source composition rejects altered, malformed and swapped ledgers before projection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'wiki-sealed-input-'))
  const revision = versions[0].revision
  const path = join(directory, 'ledger.json')
  try {
    for (const bytes of ['{', '{}', readFileSync(preservedSheetSources[revision].ledgerPath, 'utf8') + ' ']) {
      writeFileSync(path, bytes)
      assert.throws(() => loadPreservedPersonSheets({ ...preservedSheetSources, [revision]: { ...preservedSheetSources[revision], ledgerPath: path } }))
    }
    assert.throws(() => loadPreservedPersonSheets({ ...preservedSheetSources,
      [revision]: preservedSheetSources[versions[1].revision],
    }), /E_SOURCE_HASH/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
