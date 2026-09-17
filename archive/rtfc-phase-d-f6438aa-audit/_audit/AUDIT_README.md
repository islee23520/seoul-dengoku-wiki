# AUDIT_README — rtfc/phase-d f6438aa evidence export

Export of commit f6438aa2622aef54792e994832cc611a2017d9da (parent
dd630… = dd6f30af64c7419368d480854c7c2f43a51acdd6), produced for lead audit.
This directory contains only: (a) bytes extracted from `git archive` of the
commit, (b) git metadata text, (c) clearly-labeled `_audit/` notes authored by
the exporting agent. No product or evidence byte was authored or modified.

## Method / provenance
- Product/test sources and ALL phase-d driver evidence: extracted from
  `export.tar` = `git archive --format=tar f6438aa… -- <pathspecs>` executed on
  the Windows host (E:/git/seoul-kenshi-wt/rtfc-phase-d) with Windows git
  (C:\Program Files\Git\cmd\git.exe). Tar shipped to this Mac via base64 text
  transport; `sha256(export.tar) = d75cb99baa8d2d0d062b19d92ddb919d6a76f9e7c01e48efb5d74d7bde758bfc`.
- Byte-identity proof: `_git-metadata/git-ls-tree.txt` lists each committed
  blob SHA (git ls-tree -r f6438aa…). Every extracted file was re-hashed with
  `git hash-object`: 32/32 match (see `_audit/blob-verify.txt`).
- `_git-metadata/*` are direct git outputs (commit metadata, show --stat,
  diff dd6f30a..f6438aa restricted to the 9 source/test files, current
  `git status --porcelain=v1 --branch`, ls-tree). Note: PS-written metadata
  text files carry a UTF-8 BOM and CRLF; the diff/patch content is git's.
- The Windows worktree at export time: branch rtfc/phase-d, ahead 1, working
  tree clean except untracked `diff.txt` (NOT from this session — pre-existing
  foreign residue; left untouched, not part of f6438aa).

## RED chronology (per steering: no relabeling)
1. **FIRST RED — stub-era run, 2026-09-09 01:36:25 (host local, +0900),
   BEFORE any production pump code existed on disk.** Focused suite
   BattleSessionDriverTests against the compilable stub (Tick() body =
   `// RED stub: contract tests fail until the fixed-step pump lands.`):
   result Failed(Child), total=6 passed=1 failed=5, Unity exit 2, log 42,854
   bytes. Raw files were `red-editmode.xml` / `red-editmode.log` /
   `red-launch.log` / `red-editmode.exit` (empty; cmd `2>` parse bug) /
   `red-editmode.done`, at docs/verification/ulw-execute/rtfc/phase-d/driver/.
   **NO raw byte of this first-RED set survives on the host** — all five paths
   were overwritten ~01:45 by the misfired green task (runner naming bug: the
   green vbs still pointed at run-d1-red.cmd while the real driver had already
   replaced the stub). Surviving first-RED evidence = verbatim session-tool
   captures, quoted in `_audit/TRANSCRIPT-EXCERPTS-first-red.md` (counts,
   per-case results, launch log line, log size). The transcript is the
   surviving record; it is labeled as such and is not a host artifact.
2. **Overwritten run ("miscue"), ~01:45** — same red file names, but the REAL
   driver was on disk: Failed(Child), failed=3. Preserved under
   `miscue-real-driver-*` after renaming at 01:5x. This exposed one real
   implementation bug (clock primed on first Tick instead of Attach) and one
   wrong test expectation (ledger count 31 → 32). This is NOT first RED and
   NOT the stub RED; it is the accidental real-driver diagnostic run.
3. **Stub recapture RED ("red2"), 01:44:02 launch** — stub restored
   byte-identically (see stub note below), same tests: Failed(Child),
   total=6 passed=1 failed=5, exit 2. Files `red2-*`. This is a CLEAN RE-
   CAPTURE of the RED state, not the first capture; it exists because the
   first capture's raw bytes were lost in (2).
4. **GREEN**, 01:49:54 launch, real driver + corrected test: 6/6 passed,
   exit 0 (`green-editmode.*`).
5. **PlayMode consumer**, 01:58:23 launch: 1/1 passed, exit 0
   (`green-playmode.*`). First PlayMode attempt (01:53) exited 1 on a test-file
   compile error (missing `using VContainer;` for Resolve<T>); compile
   failures are not treated as behavioral evidence; fixed and re-run.

## Original stub hash (reconstruction provenance)
The stub bytes were never committed and their host copies were overwritten.
`_audit/original-stub-reconstruction/BattleSessionDriver.stub.cs` is a
reconstruction of the session-authored stub content (the exact content
transferred to the host before the first RED, and restored byte-identically
for the red2 run). sha256 of the reconstruction file is recorded beside it.
Treat it as a reconstruction claim, not a host-artifact hash.

## Consumer attachment (factual answer)
Production code does NOT attach a session. `PocCoreLoopController` never calls
`BattleSessionDriver.Attach`/`Enqueue`, and D1 did not modify it; it still
advances battle by its own 8-Steps-per-click handler. The only callers of
Attach/Enqueue are the two test files. In the live Foundation scene the driver
is constructed and player-loop-pumped by VContainer, but `State == null` makes
`Tick()` a no-op until a session is attached. The PlayMode consumer test
resolves the production driver instance from the live FoundationLifetimeScope
container and attaches its own session to prove the pump/clamp/pause/replay
contract through VContainer.

## Deviations on this export
- apply_patch is not available in this agent toolset; `_audit/` notes are the
  only authored files (new files, no existing byte replaced). Everything else
  is git-archive/git-output bytes.
- Transport temp files (C:\Users\oliver\AppData\Local\Temp\d1-audit-export\*
  and the fetch scripts) are this export's own artifacts; they were removed
  after the fetch. No repo/evidence file was touched.
