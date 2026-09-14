import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Delivery-policy gate tests. Each scenario builds an isolated fixture root
// under the OS tempdir (never inside this repository, so the git origin probe
// cannot leak from a parent checkout), copies the real checker in, and runs
// it exactly the way tools/AGENTS.md documents: as a CLI with its own exit
// code. Plan fixtures are byte-for-byte historical blobs; see
// Tool/tools/policy/fixtures/README.md for provenance.

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const checkerPath = join('Tool', 'tools', 'policy', 'check-repo-delivery-policy.mjs');
const adrPath = join('GDD', 'adr', 'ADR-001-repository-delivery-policy.md');
const planPath = join('.omo', 'plans', 'seoul-grand-strategy-srpg.md');
const preAmendmentFixture = join('Tool', 'tools', 'policy', 'fixtures', 'seoul-grand-strategy-srpg-pre-amendment.md');
const amendedFixture = join('Tool', 'tools', 'policy', 'fixtures', 'seoul-grand-strategy-srpg-amended.md');
const authorizedOrigin = 'https://github.com/islee23520/seoul-kenshi.git';

function runChecker(root) {
  return new Promise((settle) => {
    execFile(process.execPath, [join(root, checkerPath)], { cwd: root }, (error, stdout, stderr) => {
      const exitCode = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
      let report = null;
      try {
        report = JSON.parse(stdout);
      } catch {
        // callers assert on report === null when the checker crashed
      }
      settle({ exitCode, stdout, stderr, report });
    });
  });
}

function execFileAsync(command, args, options) {
  return new Promise((settle) => {
    execFile(command, args, options, (error) => settle(error));
  });
}

async function createFixture(options = {}) {
  const { plan = 'none', origin = 'authorized', adr = 'tracked', competingAdr = false } = options;
  const root = await mkdtemp(join(tmpdir(), 'janseon-policy-gate-'));

  await mkdir(join(root, 'Tool', 'tools', 'policy'), { recursive: true });
  await cp(join(repositoryRoot, checkerPath), join(root, checkerPath));
  await mkdir(join(root, 'GDD', 'adr'), { recursive: true });

  if (adr !== 'missing') {
    let text = await readFile(join(repositoryRoot, adrPath), 'utf8');
    if (adr === 'gutted-merge') {
      text = text
        .replace('2. **Branch and pull request only.** All delivery goes through a dedicated branch and a pull request. Direct push to main is forbidden.\n', '')
        .replace('3. **No history rewrite.** No force-push, no amend of published commits, no rebase of shared history, no merge performed by agents. The owner merges pull requests.\n', '');
    }
    if (adr === 'gutted-wiki') {
      text = text.replace(/[Ww]iki/g, 'external');
    }
    await writeFile(join(root, adrPath), text);
  }

  if (plan !== 'none') {
    await mkdir(dirname(join(root, planPath)), { recursive: true });
    await cp(
      join(repositoryRoot, plan === 'pre-amendment' ? preAmendmentFixture : amendedFixture),
      join(root, planPath),
    );
  }

  if (origin !== 'none') {
    const url = origin === 'authorized' ? authorizedOrigin : 'https://github.com/islee23520/unrelated.git';
    const initError = await execFileAsync('git', ['init', '-q'], { cwd: root });
    assert.equal(initError, null, 'fixture git init failed');
    const remoteError = await execFileAsync('git', ['remote', 'add', 'origin', url], { cwd: root });
    assert.equal(remoteError, null, 'fixture git remote add failed');
  }

  if (competingAdr) {
    await writeFile(
      join(root, 'GDD', 'adr', 'ADR-009-competing.md'),
      '# ADR-009: Competing delivery rule\n\nAll delivery pushes straight to a second remote.\n',
    );
  }

  return root;
}

function assertFailureIncludes(result, names) {
  assert.equal(result.exitCode, 1, 'expected exit 1, got ' + result.exitCode + ':\n' + result.stdout + result.stderr);
  assert.notEqual(result.report, null, 'checker printed no JSON report: ' + result.stdout + result.stderr);
  assert.equal(result.report.result, 'FAIL');
  for (const name of names) {
    assert.ok(
      result.report.failures.includes(name),
      'expected failure "' + name + '", got: ' + result.report.failures.join(', '),
    );
  }
}

test('passes without the workspace plan artifact: tracked ADR-001 is canonical', async () => {
  const root = await createFixture();
  try {
    const result = await runChecker(root);
    assert.equal(result.exitCode, 0, 'expected exit 0:\n' + result.stdout + result.stderr);
    assert.equal(result.report.result, 'PASS');
    assert.equal(result.report.plan_present, false);
    assert.equal(result.report.failures.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('passes with an amended workspace plan artifact and enforces its linkage', async () => {
  const root = await createFixture({ plan: 'amended' });
  try {
    const result = await runChecker(root);
    assert.equal(result.exitCode, 0, 'expected exit 0:\n' + result.stdout + result.stderr);
    assert.equal(result.report.plan_present, true);
    assert.equal(result.report.stale_clauses_found, 12);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the plan artifact exists without the supersession amendment', async () => {
  const root = await createFixture({ plan: 'pre-amendment' });
  try {
    const result = await runChecker(root);
    assertFailureIncludes(result, [
      'amendment section present',
      'amendment references superseding ADR',
      'amendment appears after every local-only clause',
    ]);
    assert.equal(result.report.stale_clauses_found, 12);
    assert.equal(result.report.failures.includes('plan readable'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the live origin is not the authorized remote', async () => {
  const root = await createFixture({ origin: 'wrong' });
  try {
    assertFailureIncludes(await runChecker(root), ['live origin matches ADR record']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when no origin is configured', async () => {
  const root = await createFixture({ origin: 'none' });
  try {
    assertFailureIncludes(await runChecker(root), ['live origin matches ADR record']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the tracked ADR is missing', async () => {
  const root = await createFixture({ adr: 'missing' });
  try {
    assertFailureIncludes(await runChecker(root), ['authoritative ADR exists', 'live origin matches ADR record']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the ADR drops branch, push and owner-only merge clauses', async () => {
  const root = await createFixture({ adr: 'gutted-merge' });
  try {
    assertFailureIncludes(await runChecker(root), [
      'ADR records: no direct push to main',
      'ADR records: no force push or history rewrite',
      'ADR records: no merge by agents',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the ADR drops the derived Wiki assets policy', async () => {
  const root = await createFixture({ adr: 'gutted-wiki' });
  try {
    assertFailureIncludes(await runChecker(root), ['ADR records: derived Wiki assets policy']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when a second ADR states a competing delivery rule', async () => {
  const root = await createFixture({ competingAdr: true });
  try {
    assertFailureIncludes(await runChecker(root), ['exactly one current delivery rule']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
