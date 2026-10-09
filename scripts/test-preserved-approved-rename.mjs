import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { loadPreservedPersonSheets, projectPreservedPersonSheet } from './preserved-person-sheet.mjs'
import { selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'
import { projectedDraftLegacy } from '../src/pages/characterDraftExport.ts'

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
test('PR549 approved K719 rename preserves historical name and current portrait identity', () => {
  const detail = read('public/person-details/person-0719.json')
  const registry = read('lore/name-pools/person-id-registry.json')
  const token = read('public/portrait-tokens/person-0719.json')
  assert.equal(registry.persons.find(person => person.id === 'K719').name, '송도현')
  assert.equal(detail.name, '송도현')
  assert.equal(token.name, detail.name)
  assert.equal(token.characterId, 'K719')
  const identity = { id: 'K719', personId: detail.id, name: detail.name, state: detail.state, url: detail.detailRoute }
  const versions = loadPreservedPersonSheets()
  assert.deepEqual(projectPreservedPersonSheet(versions, identity), detail.personSheet)
  for (const version of versions) {
    const original = version.people.get('K719')
    assert.equal(original.name, '송라지')
    const selected = selectPreservedSheet(detail.personSheet, identity, version.revision)
    assert.equal(selected.ok, true)
    assert.deepEqual(selected.record, original)
    assert.deepEqual(projectedDraftLegacy(detail, version.revision).person, original)
    for (const name of ['송다현', '다른 인물']) {
      assert.throws(() => projectPreservedPersonSheet(versions, { ...identity, name }), /E_PERSON_SHEET_IDENTITY/)
      assert.equal(selectPreservedSheet(detail.personSheet, { ...identity, name }, version.revision).ok, false)
      assert.throws(() => projectedDraftLegacy({ ...detail, name }, version.revision), /E_PERSON_SHEET_IDENTITY/)
    }
  }
})
