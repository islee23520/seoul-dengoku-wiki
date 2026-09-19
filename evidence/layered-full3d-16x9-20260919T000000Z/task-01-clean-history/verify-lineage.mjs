import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync } from 'node:fs';

const HASH = /^[0-9a-f]{40}$/;
const REQUIRED_CASE_IDS = Object.freeze([
  'struct.subject-ignored', 'struct.amend-action', 'struct.merge-parents', 'struct.commit-hash',
  'struct.parent-hash', 'struct.duplicate-hash', 'struct.first-parent', 'struct.disconnected-parent',
  'struct.missing-reflog', 'struct.reflog-hash', 'struct.unknown-reflog', 'struct.reflog-action',
  'struct.valid-chain', 'mutant.subject-only', 'mutant.parent-chain-noop', 'mutant.optional-reflog',
]);
const passedRequiredCases = new Set();

function runRequiredCase(id, body) {
  if (!REQUIRED_CASE_IDS.includes(id)) throw new Error(`unknown required case ${id}`);
  const proof = body();
  if (id.startsWith('mutant.') && proof !== `killed:${id}`) throw new Error(`missing mutation proof ${id}`);
  passedRequiredCases.add(id);
}

function expectMutantKilled(id, mutantActual, literalExpected) {
  if (process.env.NEUTRALIZE_MUTANT_ID === id) return undefined;
  if (mutantActual === literalExpected) throw new Error(`mutation survived ${id}`);
  return `killed:${id}`;
}

function writeRequiredReceipt() {
  const passed = [...passedRequiredCases].sort();
  const required = [...REQUIRED_CASE_IDS].sort();
  if (passed.length !== required.length || passed.some((id, index) => id !== required[index])) throw new Error('required case inventory mismatch');
  const receipt = { passedRequiredCases: passed, requiredCaseIds: required };
  const output = process.env.REQUIRED_CASE_RECEIPT;
  if (output) writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

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

test('accepts ordinary subject containing amend because subject is ignored', () => runRequiredCase('struct.subject-ignored', () => {
  assert.doesNotThrow(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('ordinary', 'document amend policy') }));
}));
test('rejects structured commit amend action', () => runRequiredCase('struct.amend-action', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('commit: ordinary', 'commit (amend)') }), /non-ordinary/);
}));
test('rejects merge parents', () => runRequiredCase('struct.merge-parents', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: JSON.stringify({ hash: h('1'), parents: [h('0'), h('9')] }) }), /merge parent/);
}));
test('rejects malformed commit hash', () => runRequiredCase('struct.commit-hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(h('1'), 'bad') }), /malformed commit hash/);
}));
test('rejects malformed parent hash', () => runRequiredCase('struct.parent-hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(h('0'), 'bad') }), /malformed commit parent/);
}));
test('rejects duplicate commit hash', () => runRequiredCase('struct.duplicate-hash', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: `${valid4.commits}\n${JSON.stringify({ hash: h('4'), parents: [h('3')] })}` }), /duplicate commit/);
}));
test('rejects wrong first parent', () => runRequiredCase('struct.first-parent', () => {
  assert.throws(() => validateLineage({ ...valid4, baseHash: h('9') }), /wrong first parent/);
}));
test('rejects disconnected later parent', () => runRequiredCase('struct.disconnected-parent', () => {
  assert.throws(() => validateLineage({ ...valid4, commits: valid4.commits.replace(`"${h('3')}"`, `"${h('9')}"`) }), /disconnected/);
}));
test('rejects missing reflog evidence', () => runRequiredCase('struct.missing-reflog', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.split('\n').slice(1).join('\n') }), /missing reflog/);
}));
test('rejects malformed reflog hash', () => runRequiredCase('struct.reflog-hash', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace(h('1'), 'bad') }), /malformed reflog hash/);
}));
test('rejects unknown reflog commit hash', () => runRequiredCase('struct.unknown-reflog', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: `${valid4.reflog}\n${JSON.stringify({ hash: h('9'), action: 'commit: unknown' })}` }), /unknown reflog/);
}));
test('rejects non-commit reflog action for range commit', () => runRequiredCase('struct.reflog-action', () => {
  assert.throws(() => validateLineage({ ...valid4, reflog: valid4.reflog.replace('commit: ordinary', 'checkout: ordinary') }), /non-ordinary/);
}));
test('accepts valid four-commit actual-shaped chain', () => runRequiredCase('struct.valid-chain', () => {
  assert.equal(validateLineage(valid4), true);
}));
test('kills subjectOnlyMutant with subject and action fixtures', () => runRequiredCase('mutant.subject-only', () => {
  function subjectOnlyMutant({ commits, reflog }) {
    const commitRecords = commits.trim().split('\n').map(JSON.parse);
    const reflogRecords = reflog.trim().split('\n').filter(Boolean).map(JSON.parse);
    if (commitRecords.some(({ subject }) => subject?.includes('amend'))) return false;
    return reflogRecords.length > 0;
  }

  const ordinary = {
    ...valid4,
    commits: valid4.commits.replace('{"hash"', '{"subject":"document amend policy","hash"'),
  };
  assert.equal(validateLineage(ordinary), true);
  const ordinaryProof = expectMutantKilled('mutant.subject-only', subjectOnlyMutant(ordinary), true);

  const amended = {
    ...valid4,
    commits: valid4.commits.replace('{"hash"', '{"subject":"harmless subject","hash"'),
    reflog: valid4.reflog.replace('commit: ordinary', 'commit (amend)'),
  };
  assert.throws(() => validateLineage(amended), /non-ordinary/);
  const amendedProof = expectMutantKilled('mutant.subject-only', subjectOnlyMutant(amended), false);
  return ordinaryProof === amendedProof ? ordinaryProof : undefined;
}));
test('kills parentChainNoopMutant with disconnected parent fixture', () => runRequiredCase('mutant.parent-chain-noop', () => {
  function parentChainNoopMutant({ baseHash, commits, reflog }) {
    const commitRecords = commits.trim().split('\n').map(JSON.parse);
    const reflogRecords = reflog.trim().split('\n').filter(Boolean).map(JSON.parse);
    const hashes = [baseHash, ...commitRecords.flatMap(({ hash, parents }) => [hash, ...parents])];
    return hashes.every((hash) => HASH.test(hash))
      && commitRecords.every(({ parents }) => parents.length === 1)
      && reflogRecords.length >= commitRecords.length;
  }

  const disconnected = {
    ...valid4,
    commits: [
      { hash: h('1'), parents: [h('0')] },
      { hash: h('2'), parents: [h('9')] },
      { hash: h('3'), parents: [h('2')] },
      { hash: h('4'), parents: [h('3')] },
    ].map(JSON.stringify).join('\n'),
  };
  assert.throws(() => validateLineage(disconnected), /disconnected/);
  return expectMutantKilled('mutant.parent-chain-noop', parentChainNoopMutant(disconnected), false);
}));
test('kills optionalReflogMutant when commit evidence is missing', () => runRequiredCase('mutant.optional-reflog', () => {
  function optionalReflogMutant({ baseHash, commits }) {
    const commitRecords = commits.trim().split('\n').map(JSON.parse);
    return commitRecords.length > 0
      && commitRecords[0].parents.length === 1
      && commitRecords.every(({ hash, parents }) => HASH.test(hash) && parents.length === 1 && parents.every((parent) => HASH.test(parent)))
      && HASH.test(baseHash);
  }

  const missingEvidence = {
    baseHash: h('0'),
    commits: [
      { hash: h('1'), parents: [h('0')] },
      { hash: h('2'), parents: [h('1')] },
    ].map(JSON.stringify).join('\n'),
    reflog: JSON.stringify({ hash: h('1'), action: 'commit: ordinary' }),
  };
  assert.throws(() => validateLineage(missingEvidence), /missing reflog/);
  return expectMutantKilled('mutant.optional-reflog', optionalReflogMutant(missingEvidence), false);
}));

test('writes exact required case inventory', () => {
  const receipt = writeRequiredReceipt();
  assert.deepEqual(receipt.passedRequiredCases, receipt.requiredCaseIds);
});
