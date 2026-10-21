import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { CHARACTER_CONTRACT_SOURCE_HASH, initializeCharacterContractDocument, readCharacterContractDocument } from './character-contract-document.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';

const sourceBytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, 'lore/editorial/Character-System-Contract.json', CHARACTER_CONTRACT_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./character-contract-document.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const documentHash = 'd44cb412318712d226f561858c0034ad7ef870381359653b1ca472b462b2b2f9';
const options = { schemaSql, sourceBytes, expectedSourceHash: CHARACTER_CONTRACT_SOURCE_HASH, actor: 'unit-test', reason: 'Exact existing source preservation' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  character_contract_document: 1, character_contract_document_ability: 8, character_contract_document_effect_source: 3,
  character_contract_document_trait_affect: 4, character_contract_document_trait_acquisition: 2,
  character_contract_document_body_part: 6, character_contract_document_candidate_period: 2,
};
const tables = Object.keys(counts);
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeCharacterContractDocument(db, options);
  return db;
}
const read = db => readCharacterContractDocument(db, { expectedSourceHash: CHARACTER_CONTRACT_SOURCE_HASH });
const rejected = fn => assert.throws(fn, { code: 'E_CHARACTER_CONTRACT_DOCUMENT' });
function allKeys(value, path = '', result = []) {
  if (Array.isArray(value)) value.forEach((entry, index) => allKeys(entry, `${path}/${index}`, result));
  else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach((key, ordinal) => result.push([path, ordinal, key]));
    for (const [key, entry] of Object.entries(value)) allKeys(entry, `${path}/${key}`, result);
  }
  return result;
}

test('actual entire source has fixed byte and document hashes, exact order, nulls and all 26 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES (\'untouched\')');
  try {
    assert.equal(sourceBytes.length, 4387);
    assert.equal(hash(sourceBytes), CHARACTER_CONTRACT_SOURCE_HASH);
    assert.equal(hash(JSON.stringify(source)), documentHash);
    assert.notEqual(JSON.stringify(source), sourceBytes.toString('utf8'));
    assert.deepEqual(initializeCharacterContractDocument(db, options), { documents: 1, abilities: 8, effectSources: 3, traitAffects: 4, traitAcquisitions: 2, bodyParts: 6, candidatePeriods: 2, totalRows: 26 });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(allKeys(document), allKeys(source));
    assert.equal(document.ratings.bands, null);
    assert.equal(document.ratings.resolutionFormula, null);
    assert.equal(document.ratings.effectCompositionFormula, null);
    assert.equal(document.traits.catalog, null);
    assert.equal(document.health.severityVocabulary, null);
    assert.equal(document.health.functionVocabulary, null);
    assert.equal(document.skills.ratingScale.maximum, 99.9);
    assert.equal(document.skills.grantFromTitleOrAffiliation, false);
    assert.equal(document.openingAllocation.copySameRatingsForSameSoul, false);
    assert.deepEqual(Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'untouched');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const schema = db.prepare("SELECT name, sql FROM sqlite_schema WHERE type='table' AND name LIKE 'character_contract_document%' ORDER BY name").all();
    assert.equal(schema.length, 7);
    assert.ok(schema.every(entry => entry.sql.endsWith('STRICT') && !/\b(BLOB|ANY|JSON)\b/i.test(entry.sql)));
    const before = db.prepare('SELECT * FROM character_contract_document').all();
    rejected(() => initializeCharacterContractDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeCharacterContractDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM character_contract_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of tables) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(entry => entry.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(name => !['document_id', 'ordinal'].includes(name));
          db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(name => ['document_id', 'ordinal'].includes(name) ? `${name}+100` : name === 'id' ? `${name} || '-extra'` : name);
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('simultaneous data and stored digest substitution is rejected', () => {
  const db = fresh();
  try {
    const forged = structuredClone(source);
    forged.pending += ' substituted';
    const forgedHash = hash(JSON.stringify(forged));
    db.exec('PRAGMA ignore_check_constraints=ON');
    db.exec(`UPDATE character_contract_document SET pending=pending || ' substituted', source_sha256='${forgedHash}', receipt_sha256='${forgedHash}'`);
    rejected(() => read(db));
    rejected(() => readCharacterContractDocument(db, { expectedSourceHash: forgedHash }));
  } finally { db.close(); }
});

test('unknown and missing fields, absent versus null, wrong pins and bad input fail closed', () => {
  const paths = [[], ['abilities', 0], ['abilities', 0, 'name'], ['ratings'], ['ratings', 'base'], ['ratings', 'effective'], ['ratings', 'baseReference'], ['skills'], ['skills', 'ratingScale'], ['traits'], ['health'], ['soul'], ['publication'], ['openingAllocation'], ['scope']];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeCharacterContractDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { delete document.ratings.bands; }, document => { document.ratings.bands = {}; },
    document => { document.traits.catalog = 'invented'; }, document => { document.abilities = []; },
    document => { document.skills.ratingScale.maximum = 100; }, document => { document.pending = null; },
  ]) {
    const changed = structuredClone(source); mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeCharacterContractDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readCharacterContractDocument(db));
    rejected(() => readCharacterContractDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeCharacterContractDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    rejected(() => initializeCharacterContractDocument(db, { ...options, sourceBytes: Buffer.from('{}'), expectedSourceHash: hash('{}') }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeCharacterContractDocument(db, { ...options, ...overrides }));
    }
    db.exec('BEGIN');
    rejected(() => initializeCharacterContractDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_contract BEFORE INSERT ON character_contract_document_candidate_period BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_contract AFTER INSERT ON character_contract_document_candidate_period BEGIN UPDATE character_contract_document SET pending='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES ('retained')");
      assert.throws(() => initializeCharacterContractDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(entry => entry.name), ['canonical_coexistence']);
      assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', async () => {
  const db = fresh();
  const expected = hash(JSON.stringify(read(db)));
  db.close();
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { createHash } from 'node:crypto';
    import { DatabaseSync } from 'node:sqlite';
    const blocked = () => { throw new Error('runtime source access forbidden'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (...args) => { if (String(args[0]).endsWith('.json')) throw new Error('source read denied'); return originalRead(...args); };
    syncBuiltinESMExports();
    const { readCharacterContractDocument, CHARACTER_CONTRACT_SOURCE_HASH } = await import(${JSON.stringify(new URL('./character-contract-document.mjs', import.meta.url).href)});
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open']) fs[key] = blocked;
    for (const key of ['readFile','open']) fsp[key] = blocked;
    syncBuiltinESMExports();
    JSON.parse = blocked;
    globalThis.fetch = blocked;
    const db = new DatabaseSync(':memory:');
    db.exec(${JSON.stringify(schemaSql)});
    const source = ${JSON.stringify(source)};
    const bit = value => value ? 1 : 0;
    db.prepare('INSERT INTO character_contract_document VALUES (${Array(59).fill('?').join(',')})').run(
      1, CHARACTER_CONTRACT_SOURCE_HASH, source.schema, source.status, source.approvalRef,
      source.ratings.base.minimum, source.ratings.base.maximum, bit(source.ratings.base.integer),
      source.ratings.effective.minimum, source.ratings.effective.maximum, bit(source.ratings.effective.integer), bit(source.ratings.effective.capAfterAllEffects),
      bit(source.ratings.baseSeparateFromEffects), source.ratings.baseReference.value, source.ratings.baseReference.meaning,
      source.ratings.openingEffectiveAboveTwenty, null, null, null, source.ratings.legacyConversion,
      bit(source.skills.separateFromAbilities), bit(source.skills.requireNarrativeEvidence), bit(source.skills.grantFromTitleOrAffiliation),
      source.skills.ratingScale.minimum, source.skills.ratingScale.maximum, source.skills.ratingScale.decimalPlaces,
      bit(source.skills.unknownDistinctFromZero), bit(source.skills.avoidDoubleCountingProwess),
      bit(source.traits.coreDispositionChangesSlowly), bit(source.traits.experienceChangesTraitsAndState), source.traits.specialOpportunityEffects, null,
      bit(source.health.separateInjurySeverityAndFunction), bit(source.health.separateDiseaseProgressionAndPartInjury), bit(source.health.sharedStateForCombatAndDisease), null, null,
      source.soul.minimumPerPerson, source.soul.maximumPerPerson, source.soul.visibility, source.soul.assignmentLedger,
      bit(source.soul.narrativeFitBeforeDuplicateMinimization), bit(source.soul.compositeDoesNotAutomaticallySumRatings), bit(source.soul.historicalAndRomanceSourcesDistinct), bit(source.soul.existingNarrativeIdentityPreserved),
      bit(source.publication.showRatingsSkillsTraitsAndNarrative), bit(source.publication.excludeSoulAndHistoricalMotifs), source.publication.projectionPolicy,
      source.openingAllocation.method, bit(source.openingAllocation.copySameRatingsForSameSoul), bit(source.openingAllocation.recordEvidenceAndApprovalStatus),
      bit(source.scope.removeMartialArtsAndWuxia), bit(source.scope.redesignWuxiaDependentOrganizations), bit(source.scope.allowHeroicCombatants), bit(source.scope.preserveSealedHistoricalRecords),
      source.pending, 'unit-test', 'Exact existing source preservation', createHash('sha256').update(JSON.stringify([CHARACTER_CONTRACT_SOURCE_HASH, process.argv[1], 'unit-test', 'Exact existing source preservation'])).digest('hex'));
    source.abilities.forEach((ability, ordinal) => db.prepare('INSERT INTO character_contract_document_ability VALUES (?,?,?,?,?)').run(ordinal, ability.id, ability.name.ko, ability.name.en, ability.scope));
    source.ratings.sourcesOfEffects.forEach((value, ordinal) => db.prepare('INSERT INTO character_contract_document_effect_source VALUES (?,?)').run(ordinal, value));
    source.traits.affect.forEach((value, ordinal) => db.prepare('INSERT INTO character_contract_document_trait_affect VALUES (?,?)').run(ordinal, value));
    source.traits.acquisition.forEach((value, ordinal) => db.prepare('INSERT INTO character_contract_document_trait_acquisition VALUES (?,?)').run(ordinal, value));
    source.health.bodyParts.forEach((value, ordinal) => db.prepare('INSERT INTO character_contract_document_body_part VALUES (?,?)').run(ordinal, value));
    source.soul.additionalCandidatePeriods.forEach((value, ordinal) => db.prepare('INSERT INTO character_contract_document_candidate_period VALUES (?,?)').run(ordinal, value));
    const selectOnly = { prepare(sql) { if (!/^SELECT\\b/i.test(sql) || /archive|source_file|json_/i.test(sql)) throw new Error('non SELECT denied'); return db.prepare(sql); }, exec() { throw new Error('exec denied'); } };
    const stored = readCharacterContractDocument(selectOnly, { expectedSourceHash: CHARACTER_CONTRACT_SOURCE_HASH });
    if (createHash('sha256').update(JSON.stringify(stored)).digest('hex') !== process.argv[2]) throw new Error('fresh reader mismatch');
    db.close();
  `, documentHash, expected], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  assert.equal(exit, 0, output);
});
