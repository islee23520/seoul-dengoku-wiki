import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export const CLIMATE_SOURCE = 'lore/characters/Characters-Factions-and-Professions.json'
export const CLIMATE_RECEIPT = '.omo/private/seoul-migration/climate-link-successor-20261019/receipt.json'
export const CLIMATE_BEFORE = '9123f6a6fb75ca5810652687d2fdbab28c27b8909984847e394b406ede7c3f1f'
export const CLIMATE_AFTER = '25f38dc14f9a62da957e33faf339ccf0d555bec594ccff2e3f60cbcfc2024092'
export const CLIMATE_RECEIPT_SHA256 = '4e365cce726aa29b7dd9c0cc991977ba3c385ec6723a5d6a65e52bb17875da27'
const hash = value => createHash('sha256').update(value).digest('hex')
const check = (condition, path) => { if (!condition) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path }) }

// Reverse only the four reviewed link additions, preserving immutable approvals.
export async function authenticateClimateLinkSuccessor(root, reader = readFile) {
  const raw = await reader(resolve(root, CLIMATE_RECEIPT))
  check(hash(raw) === CLIMATE_RECEIPT_SHA256, CLIMATE_RECEIPT)
  const receipt = JSON.parse(raw)
  const current = Buffer.from(await reader(resolve(root, CLIMATE_SOURCE)))
  check(receipt.schema === 'climate-link-successor.v1' && receipt.sourcePath === CLIMATE_SOURCE
    && receipt.beforeSha256 === CLIMATE_BEFORE && receipt.afterSha256 === CLIMATE_AFTER
    && receipt.edits.length === 4 && hash(current) === CLIMATE_AFTER
    && current.length === receipt.afterBytes, CLIMATE_SOURCE)
  const document = JSON.parse(current)
  check(document.content[25].anchor === '출처-list1', CLIMATE_SOURCE)
  let before = current.toString()
  for (const edit of [...receipt.edits].reverse()) {
    const value = edit.pointer.split('/').slice(1).reduce((node, key) => node[key], document)
    check(edit.operation === 'add' && JSON.stringify(value) === JSON.stringify(edit.link)
      && before.split(edit.afterToken).length === 2, CLIMATE_SOURCE + '#' + edit.pointer)
    before = before.replace(edit.afterToken, edit.beforeToken)
  }
  check(hash(before) === CLIMATE_BEFORE && Buffer.byteLength(before) === receipt.beforeBytes, CLIMATE_SOURCE)
  return { before: Buffer.from(before), current, receipt, sha256: CLIMATE_RECEIPT_SHA256 }
}

export async function climateLinkPredecessorReader(root, reader = readFile) {
  let current
  try { current = await reader(resolve(root, CLIMATE_SOURCE)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (!current || hash(current) !== CLIMATE_AFTER) return reader
  const successor = await authenticateClimateLinkSuccessor(root, reader)
  const predecessor = async path => resolve(path) === resolve(root, CLIMATE_SOURCE) ? successor.before : reader(path)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  return predecessor
}
