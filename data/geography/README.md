# 위키 지리 원본

이 디렉터리는 서울·경기·충청북도·충청남도·대전·세종·강원의 지리 원본을 위키 저장소가 직접 보관하는 위치다. 관측 자료와 세계관 창작 내용은 별개다. 실제 도형·OSM 객체·고도 파일 없이 행정동 개수만 기록한 상태를 원본 보관 완료로 보지 않는다.

- `seoul-20260830/`: 기존 서울 번들의 OSM PBF, 357개 z14 벡터 타일, 9개 지형 타일, 2013년 비교 경계, 출처와 라이선스 기록을 보존한다. `_acquisition*` 실행 잔여물은 가져오지 않는다.
- `boundaries/admdongkor-20260701.geojson`: 고정된 전국 행정동 경계 원본이다. `selected-regions.geojson`은 요청한 일곱 시도만 선택한 실제 도형이다. 충청도는 충청북도와 충청남도를 모두 포함한다.
- `osm/south-korea-20261009.osm.pbf`: 요청 권역 전체를 포함하는 대한민국 원본이다. 경계 바깥 의존 노드나 이름 없는 객체를 임의로 버리지 않는다. OSM 관측 날짜와 경계 날짜, 서울 기존 번들의 날짜는 서로 다르다.
- `terrain-mapzen/z11/`: 선택된 행정동 도형 전체를 포함하는 경위도 사각 범위의 지형 타일이다. 고도 단위는 m, nodata는 -32768이다. 객체 수정 날짜를 실제 관측 날짜로 쓰지 않는다.
- `manifest.json`: 파일별 SHA-256·크기·출처, 권역별 실제 경계 수, 지형 범위와 라이선스를 기록한다.

서울 원본 매니페스트의 380개 해시 기록 중 379개 실제 파일은 일치한다. `openfreemap/release/osm_date` 한 파일은 제공된 번들에도 없으며 원래 고정 URL은 현재 404를 반환한다. 그 파일을 추측으로 복원하지 않는다. 기존 매니페스트가 기록한 공식 OSM 날짜 `2026-08-24`와 누락 기록은 원본 그대로 남긴다. 370개 지리 데이터 파일 자체는 모두 보존됐다.

새 권역의 사전 계산 MVT·게임 이동 그래프·건물 높이 보정이나 붕괴 뒤 창작 서술은 여기서 완료됐다고 주장하지 않는다. 원시 OSM과 경계·고도는 그 처리를 위한 원본이다. 서울의 기존 타일은 원본대로 보존한다.

큰 PBF·GeoTIFF·GeoJSON은 Git LFS로 추적한다. `git lfs pull` 뒤 `node scripts/verify-geography.mjs`로 실제 바이트를 검증한다. 출처는 [Geofabrik 대한민국 추출](https://download.geofabrik.de/asia/south-korea.html), [고정 행정동 경계](https://github.com/vuski/admdongkor/tree/7360288277dfd12d74e54b959c59bdd66f852e3a), [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)다. OSM의 ODbL 1.0과 기여자 표기, 경계의 CC BY 4.0·SGIS 출처 표기, 지형 원출처 표기를 유지한다.
