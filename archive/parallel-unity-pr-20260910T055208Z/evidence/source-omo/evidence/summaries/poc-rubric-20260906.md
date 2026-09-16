# Historical POC rubric: decision context only

Source: local `gameplay-rubric-6d3fe97/FINAL-VERDICT.md`, dated 2026-09-06.
Source SHA-256: `1d778f206c0fff08897c9eff2f78b1fa6df2008eaf35fcbbb93b373319406590`.
Reported build: `6d3fe971abf3ce6a11320d313694cf29c7ce37a3`.

This is a curated summary of an earlier run, not fresh verification. Raw
captures, process IDs, logs and machine-local cleanup state are intentionally
not synced. Their absence means this summary cannot certify a release.

| Area | Historical verdict | Reason recorded |
| --- | --- | --- |
| Loop completion | PASS | Keyboard-only negotiation, detour and combat loops returned to the hub. |
| Meaningful choices | PARTIAL | Branches differed, but costs/rewards/risks were not visible. |
| Tactical decisions | FAIL | One automatic combat command, no manual move/attack/target selection. |
| State continuity | PARTIAL | Resources/exact-once settlement worked; HP reset on next battle. |
| Goals and tension | FAIL | Mission purpose and failure cost were absent from the play surface. |
| World and characters | FAIL | Art-blocked labels obscured identity and the world. |
| Controls and UX | PARTIAL | Keyboard reachability, but missing rejected-route explanation and contrast/layout defects. |
| Stability/determinism | PASS, limited | One reported session and Core replay scope, not general release acceptance. |

Total: PASS 2 / PARTIAL 3 / FAIL 3. The source corrects an earlier assertion
count from 448 to 469; neither count was re-run during this documentation sync.
These findings motivate [the shared POC decisions](../../decisions/poc-design-context.md)
and [the historical design report](../../design/design-report.html). They do
not prove that any subsequent runtime work has fixed the defects.

Delivery and evidence interpretation defer to
[ADR-001](../../../docs/adr/ADR-001-repository-delivery-policy.md).
