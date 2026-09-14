# Unity Isolation Launcher

This module provides `runIsolatedUnity()` for launching the Unity Editor in batchmode with strict isolation verification.

## CLI
```bash
node tools/unity/run-isolated-unity.mjs \
  --project /abs/path/to/project \
  --log /abs/path/to/Editor.log \
  --receipt /abs/path/to/receipt.json \
  [--timeout-ms 30000] \
  -- -batchmode -executeMethod SomeMethod -quit
```

The launcher:
- Uses the pinned Unity 6000.7.0a5 binary directly (no `/usr/bin/open`, no shell).
- Spawns with `detached: true`, `stdio: 'ignore'`.
- Owns the Editor PID and its process group.
- Observes frontmost app (System Events + lsappinfo/JXA), owned visible windows (CGWindow/JXA for PID only).
- Captures before/during/after samples.
- Writes a detailed receipt with all observations, PIDs, argv, log sentinels.
- Enforces success only on: exit 0, focus channels stable & available, owned_pid_alive sample during run, zero owned visible windows, batchmode log markers, clean shutdown with no residue.

Parsing is strict and fail-closed (absolute paths, no forbidden flags, required -- separator and -batchmode, no duplicate flags, no secrets in args).

## Testing
`test-isolation.mjs` tests only the pure parser + receipt verdict helpers (no real Unity launch, no sleeps, no side-effects, no hardcoded paths).

Real end-to-end smoke test with live Unity is pending in a separate verification task.

Corrected implementation for wave0 per isolation contract.
