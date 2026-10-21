import { resolve, relative, posix } from 'node:path';
import { createHash } from 'node:crypto';

export const SCOPE_SOURCE_DIRECTORIES = Object.freeze([
  'lore', 'docs', 'scripts/data', 'snapshots/build-inputs', 'vendor/issued-history',
]);
const digest = rows => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
const fail = () => { throw new Error('E_SCOPE_DIRECTORY_INVENTORY'); };

// Inventory records storage identities, not contract membership or approval.
export function initializeScopeDirectoryInventory(db, entries) {
  if (db.isTransaction || !Array.isArray(entries)) fail();
  const rows = entries.map(entry => [entry.path, entry.kind]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const paths = new Map(rows);
  if (paths.size !== rows.length || SCOPE_SOURCE_DIRECTORIES.some(path => paths.get(path) !== 'directory')) fail();
  for (const [path, kind] of rows) {
    if (typeof path !== 'string' || !['file', 'directory'].includes(kind)
      || posix.normalize(path) !== path || path.startsWith('/') || path.startsWith('../')
      || !SCOPE_SOURCE_DIRECTORIES.some(root => path === root || path.startsWith(root + '/'))
      || (!SCOPE_SOURCE_DIRECTORIES.includes(path) && paths.get(posix.dirname(path)) !== 'directory')) fail();
  }
  const sha256 = digest(rows);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE scope_directory_inventory (path TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('file','directory'))) STRICT;
      CREATE TABLE scope_directory_inventory_receipt (singleton INTEGER PRIMARY KEY CHECK(singleton=1), sha256 TEXT NOT NULL, entry_count INTEGER NOT NULL) STRICT;`);
    const insert = db.prepare('INSERT INTO scope_directory_inventory VALUES (?,?)');
    for (const row of rows) insert.run(...row);
    db.prepare('INSERT INTO scope_directory_inventory_receipt VALUES (1,?,?)').run(sha256, rows.length);
    db.exec('COMMIT');
    return { sha256, entries: rows.length };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

// The independent receipt hash is supplied by the caller, never trusted from
// the same mutable DB. No filesystem or contract fallback exists.
export function scopeDirectoryReader(db, { root, expectedSha256 }) {
  if (typeof expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedSha256)) fail();
  const base = resolve(root);
  return async (path, options) => {
    if (options?.withFileTypes !== true) fail();
    const logicalPath = relative(base, resolve(path)).split('\\').join('/');
    const rows = db.prepare('SELECT path,kind FROM scope_directory_inventory ORDER BY path COLLATE BINARY').all();
    const receipt = db.prepare('SELECT * FROM scope_directory_inventory_receipt').all();
    if (receipt.length !== 1 || receipt[0].singleton !== 1 || receipt[0].sha256 !== expectedSha256
      || receipt[0].entry_count !== rows.length || digest(rows.map(row => [row.path, row.kind])) !== expectedSha256
      || !rows.some(row => row.path === logicalPath && row.kind === 'directory')) fail();
    return rows.filter(row => posix.dirname(row.path) === logicalPath).map(row => ({
      name: posix.basename(row.path), isDirectory: () => row.kind === 'directory', isFile: () => row.kind === 'file',
    }));
  };
}
