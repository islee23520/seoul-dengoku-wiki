import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stationCatalogPredecessorReader } from '../station-catalog-scope-successor.mjs';
import { reviewWordingPredecessorReader } from '../review-wording-successor.mjs';
import { k176PredecessorReader } from '../k176-label-successor.mjs';
import { climateLinkPredecessorReader } from '../climate-link-successor.mjs';
import { timelineWharfPredecessorReader } from '../timeline-wharf-successor.mjs';

const root = resolve(import.meta.dirname, '../..');
for (const wrap of [stationCatalogPredecessorReader, reviewWordingPredecessorReader,
  k176PredecessorReader, climateLinkPredecessorReader, timelineWharfPredecessorReader]) {
  test(`${wrap.name} preserves bounded historical evidence access after authentic predecessor replay`, async () => {
    const reader = path => readFile(path);
    const calls = [];
    reader.readHistorical = async (...args) => { calls.push(args); return Buffer.from('sealed history'); };
    reader.appliedDiskOverrides = new Map([['inherited', 'unchanged']]);
    const predecessor = await wrap(root, reader);
    assert.notEqual(predecessor, reader);
    assert.equal(predecessor.readHistorical, reader.readHistorical);
    assert.deepEqual(predecessor.appliedDiskOverrides, reader.appliedDiskOverrides);
    assert.equal((await predecessor.readHistorical('fixed-revision', 'source.mjs', root)).toString(), 'sealed history');
    assert.deepEqual(calls, [['fixed-revision', 'source.mjs', root]]);
  });
}
