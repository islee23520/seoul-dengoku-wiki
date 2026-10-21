import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { profileRosterFailures } from './character-profile.mjs'

export async function loadCharacterProfiles(root, {
  documentDb = process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'),
  editorialProfileDb = process.env.WIKI_EDITORIAL_PROFILE_DB
    ?? resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021/editorial-profiles.sqlite'),
  soulAssignmentDb = process.env.WIKI_SOUL_ASSIGNMENT_DB
    ?? resolve(root, '.omo/private/seoul-migration/sqlite-authority-20261021/soul-assignments.sqlite'),
} = {}) {
  if (!documentDb || !editorialProfileDb || !soulAssignmentDb) throw new Error('E_PERSON_PRIVATE_DATABASE_REQUIRED')
  const { readEditorialProfileInputs } = await import('./cast-sqlite/person-detail-inputs.mjs')
  const profiles = [...(await readEditorialProfileInputs(editorialProfileDb)).values()]
  const registry = await (async () => {
      const { openReadOnly } = await import('./cast-sqlite/db.mjs')
      const { readAtlasIdentity } = await import('./cast-sqlite/atlas-identity.mjs')
      const db = openReadOnly(documentDb)
      try { return readAtlasIdentity(db).registry } finally { db.close() }
    })()
  const assignments = await (async () => {
      const { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } = await import('./document-store/soul-assignment.mjs')
      const store = openSoulAssignments(soulAssignmentDb, {
        capability: INTERNAL_SOUL_CAPABILITY, expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256,
      })
      try { return store.readDocument() } finally { store.close() }
    })()
  const failures = profileRosterFailures(profiles, registry, assignments)
  if (failures.length) throw new Error(failures.join('\n'))
  return new Map(profiles.map(profile => [profile.personId, profile]))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, '..')
  try {
    const profiles = await loadCharacterProfiles(root)
    console.log(`CHARACTER_PROFILES_PASS: ${profiles.size} people`)
  } catch (error) {
    console.error(`CHARACTER_PROFILES_FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
