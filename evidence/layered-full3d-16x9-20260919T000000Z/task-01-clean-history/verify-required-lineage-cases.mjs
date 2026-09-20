import { readFileSync } from 'node:fs';

const EXPECTED_REQUIRED_CASE_IDS = Object.freeze([
  'mutant.optional-reflog', 'mutant.parent-chain-noop', 'mutant.subject-only',
  'struct.amend-action', 'struct.commit-hash', 'struct.disconnected-parent',
  'struct.duplicate-hash', 'struct.first-parent', 'struct.merge-parents',
  'struct.missing-reflog', 'struct.parent-hash', 'struct.reflog-action',
  'struct.reflog-hash', 'struct.subject-ignored', 'struct.unknown-reflog',
  'struct.valid-chain',
]);

const receiptPath = process.argv[2];
const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) throw new Error('receipt must be an object');
const keys = Object.keys(receipt).sort();
if (keys.join(',') !== 'passed,required') throw new Error('unexpected receipt schema');

function validateArray(name) {
  const values = receipt[name];
  if (!Array.isArray(values) || values.some((id) => typeof id !== 'string')) throw new Error(`malformed ${name} array`);
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${name} ID`);
  const sorted = [...values].sort();
  if (sorted.join('\n') !== EXPECTED_REQUIRED_CASE_IDS.join('\n')) throw new Error(`${name} IDs do not match independent authority`);
}

validateArray('required');
validateArray('passed');
console.log(JSON.stringify({ passed: receipt.passed, required: receipt.required }, null, 2));
