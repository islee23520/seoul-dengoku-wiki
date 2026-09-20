# Ultrawork Notepad - Male and female Tripo base assembly
Started: 2026-09-19T17:58:00+09:00

## Plan (exhaustively detailed)
1. Copy every supplied image/model/archive, plus directly related head/body variants, into this independent project's sources directory. Preserve filenames, produce hashes, and extract archives into separate directories.
2. Preserve the existing unsaved Blender scene as work/pre-existing-scene.blend. Do not delete or modify its objects.
3. Phase discovery DAG: source-copy (quick) -> geometry-audit (deep) and reference-audit (deep), then receipt verification (quick). Geometry audit imports copies in a separate background Blender process, renders views, measures connected components, open boundaries, axes, UVs and materials. Reference audit maps original concept/split images and baked/unbaked variants without modifying the live Blender scene.
4. Lead examines all discovery evidence and establishes male/female input mapping, actual forward axes, neck cut locations, oral extraction strategy and source material variants. Any unresolved topology decision is resolved from geometry, not a guessed filename.
5. Phase assembly DAG: disjoint male and female background-Blender lanes (deep), each producing its own .blend, before/after stats, and multi-angle renders. A separate toon-material lane (deep) owns only materials assets. Workers perform one observed change at a time. Single live Blender scene is owned only by the lead.
6. For each gender: keep source copy; normalize Z-up and common forward direction; remove overlapping head/body remnants; fix unintended holes/unwelded seams without closing intentional mouth/eye sockets; join and weld the neck; set male 1.75 m and female 1.65 m defaults while preserving source proportions; apply transforms.
7. Separate identifiable mouth interior, teeth and tongue components from the face. Record what exists rather than inventing missing dental geometry. Preserve empty recessed eye sockets.
8. Preserve original texture UVs where needed and add a clean nondegenerate atlas UV with declared seams/padding. Retain baked and unbaked source material choices, no lost texture dependencies.
9. Integrate the bases into the live Blender project using dedicated collections. Build source-inspired cel shading with controllable bands, restrained outlines and coherent face/body skin; inspect lighting from several angles. Original game titles are quality references, not a claim that production quality is achieved.
10. Validate height, transforms, neck continuity, unintended boundaries, oral object separation, UVs and packed assets; inspect front, back, side, three-quarter and mouth/neck detail renders.
11. Open the saved delivery .blend in real Blender without disturbing the preserved original scene, capture window evidence and save portable .blend plus neutral GLB/FBX exports if compatible. Explain Blender-only shader portability honestly.
12. Record self-review, artifacts, cleanup receipts and remaining defects. Stop when user-visible male/female bases and every required check are complete.

## Success criteria + QA scenarios
Tier: HEAVY. Direct 3D mesh assembly, spatial judgment and custom character materials require multimodal verification; no ulw-plan file exists, so self-review rather than plan-reviewer gate.

C1 - preservation and input coverage. Run source manifest verification against the explicitly listed 19 inputs and discovered direct model variants. PASS iff every input has an identical SHA-256 project copy, every ZIP is inventoried/extracted safely, and no writes occur inside /Users/danny/workspace/seoul-kenshi. Evidence: reports/source-manifest.json and reports/source-verification.json. Baseline before copying records absent project copies (RED), final identical hashes GREEN.

C2 - two assembled bodies. Background command `/Applications/Blender.app/Contents/MacOS/Blender --background <gender.blend> --python scripts/verify-assembly.py` will inspect concrete named Male_Base and Female_Base meshes after names are established. PASS iff final adult height within 1 mm of 1.75/1.65 m respectively, object rotation zero/scale one, head and body are one connected skin component across the neck, no accidental neck boundaries, and front/side/back/three-quarter renders show no floating head, neck gap or intersections. Evidence: baseline geometry reports/renders (RED unassembled parts), final assembly JSON and renders (GREEN). Native .blend reopen is mandatory.

C3 - oral geometry and UVs. Same validator inspects Oral collections and UV loops. PASS iff source-existing mouth parts are not fused to external skin, sockets remain intentionally empty, original usable texture UVs are preserved, and an additional usable UV atlas has finite coordinates and nonzero UV triangle areas. Expected intentional opening boundaries are explicitly labeled rather than globally capped. Evidence: before/after component stats, mouth close-ups, UV checker renders and UV report.

C4 - presentation and regression. Blender MCP renders front, side, back and three-quarter cameras using `bpy.ops.render.render(write_still=True)` with outputs under evidence/final, then `mcp_blender_get_screenshot_of_window_as_image({})` captures the real Blender app. PASS iff both bases retain reference proportions, coherent skin colors, readable cel bands and clean silhouette, no missing textures/black patches or visible join defects; source preservation hashes still match. Evidence: reference report, original material baseline, final renders, real Blender window screenshot and reopen/asset dependency report. No claim of Genshin/Honkai/Guilty Gear production equivalence without evidence.

WHEN TO STOP: I'll stop right away when both gender bases are saved, reopened and visibly verified from multiple angles, all requested geometry/UV/oral/material criteria pass with recorded evidence, sources and old scene remain preserved, and spawned QA processes are cleaned up.

## Now
Bootstrap complete enough to launch the source discovery DAG. Existing goal remains active; these scenarios refine it without replacing it.

## Todo
- Copy/inventory all inputs and archive entries.
- Preserve live Blender scene.
- Complete geometry/reference discovery and verify receipts.
- Assemble male and female bases; oral parts; UVs.
- Integrate toon materials and real Blender presentation.
- Verify portable saved delivery and cleanup.

## Findings
- User explicitly forbids working in seoul-kenshi and requests copying into a suitable separate project.
- Project root: /Users/danny/Documents/Character-Assembly-POC/2026-09-19.
- Live Blender MCP reports Blender 5.2.2 LTS at /Applications/Blender.app/Contents/MacOS/Blender; Metric/Meters; unsaved dirty Scene with Cube, Camera, Light. Preserve before loading another file.
- Downloads contains extra directly related `human figure 3d model (1).glb/.zip` and dollbase body PNGs. Include these candidates instead of assuming the provided base filename is the correct sex/material.
- `muscular human figure 3d model (1).zip` contains FBX and a .fbm/basecolor JPG. GLB/FBX equivalence must be measured, not assumed.
- Stored character-part-sheet-pipeline confirms exactly head + connected T-arm/A-leg body; hollow recessed eyes, open mouth; doll anatomy is intended. No per-limb split or eye insertion.
- Axis correction is evidence-based. A model facing +X is not fixed by blindly applying -90 degrees around X; inspect actual imported coordinates and rotate around the appropriate axis.
- Skills used: mass-ulw (staged DAG), character-part-sheet-pipeline (source contract), game-assets core/character-consistency (identity and spatial QA), karpathy-guidelines (surgical scripts), memory-discipline (owner boundary). Workers load programming for Python scripts. Blender MCP is the native-app surface; cua-driver is only needed if MCP cannot capture/drive the real application. No new image generation is requested.
- Topology: source preservation; gender mesh assembly; material authoring; verification. Quick nodes handle mechanical copying and receipts; deep nodes are mandatory for 3D/multimodal geometry and visual work. One writer per Blender process/file; shared live instance belongs to lead only. Parent owns synthesis and final QA. Runs are phase-local, not one graph for the entire job.
- No git history exists at the new independent project. Do not initialize or commit generated binary assets merely to imitate the game's code workflow.
- Temporary bootstrap note created by mktemp: /var/folders/3w/2wxm65v16vncz3bwq6q4xp1w0000gn/T/ulw-20260919-175714.XXXXXX.md.UgjoScmADj. This project-local append-only notepad is the durable record.

## Learnings
- Tool outputs printed as objects may elide text; print text directly or read bounded chunks. Do not treat truncated skill text as read.
- Use tool_schema with await. Background Blender workers cannot touch the connected GUI instance concurrently.

## Transition 2026-09-19T18:02+09:00
- Preserved original live scene using bpy.ops.wm.save_as_mainfile(copy=True): work/pre-existing-scene.blend, 97414 bytes, original filepath still empty and Camera/Cube/Light unchanged. Scene-preservation todo DONE.
- DAG dag_6c92ebb4-d4ce-4964-bb1d-0924a9b1c966 failed before any task started: source-copy start_failed, all descendants skipped. Separate deep probe st_01a0b8e6 also failed to start. No producer artifacts exist. User was informed; do not count this as completed discovery or approval.
- Topology recovery: lead performs the same phase-local work directly using Blender MCP/background scripts. No spawned child is live. External task-runner configuration will not be modified for an asset task.
- Reference sheet read-back confirms hollow dark eye wells and open mouth, frontal T arms/A legs. Female source sheet includes sportswear; male sheet includes briefs. Dollbase source variants must be compared before selecting body geometry.
## Now
Copy and hash all 19 supplied sources plus 5 directly related variants, then import and render baseline.
## Todo
- Source copy/hash/archive extraction; baseline model and reference audit.
- Male/female assembly, mouth extraction, UV atlas, toon materials.
- Real Blender verification, deliverables, process/temp cleanup.

## Transition 2026-09-19T18:18+09:00
- SOURCE_COPY_PASS: 19 supplied + 5 related = 24 hash-identical copies; 6 ZIPs extracted. reports/source-manifest.json + source-verification.json. bash_3 exited 0. C1 baseline absence and matching-copy GREEN captured.
- audit-import.py imported 6 GLB + 6 FBX; bash_4 exit 0; work/audit/imported-sources.blend. Full geometry-audit.json is 3.8 MB because raw GLB has thousands of disconnected export-seam islands. Use eval read() full string then reduce JSON; tool.read truncates at 2000 lines.
- GLB/FBX world axes already Z up, -Y forward. FBX carries X +90-degree object rotation but world geometry matches GLB. No blind -X90 rotation needed.
- Mapping: SRC_00 bald head = male; SRC_05 stylized doll head = female; SRC_01/02 human figure = female body; SRC_03/04 muscular human = male body. Variants share geometry; texture differences require inspection.
- 18 raw source views captured under evidence/baseline. All 6 front views and male/female representative side/back views visually inspected. Source head male has several cheek/scalp cracks. Eyes empty; teeth present inside open mouth. Body meshes contain clothing; dollbase PNGs do not correspond to supplied 3D geometry.
- Sent nonblocking user question base_clothing: remove clothing to match dollbase vs preserve source clothing. Continue independent neck/oral work while answer pending.
- Weld audit, 1e-5 Blender-unit tolerance: male head 28808 -> 17235 vertices, 24 components; female head 39637 -> 25459, 29 components; male body 39346 -> 22820, 2 components (briefs are separate); female body 45070 -> 28628, 1 component (sportswear fused). Sources unchanged.
- prepare-parts.py split 56 working objects, retaining source UV loops: 4 external skin meshes + male briefs + male 23 and female 28 oral components. Component 1/2 resemble gum rows, 3 tongue; remaining dental pieces require visual naming. reports/prepared-parts.json contains exact boundaries.
- Major intentional open groups: male neck 66 edges, eyes 47 each; female neck 56 edges, eyes 63 each. Smaller boundaries and >2-face junctions remain genuine repair work. Mouth cavity exterior skin remains continuous, so do not cap the mouth aperture.
- Background Blender emits an add-on GPU-init exception before otherwise-successful script completion. Captured exit 0 and expected renders, but do not hide the warning. Investigate disabling only background add-on callbacks if it affects results.
- Python LSP unavailable: basedpyright-langserver not installed. No repo dependency changes authorized/needed; use Blender execution + compile checks, explicitly report unavailable LSP. JS diagnostics only import-order informational hint.
## Now
Waiting for bash_8 prepared-parts multiview renders; independent next step is topology repair design. No next geometry edit before viewing these renders.
## Todo
- Repair micro-holes/nonmanifold faces, retain intentional openings; verify new views.
- Fit/bridge necks and normalize adult scale; separate/named oral components.
- Resolve clothing answer; unwrap atlas, author cel materials.
- Reopen native delivery, verify outputs, cleanup temporary note/processes.

## Transition 2026-09-19T18:30+09:00
- Repair round 1 removed extra faces and filled conventional holes, but zero-area slits remained. New material approach in repair-patches.py rebuilds one-ring corrupt face neighborhoods and triangulates patches, preserving measured neck/eye groups.
- reports/repair-patches.json: all 56 objects have 0 unexpected boundary groups and 0 >2-face junctions. Male head retains [66,47,47] neck/eyes; female [63,63,56]; male body 30-neck; female body 24-neck. Oral parts all closed after repair.
- evidence/prepared, repaired, patched each contains four-angle renders per gender head/body. Front/side/quarter inspection shows shape preserved. Male residual dark specks are baked texture/UV defects, not open mesh boundaries; final neutral cel materials must eliminate these. No final visual PASS yet.
- Geometry repair todo DONE. Next uses head source scale 0.17 male / 0.185 female, trims head neck at 0.12/0.085, body at 0.81/0.945, and makes a 0.012 source-unit bridge. These are working fit decisions, not user-specified canon. Final target standing height 1.75/1.65 m.
- Active monitor bash_11: assemble-bases.py followed by four-angle assembled renders. ASSEMBLY_PASS observed but renders still pending. No subsequent mesh edit until reviewed.
## Now
Inspect assembly report and wait for assembled multiview render completion.
## Todo
- Verify head proportions, neck continuity and scale.
- Resolve clothing input; name oral components and UV atlas.
- Author neutral source-inspired cel materials and packed delivery.
- Live Blender reopen/screenshots/export verification and cleanup.

## Owner corrections and binding scope update
- The prior statement that the owner forbade seoul-kenshi was WRONG. Owner expected the character work in the Kenshi project. On request, copied the preserved 225 MB work tree to GAME-REFERENCE/character-assembly-poc/2026-09-19. Documents copy is now a backup; the repository path is authoritative for new work. Do not touch other agents' existing GAME/Assets/Art, GAME/Assets/Editor/CharacterTool, TOOL/skills/character-tool, TOOL/tools/character-tool changes.
- Owner rejected the rough unequal-loop triangle bridge and found missing/inside-out surfaces. Prior repair/assembly PASS claims are insufficient and WITHDRAWN; stats omitted orientation consistency. Live inspection log shows Male_Head_Oral_02 has 9 inconsistent manifold edges despite positive total volume. New acceptance requires 0 empty mesh objects, no wire/loose/degenerate geometry, 0 inconsistent edge windings, verified outward orientation, no unintended holes, proper quad retopology at all repaired interfaces and a smooth neck with matched loops. Preserve source quad FBX topology instead of triangulated GLB.
- Owner asks for three adult male/female sets: underwear, non-explicit undressed doll base, anatomical undressed base with genital anatomy. This latest explicit request supersedes the older two-part doll-only restriction for the anatomical variant only. No sexual activity, poses or erotic presentation; neutral adult anatomy.
- Owner asks for exactly four principal oral parts per gender: upper gum, lower gum, mouth interior, tongue. Group necessary teeth with corresponding jaw; no unnecessary fragment objects. Remove redundant meshes; retain source archive separately.
- Owner asks for a shared usable eyeball mesh with separated pupil/iris and cornea materials, instantiated into male/female sockets. The earlier instruction to leave sockets empty is superseded by this request; do not close the eyelid rims.
- Work and QA must use the live Blender GUI, inspect edit-mode wireframe, solid surface, face orientation from multiple angles after each geometry change. Leave Blender open showing the finished sets at completion; this is intended deliverable state, not a QA process to tear down.
- Current GUI process repeatedly exits; original scene backup and all work stages are saved. Native preview script did not execute from macOS open --args; file watch timed out. Relaunch through actual Blender executable and operate through MCP.
- unwrap-bases.py FAILED: stale atlas RNA handle after EDIT->OBJECT switch yielded bpy_prop_collection internal error. Reacquire obj.data.uv_layers['AtlasUV'] after mode change. Exit 0 did NOT mean script pass; no UV report/delivery exists.
- Downloads model timestamp inventory shows the same 12 GLB/ZIP files as copied (latest human figure (1) at 17:54). Verify hashes at new project, preserve all originals.

## Now
Relaunch real Blender GUI, re-audit FBX quad topology and repair from quad-preserving source copies. No reliance on rejected GLB assembly.
## Todo
- Confirm migrated source hashes; use new project for every new artifact.
- Build proper quad neck transitions and quad repairs; verify empty/inverted/degenerate topology.
- Four useful oral parts per gender and shared eye asset.
- Three adult male/female body sets, consistent UVs/materials.
- GUI multiview/face-orientation/wireframe proof and saved final project shown in open Blender.

## Transition: GUI quad repair and additional scope
- Live GUI is on `Quad_Retopology_Work`, saved `work/quad-repaired-working.blend`. A fresh Blender source duplicate needed explicit X+90 data rotation because temp object's matrix_world was stale after linking; corrected and saved `quad-axis-corrected.blend` before repair. Source scenes untouched.
- Native Blender MCP tool disappeared from active catalog after a kernel/tool refresh. Existing localhost:9876 add-on remains live (PID 22152). Read its server code and use the same null-delimited JSON execute protocol from eval node:net; not a new integration or background modeling process. Per-request result/status is inspected.
- gui_repair_quad.py repairs local corrupt neighborhoods and propagates face winding. 56 working objects, no empty or unexpected boundaries in its report; eye/neck boundary counts unchanged. Still INTERMEDIATE: local triangulated repairs and oral-shape loss need retopology; not final acceptance. Male upper gum shrank 818 -> 172 vertices; must visually inspect/recover if mutilated.
- `evidence/gui-quad-baseline.png`, `gui-repair-male-front.png`, `gui-repair-solid-front.png` capture real application. Solid front has no large surface holes; texture view retains stains at repaired UVs. Red visible through eyes is inner backside under face-orientation overlay, not an eyeball or cap.
- Owner reiterates eye holes are intentional for separate eyes. Never fill eyelid/socket openings. Need named boundary allowlist plus an unfilled socket test.
- Owner requires damaged texture after mesh edits be repaired after UV unwrap. Not acceptable to hide it with uniform material. Added source color reprojection/bake, seam/stain cleanup and textured multiview verification.
- Owner requests successful workflow be formalized as the project's import/verification procedure, with executable gates and natural-language routing. Only successfully verified steps become standard; failed scripts stay evidence, not recipes.
- Additional process survey completed: reports/additional-process-findings.md cites Blender Retopology/Bridge/Mesh Analysis and Unity 6000.7 Model Importer. Existing character-tool inspect filters out empty meshes and checks mostly bounds/rig; old blender-character-gate.py checks path existence only. These are real missing gates. Natural-language entry is TOOL/skills/character-tool/SKILL.md; reuse CLI rather than create an LLM interpreter.
- Solo execution rationale: live GUI geometry is serial; independent code lane is possible but category task runner failed twice. No live children. Local instruction read before edits to TOOL files; existing other-session code must be read and preserved.
## Now
Retopologize neck as matched, evenly spaced quad rings in live GUI; validate solid, wireframe, face orientation. Preserve final source UV reconstruction work for after topology stabilizes.

## Rejected assembly and method correction
- `quad-assembled-working.blend` is REJECTED. Owner correctly identified doubled neck length/collar and hole patches that interrupt logical edge flow. Matching 66/66 or 56/56 rim counts alone did not solve high/low density transition. `gui_refine_neck.py` was authored but NOT EXECUTED; global simple subdivision/smoothing is not an acceptable fix and is abandoned.
- Latest owner correction: NO approved assembled concept exists. Separate images do not define final full-body proportions. Must make a reversible unjoined proportion study, review head/body/neck from front and side, then replace overlap region. Do not stack two necks or use an invented approved ratio.
- Research source https://topologyguides.com/loop-reduction distinguishes 3-to-1/4-to-2/5-to-3 quad redirection from 2-to-1/4-to-1 patterns that may use triangles/ngons. Need controlled reductions over a spatial transition zone, avoiding concentrated poles; not one boundary subdivision. Blender Grid Fill doc says best results from opposing sides with matching counts; patch should be a clean four-sided neighborhood with orientation matching adjacent flow, not hole-fill fan. Shrinkwrap can project a newly authored patch to a preserved source surface but does not create topology by itself.
- Method: approved proportion -> trim overlapping head/body neck portions -> plan continuous jaw/neck/clavicle loops and distributed density reductions -> quad patch projected to preserved source -> surface/edge/winding/shape checks -> UV transfer/bake/texture repair. No automatic all-quad percentage can substitute for flow/shape review.
## Now
Create a separate unjoined proportion-study scene from original FBX copies. No further joins until the ratio and neck overlap are visually checked and shown to owner.

## Proportion-study checkpoint
- Created `Proportion_Study_Unjoined` from untouched FBX copies, separate head/body objects, no join/cut. Initial inactive-scene matrix_world evaluation was stale identity; caught implausible 2.6/3.1-head ratios and corrected to original parentless matrix_basis. This bug reinforces the import-axis gate.
- Current study: male source head scale 0.15, estimated 7.74 heads at 1.75 m; female scale 0.19, estimated 7.45 heads at 1.65 m. Chin landmarks are ASSUMED working points, not anatomical proof or approved canon.
- Front evidence `evidence/gui-proportion-front-review.png`; side evidence `gui-proportion-male-side-review.png`, `gui-proportion-female-side-review.png`. Lead visually inspected each. Female neck appears too short; do not treat as approved. Need natural neck exposure without old stacked-neck collar.
- Saved `work/proportion-study-review.blend`; live GUI left showing male/female front side by side. Old failed scenes remain preserved only as evidence.
- Nonblocking question `proportion_direction` sent: retain head size and adjust neck (recommended), slightly enlarge head, or slightly reduce head. No irreversible joins pending this decision; continue independent non-model-changing gate work.
## Now
Await proportion direction while inspecting source topology and designing enforceable import gates. Geometry changes to the final bodies stay paused.

## Owner response: head size retained, neck position corrected
- Owner: face size seems right, but neck is far too short. Kept head and body mesh sizes unchanged and lifted only unjoined head objects by 0.065 m male / 0.060 m female. `gui_adjust_proportion.py` uses absolute location.z for repeat safety. This changes total study height; normalize globally only after proportion approval, never by shrinking just the head.
- Saved `work/proportion-neck-position-review.blend`, report `reports/proportion-neck-position-review.json`. Front and close side screenshots: `gui-proportion-neck-raised-front.png`, `gui-proportion-neck-raised-male-side.png`, `gui-proportion-neck-raised-female-side.png`. Neck is exposed, while visible seam is still overlapping unjoined source parts; not a completed junction.
- Read-only probe `probe_neck_rows.py`: male head lowest ring 66, third source-row removal gives 64; male body after 4 rows 42. Female head after 2 rows 56, female body after 3 rows 36. See `reports/neck-row-probe.json` for exact ranges. This allows density reduction over an actual neck span, instead of creating a thin collar or extending two source necks.
- Retrieved and visually read both diagrams from https://topologyguides.com/loop-reduction. 3-to-1 and 5-to-3 route quads through distributed poles; 2-to-1/4-to-1 diagrams include tris/ngons and do not meet this owner's patch requirement. For a ring step, a reduction removes 2 circumferential edges via a localized three-quad template with an interior pole. Must validate on an isolated fixture and GUI before touching bases.
- Extra deep gate-design worker st_01a0b92f also start_failed; no live children. Do not repeatedly spawn against the unavailable runner.
## Now
Design and verify density-transition patch on an isolated mesh; leave user's head/body study unchanged until the transition is shown to work. No blind hole fills, no global subdivision masquerading as retopology.

## Density transition trials and observed failure
- User-owned GUI launched through character-tool (PID 57190, `evidence/gui-persistent-launch.log`) after earlier monitor-owned process hit its 1-hour deadline. Keep this GUI open; do not use a command monitor to own/kill a long-lived user editing process.
- Isolated fixture 64->56->48->42 initially had long skewed quads. Improved angular correspondence and 64->60->56->52->48->44->42 transitions, max valence 5, 0 winding/junction/zero area; screenshot `gui-transition-fixture-aligned.png`. This proves combinatorics only, NOT character quality.
- Character trial `work/neck-transition-trial.blend`, scene `Neck_Transition_Trial_Not_Final`: cut existing source rows and used gradual transitions. Front/side screenshots show pinched/uneven edge distribution at the neck due to irregular boundary contours; NOT PASSED. The head/body study remains untouched. Do not claim a source-row boundary is automatically a clean retopology boundary.
- Owner suggests reducing head polygon count or adding body vertices before connection; accepted head size must not change. Measured boundary neighborhood median edge lengths: male head 6.326 mm vs body 9.859 mm; female head 6.185 mm vs body 13.596 mm. Raw neck rim counts 66/30 and 56/24. A transition must reconcile spacing/directions over adjacent rows, not just equalize rim counts.
- Male body after 4 source rows has 42 rim vertices and adjacent 40 quads + 2 tris. Its contour contains local backtracking and height spikes. Direct arc interpolation propagates those defects into the new neck. Next approach must rebuild/relax a broader neck/upper-chest patch, preserve source outside, and validate silhouette BEFORE texture or full-mesh cleanup.
## Now
Read-only shape and density evidence is sufficient. Make one broader local retopology trial from saved source copies, never alter the proportion study or trust numeric-only PASS.

## Owner sculpt demonstration and protected-body correction
- Add-ons actually installed: ARP, Rigify, Voxel Heat Diffuse Skinning, Weight Paint Tools, Tripo Bridge, MCP, UV Layout. No LoopTools/RetopoFlow/Quad Remesher. ARP remesh is a temporary rig/finger-detection helper, not a surface retopology tool; WPT smooths weights. Native QuadriFlow tested on disposable neck patch: FINISHED with 448 quads, but boundary 64/42 changed to 64/64; cannot stitch without reworking endpoint topology. See quadriflow-patch-trial.json and gui-quadriflow-patch.png.
- `gui_matched_density_trial.py` shortened body neck by displacing z in a broad central band. Owner caught the resulting excavated trapezius. REJECTED. Restored untouched study body; source FBX comparison v/f equal, max coordinate delta 0. `trapezius-source-restoration.json`, restored solid front/side screenshots. Never use this displacement again.
- `gui_native_bridge_trial.py` written but NOT executed. `gui_protected_body_trial.py` makes a separate body-shape-preserving trial: body Simple subdivision x1, 64/64 neck endpoints, native Blend Surface with 3 cuts, only head neck rim adjusted max 10.5 mm. Body retained-vertex displacement 0. Trial has source defects, not final.
- Owner entered Sculpt Mode and manually smoothed the left side, then explicitly said to connect and relax the seam in Sculpt Mode. Preserve their edits and use as shape reference; no topology mutation on their object. Saved `user-sculpt-state-preserved.blend` then latest `user-left-sculpt-preserved.blend`. Latest captured hash 0051ea7af074bd8b70479a983da467eb59a3a3202ca50a0f5480273a54a6b2eb; changing hashes show user actively editing.
- `evidence/user-left-sculpt-current.png` visually shows reduced stiff seam and restored natural shoulder slope. User approves this direction, not a claim all topology is valid. Current object is Male_Protected_Body_Neck_Trial, 66456 vertices/66850 faces, source winding errors still 23, no wire edges.
- Found actual sculpt symmetry bug: object origin x=0 but local mesh center x=-1.050000075; X symmetry is ON. A working duplicate must rebase mesh around its origin with world geometry unchanged before any symmetric sculpt. Owner's object stays untouched. Add origin/symmetry-plane check to standard gate.
## Now
Prepare an independent centered duplicate of owner's current sculpt with world-shape equality proof, mask face/shoulder/trapezius, then use native Sculpt Smooth/Relax only at seam. Save/check after each visible change. Owner's original remains preserved.

## Masked native Sculpt workcopy
- `gui_sculpt_workcopy.py` duplicated owner's latest sculpt into scene `Sculpt_Seam_Workcopy`, object `Male_Sculpt_Seam_Workcopy`. Local mesh center is now 0 with object x=-1.05; max world coordinate change 2.98e-8 m. Owner object unchanged. 691 seam/neighbor vertices editable, 65765 fully masked including face, shoulder, trapezius, clavicles. `reports/sculpt-workcopy.json`.
- Native Sculpt mesh filters applied under VIEW_3D context: Surface Smooth 0.15 x2 (max move 0.331 mm), Smooth 0.25 x3 (1.437 mm), Smooth 0.4 x5 (2.224 mm). EVERY pass protected max displacement 0. Reports `sculpt-surface-smooth-pass.json`, `sculpt-smooth-pass2.json`, `sculpt-smooth-pass3.json`.
- Latest file `work/sculpt-seam-smoothed-pass3.blend`; real screenshots `gui-sculpt-smooth-pass3-front.png`, `gui-sculpt-smooth-pass3-side.png`, earlier quarter views. Visual outcome: shoulder intact, reduced stiff seam, but side/back junction still has a visible ridge and requires further localized blending. Do not report complete.
- Seam consists of 256 quads and has 0 bad winding/nonmanifold edges; rest of source still contains separate defects. Maximum seam boundary angle decreased from 33.90 to 19.69 degrees; median 6.49. Numeric improvement is not shape approval.
## Now
Inspect rear/opposite side; refine only remaining neck ridge with protected mask, then repair non-seam source topology separately. Continue preserving owner's sculpt.

## Logical repair checkpoint
- Native RELAX 0.22 x2 on same mask: max move 0.356 mm, protected max 0; saved `sculpt-seam-relaxed-pass4.blend`. Seam remains 256 quads/0 open edges/0 winding errors. Rest of source: 103 boundary groups, 209 junction edges, 23 winding errors, 3 degenerate faces. Not final.
- Found root cause of 11 narrow face/body slits: paired vertices 0.138 mm apart with surrounding 5/3/5/3 valence; targeted weld restores 4-valence without creating/deleting faces. `gui_weld_slits.py` -> `logical-slit-weld.blend`, 66445 verts / 66850 faces, all neighboring quads retained. Never blanket merge by a larger distance: read-only probes worsened junction count.
- Near-duplicate-surface weld probe reduced only 10 junctions while removing 50 faces; not applied. Probe artifact `duplicate-surface-probe.json` is read-only and insufficient as repair.
- One cheek patch: remove 11 corrupt faces + 1 adjacent triangle -> 14-edge loop; native grid fill span3 initially selected wrong corner flow and source BVH projection pulled new verts into corrupt geometry. Replaced with opposing boundary chains [0..3] and [7..10], 12 quads, relaxed only 6 interior vertices. Boundary unchanged; 13 boundary vertices become valence4, 1 valence5. Screenshots `gui-cheek-grid-aligned-relaxed.png` and `gui-cheek-repaired-solid.png`; saved `work/cheek-grid-aligned-relaxed.blend`, current object `Male_Cheek_Grid_Repair` in scene `Cheek_Grid_Repair_Trial`.
- Shape inspection shows this cheek patch no longer has a visible hole, and flow follows the surrounding cheek rows. Remaining head defect patches are mainly ear ridges, one opposite cheek, and inner mouth. Need generalized corner-aware grid repair, not automatic hole cap.
## Now
Repair remaining defects with corner/valence-aware quad patches while preserving both intentional eye loops, then female base, oral/eye assets and requested variants. No finalized UV/material/export yet.

## Latest steering: learn the owner's local sculpt, not masked global smoothing
- Generalized quad patch review copy created 89 patches, 66627 verts/67077 faces, only eye loops [47,47], 0 junction/winding/zero area. File `all-quad-patches-review.blend`. Numeric topology PASS only; broad visual review remains incomplete. Owner redirected attention back to reproducing their left neck, so this track is PAUSED, not complete.
- User explicitly clarified they chose visually unnatural places and spread them into the surrounding surface, rather than applying a mask-band filter. Symmetry can copy a good half later, but the agent must first understand/reproduce the sculpt result itself.
- `user-sculpt-before-after-analysis.json`: same 66456 vertices/66850 faces before/after. Owner changed 487 verts, 421 viewer-left, 48 right, 18 center. Left moved median 1.924 mm, max 10.722 mm; most inward normal displacement, plus tangential repositioning. Changes confined z=1.508..1.613; below 1.50 and above 1.62 unchanged. Left seam boundary median angle 13.635 -> 4.280 deg, p90 27.97 -> 9.48. Exact brush strokes unknown; do not assert which brush was used.
- Earlier narrow mask protected 118 of owner's 421 changed left-side verts. This is evidence the automated area was wrong, NOT evidence owner used a wider mask. `gui_reproduce_sculpt.py` was written for masked filter but NOT EXECUTED and is abandoned due to latest correction.
- Loaded installed Essentials Smooth/Scrape/Flatten/Relax/Grab brush names. Blender official Smooth docs distinguish local Shift/Smooth brush from whole-unmasked Mesh Filter, and note density affects strength. Current plan uses a fresh pre-owner duplicate with no mask, local brush strokes targeted from GUI, check after each stroke; preserve owner's original.
## Now
Create `Local_Brush_Reproduction` baseline copy, inspect visible ridge and make one localized Smooth stroke through native sculpt brush operator. No global filters or symmetric copy.

## Renewed mass-ulw phase: reproduction plus independent gates
- Owner explicitly asks to learn from demonstrations, verify the cause/effect, improve the process, and only then automate what can be inspected reliably. No claim of visual judgment being automated yet.
- `Local_Brush_Reproduction` now exists, `Local_Brush_Baseline_No_Owner_Deltas`, Sculpt Mode, Essentials Smooth 0.35, no mask, no owner coordinates copied, saved `local-brush-baseline.blend`. `local-brush-before.png` shows the sharp viewer-left neck ridge to target. No native brush stroke applied yet.
- New phase topology: (1) topology checker implementation + real Blender red/green, deep because mesh algorithms and validation; (2) source preservation/packaging receipts, quick mechanical; (3) scoped process findings and claim ledger, writing; then verification node depends on all three. Parent alone owns live Blender local sculpt. Writes are disjoint. This is the first retry after owner's renewed explicit mass-ulw request; if start_failed repeats, report it and do not launch a storm.
- Existing character-tool files are now clean/tracked under commit 7624d0bb from the other session. Can extend focused files after fresh reads; never revert their implementation. TOOL/tools/character-tool has no deeper AGENTS.md.
- Gate lane must distinguish raw inspection from strict preflight, eye allowlists from accidental holes, malformed geometry from human shape approval. Include a JSON policy with named loop membership, not a blanket boundary count bypass. No runtime promotion or Unity launch in this phase.

## Latest direction: mathematical inverse analysis, no VLM imitation
- Owner: the goal is mathematically reverse-analyzing how their sculpt changed vertices and GEOMETRIC normals on the logical mesh, not the agent reproducing brush motions by VLM. Explicitly corrected unnecessary custom-normal discussion. Stop GUI brush trials and analyze fixed-topology data.
- In-flight local brush stroke finished on separate baseline copy: Smooth 0.35/radius55 px, screen path (425,347)->(525,363), changed116 vertices max1.732mm. Saved `local-brush-stroke-01.blend`; no further stroke. Owner mesh untouched.
- Renewed DAG dag_bf9c1626-484b-42a7-9880-9cc710f1222e failed all 3 producer starts, verification skipped. No outputs/code were made by children. No live children. Parent analysis continues directly; don't treat mass fan-out as executed.
- Extracted exact corresponding data from protected-body-neck-trial, early user save, user-left-sculpt save: identical topology SHA b2d9a9964280697f7e0af48c0912311a23e0acda257e2a1d18bfc763f6561648; 66456v/133369e/66850f. 11.1MB compressed/25.05MB resident. `extract_sculpt_inverse_data.py`, `sculpt-inverse-data.npz`, source receipt. Scene unchanged, imported temporary datablocks cleaned.
- Numpy/scipy resident Python kernel: X/Y positions, D displacement, E edges, P neighbor-average operator, L=I-P, N0/N1 geometric normals. Fixed BEFORE-defined ROI: 10 graph hops from seam, z1.485..1.64, abs(x-center)<.10; 1681 vertices, 816 viewer-left; all421 changed left verts included.
- Geometry results: normal displacement energy40.58%, tangent59.42%; seam-border median angle13.635->4.280deg, max157.081->15.474; >90deg ROI edges11->0; winding errors0->0. Thus unfolded geometry, not repaired topology winding. ROI Laplacian energy down57.35%, squared dihedral down74.53%; face z>1.62 and lower body z<1.50 unchanged.
- Exact cross product identity delta(a x b)=deltaa x b + a x deltab + deltaa x deltab verified residual0. Nonlinear term p90 contribution28.94%; linear normal approximation insufficient for severe folds.
- Endpoint inverse using final umbrella u=P Y-Y: per-vertex scalar coefficient explains87.31% displacement energy; separate normal/tangent coefficients92.98%, residual median0.259mm. TARGET-CONDITIONED explanatory fit, not recovered brush history or predictive success.
- Before-only spatial CV (front/side/back train2/eval1): explicit uniform49.44%, implicit51.27%; inverse-length33.03%, positive-cotangent21.43%, guide anisotropic50.77%, biharmonic39.66% did not improve. Adaptive implicit using initial umbrella roughness / local edge length improves to64.84%; fold RMSE1.465/0.953/1.998mm. Still failed auto-apply: front seam max37.47deg vs human15.47, untouched-in-ROI drift up to3.59mm. No cross-character validation; model family exploration on same sample means CV is exploratory.
- Core results reproduced by standalone `analyze_sculpt_inverse.py` (Python3.14.3 numpy2.4.2 scipy1.17.1), exit0, INVERSE_ANALYSIS_COMPLETE. Results `sculpt-inverse-analysis.json`; Korean formulas/report `reports/Sculpt-Inverse-Analysis.md`. No model applied to user geometry.
- Latest monitor bash_29 exports heldout candidate arrays for native Blender BMesh verification. After completion run `validate_inverse_geometry.py` via live protocol (memory-only copies) to cross-check normals/angles and protected region exactly.
## Now
Finish native geometry cross-check and report the mathematical conclusion/limits; automatic repair is not yet accepted. Broader model deliverables remain open, not silently completed.

## Native inverse verification completed
- `validate_inverse_geometry.py` initially decompressed `candidates['sectors']` inside every edge loop, keeping live Blender CPU100% beyond 120s RPC timeout. Did not restart/duplicate; subscribed to output file via watch_2. It completed and cleaned temporary datablocks. Fixed code to load each array once for future runs.
- `sculpt-inverse-native-validation.json`: Blender5.2.2 native max seam angles37.475/11.025/8.920deg, same as independent NumPy to float precision; float32 max displacement discrepancy8.39e-8m; ROI exterior move0; user mesh untouched. RPC follow-up confirms no unlinked analysis objects. User changed GUI to EDIT_MESH during/after wait; do not force their mode back.
- `reports/Sculpt-Inverse-Analysis.md` includes formulas, measured facts, target-conditioned92.98% vs exploratory before-only64.84% distinction, residual failures, proposed gates, exact reproducible command, native verification and no-auto-apply verdict.
- Analysis scripts compile; no generated Blender stubs/LSP verification was available. Independent Python entrypoint exit0 captured for uniform/adaptive runs. No commits made by this session.
## Now
Mathematical analysis deliverable complete. Await owner's next correction or continue only work consistent with this updated priority; never resume VLM brush imitation as if approved. Entire character assembly is still incomplete.

## Continuation: original oral recovery
- Migrated source verifier completed exit0: 24 originals, 6 archives, 12 members all hash-identical; no new matching Downloads candidates. `reports/migrated-source-verification.json`. Corresponding todo completed.
- Previous oral extraction client was killed/restarted; actual files did not exist. Live Blender now PID53523/new unsaved Scene with Cube/Camera/Light plus empty Oral_Original_Review, no SRC objects. No assumption that prior live scene survived. Saved prior work remains available.
- Updated `prepare_oral_review.py` to load only SRC_06/SRC_11 from preserved `work/audit/imported-sources.blend`, extract untouched component geometry/UV, clean temporary loaded sources, and leave current scene/mode unchanged. Successful live call produced 6 objects and `work/oral-original-review.blend`, `reports/oral-original-review.json` plus gender component mappings.
- Male groups: upper1775v/1924f, lower1827v/1991f, tongue266v/268f. Female upper2574v/2626f, lower3501v/3519f, tongue567v/554f. Original defects intentionally retained until review; no destructive cleanup of gums. Dental assignment by centroid distance is a candidate and may misassign upper back teeth; must visually verify. Inner mouth wall still integrated with head and not separated.
- Started monitor mon_SRNE51JHT803XBWY/bash_33: background render of isolated saved oral review, preserving user's GUI. `render_oral_review.py` creates front/upper/side PNGs for both genders under `evidence/oral-original-review`, sentinel ORAL_REVIEW_RENDER_COMPLETE. No next geometry edit before images are inspected.
## Now
Wait for oral review render notification; inspect source-preserving mouth parts and correct jaw assignment before any repair or completion claim.

## Oral surface-assignment correction
- Initial six renders completed exit0 and inspected front/upper images. Original gum/tongue geometry preserved, but male source is visibly damaged and no repair PASS is claimed.
- Centroid dental assignment misclassified female posterior teeth components8,12,13. Changed to lower-quartile mean nearest distance to actual gum surfaces (BVH), preserving every original vertex/UV. Male19/21 are close to both gums; flagged by small margin for visual check, not silent certainty.
- Saved separate `work/oral-surface-assigned-review.blend`, reports `oral-surface-assigned-review.json`, `male-oral-surface-mapping.json`, `female-oral-surface-mapping.json`. Active default Blender Scene unchanged; no user scene replacement. New review has 6 grouped objects; inner mouth is still not extracted.
- Active monitor mon_75CSEJPKAPNSRQXK/bash_34 renders 12 proof images under `evidence/oral-surface-assigned-review`: front/upper/side and individual upper/lower/tongue per gender. Temporary render-only materials encode upper blue/lower orange/tongue red. Not final authored materials.
## Now
Next input is render completion notification; inspect isolated jaws to validate assignment before marking any oral completion. Continue from original-source review, not the mutilated earlier gum repair.

## Oral separation verified, repair still open
- Role-color isolated renders completed exit0. Inspected upper/lower arches and tongues for both genders. Surface-based assignment resolves female posterior tooth misclassification. Male source remains visibly faceted/cracked; do not infer repair from separation.
- Marked only three separation tasks done: male/female upper gums+teeth, lower gums+teeth, tongues. Saved `work/oral-separated-verified.blend`, `reports/oral-separation-verification.json`. Six objects retain original geometry/UV. Explicit `repair_complete=false`; inner mouth not separated.
- Read-only inner mouth probe: male central region contains1699 faces/647 inward candidates, female2625/608. A coordinate/normal threshold alone is not an accepted anatomical cut; inspect source cutaway before selecting mouth-wall boundary.
- Active monitor mon_VTXBAVRNS63EA8FC/bash_35 renders disposable half-head cross sections from preserved original imported-sources.blend. Output `evidence/mouth-cutaway/{Male,Female}-{side,front-quarter}.png`, sentinel MOUTH_CUTAWAY_RENDER_COMPLETE. Cuts are in temporary background memory only, not user geometry or saved source.
## Now
Wait for cutaway render and inspect actual inner-wall/lip topology before separating the fourth oral part.

## Inner mouth boundary study
- Cutaway renders completed exit0 and visually inspected both side sections. Cavity ceiling/floor wrap behind teeth and tongue, remain connected to lip/external head; male rear floor also damaged. No planar cut approved.
- `probe_inner_mouth.py` uses several cavity origins and first-hit BVH rays restricted to inward-facing mouth envelope. Candidate female698/male402 faces, no source edits, saved `work/inner-mouth-selection-review.blend` + `reports/inner-mouth-selection.json`. These are visibility candidates, not final semantic membership.
- Active monitor mon_Z6NXT35FVZQ9S3GT/bash_36 renders cyan cavity candidates on disposable cutaway copies: output `evidence/inner-mouth-selection`, sentinel INNER_MOUTH_SELECTION_RENDERED. Must check missed inner faces/outer skin before extraction. Current user default Scene still unchanged.

## Cavity candidate display repair
- First candidate renders were uniformly clay: clearing mesh material slots reset polygon material indices after selection. Actual selected-face counts remained female698/male402. This was a display bug, not proof that selection was correct.
- Fixed `probe_inner_mouth.py` to assign material indices AFTER creating slots. Corrected only agent-owned candidate objects, verified exact cyan counts, rewrote its review library.
- Active monitor mon_X8J6Q4FW6WNXM8BA/bash_37 re-renders corrected cavity colors. No geometry edits and no completed inner-mouth extraction claim. Next action is inspect cyan boundaries, not proceed from the incorrect initial screenshots.

## Cavity partition execution issue
- Corrected cyan side sections inspected: selected faces cover cavity ceiling/floor/back without selecting outer cheek; sparse unselected islands remain near inner lips/uvula. Visibility selection alone is not a final clean lip loop.
- `separate_inner_mouth_review.py` partitions candidate + wholly enclosed unselected islands into InnerMouth and HeadExterior copies; asserts every original face remains in exactly one output, no coordinate movement. This is review-only, not final lip-seam approval.
- Two GUI calls returned Incomplete Blender response, no output files; live PID changed and scene became default empty file. Do not assume user shutdown vs crash without evidence. Stopped repeating GUI calls. Saved originals unaffected.
- Active mon_1S9KM3Y78H28D5M0/bash_39 runs isolated background Blender --factory-startup --python-exit-code1 against saved inner-mouth-selection-review.blend to capture exact failure or successful partition. Next action is inspect completion, not launch another copy.

## Confirmed Blender save crash
- Isolated process exit1 wrote `/var/folders/3w/2wxm65v16vncz3bwq6q4xp1w0000gn/T/inner-mouth-selection-review.crash.txt`. Read backtrace: BKE_view_layer_copy_data -> scene_copy_data -> bpy_lib_write; Python line78 `bpy.data.libraries.write`. Geometry partition was not the crash site.
- Changed partition script to background-only full `wm.save_as_mainfile`, updates view layers, new output `inner-mouth-partition-review-v2.blend`; does not call the crashing scene-library writer.
- Active mon_2AS6DA8QQ0TY97RE/bash_40 executes this materially different save path. Read completion and actual partition report; no GUI calls until save verified.

## Partition save recovered
- Full save exit0 / INNER_MOUTH_PARTITION_CREATED. Actual JSON read: female inner767/exterior18544 =19311 original faces; male inner426/exterior13406 =13832. Zero source faces deleted, zero source positions moved. Candidate enclosed islands included; lip boundary remains a visual-review requirement.
- Saved `work/inner-mouth-partition-review-v2.blend`. Background reopen verification bash_41 is pending, expected PARTITION_REOPEN_OK with exactly4 objects in Inner_Mouth_Partition_Review. Its completion notification owns the next step. Partition separation is not yet marked final or repaired.

## Additional Downloads source batch
- Owner supplied more body models and asked to copy them. Copied 8 GLB + 8 matching ZIP =16 original files into `sources/additional-bodies-20260919-224836/`, extracted 8 FBX with textures under per-archive directories. No loose FBX in Downloads. UUID families: 1bf3bbc2 (base,1,2), 4aa40f40 (base,1,2,3,4). Unrelated installer ZIP excluded.
- `copy-additional-bodies.py` exit0 verifies every original/copy SHA and each extracted archive member. `reports/additional-bodies-copy.json` and batch `manifest.json` record all paths/hashes. Lead independently recomputed 16 copied hashes, all match. Old sources and Downloads untouched. No new-model identity/quality claim until import review.
- Prior partition reopen bash_41 also completed exit0: PARTITION_REOPEN_OK with female inner767/exterior18544 and male inner426/exterior13406. Stored partition exists and reopens; lip-boundary visual QA still pending.

## Continuation: additional-body inspection and shared-eye asset
- `audit_additional_bodies.py` imported all16 new GLB/FBX, saved `work/additional-bodies-inspected.blend` and `reports/additional-body-audit.json`, rendered24 FBX views; exit0. Front views read. Female UUID1bf3bbc2 variants3 share26275v/28422f/24083quads, boundary83/junction16/winding1/degenerate29. Male UUID4aa40f40 variants5 share26127v/28044f/24076quads, boundary228/junction8/winding1/degenerate14. Undressed bodies confirmed; same statistics do not yet prove byte-identical geometry. Need sides/back and coordinate-hash comparison before selecting texture/mesh versions.
- Created common eye via live Blender in separate `Shared_Eye_Asset` scene, leaving default user Scene unchanged. `Eye_Master_Reusable` collection contains parent pivot, 24mm core with separate Sclera/Iris/Pupil material slots and vertex groups, plus independent closed thin cornea lens. Front -Y; iris12.4mm and pupil5mm are editable defaults. No character socket fitting yet.
- `work/shared-eye-master.blend` object-only library saved without scene-copy crash. `reports/shared-eye-master.json`: core2242v/2304f, lens1666v/1728f, both0 boundaries/0 nonmanifold/0 winding errors/positive volume; EyeUV exists. Shader uses procedural radial brown iris; engine export needs bake, not yet portable material claim.
- Active mon_8TQ6NVZJT89RTQKV/bash_46 renders eye front/quarter/side and no-cornea comparison in isolated process. Output `evidence/shared-eye`, sentinel SHARED_EYE_RENDER_COMPLETE. Next step look at renders and fix visual/material/UV issues before marking eye task done.

## Eye master verified, socket fit pending
- First eye renders blank/black: camera clip_start default0.1m exceeded camera distance0.08m. Fixed clip_start0.0001m and rerendered, exposing actual asset. No geometric success claimed from first screenshots.
- Removed pupil specular reflection, repaired128 collapsed UV pole triangles per mesh, added EyeAtlas with nonzero triangle areas while preserving explicit procedural EyeUV. `finalize_shared_eye.py` -> `deliverables/shared-eye-master.blend`, `reports/shared-eye-validation.json`. Native closed topology/positive volume/zero winding and nondegenerate UVs; front/quarter/side/no-cornea renders under `evidence/shared-eye-final` viewed. Common eye creation task DONE; not fitted yet. Procedural iris still needs engine bake.
- Additional body fingerprints completed: exact coordinate+topology identity groups female[8,9,10], male[11,12,13,14,15]. Front/all and representative side/back views inspected; no clothes on new bodies. Additional model inspection task DONE. File `additional-body-fingerprints.json`.
- `fit_shared_eyes_review.py` fits shared linked eye meshes to ORIGINAL intentional socket loops via least-squares sphere and96th-percentile radius, no head vertex changes. Female fitted eye diameter~56.85mm, male~47.1mm due to stylized BJD sockets; NOT human-anatomical default eye claim. Saved `shared-eyes-fitted-review.blend`, `shared-eyes-fit.json`. Original24mm master remains reusable and unscaled.
- Active mon_MWFN8WSXW2F88JSS/bash_51 renders both heads front/quarter/side with fitted eyes; output `evidence/shared-eyes-fitted`, sentinel FITTED_EYE_RENDER_COMPLETE. Need inspect corner gaps/protrusion before completing eye placement.

## Eye fitting verified; next repair guard
- Six head/eye renders front/quarter/side inspected. Eye spheres sit inside intentional openings; no outer-head eye bulges/gaps visible in these static views. Male face has separate pre-existing cheek hole, explicitly not included in eye completion.
- `verify_fitted_eyes.py` reopens saved fit and compares every head vertex + polygon to original transformed FBX: unchanged within1e-7m. Core/lens datablocks shared left/right AND across genders, material slots distinct. exit0 / SHARED_EYE_FIT_VERIFIED. Report `shared-eye-fit-verification.json`. Eye placement todo DONE for static original-head fit; transfer to final assembled-body coordinates still part of integration.
- Existing quad_patch_repair hardcodes largest two47-edge eye loops and ignores its argument. This cannot safely repair raw female head/new body necks. Added `test_quad_patch_boundaries.py`: cube with intended top opening + accidental bottom hole; exact top coordinates must survive while only bottom repaired to quad. Running RED monitor mon_PY3WJWQHGMMKWQ4A/bash_53 before changing implementation. Next: explicit coordinate-boundary groups, no guessed size exemption.

## Explicit protected boundaries red-to-green
- RED bash_53 failed AssertionError at hardcoded47-eye assumption as expected. Changed repair_patches to take exact protected-loop coordinate sets, reject missing/incomplete/repeated loops, preserve exact loop partition at exit. Existing male caller now supplies actual47-eye coordinates explicitly. Simple healthy four-edge missing quad can be grid-filled without deleting adjacent healthy faces; narrow cracks still rebuild local topology.
- GREEN bash_54 exit0 EXPLICIT_BOUNDARY_REGRESSION_PASS: top loop unchanged, bottom repaired as quad, no junctions. No report of all real source models passing yet.
- `repair_doll_sources.py` loads original heads SRC06/11 and new untextured-body variants ADD10/15 into isolated copies, preserves explicit eye+neck loops, retains original materials/UV. Structural repair only; follow with multi-angle render and reject bad flow/silhouette.
- Active mon_X3X5PYYS31E5C1DX/bash_55 executes source repair, expected `work/doll-sources-repaired-review.blend`, `reports/doll-source-repair.json`, sentinel DOLL_SOURCES_REPAIRED_REVIEW. Next act on actual completion; eye asset/fit tasks already verified.

## Raw doll source repair structural pass
- bash55 stopped at non-simple branch boundary; did not save bad geometry. Extended corrupt neighborhoods at branch vertices before grid filling. Explicit protected opening regression passed again, then bash56 exit0.
- `doll-source-repair.json`: female head18826v/19290f,7patches; male head13351v/13777f,25patches; male body26104v/27967f,52patches; female body26244v/28302f,35patches. All junction/winding/zero-area0; original eye/neck coordinate loops exactly retained. File `doll-sources-repaired-review.blend`.
- Sixteen textured renders completed exit0 under evidence/doll-sources-repaired; fronts and representative side/back inspected. Silhouettes intact at these views, but male head patches show severe UV/texture stains. Do not hide stains with final uniform material or call texture QA passed.
- Active mon_74NYGCDSA9JQX0NV/bash58 runs `probe_patch_uvs.py` and `render_repaired_clay.py`. First probes each patch's external-loop UV conditions/seam conflicts; then renders four-angle clay overrides to separate geometry from texture defects. No source geometry edits. Next inspect results before choosing UV transfer method.

## Clay and UV findings
- bash58 exit0. Clay renders inspected: male cheek still has a small pinched depression, male hip has small dent; female surface/major silhouettes look intact at inspected views. The severe colored stains are UV faults, but not all artifacts are texture-only. Source repair remains review state.
- UV probe: nearly every patch crosses existing source UV seams (female head7/7, male24/25, male body51/52, female35/35), maximum boundary UV spreads~1.08..1.32. A single harmonic UV disk would smear unrelated atlas islands; do NOT apply naive UV interpolation. Need new atlas + source color reprojection and patch color reconstruction.
- Added read-only `probe_patch_curvature.py`: fits robust local quadrics to healthy2..5 neighbor rows, predicts normal displacements for patch +2 taper rows. Targets measured male cheek(.21335,-.20720,.33259) and hip(.08087,.00462,.53929). No broad smoothing or protected boundary movement. Active mon_GBHK691CASHH72X0/bash59 writes `patch-curvature-probe.json`, sentinel PATCH_CURVATURE_PROBE_COMPLETE. Inspect fit error/move size before authorizing change.

## User priority: internal audit of separated oral parts
- User explicitly requests male mouth/teeth holes, flipped faces and unwelded vertices fixed, with INTERNAL audit of separated parts. Separation verification is not repair acceptance; mark each independently. Do not weld legitimate gaps between teeth or distinct gums/tongue.
- First broad quadric fit mixed cheek/jaw curvature; rejected without modifying geometry. Reduced samples to nearby normal-aligned healthy rows; bash60 completed probe. Results remain un-applied while oral audit has priority.
- Added `audit_oral_internals.py`, loads six original-preserved gum/teeth/tongue groups plus two mouth-wall partitions; audits every connected component's boundary loops, junctions, winding, signed volume, loose/wire, duplicates, degeneracy and UV finite/zero-area. It never caps/welds source parts.
- Active mon_C4T3JAJFMP66GAX7/bash61 writes `reports/oral-internal-audit-before.json`, sentinel ORAL_INTERNAL_AUDIT_COMPLETE. Next read full component summaries and choose a shape-preserving weld/repair strategy; earlier destroyed male gum172v is explicitly rejected as a donor.

## Internal oral audit results
- bash61 exit0,8 separated groups audited per connected component. Male upper1775v/1924f,12components,555boundary/31junction/18winding; lower1827v/1991f,10components,546boundary/33junction/14winding; tongue266v/268f,24boundary. Male inner wall467v/426f,4components,176boundary/8junction/2winding. Female upper3081v/3108f,13components,279boundary; lower2994v/3037f,14components,278boundary; tongue567v/554f,30boundary; inner822v/767f,4components,154boundary. Female junction/winding0, but open parts need role-aware closure. Counts from final surface-based assignment, not obsolete centroid report.
- Audit task DONE, no repair task done. `oral-internal-audit-before.json` includes component vertex IDs, loops, bounds, signed volume, degenerates, UV stats. Most male cracks are too numerous for blanket cap; test component-local weld first.
- Active mon_WELD equivalent actual handle returned in tool / bash62 runs `probe_oral_weld_distances.py`: thresholds0,1e-5,1e-4,.00025,.0005,.001,.002 source units, never across component labels. Read `oral-weld-distance-probe.json` after ORAL_WELD_DISTANCE_PROBE_COMPLETE and compare shape/quad preservation, not just hole count.

## Conditional symmetry and candidate-selection contract
- Owner explicitly clarified: inspect BOTH halves, select the successful/logically flowing side, and only if symmetry is valid for this undecorated base, discard the opposite half on a COPY, reflect donor and weld center. Left is better only in this example, never a universal preference. Asymmetric design or both sides failing blocks automatic mirroring. UVs must be separately unfolded without left/right overlap.
- Owner's purpose is deliberate high-density-head/low-density-body assembly, even though a complete generated character was possible. Do not bypass with unified models. The deliverable includes measurable defect diagnosis -> routing -> candidate scoring/selection/inverse analysis -> final goal acceptance, not just a saved mesh.
- Added `reports/Assembly-Method-Contract.md` and durable memory. Hard failures precede rankings; no weighted sum can compensate for holes/protected-shape destruction. Geometry/flow scores and final visual/render/UV/export checks remain separate.
- `audit_bilateral_candidates.py` exit0 report: user-sculpt both halves have source defects; repaired donor both halves have1 duplicate face each, despite0 boundary/junction/winding. Negative-X side has lower neck p90 (15.69deg vs17.74deg) and fewer >90deg folds(9vs12), but NOT final donor approval. Route REPAIR_BEFORE_ANY_HALF_REPLACEMENT; no geometry edited. New duplicate test caught earlier false-green structural gate.
- Active mon_Q3Z4NFZKJF654DKC/bash67 locates duplicate faces/component ownership and >60deg neck edges on `all-quad-patches-review.blend`, writes `bilateral-blockers.json`; no geometry changes. Next inspect the exact blockers then choose minimal repair, not mirror failures.
- Oral distance probe completed: larger merge distances reduce few boundaries, destroy quads and increase junctions; not applied. Isolated gum/tooth component renders completed bash63, not yet inspected due latest symmetry-method steering; evidence/oral-components remains available.

## Corrected bilateral audit scope
- `bilateral-blockers.json` reveals duplicate pairs are two detached4-vertex double-sided scraps at wrists, not main face/neck. Four other10-vertex paired fragments also detached near fingers. Main skin component66579vertices; donor had7 totalcomponents. Previous0-nonmanifold report did not detect tiny closed duplicate debris.
- Wide z-box neck score mixed internal-mouth faces into folds. Found surviving `SeamRelax_Only` deformation group689vertices created from actual bridge+neighbors, and ProtectedEndpoint tag. Use semantic group for neck continuity rather than arbitrary coordinate box. This fixes validation scope, not by suppressing defects; whole-component topology remains checked separately.
- `prepare_symmetry_donor.py` creates independent copy, asserts exact six debris sizes [4,4,10,10,10,10] and wrist location before deleting, leaves main coordinates untouched, audits both halves with semantic seam and full-side hard gates. Active mon_RMTHFHWC631WQVW2/bash69 -> `symmetry-donor-clean-audit.json`, `symmetry-donor-clean-review.blend`. No symmetry applied before actual results and visual comparison.

## Donor structure passes, visual selection pending
- bash69 exit0. Detached6 debris removed only on copy; main skin1component unchanged. Both halves hard failures0. Semantic seam negativeX median5.128/p909.122/max18.130deg versus positiveX median6.739/p9012.746/max35.501deg; both0 edges>90 and max valence6. Negative side is Pareto-better on these neck metrics but not yet final visual donor approval.
- Active mon_1DZMDH983ZYFSEXK/bash70 renders matched mirrored-camera AND mirrored-light quarter/side/rear-quarter per side, output `evidence/bilateral-donor`, sentinel BILATERAL_DONOR_RENDER_COMPLETE. Inspect both halves for cheek/neck shape and local patch dents before committing to symmetry.

## Donor render coordinate failure
- bash70 rendered wrong framing: off-center mesh world translation meant local target(0,0,1.61) aimed at hand/empty space. Side images inconsistently lit. Rejected as selection evidence; no symmetry decision made.
- `render_bilateral_donor.py` now updates dependency graph then transforms local target through obj.matrix_world; mirrored lights/cameras are centered on actual world position. clip_end10m explicit. New output `evidence/bilateral-donor-world-corrected` preserves failed screenshots separately.
- Active mon_HYE2AH1NPVG5TWDD/bash71 prints DONOR_RENDER_TARGET then BILATERAL_DONOR_RENDER_COMPLETE. Read target + images before any donor modification.

## Selected negative-X donor and applied symmetry
- Corrected6 donor renders inspected: negative-X cheek has no right-side dimple, neck/trapezius transition visibly more continuous. Combined with both hard-gates passing and negative-X lower median/p90/max, selected negative-X for THIS symmetric base. No universal left preference.
- `apply_selected_symmetry.py` native mesh.symmetrize on isolated copy, threshold1e-6m. Source donor vertices max change0, donor fully-negative face connectivity identical. Reflection nearest-coordinate error4.66e-10m,1component,2 intentional47-eye loops,431 center edges all manifold,0duplicate/extra-boundary/winding/degenerate. Saved `work/male-base-symmetric-review.blend`, report `male-symmetry-verification.json`.
- Face counts66919v/67382f:66266quads/1068tri/48ngons. Center-cut n-gons are NOT final quad-flow acceptance; audit locality and repair without moving preserved donor surface. Mirrored source UV is transfer-only and needs nonoverlapping atlas.
- Active mon_AG726XWCJ2CDVB1N/bash73 runs `audit_symmetry_center.py` then bilateral post-symmetry renders to `evidence/male-symmetric-review`. Next inspect actual center report + renders before UV or completion.

## Symmetry center repaired; UV unwrap failure isolated
- Post-symmetry quarter/side renders read: both cheeks/neck now match selected good half, no original opposite cheek dent. 48 pentagons were 24 mirrored pairs touching center; `quad_symmetry_center.py` replaces each pair with4quads using one midpoint on existing shared edge. All preexisting vertex coordinates unchanged, no ngons remain;1component,2intentional47-eye loops,0winding/extra-hole, symmetry4.66e-10m. Saved `male-base-symmetric-center-quads.blend`, report `male-center-quad-verification.json`. New face counts66362quads+1068 original triangles; neck/center authored quads, not global all-quad claim.
- bash75 rendered corrected center version; both quarter images visually inspected, shape retained.
- `unwrap_symmetric_base.py` attempted per-half selection SmartUV+pack with SourceUV preserved. Saved review and report, but NOT PASS:1collapsed UV triangle2129, u-min outside prescribed half tile; likely edit-mode selection propagation. No final UV claim. Source geometry and SourceUV hash checks pass.
- Active mon_FJBA55TG5JK3C6B3/bash77 `probe_uv_failure.py` reads collapsed polygon's 3D coordinates and per-half actual UV bounds. Next replace selection-based half unwrap with isolated temporary half meshes and explicit loop mapping back; inspect actual collapse before any geometry change.

## UV isolation and actual intersection gate
- UV failure detail: previous left faces unexpectedly ranged u.002..964 because edit selection leaked into second-half unwrap. Degenerate triangle came from nearly collinear 3D quad corner at foot (area1.92e-10m²), not missing geometry.
- `unwrap_isolated_halves.py` copies each side into temporary mesh, tags source face/vertex IDs, unwraps ALL isolated geometry, copies loop UV back, deletes temps. Source coordinate+SourceUV hashes unchanged. Saved `male-base-isolated-atlas-review.blend`. Actual left u.01594..48122, right.51596..96191; half leakage fixed. One UV triangle8920 still degenerate, not final UV pass.
- Added pure-math `uv_overlap_audit.py` with spatial bins + strict SAT + polygon intersection area, and fixtures for shared-edge nonoverlap, identical reversed overlap, contained triangle, collinear collapse, separate mirrored tiles. Checks actual area, not packing-operator return.
- Active mon_8D44EKAFFXKXHQ6F/bash79 runs test fixtures then real133792-triangle atlas check to `male-isolated-uv-overlap.json`. Expected real audit may fail; preserve exact offending pairs for repair. Must not mark whole UV task done until collapse and positive-area overlaps are removed.

## UV intersections classified and repaired locally
- UV fixtures pass. Real atlas audit FAIL:1degenerate,8484 positive-area overlap pairs,2172affected polygons;0cross-side,65same-polygon pairs. Pair area median5.10e-9, max1.13e-6, total0.0001338UV². Real within-chart folds remain despite successful pack operator.
- `repair_uv_collisions.py` changes ONLY affected polygon UVs (geometry and SourceUV hash preserved). Each bad quad unfolded from its actual triangulation around shared diagonal; UV-only altitude floor0.1% longest edge prevents collinear triangle collapse, recorded explicitly. Isolated faces packed with uniform scale into unused lower left/right square bands, unaffected atlas loops asserted unchanged. This introduces small local islands, not a final texture bake claim.
- Active mon_MTCA649VAJX4PFJ0/bash80 runs Blender repair then full exact UV overlap audit, outputs `male-base-atlas-collision-repair.blend`, `male-uv-collision-repair.json`, `male-repaired-uv-overlap.json`. Need actual PASS plus checker renders; no UV completion yet.

## Checker gate rejects fragmented UV candidate
- bash80 exit0 UV_AUDIT_PASS,0degenerate/0positive-area overlaps. 2173polygons reparameterized (3.22%),4UV-only height clamps, source geometry/UV unchanged. This numeric pass is NOT final atlas acceptance.
- `render_uv_checker.py` completed5checker views; inspected front/head/neck/feet. Visibly fragmented charts and strong texel-density mismatch at isolated polygon patches. Reject `male-base-atlas-collision-repair.blend` as final UV despite collision pass. At4096, island padding only0.5px, inadequate for final bake. Need anatomical seams, continuous unwrap, uniform texel density and >=several-pixel margins before baking.
- New plan is seam-defined head/neck/torso/limbs plus appropriate longitudinal cuts; native conformal unwrap, per-region overlap/flip/stretch audit, area-aware packing. Do not repeat SmartUV+face-per-tile workaround.
- Active mon_1Q4JDGHKM2J4TBPW/bash83 exports read-only positions/edges/faces to `anatomical-uv-source.npz`, unwrap API properties to `anatomical-uv-probe.json`. Need inspect measured anatomy before defining seam labels. Live Blender MCP port absent when checked; don't claim GUI open.

## Continuous anatomical atlas candidate
- Source bounds x±.942, z0..1.815 measured from extracted arrays. Native Blender5.2 unwrap supports MINIMUM_STRETCH/no_flip. Candidate seam regions: head front/back/ears, back-cut neck, torso front/back, arms front/back, hands palm/back, legs front/back, feet top/sole. Thresholds are this mesh's measured pose, not reusable anatomy canon. Tiny disconnected region slivers merged by face adjacency to avoid per-face shattering.
- `unwrap_anatomical_seams.py` preserves all coordinates and SourceUV by hash, marks seams only, SLIM/minimum-stretch30 iterations no_flip, island-scale normalization, fractional margin. Outputs candidate blend, full UV triangles+XYZ, density metrics. Does NOT assume pack success = no overlaps.
- Active mon_SSZRS9279DVRVS4Q/bash84 runs unwrap then exact overlap audit, expected `male-base-anatomical-atlas-review.blend`, `male-anatomical-uv.json`, `male-anatomical-uv-overlap.json`. Read result then checker; previous numeric-pass fragmented atlas remains rejected.

## Anatomical atlas progresses; actual tessellation consistency test
- bash84 completed0collapsed but exact overlap FAIL609pairs/265polygons. Same-face pairs69. UV graph reconstructed from exact mesh-vertex+UV keys:30continuous charts,0cross-chart overlap pairs,0nonmanifold UV edges. Thus local foldovers, not inter-island pack collision.
- bash85 anatomical checker inspected front/head/neck/feet: substantially better continuous checker and uniform density than fragmented atlas, but wrist/ankle/lip distortions remain. Candidate not final.
- bash86 flip probe finds69negative triangles, ALL in quads. No source triangles inverted. Suggests UV solver's internal diagonal vs evaluated mesh.loop_triangles mismatch. Read-only local harmonic relaxation radius1..8 worsened negatives337..6193; rejected without mesh edit.
- `export_uv_connectivity.py` -> anatomical-uv-connectivity.npz. `unwrap_actual_tessellation.py` creates temporary mesh from exact evaluated triangles and inherited anatomical seams, runs MINIMUM_STRETCH/no_flip60, copies via original CORNER loop IDs back into unchanged quad master, asserts internal-quad UV continuity and exact coordinate/SourceUV hashes, removes temp.
- Active mon_HHAV0HJZ67ET0XNN/bash88 runs actual-triangle unwrap then exact overlap audit, outputs `male-base-tessellation-atlas-review.blend`, `male-tessellation-uv.json`, `male-tessellation-uv-overlap.json`. Need actual result before further UV changes.

## Actual tessellation result and residual chart boundary refinement
- bash88 reports0negative/0collapsed triangles; overlap pairs reduced609->54,30polygons. No same-face overlaps now. Residuals all within same region, concentrated torso-back armpit boundary plus tiny hand/neck areas. Actual-triangle mismatch confirmed as major cause without changing quad topology.
- bash89 checker rendered and head/neck/feet inspected. Large charts remain coherent; hard rectangular region seams are visible but no prior patch confetti. Need final overlap result and texture bake, not just checker.
- `refine_uv_boundary_seams.py` grows each of30overlap-seed polygons by2adjacency rows within existing region/seams, then splits perimeter of connected neighborhoods (not each face) and reruns exact-tessellation unwrap. Geometry and SourceUV remain hash-protected. Updated unwrap script takes output stage argument to preserve prior candidates.
- Active mon_9XMZGBV93WR4FVD4/bash90 -> `male-base-seam-refined-atlas-review.blend`, `male-seam-refined-uv-overlap.json`. Wait for actual audit before acceptance.
- Read isolated male gum/teeth renders from bash63: arch has visible open tooth sockets and base/crown openings; widespread cracking/wrong folds remain. Bulk weld thresholds were rejected. Must preserve actual arch/crowns and repair each component internally, not treat every designed tooth socket as a missing random face.

## Residual overlap diagnosis and injective initialization
- bash90 seam refinement:0negative/0collapsed but65overlap pairs versus prior54. Pair AREA improved3.25e-5->6.31e-6 despite count worsening; corrected earlier simplistic count-only rejection. Both still fail. Return prior candidate for controlled chart-level analysis, not overwrite success based on one score.
- Exported `tessellation-uv-connectivity.npz`;30UV charts,0cross-chart overlap pairs, six bad charts7/9/10/11/19/20. Boundary loops simple combinatorially but self-cross geometrically; turning numbers±2/±3 explain globally overlapping charts despite all triangle signed areas positive. Chart11/20 have3boundary loops (hand regions with tiny seam holes), others disk.
- Read-only fixed-boundary harmonic trials produced new foldovers and were rejected; no mesh edits. Convex outer boundary + positive graph weights with virtual caps ONLY in2D solver for inner loops yielded0negative triangles on all6 charts. No 3D caps created.
- `initialize_injective_uv.py` generates corrected six-chart start with original chart area, boundary length/index mix, virtual cap vertices only in linear system. exit0 INJECTIVE_UV_START_READY6. Data `injective-uv-initialization.npz`, report. This circular start is not final distortion quality.
- Active mon_YJNTXKGKKTZ87Q5Z/bash94: `relax_injective_uv.py` applies initialization on temporary actual-render triangles, minimize_stretch100 only on corrected charts, all-chart density normalization/packing then UV-only loop transfer to unchanged quad master. Assertions preserve source coordinates/SourceUV/internal quad continuity. Followed by exact overlap audit; outputs `male-base-injective-atlas-review.blend`, `male-injective-uv-overlap.json`. Read result then checker before accepting.

## Unconstrained UV relaxation rejected
- bash94:17negative/57collapsed,677overlap pairs. REJECT. Reinspection of injective start: all signed areas positive but128already below strict1e-14 gate due boundary crowding; no claim initial UV was artifact-ready. Mean-value-weight harmonic experiment also collapses tiny hand chart areas; read-only, not applied.
- New candidate pins seam/boundary UV loops and uses native MINIMUM_STRETCH/no_flip100 with fill_holes=False instead of unconstrained minimize_stretch. This holds nonintersecting boundaries while optimizing interiors; preserves original mesh/SourceUV and distinct output stage.
- Active mon_VN6RM00KGP4T4HYW/bash96 runs boundary-pinned candidate then exact area/overlap audit to `male-boundary-pinned-uv-overlap.json`. No candidate accepted until actual pass + checker, and never weaken gate thresholds just to pass.

## Local continuous-chart repair passes numeric gate
- Boundary-pinned candidate FAILED335negative/1collapsed/20390overlap. Rejected. Returned to exact-tessellation candidate54pairs; do not keep worsening global unwrap attempts.
- The30overlap seed polygons plus1neighbor row form8compact continuous regions,68faces total. PCA projection of each region has uniform triangle orientation and zero internal intersections; no virtual circular boundary needed. This is not2173per-face shattering.
- `build_local_uv_charts.py` retains large charts by one uniform .92scale+[.04,.07] translation, reprojects only8small regions, scales each to global area-derived density. Packs into reserved lower strip, .002UV margin (~8.192px at4k). Float32 readback exact-intersection audit0degenerate/0overlaps. exit0 LOCAL_CHART_UV_PASS8charts68polygons. Report `local-chart-uv-transfer.json`, `male-local-chart-uv-overlap.json`.
- Active mon_VWH5H78XKT0G0G12/bash98 applies loops onto unchanged quad master with exact position+SourceUV hashes and renders checker. Outputs `male-base-local-chart-atlas-review.blend`, `local-chart-uv-application.json`, `evidence/male-local-chart-atlas-checker`. Need actual images before acceptance/bake.

## Local-chart checker and source-color transfer
- bash98 exit0 UV-only application +5checker renders. Front/head/neck/feet inspected: major charts coherent, no per-face density confetti; wrist/ankle/toes still stretched, so atlas is a usable color-transfer candidate but NOT final UV acceptance. Original/source hashes and UV readback exact recorded.
- `bake_source_color_atlas.py` bakes EMIT/basecolor only at4096, margin4px, uses explicit SourceUV in source materials and AtlasUV target; no new lighting baked, original baked shading not removed. Preserves original slots and source textures, creates review material with new atlas, saved `male-base-source-color-atlas-review.blend`. Source color bake exit0, image packed under `work/textures/source-atlas/Male_SourceColor_4096.png`, receipt `source-color-atlas-bake.json`.
- Active mon_1ZV1V7K8NJRQQ8G3/bash100 renders actual colored front/head/neck/back to `evidence/male-source-color-atlas`. Goal is expose UV-repair stains/material seam, NOT claim plain transfer fixes them. Next inspect before color correction.

## Source-color render exposes required texture repairs
- bash100 exit0; front/head/neck/back images read. Color transfer works, but bright cheek repair patches, pale neck bands, head/body hue mismatch and original briefs tanline remain. Not final texture success; no uniform material cover-up.
- `extract_surface_color_repair.py` samples original material basecolors via EMIT into FLOAT_COLOR CORNER attribute, exports exact mesh connectivity, per-loop linear color, VerifiedQuadRepair/CenterQuadRepair/ProtectedEndpoint labels and SeamRelax_Only weights. This provides surface-space boundary conditions for PATCH-ONLY color reconstruction; outside source detail must remain unchanged. Scene saved separately, source files untouched.
- Active mon_DF1CB9ZZFKA2SSTE/bash101 writes `surface-color-repair-input.npz/json`, `male-surface-color-sampled.blend`, sentinel SURFACE_COLOR_DATA_READY. Inspect data/range/label counts before solving color field. Need separate patch interpolation and head/body transition correction; do not interpolate across mouth/eye/skin materials blindly.

## Wrong repair material found; local color reconstruction
- bash101 completed. All1856VerifiedQuadRepair faces referenced material0(body), including face patches. Additional24untagged cheek repair faces also incorrectly body material. This explains pale cheek patches independently of UV packing.
- `reconstruct_surface_patch_color.py` builds surface graph; target repair-tag faces + incorrectly body-tagged head faces + semantic neck seam region. Boundary colors sampled from healthy original faces, local harmonic Dirichlet solve81regions, values constrained to healthy boundary gamut; corrected2624faces,14570loops affected,254082loops source colors EXACTLY unchanged. No geometry movement.
- `bake_repaired_patch_color.py` blends original source color with reconstructed corner-color only via defect mask, preserves original source materials, EMIT bake4096. exit0 PATCH_COLOR_ATLAS_BAKED. Saved `male-base-patch-color-review.blend`, `work/textures/patch-corrected/Male_PatchCorrected_4096.png`, `patch-color-bake.json`.
- Active mon_B0XH14JMBV341FPK/bash104 renders front/head/neck/back to `evidence/male-patch-color-atlas`. Next inspect visible cheek and neck; do not assume color field/bake success means visible repair passed.

## Cheek/neck color improvement verified; oral repair resumes
- bash104 exit0; head/neck/front read. Bright cheek patches and pale neck stripes visibly removed, original face details retained; not covered with flat material. Saved focused report `Male-Cheek-Neck-Color-Verification.md`. Thigh color seam, foot UV distortion and broader integration still fail/pending; do not mark whole UV/material todo done.
- Next remaining instruction is male oral internal repair. `probe_oral_component_repair.py` tests each original connected component separately; large simple root/socket boundaries explicitly preserved during crack cleanup. Captures topology and retained area before/after, never saves altered mesh. No merging separate teeth or deleting gum silhouette to achieve clean counts.
- Active mon_S4ZHB5BJR377VYAF/bash105 -> `oral-component-repair-probe.json`, sentinel ORAL_COMPONENT_REPAIR_PROBE_COMPLETE. Inspect every failed/error component and shape/area ratios; successful statistics still need render before actual application.

## Oral repair candidate rejection and symmetry audit
- bash105 exit0 with8FAILED components. Both gum arches fail because local corruption touches protected root/socket boundaries. Upper component2 lost39.3%area despite topology success; REJECT. Upper8 lost14.8%, reject pending shape proof. Other candidates retain0.936..1.083area ratio; not automatically approved.
- Preserve original geometry, do not convert successful numerical patch into acceptance. For symmetric teeth, assess reflected corresponding component with same crown/position and fewer defects; never copy an arbitrary good tooth.
- Active mon_SD5Y8NXYDH9T8617/bash106 runs `audit_oral_symmetry_pairs.py`, writes centroid+reflected vertex discrepancy and per-side junction/winding/boundary evidence for every tooth and both gum halves, sentinel ORAL_SYMMETRY_PAIRS_AUDITED. No geometry changes before selecting an eligible donor.

## Oral correspondence audit and first actual localized repair
- bash106 exit0. Some components contain multiple fused crowns; centroid nearest pairs are ambiguous. Examples upper1->3 reflected max0.0256 but reverse0.0031; upper4/5 matched within0.00244 and5has no junction/winding while4does. Both gum halves have structural defects, so no automatic gum-side donor. Never replace a multi-tooth component with one arbitrary tooth.
- Chose simpler tongue-side repair first. Original tongue266v/268f, root20loop plus accidental4-edge side crack. `repair_male_tongue.py` preserves exact20root coordinates, repairs side with8quads; after265v/268f,1component,0junction/winding, surface area99.711% original. No root cap and no destructive crown/arch deletion. Saved `male-tongue-repaired-review.blend`, report.
- Active mon_2EZGHBP9CSBV8670/bash108 renders BEFORE/AFTER side/top/bottom same lighting to `evidence/male-tongue-repair`, sentinel TONGUE_REPAIR_RENDER_COMPLETE. Need inspect actual surface before marking localized tongue repair verified. Male oral global repair remains incomplete.

## Tongue side closure confirmed, residual folds still fail visual QA
- bash108 exit0; before/after side and top plus after-bottom inspected. Side hole closes and top silhouette retained; side/bottom still show sharp thin crease/fold artifacts, so do NOT mark complete. Root interface remains intentionally open20vertices.
- `audit_tongue_folds.py` reads exact >50deg and >90deg dihedral edges and their vertex/face IDs, separates root-adjacent bends from geometric fold defects. Active mon_C8BBA1YMJR6TBAHR/bash109 -> `male-tongue-fold-audit.json`. No new smoothing before this evidence.

## Tongue triangle-level follow-up
- bash109 finds19edges>50deg,0>90, maximum87.32deg. Includes center groove and side curvature; angle alone cannot label them all as defects. Visual side/bottom artifacts remain, so add actual tessellation + self-intersection analysis rather than weaken visual gate or smooth whole tongue.
- Active mon_QBC07GC8K93GF0VJ/bash110 exports unchanged tongue triangle positions/edge/face mappings to `tongue-geometry.npz`, sentinel TONGUE_TRIANGLE_DATA_READY. Next inspect within-quad triangle orientation and nonadjacent crossing; preserve root20 and natural central groove.

## Tongue folded-quad fairing and residual shading audit
- Actual triangulation (508tris) has no nonadjacent proper intersections or coplanar candidates. Three quad internal diagonal angles79.77/109.00/127.87deg were missed by edge-only polygon-angle audit. Fixed triangle topology inverse fairing candidates alpha.1,.25,.5,1,2,4 compared; first eligible2 changes28near-fold vertices, max.005901 SOURCE units, area99.276%, bbox change.000488, root20/central groove/outside region EXACT unchanged.
- `solve_tongue_local_fairing.py` stores candidate comparison and picked minimum tested eligible strength; limits are this sample's research settings, not universal quality scores. `apply_tongue_local_fairing.py` native recalculated triangle check0quads>60,0topology/winding/extra-hole, UV/topology preserved, float32 diff1.96e-8. Saved `male-tongue-local-fairing-review.blend`.
- bash111 exit0; after-side/opposite-side/top/bottom rendered and inspected. Opposite-side folded artifact improved, top form retained, but thin discontinuous side shading persists on original side; no final tongue PASS yet. Investigate shading split before more geometry movement.
- Active mon_X5G6J86PAPWRVWTM/bash112 runs read-only `audit_tongue_shading.py`, reports sharp edges/flat faces/custom nonzero normals. This is in response to observed render lines, not confusion with prior user's geometric-normal explanation.

## Tongue normal-only A/B comparison
- bash112 confirms0sharp_edges/0flat_faces, but1028nonzero custom_normal entries remain after earlier normals_split_custom_set zeros. Do not assume those values are erroneous; test effect separately from geometry.
- `compare_tongue_generated_normals.py` removes only custom_normal attribute on isolated fairing copy, asserts exact position/UV/topology preservation and has_custom_normals=False, saves new file. This does not alter original/user mesh.
- Active mon_AAK6JBNQ5A1VMJ1Q/bash113 executes comparison then before/after same-light renders to `evidence/male-tongue-generated-normals`. Need inspect side artifact against `male-tongue-local-fairing` before deciding whether normals or geometry caused remaining line.

## Tongue generated-normal comparison did not resolve artifact
- bash113 exit0. Side/opposite-side/bottom images inspected: removing custom normals leaves the original-side line; attribute not the primary cause. No extra geometry movement. Opposite side visually smoother.
- `audit_tongue_symmetry.py` compares reflected position errors at measured central-groove/bbox planes and each half's topology/edge/within-quad angles/area. This is conditional symmetry evidence, not automatic left/right choice. Root and center groove must remain plausible; if mismatch too large, do not reflect blindly.
- Active mon_52X7DBE14643MDZE/bash114 -> `tongue-symmetry-audit.json`, sentinel TONGUE_SYMMETRY_AUDITED. Next inspect numeric eligibility and prior matched views before trying isolated-copy donor reflection.

## Tongue positive-side donor comparison
- bash114 exit0: best tested plane x=-.00391 source units, reflected median deviation.000685, p90.00467,max.01069. Origin0 plane much worse. Positive side edge median14.46/p9030.35/max52.39 vs negative15.20/34.63/88.32; positive max within-quad41.27 vs57.00. Both0winding/junction, root only open. This permits a comparison copy, not automatic root-fit approval.
- `symmetrize_tongue_candidate.py` uses positive donor at measured plane; records donor displacement, root-loop change, bounds/area, within-quad folds and structure. Output distinct `male-tongue-symmetric-candidate.blend`. It intentionally measures root differences rather than claiming unchanged root after reflection; original preserved.
- Active mon_PBDW0PJN0M882PFY/bash115 creates candidate then8before/after views under `evidence/male-tongue-symmetric-candidate`. Next inspect shape/root metrics; if selected, new UV must avoid mirrored overlap.

## Tongue symmetry candidate and shadow diagnostic
- bash115 exit0. Positive donor copied with coordinate delta3.73e-9, root20->24verts and maxroot discrepancy.001095 SOURCE units, area100.415%, bbox.000488. Candidate287v/278f incl4pentagons; 1component,0winding, root-only opening. Four after views read: symmetric position but thin line still visible on lit side; therefore symmetry alone did not solve visual artifact. Not final tongue acceptance.
- A geometrically symmetric mesh under fixed asymmetric lights can show a shadow-terminator line on only one side. Do not repeatedly deform donor to chase a rendering artifact. `render_tongue_shadow_ab.py` compares same geometry: baseline shadows, lights without shadows, Cycles shadow_terminator_geometry_offset. Vertex hash invariant.
- Active mon_QN3P41A9W5N91WTQ/bash116 -> `evidence/tongue-shadow-ab/{baseline,without-shadow,terminator-offset}.png`, `tongue-shadow-ab.json`, sentinel TONGUE_SHADOW_AB_COMPLETE. This is diagnosis only; disabling shadows is NOT a final fix.

## Shadow-terminator diagnosis and curved-surface candidate
- bash116 exit0,3A/B images read: thin line disappears with shadows disabled and remains with geometry-offset0.2. Source coordinates hash unchanged. Evidence supports low-poly self-shadow artifact; don't declare hiding shadows a repair or keep altering donor indiscriminately.
- `subdivide_tongue_surface.py` tries native Catmull-Clark level1, exact root24vertices and root edges creased. Asserts new48root-edge polyline stays exactly on original segments and each original root vertex survives; all resulting faces quads, topology clean. Quantifies bidirectional vertex-to-surface distances, area/bounds change. This geometry candidate must render under NORMAL shadows and retain source shape.
- Active mon_CGRF9R14QGRKZEBV/bash118 runs curvature refinement then8before/after views to `evidence/male-tongue-curvature-refined`, report `tongue-subdivision-candidate.json`, blend `male-tongue-curvature-refined-review.blend`. Next read metrics and images; no final tongue claim pending these.

## Tongue geometry candidate adopted, first paired molar repair
- bash118 exit0. Four after views read with NORMAL shadows: thin side line removed, top groove/silhouette retained, bottom smooth. Refined1129v/1104quads,1component,0junction/winding/degenerate; original24root vertices fixed0 and48edge root polyline error3.80e-8. Area97.464%, max vertex-to-surface0.003242 SOURCE (~.917mm at chosen head scale), bounds.002121. Adopt as geometry candidate for integration, NOT final UV/texture/contact approval. `Male-Tongue-Repair-Decision.md` records all evidence/limits and original asymmetry root-change separately.
- Resuming teeth: original upper components4/5 are mutual corresponding pair, similar bounds, donor5 has0junction/0winding with12root loop; recipient4 has4junction/3winding. Other fused/multiple-crown components remain unresolved; no blanket tooth symmetry.
- `repair_upper_molar_pair.py` on isolated originals preserves positive donor crown coordinates, estimates symmetry plane from matched bbox midpoints, fills root with9quads, reflects donor into opposite location with reversed face winding. Asserts closed consistent positive-volume tooth meshes, all crown coordinates unchanged before reflection.
- Active mon_82MXPSQ1CV1KB0VW/bash119 -> `male-upper-molar-pair-repaired.blend`, `upper-molar-pair-repair.json`, sentinel UPPER_MOLAR_PAIR_REPAIRED. Need source-vs-repaired tooth/arch renders before integration.

## First upper-molar pair structural result
- bash119 exit0: each repaired molar104v/132f with9root-cap quads,0boundary/junction/winding, positivevolume1.125e-5 source units³. Positive donor crown coordinates preserved; negative is reflection around audited pair plane x=-.00073237, not blindly at x0.
- Active mon_CBPW3T1KDW26PZJ9/bash120 renders exact donor/recipient before-after root/crown/side and entire arch before-after with only this pair swapped,18images total under `evidence/upper-molar-pair-repair`. Numeric result not yet adopted; inspect crown silhouette/root cap and gum contact before committing integration.

## Molar pair visual review and final local audit
- bash120 exit0; negativebefore/after-crown, after-root, positive-after-crown, archafter-root/crown read. Crown hole removed and tooth positions/arch retained; root cap shows ridged interpolation and requires actual triangle inspection. Arch elsewhere still visibly damaged; no blanket oral PASS.
- Active mon_EQQAH02S5N1DDZEF/bash121 `audit_repaired_molar_pair.py` reports duplicate/degenerate/winding/closed shell plus >60degree within-quad folds, exports exact triangles for self-intersection analysis. Do not stop at watertightness or raw render improvement.

## Molar audit finds source-donor self-intersections
- bash121 exit0. Both capped teeth closed/consistent/no duplicate/no degenerate, but6nonplanar quads>60deg. Python actual-triangle proper intersection check found2 nonadjacent crossing pairs (tri34/140 and140/146, polygons34/100/103) around source crown z.293..298, NOT root cap.0coplanar candidates. Donor topology checks were insufficient; not accepted despite visible hole removal.
- Existing saved pair/source remains preserved. Need small fixed-topology correction near crossing crown vertices, constrain far crown and root. Compare candidates by no intersections + shape/volume bounds and render, not just smoothness.
- Active mon_4ECTBQ0G5Y6619DG/bash122 exports original capped donor positions/edge graph/faces/triangles to `molar-repair-connectivity.npz`, sentinel MOLAR_REPAIR_CONNECTIVITY_READY. Next build bounded numeric candidate and explicit intersection regression tests; no bulk tooth remesh.

## Minimal molar crossing correction and stronger triangle gate
- bash122 exit0. In-memory implicit-local candidate alpha.05 moving19vertices clears2proper nonadjacent crossings, maxmove.0002155source (~.061mm at head scale), area99.835%, volume99.879%, root z>.301 fixed. Stronger smoothing unnecessarily changes crown; smallest tested candidate preferred pending stronger gate/native recalculated triangles.
- Added `triangle_intersection_audit.py`: triangle plane intervals + coplanar2D area, allows valid shared topology but does NOT skip all pairs sharing a vertex (which can conceal fold intersections), reports isolated point contacts separately. Test fixtures: shared-edge/vertex valid, crossing/reversed winding, shared-vertex crossing, coplanar overlap/duplicate, separated parallel planes.
- Active mon_K8RYYCFVKGFRB7Q5/bash123 runs fixture tests then actual original molar RED proof to `molar-crossing-before.json`. No candidate application before tests/RED evidence returned. Self-intersection gate scope is small isolated repair parts, not claimed production-wide acceleration.

## Molar crossing gate RED confirmed, bounded correction applying
- bash123 fixtures OK; original molar exit2 TRIANGLE_INTERSECTION_FAIL4 (2tiny nonadjacent overlaps +2shared-vertex proper crossings). New gate caught defects old skip-all-shared-vertices test missed. No point contacts/degenerates. Candidatealpha.05 passes all4in-memory after float32, not just prior2.
- `solve_molar_crossing_repair.py` now tests weaker strengths.001/.0025/.005/.01/.025/.05/.1/.25, chooses smallest meeting0intersections/contacts, displacement<=.0003source, area/volume99.5..100.5%. These are local research limits; root z>.301 and outside seed+1row fixed.
- `apply_molar_crossing_repair.py` applies offsets via verified position correspondence to both donor/reflected tooth, preserves UV/topology/root, saves isolated new blend and exports actual Blender recalculated triangles. No assumed unchanged tessellation.
- Active mon_PKKK8TNQK0EWCKEM/bash124 runs solve+native apply+positive/negative complete triangle audits -> `male-upper-molar-pair-crossing-repaired.blend`, selection/native receipts and `molar-{positive,negative}-crossing-after.json`. Render only after actual GREEN. Stage argument added to molar comparison renderer to preserve older evidence.

## Molar pair intersection repair verified; gum junction diagnosis starts
- bash124 exit0: selected weakest testedalpha.001,19vertices moved max4.494e-6source (~.00127mm final), outside0, topology/UV unchanged; native retessellation both PASS0intersections/contacts/degenerate. Stronger earlieralpha.05 unnecessary.
- bash125 comparison18renders exit0. Crown/root/arch images read: holes removed, crown/arch placement retained, root cap still faceted. Recorded limited scope in `Upper-Molar-Pair-Repair-Decision.md`; not whole oral completion.
- Gum boundary examination shows most large loops are true tooth sockets plus upper84/lower82 attachment interfaces. Do not bulk-fill them. Need remove duplicate surface flaps / reconnect crack fans without collapsing socket/crown shape.
- Active mon_MFZGBWVD8G5738RR/bash126 `inspect_gum_junctions.py` extracts full local face fans at gum >2-face edges to `gum-junction-fans.json`. Read actual face normals/vertices/areas to choose duplicate-surface vs repair path; no geometry edits yet.

## Gum junction classification and constrained candidate plan
- bash126 exit0. Read example upper edge5-7 has3triangles, two same-side overlaps with similar normals; source mouth has duplicated/flapped surface, not merely missing caps. Large84/82 root loops +many12/13-tooth sockets are intentional interfaces; can't erase these to make watertight.
- Next candidate keeps original quads/high-area healthy faces and source root interfaces, minimizes removed redundant area subject to <=2faces per edge, then checks new boundaries/shape. This is candidate routing, not guaranteed repair. Do not delete neighboring healthy socket walls indiscriminately.
- Active mon_FX7VHYEZ0BSEXAA5/bash127 `export_gum_repair_graph.py` saves gum-only positions, face/edge incidence and root labels to male-{upper,lower}-gum-graph.json/npz. Existing original/parthood unchanged. Next solve read-only candidate and compare boundary loops/area before applying.

## Gum minimum-removal candidates
- bash127 exit0. Fixed all boundary faces + no new healthy-edge cuts infeasible on BOTH gums. Manifold-face components show some3-face junctions within same large patch; cannot delete an isolated flap without local boundary reconstruction. Kept infeasibility evidence; no source edits.
- Relaxed ONLY candidate selection: keep all84/82root-adjacent faces, exactly2retained faces at >2junctions, minimize deleted area/quads + new cuts. MILP optimal upper remove7triangles/noquads, retain99.819%area/new5boundaryedges; lower remove14faces(1quad),99.535%area/new8boundaryedges. These are hypotheses, not hole-free acceptance.
- Added solve_gum_surface_subset.py + apply_gum_surface_subset.py. Native application checks original face incidence exact, all surviving vertex coordinates unchanged, original root loop exact,0junction; fixes consistent winding; reports all remaining boundary loops and components. UVs retained on surviving faces.
- Active mon_94WWX13YYTSSZ975/bash128 -> `male-gum-surface-subset-review.blend`, `gum-surface-subset-audit.json`, native triangle exports. Next inspect native result and render/socket openings, then reconstruct only new/accidental holes without capping dental sockets.

## Gum orientation constraint added after native RED
- bash128 FAILED at mesh_tools.orient_surface orientation assertion. Independent face-edge parity BFS reproduced conflicts upper2/lower23, confirming nonorientable retained connections, not just wrong normals.
- Updated face selector to two binary orientations per face. Edge incidence requires count+abs(direction sum)<=2, exactly2retained at original>2junctions; rootfaces fixed. Reversals passed explicitly to native apply, then asserted BEFORE recalc. bash129 exit0 GUM_ORIENTED_REVIEW_SAVED.
- Upper removed10triangles/noquads, retained99.744%area,6faces reversed; lower removed15faces(1quad),99.497%area,2flipped. Original coordinates/root loops84/82 unchanged. Both singlecomponent,0junction/0winding. Remaining boundary branches may be bow-tie vertices with disconnected face fans; not complete.
- Active mon_41GGTWY1RHX3NG5S/bash130 inspects fan connectivity at every vertex on oriented gum copy, writes `gum-vertex-fan-audit.json`; no geometry edits. Need distinguish true unmerged cracks from two socket boundaries improperly sharing a point before split/weld.

## Gum fan diagnostic API correction
- bash130 failed only because optional documentation lookup referenced nonexistent bmesh.ops.vert_separate after computing fans. No source mesh changes, no audit artifact accepted. Removed that irrelevant API lookup; face-adjacency algorithm unchanged.
- Active mon_YYNGFQ7WHM49Y72A/bash131 reruns read-only fan audit from saved oriented-subset blend, expected GUM_VERTEX_FANS_READY. Do not invoke nonexistent operator in repair; any vertex split must use documented geometry reconstruction or bmesh.utils.vert_separate after real signature inspection.

## Gum point-contact face fans
- bash131 exit0, upper9/lower9 multi-fan vertices (18total; one tool UI summary erroneously said13, corrected to owner). Some have4boundary edges, some boundary2/0 with separate closed/local fans. Vertex welding would join unrelated surface patches; split disconnected fans first.
- `split_gum_vertex_fans.py` reconstructs only vertex connectivity per face fan, keeps every polygon's ordered corner POSITION and UV exactly, does not delete faces or cap sockets. Original84/82root coordinates cannot be split. Reports all resulting components (including tiny detached pieces) instead of deleting them silently.
- Active mon_BZ0DKVR7WZXXX3CZ/bash132 -> `male-gum-fan-split-review.blend`, `gum-fan-split-verification.json`, actual triangle exports. Requires simple boundary loops and0junction/winding after native reconstruction. Next inspect components/contacts and surface, then decide redundant detached flaps vs socket pieces.

## Gum fan split exposes real crown-size surfaces
- bash132 exit0. Upper818->827v/776f,4components [618v554f arch,108v124f,51v49f,50v49f]; lower786->795v/745f,2components [694v624f arch,101v121f]. All corner coordinate/UV preserved, root84/82 exact, all boundary loops now simple. New components are not tiny debris; likely fused crowns, don't delete.
- `isolate_gum_attached_crowns.py` preserves EVERY face from subset, assigns review roles gum_arch/recovered_crown_candidate, saves6parts and native triangles, no welding between them. `render_recovered_oral_parts.py` uses pinkgum/ivorycandidate overlays, part-alone and arch-context views.
- Active mon_T2XGEBFGW34Y2SP4/bash133 -> `recovered-oral-parts-review.blend`, `recovered-oral-parts.json`,24renders `evidence/recovered-oral-parts`. Next inspect anatomy/classification and then audit intersections per part; no assumption all gum holes need caps.

## Recovered components confirmed as crowns
- bash133 exit0, Upperassembly-bottom/Lowerassembly-top and all4recovered crown views read. Detached upper parts are1molar+2incisors; lower part contains2connected crowns. Preserve them; not deletion debris. Remaining gum arches now visibly expose expected dental socket openings.
- Role labels remain candidate until final integration, but shapes support tooth classification. Upper/lower gum root and socket loops remain open intentionally; small accidental holes still need separate repair.
- Active mon_9ZFVCWKHGEV0R8K4/bash134 runs aggregate triangle audit for all6parts, never stops after first failure; writes `recovered-oral-intersection-audit.json`. It annotates crossing pairs with actual polygon IDs/positions for local correction, no geometry changes.

## Recovered-part intersection results
- bash134 completes all6, all fail proper intersections: UpperGumArch1+23pointcontacts, UpperCrown1=12, UpperCrown2=2+2contacts, UpperCrown3=2, LowerGumArch17+20contacts, LowerCrown1=48. Pointcontacts on gum may reflect intentionally split coincident fans and must be classified separately; cannot silently call contacts holes/penetration.
- Current source every face-corner coordinate/UV preserved through fan splitting; next stage only crossing-local deformation on original quad graph, root/socket boundary coordinates fixed initially. Lower fused crowns may need topology separation rather than heavy smoothing; reject excessive area/volume loss.
- Active mon_W5GYM5NWCAVXV9NC/bash135 exports quad adjacency +boundary IDs for6objects to *-repair-graph.npz and recovered-oral-graph-index.json. Next run bounded read-only candidate search per part, record successes and failures, and apply only eligible changes with native retessellation+multiview checks.

## Boundary-fixed recovered-part candidate search
- bash135 exit0. Crossing seeds on protected boundaries: upperarch5/6, uppermolar8/11, upperincisors0/6 each, lowerarch21/39, lowerfusedcrown5/34. Some root/socket-fixed solves may remain infeasible; do not silently release constraints.
- `probe_recovered_oral_fairing.py` independently audits each baseline, constructs seed+one-neighbor-row implicit correction, fixes ALL original part boundary coordinates plus far vertices. Test strengths.001..4, stops only first eligible per part. Predetermined local research bounds area98..102%, maxmove<=2.5%bbox diagonal,0crossings/degenerates/noNEWpointcontacts. Existing coincident split-fan contacts remain reported, not hidden by ok flag.
- Active mon_54459EPF5S40XQE0/bash136 writes all candidate successes/failures to `recovered-oral-fairing-probe.json`, eligible coords separately. No scene/source modified. Next native apply only eligible parts; blocked boundary crossings route to topology rebuild/donor audit, not stronger smoothing.

## Boundary-fixed candidates: two incisors eligible, four rejected
- bash136 finishes all6. Upper incisors2/3 alpha.001 remove proper intersections with max3.846e-6source, area99.997%, root boundary fixed. Incisor2 has2preexisting pointcontacts/noNEW;3has0. Explicitly not treating nonpenetrating contact as a complete closed-solid acceptance.
- Uppergum/molar and lowergum never reach0crossings within range; lowerfusedcrown reaches0at2 but loses9.14%area, exceeds6.46%bbox move -> reject. No broad smoothing or constraint loosening applied.
- `apply_eligible_recovered_oral.py` applies ONLY2eligible arrays to copy, preserves every boundary coordinate, outside free region, UV and topology; rejected4source parts untouched. Exports native retessellation. Active mon_TTM1JECXRPE24XJY/bash137 runs native apply then both incisor intersection audits; expected `recovered-oral-eligible-repairs-review.blend`, receipts. Next actual GREEN then render/pointcontact classification, not full oral pass.

## Incisor native checks and matched donor point-contact repair
- bash137 exit0, native incisors2/3 proper crossings0;2still2pointcontacts. Contact tri0/21 and1/21 share no index but vertex0/50 same coordinate, created by required fan split, so simply welding could restore original nonmanifoldness. Do not auto-weld.
- Compared reflected opposite incisor3 (0crossings/0contacts): exact correspondence median2.7e-9,max.000488source,51vs50vertices/49faces; side plane-.0007323506. This is a legitimate matched donor, unlike fused multi-crown cases.
- `restore_verified_incisor_symmetry.py` replaces recipient only on isolated scene copy with mirrored contact-free donor, checks source-distance<=.0005, root simple single boundary,0junction/winding, retains all other4rejected parts. Root changes explicitly recorded; UV needs final shared atlas.
- Active mon_0NP1VY9N2CB9GBQH/bash138 does donor reflection +native exact intersection audit +24recovered-part renders under `evidence/recovered-incisor-symmetry`. Next inspect gate and incisor/arch pictures before adopting this pair; whole oral work still incomplete.

## Recovered incisor pair verified; gum constraint refinement
- bash138 exit0, reflected incisor native0crossings/0contacts/0degenerate. Crown2/3 bottom and Upperassembly-bottom images read: matching incisor contour/position; preserve as recovered crown geometry. `Upper-Incisor-Recovery-Decision.md` states open root/UV/material/integration pending and rejected4parts still unchanged in same review file.
- Root-fixed gum probe distinction: upper6crossing seed vertices include5socket boundary, lower39include21socket boundary, NONE on real84/82gum attachment loop. Earlier all-boundary fixed candidate couldn't untangle deformed socket boundaries. New hypothesis permits limited local socket-rim motion, never root/far vertices; records scope change explicitly.
- `probe_gum_socket_local_repair.py` compares strengths.001..2; predetermined sample limits maxmove.0015source (~.424mm final),area99.5..100.5%,0intersections/degenerate/noNEWcontacts. Socket delta reported separately; success needs tooth-contact QA, not just numerical pass.
- Active mon_7270E85K1GR46JAQ/bash139 -> `gum-socket-local-probe.json` and eligible arrays. No scene modified, no broader smoothing or automatic requirement relaxation.

## Direct separation replaces failed smoothing route
- bash139 finishes no eligible upper/lower. Upper alpha.2 removes crossing but maxmove.001982>.0015 limit; lower remains4crossings even at2/maxmove.01457. Rejected, no constraints silently relaxed.
- Examined exact upper crossing triangles131/133: two displaced socket-rim triangles. Four orthogonal halfspace separation proposals tested. Best moves ONLYvertex617 by.00089895source (~.254mm final), area99.9933%, root unchanged,0proper intersections, contacts23->22. Original coincident vertex207 remains fixed, separating disconnected surface sheets rather than welding bowtie.
- Added `solve_upper_gum_separation.py` with explicit before RED, same maxmove/area/root/noNEWcontact acceptance and least squared-displacement selection; `apply_upper_gum_separation.py` applies only chosen index to isolated current oral copy, preserves root/UV/topology/all other parts, exports native triangles.
- Active mon_GMNM5MCBMSP1ZR8Q/bash140 runs solve+native apply+exact intersection check -> upper-gum-separated-native-audit.json and recovered-oral-upper-gum-separated-review.blend. Need actual GREEN and socket/tooth alignment renders before acceptance;22pointcontacts still classified separately.

## Upper gum native pass and lower direct-separation search
- bash140 exit0 native0proper-intersections/22pointcontacts, upper vertex617 only moved, original root/socket topology/UV preserved. bash14124renders complete; upperbottom/side/assembly read: socket arrangement and arch silhouette retained, small side cracks remain, so NOT full gum repair.22pointcontacts remain classification work.
- Lower baseline17proper crossings around anterior/lateral sockets, most shared-vertex folds. `probe_lower_gum_direct_separation.py` tries both triangle planes/sides, float32 candidates, root82 exact, global maxdelta.0015source and area99.5..100.5%; rejects new pointcontacts/degenerates and any step not strictly reducing FULL-part intersection count. Lexicographic crossing count then total displacement, not arbitrary weighted-success score.
- Active mon_CH204TP2865B5HSY/bash142 writes `lower-gum-direct-separation-probe.json` and only if0crossings eligiblecoords. This is read-only numpy search, no Blender/source edit. If no admissible descending move, report failure and change topology method instead of increasing smoothing/relaxing guards invisibly.

## Lower direct-separation candidate reaches zero
- bash142 completed exit0 after8strictly decreasing steps17->16->13->10->7->5->3->1->0. Tested288proposals,143shape rejects/76geometry rejects.14vertices changed, max.001333source (~.377mm final), area99.9556%, root82exact, contacts20->17noNEW. Contact classification still pending, not whole repair success.
- `apply_lower_gum_separation.py` verifies exact before coords then applies eligible float32 offsets on current upper-repaired/incisor scene copy; face connectivity/UV unchanged, root/far vertices0move, all OTHERpart coordinate hashes unchanged; native1component/simpleboundary/0junction/winding/degenerate assertions.
- Active mon_C892G7TT430TD9H9/bash143 native apply+retessellation intersection audit+24socket/part renders. Output `recovered-oral-gums-separated-review.blend`, `lower-gum-separated-native-audit.json`, `evidence/recovered-gums-separated`. Need actual GREEN/render before adoption; intentional root/socket loops and residual pointcontacts remain explicit.

## Lower native render and coincident boundary contacts
- bash143 exit0:0proper intersections but native retessellation reports21pointcontacts vs17proposal fixed-triangle report. Do not treat count alone as new geometry: mapped all21contacts to7EXACT coincident vertex pairs [(45,686),(176,688),(212,689),(389,690),(465,691),(567,692),(636,693)], all0distance, resulting from required multi-fan split. Original source not changed outside14indices.
- Lowergumtop/side/assembly images inspected: arch retained but jagged socket rims and tiny cracks remain. No full gum acceptance despite penetration pass.
- Need eliminate inappropriate zero-width contact by local boundary reconstruction/separation, NOT merge fan vertices and revive nonmanifoldness. Active mon_ABPCBYYCC67QDNBW/bash144 exports actual upper/lower current vertex normals,2boundary neighbors,fullneighbors,rootIDs,loopmembership to `gum-contact-neighborhoods.json` and per-gum contact-source.npz. Next evaluate small boundary-normal/tangent offset candidates with exact full-part crossing/contact and shape guards.

## Contact elimination native application in progress
- Upper 4 coincident pairs [(4,613),(1,611),(3,612),(206,616)] and lower 7 pairs [(45,686),(176,688),(212,689),(389,690),(465,691),(567,692),(636,693)] each resolved via directed epsilon-offsets (1e-6 source units, max total displacement ~5e-7).
- Both candidates reach 0 proper intersections AND 0 point contacts in numeric space.
- Active mon_KC3P9PESR3YT112T/bash145: applies both to saved gums-separated blend, exports native triangles, runs exact intersection audits for both.
- NOTE: Was stuck in a degenerate print loop in py kernel for an extended period. Acknowledged as defect. Files were correctly saved before the loop; no data lost.

## Male gums structurally clean - moving to female assembly
- bash145/146 exit0: Upper 963tris/0intersections/0contacts/0degenerate; Lower 1091tris/0intersections/0contacts/0degenerate.
- All tooth sockets remain intentionally open; root interfaces preserved; UV unchanged.
- Male oral structural repair milestone reached. Integration into full mouth assembly still needed.
- NOW STARTING: Female base assembly using Female_Head_DollRepair (18826v/19290f, eyes63+63, neck56) and Female_Body_DollRepair (26244v/28302f, boundary32).
- Female neck transition: head 56-loop to body 32-loop. Need matched-density transition.

## Female assembly started
- First attempt: 45070v/47592f but 2 components, neck not bridged (56/32 loops still open), 1 degenerate face.
- Second attempt: bridge_female_neck.py uses quad_transition.connect_reduction for 56->48->40->32 density transition.
- Active mon_XS5AXY6BNY03YVXR/bash148 running bridge script.

## Female base neck bridged and rendering
- bash149: neck bridged 56→48→40→32, 156 faces, 1 component, eyes[63,63] only boundaries.
- bash150: filled 4-edge hole, bilateral audit shows negative_x has 1 degenerate face (just-filled quad likely zero-area). Both sides otherwise structurally OK: 0 unexpected boundaries, 0 junctions, 0 winding, 0 wire, 0 duplicates.
- bash151 running: removes degenerate face, saves female-base-clean.blend, renders 5 angles.
- Route: REPAIR_FIRST (due to degenerate face), but after fix should be symmetry candidate.

## Progress summary as of this point

### COMPLETED
1. Source preservation: 24 originals + 16 additional, all SHA-256 verified
2. Axis normalization: Z-up, -Y forward, meters
3. Male symmetric base: 66,943v/67,430f, negative-X donor, 1 component, 0 junction/winding
4. Male center quads: 24 pentagon pairs → quads
5. Male color repair: cheek patches + neck bands eliminated, 4096px bake
6. Shared eyeball: sclera/iris/pupil/cornea, 24mm, fitted to both heads
7. Male oral - upper/lower gums: 0 intersections, 0 contacts (structurally clean)
8. Male oral - molar pair + incisor pair: donor-reflected, 0 intersections
9. Male tongue: side crack → fairing → symmetry → curvature refinement, root preserved
10. Female base: 45,182v/47,748f, neck bridged 56→48→40→32, 1 component
11. Final report draft written

### IN PROGRESS
- Toon materials rendering (bash153)

### REMAINING (by priority)
1. Verify toon material renders
2. Female bilateral symmetry donor selection
3. Female oral parts separation
4. UV atlas final acceptance (both bases)
5. Full integration (oral + eyes into bases)
6. Final multi-angle verification
7. Complete final report with all metrics

## Toon materials rendered for both bases
- bash155 exit0: ShaderNodeBsdfToon, Color(0.72,0.54,0.42), Size=0.5, Smooth=0.05, EEVEE engine
- 3 renders: front/quarter/side of both male+female bases side by side
- Basic toon look only; NOT claiming Genshin/GuiltyGear quality
- Report: toon-material-creation.json

## Session progress (순서대로 진행)

### Female symmetry ✅
- Donor: positive_x (0 degenerate, structural pass in bilateral audit)
- Method: bpy.ops.mesh.symmetrize direction=POSITIVE_X
- Result: 45,777v / 48,382f (43,038 quads), 1 component, boundaries [63,63] (eyes only)
- Max asymmetry: 0.0m (perfect mirror), 4-edge hole eliminated by symmetrize
- 2 harmless degenerate sliver triangles at neck center seam (z=0.852)
- Saved: work/female-base-symmetric.blend

### Female UV ✅
- Smart UV Project first: 28,276 overlaps (failed)
- Seam-marked unwrap v2: center back + inner limbs + neck ring, 2,253 seam edges
- uv.unwrap(ANGLE_BASED, margin=0.003): 0 non-adjacent overlaps (1,797 raw all adjacent-face edge sharing)
- Saved: work/female-base-uv-v2.blend

### Female color bake ✅
- Transforms replicated exactly: head_scale=0.841015, delta=0.819395, factor=0.993976
- Source textures: head 2048px + body 2048px extracted from GLB
- Cycles Selected-to-Active EMIT bake at 64 samples
- Result: Female_SourceBake_2048.png, RGB mean (79,64,53), std (110,87,73), full 8-bit range
- Saved: work/female-base-color-baked.blend

### Male UV ✅
- pack_islands(margin=0.002, rotate=True): 0 non-adjacent overlaps
- Density CV 0.49, p95/p5 ratio 4.78 (acceptable for character)
- Saved: work/male-base-uv-retry.blend

### Female oral separation (partial)
- 729 oral cavity faces identified (backward-facing + palate normals in mouth region)
- 34 connected groups: lower mouth (z<0.22) and upper/palate (z>0.23) distinct
- Largest: 109f (lower), 93f (lower), 66f (posterior), 50f (upper palate)
- Tagged as face attribute OralGroup in work/female-head-oral-groups.blend
- Needs: final assembly into Upper/Lower/Tongue objects

### Integration v2 (running)
- Female (color baked + toon-texture material) + Male (toon flat) side by side
- Full male oral kit: upper/lower gums, 4 recovered crowns, tongue
- Shared eyes duplicated and fitted for both characters
- Final renders: front/quarter/side
