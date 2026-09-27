import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'
import {
  assertLoopback, canonicalHash, connect, corpus, defaultCollection, envelopeOf, load, projectRecord, recordFailures, verify,
} from './mongo-load.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const documents = await corpus()
const clone = (value) => JSON.parse(JSON.stringify(value))
const codes = (failures) => failures.map((failure) => failure.split(':')[0])

test('every published lore document projects to a record whose envelope hashes back to the repository file', () => {
  assert.ok(documents.length > 0)
  assert.equal(new Set(documents.map(({ envelope }) => envelope.id)).size, documents.length)
  for (const document of documents) {
    const record = clone(projectRecord(document))
    assert.equal(record._id, document.envelope.id)
    assert.equal(canonicalHash(envelopeOf(record)), document.sha256)
    assert.deepEqual(recordFailures(record, document), [], document.source)
  }
})

test('a locale gap, a tense mismatch or an edited record fails the round-trip check', () => {
  const document = documents.find(({ envelope }) => envelope.content.some((node) => node.kind === 'paragraph'))
  const record = () => clone(projectRecord(document))

  const gap = record()
  delete gap.content.find((node) => node.kind === 'paragraph').text.ko
  assert.ok(codes(recordFailures(gap, document)).includes('E_LOCALE'))

  const title = record()
  delete title.locales.ko
  assert.ok(codes(recordFailures(title, document)).includes('E_LOCALE'))

  const tense = record()
  tense.locales.ko.tense = tense.tense.en === 'past' ? 'present' : 'past'
  assert.ok(codes(recordFailures(tense, document)).includes('E_TENSE'))

  const edited = record()
  edited.status = edited.status === 'approved' ? 'draft' : 'approved'
  assert.deepEqual(codes(recordFailures(edited, document)), ['E_HASH', 'E_PROJECTION'])

  const projection = record()
  projection.derived.publication = 'excluded'
  assert.deepEqual(codes(recordFailures(projection, document)), ['E_PROJECTION'])

  assert.deepEqual(codes(recordFailures(undefined, document)), ['E_MISSING'])
})

test('the derived store accepts only a loopback mongodb:// URL', () => {
  for (const url of ['mongodb://127.0.0.1:27017', 'mongodb://localhost:27018/db', 'mongodb://user:pw@127.0.0.1:27017/?authSource=admin', 'mongodb://[::1]:27017']) {
    assert.doesNotThrow(() => assertLoopback(url), url)
  }
  for (const url of ['mongodb://10.0.0.5:27017', 'mongodb://db.example.com', 'mongodb+srv://cluster.example.com', 'mongodb://127.0.0.1:27017,10.0.0.5:27017']) {
    assert.throws(() => assertLoopback(url), /E_MONGO_URL/u, url)
  }
})

test('there is no database-to-repository write path and no build step depends on MongoDB', () => {
  const loader = readFileSync(join(wikiRoot, 'scripts/mongo-load.mjs'), 'utf8')
  assert.doesNotMatch(loader, /\b(?:writeFile|appendFile|createWriteStream|mkdir|rename|copyFile|unlink|rmSync|rm)\b/u)
  const sources = [
    ...readdirSync(join(wikiRoot, 'scripts')).filter((name) => /\.(?:mjs|js|ts)$/u.test(name)).map((name) => `scripts/${name}`),
    ...readdirSync(join(wikiRoot, 'src'), { recursive: true }).filter((name) => /\.(?:mjs|js|ts|tsx)$/u.test(name)).map((name) => `src/${name}`),
  ]
  const importers = sources.filter((path) => /(?:from\s+|import\()\s*['"](?:mongodb|\.\/mongo-load\.mjs)['"]/u.test(readFileSync(join(wikiRoot, path), 'utf8')))
  assert.deepEqual(importers.sort(), ['scripts/mongo-load.mjs', 'scripts/test-mongo-load.mjs'])
  const scripts = JSON.parse(readFileSync(join(wikiRoot, 'package.json'), 'utf8')).scripts
  const users = Object.entries(scripts).filter(([, command]) => command.includes('mongo-load')).map(([name]) => name)
  assert.deepEqual(users.sort(), ['db:load', 'test:mongo-load'])
})

test('MongoDB round trip is 100% hash-identical (runs only when MONGO_URL is set; skipped otherwise)', { skip: !process.env.MONGO_URL && 'MONGO_URL is not set' }, async () => {
  const client = await connect(process.env.MONGO_URL)
  const db = client.db(`seoul_wiki_derived_test_${process.pid}`)
  try {
    const collection = db.collection(defaultCollection)
    assert.deepEqual(await load(collection, documents), { loaded: documents.length, deleted: 0 })
    assert.equal(await collection.countDocuments(), documents.length)
    assert.deepEqual(await verify(collection, documents), [])

    const target = documents[0].envelope.id
    await collection.updateOne({ _id: target }, { $set: { 'locales.ko.summary': 'edited in the database' } })
    assert.deepEqual(codes(await verify(collection, documents)), ['E_HASH'])
    await collection.updateOne({ _id: target }, { $unset: { 'locales.ko': '' } })
    assert.ok(codes(await verify(collection, documents)).includes('E_LOCALE'))
    await collection.insertOne({ _id: 'DOC:Not-In-Repository' })
    assert.ok(codes(await verify(collection, documents)).includes('E_EXTRA'))

    assert.deepEqual(await load(collection, documents), { loaded: documents.length, deleted: 1 })
    assert.deepEqual(await verify(collection, documents), [])
  } finally {
    await db.dropDatabase()
    await client.close()
  }
})
