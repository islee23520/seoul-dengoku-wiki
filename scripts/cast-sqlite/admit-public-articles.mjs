import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { APPLICATION_ID, SCHEMA_VERSION } from './db.mjs';
import { loadExactSuccessorApproval, recordExactSuccessorAdmissions } from './document-admission.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--db' || !args[1]) throw Error('Usage: node scripts/cast-sqlite/admit-public-articles.mjs --db <existing-path>');
  const path = resolve(args[1]);
  if (!statSync(path).isFile()) throw Error('Existing database file required');
  const decision = loadExactSuccessorApproval();
  const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID
      || db.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION) throw Error('Incompatible document database');
    console.log(JSON.stringify(await recordExactSuccessorAdmissions(db, decision), null, 2));
  } finally { db.close(); }
} catch (error) {
  console.error(error.stack ?? error);
  process.exitCode = 1;
}
