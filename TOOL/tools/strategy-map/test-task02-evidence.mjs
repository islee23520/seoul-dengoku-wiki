import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyTask02Provenance } from './verify-task02-evidence.mjs';

const repoRoot = new URL('../../..', import.meta.url).pathname;
const evidence = process.env.TASK02_EVIDENCE_DIR;
const sourceNames = ['execution-context.json', 'manual-place-id.json', 'green/place-identity.xml', 'green/place-identity.log', 'regression/route-traversal.xml', 'regression/route-traversal.log'];
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'task02-provenance-'));
  const paths = sourceNames.map((name) => { const output = join(dir, name.replaceAll('/', '-')); writeFileSync(output, readFileSync(join(evidence, name))); return output; });
  return { dir, paths };
};
const rejects = (mutate) => { const current = fixture(); try { mutate(current.paths); assert.throws(() => verifyTask02Provenance(repoRoot, ...current.paths)); } finally { rmSync(current.dir, { recursive: true, force: true }); } };
const editJson = (path, mutate) => { const value = JSON.parse(readFileSync(path, 'utf8')); mutate(value); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); };

test('accepts detached K2 runtime provenance', () => { const current = fixture(); try { assert.equal(verifyTask02Provenance(repoRoot, ...current.paths).verified, true); } finally { rmSync(current.dir, { recursive: true, force: true }); } });
test('rejects implementation commit substitution', () => rejects(([context]) => editJson(context, (v) => { v.implementation_commit = process.env.TASK02_SUBSTITUTE_COMMIT; v.head_before = v.implementation_commit; v.head_after = v.implementation_commit; })));
test('rejects manual source label rewrite', () => rejects(([, manual]) => editJson(manual, (v) => { v.runtime_source_manifest_sha256 = 'f'.repeat(64); })));
test('rejects before HEAD mutation', () => rejects(([context]) => editJson(context, (v) => { v.head_before = '0'.repeat(40); })));
test('rejects after HEAD mutation', () => rejects(([context]) => editJson(context, (v) => { v.head_after = '0'.repeat(40); })));
test('rejects project path mutation', () => rejects(([context]) => editJson(context, (v) => { v.project_path = '/tmp/not-k2/GAME'; })));
test('rejects source hash mutation', () => rejects(([, manual]) => editJson(manual, (v) => { v.runtime_source_files[0].sha256 = 'f'.repeat(64); })));
test('rejects nonce mutation', () => rejects(([, manual]) => editJson(manual, (v) => { v.run_nonce = 'f'.repeat(64); })));
test('rejects XML SHA mutation', () => rejects(([context]) => editJson(context, (v) => { v.place_identity_xml_sha256 = 'f'.repeat(64); })));
test('rejects log SHA mutation', () => rejects(([context]) => editJson(context, (v) => { v.place_identity_log_sha256 = 'f'.repeat(64); })));
test('rejects manual SHA mutation', () => rejects(([context]) => editJson(context, (v) => { v.manual_sha256 = 'f'.repeat(64); })));
test('rejects noncommit', () => rejects(([context]) => editJson(context, (v) => { v.implementation_commit = '0'.repeat(40); v.head_before = v.implementation_commit; v.head_after = v.implementation_commit; })));
test('rejects nonancestor commit', () => rejects(([context]) => editJson(context, (v) => { v.implementation_commit = process.env.TASK02_NONANCESTOR_COMMIT; v.head_before = v.implementation_commit; v.head_after = v.implementation_commit; })));
