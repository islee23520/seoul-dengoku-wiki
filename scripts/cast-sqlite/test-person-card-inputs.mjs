import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { loadPersonDetailSources } from '../person-detail-inputs.mjs';
import { readPersonCardInputs } from './person-card-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const databasePath = process.env.EVIDENCE_DOCUMENT_DB
  ?? '/tmp/seoul-document-authority-20261020/bootstrap-issued-sheets-20261020.sqlite';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const entries = sources => ({
  personCards: [...sources.personCards],
  pagesBySlug: [...sources.pagesBySlug],
  renderedBySlug: [...sources.renderedBySlug],
  relations: sources.relations,
});

test('actual integrated DB matches the legacy loader exactly with source reads and archives denied', async () => {
  // One independent oracle call, before any filesystem or JSON parsing denial.
  const legacy = await loadPersonDetailSources({ repoRoot });
  const expected = entries(legacy);
  const db = new DatabaseSync(databasePath, { readOnly: true });
  let queries = 0;
  const guarded = { prepare(sql) {
    queries++;
    assert.match(sql, /^SELECT /u);
    assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b|\b\w*archive\w*\b/iu);
    return db.prepare(sql);
  } };
  const saved = {
    readFileSync: fs.readFileSync, readFile: fs.readFile,
    readdir: fs.readdir, readdirSync: fs.readdirSync,
    open: fs.open, openSync: fs.openSync,
    promiseRead: fsp.readFile, promiseReaddir: fsp.readdir, promiseOpen: fsp.open,
    parse: JSON.parse,
  };
  let actual;
  let blockedCalls = 0;
  const deny = () => { blockedCalls++; throw new Error('E_PERSON_CARD_SOURCE_READ_FORBIDDEN'); };
  try {
    fs.readFileSync = deny; fs.readFile = deny;
    fs.readdir = deny; fs.readdirSync = deny;
    fs.open = deny; fs.openSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; fsp.open = deny;
    JSON.parse = deny;
    syncBuiltinESMExports();
    actual = readPersonCardInputs(guarded, { repoRoot });
    assert.deepEqual(await loadDbInputs({ db: guarded, inputSubset: 'cards', repoRoot }), actual);
    assert.deepEqual(entries(actual), expected);
    assert.equal(JSON.stringify(entries(actual)), JSON.stringify(expected), 'Map and JSON key insertion order must match');
    const otherRoot = resolve('/metadata-only/person-card-root');
    const relocated = readPersonCardInputs(guarded, { repoRoot: otherRoot });
    for (const [slug, page] of relocated.pagesBySlug) {
      assert.equal(page.path, resolve(otherRoot, legacy.pagesBySlug.get(slug).path.slice(resolve(repoRoot).length + 1)));
      assert.equal(JSON.stringify(page.value), JSON.stringify(legacy.pagesBySlug.get(slug).value));
    }
    assert.deepEqual([...relocated.personCards], expected.personCards);
    assert.deepEqual([...relocated.renderedBySlug], expected.renderedBySlug);
    assert.deepEqual(relocated.relations, expected.relations);
  } finally {
    fs.readFileSync = saved.readFileSync; fs.readFile = saved.readFile;
    fs.readdir = saved.readdir; fs.readdirSync = saved.readdirSync;
    fs.open = saved.open; fs.openSync = saved.openSync;
    fsp.readFile = saved.promiseRead; fsp.readdir = saved.promiseReaddir; fsp.open = saved.promiseOpen;
    JSON.parse = saved.parse;
    syncBuiltinESMExports();
    db.close();
  }
  assert.equal(blockedCalls, 0, 'the DB reader must never attempt a denied fallback');
  assert.ok(queries > 0);
  const cards = [...actual.personCards.values()].flat();
  for (let index = 1; index <= 16; index++) assert.ok(cards.some(card => card.file === `Cast-State-${String(index).padStart(2, '0')}`));
  for (const file of ['Core-Characters', 'Cast-Unaffiliated']) assert.ok(cards.some(card => card.file === file));
  const diaspora = cards.filter(card => card.file === 'Diaspora-Corridors');
  assert.equal(diaspora.length, 6);
  assert.ok(diaspora.every(card => typeof card.heading === 'string' && !Object.hasOwn(card, 'primary')));
  assert.ok(cards.some(card => card.primary === true));
  console.log(`PERSON_CARD_DB_EXACT names=${actual.personCards.size} cards=${cards.length} pages=${actual.pagesBySlug.size} relations=${actual.relations.length} diaspora=${diaspora.length} blockedCalls=${blockedCalls} sha256=${digest(entries(actual))}`);
});
