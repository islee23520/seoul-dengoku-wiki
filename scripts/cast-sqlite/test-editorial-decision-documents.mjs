import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { EDITORIAL_DECISION_SOURCE_HASHES, initializeEditorialDecisionDocuments, readEditorialDecisionDocuments } from './editorial-decision-documents.mjs';

const root = new URL('../../', import.meta.url);
const decisionPath = 'docs/editorial/2026-09-29/decision-inputs.json';
const reviewPath = 'docs/editorial/2026-09-28/evidence/wiki304-review-correction-2026-09-29.json';
const decisionBytes = fs.readFileSync(new URL(decisionPath, root));
const reviewBytes = fs.readFileSync(new URL(reviewPath, root));
const schemaSql = fs.readFileSync(new URL('./editorial-decision-documents.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const decision = JSON.parse(decisionBytes);
const review = JSON.parse(reviewBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const documentHashes = {
  [decisionPath]: '89d2951995b6ab297c717b060fb423a45ad219bc1c3516bc1582009b628fa387',
  [reviewPath]: '3ca3ed3f9fff9bb085f35124d4da6952d19d90059d0ac145fcd8cead74d7e7ee',
};
const sources = {
  [decisionPath]: { bytes: decisionBytes, expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[decisionPath] },
  [reviewPath]: { bytes: reviewBytes, expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[reviewPath] },
};
const options = { schemaSql, sources, actor: 'unit-test', reason: 'Exact existing source preservation' };
const counts = {
  editorial_decision_documents_receipt: 2,
  editorial_decision_documents_decision: 1,
  editorial_decision_documents_station: 7,
  editorial_decision_documents_edge: 2,
  editorial_decision_documents_line: 2,
  editorial_decision_documents_alternative: 3,
  editorial_decision_documents_alternative_station: 15,
  editorial_decision_documents_member: 3,
  editorial_decision_documents_equipment: 5,
  editorial_decision_documents_approval_item: 6,
  editorial_decision_documents_review: 1,
  editorial_decision_documents_owner_comment: 2,
  editorial_decision_documents_output_check: 7,
  editorial_decision_documents_limitation: 3,
  editorial_decision_documents_markdown_path: 2,
};
const tables = Object.keys(counts);
const originals = { [decisionPath]: decision, [reviewPath]: review };
const rejected = fn => assert.throws(fn, { code: 'E_EDITORIAL_DECISION_DOCUMENT' });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeEditorialDecisionDocuments(db, options);
  return db;
}
const read = (db, logicalPath) => readEditorialDecisionDocuments(db, { logicalPath, expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[logicalPath] });
function allKeys(value, path = '', result = []) {
  if (Array.isArray(value)) value.forEach((entry, index) => allKeys(entry, path + '/' + index, result));
  else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach((key, ordinal) => result.push([path, ordinal, key]));
    for (const [key, entry] of Object.entries(value)) allKeys(entry, path + '/' + key, result);
  }
  return result;
}
test('actual entire sources keep independent byte and document pins and exact typed order', () => {
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES ('untouched')");
  try {
    assert.equal(decisionBytes.length, 5161);
    assert.equal(reviewBytes.length, 5571);
    assert.equal(hash(decisionBytes), EDITORIAL_DECISION_SOURCE_HASHES[decisionPath]);
    assert.equal(hash(reviewBytes), EDITORIAL_DECISION_SOURCE_HASHES[reviewPath]);
    assert.equal(hash(JSON.stringify(decision)), documentHashes[decisionPath]);
    assert.equal(hash(JSON.stringify(review)), documentHashes[reviewPath]);
    assert.notEqual(hash(decisionBytes), documentHashes[decisionPath]);
    assert.notEqual(hash(reviewBytes), documentHashes[reviewPath]);
    assert.deepEqual(initializeEditorialDecisionDocuments(db, options), {
      documents: 2, stations: 7, edges: 2, alternatives: 3, members: 3, approvalItems: 6, ownerComments: 2, outputChecks: 7, totalRows: 61,
    });
    for (const logicalPath of [decisionPath, reviewPath]) {
      const document = read(db, logicalPath);
      assert.equal(JSON.stringify(document), JSON.stringify(originals[logicalPath]));
      assert.deepEqual(allKeys(document), allKeys(originals[logicalPath]));
    }
    assert.equal(decision.location.approvedStationId, null);
    assert.equal(decision.route.proposedStationLegLayerTransitions, 0);
    assert.equal(decision.squad.members[1].personId, null);
    assert.equal(Object.hasOwn(decision.squad.members[1], 'sourceAffiliation'), false);
    assert.equal(review.existingOutputChecks[5].exists, false);
    assert.equal(Object.hasOwn(review.existingOutputChecks[5], 'sha256'), false);
    assert.equal(review.reviewSnapshot.review.id, 5341433031);
    assert.deepEqual(Object.fromEntries(tables.map(table => [table, db.prepare('SELECT count(*) AS n FROM ' + table).get().n])), counts);
    assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'untouched');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const schema = db.prepare("SELECT name, sql FROM sqlite_schema WHERE type='table' AND name LIKE 'editorial_decision_documents_%' ORDER BY name").all();
    assert.equal(schema.length, tables.length);
    assert.ok(schema.every(entry => entry.sql.endsWith('STRICT') && !/\b(BLOB|ANY|JSON)\b/iu.test(entry.sql)));
    const before = db.prepare('SELECT logical_path, source_sha256, document_sha256 FROM editorial_decision_documents_receipt ORDER BY logical_path').all();
    rejected(() => initializeEditorialDecisionDocuments(db, options));
    assert.deepEqual(db.prepare('SELECT logical_path, source_sha256, document_sha256 FROM editorial_decision_documents_receipt ORDER BY logical_path').all(), before);
  } finally { db.close(); }
});

for (const table of tables) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(table + ': ' + mode + ' row is rejected', () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        db.exec('PRAGMA foreign_keys=OFF');
        const columns = db.prepare('PRAGMA table_info(' + table + ')').all().map(entry => entry.name);
        if (mode === 'missing') db.exec('DELETE FROM ' + table + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
        if (mode === 'changed') {
          const column = columns.find(name => !['logical_path', 'ordinal', 'leg', 'edge_ordinal', 'alternative_ordinal', 'member_ordinal'].includes(name)
            && !name.endsWith('_present'));
          const info = db.prepare('PRAGMA table_info(' + table + ')').all().find(entry => entry.name === column);
          const assignment = info.type === 'INTEGER'
            ? column + '=' + column + '+1'
            : column + "='changed'";
          db.exec('UPDATE ' + table + ' SET ' + assignment + ' WHERE rowid=(SELECT min(rowid) FROM ' + table + ')');
        }
        if (mode === 'extra') {
          const values = columns.map(name => {
            if (name === 'logical_path' && table !== 'editorial_decision_documents_receipt'
              && table !== 'editorial_decision_documents_decision' && table !== 'editorial_decision_documents_review') return "'extra.json'";
            if (name === 'logical_path') return "'extra-' || " + name;
            if (name === 'ordinal' || name.endsWith('_ordinal')) return name + '+100';
            if (name === 'leg') return "'extra'";
            return name;
          });
          db.exec('INSERT INTO ' + table + ' SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
        }
        rejected(() => read(db, decisionPath));
        rejected(() => read(db, reviewPath));
      } finally { db.close(); }
    });
  }
}

test('ordinal gaps are rejected without treating a later row as the missing position', () => {
  const db = fresh();
  try {
    db.exec('PRAGMA ignore_check_constraints=ON');
    db.exec('PRAGMA foreign_keys=OFF');
    db.exec('DELETE FROM editorial_decision_documents_approval_item WHERE ordinal=0');
    rejected(() => read(db, decisionPath));
  } finally { db.close(); }
});

test('simultaneous typed data and stored digest substitution is rejected', () => {
  const db = fresh();
  try {
    const forged = structuredClone(decision);
    forged.status = 'approved-by-storage';
    const forgedDocument = hash(JSON.stringify(forged));
    const forgedBytes = hash(Buffer.from(JSON.stringify(forged)));
    db.exec('PRAGMA ignore_check_constraints=ON');
    db.exec("UPDATE editorial_decision_documents_decision SET status='approved-by-storage'");
    db.exec("UPDATE editorial_decision_documents_receipt SET source_sha256='" + forgedBytes + "', document_sha256='" + forgedDocument + "' WHERE logical_path='" + decisionPath + "'");
    rejected(() => read(db, decisionPath));
    rejected(() => readEditorialDecisionDocuments(db, { logicalPath: decisionPath, expectedSourceHash: forgedBytes }));
    rejected(() => read(db, reviewPath));
  } finally { db.close(); }
});

test('unknown and missing fields, absent versus null, wrong pins and bad input fail closed', () => {
  const paths = [
    [decisionPath, []],
    [decisionPath, ['location']],
    [decisionPath, ['route']],
    [decisionPath, ['route', 'strategicEdges', 0]],
    [decisionPath, ['alternatives', 0]],
    [decisionPath, ['squad']],
    [decisionPath, ['squad', 'members', 0]],
    [decisionPath, ['squad', 'members', 1]],
    [decisionPath, ['squad', 'members', 0, 'approvedInputs']],
    [decisionPath, ['squad', 'members', 0, 'approval']],
    [decisionPath, ['approvalItems', 0]],
    [reviewPath, []],
    [reviewPath, ['reviewSnapshot']],
    [reviewPath, ['reviewSnapshot', 'review']],
    [reviewPath, ['ownerComments', 0]],
    [reviewPath, ['ownerCorrectionPR']],
    [reviewPath, ['editorialSource']],
    [reviewPath, ['existingOutputChecks', 0]],
    [reviewPath, ['existingOutputChecks', 5]],
    [reviewPath, ['markdownLocalLinks']],
  ];
  for (const [logicalPath, path] of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(originals);
      const target = path.reduce((value, key) => value[key], changed[logicalPath]);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const bytes = {
        [decisionPath]: Buffer.from(JSON.stringify(changed[decisionPath])),
        [reviewPath]: Buffer.from(JSON.stringify(changed[reviewPath])),
      };
      bytes[logicalPath] = Buffer.from(JSON.stringify(changed[logicalPath]));
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeEditorialDecisionDocuments(db, {
          schemaSql, actor: options.actor, reason: options.reason,
          sources: {
            [decisionPath]: { bytes: bytes[decisionPath], expectedSourceHash: hash(bytes[decisionPath]) },
            [reviewPath]: { bytes: bytes[reviewPath], expectedSourceHash: hash(bytes[reviewPath]) },
          },
        }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'editorial_decision_documents_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document[decisionPath].location.approvedStationId = '학동'; },
    document => { delete document[decisionPath].squad.members[1].personId; },
    document => { document[decisionPath].squad.members[1].sourceAffiliation = 'S00'; },
    document => { document[decisionPath].route.proposedStationLegLayerTransitions = 0.5; },
    document => { document[reviewPath].existingOutputChecks[5].sha256 = '0'.repeat(64); },
    document => { delete document[reviewPath].existingOutputChecks[0].sha256; },
    document => { document[reviewPath].existingOutputChecks[5].exists = null; },
    document => { document[decisionPath].approvalItems[0].approved = true; },
  ]) {
    const changed = structuredClone(originals);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeEditorialDecisionDocuments(db, {
        ...options,
        sources: {
          [decisionPath]: { bytes: Buffer.from(JSON.stringify(changed[decisionPath])), expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[decisionPath] },
          [reviewPath]: { bytes: Buffer.from(JSON.stringify(changed[reviewPath])), expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[reviewPath] },
        },
      }));
    } finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readEditorialDecisionDocuments(db));
    rejected(() => readEditorialDecisionDocuments(db, { logicalPath: decisionPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readEditorialDecisionDocuments(db, { logicalPath: 'docs/editorial/other.json', expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[decisionPath] }));
    const swapped = {
      [decisionPath]: sources[reviewPath],
      [reviewPath]: sources[decisionPath],
    };
    rejected(() => initializeEditorialDecisionDocuments(new DatabaseSync(':memory:'), { ...options, sources: swapped }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeEditorialDecisionDocuments(new DatabaseSync(':memory:'), { ...options, ...overrides }));
    }
    const extraSource = { ...sources, 'docs/editorial/extra.json': sources[decisionPath] };
    rejected(() => initializeEditorialDecisionDocuments(new DatabaseSync(':memory:'), { ...options, sources: extraSource }));
    db.exec('BEGIN');
    rejected(() => initializeEditorialDecisionDocuments(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db, decisionPath)), JSON.stringify(decision));
    assert.equal(JSON.stringify(read(db, reviewPath)), JSON.stringify(review));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_decision BEFORE INSERT ON editorial_decision_documents_markdown_path BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_decision AFTER INSERT ON editorial_decision_documents_markdown_path BEGIN UPDATE editorial_decision_documents_decision SET status='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE canonical_coexistence (value TEXT NOT NULL) STRICT; INSERT INTO canonical_coexistence VALUES ('retained')");
      assert.throws(() => initializeEditorialDecisionDocuments(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(entry => entry.name), ['canonical_coexistence']);
      assert.equal(db.prepare('SELECT value FROM canonical_coexistence').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('new tables coexist with the canonical schema and do not rewrite its rows', () => {
  const declared = [...canonicalSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+("?)([A-Za-z0-9_]+)/gu)].map(match => match[2]);
  assert.equal(declared.some(name => name.startsWith('editorial_decision_documents_')), false);
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    db.exec(canonicalSql);
    const before = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(before, declared.slice().sort());
    db.prepare('INSERT INTO source_file (source_id, logical_path, media_type, sha256, byte_length, raw_bytes) VALUES (?,?,?,?,?,?)')
      .run(1, 'canonical-sentinel.json', 'application/json', 'a'.repeat(64), 2, Buffer.from('{}'));
    initializeEditorialDecisionDocuments(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('editorial_decision_documents_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('editorial_decision_documents_')), tables.slice().sort());
    assert.equal(db.prepare('SELECT count(*) AS n FROM source_file').get().n, 1);
    assert.equal(db.prepare('SELECT logical_path FROM source_file').get().logical_path, 'canonical-sentinel.json');
    assert.equal(JSON.stringify(read(db, decisionPath)), JSON.stringify(decision));
    assert.equal(JSON.stringify(read(db, reviewPath)), JSON.stringify(review));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', async () => {
  const db = fresh();
  const expectedDecision = hash(JSON.stringify(read(db, decisionPath)));
  const expectedReview = hash(JSON.stringify(read(db, reviewPath)));
  const dump = db.prepare("SELECT sql FROM sqlite_schema WHERE name LIKE 'editorial_decision_documents_%' AND sql IS NOT NULL ORDER BY name").all().map(row => row.sql).join(';\n');
  const inserts = [];
  for (const table of tables) {
    const rows = db.prepare('SELECT * FROM ' + table).all();
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map(column => {
        const value = row[column];
        if (value === null) return 'NULL';
        if (typeof value === 'number') return String(value);
        return "'" + String(value).replaceAll("'", "''") + "'";
      });
      inserts.push('INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES (' + values.join(',') + ')');
    }
  }
  db.close();
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { createHash } from 'node:crypto';
    import { DatabaseSync } from 'node:sqlite';
    const blocked = () => { throw new Error('runtime source access forbidden'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (...args) => { if (String(args[0]).endsWith('.json') || String(args[0]).endsWith('.sql')) throw new Error('source read denied'); return originalRead(...args); };
    syncBuiltinESMExports();
    const { readEditorialDecisionDocuments, EDITORIAL_DECISION_SOURCE_HASHES } = await import(${JSON.stringify(new URL('./editorial-decision-documents.mjs', import.meta.url).href)});
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open']) fs[key] = blocked;
    for (const key of ['readFile','open']) fsp[key] = blocked;
    syncBuiltinESMExports();
    JSON.parse = blocked;
    globalThis.fetch = blocked;
    const db = new DatabaseSync(':memory:');
    db.exec(${JSON.stringify(dump)});
    for (const sql of ${JSON.stringify(inserts)}) db.exec(sql);
    const selectOnly = { prepare(sql) { if (!/^SELECT\\b/iu.test(sql) || /archive|source_file|json_|json_extract/iu.test(sql)) throw new Error('non SELECT denied: ' + sql); return db.prepare(sql); }, exec() { throw new Error('exec denied'); } };
    const decisionPath = ${JSON.stringify(decisionPath)};
    const reviewPath = ${JSON.stringify(reviewPath)};
    const storedDecision = readEditorialDecisionDocuments(selectOnly, { logicalPath: decisionPath, expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[decisionPath] });
    const storedReview = readEditorialDecisionDocuments(selectOnly, { logicalPath: reviewPath, expectedSourceHash: EDITORIAL_DECISION_SOURCE_HASHES[reviewPath] });
    const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
    if (digest(storedDecision) !== process.argv[1] || digest(storedReview) !== process.argv[2]) throw new Error('fresh reader mismatch');
    if (storedDecision.status !== 'proposal' || storedReview.editorialSource.status !== 'draft') throw new Error('historical status changed');
    db.close();
  `, expectedDecision, expectedReview], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  assert.equal(exit, 0, output);
});
