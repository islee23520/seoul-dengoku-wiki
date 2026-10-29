import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
const pointer = (document, path) => path.split('/').slice(1).reduce((value, key) => value?.[key], document);

// A bounded current-prose successor over complete typed predecessor documents.
// Original document revisions and source archives remain unchanged.
export function initializeRetirementProse(db, { changes, actor, decisionRef }) {
  if (db.isTransaction || !Array.isArray(changes) || changes.length !== 60 || !actor || !decisionRef)
    throw Error('E_RETIREMENT_PROSE');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE retirement_prose (
      source_id INTEGER NOT NULL REFERENCES text_document(source_id),
      source_pointer TEXT NOT NULL, predecessor_text TEXT NOT NULL,
      current_text TEXT NOT NULL, predecessor_sha256 TEXT NOT NULL,
      current_sha256 TEXT NOT NULL, actor TEXT NOT NULL, decision_ref TEXT NOT NULL,
      PRIMARY KEY(source_id,source_pointer),
      FOREIGN KEY(source_id,source_pointer) REFERENCES source_record(source_id,json_pointer)
    ) STRICT`);
    for (const change of changes) {
      const source = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(change.path);
      if (!source || typeof change.before !== 'string' || typeof change.after !== 'string'
        || change.before === change.after) throw Error('E_RETIREMENT_PROSE');
      const run = db.prepare('SELECT text FROM text_document_run WHERE source_id=? AND json_pointer=?')
        .get(source.source_id, change.pointer.replace(/\/text$/u, ''));
      const slot = db.prepare('SELECT text FROM text_document_slot WHERE source_id=? AND json_pointer=?')
        .get(source.source_id, change.pointer);
      if ((run?.text ?? slot?.text) !== change.before) throw Error('E_RETIREMENT_PROSE_PREDECESSOR');
      db.prepare('INSERT INTO retirement_prose VALUES (?,?,?,?,?,?,?,?)').run(source.source_id,
        change.pointer, change.before, change.after, hash(change.before), hash(change.after), actor, decisionRef);
    }
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('E_RETIREMENT_PROSE');
    db.exec('COMMIT');
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readRetirementProse(db) {
  const rows = db.prepare(`SELECT s.logical_path AS path,p.* FROM retirement_prose p
    JOIN source_file s USING(source_id) ORDER BY s.logical_path,p.source_pointer`).all();
  if (rows.length !== 60 || rows.some(row => hash(row.predecessor_text) !== row.predecessor_sha256
    || hash(row.current_text) !== row.current_sha256)) throw Error('E_RETIREMENT_PROSE');
  return rows.map(row => ({
    path: row.path, pointer: row.source_pointer,
    before: row.predecessor_text, after: row.current_text
  }));
}

// PostgreSQL companion; the predecessor/current integrity policy is unchanged.
export async function readRetirementProseAsync(db) {
  const rows = await db.all(`SELECT s.logical_path AS path,p.* FROM wiki.retirement_prose p
    JOIN wiki.source_file s USING(source_id) ORDER BY s.logical_path,p.source_pointer`);
  if (rows.length !== 60 || rows.some(row => hash(row.predecessor_text) !== row.predecessor_sha256
    || hash(row.current_text) !== row.current_sha256)) throw Error('E_RETIREMENT_PROSE');
  return rows.map(row => ({
    path: row.path, pointer: row.source_pointer,
    before: row.predecessor_text, after: row.current_text
  }));
}

export function projectRetirementProse(document, path, changes) {
  const selected = changes.filter(row => row.path === path);
  if (!selected.length) return document;
  const result = structuredClone(document);
  for (const change of selected) {
    if (pointer(result, change.pointer) !== change.before) throw Error('E_RETIREMENT_PROSE_PREDECESSOR');
    const parts = change.pointer.split('/').slice(1);
    const key = parts.pop();
    parts.reduce((value, part) => value[part], result)[key] = change.after;
  }
  return result;
}
