import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

test('K1018 retains its stable route and approved identity across published and authoring records', async () => {
  const registry = await json('../lore/name-pools/person-id-registry.json')
  const values = await json('../lore/name-pools/values-cast.json')
  const person = registry.persons.find((entry) => entry.id === 'K1018')
  assert.equal(person.name, '고예진')
  const index = values.people.findIndex((entry) => entry.name === person.name)
  assert.equal(index, 1017)
  const detail = await json('../public/person-details/person-1018.json')
  assert.equal(detail.id, 'person-1018')
  assert.equal(detail.detailRoute, '/people/person-1018')
  assert.equal(detail.name, person.name)
  assert.equal(detail.desire.지향, '양성')
  assert.equal(detail.desire.결합, '비독점')
  assert.equal(detail.clan, null)
  const atlas = await json('../lore/World-Narrative-Atlas.json')
  const findIdentity = (value) => {
    if (!value || typeof value !== 'object') return undefined
    if (value.character_id === 'K1018') return value
    return Object.values(value).map(findIdentity).find(Boolean)
  }
  assert.equal(findIdentity(atlas).name.ko, person.name)
})

test('published K1018 biography is generated from the public card without extra story metadata', async () => {
  const detail = await json('../public/person-details/person-1018.json')
  const doc = await json('../lore/characters/Cast-Unaffiliated.json')
  const start = doc.content.findIndex((block) => block.kind === 'heading' && block.depth === 3 && block.text.ko === `인물 ${detail.name}`)
  assert.ok(start >= 0)
  const end = doc.content.findIndex((block, index) => index > start && block.kind === 'heading' && block.depth <= 3)
  const publicFields = doc.content.slice(start + 1, end).filter((block) => block.kind === 'list').flatMap((block) => block.items)
  for (const field of publicFields) assert.ok(detail.biography.includes(field.ko))
  for (const key of ['network', 'truth', 'stagedDeath', 'coercion', 'publicationRules']) assert.equal(Object.hasOwn(detail, key), false)
})

test('new identities preserve approved gender, unknown language and issued sheet correspondence', async () => {
  const registry = await json('../lore/name-pools/person-id-registry.json')
  const sheets = await json('../lore/name-pools/gurps-cast.json')
  for (const [id, name, gender] of [['K1020', '한서경', '여성'], ['K1021', '차유선', '여성'], ['K1022', '문도현', '남성']]) {
    assert.equal(registry.persons.find((entry) => entry.id === id).name, name)
    const detail = await json(`../public/person-details/person-${id.slice(1)}.json`)
    assert.equal(detail.name, name)
    assert.equal(detail.gender, gender)
    assert.equal(detail.fields.언어, '미정')
    assert.equal(detail.clan, null)
    assert.equal(detail.desire.지향, null)
    assert.equal(detail.desire.결합, null)
    const sheet = sheets.people.find((entry) => entry.id === id)
    assert.equal(sheet.name, name)
    assert.equal(sheet.url, detail.detailRoute)
    assert.deepEqual(sheet.languages, [])
  }
  const yejin = sheets.people.find((entry) => entry.id === 'K1018')
  assert.equal(yejin.name, '고예진')
  assert.ok(yejin.skills.some((skill) => skill.name === 'Guns/TL? (Pistol)' && skill.evidence.length > 0))
  const pistol = yejin.skills.find((skill) => skill.name === 'Guns/TL? (Pistol)')
  assert.equal(pistol.tier, 'B')
  assert.equal(pistol.cp, 8)
})

test('adding later cards does not extend K1019 across a parent section', async () => {
  const { renderLoreMarkdown } = await import('./lore-json-render.mjs')
  const source = await json('../lore/characters/Cast-Unaffiliated.json')
  const markdown = renderLoreMarkdown(source, 'ko')
  const heading = '### 인물 박성수'
  const start = markdown.indexOf(heading) + heading.length
  const end = markdown.indexOf('\n## ', start)
  const detail = await json('../public/person-details/person-1019.json')
  assert.equal(detail.biography, markdown.slice(start, end).trim())
})
