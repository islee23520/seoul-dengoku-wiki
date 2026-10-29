import { resolve } from 'node:path'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPortraitDocuments } from './cast-sqlite/portrait-store.mjs'
import { createReader } from './cast-sqlite/db-pg.mjs'
import { readPortraitDocumentsAsync } from './cast-sqlite/portrait-store.mjs'

export function loadPortraitDocuments(root, { documents, databasePath = process.env.WIKI_PORTRAIT_DB ?? process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite') } = {}) {
  if (documents) return documents
  const db = openReadOnly(databasePath)
  try {
    db.exec('BEGIN')
    const current = readPortraitDocuments(db)
    db.exec('COMMIT')
    return current
  } finally { db.close() }
}

export async function loadPortraitDocumentsAsync(root, options = {}) {
  const { documents, databasePath } = options
  if (documents) return documents
  const connectionString = options.pgUrl ?? process.env.WIKI_DOCUMENT_PG
  if (!connectionString) return loadPortraitDocuments(root, { ...options, ...(databasePath ? { databasePath } : {}) })
  const reader = createReader({ connectionString, role: 'wiki_reader' })
  const importSnapshot = process.env.WIKI_GENERATION_SNAPSHOT
  try {
    return await reader.transaction(readPortraitDocumentsAsync, {
      readOnly: true,
      ...(importSnapshot ? { importSnapshot } : {}),
    })
  } finally {
    await reader.close()
  }
}
