import assert from 'node:assert/strict'

// Independent consumer contract, intentionally not the production projector.
export function assertPublicSheetRecord(actual, issued) {
  const pick = (row, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]))
  const expected = {
    ...pick(issued, ['id', 'name', 'url', 'state', 'personId', 'band']),
    attributes: Object.fromEntries(['ST', 'DX', 'IQ', 'HT'].filter(key => issued.attributes?.[key] != null)
      .map(key => [key, pick(issued.attributes[key], ['value', 'cp'])])),
    traits: (issued.traits ?? []).map(row => pick(row, ['name', 'kind', 'cp', 'rule'])),
    skills: (issued.skills ?? []).map(row => pick(row, ['name', 'ko', 'level', 'cp'])),
    secondary: pick(issued.secondary ?? {}, ['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'BasicMove', 'BasicLift', 'Dodge']),
    cp: pick(issued.cp ?? {}, ['total', 'attributes', 'advantages', 'disadvantages', 'skills', 'spent', 'unspent']),
  }
  assert.deepEqual(actual, expected)
  for (const field of ['evidence', 'territory', 'unit', 'wandering_force']) assert.equal(Object.hasOwn(actual, field), false)
}
