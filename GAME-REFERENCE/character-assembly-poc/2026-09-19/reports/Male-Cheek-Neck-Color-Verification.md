# 남성 볼·목 국소 색상 복원 검증

상태: **볼의 밝은 수리 패치와 목 접합 띠는 지정한 렌더에서 제거됨. 전체 캐릭터/UV/재질 최종 승인이 아님.**

## 결함과 원인

`male-source-color-atlas/head.png`, `neck.png`에서 밝은 볼 패치와 목의 띠를 확인했다. 표면 색상 데이터 감사 결과 `VerifiedQuadRepair`의 1,856개 면이 모두 몸 재질 슬롯을 참조했고, 태그가 없던 볼의 수리 면 24개도 잘못된 몸 색상을 참조했다. 따라서 정상 atlas에 색상을 복사하는 것만으로는 해결되지 않았다.

## 수정 범위

- 정상 인접 면의 선형 색상을 경계조건으로 두고, 손상 패치·목 재질 전환 영역만 표면 연결을 따라 보간했다.
- 81개 국소 영역, 2,624개 면의 색상을 복원했다. 14,570개 모서리 루프에 보정 마스크가 적용되고, 마스크 밖 254,082개 루프의 원본 색상은 정확히 유지됐다.
- 원본 형상, 원본 텍스처, 원본 재질 슬롯을 보존했다. 원본의 기존 그림자는 제거하지 않았고, 새로운 조명을 굽지 않은 EMIT 방식으로 4K atlas를 만들었다.
- 단색 재질로 덮은 결과가 아니라 원래 얼굴 색과 디테일을 포함한 텍스처 렌더로 확인했다.

## 증거

- 데이터/보존 검사: `surface-patch-color-reconstruction.json`
- 베이크: `patch-color-bake.json`, `PATCH_COLOR_ATLAS_BAKED`, exit 0
- 렌더: `ATLAS_COLOR_REVIEW_RENDERED`, exit 0
- 전후 동일 각도: `evidence/male-source-color-atlas/{head,neck,front}.png` → `evidence/male-patch-color-atlas/{head,neck,front}.png`
- 검토본: `work/male-base-patch-color-review.blend`
- 텍스처: `work/textures/patch-corrected/Male_PatchCorrected_4096.png`

후속 미완료: 허벅지의 색 경계, 발목·발가락 UV 늘어짐, 구강 파츠 내부 수리, 원본 베이크 음영의 재조명 적합성, 여성 및 세 변형 통합. 이 문서로 해당 범위가 완료됐다고 처리하지 않는다.
