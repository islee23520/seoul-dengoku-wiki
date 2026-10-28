import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { EDITORIAL_PROFILE_PATHS } from './editorial-profile.mjs'

// Immutable import evidence only. Current values come from the private typed stores.
export function readPrivateSourceArchive(root, logicalPath, expectedSha256) {
  const profile = EDITORIAL_PROFILE_PATHS.includes(logicalPath)
  const soul = logicalPath === 'lore/editorial/Soul-Assignments.json'
  if (!profile && !soul) {
    if (!logicalPath.startsWith('lore/editorial/') || !/^[a-f0-9]{64}$/u.test(expectedSha256 ?? ''))
      throw new Error(`E_PRIVATE_SOURCE_ARCHIVE:${logicalPath}`)
    const path = resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite')
    if (process.platform !== 'win32' && (statSync(path).mode & 0o077)) throw new Error('E_PRIVATE_SOURCE_PERMISSIONS')
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      const source = db.prepare('SELECT raw_bytes FROM evidence WHERE identity=? AND logical_path=? AND sha256=?')
        .get('scope-read:' + logicalPath, logicalPath, expectedSha256)
      if (!source || createHash('sha256').update(source.raw_bytes).digest('hex') !== expectedSha256)
        throw new Error(`E_PRIVATE_SOURCE_ARCHIVE:${logicalPath}`)
      return Buffer.from(source.raw_bytes)
    } finally { db.close() }
  }
  const pin = expectedSha256
  if (pin !== undefined && !/^[a-f0-9]{64}$/u.test(pin)) throw new Error(`E_PRIVATE_SOURCE_ARCHIVE:${logicalPath}`)
  const directory = resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021')
  const databasePath = profile ? process.env.WIKI_EDITORIAL_PROFILE_DB ?? resolve(directory, 'editorial-profiles.sqlite')
    : process.env.WIKI_SOUL_ASSIGNMENT_DB ?? resolve(directory, 'soul-assignments.sqlite')
  if (process.platform !== 'win32' && (statSync(databasePath).mode & 0o077)) throw new Error('E_PRIVATE_SOURCE_PERMISSIONS')
  const db = new DatabaseSync(databasePath, { readOnly: true })
  try {
    const source = profile ? db.prepare('SELECT sha256,raw_bytes FROM editorial_archive WHERE logical_path=?').get(logicalPath)
      : db.prepare('SELECT sha256,raw_bytes FROM soul_archive WHERE singleton=1').get()
    if (!source || (pin !== undefined && source.sha256 !== pin)) throw new Error(`E_PRIVATE_SOURCE_ARCHIVE:${logicalPath}`)
    const bytes = Buffer.from(source.raw_bytes)
    if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`E_PRIVATE_SOURCE_ARCHIVE:${logicalPath}`)
    return bytes
  } finally { db.close() }
}
