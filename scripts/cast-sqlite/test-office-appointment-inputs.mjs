import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { OFFICE_APPOINTMENT_SOURCE_HASH, initializeOfficeAppointmentInputs, readOfficeAppointmentInputs } from './office-appointment-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';
import { readSourceArchive } from './source-archive.mjs';
import { currentOfficeAppointments } from '../person-detail-inputs.mjs';
import { readApprovedDataSource } from './data-source-editor.mjs';

test('valid appointment sets and tiers may change while malformed inputs reject', () => {
  const issued = new Map(['fixture-a', 'fixture-b'].map(id => [id, {}]));
  const appointment = (personId, commonTier) => ({ personId, stateId: 'S01',
    history: { personId, stateId: 'S01', position: { ko: '직책', en: 'Office' },
      rank: { ko: '직급', en: 'Rank' }, commonTier, approvalRef: 'fixture-approval' },
    current: { status: 'existing-function', position: { ko: '직무', en: 'Function' }, rank: null,
      commonTier, evidence: [{ kind: 'existing-function', path: 'fixture.json', jsonPointer: '/function' }] } });
  for (const rows of [[appointment('fixture-a', 'T1')], [appointment('fixture-b', 'T5'), appointment('fixture-a', 'T3')]]) {
    const source = { schema: 'opening-office-appointments.v2', appointments: rows };
    assert.deepEqual([...currentOfficeAppointments(source, issued).keys()], rows.map(row => row.personId));
    assert.deepEqual([...currentOfficeAppointments(source, issued).values()].map(row => row.commonTier), rows.map(row => row.current.commonTier));
    for (const mutate of [
      value => { value.appointments[0].current.commonTier = 'T6'; },
      value => { value.appointments[0].history.personId = 'wrong-person'; },
      value => { value.appointments.push(structuredClone(value.appointments[0])); },
    ]) {
      const malformed = structuredClone(source);
      mutate(malformed);
      assert.throws(() => currentOfficeAppointments(malformed, issued), /E_OPENING_OFFICE/u);
    }
  }
});

if (process.env.OFFICE_CURRENT_DB) {
  test('approved office source preserves history and rejects typed and chain tampering', async t => {
    const directory = await mkdtemp(join(tmpdir(), 'office-current-'));
    const path = join(directory, 'owned.sqlite');
    await copyFile(process.env.OFFICE_CURRENT_DB, path);
    const db = new DatabaseSync(path);
    t.after(async () => { db.close(); await rm(directory, { recursive: true }); });
    const expected = readApprovedDataSource(db, 'lore/relations/opening-office-appointments.json',
      '3b93a14de55b66f2ba38c6461df57608c42011a992628f57bf73a546e2aff3a8', OFFICE_APPOINTMENT_SOURCE_HASH);
    const actual = readOfficeAppointmentInputs(db);
    assert.deepEqual(actual, expected);
    const issued = new Map(db.prepare('SELECT person_id FROM person').all().map(row => [row.person_id, row]));
    const offices = currentOfficeAppointments(actual, issued);
    assert.deepEqual([...offices.values()], expected.appointments.map(({ personId, stateId, current }) => ({
      personId, stateId, position: current.position?.ko ?? '', rank: current.rank?.ko ?? '', commonTier: current.commonTier,
    })));
    assert.throws(() => currentOfficeAppointments(structuredClone(actual), issued), /E_OPENING_OFFICE/u);
    const altered = readOfficeAppointmentInputs(db);
    altered.appointments[0].current.commonTier = altered.appointments[0].current.commonTier === 'T1' ? 'T2' : 'T1';
    assert.throws(() => currentOfficeAppointments(altered, issued), /E_OPENING_OFFICE/u);
    const unknown = readOfficeAppointmentInputs(db);
    unknown.appointments[0].current.status = 'invented-status';
    assert.throws(() => currentOfficeAppointments(unknown, issued), /E_OPENING_OFFICE/u);
    for (const sql of [
      "UPDATE context_office_appointment SET common_tier=CASE common_tier WHEN 'T1' THEN 'T2' ELSE 'T1' END WHERE rowid=(SELECT min(rowid) FROM context_office_appointment)",
      "UPDATE context_office_history SET common_tier=CASE common_tier WHEN 'T1' THEN 'T2' ELSE 'T1' END WHERE rowid=(SELECT min(rowid) FROM context_office_history)",
      "UPDATE data_source_revision SET approval_ref='unapproved' WHERE source_path='lore/relations/opening-office-appointments.json' AND parent_revision IS NOT NULL",
      "UPDATE data_source_revision SET reason='tampered' WHERE source_path='lore/relations/opening-office-appointments.json' AND parent_revision IS NULL",
      "UPDATE data_source_current SET document_json='{}' WHERE source_path='lore/relations/opening-office-appointments.json'",
    ]) {
      db.exec('BEGIN');
      try { db.exec(sql); assert.throws(() => readOfficeAppointmentInputs(db), { code: 'E_OFFICE_APPOINTMENT_INPUT' }); }
      finally { db.exec('ROLLBACK'); }
    }
    assert.deepEqual(readOfficeAppointmentInputs(db), actual);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  });
} else {

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-court-complete-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(), 'office-appointment-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const sourceBytes = readSourceArchive('lore/relations/opening-office-appointments.json', OFFICE_APPOINTMENT_SOURCE_HASH);
const expected = JSON.parse(sourceBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const authorityHash = hash(await readFile(authority));
const options = { sourceBytes, expectedSourceHash: OFFICE_APPOINTMENT_SOURCE_HASH, actor: 'office-appointment-input-test', reason: 'Exact reconstruction on disposable authority copy' };
const copyPath = join(dir, 'initialized.sqlite');
await copyFile(authority, copyPath);
const db = new DatabaseSync(copyPath);
after(() => db.close());
const code = { code: 'E_OFFICE_APPOINTMENT_INPUT' };
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|archive|raw_bytes|json_(?:extract|tree|each)/iu);
  return connection.prepare(sql);
} });
await initializeOfficeAppointmentInputs(db, options);

test('complete source and every actual appointment reconstruct exactly', async () => {
  assert.equal(hash(sourceBytes), OFFICE_APPOINTMENT_SOURCE_HASH);
  const actual = readOfficeAppointmentInputs(typedOnly(db));
  assert.deepEqual(actual, expected);
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'offices' }), { officeAppointmentSource: expected });
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.appointments.length, 95);
  for (const [i, appointment] of actual.appointments.entries()) assert.deepEqual(appointment, expected.appointments[i]);
  assert.equal(actual.appointments.reduce((n, a) => n + a.current.evidence.length, 0), 114);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('fresh import and readonly reopened readers deny source filesystem and JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('source read/JSON.parse denied'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (path, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? originalRead(path, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readOfficeAppointmentInputs } = await import(${JSON.stringify(new URL('./office-appointment-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(copyPath)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|archive|raw_bytes|json_(?:extract|tree|each)/i);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readOfficeAppointmentInputs(typed))).digest('hex'), ${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('OFFICE_APPOINTMENTS_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /OFFICE_APPOINTMENTS_DB_ONLY_EXACT/u);
});

test('terminal rows, changed values, null metadata, unknown fields and receipt mutations reject', () => {
  assert.throws(() => readOfficeAppointmentInputs(db, { expectedSourceHash: '0'.repeat(64) }), code);
  const tables = ['context_office_appointment', 'context_office_history', 'context_office_evidence', 'office_appointment_input_contract', 'office_appointment_input_key'];
  const statements = tables.map(table => `DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
  statements.push("UPDATE context_office_appointment SET position_ko=position_ko||' changed' WHERE person_id='K423'",
    "UPDATE context_office_history SET position_en=position_en||' changed' WHERE person_id='K423'",
    "UPDATE context_office_evidence SET reference_path=reference_path||' changed' WHERE rowid=1",
    "UPDATE office_appointment_input_contract SET rights=rights||' changed'",
    "UPDATE office_appointment_input_key SET is_null=1 WHERE object_path='/appointments/0/current' AND key='position'",
    "UPDATE office_appointment_input_key SET key='unknown' WHERE rowid=1",
    `UPDATE office_appointment_input_import SET source_sha256='${'0'.repeat(64)}'`);
  for (const sql of statements) {
    db.exec('BEGIN');
    db.exec('PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readOfficeAppointmentInputs(typedOnly(db)), code, sql); }
    finally { db.exec('ROLLBACK'); }
  }
  assert.equal(JSON.stringify(readOfficeAppointmentInputs(db)), JSON.stringify(expected));
});

test('initializer rejects wrong bytes, pins, unknown source fields, actor and reason', async () => {
  const unknown = { ...expected, unknown: 'not admitted' };
  const unknownBytes = Buffer.from(JSON.stringify(unknown));
  for (const change of [{ sourceBytes: Buffer.from('{}') }, { expectedSourceHash: '0'.repeat(64) },
    { sourceBytes: unknownBytes }, { sourceBytes: unknownBytes, expectedSourceHash: hash(unknownBytes) }, { actor: '' }, { reason: ' ' }]) {
    await assert.rejects(initializeOfficeAppointmentInputs(db, { ...options, ...change }), code);
  }
  await assert.rejects(initializeOfficeAppointmentInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  db.exec('BEGIN');
  try { await assert.rejects(initializeOfficeAppointmentInputs(db, options), code); }
  finally { db.exec('ROLLBACK'); }
});

test('initializer rolls back all new tables on typed divergence or injected unknown fields', async () => {
  for (const scenario of ['changed-domain', 'unknown-field', 'wrong-source-pin']) {
    const brokenPath = join(dir, `${scenario}.sqlite`);
    await copyFile(authority, brokenPath);
    const broken = new DatabaseSync(brokenPath);
    try {
      if (scenario === 'changed-domain') broken.exec("UPDATE context_office_history SET position_ko=position_ko||' divergence' WHERE rowid=1");
      const connection = scenario === 'changed-domain' ? broken : {
        get isTransaction() { return broken.isTransaction; },
        prepare(sql) {
          if (scenario === 'wrong-source-pin' && sql.startsWith('SELECT source_id,sha256')) return {
            all(...args) { return broken.prepare(sql).all(...args).map(r => ({ ...r, sha256: '0'.repeat(64) })); }
          };
          return broken.prepare(sql);
        },
        exec(sql) {
          broken.exec(sql);
          if (scenario === 'unknown-field' && sql.startsWith('CREATE TABLE office_appointment_input_import')) broken.exec("INSERT INTO office_appointment_input_key VALUES('',4,'unknown',0)");
        }
      };
      await assert.rejects(initializeOfficeAppointmentInputs(connection, options), code);
      assert.equal(broken.isTransaction, false);
      assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'office_appointment_input_%'").get().n, 0);
    } finally { broken.close(); }
  }
});

test('original authority bytes remain unchanged', async () => {
  assert.equal(hash(await readFile(authority)), authorityHash);
});
}
