import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { loadTimelineReviewAuthority, assertTimelineReviewAuthority } from '../timeline-review-authority.mjs';
import { openPublicationDatabaseInputs } from './publication-database-inputs.mjs';
import { resolve } from 'node:path';

test('timeline authority authenticates through the actual publication database bundle', {
  skip: !process.env.TIMELINE_PUBLICATION_CONFIG,
}, async () => {
  const root = resolve(import.meta.dirname, '../..');
  const config = JSON.parse(await readFile(process.env.TIMELINE_PUBLICATION_CONFIG));
  const bundle = await openPublicationDatabaseInputs(root, config);
  const saved = [fs.readFile, fs.readFileSync, fsp.readFile];
  try {
    fs.readFile = fs.readFileSync = fsp.readFile = () => { throw Error('timeline source filesystem forbidden'); };
    syncBuiltinESMExports();
    const sourceBytes = await bundle.inputs.readBytes(new URL('../../lore/chronology/Century-Annals.json', import.meta.url));
    const review = await loadTimelineReviewAuthority(bundle.inputs.readBytes);
    assert.equal(review.complete, true);
    assert.equal(assertTimelineReviewAuthority(JSON.parse(sourceBytes).content, {
      sourcePath: 'lore/chronology/Century-Annals.json', sourceBytes, review,
    }), review);
  } finally {
    [fs.readFile, fs.readFileSync, fsp.readFile] = saved;
    syncBuiltinESMExports(); bundle.close();
  }
});

test('fixed timeline approval pins authenticate captured storage bytes without filesystem fallback', async () => {
  const captured = new Map();
  const expected = await loadTimelineReviewAuthority(async url => {
    const bytes = await readFile(url); captured.set(url.href, bytes); return bytes;
  });
  const source = new URL('../../lore/chronology/Century-Annals.json', import.meta.url);
  const sourceBytes = captured.get(source.href);
  const content = JSON.parse(sourceBytes).content;
  const saved = [fs.readFile, fs.readFileSync, fsp.readFile];
  try {
    fs.readFile = fs.readFileSync = fsp.readFile = () => { throw Error('timeline filesystem fallback forbidden'); };
    syncBuiltinESMExports();
    const reader = async url => { assert.ok(captured.has(url.href)); return captured.get(url.href); };
    const actual = await loadTimelineReviewAuthority(reader);
    assert.deepEqual(actual, expected);
    assert.equal(assertTimelineReviewAuthority(content, { sourcePath: 'lore/chronology/Century-Annals.json', sourceBytes, review: actual }), actual);
    await assert.rejects(loadTimelineReviewAuthority(async url =>
      url.href === source.href ? Buffer.from('{}') : reader(url)));
  } finally { [fs.readFile, fs.readFileSync, fsp.readFile] = saved; syncBuiltinESMExports(); }
});
