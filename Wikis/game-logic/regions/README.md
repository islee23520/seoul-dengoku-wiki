# 서울 지역 설정 데이터

서울 지역 설정의 단위는 선택한 **2026-07-01 행정동 경계의 427개 동**이다. 25개 구 아래에 동별 안정 ID와 지역 내용을 둔다. 334개 역 목록은 이동 그래프용이며, 이 데이터의 면적 분모는 행정동이다.

## 날짜와 출처

조회 기준일은 2026-09-12다. 행정동 자료의 기준일은 2026-07-01, OSM 원본 스냅샷은 2026-09-04T23:00:00Z다. PBF 파일 수정일은 2026-09-05다. 지형 파일의 2017년 12월은 저장 객체 수정 시기다.

선택 경계는 통계청 SGIS 행정동을 가공한 `vuski/admdongkor` 공개 자료다. 표시는 그 커밋의 경계이며, 공식 최신 법정 경계 인증이 아니다. 고정 커밋은 아래와 같다.

- [2026-07-01 행정동 GeoJSON](https://raw.githubusercontent.com/vuski/admdongkor/7360288277dfd12d74e54b959c59bdd66f852e3a/ver20260701/HangJeongDong_ver20260701.geojson)
- SHA-256: `c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f`
- 원본 취득일: 2026-09-12. 원본 커밋일: 2026-08-26.
- 가공물 CC BY 4.0, 원자료 SGIS 공공누리 제1유형 출처표시 유지. [자료 라이선스](https://github.com/vuski/admdongkor/blob/master/LICENSE-DATA).

OSM 자료는 `© OpenStreetMap contributors`, ODbL 1.0 조건을 유지한다. 지형은 Mapzen·USGS 및 해당하는 NOAA 출처표시를 보존한다. 원본 지리 번들은 저장소의 형제 디렉터리 `seoul-kenshi-data/seoul-geography-20260830`에 있다. 원본 PBF는 Unity Assets에 복사하지 않는다.

## 파일 구조

- `content/<구 코드>.json`: 해당 구에 속한 모든 동의 최종 저작 내용. 다른 구의 시설을 이름만 보고 가져오지 않는다.
- 공간·객체 원장 생성 도구: `tools/regions/`.
- 열람 화면: 저장소 루트 `system-design/regions/index.html`.
- 공간 생성물과 검증 기록: `.omo/evidence/seoul-regions/`. 이 폴더의 존재만으로 콘텐츠 완료를 판단하지 않는다.

각 동은 주민·생업, 산출/입력/부족, 위험, 개막 상태, 이웃과의 관계, 플레이어 행동/비용/결과/대가, **건물 재사용**을 가진다. 건물 칸은 `content.buildings`다. 강·구·동 규칙은 [강·구·동 건물 재사용](../Building-Reuse-Geography.md)이 정본이다. 장소와 태그는 관측, 경계·소속·면적은 계산, 붕괴 뒤 주민과 사건은 창작이다. OSM 태그만으로 기관의 현재 가동을 말하지 않는다.

세계관 날짜는 [시나리오 타임라인](../Scenario-Timeline.md)의 개막일이다. 임하준 실종과 기존 중앙 급수·부품 계약의 만료가 출발 조건이다. 다음 봄의 유언장, 가을 행렬, 겨울 무기열차 사건을 이미 일어난 개막 사실로 앞당기지 않는다.

## 전수 검사

경계는 EPSG:5179에서 안정 ID 순서로 중복을 제거했다. 원래 선택 합집합 **606,223,725.0069752㎡**를 유지하고, 모든 동의 비어 있지 않은 도형을 보존한다. 경계가 맞닿았다는 사실만으로 이동 간선을 만들지 않는다.

원자료의 태그 있는 node와 모든 way/relation을 처리 원장에 남긴다. 이름 없는 객체도 남기고, 같은 이름을 한 시설로 합치지 않는다. 후보는 내부 할당, 외부, 도형 미완성 격리 중 하나로 기록한다. 선택 자료를 다 처리한 것과 현실 시설을 확인한 것은 별개다.

```bash
python3 tools/regions/prepare_boundary.py
python3 -m unittest discover -s tools/regions -p 'test_*.py'
python3 tools/regions/build_region_atlas.py --as-of 2026-09-12 --source-root ../seoul-kenshi-data/seoul-geography-20260830 --boundary docs/game-logic/regions/sources/admdongkor-20260701.geojson --output .omo/evidence/seoul-regions/atlas.json
python3 tools/regions/assemble_region_content.py --atlas .omo/evidence/seoul-regions/atlas.json --content-dir docs/game-logic/regions/content --view-dir system-design/regions
python3 tools/regions/verify_region_atlas.py --atlas .omo/evidence/seoul-regions/atlas.json
```

`prepare_boundary.py`는 고정 URL에서 경계 파일을 받고 SHA-256이 맞을 때만 저장한다. 기존 원본 지리 번들은 별도로 필요하다. 코드·설정 JSON·출처 선택 원장은 저장소에 남으며 123MB 객체 원장과 중간 검증 데이터는 위 명령으로 재생성한다. 최종 열람용 데이터는 `system-design/regions/atlas-data.js`다.

`--geometry-only`는 공간 중간 검증이다. 최종 완료는 내용 조립 뒤 옵션 없는 마지막 명령이다. 누락 동, 중복 ID, 다른 동 앵커, 가짜 정본 경로, 빈 행동 결과, 날짜 혼동은 실패다. 문체 점수나 글자 수는 내용 판정이 아니다.

이 총람은 지역 저작 데이터와 열람 도구다. Unity 내부 공간과 지역 시뮬레이션은 여기 없다.
