# Measured geometry integration handoff

Status: scaffold only; reusable workflow is NOT complete. Await the actual BB
measurement report before changing geometry validation or backend execution.
The existing 25 passing tests validate the scaffold as written, not these pending
contract corrections or real sample completion. No generation is authorized now.

## Decisions to wire after measurement arrives

1. Provide an explicit **draft mask preview** command. It accepts structurally
   valid measured geometry without an approval verdict, renders registered masks
   and comparison evidence for actual review, and labels the output draft. Draft
   preview cannot authorize provider dispatch, finalize or Unity import. Require
   approved, exact geometry/template/mask bindings at dispatch and finalize only.
   This avoids requiring approval before the reviewer can see a preview.
2. Define simultaneous visibility per active state. Living and closed-eye/dead
   head/body combinations and the headlessBody alternative must have separate
   neck seam ownership constraints. Exactly one neck owner is required within a
   visible state, not globally across all alternative-state component assets.
   Collision constraints apply only to simultaneously visible roles.
3. Distinguish destination spatial overlap from duplicate source-pixel ownership.
   HairBack and hairFront may have overlapping occupied rectangles or alpha in
   destination space. Reject duplicated source ownership only when the measured
   source/master ownership map proves the same source pixels were assigned twice
   contrary to that state's contract. Alpha bounding-box overlap alone is not
   such proof. Do not guess thresholds or forbid legitimate occlusion.
4. Preserve the one-master scale, explicit crop/logical rectangle, pivot, source
   anchor, per-part transform provenance, occupied bounds and occlusion dependency
   requirements, adapting their exact representation to the measured report.
   No independent component fit or anisotropic rescaling may be inferred.
5. Replace the temporary dispatch rejection with the supported mask-aware
   reference-edit execution once the actual registered-master/mask input contract
   is known. Preserve the existing file-saving backend, native responses and
   rejection evidence, source/request hashes, exclusive dispatch claim and no
   automatic retry after uncertain POST. Do not add a provider or registry.

## Pending input from root

The measurement files are now present and read. They establish reference-only
atlas geometry and a **proposed**, not approved, common-plane assembly. The report
explicitly leaves runtime anchors/draw order unobserved and the exact anatomy
seam subject to art review. Its suggested 4x plane and compact crop must not be
silently promoted to approved thresholds or copied BB artwork. The reported
659-pixel head/body alpha overlap reinforces that destination alpha overlap alone
is not a duplicate-ownership test. The dead head has different logical geometry
and a retained UV/frame discrepancy; do not force it into the living mask.

Await root's relay identifying which proposed geometry is authorized for the
project-authored draft, together with registered source master/masks and the
state/ownership mapping. The reference report alone supplies neither those
project component masks nor a mask-aware backend input binding.

Relay the completed canonical `bb-component-geometry.json` and `.md`, referenced
BB sample sheet, measured state/neck/occlusion and pixel-ownership semantics,
registered master/masks and their exact hashes, and the supported backend input
mapping. The current CLI's approved-only preview, global neck owner and hair
alpha-intersection rejection are scaffold limitations, not accepted final rules.

Completion remains a working reusable mask-aware workflow and actual reviewed
three-sample delivery under root's generation authorization. Draft preview and
synthetic fixture receipts are not real artwork or completion evidence. Root/art
worker owns generation timing; this worker sends no generation request now.
