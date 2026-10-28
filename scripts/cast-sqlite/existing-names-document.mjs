import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw new Error('E_EXISTING_NAMES_DOCUMENT'); };

export function initializeExistingNamesDocument(db, { sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || !(sourceBytes instanceof Uint8Array)
    || ![actor,reason].every(v => typeof v === 'string' && v.trim())) fail();
  const names = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  if (!Array.isArray(names) || names.some(n => typeof n !== 'string')) fail();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE existing_names_import (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1),
      source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
      actor TEXT NOT NULL CHECK(length(trim(actor))>0),
      reason TEXT NOT NULL CHECK(length(trim(reason))>0)
    ) STRICT;
    CREATE TABLE existing_name (
      ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), name TEXT NOT NULL
    ) STRICT;`);
    db.prepare('INSERT INTO existing_names_import VALUES (1,?,?,?)').run(hash(sourceBytes),actor,reason);
    const insert = db.prepare('INSERT INTO existing_name VALUES (?,?)');
    names.forEach((name,i) => insert.run(i,name));
    readExistingNamesDocument(db);
    db.exec('COMMIT');
    return { names:names.length };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readExistingNamesDocument(db) {
  const receipt = db.prepare('SELECT * FROM existing_names_import WHERE singleton=1').get();
  if (!receipt || !receipt.actor.trim() || !receipt.reason.trim()) fail();
  const rows = db.prepare('SELECT ordinal,name FROM existing_name ORDER BY ordinal').all();
  if (rows.some((r,i) => r.ordinal !== i)) fail();
  const names = rows.map(r => r.name);
  return names;
}
