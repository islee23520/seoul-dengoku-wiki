import assert from 'node:assert/strict';
import test from 'node:test';

function parseJsonLines(input, kind) {
  const records = input.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const seen = new Set();
  for (const record of records) {
    if (typeof record.hash !== 'string' || !/^[0-9a-f]{7,64}$/.test(record.hash)) throw new Error(`malformed ${kind} hash`);
    if (seen.has(record.hash)) throw new Error(`duplicate ${kind} hash`);
    seen.add(record.hash);
    if (kind === 'commit' && (!Array.isArray(record.parents) || record.parents.some((parent) => typeof parent !== 'string'))) throw new Error('malformed commit parents');
    if (kind === 'reflog' && typeof record.action !== 'string') throw new Error('malformed reflog action');
  }
  return records;
}

export function validateLineage({ commits, reflog, base }) {
  const commitRecords = parseJsonLines(commits, 'commit');
  const reflogRecords = parseJsonLines(reflog, 'reflog');
  if (commitRecords.length === 0 || typeof base !== 'string') throw new Error('missing lineage input');
  if (commitRecords.some(({ parents }) => parents.length !== 1)) throw new Error('merge or root commit in range');
  if (reflogRecords.some(({ action }) => action === 'commit (amend)' || action.startsWith('commit (amend)'))) throw new Error('amend reflog action');
  if (commitRecords.at(-1).parents[0] !== base) throw new Error('range does not attach to base');
  return { commits: commitRecords, reflog: reflogRecords };
}

test('accepts ordinary commit whose subject would contain amend', () => {
  assert.doesNotThrow(() => validateLineage({
    commits: '{"hash":"b000001","parents":["a000001"]}',
    reflog: '{"hash":"b000001","action":"commit: document amend policy"}',
    base: 'a000001',
  }));
});

test('rejects structured amend action even with harmless subject', () => {
  assert.throws(() => validateLineage({
    commits: '{"hash":"b000001","parents":["a000001"]}',
    reflog: '{"hash":"b000001","action":"commit (amend)"}',
    base: 'a000001',
  }), /amend reflog action/);
});

test('rejects merge with two parents', () => {
  assert.throws(() => validateLineage({
    commits: '{"hash":"b000001","parents":["a000001","c000001"]}',
    reflog: '{"hash":"b000001","action":"commit: merge"}',
    base: 'a000001',
  }), /merge/);
});

test('rejects malformed and duplicate hashes', () => {
  assert.throws(() => validateLineage({ commits: '{"hash":"bad","parents":["a000001"]}', reflog: '', base: 'a000001' }), /malformed/);
  assert.throws(() => validateLineage({ commits: '{"hash":"b000001","parents":["a000001"]}\n{"hash":"b000001","parents":["a000001"]}', reflog: '', base: 'a000001' }), /duplicate/);
});

test('mutation evidence distinguishes subject-only logic from structural action', () => {
  const ordinary = { commits: '{"hash":"b000001","parents":["a000001"]}', reflog: '{"hash":"b000001","action":"commit: document amend policy"}', base: 'a000001' };
  const amended = { commits: '{"hash":"b000001","parents":["a000001"]}', reflog: '{"hash":"b000001","action":"commit (amend)"}', base: 'a000001' };
  assert.doesNotThrow(() => validateLineage(ordinary));
  assert.throws(() => validateLineage(amended), /amend/);
});
