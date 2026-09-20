import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const verifier = join(dirname(import.meta.filename), 'verify-required-lineage-cases.mjs');
const ids = ['mutant.optional-reflog', 'mutant.parent-chain-noop', 'mutant.subject-only', 'struct.amend-action', 'struct.commit-hash', 'struct.disconnected-parent', 'struct.duplicate-hash', 'struct.first-parent', 'struct.merge-parents', 'struct.missing-reflog', 'struct.parent-hash', 'struct.reflog-action', 'struct.reflog-hash', 'struct.subject-ignored', 'struct.unknown-reflog', 'struct.valid-chain'];
const clean = { required: [...ids], passed: [...ids] };

function run(receipt) {
  const dir = mkdtempSync(join(tmpdir(), 'lineage-receipt-'));
  const path = join(dir, 'receipt.json');
  writeFileSync(path, JSON.stringify(receipt));
  const result = spawnSync(process.execPath, [verifier, path], { encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  return result.status ?? 1;
}

assert.equal(run(clean), 0, 'clean receipt accepts');
assert.notEqual(run({ required: [...ids, 'struct.extra'], passed: [...ids, 'struct.extra'] }), 0, 'both arrays extra reject');
assert.notEqual(run({ required: ids.filter((id) => id !== 'struct.valid-chain'), passed: ids.filter((id) => id !== 'struct.valid-chain') }), 0, 'both arrays missing reject');
assert.notEqual(run({ required: [...ids, 'struct.valid-chain'], passed: [...ids, 'struct.valid-chain'] }), 0, 'duplicate required rejects');
assert.notEqual(run({ required: [...ids, 'struct.extra'], passed: [...ids] }), 0, 'required-only tamper rejects');
assert.notEqual(run({ required: [...ids], passed: [...ids, 'struct.extra'] }), 0, 'passed-only tamper rejects');
assert.notEqual(run({ required: 'not-array', passed: [...ids] }), 0, 'wrong type rejects');
assert.notEqual(run({ required: [...ids], passed: [...ids, 7] }), 0, 'nonstring rejects');
console.log('receipt tamper probes: 8 passed');
