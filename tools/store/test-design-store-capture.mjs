import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { tmpdir } from 'node:os';

import { captureCorpus, verifyCapture, DB_NAME, ORIGINALS_DIR } from './design-store-capture.mjs';
function makeFixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), 'ds-capture-repo-'));
  mkdirSync(join(root, 'docs/game-logic/reference'), { recursive: true });
  mkdirSync(join(root, 'docs/game-logic/name-pools'), { recursive: true });
  mkdirSync(join(root, 'docs-site/rules'), { recursive: true });
  writeFileSync(join(root, 'Concept.md'), '# concept\n');
  writeFileSync(join(root, 'Design.md'), '# design\n');
  writeFileSync(join(root, 'ToDo.md'), '# todo\n');
  writeFileSync(join(root, 'Intent.md'), '# intent\n');
  writeFileSync(join(root, 'docs/game-logic/A.md'), 'alpha\n');
  writeFileSync(join(root, 'docs/game-logic/Z.md'), 'omega — unicode ✓\n');
  writeFileSync(join(root, 'docs/game-logic/reference/R1.md'), 'ref\n');
  writeFileSync(join(root, 'docs/game-logic/name-pools/p.json'), '{"a":1}\n');
  writeFileSync(join(root, 'docs/game-logic/name-pools/q.json'), '{"b":2}\n');
  // site rules: one authored-only, one mounted copy of a game-logic top-level page
  writeFileSync(join(root, 'docs-site/rules/Rules-X.md'), 'rules authored\n');
  writeFileSync(join(root, 'docs-site/rules/A.md'), 'mounted copy\n');
  return root;
}

function freshOut() {
  return mkdtempSync(join(tmpdir(), 'ds-capture-out-'));
}

function openDb(outDir) {
  return new DatabaseSync(join(outDir, DB_NAME));
}

test('faithful capture verifies PASS with the full corpus file count', () => {
  const repo = makeFixtureRepo();
  const out = freshOut();
  try {
    const cap = captureCorpus({ repoRoot: repo, outDir: out });
    assert.equal(cap.files, 10, 'corpus = 4 root + 2 top + 1 reference + 2 pools + 1 site-only');
    const res = verifyCapture({ repoRoot: repo, outDir: out });
    assert.equal(res.pass, true, JSON.stringify(res));
    assert.equal(res.files, 10);
    assert.deepEqual(res.missing, []);
    assert.deepEqual(res.mutated, []);
    assert.deepEqual(res.extras, []);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('verify FAILS when a 보존소 copy is mutated by one byte', () => {
  const repo = makeFixtureRepo();
  const out = freshOut();
  try {
    captureCorpus({ repoRoot: repo, outDir: out });
    const preserved = join(out, ORIGINALS_DIR, 'docs/game-logic/A.md');
    const buf = Buffer.from('alpha\n');
    buf[0] = 65; // 'a' -> 'A'
    writeFileSync(preserved, buf);
    const res = verifyCapture({ repoRoot: repo, outDir: out });
    assert.equal(res.pass, false);
    assert.ok(res.mutated.includes('docs/game-logic/A.md'), JSON.stringify(res.mutated));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('verify FAILS when a DB row is deleted (missing file)', () => {
  const repo = makeFixtureRepo();
  const out = freshOut();
  try {
    captureCorpus({ repoRoot: repo, outDir: out });
    const db = openDb(out);
    db.prepare("DELETE FROM source_file WHERE path = 'docs/game-logic/Z.md'").run();
    db.close();
    const res = verifyCapture({ repoRoot: repo, outDir: out });
    assert.equal(res.pass, false);
    assert.ok(res.missing.includes('docs/game-logic/Z.md'), JSON.stringify(res.missing));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('verify FAILS when the DB contains an extra row outside the corpus', () => {
  const repo = makeFixtureRepo();
  const out = freshOut();
  try {
    captureCorpus({ repoRoot: repo, outDir: out });
    const db = openDb(out);
    db.prepare(
      'INSERT INTO source_file (capture_run_id, path, file_set, size, sha256, git_blob_sha, git_dirty, bytes) VALUES (?,?,?,?,?,?,?,?)',
    ).run(1, 'not/in/corpus.md', 'smuggled', 2, '00', null, null, new Uint8Array([1, 2]));
    db.close();
    const res = verifyCapture({ repoRoot: repo, outDir: out });
    assert.equal(res.pass, false);
    assert.ok(res.extras.includes('not/in/corpus.md'), JSON.stringify(res.extras));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test('verify FAILS when stored DB bytes are mutated (DB vs repo mismatch)', () => {
  const repo = makeFixtureRepo();
  const out = freshOut();
  try {
    captureCorpus({ repoRoot: repo, outDir: out });
    const db = openDb(out);
    const flipped = Buffer.from('alpha\n');
    flipped[5] = 88; // '\n' -> 'X'
    db.prepare('UPDATE source_file SET bytes = ? WHERE path = ?').run(new Uint8Array(flipped), 'docs/game-logic/A.md');
    db.close();
    const res = verifyCapture({ repoRoot: repo, outDir: out });
    assert.equal(res.pass, false);
    assert.ok(res.mutated.includes('docs/game-logic/A.md'), JSON.stringify(res.mutated));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});
