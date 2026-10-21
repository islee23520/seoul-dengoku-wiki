import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { isDeepStrictEqual } from 'node:util';

const APPLICATION_ID = 0x57455052;
const VERSION = 1;
const KINDS = ['ownerapproval', 'review', 'packet', 'baseline', 'registry', 'archive'];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code) => Object.assign(new Error(code), { code });

// Explicit same-process trust, not authentication. Do not pass this capability
// or an opened archive to public handlers. There is deliberately no public API.
export const INTERNAL_EVIDENCE_CAPABILITY = Symbol('internal evidence archive');

function text(value, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.length) || value.includes('\0')) throw fail('E_METADATA');
  return value;
}

function digest(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw fail('E_SHA256');
  return value;
}

function references(input) {
  if (!Array.isArray(input)) throw fail('E_REFERENCES');
  const rows = input.map((ref) => {
    const pointer = text(ref.pointer, true);
    if (!/^(?:\/(?:[^~]|~[01])*)*$/.test(pointer)) throw fail('E_POINTER');
    return { type: text(ref.type), pointer, targetIdentity: text(ref.targetIdentity), expectedSha256: digest(ref.expectedSha256) };
  });
  rows.sort((a, b) => {
    const left = JSON.stringify([a.type, a.pointer, a.targetIdentity]);
    const right = JSON.stringify([b.type, b.pointer, b.targetIdentity]);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const seen = new Set();
  for (const ref of rows) {
    const key = JSON.stringify([ref.type, ref.pointer, ref.targetIdentity]);
    if (seen.has(key)) throw fail('E_DUPLICATE_REFERENCE');
    seen.add(key);
  }
  return rows;
}

function recordDigest(record, refs) {
  return hash(JSON.stringify([record.identity, record.kind, record.logicalPath, record.revision,
    record.gitRevision, record.gitBlob, record.sha256, record.byteLength, refs]));
}

/** Bounded immutable evidence archive, not current domain authority or approval
 * evaluation. Caller supplies exact bytes and known-schema dependencies in memory.
 * Paths are inert metadata; no directory admission, JSON traversal, or source-file
 * reads occur. Archiving an ownerapproval does not mint or validate an approval.
 * Full authority cutover still requires the separately approved private closure.
 */
export function openEvidenceStore(path, { capability, create = false, readOnly = true, scope } = {}) {
  if (capability !== INTERNAL_EVIDENCE_CAPABILITY || (scope !== undefined && scope !== 'internal')) throw fail('E_PRIVATE');
  if (create && readOnly) throw fail('E_READ_ONLY');
  if (create) closeSync(openSync(path, 'wx', 0o600));
  let db;
  function checkPolicy() {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID ||
        db.prepare('PRAGMA user_version').get().user_version !== VERSION) throw fail('E_SCHEMA');
    const policy = db.prepare('SELECT singleton, privacy FROM evidence_policy').all();
    if (policy.length !== 1 || policy[0].singleton !== 1 || policy[0].privacy !== 'restricted-internal-only') throw fail('E_PRIVATE');
  }
  try {
    db = new DatabaseSync(path, { readOnly: !create, enableForeignKeyConstraints: true });
    if (create) {
      db.exec('BEGIN IMMEDIATE');
      db.exec(readFileSync(new URL('./evidence.sql', import.meta.url), 'utf8'));
      db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${VERSION}; COMMIT`);
    }
    checkPolicy();
    if (!create && !readOnly) {
      db.close();
      db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
      checkPolicy();
    }
    if (readOnly) db.exec('PRAGMA query_only=ON');
  } catch (error) {
    if (db?.isOpen) db.close();
    if (create) unlinkSync(path);
    throw error;
  }

  function snapshot(fn, write = false) {
    if (write && readOnly) throw fail('E_READ_ONLY');
    db.exec(write ? 'BEGIN IMMEDIATE' : 'BEGIN');
    try {
      checkPolicy();
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }

  function read(identity, expectedSha256) {
    text(identity);
    digest(expectedSha256);
    const row = db.prepare('SELECT * FROM evidence WHERE identity = ?').get(identity);
    if (!row) throw fail('E_NOT_FOUND');
    if (row.sha256 !== expectedSha256) throw fail('E_SHA_MISMATCH');
    const bytes = Buffer.from(row.raw_bytes);
    if (bytes.length !== row.byte_length || hash(bytes) !== row.sha256) throw fail('E_INTEGRITY');
    const refs = references(db.prepare(`SELECT type, pointer, target_identity AS targetIdentity,
      expected_sha256 AS expectedSha256 FROM evidence_reference WHERE source_identity = ?`).all(identity));
    const metadata = { identity: row.identity, kind: row.kind, logicalPath: row.logical_path,
      revision: row.revision, gitRevision: row.git_revision, gitBlob: row.git_blob,
      sha256: row.sha256, byteLength: row.byte_length };
    if (recordDigest(metadata, refs) !== row.record_sha256) throw fail('E_INTEGRITY');
    return { metadata, bytes, refs };
  }

  function closure(roots) {
    if (!Array.isArray(roots)) throw fail('E_REFERENCES');
    const pending = roots.map((root) => ({ identity: text(root.identity), expectedSha256: digest(root.expectedSha256) }));
    const visited = new Map();
    while (pending.length) {
      const { identity, expectedSha256 } = pending.pop();
      if (visited.has(identity)) {
        if (visited.get(identity) !== expectedSha256) throw fail('E_SHA_MISMATCH');
        continue;
      }
      const record = read(identity, expectedSha256);
      visited.set(identity, expectedSha256);
      for (const ref of record.refs) pending.push({ identity: ref.targetIdentity, expectedSha256: ref.expectedSha256 });
    }
    return [...visited].map(([identity, sha256]) => ({ identity, sha256 })).sort((a, b) => a.identity < b.identity ? -1 : a.identity > b.identity ? 1 : 0);
  }

  return Object.freeze({
    close: () => db.close(),
    getEvidence: (identity, expectedSha256) => snapshot(() => read(identity, expectedSha256).bytes),
    describeEvidence: (identity, expectedSha256) => snapshot(() => read(identity, expectedSha256).metadata),
    listReferences: (identity, expectedSha256) => snapshot(() => read(identity, expectedSha256).refs),
    verifyClosure: (roots) => snapshot(() => closure(roots)),
    importBatch(entries) {
      return snapshot(() => {
        if (!Array.isArray(entries)) throw fail('E_ENTRIES');
        const roots = [];
        for (const input of entries) {
          if (!(input.bytes instanceof Uint8Array)) throw fail('E_BYTES');
          const bytes = Buffer.from(input.bytes);
          const sha256 = digest(input.sha256);
          if (hash(bytes) !== sha256) throw fail('E_SHA_MISMATCH');
          const kind = text(input.kind);
          if (!KINDS.includes(kind)) throw fail('E_KIND');
          const metadata = { identity: text(input.identity), kind, logicalPath: text(input.logicalPath),
            revision: text(input.revision), gitRevision: input.gitRevision == null ? null : text(input.gitRevision),
            gitBlob: input.gitBlob == null ? null : text(input.gitBlob), sha256, byteLength: bytes.length };
          const refs = references(input.references);
          const old = db.prepare('SELECT sha256 FROM evidence WHERE identity = ?').get(metadata.identity);
          if (old) {
            const existing = read(metadata.identity, old.sha256);
            if (!isDeepStrictEqual(existing.metadata, metadata) || !isDeepStrictEqual(existing.refs, refs) || !existing.bytes.equals(bytes)) throw fail('E_IDENTITY_CONFLICT');
          } else {
            const insertRef = db.prepare('INSERT INTO evidence_reference VALUES (?, ?, ?, ?, ?)');
            for (const ref of refs) insertRef.run(metadata.identity, ref.type, ref.pointer, ref.targetIdentity, ref.expectedSha256);
            db.prepare('INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(metadata.identity,
              kind, metadata.logicalPath, metadata.revision, metadata.gitRevision, metadata.gitBlob,
              bytes, sha256, bytes.length, recordDigest(metadata, refs));
          }
          roots.push({ identity: metadata.identity, expectedSha256: sha256 });
        }
        return closure(roots);
      }, true);
    },
  });
}
