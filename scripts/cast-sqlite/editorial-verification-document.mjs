import { createHash } from 'node:crypto';


const hash = value => createHash('sha256').update(value).digest('hex');
const fail = () => { throw new Error('E_EDITORIAL_VERIFICATION_DOCUMENT'); };

// Historical verification is stored independently of current publication rights.
export function initializeEditorialVerificationDocument(db, { sourceBytes, actor, reason }) {
  if (db.isTransaction || !(sourceBytes instanceof Uint8Array)
    || ![actor, reason].every(value => typeof value === 'string' && value.trim())) fail();
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  if (JSON.stringify(Object.keys(document)) !== JSON.stringify(['result', 'scope', 'preservedBlocks', 'protectedSources', 'graphSha256', 'proposalSha256', 'inputSha256'])
    || !Number.isSafeInteger(document.preservedBlocks) || typeof document.result !== 'string' || typeof document.scope !== 'string'
    || !document.protectedSources || Array.isArray(document.protectedSources)
    || ![document.graphSha256, document.proposalSha256, document.inputSha256, ...Object.values(document.protectedSources)]
      .every(value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value))) fail();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE editorial_verification_document (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL,
      result TEXT NOT NULL, scope TEXT NOT NULL, preserved_blocks INTEGER NOT NULL,
      graph_sha256 TEXT NOT NULL, proposal_sha256 TEXT NOT NULL, input_sha256 TEXT NOT NULL,
      actor TEXT NOT NULL, reason TEXT NOT NULL) STRICT;
      CREATE TABLE editorial_verification_protected_source (
        ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), logical_path TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL) STRICT;`);
    db.prepare('INSERT INTO editorial_verification_document VALUES (1,?,?,?,?,?,?,?,?,?,?)').run(hash(sourceBytes), hash(JSON.stringify(document)),
      document.result, document.scope, document.preservedBlocks, document.graphSha256, document.proposalSha256, document.inputSha256, actor, reason);
    Object.entries(document.protectedSources).forEach(([path, sha256], ordinal) =>
      db.prepare('INSERT INTO editorial_verification_protected_source VALUES (?,?,?)').run(ordinal, path, sha256));
    const actual = readEditorialVerificationDocument(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail();
    db.exec('COMMIT');
    return { documents: 1, protectedSources: Object.keys(document.protectedSources).length };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readEditorialVerificationDocument(db) {
  const heads = db.prepare('SELECT * FROM editorial_verification_document').all();
  const sources = db.prepare('SELECT * FROM editorial_verification_protected_source ORDER BY ordinal').all();
  if (heads.length !== 1 || heads[0].singleton !== 1
    || sources.some((row, index) => row.ordinal !== index)) fail();
  const row = heads[0];
  const document = { result: row.result, scope: row.scope, preservedBlocks: row.preserved_blocks,
    protectedSources: Object.fromEntries(sources.map(source => [source.logical_path, source.sha256])),
    graphSha256: row.graph_sha256, proposalSha256: row.proposal_sha256, inputSha256: row.input_sha256 };
  return document;
}
