import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { approvedDocuments } from './catalog-admission.mjs'
import { canonicalJson } from './world-atlas-schema.mjs'

// MongoDB holds a derived, read-only copy of the lore JSON corpus. The repository JSON is canon: this script
// reads lore files and writes only to the database, never back to the repository. Build, generate, gate and
// the test groups never import it, so they stay green with no database running.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const defaultDatabase = 'seoul_wiki_derived'
export const defaultCollection = 'lore_documents'
const locales = ['en', 'ko']
const tenses = new Set(['past', 'present'])
// Fields the loader adds beside the envelope. Everything else in a record is the envelope itself.
const recordFields = new Set(['_id', 'derived'])
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

export const sha256 = (text) => createHash('sha256').update(text).digest('hex')
export const canonicalHash = (value) => sha256(canonicalJson(value))

// The derived store is local only: refuse any host that is not the loopback interface.
export function assertLoopback(url) {
  const hosts = url.replace(/^mongodb(?:\+srv)?:\/\//u, '').replace(/^[^@/]*@/u, '').split(/[/?]/u)[0].split(',')
  const remote = hosts.map((host) => host.replace(/:\d+$/u, '')).filter((host) => !loopbackHosts.has(host))
  if (!url.startsWith('mongodb://') || remote.length) throw new Error(`E_MONGO_URL: ${url}: only a mongodb:// URL on 127.0.0.1 is allowed`)
}

// Every published lore authoring document, discovered by the catalog admission code the publisher uses.
export async function corpus(loreRoot = join(root, 'lore')) {
  const documents = await approvedDocuments(loreRoot, { includeWorldIndex: false })
  return Promise.all(documents.map(async ({ source }) => {
    const envelope = JSON.parse(await readFile(join(root, source), 'utf8'))
    return { source, envelope, sha256: canonicalHash(envelope) }
  }))
}

// The record is the envelope plus a `derived` projection: document ID, locales, tense, publication status and
// the legal/consent references when the envelope carries them.
export function projectRecord({ source, envelope, sha256: hash }) {
  for (const field of recordFields) if (field in envelope) throw new Error(`E_ENVELOPE_FIELD: ${source}: envelope already has ${field}`)
  const derived = {
    source,
    sha256: hash,
    locales: locales.filter((locale) => envelope.locales?.[locale]),
    tense: envelope.tense,
    publication: envelope.status,
  }
  for (const field of ['legal', 'consent']) if (field in envelope) derived[field] = envelope[field]
  return { _id: envelope.id, ...envelope, derived }
}

export const envelopeOf = (record) =>
  Object.fromEntries(Object.entries(record).filter(([field]) => !recordFields.has(field)))

function localizedNodes(envelope) {
  const nodes = [...(Array.isArray(envelope.content) ? envelope.content : [])]
  const visit = (value, key) => {
    if (Array.isArray(value)) {
      if (key === 'prose' || key === 'dossier_prose') nodes.push(...value)
      else value.forEach((item) => visit(item))
    } else if (value && typeof value === 'object') Object.entries(value).forEach(([childKey, child]) => visit(child, childKey))
  }
  visit(envelope.data)
  return nodes
}

export function localeFailures(envelope, label) {
  const failures = []
  for (const locale of locales) {
    const entry = envelope.locales?.[locale]
    if (!entry || typeof entry.title !== 'string' || !entry.title.trim()) failures.push(`E_LOCALE: ${label}: locales.${locale}.title is missing`)
  }
  localizedNodes(envelope).forEach((node, index) => {
    const block = node?.anchor ?? `content[${index}]`
    const leaves = node?.kind === 'rule' ? []
      : node?.kind === 'list' ? node.items ?? []
      : node?.kind === 'table' ? [...(node.columns ?? []), ...(node.rows ?? []).flat()]
      : [node?.text]
    for (const leaf of leaves) for (const locale of locales) {
      if (!leaf || typeof leaf !== 'object' || !(locale in leaf)) failures.push(`E_LOCALE: ${label}: ${block} is missing its ${locale} text`)
    }
  })
  return failures
}

export function tenseFailures(envelope, label) {
  const { tense } = envelope
  const values = [tense?.en, tense?.ko, envelope.locales?.en?.tense, envelope.locales?.ko?.tense]
  return values.every((value) => tenses.has(value) && value === values[0]) ? []
    : [`E_TENSE: ${label}: tense.en/ko and locales.en/ko.tense disagree (${values.join(', ')})`]
}

// A record round-trips when the envelope read back from the database serializes to the same canonical
// hash as the repository file, and the derived projection still matches that envelope.
export function recordFailures(record, expected) {
  const label = expected?.source ?? String(record?._id)
  if (!record) return [`E_MISSING: ${label}: no database record`]
  const envelope = envelopeOf(record)
  const failures = [...localeFailures(envelope, label), ...tenseFailures(envelope, label)]
  const hash = canonicalHash(envelope)
  if (hash !== expected.sha256) failures.push(`E_HASH: ${label}: database ${hash} != repository ${expected.sha256}`)
  if (canonicalJson(record.derived) !== canonicalJson(projectRecord({ ...expected, envelope }).derived)) {
    failures.push(`E_PROJECTION: ${label}: derived fields do not match the envelope`)
  }
  return failures
}

export async function connect(url) {
  assertLoopback(url)
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  return client
}

export async function load(collection, documents) {
  const records = documents.map(projectRecord)
  if (new Set(records.map(({ _id }) => _id)).size !== records.length) throw new Error('E_DUPLICATE_ID: two lore documents share a document id')
  if (records.length) {
    await collection.bulkWrite(records.map((record) => ({ replaceOne: { filter: { _id: record._id }, replacement: record, upsert: true } })))
  }
  // Records whose repository document is gone are stale derived data.
  const { deletedCount } = await collection.deleteMany({ _id: { $nin: records.map(({ _id }) => _id) } })
  return { loaded: records.length, deleted: deletedCount }
}

export async function verify(collection, documents) {
  const stored = new Map((await collection.find({}).toArray()).map((record) => [record._id, record]))
  const failures = []
  for (const document of documents) {
    failures.push(...recordFailures(stored.get(document.envelope.id), document))
    stored.delete(document.envelope.id)
  }
  for (const id of stored.keys()) failures.push(`E_EXTRA: ${id}: database record has no repository document`)
  return failures
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = process.argv.includes('--check')
  const url = process.env.MONGO_URL
  if (!url) {
    console.error('Usage: MONGO_URL=mongodb://127.0.0.1:<port> node scripts/mongo-load.mjs [--check]')
    process.exit(2)
  }
  const client = await connect(url).catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
  try {
    const collection = client.db(process.env.MONGO_DB ?? defaultDatabase).collection(defaultCollection)
    const documents = await corpus()
    if (!checkOnly) {
      const { loaded, deleted } = await load(collection, documents)
      console.log(`loaded ${loaded} record(s), removed ${deleted} stale record(s)`)
    }
    const failures = await verify(collection, documents)
    for (const failure of failures) console.error(failure)
    const count = await collection.countDocuments()
    const summary = `${documents.length} repository document(s), ${count} database record(s), ${failures.length} mismatch(es)`
    if (failures.length || count !== documents.length) {
      console.error(`FAIL: ${summary}`)
      process.exitCode = 1
    } else console.log(`OK: ${summary}`)
  } finally {
    await client.close()
  }
}
