import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { STATES } from '../wiki/world-atlas-schema.mjs'

const repoRoot = resolve(import.meta.dirname, '../../..')

const expectedStates = {
  S01: '급수계약정', S02: '규격동맹', S03: '양재기공주식회사', S04: '설교명부정',
  S05: '호위보호정', S06: '대한민국정부', S07: '선로후계정', S08: '교헌필사정',
  S09: '여의도출자연합회', S10: '승가구휼정', S11: '서초전산그룹', S12: '중립호송시',
  S13: '의약중립맹', S14: '관문군정', S15: '본당인준정', S16: '정동노동총연맹',
}

const retiredNames = [
  '현대자동차주식회사', '대한예수교장로회', '전국경제인연합회', '대한불교조계종',
  '삼성그룹', '천주교 서울대교구', '전국민주노동조합총연맹',
]

test('the stable state registry uses fictional private successors and distinct religion-wide theocracies', () => {
  assert.deepEqual(Object.fromEntries(STATES.map((state) => [state.id, state.name])), expectedStates)
  assert.equal(new Set(STATES.map((state) => state.name)).size, 16)
  assert.equal(STATES.find((state) => state.id === 'S06')?.name, '대한민국정부')
})

test('all 1004 cast rows use the state name selected by their permanent state id', async () => {
  const people = JSON.parse(await readFile(resolve(repoRoot, 'LORE/name-pools/values-cast.json'), 'utf8')).people
  assert.equal(people.length, 1004)
  for (const person of people) {
    if (person.state === 'S00') {
      assert.equal(person.state_name, '무소속', person.name)
      continue
    }
    assert.equal(person.state_name, expectedStates[person.state], `${person.name}:${person.state}`)
  }
})

test('active authored canon does not expose retired private state names', async () => {
  const paths = [
    'LORE/World-Narrative-Atlas.md', 'LORE/factions/Sixteen-States.md',
    'LORE/factions/Chaebol-Houses-and-Century-Factions.md', 'LORE/offices/Offices-and-Ranks.md',
    'LORE/culture/Faith-Culture-Schism.md', 'LORE/chronology/Century-Annals.md',
    'LORE/chronology/Scenario-Timeline.md',
  ]
  const source = (await Promise.all(paths.map((path) => readFile(resolve(repoRoot, path), 'utf8')))).join('\n')
  for (const name of retiredNames) assert.ok(!source.includes(name), name)
  assert.match(source, /대한민국정부/u)
})
