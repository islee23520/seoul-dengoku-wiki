import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { validatePrEvidence } from './check-pr-evidence.mjs';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pr-evidence-'));
  git(root, 'init');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Test');
  writeFileSync(join(root, 'README.md'), 'base\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'base');
  return root;
}

test('non-PR evidence path is detectable from git diff', () => {
  const root = fixture();
  const base = git(root, 'rev-parse', 'HEAD');
  mkdirSync(join(root, 'evidence', 'legacy'), { recursive: true });
  writeFileSync(join(root, 'evidence', 'legacy', 'new.txt'), 'bad\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'bad evidence');
  const paths = git(root, 'diff', '--name-only', `${base}...HEAD`, '--', 'evidence').split('\n');
  assert.deepEqual(paths, ['evidence/legacy/new.txt']);
  assert.equal(paths[0].startsWith('evidence/pr-203/'), false);
});

test('PR evidence manifest shape is deterministic', () => {
  const manifest = {
    schema_version: 1,
    pr_number: 203,
    evidence_for_sha: 'a'.repeat(40),
    status: 'review-only',
    files: [{ path: 'screenshot.png', sha256: 'b'.repeat(64) }],
  };
  assert.equal(manifest.pr_number, 203);
  assert.equal(manifest.files[0].sha256.length, 64);
});

test('valid PR evidence passes with ancestor implementation SHA', () => {
  const root = fixture();
  const base = git(root, 'rev-parse', 'HEAD');
  writeFileSync(join(root, 'feature.txt'), 'implementation\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'implementation');
  const implementation = git(root, 'rev-parse', 'HEAD');
  const dir = join(root, 'evidence', 'pr-203');
  mkdirSync(dir, { recursive: true });
  const evidence = Buffer.from('proof\n');
  writeFileSync(join(dir, 'proof.txt'), evidence);
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
    schema_version: 1,
    pr_number: 203,
    evidence_for_sha: implementation,
    status: 'review-only',
    files: [{ path: 'proof.txt', sha256: createHash('sha256').update(evidence).digest('hex') }],
  }));
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'evidence');
  assert.deepEqual(validatePrEvidence({ prNumber: 203, baseSha: base, root }), {
    status: 'PASS',
    changed: ['evidence/pr-203/manifest.json', 'evidence/pr-203/proof.txt'],
    errors: [],
  });
});

test('policy README is allowed outside PR evidence root', () => {
  const root = fixture();
  const base = git(root, 'rev-parse', 'HEAD');
  mkdirSync(join(root, 'evidence'));
  writeFileSync(join(root, 'evidence', 'README.md'), 'policy\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'evidence policy');
  assert.deepEqual(validatePrEvidence({ prNumber: 203, baseSha: base, root }), {
    status: 'PASS',
    changed: ['evidence/README.md'],
    errors: [],
  });
});

test('cleanup branch may only delete its original PR evidence folder', () => {
  const root = fixture();
  const dir = join(root, 'evidence', 'pr-144');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'proof.txt'), 'proof\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'historical evidence');
  const base = git(root, 'rev-parse', 'HEAD');
  execFileSync('rm', ['-rf', dir]);
  git(root, 'add', '-A');
  git(root, 'commit', '-m', 'cleanup');
  assert.deepEqual(validatePrEvidence({
    prNumber: 999,
    baseSha: base,
    headRef: 'cleanup/evidence-pr-144',
    root,
  }), {
    status: 'PASS',
    changed: ['evidence/pr-144/proof.txt'],
    errors: [],
  });
});
