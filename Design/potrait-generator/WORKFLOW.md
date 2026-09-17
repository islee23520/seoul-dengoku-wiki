# Evidence-first portrait workflow

## Owner decisions

- The source directory and public route are `Design/potrait-generator/` and `/potrait-generator/`. No old route alias or separate Vercel project.
- Slot count is not a prerequisite. Gate 1–3 contracts determine the necessary slots.
- Eye stack: full sclera underlay, iris/pupil/highlight overlay, then eyelid/lash/brow lines. Iris containment inside white matters; overlap is intentional.
- Search existing same-sex body, face and part evidence before generating or repairing anything.
- Complete reconstruction alone does not establish clean part ownership or hidden surfaces.
- Failed attempts remain distinguishable from accepted evidence. A worker's PASS, API success, numeric check or copied file is never production approval.
- Raw evidence and SQLite must not be included in the public web bundle.

## Reuse cycle

1. `scan`: index source paths and current hashes; retain review history.
2. `ingest-raw`: store every distinct byte object under `raw/sha256/` without modifying originals.
3. `verify-raw`: verify actual source/storage bytes before relying on cache.
4. `seed-gates`: import narrow, pinned review facts without inventing missing gates.
5. `prepare-work`: create editable exact starting copies under `work/selected/`. Never overwrite changed working copies.
6. Verify one slot against its selected source. Store the input/source/receipt/output hashes and gate scope with the evaluation.
7. Advance only after the actual Gate 1, Gate 2 and Gate 3 evidence is present in order.

## Current acceptance boundaries

The original anime target and the female/male bald foundations are separate images and coordinate families. Source quality accepts an input, not a hidden-surface asset. The historical foundation splits may have exact Gate 1 reconstruction while their face plates still have feature-shaped transparent ownership holes. These holes must not be confused with complete Gate 2 skin support.

Previous eye recuts and full-image carriers were rejected by direct comparison/ablation. They must not be promoted merely because their all-layers composite reproduces an image.

The original evidence documents remain immutable. New working verification receipts belong under this workspace's `work/` packages and are recorded in SQLite with exact hashes.
