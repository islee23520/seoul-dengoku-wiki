import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { isDeepStrictEqual } from 'node:util';

const APPLICATION_ID = 0x57445351;
const VERSION = 1;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code) => Object.assign(new Error(code), { code });

function text(value, nullable = false) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) throw fail('E_METADATA');
  return value;
}

function tree(value) {
  const rows = [];
  const ancestors = new Set();
  function visit(item, parent = null, position = 0, key = null) {
    const kind = item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item;
    if (!['null', 'object', 'array', 'number', 'boolean', 'string'].includes(kind)) throw fail('E_JSON_VALUE');
    if (kind === 'number' && !Number.isFinite(item)) throw fail('E_JSON_VALUE');
    const id = rows.length;
    rows.push([id, parent, position, key, kind, kind === 'string' ? item : null,
      kind === 'number' ? item : null, kind === 'boolean' ? Number(item) : null, Number(Object.is(item, -0))]);
    if (kind === 'object' || kind === 'array') {
      if (ancestors.has(item) || (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item)))) throw fail('E_JSON_VALUE');
      ancestors.add(item);
      const keys = Object.keys(item);
      if (Reflect.ownKeys(item).length !== keys.length + (kind === 'array' ? 1 : 0)) throw fail('E_JSON_VALUE');
      if (kind === 'array' && (keys.length !== item.length || keys.some((name, i) => name !== String(i)))) throw fail('E_JSON_VALUE');
      keys.forEach((name, i) => {
        const descriptor = Object.getOwnPropertyDescriptor(item, name);
        if (!Object.hasOwn(descriptor, 'value')) throw fail('E_JSON_VALUE');
        visit(descriptor.value, id, i, kind === 'object' ? name : null);
      });
      ancestors.delete(item);
    }
    return id;
  }
  visit(value);
  return rows;
}

function reconstruct(rows) {
  const children = new Map();
  for (const row of rows) {
    const siblings = children.get(row.parent_id) ?? [];
    siblings.push(row);
    children.set(row.parent_id, siblings);
  }
  const roots = children.get(null) ?? [];
  if (roots.length !== 1 || roots[0].node_id !== 0) throw fail('E_TREE_INTEGRITY');
  const visited = new Set();
  function value(row) {
    if (visited.has(row.node_id)) throw fail('E_TREE_INTEGRITY');
    visited.add(row.node_id);
    const nested = children.get(row.node_id) ?? [];
    if (!['array', 'object'].includes(row.kind) && nested.length) throw fail('E_TREE_INTEGRITY');
    switch (row.kind) {
      case 'null': return null;
      case 'string': return row.text_value;
      case 'number':
        if (!Number.isFinite(row.number_value)) throw fail('E_TREE_INTEGRITY');
        return row.negative_zero ? -0 : row.number_value;
      case 'boolean': return Boolean(row.boolean_value);
      case 'object':
      case 'array': {
        const result = row.kind === 'array' ? [] : {};
        nested.forEach((child, i) => {
          if (child.position !== i || (row.kind === 'array' ? child.member_key !== null : child.member_key === null)) throw fail('E_TREE_INTEGRITY');
          const key = row.kind === 'array' ? String(i) : child.member_key;
          if (Object.hasOwn(result, key)) throw fail('E_TREE_INTEGRITY');
          Object.defineProperty(result, key, { value: value(child), enumerable: true, writable: true, configurable: true });
        });
        return result;
      }
      default: throw fail('E_TREE_INTEGRITY');
    }
  }
  const result = value(roots[0]);
  if (visited.size !== rows.length) throw fail('E_TREE_INTEGRITY');
  return result;
}

/** Preservation/revision substrate, NOT the final typed envelope/domain authority.
 * Generic current tree rows support this bounded unit only; the cutover's typed
 * readers/history/domain ownership must replace them before authority migration.
 * Never opens an unrelated/canonical database for mutation.
 * Public is the default scope and can only list/read current public non-editorial records.
 * Internal callers must explicitly request scope: 'internal'; scope is a trust boundary,
 * not an authentication system. No document path is ever read or materialized.
 */
export function openDocumentStore(path, { create = false, scope = 'public', readOnly = scope === 'public' } = {}) {
  if (!['public', 'internal'].includes(scope) || (scope === 'public' && (!readOnly || create))) throw fail('E_SCOPE');
  if (create && readOnly) throw fail('E_READ_ONLY');
  if (create) closeSync(openSync(path, 'wx'));
  let db;
  try {
    db = new DatabaseSync(path, { readOnly: !create, enableForeignKeyConstraints: true });
    if (create) {
      db.exec('BEGIN IMMEDIATE');
      db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
      db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${VERSION}; COMMIT`);
    } else {
      if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== VERSION) throw fail('E_SCHEMA');
      if (!readOnly) {
        db.close();
        db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
      }
    }
    if (readOnly) db.exec('PRAGMA query_only=ON');
  } catch (error) {
    if (db?.isOpen) db.close();
    if (create) unlinkSync(path);
    throw error;
  }

  const internal = () => { if (scope !== 'internal') throw fail('E_SCOPE'); };
  const writable = () => { internal(); if (readOnly) throw fail('E_READ_ONLY'); };
  const visible = scope === 'public' ? " AND privacy = 'public' AND corpus <> 'editorial'" : '';
  function metadata(id, includeRetired = false) {
    text(id);
    return db.prepare(`SELECT id, corpus, privacy, current_revision, retired FROM document WHERE id = ?${includeRetired ? '' : ' AND retired = 0'}${visible}`).get(id);
  }
  function transaction(fn) {
    writable();
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }
  function mutate(input, operation) {
    return transaction(() => {
      const id = text(input.id);
      const old = metadata(id, true);
      if (operation === 'create' && old) throw fail('E_DUPLICATE_ID');
      if (operation !== 'create') {
        if (!old || old.retired) throw fail('E_NOT_FOUND');
        if (!Number.isSafeInteger(input.expectedRevision) || old.current_revision !== input.expectedRevision) throw fail('E_STALE_REVISION');
      }
      const revision = old ? old.current_revision + 1 : 1;
      const corpus = text(input.corpus ?? old?.corpus);
      const privacy = input.privacy ?? old?.privacy;
      if (!['public', 'private', 'editorial'].includes(privacy)) throw fail('E_PRIVACY');
      const approvalState = text(input.approvalState);
      const previous = old && db.prepare('SELECT * FROM document_revision WHERE document_id = ? AND revision = ?').get(id, old.current_revision);
      let bytes, rows;
      if (operation === 'retire') {
        bytes = Buffer.from(previous.raw_bytes);
      } else {
        rows = tree(input.value);
        bytes = input.rawBytes === undefined ? Buffer.from(JSON.stringify(input.value)) : Buffer.from(input.rawBytes);
        // Validate preserved evidence against the tree, without normalizing its bytes.
        const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        // JSON serialization represents negative zero as zero; typed current rows preserve it.
        if (!isDeepStrictEqual(parsed, JSON.parse(JSON.stringify(input.value)))) throw fail('E_BYTES_VALUE');
      }
      const provenance = input.provenance ?? {};
      const mediaType = text(provenance.mediaType ?? previous?.media_type ?? 'application/json');
      const logicalPath = text(provenance.logicalPath ?? previous?.logical_path ?? null, true);
      const gitRevision = text(provenance.gitRevision ?? null, true);
      const gitBlob = text(provenance.gitBlob ?? null, true);
      if (!old) db.prepare('INSERT INTO document(id, corpus, privacy, current_revision) VALUES (?, ?, ?, ?)').run(id, corpus, privacy, revision);
      db.prepare('INSERT INTO document_revision VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, revision, operation, corpus, privacy, approvalState, bytes, hash(bytes), mediaType, logicalPath, gitRevision, gitBlob);
      if (operation !== 'retire') {
        db.prepare('DELETE FROM document_node WHERE document_id = ?').run(id);
        const insert = db.prepare('INSERT INTO document_node VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const row of rows) insert.run(id, ...row);
      }
      db.prepare('UPDATE document SET corpus = ?, privacy = ?, current_revision = ?, retired = ? WHERE id = ?')
        .run(corpus, privacy, revision, Number(operation === 'retire'), id);
      return { id, revision };
    });
  }
  return Object.freeze({
    close: () => db.close(),
    create: (input) => mutate(input, 'create'),
    update: (input) => mutate(input, 'update'),
    retire: (input) => mutate(input, 'retire'),
    list({ corpus, includeRetired = false } = {}) {
      if (includeRetired) internal();
      if (corpus !== undefined) text(corpus);
      return db.prepare(`SELECT id, corpus, current_revision AS revision FROM document WHERE 1 = 1${includeRetired ? '' : ' AND retired = 0'}${visible}${corpus === undefined ? '' : ' AND corpus = ?'} ORDER BY id`).all(...(corpus === undefined ? [] : [corpus])).map((row) => ({ ...row }));
    },
    read(id, { includeRetired = false } = {}) {
      if (includeRetired) internal();
      // Pin metadata and tree to one snapshot when another connection commits an edit.
      db.exec('BEGIN');
      try {
        const row = metadata(id, includeRetired);
        if (!row) { db.exec('COMMIT'); return null; }
        const value = reconstruct(db.prepare('SELECT * FROM document_node WHERE document_id = ? ORDER BY node_id').all(id));
        const result = { id: row.id, corpus: row.corpus, revision: row.current_revision, value };
        if (scope === 'internal') Object.assign(result, { privacy: row.privacy, retired: Boolean(row.retired) });
        db.exec('COMMIT');
        return result;
      } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
    },
    readRevision(id, revision) {
      internal(); text(id);
      if (!Number.isSafeInteger(revision) || revision < 1) throw fail('E_REVISION');
      const row = db.prepare('SELECT * FROM document_revision WHERE document_id = ? AND revision = ?').get(id, revision);
      if (!row) return null;
      const rawBytes = Buffer.from(row.raw_bytes);
      if (hash(rawBytes) !== row.sha256) throw fail('E_REVISION_INTEGRITY');
      return { id: row.document_id, revision: row.revision, operation: row.operation, corpus: row.corpus,
        privacy: row.privacy, approvalState: row.approval_state, rawBytes, sha256: row.sha256,
        provenance: { mediaType: row.media_type, logicalPath: row.logical_path, gitRevision: row.git_revision, gitBlob: row.git_blob } };
    },
  });
}
