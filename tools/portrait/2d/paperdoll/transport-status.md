# Mask-aware transport and adapter status

Root authorized the narrow fallback implementation; no provider request dispatched.
`masked-edit.mjs REQUEST_JSON` now uses the existing resolver and sends multipart
images/edits with actual registered master first, immutable identity reference
second and actual API mask field. Request binds exact config/approved geometry,
stage edit mask/hash/alpha semantics, source/registry hash, prompt/template, output
and native canvas. It checks matching mask/master dimensions, alpha0 editable,
PNG mask under4MB, supported native size and no implicit resize.

832x1136 satisfies local documented edge/aspect/pixel validation. Actual provider
acceptance remains unverified. Registered master must already use that transport
canvas; source registration must be recorded separately, never stretched here.

Exclusive output.dispatch.json is written before POST and retained after every
failure. Native raw response is retained as output.response.json; decoded bytes
are retained as output.native.png before output validation. Wrong model, dimensions
or alpha rejects while preserving native evidence. Output receipt records response
and native hashes, validation failure and unreviewed state. A second dispatch for
that output refuses before POST, including after HTTP rejection or uncertainty.
Credential-bearing response bodies are rejected without persistence.

Local deterministic test captures real multipart bytes and confirms first master,
separate source reference, exact mask, model and832x1136. It returns synthetic400,
verifies raw response retention, no retry and wrong-source rejection; no actual
generation or machine auth is used.

`convert-art-draft.mjs ART_DRAFT MISSING_BINDINGS OUTPUT` maps the actual observed
art draft fields/mask hashes/XYXY occupied bounds into draft canonical geometry.
It preserves source draft hash and never manufactures approval. Art r1 remains
rejected; r2 has not arrived yet, so its exact differences must be inspected before
claiming r2 compatibility. True missing machine inputs are states, sourcePixels
ownership references/hashes, and explicit part anchors/pivots/transforms if r2
does not provide them. The adapter owns mapping; art worker need not duplicate
canonical fields already present in its source draft.

Target-ratio redesign is allowed only through explicit transformGroups and a
versioned proportionDesign at stage target-master-mask-design, with evidence,
neckSocketContinuity=review-required and targetAnchorBinding per part. Scale must
remain isotropic within each group; arbitrary postgeneration independent fitting
remains rejected. Draft is not approval. Root's actual r2 visual approval gates
dispatch; no provider call is made by tests or conversion.

Updated Unity envelope read and verified: whole file
dd7e3d68fc2939fdf8381f6099858932f8bdf0224101f7e78123594850463064,
payload c1c4ed65d963b26f779af633028c950c4e4347b2d9d4a2d7fdcc20561e70f3a7.
Confirmed interpretation: layer PNG IHDR is approved derivative canvas;
entry.sourceSize is original portrait IHDR. No compatibility fallback needed.
Finalize still awaits approved draft and explicit movement/normalization inputs.
