import { afterAll as closeInputFixture } from 'vitest'
const inputRoot = new URL('../', import.meta.url).pathname
const { openPublicationDatabaseInputs } = await import('./document-store/publication-database-inputs.mjs')
const inputConfig = JSON.parse(await readDiskFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG ?? new URL('../.omo/private/seoul-migration/sqlite-authority-20261021/publication-config.json', import.meta.url), 'utf8'))
const inputBundle = await openPublicationDatabaseInputs(inputRoot, inputConfig)
const readFile = async (path, encoding) => {
  const absolute = path instanceof URL ? path.pathname : path
  if (!absolute.startsWith(inputRoot + 'lore/')) return readDiskFile(path, encoding)
  const bytes = await inputBundle.inputs.readBytes(absolute)
  return encoding === 'utf8' ? bytes.toString() : bytes
}
closeInputFixture(() => inputBundle.close())
import { execFile } from 'node:child_process'
import { mkdtemp, readFile as readDiskFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

import { validatorPredecessorReader } from './seoul-census.mjs'
import { readProjectionPredecessor, sha256 } from './projection-refresh-successor.mjs'
import { evidenceReader } from './document-store/evidence-reader.mjs'
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './document-store/evidence.mjs'

const root = resolve(import.meta.dirname, '..')
const revision = 'e9c12a43728a599c371d373088e177a446ff5051'
const aliasPath = 'lore/places/test-station-alias-candidates.mjs'
const aliasHash = '18fc455a69d053b742b2c6611456e80594aea45c857e3eafe9eb2b3e066ba256'
const projectionPath = 'lore/Operating-Houses.json'
const projectionHash = '88fa87546e656d961005cd9aa1e35855ebdf18ff72d459f1bee3f42db1c5b5ca'
const exec = promisify(execFile)
const git = async (cwd, ...args) => (await exec('git', args, { cwd, encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 })).stdout

it('projection preimages use sealed SQLite historical evidence without a Git checkout and still reject wrong bytes', async () => {
  const historical = inputBundle.inputs.readBytes.readHistorical
  const bytes = await historical(revision, projectionPath, root)
  const sealedRoot = resolve(tmpdir(), 'projection-no-git-repository')
  const reader = Object.assign(async () => { throw new Error('current source read forbidden') }, {
    readHistorical: async (selectedRevision, path, repository) => {
      expect([selectedRevision, path, repository]).toEqual([revision, projectionPath, sealedRoot])
      return bytes
    },
  })
  expect(await readProjectionPredecessor(sealedRoot, projectionPath, projectionHash, 'E_PROJECTION_BEFORE_HASH', reader)).toEqual(bytes)
  reader.readHistorical = async () => Buffer.from('changed historical evidence')
  await expect(readProjectionPredecessor(sealedRoot, projectionPath, projectionHash, 'E_PROJECTION_BEFORE_HASH', reader))
    .rejects.toThrow('E_PROJECTION_BEFORE_HASH')
})

describe('fixed historical predecessor references', () => {
  it('keeps alias and projection preimages after HEAD advances and rejects replaced historical bytes', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'seoul-fixed-predecessor-'))
    const fixture = resolve(directory, 'repo')
    try {
      await git(directory, 'clone', '--shared', '--no-checkout', '--quiet', root, fixture)
      await git(fixture, 'update-ref', 'HEAD', revision)
      const currentAlias = await readFile(resolve(root, aliasPath))
      expect(sha256(currentAlias)).toBe('916bb07d96ca2194595c4d2005d4f517b5eceb03e4fee69fcfe80795b5297e7b')
      const markerPath = resolve(fixture, 'injected-marker')
      const marker = Buffer.from('injected mutation')
      const reader = async path => {
        if (path === resolve(fixture, aliasPath)) return currentAlias
        if (path === markerPath) return marker
        throw Object.assign(new Error('missing fixture input'), { code: 'ENOENT' })
      }
      reader.appliedDiskOverrides = new Map([['inherited', 'unchanged']])
      reader.currentAuthorityReader = reader
      const first = await validatorPredecessorReader(fixture, reader)
      expect(sha256(await first(resolve(fixture, aliasPath)))).toBe(aliasHash)
      const evidencePath = resolve(directory, 'predecessor.sqlite')
      let evidence = openEvidenceStore(evidencePath, {
        capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false,
      })
      try {
        evidence.importBatch([{ identity: 'alias-predecessor', logicalPath: aliasPath,
          revision, kind: 'archive', bytes: await first(resolve(fixture, aliasPath)),
          sha256: aliasHash, references: [] }])
        evidence.close()
        evidence = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY })
        const sealedRoot = resolve(directory, 'no-repository')
        const sealed = async path => reader(resolve(fixture, path.slice(sealedRoot.length + 1)))
        sealed.readHistorical = evidenceReader(evidence, {
          root: sealedRoot, bindings: new Map(), historicalBindings: new Map([
            [`${revision}:${aliasPath}`, { identity: 'alias-predecessor', sha256: aliasHash }],
          ]),
        }).readHistorical
        sealed.appliedDiskOverrides = reader.appliedDiskOverrides
        sealed.currentAuthorityReader = sealed
        const replay = await validatorPredecessorReader(sealedRoot, sealed)
        expect(await replay(resolve(sealedRoot, aliasPath))).toEqual(await first(resolve(fixture, aliasPath)))
        expect(replay.readHistorical).toBe(sealed.readHistorical)
        expect(replay.currentAuthorityReader).toBe(sealed)
        expect(replay.appliedDiskOverrides).toEqual(reader.appliedDiskOverrides)
        sealed.readHistorical = async () => marker
        await expect(validatorPredecessorReader(sealedRoot, sealed)).rejects.toMatchObject({ code: 'E_REVIEW_HASH' })
        sealed.readHistorical = evidenceReader(evidence, { root: sealedRoot, bindings: new Map() }).readHistorical
        await expect(validatorPredecessorReader(sealedRoot, sealed)).rejects.toThrow('E_EVIDENCE_READER_MISSING')
      } finally {
        evidence.close()
      }
      const projection = await readProjectionPredecessor(fixture, projectionPath, projectionHash)

      // Create the successor only in this disposable repository, never in the shared worktree.
      await git(fixture, 'read-tree', revision)
      const changedBlob = (await git(fixture, 'hash-object', '-w', resolve(root, aliasPath))).toString().trim()
      for (const path of [aliasPath, projectionPath]) {
        await git(fixture, 'update-index', '--add', '--cacheinfo', `100644,${changedBlob},${path}`)
      }
      const tree = (await git(fixture, 'write-tree')).toString().trim()
      const successor = (await git(fixture, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
        'commit-tree', tree, '-p', revision, '-m', 'Advance fixture HEAD')).toString().trim()
      await git(fixture, 'update-ref', 'HEAD', successor)
      expect((await git(fixture, 'rev-parse', 'HEAD')).toString().trim()).not.toBe(revision)
      expect(sha256(await git(fixture, 'show', `HEAD:${projectionPath}`))).not.toBe(projectionHash)
      const advanced = await validatorPredecessorReader(fixture, reader)
      expect(await advanced(resolve(fixture, aliasPath))).toEqual(await first(resolve(fixture, aliasPath)))
      expect(await advanced(markerPath)).toBe(marker)
      expect(advanced.appliedDiskOverrides).toEqual(reader.appliedDiskOverrides)
      expect(advanced.currentAuthorityReader).toBe(reader)
      expect(await readProjectionPredecessor(fixture, projectionPath, projectionHash)).toEqual(projection)

      const mutatedReader = async path => path === resolve(fixture, aliasPath) ? marker : reader(path)
      const mutated = await validatorPredecessorReader(fixture, mutatedReader)
      expect(await mutated(resolve(fixture, aliasPath))).toBe(marker)
      for (const [path, assertion] of [
        [aliasPath, () => expect(validatorPredecessorReader(fixture, reader)).rejects.toMatchObject({ code: 'E_REVIEW_HASH' })],
        [projectionPath, () => expect(readProjectionPredecessor(fixture, projectionPath, projectionHash)).rejects.toThrow('E_PROJECTION_BEFORE_HASH')],
      ]) {
        const originalBlob = (await git(fixture, 'rev-parse', `${revision}:${path}`)).toString().trim()
        await git(fixture, 'replace', originalBlob, changedBlob)
        await assertion()
        await git(fixture, 'replace', '-d', originalBlob)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
