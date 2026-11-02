import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { modifyPortrait, sha } from '../lib/index.mjs';
import { sparseAlpha, pixelListSHA } from '../lib/2d/sparse-alpha.mjs';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { decodeCodexPng } from '../lib/2d/codex-image.mjs';

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'sparse-alpha-'));
  const pixels = Buffer.alloc(6 * 5 * 4);
  for (let i = 0; i < 30; i++) pixels.set([i, 31, 94, 255], i * 4);
  const selected = [1, 7, 8, 14, 27], sourceBytes = encodeFinalPng({ width: 6, height: 5, pixels });
  const sourceSHA = sha(sourceBytes), listSHA = pixelListSHA(selected);
  const put = async (name, value) => { const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value)); const path = join(dir, name); await writeFile(path, bytes); return [path, sha(bytes)]; };
  const [sourcePath] = await put('source.png', sourceBytes);
  const [ownershipProofPath, ownershipProofSHA] = await put('owner.json', { schema: 'portrait-local-owner-proof.v1', sourceSHA, ownerAuthorized: true, scope: 'selected-background-alpha-only', pixelListSHA: listSHA });
  const binding = { sourceImageSha256: sourceSHA, inputSnapshotSHA: sha(Buffer.from('{}')), packageVersion: 1 };
  const approval = { schema: 'portrait-sparse-alpha-approval.v1', version: 1, approved: true, sourceSHA, canvas: [6, 5], packageVersion: 1, inputSnapshotSHA: binding.inputSnapshotSHA, ownershipProofSHA, approvedSelectedPixels: selected, pixelListSHA: listSHA };
  const [approvalPath, approvalSHA] = await put('approval.json', approval);
  const [path, sha256] = await put('pixels.json', selected);
  const sparseMask = { version: 1, format: 'canonical-pixel-list-json', path, sha256, approvalPath, approvalSHA, ownershipProofPath, ownershipProofSHA, pixelListSHA: listSHA };
  const input = { sourcePath, sourceBytes, sourceSHA, binding, sparseMask, alpha: 0, activatedSlots: ['pixel-mask.alpha'], output: join(dir, 'result.png'), receipt: join(dir, 'result.json') };
  return { dir, input, pixels, selected, put, approval };
}

test('native API and CLI irregular sparse mask preserve foreground within bbox, all RGB and all unselected RGBA', async () => {
  const f = await setup();
  try {
    const roles = ['overlay-template', 'canvas-rule', 'transparency-edge-rule', 'face-catalog-entry'];
    const assets = [];
    for (const [n, role] of roles.entries()) { const [path, sha256] = await f.put('asset-' + n + '.bin', Buffer.from(role)); assets.push({ path: path.split('/').at(-1), sha256, role, rights: 'synthetic', provenance: 'synthetic', rolescope: 'synthetic' }); }
    const catalog = { schemaVersion: 1, variants: Array.from({ length: 24 }, (_, i) => ({ id: 'synthetic-' + i, face: {}, referenceImagePath: null })) };
    const [, catalogSHA] = await f.put('catalog.json', catalog);
    assets[3].path = 'catalog.json'; assets[3].sha256 = catalogSHA;
    await f.put('portrait-package.json', { id: 'seoul-dengoku-portrait-package', version: 1, assets });
    const { sourceBytes, binding, ...args } = f.input;
    const request = { ...args, expected: binding, packageRoot: f.dir, operation: 'local-alpha', composition: { fabricPresent: true } };
    const record = await modifyPortrait(request);
    assert.equal(record.selectedPixels, 5); assert.deepEqual(record.proof, { rgbDifferences: 0, outsideRGBADifferences: 0, selectedNonzeroAlpha: 0 });
    const after = decodeCodexPng(await readFile(f.input.output));
    for (let i = 0; i < 30; i++) {
      assert.deepEqual(after.pixels.subarray(i * 4, i * 4 + 3), f.pixels.subarray(i * 4, i * 4 + 3));
      if (!f.selected.includes(i)) assert.deepEqual(after.pixels.subarray(i * 4, i * 4 + 4), f.pixels.subarray(i * 4, i * 4 + 4));
      else assert.equal(after.pixels[i * 4 + 3], 0);
    }
    assert.equal(after.pixels[13 * 4 + 3], 255);
    const [requestPath] = await f.put('request.json', { ...request, output: join(f.dir, 'cli.png'), receipt: join(f.dir, 'cli.json') });
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['bin/seoul-avatar.mjs', 'modify', requestPath], { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
      child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d); child.once('error', reject); child.once('exit', code => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err)));
    });
    assert.equal(result.output.sha256, record.output.sha256);
    const rectangle = await modifyPortrait({ ...request, sparseMask: undefined, region: { x: 0, y: 0, width: 1, height: 1 }, output: join(f.dir, 'rectangle.png'), receipt: join(f.dir, 'rectangle.json') });
    assert.equal(rectangle.changedPixels, 1);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('binary PNG mask accepts only exact approved pixels and rejects partial alpha or extra foreground', async () => {
  const f = await setup();
  try {
    const maskPixels = Buffer.alloc(120, 255);
    for (const i of f.selected) maskPixels[i * 4 + 3] = 0;
    const [path, sha256] = await f.put('mask.png', encodeFinalPng({ width: 6, height: 5, pixels: maskPixels }));
    const input = { ...f.input, sparseMask: { ...f.input.sparseMask, format: 'binary-png', path, sha256 } };
    await sparseAlpha(input);
    for (const alpha of [1, 0]) {
      maskPixels[13 * 4 + 3] = alpha;
      const [badPath, badSHA] = await f.put('bad-' + alpha + '.png', encodeFinalPng({ width: 6, height: 5, pixels: maskPixels }));
      await assert.rejects(sparseAlpha({ ...input, output: join(f.dir, 'bad-output.png'), receipt: join(f.dir, 'bad-receipt.json'), sparseMask: { ...input.sparseMask, path: badPath, sha256: badSHA } }), alpha === 1 ? /partial/ : /approved/);
    }
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('stale bindings list tamper duplicate range source aliases and collisions abort before output without deletion', async () => {
  const f = await setup();
  try {
    const baseline = (await readdir(f.dir)).sort();
    for (const change of [
      { sparseMask: { ...f.input.sparseMask, sha256: 'a'.repeat(64) } },
      { sparseMask: { ...f.input.sparseMask, pixelListSHA: 'a'.repeat(64) } },
      { sourceSHA: 'a'.repeat(64) }, { binding: { ...f.input.binding, packageVersion: 2 } },
      { output: f.input.sourcePath }, { receipt: f.input.sourcePath }, { alpha: 2 }, { region: { x: 0, y: 0, width: 6, height: 5 } },
    ]) { await assert.rejects(sparseAlpha({ ...f.input, ...change })); assert.deepEqual((await readdir(f.dir)).sort(), baseline); }
    for (const list of [[1, 1], [-1, 7], [1, 30], [1, 7, 13]]) {
      const [path, sha256] = await f.put('tamper.json', list);
      await assert.rejects(sparseAlpha({ ...f.input, sparseMask: { ...f.input.sparseMask, path, sha256 } }));
    }
    const sentinel = Buffer.from('preserve collision'); await writeFile(f.input.receipt, sentinel);
    await assert.rejects(sparseAlpha(f.input), /exists/);
    assert.deepEqual(await readFile(f.input.receipt), sentinel);
    await assert.rejects(readFile(f.input.output), { code: 'ENOENT' });
    assert.deepEqual(await readFile(f.input.sourcePath), f.input.sourceBytes);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
