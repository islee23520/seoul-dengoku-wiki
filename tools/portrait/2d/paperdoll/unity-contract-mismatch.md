# Actual Unity contract integration mismatch report

Read canonical unity-layer-contract.json in full. No finalize/schema change made
yet: root requires approved measured mask draft first, and normalization/movement
values must be explicitly authored rather than guessed.

The actual file is an envelope `{integrity,contract}`. Validate the whole file
against its configured SHA-256, then validate payload hash as SHA-256 of
`JSON.stringify(envelope.contract,null,2) + "\n"` in stored insertion order. The
declared scope is exactly `UTF-8 JSON.stringify(contract,null,2) plus LF; insertion
order as stored`. Current payload hash is
`7d64ad7f1749c1d08a718761196300afa910073d4a2e46d85dbd94822f9f31a0`.
Do not canonical-sort this payload and do not accept the previous invented
paperdoll-unity-contract.v1 standalone shape as an alternative.

Actual matching fields are contractVersion=1, receiptType,
orderedRoles, subjects (including sourceSha256/sourceSize), receiptSchema and
canvasPolicy. Config subject objects intentionally omit sourceSize/hash and
cannot be compared to full contract subjects by JSON equality. Join exact three
IDs/name/source hashes and actual decoded source sizes instead.

Each output receipt entry must additionally copy explicitly authored sourceSize,
normalizationScale and normalizationOffset from batch inputs after validation.
Root supplies one positive uniform normalization scale and finite offset per
source; actual IHDR establishes sourceSize, including1004's1161x1354. Preserve
those values in the reviewed binding, never synthesize identity transforms.

Root-level movementStage requires explicit start/end/sampleOffset/cameraPosition
Vector3, positive portraitSize Vector2, positive speed and orthographicSize. Start
and end must differ. Root will author POC values; these are not game balance.
Batch schema must gain movementStage and review binding must cover it, so a
movement edit cannot reuse a stale reviewed batch. No default movement values.

Canvas policy is shared actual PNG dimensions, proposed416x568 and no fixed
1160x1355 field. Geometry adds the exact uniform104:142 plane constraint for this
POC. Actual Unity implementation lacks per-component runtime rect/pivot/viewcrop;
the exporter must register components on full canvases itself and metadata retains
their measured crop/pivot/occupied bounds. No speculative runtime fields emitted.

Narrow ambiguity for root: importChecks includes "Imported dimensions must equal
approved source PNG dimensions; all canvases equal" while canvasPolicy explicitly
permits416x568 derivatives of originals1160x1355/1161x1354. Interpret that sentence
only after Unity worker confirms it means each approved derivative PNG's IHDR,
not immutable original portrait dimensions. Do not add a compatibility fallback.

The documented15-test Unity pass precedes importer edit; neither this report nor
the pipeline synthetic tests prove actual Unity runtime or player build success.
