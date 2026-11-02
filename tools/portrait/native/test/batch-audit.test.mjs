import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { auditBatch } from '../lib/batch-audit.mjs';

test('offline audit binds exact output receipt and retains unknown requests without retry', async () => {
  const root = await mkdtemp(join(tmpdir(), 'batch-audit-'));
  try {
    const dir = join(root, 'production', 'K103'); await mkdir(dir, { recursive: true });
    const pixels = Buffer.alloc(16 * 16 * 4); pixels.set([1, 2, 3, 254], 0);
    const bytes = encodeFinalPng({ width: 16, height: 16, pixels });
    const path = join(dir, 'K103.png'); await writeFile(path, bytes);
    const digest = createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(dir, 'dispatch-lock.json'), JSON.stringify({ id: 'K103', requestId: 'a', attempt: 1 }));
    await writeFile(join(dir, 'terminal.json'), JSON.stringify({ id: 'K103', requestId: 'a', result: { path }, ownerVerdict: 'pending' }));
    await writeFile(path + '.receipt.json', JSON.stringify({ imageSha256: digest, correlation: { requestId: 'a' } }));
    const unknown = join(root, 'production', 'K105'); await mkdir(unknown);
    await writeFile(join(unknown, 'dispatch-lock.json'), JSON.stringify({ id: 'K105', requestId: 'b', attempt: 1 }));
    const report = await auditBatch(root);
    assert.equal(report.outputs, 1); assert.equal(report.unresolved, 1); assert.equal(report.providerCalls, 0);
    assert.equal(report.rows[0].corePolicyPass, true); assert.equal(report.rows[0].semanticCutVerdict, 'UNVERIFIED');
    assert.equal(report.rows[0].nonopaqueForegroundPixels, 1);
    assert.equal(report.rows[0].strictOpaqueForegroundPass, false);
    assert.equal(report.rows[1].retryAllowed, false);
    pixels[3] = 255;
    const opaqueBytes = encodeFinalPng({ width:16, height:16, pixels });
    const opaqueDigest = createHash('sha256').update(opaqueBytes).digest('hex');
    await writeFile(path, opaqueBytes);
    await writeFile(path + '.receipt.json', JSON.stringify({ imageSha256:opaqueDigest, correlation:{requestId:'a'} }));
    const opaqueReport = await auditBatch(root);
    assert.equal(opaqueReport.rows[0].strictOpaqueForegroundPass, true);
    assert.equal(opaqueReport.rows[0].nonopaqueForegroundPixels, 0);
    await writeFile(path + '.receipt.json', JSON.stringify({ imageSha256: digest, correlation: { requestId: 'wrong' } }));
    await assert.rejects(auditBatch(root), /receipt mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
