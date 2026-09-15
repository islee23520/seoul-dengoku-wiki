> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Independent visual review

Reviewer st_01a072c8 directly opened all 34 canonical PNGs; read-only, no execution.

PASS: 17 pairs at 1280x720 and 1920x1080 cover S01-S13 and B01-B04. All show actual game UI. Korean glyphs readable, no visible missing Hangul/tofu, control-label truncation or text overlap. Route highlights and returned home/departure controls are visible. No accessibility contrast certification or pixel-target comparison claimed.

FAIL / findings:
- Title and gameplay runtime slots explicitly show art-blocked placeholders. Battle units are colored labeled cells, not character artwork. Intentional disclosed placeholders, not evidence of corrupt capture or loading bug.
- 19-sindorim-720.png: yellow marker cut at preview top edge near x304-370,y333. 68-sindorim-1080.png repeats near x455-554,y503. Guro captures show no yellow marker; this alone does not establish a state bug.
- Battle HUD values readable but no active-unit name or explicit turn indicator. Canonical images alone do not prove active-unit switching or arithmetic mismatch.
- Combat pending settlement lacks visible victory/defeat. Negotiation/bypass identify branch only. Applied panels expose opaque result IDs without meaningful reward/cost detail. This does not prove settlement calculations failed.

Coverage is live-resized runs, not independent full replays per branch/resolution. Screenshots establish presentation, not click handling or hidden state correctness. Sparse layout alone is not a defect; no reference artwork was provided.
