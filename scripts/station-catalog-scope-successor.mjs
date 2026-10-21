import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { STATION_CATALOG_PATH, loadStationCatalogGeography } from './station-catalog-geography.mjs'

export const STATION_RECEIPT = '.omo/private/seoul-migration/station-catalog-scope-successor-20261019/receipt.json'
export const STATION_BEFORE = '10282010aaccd25a384b46e989d264f7b44a1e2342f1fa613e3fec914eb810ff'
export const STATION_AFTER = '71caa21802d5acff268c6fc051f84950ba0e4bc34b870de071d924e7dfccdc56'
const receiptSha256 = '47a36070a3b8b7916fa35ec6404fa061af1c566fc4ce92c57bbc39816e65fd78'
const hash = value => createHash('sha256').update(value).digest('hex')
const check = (condition, path) => { if (!condition) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path }) }

// Preserve immutable receipts by reconstructing their exact predecessor in memory.
// The new receipt explicitly supersedes the old erroneous geographic conclusion.
export async function authenticateStationCatalogSuccessor(root, reader = readFile) {
  const databasePath = process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite')
  const raw = await reader(resolve(root, STATION_RECEIPT))
  check(hash(raw) === receiptSha256, STATION_RECEIPT)
  const receipt = JSON.parse(raw)
  const current = reader === readFile ? readSourceArchive(STATION_CATALOG_PATH, STATION_AFTER, databasePath)
    : Buffer.from(await reader(resolve(root, STATION_CATALOG_PATH)))
  check(hash(current) === STATION_AFTER && receipt.beforeSha256 === STATION_BEFORE
    && receipt.afterSha256 === STATION_AFTER && receipt.edits.length === 12, STATION_CATALOG_PATH)
  let before = current.toString()
  for (const edit of [...receipt.edits].reverse()) {
    check(before.split(edit.afterToken).length === 2, STATION_CATALOG_PATH + '#' + edit.pointer)
    before = before.replace(edit.afterToken, edit.beforeToken)
  }
  check(hash(before) === STATION_BEFORE, STATION_CATALOG_PATH)
  await loadStationCatalogGeography(root, { catalog: JSON.parse(current), readBytes: reader })
  return { before: Buffer.from(before), current, receipt, sha256: receiptSha256 }
}

export async function stationCatalogPredecessorReader(root, reader = readFile) {
  let current
  try { current = reader === readFile
    ? readSourceArchive(STATION_CATALOG_PATH, STATION_AFTER, process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'))
    : await reader(resolve(root, STATION_CATALOG_PATH)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (!current || hash(current) !== STATION_AFTER) return reader
  const successor = await authenticateStationCatalogSuccessor(root, reader)
  const predecessor = async path => resolve(path) === resolve(root, STATION_CATALOG_PATH) ? successor.before : reader(path)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  predecessor.readHistorical = reader.readHistorical
  return predecessor
}
