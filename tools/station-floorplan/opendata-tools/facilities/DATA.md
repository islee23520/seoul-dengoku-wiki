# Seoul subway station facility data (downloaded 2026-11-15)

Goal: replace estimated facility positions in station floorplans with published data.
All sources are public open data (KOGL / portal terms) or public operator web pages; the owner approved using all public data.

- `raw/<ID>/` original bytes as served (CSV mostly CP949, XLSX, ZIP); `raw/<ID>/_page.html` = dataset page snapshot.
- `utf8/<ID>/` UTF-8 CSV copy of every table (XLSX flattened sheet by sheet).
- `layout_maps/` station layout / evacuation map images.
- `CATALOG.md` auto-generated per-file detail for **every** table: URL, update date, operator, columns, row count, coordinate flag, 3 sample rows. Regenerate with `python -I -X utf8 ../tools/make_catalog.py .`
- `_sum_*.json(l)` raw download logs. Tools (re-runnable) are in `../tools/`: `seoul_dl.py` (data.seoul file + sheet CSV), `seoul_sheet.py` (data.seoul sheet grid JSON fallback), `datagokr_dl.py` (data.go.kr fileData), `kric_dl.py` (data.kric.go.kr), `metro9_maps.py`, `make_catalog.py`, `dg_title.sh`.
- ID prefixes: `OA-*` = data.seoul.go.kr, `DG-<pk>` = data.go.kr `/data/<pk>/fileData.do`, `KRIC-<id>` = data.kric.go.kr `/rips/M_01_01/detail.do?id=<id>`.

Important caveat: **no dataset gives indoor x/y coordinates of facilities inside stations.** The only coordinates are (a) street-level pedestrian-network nodes for entrance elevators/lifts and underground-passage networks (WGS84, OA-21211/21212/21213), and (b) station-level points. Indoor position is given as **text**: floor (B1/B2...), zone (대합실/승강장/환승통로), nearest exit, and for platform-level items the **car-door position** ("시청 방면 5-1"). Combine that text with the layout maps.

## 1. Status by target

| # | Target | Real data obtained | Kind of position |
|---|---|---|---|
| 1 | Ticket gates | Counts per station by gate type, Seoul Metro 1-8 (OA-13294, 2016-2024 versions; 2020.3 xlsx splits EN/EX/REV/FL). Gate *locations* only indirectly: 325 voice-guide rows "개표소/게이트 앞" (OA-22526), toilets "게이트 내외 구분" (OA-22500/22501), ticket machines "(B1) 6번 출입구 개집표기 방향" (KRIC-994 etc.), gates drawn on layout maps. | count per station (no floor split) + text proxies |
| 2 | Fire shutters / smoke barriers | **Not found** in any portal. Related fire-safety *positions* obtained: extinguishers (OA-22496, KRIC-991/1083/975/1026/1142/1183/1274/1064), breathing apparatus (KRIC-984/1079/971/1017/1134/1180/1269), emergency ladders (KRIC-989/1305/973/1024/1140/1062), emergency phones (KRIC-990/...), AEDs (OA-22495), evacuation masks (OA-22499), hydrants + evacuation routes drawn on Seoul Metro layout maps. | floor + zone + text |
| 3 | EV / ES / wheelchair lift / moving walk | Full unit-level lists with floor from/to and detail location for every Seoul operator (see section 2). Coordinates only for street-access EV/lift nodes (OA-21211/21212) and passage network (OA-21213). | text (floor, exit, car-door) + WGS84 for street nodes |
| 4 | Machine rooms / substations / pumps / sumps | **Not found** per station. Only line-level counts of substations/전기실 (OA-13214) and ventilation shafts per station (OA-12926, text, no coordinates). OA-15794 배수펌프장 is river drainage, not stations (not downloaded). | none |
| 5 | Station layout maps | Seoul Metro 1-8: 276 official "역 이용 안내도 및 비상대피로" JPG (3373x3373 isometric + section view; EV/ES/toilets/hydrants/evac routes/exits). Line 9 (all 38 stations, Metro9 site, 920x847 + long alt-text description). Ui-Sinseol 13. Shinbundang 16. Floor/zone structure tables (역구조) for KORAIL, Seoul Metro 5-9, 9호선, Ui, AREX, Shinbundang. Depth (OA-13305), area per concourse/platform (OA-22448), floors/platform type (OA-22452, OA-11572). | images + per-floor table |
| 6 | Other indoor coordinates | OA-21213 underground passage network (6,563 node/link rows, WGS84 POINT/LINESTRING with lift/EV flags). 지하공간통합지도 is restricted (application + approval + return), not downloadable. | WGS84 2D network |

## 2. Key datasets (details for every file are in CATALOG.md)

Rows = data rows in the current file. "Coords" = has coordinate columns.

### Gates
| ID | Name | Updated | Coverage | Rows | Coords | Columns (short) |
|---|---|---|---|---|---|---|
| OA-13294 | 서울교통공사_1_8호선 개집표기 시설물 현황 (7 files 2016-2024) | 2024.04.25 | Seoul Metro 1-8 | 273 (2024-03-25) | no | 호선, 역번호, 역명, 턴스타일/슬림/플랩형/표준형/개방형/스피드/우대자용/엘리베이터용 개집표기 counts |
| OA-22519 | 개집표기 시설물 종류 정보 | 2024.12.05 | type photos + dimensions | hwpx only | no | (document, not table) |
| OA-22526 | 지하철 시각장애인 음성유도기 설치 위치 정보 | 2024.12.05 | Seoul Metro 1-8 | 5,551 | no | 호선, 외부역번호, 역명, 설치위치 (e.g. "북측 개표소 (내부)", "1번출구 게이트 앞") |

Samples (OA-13294 2024): `1,1,150,서울역(1),29,16,0,14,0,4,4,0` / `2,1,151,시청(1),0,64,0,0,0,4,0,0`

### Elevators / escalators / lifts / moving walks
| ID | Name | Updated | Coverage | Rows | Coords | Position fields |
|---|---|---|---|---|---|---|
| DG-15044261 | 서울교통공사_엘리베이터 설치현황_20260901 | 2026-09-04 | Seoul Metro 1-8 | 868 | no | 관리번호, (근접)출입구번호, 시작층(상세위치) e.g. "시청 방면5-1", 시작/종료층 지상_지하+역층 |
| DG-15044260 | 서울교통공사_에스컬레이터 설치현황_20260901 | 2026-09-04 | Seoul Metro 1-8 | 1,881 | no | 상하행, 출입구, 시작층/종료층 (지상_지하, 역층, 상세위치), 형폭 |
| DG-15044262 | 서울교통공사_휠체어리프트 설치현황_20260901 | 2026-09-04 | Seoul Metro 1-8 | 35 | no | 출입구, 시작/종료층 상세위치, 길이, 폭 |
| OA-22484 | 휠체어리프트 설치현황 (xlsx 2025-08, 2026-02) | 2026.04.21 | Seoul Metro | ~86 | no | 설치위치, 운행구간 |
| OA-22487 | 수평보행기(무빙워크) 설치현황 | 2026.04.21 | Seoul Metro | ~200 | no | 설치위치 |
| OA-13241 | 서울교통공사_엘리베이터 설치현황 (sheet, older) | basis 2025-03-10 | Seoul Metro 1-8 | 862 | no | same as DG-15044261 |
| OA-12514 | 엘리베이터 및 에스컬레이터 길이·높이 정보 | - | Seoul Metro | 2,740 | no | 승강행정, 설치높이, 운행길이, 운행구간 (B2-1F) |
| OA-15994 | 교통약자 이용시설 승강기 가동현황 | - | Seoul Metro | 2,809 | no | 승강기명, 운행구간, 설치위치 |
| DG-15118716 | 9호선2_3단계 엘리베이터 설치현황_20260131 | 2026-09-02 | Line 9 phase 2-3 (Seoul Metro) | 55 | no | 시작층(상세위치) "신논현 방면 4-4", 운행구간 B5-B1, 설치위치 |
| KRIC-528 / 505 / 574 | 서울메트로9호선 엘리베이터 / 에스컬레이터 / 휠체어리프트 | 2026.07.28 / 2026.07.28 / 2023.06.27 | Line 9 phase 1 | 327 / 683 / 96 | no | 출입구, 상세위치, 시작/종료층 |
| KRIC-529 / 506 / 575 / 570 | 서울교통공사 EV / ES / 휠체어리프트 / 무빙워크 (KRIC standard form) | 2026.07.28 | Seoul Metro | 868 / 1,889 / 67 / - | no | same standard columns + 승강기 상태 |
| KRIC-530 / 977 | 우이신설 EV / ES | 2026.06.30 | Ui-Sinseol | 154 / 101 | no | 상세위치, 층 |
| KRIC-1187 / 1186 | 남서울경전철(신림선) EV / ES | 2025.12.31 file | Sillim | 132 / 100 | no | 상세위치, 층 |
| KRIC-1031 / 1030 / 1020 | 신분당선 EV / ES / 무빙워크 | 2026.07.31 | Shinbundang | 144 / 265 / - | no | |
| KRIC-1147 / 1146 / 1137 | 공항철도 EV / ES / 무빙워크 | 2026.07.01 | AREX | 195 / 170 / - | no | |
| KRIC-1069 / 1068 / 1076 / 1058 | 한국철도공사 EV / ES / 휠체어리프트 / 무빙워크 | 2025.03.04 | KORAIL (all lines incl. Seoul sections of 1/3/4호선, 경의중앙, 경춘, 수인분당) | 1,250 / 2,232 / - / - | no | |
| KRIC-1278 / 1277 | GTX-A EV / ES | 2024.08.01 | GTX-A (2024-04 snapshot) | 38 / 50 | no | "지하 1층 GTX-A 역무실 앞 ~ 지하 3층 환승통로" |
| DG-15041389..96, 15041367..74, 15041428..35 | 국가철도공단_수도권1~8호선 엘리베이터 / 에스컬레이터 / 휠체어리프트 | 2026-09..11 | multi-operator per line number (KORAIL, Seoul Metro, Incheon, 구리) | 88-526 per file | no | 출입구번호, 상세위치, 시작/종료층 |
| OA-21212 | 서울시 지하철역 엘리베이터 위치정보 | daily (data basis 2020) | 271 stations, all Seoul operators | 552 | **WGS84 POINT** | 노드 WKT, 노드 ID, 지하철역코드/명 |
| OA-21211 | 서울시 지하철 출입구 리프트 위치정보 | daily (basis 2020) | 44 stations | 83 | **WGS84 POINT** | same |
| OA-21213 | 서울시 지하철역 연계 지하도 공간정보 | daily (basis 2020) | 299 stations | 6,563 (3,491 nodes, 3,072 links) | **WGS84 POINT/LINESTRING** | 링크 유형, 시작/종료 노드, 링크 길이, 리프트/엘리베이터 flags |
| OA-11573 | 노약자 장애인 편의시설 현황 (+ 2018 승강총괄 xlsx) | 2026.04.21 | Seoul Metro | 273 | no | counts EV/ES/WL/MW per station |
| DG-15120911 | 한국철도공사_역별 승강설비 현황 | 2026-11-13 | KORAIL | 630 | no | counts only |

Samples:
- DG-15044261: `1,1호선,서울역(1),내부#1,내부,시청 방면5-1,지하,2,지하,1,11,750,0074-205,2026-09-01`
- DG-15044260: `1,1호선,서울역(1),1,상행,내부,지하,2,연결통로(4호선),지하,1,연결통로(4호선),800,1800-448,2026-09-01`
- OA-21212: `"NODE","POINT(127.01744971746365 37.57329704981851)","212659","0","1111000000","종로구","1111017500","숭인동","268","동묘앞"`
- OA-21213: `"LINK","","0","","LINESTRING(126.97739560816339 37.5716385206043,126.97740776922767 37.571426192448655)","214184","1000","211590","211260","23.5900",...,"274","광화문(세종문화회관)","0","0"`
- Note: OA-21211/21212 points are the pedestrian-network access nodes (street/entrance side), not underground cab positions.

### Fire safety and other in-station equipment with floor/zone text
| ID | Name | Updated | Coverage | Rows |
|---|---|---|---|---|
| OA-22496 | 서울교통공사_소화기설치현황 | 2024.12.05 (basis 2025-03-10) | Seoul Metro 1-8, per floor/zone with counts | 877 |
| OA-22495 | 역별 자동심장충격기 설치 현황 | 2024.12.05 | Seoul Metro, floor + "지하1층 대합실 4번 출구 앞" | 419 |
| OA-22499 | 역별 화재용 대피마스크 현황 | 2024.12.06 | Seoul Metro, station lat/lon only | 309 |
| KRIC-984 / 989 / 990 / 991 | 서울교통공사 공기호흡기 / 비상사다리 / 비상콜폰 / 소화기 | 2026.07.28 | Seoul Metro | 1,238 / 925 / 2,213 / 882 |
| KRIC-1079 / 1305 / 1082 / 1083 | 9호선 same set | 2026.07.28 | Line 9 phase 1 | 191 / 25 / 231 / 204 |
| KRIC-971 / 973 / 974 / 975 | 우이신설 same set | 2026.06.30 | Ui-Sinseol | ~100 each |
| KRIC-1017 / 1024 / 1025 / 1026 | 신분당선 same set | 2026.07.31 | Shinbundang | 109 / 101 / 503 / 634 |
| KRIC-1134 / 1140 / 1141 / 1142 | 공항철도 same set | 2026.07.01 | AREX | 123 / 107 / 135 / 134 |
| KRIC-1180 / 1182 / 1183 | 남서울경전철 공기호흡기 / 비상콜폰 / 소화기 | 2026.02.04 | Sillim | 220 / 100 / 125 |
| KRIC-1055 / 1062 / 1063 / 1064 | 코레일 same set | 2025.03.04 | KORAIL | - / 226 / 1,266 / - |
| KRIC-1269 / 1273 / 1274 | GTX-A same set | 2024.08.01 | GTX-A | 87 / 100 / 203 |
| KRIC-994 / 1085 / 976 / 1029 / 1145 / 1185 / 1067 / 1276 | 승차권자동발매기 (all operators) | 2024-2026 | all | 808 / 96 / 99 / 98 / 100 / 105 / - / 66 |
| KRIC-381 / 380 / 982 / 1039 / 1152 / 1192 / 1284, OA-22500 / 22501 | 화장실 / 장애인화장실 (OA ones have 위도/경도 of the station + 게이트 내외 구분) | | all | |
| KRIC-557 / 539 / 1016 / 555 | 고객센터 (station office) | | | |
| OA-22489 | 물품보관함 위치정보 | 2024.12.05 | Seoul Metro | 332 |
| OA-22533 | 지하철 연결통로 시설물정보 (building connections) | 2024.12.06 | Seoul Metro | 216 |
| OA-22488 | 역사승강장안전문(PSD)설치정보 | 2024.12.05 | Seoul Metro, door count per station | 283 |

Samples: KRIC-989 `1,서울교통공사,1호선,서울역,1,비상사다리,지하,2,승강장,,(B2) 시청 방면(상행) 승강장 1-1 출입문 근처,2,20250531,상선 시점`; KRIC-994 `1,서울교통공사,1,청량리,140,발매충전,지하,1,6,(B1) 6번 출입구 개집표기 방향,1,20260531,`; OA-22496 `1,1호선,서울(1),1,소화기,지하,B2,승강장,1,12,2025-03-10`.

### Station structure (floors, depth, area, coordinates)
| ID | Name | Coverage | Rows | Coords |
|---|---|---|---|---|
| DG-15041150/53/54..60/63/32/46/51/52 | 국가철도공단_*_역구조_데이터_20260630 (지상구분, 역층, 역층구분 승강장/대합실/연결통로, 면적) | KORAIL, 수도권1,3-9호선, 우이, AREX, 신분당, 수인분당, 경춘 (2호선 file absent) | 26-733 per file | no |
| KRIC-172..204 | 2018 역구조 (older form) | same + 서울메트로/서울도시철도 split | 12-431 | no (KRIC-194 2호선 file missing on server) |
| OA-13305 | 서울교통공사_역사심도정보 (11 versions) | Seoul Metro 1-8: 층수, 형식, 지반고, 레일면고, depth | 277 | no |
| OA-22448 | 역사면적정보 (대합실/승강장 면적) | Seoul Metro | 277 | no |
| OA-22452 / OA-11572 | 역사운영 현황 / 역사건축정보 (층수, 승강장유형, 길이, 출입구 수, 준공) | Seoul Metro | 276 | no |
| OA-12926 | 환기구현황 (10 versions; 2020.3 xlsx has 인접건물) | Seoul Metro 1-8 | 2,240 | no |
| OA-13214 | 전력설비 현황 (substation / 전기실 counts per line) | Seoul Metro | 22 | no |
| OA-22534, OA-21232, KRIC-40/81/39/80/33/65/41/64/60/910/907/1222/1188/1264/1279 | station lat/lon + 역사정보 (platform type, PSD, address) | all operators | | **lat/lon (station point)** |

### Layout maps (`layout_maps/`)
| Folder | Source | Count | Notes |
|---|---|---|---|
| `seoulmetro_1-8/<N호선>/<역번호> <역명>.jpg` | DG-15004974 서울교통공사_역이용안내도_20260831 (zip, 380 MB, raw in `raw/DG-15004974/`) | 276 (1:10, 2:50, 3:34, 4:26, 5:56, 6:39, 7:42, 8:19) | 3373x3373; floor section + isometric; EV, ES, toilets, hydrants, AED, relief-goods boxes, emergency phones, evacuation routes, exits; gates visible as fare lines |
| `line9_all38/` + `index.json` | metro9.co.kr station info (`infoAjax.do`, sbwyNo 4101-4138) | 38 | 920x847 thumbnails (full-size not exposed); `index.json` has the long alt-text describing floors, EV/ES, 매표소, 개찰구, and station structure text (AFC 발매기/정산기 counts) |
| `ui_sinseol/` | ui-line.com `intro_02_01..13.php` | 13 | 이용안내도 per station |
| `shinbundang/SB0nn_<역명>_*.jpg` | shinbundang.co.kr `dxline6_1.jsp?st_cd=SB001..016` | 16 | 역이용안내도, 842x593-ish |

## 3. Looked for but not obtained

| Wanted | Result / reason |
|---|---|
| Gate position per floor (any operator) | No public dataset. Seoul Metro publishes counts per station only (OA-13294). Use OA-22526 voice guides, ticket-machine text, toilet 게이트 내외, and layout maps as proxies. |
| 방화셔터 / 제연경계벽 | No dataset on data.seoul, data.go.kr, or KRIC catalog (1,212 KRIC file datasets scanned, `raw/kric_catalog.tsv`). Would need 정보공개청구 to the operators. |
| 기계실 / 변전실 / 배수펌프 / 집수정 per station | None. Only line-level counts (OA-13214). |
| Seoul OpenAPI services OA-22724..22749 (서울교통공사: 최단경로이동, 편의시설위치 EV/ES/화장실/발매기/고객안전실/ATM..., 교통약자 EV/ES/휠체어리프트/무빙워크, **빠른하차정보** with car-door positions per facility) | Sheet view is API-backed; full download needs a free Seoul OpenAPI key (sample key capped at 5 rows). 5-row JSON samples saved in `raw/seoul_openapi_samples/OA-<n>_<service>.json`. Much of the same content is in the KRIC/DG files above. With a key: `http://openapi.seoul.go.kr:8088/<KEY>/json/<service>/1/1000/`. |
| KRIC Open API (`openapi.kric.go.kr/openapi/convenientInfo/stationElevator`, `handicapped/stationCnvFacl`, 교통약자 역사 내 이동동선) | Needs a KRIC serviceKey (not available). File equivalents downloaded instead. |
| 지하공간통합지도 (MOLIT, 지하구조물 incl. 지하철 역사) | Restricted: application, approval, return/destroy; not public download. |
| KORAIL, Sillim, GTX-A, AREX layout map images | No open file dataset; operator pages not scraped (KORAIL letskorail pages not attempted). |
| Seoul Metro sheet OA-13242 (에스컬레이터 counts) / OA-13321 (편의시설) | Sheet endpoint returns empty / error; superseded by DG-15044260 and OA-22523. |
| KRIC-194 (수도권2호선 역구조, 2018) | Server says file does not exist. |
| DG-15133412 (EV/ES 길이높이 data.go.kr mirror) | Page has no file link; same data as OA-12514 (downloaded). |
| OA-22461 공기청정기 2026-02-19 file | DRM-encrypted (DOCUMENTSAFER) by the provider; deleted from `utf8/`, 2025-07-23 version kept. |
| Line 9 phase 2-3 escalators | Separate Seoul dataset not located; KRIC-506 / DG-15044260 contain only 3 Line-9 rows. |
