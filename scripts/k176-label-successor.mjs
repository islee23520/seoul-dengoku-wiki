import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export const K176_SOURCE = 'lore/characters/Cast-State-07.json'
export const K176_BEFORE = 'a87e2da6d1ca0911ae244b1aab68ba1673bf5df2876aed76c4c7bb50133a3781'
export const K176_AFTER = 'ccb429ce471b9cd81b22c678263338c890dba5a52eb9810c2dfdfb74b715bf42'
export const K176_DIRECTORY = '.omo/private/seoul-migration/k176-label-successor-20261019/'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (value, path) => { if (!value) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path }) }

// Same exact-byte predecessor/replay pattern as doc247 technical successors.
// This authority permits two prefixes only, never a new office or narrative fact.
export async function authenticateK176LabelSuccessor(root, reader = readFile) {
  const approval = await reader(resolve(root, K176_DIRECTORY + 'owner-decision.json'))
  check(hash(approval) === '42bbf72c52804cd6719ce1aa29f52ed26175a7b0385e65d65c4e8a1e9def69d8', K176_DIRECTORY + 'owner-decision.json')
  const receipt = JSON.parse(approval)
  check(receipt.date === '2026-10-19' && receipt.ownerDecision.verbatim === 'K176 표기: 두 표기만 승인 (Recommended)'
    && receipt.operations.length === 2 && receipt.beforeSha256 === K176_BEFORE, K176_DIRECTORY + 'owner-decision.json')
  const current = Buffer.from(await reader(resolve(root, K176_SOURCE)))
  if (hash(current) === K176_BEFORE) return null
  check(hash(current) === K176_AFTER, K176_SOURCE)
  const before = Buffer.from(await reader(resolve(root, K176_DIRECTORY + 'before.json')))
  check(hash(before) === K176_BEFORE, K176_DIRECTORY + 'before.json')
  let replay = before.toString()
  for (const [index, locale] of ['ko', 'en'].entries()) {
    const operation = receipt.operations[index]
    check(operation.path === `/content/94/items/3/${locale}/0/text`
      && hash(JSON.stringify(operation.before)) === operation.beforeValueSha256
      && hash(JSON.stringify(operation.after)) === operation.afterValueSha256, operation.path)
    const oldPrefix = locale === 'ko' ? '생업:' : 'Livelihood:'
    const newPrefix = locale === 'ko' ? '역할:' : 'Role:'
    check(operation.before.startsWith(oldPrefix)
      && operation.after === newPrefix + operation.before.slice(oldPrefix.length), operation.path)
    replay = replay.replace(JSON.stringify(operation.before), JSON.stringify(operation.after))
  }
  check(Buffer.from(replay).equals(current), K176_SOURCE)
  return { before, current, receipt, approvalSha256: hash(approval) }
}

export async function k176PredecessorReader(root, reader = readFile) {
  let bytes
  try { bytes = await reader(resolve(root, K176_SOURCE)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (!bytes || hash(bytes) !== K176_AFTER) return reader
  const successor = await authenticateK176LabelSuccessor(root, reader)
  const predecessor = async path => resolve(path) === resolve(root, K176_SOURCE) ? successor.before : reader(path)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  return predecessor
}
