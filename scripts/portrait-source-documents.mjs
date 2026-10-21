import { resolve } from 'node:path'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPortraitDocuments } from './cast-sqlite/portrait-store.mjs'

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
