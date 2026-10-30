import { readFileSync } from 'node:fs';

const decision = 'question:call_lz2AvYKA2N5Phnhe8HovtFwY';
const title = 'title:duchy-s08';
const grant = 'holding:opening-duchy-s08-demesne';
const regions = ['region:1117051000', 'region:1117052000', 'region:1117066000'];

// The imported domains remain immutable predecessor evidence. These typed
// successor rows, not a renderer-only rule, determine all current rights reads.
export async function initializeCiaCurrentRights(db, { root, databasePath, actor, reason }) {
 if (db.isTransaction || !actor?.trim() || !reason?.trim()) throw Error('E_CIA_CURRENT_AUDIT');
 const { loadCiaFacilityProjection } = await import('../cia-facility-projection-input.mjs');
 const { readSourceArchive } = await import('./source-archive.mjs');
 const { relative } = await import('node:path');
 const { correction } = await loadCiaFacilityProjection(root,
  path => readSourceArchive(relative(root, path), undefined, databasePath));
 if (correction.retiredTitleId !== title || correction.retiredGrantId !== grant) throw Error('E_CIA_CURRENT_RIGHTS');
 db.exec('BEGIN IMMEDIATE');
 try {
  db.exec(readFileSync(new URL('./cia-current-rights.sql', import.meta.url), 'utf8'));
  for (const [kind, id] of [['title', title], ['grant', grant]])
   db.prepare('INSERT INTO current_right_retirement VALUES(?,?,?,?,?)').run(kind, id, decision, actor, reason);
  for (const id of regions)
   db.prepare('INSERT INTO current_region_disposition VALUES(?,?,?,?,?)').run(id, 'unassigned', decision, actor, reason);
  db.exec('COMMIT');
 } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readCiaCurrentRights(db) {
 if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='current_right_retirement'").get()) return null;
 const retired = db.prepare('SELECT * FROM current_right_retirement ORDER BY kind').all();
 const territory = db.prepare('SELECT * FROM current_region_disposition ORDER BY region_id').all();
 if (retired.length !== 2 || !retired.some(row => row.kind === 'title' && row.right_id === title)
  || !retired.some(row => row.kind === 'grant' && row.right_id === grant)
  || territory.length !== 3 || territory.some((row, i) => row.region_id !== regions[i] || row.status !== 'unassigned')
  || [...retired, ...territory].some(row => row.decision_ref !== decision || !row.actor.trim() || !row.reason.trim()))
  throw Error('E_CIA_CURRENT_RIGHTS');
 return { retiredTitleId: title, retiredGrantId: grant, regions, decisionRef: decision };
}

export function currentFeudalAllocation(db, document) {
 const current = readCiaCurrentRights(db);
 return current ? {
  ...document,
  titles: document.titles.filter(row => row.id !== current.retiredTitleId),
  grants: document.grants.filter(row => row.id !== current.retiredGrantId)
 } : document;
}

export async function currentFeudalAllocationAsync(tx, document) {
 const current = await readCiaCurrentRightsAsync(tx);
 return current ? {
  ...document,
  titles: document.titles.filter(row => row.id !== current.retiredTitleId),
  grants: document.grants.filter(row => row.id !== current.retiredGrantId)
 } : document;
}

export function currentRegionContent(db, document) {
 const current = readCiaCurrentRights(db);
 if (!current || document.district_id !== 'gu:11170') return document;
 return {
  ...document, regions: document.regions.map(row => {
   if (!current.regions.includes(row.region_id)) return row;
   const territory = { ...row.content.territory, status: 'unassigned', holders: [] };
   delete territory.authority;
   return { ...row, content: { ...row.content, territory } };
  })
 };
}


/** Async PostgreSQL twin of readCiaCurrentRights: same existence probe
 * (information_schema), same successor-row validation, inside the caller's
 * read-only transaction. */
export async function readCiaCurrentRightsAsync(tx) {
 const present = await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='current_right_retirement'");
 if (!present) return null;
 const retired = (await tx.all('SELECT * FROM wiki.current_right_retirement ORDER BY kind')).map(r => ({ ...r }));
 const territory = (await tx.all('SELECT * FROM wiki.current_region_disposition ORDER BY region_id')).map(r => ({ ...r }));
 if (retired.length !== 2 || !retired.some(row => row.kind === 'title' && row.right_id === title)
  || !retired.some(row => row.kind === 'grant' && row.right_id === grant)
  || territory.length !== 3 || territory.some((row, i) => row.region_id !== regions[i] || row.status !== 'unassigned')
  || [...retired, ...territory].some(row => row.decision_ref !== decision || !row.actor.trim() || !row.reason.trim()))
  throw Error('E_CIA_CURRENT_RIGHTS');
 return { retiredTitleId: title, retiredGrantId: grant, regions, decisionRef: decision };
}

/** Async twin of currentRegionContent. */
export async function currentRegionContentAsync(tx, document) {
 const current = await readCiaCurrentRightsAsync(tx);
 if (!current || document.district_id !== 'gu:11170') return document;
 return {
  ...document, regions: document.regions.map(row => {
   if (!current.regions.includes(row.region_id)) return row;
   const territory = { ...row.content.territory, status: 'unassigned', holders: [] };
   delete territory.authority;
   return { ...row, content: { ...row.content, territory } };
  })
 };
}
