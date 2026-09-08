# RTFC Phase D — production driver integration

- Base: `f6438aa2622aef54792e994832cc611a2017d9da` on `rtfc/phase-d`
- Worktree: `E:/git/seoul-kenshi-wt/rtfc-phase-d`
- RED production: 1 total, 0 passed, 1 failed, 0 skipped — actual controller-created battle was not attached (`driver.State == null`).
- RED driver regressions: 8 total, 6 passed, 2 failed, 0 skipped — stale insertion stranded a future due command; terminal frame counted four steps.
- GREEN EditMode: 8/8, failed=0, skipped=0, exit 0.
- GREEN production E2E PlayMode: 1/1, failed=0, skipped=0, exit 0. Proves actual Bootstrap→MainTitle→Foundation battle attach, max-4 live frame budget, pause freeze with accepted card command, deterministic replay, terminal detach, settlement/return no revival.
- GREEN existing controller PlayMode: 1/1, failed=0, skipped=0, exit 0.
- LFS hydration: 2593 files, 0 pointers, 0 errors.
- Build attempt: exit 1 due pre-existing environment/content gate before player compilation: unsupported WebGL module and invalid pre-existing `MalgunGothicDynamic` TMP atlas. Raw log retained; no scoped build fix attempted.
- LSP: unavailable for Windows-only checkout; Unity test compilation/runtime is the source-bound diagnostic evidence.
- `diff.txt`: preserved untouched and untracked.
