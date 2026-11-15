# 역 방어 평면도 생성기 (v4 정착지, 실측 지리 데이터 기반)

작성 2026-11-15. v4 정착 원칙(`settlement-principles.md`)에 따른 역 방어 평면도(설계도)를 307개 역마다 만든다. 시트 한 장은 다음 세 부분으로 이루어진다.

- 지상 평면: 실측 지형 위에 2126 설정을 얹는다.
- 지하 평면: S-Map 실내 3D 모형을 층별로 실측한 평면이다.
- 근거와 출처 상자

규칙: 이 게임의 모든 데이터는 실제 서울 지리 데이터를 기반으로 설계한다. 실측이 없는 위치는 `[추정]`으로 표시하고 출처 등급(A 실측, B 공개 협업, C 설정)을 남긴다.

결과물(PNG·SVG·`data.json`)과 내려받은 원자료·캐시는 크기가 커서 저장소에 넣지 않는다. 작업 위치는 `E:/git/seoul-dengoku-wiki-wt/scratch/floorplan/`(`ROOT`)이다. 생성기 코드를 그 위치의 `tools/`에 두고 실행한다.

## 쓰는 자료

| 자료 | 얻는 법 | 쓰임 |
|---|---|---|
| S-Map 실내 3D 모형 322개(glb), 카탈로그, 출입구 표식 | `getSubwayData.do`, `subwayDatas.js`, 모형 서버(`fetch_models.py`). 2호선 51역은 seoul-dengoku `smap-source` 사본을 먼저 쓴다 | 층 평면, 바닥 높이, 선로, 출입구 번호·위치 |
| 모형 텍스처·재질 이름·글자 판독(Windows OCR) | `texsurvey/`, `facility_roles.py` | 개찰구, 계단·에스컬레이터(셔터 선 자리), 승강기, 기계실 |
| 서울시 공간정보 WFS(S-Map geoserver) | `smap_wfs.py` | 도로명주소 건물, 토지피복, 도로명 도로 |
| S-Map 오픈랩 1:1000 수치지형도(공개 레이어 SHP) | `openlab.eseoul.go.kr/qgisplugin/SHP/<레이어>.zip`, `topo_clip.py`로 역마다 잘라 둠 | 지하환기구, 지하도·입구, 도로면, 철도경계, 하천, 건물(층수), 담장, 제방, 성토·절토, 교량, 등고선 |
| 서울 열린데이터광장 | 파일과 OpenAPI(키는 `~/.omo/agent/keys/seoul_openapi.key`, 저장소에 넣지 않음). `opendata-tools/` | 환기구 현황, 빠른하차정보(칸-문), 고객안전실, 개찰구 대수, 역 안내도, 역사심도 |
| KRIC 승강기 자료, 행정안전부 출구 레이어 | `opendata-tools/gaps/` | 승강장 층 확인, 출입구 좌표 보강 |
| OpenStreetMap(Geofabrik 추출) | `osm_extract.py` | 하천·물길, 환기구, 출입구 번호 대조 |
| v4 정착지 설정 | `.omo/handoff/v4/settlement/data/` | 2126 인구, 세력, 층 쓰임, 급배기 방향 |

## 순서

1. `fetch_models.py`: 모형을 받는다. 로컬 사본이 있으면 그것을 먼저 쓴다.
2. `render_station.py`(Blender 5.2, `bl_floors.py`): 층별로 위에서 내려다본 렌더를 만든다. 선로·시설 폴리곤을 뽑고 북쪽을 위로 맞춘다(EPSG:5179).
3. `topo_clip.py`: 수치지형도를 역마다 반경 350 m만 자른다.
4. `compose.py`: 시트 한 장을 합성한다. 성곽은 `perimeter.py`가 만든다.
   - 지상 핵심(쓰는 출입구와 급기구)에서 실측 블록을 하나씩 붙여 나간다.
   - 경계 인원 예산, 인구 기준 면적 상한, 반경 280 m 가운데 하나에 걸리면 멈춘다.
   - 성곽 선은 2 m 간격으로 판정해 건물 외벽, 담장, 자연 방어선, 잔해 둑, 길목 바리케이드로 나눈다.
   - 망루는 등고선 해발에 층수 × 3.3 m를 더한 최고점에 둔다.
   - 아크는 지상 성곽 없이 출입구를 위장한다.
5. `batch.py`/`recompose.py`: 전체 역을 돌린다. `board_all.py`/`stage_factions.py`: 세력별 보드와 갤러리 묶음을 만든다.

## 실행 예

```sh
cd E:/git/seoul-dengoku-wiki-wt/scratch/floorplan
PYTHONIOENCODING=utf-8 python tools/render_station.py 왕십리
PYTHONIOENCODING=utf-8 python -W ignore tools/compose.py 왕십리     # out/왕십리/왕십리.{svg,png}, data.json
for k in 0 1 2 3; do python -W ignore tools/recompose.py $k 4 & done; wait
```

필요한 것: Python 3.12와 `numpy`, `scipy`, `scikit-image`, `shapely`, `pyproj`, `pillow`, `osmium`, `pyshp`, `resvg-py`. Blender 5.2도 필요하다.

## 한계

- 방화셔터와 기계실의 정확한 좌표, 층별 개찰구 위치는 공개 자료에 없다. 지금은 모형 판별과 칸-문 환산으로 대신하고, 남는 자리는 `[추정]`이다.
- 환기구 표(서울교통공사)에는 좌표가 없다. 수치지형도 지하환기구로 실제 위치를 그리고, 그 레이어가 덮지 못하는 곳만 인접 건물 근사 좌표를 쓴다.
- KRIC 이동동선 OpenAPI는 휴대폰 본인인증과 관리자 승인을 거쳐야 쓸 수 있다.
