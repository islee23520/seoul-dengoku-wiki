import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { DatabaseSync } from 'node:sqlite'
import { buildAdminTerritorialScale, buildAdminTerritorialScaleFromDb } from '../admin-territorial-scale.mjs'
import { readSourceArchive } from './source-archive.mjs'

// Explicit existing full bootstrap, never canonical DB or an invented subset.
const dbPath = process.env.ADMIN_SCALE_DB ?? '/tmp/seoul-document-authority-20261020/bootstrap-portrait-revisions-20261020.sqlite'
const geographyBytes = readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef')
const territorialScale = JSON.parse(readSourceArchive('lore/offices/Offices-and-Ranks.json', '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e')).data.territorialScale
const expected = buildAdminTerritorialScale({ geographyBytes, territorialScale })
const db = new DatabaseSync(dbPath, { readOnly: true })
after(() => db.close())

function typedOnly(mutate = (_sql, row) => row) {
  return { prepare(sql) {
    assert.match(sql, /^SELECT /u)
    assert.doesNotMatch(sql, /\b(?:raw_bytes|source_record|geography_archive|json_extract|json_tree|json_each)\b/iu)
    if (/\bsource_file\b/iu.test(sql)) assert.doesNotMatch(sql, /SELECT\s+(?:\*|s\.\*)/iu)
    const statement = db.prepare(sql)
    return {
      all: (...args) => statement.all(...args).map(row => mutate(sql, { ...row })).filter(Boolean),
      get: (...args) => {
        const row = statement.get(...args)
        return row === undefined ? row : mutate(sql, { ...row })
      },
    }
  } }
}

test('actual 1022-person / 99-document integrated DB matches the entire source API output', () => {
  assert.equal(db.prepare('SELECT count(*) n FROM text_document').get().n, 99)
  assert.equal(db.prepare('SELECT count(*) n FROM gurps_profile').get().n, 1022)
  assert.deepEqual(buildAdminTerritorialScaleFromDb(typedOnly()), expected)
  assert.equal(JSON.stringify(buildAdminTerritorialScaleFromDb(typedOnly())), JSON.stringify(expected))
  assert.equal(expected.titles.length, 80)
  assert.equal(expected.slotEditions.dated.rows.length, 426)
  assert.equal(expected.slotEditions.currentCorrespondence.rows.length, 427)
})

test('read-only reopen works with all source reads, filesystem discovery and JSON.parse blocked', () => {
  const reopened = new DatabaseSync(dbPath, { readOnly: true })
  const saved = { readFileSync: fs.readFileSync, readFile: fs.readFile, readdir: fs.readdir,
    readdirSync: fs.readdirSync, promiseRead: fsp.readFile, promiseReaddir: fsp.readdir, parse: JSON.parse }
  const deny = () => { throw new Error('E_SOURCE_READ_FORBIDDEN') }
  try {
    fs.readFileSync = deny; fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\b(?:raw_bytes|source_record|geography_archive|json_extract|json_tree|json_each)\b/iu)
      return reopened.prepare(sql)
    } }
    assert.deepEqual(buildAdminTerritorialScaleFromDb(guarded), expected)
  } finally {
    fs.readFileSync = saved.readFileSync; fs.readFile = saved.readFile
    fs.readdir = saved.readdir; fs.readdirSync = saved.readdirSync
    fsp.readFile = saved.promiseRead; fsp.readdir = saved.promiseReaddir
    syncBuiltinESMExports(); JSON.parse = saved.parse; reopened.close()
  }
})

// Inject changed typed SQL results, without writing shared immutable authority.
for (const [name, pattern, change, error] of [
  ['geography byte pin', /SELECT source_id,sha256 FROM source_file/u, row => ({ ...row, sha256: '0'.repeat(64) }), /E_GEOGRAPHY_HASH/u],
  ['Offices byte pin', /SELECT s.source_id,s.sha256,r.parent_revision/u, row => ({ ...row, sha256: '0'.repeat(64) }), /E_SCALE_DOCUMENT_SOURCE/u],
  ['later Offices revision', /SELECT s.source_id,s.sha256,r.parent_revision/u, row => ({ ...row, parent_revision: '0'.repeat(64) }), /E_SCALE_DOCUMENT_REVISION/u],
  ['missing review admission', /SELECT a\.\* FROM document_publication_admission/u, () => null, /E_SCALE_DOCUMENT_REVIEW/u],
  ['incomplete typed envelope', /SELECT \* FROM text_document_category/u, () => null, /E_SCALE_DOCUMENT_REVIEW/u],
  ['missing key order', /SELECT \* FROM document_key_order/u, () => null, /E_DOCUMENT_KEY_ORDER/u],
  ['kingdom partition mutation', /SELECT \* FROM geography_partition ORDER/u, row => ({ ...row, name: 'changed' }), /E_KINGDOM_PARTITION/u],
  ['geographic parent mutation', /SELECT \* FROM geography_title ORDER/u, row => row.rank === 'duchy' ? { ...row, feudalParentTitleId: 'missing' } : row, /E_TITLE_PARENT/u],
  ['slot edition mutation', /SELECT \* FROM geography_slot WHERE/u, row => ({ ...row, sourceEdition: 'changed' }), /E_SLOT_EDITION/u],
  ['slot correspondence omission', /SELECT \* FROM geography_slot_correspondence/u, () => null, /E_SLOT_CORRESPONDENCE/u],
]) {
  test(`rejects ${name}`, () => {
    let changed = false
    const guarded = typedOnly((sql, row) => {
      if (!pattern.test(sql)) return row
      changed = true
      return change(row)
    })
    assert.throws(() => buildAdminTerritorialScaleFromDb(guarded), error)
    assert.equal(changed, true, 'mutation must reach the reader')
  })
}

test('byte API retains its exact source hash rejection', () => {
  assert.throws(() => buildAdminTerritorialScale({ geographyBytes: Buffer.concat([geographyBytes, Buffer.from(' ')]), territorialScale }), /E_GEOGRAPHY_HASH/u)
})
