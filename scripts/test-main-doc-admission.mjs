import { afterAll } from 'vitest'
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFile as readDiskFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authenticateMainDocAdmission, MAIN_DOC_ROWS, MAIN_DOC_SOURCES, MAIN_DOC_REGISTRATION, mainDocPreservationReceipt, validateMainDocDocuments, validateMainDocExtraction } from './main-doc-admission-successor.mjs'
import { extractCensusSources, extractCurrentCategories } from './seoul-census.mjs'
import { coverageKey } from './seoul-scope.mjs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'

const inputRoot = new URL('../', import.meta.url).pathname
const { openPublicationDatabaseInputs } = await import('./document-store/publication-database-inputs.mjs')
const inputConfig = JSON.parse(await readDiskFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG ?? new URL('../.omo/private/seoul-migration/sqlite-authority-20261021/publication-config.json', import.meta.url), 'utf8'))
const inputBundle = await openPublicationDatabaseInputs(inputRoot, inputConfig)
const readFile = async (path, encoding) => {
  const absolute = path instanceof URL ? path.pathname : path
  if (!absolute.startsWith(inputRoot + 'lore/') && !String(path).startsWith('lore/')) return readDiskFile(path, encoding)
  const bytes = await inputBundle.inputs.readBytes(absolute.startsWith(inputRoot) ? absolute : new URL('../' + path, import.meta.url).pathname)
  return encoding === 'utf8' ? bytes.toString() : bytes
}
afterAll(() => inputBundle.close())

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const empty = () => ({ leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] })

test('historical reader verifies source and main blob identities and rejects substituted bytes', async () => {
  const reader = path => readFile(path)
  const requests = []
  const captured = new Map()
  reader.readHistorical = async (revision, path, repositoryRoot) => {
    requests.push([revision, path, repositoryRoot])
    const bytes = (await promisify(execFile)('git', ['--no-replace-objects', '-C', repositoryRoot, 'show', `${revision}:${path}`],
      { encoding: 'buffer', maxBuffer: 1024 * 1024 })).stdout
    captured.set(JSON.stringify([revision, path, repositoryRoot]), bytes)
    return bytes
  }
  const admissions = await authenticateMainDocAdmission(root, { files: [] }, reader)
  assert.equal(admissions.length, 5)
  assert.equal(requests.length, 10)
  assert.ok(requests.every(([, , repository]) => repository === root))
  const originalExecFile = childProcess.execFile
  try {
    childProcess.execFile = () => { throw Error('registration subprocess forbidden') }
    syncBuiltinESMExports()
    reader.readHistorical = async (...args) => {
      const bytes = captured.get(JSON.stringify(args))
      assert.ok(bytes, 'uncaptured historical tuple')
      return bytes
    }
    assert.equal((await authenticateMainDocAdmission(root, { files: [] }, reader)).length, 5)
  } finally {
    childProcess.execFile = originalExecFile
    syncBuiltinESMExports()
  }
  reader.readHistorical = async () => Buffer.from('substituted historical blob')
  await assert.rejects(authenticateMainDocAdmission(root, { files: [] }, reader), { code: 'E_REVIEW_HASH' })
  reader.readHistorical = async () => { throw Object.assign(Error('missing historical blob'), { code: 'ENOENT' }) }
  await assert.rejects(authenticateMainDocAdmission(root, { files: [] }, reader), { code: 'ENOENT' })
})

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
