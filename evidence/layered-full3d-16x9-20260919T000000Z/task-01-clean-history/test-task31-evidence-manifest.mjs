import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = dirname(import.meta.filename);
function fixture() { const dir = mkdtempSync(join(tmpdir(), 'task31-manifest-')); for (const file of readdirSync(root)) if (file !== 'cleanup.json' && !file.startsWith('task31-evidence-manifest')) cpSync(join(root, file), join(dir, file)); cpSync(join(root, 'task31-evidence-manifest.json'), join(dir, 'task31-evidence-manifest.json')); return dir; }
function run(dir) { return spawnSync(process.execPath, [join(dir, 'verify-task31-evidence-manifest.mjs')], { encoding: 'utf8' }); }
const clean = fixture(); assert.equal(run(clean).status, 0); rmSync(clean, { recursive: true, force: true });
const changed = fixture(); writeFileSync(join(changed, 'extra.txt'), 'changed'); assert.notEqual(run(changed).status, 0); rmSync(changed, { recursive: true, force: true });
console.log('manifest self-tests: 2 passed');
