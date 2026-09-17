# Phase D shipping dependency: catalog-only repair

Recorded: 2026-09-08
Source: upstream integration fact supplied by the lead; not independently fetched into the dirty D2 Windows worktree.

- PR: 71, merged.
- Observed `origin/main`: `7f4469bc564ed6cc4659fe640867039fb3d7dfae`.
- Feature commit: `1b3643d`.
- Scope: generator, test, and generated Markdown only.
- Catalog JSON identity: all 7,712 JSON bytes unchanged.
- Current D2 Windows baseline: `baaeb8a5b46404f0e866c795cf65c1f431673ca4`; it does not include this repair.

## Integration boundary

Do not merge, fetch, reset, or otherwise disturb the dirty D2 UI worktree during its RED/GREEN sequence. Do not reimplement the catalog repair in D2. The historical JSON-only `--check` result is not sufficient final proof of the catalog repair.

After the D2 increment is verified and committed at a clean boundary, refresh the remote before deciding phase-shipping integration. Preserve the catalog repair's generator/test/generated-Markdown scope and its unchanged JSON-byte identity when reconciling it.
