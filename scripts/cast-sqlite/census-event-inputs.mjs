import { createHash } from 'node:crypto';

export const CENSUS_EVENT_SOURCE_SHA256 = '64af426aabb4f601342756bf5a51df7873333c92d077d56926ec277db532ae46';
const documentHash = '14b51a9ebe4c617a484cbc2e654e76c051f3108b96c804d8f497adcec343f12f';
const eventIdsHash = 'd28f44bc6f1740e9bb3924138a9bd88428f95d35f762ec497572682a3bbdaf04';
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = () => { throw new Error('E_CENSUS_EVENT_INPUT'); };

export function readCensusEventInputs(db) {
  return readCensusEventDocument(db, { expectedSourceHash: CENSUS_EVENT_SOURCE_SHA256 }).eventIds;
}

export function readCensusEventDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== CENSUS_EVENT_SOURCE_SHA256) fail();
  const metadata = db.prepare('SELECT * FROM census_event_import').all();
  const rows = db.prepare('SELECT ordinal,event_id FROM census_event_identity ORDER BY ordinal').all();
  if (metadata.length !== 1 || metadata[0].singleton !== 1 || metadata[0].source_sha256 !== CENSUS_EVENT_SOURCE_SHA256
    || metadata[0].schema_name !== 'seoul-narrative-census-events.v1' || metadata[0].visibility !== 'private'
    || rows.length !== 191 || rows.some((row, i) => row.ordinal !== i)
    || metadata[0].event_ids_sha256 !== eventIdsHash
    || hash(JSON.stringify(rows.map(row => row.event_id))) !== eventIdsHash) fail();
  const document = { schema: metadata[0].schema_name, visibility: metadata[0].visibility,
    description: metadata[0].description, eventIds: rows.map(row => row.event_id) };
  if (hash(JSON.stringify(document)) !== documentHash) fail();
  return document;
}

export function initializeCensusEventInputs(db, { bytes, actor, reason } = {}) {
  if (!(bytes instanceof Uint8Array) || hash(bytes) !== CENSUS_EVENT_SOURCE_SHA256
    || ![actor, reason].every(value => typeof value === 'string' && value.trim()) || db.isTransaction) fail();
  const source = JSON.parse(Buffer.from(bytes).toString('utf8'));
  if (source.schema !== 'seoul-narrative-census-events.v1' || source.visibility !== 'private'
    || source.eventIds.length !== 191 || new Set(source.eventIds).size !== 191
    || source.eventIds.some(id => typeof id !== 'string' || !id.startsWith('E:'))) fail();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE census_event_import (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), source_sha256 TEXT NOT NULL,
      event_ids_sha256 TEXT NOT NULL, schema_name TEXT NOT NULL, visibility TEXT NOT NULL CHECK(visibility='private'),
      description TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL) STRICT;
      CREATE TABLE census_event_identity (ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), event_id TEXT NOT NULL UNIQUE) STRICT;`);
    db.prepare('INSERT INTO census_event_import VALUES(1,?,?,?,?,?,?,?)').run(CENSUS_EVENT_SOURCE_SHA256,
      hash(JSON.stringify(source.eventIds)), source.schema, source.visibility, source.description, actor, reason);
    const insert = db.prepare('INSERT INTO census_event_identity VALUES(?,?)');
    source.eventIds.forEach((id, ordinal) => insert.run(ordinal, id));
    const result = readCensusEventInputs(db);
    db.exec('COMMIT');
    return result;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
