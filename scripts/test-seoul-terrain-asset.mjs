import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test, vi } from 'vitest'
import { verifiedSeoulTerrain } from '../src/components/seoulTerrainAsset.ts'

const root = resolve(import.meta.dirname, '..')
const meta = JSON.parse(await readFile(resolve(root, 'public/seoul-terrain.json')))
const opening = JSON.parse(await readFile(resolve(root, 'public/opening-territories.json')))

test('terrain fetch verifies every response before exposing PNG, water and exact clip', async () => {
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('fetch', async (url) => ({ ok: true, arrayBuffer: async () => {
    const bytes = await readFile(resolve(root, 'public', String(url).split('/').at(-1)))
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  } }))
  try {
    const result = await verifiedSeoulTerrain('/wiki/', meta, opening, new AbortController().signal)
    assert.ok(result.png.size > 0)
    assert.ok(result.clip.path.startsWith('M'))
    assert.ok(result.water.features.every(feature => feature.kind === 'line'))
  } finally { vi.unstubAllGlobals() }
})

test('terrain hash mismatch fails closed', async () => {
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('fetch', async () => ({ ok: true, arrayBuffer: async () => Uint8Array.of(1, 2, 3).buffer }))
  try {
    await assert.rejects(verifiedSeoulTerrain('/wiki/', meta, opening, new AbortController().signal), /E_SEOUL_TERRAIN_SHA/)
  } finally { vi.unstubAllGlobals() }
})
