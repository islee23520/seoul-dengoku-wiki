import assert from 'node:assert/strict'
import { readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'vitest'
import { initializePortraitStore, readPortraitDocuments, readPortraitArchive, readPortraitRevision } from './cast-sqlite/portrait-store.mjs'
import { registerApprovedPortraits, applyApprovedPortraitSelection } from './apply-approved-portrait-selection.mjs'
import { publicPortraitSelection } from './portrait-public-boundary.mjs'

// Exercise the existing complete producer fixtures, not a second weaker verifier.
const fixtureSource = (await readFile(new URL('./test-apply-approved-portrait-selection.mjs', import.meta.url), 'utf8'))
  .replace("import { test } from 'vitest'", 'const test = () => {}')
  .replace("'./portrait-public-boundary.mjs'", JSON.stringify(new URL('./portrait-public-boundary.mjs', import.meta.url).href))
  .replace("'./apply-approved-portrait-selection.mjs'", JSON.stringify(new URL('./apply-approved-portrait-selection.mjs', import.meta.url).href))
  .replace("const scratchRoot = fileURLToPath(new URL('../.omo/evidence/portrait-pr478-application-tests/', import.meta.url))", `const scratchRoot = ${JSON.stringify(new URL('../.omo/evidence/portrait-db-tests/', import.meta.url).pathname)}`)
const { fixture, registrationFixture } = await import('data:text/javascript;base64,' + Buffer.from(fixtureSource + '\nexport { fixture, registrationFixture }').toString('base64'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const names = { catalog: 'portrait-catalog.json', properties: 'portrait-properties.json', selection: 'portrait-approved-selection.json' }
async function prepared(operation) {
  const f = await (operation === 'registration' ? registrationFixture() : fixture())
  const selection = JSON.parse(await readFile(join(f.wiki, names.selection)))
  Object.assign(selection, { schemaVersion: 1, canonPromotion: false, final3dPortraitContractSatisfied: false, previousVerdictsPreserved: true })
  const catalog = JSON.parse(await readFile(join(f.wiki, names.catalog)))
  Object.assign(catalog, { schemaVersion: 1, status: 'art-proposal', styleSource: 'fixture-style' })
  catalog.entries = catalog.entries.map(c => ({ ...c, stateId: null, approval: 'art-proposal' }))
  const properties = { schemaVersion: 1, status: 'art-proposal', entries: Object.fromEntries(catalog.entries.map(c => [c.personId, { face: 'face', hair: 'hair', upper: 'coat' }])) }
  const current = publicPortraitSelection({ ...selection, status: 'approved-selection-applied-to-worktree', records: selection.records.map(s => ({ ...s, imageSha256: s.previousImageSha256, operation: 'preserve-existing' })) })
  const docs = { catalog, properties, selection: current }
  for (const [k, v] of Object.entries(docs)) await writeFile(join(f.wiki, names[k]), JSON.stringify(v))
  return { ...f, docs, selection, sourcePath: operation === 'registration' ? f.registrationPath : f.manifestPath }
}
function database(f) {
  const db = new DatabaseSync(join(f.root, 'portraits.sqlite'))
  db.exec('PRAGMA foreign_keys=ON')
  initializePortraitStore(db, Object.fromEntries(Object.entries(f.docs).map(([kind, d]) => {
    const bytes = Buffer.from(JSON.stringify(d))
    return [kind, { bytes, expectedSha256: hash(bytes), actor: 'fixture', reason: 'import fixture' }]
  })))
  return db
}
const invoke = (operation, f, options) => (operation === 'registration' ? registerApprovedPortraits : applyApprovedPortraitSelection)(f.sourcePath, f.wiki, options)
const options = (db, f) => ({ db, expectedRevision: 1, selection: f.selection, actor: 'fixture-owner', reason: 'verified exact fixture evidence' })
async function publicFiles(f) {
  const files = {}
  for (const directory of ['portraits', 'portrait-tokens', 'portrait-reviews']) for (const name of await readdir(join(f.wiki, 'public', directory))) files[directory + '/' + name] = (await readFile(join(f.wiki, 'public', directory, name))).toString('base64')
  return files
}

for (const operation of ['registration', 'replacement']) {
  test(`DB ${operation} matches filesystem producer without authored JSON IO and preserves immutable typed history`, async () => {
    const f = await prepared(operation), fs = await prepared(operation), db = database(f)
    try {
      const archives = Object.fromEntries(Object.keys(names).map(k => [k, readPortraitArchive(db, k)]))
      if (operation === 'replacement') await writeFile(join(fs.wiki, names.selection), JSON.stringify(fs.selection))
      const count = await invoke(operation, fs)
      const expected = Object.fromEntries(await Promise.all(Object.entries(names).map(async ([k, name]) => [k, JSON.parse(await readFile(join(fs.wiki, name)))])))
      for (const name of Object.values(names)) await rm(join(f.wiki, name))
      assert.equal(await invoke(operation, f, options(db, f)), count)
      assert.deepEqual(readPortraitDocuments(db), expected)
      assert.deepEqual(await publicFiles(f), await publicFiles(fs))
      for (const [k, a] of Object.entries(archives)) assert.deepEqual(readPortraitArchive(db, k), a)
      for (const name of Object.values(names)) await assert.rejects(readFile(join(f.wiki, name)), { code: 'ENOENT' })
      const other = new DatabaseSync(join(f.root, 'portraits.sqlite'))
      try {
        assert.deepEqual(readPortraitDocuments(other), expected)
        assert.deepEqual(readPortraitRevision(other, 1), f.docs)
        assert.deepEqual(readPortraitRevision(other, 2), expected)
        assert.throws(() => readPortraitRevision(other, 3), { code: 'E_PORTRAIT_REVISION' })
        assert.equal(other.prepare('SELECT count(*) AS n FROM portrait_revision').get().n, 2)
        assert.equal(other.prepare('SELECT count(*) AS n FROM portrait_catalog_history WHERE revision=1').get().n, f.docs.catalog.entries.length)
        assert.equal(other.prepare('SELECT count(*) AS n FROM portrait_catalog_history WHERE revision=2').get().n, expected.catalog.entries.length)
        for (const table of ['portrait_revision', 'portrait_revision_evidence', 'portrait_catalog_history', 'portrait_archive']) assert.throws(() => other.exec(`DELETE FROM ${table}`), /E_PORTRAIT_READ_ONLY/)
      } finally { other.close() }
      for (const row of expected.selection.records) assert.equal(row.imageSha256, expected.catalog.entries.find(c => c.personId === row.personId).imageSha256)
    } finally { db.close(); await rm(f.root, { recursive: true, force: true }); await rm(fs.root, { recursive: true, force: true }) }
  })

  test(`DB ${operation} rejects approval/hash failures and rolls back owned assets on commit failure`, async () => {
    const f = await prepared(operation), db = database(f)
    try {
      const before = await publicFiles(f), docs = readPortraitDocuments(db)
      if (operation === 'registration') {
        f.approval.selectedImageSHA = '0'.repeat(64)
        await writeFile(join(f.source, 'approval.json'), JSON.stringify(f.approval))
      } else {
        f.manifest[0].sha256 = '0'.repeat(64)
        await writeFile(f.manifestPath, JSON.stringify(f.manifest))
      }
      await assert.rejects(invoke(operation, f, options(db, f)))
      assert.deepEqual(readPortraitDocuments(db), docs)
      assert.deepEqual(await publicFiles(f), before)
      if (operation === 'registration') {
        f.approval.selectedImageSHA = f.row.imageSHA
        await writeFile(join(f.source, 'approval.json'), JSON.stringify(f.approval))
      } else {
        f.manifest[0].sha256 = f.rows.find(r => r.personId === f.manifest[0].personId).imageSha256
        await writeFile(f.manifestPath, JSON.stringify(f.manifest))
      }
      const exec = db.exec.bind(db)
      db.exec = sql => { if (sql === 'COMMIT') throw new Error('fixture commit failure'); return exec(sql) }
      await assert.rejects(invoke(operation, f, options(db, f)), /fixture commit failure/)
      db.exec = exec
      assert.deepEqual(readPortraitDocuments(db), docs)
      assert.deepEqual(await publicFiles(f), before)
      assert.equal(db.prepare('SELECT count(*) AS n FROM portrait_revision').get().n, 1)
      await assert.rejects(invoke(operation, f, { ...options(db, f), expectedRevision: 0 }), /E_PORTRAIT_REVISION/)
      assert.deepEqual(await publicFiles(f), before)
    } finally { db.close(); await rm(f.root, { recursive: true, force: true }) }
  })
}

test('concurrent verified DB plans use revision CAS; stale plan publishes no extra history', async () => {
  const f = await prepared('replacement'), db = database(f)
  const second = new DatabaseSync(join(f.root, 'portraits.sqlite')); second.exec('PRAGMA foreign_keys=ON')
  try {
    const results = await Promise.allSettled([invoke('replacement', f, options(db, f)), invoke('replacement', f, options(second, f))])
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
    assert.match(results.find(r => r.status === 'rejected').reason.message, /E_PORTRAIT_REVISION/)
    assert.equal(db.prepare('SELECT count(*) AS n FROM portrait_revision').get().n, 2)
    assert.equal(db.prepare('SELECT revision FROM portrait_seal').get().revision, 2)
    for (const row of readPortraitDocuments(db).selection.records) assert.equal(hash(await readFile(join(f.wiki, 'public/portraits', row.personId + '.png'))), row.imageSha256)
  } finally { second.close(); db.close(); await rm(f.root, { recursive: true, force: true }) }
})
