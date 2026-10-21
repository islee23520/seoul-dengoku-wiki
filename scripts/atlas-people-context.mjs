import { resolve } from 'node:path'
export async function atlasPeopleContext(loreRoot, { db, dbPath = process.env.WIKI_DOCUMENT_DB ?? resolve(loreRoot, '../data/canonical/wiki-cast.sqlite'), expectedSourceHashes } = {}) {
 if (db || dbPath !== undefined) {
  const { readAtlasIdentity } = await import('./cast-sqlite/atlas-identity.mjs')
  if (db) return readAtlasIdentity(db, { expectedSourceHashes })
  const { openReadOnly } = await import('./cast-sqlite/db.mjs')
  const connection = openReadOnly(dbPath)
  try { return readAtlasIdentity(connection, { expectedSourceHashes }) } finally { connection.close() }
 }
 throw new Error('E_ATLAS_DATABASE_REQUIRED')
}
