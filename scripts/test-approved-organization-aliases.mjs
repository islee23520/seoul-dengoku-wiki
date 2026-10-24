import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { loadApprovedOrganizationAliases, organizationAliases, stateNames } from './approved-organization-aliases.mjs'
import { buildWorldIndex } from './build-world-index.mjs'
import { historicalRightsPeopleContext, projectPersonStateInputs } from './person-detail-inputs.mjs'
import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const proposal = (mappings) => Buffer.from(JSON.stringify({ schema: 'seoul.office-rank-retrofit-proposal.v1', organizationMappings: mappings }))
const approval = (bytes, decisions = ['중앙정보부=국가정보원 대응']) => ({ kind: 'batch-approval', proposalSha256: sha256(bytes), decisions })
const mapping = [{ fictionalName: '중앙정보부', real2026Identity: '국가정보원' }]

test('aliases come only from the proposal bytes the owner approved by hash', () => {
  const bytes = proposal(mapping)
  assert.deepEqual([...organizationAliases(bytes, approval(bytes))], [['중앙정보부', ['국가정보원']]])
  assert.throws(() => organizationAliases(proposal([{ fictionalName: '중앙정보부', real2026Identity: '다른 이름' }]), approval(bytes)), /E_ORGANIZATION_ALIAS_HASH/)
  assert.throws(() => organizationAliases(bytes, approval(bytes, ['다른 결정'])), /E_ORGANIZATION_ALIAS_APPROVAL/)
  assert.throws(() => organizationAliases(bytes, { ...approval(bytes), kind: 'draft' }), /E_ORGANIZATION_ALIAS_APPROVAL/)
  const duplicate = proposal([...mapping, ...mapping])
  assert.throws(() => organizationAliases(duplicate, approval(duplicate)), /E_ORGANIZATION_ALIAS_SHAPE/)
  assert.deepEqual(stateNames('중앙정보부', new Map([['중앙정보부', ['국가정보원']]])), ['중앙정보부', '국가정보원'])
  assert.deepEqual(stateNames('규격맹', new Map([['중앙정보부', ['국가정보원']]])), ['규격맹'])
})

test('state actor projection requires approved alias and matching current avatar identity', () => {
  const pages = new Map(['Sixteen-States', 'Offices-and-Ranks', 'Core-Characters'].map(slug => {
    const domain = slug === 'Sixteen-States' ? 'factions' : slug === 'Offices-and-Ranks' ? 'offices' : 'characters'
    return [slug, { value: readCanonicalDocument(`lore/${domain}/${slug}.json`) }]
  }))
  const rendered = new Map([...pages].map(([slug, page]) => [slug, renderLoreMarkdown(page.value, 'ko')]))
  const bytes = proposal(mapping)
  const aliases = organizationAliases(bytes, approval(bytes))
  for (const actor of ['가나인', '다라인']) {
    const stateSource = rendered.get('Sixteen-States').replace(/현재 아바타 [가-힣]{2,4}/gu, `현재 아바타 ${actor}`)
    const project = (core, organizationAliases = aliases) => projectPersonStateInputs(
      new Map([...rendered, ['Sixteen-States', stateSource], ['Core-Characters',
        `2126년 당회장 자리는 마바인가 앉았다.\n\n${core}`]]), pages, { organizationAliases }).stateCatalog.find(row => row.id === 'S08').ruler
    const core = `## ${actor}\n\n국가정보원 소속이며 현재 아바타는 ${actor}이다.\n\n`
    const unrelated = `## 무관인\n\n국가정보원 직원이며 ${actor}을 만났다.\n\n`
    assert.equal(project(core), actor)
    assert.equal(project(unrelated + core), actor)
    assert.equal(project(unrelated), '')
    assert.equal(project(core, new Map()), '')
    assert.equal(project(core, new Map([['중앙정보부', ['관계없는조직']]])), '')
    assert.equal(project(core.replace(`## ${actor}\n`, '## 무관인\n')), '')
    assert.equal(project(core.replace(`현재 아바타는 ${actor}이다`, '일반 직원이다')), '')
  }
})

test('historical rights people context authenticates predecessor affiliations and rejects substitutions', () => {
  const bytes = { values: readSourceArchive('lore/name-pools/values-cast.json'),
    registry: readSourceArchive('lore/name-pools/person-id-registry.json'),
    states: readSourceArchive('lore/factions/Sixteen-States.json') }
  const historical = historicalRightsPeopleContext(bytes)
  assert.equal(historical.people.find(person => person.id === 'K1008').state, 'polity:daejeon')
  assert.equal(historical.people.find(person => person.id === 'K1003').state, 'S00')
  for (const key of Object.keys(bytes)) assert.throws(() => historicalRightsPeopleContext({ ...bytes,
    [key]: Buffer.concat([bytes[key], Buffer.from(' ')]) }), new RegExp('E_HISTORICAL_PEOPLE_HASH:' + key))
  const wrong = JSON.parse(bytes.values)
  wrong.people.find(person => person.name === historical.people.find(person => person.id === 'K1008').name).state = 'S02'
  assert.throws(() => historicalRightsPeopleContext({ ...bytes, values: Buffer.from(JSON.stringify(wrong)) }), /E_HISTORICAL_PEOPLE_HASH:values/)
  const wrongAffiliation = JSON.parse(bytes.states)
  wrongAffiliation.data.currentAffiliation.hegemons[0].memberStateIds.push('polity:daejeon')
  assert.throws(() => historicalRightsPeopleContext({ ...bytes, states: Buffer.from(JSON.stringify(wrongAffiliation)) }), /E_HISTORICAL_PEOPLE_HASH:states/)
})

test('the repository proposal authenticates and grounds the 중앙정보부 leader through 국가정보원 cards', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const aliases = await loadApprovedOrganizationAliases(process.env.WIKI_ORGANIZATION_ALIAS_ROOT ?? root)
  assert.deepEqual(aliases.get('중앙정보부'), ['국가정보원'])
  const index = buildWorldIndex({ loreRoot: fileURLToPath(new URL('../lore', import.meta.url)), organizationAliases: aliases })
  const stateRows = index.split('\n').filter(line => /^\| \[/.test(line)).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
  assert.equal(stateRows.length, 16)
  assert.ok(stateRows.every(row => row.length === 4))
  const states = renderLoreMarkdown(readCanonicalDocument('lore/factions/Sixteen-States.json'), 'ko')
  const state = states.split('\n').find(line => /^\| S08 \|/u.test(line))
  const actor = state?.match(/현재 아바타 ([가-힣]{2,4})(?:$|[,，\s|])/u)?.[1]
  assert.ok(actor, 'approved state row must identify its current avatar')
  assert.equal(stateRows.find(row => row[0] === '[중앙정보부](Sixteen-States.html)')[3], actor)
})
