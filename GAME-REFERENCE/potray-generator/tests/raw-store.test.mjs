import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { openAssetDatabase } from '../src/database.mjs';
import { materializeRawAssets, verifyRawAssets } from '../src/raw-store.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(files) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'raw-store-'));
  const db = openAssetDatabase(join(repoRoot, 'assets.sqlite'));
  const insertContent = db.prepare('INSERT OR IGNORE INTO content_objects(sha256,byte_size,extension,media_type) VALUES(?,?,?,?)');
  const insertPath = db.prepare(`INSERT INTO asset_paths(path,sha256,byte_size,mtime_ms,stage,asset_class,lifecycle,failure_related)
    VALUES(?,?,?,?,?,?,?,?)`);
  const rows = [];
  for (const [path, value] of Object.entries(files)) {
    const bytes = Buffer.from(value);
    const absolute = join(repoRoot, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);
    const sha256 = digest(bytes);
    insertContent.run(sha256, bytes.length, path.includes('.') ? `.${path.split('.').pop()}` : '<none>', 'application/octet-stream');
    insertPath.run(path, sha256, bytes.length, 1, 'raw', 'document', 'current', 0);
    rows.push({ path, absolute, bytes, sha256 });
  }
  return {
    repoRoot,
    db,
    rows,
    close: async () => {
      db.close();
      await rm(repoRoot, { recursive: true, force: true });
    },
  };
}

function rawPath(root, sha256) {
  return join(root, 'Design/potrait-generator/raw/sha256', sha256.slice(0, 2), sha256);
}

test('materializes one byte-exact non-hardlinked object per SHA and preserves path/evaluation proof', async (t) => {
  const f = await fixture({
    '.omo/evidence/a/source.png': 'duplicate bytes',
    '.omo/evidence/b/candidate.png': 'duplicate bytes',
    '.omo/evidence/b/review.json': 'review bytes',
  });
  t.after(f.close);
  const target = f.rows[0];
  const receipt = f.rows[2];
  f.db.prepare(`INSERT INTO evaluation_observations(receipt_path,receipt_sha256,target_path,target_sha256,decision,authority,dimension,raw_status,summary,source_kind)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(receipt.path, receipt.sha256, target.path, target.sha256, 'PASS', 'curator', 'acceptance', 'PASS', 'accepted', 'curated');

  const result = await materializeRawAssets({ db: f.db, repoRoot: f.repoRoot });
  assert.deepEqual(result, { paths: 3, objects: 2, copied: 2, cached: 0, verified: 2, missing: 0 });

  const stored = rawPath(f.repoRoot, target.sha256);
  assert.deepEqual(await readFile(stored), target.bytes);
  assert.notEqual((await stat(stored)).ino, (await stat(target.absolute)).ino);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM asset_paths').get().count, 3);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM evaluation_observations').get().count, 1);
  const proof = f.db.prepare('SELECT source_path,sha256,stored_path,decision FROM raw_asset_proof WHERE source_path = ?').get(target.path);
  assert.deepEqual({ ...proof }, {
    source_path: target.path,
    sha256: target.sha256,
    stored_path: `Design/potrait-generator/raw/sha256/${target.sha256.slice(0, 2)}/${target.sha256}`,
    decision: 'PASS',
  });
});

test('repeat materialization verifies and caches existing objects idempotently', async (t) => {
  const f = await fixture({ '.omo/evidence/source.bin': 'stable' });
  t.after(f.close);
  await materializeRawAssets({ db: f.db, repoRoot: f.repoRoot });
  const before = await stat(rawPath(f.repoRoot, f.rows[0].sha256));

  const second = await materializeRawAssets({ db: f.db, repoRoot: f.repoRoot });
  const after = await stat(rawPath(f.repoRoot, f.rows[0].sha256));
  assert.deepEqual(second, { paths: 1, objects: 1, copied: 0, cached: 1, verified: 1, missing: 0 });
  assert.equal(after.ino, before.ino);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM raw_objects').get().count, 1);
  assert.deepEqual(await verifyRawAssets({ db: f.db, repoRoot: f.repoRoot }), {
    paths: 1, objects: 1, verified: 1, missing: 0, corrupt: 0, sourceMissing: 0, sourceMismatch: 0,
  });
});

test('rejects a source mutated after cataloging without storing wrong bytes', async (t) => {
  const f = await fixture({ '.omo/evidence/source.bin': 'original' });
  t.after(f.close);
  await writeFile(f.rows[0].absolute, 'mutated');

  await assert.rejects(
    materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }),
    /source \.omo\/evidence\/source\.bin integrity mismatch/,
  );
  await assert.rejects(readFile(rawPath(f.repoRoot, f.rows[0].sha256)), { code: 'ENOENT' });
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM raw_objects').get().count, 0);
  assert.deepEqual(await verifyRawAssets({ db: f.db, repoRoot: f.repoRoot }), {
    paths: 1, objects: 1, verified: 0, missing: 1, corrupt: 0, sourceMissing: 0, sourceMismatch: 1,
  });
});

test('never overwrites a corrupted stored blob', async (t) => {
  const f = await fixture({ '.omo/evidence/source.bin': 'original' });
  t.after(f.close);
  await materializeRawAssets({ db: f.db, repoRoot: f.repoRoot });
  const stored = rawPath(f.repoRoot, f.rows[0].sha256);
  await chmod(stored, 0o644);
  await writeFile(stored, 'corrupt');

  await assert.rejects(
    materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }),
    /stored object [0-9a-f]{64} integrity mismatch/,
  );
  assert.equal((await readFile(stored)).toString(), 'corrupt');
  assert.deepEqual(await verifyRawAssets({ db: f.db, repoRoot: f.repoRoot }), {
    paths: 1, objects: 1, verified: 0, missing: 0, corrupt: 1, sourceMissing: 0, sourceMismatch: 0,
  });
});

test('reports missing raw objects and sources explicitly', async (t) => {
  const f = await fixture({ '.omo/evidence/source.bin': 'original' });
  t.after(f.close);
  await rm(f.rows[0].absolute);

  assert.deepEqual(await verifyRawAssets({ db: f.db, repoRoot: f.repoRoot }), {
    paths: 1, objects: 1, verified: 0, missing: 1, corrupt: 0, sourceMissing: 1, sourceMismatch: 0,
  });
  await assert.rejects(materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }), /source missing/);
});

test('rejects escaping catalog paths, source symlinks, and raw-root symlinks', async (t) => {
  const f = await fixture({ '.omo/evidence/source.bin': 'safe' });
  t.after(f.close);
  const row = f.rows[0];

  f.db.prepare('UPDATE asset_paths SET path = ? WHERE path = ?').run('../escape.bin', row.path);
  await assert.rejects(materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }), /escapes repository/);

  f.db.prepare('UPDATE asset_paths SET path = ? WHERE path = ?').run(row.path, '../escape.bin');
  await rm(row.absolute);
  await symlink(join(f.repoRoot, 'real-source.bin'), row.absolute);
  await writeFile(join(f.repoRoot, 'real-source.bin'), row.bytes);
  await assert.rejects(materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }), /symbolic link/);

  await rm(row.absolute);
  await writeFile(row.absolute, row.bytes);
  const external = await mkdtemp(join(tmpdir(), 'raw-store-external-'));
  t.after(() => rm(external, { recursive: true, force: true }));
  await mkdir(join(f.repoRoot, 'Design/potrait-generator'), { recursive: true });
  await rm(join(f.repoRoot, 'Design/potrait-generator/raw'), { recursive: true, force: true });
  await symlink(external, join(f.repoRoot, 'Design/potrait-generator/raw'));
  await assert.rejects(materializeRawAssets({ db: f.db, repoRoot: f.repoRoot }), /symbolic link/);
  assert.deepEqual(await readFile(row.absolute), row.bytes);
});
