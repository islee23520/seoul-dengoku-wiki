import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { openAssetDatabase } from '../src/database.mjs';
import { scanEvidence } from '../src/scanner.mjs';
import { materializeRawAssets } from '../src/raw-store.mjs';
import { materializeWorkingSet } from '../src/working-set.mjs';

test('work copies exact curated bytes from raw without inventing Gate2 or Gate3 approval', async t => {
  const root = mkdtempSync(join(tmpdir(), 'portrait-working-set-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = '.omo/evidence/female/face_base.png';
  const receipt = '.omo/evidence/female/acceptance.json';
  const config = 'Design/potrait-generator/config/asset-decisions.json';
  mkdirSync(join(root, '.omo/evidence/female'), { recursive: true });
  mkdirSync(join(root, 'Design/potrait-generator/config'), { recursive: true });
  const bytes = Buffer.from('reviewed-source-pixels');
  const sha = createHash('sha256').update(bytes).digest('hex');
  writeFileSync(join(root, source), bytes);
  writeFileSync(join(root, receipt), JSON.stringify({ status: 'PASS', scope: 'gate1_visible_ownership', target_path: source, target_sha256: sha }));
  writeFileSync(join(root, config), JSON.stringify({ version: 1, decisions: [{ path: source, sha256: sha, receipt, decision: 'PASS', authority: 'curator', properties: { role: 'face_base', gate_scope: 'gate1_visible_ownership' } }] }));
  const db = openAssetDatabase(join(root, 'assets.sqlite'));
  t.after(() => db.close());
  await scanEvidence({ db, repoRoot: root, evidenceRoot: join(root, '.omo/evidence') });
  await materializeRawAssets({ db, repoRoot: root });

  const result = materializeWorkingSet({ db, repoRoot: root });

  assert.equal(result.assets.length, 1);
  assert.deepEqual(readFileSync(join(root, result.assets[0].work_path)), bytes);
  assert.equal(result.assets[0].gate_scope, 'gate1_visible_ownership');
  assert.equal(result.assets[0].production_approved, false);
  assert.deepEqual(result.assets[0].gates, { gate1: 'NOT_VERIFIED', gate2: 'NOT_VERIFIED', gate3: 'NOT_VERIFIED' });
  assert.equal(materializeWorkingSet({ db, repoRoot: root }).cached, 1);
  writeFileSync(join(root, result.assets[0].work_path), 'artist work');
  assert.throws(() => materializeWorkingSet({ db, repoRoot: root }), /work copy changed/);
});
