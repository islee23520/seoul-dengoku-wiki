import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { publicPortraitReview, publicPortraitSelection, generationEvidencePaths, portraitReviewFailures, publicPortraitStringFailures } from './portrait-public-boundary.mjs'
import { applyApprovedPortraitSelection, registerApprovedPortraits } from './apply-approved-portrait-selection.mjs'

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
  const reviewOriginals = {}
  for (const [index, row] of rows.entries()) {
    const previous = png(index)
    const replacement = png(index + 10)
    row.previousImageSha256 = sha(previous)
    row.imageSha256 = row.operation === 'preserve-existing' ? row.previousImageSha256 : sha(replacement)
    row.verdict = 'pass'
    row.approvalSource = 'fixture-owner-decision'
    row.gallery = 'fixture-gallery'
    if (row.operation === 'body-improvement') row.generationReceipt = {
      request: { schemaVersion: 1, model: 'fixture-model', prompt: 'PRIVATE_GENERATION_SENTINEL', references: [{ index: 1, role: 'style-only', sha256: row.previousImageSha256 }] },
      imageSha256: row.imageSha256,
      status: 'candidate-unreviewed',
    }
    const id = row.personId
    originals[id] = previous
    await writeFile(join(wiki, `public/portraits/${id}.png`), previous)
    await writeFile(join(wiki, `public/portrait-tokens/${id}.json`), JSON.stringify({ image: { sha256: row.previousImageSha256, width: 1, height: 1 }, imageReview: { imageSha256: row.previousImageSha256 } }))
    reviewOriginals[id] = JSON.stringify({ imageSha256: row.previousImageSha256, ownerVerdict: { verdict: 'pass' }, previousImageReview: { imageSha256: 'a'.repeat(64), generationReceipt: { request: { prompt: 'PRIVATE_HISTORY_SENTINEL' } } } })
    await writeFile(join(wiki, `public/portrait-reviews/${id}.json`), reviewOriginals[id])
    if (row.operation !== 'preserve-existing') {
      const image = `${id}.png`
      await writeFile(join(source, image), replacement)
      manifest.push({ personId: id, image, sha256: row.imageSha256, ...(row.generationReceipt ? { generationReceipt: row.generationReceipt } : {}) })
      delete row.generationReceipt
    }
  }
  await writeFile(join(wiki, 'portrait-approved-selection.json'), JSON.stringify({ status: 'approved-selection-awaiting-asset-application', records: rows }))
  await writeFile(join(wiki, 'portrait-catalog.json'), JSON.stringify({ entries: rows.map(({ personId, characterId, name, previousImageSha256 }) => ({ personId, characterId, name, imageSha256: previousImageSha256 })) }))
  await writeFile(join(wiki, 'lore/name-pools/person-id-registry.json'), JSON.stringify({ persons: rows.map(({ characterId, name }) => ({ id: characterId, name })) }))
  const manifestPath = join(source, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest))
  return { root, wiki, source, rows, originals, reviewOriginals, manifest, manifestPath }
}

test('approved application preserves history and distinguishes generated body edit from local alpha edits', async () => {
  const f = await fixture()
  try {
    assert.equal(await applyApprovedPortraitSelection(f.manifestPath, f.wiki), 2)
    const selected = JSON.parse(await readFile(join(f.wiki, 'portrait-approved-selection.json')))
    const catalog = JSON.parse(await readFile(join(f.wiki, 'portrait-catalog.json')))
    assert.equal(selected.status, 'approved-selection-applied-to-worktree')
    assert.deepEqual(generationEvidencePaths(selected), [])
    const archiveFiles = await readdir(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003'))
    const manifestBytes = await readFile(f.manifestPath)
    assert.deepEqual(await readFile(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003/source-manifest-' + sha(manifestBytes) + '.json')), manifestBytes)
    assert.equal(archiveFiles.filter(name => name.startsWith('selection-')).length, 1)
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
        assert.deepEqual(generationEvidencePaths(review), [])
        assert.deepEqual(portraitReviewFailures(review), [])
        assert.equal(await readFile(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003', id + '-review-' + sha(f.reviewOriginals[id]) + '.json'), 'utf8'), f.reviewOriginals[id])
        continue
      }
      assert.deepEqual(await readFile(join(f.wiki, `.omo/evidence/approved-portrait-history-20261003/${id}-${row.previousImageSha256}.png`)), f.originals[id])
      assert.equal(review.imageHashHistory[0], row.previousImageSha256)
      assert.deepEqual(generationEvidencePaths(review), [])
      assert.deepEqual(portraitReviewFailures(review), [])
      const archive = join(f.wiki, '.omo/evidence/approved-portrait-history-20261003')
      const originalReview = f.reviewOriginals[id]
      assert.equal(await readFile(join(archive, id + '-review-' + sha(originalReview) + '.json'), 'utf8'), originalReview)
      const privateReview = JSON.parse(await readFile(join(archive, id + '-' + row.imageSha256 + '-review.json')))
      assert.deepEqual(privateReview.previousImageReview, JSON.parse(originalReview))
      assert.equal(review.imageModification.generationReceiptAvailable, row.operation === 'body-improvement')
      if (row.operation === 'body-improvement') {
        assert.deepEqual(privateReview.generationReceipt, f.manifest.find(item => item.personId === id).generationReceipt)
        assert.equal(privateReview.generationReceipt.status, 'candidate-unreviewed')
        assert.equal(review.generationReceipt, undefined)
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
test('bad generated receipt binding rejects before any publication or history writes', async () => {
  const f = await fixture()
  try {
    f.manifest[1].generationReceipt.request.references[0].sha256 = '0'.repeat(64)
    await writeFile(f.manifestPath, JSON.stringify(f.manifest))
    await assert.rejects(applyApprovedPortraitSelection(f.manifestPath, f.wiki))
    for (const row of f.rows) {
      assert.deepEqual(await readFile(join(f.wiki, 'public/portraits/' + row.personId + '.png')), f.originals[row.personId])
      assert.equal(await readFile(join(f.wiki, 'public/portrait-reviews/' + row.personId + '.json'), 'utf8'), f.reviewOriginals[row.personId])
    }
    await assert.rejects(readdir(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003')), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})


test('real projectors reject nested payloads in declared public scalar fields', () => {
  const payload = { generationReceipt: { request: { prompt: 'PRIVATE_SENTINEL' } } }
  assert.throws(() => publicPortraitReview({ technology: payload }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  assert.throws(() => publicPortraitReview({ ownerVerdict: { verdict: payload } }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  assert.throws(() => publicPortraitReview({ imageModification: { operation: payload } }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  assert.throws(() => publicPortraitReview({ imageHashHistory: '' }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  assert.throws(() => publicPortraitSelection({ records: [{ name: payload }] }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  assert.throws(() => publicPortraitSelection({ status: payload, records: [] }), /E_PORTRAIT_PUBLIC_SCHEMA/)
})

test('malformed late review or selection row rejects with zero changed files and no archive', async () => {
  for (const target of ['replacement-review', 'preserved-review', 'selection-row']) {
    const f = await fixture()
    try {
      const payload = { generationReceipt: { request: { prompt: 'PRIVATE_SENTINEL' } } }
      if (target === 'selection-row') {
        f.rows[2].name = payload
        await writeFile(join(f.wiki, 'portrait-approved-selection.json'), JSON.stringify({ status: 'approved-selection-awaiting-asset-application', records: f.rows }))
      } else {
        const row = target === 'preserved-review' ? f.rows[0] : f.rows[2]
        if (target === 'preserved-review') {
          const records = [f.rows[1], f.rows[2], row]
          await writeFile(join(f.wiki, 'portrait-approved-selection.json'), JSON.stringify({ status: 'approved-selection-awaiting-asset-application', records }))
        }
        const review = JSON.parse(f.reviewOriginals[row.personId])
        review.technology = payload
        await writeFile(join(f.wiki, 'public/portrait-reviews/' + row.personId + '.json'), JSON.stringify(review))
      }
      async function snapshot(directory, prefix = '') {
        const files = {}
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name)
          const key = prefix + entry.name
          if (entry.isDirectory()) Object.assign(files, await snapshot(path, key + '/'))
          else files[key] = (await readFile(path)).toString('base64')
        }
        return files
      }
      const before = await snapshot(f.wiki)
      await assert.rejects(applyApprovedPortraitSelection(f.manifestPath, f.wiki), /E_PORTRAIT_PUBLIC_SCHEMA/)
      assert.deepEqual(await snapshot(f.wiki), before)
      await assert.rejects(readdir(join(f.wiki, '.omo/evidence/approved-portrait-history-20261003')), { code: 'ENOENT' })
    } finally { await rm(f.root, { recursive: true, force: true }) }
  }
})

async function registrationFixture() {
  const f = await fixture()
  const id = 'person-1019', characterId = 'K1019', name = '박성수'
  const bytes = png(20)
  const row = { personId: id, characterId, name, imageSHA: sha(bytes), width: 2, height: 3, imagePath: 'park.png', inputPath: 'input.json', receiptPath: 'receipt.json', ownerApprovalEvidence: 'approval.json', faceMode: 'unique', noGlasses: true, ownerVerdict: 'pass' }
  const identity = { personId: id, characterId, name }
  const value = value => ({ value, status: 'art-proposal', source: '/Volumes/private/PRIVATE_SENTINEL' })
  const input = { ...identity, identity: { characterId, name, gender: value('남성') }, canonicalContext: identity, faceMode: { kind: 'unique', variantId: null }, uniqueFaceRequired: true, uniqueFaceSource: { characterId }, faceSelection: null, slots: { face: { description: value('face') }, hair: { description: value('hair') }, outfit: { upper: value('coat'), lower: value(null), footwear: value(null) }, accessories: { description: value('No eyeglasses. No added facial accessories.') } } }
  const receipt = { imageSha256: row.imageSHA, request: { prompt: 'PRIVATE_GENERATION_SENTINEL', sourceSnapshot: { recipientContext: identity } } }
  const approval = { characterId, name, approvedImageSHA: row.imageSHA, selectedImageSHA: row.imageSHA, ownerVerdict: 'pass', priorApprovedImageSHA: 'a'.repeat(64), ownerMessage: 'PRIVATE_APPROVAL_SENTINEL' }
  await writeFile(join(f.source, row.imagePath), bytes)
  for (const [file, data] of [['input.json', input], ['receipt.json', receipt], ['approval.json', approval]]) await writeFile(join(f.source, file), JSON.stringify(data))
  await writeFile(join(f.source, 'registration.json'), JSON.stringify({ newPortraits: [row] }))
  const registry = JSON.parse(await readFile(join(f.wiki, 'lore/name-pools/person-id-registry.json')))
  registry.persons.push({ id: characterId, name })
  await writeFile(join(f.wiki, 'lore/name-pools/person-id-registry.json'), JSON.stringify(registry))
  await writeFile(join(f.wiki, 'lore/name-pools/gender-cast.json'), JSON.stringify({ people: [{ name, gender: '남성', user_locked: true }] }))
  await mkdir(join(f.wiki, 'public/person-details'))
  await writeFile(join(f.wiki, 'public/person-details/' + id + '.json'), JSON.stringify({ id, name, gender: '남성', title: 'role', state: 'S00', detailRoute: '/people/' + id, fields: { '캐릭터 ID': characterId } }))
  await writeFile(join(f.wiki, 'portrait-properties.json'), JSON.stringify({ entries: {} }))
  return { ...f, row, input, receipt, approval, registrationPath: join(f.source, 'registration.json'), bytes }
}

async function fileSnapshot(directory, prefix = '') {
  const files = {}
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), key = prefix + entry.name
    if (entry.isDirectory()) Object.assign(files, await fileSnapshot(path, key + '/'))
    else files[key] = (await readFile(path)).toString('base64')
  }
  return files
}

test('explicit new registration projects actual input values and archives complete private bytes', async () => {
  const f = await registrationFixture()
  try {
    const before = await fileSnapshot(f.wiki)
    assert.equal(await registerApprovedPortraits(f.registrationPath, f.wiki), 1)
    const token = JSON.parse(await readFile(join(f.wiki, 'public/portrait-tokens/person-1019.json')))
    assert.equal(token.artProposal.face, f.input.slots.face.description.value)
    assert.equal(token.facts.genderUserLocked, true)
    assert.equal(token.image.sha256, f.row.imageSHA)
    assert.deepEqual(await readFile(join(f.wiki, 'public/portraits/person-1019.png')), f.bytes)
    const selection = JSON.parse(await readFile(join(f.wiki, 'portrait-approved-selection.json')))
    assert.equal(selection.records.at(-1).operation, 'register-approved')
    const review = JSON.parse(await readFile(join(f.wiki, 'public/portrait-reviews/person-1019.json')))
    assert.deepEqual(portraitReviewFailures(review), [])
    assert.deepEqual(review.imageHashHistory, [f.approval.priorApprovedImageSHA])
    assert.doesNotMatch(JSON.stringify({ token, selection, review }), /PRIVATE_|\/Volumes\//)
    const after = await fileSnapshot(f.wiki)
    for (const [file, bytes] of Object.entries(before)) if (file.startsWith('public/') || file.startsWith('lore/')) assert.equal(after[file], bytes)
    const archive = join(f.wiki, '.omo/evidence/approved-portrait-registration')
    for (const key of ['inputPath', 'receiptPath', 'ownerApprovalEvidence']) {
      const bytes = await readFile(join(f.source, f.row[key]))
      assert.deepEqual(await readFile(join(archive, 'person-1019-' + key + '-' + sha(bytes) + '.json')), bytes)
    }
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('new registration rejects collision identity hash dimensions and unsafe late values without writes', async () => {
  for (const target of ['collision', 'identity', 'hash', 'dimensions', 'late-row', 'unsafe-face', 'approval']) {
    const f = await registrationFixture()
    try {
      if (target === 'collision') {
        const catalog = JSON.parse(await readFile(join(f.wiki, 'portrait-catalog.json')))
        catalog.entries.push({ personId: f.row.personId, characterId: f.row.characterId })
        await writeFile(join(f.wiki, 'portrait-catalog.json'), JSON.stringify(catalog))
      }
      if (target === 'identity') f.input.characterId = 'K1020'
      if (target === 'hash') f.row.imageSHA = '0'.repeat(64)
      if (target === 'dimensions') f.row.height = 4
      if (target === 'unsafe-face') f.input.slots.face.description.value = { generationRequest: { prompt: 'PRIVATE_SENTINEL' } }
      if (target === 'approval') f.approval.selectedImageSHA = '0'.repeat(64)
      await writeFile(join(f.source, 'input.json'), JSON.stringify(f.input))
      await writeFile(join(f.source, 'approval.json'), JSON.stringify(f.approval))
      await writeFile(f.registrationPath, JSON.stringify({ newPortraits: target === 'late-row' ? [f.row, { ...f.row, name: { generationReceipt: 'PRIVATE_SENTINEL' } }] : [f.row] }))
      const before = await fileSnapshot(f.wiki)
      await assert.rejects(registerApprovedPortraits(f.registrationPath, f.wiki))
      assert.deepEqual(await fileSnapshot(f.wiki), before)
      await assert.rejects(readdir(join(f.wiki, '.omo')), { code: 'ENOENT' })
    } finally { await rm(f.root, { recursive: true, force: true }) }
  }
})

test('complete replacement manifest rejects duplicate and extraneous late sources before writes', async () => {
  for (const target of ['duplicate', 'extraneous', 'missing-image', 'missing-receipt', 'missing-row']) {
    const f = await fixture()
    try {
      if (target === 'duplicate') f.manifest.push({ ...f.manifest[0], sha256: '0'.repeat(64) })
      if (target === 'extraneous') f.manifest.push({ personId: 'person-1019', image: 'missing.png', sha256: 'bad' })
      if (target === 'missing-image') f.manifest[1].image = 'missing.png'
      if (target === 'missing-receipt') delete f.manifest[1].generationReceipt
      if (target === 'missing-row') f.manifest.pop()
      await writeFile(f.manifestPath, JSON.stringify(f.manifest))
      const before = await fileSnapshot(f.root)
      await assert.rejects(applyApprovedPortraitSelection(f.manifestPath, f.wiki))
      assert.deepEqual(await fileSnapshot(f.root), before)
      await assert.rejects(readdir(join(f.wiki, '.omo')), { code: 'ENOENT' })
    } finally { await rm(f.root, { recursive: true, force: true }) }
  }
})

test('public emitted scalar strings reject private paths and credentials but retain URLs and names', () => {
  for (const value of ['/Users/private/x', '/Volumes/private/x', 'C:\\private\\x', '\\\\server\\private\\x', '.omo/evidence/x', '/tmp/private/x', 'file:///Users/private/x', 'file:/Users/private/source.png', 'source=file:/Users/private/x', 'file://host/private/x', '//server/private/source.png', 'source=/Users/private/x', 'OPENAI_API_KEY=secret', 'Authorization: Bearer secret']) {
    for (const review of [{ technology: value }, { ownerVerdict: { verdict: value } }, { imageModification: { operation: value } }]) assert.throws(() => publicPortraitReview(review), /E_PORTRAIT_PUBLIC_SCHEMA/)
    assert.throws(() => publicPortraitSelection({ records: [{ name: value }] }), /E_PORTRAIT_PUBLIC_SCHEMA/)
    assert.throws(() => publicPortraitSelection({ status: value, records: [] }), /E_PORTRAIT_PUBLIC_SCHEMA/)
  }
  assert.equal(publicPortraitReview({ technology: 'https://example.org/technology' }).technology, 'https://example.org/technology')
  assert.equal(publicPortraitReview({ technology: '2D / 3D' }).technology, '2D / 3D')
  for (const technology of ['2D/3D', 'alpha-edit/pass', 'https://commons.wikimedia.org/wiki/File:Portrait.png', 'https://example.org/profile:portrait']) assert.equal(publicPortraitReview({ technology }).technology, technology)
  assert.deepEqual(publicPortraitStringFailures({ image: { path: '/portraits/person-1019.png' }, imageReview: { record: '/portrait-reviews/person-1019.json' } }, 'token'), [])
  assert.deepEqual(publicPortraitStringFailures({ facts: { role: '/portraits/person-1019.png' } }, 'token'), ['token.facts.role'])
  assert.equal(publicPortraitSelection({ records: [{ name: '박성수', verdict: 'pass' }] }).records[0].name, '박성수')
})

test('late unsafe public strings reject both actual producers with complete fixture unchanged', async () => {
  for (const value of ['/Users/private/x', '/Volumes/private/x', 'C:\\private\\x', '.omo/evidence/x', 'file:///Users/private/x', 'file:/Users/private/source.png', '//server/private/source.png', 'source=/Users/private/x']) {
    for (const operation of ['replacement', 'registration']) {
      const f = operation === 'replacement' ? await fixture() : await registrationFixture()
      try {
        if (operation === 'replacement') {
          const path = join(f.wiki, 'public/portrait-reviews/person-0001.json')
          const review = JSON.parse(await readFile(path))
          review.technology = value
          await writeFile(path, JSON.stringify(review))
        } else {
          const path = join(f.wiki, 'public/person-details/person-1019.json')
          const detail = JSON.parse(await readFile(path))
          detail.title = value
          await writeFile(path, JSON.stringify(detail))
        }
        const before = await fileSnapshot(f.root)
        const fs = await import('node:fs/promises')
        let writes = 0
        globalThis.__portraitNoWriteFs = { ...fs }
        for (const key of ['mkdir', 'copyFile', 'writeFile']) globalThis.__portraitNoWriteFs[key] = (...args) => { writes++; return fs[key](...args) }
        const helperURL = 'data:text/javascript;base64,' + Buffer.from(await readFile(new URL('./portrait-public-boundary.mjs', import.meta.url), 'utf8')).toString('base64')
        const source = (await readFile(new URL('./apply-approved-portrait-selection.mjs', import.meta.url), 'utf8'))
          .replace("import { readFile, copyFile, mkdir, writeFile, access } from 'node:fs/promises'", 'const { readFile, copyFile, mkdir, writeFile, access } = globalThis.__portraitNoWriteFs')
          .replace("'./portrait-public-boundary.mjs'", JSON.stringify(helperURL))
          .replace("const root = fileURLToPath(new URL('../', import.meta.url))", `const root = ${JSON.stringify(f.wiki)}`)
          .split('if (process.argv[1]')[0]
        const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
        await assert.rejects(operation === 'replacement' ? api.applyApprovedPortraitSelection(f.manifestPath, f.wiki) : api.registerApprovedPortraits(f.registrationPath, f.wiki), /E_PORTRAIT_PUBLIC_SCHEMA/)
        assert.equal(writes, 0)
        delete globalThis.__portraitNoWriteFs
        assert.deepEqual(await fileSnapshot(f.root), before)
        await assert.rejects(readdir(join(f.wiki, '.omo')), { code: 'ENOENT' })
      } finally { await rm(f.root, { recursive: true, force: true }) }
    }
  }
})

test('replacement writes preflighted bytes even when private source changes at archive creation', async () => {
  const f = await fixture()
  const key = '__portraitPreflightFs'
  try {
    const sourcePath = join(f.source, f.manifest[0].image)
    const verified = await readFile(sourcePath)
    let changed = false
    globalThis[key] = {
      readFile, writeFile, access: (await import('node:fs/promises')).access,
      copyFile: (await import('node:fs/promises')).copyFile,
      mkdir: async (path, options) => {
        if (path.endsWith('approved-portrait-history-20261003')) {
          await writeFile(sourcePath, png(99))
          changed = true
        }
        return mkdir(path, options)
      },
    }
    const helper = await readFile(new URL('./portrait-public-boundary.mjs', import.meta.url), 'utf8')
    const helperURL = 'data:text/javascript;base64,' + Buffer.from(helper).toString('base64')
    const source = (await readFile(new URL('./apply-approved-portrait-selection.mjs', import.meta.url), 'utf8'))
      .replace("import { readFile, copyFile, mkdir, writeFile, access } from 'node:fs/promises'", `const { readFile, copyFile, mkdir, writeFile, access } = globalThis.${key}`)
      .replace("'./portrait-public-boundary.mjs'", JSON.stringify(helperURL))
      .replace("const root = fileURLToPath(new URL('../', import.meta.url))", `const root = ${JSON.stringify(f.wiki)}`)
      .split('if (process.argv[1]')[0]
    const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
    assert.equal(await api.applyApprovedPortraitSelection(f.manifestPath, f.wiki), 2)
    assert.equal(changed, true)
    assert.notDeepEqual(await readFile(sourcePath), verified)
    assert.deepEqual(await readFile(join(f.wiki, 'public/portraits/person-0399.png')), verified)
  } finally {
    delete globalThis[key]
    await rm(f.root, { recursive: true, force: true })
  }
})

test('HTTPS paths containing File preserve values through both real producers', async () => {
  for (const value of ['https://commons.wikimedia.org/wiki/File:Portrait.png', 'https://example.org/profile:portrait']) {
    for (const operation of ['replacement', 'registration']) {
      const f = operation === 'replacement' ? await fixture() : await registrationFixture()
      try {
        if (operation === 'replacement') {
          const path = join(f.wiki, 'public/portrait-reviews/person-0001.json')
          const review = JSON.parse(await readFile(path))
          review.technology = value
          await writeFile(path, JSON.stringify(review))
          assert.equal(await applyApprovedPortraitSelection(f.manifestPath, f.wiki), 2)
          assert.equal(JSON.parse(await readFile(path)).technology, value)
        } else {
          const path = join(f.wiki, 'public/person-details/person-1019.json')
          const detail = JSON.parse(await readFile(path))
          detail.title = value
          await writeFile(path, JSON.stringify(detail))
          assert.equal(await registerApprovedPortraits(f.registrationPath, f.wiki), 1)
          assert.equal(JSON.parse(await readFile(join(f.wiki, 'public/portrait-tokens/person-1019.json'))).facts.role, value)
        }
      } finally { await rm(f.root, { recursive: true, force: true }) }
    }
  }
})
