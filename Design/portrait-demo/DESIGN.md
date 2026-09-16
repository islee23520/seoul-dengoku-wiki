# Portrait Studio integration design

## Outcome

The existing portrait studio remains a dark operational authoring surface, but now exposes one explicit production path: source generation, split/reconstruction, part/hidden-surface review, combination review, then export. Civitai/ComfyUI, PNGAL see-through, Anime2.5DRig and StandRig are shown as tools inside that path, never as alternate ways to bypass it.

## Permanent gateway contract

1. Gateway 1 — split and source reconstruction.
2. Gateway 2 — individual parts, hidden support, sex/ownership and material quality.
3. Gateway 3 — combinations, exchange, anchors, occlusion and real browser surface.

Capabilities unlock cumulatively. Gateway 1 PASS unlocks part inspection and rig-preview tools. Gateway 2 PASS unlocks combination controls. Gateway 3 PASS unlocks save, selection export, PNG export, character binding and runtime handoff. Missing, malformed, failed, in-progress and not-verified records all fail closed.

## Existing visual system

- Preserve `portrait.css` tokens: charcoal void/panel surfaces, quiet steel dividers, pale-lime operational accent, Korean-first sans typography.
- Keep the two-column desktop workspace and single-column mobile flow.
- Reuse panel headings, chips, buttons, notices and source-size canvas treatment. New gateway and tool cards use the same one-pixel border, small radius and restrained elevation.
- No decorative animation. Status changes may use a 140ms opacity/transform transition; `prefers-reduced-motion` removes it.

## New primitives

- `pipeline-panel`: one scroll-independent section above the portrait workspace.
- `source-profile`: preservation 0.55 and variation 0.75 reference cards; selection changes metadata, not library assets.
- `gateway-rail`: three ordered cards with `PASS`, `FAIL`, `IN_PROGRESS`, `NOT_VERIFIED` or `BLOCKED` chips and evidence counts.
- `tool-lane`: source generator, splitter, quick auto-rig preview, precision rig authoring, combination/export lane. Locked tools explain the prerequisite gate.
- `workflow-packet`: JSON export of the selected source, gate states, tools, current 22-slot selection and calculated capabilities. It is an authoring handoff, not a product portrait export.

## Accessibility and responsive rules

- Gate status is written text plus color; color is never the only signal.
- Ordered gate headings include the numeric stage.
- Source controls and packet export are real buttons/selects with visible focus rings.
- At 375px, cards stack in source → gates → tools order without horizontal scrolling. Main portrait export actions remain visible but disabled with an explanatory reason until Gateway 3 passes.

## Accepted debt

- External tools remain local services or separate browser apps; this static studio exports/reads workflow state but does not proxy their APIs.
- Current stage23 preview manifest is not gateway-complete, so production exports intentionally remain locked.
