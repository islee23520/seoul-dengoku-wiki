import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { portraitReviewFailures, generationEvidencePaths } from './portrait-public-boundary.mjs'

test('approved selection binds registered identities and prior image hashes', async () => {
  const selection = JSON.parse(await readFile(new URL('../portrait-approved-selection.json', import.meta.url), 'utf8'))
  const catalog = JSON.parse(await readFile(new URL('../portrait-catalog.json', import.meta.url), 'utf8'))
  assert.equal(new Set(selection.records.map(row => row.personId)).size, selection.records.length)
  assert.equal(catalog.styleSource, 'public/portrait-tokens/{personId}.json')
  assert.equal(catalog.styleId, undefined)
  for (const row of selection.records) {
    const entry = catalog.entries.find(entry => entry.personId === row.personId)
    assert.ok(entry)
    assert.equal(row.characterId, entry.characterId)
    assert.equal(row.name, entry.name)
    assert.equal(selection.status === 'approved-selection-applied-to-worktree' ? row.imageSha256 : row.previousImageSha256, entry.imageSha256)
    assert.match(row.imageSha256, /^[a-f0-9]{64}$/)
    assert.equal(row.verdict, 'pass')
    if (row.operation !== 'register-approved') assert.equal(row.operation === 'preserve-existing', row.imageSha256 === row.previousImageSha256)
  }
  assert.equal(selection.canonPromotion, false)
  assert.equal(selection.final3dPortraitContractSatisfied, false)
})

test('portrait properties and immutable images follow the registered portrait catalog', async () => {
  const catalog = JSON.parse(await readFile(new URL('../portrait-catalog.json', import.meta.url), 'utf8'))
  const selection = JSON.parse(await readFile(new URL('../portrait-approved-selection.json', import.meta.url), 'utf8'))
  const selectedIds = new Set(selection.records.map(row => row.personId))
  const properties = JSON.parse(await readFile(new URL('../portrait-properties.json', import.meta.url), 'utf8'))
  const genders = JSON.parse(await readFile(new URL('../lore/name-pools/gender-cast.json', import.meta.url), 'utf8')).people
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8')).persons
  assert.ok(catalog.entries.length > 0)
  assert.equal(new Set(catalog.entries.map(entry => entry.personId)).size, catalog.entries.length)
  const iyen = catalog.entries.find(entry => entry.characterId === 'K1004')
  assert.equal(iyen?.name, '이연')
  assert.equal(iyen?.personId, 'person-1004')
  assert.deepEqual(Object.keys(properties.entries).sort(), catalog.entries.map(entry => entry.personId).sort())
  for (const entry of catalog.entries) {
    const token = JSON.parse(await readFile(new URL('../public/portrait-tokens/' + entry.personId + '.json', import.meta.url), 'utf8'))
    const detail = JSON.parse(await readFile(new URL('../public/person-details/' + entry.personId + '.json', import.meta.url), 'utf8'))
    const image = await readFile(new URL('../public/portraits/' + entry.personId + '.png', import.meta.url))
    assert.equal(entry.name, detail.name)
    assert.equal(token.personId, detail.id)
    assert.equal(token.characterId, entry.characterId)
    assert.equal(token.name, entry.name)
    assert.equal(token.stateId, entry.stateId, entry.personId + ' catalog/token state')
    if (selection.records.find(row => row.personId === entry.personId)?.operation === 'register-approved') {
      assert.equal(registry.find(person => person.id === entry.characterId)?.name, detail.name)
      if (detail.fields['캐릭터 ID'] !== undefined) assert.equal(entry.characterId, detail.fields['캐릭터 ID'])
      assert.equal(entry.stateId, detail.state === 'S00' ? null : detail.state, entry.personId + ' registered state')
    }
    assert.equal(token.approval, 'art-proposal')
    assert.equal(token.image.sha256, createHash('sha256').update(image).digest('hex'))
    assert.equal(token.image.sha256, entry.imageSha256)
    if (token.imageReview) {
      assert.equal(token.imageReview.record, `/portrait-reviews/${entry.personId}.json`)
      const review = JSON.parse(await readFile(new URL('../public' + token.imageReview.record, import.meta.url), 'utf8'))
      assert.equal(review.personId, token.personId)
      assert.equal(review.characterId, token.characterId)
      assert.equal(review.imageSha256, token.image.sha256)
      assert.equal(token.imageReview.imageSha256, token.image.sha256)
      assert.deepEqual(portraitReviewFailures(review), [])
      assert.deepEqual(generationEvidencePaths(review), [])
      if (review.imageModification) {
        assert.equal(review.imageModification.outputSha256, token.image.sha256)
        assert.equal(review.imageModification.inputSha256, review.imageHashHistory[0])
        assert.ok(['localized-alpha-edit', 'body-improvement'].includes(review.imageModification.operation))
        assert.equal(review.ownerVerdict.verdict, 'pass')
        assert.equal(review.imageModification.generationReceiptAvailable, review.imageModification.operation === 'body-improvement')
      }
      assert.equal(review.canonPromotion, false)
      assert.equal(review.final3dPortraitContractSatisfied, false)
      assert.doesNotMatch(JSON.stringify(review), /(?:\/Users\/|\/Volumes\/|CLIPROXY_API_KEY|OPENAI_API_KEY|Authorization|apiKey)/)
    }
    const gender = genders.find(row => row.name === entry.name)
    assert.equal(token.facts.gender, gender.gender)
    assert.equal(token.facts.genderUserLocked, gender.user_locked)
    assert.equal(token.style.portraitShotId, 'medium-close-up-119')
    if (selectedIds.has(entry.personId) && selection.records.find(row => row.personId === entry.personId).operation !== 'register-approved') {
      assert.equal(token.style.styleId, 'owner-gender-reference-20261002')
    }
    for (const key of ['face', 'hair', 'upper']) assert.equal(properties.entries[entry.personId][key], token.artProposal[key])
    assert.doesNotMatch(JSON.stringify(token), /(?:\/Users\/|CLIPROXY_API_KEY|OPENAI_API_KEY|Authorization|apiKey)/)
  }
})
