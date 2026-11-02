# Draft geometry handoff

Working command from tools repository root:

```sh
node TOOL/avatar-gen/portrait/2d/paperdoll/workflow.mjs draft-preview \
  /absolute/art/config.json /absolute/art/living-draft.png living
```

This accepts `status="draft"`, no approval, and no generated master when
`lifecycle="schematic"`. It renders colored component masks, emits a draft receipt,
and never dispatches or imports. Set config canvas from the authored geometry;
the default 416x568 is the explicitly proposed 4x 104x142 plane, not artwork
approval. No 1160x1355 aspect constraint remains. Per-part fitting is forbidden.

## Art-worker JSON additions to existing geometry interface

Keep schema `paperdoll-geometry.v1`, exact `canvas`, coordinate system, `masterScale`,
parts/crops/pivots/transforms/anchors/masks/occupied bounds/occlusion fields.
Add hashed `referenceMeasurements={path,sha256}` pointing at canonical
bb-component-geometry.json. Its measured live-head 50x68 and body 82x58 values are
checked; project canvas must be an exact uniform 104:142 plane. The SVG remains
reference-only and is never uploaded as a generation image.

Use `status="draft"`, `lifecycle="schematic"`; omit `master` until registered
project-authored master art exists. `reference` is a hashed reference artifact.
Set `sourceMasterSha256` to the exact ownership-coordinate source fingerprint.
Each part adds `sourcePixels={path,sha256}` referencing JSON
`{masterSha256,indices:[integer source-pixel indices]}`. These are **source**
ownership indices, not destination alpha occupancy. Explicitly separate them.

Add `states=[{name,roles:[simultaneously visible role names],neckOwner}]`.
Exactly one visible part owns the neck seam in each state. Alternative states may
own the same source pixels and neck regions without conflict. Destination hair
masks may overlap; duplicate source ownership is rejected only among roles
visible together. A `headlessBody` alternative therefore does not invalidate
living body/head ownership. Art worker must author exact states and ownership;
the CLI invents neither. Preview command requires a state name.

Approval gate remains at preparation/dispatch/finalize for now. Draft preview
does not require master art that generation is meant to create. Once a real
registered master exists, its optional hash binds the preview to those pixels.

## Mask-aware backend finding; request coding awaits root fallback approval

The existing image-generate.mjs CLI and multipart builder have no mask input or
mask form field. Existing authentication resolver can be reused, but sending a
mask requires the narrow paperdoll wrapper fallback authorized by root before
request implementation. No provider/auth replacement is needed.

Current official API documentation was fetched on 2026-10-21:
https://developers.openai.com/api/reference/python/resources/images/methods/edit

Contract: POST images/edits multipart; one or more image files (up to16, each
under50MB for GPT Image), prompt, selected model, n, output_format and background;
optional **mask** is PNG under4MB with alpha, same dimensions as the **first**
image, transparent pixels indicating editable area. With multiple images it
applies only to the first. Thus the registered editable project master must be
first, source-identity reference separate, and the actual edit mask uploaded as
`mask`; a prompt mentioning a mask is not mask support. Component extraction masks
(occupied alpha) and API edit masks (transparent editable alpha) have opposite
semantics and must be distinct explicit bindings.

Requested output dimensions require multiples of16, aspect1:3..3:1 and current
model pixel/edge limits. A416x568 registered source is valid as an input geometry
plane but not a directly valid native requested size. The integration must bind
one explicit uniform native transform/padding contract, never independently
stretch each part to a convenient provider size. No such request is sent now.

26/26 current synthetic tests pass, including draft/no-master rendering,
state-alternative ownership and legitimate destination overlap. These are code
fixtures, not actual mask approval or real artwork completion.
