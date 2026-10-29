import { assertPrivateFilePermissions } from './private-file-permissions.mjs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { CENSUS_DOCUMENT_PATHS, readCensusDocuments } from '../cast-sqlite/census-document-store.mjs'
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs'
import { readCensusEventDocument } from '../cast-sqlite/census-event-inputs.mjs'
import { readCharacterContractDocument } from '../cast-sqlite/character-contract-document.mjs'
import { readEditorialExampleDocument } from '../cast-sqlite/editorial-example-document.mjs'
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY  } from './soul-assignment.mjs'
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_PATHS } from './editorial-profile.mjs'
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_PATHS } from './soul-candidate-documents.mjs'
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_PATHS } from './soul-review-documents.mjs'
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_PATHS } from './soul-batch-documents.mjs'
import { openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY, OPENING_SAMPLE_PATHS } from './opening-sample-documents.mjs'
import { openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, EDITORIAL_ENVELOPE_PATHS } from './editorial-envelope-documents.mjs'

const directory = fileURLToPath(new URL('../../.omo/private/seoul-migration/sqlite-authority-20261021/', import.meta.url))
const censusPaths = Object.values(CENSUS_DOCUMENT_PATHS)
const editorialReaders = {
  'lore/editorial/Character-System-Contract.json': db => readCharacterContractDocument(db),
  'lore/editorial/authoring.example.json': db => readEditorialExampleDocument(db),
  'lore/editorial/seoul-narrative-census-events.json': db => readCensusEventDocument(db),
}
const families = [
  [SOUL_CANDIDATE_PATHS, 'WIKI_SOUL_CANDIDATE_DB', 'candidates.sqlite', openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY],
  [SOUL_REVIEW_PATHS, 'WIKI_SOUL_REVIEW_DB', 'review.sqlite', openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY],
  [SOUL_BATCH_PATHS, 'WIKI_SOUL_BATCH_DB', 'batches.sqlite', openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY],
  [OPENING_SAMPLE_PATHS, 'WIKI_OPENING_SAMPLE_DB', 'captured-opening-sample-20261021.sqlite', openOpeningSampleDocuments, INTERNAL_OPENING_SAMPLE_CAPABILITY],
  [EDITORIAL_ENVELOPE_PATHS, 'WIKI_EDITORIAL_ENVELOPE_DB', 'captured-editorial-envelopes-20261021.sqlite', openEditorialEnvelopeDocuments, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY],
  [EDITORIAL_PROFILE_PATHS, 'WIKI_EDITORIAL_PROFILE_DB', 'editorial-profiles.sqlite', openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY],
]

export function isPrivateCurrentDocument(logicalPath) {
  return logicalPath === 'lore/editorial/Soul-Assignments.json'
    || logicalPath === 'lore/editorial/Seoul-Scope-Contract.json'
    || censusPaths.includes(logicalPath)
    || Object.hasOwn(editorialReaders, logicalPath)
    || families.some(([paths]) => paths.includes(logicalPath))
}

// Internal Node consumers only. Selection uses exact logical identities, never a
// database inventory, source-file lookup, archived body, or public fallback.
export function readPrivateCurrentDocument(logicalPath) {
  if (!isPrivateCurrentDocument(logicalPath)) throw new Error(`E_PRIVATE_DOCUMENT_IDENTITY:${logicalPath}`)
  if (censusPaths.includes(logicalPath) || Object.hasOwn(editorialReaders, logicalPath) || logicalPath === 'lore/editorial/Seoul-Scope-Contract.json') {
    const path = process.env.WIKI_EDITORIAL_DB ?? resolve(directory, 'editorial.sqlite')
    assertPrivateFilePermissions(path)
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      if (db.prepare('PRAGMA application_id').get().application_id !== 1464157266
        || db.prepare('PRAGMA user_version').get().user_version !== 1) throw new Error('E_PRIVATE_EDITORIAL_DATABASE')
      if (Object.hasOwn(editorialReaders, logicalPath)) return editorialReaders[logicalPath](db)
      if (logicalPath === 'lore/editorial/Seoul-Scope-Contract.json')
        return readScopeContract(db)
      const [key] = Object.entries(CENSUS_DOCUMENT_PATHS).find(([, path]) => path === logicalPath)
      return readCensusDocuments(db)[key]
    } finally { db.close() }
  }
  if (logicalPath === 'lore/editorial/Soul-Assignments.json') {
    const store = openSoulAssignments(process.env.WIKI_SOUL_ASSIGNMENT_DB ?? resolve(directory, 'soul-assignments.sqlite'), {
      capability: INTERNAL_SOUL_CAPABILITY, scope: 'internal',
    })
    try { return store.readDocument() } finally { store.close() }
  }
  const [paths, environment, filename, open, capability] = families.find(([candidate]) => candidate.includes(logicalPath))
  const store = open(process.env[environment] ?? resolve(directory, filename), {
    capability, scope: 'internal',
  })
  try {
    const document = paths === EDITORIAL_PROFILE_PATHS
      ? store.readBatches().find(batch => batch.logicalPath === logicalPath)?.batch
      : store.readDocuments().get(logicalPath)
    if (document === undefined) throw new Error(`E_PRIVATE_DOCUMENT_COVERAGE:${logicalPath}`)
    return document
  } finally { store.close() }
}
