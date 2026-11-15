# geo/ — 지하철 환기구 좌표와 S-Map geoserver 레이어 목록

작성 2026-11-15. 기준 bbox는 왕십리 `203100,551150,203450,551480` (EPSG:5186)이다.

## 1. 환기구 좌표

### 결론: 좌표가 들어 있는 공개 환기구 데이터는 찾지 못했다

| 출처 | 결과 |
|---|---|
| data.go.kr 15044434 `서울교통공사_환기구현황_20251130` | OA-12926과 같은 데이터다(9개 열: 호선·번호·구간·용도·기능·기타·높이·구조물형태·필터유무). 좌표와 주소가 없다. 자동변환 OpenAPI(odcloud)도 같은 열을 쓰고 serviceKey가 필요하다. `openapi.do` 페이지는 404다. |
| data.seoul OA-12926 과거 파일 (seq 1~5: 2013·2015·2017·2020.3 xlsx) | 좌표는 없다. 2013/2015/2017 판에는 **`인접건물`(근처 랜드마크 이름)**, 가로·세로·보도폭이 있다. 2017 1~4호선 990행, 5~8호선 약 1,250행. 원본은 `raw/dataseoul/f1..f5.xlsx`에 있다. |
| data.go.kr 검색 "환기구" | 서울 데이터는 위의 하나뿐이다. 나머지는 광명시 환기구 SHP(15067330), 대전·광주 도시철도 자료, 하수관거 자료다. |
| 2014 판교 사고 뒤 서울시 전수조사 (환기구 18,862개) | 보도자료 집계만 있고 위치 데이터는 공개되지 않았다. |
| S-Map geoserver (WFS 292개, WMS 813개) | 환기구 레이어가 없다(아래 2절). |
| S-Map "지하시설물" 메뉴 (하수관거·전기·통신·가스·난방·상수도) | `index.html`에서 관리자 IP일 때만 보인다. 환기구 항목도 없다. |
| indoormap.seoul.go.kr (S-Map 실내지도 링크) | DNS가 응답하지 않는다. 서비스가 종료된 것으로 보인다. |
| 9호선·신림선·우이신설선·코레일·국토부 지하공간통합지도 | 공개 환기구 위치 데이터를 찾지 못했다. 지하공간통합지도는 인증된 기관만 쓸 수 있다. |

### 대안: 랜드마크를 지오코딩했다 → `vent_coords.csv`

- 입력: `../vent_utf8.csv`(OA-12926 2024판, 2,233행)에 `vent_landmarks.csv`(2013/2015/2017 `인접건물`, 2,174개 키)를 붙였다. 5~8호선 옛 번호 5001은 (5, 1)로 바꿨다. **랜드마크는 구간이 서로 맞을 때만 붙였다.** 정차역 이름의 앞 두 글자가 하나라도 겹쳐야 한다. 그 결과 2,128/2,233행(95.3%)에 랜드마크가 붙었다. 30행은 번호가 바뀌어(구간 불일치) 랜드마크를 버렸다.
- 지오코더(모두 S-Map 프록시, 키 없음)
  1. 랜드마크 텍스트에 "N번 출입구"가 있으면 S-Map `seoul:subway_exitno` 좌표를 쓴다.
  2. `search/searchLocal.do?searchKeyword=` (GET, Naver 지역검색 프록시, WGS84×1e7)
  3. `search/getAddrApi.do` + `getAddrCoordApi.do` (juso 프록시, EPSG:5179 entX/entY)
- 결과는 구간 정차역들을 이은 선에서 **450 m 안**에 있어야만 채택했다. 정차역 좌표는 `seoul:subway_station` 폴리곤 중심이다. 서울 밖 역은 Naver에서 찾았다.
- 출력 열: `line,no`(OA-12926 호선+번호 그대로라 조인율 100%), `x5186,y5186,lon,lat`, `precision`, `matched_name`, `geocoder`, `dist_to_corridor_m`, 그리고 원본 속성.

| precision | 건수 | 의미 |
|---|---|---|
| landmark | 1,130 (50.6%) | 랜드마크 POI 좌표. 코리더까지 거리 중앙값 82 m, p90 276 m |
| station_centroid | 612 | 역사 구간 환기구. 역 폴리곤 중심을 넣었다(근사) |
| section_midpoint | 447 | 본선 구간 환기구. 두 역 중간을 넣었다(근사) |
| none | 44 | 하남선·별내선 연장 구간이라 역 좌표를 얻지 못했다 |

geocoder별 건수: naver_local 1,032 / subway_exitno 64 / juso 34 / station 1,059.

**정확도 주의**: landmark 값은 "근처 건물" 위치이지 환기구가 놓인 지점이 아니다(보통 수십 m 차이). 같은 랜드마크를 쓰는 여러 환기구는 좌표가 똑같다. POI 이름이 비슷해 다른 곳에 잘못 붙은 사례도 섞여 있다. 예를 들어 "왕십리주차장"이 "투루파킹 왕십리세신빌딩점"으로 붙었다. 평면도에는 **후보 위치**로만 쓰고, 최종 위치는 항공사진·로드뷰로 확인해야 한다. 지오코딩 캐시는 `raw/search/geocode_cache.json`이다(재실행하면 캐시에서 읽어 네트워크를 쓰지 않는다).

재현 순서: `scripts/landmarks.py`를 실행한 뒤 `scripts/geocode_vents.py`를 실행한다.

## 2. S-Map geoserver 레이어 목록

- 접근: `https://smap.seoul.go.kr/imageProxy.do?svc=2D&param=<urlencoded path>`에 Referer와 브라우저 UA를 붙인다. WFS GetCapabilities로 292개, WMS로 813개 레이어가 나왔다(`raw/wfs_caps.xml`, `raw/wms_caps.xml`, `raw/layers.json`).
- 전체 레이어의 bbox 건수와 전체 건수는 `raw/hits.json`과 `raw/hits.txt`에 있다(WFS 1.1.0 `resultType=hits`). 표본 GeoJSON은 `samples/<workspace>__<layer>.json`, 필드와 예시 값은 `raw/inventory.json`에 있다.
- **WCS GetCoverage는 프록시가 400으로 막는다.**
- **병렬로 요청하면 IP가 몇 분간 차단된다.** 6스레드로 요청했을 때 실제로 차단됐다. 순차로 0.4~1.5 s 간격을 두고 요청해야 한다.
- 환기구, 지하철 구조물·터널, 지하상가, 공동구, 대피소(북한산 대피소 마커뿐), 맨홀, 엘리베이터 레이어는 **geoserver에 없다.**

### 관련 레이어

| 레이어 | 내용 | geom | 핵심 필드 | 왕십리 bbox / 전체 |
|---|---|---|---|---|
| `seoul:subway_station` | 역사 외곽 폴리곤(노선별) | MultiPolygon | line_nm, station_na | 4 / 393 |
| `seoul:subway_exitno` | 출입구 번호 점 | Point | subname, subtype(호선), enternum | 8 / 1,592 |
| `seoul:subway_line` | 노선 선형(역 사이 구간) | MultiLineString | from_name, to_name, sub_num, managing_a | 8 / 379 |
| `seoul:tl_spbd_buld` (= `_2`) | 도로명주소 건물 외곽 | MultiPolygon | bd_mgt_sn, pos_bul_nm, **gro_flo_co / und_flo_co(지상·지하 층수)**, bdtyp_cd, rn_cd | 114 / 592,740 |
| `seoul:footprint_w_minmax` | 3D 건물 외곽 + 높이 | MultiPolygon | min, max (표고 m, 바닥과 지붕) | 112 / 597,848 |
| `seoul:tl_sprd_manage` | 도로명 도로 구간 | MultiLineString | rn, **road_bt(도로폭 m)**, road_lt, roa_cls_se | 29 / 67,315 |
| `seoul:lp_pa_cbnd` | 연속지적도 필지 | MultiPolygon | pnu, jibun(지목 접미: 도·대 등) | 253 / 897,105 |
| `seoul:poi_base` | VWorld POI(2016) | Point | text, level | 26 / 98,936 |
| `seoul:seoul_area` | 토지피복(2018 항공영상 기반) | MultiPolygon | l1/l2/l3_name | 401 / 1,000,000 |
| `seoul:lt_c_uq161` 등 `lt_c_*` | 토지이용규제 지역지구(UPIS/KLIS 코드). UQS = 도시계획시설 도로로 추정, UQ111 = 높이 제한(remark "7층이하"), ZA001 = 건축선 후퇴 | MultiPolygon | mnum, remark | uq161 28, uq111 13, uq141 8, za001 4 등 |
| `seoul:area_shp` | S-Map 3D 모델 등록 영역 | MultiPolygon | model_id, user_name | 3 / 11,203 |
| `seoul:bsl_ps` | 측량 기준점 | Point | ftr_cde, grd_cde, bse_nam | bbox 요청 오류 / 4,628 |
| `seoul:smap_traffic` | 실시간 소통 링크 | MultiLineString | axis_name, spd, traffic_lv | 10 |
| `seoul:seoul_1m` (WMS, raster) | **1 m DEM**. 같은 키워드의 `seoul_1m_2025`는 S-Map이 `wms_seoul_dem`으로 쓴다 | raster | GetFeatureInfo → `GRAY_INDEX` = 표고 m | 25 m 격자 210점 `samples/seoul__seoul_1m_dem_grid25m_wangsimni.csv` (15.1~27.4 m) |
| `seoul:mms_*`와 13개 지구 `*_a1_lane … *_c1_node` | 자율주행 HD 정밀지도(차선, 정지선, 링크, 노드, 노면표시 면·선·점, 표지, 신호, 지주). `surfsign_plane signtype 4`가 주로 횡단보도 | 3D(XYZM) | linkid, nodeid, signtype, hdufid, layer | **왕십리 0.** 덮는 곳은 도심 dlm, 상암, 여의도 yud, 강남 gcg_ah, 성수 sjn4 등 시범 지구뿐이다. 서버 버그로 bbox·CQL BBOX 필터가 오류를 낸다("Output dimension must be 2 or 3"). 전체를 받아 로컬에서 걸러야 한다 |
| `panorama:alley_*`, `cpted_*` | 골목 파노라마 링크·노드, CPTED 경로 | Line/Point | link_id, node_fr/to, 사진 경로 | 왕십리 0 |
| `seoul:passweak_area` | 보행 취약 지역 | MultiPolygon | nm, code | 왕십리 0 |

WMS GeoTIFF 출력은 스타일이 입혀진 8비트 이미지라 실제 표고 값이 아니다(`samples/seoul__seoul_1m_wangsimni_*.tif`). 실제 값은 `scripts/dem_sample.py`로 GetFeatureInfo를 점마다 호출해서 얻는다.

### geoserver 밖의 관련 자원 (S-Map JS에서 발견)

- `js/libs/indoor/subwayDatas.js`: 실내지도 3D 역사 **805개 항목**이 있다. 역마다 prjId(예: 왕십리역 418), 모델 원점(EPSG:5186 x, y, z, 예: 왕십리 203279.9, 551310.9, z −2.96)과 회전값, 출입구별 상대 위치(x, y, z와 방향)가 들어 있다. 원본은 `raw/js/js_libs_indoor_subwayDatas.js`다. 모델 파일 URL은 찾지 못했다(데이터를 `topis/getIndoorpoi.do`와 3D 타일로 불러온다).
- 3D 타일 `prefix3D + /tile.sqlite/{building_2025_lod2, structure_2019, dem_2023, ortho_drone_12cm_2024 …}`: 건물 LOD1/2, 구조물, DEM, 정사영상.
- 이미 있는 데이터셋(S-Map 밖): data.seoul OA-21211(출입구 리프트), OA-21212(엘리베이터 위치, WGS84). OA-21213(역 연계 지하도 공간정보)은 서비스가 종료됐다.

## 파일

- `vent_coords.csv`: 환기구 좌표 결과
- `vent_landmarks.csv`: 과거 파일에서 뽑은 인접건물 표
- `samples/`: 레이어별 표본, DEM 격자와 TIF
- `raw/`: capabilities, JS, 과거 xlsx, 검색 캐시와 로그, hits·inventory
- `scripts/`: `smap.py`(프록시 클라이언트), `inventory.py`, `hits.py`, `landmarks.py`, `geocode_vents.py`, `dem_sample.py`
