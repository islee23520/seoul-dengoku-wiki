# Unified 2D portrait and full-body tool contract

## Image workstation domain v2

`validateWorkstationRequest`, `validateWorkstationOutput`, `generateWorkstationSet`
and `emitWorkstationPrompt` are explicit implementation exports, not new CLI,
MCP, portal or production transport routes. The v1 nine-shot catalog, parser,
generator, manifest and receipts retain their existing semantics and bytes.
Never rename a historical `upper` or `head` receipt to a v2 torso or detached head.

V2 categories are `portrait`, `fullbody-turntable`, `torso`, `detached-head`,
`head-without-hair-eyes-teeth`, `hair`, and `underwear-only-torso`. A turntable
requires all four frames in front/profile/side/back order: profile is exactly
90 degrees; side remains oblique. Other categories have one frame, front for
parts and viewer-right for portrait. They do not imply multiple hair views.
The excluded head has the explicit ordered exclusions hair/eyes/teeth and a
different variant from the complete head. These are rendered image exclusions,
not anatomical separation, mesh, rig, UV or geometry contracts.

Every frame explicitly supplies its PNG width/height, background/alpha policy,
pixel-space common canvas ID, anchor and half-open crop bounds. There is no
implicit canvas override: an eventual reference adapter should request its
existing 1024x1536 canvas; portrait callers must carry their actual package-bound
canvas, not infer it from a fixture. All four turntable frames share the exact
canvas/alignment/background. Portrait, head and hair require transparent RGBA.
Decoded PNG dimensions, alpha, visible bounds and crop containment are checked.
Anchor placement, category quality and rendered exclusions still require human
semantic review; pixel validation never grants that verdict.

The strict path-free request binds UUIDs, person, sealed identity, technique-only
style, explicit face selection, authored source/look IDs and SHA-256, plus the
SHA-256 of every parsed output spec (UTF-8 JSON.stringify in schema field order).
The trusted caller resolves character/style/identity paths and supplies exact
authored-look bytes. The owner-authored category design must match person,
character, look ID and category. Underwear must be explicitly described in this
authored source; an absent live source blocks only that live use. Controlled
authored fixtures are not evidence of an owner's live underwear design.

Before the explicit transport callback, write-once request, authored-look bytes,
plan and child request records persist parent/child UUIDs and source/spec hashes.
Successful decoded PNGs and receipts are write-once; set.json is only a mutable
progress summary. Existing output directories reject, uncertainty stops all later
frames, and no ambient provider or retry is available. Receipts remain candidate,
semantic-review UNVERIFIED, approval NONE and manifest HOLD/paidProof NOT_RUN.
Controlled PNG fixtures prove contract integrity, not generated category quality.

Production image creation and correction use only `../bin/seoul-character.mjs` and its native MCP counterpart in `mcp.mjs`. This directory owns implementation modules; they are not alternative production entry points. Required review overlays and every rule/sample are bound by `portrait-package.json` and verified against the package asset bytes and SHA-256. Use the package manifest rather than copying assets into prompts or substituting unbound local files.

The mandatory order is: (1) task 4 sourced JSON identity and independent slots; (2) task 5 native package/options inspection, preview and generation using the exact preview binding; (3) task 6 `modify_portrait` with exact source SHA, activated slots, operation and package/input binding; (4) `inspect_portrait` and the package-bound review overlay for every review. Missing or mismatched package assets stop before provider use. Generated or modified candidates, including failures, are not owner verdicts.

## Machine command inventory

The CLI inventory is the `commands` array returned by both `node TOOL/avatar-gen/portrait/bin/seoul-character.mjs capabilities` and `portrait_capabilities`. Current actual inventory: `package`, `options`, `inspect`, `portrait_package`, `portrait_options`, `preview_portrait`, `generate_portrait`, `modify_portrait`, `inspect_portrait`, `capabilities`, `portrait_capabilities`. MCP clients discover native tools with protocol `tools/list`; the current actual inventory is `capabilities`, `list_face_variants`, `list_characters`, `list_options`, `list_parts`, `preview_base_sheet`, `portrait_package`, `portrait_options`, `portrait_capabilities`, `preview_portrait`, `generate_portrait`, `modify_portrait`, `preview_text_only_portrait`, `generate_text_only_portrait`, `inspect_portrait`, `preview_prompt`, `generate_image`. Use `portrait_capabilities` to distinguish the six production portrait tools from legacy/diagnostic MCP operations. Refresh these machine values from actual CLI/MCP output when capabilities change; prose command examples are not the inventory.

Original canonical and birth context and the original emitted prompt remain in private `sourceSnapshot` receipts. The transport removes the serialized source-context line and its metadata introduction before any translation or image HTTP request. It never silently substitutes source names inside authored visual fields: unresolved source-name or metadata collisions reject before HTTP. Authored visual values, reference roles and camera/posture contracts otherwise remain unchanged. `visualSnapshot` separately binds the source visual instruction, actually transmitted instruction, both hashes and whether translation occurred. New resume bindings include source and transmitted prompt hashes; historical bound receipts without these fields remain readable and are not rewritten. Unknown values and canonical validation remain unchanged.

## Select a face explicitly

The existing `east-asian` pool includes Korean recipients. Keep its three male and three female seed IDs distinct and select the recipient's authored gender explicitly; do not create a separate Korean category by relabeling existing assets. For appearance-unconfirmed template recipients, gender-specific seed catalogs bind the original face PNG and SHA-256. Confirmed faces, explicit UNIQUE identities and owner-approved portrait hashes are not automatically reassigned. A face seed supplies geometry only: recipient eye/lip colors, beard, hair, skin, body, outfit and accessories remain independent authored values. This input binding does not approve the seed's artwork or claim that recipient portraits have already been generated.

Foreign template groups require `canonicalRoot` and a reviewed `lore/name-pools/face-seed-eligibility.json` record. The eligibility file has `schemaVersion: 1` and `people` rows containing exact `characterId`, `name`, requested `ancestry`, `ancestorId`, and `source: {path, pointer, sha256, quote}`. This is an eligibility contract, not a claim that the current wiki already publishes this new file. A row must be authored from explicit foreign or mixed family-background facts in the trusted wiki source; names, photographs, skin colors and catalog group labels do not establish ancestry. The source pointer must resolve to the exact quoted string at the recorded file hash. The ancestor must be the recipient or reachable through biological parent edges in the trusted person-detail family tree. A Korean-born recipient can use a foreign group when that recorded biological lineage supports it; spouse, adoption and retainer edges alone do not. Missing, conflicting or stale support rejects before reference loading or provider execution. The Korean-inclusive `east-asian` group and individual UNIQUE faces preserve their existing selection contracts; neither changes the person's nationality, canonical origin or independent skin slot.

New sheets use faceMode: {kind: "unique", variantId: null} or faceMode: {kind: "template", variantId: "east-asian-male-01"}. Add --new-sheet to unified export to require the choice. Legacy export retains null for an absent mode; generation and GUI/MCP require explicit selection. CLI flags --face-mode, --face-variant-id, --face-selection selection.json and --face-catalog catalog.json serialize this contract. PORTRAIT_FACE_CATALOG supplies the local catalog for GUI/MCP.

The permanent IDs K1009, K1010, K998, K1003, K1007, K1008, K1018, K1017, K1019 and K1004 reject template selection regardless of name. Explicit rulers require uniqueFaceRequired: true plus uniqueFaceSource: {characterId, source}. Never infer rulers from rank. Unique requires individual sourced face traits and never loads a variant.

Template selection matches authored gender and an explicitly selected catalog group in faceSelection.ancestry. faceSelection.source records the authored recipient-to-group selection; canonical identity.ethnicity remains unchanged and need not equal the group key. Groups can overlap. Independently sourced faceSelection.skinTone must equal slots.body.skin. Never infer group, tone, personality or role from name or photograph. Variant images supply FACE BASE ONLY, never donor hair, body, outfit, gender or skin tone. Authored recipient eye color, lip color and beard remain independent of reusable face geometry. Style is technique only; camera and pose remain shared. Null reference path/hash means traits only, not generated artwork. Schemas: 2d/face-selection.schema.json and 2d/face-variants.schema.json.

The canonical engine is this directory. Portrait and full-body modes use the same sourced identity and neutral face, hair, body, outfit and accessories slots. Explicit field overrides do not alter other slots. Unknown values remain null; weight and height require numeric values with units. bustSize may contain an authored visual description. Ethnicity and origin are independently sourced identity fields; they are never inferred from reference images.

The owner-selected male/female reference image is the sole style authority. Supply its actual SHA-256 with --reference-sha256 or configure referenceSha256 in a separate local style lock for the selected image. A minimal lock contains schemaVersion: 1, styleId, status: owner-selected-reference and referenceSha256. Unconfigured or mismatched hashes fail before generation. The reference is drawing technique only; explicit slots and fixed camera/pose override reference direction and appearance.

Portraits face viewer-right at eye level with the full head, shoulders and upper chest visible, no tilt or gestures. Full-body modes retain their distinct camera framing.

Every portrait output is an RGBA PNG with alpha-zero background, never a painted backdrop or baked checkerboard. Keep the crown margin transparent. Verify the actual alpha channel and inspect hair, garment and accessory edges after background removal; alpha presence alone does not prove a clean silhouette. Preserve historical accepted PNG bytes and their image-specific verdicts. Regenerated or transparency-derived PNGs have new hashes and separate pending reviews.

Legacy reference-assisted emitters are diagnostic/compatibility implementation paths, not production generation routes. Do not use them to create or correct production portraits; use the unified tool workflow above. `--replace-slots` and implementation-module exports do not supersede the JSON preview binding or native modification contract.

2D configuration and contracts remain here, separate from the Blender CLI at ../bin/portrait-gen.ts, model/rig tools at ../tools/character-tool and 3D catalog under ../assets/3d. Store 2D outputs in a dedicated .omo/evidence/<task>/2d directory; store 3D render outputs separately under .omo/evidence/<task>/3d. Neither process reads or overwrites the other's output. Successful generation remains a candidate, not an owner verdict.
