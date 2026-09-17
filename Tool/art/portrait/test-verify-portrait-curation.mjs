import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { CATALOG_PATH, verifyPortraitCuration } from './verify-portrait-curation.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const stable = (value) => Array.isArray(value) ? `[${value.map(stable).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
    : JSON.stringify(value);

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'portrait-curation-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, body) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
    writeFileSync(full, bytes);
    return { path: rel, sha256: sha256(bytes) };
  };
  return { root, put };
}

function catalogDocument() {
  const catalog = {
    version: 1,
    counts: { total_records: 3, visible_cards: 2, metadata_only: 1 },
    records: [
      { id: 'visible-a', visible_card: true, metadata_only: false },
      { id: 'visible-b', visible_card: true, metadata_only: false },
      { id: 'hidden-c', visible_card: false, metadata_only: true },
    ],
  };
  catalog.sha256 = sha256(Buffer.from(JSON.stringify(catalog)));
  return catalog;
}

function fixture(t, { checkpoint = 'APPROVED', receiptStatus, omitCheckpoint = false } = {}) {
  const { root, put } = workspace(t);
  const catalog = catalogDocument();
  put(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  const artifact = put('evidence/graph/candidate.png', 'candidate-pixels');
  const decisions = [
    { candidate_id: 'visible-a', decision: 'adopt', note: '' },
    { candidate_id: 'visible-b', decision: 'hold', note: 'Needs another silhouette pass.' },
    { candidate_id: 'hidden-c', decision: 'adopt', note: '' },
  ];
  const feedbackSha256 = sha256(Buffer.from(stable({ catalog_sha256: catalog.sha256, decisions })));
  const receipt = {
    schema_version: 1,
    status: receiptStatus ?? (checkpoint === 'PENDING' ? 'PENDING' : 'PASS'),
    visual_approval: checkpoint === 'APPROVED' ? 'APPROVED' : 'NOT_GRANTED',
    nodes: [
      { id: 'emit', type: 'emit_artifact', status: 'PASS', artifacts: [{ ...artifact, path: 'candidate.png' }] },
      ...(!omitCheckpoint ? [{
        id: 'curate', type: 'curation_checkpoint', status: checkpoint,
        ...(checkpoint === 'APPROVED' ? { metrics: { feedback_sha256: feedbackSha256, reviewer: 'owner' } } : {}),
      }] : []),
    ],
  };
  const receiptBinding = put('evidence/graph/receipt.json', `${JSON.stringify(receipt, null, 2)}\n`);
  const packet = {
    schema: 'janseon.portrait-curation.v1',
    catalog: { path: CATALOG_PATH, sha256: catalog.sha256 },
    decisions,
    feedback_sha256: feedbackSha256,
    validation_receipts: [receiptBinding],
    gateway4: { status: 'FAIL', visual_approval: 'NOT_GRANTED' },
  };
  return { root, put, catalog, receipt, receiptBinding, packet, artifact };
}

const codes = (report) => report.errors.map((error) => error.code);

test('complete decisions and an approved bound graph produce computed PASS', (t) => {
  const { root, packet } = fixture(t);
  packet.gateway4 = { status: 'PENDING', visual_approval: 'USER_DECISION_REQUIRED' };
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.status, 'PASS');
  assert.equal(report.ok, true);
});

test('complete decisions with a pending receipt or checkpoint produce honest PENDING', (t) => {
  const { root, packet } = fixture(t, { checkpoint: 'PENDING' });
  packet.gateway4 = { status: 'PASS', visual_approval: 'APPROVED' };
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.status, 'PENDING');
  assert.equal(report.ok, false);
});

test('pending, missing, and duplicate decisions fail closed', (t) => {
  const { root, packet } = fixture(t);
  packet.decisions = [
    { candidate_id: 'visible-a', decision: 'pending', note: '' },
    { candidate_id: 'visible-a', decision: 'adopt', note: '' },
  ];
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('pending_decision'));
  assert.ok(codes(report).includes('duplicate_decision'));
  assert.ok(codes(report).includes('missing_decision'));
  assert.equal(report.status, 'FAIL');
});

test('hold and reject require a nonblank note', (t) => {
  const { root, packet } = fixture(t);
  packet.decisions[0] = { candidate_id: 'visible-a', decision: 'reject', note: '   ' };
  packet.decisions[1] = { candidate_id: 'visible-b', decision: 'hold' };
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.equal(codes(report).filter((code) => code === 'decision_note_required').length, 2);
  assert.equal(report.status, 'FAIL');
});

test('a packet bound to a stale catalog SHA is rejected', (t) => {
  const { root, packet } = fixture(t);
  packet.catalog.sha256 = '0'.repeat(64);
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('stale_catalog'));
});

test('artifact byte drift relative to the receipt directory is rejected', (t) => {
  const { root, put, packet } = fixture(t);
  put('evidence/graph/candidate.png', 'drifted-pixels');
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('artifact_hash_mismatch'));
  assert.equal(report.status, 'FAIL');
});

test('escaping receipt and artifact paths, including symlinks, are rejected', (t) => {
  const traversal = fixture(t);
  traversal.packet.validation_receipts[0].path = '../outside-receipt.json';
  assert.ok(codes(verifyPortraitCuration(traversal.packet, { repoRoot: traversal.root })).includes('receipt_unsafe_path'));

  const artifactEscape = fixture(t);
  artifactEscape.receipt.nodes[0].artifacts[0].path = '../../../outside.png';
  artifactEscape.packet.validation_receipts[0] = artifactEscape.put('evidence/graph/receipt-escape.json', JSON.stringify(artifactEscape.receipt));
  assert.ok(codes(verifyPortraitCuration(artifactEscape.packet, { repoRoot: artifactEscape.root })).includes('artifact_unsafe_path'));

  const symlink = fixture(t);
  const outside = join(tmpdir(), `portrait-curation-outside-${process.pid}.json`);
  writeFileSync(outside, JSON.stringify({ schema_version: 1, status: 'PASS', nodes: [] }));
  t.after(() => rmSync(outside, { force: true }));
  symlinkSync(outside, join(symlink.root, 'receipt-link.json'));
  symlink.packet.validation_receipts = [{ path: 'receipt-link.json', sha256: sha256(Buffer.from(JSON.stringify({ schema_version: 1, status: 'PASS', nodes: [] }))) }];
  assert.ok(codes(verifyPortraitCuration(symlink.packet, { repoRoot: symlink.root })).includes('receipt_symlink_forbidden'));
});

test('metadata-only and unknown candidate decisions are rejected', (t) => {
  const { root, packet } = fixture(t);
  packet.decisions.push({ candidate_id: 'invented', decision: 'adopt', note: '' });
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('unknown_decision'));
});

test('fake top-level visual approval cannot replace checkpoint-bound user feedback', (t) => {
  const { root, packet, receipt, put } = fixture(t);
  receipt.visual_approval = 'APPROVED';
  receipt.nodes[1] = { id: 'curate', type: 'curation_checkpoint', status: 'APPROVED', metrics: {} };
  packet.validation_receipts[0] = put('evidence/graph/fake-approval.json', JSON.stringify(receipt));
  packet.gateway4 = { status: 'PASS', visual_approval: 'APPROVED' };
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('curation_checkpoint_feedback_unbound'));
  assert.equal(report.status, 'FAIL');
});

test('Gate 4 requires at least one feedback-bound curation checkpoint', (t) => {
  const { root, packet } = fixture(t, { omitCheckpoint: true });
  const report = verifyPortraitCuration(packet, { repoRoot: root });
  assert.ok(codes(report).includes('curation_checkpoint_required'));
  assert.equal(report.status, 'FAIL');
});
