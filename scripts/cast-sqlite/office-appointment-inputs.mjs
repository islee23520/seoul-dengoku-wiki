import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export const OFFICE_APPOINTMENT_SOURCE_HASH = 'de70382bed6464c5b2651f71ab7e13cc710512dbd1e0422a1c6b78980041a794';
const logicalPath = 'lore/relations/opening-office-appointments.json';
const fail = detail => { throw Object.assign(new Error(`E_OFFICE_APPOINTMENT_INPUT: ${detail}`), { code: 'E_OFFICE_APPOINTMENT_INPUT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(value));
const tables = ['context_office_appointment', 'context_office_history', 'context_office_evidence'];

function domains(db, sourceId) {
  return Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table} WHERE source_id=? ORDER BY json_pointer`).all(sourceId)]));
}

function candidate(db, data) {
  const contracts = db.prepare('SELECT * FROM office_appointment_input_contract').all();
  if (contracts.length !== 1) fail('contract metadata');
  const c = contracts[0], used = new Set();
  const localized = (row, prefix) => row[`${prefix}_ko`] === null && row[`${prefix}_en`] === null
    ? null : { ko: row[`${prefix}_ko`], en: row[`${prefix}_en`] };
  const first = data.context_office_appointment[0];
  if (!first) fail('missing appointments');
  const appointments = [...data.context_office_appointment].sort((a, b) => Number(a.json_pointer.split('/')[2]) - Number(b.json_pointer.split('/')[2])).map((r, i) => {
    if (r.json_pointer !== `/appointments/${i}/current` || r.source_schema !== first.source_schema || r.opening_year !== first.opening_year) fail('appointment order/contract');
    const history = data.context_office_history.filter(h => h.person_id === r.person_id);
    if (history.length !== 1 || history[0].json_pointer !== `/appointments/${i}/history`) fail('history identity');
    const h = history[0]; used.add(h);
    const evidence = data.context_office_evidence.filter(e => e.person_id === r.person_id).sort((a, b) => a.ordinal - b.ordinal).map((e, j) => {
      if (e.ordinal !== j || e.json_pointer !== `/appointments/${i}/current/evidence/${j}`) fail('evidence order');
      used.add(e);
      return { path: e.reference_path, jsonPointer: e.reference_pointer, kind: e.evidence_kind };
    });
    return { personId: r.person_id, stateId: r.polity_id,
      history: { personId: h.person_id, stateId: h.polity_id, position: localized(h, 'position'), rank: localized(h, 'rank'), commonTier: h.common_tier, approvalRef: h.approval_ref },
      current: { status: r.status, position: localized(r, 'position'), rank: localized(r, 'rank'), commonTier: r.common_tier, evidence } };
  });
  if (data.context_office_history.some(r => !used.has(r)) || data.context_office_evidence.some(r => !used.has(r))) fail('unconsumed typed rows');
  return { schema: first.source_schema, openingYear: first.opening_year,
    contract: { history: c.history, current: c.current, commonTier: c.common_tier, rights: c.rights }, appointments };
}

function orderedDocument(db, value) {
  const groups = new Map();
  for (const r of db.prepare('SELECT * FROM office_appointment_input_key ORDER BY object_path,ordinal').all()) {
    if (!groups.has(r.object_path)) groups.set(r.object_path, []);
    groups.get(r.object_path).push(r);
  }
  const visit = (v, path) => {
    if (Array.isArray(v)) return v.map((child, i) => visit(child, `${path}/${i}`));
    if (v === null || typeof v !== 'object') return v;
    const keys = groups.get(path);
    if (!keys) fail(`${path}:missing keys`);
    groups.delete(path);
    return Object.fromEntries(keys.map((r, i) => {
      if (r.ordinal !== i || !Object.hasOwn(v, r.key) || v[r.key] === undefined || ![0, 1].includes(r.is_null) || (r.is_null && v[r.key] !== null)) fail(`${path}:${r.key}:presence`);
      return [r.key, r.is_null ? null : visit(v[r.key], `${path}/${r.key}`)];
    }));
  };
  const result = visit(value, '');
  if (groups.size) fail('unconsumed keys');
  return result;
}

// Runtime uses typed SELECTs only; initialization is an explicit separate step.
export function readOfficeAppointmentInputs(db, { expectedSourceHash = OFFICE_APPOINTMENT_SOURCE_HASH } = {}) {
  try {
    const receipts = db.prepare('SELECT * FROM office_appointment_input_import').all();
    if (receipts.length !== 1 || expectedSourceHash !== OFFICE_APPOINTMENT_SOURCE_HASH || receipts[0].source_sha256 !== expectedSourceHash) fail('source receipt');
    const m = receipts[0], data = domains(db, m.source_id);
    if (digest(data) !== m.domain_sha256) fail('typed domain digest');
    const result = orderedDocument(db, candidate(db, data));
    if (digest(result) !== m.document_sha256) fail('document digest');
    return result;
  } catch (error) { if (error.code === 'E_OFFICE_APPOINTMENT_INPUT') throw error; fail(error.message); }
}

export async function initializeOfficeAppointmentInputs(db, { sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array) || expectedSourceHash !== OFFICE_APPOINTMENT_SOURCE_HASH || hash(sourceBytes) !== expectedSourceHash) fail('source bytes/hash');
  if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (db.isTransaction) fail('active transaction');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  const identity = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').all(logicalPath);
  if (identity.length !== 1 || identity[0].sha256 !== expectedSourceHash) fail('source identity');
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('./office-appointment-inputs.sql', import.meta.url), 'utf8');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schema);
    const addKey = db.prepare('INSERT INTO office_appointment_input_key VALUES(?,?,?,?)');
    const walk = (v, path) => {
      if (Array.isArray(v)) { v.forEach((child, i) => walk(child, `${path}/${i}`)); return; }
      if (v === null || typeof v !== 'object') return;
      Object.entries(v).forEach(([key, child], ordinal) => { addKey.run(path, ordinal, key, Number(child === null)); walk(child, `${path}/${key}`); });
    };
    walk(document, '');
    const c = document.contract;
    db.prepare('INSERT INTO office_appointment_input_contract VALUES(1,?,?,?,?)').run(c.history, c.current, c.commonTier, c.rights);
    db.prepare('INSERT INTO office_appointment_input_import VALUES(1,?,?,?,?,?,?)').run(identity[0].source_id, expectedSourceHash, digest(document), digest(domains(db, identity[0].source_id)), actor, reason);
    const actual = readOfficeAppointmentInputs(db);
    if (!isDeepStrictEqual(actual, document) || JSON.stringify(actual) !== JSON.stringify(document)) fail('source parity');
    db.exec('COMMIT');
    return actual;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
