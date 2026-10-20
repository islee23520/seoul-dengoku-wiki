import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export const WORDING_RECEIPT = '.omo/private/seoul-migration/review-wording-20261019/receipt.json'
export const WORDING_RECEIPT_SHA256 = 'f3ff3aecc69739ba0020abd4597cc4aabafa838d234f2d2f10864499908f588a'
export const WORDING_SENTINEL_SOURCE = 'lore/characters/Cast-State-16.json'
export const WORDING_SENTINEL_AFTER = '274e94afc69d0e1296f28b78c6de85ca185e5a7d6cec75e2f0b5ac6b96857c4d'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (value, path) => { if (!value) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path }) }
const get = (doc, pointer) => pointer.split('/').slice(1).reduce((value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')], doc)

// An exact, owner-authorized leaf successor. Reconstruct predecessors in memory;
// immutable application archives and publication receipts are never rewritten.
export async function authenticateReviewWordingSuccessor(root, reader = readFile) {
  const bytes = await reader(resolve(root, WORDING_RECEIPT))
  check(hash(bytes) === WORDING_RECEIPT_SHA256, WORDING_RECEIPT)
  const receipt = JSON.parse(bytes)
  check(receipt.schema === 'review-wording-successor.v1' && receipt.date === '2026-10-19'
    && receipt.decision === '검토중 문구: 확정 표현으로 개정 (권장)'
    && receipt.files.length === 7 && receipt.leaves.length === 503
    && receipt.pass2.date === '2026-10-19' && receipt.pass2.files.length === 2
    && receipt.pass2.leaves.length === 122 && receipt.residual.files.length === 1
    && receipt.residual.leaves.length === 1, WORDING_RECEIPT)
  const files = new Map()
  for (const file of receipt.files) {
    const current = Buffer.from(await reader(resolve(root, file.sourcePath)))
    const secondPass = [receipt.pass2, receipt.residual].find(pass => pass.files.some(row => row.sourcePath === file.sourcePath))
    const second = secondPass?.files.find(row => row.sourcePath === file.sourcePath)
    check(!second || second.beforeSha256 === file.afterSha256, file.sourcePath)
    check(hash(current) === (second ?? file).afterSha256, file.sourcePath)
    let predecessor = current.toString()
    for (const pass of second ? [secondPass, receipt] : [receipt]) {
    const stage = pass.files.find(row => row.sourcePath === file.sourcePath)
    check(hash(predecessor) === stage.afterSha256, file.sourcePath)
    const value = JSON.parse(predecessor)
    const leaves = pass.leaves.filter(row => row.sourcePath === file.sourcePath)
    for (const row of leaves) {
      check(get(value, row.pointer) === row.after && hash(row.before) === row.beforeSha256
        && hash(row.after) === row.afterSha256 && JSON.parse(row.beforeToken) === row.before
        && JSON.parse(row.afterToken) === row.after, file.sourcePath + '#' + row.pointer)
      // Equal after strings can occur repeatedly; reversing identical token edits
      // is byte-equivalent, and the independently pinned predecessor hash decides.
      const index = predecessor.indexOf(row.afterToken)
      check(index >= 0, file.sourcePath + '#' + row.pointer)
      predecessor = predecessor.slice(0, index) + row.beforeToken + predecessor.slice(index + row.afterToken.length)
    }
    check(hash(predecessor) === stage.beforeSha256, file.sourcePath)
    }
    const before = Buffer.from(predecessor)
    check(hash(before) === file.beforeSha256, file.sourcePath)
    files.set(resolve(root, file.sourcePath), { ...file, afterSha256: (second ?? file).afterSha256, before, current })
  }
  return { files, receipt, sha256: WORDING_RECEIPT_SHA256 }
}

export async function reviewWordingPredecessorReader(root, reader = readFile) {
  let bytes
  try { bytes = await reader(resolve(root, WORDING_SENTINEL_SOURCE)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (!bytes || hash(bytes) !== WORDING_SENTINEL_AFTER) return reader
  const successor = await authenticateReviewWordingSuccessor(root, reader)
  const predecessor = async path => successor.files.get(resolve(path))?.before ?? reader(path)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  return predecessor
}
