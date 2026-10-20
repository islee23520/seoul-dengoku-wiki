import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authenticateMainDocAdmission, MAIN_DOC_ROWS, MAIN_DOC_SOURCES, MAIN_DOC_REGISTRATION, mainDocPreservationReceipt, validateMainDocDocuments, validateMainDocExtraction } from './main-doc-admission-successor.mjs'
import { extractCensusSources, extractCurrentCategories } from './seoul-census.mjs'
import { coverageKey } from './seoul-scope.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const empty = () => ({ leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] })

test('closed operational documents retain all exact physical lines without original keys or approval', async () => {
  const admissions = await authenticateMainDocAdmission(root, { files: [] })
  const sources = await extractCensusSources({ files: [] }, path => readFile(resolve(root, path)), [], admissions)
  const current = extractCurrentCategories(sources, empty())
  assert.equal(admissions.length, 5)
  assert.equal(current.lines.length, 455)
  for (const admission of admissions) {
    validateMainDocExtraction(admission, current, empty(), coverageKey)
    assert.equal(admission.row.status, 'excluded')
    assert.equal(admission.row.reviewReceipt, null)
    assert.equal(admission.registration.ownerApproval, null)
    assert.equal(admission.registration.publicationEligible, false)
    assert.equal(mainDocPreservationReceipt(admission).disposition, 'preserved')
    assert.throws(() => validateMainDocExtraction(admission, { ...current, lines: current.lines.filter(row => row.sourcePath !== admission.row.sourcePath) }, empty(), coverageKey), { code: 'E_REVIEW_HASH' })
    assert.throws(() => validateMainDocExtraction(admission, current, { ...empty(), lines: current.lines.filter(row => row.sourcePath === admission.row.sourcePath).slice(0, 1) }, coverageKey), { code: 'E_REVIEW_HASH' })
  }
})

for (const target of [...MAIN_DOC_ROWS.map(row => row.sourcePath), MAIN_DOC_REGISTRATION, '.omo/private/seoul-migration/main-doc-admission-20261020/overlay.json', '.omo/private/seoul-migration/national-dress-admission-20261020/dependencies.json']) {
  test(`tampered or missing ${target} denies registration`, async () => {
    const reader = async path => Buffer.concat([await readFile(path), resolve(path) === resolve(root, target) ? Buffer.from(' ') : Buffer.alloc(0)])
    await assert.rejects(authenticateMainDocAdmission(root, { files: [] }, reader), { code: 'E_REVIEW_HASH' })
    const missing = async path => {
      if (resolve(path) === resolve(root, target)) throw Object.assign(new Error('missing'), { code: 'ENOENT' })
      return readFile(path)
    }
    await assert.rejects(authenticateMainDocAdmission(root, { files: [] }, missing), { code: 'ENOENT' })
  })
}

test('extra, duplicate, active, baseline-occupied and forged registrations fail closed', async () => {
  const hashes = Object.fromEntries(MAIN_DOC_SOURCES.map(pin => [pin.sourcePath, pin.sha256]))
  assert.deepEqual(validateMainDocDocuments(MAIN_DOC_ROWS, hashes), MAIN_DOC_ROWS)
  for (const rows of [[MAIN_DOC_ROWS[0], MAIN_DOC_ROWS[0]], [{ ...MAIN_DOC_ROWS[0], sourcePath: 'docs/extra.md' }], [{ ...MAIN_DOC_ROWS[0], status: 'active' }]])
    assert.throws(() => validateMainDocDocuments(rows, hashes), { code: 'E_REVIEW_HASH' })
  assert.throws(() => validateMainDocDocuments(MAIN_DOC_ROWS, hashes, [MAIN_DOC_ROWS[0].sourcePath]), { code: 'E_REVIEW_HASH' })
  assert.throws(() => mainDocPreservationReceipt({ row: MAIN_DOC_ROWS[0] }), { code: 'E_REVIEW_HASH' })
  await assert.rejects(authenticateMainDocAdmission(root, { files: [{ path: MAIN_DOC_ROWS[0].sourcePath }] }), { code: 'E_REVIEW_HASH' })
})
