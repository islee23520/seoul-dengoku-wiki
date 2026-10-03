import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { applyApprovedPortraitSelection } from './apply-approved-portrait-selection.mjs'

const scratchRoot = fileURLToPath(new URL('../.omo/evidence/portrait-pr478-application-tests/', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const png = value => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 3]), Buffer.from([value])])

async function fixture() {
  await mkdir(scratchRoot, { recursive: true })
  const root = await mkdtemp(join(scratchRoot, 'run-'))
  const wiki = join(root, 'wiki')
  const source = join(root, 'source')
  for (const dir of ['public/portraits', 'public/portrait-tokens', 'public/portrait-reviews', 'lore/name-pools']) await mkdir(join(wiki, dir), { recursive: true })
  await mkdir(source)
  const rows = [
    { personId: 'person-0001', characterId: 'K001', name: '한재목', operation: 'preserve-existing' },
    { personId: 'person-0399', characterId: 'K398', name: '정유라', operation: 'localized-alpha-edit' },
    { personId: 'person-0998', characterId: 'K998', name: '이일섭', operation: 'body-improvement' },
  ]
  const manifest = []
  const originals = {}
  for (const [index, row] of rows.entries()) {
    const previous = png(index)
    const replacement = png(index + 10)
    row.previousImageSha256 = sha(previous)
    row.imageSha256 = row.operation === 'preserve-existing' ? row.previousImageSha256 : sha(replacement)
    row.verdict = 'pass'
    row.approvalSource = 'fixture-owner-decision'
    row.gallery = 'fixture-gallery'
    if (row.operation === 'body-improvement') row.generationReceipt = {
      request: { schemaVersion: 1, model: 'fixture-model', references: [{ index: 1, role: 'style-only', sha256: row.previousImageSha256 }] },
      imageSha256: row.imageSha256,
      status: 'candidate-unreviewed',
    }
    const id = row.personId
    originals[id] = previous
    await writeFile(join(wiki, `public/portraits/${id}.png`), previous)
    await writeFile(join(wiki, `public/portrait-tokens/${id}.json`), JSON.stringify({ image: { sha256: row.previousImageSha256, width: 1, height: 1 }, imageReview: { imageSha256: row.previousImageSha256 } }))
    await writeFile(join(wiki, `public/portrait-reviews/${id}.json`), JSON.stringify({ imageSha256: row.previousImageSha256, ownerVerdict: { verdict: 'pass' } }))
    if (row.operation !== 'preserve-existing') {
      const image = `${id}.png`
      await writeFile(join(source, image), replacement)
      manifest.push({ personId: id, image, sha256: row.imageSha256 })
    }
  }
  await writeFile(join(wiki, 'portrait-approved-selection.json'), JSON.stringify({ status: 'approved-selection-awaiting-asset-application', records: rows }))
  await writeFile(join(wiki, 'portrait-catalog.json'), JSON.stringify({ entries: rows.map(({ personId, characterId, name, previousImageSha256 }) => ({ personId, characterId, name, imageSha256: previousImageSha256 })) }))
  await writeFile(join(wiki, 'lore/name-pools/person-id-registry.json'), JSON.stringify({ persons: rows.map(({ characterId, name }) => ({ id: characterId, name })) }))
  const manifestPath = join(source, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest))
  return { root, wiki, source, rows, originals, manifest, manifestPath }
}

test('approved application preserves history and distinguishes generated body edit from local alpha edits', async () => {
  const f = await fixture()
  try {
    assert.equal(await applyApprovedPortraitSelection(f.manifestPath, f.wiki), 2)
    const selected = JSON.parse(await readFile(join(f.wiki, 'portrait-approved-selection.json')))
    const catalog = JSON.parse(await readFile(join(f.wiki, 'portrait-catalog.json')))
    assert.equal(selected.status, 'approved-selection-applied-to-worktree')
    for (const row of f.rows) {
      const id = row.personId
      const image = await readFile(join(f.wiki, `public/portraits/${id}.png`))
      const token = JSON.parse(await readFile(join(f.wiki, `public/portrait-tokens/${id}.json`)))
      const review = JSON.parse(await readFile(join(f.wiki, `public/portrait-reviews/${id}.json`)))
      assert.equal(sha(image), row.imageSha256)
      assert.equal(token.image.sha256, row.imageSha256)
      assert.equal(token.imageReview.imageSha256, row.imageSha256)
      assert.equal(catalog.entries.find(entry => entry.personId === id).imageSha256, row.imageSha256)
      if (row.operation === 'preserve-existing') {
        assert.equal(review.imageSha256, row.previousImageSha256)
        continue
      }
      assert.deepEqual(await readFile(join(f.wiki, `.omo/evidence/approved-portrait-history-20261003/${id}-${row.previousImageSha256}.png`)), f.originals[id])
      assert.equal(review.previousImageReview.imageSha256, row.previousImageSha256)
      assert.equal(review.imageModification.generationReceiptAvailable, row.operation === 'body-improvement')
      if (row.operation === 'body-improvement') {
        assert.deepEqual(review.generationRequest, row.generationReceipt.request)
        assert.deepEqual(review.generationReceipt, row.generationReceipt)
        assert.equal(review.generationReceipt.status, 'candidate-unreviewed')
        assert.equal(review.ownerVerdict.verdict, 'pass')
      } else {
        assert.equal(review.generationReceipt, undefined)
        assert.equal(review.imageModification.originalRgbPreserved, true)
      }
    }
  } finally {
    await rm(f.root, { recursive: true, force: true })
  }
})

test('bad replacement hash rejects the entire selection before changing images or creating history', async () => {
  const f = await fixture()
  try {
    f.manifest[1].sha256 = '0'.repeat(64)
    await writeFile(f.manifestPath, JSON.stringify(f.manifest))
    await assert.rejects(applyApprovedPortraitSelection(f.manifestPath, f.wiki))
    assert.equal((JSON.parse(await readFile(join(f.wiki, 'portrait-approved-selection.json')))).status, 'approved-selection-awaiting-asset-application')
    for (const row of f.rows) {
      const id = row.personId
      assert.deepEqual(await readFile(join(f.wiki, `public/portraits/${id}.png`)), f.originals[id])
      const token = JSON.parse(await readFile(join(f.wiki, `public/portrait-tokens/${id}.json`)))
      assert.equal(token.image.sha256, row.previousImageSha256)
    }
    await assert.rejects(readdir(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003')), { code: 'ENOENT' })
  } finally {
    await rm(f.root, { recursive: true, force: true })
  }
})
