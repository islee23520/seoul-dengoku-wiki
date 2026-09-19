# 전투·아트 개정 전 기준선

확인일: 2026-09-19. 기준 HEAD: `63cecdc4b99616da637bdf930a57886eea6969e0`. 이 기록은 개정 전에 실제로 읽은 원문과 실행 결과를 모았다. 문서 작성만으로 Unity나 POC가 변경됐다고 판정하지 않는다.

## 전수 범위

`git -c core.quotePath=false ls-files GDD`와 경로 원장을 대조했다. GDD 289경로는 모두 분류됐으며 누락과 중복이 없다. 한글 파일명 HWP 두 개를 포함한 수치다. 생성 HTML 226개는 원본 정본과 설계 저장소 입력을 통해 갱신하고, 제안·제출 기록과 실제 캡처는 역사로 보존한다.

LORE는 236경로이며 Markdown 192개, JSON 41개, 기타 3개다. 아틀라스 원본 1개와 투영물 122개, 인물·연혁·지리 자료는 새 전투 지휘 방식과 무관한 사실을 바꾸지 않는다. 236경로 전체와 분류 원장이 일치했다.

결합 목록 `document-disposition.tsv`는 총 525개 고유 경로다. 별도로 GAME-LOGIC 루트 문서 31개와 루트 계약 7개, 게시 계층을 조사했다. 이 수치는 내용을 모두 새로 쓰겠다는 뜻이 아니라, 개정·유지·생성·과거 기록 판정을 빠뜨리지 않았다는 범위 증거다.

## 개정 전에 확인한 모순

| ID | 읽은 근거 | 현재 문제 | 개정 후 수용 기준 |
|---|---|---|---|
| B01 | GDD/Home.md:10–12, Game-Thesis.md:13–17 | 목표 전투가 좌우 사이드스크롤·진형 카드로 남아 있다 | 새 목표와 POC 구현 설명을 분리한다 |
| B02 | GDD/Design-Requirements.md:9–21, Development-Roadmap.md:9 | 옛 카메라·카드 부여·SD 재작업 티켓이 새 요구처럼 보인다 | 새 부대 지휘 요구와 과거 POC 티켓을 구분한다 |
| B03 | GDD/Game-References.md:70–73,88–91 | 사각 칸·AP 전투를 설명하면서 유닛 명령 자체를 배제한다 | 실시간 부대 명령과 턴제 병사별 AP 조작을 구분한다 |
| B04 | Design.md:88–112,156–171,211 | 카드 독·4방향 버튼·5×5 보드와 보드 금지 문장이 함께 있다 | 새 목표 HUD는 선택 부대·현재 지시·사기·퇴로를 보여 주고, 기존 식별자는 POC 기록으로 남긴다 |
| B05 | GAME-LOGIC/Realtime-Formation-Card-Battle.md:5–29,43–61 | 카드 소유권·재충전·고정 수치가 제품 전투의 현행 계약으로 서술된다 | 카드 규칙은 POC로 보존하고 제품 목표는 부대 지휘로 다시 쓴다 |
| B06 | GAME-LOGIC/Character-Art-Direction.md:24–55,92–129 | 반실사 프롬프트 방향과 애니메이션풍 초상 규칙이 동시에 유효해 보인다 | 목표 미술은 애니메이션풍 정비율로 통일하고 POC 자산은 그대로 둔다 |
| B07 | GAME-LOGIC/Save-and-Determinism.md:27–34 | 실시간 전투에 턴 종료 저장을 요구한다 | 확정된 시뮬레이션 체크포인트로 표현하고 미구현 상태를 명시한다 |
| B08 | LORE/places/Station-Interior-Construction.md:27,35–45 | 4방향 격자 폐기와 4방향·12×8 전장 요구가 공존한다 | 역 층·구역과 새 전장 설계를 분리하고 구 격자 수치는 POC로 한정한다 |
| B09 | LORE/culture/Martial-Paths.md:5,27, LORE/goods/Era-Arms-and-Tech-Level.md:120 | 세계관의 전투 기여를 진형 카드가 결정한다 | 무공·생업·장비가 부대 행동과 상태에 기여하며 카드 경제를 세계 법칙으로 두지 않는다 |
| B10 | GAME-LOGIC/Realtime-Formation-Card-Battle.md:20,61, Warfare-and-Sieges.md:57–60 | 항복에는 열린 퇴로가 필요하다는 POC 조건과 퇴로 봉쇄 시 항복 가능이 충돌한다 | POC 조건을 새 규칙으로 이식하지 않고 질서 철수·패주·항복을 구분한다 |
| B11 | GAME-LOGIC/Campaign-Loop.md:5–25 및 최초 flow.json | 기존 캠페인은 계속 원정·다섯 결말을 허용하지만 도표는 모두 귀환시킨다 | 결과 반영과 다음 행선 선택을 분리하며 귀환을 유일한 종착점으로 두지 않는다 |
| B12 | GDD/system-design/index.html:531–551,623,658–663 | 폐기된 아이소·SD·카드 표현이 구현과 목표를 혼합한다 | 날짜가 있는 POC 설명과 새 설계 표면을 명확히 구분한다 |

## 기계가 소비하는 문서 입력의 RED

실행: `node TOOL/tools/design-store/seed-from-canon.mjs`

결과: 종료 코드 1. 설계 저장소의 인용 본문 99개가 현재 정본 본문에 존재하지 않아 생성이 중단됐다. 영향받은 문서 ID는 `janseon-core`, `campaign-loop`, `battle`, `world-layers`, `strongholds`, `economy`, `logistics`, `factions`, `characters`, `sixteen-states`, `save-determinism`, `warfare`, `travel`, `station-interior`, `character-art`다. 전체 출력은 `seed-baseline-red.json`에 보관했다.

이는 순수 산문을 문구 테스트로 고정한 결과가 아니다. 실제 생성기가 출처와 인용의 일치를 요구하는 문서 데이터 계약이 실패했다. 새 정본을 반영한 인용 입력으로 같은 생성기를 통과시키고, 스키마나 검사 조건은 약화하지 않는다.

## 새 UI 경로의 실제 브라우저 RED

Aside로 `https://seoul-dengoku.linalab.io/total-war-ui/`를 열었다. 처음에는 배포 중 일시적인 502였고, 새 호출에서는 nginx의 `404 Not Found`를 확인했다. 부대 선택·지휘·퇴각 템플릿이 존재하지 않는다는 변경 전 증거다.

- 캡처: `/Users/ilseoblee/.aside/u/0/sessions/2026-09-19_rEGbdH3do2azxTeX/artifacts/total-war-ui-baseline-public.png`
- 캡처 파일을 이미지 읽기로 직접 확인했다.
- 정리: 같은 Aside 호출 안에서 생성한 탭만 닫아 `CLEANUP_OWN_PAGE_CLOSED`를 확인했다.

현재 라이브 루트는 서울:전국 공식 위키다. 예전 허브 `index.html`을 덮어쓰지 않고 새 경로만 추가한다. SSH 읽기 확인에서 nginx 서비스와 터널이 실행 중이며 localhost:8080은 HTTP 200이었다.

## 첫 아치파이 후보

`validate`와 `deliver`는 종료 코드 0, standard 검사 9/9, 오류·경고 0이었다. 그러나 1440×900 실제 화면을 읽었을 때 B11의 캠페인 흐름 결함이 드러났으므로 최종 승인으로 취급하지 않는다.

- 입력 SHA-256: `378ea9c1cb1f08a45bd76865083a29b26aa6c213512467eec761f06228544a17`
- HTML SHA-256: `a7c83ae8b8ec645b386bb80506d8fc7a521226b1925d0f5c0a5293dd7021a784`
- 화면: `/Users/ilseoblee/.aside/u/0/sessions/2026-09-19_J28mY9lJgzTh22ht/artifacts/total-war-flow-first.png`
- 정리: 임시 서버 `bash_22` 종료, TCP 4319 LISTEN 없음 확인. 검증용 탭도 닫았다.

## 보존 범위

기존 오드랜드 자산, `GAME/` 런타임·씬·테스트, 외부 레퍼런스 원문 사실, 캐스트 ID·인물 사건·연혁, 지리·이름 풀 데이터는 이 개정의 구현 대상이 아니다. 다른 세션의 미커밋 파일과 새 공식 위키 작업은 그대로 보존한다.
