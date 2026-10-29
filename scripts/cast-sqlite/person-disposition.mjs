// Current roster decisions are separate from immutable issued identities and
// historical records. Retiring a person never reuses or renumbers their ID.
export function initializePersonDisposition(db, { removedIds, decisionRef, actor }) {
  if (db.isTransaction || !Array.isArray(removedIds) || !removedIds.length
    || new Set(removedIds).size !== removedIds.length || !decisionRef || !actor)
    throw Error('E_PERSON_DISPOSITION');
  const people = db.prepare('SELECT person_id FROM person ORDER BY person_id').all();
  const known = new Set(people.map(row => row.person_id));
  if (removedIds.some(id => !known.has(id))) throw Error('E_PERSON_DISPOSITION');
  const removed = new Set(removedIds);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE person_disposition (
      person_id TEXT PRIMARY KEY REFERENCES person(person_id),
      status TEXT NOT NULL CHECK(status IN ('active','retired-current')),
      decision_ref TEXT NOT NULL CHECK(length(trim(decision_ref))>0),
      actor TEXT NOT NULL CHECK(length(trim(actor))>0)
    ) STRICT`);
    const insert = db.prepare('INSERT INTO person_disposition VALUES (?,?,?,?)');
    for (const { person_id } of people) insert.run(person_id,
      removed.has(person_id) ? 'retired-current' : 'active', decisionRef, actor);
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('E_PERSON_DISPOSITION');
    db.exec('COMMIT');
    return { active: people.length - removed.size, retired: removed.size, total: people.length };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readPersonDisposition(db) {
  const people = db.prepare('SELECT person_id FROM person ORDER BY person_id').all();
  const rows = db.prepare('SELECT * FROM person_disposition ORDER BY person_id').all();
  if (rows.length !== people.length || rows.some((row, index) => row.person_id !== people[index].person_id
    || !['active', 'retired-current'].includes(row.status))) throw Error('E_PERSON_DISPOSITION');
  return new Map(rows.map(row => [row.person_id, row]));
}

// PostgreSQL companion with the same complete-roster validation as SQLite.
export async function readPersonDispositionAsync(db) {
  const table = await db.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='person_disposition'");
  if (!table) return null;
  const people = await db.all('SELECT person_id FROM wiki.person ORDER BY person_id');
  const rows = await db.all('SELECT * FROM wiki.person_disposition ORDER BY person_id');
  if (rows.length !== people.length || rows.some((row, index) => row.person_id !== people[index].person_id
    || !['active', 'retired-current'].includes(row.status))) throw Error('E_PERSON_DISPOSITION');
  return new Map(rows.map(row => [row.person_id, row]));
}
