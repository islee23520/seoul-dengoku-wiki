import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { profileRosterFailures } from './character-profile.mjs'

export async function loadCharacterProfiles(root) {
  const directory = resolve(root, 'lore/editorial/profile-batches')
  const files = (await readdir(directory)).filter(name => name.endsWith('.json')).sort()
  const profiles = []
  for (const file of files) {
    const batch = JSON.parse(await readFile(resolve(directory, file), 'utf8'))
    if (!Array.isArray(batch.profiles)) throw new Error(`E_PROFILE_BATCH:${file}`)
    profiles.push(...batch.profiles)
  }
  const registry = JSON.parse(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json'), 'utf8'))
  const assignments = JSON.parse(await readFile(resolve(root, 'lore/editorial/Soul-Assignments.json'), 'utf8'))
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
