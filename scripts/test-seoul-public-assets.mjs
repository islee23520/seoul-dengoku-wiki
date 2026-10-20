import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { legacyPublicManifest, manifestForPublicFiles, publishPublicAssets, retirementCandidates } from './seoul-public-assets.mjs'

test('approved staging retires only exact owned legacy files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'seoul-assets-'))
  t.after(async () => { const { rm } = await import('node:fs/promises'); await rm(root, { recursive: true, force: true }) })
  const publicRoot = join(root, 'public')
  await mkdir(publicRoot)
  await writeFile(join(publicRoot, 'outside-control-2126.json'), 'legacy')
  await writeFile(join(publicRoot, 'personal-notes.json'), 'mine')
  const manifestPath = join(root, 'public-assets-manifest.json')
  const previous = legacyPublicManifest(['outside-control-2126.json', 'personal-notes.json'])
  const generated = manifestForPublicFiles(['opening-territories.json'])
  assert.deepEqual(previous.files, ['outside-control-2126.json'])
  await assert.rejects(publishPublicAssets({ publicRoot, manifestPath, previous, generated,
    stage: async () => { throw new Error('E_STAGE_FAILED') },
  }), /E_STAGE_FAILED/)
  assert.equal(await readFile(join(publicRoot, 'outside-control-2126.json'), 'utf8'), 'legacy')
  await publishPublicAssets({ publicRoot, manifestPath, previous, generated,
    stage: () => writeFile(join(publicRoot, 'opening-territories.json'), '{}'),
  })
  await assert.rejects(readFile(join(publicRoot, 'outside-control-2126.json')), { code: 'ENOENT' })
  assert.equal(await readFile(join(publicRoot, 'personal-notes.json'), 'utf8'), 'mine')
  assert.deepEqual(JSON.parse(await readFile(manifestPath, 'utf8')), generated)
  assert.equal(retirementCandidates(previous, generated).length, 1)
  assert.deepEqual(generated.files.filter(path => /outside|regional|northern|terrain|admin-territorial/.test(path)), [])
})

test('rejects unknown roots, traversal, symlinks, and duplicate ownership', async t => {
  for (const path of ['../outside-control-2126.json', 'foreign.json', '/outside-control-2126.json', 'regional-terrain-tiles/../x.bin', 'regional-terrain-tiles/evil.bin']) {
    assert.throws(() => manifestForPublicFiles([path]), /E_PUBLIC_ASSET_PATH/)
  }
  assert.throws(() => retirementCandidates({ files: ['outside-control-2126.json', 'outside-control-2126.json'] }, { files: [] }), /E_PUBLIC_ASSET_DUPLICATE/)
  const root = await mkdtemp(join(tmpdir(), 'seoul-assets-link-'))
  t.after(async () => { const { rm } = await import('node:fs/promises'); await rm(root, { recursive: true, force: true }) })
  const publicRoot = join(root, 'public')
  await mkdir(publicRoot)
  await symlink(join(root, 'user-file'), join(publicRoot, 'outside-control-2126.json'))
  await writeFile(join(root, 'user-file'), 'mine')
  await assert.rejects(publishPublicAssets({ publicRoot, manifestPath: join(root, 'manifest.json'),
    previous: { files: ['outside-control-2126.json'] }, generated: { files: [] }, stage: async () => {},
  }), /E_PUBLIC_ASSET_SYMLINK/)
  assert.equal(await readFile(join(root, 'user-file'), 'utf8'), 'mine')
})
