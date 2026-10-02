import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const wikiRoot = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

export async function preflightPortraitCandidates(evidenceRoot, root = wikiRoot) {
  const json = async path => JSON.parse(await readFile(join(root, path), 'utf8'))
  const catalog = await json('portrait-catalog.json')
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  const genders = (await json('lore/name-pools/gender-cast.json')).people
  const properties = (await json('portrait-properties.json')).entries
  const plan = []
  for (const group of ['recommended', 'rulers']) {
    const manifest = JSON.parse(await readFile(join(evidenceRoot, group, 'manifest.json'), 'utf8'))
    for (const row of manifest.entries) {
      const identity = catalog.entries.find(entry => entry.name === row.name && entry.characterId === row.characterId)
      assert.ok(identity, 'Unknown canonical identity: ' + row.name)
      const detail = await json('public/person-details/' + identity.personId + '.json')
      assert.equal(detail.name, row.name, 'Published identity mismatch')
      assert.equal(registry.find(person => person.id === row.characterId)?.name, row.name, 'Permanent identity mismatch')
      const gender = genders.find(person => person.name === row.name)
      const source = JSON.parse(await readFile(join(evidenceRoot, group, basename(row.tokenPath)), 'utf8'))
      assert.equal(source.characterId, row.characterId)
      assert.equal(source.name, row.name)
      assert.equal(source.personId, row.personId)
      const facts = group === 'recommended' ? source.sourceFacts : source.canonicalFacts
      assert.equal(facts.gender, gender?.gender, 'Gender ledger mismatch')
      assert.equal(detail.gender, gender.gender, 'Published gender mismatch')
      assert.equal(facts.genderUserLocked, gender.user_locked, 'Gender owner-lock mismatch')
      assert.equal(row.stateId ?? null, identity.stateId, 'State identity mismatch')
      assert.equal(row.approval, 'art-proposal')
      const image = join(evidenceRoot, group, basename(row.portraitPath))
      const bytes = await readFile(image)
      assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'Invalid PNG')
      assert.equal(sha(bytes), row.imageSha256, 'Candidate image hash mismatch')
      const token = await json('public/portrait-tokens/' + identity.personId + '.json')
      assert.equal(row.styleReferenceSha256, token.style.referenceSha256, 'Style reference mismatch')
      assert.equal(row.imageSha256, identity.imageSha256, 'Candidate would replace current artwork: ' + identity.personId)
      assert.equal(token.image.sha256, identity.imageSha256)
      assert.equal(sha(await readFile(join(root, 'public/portraits', identity.personId + '.png'))), identity.imageSha256, 'Current artwork hash mismatch')
      for (const key of ['face', 'hair', 'upper']) assert.equal(properties[identity.personId]?.[key], token.artProposal[key], 'Current property mismatch')
      assert.ok(!plan.some(item => item.personId === identity.personId), 'Duplicate canonical identity')
      plan.push({ personId: identity.personId, image, token })
    }
  }
  assert.equal(plan.length, catalog.entries.length, 'Candidate set must preserve the complete current catalog')
  return plan
}

export async function importPortraitCandidates(evidenceRoot, root = wikiRoot) {
  const plan = await preflightPortraitCandidates(evidenceRoot, root)
  // Preflight the entire set before any write; existing tokens retain current reference metadata.
  await mkdir(join(root, 'public/portraits'), { recursive: true })
  await mkdir(join(root, 'public/portrait-tokens'), { recursive: true })
  for (const item of plan) {
    await copyFile(item.image, join(root, 'public/portraits', item.personId + '.png'))
    await writeFile(join(root, 'public/portrait-tokens', item.personId + '.json'), JSON.stringify(item.token, null, 2) + '\n')
  }
  return plan.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('usage: node scripts/import-portrait-candidates.mjs <evidence-root>')
  console.log('IMPORTED ' + await importPortraitCandidates(process.argv[2]) + ' preserved candidates')
}
