import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { assertBaselineIdentity, assertCapturedSourcesUnchanged, capturePaths, reserveCaptureDirectory } from './capture-person-details.mjs'
import { projectPersonStateInputs, produceFromPersonDetailSources } from './person-detail-inputs.mjs'
import { renderLoreMarkdown } from './lore-json-render.mjs'

test('private output paths are fixed beneath the repository private capture root', () => {
  const root = '/repository'
  assert.deepEqual(capturePaths(root), {
    privateRoot: '/repository/.omo/private/seoul-migration/person-detail-private-capture-20261015',
    snapshot: '/repository/.omo/private/seoul-migration/person-detail-private-capture-20261015/full-snapshot.json',
    manifest: '/repository/.omo/private/seoul-migration/person-detail-private-capture-20261015/source-hashes.json',
  })
  const next = capturePaths(root, '.omo/private/seoul-migration/person-detail-private-capture-79-20261016')
  assert.deepEqual(next, {
    privateRoot: '/repository/.omo/private/seoul-migration/person-detail-private-capture-79-20261016',
    snapshot: '/repository/.omo/private/seoul-migration/person-detail-private-capture-79-20261016/full-snapshot.json',
    manifest: '/repository/.omo/private/seoul-migration/person-detail-private-capture-79-20261016/source-hashes.json',
  })
  for (const invalid of ['../elsewhere', '.omo/private/seoul-migration',
    '.omo/private/seoul-migration/old/capture', '.omo/private/seoul-migration/../capture']) {
    assert.throws(() => capturePaths(root, invalid), /E_PERSON_CAPTURE_OUTPUT_DIR/)
  }
})

test('capture reserves a fresh private directory and refuses to overwrite any existing evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'person-capture-'))
  try {
    const paths = capturePaths(root, '.omo/private/seoul-migration/person-detail-private-capture-79-20261016')
    await assert.rejects(reserveCaptureDirectory(paths), { code: 'ENOENT' })
    const { mkdir, writeFile } = await import('node:fs/promises')
    await mkdir(join(root, '.omo/private/seoul-migration'), { recursive: true })
    await reserveCaptureDirectory(paths)
    await writeFile(paths.snapshot, 'preserved evidence')
    await assert.rejects(reserveCaptureDirectory(paths), /E_PERSON_CAPTURE_OUTPUT_EXISTS/)
    assert.equal(await readFile(paths.snapshot, 'utf8'), 'preserved evidence')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('captured raw inputs and immutable baseline reject a changed byte before writing', async () => {
  const sha256 = value => createHash('sha256').update(value).digest('hex')
  const rows = [{ path: 'lore/example.json', sha256: sha256('original'), bytes: 8 }]
  const baselinePath = '/repository/baseline.json'
  const read = async path => path === baselinePath ? Buffer.from('baseline') : Buffer.from('original')
  await assert.doesNotReject(assertCapturedSourcesUnchanged('/repository', rows, baselinePath, sha256('baseline'), read))
  await assert.rejects(assertCapturedSourcesUnchanged('/repository', rows, baselinePath, sha256('old'), read), /E_PERSON_CAPTURE_SOURCE_DRIFT:baseline/)
  await assert.rejects(assertCapturedSourcesUnchanged('/repository', rows, baselinePath, sha256('baseline'), async path =>
    path === baselinePath ? Buffer.from('baseline') : Buffer.from('modified')), /E_PERSON_CAPTURE_SOURCE_DRIFT:lore\/example.json/)
  await assert.rejects(assertCapturedSourcesUnchanged('/repository', [{ ...rows[0], path: '../public/example.json' }], baselinePath, sha256('baseline'), read), /E_PERSON_CAPTURE_SOURCE_DRIFT/)
})

test('capture refuses missing, duplicate, and substituted issued or public IDs', () => {
  const ids = Array.from({ length: 1022 }, (_, index) => `K${String(index + 1).padStart(3, '0')}`)
  const rows = ids.map((characterId, index) => ({ characterId, id: `person-${String(index + 1).padStart(4, '0')}` }))
  assert.doesNotThrow(() => assertBaselineIdentity(rows, ids, rows))
  for (const changed of [rows.slice(1), rows.map((row, index) => index === 1 ? rows[0] : row),
    rows.map((row, index) => index === 1 ? { ...row, characterId: 'K9999' } : row),
    rows.map((row, index) => index === 1 ? { ...row, id: 'person-0001' } : row)]) {
    assert.throws(() => assertBaselineIdentity(changed, ids, rows), /E_PERSON_CAPTURE_(?:IDENTITY|PUBLIC_IDENTITY)/)
  }
  const swapped = rows.map((row, index) => index < 2 ? { ...row, characterId: rows[1 - index].characterId } : row)
  assert.throws(() => assertBaselineIdentity(swapped, ids, rows), /E_PERSON_CAPTURE_IDENTITY_BINDING/)
  assert.doesNotThrow(() => assertBaselineIdentity([...rows].reverse(), ids, rows))
  assert.doesNotThrow(() => assertBaselineIdentity(swapped, ids, swapped))
  assert.throws(() => assertBaselineIdentity(rows, ids, rows.slice(1)), /E_PERSON_CAPTURE_BASELINE/)
})

test('shared state and office projection reads the current raw lore sources', async () => {
  const source = async path => JSON.parse(await readFile(new URL(`../lore/${path}`, import.meta.url), 'utf8'))
  const statePage = await source('factions/Sixteen-States.json')
  const pages = new Map([['Sixteen-States', { value: statePage }]])
  const rendered = new Map([['Sixteen-States', renderLoreMarkdown(statePage, 'ko')],
    ['Offices-and-Ranks', renderLoreMarkdown(await source('offices/Offices-and-Ranks.json'), 'ko')],
    ['Core-Characters', renderLoreMarkdown(await source('characters/Core-Characters.json'), 'ko')]])
  const state = projectPersonStateInputs(rendered, pages)
  assert.equal((await source('name-pools/values-cast.json')).people.length, 1022)
  assert.equal(state.stateCatalog.length, 16)
  assert.equal(state.tiersByState.size, 16)
  assert.equal(typeof produceFromPersonDetailSources, 'function')
})
