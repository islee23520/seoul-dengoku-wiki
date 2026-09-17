import test from 'node:test';
import assert from 'node:assert/strict';
import { attachValidationReceipt, createCurationFeedback, curationProgress, mountedCandidateMembers, serializeCurationPacket, updateCurationFeedback, validateCurationCatalog } from '../portrait-curation.mjs';

const hash = 'a'.repeat(64);
const catalog = { version: 1, sha256: hash, counts: { total_records: 2, visible_cards: 2, metadata_only: 0 }, records: [
  { id: 'female/hair/h0', sex: 'female', slot: 'hair', bundle: 'hair', status: 'accepted', sha256: hash, source_paths: ['a.png'], web_path: 'curation/a.png', visible_card: true, browser_decodable: true, render_members: ['female/hair/h0'] },
  { id: 'male/acc_eye/reject', sex: 'male', slot: 'acc_eye', status: 'rejected', sha256: hash, source_paths: ['b.png'], web_path: 'curation/b.png', visible_card: true, browser_decodable: true, render_members: ['male/acc_eye/reject'] },
] };

test('catalog retains accepted and rejected candidates as curation choices', () => {
  assert.equal(validateCurationCatalog(catalog).records.length, 2);
  assert.deepEqual(catalog.records.map(candidate => candidate.status), ['accepted', 'rejected']);
});

test('feedback records adopt hold reject decisions and notes', () => {
  let feedback = createCurationFeedback(catalog);
  feedback = updateCurationFeedback(catalog, feedback, 'female/hair/h0', 'adopt', '실루엣 유지');
  feedback = updateCurationFeedback(catalog, feedback, 'male/acc_eye/reject', 'hold', 'halo 수리 필요');
  assert.deepEqual(curationProgress(catalog, feedback), { total: 2, pending: 0, adopt: 1, hold: 1, reject: 0 });
});

test('gateway 4 packet stays pending without complete feedback and graph receipt', async () => {
  let feedback = createCurationFeedback(catalog);
  let packet = JSON.parse(await serializeCurationPacket(catalog, feedback));
  assert.equal(packet.gateway4.status, 'PENDING');
  feedback = updateCurationFeedback(catalog, feedback, 'female/hair/h0', 'adopt');
  feedback = updateCurationFeedback(catalog, feedback, 'male/acc_eye/reject', 'reject', '외부 조각');
  feedback = attachValidationReceipt(feedback, { path: '.omo/evidence/graph/receipt.json', sha256: hash });
  packet = JSON.parse(await serializeCurationPacket(catalog, feedback));
  assert.equal(packet.gateway4.status, 'READY_FOR_VERIFICATION');
  assert.equal(packet.gateway4.visual_approval, 'USER_DECISION_REQUIRED');
  assert.match(packet.feedback_sha256, /^[0-9a-f]{64}$/);
});

test('unknown candidates, statuses and receipts fail closed', () => {
  assert.throws(() => validateCurationCatalog({ ...catalog, records: [{ ...catalog.records[0], status: 'PASS' }] }));
  assert.throws(() => updateCurationFeedback(catalog, createCurationFeedback(catalog), 'missing', 'adopt'));
  assert.throws(() => attachValidationReceipt(createCurationFeedback(catalog), { path: 'x', sha256: 'bad' }));
});

test('mounted preview resolves physical candidate members without mutating production selection', () => {
  const members = mountedCandidateMembers(catalog, 'female/hair/h0');
  assert.deepEqual(members, [{ slot: 'hair', path: 'curation/a.png', blend_mode: 'source-over' }]);
  assert.throws(() => mountedCandidateMembers(catalog, 'missing'));
  assert.throws(() => mountedCandidateMembers(catalog, 'male/acc_eye/reject'), /반려/);
});
