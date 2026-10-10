# 서울 지리 데이터 번들

이 디렉터리는 서울 오프라인 처리용 원본·중간 지리 데이터를 한곳에 모은 것이다. Unity 프로젝트와는 분리되어 있으며, Unity `Assets`에 바로 넣은 파일은 없다. 파일별 URL, 접근 시각, 바이트 수, SHA-256은 `manifest.json`에 기록했다.

## 들어 있는 데이터

| 경로 | 내용 | 범위와 날짜 |
|---|---|---|
| `openfreemap/mvt/20260830_080001_pt/14/` | OpenFreeMap의 OpenMapTiles 스키마 MVT 357개 | 요청 bbox `126.76,37.42,127.19,37.70`을 포함하는 z14 타일 `x=13960–13980`, `y=6337–6353`. 타일 외곽은 `126.73828125,37.40507375,127.19970703,37.70120736`이다. 릴리스 ID는 `20260830_080001_pt`지만 공식 `osm_date`는 `2026-08-24`다. |
| `osm-current-bbbike/` | 편집 가능한 현재 BBBike 서울 OSM PBF와 `.poly` | 사각 범위 `126.58,37.35,127.31,37.72`. PBF 응답의 최종 수정 시각은 `2026-09-05 16:19:01 UTC`다. 2026-08-30 역사 스냅샷이 아니다. |
| `terrain-mapzen-geotiff/z11/` | AWS Terrain Tiles/Mapzen GeoTIFF 9개 | z11 `x=1745–1747`, `y=792–794`. EPSG:3857, 512×512, `int16`, 고도 단위 m, nodata `-32768`. S3 객체는 2017년 12월 자료다. |
| `boundaries-kostat-2013/` | KOSTAT 2013 서울 구 경계 GeoJSON 원본·단순화본 | 파일마다 구 25개, `base_year=2013`. 현재 행정경계가 아니다. |
| `licenses/` | 내려받은 출처 설명과 라이선스·귀속 문구 | ODbL 전문, OpenFreeMap/OpenMapTiles 설명, Mapzen 지형 출처, `southkorea/seoul-maps` README, Apache 2.0 전문을 포함한다. |

## OpenFreeMap 타일의 고정 릴리스 처리

공개 사용 안내에는 요청 횟수 제한이 없다고 적혀 있다. 이 번들은 서울 bbox에 필요한 357개만 최대 동시 4개로 요청했으며 재시도 루프를 사용하지 않았다.

고정 버전 URL에서 305개는 `specific PBF planet 20260830_080001_pt`로 확인됐다. 나머지 52개 좌표는 서버가 최신 릴리스의 `wildcard PBF planet`을 반환했다. 그 응답을 2026-08-30 자료로 잘못 보관하지 않고, 공식 `20260830_080001_pt/tiles.pmtiles` 파일에서 HTTP Range로 해당 타일 바이트만 읽어 교체했다. PMTiles 전체 파일은 다운로드하거나 이 디렉터리에 저장하지 않았다. 범위 요청 내역은 `_acquisition/pmtiles-range-summary.json`과 `_acquisition/pmtiles-range-replacements.jsonl`에 남아 있다.

이 MVT 묶음은 z14 한 단계만 담는다. 전체 줌, 전체 서울 객체의 원시 OSM, 라우팅 그래프, 주소 원장, 완전한 건물 높이 자료가 아니다. 357개 파일 모두 protobuf로 해독했다. `transportation` 계층은 357개, `building` 계층은 351개 타일에서 확인됐다.

## BBBike OSM 분리 원칙

`osm-current-bbbike/Seoul.osm.pbf`는 현재 편집용 원시 OSM 출처다. OpenFreeMap 2026-08-30 릴리스와 날짜가 다르므로 별도 디렉터리에 두었다. 로컬 파싱 결과는 노드 4,895,437개, 웨이 730,540개, 릴레이션 19,013개이며, `highway` 태그 웨이·릴레이션 278,065개와 `building` 태그 웨이·릴레이션 354,518개가 있다. 추출 서비스 특성상 `.poly` 사각형 밖에 있는 의존 노드가 PBF에 포함될 수 있으므로, 객체 좌표의 단순 최솟값·최댓값을 추출 경계로 해석하면 안 된다.

## 지형 해석

GeoTIFF 픽셀은 부호 있는 16비트 정수 고도값이다. 별도 스케일이나 오프셋 없이 m로 읽고 `-32768`은 nodata로 취급한다. 9개 파일은 EPSG:3857과 512×512 크기를 확인했다. 각 파일의 실제 유효 최솟값·최댓값, 투영 경계, S3 `X-Imagery-Sources`는 `manifest.json`에 있다. 서울 육지는 주로 `SRTM/N37E126`, `SRTM/N37E127`에서 왔고 GMTED2010이 함께 기록되어 있다. 일부 서쪽·남쪽 타일에는 ETOPO1도 포함된다.

## 행정경계와 라이선스 주의사항

KOSTAT 파일은 2013년 센서스용 행정구역 경계다. 현재 경계로 표시하지 않는다. `southkorea/seoul-maps` 저장소 README는 Apache v2.0을 선언하지만, 과거 KOSTAT 원 출처 페이지에서는 2013년 당시의 상위 라이선스 허여를 현재 다시 확인할 수 없었다. 따라서 저장소의 Apache 선언을 KOSTAT가 새로 확인해 준 라이선스처럼 설명하면 안 된다. 출처는 “Statistics Korea (KOSTAT), Administrative division geodata for Census, 2013”으로 유지한다.

OpenStreetMap 데이터에는 ODbL 1.0이 적용된다. 표시 시 `© OpenStreetMap contributors`와 ODbL 안내를 제공한다. OpenFreeMap 타일의 권장 귀속 문구는 `OpenFreeMap © OpenMapTiles — Data from OpenStreetMap`이다. 지형은 `Mapzen`, `SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey`, ETOPO1을 사용한 경우 `Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration`을 표시한다.

## 검증 기록

- MVT 357개 전부 protobuf 해독 성공, 빈 타일 없음
- OSM PBF 헤더와 `OSMData` 블록 확인 후 전체 객체 파싱 성공
- GeoTIFF 9개 전부 `GTiff`, EPSG:3857, 512×512, `int16`, nodata `-32768` 확인
- KOSTAT GeoJSON 두 파일 모두 FeatureCollection, 구 25개, `base_year=2013` 확인
- 소스 데이터 370개 파일: 100,000,080바이트
- 라이선스·출처 문서를 합친 취득 파일 380개: 100,107,053바이트

`manifest.json`은 위 380개 파일 각각의 SHA-256과 바이트 수를 담는다. 취득·검증 보조 스크립트와 로그는 데이터 파일 수에 포함하지 않았다.
