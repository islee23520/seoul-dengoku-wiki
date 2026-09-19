import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = dirname(import.meta.filename);
const verifier = join(root, 'verify-quality-anchors.mjs');
const run = (dir) => spawnSync(process.execPath, [join(dir, 'verify-quality-anchors.mjs')], { encoding: 'utf8' });
function copyFixture() { const dir = mkdtempSync(join(tmpdir(), 'quality-anchor-')); for (const file of ['verify-quality-anchors.mjs', 'source-anchor-index.json', 'quality-review.md', 'verify-lineage.mjs', 'verify-required-lineage-cases.mjs', 'test-required-lineage-cases.mjs']) cpSync(join(root, file), join(dir, file)); return dir; }

const clean = copyFixture(); assert.equal(run(clean).status, 0); rmSync(clean, { recursive: true, force: true });
const stale = copyFixture(); writeFileSync(join(stale, 'verify-lineage.mjs'), `${readFileSync(join(stale, 'verify-lineage.mjs'), 'utf8')}\n`); assert.notEqual(run(stale).status, 0); rmSync(stale, { recursive: true, force: true });
const unknown = copyFixture(); writeFileSync(join(unknown, 'quality-review.md'), `${readFileSync(join(unknown, 'quality-review.md'), 'utf8')}\n[anchor:unknown]\n`); assert.notEqual(run(unknown).status, 0); rmSync(unknown, { recursive: true, force: true });
console.log('quality anchor self-tests: 3 passed');
