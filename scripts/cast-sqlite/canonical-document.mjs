import { fileURLToPath } from 'node:url'
import { openReadOnly } from './db.mjs'
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs'
import { readNamingLedgerDocument } from './naming-ledger-document.mjs'
import { CATALOG_METADATA_PATHS, readCatalogMetadataDocument } from './catalog-metadata.mjs'
import { readDocument } from './document-read.mjs'
import { isPrivateCurrentDocument, readPrivateCurrentDocument } from '../document-store/private-current-document.mjs'
import { readPermissionStore } from './permission-store.mjs'

// Logical document names identify typed domains, not files or archived bodies.
// Unsupported sources fail in the domain dispatcher; archives are never a fallback.
export function readCanonicalDocument(logicalPath, { predecessor = false, databasePath = process.env.WIKI_DOCUMENT_DB
  ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url)) } = {}) {
  if (isPrivateCurrentDocument(logicalPath)) return readPrivateCurrentDocument(logicalPath)
  const db = openReadOnly(databasePath)
  try {
    if (logicalPath === 'person-rights-permissions.json') return readPermissionStore(db)
    if (CATALOG_METADATA_PATHS.includes(logicalPath)) return readCatalogMetadataDocument(db, logicalPath)
    if (logicalPath === 'lore/editorial/Naming-Ledger.json')
      return readNamingLedgerDocument(db)
    const identity = db.prepare(`SELECT d.document_id,d.domain,d.corpus_kind FROM text_document d
      JOIN source_file s USING(source_id) WHERE s.logical_path=?`).get(logicalPath)
    if (identity) return readDocument(db, { documentId: identity.document_id, domain: identity.domain,
      corpusKind: identity.corpus_kind, visibility: 'internal' })
    const source = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').get(logicalPath)
    if (!source) throw new Error(`E_CANONICAL_DOCUMENT_IDENTITY:${logicalPath}`)
    return readScopeCurrentSource({ db, logicalPath, predecessor })
  } finally { db.close() }
}
