import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { initializeRelationInputs, readRelationConfig, loadRelationDataset } from './relation-inputs.mjs';
import { loadDataset, validate } from '../../lore/relations/validate.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';
import { readSourceArchive } from './source-archive.mjs';
import { readCanonicalDocument } from './canonical-document.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const approvedBytes = readSourceArchive('lore/relations/relations.json');
const command = { approvedBytes, expectedSha256: hash(approvedBytes) };
// One legacy dataset is the oracle, never a runtime fallback for the DB reader.
const oracle = loadDataset();
const archivedEvents = readCanonicalDocument('lore/editorial/seoul-narrative-census-events.json').eventIds;
const inputs = { ...oracle.sources, archivedEvents };
const expectedErrors = validate(oracle);
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'relation-inputs-'));
  const path = join(directory, 'actual.sqlite');
  copyFileSync(process.env.RELATION_INPUTS_DB ?? new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url), path);
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON');
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true }); });
  return { db, path };
}
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b|\bjson_(?:extract|tree|each)\b/iu);
  return db.prepare(sql);
} });

test('complete bounded config and actual validator output match legacy with explicit other inputs', async t => {
  const { db, path } = fixture(t);
  const config = initializeRelationInputs(db, command);
  assert.deepEqual(config, oracle.config);
  assert.equal(JSON.stringify(config), JSON.stringify(oracle.config));
  const actual = loadRelationDataset({ db: typedOnly(db), inputs, expectedSha256: command.expectedSha256 });
  assert.deepEqual(actual, oracle);
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'court', relationInputs: inputs }), {
    courtDataset: oracle,
    issuedById: new Map(oracle.people.map(person => [person.id, person])),
    issuedIdByName: new Map(oracle.people.map(person => [person.name, person.id])),
  });
  assert.equal(JSON.stringify(actual), JSON.stringify(oracle));
  assert.deepEqual(validate(actual), expectedErrors);
  assert.deepEqual(expectedErrors, []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.throws(() => db.exec("UPDATE relation_input_metadata SET note='changed'"), /E_RELATION_INPUT_IMMUTABLE/u);
  db.close();
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { loadRelationDataset } from ${JSON.stringify(new URL('./relation-inputs.mjs', import.meta.url).href)};
    const inputs=JSON.parse(fs.readFileSync(0,'utf8'));
    const deny=()=>{throw new Error('filesystem or JSON parser forbidden')};
    fs.readFileSync=deny; fs.readFile=deny; syncBuiltinESMExports(); JSON.parse=deny;
    const db=new DatabaseSync(${JSON.stringify(path)},{readOnly:true});
    const dataset=loadRelationDataset({db,inputs});
    if(dataset.config.courts.length!==14 || dataset.people.length!==1022) throw new Error('parity');
    db.close(); console.log('RELATION_DB_CONFIG_NO_FS_NO_PARSE');
  `], { encoding: 'utf8', timeout: 30000, input: JSON.stringify(inputs) });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /RELATION_DB_CONFIG_NO_FS_NO_PARSE/u);
});

test('explicit mode requires all other inputs and never silently reads legacy files', t => {
  const { db } = fixture(t);
  assert.throws(() => loadRelationDataset({ db }), /E_RELATION_DATASET_INPUT: stateSource/u);
  assert.throws(() => readRelationConfig(db), { code: 'E_RELATION_INPUT_SCHEMA_GAP' });
  assert.throws(() => loadRelationDataset({ inputs }), /E_RELATION_DATASET_INPUT: db/u);
  for (const key of Object.keys(inputs)) {
    const incomplete = { ...inputs }; delete incomplete[key];
    assert.throws(() => loadRelationDataset({ db, inputs: incomplete }), new RegExp(`E_RELATION_DATASET_INPUT: ${key}`, 'u'));
  }
});

test('unknown fields, hash mismatch and typed authority disagreements reject atomically', t => {
  const { db } = fixture(t);
  assert.throws(() => initializeRelationInputs(db, { ...command, expectedSha256: '0'.repeat(64) }), { code: 'E_RELATION_INPUT_HASH' });
  for (const select of [c => c, c => c.ownerLieges, c => c.courtMemberships, c => c.courts[0], c => c.directRetainers[0], c => c.eventLinks[0]]) {
    const config = structuredClone(oracle.config); select(config).unknown = 'not admitted';
    const bytes = Buffer.from(JSON.stringify(config));
    assert.throws(() => initializeRelationInputs(db, { approvedBytes: bytes, expectedSha256: hash(bytes) }), { code: 'E_RELATION_INPUT_FIELDS' });
  }
  db.exec("UPDATE context_court SET polity_id='changed' WHERE court_id='court:K002'");
  assert.throws(() => initializeRelationInputs(db, command), { code: 'E_RELATION_INPUT_COVERAGE' });
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name='relation_input_metadata'").get().n, 0);
});

test('missing rows, stale sources and mismatched caller pins fail closed', t => {
  const { db } = fixture(t);
  initializeRelationInputs(db, command);
  assert.throws(() => initializeRelationInputs(db, command), { code: 'E_RELATION_INPUT_INITIALIZED' });
  assert.throws(() => readRelationConfig(db, { expectedSha256: '0'.repeat(64) }), { code: 'E_RELATION_INPUT_STALE' });
  db.exec("DELETE FROM context_event_link WHERE json_pointer='/eventLinks/2'");
  assert.throws(() => readRelationConfig(db), { code: 'E_RELATION_INPUT_COVERAGE' });
  // The bootstrapped source archive is immutable. Simulate a mismatched or
  // missing source identity at the read boundary without weakening that seal.
  const identityView = transform => ({ prepare(sql) {
    const statement = db.prepare(sql);
    return sql.includes('FROM source_file') ? { all: (...args) => transform(statement.all(...args)) } : statement;
  } });
  assert.throws(() => readRelationConfig(identityView(rows => rows.map(row => ({ ...row, sha256: '0'.repeat(64) })))), { code: 'E_RELATION_INPUT_STALE' });
  assert.throws(() => readRelationConfig(identityView(() => [])), { code: 'E_RELATION_INPUT_MISSING' });
});
