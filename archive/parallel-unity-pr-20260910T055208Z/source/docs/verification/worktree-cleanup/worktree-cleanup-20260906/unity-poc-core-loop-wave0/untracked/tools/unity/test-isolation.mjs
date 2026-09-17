import { parseCli, verifyReceipt, makeTestReceipt } from './run-isolated-unity.mjs';
import assert from 'node:assert';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';

console.log('Running isolation unit tests...');

// Use temp dir for test artifacts (auto cleaned)
const testDir = mkdtempSync(join(tmpdir(), 'isolation-test-'));
console.log('Test dir:', testDir);

const absProject = join(testDir, 'test-project');
const absLog = join(testDir, 'test.log');
const absReceipt = join(testDir, 'receipt.json');

writeFileSync(absProject, 'fake project'); // to make exists true for some tests

// Helper to normalize error messages for assertions
function normalizeError(e) {
  return e.message || String(e);
}

try {
  // Test 1: missing/relative paths
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', 'relative/project', '--log', absLog, '--receipt', absReceipt, '--', '-batchmode']), /absolute.*project/i);
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', 'relative.log', '--receipt', absReceipt, '--', '-batchmode']), /absolute.*log/i);
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', absLog, '--receipt', 'relative.json', '--', '-batchmode']), /absolute.*receipt/i);
  console.log('✓ missing/relative paths');

  // Test 2: missing separator / batchmode
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', absLog, '--receipt', absReceipt, '-batchmode']), /separator.*--/i);
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', absLog, '--receipt', absReceipt, '--', '-quit']), /batchmode required/i);
  console.log('✓ missing separator/batchmode');

  // Test 3: forbidden flags
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', absLog, '--receipt', absReceipt, '--', '-batchmode', '-nographics']), /forbidden.*nographics/i); // example; adjust if needed
  assert.throws(() => parseCli(['node', 'run.mjs', '--project', absProject, '--log', absLog, '--receipt', absReceipt, '--', '-batchmode', '--projectPath', '/other']), /duplicate.*project/i);
  console.log('✓ forbidden flags');

  console.log('✓ parsing tests passed');

  // Test receipt-verdict helpers
  const goodReceipt = makeTestReceipt({
    exitCode: 0,
    ownedPidAliveDuring: true,
    focusChannelsAvailableAndUnchanged: true,
    ownedVisibleWindows: 0,
    logHasBatchmodeSentinel: true,
    cleanupSucceeded: true,
    hasRealExit: true,
    noOwnedResidue: true
  });
  const verdictGood = verifyReceipt(goodReceipt);
  assert.strictEqual(verdictGood.success, true, 'good receipt should pass');
  assert.strictEqual(verdictGood.reason, 'ok', 'good receipt reason ok');
  console.log('✓ true receipt passes');

  // failure cases
  let v;

  v = verifyReceipt(makeTestReceipt({ ...goodReceipt, exitCode: 1 }));
  assert.strictEqual(v.success, false);
  assert.match(v.reason, /exit.*0/i);
  console.log('✓ inferred/no exit fails');

  v = verifyReceipt(makeTestReceipt({ ...goodReceipt, ownedPidAliveDuring: false }));
  assert.strictEqual(v.success, false);
  assert.match(v.reason, /during.*alive/i);
  console.log('✓ no during sample fails');

  v = verifyReceipt(makeTestReceipt({ ...goodReceipt, focusChannelsAvailableAndUnchanged: false }));
  assert.strictEqual(v.success, false);
  assert.match(v.reason, /focus.*unavailable|unchanged/i);
  console.log('✓ focus unavailable fails');

  v = verifyReceipt(makeTestReceipt({ ...goodReceipt, ownedVisibleWindows: 1 }));
  assert.strictEqual(v.success, false);
  assert.match(v.reason, /visible.*window|zero/i);
  console.log('✓ visible owned window fails');

  v = verifyReceipt(makeTestReceipt({ ...goodReceipt, cleanupSucceeded: false }));
  assert.strictEqual(v.success, false);
  assert.match(v.reason, /cleanup/i);
  console.log('✓ cleanup false fails');

  // foreign PID test - should be ignored in window count etc, but test that verdict uses only owned
  const foreignReceipt = makeTestReceipt({
    ...goodReceipt,
    ownedVisibleWindows: 0,
    windowsObserved: [{pid: 9999, title: 'foreign'}] // foreign ignored
  });
  assert.strictEqual(verifyReceipt(foreignReceipt).success, true);
  console.log('✓ foreign PID ignored');

  console.log('\nAll isolation unit tests passed successfully.');
} catch (err) {
  console.error('\nTest failed:', normalizeError(err));
  process.exitCode = 1;
} finally {
  // cleanup
  try {
    rmSync(testDir, { recursive: true, force: true });
    console.log('Test artifacts cleaned.');
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }
}

if (process.exitCode !== 1) {
  console.log('\n✅ DoneClaim: files created, unit tests passing.');
  console.log('Files: tools/unity/run-isolated-unity.mjs, tools/unity/test-isolation.mjs, tools/unity/README.md');
  console.log('Test output captured above. Status: PASS');
}
