import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'vitest'

const root = new URL('../lore/', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.entries(value).filter(([key]) => !['provenance', 'history'].includes(key)).flatMap(([, item]) => strings(item)) : []
async function documents(directory = root) {
  const out = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    if (entry.isDirectory()) out.push(...await documents(path))
    else if (entry.name.endsWith('.json')) out.push({ path: path.pathname, value: JSON.parse(await readFile(path, 'utf8')) })
  }
  return out
}

test('blackout starts in 2030 without the superseded 2036 order or 2026 eruption', async () => {
  const annals = await json('chronology/Century-Annals.json')
  let year = null
  const years = new Map()
  for (const block of annals.content) {
    if (block.kind === 'heading' && block.depth === 3) year = Number(block.text.ko.match(/\d+/u)[0])
    if (block.anchor) years.set(block.anchor, year)
  }
  assert.equal(years.get('2030년-대정전-발발'), 2030)
  assert.equal(years.get('2030년-청와대-국가위기관리센터-상황실'), 2030)
  assert.equal(years.get('2040년-살육-중단'), 2040)
  assert.equal(years.get('ch10-i4-p'), 2040)
  assert.equal(years.get('peninsula-2040-honam-seed-grain-p'), 2040)
  for (const { path, value } of await documents()) {
    for (const text of strings(value)) {
      assert.doesNotMatch(text, /2026년 10월 14일|2026-10-14|2026년 대정전|2026년 구로공단 설비가 멈|2026년 예비군 중대의 명부|2036년 AI가 국가 권력을 정신 지배|2036년-전세계-살육-명령/u, path)
    }
  }
})

test('current bureau affiliation remains neutral outside all hegemon memberships', async () => {
  const state = await json('factions/Sixteen-States.json')
  assert.deepEqual(state.data.currentAffiliation.neutralStateIds, ['S08'])
  assert.ok(state.data.currentAffiliation.hegemons.every(item => !item.memberStateIds.includes('S08')))
})
