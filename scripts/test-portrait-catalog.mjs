import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('portrait properties and immutable images follow the canonical 21-person catalog', async () => {
  const catalog = JSON.parse(await readFile(new URL('../portrait-catalog.json', import.meta.url), 'utf8'))
  const properties = JSON.parse(await readFile(new URL('../portrait-properties.json', import.meta.url), 'utf8'))
  const genders = JSON.parse(await readFile(new URL('../lore/name-pools/gender-cast.json', import.meta.url), 'utf8')).people
  assert.equal(catalog.entries.length, 21)
  assert.equal(new Set(catalog.entries.map(entry => entry.personId)).size, 21)
  assert.equal(catalog.entries.filter(entry => entry.stateId).length, 16)
  assert.deepEqual(Object.keys(properties.entries).sort(), catalog.entries.map(entry => entry.personId).sort())
  for (const entry of catalog.entries) {
    const token = JSON.parse(await readFile(new URL('../public/portrait-tokens/' + entry.personId + '.json', import.meta.url), 'utf8'))
    const detail = JSON.parse(await readFile(new URL('../public/person-details/' + entry.personId + '.json', import.meta.url), 'utf8'))
    const image = await readFile(new URL('../public/portraits/' + entry.personId + '.png', import.meta.url))
    assert.equal(entry.name, detail.name)
    assert.equal(token.personId, detail.id)
    assert.equal(token.characterId, entry.characterId)
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
      assert.equal(review.ownerVerdict.verdict, 'pass')
      assert.equal(review.generationReceipt.imageSha256, token.image.sha256)
      assert.deepEqual(review.generationRequest, review.generationReceipt.request)
      assert.equal(review.canonPromotion, false)
      assert.equal(review.final3dPortraitContractSatisfied, false)
      assert.doesNotMatch(JSON.stringify(review), /(?:\/Users\/|\/Volumes\/|CLIPROXY_API_KEY|OPENAI_API_KEY|Authorization|apiKey)/)
    }
    const gender = genders.find(row => row.name === entry.name)
    assert.equal(token.facts.gender, gender.gender)
    assert.equal(token.facts.genderUserLocked, gender.user_locked)
    assert.equal(token.style.portraitShotId, 'medium-close-up-119')
    for (const key of ['face', 'hair', 'upper']) assert.equal(properties.entries[entry.personId][key], token.artProposal[key])
    assert.doesNotMatch(JSON.stringify(token), /(?:\/Users\/|CLIPROXY_API_KEY|OPENAI_API_KEY|Authorization|apiKey)/)
  }
})
