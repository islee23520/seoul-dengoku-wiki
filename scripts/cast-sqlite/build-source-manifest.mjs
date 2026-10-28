import { createHash } from 'node:crypto';

const producerNames = ['tools', 'game', 'research'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw new Error('E_BUILD_SOURCE_MANIFEST'); };

/** Explicit import of the original build-input manifest, not execution of its producers. */
export function initializeBuildSourceManifest(db, { sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || !(sourceBytes instanceof Uint8Array)
    || ![actor, reason].every(v => typeof v === 'string' && v.trim())) fail();
  const expectedSourceHash = hash(sourceBytes);
  const document = JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(sourceBytes));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE build_source_manifest (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), source_sha256 TEXT NOT NULL,
      schema_version INTEGER NOT NULL, generator_version TEXT NOT NULL,
      actor TEXT NOT NULL CHECK(length(trim(actor))>0), reason TEXT NOT NULL CHECK(length(trim(reason))>0)
    ) STRICT;
    CREATE TABLE build_source_manifest_producer (
      ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), name TEXT NOT NULL UNIQUE,
      repository TEXT NOT NULL, revision TEXT NOT NULL, path TEXT NOT NULL
    ) STRICT;
    CREATE TABLE build_source_manifest_file (
      ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), path TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL
    ) STRICT;`);
    db.prepare('INSERT INTO build_source_manifest VALUES (1,?,?,?,?,?)')
      .run(expectedSourceHash,document.schemaVersion,document.generatorVersion,actor,reason);
    for (const [ordinal,name] of producerNames.entries()) {
      const p = document.producer[name];
      db.prepare('INSERT INTO build_source_manifest_producer VALUES (?,?,?,?,?)').run(ordinal,name,p.repository,p.commit,p.path);
    }
    document.files.forEach((file,ordinal) => db.prepare('INSERT INTO build_source_manifest_file VALUES (?,?,?)').run(ordinal,file.path,file.sha256));
    readBuildSourceManifest(db);
    db.exec('COMMIT');
    return { producers:3, files:3 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only reconstruction with an independent full-document digest. */
export function readBuildSourceManifest(db) {
  const roots = db.prepare('SELECT * FROM build_source_manifest').all();
  if (roots.length !== 1 || roots[0].singleton !== 1
    || !roots[0].actor.trim() || !roots[0].reason.trim()) fail();
  const producers = db.prepare('SELECT * FROM build_source_manifest_producer ORDER BY ordinal').all();
  const files = db.prepare('SELECT * FROM build_source_manifest_file ORDER BY ordinal').all();
  if (producers.length !== 3 || producers.some((p,i) => p.ordinal !== i || p.name !== producerNames[i])
    || files.length !== 3 || files.some((f,i) => f.ordinal !== i)) fail();
  const document = { schemaVersion:roots[0].schema_version,
    producer:Object.fromEntries(producers.map(p => [p.name,{repository:p.repository,commit:p.revision,path:p.path}])),
    generatorVersion:roots[0].generator_version, files:files.map(f => ({path:f.path,sha256:f.sha256})) };
  return document;
}
