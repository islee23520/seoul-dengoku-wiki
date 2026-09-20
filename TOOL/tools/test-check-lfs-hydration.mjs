import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('./check-lfs-hydration.mjs', import.meta.url));
const pointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${'a'.repeat(64)}\nsize 123\n`;

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'janseon-lfs-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'GAME/Assets/nested'), { recursive: true });
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [cli, root], { encoding: 'utf8' });
}

test('CLI reports actual runtime pointers without changing their bytes', async (t) => {
  const root = await fixture(t);
  const files = ['GAME/Assets/nested/character.png', 'GAME/Assets/nested/portrait.png'];
  for (const file of files) await writeFile(join(root, file), pointer);
  const result = run(root);
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.pointers, files);
  assert.equal(report.filesScanned, 2);
  for (const file of files) assert.equal(await readFile(join(root, file), 'utf8'), pointer);
});

test('CLI accepts hydrated bytes and innocent or incomplete pointer mentions', async (t) => {
  const root = await fixture(t);
  const bodies = [Buffer.from([137, 80, 78, 71, 0, 255]), `Example:\n${pointer}`,
    'version https://git-lfs.github.com/spec/v1\nThis is documentation.\n',
    pointer.replace('a'.repeat(64), 'not-a-sha256')];
  for (const [i, body] of bodies.entries()) await writeFile(join(root, `GAME/Assets/nested/file-${i}`), body);
  await writeFile(join(root, 'outside.png'), pointer);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { filesScanned: 4, pointers: [], errors: [] });
});

test('CLI recognizes CRLF and extension-bearing LFS pointers', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'GAME/Assets/nested/crlf.png'), pointer.replaceAll('\n', '\r\n'));
  await writeFile(join(root, 'GAME/Assets/nested/extension.png'), pointer.replace('oid sha256:', `ext-0-test sha256:${'b'.repeat(64)}\noid sha256:`));
  const result = run(root);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).pointers.length, 2);
});

test('CLI fails closed when the runtime asset root is missing', async (t) => {
  const root = await fixture(t);
  await rm(join(root, 'GAME/Assets'), { recursive: true });
  const result = run(root);
  assert.equal(result.status, 1, result.stderr);
  assert.ok(JSON.parse(result.stdout).errors.some((error) => error.path === 'GAME/Assets' && error.code === 'ENOENT'));
});

test('CLI reports unreadable input and rejects symlinks rather than skipping them', async (t) => {
  const root = await fixture(t);
  const path = join(root, 'GAME/Assets/nested/unreadable.png');
  await writeFile(path, pointer);
  await chmod(path, 0);
  let result;
  try { result = run(root); } finally { await chmod(path, 0o600); }
  assert.equal(result.status, 1, result.stderr);
  assert.ok(JSON.parse(result.stdout).errors.some((error) => error.path === 'GAME/Assets/nested/unreadable.png' && error.code === 'EACCES'));
  await symlink(join(root, 'absent.png'), join(root, 'GAME/Assets/nested/link.png'));
  const linked = run(root);
  assert.equal(linked.status, 1, linked.stderr);
  assert.ok(JSON.parse(linked.stdout).errors.some((error) => error.path === 'GAME/Assets/nested/link.png'));
});
