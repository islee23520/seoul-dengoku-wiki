import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const MAIN_DOC_REGISTRATION = '.omo/private/seoul-migration/main-doc-admission-20261020/registration.json'
export const MAIN_DOC_REGISTRATION_SHA256 = '5e4fefe1e8f5d87eed9dc3b3ce0b900f2705f90e91bc9176616e99e153a83da2'
export const MAIN_DOC_SOURCES = Object.freeze([
  {
    "sourcePath": "data/geography/elections/sources/README.md",
    "sha256": "e0443b8627756231f5ae186c0b425b072c22dcc38ddc5e6bd3f9c24d5df6f43d"
  },
  {
    "sourcePath": "deploy/README.md",
    "sha256": "ca395f7635f12a0ac3be5a063bc49a7e0ccf79936caa39a824f0e3a2b44ed350"
  },
  {
    "sourcePath": "docs/wiki-cast-sqlite-plan.md",
    "sha256": "3c22cab05cc2b88133be6346b8007fe19c382d7f09eaa24597a17bf4b5f03530"
  },
  {
    "sourcePath": "scripts/cast-sqlite/README.md",
    "sha256": "7b5f42f22bdefe8e6d1d5fb90dc6aaa0a5657b2bf489c5edbae7e9db4ae8ebcf"
  },
  {
    "sourcePath": "scripts/cast-sqlite/TEXT-CORPUS-GAPS.md",
    "sha256": "cf074f54c97fc911cf5bfd157d5af53f36761bcc449882436238a5be8c2dc5ce"
  }
])
export const MAIN_DOC_ROWS = Object.freeze(MAIN_DOC_SOURCES.map(({ sourcePath, sha256 }) => Object.freeze({
  sourcePath, status: 'excluded', reviewReceipt: null, batchId: 'main-doc-excluded-registration-20261020',
  basis: `authenticated post-baseline operational-document preservation only; evidence=${MAIN_DOC_REGISTRATION}; currentSha256=${sha256}`,
})))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (condition, path) => {
  if (!condition) throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path })
}
const authenticated = new WeakSet()

// Closed five-document preservation registration; neither authoring nor publication authority.
export async function authenticateMainDocAdmission(root, baseline, reader = readFile) {
  const raw = Buffer.from(await reader(resolve(root, MAIN_DOC_REGISTRATION)))
  check(hash(raw) === MAIN_DOC_REGISTRATION_SHA256, MAIN_DOC_REGISTRATION)
  const registration = JSON.parse(raw)
  check(registration.ownerApproval === null && registration.publicationEligible === false
    && registration.reviewReceipt === null && registration.documents.length === MAIN_DOC_ROWS.length, MAIN_DOC_REGISTRATION)
  check(hash(await reader(resolve(root, registration.predecessor.path))) === registration.predecessor.sha256, registration.predecessor.path)
  const overlayBytes = Buffer.from(await reader(resolve(root, registration.overlay.path)))
  check(hash(overlayBytes) === registration.overlay.sha256, registration.overlay.path)
  const overlay = JSON.parse(overlayBytes)
  check(JSON.stringify(overlay.predecessor) === JSON.stringify(registration.predecessor)
    && overlay.documents.length === MAIN_DOC_ROWS.length, registration.overlay.path)
  const admissions = []
  for (const [index, pin] of registration.documents.entries()) {
    check(pin.sourcePath === MAIN_DOC_ROWS[index].sourcePath
      && !baseline.files.some(row => row.path === pin.sourcePath), pin.sourcePath)
    check(JSON.stringify(overlay.documents[index]) === JSON.stringify({ sourcePath: pin.sourcePath, originalKeys: [],
      currentKeyCount: pin.currentKeyCount, currentKeysSha256: pin.currentKeysSha256,
      classification: 'excluded-document', eligible: false, receipt: null }), registration.overlay.path)
    const bytes = Buffer.from(await reader(resolve(root, pin.sourcePath)))
    check(hash(bytes) === pin.sha256 && bytes.length === pin.byteLength
      && createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex') === pin.blob, pin.sourcePath)
    const git = promisify(execFile)
    const sourceBlob = await git('git', ['-C', root, 'rev-parse', pin.sourceCommit + ':' + pin.sourcePath])
    const mainBlob = await git('git', ['-C', root, 'rev-parse', registration.mainCommit + ':' + pin.sourcePath])
    check(sourceBlob.stdout.trim() === pin.blob && mainBlob.stdout.trim() === pin.mainBlob, pin.sourcePath)
    const admission = { row: MAIN_DOC_ROWS[index], source: { bytes, sha256: pin.sha256, value: null }, pin, registration }
    authenticated.add(admission)
    admissions.push(admission)
  }
  return admissions
}

export function mainDocPreservationReceipt(admission) {
  check(authenticated.has(admission), MAIN_DOC_REGISTRATION)
  return { sourcePath: admission.row.sourcePath, currentSha256: admission.source.sha256,
    disposition: 'preserved', evidencePath: MAIN_DOC_REGISTRATION, reviewedAt: admission.registration.registeredAt }
}

export function validateMainDocExtraction(admission, current, original, coverageKey) {
  mainDocPreservationReceipt(admission)
  const path = admission.row.sourcePath
  const rows = Object.values(current).flat().filter(row => (Array.isArray(row) ? row[0] : row.sourcePath) === path)
  check(Object.values(original).flat().every(row => (Array.isArray(row) ? row[0] : row.sourcePath) !== path)
    && rows.length === admission.pin.currentKeyCount
    && current.lines.filter(row => row.sourcePath === path).length === rows.length
    && hash(JSON.stringify(rows.map(coverageKey))) === admission.pin.currentKeysSha256, path)
}

export function validateMainDocDocuments(rows, sourceHashes, occupied = []) {
  check(Array.isArray(rows) && rows.length <= MAIN_DOC_ROWS.length
    && new Set(rows.map(row => row.sourcePath)).size === rows.length, '/current/successorDocuments')
  for (const row of rows) check(MAIN_DOC_ROWS.some(expected => JSON.stringify(expected) === JSON.stringify(row))
    && sourceHashes[row.sourcePath] === MAIN_DOC_SOURCES.find(pin => pin.sourcePath === row.sourcePath)?.sha256
    && !occupied.includes(row.sourcePath), '/current/successorDocuments')
  return rows
}
