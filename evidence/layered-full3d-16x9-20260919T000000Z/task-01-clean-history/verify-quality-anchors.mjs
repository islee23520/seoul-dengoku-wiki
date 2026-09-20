import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = dirname(import.meta.filename);
const index = JSON.parse(readFileSync(join(root, 'source-anchor-index.json'), 'utf8'));
const review = readFileSync(join(root, 'quality-review.md'), 'utf8');
if (/verify-[^`\s]*\.mjs:\d/.test(review)) throw new Error('manual source line claim');
const EXPECTED_ANCHORS = Object.freeze({
  'runner-inventory': ['verify-lineage.mjs', 'const REQUIRED_CASE_IDS', 'function parseRecords'],
  'mutant-proof-helper': ['verify-lineage.mjs', 'function expectMutantKilled', 'function writeRequiredReceipt'],
  'structural-validator': ['verify-lineage.mjs', 'export function validateLineage', 'const h ='],
  'subject-only-mutant': ['verify-lineage.mjs', 'function subjectOnlyMutant', 'const amended ='],
  'parent-chain-noop-mutant': ['verify-lineage.mjs', 'function parentChainNoopMutant', 'const disconnected ='],
  'optional-reflog-mutant': ['verify-lineage.mjs', 'function optionalReflogMutant', 'const missingEvidence ='],
  'inventory-completion': ['verify-lineage.mjs', "test('writes exact required case inventory'", null],
  'independent-expected-ids': ['verify-required-lineage-cases.mjs', 'const EXPECTED_REQUIRED_CASE_IDS', 'const receiptPath'],
  'receipt-schema-verifier': ['verify-required-lineage-cases.mjs', 'function validateArray', null],
  'tamper-tests': ['test-required-lineage-cases.mjs', 'const clean =', "console.log('receipt tamper probes"],
});
if (!Array.isArray(index.anchors) || new Set(index.anchors.map((a) => a.id)).size !== index.anchors.length) throw new Error('anchor inventory malformed');
if (index.anchors.length !== Object.keys(EXPECTED_ANCHORS).length || index.anchors.some((a) => !EXPECTED_ANCHORS[a.id])) throw new Error('anchor inventory mismatch');
function locate(file, token) { const lines = readFileSync(join(root, file), 'utf8').split('\n'); const hits = lines.map((line, i) => line.includes(token) ? i + 1 : 0).filter(Boolean); if (hits.length !== 1) throw new Error(`token occurrence mismatch ${file}:${token}`); return hits[0]; }
const anchors = new Map(index.anchors.map((anchor) => [anchor.id, anchor]));
for (const [id, [file, startToken, endToken]] of Object.entries(EXPECTED_ANCHORS)) {
  const anchor = anchors.get(id); if (anchor.file !== file || anchor.startToken !== startToken || anchor.endToken !== endToken) throw new Error(`anchor authority mismatch ${id}`);
  const start = locate(file, startToken); const end = endToken ? locate(file, endToken) : start;
  if (anchor.startLine !== start || anchor.endLine !== end) throw new Error(`anchor line mismatch ${id}`);
}
for (const id of review.matchAll(/\[anchor:([^\]]+)\]/g)) {
  const anchor = anchors.get(id[1]);
  if (!anchor) throw new Error(`unknown anchor ${id[1]}`);
  const source = readFileSync(join(root, anchor.file), 'utf8');
  if (createHash('sha256').update(source).digest('hex') !== anchor.sha256) throw new Error(`stale source ${id[1]}`);
  if (anchor.startLine > anchor.endLine || !anchor.startText || !anchor.endText) throw new Error(`empty anchor ${id[1]}`);
}
console.log(`quality anchors verified: ${new Set([...review.matchAll(/\[anchor:([^\]]+)\]/g)].map((m) => m[1])).size}`);
