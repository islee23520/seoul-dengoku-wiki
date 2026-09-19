import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, basename, resolve } from 'node:path';
const root = dirname(import.meta.filename);
const cleanup = JSON.parse(readFileSync(join(root, 'cleanup.json'), 'utf8'));
const topKeys = Object.keys(cleanup).sort();
if (topKeys.join(',') !== 'binding_semantics,content_manifest_sha256,removed_paths,schemaVersion') throw new Error('invalid cleanup schema');
if (cleanup.schemaVersion !== 1) throw new Error('invalid cleanup schema version');
const manifest = JSON.parse(readFileSync(join(root, 'task31-evidence-manifest.json'), 'utf8'));
if (!/^[0-9a-f]{64}$/.test(cleanup.content_manifest_sha256) || /^0+$/.test(cleanup.content_manifest_sha256)) throw new Error('invalid cleanup digest');
if (cleanup.content_manifest_sha256 !== manifest.manifestSha256) throw new Error('cleanup manifest mismatch');
if (cleanup.binding_semantics !== 'cleanup binds exact task31 evidence content manifest; independent of Git parent or HEAD; cleanup and manifest files are excluded to avoid recursion') throw new Error('invalid binding semantics');
const tempRoot = resolve('/tmp');
const tempRealRoot = realpathSync('/tmp');
if (!Array.isArray(cleanup.removed_paths)) throw new Error('removed_paths must be array');
const seen = new Set();
for (const item of cleanup.removed_paths) {
  if (!item || Object.keys(item).sort().join(',') !== 'expectedAbsent,path' || item.expectedAbsent !== true || typeof item.path !== 'string' || item.path.length === 0) throw new Error('invalid removed path schema');
  const candidate = resolve(item.path);
  const candidateParent = resolve(dirname(candidate));
  const candidateRealParent = realpathSync(candidateParent);
  if (!item.path.startsWith('/') || dirname(candidate) !== tempRoot || candidateRealParent !== tempRealRoot || !basename(candidate).startsWith('task31-') || candidate === tempRoot || seen.has(candidate)) throw new Error('unsafe removed path');
  seen.add(candidate);
  try { lstatSync(candidate); throw new Error('removed path exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
console.log(`cleanup verified: ${seen.size} removed paths`);
