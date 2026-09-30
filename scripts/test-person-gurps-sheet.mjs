import assert from 'node:assert/strict'
import { test } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GurpsSheet } from '../src/pages/PersonDetailPage.tsx'
import { build } from './gurps-cast.mjs'

const people = build().doc.people
const person = (id) => people.find((entry) => entry.id === id)
const markup = (record) => renderToStaticMarkup(React.createElement(GurpsSheet, { gurps: record }))

test('sheet consumes issued Speed, Dodge, traits and unspent CP without invented effects', () => {
  const jo = markup(person('K1003'))
  const shin = markup(person('K1009'))
  const baseline = markup(people.find((entry) => entry.baseline))
  assert.match(jo, /<span>Dodge 회피<\/span><span>10<\/span>/u)
  assert.match(shin, /<span>Speed<\/span><span>6\.25<\/span>/u)
  assert.match(shin, /<span>Dodge 회피<\/span><span>10<\/span>/u)
  assert.match(jo, /Combat Reflexes/u)
  assert.match(baseline, /<span>미사용<\/span><span>75 CP<\/span>/u)
  assert.doesNotMatch(jo, /class="skill-effect"|class="unit-note"|정착지:/u)
})

test('missing producer fields do not fabricate a band, CP, derived values, or traits', () => {
  const sparse = markup({ attributes: {}, skills: [], traits: [], cp: {}, secondary: {} })
  assert.doesNotMatch(sparse, /class="cp-note"|class="gurps-advantages"|class="gurps-disadvantages"/u)
  assert.match(sparse, /<span>Speed<\/span><span>—<\/span>/u)
  assert.match(sparse, /<span>Dodge 회피<\/span><span>—<\/span>/u)
  assert.match(sparse, /<span>미사용<\/span><span>— CP<\/span>/u)
})
