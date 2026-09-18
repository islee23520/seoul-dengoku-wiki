// Synthetic integration fixture only. Never approves a real candidate.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { runtimeSlotContract } from './runtime-asset-provenance.mjs';

const [root, id, mutation = 'none'] = process.argv.slice(2);
const source = `GAME/Assets/Janseon/Art/Staging/TestPromotion-${id}/fixture.png`;
const destination = `GAME/Assets/Janseon/Art/Title/TestPromotion-${id}/fixture.png`;
const evidence = `.omo/evidence/gateway-slot-wiring/fixtures/${id}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const put = (path, bytes) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
  return hash(bytes);
};
const pngHash = hash(readFileSync(join(root, source)));
const syntheticLook = kind => ({
  palette: { red: '#ff0000', green: '#00ff00', blue: '#0000ff', white: '#ffffff' },
  materials: { medium: 'synthetic-rgba-test-sprite', finish: 'unlit' },
  references: [{ kind: 'test-contract', source: 'GAME/Assets/Tests/EditMode/RuntimeSlotPromotionTests.cs' }],
  owner_verdict: 'accepted',
  owner_notes: `Synthetic ${kind} fixture appearance only; never approves a real candidate.`,
});
const reviewPath = `${evidence}/review.json`;
const reviewHash = put(reviewPath, JSON.stringify({ fixture: true, output_hash: pngHash, verdict: 'pass' }));
const rightsPath = `${evidence}/rights.txt`;
const row = {
  schema_version: 1, asset_id: `synthetic-${id}`, runtime_slot: 'title-art', asset_class: 'title_art',
  source: 'existing', rights_status: 'allowed', generation_backend: 'none', provider: 'synthetic-test',
  model: 'none', revision: '1', prompt: '', prompt_hash: hash(''), input_hashes: [pngHash], seed: 0,
  cost_mode: 'none', cost_cents: 0, raw_path: source, raw_hash: pngHash,
  output_path: destination, output_hash: pngHash, tool_versions: { fixture: '1' },
  operations: ['test_fixture'], unity_import_settings: {}, status: 'promoted',
  created_at: '2026-09-05T00:00:00Z',
  look: syntheticLook('title-art'),
  review_receipts: [{ reviewer: 'synthetic-fixture-only', verdict: 'pass', receipt_path: reviewPath,
    receipt_hash: reviewHash, reviewed_at: '2026-09-05T00:00:00Z' }],
  rights_evidence: { path: rightsPath, sha256: put(rightsPath, 'Synthetic test fixture, not real asset rights.') },
  runtime_files: { [destination]: pngHash }, runtime_slot_files: { backdrop: destination },
  look: {
    palette: { fixture: true },
    materials: { fixture: true },
    references: [{ kind: 'fixture', source: source }],
    owner_verdict: 'pending',
  },
};
const candidateFiles = { [destination]: source };
const bindingPath = `${evidence}/binding.json`;
row.source_binding = { path: bindingPath, sha256: put(bindingPath, JSON.stringify({
  asset_id: row.asset_id, runtime_slot: row.runtime_slot, raw_hash: row.raw_hash,
  output_hash: row.output_hash, rights_evidence: row.rights_evidence,
  runtime_files: row.runtime_files, runtime_slot_files: row.runtime_slot_files, review_hashes: [reviewHash],
})) };
const request = { asset: row, candidate_files: candidateFiles, bom_path: `${evidence}/bom.json` };
if (mutation === 'missing-rights') delete row.rights_evidence;
if (mutation === 'tampered-output') row.output_hash = hash('not the PNG');
if (mutation === 'unbound-review') row.review_receipts[0].receipt_hash = put(reviewPath, 'unbound review');
if (mutation === 'non-candidate') request.candidate_files[destination] = rightsPath;
if (mutation === 'empty-reviews') row.review_receipts = [];
if (mutation === 'missing-binding') delete row.source_binding;
put(`${evidence}/request.json`, JSON.stringify(request));
console.log(JSON.stringify({ request: `${evidence}/request.json`, destination, bom: request.bom_path }));
