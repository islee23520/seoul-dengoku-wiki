import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authenticateNationalDressAdmission, NATIONAL_DRESS_PATH, NATIONAL_DRESS_DIRECTORY, NATIONAL_DRESS_ROW, NATIONAL_DRESS_SHA256, validateNationalDressDocuments, validateNationalDressExtraction } from './national-dress-admission-successor.mjs'
import { walkCensus } from './seoul-census.mjs'
import { coverageKey } from './seoul-scope.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseline = { files: [] }
const empty = () => ({ leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] })

test('exact excluded source counts every current key and no original keys', async () => {
  const admission = await authenticateNationalDressAdmission(root, baseline)
  const { leaves, blocks } = walkCensus(admission.source.value, NATIONAL_DRESS_PATH)
  validateNationalDressExtraction(admission, { ...empty(), leaves, blocks }, empty(), coverageKey)
  assert.equal(leaves.length, 119)
  assert.equal(blocks.length, 20)
  assert.equal(admission.review.currentKeys.length, 139)
  assert.equal(admission.review.originalKeys.length, 0)
  assert.equal(admission.authority.publicPublicationApproval, null)
  assert.equal(admission.row.status, 'excluded')
  assert.equal(admission.source.value.status, 'draft')
})

for (const target of [NATIONAL_DRESS_PATH, NATIONAL_DRESS_DIRECTORY + 'manifest.json', NATIONAL_DRESS_DIRECTORY + 'review.json', NATIONAL_DRESS_DIRECTORY + 'authority.json', NATIONAL_DRESS_DIRECTORY + 'dependencies.json']) {
  test(`tampered ${target} denies admission`, async () => {
    const reader = async path => Buffer.concat([await readFile(path), resolve(path) === resolve(root, target) ? Buffer.from(' ') : Buffer.alloc(0)])
    await assert.rejects(authenticateNationalDressAdmission(root, baseline, reader), { code: 'E_REVIEW_HASH' })
  })
  test(`missing ${target} denies admission`, async () => {
    const reader = async path => {
      if (resolve(path) === resolve(root, target)) throw Object.assign(new Error('missing'), { code: 'ENOENT' })
      return readFile(path)
    }
    await assert.rejects(authenticateNationalDressAdmission(root, baseline, reader), { code: 'ENOENT' })
  })
}

test('duplicate, extra, altered and baseline-occupied registrations deny', async () => {
  const hashes = { [NATIONAL_DRESS_PATH]: NATIONAL_DRESS_SHA256 }
  assert.deepEqual(validateNationalDressDocuments([NATIONAL_DRESS_ROW], hashes), [NATIONAL_DRESS_ROW])
  for (const rows of [[NATIONAL_DRESS_ROW, NATIONAL_DRESS_ROW], [{ ...NATIONAL_DRESS_ROW, sourcePath: 'lore/culture/Extra.json' }], [{ ...NATIONAL_DRESS_ROW, status: 'active' }]])
    assert.throws(() => validateNationalDressDocuments(rows, hashes), { code: 'E_REVIEW_HASH' })
  assert.throws(() => validateNationalDressDocuments([NATIONAL_DRESS_ROW], hashes, [NATIONAL_DRESS_PATH]), { code: 'E_REVIEW_HASH' })
  await assert.rejects(authenticateNationalDressAdmission(root, { files: [{ path: NATIONAL_DRESS_PATH }] }), { code: 'E_REVIEW_HASH' })
})

test('missing current leaf and fabricated original key deny coverage', async () => {
  const admission = await authenticateNationalDressAdmission(root, baseline)
  const { leaves, blocks } = walkCensus(admission.source.value, NATIONAL_DRESS_PATH)
  assert.throws(() => validateNationalDressExtraction(admission, { ...empty(), leaves: leaves.slice(1), blocks }, empty(), coverageKey), { code: 'E_REVIEW_HASH' })
  assert.throws(() => validateNationalDressExtraction(admission, { ...empty(), leaves, blocks }, { ...empty(), leaves: leaves.slice(0, 1) }, coverageKey), { code: 'E_REVIEW_HASH' })
})
