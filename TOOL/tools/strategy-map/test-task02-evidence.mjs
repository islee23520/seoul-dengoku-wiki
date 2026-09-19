import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyTask02Evidence } from './verify-task02-evidence.mjs';

const repoRoot = new URL('../../..', import.meta.url).pathname;
const evidenceDir = process.env.TASK02_EVIDENCE_DIR;
const implementationCommit = process.env.TASK02_IMPLEMENTATION_COMMIT;
const staleCommit = process.env.TASK02_STALE_COMMIT;
const git = (args) => execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' }).trim();

const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'task02-evidence-'));
  const paths = Object.freeze({
    dir,
    manifest: join(dir, 'source-fingerprint.json'),
    manual: join(dir, 'manual-place-id.json'),
    receipt: join(dir, 'green-receipt.json'),
  });
  for (const key of ['manifest', 'manual', 'receipt']) {
    const source = key === 'manifest' ? 'source-fingerprint.json' : key === 'manual' ? 'manual-place-id.json' : 'green-receipt.json';
    writeFileSync(paths[key], readFileSync(join(evidenceDir, source)));
  }
  return paths;
};
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const rejects = (mutate) => {
  const current = fixture();
  try {
    const values = { manifest: load(current.manifest), manual: load(current.manual), receipt: load(current.receipt) };
    mutate(values);
    save(current.manifest, values.manifest);
    save(current.manual, values.manual);
    save(current.receipt, values.receipt);
    assert.throws(() => verifyTask02Evidence(repoRoot, current.manifest, current.manual, current.receipt));
  } finally {
    rmSync(current.dir, { recursive: true, force: true });
  }
};

test('accepts exact commit-tree-bound evidence', () => {
  const result = verifyTask02Evidence(repoRoot, join(evidenceDir, 'source-fingerprint.json'), join(evidenceDir, 'manual-place-id.json'), join(evidenceDir, 'green-receipt.json'));
  assert.equal(result.implementation_commit, implementationCommit);
  assert.equal(result.verified, true);
});

test('rejects manual extra key', () => rejects(({ manual }) => { manual.extra = true; }));
test('rejects manifest extra key', () => rejects(({ manifest }) => { manifest.extra = true; }));
test('rejects missing key', () => rejects(({ manual }) => { delete manual.hash_equal; }));
test('rejects wrong type', () => rejects(({ manual }) => { manual.identity_equal = 'true'; }));
test('rejects source path add', () => rejects(({ manifest }) => { manifest.files.push({ path: 'extra', sha256: '0'.repeat(64) }); }));
test('rejects source path drop', () => rejects(({ manifest }) => { manifest.files.pop(); }));
test('rejects duplicate source path', () => rejects(({ manifest }) => { manifest.files.push({ ...manifest.files[0] }); }));
test('rejects green receipt extra key', () => rejects(({ receipt }) => { receipt.extra = true; }));
test('rejects mismatched green commit', () => rejects(({ receipt }) => { receipt.implementation_commit = '0'.repeat(40); }));

test('rejects consistent source hash tamper', () => rejects(({ manifest, manual }) => {
  manifest.files[0].sha256 = 'f'.repeat(64);
  const material = manifest.files.map(({ path, sha256 }) => `${path}\0${sha256}\n`).join('');
  manifest.manifest_sha256 = createHash('sha256').update(material).digest('hex');
  manual.source_manifest_sha256 = manifest.manifest_sha256;
}));

test('rejects stale pre-fix commit even with consistently rewritten bindings', () => rejects(({ manifest, manual, receipt }) => {
  const oldTree = git(['rev-parse', '--verify', `${staleCommit}^{tree}`]);
  manifest.implementation_commit = staleCommit;
  manifest.implementation_tree = oldTree;
  manual.implementation_commit = staleCommit;
  receipt.implementation_commit = staleCommit;
}));

test('rejects valid nonancestor commit', () => rejects(({ manifest, manual, receipt }) => {
  const nonancestor = execFileSync('git', ['-C', repoRoot, 'commit-tree', 'HEAD^{tree}'], {
    encoding: 'utf8',
    input: 'task02 nonancestor fixture\n',
  }).trim();
  manifest.implementation_commit = nonancestor;
  manifest.implementation_tree = git(['rev-parse', `${nonancestor}^{tree}`]);
  manual.implementation_commit = nonancestor;
  receipt.implementation_commit = nonancestor;
}));
