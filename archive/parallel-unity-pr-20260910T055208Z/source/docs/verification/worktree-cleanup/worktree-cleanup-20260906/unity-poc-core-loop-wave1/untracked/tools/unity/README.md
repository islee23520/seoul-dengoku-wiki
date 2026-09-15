# Unity Isolated Batchmode Launcher

Reusable tooling for all future Unity tasks. Launches in dedicated background process using macOS `/usr/bin/open -g -j -n` (no activation, hidden, new instance). Guarantees no visible Unity window or focus change. Always enforces `-batchmode`.

## CLI

```bash
node tools/unity/run-isolated-unity.mjs \
  --project /absolute/project/path \
  --log /absolute/log/file.log \
  --receipt /absolute/receipt.json \
  -- -batchmode -executeMethod SomeMethod -quit
```

- **Strict parsing**: Absolute paths only, fail-closed on missing `--project`/`--log`/`--receipt`, relative paths, missing `-batchmode`, or GUI-undermining flags.
- **Receipt**: JSON with PIDs, timestamps, before/after foreground/focus/window counts, exit status, cleanup proof. Uses safe non-prompting macOS queries (osascript + System Events / ps).
- **No sleeps**: Observation uses process lifecycle + bounded timeout cap only.
- **Pinned**: Unity 6000.7.0a5.
- **Background**: Run via `nohup` or subshell to avoid tying to foreground terminal.

## Tests & Smoke

See `test-isolation.mjs` (malformed args fail-closed) and real smoke below.

## Real Smoke Receipt Location
`.omo/evidence/unity-poc-core-loop/unity-isolation/smoke-receipt.json`

Binary PASS criteria met: active app (Brave Browser) unchanged before/after, only Unity Hub visible (no main Editor window), batchmode confirmed, child exited cleanly, PIDs cleaned up. Receipt proves isolation via open -g -j -n + macOS queries.

Do not edit Game/ sources. Use only in `tools/unity/` and evidence dir.
