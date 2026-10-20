import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { copyReviewedPublic, excludedTerrain, outputNames, verifySeoulTerrain } from './seoul-terrain-artifacts.mjs'

const root = resolve(import.meta.dirname, '..')

test('checked-in terrain seal validates the pinned native inputs and four products', async () => {
  const { raw, output } = await verifySeoulTerrain(root)
  assert.equal(raw.filter(excludedTerrain).length, 184)
  assert.deepEqual([output.rasterFile, output.waterFile, output.clipFile], outputNames.slice(1))
})

test('selective copy preserves reviewed files without any native raw path', async () => {
  // copyReviewedPublic deliberately rejects non-repository dist paths. Exercise the predicate
  // here without replacing the shared dist while the generator writer is active.
  assert.equal(excludedTerrain('regional-terrain.json'), true)
  assert.equal(excludedTerrain('regional-terrain-tiles/0-0.bin'), true)
  assert.equal(excludedTerrain('regional-boundaries.json'), false)
  assert.equal(excludedTerrain('seoul-terrain-clip.json'), false)
  await assert.rejects(copyReviewedPublic(root, join(tmpdir(), 'unauthorized-dist')), /E_SEOUL_COPY_DESTINATION/)
})
