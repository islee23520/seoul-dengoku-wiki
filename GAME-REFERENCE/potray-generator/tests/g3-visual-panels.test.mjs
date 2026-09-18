import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { join } from 'node:path';

const EVIDENCE_DIR = '.omo/evidence/portrait-stage23/g3-visual-panels';

test('g3-visual-panels', async (t) => {
  // Assert 8 panel PNGs exist
  for (let i = 1; i <= 8; i++) {
    const pngPath = join(EVIDENCE_DIR, `row-${i}.png`);
    await t.test(`panel row-${i}.png exists`, () => {
      assert.ok(fs.existsSync(pngPath), `Missing ${pngPath}`);
      const stats = fs.statSync(pngPath);
      assert.ok(stats.size > 100000, `Panel ${pngPath} too small`);
    });
  }

  // Assert 8 JSON files
  for (let i = 1; i <= 8; i++) {
    const jsonPath = join(EVIDENCE_DIR, `row-${i}.json`);
    await t.test(`metadata row-${i}.json valid`, () => {
      assert.ok(fs.existsSync(jsonPath), `Missing ${jsonPath}`);
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      assert.strictEqual(data.visual_verdict, 'PENDING', 'visual_verdict must be PENDING');
      assert.ok(Array.isArray(data.item_intents_refs), 'item_intents_refs must be array');
      assert.ok(data.item_intents_refs.length > 0, 'item_intents_refs must be non-empty');
      assert.ok(data.sex === 'female' || data.sex === 'male');
      assert.ok(typeof data.selection === 'object' && Object.keys(data.selection).length > 5);
      assert.ok(data.composed_sha256 && data.reference_sha256);
    });
  }

  // Assert INTENT.md
  await t.test('INTENT.md exists with required content', () => {
    const intentPath = join(EVIDENCE_DIR, 'INTENT.md');
    assert.ok(fs.existsSync(intentPath), 'INTENT.md missing');
    const content = fs.readFileSync(intentPath, 'utf8');
    assert.ok(content.includes('G3 조합'), 'Should contain Korean goal');
    assert.ok(content.includes('visual_verdict=PENDING'), 'Should mention PENDING verdict');
    assert.ok(content.includes('owner decides at gate4'), 'Should reference owner decision');
  });

  console.log('✅ All 8 visual verdict panels and metadata verified.');
});

test('g3-reconciliation', () => {
  // Verify reconciliation happened (eyes_white present in one sample)
  const sampleJson = JSON.parse(fs.readFileSync(join(EVIDENCE_DIR, 'row-1.json'), 'utf8'));
  assert.ok(sampleJson.selection.eyes_white, 'Reconciled selection must include eyes_white');
  assert.ok(sampleJson.selection.eyes_white.endsWith('-01'), 'eyes_white should use -01 variant');
});
