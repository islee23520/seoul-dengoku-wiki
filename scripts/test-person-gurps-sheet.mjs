import assert from 'node:assert/strict'
import { test } from 'vitest'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CharacterProfile } from '../src/pages/PersonDetailPage.tsx'
import { abilityIds } from './character-profile.mjs'

const text = (ko) => ({ ko, en: ko })
const fixture = () => ({
  abilities: Object.fromEntries(abilityIds.map((id, index) => [id, { base: index + 1, effective: index + 11 }])),
  skills: [{ id: 'repair', name: text('정비'), rating: 0 }, { id: 'escort', name: text('호위'), rating: 99.9 }],
  traits: [{ id: 'watchful', name: text('경계'), description: text('출입을 확인한다.'), behavior: text('기록을 대조한다.'), stress: text('중복 확인한다.'), relationship: text('연락을 유지한다.'), effects: [{ ability: 'insight', delta: 10 }] }],
  narrative: text('출입과 연락을 담당한다.'),
  health: { status: 'assessed', bodyParts: ['left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso'].map((id, index) => ({ id, severity: index === 0 ? 'minor' : null, function: index === 0 ? 'limited' : null })), diseases: [{ id: 'condition-1', progression: 'stable' }, { id: 'condition-2', progression: null }] },
})
const render = (profile) => new JSDOM(renderToStaticMarkup(createElement(CharacterProfile, { profile })))

test('current profile renders every base and effective ability without recalculation', () => {
  const profile = fixture()
  profile.abilities.leadership = { base: 0, effective: 100 }
  profile.abilities.endurance = { base: 20, effective: 0 }
  const before = structuredClone(profile)
  const dom = render(profile)
  try {
    const panel = dom.window.document.querySelector('[data-character-profile]')
    assert.ok(panel)
    const rows = [...panel.querySelector('table').tBodies[0].rows]
    assert.equal(rows.length, abilityIds.length)
    assert.ok(rows.every((row) => row.querySelector('th[scope="row"]')))
    assert.deepEqual(rows.map((row) => [...row.querySelectorAll('td')].map((cell) => Number(cell.textContent))), abilityIds.map((id) => [profile.abilities[id].base, profile.abilities[id].effective]))
    assert.deepEqual(profile, before)
  } finally { dom.window.close() }
})

test('current profile preserves skill endpoints, trait details and signed effects', () => {
  const profile = fixture()
  profile.traits[0].effects.push({ ability: 'endurance', delta: -2 })
  profile.traits.push({ ...profile.traits[0], id: 'steady', name: text('침착'), effects: [] })
  const dom = render(profile)
  try {
    const panel = dom.window.document.querySelector('[data-character-profile]')
    assert.equal(panel.querySelector(':scope > p').textContent, profile.narrative.ko)
    const skills = panel.querySelectorAll('table')[1]
    assert.deepEqual([...skills.tBodies[0].rows].map((row) => [row.querySelector('th').textContent, row.querySelector('td').textContent]), profile.skills.map((skill) => [skill.name.ko, skill.rating.toFixed(1)]))
    const traits = [...panel.querySelectorAll(':scope > section')]
    assert.equal(traits.length, profile.traits.length)
    for (const [index, trait] of profile.traits.entries()) {
      assert.equal(traits[index].querySelector('h4').textContent, trait.name.ko)
      assert.equal(traits[index].querySelector('p').textContent, trait.description.ko)
      assert.deepEqual([...traits[index].querySelectorAll('dd')].map((node) => node.textContent), [trait.behavior.ko, trait.stress.ko, trait.relationship.ko])
      assert.equal(traits[index].querySelectorAll('p').length, trait.effects.length ? 2 : 1)
    }
    const effects = traits[0].querySelector('p:last-child').textContent
    assert.deepEqual(effects.match(/[+-]\d+/gu), ['+10', '-2'])
  } finally { dom.window.close() }
})

test('current profile keeps assessed and unknown body states distinct and renders disease progressions', () => {
  const profile = fixture()
  const dom = render(profile)
  try {
    const health = dom.window.document.querySelector('[data-character-profile] details')
    assert.equal(health.querySelector('p').textContent, profile.health.status)
    const rows = [...health.querySelector('table').tBodies[0].rows]
    assert.equal(rows.length, profile.health.bodyParts.length)
    assert.deepEqual([...rows[0].querySelectorAll('td')].map((cell) => cell.textContent), [profile.health.bodyParts[0].severity, profile.health.bodyParts[0].function])
    const unknown = [...rows[1].querySelectorAll('td')].map((cell) => cell.textContent)
    assert.ok(unknown.every((value) => value.length > 0 && value !== '0'))
    for (const row of rows.slice(1)) assert.deepEqual([...row.querySelectorAll('td')].map((cell) => cell.textContent), unknown)
    const diseases = [...health.querySelectorAll('li')]
    assert.equal(diseases.length, profile.health.diseases.length)
    for (const [index, disease] of profile.health.diseases.entries()) {
      assert.ok(diseases[index].textContent.includes(disease.id))
      if (disease.progression) assert.ok(diseases[index].textContent.includes(disease.progression))
      else assert.ok(diseases[index].textContent.endsWith(unknown[0]))
    }
  } finally { dom.window.close() }
})

test('empty skill and trait records keep abilities and body records available', () => {
  const profile = fixture()
  profile.skills = []
  profile.traits = []
  profile.health.status = 'unassessed'
  profile.health.diseases = []
  const dom = render(profile)
  try {
    const panel = dom.window.document.querySelector('[data-character-profile]')
    assert.equal(panel.querySelectorAll('table').length, 2)
    assert.equal(panel.querySelector('table').tBodies[0].rows.length, abilityIds.length)
    assert.equal(panel.querySelector('details table').tBodies[0].rows.length, profile.health.bodyParts.length)
    assert.equal(panel.querySelectorAll(':scope > section').length, 0)
    assert.equal(panel.querySelector('details li'), null)
  } finally { dom.window.close() }
})
