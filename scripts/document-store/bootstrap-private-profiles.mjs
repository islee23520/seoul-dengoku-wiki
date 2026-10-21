import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initializeEditorialProfiles, openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY,
  EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { initializeSoulAssignments, openSoulAssignments, INTERNAL_SOUL_CAPABILITY,
  SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { readPrivateSourceArchive } from './private-source-archive.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Explicit one-time restricted migration, never invoked by runtime readers. */
export function bootstrapPrivateProfiles({ sourceRoot, outputDirectory, actor, reason } = {}) {
  if (!isAbsolute(sourceRoot ?? '') || !isAbsolute(outputDirectory ?? '')
    || !actor?.trim() || !reason?.trim()) throw new Error('E_PRIVATE_BOOTSTRAP_ARGUMENT');
  const parent = '/tmp/seoul-document-authority-20261020';
  if (resolve(outputDirectory) !== outputDirectory || !outputDirectory.startsWith(`${parent}/`)
    || existsSync(outputDirectory)) throw new Error('E_PRIVATE_BOOTSTRAP_OUTPUT');
  let cursor = parent;
  while (cursor !== '/tmp') {
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error('E_PRIVATE_BOOTSTRAP_SYMLINK');
    cursor = resolve(cursor, '..');
  }
  const batches = Object.keys(EDITORIAL_PROFILE_SOURCE_HASHES).map(logicalPath => {
    const bytes = readPrivateSourceArchive(sourceRoot, logicalPath, EDITORIAL_PROFILE_SOURCE_HASHES[logicalPath]);
    assert.equal(hash(bytes), EDITORIAL_PROFILE_SOURCE_HASHES[logicalPath]);
    return { logicalPath, bytes };
  });
  const soulPath = 'lore/editorial/Soul-Assignments.json';
  const soulBytes = readPrivateSourceArchive(sourceRoot, soulPath, SOUL_ASSIGNMENT_SOURCE_SHA256);
  assert.equal(hash(soulBytes), SOUL_ASSIGNMENT_SOURCE_SHA256);
  mkdirSync(outputDirectory, { mode: 0o700 });
  const profileDatabase = join(outputDirectory, 'editorial-profiles.sqlite');
  const soulDatabase = join(outputDirectory, 'soul-assignments.sqlite');
  const profileOptions = { capability: INTERNAL_PROFILE_CAPABILITY, expectedSourceHashes: EDITORIAL_PROFILE_SOURCE_HASHES };
  const soulOptions = { capability: INTERNAL_SOUL_CAPABILITY, expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 };
  initializeEditorialProfiles(profileDatabase, { ...profileOptions, batches, actor, reason });
  initializeSoulAssignments(soulDatabase, { ...soulOptions, approvedBytes: soulBytes, actor, reason });
  const profiles = openEditorialProfiles(profileDatabase, profileOptions);
  const souls = openSoulAssignments(soulDatabase, soulOptions);
  try {
    const actual = profiles.readBatches();
    assert.deepEqual(actual, batches.map(input => ({ logicalPath: input.logicalPath, batch: JSON.parse(input.bytes) })));
    assert.deepEqual(souls.readDocument(), JSON.parse(soulBytes));
    const assignments = souls.readAssignmentMap();
    assert.equal(assignments.size, 1022);
    for (const { batch } of actual) for (const profile of batch.profiles) {
      assert.deepEqual(profile.souls, assignments.get(profile.personId).souls);
    }
    const inputs = [...batches, { logicalPath: soulPath, bytes: soulBytes }];
    for (const input of inputs) assert.deepEqual(readPrivateSourceArchive(sourceRoot, input.logicalPath, hash(input.bytes)), input.bytes);
    const receipt = { schema: 'private-profile-bootstrap.v1', profileDatabase, soulDatabase,
      batches: actual.length, profiles: actual.reduce((n, row) => n + row.batch.profiles.length, 0),
      assignments: assignments.size, actor, reason,
      inputs: inputs.map(input => ({ logicalPath: input.logicalPath, sha256: hash(input.bytes) })),
      databases: [profileDatabase, soulDatabase].map(path => ({ path, sha256: hash(readFileSync(path)) })),
      scope: 'verified isolated read-only snapshots; not canonical replacement or editing workflow' };
    writeFileSync(join(outputDirectory, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    return receipt;
  } finally { profiles.close(); souls.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [sourceRoot, outputDirectory, actor, reason] = process.argv.slice(2);
  assert.equal(process.argv.length, 6);
  const receipt = bootstrapPrivateProfiles({ sourceRoot, outputDirectory, actor, reason });
  console.log(`PRIVATE_PROFILE_BOOTSTRAP_PASS batches=${receipt.batches} profiles=${receipt.profiles} assignments=${receipt.assignments}`);
}
