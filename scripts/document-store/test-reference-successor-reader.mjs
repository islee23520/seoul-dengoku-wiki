import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { verifyReferenceSuccessorChain, verifyReferenceSuccessorDelta, readReferenceSuccessor } from './reference-successor-reader.mjs';
import { preserveReceiptOrder } from '../cast-sqlite/document-key-order.mjs';
import { authenticateExactBodyApproval } from './reference-successor-approval.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(`CREATE TABLE document_head(source_id INTEGER,revision_id TEXT);
    CREATE TABLE document_revision(source_id INTEGER,revision_id TEXT,parent_revision TEXT,
      semantic_sha256 TEXT,algorithm TEXT,sequence INTEGER,actor TEXT,reason TEXT);
    CREATE TABLE document_revision_seal(revision_id TEXT);`);
  const sourceId = 1, predecessor = 'a'.repeat(64), semanticSha256 = digest({ body: 'approved successor' });
  const actor = 'fixture-author', reason = 'independently approved typed edit';
  const revision = digest(['typed-envelope-v1', sourceId, predecessor, semanticSha256, actor, reason]);
  const sourceSha256 = 'b'.repeat(64), predecessorSemantic = digest({ body: 'original' });
  db.prepare('INSERT INTO document_revision VALUES(?,?,?,?,?,?,?,?)')
    .run(sourceId, predecessor, null, predecessorSemantic, 'typed-envelope-v1', 0, 'importer', 'import');
  db.prepare('INSERT INTO document_revision VALUES(?,?,?,?,?,?,?,?)')
    .run(sourceId, revision, predecessor, semanticSha256, 'typed-envelope-v1', 3, actor, reason);
  db.prepare('INSERT INTO document_head VALUES(?,?)').run(sourceId, revision);
  for (const id of [predecessor, revision]) db.prepare('INSERT INTO document_revision_seal VALUES(?)').run(id);
  return { db, reference: { sourceId, revision, semanticSha256, sourceSha256 },
    pin: { revision, semanticSha256, sourceSha256, predecessor, predecessorSemantic } };
}

test('sealed same-source successor accepts only its independently authored chain tuple', t => {
  // Given: real sealed predecessor/head rows and a separately constructed pin.
  const f = fixture(t);
  // When / Then: verification returns normally without altering the stored head.
  assert.doesNotThrow(() => verifyReferenceSuccessorChain(f.db, f.reference, f.pin));
});

for (const [name, mutate] of [
  ['wrong revision', f => { f.reference.revision = '0'.repeat(64); }],
  ['wrong source', f => { f.reference.sourceSha256 = '0'.repeat(64); }],
  ['wrong semantic pin', f => { f.pin.semanticSha256 = '0'.repeat(64); }],
  ['missing head seal', f => f.db.prepare('DELETE FROM document_revision_seal WHERE revision_id=?').run(f.pin.revision)],
  ['missing parent seal', f => f.db.prepare('DELETE FROM document_revision_seal WHERE revision_id=?').run(f.pin.predecessor)],
  ['wrong algorithm', f => f.db.prepare("UPDATE document_revision SET algorithm='other' WHERE revision_id=?").run(f.pin.revision)],
  ['wrong parent', f => f.db.prepare('UPDATE document_revision SET parent_revision=? WHERE revision_id=?').run('0'.repeat(64), f.pin.revision)],
  ['wrong predecessor semantic', f => f.db.prepare('UPDATE document_revision SET semantic_sha256=? WHERE revision_id=?').run('0'.repeat(64), f.pin.predecessor)],
  ['cross-source parent', f => f.db.prepare('UPDATE document_revision SET source_id=2 WHERE revision_id=?').run(f.pin.predecessor)],
  ['changed reason', f => f.db.prepare("UPDATE document_revision SET reason='unapproved' WHERE revision_id=?").run(f.pin.revision)],
  ['changed actor', f => f.db.prepare("UPDATE document_revision SET actor='unapproved' WHERE revision_id=?").run(f.pin.revision)],
  ['non-increasing sequence', f => f.db.prepare('UPDATE document_revision SET sequence=0 WHERE revision_id=?').run(f.pin.revision)],
]) test(`successor chain rejects ${name}`, t => {
  // Given: one independently invalid chain field, without changing the pin to fit.
  const f = fixture(t); mutate(f);
  // When / Then: the real SQLite-backed verification fails closed.
  assert.throws(() => verifyReferenceSuccessorChain(f.db, f.reference, f.pin), /E_REFERENCE_SUCCESSOR_CHAIN/u);
});

test('unrecognized source has no successor authority and never consults storage', () => {
  // Given: no authored successor for this path.
  const db = { prepare() { throw Error('unexpected storage'); } };
  // When / Then: null means the caller must retain its default import checks.
  assert.equal(readReferenceSuccessor(db, { logicalPath: 'unapproved', expectedSha256: 'a'.repeat(64) }), null);
});

test('changed independent approval bytes reject before any approved body can be selected', () => {
  // Given: an unavailable/corrupt application receipt, not a caller-authored approval.
  const readBytes = () => Buffer.from('{}');
  // When / Then: the source-bound approval reader fails closed before selecting bodies.
  assert.throws(() => authenticateExactBodyApproval('/fixture', readBytes), /E_PUBLICATION_EXACT_BODY_APPROVAL/u);
});

test('approved complete body contributes order only and rejects an extra typed delta', () => {
  // Given: independently approved body and equal typed reconstruction.
  const approved = { title: 'approved', content: [{ en: 'body', ko: '본문' }] };
  const typed = { content: [{ ko: '본문', en: 'body' }], title: 'approved' };
  // When / Then: the existing exact-body boundary preserves order without values from a fallback.
  assert.equal(JSON.stringify(preserveReceiptOrder(typed, approved)), JSON.stringify(approved));
  typed.content[0].en = 'unapproved delta';
  assert.throws(() => preserveReceiptOrder(typed, approved), /E_RECEIPT_VALUE_MISMATCH/u);
});

for (const extra of [false, true]) test(`Atlas delta ${extra ? 'rejects unrelated edits' : 'accepts exact affiliation edits'}`, () => {
  // Given: two approved affiliation changes and no authority for other content.
  const predecessor = { status: 'approved', title: 'unchanged', data: { atlas: { additional_people: {
    K1003: { national_state_id: null }, K1008: { national_state_id: 'polity:daejeon' },
  } } } };
  const current = structuredClone(predecessor);
  current.status = 'draft';
  current.data.atlas.additional_people.K1003.national_state_id = 'S02';
  current.data.atlas.additional_people.K1008.national_state_id = 'S02';
  if (extra) current.title = 'not approved';
  // When / Then: the real reader's exact-delta check accepts only the complete expected body.
  const verify = () => verifyReferenceSuccessorDelta({ predecessor, current });
  if (extra) assert.throws(verify, /E_REFERENCE_SUCCESSOR_DELTA/u);
  else assert.doesNotThrow(verify);
});

for (const variation of ['exact', 'missing-before', 'extra-body']) test(`wording delta verifies ${variation}`, () => {
  // Given: independently specified wording amendment, not arbitrary replacement content.
  const predecessor = { content: [{ anchor: 's08', text: { ko: 'old wording', en: 'old' } }], title: 'stable' };
  const current = { content: [{ anchor: 's08', text: { ko: 'new wording', en: 'old' } }], title: 'stable' };
  const changes = [{ nodeId: 's08', slot: 'text/ko', before: 'old wording', after: 'new wording' }];
  if (variation === 'missing-before') changes[0].before = 'not present';
  if (variation === 'extra-body') current.title = 'unapproved';
  // When / Then: missing exact preimage or extra differences fail closed.
  const verify = () => verifyReferenceSuccessorDelta({ predecessor, current, changes });
  if (variation === 'exact') assert.doesNotThrow(verify);
  else assert.throws(verify, /E_REFERENCE_SUCCESSOR_DELTA/u);
});
