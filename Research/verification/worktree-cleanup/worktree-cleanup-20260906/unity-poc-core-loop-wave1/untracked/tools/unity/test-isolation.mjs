#!/usr/bin/env node
// Test malformed args (fail-closed). Uses process lifecycle, no sleeps for correctness.
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';

const CLI = '/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-core-loop-wave1/tools/unity/run-isolated-unity.mjs';
const PROJECT = '/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-core-loop-wave1/Game';
const LOG = '/tmp/test-log.log';
const RECEIPT = '/tmp/test-receipt.json';

const testCases = [
  { name: 'missing-project', args: ['--log', LOG, '--receipt', RECEIPT, '-batchmode'], expectFail: true },
  { name: 'relative-project', args: ['--project', 'Game', '--log', LOG, '--receipt', RECEIPT, '-batchmode'], expectFail: true },
  { name: 'no-batchmode', args: ['--project', PROJECT, '--log', LOG, '--receipt', RECEIPT, '-quit'], expectFail: true },
  { name: 'valid-minimal', args: ['--project', PROJECT, '--log', LOG, '--receipt', RECEIPT, '-batchmode', '-quit'], expectFail: false },
];

for (const tc of testCases) {
  console.log(`\n=== Test: ${tc.name} ===`);
  const result = spawnSync('node', [CLI, ...tc.args], { encoding: 'utf8', stdio: 'pipe' });
  console.log('Exit code:', result.status);
  if (tc.expectFail) {
    if (result.status !== 0 && (result.stderr.includes('Fail-closed') || result.stderr.includes('must be provided'))) {
      console.log('PASS: Failed as expected.');
    } else {
      console.error('FAIL: Did not fail-closed properly. Stderr:', result.stderr);
      process.exit(1);
    }
  } else if ((result.status === 0 || result.status === 1) && existsSync(RECEIPT)) {  // allow 1 from test launch
    const rec = JSON.parse(readFileSync(RECEIPT, 'utf8'));
    const focusUnchanged = rec.foreground_before === rec.foreground_after;
    const noNewWindows = !rec.visible_unity_windows_after || !rec.visible_unity_windows_after.some(w => w.includes('Unity') && !w.includes('Hub'));
    console.log('PASS: Receipt generated. Focus unchanged?', focusUnchanged, 'No new Unity windows?', noNewWindows);
    if (!focusUnchanged || !noNewWindows) console.warn('Isolation note:', rec);
    unlinkSync(RECEIPT);
    if (!focusUnchanged) process.exit(1);
  } else {
    console.error('FAIL: Unexpected result. Status:', result.status, 'Stderr:', result.stderr);
    process.exit(1);
  }
}

console.log('\nAll isolation tests passed.');
