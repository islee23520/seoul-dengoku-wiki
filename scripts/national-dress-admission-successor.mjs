import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export const NATIONAL_DRESS_PATH = 'lore/culture/National-Dress-and-Grooming.json'
export const NATIONAL_DRESS_DIRECTORY = '.omo/private/seoul-migration/national-dress-admission-20261020/'
export const NATIONAL_DRESS_SHA256 = '0aea67ee5018ccbc353d022c7cd8a37bc0f17ca074489aee6b294e48a40e28f6'
export const NATIONAL_DRESS_MANIFEST_SHA256 = '7a73af88a2524fb56abc9690a64666f71296631188dabd80228c086b9dd77a38'
export const NATIONAL_DRESS_ROW = Object.freeze({
  sourcePath: NATIONAL_DRESS_PATH, status: 'excluded', reviewReceipt: null,
  batchId: 'national-dress-excluded-registration-20261020',
  basis: `authenticated post-baseline preservation only; evidence=${NATIONAL_DRESS_DIRECTORY}review.json; currentSha256=${NATIONAL_DRESS_SHA256}`,
})
const hash = value => createHash('sha256').update(value).digest('hex')
const check = (condition, path) => {
  if (!condition) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path })
}
const authenticated = new WeakSet()

// This is deliberately a single closed registration, not a source-creation API.
export async function authenticateNationalDressAdmission(root, baseline, reader = readFile) {
  const pinned = async (path, sha256) => {
    const bytes = Buffer.from(await reader(resolve(root, path)))
    check(hash(bytes) === sha256, path)
    return JSON.parse(bytes)
  }
  const manifest = await pinned(NATIONAL_DRESS_DIRECTORY + 'manifest.json', NATIONAL_DRESS_MANIFEST_SHA256)
  const review = await pinned(manifest.review.path, manifest.review.sha256)
  const authority = await pinned(manifest.authority.path, manifest.authority.sha256)
  const overlayBytes = Buffer.from(await reader(resolve(root, manifest.dependencies.path)))
  check(manifest.dependencies.path === NATIONAL_DRESS_DIRECTORY + 'dependencies.json'
    && manifest.dependencies.encoding === 'utf8-json' && hash(overlayBytes) === manifest.dependencies.sha256
    && hash(JSON.stringify(JSON.parse(overlayBytes))) === manifest.dependencies.payloadSha256, manifest.dependencies.path)
  check(!baseline.files.some(row => row.path === NATIONAL_DRESS_PATH), NATIONAL_DRESS_PATH)
  check(manifest.sourcePath === NATIONAL_DRESS_PATH && manifest.absentBaseline === true
    && manifest.admission === 'excluded' && manifest.publicationReview === false
    && authority.publicPublicationApproval === null && review.ownerApproval === null
    && review.publicationEligible === false && review.originalKeys.length === 0, NATIONAL_DRESS_PATH)
  // Historical script hashes are provenance. Immutable input pins still bind the
  // real disk bytes; an overlay must never substitute for this ownership audit.
  for (const [path, expected] of Object.entries(manifest.predecessors)) {
    if (path.startsWith('scripts/')) continue
    check(hash(await reader(resolve(root, path))) === expected, path)
  }
  const bytes = Buffer.from(await reader(resolve(root, NATIONAL_DRESS_PATH)))
  check(hash(bytes) === NATIONAL_DRESS_SHA256 && bytes.length === 11689
    && createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex') === manifest.sourceGit.blob,
  NATIONAL_DRESS_PATH)
  const value = JSON.parse(bytes)
  check(Object.entries(manifest.identity).every(([key, expected]) => value[key] === expected), NATIONAL_DRESS_PATH)
  const successor = { manifest, review, authority, source: { bytes, sha256: NATIONAL_DRESS_SHA256, value }, row: NATIONAL_DRESS_ROW }
  authenticated.add(successor)
  return successor
}

export function validateNationalDressDocuments(rows, sourceHashes, occupied = []) {
  check(Array.isArray(rows) && rows.length <= 1, '/current/successorDocuments')
  for (const row of rows) check(JSON.stringify(row) === JSON.stringify(NATIONAL_DRESS_ROW)
    && sourceHashes[row.sourcePath] === NATIONAL_DRESS_SHA256 && !occupied.includes(row.sourcePath), '/current/successorDocuments')
  return rows
}

export function nationalDressPreservationReceipt(successor) {
  check(authenticated.has(successor), NATIONAL_DRESS_PATH)
  return { sourcePath: NATIONAL_DRESS_PATH, currentSha256: NATIONAL_DRESS_SHA256, disposition: 'preserved',
    evidencePath: successor.manifest.review.path, reviewedAt: successor.review.reviewedAt }
}

export function validateNationalDressExtraction(successor, current, original, coverageKey) {
  check(authenticated.has(successor), NATIONAL_DRESS_PATH)
  const rows = Object.values(current).flat().filter(row => (Array.isArray(row) ? row[0] : row.sourcePath) === NATIONAL_DRESS_PATH)
  const keys = rows.map(row => {
    const item = Array.isArray(row) ? { sourcePath: row[0], jsonPointer: row[1], anchor: row[2], locale: row[3], originalSha256: row[4] } : row
    return { key: coverageKey(item), sha256: item.originalSha256 }
  })
  check(Object.values(original).flat().every(row => (Array.isArray(row) ? row[0] : row.sourcePath) !== NATIONAL_DRESS_PATH)
    && current.leaves.filter(row => row[0] === NATIONAL_DRESS_PATH).length === 119
    && current.blocks.filter(row => row.sourcePath === NATIONAL_DRESS_PATH).length === 20
    && new Set(keys.map(row => row.key)).size === 139
    && JSON.stringify(keys) === JSON.stringify(successor.review.currentKeys), NATIONAL_DRESS_PATH)
}
