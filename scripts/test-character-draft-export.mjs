import { test, expect } from 'vitest'
import { characterDraftExport } from '../src/pages/characterDraftExport'

test('character draft export retains identity and edits without credentials or transient AI state', () => {
  const sheet = { name: 'Kim', attributes: { ST: 11 }, aiKey: 'private-key', aiModel: 'local-model', aiGenerating: true, aiMessage: 'transient' }
  expect(characterDraftExport(sheet, 'person-1007')).toEqual({ name: 'Kim', attributes: { ST: 11 }, personId: 'person-1007' })
  expect(sheet.aiKey).toBe('private-key')
  expect(characterDraftExport(sheet, '').personId).toBeNull()
})

test('source GURPS traits skills and evidence survive edited draft export', () => {
  const sourceGurps = { id: 'K1007', traits: [{ name: 'trait', evidence: ['authored-source'] }], skills: [{ name: 'Administration', cp: 8 }], cp: { total: 300 } }
  const sheet = { name: 'Kim', sourceGurps, attributes: { ST: 14 }, aiKey: 'private-key', aiModel: 'model', aiGenerating: false, aiMessage: '' }
  const exported = characterDraftExport(sheet, 'person-1007')
  expect(exported.sourceGurps).toEqual(sourceGurps)
  expect(exported.attributes.ST).toBe(14)
  expect(JSON.stringify(exported)).not.toContain('private-key')
})
