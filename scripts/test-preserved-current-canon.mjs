import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { loadPreservedPersonSheets, preservedSheetSources, projectPreservedPersonSheet } from './preserved-person-sheet.mjs'
import { selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'
import { projectedDraftLegacy, draftPersonalContext, characterDraftExport, emptyCharacterDraft } from '../src/pages/characterDraftExport.ts'

const versions = loadPreservedPersonSheets()
for (const id of ['K035', 'K038', 'K039', 'K1008']) test(`${id}: current Daejeon and both historical affiliations remain independent`, () => {
  const historical = versions[0].people.get(id)
  const personId = historical.url.split('/').pop()
  const detail = JSON.parse(readFileSync(new URL('../public/person-details/' + personId + '.json', import.meta.url), 'utf8'))
  assert.equal(detail.state, 'polity:daejeon')
  assert.equal(detail.stateName, '대전')
  const identity = { id, personId, name: detail.name, state: detail.state, url: detail.detailRoute }
  const produced = projectPreservedPersonSheet(versions, identity)
  assert.deepEqual(detail.personSheet, produced)
  for (const version of versions) {
    const original = version.people.get(id)
    assert.equal(original.state, 'S02')
    const selected = selectPreservedSheet(produced, identity, version.revision)
    assert.equal(selected.ok, true)
    assert.deepEqual(selected.record, original)
    const legacy = projectedDraftLegacy(detail, version.revision)
    const draft = characterDraftExport({ ...emptyCharacterDraft(), ...draftPersonalContext(detail), legacy }, { personId, revision: version.revision })
    assert.equal(draft.personal.state, 'polity:daejeon')
    assert.deepEqual(draft.legacy.person, original)
    assert.equal(draft.legacy.projection.historicalState, 'S02')
    for (const mutate of [
      value => { value.currentState = 'S02' },
      value => { value.variants[0].historicalState = 'polity:daejeon' },
      value => { value.variants[0].legacy.record.name = '다른 인물' },
      value => { value.variants[0].legacy.record.url = '/people/person-9999' },
    ]) {
      const malformed = structuredClone(produced)
      mutate(malformed)
      assert.equal(selectPreservedSheet(malformed, identity, version.revision).ok, false)
      assert.throws(() => projectedDraftLegacy({ ...detail, personSheet: malformed }, version.revision))
    }
  }
  if (id === 'K1008') {
    assert.equal(detail.sovereignTitle.office, '대전 군주')
    assert.ok(detail.retinueGroups.length > 0)
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
