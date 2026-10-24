import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PUBLICATION_PROVISION_SHA256, verifyPublicationRelocation } from './publication-storage-relocation.mjs';
import { openPublicationDatabaseInputs } from './publication-database-inputs.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(t, archiveBytes) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'publication-relocation-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const authority = '/original/private';
  const original = { databasePath: '/original/census/data/canonical/wiki-cast.sqlite',
    bootstrapReceiptPath: authority + '/bootstrap.json', captureReceiptPath: authority + '/capture.json',
    editorialDatabasePath: authority + '/editorial.sqlite', privateStores: { soulAssignments: authority + '/soul.sqlite' } };
  const bootstrap = { output: original.databasePath, storageMigration: {
    editorialDatabasePath: original.editorialDatabasePath,
    operation: 'separate-public-typed-authority-and-private-editorial-tables' } };
  const capture = { databasePath: authority + '/evidence.sqlite', externalArchives: [] };
  if (archiveBytes) capture.externalArchives.push({ path: authority + '/backup.archive',
    sha256: hash(archiveBytes), bytes: archiveBytes.length });
  const files = [], mappings = [];
  const add = async (originalPath, name, value, kind) => {
    const path = join(directory, name);
    if (kind === 'sqlite') {
      const db = new DatabaseSync(path);
      db.exec('CREATE TABLE identity(value TEXT);');
      db.prepare('INSERT INTO identity VALUES (?)').run(name);
      db.close();
    } else await writeFile(path, kind === 'archive' ? value : JSON.stringify(value) + '\n');
    const bytes = await readFile(path);
    files.push({ target: originalPath, kind, size: bytes.length, sha256: hash(bytes) });
    mappings.push({ originalPath, path });
    return path;
  };
  const config = { databasePath: await add(original.databasePath, 'authority.sqlite', null, 'sqlite'),
    bootstrapReceiptPath: await add(original.bootstrapReceiptPath, 'bootstrap.json', bootstrap, 'receipt'),
    captureReceiptPath: await add(original.captureReceiptPath, 'capture.json', capture, 'receipt'),
    editorialDatabasePath: await add(original.editorialDatabasePath, 'editorial.sqlite', null, 'sqlite'),
    privateStores: { soulAssignments: await add(original.privateStores.soulAssignments, 'soul.sqlite', null, 'sqlite') } };
  await add(capture.databasePath, 'evidence.sqlite', null, 'sqlite');
  if (archiveBytes) await add(capture.externalArchives[0].path, 'backup.archive', archiveBytes, 'archive');
  const publicationConfigPath = await add(authority + '/publication-config.json', 'original-config.json', original, 'receipt');
  const publicPin = files.shift();
  const manifest = { schema: 'seoul-wiki-sqlite-provision.v1', roots: { authorityRoot: authority, censusRoot: '/original/census' },
    publicDatabase: { path: original.databasePath, size: publicPin.size, sha256: publicPin.sha256 }, files };
  const provisionManifestPath = join(directory, 'manifest.json');
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
  await writeFile(provisionManifestPath, manifestBytes);
  config.relocation = { schema: 'publication-storage-relocation.v1', provisionManifestPath, publicationConfigPath, mappings };
  const bootstrapBytes = await readFile(config.bootstrapReceiptPath), captureBytes = await readFile(config.captureReceiptPath);
  const verify = () => verifyPublicationRelocation(config, bootstrapBytes, captureBytes, hash(manifestBytes));
  return { directory, config, bootstrapBytes, captureBytes, manifestBytes, verify, capture, original };
}

test('relocation authenticates exact SQLite bytes and original receipts independently of runtime paths', async t => {
  const f = await fixture(t);
  const relocation = await f.verify();
  const db = new DatabaseSync(relocation.path(f.capture.databasePath), { readOnly: true });
  try { assert.equal(db.prepare('SELECT value FROM identity').get().value, 'evidence.sqlite'); }
  finally { db.close(); }
  assert.deepEqual(await readFile(f.config.bootstrapReceiptPath), f.bootstrapBytes);
  assert.deepEqual(await readFile(f.config.captureReceiptPath), f.captureBytes);
  assert.equal(relocation.originalRoot, '/original/census');
});

test('relocation authenticates an archive beyond 1 MiB and rejects same-length nonaligned tail mutation', async t => {
  const archiveBytes = Buffer.alloc(1024 * 1024 + 137, 0x5a);
  archiveBytes.fill(0xa5, 1024 * 1024);
  const f = await fixture(t, archiveBytes);
  const archive = f.capture.externalArchives[0];
  const relocation = await f.verify();
  const path = relocation.path(archive.path);
  assert.deepEqual(await readFile(path), archiveBytes);
  relocation.assertUnchanged();
  t.diagnostic(`archive happy: ${archive.bytes} bytes sha256=${archive.sha256}`);
  const changed = await readFile(path);
  changed[changed.length - 1] ^= 1;
  assert.equal(changed.length, archive.bytes);
  assert.deepEqual(changed.subarray(0, 1024 * 1024), archiveBytes.subarray(0, 1024 * 1024));
  assert.notEqual(hash(changed), archive.sha256);
  await writeFile(path, changed);
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_HASH/u);
  t.diagnostic(`archive tail rejected: E_PUBLICATION_RELOCATION_HASH sha256=${hash(changed)}`);
});

test('production loader does not accept a caller-created manifest even with matching file hashes', async t => {
  const f = await fixture(t);
  await assert.rejects(openPublicationDatabaseInputs(f.directory, f.config), /E_PUBLICATION_RELOCATION_ANCHOR/u);
});

test('manifest currency advance rejects the previous anchor without relaxing verification', async t => {
  assert.equal(PUBLICATION_PROVISION_SHA256, '22b906bb4b859c6877795112c36c1fe5e26bb09d47887427b83a5fc4bdf6265a');
  const f = await fixture(t);
  const previousFixturePin = hash(f.manifestBytes);
  const current = JSON.parse(f.manifestBytes);
  const db = new DatabaseSync(f.config.databasePath);
  db.exec("UPDATE identity SET value='current-authority'");
  db.close();
  const databaseBytes = await readFile(f.config.databasePath);
  current.publicDatabase.size = databaseBytes.length;
  current.publicDatabase.sha256 = hash(databaseBytes);
  for (let index = 0; index < 5; index++) current.files.push({
    target: `/original/private/advance-${index}.receipt.json`, kind: 'receipt',
    size: 0, sha256: hash(Buffer.alloc(0)),
  });
  const currentBytes = Buffer.from(JSON.stringify(current) + '\n');
  await writeFile(f.config.relocation.provisionManifestPath, currentBytes);
  for (const stalePin of [previousFixturePin, '05e82ab71c0d970304d7f319170047e7b924f71467cdac6edae280fb75f98a92'])
    await assert.rejects(verifyPublicationRelocation(f.config, f.bootstrapBytes, f.captureBytes, stalePin),
      /E_PUBLICATION_RELOCATION_ANCHOR/u);
  const relocation = await verifyPublicationRelocation(f.config, f.bootstrapBytes, f.captureBytes, hash(currentBytes));
  relocation.assertUnchanged();
  // The production pin is not caller-selectable, even for internally valid fixtures.
  await assert.rejects(openPublicationDatabaseInputs(f.directory, f.config), /E_PUBLICATION_RELOCATION_ANCHOR/u);
});

test('unrelocated loader still requires the original bootstrap output path', async t => {
  const f = await fixture(t);
  delete f.config.relocation;
  await assert.rejects(openPublicationDatabaseInputs(f.directory, f.config), /E_PUBLICATION_DATABASE_IDENTITY/u);
});

for (const [name, change, expected] of [
  ['wrong bootstrap receipt binding', f => { f.bootstrapBytes = Buffer.from(JSON.stringify({ output: f.original.databasePath,
    storageMigration: { editorialDatabasePath: f.original.editorialDatabasePath, operation: 'separate-public-typed-authority-and-private-editorial-tables' }, forged: true })); }, 'RECEIPT'],
  ['wrong original database binding', f => { f.bootstrapBytes = Buffer.from(JSON.stringify({ output: '/wrong/database' })); }, 'BINDING'],
  ['wrong capture receipt binding', f => { f.captureBytes = Buffer.from(JSON.stringify({ ...f.capture, forged: true })); }, 'RECEIPT'],
  ['duplicate original mapping', f => { f.config.relocation.mappings.push({ ...f.config.relocation.mappings[0] }); }, 'MAPPING'],
  ['ambiguous destination mapping', f => { f.config.relocation.mappings[1].path = f.config.relocation.mappings[0].path; }, 'MAPPING'],
  ['missing evidence mapping', f => { f.config.relocation.mappings = f.config.relocation.mappings.filter(row => row.originalPath !== f.capture.databasePath); }, 'MAPPING'],
  ['path traversal', f => { f.config.relocation.mappings[0].path = f.directory + '/unused/../authority.sqlite'; }, 'MAPPING'],
  ['malformed config', f => { f.config.relocation.untrustedSha256 = '0'.repeat(64); }, 'CONFIG'],
  ['null config', f => { f.config.relocation = null; }, 'CONFIG'],
  ['private store substitution', f => { f.config.privateStores.soulAssignments = f.config.editorialDatabasePath; }, 'BINDING'],
]) test(`relocation rejects ${name}`, async t => {
  const f = await fixture(t);
  change(f);
  await assert.rejects(verifyPublicationRelocation(f.config, f.bootstrapBytes, f.captureBytes, hash(f.manifestBytes)),
    new RegExp(`E_PUBLICATION_RELOCATION_${expected}`, 'u'));
});

for (const member of ['databasePath', 'editorialDatabasePath', 'bootstrapReceiptPath', 'captureReceiptPath']) {
  test(`relocation rejects tampered ${member} bytes`, async t => {
    const f = await fixture(t);
    const bytes = await readFile(f.config[member]);
    bytes[bytes.length - 1] ^= 1;
    await writeFile(f.config[member], bytes);
    await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_HASH/u);
  });
}

test('relocation rejects a symlink target even when the content hash matches', async t => {
  const f = await fixture(t);
  const path = f.config.databasePath;
  await rename(path, path + '.original');
  await symlink(path + '.original', path);
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_PATH/u);
});

test('relocation rejects a symlink swap after authentication before any accepted read', async t => {
  const f = await fixture(t);
  const relocation = await f.verify();
  const path = f.config.databasePath;
  await rename(path, path + '.original');
  await symlink(path + '.original', path);
  assert.throws(() => relocation.assertUnchanged(), /E_PUBLICATION_RELOCATION_PATH/u);
});

test('relocation rejects stale changed SQLite state after authentication', async t => {
  const f = await fixture(t);
  const relocation = await f.verify();
  const db = new DatabaseSync(f.config.databasePath);
  db.exec("UPDATE identity SET value='stale'");
  db.close();
  assert.throws(() => relocation.assertUnchanged(), /E_PUBLICATION_RELOCATION_STALE/u);
});

test('relocation rejects unbound WAL state before opening stores', async t => {
  const f = await fixture(t);
  await writeFile(f.config.databasePath + '-wal', Buffer.alloc(32));
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_STALE/u);
});

test('relocation rejects a missing mapped file rather than falling back to the original path', async t => {
  const f = await fixture(t);
  await rm(f.config.databasePath);
  await assert.rejects(f.verify(), { code: 'ENOENT' });
});

test('relocation rejects tampered private store bytes', async t => {
  const f = await fixture(t);
  const db = new DatabaseSync(f.config.privateStores.soulAssignments);
  db.exec("UPDATE identity SET value='forged'");
  db.close();
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_HASH/u);
});

test('relocation rejects changed manifest bytes even if its own files match', async t => {
  const f = await fixture(t);
  await writeFile(f.config.relocation.provisionManifestPath, Buffer.concat([f.manifestBytes, Buffer.from(' ')]));
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_ANCHOR/u);
});

test('relocation rejects original config mutation before accepting any mapping', async t => {
  const f = await fixture(t);
  await writeFile(f.config.relocation.publicationConfigPath, JSON.stringify({ ...f.original, databasePath: f.config.databasePath }));
  await assert.rejects(f.verify(), /E_PUBLICATION_RELOCATION_HASH/u);
});
