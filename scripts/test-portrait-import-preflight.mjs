import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importPortraitCandidates, preflightPortraitCandidates } from './import-portrait-candidates.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const scratch = join(root, '.omo/evidence/pr337-unique-migration/import-fixture')
const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1])
const hash = createHash('sha256').update(bytes).digest('hex')

async function fixture() {
  await rm(scratch, { recursive: true, force: true })
  const wiki = join(scratch, 'wiki'), evidence = join(scratch, 'evidence')
  for (const path of ['public/person-details', 'public/portraits', 'public/portrait-tokens', 'lore/name-pools']) await mkdir(join(wiki, path), { recursive: true })
  for (const group of ['recommended', 'rulers']) await mkdir(join(evidence, group), { recursive: true })
  const json = async (path, data) => writeFile(path, JSON.stringify(data))
  const token = { schemaVersion: 1, personId: 'person-0399', characterId: 'K398', name: '정유라', facts: { gender: '여성', genderUserLocked: true }, artProposal: { face: 'face', hair: 'hair', upper: 'coat' }, style: { referenceSha256: 'style' }, image: { sha256: hash }, references: { identityRole: 'owner-reference' } }
  await json(join(wiki, 'portrait-catalog.json'), { entries: [{ personId: token.personId, characterId: token.characterId, name: token.name, stateId: 'S16', imageSha256: hash }] })
  await json(join(wiki, 'portrait-properties.json'), { entries: { [token.personId]: token.artProposal } })
  await json(join(wiki, 'lore/name-pools/person-id-registry.json'), { persons: [{ id: 'K398', name: '정유라' }] })
  await json(join(wiki, 'lore/name-pools/gender-cast.json'), { people: [{ name: '정유라', gender: '여성', user_locked: true }] })
  await json(join(wiki, 'public/person-details/person-0399.json'), { id: 'person-0399', name: '정유라', gender: '여성' })
  await json(join(wiki, 'public/portrait-tokens/person-0399.json'), token)
  await writeFile(join(wiki, 'public/portraits/person-0399.png'), bytes)
  const source = { personId: 'person-0398', characterId: 'K398', name: '정유라', canonicalFacts: { gender: '여성', genderUserLocked: true } }
  const row = { personId: source.personId, characterId: 'K398', name: '정유라', stateId: 'S16', portraitPath: 'portrait.png', tokenPath: 'token.json', approval: 'art-proposal', qaVerdict: 'PASS', styleReferenceSha256: 'style', imageSha256: hash }
  await json(join(evidence, 'recommended/manifest.json'), { entries: [] })
  await json(join(evidence, 'rulers/manifest.json'), { entries: [row] })
  await json(join(evidence, 'rulers/token.json'), source)
  await writeFile(join(evidence, 'rulers/portrait.png'), bytes)
  return { wiki, evidence, token, source, row, json }
}

test('legacy evidence IDs resolve canonically without restoring old paths or reference metadata', async () => {
  const f = await fixture()
  assert.equal((await preflightPortraitCandidates(f.evidence, f.wiki))[0].personId, 'person-0399')
  assert.equal(await importPortraitCandidates(f.evidence, f.wiki), 1)
  assert.deepEqual(JSON.parse(await readFile(join(f.wiki, 'public/portrait-tokens/person-0399.json'), 'utf8')), f.token)
  assert.deepEqual(await readdir(join(f.wiki, 'public/portrait-tokens')), ['person-0399.json'])
})

test('candidate artifacts import without a human receipt or passing review verdict', async () => {
  const f = await fixture()
  for (const verdict of ['FAIL', undefined]) {
    const row = { ...f.row, qaVerdict: verdict, ownerReceipt: undefined, approvedGold: false }
    await f.json(join(f.evidence, 'rulers/manifest.json'), { entries: [row] })
    const [candidate] = await preflightPortraitCandidates(f.evidence, f.wiki)
    assert.equal(candidate.personId, 'person-0399')
    assert.equal(candidate.token.approval, f.token.approval)
    assert.equal(candidate.token.approvedGold, f.token.approvedGold)
  }
  await writeFile(join(f.evidence, 'rulers/portrait.png'), Buffer.concat([bytes, Buffer.from([2])]))
  await assert.rejects(preflightPortraitCandidates(f.evidence, f.wiki), /Candidate image hash mismatch/)
  await rm(join(f.evidence, 'rulers/portrait.png'))
  await assert.rejects(preflightPortraitCandidates(f.evidence, f.wiki), { code: 'ENOENT' })
})

test('gender owner lock and replacement artwork fail before any published file changes', async () => {
  const f = await fixture()
  const before = await readFile(join(f.wiki, 'public/portrait-tokens/person-0399.json'))
  f.source.canonicalFacts.genderUserLocked = false
  await f.json(join(f.evidence, 'rulers/token.json'), f.source)
  await assert.rejects(importPortraitCandidates(f.evidence, f.wiki), /Gender owner-lock mismatch/)
  f.source.canonicalFacts.genderUserLocked = true
  await f.json(join(f.evidence, 'rulers/token.json'), f.source)
  const replacement = Buffer.concat([bytes, Buffer.from([2])])
  await writeFile(join(f.evidence, 'rulers/portrait.png'), replacement)
  f.row.imageSha256 = createHash('sha256').update(replacement).digest('hex')
  await f.json(join(f.evidence, 'rulers/manifest.json'), { entries: [f.row] })
  await assert.rejects(importPortraitCandidates(f.evidence, f.wiki), /replace current artwork/)
  assert.deepEqual(await readFile(join(f.wiki, 'public/portrait-tokens/person-0399.json')), before)
  assert.deepEqual(await readFile(join(f.wiki, 'public/portraits/person-0399.png')), bytes)
})

test('mismatched permanent identity and duplicate resolved identities are rejected', async () => {
  const f = await fixture()
  f.row.characterId = 'K001'
  await f.json(join(f.evidence, 'rulers/manifest.json'), { entries: [f.row] })
  await assert.rejects(preflightPortraitCandidates(f.evidence, f.wiki), /Unknown canonical identity/)
  f.row.characterId = 'K398'
  await f.json(join(f.evidence, 'rulers/manifest.json'), { entries: [f.row, f.row] })
  await assert.rejects(preflightPortraitCandidates(f.evidence, f.wiki), /Duplicate canonical identity/)
})
