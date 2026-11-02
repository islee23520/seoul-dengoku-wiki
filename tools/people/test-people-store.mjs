import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openPeopleStore, parseCatalog, importPeopleSnapshot, verifyPeopleStore, getPerson } from './people-store.mjs';

test('catalog parser reads only literal values and rejects remote execution', () => {
  assert.deepEqual(parseCatalog('var p=[{id:`person-0001`,name:`한재목`}];export{p};', 'people'), [{ id: 'person-0001', name: '한재목' }]);
  assert.throws(() => parseCatalog('var p=[fetch("secret")];export{p};', 'people'), /executable value/);
});

test('people import is repeatable, source bound, and refuses identity drift', async () => {
  const root = await mkdtemp(join(tmpdir(), 'people-store-'));
  const db = openPeopleStore(join(root, 'people.sqlite'));
  try {
    const catalog = { id: 'person-0001', name: '한재목', gender: '남성', state: 'S01' };
    const detail = { ...catalog, detailRoute: '/people/person-0001', familyTree: { personId: 'K001' }, birthDate: '2069-06-17', age: 57 };
    const url = 'https://example.org/person-0001.json';
    const snapshot = { people: [{ catalog, detail, url }], portraits: [], sources: [{ url, body: JSON.stringify(detail), fetchedAt: '2026-10-10T00:00:00Z' }] };
    assert.deepEqual(importPeopleSnapshot(db, snapshot), { people: 1, portraits: 0, sources: 1 });
    assert.deepEqual(importPeopleSnapshot(db, snapshot), { people: 1, portraits: 0, sources: 1 });
    assert.equal(getPerson(db, 'K001').person_id, 'person-0001');
    assert.equal(getPerson(db, 'person-0001').character_id, 'K001');
    const drift = structuredClone(snapshot);
    drift.people[0].detail.name = '다른 인물';
    assert.throws(() => importPeopleSnapshot(db, drift), /identity mismatch/);
    assert.equal(verifyPeopleStore(db).people, 1);
    db.prepare('UPDATE sources SET body=?').run('changed');
    assert.throws(() => verifyPeopleStore(db), /source hash mismatch/);
  } finally { db.close(); await rm(root, { recursive: true }); }
});

test('opening and verifying an initialized people database preserves exact bytes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'people-readonly-'));
  const path = join(root, 'people.sqlite');
  let db = openPeopleStore(path);
  db.close();
  const before = await readFile(path);
  try {
    db = openPeopleStore(path);
    verifyPeopleStore(db);
    db.close();
    assert.deepEqual(await readFile(path), before);
  } finally { await rm(root, { recursive: true }); }
});
