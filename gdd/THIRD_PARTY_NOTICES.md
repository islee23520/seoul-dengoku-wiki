# THIRD-PARTY NOTICES

이 저장소의 Git 이력은 2026-11-02 seoul-dengoku-gdd(private)에서 공개용으로 정리해 이식했습니다.
라이선스 검토 보고서: seoul-dengoku-tools `evidence/gdd-public-legal-review-20261102.md`(기술적 검토이며 법률 자문이 아님).
권리가 확인되지 않은 경로(proposals/metaverse-hub-2026-2, iyen·keyart AI 생성 원본, KOSTAT 2013 경계 비교,
hangnyeol 원문 인용, canon-reference, worktree-cleanup, site/ 빌드 산출, GURPS 캐스트 등)는 공개 이력에서 제외했습니다.

## OSM / OpenFreeMap (ODbL 1.0)
© OpenStreetMap contributors. OpenStreetMap data is available under the Open Data Commons Open Database License (ODbL) 1.0: https://opendatacommons.org/licenses/odbl/1-0/ . Source and attribution: https://www.openstreetmap.org/copyright . BBBike Seoul extract: https://download.bbbike.org/osm/bbbike/Seoul/ . Snapshot dates and acquisition hashes: GAME-REFERENCE/data/seoul-geography-20260830/manifest.json. Derived database portions based on OSM are distributed under ODbL 1.0; modifications include geographic extraction, station selection and graph/attribute transformation.
OpenFreeMap © OpenMapTiles — Data from OpenStreetMap. https://openfreemap.org/ ; https://openmaptiles.org/ . OpenMapTiles schema/design portions are licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ .

## SGIS / vuski 행정동 경계 (CC BY 4.0 + KOGL 제1유형)
본 데이터는 통계청 통계지리정보서비스(SGIS, https://sgis.kostat.go.kr)에서 공공누리 제1유형으로 개방한 행정동 경계를 가공한 것이며(가공: vuski/admdongkor, https://github.com/vuski/admdongkor), CC BY 4.0으로 배포됩니다. 원본 경계: ver20260701/HangJeongDong_ver20260701.geojson, commit 7360288277dfd12d74e54b959c59bdd66f852e3a. 라이선스: https://creativecommons.org/licenses/by/4.0/ ; https://www.kogl.or.kr/info/licenseType1.do . 프로젝트 파생본 변경: 서울 sido=11 필터, 안정 ID 순서의 겹침 정리, 표시용 단순화 및 재투영(실제 적용 파일에 한함). 본 프로젝트는 통계청의 후원·공식 최신 경계 인증을 의미하지 않습니다.

## 서울교통공사 역사 건축정보 (KOGL 제1유형)
서울교통공사, 「서울교통공사 역사 건축정보」(자료일 2025-03-10), 서울 열린데이터광장 OA-11572. https://data.seoul.go.kr/dataList/OA-11572/S/1/datasetView.do . 공공누리 제1유형(출처표시): https://www.kogl.or.kr/info/licenseType1.do . CSV 원본은 수정 없이 보존하며, station-interiors 및 지도 파생본에서는 층수/면적의 역별 조인·형식 변환을 수행했습니다.

## Mapzen / terrain / Natural Earth
Mapzen terrain tiles. Source: https://github.com/tilezen/joerd . SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey. Global ETOPO1 terrain data: U.S. National Oceanic and Atmospheric Administration. Per-tile source/extent/date metadata: GAME-REFERENCE/data/seoul-geography-20260830/manifest.json. Modification: subset selection; raw GeoTIFF bytes retained. Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com (public domain).

## NVIDIA 합성 인물 (CC BY 4.0)
Contains transformed excerpts from NVIDIA Corporation, Nemotron-Personas-Korea, https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea , licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . roster-100.json samples 100 synthetic personas with seed 90421; original row identifiers are preserved in source_uuid. Changes include name/role/faction assignment, fictional-world adaptation, field selection and truncation. These are synthetic personas, not real-person facts. Source dataset revision used by this repository: UNVERIFIED — pin before release.

## 소프트웨어·폰트
- Archify (2.17.0-dev.1 / 3.0.1, MIT): Copyright (c) 2026 tt-a1i (Archify), Copyright (c) 2025 Cocoon AI. HTML에 포함된 JetBrains Mono(SIL OFL 1.1) 고지를 보존합니다.
- Inter: Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter), SIL OFL 1.1.
- @seoul-dengoku/document-renderer: Copyright (c) 2026 Seoul: Dengoku contributors, MIT (package/LICENSE).
- 소유자 소프트웨어: Copyright (c) 2026 iz (ilseob lee), 루트 LICENSE 참조.
