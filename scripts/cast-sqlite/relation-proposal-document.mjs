import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = () => { throw new Error('E_RELATION_PROPOSAL_DOCUMENT'); };

// This unpublished conflicting proposal never enters current relation tables.
export function initializeRelationProposalDocument(db, { sourceBytes, actor, reason }) {
  if (db.isTransaction || !(sourceBytes instanceof Uint8Array)
    || ![actor, reason].every(value => typeof value === 'string' && value.trim())) fail();
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE relation_proposal_document (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), source_sha256 TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status='unpublished-proposal'), source TEXT NOT NULL, note TEXT NOT NULL,
      actor TEXT NOT NULL, reason TEXT NOT NULL) STRICT;
      CREATE TABLE relation_proposal_document_column (
        ordinal INTEGER PRIMARY KEY CHECK(ordinal BETWEEN 0 AND 3), ko TEXT NOT NULL, en TEXT NOT NULL) STRICT;
      CREATE TABLE relation_proposal_document_row (
        ordinal INTEGER PRIMARY KEY CHECK(ordinal BETWEEN 0 AND 6),
        person_ko TEXT NOT NULL, person_en TEXT NOT NULL, type_ko TEXT NOT NULL, type_en TEXT NOT NULL,
        target_ko TEXT NOT NULL, target_en TEXT NOT NULL, grounds_ko TEXT NOT NULL, grounds_en TEXT NOT NULL) STRICT;`);
    db.prepare('INSERT INTO relation_proposal_document VALUES (1,?,?,?,?,?,?)')
      .run(hash(sourceBytes), document.status, document.source, document.note, actor, reason);
    document.columns.forEach((column, ordinal) => db.prepare('INSERT INTO relation_proposal_document_column VALUES (?,?,?)').run(ordinal, column.ko, column.en));
    document.rows.forEach((row, ordinal) => db.prepare('INSERT INTO relation_proposal_document_row VALUES (?,?,?,?,?,?,?,?,?)')
      .run(ordinal, ...row.flatMap(cell => [cell.ko, cell.en])));
    const actual = readRelationProposalDocument(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail();
    db.exec('COMMIT');
    return { documents: 1, columns: 4, rows: 7 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readRelationProposalDocument(db) {
  const heads = db.prepare('SELECT * FROM relation_proposal_document').all();
  const columns = db.prepare('SELECT * FROM relation_proposal_document_column ORDER BY ordinal').all();
  const rows = db.prepare('SELECT * FROM relation_proposal_document_row ORDER BY ordinal').all();
  if (heads.length !== 1 || heads[0].singleton !== 1
    || columns.some((row, index) => row.ordinal !== index) || rows.some((row, index) => row.ordinal !== index)) fail();
  const head = heads[0];
  const document = { status: head.status, source: head.source, note: head.note,
    columns: columns.map(row => ({ ko: row.ko, en: row.en })),
    rows: rows.map(row => ['person', 'type', 'target', 'grounds'].map(key => ({ ko: row[key + '_ko'], en: row[key + '_en'] }))) };
  return document;
}
