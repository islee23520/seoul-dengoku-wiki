import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'

test('game design canon and wiki surfaces have one owned root each', () => {
  assert.equal(existsSync('GAME-LOGIC'), false, 'legacy GAME-LOGIC root must be retired')
  for (const path of [
    'GDD/rules/Campaign-Loop.md',
    'GDD/references/Ref-Mechanism-Index.md',
    'GDD/architecture/Unity-Architecture.md',
    'GDD/art/Character-Art-Direction.md',
    'WEB/wiki/package.json',
    'WEB/wiki-source/package.json',
  ]) assert.equal(existsSync(path), true, path)
})

test('bestiary projections are group-owned and batch body pages are retired', () => {
  assert.equal(existsSync('LORE/bestiary/Hostile-Ecology-Index.md'), true)
  assert.equal(existsSync('LORE/bestiary/groups/Hostile-Group-G01.md'), true)
  assert.equal(existsSync('LORE/bestiary/groups/Hostile-Group-G27.md'), true)
  assert.equal(existsSync('LORE/Monster-Batch-M001.md'), false)
  assert.equal(existsSync('LORE/bestiary/Monster-Batch-M001.md'), false)
  assert.equal(existsSync('LORE/Monster-Batch-Manifest.md'), false)
})

test('retired reference assets are absent from source and public copies', () => {
  assert.equal(existsSync('GAME-REFERENCE/' + 'assets'), false)
  assert.equal(existsSync('WEB/wiki/public/wiki-assets'), false)
})
