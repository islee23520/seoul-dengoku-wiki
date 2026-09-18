import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, readlink, rm } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const DEFAULT_RAW_ROOT = 'Design/potrait-generator/raw';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const posix = (value) => value.split(sep).join('/');

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_objects (
      sha256 TEXT PRIMARY KEY REFERENCES content_objects(sha256),
      stored_path TEXT NOT NULL UNIQUE,
      byte_size INTEGER NOT NULL,
      extension TEXT NOT NULL,
      verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
    DROP VIEW IF EXISTS raw_asset_proof;
    CREATE VIEW raw_asset_proof AS
      SELECT p.path AS source_path, p.sha256, r.stored_path, r.byte_size, r.extension,
             s.stage, s.asset_class, s.lifecycle, s.sex, s.slot, s.logical_id, s.decision
      FROM asset_paths p
      JOIN raw_objects r ON r.sha256 = p.sha256
      JOIN asset_state s ON s.best_path = p.path;
  `);
}

function containedPath(root, path, label) {
  const absoluteRoot = resolve(root);
  const absolutePath = resolve(path);
  const fromRoot = relative(absoluteRoot, absolutePath);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error(`${label} escapes repository: ${path}`);
  }
  return absolutePath;
}

function sourcePath(repoRoot, catalogPath) {
  if (typeof catalogPath !== 'string' || catalogPath.length === 0 || catalogPath.includes('\0') || isAbsolute(catalogPath)) {
    throw new Error(`asset path escapes repository: ${catalogPath}`);
  }
  return containedPath(repoRoot, resolve(repoRoot, catalogPath), `asset path ${catalogPath}`);
}

async function assertNoSymlink(root, target, { finalMustExist = false, finalMustBeFile = false } = {}) {
  const absoluteRoot = resolve(root);
  const absoluteTarget = containedPath(absoluteRoot, target, 'path');
  const segments = relative(absoluteRoot, absoluteTarget).split(sep).filter(Boolean);
  let current = absoluteRoot;

  try {
    const rootInfo = await lstat(current);
    if (rootInfo.isSymbolicLink()) throw new Error(`symbolic link is not allowed at IO boundary: ${current}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    if (finalMustExist) throw error;
  }

  for (let index = 0; index < segments.length; index += 1) {
    current = resolve(current, segments[index]);
    const isFinal = index === segments.length - 1;
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) {
        const destination = await readlink(current).catch(() => '<unreadable>');
        throw new Error(`symbolic link is not allowed at IO boundary: ${current} -> ${destination}`);
      }
      if (isFinal && finalMustBeFile && !info.isFile()) throw new Error(`source is not a regular file: ${current}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      if (isFinal && finalMustExist) throw error;
      break;
    }
  }
}

async function hashHandle(handle) {
  const hash = createHash('sha256');
  let byteSize = 0;
  for await (const chunk of handle.createReadStream({ autoClose: false })) {
    hash.update(chunk);
    byteSize += chunk.length;
  }
  return { sha256: hash.digest('hex'), byteSize };
}

async function inspectFile(path, boundaryRoot) {
  await assertNoSymlink(boundaryRoot, path, { finalMustExist: true, finalMustBeFile: true });
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    if (!before.isFile()) throw new Error(`not a regular file: ${path}`);
    const identity = await hashHandle(handle);
    const after = await handle.stat();
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
      throw new Error(`file changed while hashing: ${path}`);
    }
    return identity;
  } finally {
    await handle.close();
  }
}

function assertIdentity(identity, expectedSha, expectedSize, label) {
  if (identity.sha256 !== expectedSha || identity.byteSize !== expectedSize) {
    throw new Error(`${label} integrity mismatch: expected ${expectedSha}/${expectedSize}, got ${identity.sha256}/${identity.byteSize}`);
  }
}

async function ensureDirectory(path, boundaryRoot) {
  await assertNoSymlink(boundaryRoot, dirname(path));
  await mkdir(path, { recursive: true });
  await assertNoSymlink(boundaryRoot, path, { finalMustExist: true });
}

async function writeAll(handle, chunk) {
  let offset = 0;
  while (offset < chunk.length) {
    const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset);
    if (bytesWritten === 0) throw new Error('unable to make progress while writing raw object');
    offset += bytesWritten;
  }
}

async function copyVerified(source, destination, expectedSha, expectedSize, repoRoot, rawRoot) {
  await assertNoSymlink(repoRoot, source, { finalMustExist: true, finalMustBeFile: true });
  await ensureDirectory(dirname(destination), rawRoot);
  await assertNoSymlink(rawRoot, destination);

  const sourceHandle = await open(source, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  const temporary = `${destination}.tmp-${process.pid}-${randomUUID()}`;
  let temporaryHandle;
  try {
    const before = await sourceHandle.stat();
    if (!before.isFile()) throw new Error(`source is not a regular file: ${source}`);
    temporaryHandle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o444);
    const hash = createHash('sha256');
    let byteSize = 0;
    for await (const chunk of sourceHandle.createReadStream({ autoClose: false })) {
      hash.update(chunk);
      byteSize += chunk.length;
      await writeAll(temporaryHandle, chunk);
    }
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = undefined;
    const after = await sourceHandle.stat();
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
      throw new Error(`source changed while copying: ${source}`);
    }
    assertIdentity({ sha256: hash.digest('hex'), byteSize }, expectedSha, expectedSize, `source ${posix(relative(repoRoot, source))}`);
    try {
      await link(temporary, destination);
      await rm(temporary);
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      throw new Error(`stored object appeared during materialization: ${destination}`);
    }
  } finally {
    await temporaryHandle?.close().catch(() => {});
    await sourceHandle.close();
    await rm(temporary, { force: true }).catch(() => {});
  }
}

function catalogRows(db) {
  const rows = db.prepare(`
    SELECT p.path, p.sha256, p.byte_size, c.byte_size AS content_byte_size, c.extension
    FROM asset_paths p JOIN content_objects c ON c.sha256 = p.sha256
    ORDER BY p.sha256, p.path
  `).all();
  for (const row of rows) {
    if (!SHA256_PATTERN.test(row.sha256)) throw new Error(`invalid catalog SHA-256 for ${row.path}: ${row.sha256}`);
    if (row.byte_size !== row.content_byte_size) throw new Error(`catalog size mismatch for ${row.path}`);
  }
  return rows;
}

function roots(repoRoot, rawRoot = resolve(repoRoot, DEFAULT_RAW_ROOT)) {
  const repo = resolve(repoRoot);
  const raw = containedPath(repo, resolve(rawRoot), 'raw root');
  return { repo, raw };
}

function destinationFor(rawRoot, sha256) {
  return resolve(rawRoot, 'sha256', sha256.slice(0, 2), sha256);
}

function storedRelativePath(repoRoot, rawRoot, sha256) {
  return posix(relative(repoRoot, destinationFor(rawRoot, sha256)));
}

export async function materializeRawAssets({ db, repoRoot, rawRoot } = {}) {
  if (!db || !repoRoot) throw new TypeError('materializeRawAssets requires db and repoRoot');
  createSchema(db);
  const { repo, raw } = roots(repoRoot, rawRoot);
  await ensureDirectory(raw, repo);
  const rows = catalogRows(db);
  const objects = new Map();
  for (const row of rows) {
    const existing = objects.get(row.sha256);
    if (existing && existing.byteSize !== row.content_byte_size) throw new Error(`conflicting catalog sizes for ${row.sha256}`);
    if (!existing) objects.set(row.sha256, { byteSize: row.content_byte_size, extension: row.extension, source: row.path });

    const source = sourcePath(repo, row.path);
    let identity;
    try {
      identity = await inspectFile(source, repo);
    } catch (error) {
      if (error?.code === 'ENOENT') throw new Error(`source missing: ${row.path}`, { cause: error });
      throw error;
    }
    assertIdentity(identity, row.sha256, row.byte_size, `source ${row.path}`);
  }

  let copied = 0;
  let cached = 0;
  let verified = 0;
  const upsert = db.prepare(`INSERT INTO raw_objects(sha256,stored_path,byte_size,extension,verified_at)
    VALUES(?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(sha256) DO UPDATE SET stored_path=excluded.stored_path,byte_size=excluded.byte_size,extension=excluded.extension,verified_at=CURRENT_TIMESTAMP`);

  for (const [sha256, object] of objects) {
    const destination = destinationFor(raw, sha256);
    let exists = true;
    try {
      const identity = await inspectFile(destination, raw);
      assertIdentity(identity, sha256, object.byteSize, `stored object ${sha256}`);
      cached += 1;
      verified += 1;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      exists = false;
    }
    if (!exists) {
      await copyVerified(sourcePath(repo, object.source), destination, sha256, object.byteSize, repo, raw);
      const identity = await inspectFile(destination, raw);
      assertIdentity(identity, sha256, object.byteSize, `stored object ${sha256}`);
      copied += 1;
      verified += 1;
    }
    upsert.run(sha256, storedRelativePath(repo, raw, sha256), object.byteSize, object.extension);
  }

  return { paths: rows.length, objects: objects.size, copied, cached, verified, missing: 0 };
}

export async function verifyRawAssets({ db, repoRoot } = {}) {
  if (!db || !repoRoot) throw new TypeError('verifyRawAssets requires db and repoRoot');
  createSchema(db);
  const { repo, raw } = roots(repoRoot);
  const rows = catalogRows(db);
  const objects = new Map();
  let sourceMissing = 0;
  let sourceMismatch = 0;

  for (const row of rows) {
    if (!objects.has(row.sha256)) objects.set(row.sha256, { byteSize: row.content_byte_size });
    try {
      const identity = await inspectFile(sourcePath(repo, row.path), repo);
      if (identity.sha256 !== row.sha256 || identity.byteSize !== row.byte_size) sourceMismatch += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') sourceMissing += 1;
      else throw error;
    }
  }

  let verified = 0;
  let missing = 0;
  let corrupt = 0;
  for (const [sha256, object] of objects) {
    try {
      const identity = await inspectFile(destinationFor(raw, sha256), raw);
      if (identity.sha256 === sha256 && identity.byteSize === object.byteSize) verified += 1;
      else corrupt += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') missing += 1;
      else throw error;
    }
  }
  return { paths: rows.length, objects: objects.size, verified, missing, corrupt, sourceMissing, sourceMismatch };
}
