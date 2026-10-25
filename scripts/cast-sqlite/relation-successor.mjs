import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

export const RELATION_SUCCESSOR = Object.freeze({
  logicalPath: 'lore/relations/relations.json',
  sourceSha256: '6a0a48a6540c16a848de8e14caa1d8df628eeceab5465c454afdbfdb5fa8a3c2',
  bootstrapDigest: 'cb4bef618c7c383dff2ccc456089283037c4f589092bfa55665648138cdfc9b3',
  semanticSha256: '438c00ccd559a398980b6619e08d9a0d2f49f1f6bcd0df2b8b970a44c68caeb2',
  // Selected metadata restrictions, not independent authorship evidence.
  revision: '23a2113375c29e01c4603a5a3800c60ca10994250403b7fe58d006977b01146c',
  parent: 'daa8fb3c61309501e9e877a5ec9a093f00d9c4c941b90773d1334bfe2c84f47c',
  sequence: 7,
  approvalRef: 'scripts/approved-seoul-faction-consolidation-20261022.json',
  approvalSha256: 'd0378abb6ef9578a847c133247faabb06d758b968d35f1193b4e4feb83701c54',
});

const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value !== null && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(canonical(value)));
const fail = () => { throw Object.assign(new Error('E_RELATION_SUCCESSOR'), { code: 'E_RELATION_SUCCESSOR' }); };

// A read-only identity verifier. The production selector below supplies the fixed
// independent pin; this seam also permits representative in-memory regressions.
export function verifyRelationSuccessor(db, { pin, projection, bootstrapDigest }) {
  const archives = db.prepare('SELECT sha256,raw_bytes FROM source_file WHERE logical_path=?').all(pin.logicalPath);
  const heads = db.prepare('SELECT * FROM data_source_head WHERE source_path=?').all(pin.logicalPath);
  const current = db.prepare('SELECT * FROM data_source_current WHERE source_path=?').all(pin.logicalPath);
  if (archives.length !== 1 || heads.length !== 1 || current.length !== 1) fail();
  const archive = archives[0], head = heads[0], body = current[0];
  if (archive.sha256 !== pin.sourceSha256 || hash(archive.raw_bytes) !== pin.sourceSha256
    || head.archived_sha256 !== pin.sourceSha256 || head.revision_id !== pin.revision
    || body.revision_id !== head.revision_id || bootstrapDigest !== pin.bootstrapDigest) fail();
  const original = JSON.parse(Buffer.from(archive.raw_bytes).toString('utf8'));
  const approved = JSON.parse(body.document_json);
  if (digest(original) !== pin.bootstrapDigest || digest(approved) !== pin.semanticSha256
    || !isDeepStrictEqual(projection, approved)) fail();
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
  const predecessor = structuredClone(approved);
  if (predecessor.courts[13]?.id !== 'court:K1008' || predecessor.courts[13].stateId !== 'S02') fail();
  predecessor.courts[13].stateId = 'polity:daejeon';
  if (!isDeepStrictEqual(predecessor, original)) fail();
  return approved;
}

export function readApprovedRelationSuccessor(db, { projection, sourceSha256, bootstrapDigest }) {
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'").get()) return null;
  const heads = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').all(RELATION_SUCCESSOR.logicalPath);
  if (heads.length === 0) return null;
  if (sourceSha256 !== RELATION_SUCCESSOR.sourceSha256) fail();
  const bytes = readFileSync(new URL('../approved-seoul-faction-consolidation-20261022.json', import.meta.url));
  if (hash(bytes) !== RELATION_SUCCESSOR.approvalSha256) fail();
  return verifyRelationSuccessor(db, { pin: RELATION_SUCCESSOR, projection, bootstrapDigest });
}

// Complete historical-value equality, not replacement of the retained bytes.
export function verifyRelationHistoricalProjection(current, original) {
  const predecessor = structuredClone(current);
  if (predecessor.courts[13]?.id !== 'court:K1008' || predecessor.courts[13].stateId !== 'S02') fail();
  predecessor.courts[13].stateId = 'polity:daejeon';
  if (!isDeepStrictEqual(predecessor, original)) fail();
}
