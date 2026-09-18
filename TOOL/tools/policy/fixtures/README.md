# Delivery-policy plan fixtures

The two files in this directory are byte-for-byte copies of
`.omo/plans/seoul-grand-strategy-srpg.md` recovered from actual git history.
They let `Tool/policy/test-check-repo-delivery-policy.mjs` exercise the
checker's supersession checks against the real historical plan text instead of
invented content.

| File | Source | Commit | State |
|---|---|---|---|
| `seoul-grand-strategy-srpg-pre-amendment.md` | `git show 1893a04501e7994fdd3e0578764bd00391dfcfe3:.omo/plans/seoul-grand-strategy-srpg.md` | `1893a04` (2026-09-03, initial commit) | all 12 local-only clauses present, no `## Amendment` section |
| `seoul-grand-strategy-srpg-amended.md` | `git show 601a993c75491d9f470464b3699027cfa7eb4e7b:.omo/plans/seoul-grand-strategy-srpg.md` | `601a993` (2026-09-03, delivery policy) | original clauses preserved plus the supersession amendment referencing ADR-001 |

The live plan was dropped from tracking in `eeded7201e012adcf6a4c03e40c9ab9243fca416`
and `.gitignore` excludes `.omo/`, so fresh checkouts never contain the file.
