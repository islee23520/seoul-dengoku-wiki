import assert from 'node:assert/strict'
import { test } from 'vitest'
import { geographicPoliticalAffiliation } from '../src/components/geographicTitleMap.mjs'

const title = { id: 'county', countyIds: ['county'], currentSlots: [{ dongId: 'a' }, { dongId: 'b' }] }
const geography = { titles: [title] }
const region = (id, names) => ({ id, currentHegemons: names.map(name => ({ name })) })

test('multiple political affiliations never turn a county into neutral territory', () => {
  assert.deepEqual(geographicPoliticalAffiliation(title, geography,
    [region('a', ['대한민국정부']), region('b', ['규격맹'])]),
  { kind: 'mixed', names: ['규격맹', '대한민국정부'] })
  assert.equal(geographicPoliticalAffiliation(title, geography,
    [region('a', ['대한민국정부']), region('b', ['중립'])]).kind, 'mixed')
})

test('missing evidence, actual neutral and a single faction remain distinct', () => {
  assert.deepEqual(geographicPoliticalAffiliation(title, geography, []), { kind: 'unknown', names: [] })
  assert.deepEqual(geographicPoliticalAffiliation(title, geography, [region('a', ['중립'])]),
    { kind: 'single', names: ['중립'] })
  assert.deepEqual(geographicPoliticalAffiliation(title, geography,
    [region('a', ['규격맹']), region('b', ['규격맹']), region('outside', ['중립'])]),
  { kind: 'single', names: ['규격맹'] })
})
