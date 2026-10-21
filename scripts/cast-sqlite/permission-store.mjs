import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';
import { parsePersonRightsPermissions } from '../person-rights-permissions.mjs';

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const issued = db => db.prepare('SELECT person_id AS id FROM person ORDER BY person_id').all();
function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(row));
}

/** Explicit one-time import, not a consent grant or publication admission. */
export function initializePermissionStore(db, command) {
  const fields = ['approvedBytes', 'expectedSha256', 'actor', 'reason'];
  if (!command || Object.getPrototypeOf(command) !== Object.prototype || fields.some(k => !Object.hasOwn(command, k))
    || Object.keys(command).some(k => !fields.includes(k))) fail('E_PERMISSION_COMMAND', 'explicit import command required');
  if (typeof command.actor !== 'string' || !command.actor.trim() || typeof command.reason !== 'string' || !command.reason.trim()) fail('E_PERMISSION_PROVENANCE', 'actor and reason required');
  if (!(command.approvedBytes instanceof Uint8Array) || hash(command.approvedBytes) !== command.expectedSha256) fail('E_PERMISSION_HASH', 'source hash mismatch');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_PERMISSION_DATABASE', 'foreign keys required');
  const bytes = Buffer.from(command.approvedBytes);
  const raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  parsePersonRightsPermissions(raw, issued(db));
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='permission_archive'").get()) fail('E_PERMISSION_INITIALIZED', 'one-time import already performed');
    db.exec(readFileSync(new URL('./permission-store.sql', import.meta.url), 'utf8'));
    insert(db, 'permission_archive', { singleton: 1, bytes, sha256: command.expectedSha256, actor: command.actor, reason: command.reason });
    insert(db, 'permission_metadata', { singleton: 1, schema: raw.schema });
    Object.entries(raw.persons).forEach(([person_id, person], ordinal) => {
      insert(db, 'permission_person', { person_id, ordinal, applicability: person.applicability, identity_basis_ref: person.identityBasisRef,
        external_reuse_requires_separate_subject_permission: Number(person.externalReuseRequiresSeparateSubjectPermission) });
      for (const scope of ['nameUse', 'likenessUse']) {
        if (!Object.hasOwn(person, scope)) continue;
        const p = person[scope];
        insert(db, 'permission_scope', { person_id, scope, is_null: Number(p === null), status: p?.status ?? null,
          date: p?.date ?? null, recorded_on: p?.recordedOn ?? null, evidence_ref: p?.evidenceRef ?? null,
          has_prior_licenses: Number(p !== null && Object.hasOwn(p, 'priorLicenses')) });
        p?.uses.forEach((use, ordinal) => insert(db, 'permission_use', { person_id, scope, ordinal, use }));
        p?.priorLicenses?.forEach((license, ordinal) => insert(db, 'permission_prior_license', { person_id, scope, ordinal,
          source_ref: license.sourceRef, license_ref: license.licenseRef, conditions_ref: license.conditionsRef }));
      }
    });
    insert(db, 'permission_seal', { singleton: 1 });
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'permission_*'").all()) {
      for (const operation of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER ${name}_immutable_${operation} BEFORE ${operation} ON ${name} BEGIN SELECT RAISE(ABORT,'immutable permission authority'); END`);
    }
    return { sourceSha256: command.expectedSha256, persons: Object.keys(raw.persons).length, editable: false };
  });
}

/** Reconstruct source shape from typed rows alone, including absent vs null scopes. */
export function readPermissionStore(db) {
  if (!db.prepare('SELECT 1 FROM permission_seal WHERE singleton=1').get()) fail('E_PERMISSION_UNINITIALIZED', 'sealed import required');
  const raw = { schema: db.prepare('SELECT schema FROM permission_metadata WHERE singleton=1').get().schema, persons: {} };
  for (const row of db.prepare('SELECT * FROM permission_person ORDER BY ordinal').all()) {
    const person = { applicability: row.applicability, identityBasisRef: row.identity_basis_ref,
      externalReuseRequiresSeparateSubjectPermission: Boolean(row.external_reuse_requires_separate_subject_permission) };
    for (const scope of ['nameUse', 'likenessUse']) {
      const p = db.prepare('SELECT * FROM permission_scope WHERE person_id=? AND scope=?').get(row.person_id, scope);
      if (!p) continue;
      if (p.is_null) { person[scope] = null; continue; }
      const permission = { status: p.status,
        uses: db.prepare('SELECT use FROM permission_use WHERE person_id=? AND scope=? ORDER BY ordinal').all(row.person_id, scope).map(r => r.use) };
      for (const [key, column] of [['date', 'date'], ['recordedOn', 'recorded_on'], ['evidenceRef', 'evidence_ref']]) if (p[column] !== null) permission[key] = p[column];
      if (p.has_prior_licenses) permission.priorLicenses = db.prepare('SELECT source_ref,license_ref,conditions_ref FROM permission_prior_license WHERE person_id=? AND scope=? ORDER BY ordinal').all(row.person_id, scope)
        .map(r => ({ sourceRef: r.source_ref, licenseRef: r.license_ref, conditionsRef: r.conditions_ref }));
      person[scope] = permission;
    }
    raw.persons[row.person_id] = person;
  }
  return raw;
}

/** Retain the existing parser's Map contract, using identities issued by this DB. */
export function readParsedPermissionStore(db) {
  return parsePersonRightsPermissions(readPermissionStore(db), issued(db));
}

/** No editor is admitted: no grant minting, widening, history or admission mutation. */
export function updatePermissionStore() {
  fail('E_PERMISSION_READ_ONLY', 'permission revisions are not supported; no changes or public admission were made');
}
