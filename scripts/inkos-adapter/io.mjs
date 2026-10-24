import fs from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fail, LIMITS } from './contracts.mjs';

const inode = (a, b) => a.dev === b.dev && a.ino === b.ino;
const unchanged = (a, b) => inode(a, b) && a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs && a.nlink === b.nlink;

export function hostPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.split(/[\\/]/u).includes('..')) fail('E_ADAPTER_PATH', 'plain host-designated path required');
  if (!['linux', 'darwin'].includes(process.platform) || !Number.isInteger(fs.constants.O_NOFOLLOW) || !fs.constants.O_NOFOLLOW) fail('E_ADAPTER_UNSUPPORTED', 'no-follow local descriptors required');
  return resolve(value);
}

function directories(path) {
  let current = sep;
  return dirname(path).split(sep).filter(Boolean).map(part => {
    current = join(current, part);
    const stat = fs.lstatSync(current, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail('E_ADAPTER_PATH', 'non-symlink directory required');
    // Explicit local filesystem allowlist: APFS/HFS, ext, tmpfs, overlay, XFS,
    // btrfs and ramfs. Unknown/network filesystems are unsupported, not assumed safe.
    const type = Number(fs.statfsSync(current).type) >>> 0;
    if (![0x1a, 0x11, 0xef53, 0x01021994, 0x794c7630, 0x58465342, 0x9123683e, 0x858458f6].includes(type)) fail('E_ADAPTER_UNSUPPORTED', 'verified local filesystem required');
    return [current, stat];
  });
}
function checkParents(snapshot) {
  for (const [path, before] of snapshot) {
    const after = fs.lstatSync(path, { bigint: true });
    if (!after.isDirectory() || !inode(before, after)) fail('E_ADAPTER_PATH', 'parent swapped');
  }
}
function pathError(error) {
  if (['ELOOP', 'ENOTDIR'].includes(error.code)) fail('E_ADAPTER_PATH', 'symlink or invalid parent');
  throw error;
}

/** Bytes are bounded and read only from the descriptor validated by fstat. */
export function readHostFile(value, maximum = LIMITS.fileBytes) {
  const path = hostPath(value);
  let fd;
  try {
    const parents = directories(path);
    const entry = fs.lstatSync(path, { bigint: true });
    if (!entry.isFile() || entry.nlink !== 1n) fail('E_ADAPTER_PATH', 'single-link regular file required');
    fd = fs.openSync(path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.nlink !== 1n || !unchanged(entry, before)) fail('E_ADAPTER_PATH', 'file swapped before open');
    if (before.size > BigInt(maximum)) fail('E_ADAPTER_LIMIT', 'file too large');
    const bytes = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < bytes.length) {
      const count = fs.readSync(fd, bytes, length, bytes.length - length, null);
      if (!count) break;
      length += count;
    }
    if (length > maximum) fail('E_ADAPTER_LIMIT', 'file grew beyond limit');
    const after = fs.fstatSync(fd, { bigint: true });
    checkParents(parents);
    if (!unchanged(before, after) || !unchanged(after, fs.lstatSync(path, { bigint: true })) || BigInt(length) !== after.size) fail('E_ADAPTER_PATH', 'file changed during read');
    return bytes.subarray(0, length);
  } catch (error) { pathError(error); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
}

export function ensureHostDirectory(value) {
  const path = hostPath(value);
  const parents = directories(path);
  try { fs.mkdirSync(path, { mode: 0o700 }); }
  catch (error) { if (error.code !== 'EEXIST') pathError(error); }
  const stat = fs.lstatSync(path);
  checkParents(parents);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('E_ADAPTER_PATH', 'host directory required');
}

/** Synchronous cwd pinning supplies a directory-relative create on Node without
 * openat. Once verified, cwd remains attached to that directory inode even if
 * its pathname is renamed or replaced. Never yield while cwd is pinned. */
export function createImmutableFile(value, bytes) {
  const path = hostPath(value);
  const originalCwd = process.cwd();
  const name = basename(path);
  let fd, directoryFd, pinned = false, owned;
  try {
    const parents = directories(path);
    directoryFd = fs.openSync(dirname(path), fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW);
    const directory = fs.fstatSync(directoryFd, { bigint: true });
    if (!directory.isDirectory() || !inode(directory, parents.at(-1)[1])) fail('E_ADAPTER_PATH', 'output directory swapped');
    process.chdir(dirname(path));
    pinned = true;
    if (!inode(directory, fs.statSync('.', { bigint: true }))) fail('E_ADAPTER_PATH', 'cwd directory swapped');
    checkParents(parents);
    fd = fs.openSync(name, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    owned = fs.fstatSync(fd, { bigint: true });
    checkParents(parents);
    // Creating a child changes only the immediate parent's metadata. A rename
    // away and back changes an ancestor's ctime, even when inode checks pass.
    for (const [ancestor, before] of parents.slice(0, -1)) {
      if (fs.lstatSync(ancestor, { bigint: true }).ctimeNs !== before.ctimeNs) fail('E_ADAPTER_PATH', 'output lineage changed');
    }
    if (!owned.isFile() || owned.nlink !== 1n || owned.dev !== directory.dev || !inode(owned, fs.lstatSync(path, { bigint: true }))) fail('E_ADAPTER_PATH', 'regular output lineage required');
    fs.writeFileSync(fd, bytes);
    fs.fsyncSync(fd);
    checkParents(parents);
    const after = fs.fstatSync(fd, { bigint: true });
    if (after.nlink !== 1n || !unchanged(after, fs.lstatSync(path, { bigint: true })) || after.size !== BigInt(bytes.length)) fail('E_ADAPTER_PATH', 'output swapped');
  } catch (error) {
    // Relative lookup stays in the pinned directory; never follow a replaced
    // absolute parent path during cleanup and never unlink another inode.
    if (owned && pinned) {
      try { if (inode(owned, fs.lstatSync(name, { bigint: true }))) fs.unlinkSync(name); }
      catch (cleanupError) { if (cleanupError.code !== 'ENOENT') throw cleanupError; }
    }
    if (error.code === 'EEXIST') fail('E_ADAPTER_CONFLICT', 'immutable output already reserved');
    if (error.code === 'ENOENT') fail('E_ADAPTER_PATH', 'output lineage disappeared');
    pathError(error);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (directoryFd !== undefined) fs.closeSync(directoryFd);
    if (pinned) process.chdir(originalCwd);
  }
}
