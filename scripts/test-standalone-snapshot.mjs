import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '..')

describe('standalone wiki snapshot', () => {
  test('catalog generation reads only the declared snapshot', async () => {
    const output = execFileSync('node', ['scripts/generate-catalog.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, SEOUL_KENSHI_ROOT: undefined, LORE_ROOT: undefined, WIKI_REGION_ATLAS_PATH: undefined },
    })
    expect(output.length).toBeGreaterThan(0)
    const manifest = JSON.parse(await readFile(resolve(root, 'snapshots/build-inputs/source-manifest.json'), 'utf8'))
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      'SeoulWorldGraph.json',
      'atlas-data.js',
      'creative-name-normalization.json',
    ])
    const graph = JSON.parse(await readFile(resolve(root, 'snapshots/build-inputs/SeoulWorldGraph.json'), 'utf8'))
    expect(graph.stations.length).toBeGreaterThan(0)
  })
})
