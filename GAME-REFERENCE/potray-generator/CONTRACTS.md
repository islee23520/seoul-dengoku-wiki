# Portrait Pipeline Contract Registry

**Single source of truth for all portrait generation contracts. Last updated 2026-09-17.**

## Variant Counts

Current target = 3 variants per applicable slot (owner decision 2026-09-17, quote inline: "슬롯당 3개로 일단 축소 하고 게이트웨이 통괄ㄹ 확인함"); original contract = 10 per slot (cite source: `.omo/evidence/portrait-stage23/gate2-aggregate-preflight/aggregate-preflight.json` field `variant_contract.required_per_applicable_enabled_slot`).

Current library list: 23 slots × 2 sexes = 46 entries.

Historical: aggregate-preflight 22-slot contract (pre-eyes_white) documented as superseded history.

Owner decision: permanent reduction to 3 variants to accelerate gateway validation.

## Slot Verification Targets

Each slot has a precise visual verification target (derived from `Tool/art/portrait/portrait-slot-relations.json` and pipeline evidence):

- **bg**: background fill and color field consistency
- **clothes_back**: back layer silhouette, material depth, and occlusion boundary
- **headgear_back**: back accessory silhouette and hidden surface support
- **hair_back**: back hair silhouette, volume, and lock hierarchy base
- **beard_back**: back beard silhouette (male only; sex-gated)
- **face_base**: skin foundation, tone base, and removable region hosting
- **neck**: neck skin transition and seam alignment with face_base
- **cheeks**: cheek shading, blush area, and companion skin detail
- **chin**: chin contour, shadow, and lower face foundation
- **mouth**: lip contour, expression shape, and color boundary
- **nose**: bridge shadow, nostril definition, and central face anchor
- **eyes_white**: socket containment (almond shape, iris contained)
- **eyes_color**: iris position (pupil placement, no spill outside white)
- **eyes_shape**: occlusion (lids/lashes/brows cover both white and color)
- **ears**: ear shape, skin detail, and position relative to head
- **clothes**: material+seam, primary outfit silhouette, and front layering
- **headgear_mid**: mid-layer companion detail and occlusion support
- **clothes_front**: front layer detail, folds, and material highlights
- **beard**: beard silhouette+texture hierarchy (male only; sex-gated)
- **hair**: silhouette+lock hierarchy, front strands, and volume
- **headgear**: primary headgear silhouette, material, and detail
- **acc_eye**: accessory eye detail (e.g. glasses frames, overlays)
- **frame**: decorative frame or border consistency

**Eyes specific rule**: eyes_color must be inside eyes_white; eyes_shape occludes both.

## Gateway Order

1차 split/reconstruction → 2차 parts/hidden-surface/sex ownership → 3차 combinations/exchange/browser gate.

Owner decision text (permanent lock issued 2026-09-15): "Never bypass gateway order. All validation must flow through the full 1->2->3 sequence."

This order is immutable.

## Catalog Count

gate4 required records = 828 (source: `Design/potrait-generator/assets/v2/curation-catalog.json` field `total_records`). The old 259 was a stale pipeline snapshot.

All production selection limited to gate4-passed records from this catalog.

## Slot Relations

- upper_slot_alpha_is_the_occlusion_mask (primary runtime rule)
- eyes_color must_be_inside eyes_white
- eyes_shape occludes both eyes_white and eyes_color
- hair.hidden lives under headgear alpha (headgear does not punch hair)
- beard/beard_back are sex-gated (male: optional_on, female: off)
- neck/cheeks/chin are removable companions hosted by face_base

Reference: `Tool/art/portrait/portrait-slot-relations.json` (confirmed 2026-09-17).

This document is the durable contract. All code, tests, and pipelines must reference it.
