import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decodeCodexPng } from './2d/codex-image.mjs';
import { encodeFinalPng } from './2d/final-alpha-export.mjs';

export function perimeterTiles(image, tileSize = 256) {
  if (image.channels !== 4 || !Number.isInteger(tileSize) || tileSize < 1) throw new Error('RGBA and positive tile size required');
  const selected = new Map();
  let perimeterPixels = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = y * image.width + x, alpha = image.pixels[i * 4 + 3];
    if (!alpha) continue;
    if (x > 0 && x + 1 < image.width && y > 0 && y + 1 < image.height && [i - 1, i + 1, i - image.width, i + image.width].every(j => image.pixels[j * 4 + 3] > 0)) continue;
    perimeterPixels++;
    const left = Math.floor(x / tileSize) * tileSize, top = Math.floor(y / tileSize) * tileSize;
    const key = `${left}-${top}`;
    if (!selected.has(key)) selected.set(key, { left, top, width: Math.min(tileSize, image.width - left), height: Math.min(tileSize, image.height - top), perimeterPixels: 0 });
    selected.get(key).perimeterPixels++;
  }
  return { perimeterPixels, tiles: [...selected.values()].sort((a, b) => a.top - b.top || a.left - b.left) };
}

export async function exportPerimeterProof(sourcePath, outputDirectory) {
  const source = await readFile(sourcePath), image = decodeCodexPng(source);
  const coverage = perimeterTiles(image);
  const root = resolve(outputDirectory); await mkdir(root, { recursive: false });
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  const records = [];
  for (const tile of coverage.tiles) {
    const row = { ...tile, files: [] };
    for (const [name, background] of [['light', 255], ['dark', 18]]) {
      const pixels = Buffer.alloc(tile.width * tile.height * 4, 255);
      for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
        const src = ((y + tile.top) * image.width + x + tile.left) * 4, dst = (y * tile.width + x) * 4, alpha = image.pixels[src + 3] / 255;
        for (let c = 0; c < 3; c++) pixels[dst + c] = Math.round(image.pixels[src + c] * alpha + background * (1 - alpha));
      }
      const bytes = encodeFinalPng({ width: tile.width, height: tile.height, pixels });
      const path = `${tile.left}-${tile.top}-${name}.png`;
      await writeFile(resolve(root, path), bytes, { flag: 'wx' }); row.files.push({ path, sha256: digest(bytes), backing: name });
    }
    records.push(row);
  }
  const manifest = { schema: 'portrait-perimeter-proof.v1', sourcePath: resolve(sourcePath), sourceSHA: digest(source), canvas: [image.width, image.height], perimeterPixels: coverage.perimeterPixels, coveredPerimeterPixels: records.reduce((sum, row) => sum + row.perimeterPixels, 0), resampled: false, sourceChanged: false, visualVerdict: 'UNVERIFIED_UNTIL_EVERY_TILE_VIEWED', tiles: records };
  await writeFile(resolve(root, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  return manifest;
}
