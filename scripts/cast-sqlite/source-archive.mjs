import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { openReadOnly } from './db.mjs'

// Exact predecessor evidence for import/review replay, never current authoring.
export function readSourceArchive(logicalPath, expectedSha256, dbPath = process.env.WIKI_DOCUMENT_DB
 ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url))) {
 const db = openReadOnly(dbPath)
 try {
  const source = db.prepare('SELECT raw_bytes,sha256 FROM source_file WHERE logical_path=?').get(logicalPath)
  if (!source || (expectedSha256 !== undefined && source.sha256 !== expectedSha256)) throw new Error(`E_SOURCE_ARCHIVE:${logicalPath}`)
  const bytes = Buffer.from(source.raw_bytes)
  if (createHash('sha256').update(bytes).digest('hex') !== source.sha256)
   throw new Error(`E_SOURCE_ARCHIVE:${logicalPath}`)
  return bytes
 } finally { db.close() }
}

/** Async PostgreSQL twin of readSourceArchive: same exact-path lookup over
 * wiki.source_file (raw_bytes arrives as bytea → Buffer), same stored
 * sha256 verification against recomputed bytes, same optional expectedSha256
 * pin. Caller owns the read-only transaction. */
export async function readSourceArchiveAsync(tx, logicalPath, expectedSha256) {
 if (!tx || typeof tx.all !== 'function') throw new Error(`E_SOURCE_ARCHIVE:${logicalPath}`)
 const rows = await tx.all('SELECT raw_bytes, sha256 FROM wiki.source_file WHERE logical_path = ?', [logicalPath])
 const source = rows[0]
 if (!source || (expectedSha256 !== undefined && source.sha256 !== expectedSha256)) throw new Error(`E_SOURCE_ARCHIVE:${logicalPath}`)
 const bytes = Buffer.from(source.raw_bytes)
 if (createHash('sha256').update(bytes).digest('hex') !== source.sha256)
  throw new Error(`E_SOURCE_ARCHIVE:${logicalPath}`)
 return bytes
}
