import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decodeCodexPng } from './2d/codex-image.mjs';

export async function auditBatch(root) {
  const production = resolve(root, 'production');
  const rows = [];
  for (const entry of (await readdir(production, { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const directory = resolve(production, entry.name);
    const lock = JSON.parse(await readFile(resolve(directory, 'dispatch-lock.json'), 'utf8'));
    if (lock.id !== entry.name || lock.attempt !== 1 || typeof lock.requestId !== 'string') throw new Error('batch lock identity mismatch');
    let terminal;
    try { terminal = JSON.parse(await readFile(resolve(directory, 'terminal.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!terminal) { rows.push({ id: entry.name, requestId: lock.requestId, status: 'DISPATCH_LOCK_RESPONSE_UNRESOLVED', retryAllowed: false }); continue; }
    if (terminal.id !== lock.id || terminal.requestId !== lock.requestId) throw new Error('batch terminal identity mismatch');
    if (!terminal.result?.path) { rows.push({ id: entry.name, requestId: lock.requestId, status: terminal.status ?? 'ERROR', error: terminal.error ?? null, retryAllowed: false }); continue; }
    const path = resolve(directory, `${entry.name}.png`);
    if (resolve(terminal.result.path) !== path) throw new Error('batch output path mismatch');
    const bytes = await readFile(path);
    const imageSHA = createHash('sha256').update(bytes).digest('hex');
    const receipt = JSON.parse(await readFile(path + '.receipt.json', 'utf8'));
    if (receipt.imageSha256 !== imageSHA || receipt.correlation.requestId !== lock.requestId) throw new Error('batch output receipt mismatch');
    const image = decodeCodexPng(bytes);
    if (image.channels !== 4) throw new Error('batch output must retain RGBA');
    let nonzero = 0, core = 0, transparent = 0, partial = 0, nonopaqueForeground = 0;
    const edges = { left: 0, right: 0, top: 0, bottom: 0 };
    for (let i = 0; i < image.width * image.height; i++) {
      const alpha = image.pixels[i * 4 + 3];
      if (!alpha) { transparent++; continue; }
      nonzero++; if (alpha >= 250) core++; else partial++;
      if (alpha < 255) nonopaqueForeground++;
      const x = i % image.width, y = Math.floor(i / image.width);
      if (x === 0) edges.left++; if (x === image.width - 1) edges.right++;
      if (y === 0) edges.top++; if (y === image.height - 1) edges.bottom++;
    }
    rows.push({ id: entry.name, requestId: lock.requestId, status: 'OUTPUT_PRESERVED', imageSHA, canvas: [image.width, image.height], transparentPixels: transparent, partialAlphaPixels: partial, nonopaqueForegroundPixels: nonopaqueForeground, strictOpaqueForegroundPass: nonzero > 0 && nonopaqueForeground === 0, coreFraction: nonzero ? core / nonzero : 0, corePolicyPass: nonzero > 0 && core / nonzero >= 0.9, edgeNonzero: edges, semanticCutVerdict: 'UNVERIFIED', defringeVerdict: 'UNVERIFIED', ownerVerdict: terminal.ownerVerdict ?? 'pending', retryAllowed: false });
  }
  return { schema: 'portrait-batch-audit.v1', locked: rows.length, outputs: rows.filter(row => row.status === 'OUTPUT_PRESERVED').length, unresolved: rows.filter(row => row.status !== 'OUTPUT_PRESERVED').length, providerCalls: 0, rows };
}
