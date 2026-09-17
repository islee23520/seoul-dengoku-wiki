# Portrait Generator Plate Inventory (v2)

**Complete census of all 141 PNG plates** in `assets/v2/plates/`
Last updated: 2026-09-17 (task st_01a0b010)

## Summary

- **Total files**: 141
- **current_production**: 46 (3 variants per major slot per CONTRACTS.md; active in `library.json`)
- **candidate**: 28 (valid alternate variants ready for future promotion)
- **rejected**: 32 (family-02/03 VISUAL_REJECTED per `.omo/evidence/.../family-02-03-rejection.json` + forensic audit failures)
- **unmapped**: 35 (legacy base/o0 files, detail companions, hair_overrides, empty placeholders not part of the current 3-variant library)

All plates are mapped to a logical slot. `item_intents` table in `data/assets.sqlite` now contains concrete, human-evaluable Korean design intents and verification rubrics for every production and rejected entry (93 rows total, superset of library).

No generic boilerplate ("per Q04", "material/seams/fit per Q05 Q09", etc.) remains.

## Slot-by-Slot Mapping

### Female (68 plates)
- **acc_eye** (4): current_production=`female-acc-eye-01`, candidate=`female-acc-eye-02/03`, unmapped=`acc_eye-base.png`
- **bg** (4): current_production=`bg-authored-01/02/03`, unmapped=`bg-base.png`
- **cheeks** (2): current_production=`female-cheeks-detail.png` (as female-cheeks-01), unmapped=`cheeks-base.png`
- **chin** (2): current_production=`female-chin-detail.png` (as female-chin-01), unmapped=`chin-base.png`
- **clothes** (5): current_production=`female-clothes-01/02/03`, unmapped=`clothes-o0.png`, `clothes-o1.png`
- **clothes_back** (3): current_production=`clothes_back-o0.png`, `female-clothes-back-02.png` (as female-clothes-back-01 companion), unmapped=`clothes_back-o1.png`
- **clothes_front** (3): current_production=`female-clothes-front-02.png`, unmapped=`clothes_front-o0/o1.png`
- **ears** (1): current_production=`female-ears-01`, (ears-base.png is supporting base)
- **eyes_color** (5): current_production=`female-eyes-color-01`, rejected=`female-eyes-color-02/03` (family-02/03 VISUAL_REJECTED), unmapped=`eyes_color-e0/e1.png`
- **eyes_shape** (5): current_production=`female-eyes-shape-01`, rejected=`female-eyes-shape-02/03`, unmapped=`eyes_shape-e0/e1.png`
- **eyes_white** (3): current_production=`female-eyes-white-01`, rejected/unmapped=`female-eyes-white-02/03`
- **face_base** (4): current_production=`female-face-base-01`, rejected=`female-face-base-02/03`, unmapped=`face_base-base.png`
- **frame** (4): current_production=`frame-authored-01/02/03`, unmapped=`frame-base.png`
- **hair** (3): current_production=`female-hair-03` + `hair-h0/h1.png` (mapped to female-hair-01/02)
- **hair_back** (3): current_production=`hair_back-h0.png` (as female-hair-back-01), unmapped=`hair_back-h1.png`
- **headgear** (4): current_production=`female-headgear-01/02/03`, unmapped=`headgear-base.png`
- **headgear_back** (2): current_production=`female-headgear-back-03.png`, unmapped=`headgear_back-base.png`
- **headgear_mid** (2): current_production=`female-headgear-mid-03.png`, unmapped=`headgear_mid-base.png`
- **mouth** (4): current_production=`female-mouth-01`, rejected=`female-mouth-02/03`, unmapped=`mouth-base.png`
- **neck** (1): current_production=`neck-base.png`
- **nose** (4): current_production=`female-nose-01`, rejected=`female-nose-02/03`, unmapped=`nose-base.png`

### Male (73 plates)
- **acc_eye** (4): current_production=`male-acc-eye-01/02/03`, unmapped=`acc_eye-base.png`
- **beard** (2): current_production=`male-beard-01`, unmapped=`beard-base.png`
- **beard_back** (1): unmapped=`beard_back-base.png` (empty slot)
- **bg** (4): current_production=`bg-authored-01/02/03`, unmapped=`bg-base.png`
- **cheeks** (2): current_production=`male-cheeks-detail.png`, unmapped=`cheeks-base.png`
- **chin** (2): current_production=`male-chin-detail.png`, unmapped=`chin-base.png`
- **clothes** (4): current_production=`male-clothes-01/02/03`, unmapped=`clothes-base.png`
- **clothes_back** (4): current_production=`male-clothes-back-01/02/03`, unmapped=`clothes_back-base.png`
- **clothes_front** (2): current_production=`male-clothes-front-03.png`, unmapped=`clothes_front-base.png`
- **ears** (1): current_production=`male-ears-01`, unmapped=`ears-base.png`
- **eyes_color** (4): current_production=`male-eyes-color-01`, rejected=`male-eyes-color-02/03`, unmapped=`eyes_color-base.png`
- **eyes_shape** (4): current_production=`male-eyes-shape-01`, rejected=`male-eyes-shape-02/03`, unmapped=`eyes_shape-base.png`
- **eyes_white** (3): current_production=`male-eyes-white-01`, rejected/unmapped=`male-eyes-white-02/03`
- **face_base** (4): current_production=`male-face-base-01`, rejected=`male-face-base-02/03`, unmapped=`face_base-base.png`
- **frame** (4): current_production=`frame-authored-01/02/03`, unmapped=`frame-base.png`
- **hair** (4): current_production=`male-hair-01/02/03`, unmapped=`hair-base.png`
- **hair_back** (1): unmapped=`hair_back-base.png`
- **hair_overrides** (9): unmapped (conditional composites: male-hair-01__male-headgear-0[1-3].png etc.)
- **headgear** (4): current_production=`male-headgear-01/02/03`, unmapped=`headgear-base.png`
- **headgear_back** (2): current_production=`male-headgear-back-03.png`, unmapped=`headgear_back-base.png`
- **headgear_mid** (2): current_production=`male-headgear-mid-03.png`, unmapped=`headgear_mid-base.png`
- **mouth** (4): current_production=`male-mouth-01`, rejected=`male-mouth-02/03`, unmapped=`mouth-base.png`
- **neck** (1): current_production=`neck-base.png`
- **nose** (4): current_production=`male-nose-01`, rejected=`male-nose-02/03`, unmapped=`nose-base.png`

## Design Intents in `item_intents` (examples)

**Current production examples (concrete & human-evaluable):**
- `female-clothes-01`: "칼라가 있는 짙은 회색 방한 베스트 조끼, 직조 질감과 자연스러운 목선 주름 표현" — verification: "목 및 어깨선과의 봉제선 정합, 볼/턱 음영과의 분리, 텍스처 노이즈 없음, 옷감 주름의 자연스러운 흐름"
- `female-eyes-color-01`: "타겟 인물의 붉은 갈색 홍채 및 하이라이트, 자연스러운 광택 표현" — verification: "눈 소켓(흰자) 내부에 정확히 안착, 테두리 계단현상 없음, 홍채 경계 선명, 빛 반사 위치 정확"
- `female-face-base-01`: "부드러운 피부 톤 베이스, 자연스러운 볼륨 쉐이딩과 하이라이트, 애니메이션 스타일 얼굴 윤곽" — verification criteria includes transparent regions for eyes/nose/mouth and clean blending.
- Similar concrete rubrics exist for all 46 production + all rejected entries.

**Rejected examples (preserved verbatim):**
- `female-eyes-color-02`, `female-eyes-shape-02/03`, `female-face-base-02/03`, `female-mouth-02/03`, `female-nose-02/03`, and all male equivalents: `"unsupported — family-02/03 VISUAL_REJECTED"` with reference to rejection evidence.

All 141 files are accounted for. `library.json` only selects from `current_production`. Unmapped files remain for historical/forensic value but are excluded from the 3-variant contract.

This inventory replaces all previous boilerplate-driven tables. See `tests/item-inventory.test.mjs` for automated validation.
