import { assertPrivateFilePermissions } from './private-file-permissions.mjs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { CENSUS_DOCUMENT_PINS, readCensusDocuments } from '../cast-sqlite/census-document-store.mjs'
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs'
import { readCensusEventDocument, CENSUS_EVENT_SOURCE_SHA256 } from '../cast-sqlite/census-event-inputs.mjs'
import { readCharacterContractDocument, CHARACTER_CONTRACT_SOURCE_HASH } from '../cast-sqlite/character-contract-document.mjs'
import { readEditorialExampleDocument, EDITORIAL_EXAMPLE_SOURCE_HASH } from '../cast-sqlite/editorial-example-document.mjs'
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs'
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs'
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs'
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs'
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs'
import { openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_SOURCE_HASHES } from './opening-sample-documents.mjs'
import { openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_SOURCE_HASHES } from './editorial-envelope-documents.mjs'

const directory = fileURLToPath(new URL('../../.omo/private/seoul-migration/sqlite-authority-20261021/', import.meta.url))
const censusPins = Object.freeze(Object.fromEntries(Object.values(CENSUS_DOCUMENT_PINS).map(pin => [pin.path, pin.sourceSha256])))
const editorialReaders = {
  'lore/editorial/Character-System-Contract.json': db => readCharacterContractDocument(db, { expectedSourceHash: CHARACTER_CONTRACT_SOURCE_HASH }),
  'lore/editorial/authoring.example.json': db => readEditorialExampleDocument(db, { expectedSourceHash: EDITORIAL_EXAMPLE_SOURCE_HASH }),
  'lore/editorial/seoul-narrative-census-events.json': db => readCensusEventDocument(db, { expectedSourceHash: CENSUS_EVENT_SOURCE_SHA256 }),
}
const families = [
  [SOUL_CANDIDATE_SOURCE_HASHES, 'WIKI_SOUL_CANDIDATE_DB', 'candidates.sqlite', openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY],
  [SOUL_REVIEW_SOURCE_HASHES, 'WIKI_SOUL_REVIEW_DB', 'review.sqlite', openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY],
  [SOUL_BATCH_SOURCE_HASHES, 'WIKI_SOUL_BATCH_DB', 'batches.sqlite', openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY],
  [OPENING_SAMPLE_SOURCE_HASHES, 'WIKI_OPENING_SAMPLE_DB', 'captured-opening-sample-20261021.sqlite', openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY],
  [EDITORIAL_ENVELOPE_SOURCE_HASHES, 'WIKI_EDITORIAL_ENVELOPE_DB', 'captured-editorial-envelopes-20261021.sqlite', openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY],
  [EDITORIAL_PROFILE_SOURCE_HASHES, 'WIKI_EDITORIAL_PROFILE_DB', 'editorial-profiles.sqlite', openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY],
]

export function isPrivateCurrentDocument(logicalPath) {
  return logicalPath === 'lore/editorial/Soul-Assignments.json'
    || logicalPath === 'lore/editorial/Seoul-Scope-Contract.json'
    || Object.hasOwn(censusPins, logicalPath)
    || Object.hasOwn(editorialReaders, logicalPath)
    || families.some(([pins]) => Object.hasOwn(pins, logicalPath))
}

// Internal Node consumers only. Selection uses exact pinned identities, never a
// database inventory, source-file lookup, archived body, or public fallback.
export function readPrivateCurrentDocument(logicalPath) {
  if (!isPrivateCurrentDocument(logicalPath)) throw new Error(`E_PRIVATE_DOCUMENT_IDENTITY:${logicalPath}`)
  if (Object.hasOwn(censusPins, logicalPath) || Object.hasOwn(editorialReaders, logicalPath) || logicalPath === 'lore/editorial/Seoul-Scope-Contract.json') {
    const path = process.env.WIKI_EDITORIAL_DB ?? resolve(directory, 'editorial.sqlite')
    assertPrivateFilePermissions(path)
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      if (db.prepare('PRAGMA application_id').get().application_id !== 1464157266
        || db.prepare('PRAGMA user_version').get().user_version !== 1) throw new Error('E_PRIVATE_EDITORIAL_DATABASE')
      if (Object.hasOwn(editorialReaders, logicalPath)) return editorialReaders[logicalPath](db)
      if (logicalPath === 'lore/editorial/Seoul-Scope-Contract.json')
        return readScopeContract(db)
      const [key] = Object.entries(CENSUS_DOCUMENT_PINS).find(([, pin]) => pin.path === logicalPath)
      return readCensusDocuments(db)[key]
    } finally { db.close() }
  }
  if (logicalPath === 'lore/editorial/Soul-Assignments.json') {
    const store = openSoulAssignments(process.env.WIKI_SOUL_ASSIGNMENT_DB ?? resolve(directory, 'soul-assignments.sqlite'), {
      capability: INTERNAL_SOUL_CAPABILITY, scope: 'internal', expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256,
    })
    try { return store.readDocument() } finally { store.close() }
  }
  const [pins, environment, filename, open, capability] = families.find(([pins]) => Object.hasOwn(pins, logicalPath))
  const store = open(process.env[environment] ?? resolve(directory, filename), {
    capability, scope: 'internal', expectedSourceHashes: pins,
  })
  try {
    const document = pins === EDITORIAL_PROFILE_SOURCE_HASHES
      ? store.readBatches().find(batch => batch.logicalPath === logicalPath)?.batch
      : store.readDocuments().get(logicalPath)
    if (document === undefined) throw new Error(`E_PRIVATE_DOCUMENT_COVERAGE:${logicalPath}`)
    return document
  } finally { store.close() }
}
