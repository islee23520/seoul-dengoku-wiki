import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { decodeCodexPng } from '../lib/2d/codex-image.mjs';
import { perimeterTiles, exportPerimeterProof } from '../lib/perimeter-proof.mjs';

test('perimeter tiles cover every source boundary once without resampling or edits', async () => {
  const pixels = Buffer.alloc(8 * 8 * 4);
  for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) pixels.set([100, 40, 20, 128], (y * 8 + x) * 4);
  const source = encodeFinalPng({ width: 8, height: 8, pixels });
  const coverage = perimeterTiles(decodeCodexPng(source), 4);
  assert.equal(coverage.perimeterPixels, 12); assert.equal(coverage.tiles.reduce((sum, tile) => sum + tile.perimeterPixels, 0), 12);
  const root = await mkdtemp(join(tmpdir(), 'perimeter-'));
  try {
    const path = join(root, 'source.png'); await writeFile(path, source);
    const manifest = await exportPerimeterProof(path, join(root, 'proof'));
    assert.equal(manifest.coveredPerimeterPixels, 12); assert.equal(manifest.resampled, false);
    assert.deepEqual(await readFile(path), source);
    const light = decodeCodexPng(await readFile(join(root, 'proof', manifest.tiles[0].files[0].path)));
    assert.equal(light.width, 8); assert.equal(light.pixels[(2 * 8 + 2) * 4 + 3], 255);
    await assert.rejects(exportPerimeterProof(path, join(root, 'proof')), /EEXIST/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
