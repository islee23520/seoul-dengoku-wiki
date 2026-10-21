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
  const retired = rows.filter(row => row.status === 'retired-current').map(row => row.person_id).sort();
  if (people.length !== 1022 || retired.length !== 511
    || createHash('sha256').update(JSON.stringify(retired)).digest('hex') !== 'df42327640c0924b0d3274f8bea7145476568f39ffc08e9d0f0c012a98a12adc'
    || rows.some(row => row.decision_ref !== 'owner:2026-10-21/low-tier-first-protected-origin-ratio'))
    throw Error('E_PERSON_DISPOSITION_APPROVAL');
  return new Map(rows.map(row => [row.person_id, row]));
}
import { createHash } from 'node:crypto';
