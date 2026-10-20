import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

import { validatorPredecessorReader } from './seoul-census.mjs'
import { readProjectionPredecessor, sha256 } from './projection-refresh-successor.mjs'

const root = resolve(import.meta.dirname, '..')
const revision = 'e9c12a43728a599c371d373088e177a446ff5051'
const aliasPath = 'lore/places/test-station-alias-candidates.mjs'
const aliasHash = '18fc455a69d053b742b2c6611456e80594aea45c857e3eafe9eb2b3e066ba256'
const projectionPath = 'lore/Operating-Houses.json'
const projectionHash = '88fa87546e656d961005cd9aa1e35855ebdf18ff72d459f1bee3f42db1c5b5ca'
const exec = promisify(execFile)
const git = async (cwd, ...args) => (await exec('git', args, { cwd, encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 })).stdout

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
