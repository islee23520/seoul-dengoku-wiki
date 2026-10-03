import assert from 'node:assert/strict'
import { readFile, copyFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

export async function applyApprovedPortraitSelection(sourceManifestPath, wikiRoot = root) {
  const json = async path => JSON.parse(await readFile(join(wikiRoot, path), 'utf8'))
  const selection = await json('portrait-approved-selection.json')
  assert.equal(selection.status, 'approved-selection-awaiting-asset-application')
  const manifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'))
  const catalog = await json('portrait-catalog.json')
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  const updates = []
  for (const row of selection.records) {
    const entry = catalog.entries.find(entry => entry.personId === row.personId)
    assert.ok(entry)
    assert.equal(entry.characterId, row.characterId)
    assert.equal(entry.name, row.name)
    assert.equal(registry.find(person => person.id === row.characterId)?.name, row.name)
    assert.equal(entry.imageSha256, row.previousImageSha256)
    assert.equal(row.verdict, 'pass')
    const imagePath = 'public/portraits/' + row.personId + '.png'
    const previous = await readFile(join(wikiRoot, imagePath))
    assert.equal(hash(previous), row.previousImageSha256)
    if (row.operation === 'preserve-existing') {
      assert.equal(row.imageSha256, row.previousImageSha256)
      continue
    }
    assert.ok(['localized-alpha-edit', 'body-improvement'].includes(row.operation))
    const source = manifest.find(source => source.personId === row.personId)
    assert.ok(source)
    assert.equal(source.sha256, row.imageSha256)
    const sourcePath = resolve(dirname(sourceManifestPath), source.image)
    const bytes = await readFile(sourcePath)
    assert.equal(hash(bytes), row.imageSha256)
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    const token = await json('public/portrait-tokens/' + row.personId + '.json')
    const review = await json('public/portrait-reviews/' + row.personId + '.json')
    assert.equal(token.image.sha256, row.previousImageSha256)
    assert.equal(review.imageSha256, row.previousImageSha256)
    const nextToken = structuredClone(token)
    nextToken.image.sha256 = row.imageSha256
    nextToken.image.width = bytes.readUInt32BE(16)
    nextToken.image.height = bytes.readUInt32BE(20)
    nextToken.imageReview.imageSha256 = row.imageSha256
    const nextReview = {
      schemaVersion: 1, personId: row.personId, characterId: row.characterId, imageSha256: row.imageSha256,
      ownerVerdict: { verdict: 'pass', source: row.approvalSource, gallery: row.gallery },
      imageModification: { operation: row.operation, inputSha256: row.previousImageSha256, outputSha256: row.imageSha256, generationReceiptAvailable: false, ...(row.operation === 'localized-alpha-edit' ? { originalRgbPreserved: true } : { exactReductionMeasured: false }) },
      previousImageReview: review, canonPromotion: false, final3dPortraitContractSatisfied: false,
    }
    updates.push({ row, entry, sourcePath, imagePath, token: nextToken, review: nextReview })
  }
  // Validate all selected identities and bytes before importing any replacement.
  const archive = join(wikiRoot, '.omo/evidence/approved-portrait-history-20261003')
  await mkdir(archive, { recursive: true })
  for (const update of updates) {
    const previousPath = join(archive, update.row.personId + '-' + update.row.previousImageSha256 + '.png')
    await copyFile(join(wikiRoot, update.imagePath), previousPath)
    assert.equal(hash(await readFile(previousPath)), update.row.previousImageSha256)
    await copyFile(update.sourcePath, join(wikiRoot, update.imagePath))
    assert.equal(hash(await readFile(join(wikiRoot, update.imagePath))), update.row.imageSha256)
    await writeFile(join(wikiRoot, 'public/portrait-tokens/' + update.row.personId + '.json'), JSON.stringify(update.token, null, 2) + '\n')
    await writeFile(join(wikiRoot, 'public/portrait-reviews/' + update.row.personId + '.json'), JSON.stringify(update.review, null, 2) + '\n')
    update.entry.imageSha256 = update.row.imageSha256
  }
  await writeFile(join(wikiRoot, 'portrait-catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  selection.status = 'approved-selection-applied-to-worktree'
  await writeFile(join(wikiRoot, 'portrait-approved-selection.json'), JSON.stringify(selection, null, 2) + '\n')
  return updates.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Source manifest required')
  console.log('APPROVED_PORTRAITS_APPLIED ' + await applyApprovedPortraitSelection(process.argv[2]))
}
