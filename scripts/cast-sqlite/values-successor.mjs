import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

export const VALUES_SUCCESSOR = Object.freeze({
  logicalPath: 'lore/name-pools/values-cast.json',
  sourceSha256: '19a30e156065f6c2f59b3d2ea7b0226e887ea60d610b70d10e588937407620e2',
  bootstrapDigest: '89565de28a95de7fe0e2e8bbd9fbba6dfe838bdf60f23cb47137fdb290994cf8',
  semanticSha256: '5750d72c1c7533e0cf9b59c11448c8d777c54f0f5758ef0fbe8cbe25c092265c',
  // Diagnostic metadata restricts selection; it is not authorship evidence.
  revision: '8ff99f6e818541b4f4caa9f2baa80629ee6aff32e9649cf7b3cc8a55d31af262',
  parent: '3ce6f2e433cfcd8b087b08af51d9df014b53f9192ad5e25ce39d5b1e9fc4be3a',
  sequence: 1,
  approvalRef: 'scripts/approved-seoul-faction-consolidation-20261022.json',
  approvalSha256: 'd0378abb6ef9578a847c133247faabb06d758b968d35f1193b4e4feb83701c54',
});
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value !== null && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(canonical(value)));
const fail = () => { throw Object.assign(new Error('E_VALUES_SUCCESSOR'), { code: 'E_VALUES_SUCCESSOR' }); };

// The independent complete semantic pin fixes the two successor title strings.
// Reversal changes only the twelve approved leaves, never scores or desires.
export function verifyValuesHistoricalProjection(current, original, pin = VALUES_SUCCESSOR) {
  if (digest(current) !== pin.semanticSha256 || digest(original) !== pin.bootstrapDigest) fail();
  const predecessor = structuredClone(current);
  for (const [index, name, state, title] of [
    [34, '장우석', 'polity:daejeon', false],
    [37, '허다온', 'polity:daejeon', false],
    [38, '구찬솔', 'polity:daejeon', false],
    [1002, '조재표', 'S00', true],
    [1007, '민웅기', 'polity:daejeon', true],
  ]) {
    const person = predecessor.people?.[index], before = original.people?.[index];
    if (person?.name !== name || before?.name !== name || person.state !== 'S02'
      || person.state_name !== '규격맹' || before.state !== state
      || before.state_name !== (state === 'S00' ? '무소속' : '대전')) fail();
    person.state = before.state;
    person.state_name = before.state_name;
    if (title) {
      if (typeof person.title !== 'string' || typeof before.title !== 'string' || person.title === before.title) fail();
      person.title = before.title;
    }
  }
  if (!isDeepStrictEqual(predecessor, original)) fail();
}

// The production selector supplies fixed independent pins. Representative tests
// can exercise the same verifier with synthetic, nonempty archived documents.
export function verifyValuesSuccessor(db, { pin, projection, approvalBytes }) {
  if (hash(approvalBytes) !== pin.approvalSha256) fail();
  const archives = db.prepare('SELECT sha256,raw_bytes FROM source_file WHERE logical_path=?').all(pin.logicalPath);
  const heads = db.prepare('SELECT * FROM data_source_head WHERE source_path=?').all(pin.logicalPath);
  const current = db.prepare('SELECT * FROM data_source_current WHERE source_path=?').all(pin.logicalPath);
  if (archives.length !== 1 || heads.length !== 1 || current.length !== 1) fail();
  const archive = archives[0], head = heads[0], body = current[0];
  if (archive.sha256 !== pin.sourceSha256 || hash(archive.raw_bytes) !== pin.sourceSha256
    || head.archived_sha256 !== pin.sourceSha256 || head.revision_id !== pin.revision
    || body.revision_id !== head.revision_id) fail();
  const original = JSON.parse(Buffer.from(archive.raw_bytes).toString('utf8'));
  const approved = JSON.parse(body.document_json);
  if (!isDeepStrictEqual(projection, approved)) fail();
  verifyValuesHistoricalProjection(approved, original, pin);
  let revision = head.revision_id, sequence = Infinity;
  const seen = new Set();
  while (revision !== null) {
    if (seen.has(revision)) fail();
    seen.add(revision);
    const rows = db.prepare('SELECT * FROM data_source_revision WHERE revision_id=?').all(revision);
    if (rows.length !== 1) fail();
    const row = rows[0];
    if (row.source_path !== pin.logicalPath || !Number.isSafeInteger(row.sequence) || row.sequence < 0
      || row.sequence >= sequence
      || digest(['data-source-v1', pin.logicalPath, row.parent_revision, row.semantic_sha256, row.actor, row.reason]) !== revision
      || (revision === head.revision_id && (row.semantic_sha256 !== pin.semanticSha256
        || row.parent_revision !== pin.parent || row.sequence !== pin.sequence))
      || (row.parent_revision === null
        ? row.sequence !== 0 || row.approval_ref !== 'archived' || row.semantic_sha256 !== pin.bootstrapDigest
        : row.approval_ref !== pin.approvalRef)) fail();
    sequence = row.sequence;
    revision = row.parent_revision;
  }
  return approved;
}

export function readApprovedValuesSuccessor(db, { projection, sourceSha256 }) {
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'").get()) return null;
  const heads = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').all(VALUES_SUCCESSOR.logicalPath);
  if (heads.length === 0) return null;
  if (sourceSha256 !== VALUES_SUCCESSOR.sourceSha256) fail();
  const approvalBytes = readFileSync(new URL('../approved-seoul-faction-consolidation-20261022.json', import.meta.url));
  return verifyValuesSuccessor(db, { pin: VALUES_SUCCESSOR, projection, approvalBytes });
}
