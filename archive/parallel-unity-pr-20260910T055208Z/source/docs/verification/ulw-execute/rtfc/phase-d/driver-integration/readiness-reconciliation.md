# Readiness reconciliation

The reports at `/Users/ilseoblee/workspace/seoul-kenshi/.omo/ulw-execute/phase-d-readiness/` were read after commit `7969659`. They are treated as source-bound inputs, not as a replacement for the production-consumer proof.

Acceptance applied here:

1. Actual `PocCoreLoopController` battle state/ledger must be attached and consumed by the scoped `BattleSessionDriver`; synthetic test `Attach` is insufficient.
2. During a pause-only interval, Core tick/hash/card cooldown, driver step count, and battle ledger remain unchanged.
3. A valid card accepted while paused may legitimately mutate battle state/hash and append its command ledger event while leaving the tick unchanged.
4. Continued paused frames after that acceptance preserve the resulting state/hash/cooldown/ledger until resume.
5. Historical dirty-lane AP/end-turn and D2/D3 UI/asset/capture requirements are outside this bounded production-driver integration.

Raw current proof: `readiness-final-playmode.xml`, `.log.txt`, `.exit` (1 total, 1 passed, 0 failed, 0 skipped, process exit 0).
