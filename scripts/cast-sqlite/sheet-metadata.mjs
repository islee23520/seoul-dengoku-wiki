import { fileURLToPath } from 'node:url'
import { openReadOnly } from './db.mjs'

// Current metadata from named domains. Complete historical records stay in the
// preserved-sheet tables; these seals never make their numbers operative.
export function readSheetMetadata(db) {
  const root = db.prepare('SELECT * FROM issued_preservation_metadata WHERE singleton=1').get()
  if (!root || root.numeric_adoption !== 0) throw new Error('E_ISSUED_PRESERVATION_METADATA')
  const revisions = db.prepare('SELECT * FROM preserved_sheet_revision ORDER BY ordinal').all()
  return {
    baseline: { schema: root.schema_name, baselineManifestSha256: root.baseline_manifest_sha256,
      rulesVersion: root.rules_version, numericAdoption: false,
      revisions: Object.fromEntries(revisions.map(row => [row.revision, { ledgerSha256: row.ledger_sha256,
        documentCanonicalSha256: row.document_sha256, peopleCanonicalSha256: row.people_sha256,
        numericCanonicalSha256: row.numeric_sha256, personCount: row.person_count, numericFieldCount: row.numeric_count }])),
      sourceHashes: Object.fromEntries(db.prepare('SELECT source_path,sha256 FROM preserved_sheet_source ORDER BY source_path').all()
        .map(row => [row.source_path, row.sha256])),
    },
    nameChanges: Object.fromEntries(db.prepare('SELECT * FROM person_sheet_name_change ORDER BY ordinal').all().map(row => [row.character_id, {
      personId: row.person_id, historicalName: row.historical_name, currentName: row.current_name,
      sourceRevision: row.source_revision, sourcePath: row.source_path, approvalRef: row.approval_ref,
    }])),
  }
}

export function loadSheetMetadata(databasePath = process.env.WIKI_DOCUMENT_DB
  ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url))) {
  const db = openReadOnly(databasePath)
  try { return readSheetMetadata(db) } finally { db.close() }
}
