import assert from 'node:assert/strict'
import { test } from 'vitest'
import { cameraViews, composePortraitPrompt, mangaStyles, portraitPromptYAML } from '../src/pages/portraitPrompt.ts'

const token = {
  personId: 'person-0001', characterId: 'K001', name: '한재목', approval: 'art-proposal',
  facts: { gender: '남성', role: '수문국 군주' },
  artProposal: { face: '넓은 눈썹', hair: '짧은 검은 머리', upper: '청회색 외투', lower: null, footwear: null },
  style: { referenceSha256: 'a'.repeat(64), portraitShotId: 'medium-close-up-119' },
}

test('portrait framing remains Wingzero 119 and can switch manga style without changing identity', () => {
  const first = composePortraitPrompt(token, 'portrait', 'yokoyama-b')
  const second = composePortraitPrompt(token, 'portrait', 'yoshikazu-yasuhiko')
  assert.equal(first.characterId, second.characterId)
  assert.equal(first.selectedProperties.hair, second.selectedProperties.hair)
  assert.equal(first.camera.source, cameraViews.portrait.source)
  assert.notEqual(first.style, second.style)
  assert.equal(second.mangaStyle.source, mangaStyles['yoshikazu-yasuhiko'].source)
})

test('identity-changing property requires a distinct variant id', () => {
  assert.throws(() => composePortraitPrompt(token, 'portrait', 'yokoyama-b', { gender: '여성' }), /변형 ID/)
  const study = composePortraitPrompt(token, 'portrait', 'yokoyama-b', { gender: '여성', variantId: 'han-female-study' })
  assert.equal(study.variantId, 'han-female-study')
  assert.equal(study.selectedProperties.gender, '여성')
  assert.equal(token.facts.gender, '남성')
})

test('turntable view reports missing lower outfit and footwear, YAML preserves those machine values', () => {
  const result = composePortraitPrompt(token, 'profile', 'yokoyama-b')
  assert.deepEqual(result.missing, ['lower', 'footwear'])
  assert.equal(result.camera.source, cameraViews.profile.source)
  assert.match(portraitPromptYAML(result), /missing: \["lower","footwear"\]/)
})
