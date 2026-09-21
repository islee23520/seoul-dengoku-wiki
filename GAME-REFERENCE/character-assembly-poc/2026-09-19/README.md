# 캐릭터 조립 POC — 2026-09-19 (초안 산물, 미완료 결함 명시)

Tripo GLB/FBX 남녀 머리·몸 소스에서 Blender 5.2.2로 베이스를 조립한 POC 산물 아카이브.
**이 디렉터리는 검증 완료 산출물이 아니라 결함이 남은 초안이다.** 아래 결함 목록을 먼저 읽어라.

## 상태 요약 (솔직 기준)

| 항목 | 남성 | 여성 |
|------|------|------|
| 대칭 베이스 메쉬 | 66,943v / 67,430f, 1성분 | 45,777v / 48,382f, 1성분 |
| junction/winding 오류 | 0 / 0 | 0 / 0 |
| 신장 | 1.75m | 1.65m |
| UV 비인접 겹침 | **192쌍 (기존 "0" 주장 무효)** | **1,456쌍 + 퇴화 UV 삼각형 40,853개 (기존 "0" 주장 무효)** |
| 색상 베이크 | 4096px (patch-corrected) | 2048px (Selected-to-Active) |

## 이전 세션 완료 주장이 무효가 된 이유

1. **UV 감사 후처리 버그**: `uv_overlap_audit.audit()`의 겹침 항목은 `{'triangles': [i,j], 'area': …}` 딕셔너리인데, `unwrap_female_uv2.py`·`retry_male_uv.py`의 인접면 필터는 `isinstance(pair, (list,tuple))`로 검사해 전 항목을 건너뛰었다. "비인접 겹침 0" 판정은 근거 없음. `review/package_blends.py`가 수정된 필터(`pair['triangles']`)로 재측정했다. 결과: 남성 192쌍, 여성 1,456쌍 비인접 겹침 + 여성 퇴화 UV 삼각형 40,853/91,428개 (`review/corrected-uv-audits.json`). 두 베이스 모두 UV 재작업이 필요하다.
2. **통합 씬 배치 결함 (실측 확정)**: `review/scene-audit.json` — 남성 구강 파츠 전체(잇몸·치아·혀)의 세계 z중심이 0.256–0.316m(골반 높이)으로 측정됐다. 입 높이(~1.6m)가 아니라 다리 사이에 떠 있다. 원인: `build_integration_v2.py`가 X만 이동하고 소스 blend의 원래 좌표를 검증하지 않았다. 여성 머리 비율 과대·목 이행 불량, 여성 구강 파츠 미포함, 안구 위치 근사 추정치도 그대로다. 재열기 렌더: `review/final-front-reopened.png`.
3. **여성 구강 분리 미완료**: 729면을 34그룹으로 식별·태깅(`work/female-head-oral-groups.blend`)했으나 상/하 구강·혀 오브젝트화는 미수행.

## 디렉터리 구성

- `deliverables/` — 통합 씬(final-integration.blend, **시각 결함 있음**), 공용 안구 마스터
- `work/` — 선별 13개 중간 .blend (대칭·UV·색상·구강 단계별)
- `work/textures/` — 베이크 텍스처 (male 4096px, female 2048px + 소스 추출)
- `reports/` — 전 세션 검증 JSON/MD. **파일명의 ok/통과 필드는 UV 항목 한정 위 버그의 영향을 받는다.**
- `evidence/` — 선별 렌더 이미지 10세트
- `scripts/` — 측정·수리 스크립트 전체 (회귀 테스트 포함)
- `review/` — 이번 리뷰가 새로 만든 이식성 영수증·수정 감사·씬 실측·재렌더

## 이식성

`review/portable-blends.json`이 각 .blend의 이미지 패킹 결과·SHA-256·재열기 인벤토리 일치 여부를 기록한다.
원본은 `/Users/danny/Documents/Character-Assembly-POC/2026-09-19/`(독립 git 저장소)에 보존되어 있다.

## 미완료 목록

1. 여성 구강 파츠 오브젝트화(상/하/혀) 미수행, 혀 유무 미확인
2. 통합 씬 파트 배치 결함(구강 부유, 여성 머리 비율, 안구 근사 위치) 미수정
3. UV 겹침 재감사 결과에 따른 재전개 필요 여부 판정
4. 툰 재질은 Toon BSDF 기본값 시험 수준 (외곽선·림라이트 없음, 원신/길티기어급 주장 안 함)
5. 남녀 색상 톤 매칭 미조정
6. 리깅/애니메이션은 범위 밖
