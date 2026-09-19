import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = dirname(import.meta.filename); const verifier = join(root, 'verify-task31-cleanup.mjs'); const source = JSON.parse(readFileSync(join(root, 'cleanup.json'))); const manifest = JSON.parse(readFileSync(join(root, 'task31-evidence-manifest.json')));
function run(modify) { const dir = mkdtempSync(join(tmpdir(), 'task31-cleanup-')); for (const f of ['verify-task31-cleanup.mjs','cleanup.json','task31-evidence-manifest.json']) cpSync(join(root, f), join(dir, f)); const c = JSON.parse(JSON.stringify(source)); modify(c); writeFileSync(join(dir, 'cleanup.json'), JSON.stringify(c)); const r = spawnSync(process.execPath, [verifier.replace(root, dir)], { encoding: 'utf8' }); rmSync(dir, { recursive: true, force: true }); return r.status ?? 1; }
assert.equal(run(() => {}), 0);
assert.notEqual(run((c) => { c.content_manifest_sha256 = '0'.repeat(64); }), 0);
assert.notEqual(run((c) => { c.content_manifest_sha256 = 'f'.repeat(64); }), 0);
const existing = join(tmpdir(), 'task31-cleanup-existing'); writeFileSync(existing, 'x'); assert.notEqual(run((c) => { c.removed_paths = [{ path: existing, expectedAbsent: true }]; }), 0); rmSync(existing, { force: true });
assert.notEqual(run((c) => { c.removed_paths = [{ path: '/Users/unsafe', expectedAbsent: true }]; }), 0);
assert.notEqual(run((c) => { c.removed_paths = [{ path: '/tmp/a', expectedAbsent: false }]; }), 0);
console.log('cleanup self-tests: 6 passed');
