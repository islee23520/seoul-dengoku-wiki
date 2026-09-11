# Ultrawork Notepad — 재벌모티브 가문 6 + 역사모티브 인물 10(B047) + 로스트 로봇 3군(G25–G27)+M040+로어 문서
Started: 2026-09-10T20:07:21

## Plan (exhaustively detailed)
1. [P0] 브랜치/노트패드/계획파일/예시추출 (본 셀)
2. [P0] todo init + 병렬 드래프트 자식 7기 spawn
3. [SC1-RED] schema CORPORATE_HOUSES 14→20 + verify E_HOUSE_COUNT 24→30 + test 24→30 갱신 후 houses 스테이지 RED 캡처
4. [SC1-GREEN] 가문 6개 atlas 적재 + materialize + houses/theaters 스테이지 GREEN → 커밋
5. [SC2-RED] E_K_MAP 412→422, B047 매니페스트 기대, 배치수 46→47 갱신 후 story 스테이지 RED 캡처
6. [SC2-GREEN] humans 10 + story_batches B047 + story_contents.B047 + Cast-Index 동기화 + materialize → GREEN → 커밋
7. [SC3-RED] HOSTILE_GROUPS 24→27, 몬스터 384→393, 그룹 수 24→27 갱신 후 monster/group 스테이지 RED 캡처
8. [SC3-GREEN] G25–G27 도씨에 + M040 + monster_batches/contents 적재 + Lost-Technology-Lineage.md + _Sidebar 링크 + materialize → GREEN → 커밋
9. [SC4] 전체 게이트 재실행(npm test, test-world-atlas, materialize --check, expansion 10스테이지, monster/cast/strategy) 녹색 캡처 → 커밋(잔여)
10. [SC5] 금지토큰 rg 선검사 증거 + self-review 기록
11. 최종 보고

## Success criteria + QA scenarios
- SC1 가문 6: RED(E_HOUSE_COUNT actual=24) → GREEN(houses 스테이지 rc=0, test-world-atlas 녹색, rg HC15|HC20 Operating-Houses.md)
- SC2 B047: RED(E_K_MAP actual=412) → GREEN(story-manifest+story-batch rc=0, B047 페이지 투영, test-verify-cast 녹색)
- SC3 로스트: RED(그룹/항목수 actual=24/384) → GREEN(monster-manifest+group-dossiers rc=0, G25–G27·M040·Lost 문서 존재)
- SC4 전체: npm test + test-world-atlas + materialize --check + expansion 10 + monster/cast/strategy 전부 exit 0
- SC5 금지토큰: 새 산문에 COMPANY_TOKENS/공개금지용어 0건 (rg 증거)

## Now
P0 완료 중 — 브랜치 생성됨, 예시 추출 진행

## Todo
(아래 todo 도구로 미러)

## Findings
- 카운트 계약: world-atlas-verify.mjs — E_HOUSE_COUNT=24(:39), E_K_MAP=412(:96), 스키마 CORPORATE_HOUSES/명칭 완전일치(:50-51), E_FULL_STATE_OWNERSHIP(:53), arcs>=3(:57), test-world-atlas :44 24 houses, :59 46 batches, :64 24 groups/384 entries, :242 B023..B046 기대목록
- 그룹 페이지: n>=19는 canonical 필수(scenario_outlines 3개 or dossier_prose), 시나리오 섹션 '### Gxx-SCn · 제목'
- SVG 3종은 atlas diagrams에서 투영(world-atlas-isometric.mjs), generate-core-isometric-diagrams.mjs는 별개 13종 페이지 도식
- materialize --check가 투영 일치 검증, unexpected-projection 가드가 미등재 배치 페이지 거부

## Learnings
(추가 예정)

## Findings 추가 (통합 계약)
- 몬스터: 그룹당 정확히 16항목(E01–E16) row-major → G25–G27은 M040/M041/M042 3배치, 총 432항목, 배치 39→42 (robots-b 정정 전송 완료)
- 합성체: id는 H01–16/F01–16/V01–16. H25–27 없음 → G25/G26/G27 links.synthetics를 F09/F10/F11로 패치 예정
- 그룹 시나리오: G25–27은 G13–G18 패턴(아웃라인 없이 scenario_links 3 + 도씨에 ### 섹션)
- arcs: 신규 가문 6·그룹 3 커버 필요(E_MISSING_ARC)
- 스토리 쿼터: E_QUOTA_DRIFT 297→307, E_BATCH_COUNT 46→47, E_K_MAP 412→422(2곳)
- G25/G27 도씨에 JSON에 리터럜 개행 — strict=False 파싱으로 복구 처리

## 소유자 steering (실명 전환) — 2026 정세 기준
- 신규 기업: 실존 대기업 실명 그대로 (HC15 네이버, HC16 KT, HC17 LG에너지솔루션, HC18 HMM, HC19 호텔신라, HC20 HYBE, HC21 카카오(신규작성), HC22 테슬라코리아(신규작성·로스트 로봇 기원))
- 기존 14: 실명 치환 (청람전자원→삼성전자, 해륜기동문→현대자동차, 백광생활과학가→LG생활건강, 통맥에너지연합→SK에너지, 골목연결국→쿠팡, 해동제철성→포스코, 성화궤도방위문→한화에어로스페이스, 도성생활유통가→롯데쇼핑, 서부식문화동맹→CJ제일제당, 백야배송단→CJ대한통운, 거도중공회→현대중공업, 도성건축연맹→HD현대건설, 여의장부원→신한지주 / 북문지식원 유지: 비대기업 길드)
- 게이트 수술: 원천 캐논 실명 허용(scanCompanyTokens 제거), 발행 전 개명 도구=company-aliases.json(real→codename), 테스트 2건 신계약으로 교체
- E_HOUSE_COUNT 30→32, 새 가문 도씨에 로스트 로봇 기원은 HC22 테슬라코리아 시험선으로 연결
- 인물관계: 오너일가 구도(후계·형제 분쟁·계열 협력)를 relations/서사에 반영, 개인명 가명 유지

## Self-review (HEAVY 유지 사유: 동결 스키마·K-map 포지셔널 id·row-major 몬스터 계약이라는 도메인 모델 변경 + 전 게이트 회귀 방어)
- SC1 RED→GREEN: E_HOUSE_COUNT 24(actual)→32 녹색, seam 테스트 2종 교체(실명 주입 시 code 0), alias 커버리지 테스트 추가 ✓ (evidence/sc1-*.txt)
- SC2 RED→GREEN: E_K_MAP 412/E_BATCH_COUNT 46/E_QUOTA 297 → 422/47/307 녹색; K-id 전역 재부여(337건) 스윕 후 무효 id 0 ✓ (sc2-red-*.txt, sc2-green-gates.txt)
- SC3 RED→GREEN: E_GROUP_COUNT 24/E_MONSTER_BATCH_COUNT 39/E_ENTRY_COUNT 384/E_MISSING_ARC·E_DIAGRAM_COVERAGE G25-27 → 27/42/432 녹색 ✓ (sc3-*.txt)
- SC4: 게이트 17종 전부 PASS(npm test, expansion 10, world-atlas, cast, strategy, monster, materialize --check, LFS, policy) ✓ (sc4-full-gates.txt)
- SC5: 프로젝트 금지토큰 신규 콘텐츠 0건; 실명 12종 투영 가시성 확인 ✓ (sc5-banned-scan.txt)
- 발견된 결함: (1) SVG 라벨 겹침 → 배치 밴드 이동으로 해결(가문 y=7z0, 그룹 극장행 연장), (2) M040-42 파일 범위 → confirmed 매니페스트 승인 추가, (3) K-map 포지셔널 재부여 필요 → 전역 스윕
- 미동의 항목 없음; 인물 실명(오너일가 개인명)은 가명+관계구도 실물로 반영하고 별칭 원장에 후보 유지 — 소유자 재요청 시 1회 스왑
- 커밋: 6cce48f(SC0+SC1) 90e6a22(SC2) bd2a2df(SC3) → PR 예정
## Learnings
- E_K_MAP는 id=배열위치+1 강제 — 삽입은 전역 재번호 스윕이 정석
- 몬스터 배치는 그룹당 16항목 row-major 스트림의 청크(그룹 경계와 무관)
- verify-monster-M021-M030의 파일 허용집 = EXPECTED ∪ confirmedManifest.monsters
- 투영 SVG 라벨 겹침은 밴드 이탈 배치(y+1 또는 극장행 연장)로 해결
