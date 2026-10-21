import { createHash } from 'node:crypto';

export const EDITORIAL_VERIFICATION_SOURCE_HASH = 'f9363a93c12b3200da59b4e71a06427e374ee6d5caca25fee53244303529c74c';
export const EDITORIAL_VERIFICATION_DOCUMENT_HASH = '007e2885f585fc8ca3abe0eac2490d2e28bfbf82c3810e8f6712080cfdfda6ab';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = () => { throw new Error('E_EDITORIAL_VERIFICATION_DOCUMENT'); };

// Historical verification is stored independently of current publication rights.
export function initializeEditorialVerificationDocument(db, { sourceBytes, expectedSourceHash, expectedDocumentHash, actor, reason }) {
  if (db.isTransaction || expectedSourceHash !== EDITORIAL_VERIFICATION_SOURCE_HASH
    || expectedDocumentHash !== EDITORIAL_VERIFICATION_DOCUMENT_HASH || !(sourceBytes instanceof Uint8Array)
    || hash(sourceBytes) !== expectedSourceHash || ![expectedSourceHash, expectedDocumentHash].every(value => /^[a-f0-9]{64}$/u.test(value))
    || ![actor, reason].every(value => typeof value === 'string' && value.trim())) fail();
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  if (hash(JSON.stringify(document)) !== expectedDocumentHash
    || JSON.stringify(Object.keys(document)) !== JSON.stringify(['result', 'scope', 'preservedBlocks', 'protectedSources', 'graphSha256', 'proposalSha256', 'inputSha256'])
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
    db.prepare('INSERT INTO editorial_verification_document VALUES (1,?,?,?,?,?,?,?,?,?,?)').run(expectedSourceHash, expectedDocumentHash,
      document.result, document.scope, document.preservedBlocks, document.graphSha256, document.proposalSha256, document.inputSha256, actor, reason);
    Object.entries(document.protectedSources).forEach(([path, sha256], ordinal) =>
      db.prepare('INSERT INTO editorial_verification_protected_source VALUES (?,?,?)').run(ordinal, path, sha256));
    const actual = readEditorialVerificationDocument(db, { expectedSourceHash, expectedDocumentHash });
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail();
    db.exec('COMMIT');
    return { documents: 1, protectedSources: Object.keys(document.protectedSources).length };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readEditorialVerificationDocument(db, { expectedSourceHash, expectedDocumentHash } = {}) {
  if (expectedSourceHash !== EDITORIAL_VERIFICATION_SOURCE_HASH || expectedDocumentHash !== EDITORIAL_VERIFICATION_DOCUMENT_HASH) fail();
  if (![expectedSourceHash, expectedDocumentHash].every(value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value))) fail();
  const heads = db.prepare('SELECT * FROM editorial_verification_document').all();
  const sources = db.prepare('SELECT * FROM editorial_verification_protected_source ORDER BY ordinal').all();
  if (heads.length !== 1 || heads[0].singleton !== 1 || heads[0].source_sha256 !== expectedSourceHash
    || heads[0].document_sha256 !== expectedDocumentHash || sources.some((row, index) => row.ordinal !== index)) fail();
  const row = heads[0];
  const document = { result: row.result, scope: row.scope, preservedBlocks: row.preserved_blocks,
    protectedSources: Object.fromEntries(sources.map(source => [source.logical_path, source.sha256])),
    graphSha256: row.graph_sha256, proposalSha256: row.proposal_sha256, inputSha256: row.input_sha256 };
  if (hash(JSON.stringify(document)) !== expectedDocumentHash) fail();
  return document;
}
