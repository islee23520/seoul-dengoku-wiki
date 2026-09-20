import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = dirname(import.meta.filename);
const specs = [
  ['runner-inventory', 'verify-lineage.mjs', 'const REQUIRED_CASE_IDS', 'function parseRecords'],
  ['mutant-proof-helper', 'verify-lineage.mjs', 'function expectMutantKilled', 'function writeRequiredReceipt'],
  ['structural-validator', 'verify-lineage.mjs', 'export function validateLineage', 'const h ='],
  ['subject-only-mutant', 'verify-lineage.mjs', 'function subjectOnlyMutant', 'const amended ='],
  ['parent-chain-noop-mutant', 'verify-lineage.mjs', 'function parentChainNoopMutant', 'const disconnected ='],
  ['optional-reflog-mutant', 'verify-lineage.mjs', 'function optionalReflogMutant', 'const missingEvidence ='],
  ['inventory-completion', 'verify-lineage.mjs', "test('writes exact required case inventory'", null],
  ['independent-expected-ids', 'verify-required-lineage-cases.mjs', 'const EXPECTED_REQUIRED_CASE_IDS', 'const receiptPath'],
  ['receipt-schema-verifier', 'verify-required-lineage-cases.mjs', 'function validateArray', null],
  ['tamper-tests', 'test-required-lineage-cases.mjs', 'const clean =', "console.log('receipt tamper probes"] ,
];

function locate(file, token) {
  const lines = readFileSync(join(root, file), 'utf8').split('\n');
  const hits = lines.map((line, index) => line.includes(token) ? index + 1 : 0).filter(Boolean);
  if (hits.length !== 1) throw new Error(`${file}: token ${token} occurrences=${hits.length}`);
  return { line: hits[0], text: lines[hits[0] - 1].trim() };
}

const anchors = specs.map(([id, file, startToken, endToken]) => {
  const source = readFileSync(join(root, file), 'utf8');
  const start = locate(file, startToken);
  const end = endToken ? locate(file, endToken) : start;
  if (end.line < start.line) throw new Error(`${id}: inverted range`);
  return { id, file, startLine: start.line, endLine: end.line, startToken, endToken, startText: start.text, endText: end.text, sha256: createHash('sha256').update(source).digest('hex') };
});
writeFileSync(join(root, 'source-anchor-index.json'), `${JSON.stringify({ version: 1, anchors }, null, 2)}\n`);
writeFileSync(join(root, 'source-line-index.txt'), `${anchors.map((a) => `${a.id} ${a.file}:${a.startLine}-${a.endLine} sha256=${a.sha256}\n  ${a.startText}\n  ${a.endText}`).join('\n')}\n`);
