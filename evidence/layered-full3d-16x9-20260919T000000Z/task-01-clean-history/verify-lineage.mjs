import assert from 'node:assert/strict';
import test from 'node:test';

const HASH = /^[0-9a-f]{40}$/;

function parseRecords(input, kind) {
  const records = input.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const seen = new Set();
  for (const record of records) {
    if (!record || typeof record.hash !== 'string' || !HASH.test(record.hash)) throw new Error(`malformed ${kind} hash`);
    if (seen.has(record.hash)) throw new Error(`duplicate ${kind} hash`);
    seen.add(record.hash);
    if (kind === 'commit') {
      if (!Array.isArray(record.parents) || record.parents.some((parent) => typeof parent !== 'string' || !HASH.test(parent))) throw new Error('malformed commit parent hash');
    } else if (typeof record.action !== 'string' || record.action.length === 0) throw new Error('malformed reflog action');
  }
  return records;
}

export function validateLineage({ baseHash, commits, reflog }) {
  if (typeof baseHash !== 'string' || !HASH.test(baseHash)) throw new Error('malformed base hash');
  const commitRecords = parseRecords(commits, 'commit');
  const reflogRecords = parseRecords(reflog, 'reflog');
  if (commitRecords.length < 1) throw new Error('missing commits');
  if (commitRecords[0].parents.length !== 1) throw new Error('merge parent count');
  if (commitRecords[0].parents[0] !== baseHash) throw new Error('wrong first parent');
  for (let index = 1; index < commitRecords.length; index += 1) {
    const current = commitRecords[index];
    if (current.parents.length !== 1) throw new Error('merge parent count');
    if (current.parents[0] !== commitRecords[index - 1].hash) throw new Error('disconnected parent chain');
  }
  const range = new Set(commitRecords.map(({ hash }) => hash));
  const evidence = new Set(reflogRecords.map(({ hash }) => hash));
  for (const hash of range) {
    if (!evidence.has(hash)) throw new Error(`missing reflog evidence ${hash}`);
  }
  for (const record of reflogRecords) {
    if (!range.has(record.hash)) throw new Error(`unknown reflog commit ${record.hash}`);
    if (!record.action.startsWith('commit:') || record.action.startsWith('commit (amend)')) throw new Error(`non-ordinary reflog action ${record.hash}`);
  }
  return true;
}

const h = (digit) => digit.repeat(40);
const valid4 = {
  baseHash: h('0'),
  commits: [1, 2, 3, 4].map((n) => JSON.stringify({ hash: h(String(n)), parents: [h(String(n - 1))] })).join('\n'),
  reflog: [1, 2, 3, 4].map((n) => JSON.stringify({ hash: h(String(n)), action: 'commit: ordinary' })).join('\n'),
};

test('accepts ordinary subject containing amend because subject is ignored', () => {
  assert.doesNotThrow(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('ordinary', 'document amend policy') }));
});
test('rejects structured commit amend action', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('commit: ordinary', 'commit (amend)') }), /non-ordinary/);
});
test('rejects merge parents', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: JSON.stringify({ hash: h('1'), parents: [h('0'), h('9')] }) }), /merge parent/);
});
test('rejects malformed commit hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(h('1'), 'bad') }), /malformed commit hash/);
});
test('rejects malformed parent hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(h('0'), 'bad') }), /malformed commit parent/);
});
test('rejects duplicate commit hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: `${valid4.commits}\n${JSON.stringify({ hash: h('4'), parents: [h('3')] })}` }), /duplicate commit/);
});
test('rejects wrong first parent', () => {
  assert.throws(() => validateLineage({ ...valid4, baseHash: h('9') }), /wrong first parent/);
});
test('rejects disconnected later parent', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(`"${h('3')}"`, `"${h('9')}"`) }), /disconnected/);
});
test('rejects missing reflog evidence', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.split('\n').slice(1).join('\n') }), /missing reflog/);
});
test('rejects malformed reflog hash', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace(h('1'), 'bad') }), /malformed reflog hash/);
});
test('rejects unknown reflog commit hash', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: `${valid4.reflog}\n${JSON.stringify({ hash: h('9'), action: 'commit: unknown' })}` }), /unknown reflog/);
});
test('rejects non-commit reflog action for range commit', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('commit: ordinary', 'checkout: ordinary') }), /non-ordinary/);
});
test('accepts valid four-commit actual-shaped chain', () => {
  assert.equal(validateLineage(valid4), true);
});
test('mutation proof distinguishes subject, parent-chain, and required-reflog checks', () => {
  assert.doesNotThrow(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('ordinary', 'amend policy') }));
  assert.throws(() => validateLineage({ ...valid4, baseHash: h('9') }), /wrong first parent/);
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.split('\n').slice(0, 3).join('\n') }), /missing reflog/);
});
