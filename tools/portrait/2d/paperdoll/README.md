# Source-bound portrait paper-doll workflow

## Active contract

The active pipeline requires Unity contract v4 and exactly seven ordered roles:
`hairBack`, `body`, `head`, `clothing`, `hairFront`, `deadHead`, `headlessBody`.
Helmet equipment, hair variants and their provenance fields are removed. Existing
`*-ready.*`, approved batches, requests and receipts remain historical v3 artifacts,
not active v4 handoff inputs; they are neither rewritten nor accepted by compatibility
logic. New source-bound seven-role art, geometry and approvals are required.

## Historical integration status (superseded by active contract above)

This workflow is incomplete for actual final art. `workflow.mjs dispatch REQUEST`
calls the existing `masked-edit.mjs` transport directly with its reviewed
`paperdoll-masked-edit.v1` request contract. `dispatch REQUEST --check` validates
without authentication or POST. A legacy `paperdoll-prepared.v1` plan is not a
dispatch request. All source/mask/review, exclusive claim and no-retry guards remain
in the transport. No caller can dispatch a four-layer finalization batch.

Use `workflow.mjs draft-preview CONFIG PNG STATE` for unapproved schematic mask
review without generated master art. Read `draft-geometry-interface.md` for its
state/source-ownership fields, `math-audit-pending.md` for the current dispatch
gate, and `unity-contract-mismatch.md` for pending finalize integration. B0.44/.24
was withdrawn; `transport-status.md` describes historical transport implementation,
not current B approval. `inspect-registration.mjs` maps actual r2 source-contour
registration without fabricating absent roles or states. Finalize still uses the
old synthetic scaffold contract and is NOT ready for actual Unity handoff.

The canvas default is the416x568 working proposal, not1160x1355. Region mapping
may differ isotropically only with explicit measured constraint-solve provenance;
no aesthetic scale choice, anisotropic stretch or postgeneration fit is allowed.
Destination alpha overlap is permitted where state/source ownership allows it.
Current observed test evidence:27 unaffected tests passed; the one assertion
updated for the earlier mathematical source-binding rejection passed its focused
rerun. No actual image generation or runtime art approval is claimed.

Node 26; no new dependencies or authentication. Registered masked edits use the
paperdoll transport and existing connection resolver; unregistered anatomy-source
creation uses existing `../image-generate.mjs`. No mask is silently dropped.

```sh
P=TOOL/avatar-gen/portrait/2d/paperdoll
node "$P/workflow.mjs" preview /absolute/private/measured-config.json /absolute/private/mask-preview.png
node "$P/workflow.mjs" prepare "$P/person-1003.example.json" /absolute/private/person-1003.prepared.json /absolute/private/measured-config.json
node "$P/workflow.mjs" dispatch /absolute/private/reviewed-masked-edit.request.json --check
# Authorized execution only; consumes the exclusive one-attempt output claim:
node "$P/workflow.mjs" dispatch /absolute/private/reviewed-masked-edit.request.json
node "$P/workflow.mjs" finalize /absolute/private/batch.json /absolute/private/unity-receipt.json
node --test "$P/workflow.test.mjs"
```

Default config deliberately has `geometry=null`, `anchors=null` and
`unityContract=null`. Preparation and preview fail until measured geometry is
provided; finalize also requires the actual seven-role v4 Unity envelope. Dispatch
requires a reviewed masked-edit request rather than default config approval.
The person-1003 example is an immutable **input**, not approved sample artwork.
Current 1003 r1/r2 assembly is rejected input. No approved sample is provided.

## Geometry interface required from measurement owner

Set `config.geometry={path,sha256}` to an absolute JSON file with:

- `schema="paperdoll-geometry.v1"`, `status="approved"`, `canvas={width:1160,height:1355}`,
  `coordinateSystem="pixels-top-left-x-right-y-down"`, nonempty
  `measurementEvidence`, hashed `{path,sha256}` `reference` and `master`.
- `approval={verdict:"pass",reviewer,evidence:{path,sha256}}`, issued from actual
  geometry review, not file existence. Master is one registered RGBA canvas.
- Positive `masterScale`, exactly one `neckOwner`, and ordered `occlusionOrder`.
- Seven `parts` in config role order. Every part has `role`, `cropRect=[x,y,w,h]`,
  `logicalSize=[w,h]`, `pivot=[x,y]`, `sourceAnchor=[x,y]`, `targetAnchor=[x,y]`,
  `occupiedBounds=[x,y,w,h]`, `mask={path,sha256}`, `neckSeamOwnership` equal to
  `owns` or `not-owned`, `occludes` listing earlier roles, `transform=[a,b,c,d,tx,ty]`
  and nonempty `transformProvenance`. Coordinates are explicit pixels.

Affine convention: target x=a*x+c*y+tx, target y=b*x+d*y+ty. All parts must use
the same `a=d=masterScale`, `b=c=0`: anisotropic and independently inferred scale
are rejected structurally. Neck ownership must be singular. Each component mask
is decoded RGBA, full registered canvas, with actual alpha occupied bounds equal
to metadata and inside its crop. Hair front/back masks cannot duplicate occupied
hairstyle pixels. No mask rescaling or automatic independent fitting occurs.
Measured reference thresholds remain pending; none are invented here.

`preview` validates approved geometry and assembles role masks over the registered
master before any provider call. It writes a PNG and source/hash/bounds receipt;
visually compare it with the measured reference. A preview does not issue review
approval. Canvas equality alone never proves registration. The final 1160x1355
canvas is transport only. The source 1004 is 1161x1354 and remains unchanged.

## Reusable stages and preparation

`templates.json` separates common source identity/style/framing rules from
`living`, `body-base`, `deadHead` and `headlessBody` stage instructions. All stages
refer to one registered master, geometry and masks; none ask for independent
part scales or a six-cell layout. Bare torso is nonsexual adult upper torso with
no unwanted clothing; closed-eye/dead and clean headless states are non-graphic
fictional game states, with no wounds or gore.

The active exact subjects are 조재표 person-1003/K1003, 이연 person-1004/K1004,
신종목 person-1009/K1009. K1004 is owner-authored/synthetic; no real-person grant
is invented. The other two have recorded project name/likeness grants. The
canonical source-discovery report records actual source dimensions and hashes.
No 1007/1008 outputs are requested.

`prepare` uses exclusive creation and deterministic canonical binding hashes.
It validates actual source and registry hashes, identity/name/path joins, template
version/hash, output, stage, parameters and geometry. The prepared backend argv
is recorded for later mask-aware integration, **not currently executable approval**.
`requestCanvases` is separate from final transport canvas because the existing
editor requires native multiple-of-16 dimensions. No transformation is performed
by preparation, no originals are overwritten, no secrets are read or persisted.

## Finalization, processing and review

`batch.schema.json` describes `paperdoll-batch.v1`: hashed config and exactly three
distinct entries. Each entry has personId/characterId/name, hashed source and
registry, seven ordered layers, composite, review.
Each layer contains `role`, absolute `path`, actual `sha256`, hashed `prepared`
request and `native`, plus `processing={transforms:[exact descriptions],masks:[hashed
component masks],geometrySha256,partTransform:[a,b,c,d,tx,ty]}`. Transform and mask
must match its measured part. Native bytes and existing `.native/preservation.json`
bind original request prompt/size/reference source hashes; original response and
validation failures stay untouched. No uncertain POST is retried.

Final PNGs are decoded/CRC-checked, same dimensions, RGBA8 with transparent and
opaque pixels. Changed bytes need a nonempty transform record. The workflow does
not segment, crop, rescale or repair art. Full canvas does not replace occupied
bounds, anchor placement or actual composite inspection.

Before review, `composite` requires `status="checked"`, geometrySha256, nonempty
reviewer, hashed image and evidence, and `layersSha256=SHA256(canonical(layers))`.
Actual visual composite checking must cover identity, bare unclothed torso,
equipment seams, no duplicated hair/neck, anchors and absence of gore.

The external `review={path,sha256}` file requires schema `paperdoll-review.v1`,
verdict pass, nonempty reviewer/evidence, personId/characterId/sourceSha256, and
`bindingSha256=reviewBinding(entry)` exported from workflow.mjs. This binds the
entire entry except its review reference, including composite and processing.
The CLI never manufactures reviews. Missing/stale/wrong-source review rejects.

Set `unityContract` to the Unity worker's hashed contract with schema
`paperdoll-unity-contract.v1`, slot `portrait-paperdoll-poc`, and roles/subjects/canvas
exactly matching config. Initial canonical implementation report still has six
roles/old identities, so default finalize deliberately refuses import handoff.
Once valid, finalize writes a non-overwriting importer receipt containing slot,
reviewVerdict, three entries with source/review hashes, normalization and 21
ordered `{role,sha256,sourcePath}` PNGs. Unity worker owns actual batchmode import
using JANSEON_PAPERDOLL_RECEIPT and its importer entry point; no runtime promotion
or Unity success is claimed by this tool.

## Tests and cleanup

`node --check workflow.mjs` plus `node --test workflow.test.mjs` exercise real local
CLI prepare/finalize and invalid cases using synthetic PNGs, geometry and reviews.
Temporary directories are registered by `mkdtemp` under the OS temp directory
with prefix `paperdoll-synthetic-not-runtime-art-`; cleanup hooks remove them.
Synthetic reviews are explicitly not actual art approval. Tests never dispatch
or access machine credentials. Task evidence belongs only in the canonical
game `.omo/evidence/portrait-paperdoll-poc-20261021`; private art stays art-owned.
