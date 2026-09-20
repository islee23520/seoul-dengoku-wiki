# 위 어금니 한 쌍 수리 판정

상태: **구멍·비정상 연결·면 방향·자가교차 제거 확인. 파츠 전체 재질/UV와 구강 통합은 미완료.**

대상은 원본 남성 위 잇몸/치아 그룹의 성분 4/5 한 쌍이다. 치열 순서, 서로 대응하는 외형과 반사 오차를 검사한 뒤 정상적인 성분 5의 치관을 기준으로 사용했다. 중심점만으로 여러 치아가 융합된 다른 성분을 대체하지 않았다.

## 수리 및 재검증

- 손상된 반대 치관을 대응 donor로 복원하고 치근 개구부를 9개 쿼드로 마감했다.
- 닫힌 메쉬·일관된 면 방향만으로 승인하지 않았다. 실제 삼각형 감사에서 donor 치관 자체의 교차 4곳을 추가로 검출했다. 공유 정점이 있는 삼각형 쌍도 검사했다.
- 교차 주변 19개 정점만 최소 강도로 보정했다. 최대 이동 4.494e-6 source units이며, 머리 배율 0.28274 기준 약 0.00127mm이다. 치근과 보정 영역 밖 정점 이동은 0, UV와 면 연결은 유지됐다.
- Blender가 보정 후 실제로 계산한 좌우 각 204개 삼각형을 다시 검사했다. 교차·비인접 접촉·퇴화 삼각형 모두 0. 각 메쉬 104정점/132면, 닫힌 연결 성분 1, 양의 부피이다.
- 치관·치근·원래 치열에 넣은 렌더를 확인했다. 치관의 형태와 치열 위치는 유지됐다. 치근 마감의 각진 표면과 새 캡 UV는 아직 최종 승인이 아니다.

## 증거

- 원본 실패: `molar-crossing-before.json` (4 intersections)
- 후보 선택: `molar-crossing-repair-selection.json`
- 실제 적용·보존: `molar-crossing-native-application.json`
- 최종 검사: `molar-positive-crossing-after.json`, `molar-negative-crossing-after.json`
- 렌더: `evidence/upper-molar-pair-crossing-repaired/`
- 사본: `work/male-upper-molar-pair-crossing-repaired.blend`

같은 잇몸 그룹의 나머지 치아·잇몸은 여전히 수리 대상이다. 이 판정은 한 쌍만 포함하며 전체 구강이나 최종 캐릭터 완성으로 확대하지 않는다.
