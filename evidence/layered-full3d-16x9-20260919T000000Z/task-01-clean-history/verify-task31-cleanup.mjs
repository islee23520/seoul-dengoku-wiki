import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = dirname(import.meta.filename);
const cleanup = JSON.parse(readFileSync(join(root, 'cleanup.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'task31-evidence-manifest.json'), 'utf8'));
if (!/^[0-9a-f]{64}$/.test(cleanup.content_manifest_sha256) || /^0+$/.test(cleanup.content_manifest_sha256)) throw new Error('invalid cleanup digest');
if (cleanup.content_manifest_sha256 !== manifest.manifestSha256) throw new Error('cleanup manifest mismatch');
if (cleanup.binding_semantics !== 'cleanup binds exact task31 evidence content manifest; independent of Git parent or HEAD; cleanup and manifest files are excluded to avoid recursion') throw new Error('invalid binding semantics');
const allowed = ['/tmp/', '/var/folders/'];
if (!Array.isArray(cleanup.removed_paths)) throw new Error('removed_paths must be array');
const seen = new Set();
for (const item of cleanup.removed_paths) { if (!item || item.expectedAbsent !== true || typeof item.path !== 'string' || !allowed.some((prefix) => item.path.startsWith(prefix)) || seen.has(item.path)) throw new Error('invalid removed path'); seen.add(item.path); try { lstatSync(item.path); throw new Error('removed path exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
console.log(`cleanup verified: ${seen.size} removed paths`);
