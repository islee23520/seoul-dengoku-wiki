-- Tool/scripts/build-slot-contracts.sql
-- Tracked builder for slot_contracts table (durable portrait pipeline contract registry)
-- Run with: sqlite3 Design/potrait-generator/data/assets.sqlite < Tool/scripts/build-slot-contracts.sql
-- Scope: only creates/populates slot_contracts. Does not touch any existing tables.

CREATE TABLE IF NOT EXISTS slot_contracts (
  sex TEXT NOT NULL CHECK(sex IN ('female','male')),
  slot TEXT NOT NULL,
  applicable INTEGER NOT NULL CHECK(applicable IN (0,1)),
  current_variant_target INTEGER NOT NULL DEFAULT 3,
  original_variant_target INTEGER NOT NULL DEFAULT 10,
  verification_target TEXT NOT NULL,
  gateway_order TEXT NOT NULL DEFAULT '1->2->3',
  constraint_ref TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sex, slot)
) STRICT;

-- Clear any previous version of this specific contract data (safe, scoped to this table only)
DELETE FROM slot_contracts;

-- Populate 46 rows (23 slots × 2 sexes)
-- Female beard/beard_back: applicable=0. All others applicable=1.
-- Current target reduced to 3 (owner decision 2026-09-17).
-- Sources: library.json slots, portrait-slot-relations.json, aggregate-preflight.json, curation-catalog.json

-- bg
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'bg', 1, 3, 10, 'background fill and color field consistency', 'occlusion-mask-v1'),
('male', 'bg', 1, 3, 10, 'background fill and color field consistency', 'occlusion-mask-v1');

-- clothes_back
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'clothes_back', 1, 3, 10, 'back layer silhouette, material depth, and occlusion boundary', 'occlusion-mask-v1'),
('male', 'clothes_back', 1, 3, 10, 'back layer silhouette, material depth, and occlusion boundary', 'occlusion-mask-v1');

-- headgear_back
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'headgear_back', 1, 3, 10, 'back accessory silhouette and hidden surface support', 'occlusion-mask-v1'),
('male', 'headgear_back', 1, 3, 10, 'back accessory silhouette and hidden surface support', 'occlusion-mask-v1');

-- hair_back
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'hair_back', 1, 3, 10, 'back hair silhouette, volume, and lock hierarchy base', 'occlusion-mask-v1'),
('male', 'hair_back', 1, 3, 10, 'back hair silhouette, volume, and lock hierarchy base', 'occlusion-mask-v1');

-- beard_back (sex-gated)
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'beard_back', 0, 3, 10, 'back beard silhouette (male only; sex-gated)', 'sex-gated-v1'),
('male', 'beard_back', 1, 3, 10, 'back beard silhouette (male only; sex-gated)', 'sex-gated-v1');

-- face_base
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'face_base', 1, 3, 10, 'skin foundation, tone base, and removable region hosting', 'removable-companion-v1'),
('male', 'face_base', 1, 3, 10, 'skin foundation, tone base, and removable region hosting', 'removable-companion-v1');

-- neck (removable companion)
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'neck', 1, 3, 10, 'neck skin transition and seam alignment with face_base', 'removable-companion-v1'),
('male', 'neck', 1, 3, 10, 'neck skin transition and seam alignment with face_base', 'removable-companion-v1');

-- cheeks (removable companion)
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'cheeks', 1, 3, 10, 'cheek shading, blush area, and companion skin detail', 'removable-companion-v1'),
('male', 'cheeks', 1, 3, 10, 'cheek shading, blush area, and companion skin detail', 'removable-companion-v1');

-- chin (removable companion)
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'chin', 1, 3, 10, 'chin contour, shadow, and lower face foundation', 'removable-companion-v1'),
('male', 'chin', 1, 3, 10, 'chin contour, shadow, and lower face foundation', 'removable-companion-v1');

-- mouth
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'mouth', 1, 3, 10, 'lip contour, expression shape, and color boundary', 'occlusion-mask-v1'),
('male', 'mouth', 1, 3, 10, 'lip contour, expression shape, and color boundary', 'occlusion-mask-v1');

-- nose
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'nose', 1, 3, 10, 'bridge shadow, nostril definition, and central face anchor', 'occlusion-mask-v1'),
('male', 'nose', 1, 3, 10, 'bridge shadow, nostril definition, and central face anchor', 'occlusion-mask-v1');

-- eyes_white
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'eyes_white', 1, 3, 10, 'socket containment (almond shape, iris contained)', 'eyes-nesting-v1'),
('male', 'eyes_white', 1, 3, 10, 'socket containment (almond shape, iris contained)', 'eyes-nesting-v1');

-- eyes_color
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'eyes_color', 1, 3, 10, 'iris position (pupil placement, no spill outside white)', 'eyes-nesting-v1'),
('male', 'eyes_color', 1, 3, 10, 'iris position (pupil placement, no spill outside white)', 'eyes-nesting-v1');

-- eyes_shape
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'eyes_shape', 1, 3, 10, 'occlusion (lids/lashes/brows cover both white and color)', 'eyes-nesting-v1'),
('male', 'eyes_shape', 1, 3, 10, 'occlusion (lids/lashes/brows cover both white and color)', 'eyes-nesting-v1');

-- ears
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'ears', 1, 3, 10, 'ear shape, skin detail, and position relative to head', 'occlusion-mask-v1'),
('male', 'ears', 1, 3, 10, 'ear shape, skin detail, and position relative to head', 'occlusion-mask-v1');

-- clothes
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'clothes', 1, 3, 10, 'material+seam, primary outfit silhouette, and front layering', 'occlusion-mask-v1'),
('male', 'clothes', 1, 3, 10, 'material+seam, primary outfit silhouette, and front layering', 'occlusion-mask-v1');

-- headgear_mid
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'headgear_mid', 1, 3, 10, 'mid-layer companion detail and occlusion support', 'occlusion-mask-v1'),
('male', 'headgear_mid', 1, 3, 10, 'mid-layer companion detail and occlusion support', 'occlusion-mask-v1');

-- clothes_front
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'clothes_front', 1, 3, 10, 'front layer detail, folds, and material highlights', 'occlusion-mask-v1'),
('male', 'clothes_front', 1, 3, 10, 'front layer detail, folds, and material highlights', 'occlusion-mask-v1');

-- beard (sex-gated)
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'beard', 0, 3, 10, 'beard silhouette+texture hierarchy (male only; sex-gated)', 'sex-gated-v1'),
('male', 'beard', 1, 3, 10, 'beard silhouette+texture hierarchy (male only; sex-gated)', 'sex-gated-v1');

-- hair
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'hair', 1, 3, 10, 'silhouette+lock hierarchy, front strands, and volume', 'occlusion-mask-v1'),
('male', 'hair', 1, 3, 10, 'silhouette+lock hierarchy, front strands, and volume', 'occlusion-mask-v1');

-- headgear
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'headgear', 1, 3, 10, 'primary headgear silhouette, material, and detail', 'occlusion-mask-v1'),
('male', 'headgear', 1, 3, 10, 'primary headgear silhouette, material, and detail', 'occlusion-mask-v1');

-- acc_eye
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'acc_eye', 1, 3, 10, 'accessory eye detail (e.g. glasses frames, overlays)', 'occlusion-mask-v1'),
('male', 'acc_eye', 1, 3, 10, 'accessory eye detail (e.g. glasses frames, overlays)', 'occlusion-mask-v1');

-- frame
INSERT INTO slot_contracts (sex, slot, applicable, current_variant_target, original_variant_target, verification_target, constraint_ref) VALUES
('female', 'frame', 1, 3, 10, 'decorative frame or border consistency', 'occlusion-mask-v1'),
('male', 'frame', 1, 3, 10, 'decorative frame or border consistency', 'occlusion-mask-v1');

-- Verify population
SELECT 'slot_contracts populated with ' || COUNT(*) || ' rows' AS status FROM slot_contracts;
SELECT sex, slot, applicable, current_variant_target, verification_target FROM slot_contracts ORDER BY sex, slot LIMIT 5;
