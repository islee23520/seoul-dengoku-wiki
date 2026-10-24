import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { syncBuiltinESMExports } from 'node:module'
import { DatabaseSync } from 'node:sqlite'
import { buildAdminTerritorialScale, buildAdminTerritorialScaleFromDb } from '../admin-territorial-scale.mjs'
import { readSourceArchive } from './source-archive.mjs'

// Explicit existing full bootstrap, never canonical DB or an invented subset.
const dbPath = process.env.ADMIN_SCALE_DB ?? '/tmp/seoul-document-authority-20261020/bootstrap-portrait-revisions-20261020.sqlite'
const geographyBytes = readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef')
const territorialScale = JSON.parse(readSourceArchive('lore/offices/Offices-and-Ranks.json', '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e')).data.territorialScale
const expected = buildAdminTerritorialScale({ geographyBytes, territorialScale })
const directory = fs.mkdtempSync(resolve(tmpdir(), 'admin-scale-db-'))
const copyPath = resolve(directory, 'scale.sqlite')
fs.copyFileSync(dbPath, copyPath)
const db = new DatabaseSync(copyPath, { readOnly: true })
after(() => { db.close(); fs.rmSync(directory, { recursive: true, force: true }) })
const successor = db.prepare(`SELECT r.parent_revision FROM source_file s
  JOIN document_head h USING(source_id) JOIN document_revision r USING(source_id,revision_id)
  WHERE s.logical_path=?`).get('lore/offices/Offices-and-Ranks.json').parent_revision !== null

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
  const reopened = new DatabaseSync(copyPath, { readOnly: true })
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
  ['unknown revision algorithm', /SELECT s.source_id,s.sha256,r.parent_revision/u, row => ({ ...row, algorithm: 'unknown' }), /E_SCALE_DOCUMENT_REVISION/u],
  ...(!successor ? [
    ['missing review admission', /SELECT a\.\* FROM document_publication_admission/u, () => null, /E_SCALE_DOCUMENT_REVIEW/u],
  ] : [
    ['missing semantic pin', /SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind/u, row => ({ ...row, semantic_sha256: null }), /E_REFERENCE_STALE/u],
    ['wrong semantic pin', /SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind/u, row => ({ ...row, semantic_sha256: '0'.repeat(64) }), /E_REFERENCE_STALE/u],
    ['stale approved head', /SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind/u, row => ({ ...row, revision_id: '0'.repeat(64) }), /E_SCOPE_DB_SOURCE_STALE/u],
    ['missing sealed head', /SELECT s.source_id,s.sha256,d.document_id,d.domain,d.corpus_kind/u, () => null, /E_REFERENCE_AUTHORITY/u],
  ]),
  ['incomplete typed envelope', /SELECT \* FROM text_document_category/u, () => null, successor ? /E_REFERENCE_INTEGRITY/u : /E_SCALE_DOCUMENT_REVIEW/u],
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
