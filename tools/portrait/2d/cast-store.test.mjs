import assert from 'node:assert/strict';
import { test } from 'vitest';
import { mkdir, mkdtemp, writeFile, readFile, readdir, open, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { readCastStore, getCast, registerCast } from '../../cast-cli/src/store.js';

async function fixture() {
  const base = new URL('../../../.omo/evidence/local-migration/store-tests/', import.meta.url);
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base.pathname, 'case-'));
  return {
    dir, path: join(dir, 'characters.json'),
    async close() {
      await rm(dir, { recursive: true, force: true });
      await rm(base, { recursive: true, force: true }).catch(error => { if (error.code !== 'ENOTEMPTY') throw error; });
    },
  };
}
const draft = id => ({ id, name: 'Local Test Draft', gender: '남' });

test('missing store is empty, corrupt and malformed stores fail without rewriting bytes', async () => {
  const { path, close } = await fixture();
  try {
  assert.deepEqual(await readCastStore(path), { characters: [] });
  for (const bytes of ['{', 'null', '[]', '{}', '{"characters":{}}', JSON.stringify({ characters: [draft('same'), draft('same')] }), JSON.stringify({ characters: [{ id: 'bad', name: 'No Gender' }] })]) {
    await writeFile(path, bytes);
    await assert.rejects(readCastStore(path));
    await assert.rejects(registerCast(draft('new'), path));
    assert.equal(await readFile(path, 'utf8'), bytes);
  }
  } finally { await close(); }
});

test('registration requires authored identity, preserves fields, rejects duplicates and missing selection', async () => {
  const { path, dir, close } = await fixture();
  try {
  for (const value of [null, [], {}, { id: 3, name: 'Test', gender: '남' }, { id: 'a', name: ' ', gender: '남' }, { id: 'a', name: 'Test', gender: 'unknown' }]) await assert.rejects(registerCast(value, path));
  const record = { ...draft('one'), attributes: { ST: 12 } };
  await registerCast(record, path);
  assert.deepEqual(await getCast('one', path), record);
  const bytes = await readFile(path, 'utf8');
  await assert.rejects(registerCast(record, path), /already registered/);
  await assert.rejects(getCast('missing', path), /exactly once/);
  assert.equal(await readFile(path, 'utf8'), bytes);
  assert.deepEqual(await readdir(dir), ['characters.json']);
  } finally { await close(); }
});

test('concurrent registrations either persist every success or explicitly reject contention', async () => {
  const { path, close } = await fixture();
  try {
  const records = Array.from({ length: 16 }, (_, i) => draft('draft-' + i));
  const results = await Promise.allSettled(records.map(record => registerCast(record, path)));
  const succeeded = results.flatMap((result, i) => result.status === 'fulfilled' ? [records[i].id] : []);
  assert.ok(succeeded.length > 0);
  for (const result of results) if (result.status === 'rejected') assert.match(result.reason.message, /registration busy/);
  assert.deepEqual((await readCastStore(path)).characters.map(record => record.id).sort(), succeeded.sort());
  } finally { await close(); }
});

test('an existing process lock rejects registration without altering the store or lock', async () => {
  const { path, close } = await fixture();
  try {
  await registerCast(draft('first'), path);
  const bytes = await readFile(path, 'utf8');
  const lock = await open(path + '.lock', 'wx');
  try {
    await assert.rejects(registerCast(draft('second'), path), /registration busy/);
    assert.equal(await readFile(path, 'utf8'), bytes);
    assert.equal(await readFile(path + '.lock', 'utf8'), '');
  } finally { await lock.close(); }
  } finally { await close(); }
});
