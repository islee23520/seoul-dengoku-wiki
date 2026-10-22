import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { authenticatePersonalTierProvenance, assertPersonalTierPreservation, assertBaselinePersonalTiers } from '../personal-tier-provenance.mjs';
import { replayDatabasePersonalTiers } from './person-tier-replay.mjs';
import { loadDatabasePersonProductionInputs } from '../cast-sqlite/person-detail-inputs.mjs';
import './editorial-profile.mjs';
import { loadPersonDetailSources as loadLegacyInputs } from '../person-detail-inputs.mjs';

test('sealed predecessor replay survives a current successor but rejects history tamper', {
  skip: !process.env.PERSON_TIER_CURRENT_DB,
}, async t => {
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { DatabaseSync } = await import('node:sqlite');
  const directory = await fsp.mkdtemp(join(tmpdir(), 'tier-predecessor-'));
  const path = join(directory, 'owned.sqlite');
  await fsp.copyFile(process.env.PERSON_TIER_CURRENT_DB, path);
  const db = new DatabaseSync(path);
  const options = { capability: INTERNAL_EVIDENCE_CAPABILITY };
  const evidenceStore = openEvidenceStore(process.env.WIKI_TIER_EVIDENCE_DB, options);
  const historyStore = openEvidenceStore(process.env.WIKI_TIER_HISTORY_DB, options);
  t.after(async () => { evidenceStore.close(); historyStore.close(); db.close(); await fsp.rm(directory, { recursive: true }); });
  const actual = await replayDatabasePersonalTiers({ db, evidenceStore, historyStore });
  assert.equal(actual.size, 83);
  assert.equal(assertPersonalTierPreservation(actual), actual);
  const core = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get('lore/characters/Core-Characters.json').source_id;
  const head = db.prepare('SELECT r.parent_revision FROM document_head h JOIN document_revision r USING(revision_id) WHERE h.source_id=?').get(core);
  assert.ok(head.parent_revision, 'real current successor present');
  const changedCurrent = { prepare(sql) {
    if (sql.includes('FROM document_head')) throw new Error('historical proof consulted current head');
    return db.prepare(sql);
  } };
  const replay = await replayDatabasePersonalTiers({ db: changedCurrent, evidenceStore, historyStore });
  assert.deepEqual([...replay], [...actual]);
  const tampered = { prepare(sql) {
    const statement = db.prepare(sql);
    if (sql.includes('document_revision_text_document_slot')) return { all: (...args) => statement.all(...args).map(row =>
      row.representation === 'string' ? { ...row, text: row.text + ' historical tamper' } : row) };
    return statement;
  } };
  await assert.rejects(replayDatabasePersonalTiers({ db: tampered, evidenceStore, historyStore }), /E_PERSON_TIER_HISTORY_INTEGRITY/u);
  const wrongArchive = { prepare(sql) {
    const statement = db.prepare(sql);
    if (sql.includes('s.raw_bytes')) return { all: (...args) => statement.all(...args).map(row => ({ ...row, raw_bytes: Buffer.from('{}') })) };
    return statement;
  } };
  await assert.rejects(replayDatabasePersonalTiers({ db: wrongArchive, evidenceStore, historyStore }), /E_PERSON_TIER_HISTORY_REFERENCE/u);
  const wrongSnapshot = { getEvidence(identity, hash) {
    const bytes = evidenceStore.getEvidence(identity, hash);
    if (identity === 'tier-proof:lore/characters/Core-Characters.json') return Buffer.from('{}');
    return bytes;
  } };
  await assert.rejects(replayDatabasePersonalTiers({ db, evidenceStore: wrongSnapshot, historyStore }), /E_PERSON_TIER_TYPED_MISMATCH/u);
  assert.throws(() => assertPersonalTierPreservation(new Map(actual)));
});

test('closed DB replay preserves branded83tiers and sealed predecessor role bindings without filesystem reads', {
  skip: !process.env.PERSON_TIER_REPLAY_DB,
}, async () => {
  const root = new URL('../..', import.meta.url).pathname;
  const expected = await authenticatePersonalTierProvenance(root);
  const legacyInputs = await loadLegacyInputs({ repoRoot: root });
  const db = openReadOnly(process.env.PERSON_TIER_REPLAY_DB);
  const options = { capability: INTERNAL_EVIDENCE_CAPABILITY };
  const evidenceStore = openEvidenceStore('/tmp/seoul-document-authority-20261020/person-tier-dependencies-evidence-20261020.sqlite', options);
  const historyStore = openEvidenceStore('/tmp/seoul-document-authority-20261020/person-tier-history-evidence-20261020.sqlite', options);
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir];
  const processMethods = ['exec', 'execFile', 'spawn', 'execSync', 'execFileSync', 'spawnSync'];
  const processOriginals = processMethods.map(name => childProcess[name]);
  try {
    const deny = () => { throw new Error('filesystem forbidden during replay'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = deny;
    for (const name of processMethods) childProcess[name] = deny;
    syncBuiltinESMExports();
    db.exec('BEGIN');
    const actual = await replayDatabasePersonalTiers({ db, evidenceStore, historyStore });
    assert.deepEqual(actual, expected);
    assert.equal(JSON.stringify([...actual]), JSON.stringify([...expected]));
    assert.equal(assertPersonalTierPreservation(actual), actual);
    assert.equal(actual.get('K157').commonTier, 'T4');
    const baseline = JSON.parse(evidenceStore.getEvidence('tier-proof:.omo/private/seoul-migration/baseline.json',
      '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223'));
    const details = baseline.files.filter(row => /^public\/person-details\/person-\d+\.json$/u.test(row.path))
      .map(row => JSON.parse(historyStore.getEvidence(`git:${baseline.baseCommit}:${row.path}`, row.sha256)));
    assert.equal(details.length, 1022);
    assert.equal(assertBaselinePersonalTiers(actual, details), true);
    const changed = details.map((row, i) => i ? row : { ...row, commonTier: row.commonTier === 'T1' ? 'T2' : 'T1' });
    assert.throws(() => assertBaselinePersonalTiers(actual, changed));
    assert.throws(() => assertBaselinePersonalTiers(actual, details.slice(0, -1)));
    const production = await loadDatabasePersonProductionInputs({ db, repoRoot: root,
      editorialProfileDb: '/tmp/seoul-document-authority-20261020/private-profile-bootstrap-root/editorial-profiles.sqlite',
      soulAssignmentDb: '/tmp/seoul-document-authority-20261020/private-profile-bootstrap-root/soul-assignments.sqlite',
      evidenceStore, historyStore });
    assert.equal(production.peopleSource.length, 1022);
    assert.equal(production.characterProfiles.size, 1022);
    assert.deepEqual(production.personalTierPreservation, actual);
    assert.equal(typeof production.personFeedbackRecord, 'function');
    for (const [key, value] of Object.entries(production)) {
      if (key === 'personFeedbackRecord') {
        assert.equal(value, legacyInputs[key]);
        continue;
      }
      assert.deepEqual(value, legacyInputs[key], `production:${key}`);
      const serialized = item => JSON.stringify(item instanceof Map ? [...item] : item);
      assert.equal(serialized(value), serialized(legacyInputs[key]), `production:${key}:order`);
    }
    await assert.rejects(loadDatabasePersonProductionInputs({ db, repoRoot: root,
      evidenceStore, historyStore }), /E_PERSON_PRIVATE_DATABASE_REQUIRED/u);
    assert.throws(() => assertPersonalTierPreservation(new Map(actual)));
    const originalTier = actual.get('K157').commonTier;
    actual.get('K157').commonTier = 'T1';
    assert.throws(() => assertPersonalTierPreservation(actual));
    actual.get('K157').commonTier = originalTier;
    assert.equal(assertPersonalTierPreservation(actual), actual);
    const missing = { getEvidence(identity, hash) {
      if (identity.includes('owner-approval-20261017.json')) throw new Error('missing owner approval');
      return evidenceStore.getEvidence(identity, hash);
    } };
    await assert.rejects(replayDatabasePersonalTiers({ db, evidenceStore: missing, historyStore }), /missing owner approval/u);
    const wrongRevision = { getEvidence(identity, hash) {
      if (identity.includes('public/person-details/')) throw new Error('missing historical revision');
      return historyStore.getEvidence(identity, hash);
    } };
    await assert.rejects(replayDatabasePersonalTiers({ db, evidenceStore, historyStore: wrongRevision }), /missing historical revision/u);
    const changedTyped = { prepare(sql) {
      const statement = db.prepare(sql);
      if (/document_revision_text_document_slot/u.test(sql)) return { all: (...args) => statement.all(...args).map(row =>
        row.representation === 'string' ? { ...row, text: row.text + ' changed' } : row) };
      return statement;
    } };
    await assert.rejects(replayDatabasePersonalTiers({ db: changedTyped, evidenceStore, historyStore }), /E_PERSON_TIER_HISTORY_INTEGRITY/u);
    db.exec('COMMIT');
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir] = saved;
    processMethods.forEach((name, i) => { childProcess[name] = processOriginals[i]; });
    syncBuiltinESMExports();
    evidenceStore.close(); historyStore.close(); db.close();
  }
});
