# POC design context: shared intent, not runtime acceptance

Recorded 2026-09-07 from the stable design synthesis and v4 mockup, the
historical rubric verdict, and the current P0 scope. Delivery authority is
[ADR-001](../../docs/adr/ADR-001-repository-delivery-policy.md); only the owner
merges. This document does not change the active runtime implementation plan.

## Decisions needed on another machine

- The campaign loop remains the six verbs documented in
  [Campaign-Loop](../../docs/game-logic/Campaign-Loop.md). Ten UI passages
  (preset, recruitment, hub, conversation, strategy, travel, encounter,
  deployment, battle, settlement) are overlays, not ten Unity scenes or a
  third state machine. MainTitle and Foundation retain exclusive lifetimes.
- Target UI is uGUI Canvas with TextMeshPro, fullscreen world plus overlays.
  The v4 mockup is visual intent; its buttons and sample numbers are not
  runtime contracts. Canonical names remain in Design.md and UiElementNames.
- POC target: three stations, default wanderer trio and optional last
  station-master start. Six presets, sixteen-state strategy, full recruitment,
  relationships and capture systems shown in the wider concept are later
  design proposals, not shipped functionality.
- Campaign time advances only on confirmed travel/rest; inspecting menus is
  free. A node selection is not travel. Encounter choices show cost/effect/risk
  before commitment. Roster membership and deployment are distinct.
- Battle uses cardinal square tiles and terrain height. The target uphill cost
  is +1 AP per elevation step and high-ground ranged reach +1, not a universal
  hit bonus or imported hex/9-AP rules. Leftover HP must survive settlement
  and the next battle; this is a target, not a claim that this PR implements it.
- The owner-selected POC camera direction is yaw 45 / pitch 26.57 (2:1), with
  floor layer and within-floor height kept distinct. Historical 35.264-degree
  documents remain historical; this context sync does not edit serialized
  camera or genre settings. The runtime owner's lane handles that drift.

## Map and transition contract

Curated from `genre-map-structure.md` sections 10.1-10.3 in the local historical
research packet (2026-09-06). The source classifies by player verbs, not image
size or scene count. The source labels this an application proposal, not
implementation approval or runtime acceptance.

| Surface | Question | Boundary |
| --- | --- | --- |
| S: strategy schematic | Who controls the stations and what is the objective? | 2D schematic; selecting a node never moves the party. |
| W: travel graph | Where is the party going, at what time/supply cost? | Current location differs from selected destination; confirmation spends cost. |
| B: tactical board | Which unit acts on which cell now? | B1/B2 is a place layer, not camera height; battle time is not arbitrarily converted to travel time. |
| N: management/choice/result | Who prepares, chooses and receives consequences? | Not a fourth map just because a map is behind a panel. |

S -> preparation -> W -> encounter -> deployment -> B -> settlement -> W/S/N.
Reading an encounter does not complete travel. Deployment carries station,
layer, participant and start-state information. Battle results return changed
HP/resources/control and actual party location. Returning to S changes the
view, not the party location. Physical return needs an explicit confirmation;
there is no automatic teleport to the hub.

## Historical diagnosis and limits

[The rubric summary](../evidence/summaries/poc-rubric-20260906.md) records
PASS 2 / PARTIAL 3 / FAIL 3 for the old build. Manual combat, visible choice
costs, meaningful aftermath and world/character communication motivated these
changes. This PR syncs documents only: no Unity tests, runtime release claim,
asset promotion, #58 character rebuild or #59 migration completion.

The active execution plan is intentionally not copied while another owner
updates it. Its stable design inputs are synced here instead. Use root
ToDo.md and the active owner's branch for implementation progress, not this
snapshot or the unchecked tasks in the restored historical foundation plan.
