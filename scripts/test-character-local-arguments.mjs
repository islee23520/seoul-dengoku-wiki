import { test, expect } from 'vitest'
import { composePortraitPrompt, editedPortraitToken, localCharacterArguments } from '../src/pages/portraitPrompt'

test('web gender age and mood selections preserve CLI values and variant identity', () => {
  expect(localCharacterArguments({ gender: '여성', ageCategory: '미성년', mood: '단호한 시선', variantId: 'study-2' })).toEqual(['--gender', 'female', '--age-category', 'minor', '--mood', 'resolute', '--variant-id', 'study-2'])
  expect(localCharacterArguments({})).toEqual([])
  expect(() => localCharacterArguments({ gender: '여성' })).toThrow()
})

test('gender and age variants omit conflicting source face while preserving source facts', () => {
  const token = { personId: 'person-0399', characterId: 'K398', name: 'Yura', approval: 'art-proposal', facts: { gender: '여성', role: 'chair' }, artProposal: { face: '단호하고 예리한 성인 여성 얼굴', hair: 'black hair', upper: 'coat', lower: null, footwear: null }, style: { referenceSha256: 'a'.repeat(64), portraitShotId: '119' } }
  const output = composePortraitPrompt(token, 'portrait', 'yokoyama-b', { gender: '남성', ageCategory: '미성년', variantId: 'variant' })
  expect(output.prompt).not.toContain(token.artProposal.face)
  expect(output.selectedProperties.face).toBe('')
  expect(output.prompt).toContain('남성; 미성년')
  expect(token.facts.gender).toBe('여성')
  expect(composePortraitPrompt(token, 'portrait', 'yokoyama-b').prompt).toContain(token.artProposal.face)
})

test('hair and clothing edits are exported separately without modifying the source token', () => {
  const token = { schemaVersion: 1, personId: 'person-1007', characterId: 'K1007', name: 'Kim', approval: 'art-proposal', facts: { gender: '남성', role: 'records' }, artProposal: { face: 'face', hair: 'original hair', upper: 'original coat', lower: null, footwear: null }, style: { referenceSha256: 'a'.repeat(64), portraitShotId: '119' }, image: { sha256: 'b'.repeat(64) } }
  const overrides = { hair: 'authored hair', upper: 'authored coat', gender: '여성', ageCategory: '미성년', mood: '단호한 시선', variantId: 'study-2' }
  const draft = editedPortraitToken(token, overrides)
  expect(draft.artProposal.hair).toBe('authored hair')
  expect(draft.artProposal.upper).toBe('authored coat')
  expect(draft.variantId).toBe('study-2')
  expect(draft.generationOverrides).toEqual({ gender: 'female', ageCategory: 'minor', mood: 'resolute' })
  expect(draft.draftReviewStatus).toBe('unreviewed')
  expect(draft.sourceImageRole).toBe('identity-reference-only')
  expect(token.artProposal.hair).toBe('original hair')
  expect(token.facts.gender).toBe('남성')
  expect(localCharacterArguments(overrides)).toEqual(['--gender', 'female', '--age-category', 'minor', '--mood', 'resolute', '--variant-id', 'study-2'])
  const fullOverrides = { ...overrides, lower: 'Plain trousers', footwear: 'Dark boots' }
  const fullDraft = editedPortraitToken(token, fullOverrides)
  expect(fullDraft.artProposal.lower).toBe('Plain trousers')
  expect(fullDraft.artProposal.footwear).toBe('Dark boots')
  const full = composePortraitPrompt(token, 'front', 'yokoyama-b', fullOverrides)
  expect(full.missing).toEqual([])
  expect(full.prompt).toContain('Plain trousers')
  expect(full.prompt).toContain('Dark boots')
  expect(token.artProposal.lower).toBeNull()
})
