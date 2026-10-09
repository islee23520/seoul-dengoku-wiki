import assert from 'node:assert/strict'
import { readFile, copyFile, mkdir, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { publicPortraitReview, publicPortraitSelection, publicPortraitStringFailures } from './portrait-public-boundary.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

// This imports an already approved exact image; it does not evaluate artwork.
export async function registerApprovedPortraits(sourceManifestPath, wikiRoot = root) {
  const json = async path => JSON.parse(await readFile(join(wikiRoot, path), 'utf8'))
  const manifestBytes = await readFile(sourceManifestPath)
  const manifest = JSON.parse(manifestBytes)
  assert.ok(Array.isArray(manifest.newPortraits))
  const catalogBytes = await readFile(join(wikiRoot, 'portrait-catalog.json'))
  const selectionBytes = await readFile(join(wikiRoot, 'portrait-approved-selection.json'))
  const propertiesBytes = await readFile(join(wikiRoot, 'portrait-properties.json'))
  const catalog = JSON.parse(catalogBytes)
  const selection = publicPortraitSelection(JSON.parse(selectionBytes))
  const properties = JSON.parse(propertiesBytes)
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  const genders = (await json('lore/name-pools/gender-cast.json')).people
  const updates = []
  for (const row of manifest.newPortraits) {
    assert.match(row.personId, /^person-[0-9]{4}$/)
    assert.match(row.characterId, /^K[0-9]{3,4}$/)
    assert.equal(typeof row.name, 'string')
    assert.ok(!catalog.entries.some(entry => entry.personId === row.personId || entry.characterId === row.characterId))
    assert.ok(!selection.records.some(entry => entry.personId === row.personId || entry.characterId === row.characterId))
    assert.ok(!updates.some(entry => entry.row.personId === row.personId || entry.row.characterId === row.characterId))
    assert.equal(properties.entries[row.personId], undefined)
    for (const path of [`public/portraits/${row.personId}.png`, `public/portrait-tokens/${row.personId}.json`, `public/portrait-reviews/${row.personId}.json`]) {
      await assert.rejects(access(join(wikiRoot, path)), { code: 'ENOENT' })
    }
    const detail = await json(`public/person-details/${row.personId}.json`)
    assert.equal(registry.find(person => person.id === row.characterId)?.name, row.name)
    assert.equal(detail.id, row.personId)
    assert.equal(detail.name, row.name)
    if (detail.fields['캐릭터 ID'] !== undefined) assert.equal(detail.fields['캐릭터 ID'], row.characterId)
    assert.equal(detail.detailRoute, '/people/' + row.personId)
    const gender = genders.find(person => person.name === row.name)
    assert.equal(detail.gender, gender?.gender)
    const privateFiles = {}
    for (const key of ['imagePath', 'inputPath', 'receiptPath', 'ownerApprovalEvidence']) privateFiles[key] = await readFile(resolve(dirname(sourceManifestPath), row[key]))
    const bytes = privateFiles.imagePath
    assert.equal(hash(bytes), row.imageSHA)
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR')
    assert.ok(Number.isInteger(row.width) && row.width > 0)
    assert.ok(Number.isInteger(row.height) && row.height > 0)
    assert.equal(bytes.readUInt32BE(16), row.width)
    assert.equal(bytes.readUInt32BE(20), row.height)
    const input = JSON.parse(privateFiles.inputPath)
    const receipt = JSON.parse(privateFiles.receiptPath)
    const approval = JSON.parse(privateFiles.ownerApprovalEvidence)
    for (const value of [input, input.identity, input.canonicalContext, receipt.request.sourceSnapshot.recipientContext, approval]) {
      assert.equal(value.characterId, row.characterId)
      assert.equal(value.name, row.name)
    }
    assert.equal(input.personId, row.personId)
    assert.equal(input.canonicalContext.personId, row.personId)
    assert.equal(receipt.request.sourceSnapshot.recipientContext.personId, row.personId)
    assert.equal(input.identity.gender.value, gender.gender)
    assert.equal(input.faceMode.kind, 'unique')
    assert.equal(input.uniqueFaceRequired, true)
    assert.equal(input.uniqueFaceSource.characterId, row.characterId)
    assert.equal(input.faceSelection, null)
    assert.equal(row.faceMode, 'unique')
    assert.equal(row.noGlasses, true)
    assert.equal(receipt.imageSha256, row.imageSHA)
    assert.equal(approval.approvedImageSHA, row.imageSHA)
    assert.equal(approval.selectedImageSHA, row.imageSHA)
    assert.equal(approval.ownerVerdict, row.ownerVerdict)
    assert.equal(row.ownerVerdict, 'pass')
    for (const group of Object.values(input.slots)) for (const field of Object.values(group)) {
      assert.ok(field && typeof field === 'object' && !Array.isArray(field), 'E_PORTRAIT_PUBLIC_SCHEMA: slot field')
      assert.ok(typeof field.value === 'string' || field.value === null, 'E_PORTRAIT_PUBLIC_SCHEMA: slot value')
      assert.equal(typeof field.status, 'string')
      assert.ok(typeof field.source === 'string' || field.source === null)
      assert.deepEqual(Object.keys(field).sort(), ['source', 'status', 'value'])
    }
    const artProposal = { face: input.slots.face.description.value, hair: input.slots.hair.description.value, upper: input.slots.outfit.upper.value, lower: input.slots.outfit.lower.value, footwear: input.slots.outfit.footwear.value }
    for (const [key, value] of Object.entries(artProposal)) {
      assert.ok(typeof value === 'string' || (['lower', 'footwear'].includes(key) && value === null), 'E_PORTRAIT_PUBLIC_SCHEMA: artProposal.' + key)
      if (typeof value === 'string') assert.doesNotMatch(value, /(?:\/Users\/|\/Volumes\/|\.omo\/|generationRequest|generationReceipt|PRIVATE_SENTINEL)/)
    }
    assert.match(input.slots.accessories.description.value, /No eyeglasses\./)
    const review = publicPortraitReview({ schemaVersion: 1, personId: row.personId, characterId: row.characterId, imageSha256: row.imageSHA, ownerVerdict: { verdict: row.ownerVerdict }, ...(approval.priorApprovedImageSHA === undefined ? {} : { imageHashHistory: [approval.priorApprovedImageSHA] }), canonPromotion: false, final3dPortraitContractSatisfied: false })
    const token = { schemaVersion: 1, personId: row.personId, characterId: row.characterId, name: row.name, stateId: detail.state === 'S00' ? null : detail.state, approval: 'art-proposal', facts: { gender: gender.gender, genderUserLocked: gender.user_locked, role: detail.title }, artProposal, style: { referenceSha256: null, portraitShotId: 'medium-close-up-119' }, image: { path: '/portraits/' + row.personId + '.png', sha256: row.imageSHA, width: row.width, height: row.height }, imageReview: { record: '/portrait-reviews/' + row.personId + '.json', imageSha256: row.imageSHA, verdict: row.ownerVerdict } }
    assert.equal(typeof token.facts.role, 'string')
    assert.equal(typeof token.facts.genderUserLocked, 'boolean')
    assert.deepEqual(publicPortraitStringFailures(token, 'token'), [], 'E_PORTRAIT_PUBLIC_SCHEMA: token strings')
    selection.records.push({ personId: row.personId, characterId: row.characterId, name: row.name, imageSha256: row.imageSHA, verdict: row.ownerVerdict, operation: 'register-approved' })
    updates.push({ row, privateFiles, token, review })
  }
  publicPortraitSelection(selection)
  // All identities, source bytes and public projections are validated before writes.
  const archive = join(wikiRoot, '.omo/evidence/approved-portrait-registration')
  await mkdir(archive, { recursive: true })
  for (const [name, bytes] of [['manifest', manifestBytes], ['catalog', catalogBytes], ['selection', selectionBytes], ['properties', propertiesBytes]]) await writeFile(join(archive, name + '-' + hash(bytes) + '.json'), bytes)
  for (const { row, privateFiles, token, review } of updates) {
    for (const [key, bytes] of Object.entries(privateFiles)) await writeFile(join(archive, row.personId + '-' + key + '-' + hash(bytes) + (key === 'imagePath' ? '.png' : '.json')), bytes)
    await writeFile(join(wikiRoot, `public/portraits/${row.personId}.png`), privateFiles.imagePath)
    await writeFile(join(wikiRoot, `public/portrait-tokens/${row.personId}.json`), JSON.stringify(token, null, 2) + '\n')
    await writeFile(join(wikiRoot, `public/portrait-reviews/${row.personId}.json`), JSON.stringify(review, null, 2) + '\n')
    catalog.entries.push({ personId: row.personId, characterId: row.characterId, name: row.name, stateId: token.stateId, approval: token.approval, imageSha256: row.imageSHA })
    properties.entries[row.personId] = { face: token.artProposal.face, hair: token.artProposal.hair, upper: token.artProposal.upper }
  }
  await writeFile(join(wikiRoot, 'portrait-catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  await writeFile(join(wikiRoot, 'portrait-properties.json'), JSON.stringify(properties, null, 2) + '\n')
  await writeFile(join(wikiRoot, 'portrait-approved-selection.json'), JSON.stringify(selection, null, 2) + '\n')
  return updates.length
}

export async function applyApprovedPortraitSelection(sourceManifestPath, wikiRoot = root) {
  const json = async path => JSON.parse(await readFile(join(wikiRoot, path), 'utf8'))
  const selection = await json('portrait-approved-selection.json')
  const publicSelection = publicPortraitSelection(selection)
  assert.equal(selection.status, 'approved-selection-awaiting-asset-application')
  const selectionBytes = await readFile(join(wikiRoot, 'portrait-approved-selection.json'))
  const manifestBytes = await readFile(sourceManifestPath)
  const manifest = JSON.parse(manifestBytes)
  const catalog = await json('portrait-catalog.json')
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  assert.ok(Array.isArray(manifest))
  const selectedSources = new Map()
  const selectedIds = new Set()
  for (const row of selection.records) {
    assert.ok(!selectedIds.has(row.personId), 'Duplicate selected identity')
    selectedIds.add(row.personId)
  }
  for (const source of manifest) {
    assert.ok(source && typeof source === 'object' && !Array.isArray(source))
    assert.deepEqual(Object.keys(source).filter(key => !['personId', 'image', 'sha256', 'generationReceipt'].includes(key)), [])
    assert.match(source.personId, /^person-[0-9]{4}$/)
    assert.ok(!selectedSources.has(source.personId), 'Duplicate source identity')
    const row = selection.records.find(row => row.personId === source.personId && row.operation !== 'preserve-existing')
    assert.ok(row, 'Extraneous source identity')
    assert.equal(typeof source.image, 'string')
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
    assert.equal(source.sha256, row.imageSha256)
    const sourcePath = resolve(dirname(sourceManifestPath), source.image)
    const bytes = await readFile(sourcePath)
    assert.equal(hash(bytes), source.sha256)
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR')
    assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0)
    if (row.operation === 'body-improvement') {
      assert.ok(source.generationReceipt)
      assert.equal(source.generationReceipt.imageSha256, row.imageSha256)
      assert.equal(source.generationReceipt.request.references[0].sha256, row.previousImageSha256)
      assert.equal(source.generationReceipt.status, 'candidate-unreviewed')
    } else assert.equal(source.generationReceipt, undefined)
    selectedSources.set(source.personId, { source, bytes })
  }
  assert.equal(selectedSources.size, selection.records.filter(row => row.operation !== 'preserve-existing').length)
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
      const reviewBytes = await readFile(join(wikiRoot, 'public/portrait-reviews/' + row.personId + '.json'))
      const review = JSON.parse(reviewBytes)
      const publicReview = publicPortraitReview(review)
      assert.equal(review.imageSha256, row.imageSha256)
      const token = await json('public/portrait-tokens/' + row.personId + '.json')
      assert.equal(token.image.sha256, row.imageSha256)
      assert.deepEqual(publicPortraitStringFailures(token, 'token'), [], 'E_PORTRAIT_PUBLIC_SCHEMA: token strings')
      updates.push({ row, entry, imagePath, reviewBytes, token, review, publicReview })
      continue
    }
    assert.ok(['localized-alpha-edit', 'body-improvement'].includes(row.operation))
    const { source, bytes } = selectedSources.get(row.personId)
    const token = await json('public/portrait-tokens/' + row.personId + '.json')
    const reviewBytes = await readFile(join(wikiRoot, 'public/portrait-reviews/' + row.personId + '.json'))
    const review = JSON.parse(reviewBytes)
    publicPortraitReview(review)
    assert.equal(token.image.sha256, row.previousImageSha256)
    assert.equal(review.imageSha256, row.previousImageSha256)
    const nextToken = structuredClone(token)
    nextToken.image.sha256 = row.imageSha256
    nextToken.image.width = bytes.readUInt32BE(16)
    nextToken.image.height = bytes.readUInt32BE(20)
    nextToken.imageReview.imageSha256 = row.imageSha256
    assert.deepEqual(publicPortraitStringFailures(nextToken, 'token'), [], 'E_PORTRAIT_PUBLIC_SCHEMA: token strings')
    const nextReview = {
      schemaVersion: 1, personId: row.personId, characterId: row.characterId, imageSha256: row.imageSha256,
      ownerVerdict: { verdict: 'pass', source: row.approvalSource, gallery: row.gallery },
      imageModification: { operation: row.operation, inputSha256: row.previousImageSha256, outputSha256: row.imageSha256, generationReceiptAvailable: row.operation === 'body-improvement', ...(row.operation === 'localized-alpha-edit' ? { originalRgbPreserved: true } : { exactReductionMeasured: false }) },
      ...(row.operation === 'body-improvement' ? { generationRequest: source.generationReceipt.request, generationReceipt: source.generationReceipt } : {}),
      previousImageReview: review, canonPromotion: false, final3dPortraitContractSatisfied: false,
    }
    updates.push({ row, entry, bytes, imagePath, reviewBytes, token: nextToken, review: nextReview, publicReview: publicPortraitReview(nextReview) })
  }
  // Validate all selected identities and bytes before importing any replacement.
  const archive = join(wikiRoot, '.omo/evidence/approved-portrait-history-20261003')
  await mkdir(archive, { recursive: true })
  await writeFile(join(archive, 'selection-' + hash(selectionBytes) + '.json'), selectionBytes)
  await writeFile(join(archive, 'source-manifest-' + hash(manifestBytes) + '.json'), manifestBytes)
  for (const update of updates) {
    const reviewPath = join(archive, update.row.personId + '-review-' + hash(update.reviewBytes) + '.json')
    await writeFile(reviewPath, update.reviewBytes)
    assert.deepEqual(await readFile(reviewPath), update.reviewBytes)
    await writeFile(join(archive, update.row.personId + '-' + update.row.imageSha256 + '-review.json'), JSON.stringify(update.review, null, 2) + '\n')
    const previousPath = join(archive, update.row.personId + '-' + update.row.previousImageSha256 + '.png')
    await copyFile(join(wikiRoot, update.imagePath), previousPath)
    assert.equal(hash(await readFile(previousPath)), update.row.previousImageSha256)
    if (update.row.operation !== 'preserve-existing') await writeFile(join(wikiRoot, update.imagePath), update.bytes)
    assert.equal(hash(await readFile(join(wikiRoot, update.imagePath))), update.row.imageSha256)
    await writeFile(join(wikiRoot, 'public/portrait-tokens/' + update.row.personId + '.json'), JSON.stringify(update.token, null, 2) + '\n')
    await writeFile(join(wikiRoot, 'public/portrait-reviews/' + update.row.personId + '.json'), JSON.stringify(update.publicReview, null, 2) + '\n')
    update.entry.imageSha256 = update.row.imageSha256
  }
  await writeFile(join(wikiRoot, 'portrait-catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  publicSelection.status = 'approved-selection-applied-to-worktree'
  await writeFile(join(wikiRoot, 'portrait-approved-selection.json'), JSON.stringify(publicSelection, null, 2) + '\n')
  return updates.filter(update => update.row.operation !== 'preserve-existing').length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Source manifest required')
  console.log('APPROVED_PORTRAITS_APPLIED ' + await applyApprovedPortraitSelection(process.argv[2]))
}
