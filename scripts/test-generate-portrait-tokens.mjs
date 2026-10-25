import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { generatePortraitTokens } from './generate-portrait-tokens.mjs'
import { runRelease } from './generate-release.mjs'
import { loadPortraitDocuments } from './portrait-source-documents.mjs'

const project = fileURLToPath(new URL('../', import.meta.url))
const generator = new URL('./generate-portrait-tokens.mjs', import.meta.url).href
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const gate = async () => ({ complete: true, semanticReview: 'reviewed' })
const tokenPath = file => 'public/portrait-tokens/' + file

async function put(root, path, bytes) {
  await mkdir(dirname(join(root, path)), { recursive: true })
  await writeFile(join(root, path), bytes)
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'portrait-token-release-'))
  const before = new Map()
  const originals = new Map()
  const { catalog: registry } = loadPortraitDocuments(project)
  const files = registry.entries.map(entry => entry.personId + '.json').sort()
  assert.equal(files.length, 25)
  for (const file of files) {
    const bytes = await readFile(join(project, tokenPath(file)), 'utf8')
    originals.set(file, JSON.parse(bytes))
    before.set(tokenPath(file), bytes)
  }
  const newcomer = 'person-0002.json'
  assert.ok(!files.includes(newcomer))
  const details = new Map()
  for (const file of [...files, newcomer]) {
    const bytes = await readFile(join(project, 'public/person-details', file), 'utf8')
    before.set('public/person-details/' + file, bytes)
    details.set(file, JSON.parse(bytes))
  }
  for (const path of ['lore/name-pools/gender-cast.json', 'src/generated/nonKoreanFamilyCatalog.ts']) {
    before.set(path, await readFile(join(project, path), 'utf8'))
  }
  for (const [path, bytes] of before) await put(root, path, bytes)
  return { root, before, originals, details, newcomer,
    ownership: async (_, path) => before.has(path) ? digest(before.get(path)) : null }
}

async function stageTokens(fixture, context) {
  const detail = { ...fixture.details.get(fixture.newcomer), age: 27, position: null, occupation: '의료 당직', fields: {} }
  await context.write('public/person-details/' + fixture.newcomer, JSON.stringify(detail))
  const family = [{ basis: 'Mensah 가계', members: [{ id: detail.id }] }]
  await context.write('src/generated/nonKoreanFamilyCatalog.ts', 'export const nonKoreanFamilyCatalog = ' + JSON.stringify(family) + ' as const\n')
  await context.run([process.execPath, '--input-type=module', '-e',
    `import { generatePortraitTokens } from ${JSON.stringify(generator)}; await generatePortraitTokens(${JSON.stringify(fixture.root)})`])
  for (const [path, bytes] of fixture.before) assert.equal(await readFile(join(fixture.root, path), 'utf8'), bytes)
  const records = (await readFile(join(fixture.root, '.generate-release-transaction/outputs.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse)
  assert.deepEqual(records.sort(), [...fixture.originals.keys(), fixture.newcomer].map(tokenPath).sort())
}

test('portrait worker reads staged details and family catalog, journals every token and preserves all 25 authored approvals', async () => {
  const f = await fixture()
  try {
    await runRelease({ root: f.root, gate, ownership: f.ownership, stage: context => stageTokens(f, context) })
    for (const [file, previous] of f.originals) {
      const next = JSON.parse(await readFile(join(f.root, tokenPath(file)), 'utf8'))
      for (const key of ['approval', 'image', 'style', 'imageReview', 'references', 'variantId']) if (key in previous) assert.deepEqual(next[key], previous[key], file + ':' + key)
      for (const [group, slots] of Object.entries(previous.slots ?? {})) {
        for (const [key, slot] of Object.entries(slots)) {
          if (slot.value != null && slot.status !== 'unknown' && slot.status !== 'derived-proposal') assert.deepEqual(next.slots[group][key], slot, file + ':' + group + '.' + key)
        }
      }
      for (const [key, value] of Object.entries(previous.artProposal)) if (value != null) assert.deepEqual(next.artProposal[key], value, file + ':artProposal.' + key)
    }
    const newcomer = JSON.parse(await readFile(join(f.root, tokenPath(f.newcomer)), 'utf8'))
    assert.equal(newcomer.approval, 'art-proposal')
    assert.equal(newcomer.image, null)
    assert.equal(newcomer.facts.role, null)
    assert.equal(newcomer.identity.age, 27)
    assert.equal(newcomer.identity.ethnicity.value, 'West African heritage')
    assert.equal(newcomer.identity.ethnicity.status, 'derived-proposal')
    assert.equal(newcomer.slots.accessories.description.source, 'derived-20261019:occupation(medic)')
    assert.equal(Object.keys(newcomer.textToImage.views).length, 5)
    const manifest = JSON.parse(await readFile(join(f.root, 'src/generated-private/generation-release-manifest.json'), 'utf8'))
    const tokens = manifest.files.filter(row => row.path.startsWith('public/portrait-tokens/'))
    assert.equal(tokens.length, 26)
    for (const row of tokens) assert.equal(row.sha256, digest(await readFile(join(f.root, row.path))))
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('completed portrait staging followed by failure preserves every live input and token', async () => {
  const f = await fixture()
  try {
    await assert.rejects(runRelease({ root: f.root, gate, ownership: f.ownership, stage: async context => {
      await stageTokens(f, context)
      throw new Error('E_PORTRAIT_STAGE_FIXTURE')
    } }), /E_PORTRAIT_STAGE_FIXTURE/)
    for (const [path, bytes] of f.before) assert.equal(await readFile(join(f.root, path), 'utf8'), bytes)
    await assert.rejects(readFile(join(f.root, tokenPath(f.newcomer))), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('portrait worker rejects direct live-output use before reading or writing inputs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portrait-token-no-stage-'))
  try {
    await assert.rejects(generatePortraitTokens(root), /E_RELEASE_STAGE_REQUIRED/)
    assert.deepEqual(await readdir(root), [])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('catalog permits a missing canonical role only for tokens without an image', async () => {
  const source = await readFile(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("for (const file of await readdir(resolve(publicRoot, 'portrait-tokens'))) {")
  const end = source.indexOf('await publishPublicAssets(', start)
  assert.ok(start >= 0 && end > start)
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const synchronize = new AsyncFunction('readdir', 'resolve', 'publicRoot', 'readFile', 'peopleCatalog', 'writeFile', source.slice(start, end))
  for (const image of [null, { sha256: 'approved-image' }]) {
    const token = { personId: 'person-0002', name: 'fixture', facts: { role: 'old role' }, image }
    for (const position of [null, ' ', 'current role']) {
      const writes = []
      const action = synchronize(async () => ['person-0002.json'], join, '/stage/public', async () => JSON.stringify(token),
        [{ id: token.personId, name: token.name, position }], async (_, bytes) => writes.push(JSON.parse(bytes)))
      if (image && !position?.trim()) {
        await assert.rejects(action, /E_PORTRAIT_CANON_ROLE:person-0002.json/)
        assert.deepEqual(writes, [])
      } else {
        await action
        assert.equal(writes[0].facts.role, position?.trim() ? position : null)
        assert.deepEqual(writes[0].image, image)
      }
    }
  }
})
