import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { loadApprovedOrganizationAliases, organizationAliases, stateNames } from './approved-organization-aliases.mjs'
import { buildWorldIndex } from './build-world-index.mjs'

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

test('the repository proposal authenticates and grounds the 중앙정보부 leader through 국가정보원 cards', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const aliases = await loadApprovedOrganizationAliases(root)
  assert.deepEqual(aliases.get('중앙정보부'), ['국가정보원'])
  const index = buildWorldIndex({ loreRoot: fileURLToPath(new URL('../lore', import.meta.url)), organizationAliases: aliases })
  const stateRows = index.split('\n').filter(line => /^\| \[/.test(line)).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
  assert.equal(stateRows.length, 16)
  assert.ok(stateRows.every(row => row.length === 4))
  assert.equal(stateRows.find(row => row[0] === '[중앙정보부](Sixteen-States.html)')[3], '오해린')
})
