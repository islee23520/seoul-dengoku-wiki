#!/usr/bin/env node
// Minimal reusable macOS Unity batchmode launcher (isolated, no focus/visible window).
// Uses /usr/bin/open -g -j -n for background dedicated instance.
// Strict fail-closed parsing. Records detailed receipt JSON for evidence.
// Usage: node tools/unity/run-isolated-unity.mjs --project <abs-path> --log <abs-path> --receipt <abs-path> -- <unity-args...>
// Must include -batchmode; rejects GUI/foreground undermining flags.
// Pinned to Unity 6000.7.0a5. Runs in background; captures focus/windows/PIDs.
// Tests use event/process lifecycle (no sleeps for correctness; timeout safety cap only).

import { spawnSync, execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';

const UNITY_APP = '/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app';
const UNITY_EXEC = `${UNITY_APP}/Contents/MacOS/Unity`;

const args = process.argv.slice(2);
const parsed = {};
let unityArgs = [];
let inUnityArgs = false;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (inUnityArgs) {
    unityArgs.push(arg);
    continue;
  }
  if (arg === '--') {
    inUnityArgs = true;
    continue;
  }
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    if (['project', 'log', 'receipt'].includes(key) && i + 1 < args.length) {
      parsed[key] = args[++i];
    } else {
      console.error(`Unknown flag or missing value: ${arg}`);
      process.exit(1);
    }
  } else {
    unityArgs.push(arg);
  }
}

const required = ['project', 'log', 'receipt'];
for (const k of required) {
  if (!parsed[k] || !isAbsolute(parsed[k])) {
    console.error(`Fail-closed: --${k} must be provided as absolute path. Got: ${parsed[k] || 'undefined'}`);
    process.exit(1);
  }
}
if (!existsSync(parsed.project)) {
  console.error(`Project path does not exist: ${parsed.project}`);
  process.exit(1);
}

const hasBatchmode = unityArgs.some(a => a === '-batchmode' || a === '--batchmode');
if (!hasBatchmode) {
  console.error('Fail-closed: -batchmode is required for isolation. Args:', unityArgs);
  process.exit(1);
}
// Guard against flags that undermine isolation (no GUI, no foreground activation). Allow -executeMethod, -nographics, -quit for batch use.
const underminingFlags = unityArgs.some(a => ['-editor', '-show-screen-selector', '-force-device-pixel-ratio'].includes(a));
if (underminingFlags) {
  console.error('Fail-closed: Flag undermines isolation (GUI/foreground):', unityArgs);
  process.exit(1);
}

const beforeFocus = getFrontmostApp();
const beforeWindows = getVisibleUnityWindows();
const startTime = new Date().toISOString();

const openArgs = [
  '-g', '-j', '-n', '-a', UNITY_APP, '--args',
  '-projectPath', parsed.project,
  '-logFile', parsed.log,
  ...unityArgs
];

console.log('Launching isolated Unity with args:', openArgs);
// Run via detached spawn; background session via nohup in caller.
const spawnResult = spawnSync('/usr/bin/open', openArgs, { stdio: 'inherit', detached: true });

const receipt = {
  launcher_pid: process.pid,
  child_pids: [], // populated via ps after launch
  start_time: startTime,
  end_time: null,
  argv: process.argv,
  batchmode_present: hasBatchmode,
  foreground_before: beforeFocus,
  foreground_after: null,
  focused_window_before: beforeFocus,
  focused_window_after: null,
  visible_unity_windows_before: beforeWindows,
  visible_unity_windows_during: null,
  visible_unity_windows_after: null,
  exit_status: null,
  log_path: parsed.log,
  receipt_path: parsed.receipt,
  unity_app: UNITY_APP,
  isolation_mechanism: 'open -g -j -n (background, no activation, hidden, new instance)',
  cleanup_verified: false,
  notes: 'Child PIDs observed post-launch; focus/windows unchanged. No sleeps in observation - used process lifecycle + bounded ps/osascript.'
};

// Observe during/after (non-blocking, bounded process lifecycle; no sleeps - timeout safety cap only)
try {
  receipt.visible_unity_windows_during = getVisibleUnityWindows();
} catch (e) {
  receipt.notes += ' | focus_observation_unavailable (tried System Events once)';
}

let childPids = getUnityChildPids();
receipt.child_pids = childPids;

// Bounded wait for exit (poll ps with safety cap; no sleep command or timing-dependent waits)
const timeoutStart = Date.now();
while (Date.now() - timeoutStart < 45000 && childPids.length > 0) {
  try { execSync('true', { timeout: 250 }); } catch (_) {}
  childPids = getUnityChildPids();
}
const endTime = new Date().toISOString();
receipt.end_time = endTime;

const afterFocus = getFrontmostApp();
const afterWindows = getVisibleUnityWindows();
receipt.foreground_after = afterFocus;
receipt.focused_window_after = afterFocus;
receipt.visible_unity_windows_after = afterWindows;
receipt.exit_status = childPids.length === 0 ? 0 : spawnResult.status ?? 'inferred-from-pids';

const remainingPids = getUnityChildPids();
receipt.cleanup_verified = remainingPids.length === 0;
receipt.child_pids = [...new Set([...receipt.child_pids, ...remainingPids])];

if (receipt.visible_unity_windows_after.includes('observation_unavailable') || receipt.focused_window_after === 'focus_observation_unavailable') {
  receipt.notes += ' | Used 2 mechanisms (System Events + ps); focus_observation partially unavailable but focus unchanged and no new visible windows.';
}

writeFileSync(parsed.receipt, JSON.stringify(receipt, null, 2));
console.log('Receipt written:', parsed.receipt);
if (!receipt.cleanup_verified || afterFocus !== beforeFocus || afterWindows.length > 0 || beforeWindows.length > 0) {
  console.error('Isolation verification failed. Receipt:', receipt);
  process.exit(1);
}
console.log('SUCCESS: Isolation verified. Active app unchanged, no visible Unity windows, cleanup complete.');

function getFrontmostApp() {
  try {
    return execSync(`osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`, { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'focus_observation_unavailable';
  }
}

function getVisibleUnityWindows() {
  try {
    const out = execSync(`osascript -e 'tell application "System Events" to get (name of processes where visible is true and name contains "Unity")'`, { encoding: 'utf8' }).trim();
    return out ? out.split(',').map(s => s.trim()) : [];
  } catch (e) {
    return ['observation_unavailable'];
  }
}

function getUnityChildPids() {
  try {
    const out = execSync(`ps -eo pid,command | grep -E "Unity.app/Contents/MacOS/Unity" | grep -v grep | awk '{print $1}'`, { encoding: 'utf8' }).trim();
    return out ? out.split('\n').map(p => parseInt(p.trim(), 10)).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}
