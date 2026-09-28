# #299·#298 위키 제안 검증

최초 검증일: 2026-09-28. 사실관계·게시 경계 정정일: 2026-09-29. 브랜치: `codex/tripothon-warehouse-scenario`.
기준 WIKI HEAD: `e83970e8b5796c1f3b428ef58c79a5c1cb48b7f5`.
GAME 입력 HEAD: `84920d8c418d0f8e2bbc474b83d4a9ca0c397728`.
GDD 참조 HEAD: `e4b14cac11314c47da23b8e04eb4c4e336ffc3e6`.

## 현재 상태와 이력 구분 (2026-09-29)

현재 검토 원천은 비게시 [`lore/editorial/Tripothon-Return-Relay-Proposal.json`](../../../lore/editorial/Tripothon-Return-Relay-Proposal.json)이며 `status: draft`다. 원정 위치·분대·수치·선택은 미승인 상태로 유지한다. 공개 카탈로그·검색·연표에서 제외하며, 공개 연표에서 옮긴 위치 문단은 편집 원천에만 보존한다.

아래 최초 검증부터 ‘리더의 실제 브라우저 확인 및 표시 정정’까지의 공개 경로·연표 문단·카탈로그 85개·테스트 수·원천 해시는 **공개 제외 적용 전의 과거 관찰**이다. 당시 실행과 복구 이력을 보존하며 현재 게시·승인 또는 이번 재실행 결과로 해석하지 않는다. ‘공개 제외 정책 적용 이력’ 이후의 후속 검증도 각 단계 당시의 기록이다. 이번 문서 정정은 원천·생성물·게시 정책을 바꾸지 않았다.

소유자 [PR #304 정식 검토](https://github.com/islee23520/seoul-dengoku-wiki/pull/304#pullrequestreview-5341433031)와 [#299 댓글](https://github.com/islee23520/seoul-dengoku/issues/299#issuecomment-5871403351)을 대조했다. 보조 [PR #310](https://github.com/islee23520/seoul-dengoku-wiki/pull/310)의 `12d1c6b7658d5e2972e68bea78059c85e75b4b99`에는 댓글 사실 정정 한 줄만 있음을 확인하고 해당 문장을 반영했다. PR 자체를 병합한 것은 아니다.

이번 확인 기준 HEAD는 `677b64fe6ee45076b78516bb2eb1389993a5c703`이다. 기존 생성물의 공개 manifest 84문서, 카탈로그·manifest 내 제안 항목 부재, 한영 제안 생성 파일 부재, 연표 원천·한영 생성물의 위치 제안 제외를 확인했다. 편집 원천 SHA-256 `4b108d3e3c3c38fb8ae4bd9f0f7ea97aeb4b8b272734d86ed69799389c9501fd`와 24개 블록은 변경하지 않았다. [근거·검사 기록](evidence/wiki304-review-correction-2026-09-29.json)에 출처와 해시를 남겼다. 산문만 수정했으므로 build·테스트·브라우저 QA를 다시 실행하지 않았으며 원격 게시도 확인하지 않았다.

## 최초 검증 당시 범위와 보존

- `lore/chronology/Scenario-Timeline.json`: 기존 회수 카드 뒤에 학동·논현2동의 **미승인 위치 제안** 한 문단을 한영으로 추가했다. 기존 41개 블록은 HEAD와 파싱 값 대조에서 모두 동일했다.
- `lore/chronology/Tripothon-Return-Relay-Proposal.json`: 별도 한영 draft 원천. 원문 근거, 경로, 성인 3명 분대, 별도 대여 장비, 5+1단계의 14개 선택 행, 수치 효과, 성공·실패·귀환 조건, 소유자 결정 5행, 구현 인수 사례를 담았다.
- 지역 관측 JSON·OSM 객체·역 그래프·게임 데이터는 변경하지 않았다. 기존 명칭, 2124년 기연결, 민웅기의 대전 체류, 신준의 동의·휴식, S00 원장 행의 proposal 상태를 보존했다.
- #299와 #298 본문·댓글을 `gh issue view --repo islee23520/seoul-dengoku --json title,body,comments`로 확인했다. #298 소유자 댓글 5864851948은 승인 전 위치 잠금을 요구한다. 이후 #299 소유자 댓글 5871403351은 도달 거리를 턴 수 대신 역·층 경로로 적도록 정정했다. 제안 본문의 3간선은 역 사이 연결 수로만 설명하며 실제 거리·시간·층 경로는 확정하지 않았다.

## 최초 검증 당시 실행과 결과

| 명령 / 확인 | 결과 |
|---|---|
| `npm ci --ignore-scripts` | exit 0, 380 packages, audit 0 vulnerabilities |
| `node scripts/lore-json-validate.mjs lore/chronology/Scenario-Timeline.json lore/chronology/Tripothon-Return-Relay-Proposal.json` | exit 0, 2문서 |
| `node --test scripts/test-lore-json-validate.mjs scripts/test-lore-json-render.mjs scripts/test-timeline-overview.mjs` | exit 0, 192 pass / 0 fail / 0 skip |
| `SEOUL_KENSHI_ROOT=/Users/stevenshin/Documents/ChatGPT/서울켄시/output/tripothon-game npm run build` | 최종 exit 0, catalog 85, TypeScript와 Vite build 통과 |
| `node scripts/gate.mjs` | 최종 exit 0, gate PASS, private/banned/coined/retired/broken/exclusion failures 모두 0 |
| `node scripts/lore-json-validate.mjs --strict` | 최종 exit 0, 102문서, unmigrated Markdown 0 |
| `node scripts/check-links.mjs` | exit 0, 22 registered paths |
| `node scripts/check-artifact-allowlist.mjs` | exit 0, 1504 files, 16 routes |
| `git diff --check` | exit 0 |
| Node assert 직접 대조 | 기존 timeline 블록 41개 보존, 강남구청↔학동·강남구청↔선정릉 간선 존재, 두 로케일 reviewText의 D298-D/T≥80/지역 ID 존재, 예시 경로 물자 2·긴장도 22 확인 |

당시 생성 결과 확인 경로 (현재 제안은 공개 제외):

- `src/generated/world/Tripothon-Return-Relay-Proposal.json` → `/world/Tripothon-Return-Relay-Proposal`
- `src/generated/world-en/Tripothon-Return-Relay-Proposal.json` → `/en/world/Tripothon-Return-Relay-Proposal`
- `src/generated/world/Scenario-Timeline.json`의 위치 제안 문단.

이는 당시 로컬 공개용 렌더 원천 및 production build 확인 기록이다. 실제 원격 사이트 게시나 브라우저 시각 QA를 수행했다는 뜻이 아니다. 생성물은 커밋하지 않는다. 별도 lint 스크립트는 없으며 스키마·publication gate·TypeScript·diff 검사를 사용했다.

## 중간 실패와 복구

- 최초 gate는 `창작 제안`이라는 금지 편집 표식을 거부했다. 의미와 승인 잠금을 보존한 `미승인 위치 제안`으로 고친 뒤 재생성·gate 통과를 확인했다.
- validator 테스트는 잠시 Markdown twin fixture를 생성한다. 동시에 실행한 재생성 1회가 `E_MARKDOWN_TWIN:culture/Martial-Paths.md`로 실패했다. 테스트가 정상 종료·fixture 정리한 뒤 **순차** build와 strict 검증이 통과했다. 이 테스트와 generator를 동시에 실행하지 않는다.
- 생성 JSON은 본문 구조 앵커를 reviewText에 그대로 싣지 않는다. 첫 임시 확인 스크립트의 앵커/문자열 기대를 실제 렌더 계약의 reviewText 문구 검사로 바로잡았다. 마지막 확인은 exit 0이다.
- 선택 LSP biome은 기존 미설치 상태다. 설치하지 않았다. Vite의 향후 native config 경고와 500kB chunk 경고는 남았으며 빌드 실패는 아니다.

## 최초 검증 당시 미결·반영 상태

최초 검증 당시에는 로컬 검토용 변경으로 커밋·푸시·PR·소유자 승인·원격 게시·Unity 구현 전이었다. D299 위치, D298-A 분대/장비, D298-B 경제/척도/80 임계, D298-C 시계/판정 매핑, D298-D 조우/정착 조건은 승인 대기다. 기본안은 S16 통행 협상과 귀환이며 S04 전투 세팅은 제공하지 않는다. 수치는 시연 비교용 제안으로 GDD의 K_i·O 공식 입력과 단위가 다르다. 인수 사례는 Unity 실행 테스트가 아니다.

## 독립 검토 후 정산 경계 보강

팀의 `proposal-review.md`에서 명목 Δ의 역산이 제한값 적용 또는 후속 부품 소모 뒤에는 안전하지 않음을 지적했다. 후속 수정은 제안 JSON과 이 검증 기록에 한정했다. 기존 timeline과 동결 원천은 수정하지 않았다.

- 확정 전 미리보기만 교체 가능하다. 미리보기는 원장·자원을 변경하지 않고, 새 선택을 현재 원장에서 다시 계산한다.
- 한 번 정산한 단계는 교체하지 않는다. 후속 의존·소모가 있으면 특히 취소할 수 없다. 대기 비용 확정 후에는 해당 대기·교섭을 계속하거나 귀환하며, 다른 조건 재시도는 이전 기록을 남긴 새 원정이다.
- 부품 2개 회수→가동에 모두 소모→회수 선택 교체 거부 사례와 L=9→+2 미리보기 10→+0 미리보기 9 사례를 한영으로 추가했다. 확정된 L=10의 교체도 거부한다. `10-2=8`로 되돌리지 않는다.
- 소유자 승인·런타임 미구현 경계는 그대로다. 위 사례는 게임 실행 검증이 아니라 구현 인수 명세다.

이 정산 경계 보강 시점의 원천 SHA-256: `d56f24a3426152d3bf8549277b28955fd0545a1900f8a28b83a5f61a88d6799d` (`lore/chronology/Tripothon-Return-Relay-Proposal.json`). 기준 HEAD는 `e83970e8b5796c1f3b428ef58c79a5c1cb48b7f5`로 동일하다. 아래 최신 방향 정렬에서 원천 해시가 갱신된다.

재검증 결과: 대상 JSON 검증 exit 0(1문서), 위와 동일한 환경의 `npm run build` exit 0, `node scripts/gate.mjs` exit 0(PASS), `node --test scripts/test-lore-json-render.mjs` exit 0(177 pass / 0 fail / 0 skip), 두 로케일 공개용 `reviewText`에 추가한 소모·제한값·미리보기 문구 확인 exit 0, `git diff --check` exit 0. 최종 build 완료를 리더에게 전달했으며 브라우저 QA는 리더가 별도로 수행한다.

## 최신 소유자 결정 13·14 정렬

소유자 PR #306의 `Intent.md` 고정 커밋 `5a98964518f0e7110e91ba37e7e9590135be21c1` 원천 스냅샷 `research/2026-09-28/tripothon/sources/intent-5a989645.md`를 읽고 현재 제안만 정렬했다. 해당 PR의 방향 확정과 이 시나리오 위치·분대·수치의 개별 승인은 별개다.

- 결정 14를 현재 이동 권위로 표시했다. #298과 이전 GDD의 동시 턴·턴 제한·턴별 이동력 문구는 활성 방향에서 대체됐다. 플레이어와 AI 모두 세계 시간이 흐르는 동안 경로를 따라 이동한다.
- 기존 ‘당직→이동 턴’ 매핑을 삭제했다. 당직은 추상 사건 지연 제안이며 실제 세계 시간 길이·예약 시각 매핑은 소유자 승인 전 미정이다. 3간선은 경로 연결 수이고 실거리·속도·경과 시간 수치가 아니다.
- 결정 13의 개인 공격 판정, 자동/수동 동일 규칙, 교전 전 분대 지시, 근접 교전 중 새 명령 잠금, 전투 전체 후퇴, 전투 결과 정산 전 지도 이동 명령 잠금을 한영으로 명시했다. 기본 원정에 필수 전투를 추가하지 않았다.
- 이야기 선택·제안 수치와 정확히 한 번 정산, 기존 보강한 정산 경계를 유지했다. 새 속도·거리·전투 수치를 만들지 않았고 기존 bridge/Core/Unity POC를 새 결정의 구현으로 보고하지 않았다. 동결 원천·기존 timeline·관련 없는 GDD는 수정하지 않았다.

최종 제안 원천 SHA-256: `6fa7327938ef0608c0df758a141671647a39ca662ae07c7b1b4a21e01f998589`.

재검증: 대상 JSON schema exit 0(1문서), 같은 `SEOUL_KENSHI_ROOT`의 `npm run build` exit 0(TypeScript 포함), publication gate PASS(exit 0), render tests 177 pass / 0 fail / 0 skip(exit 0), `git diff --check` exit 0. 양쪽 공개용 `reviewText`에서 고정 SHA·AI 세계 시간·전투 전체 후퇴·정산 제한값 사례가 존재하고 옛 당직→이동 턴 매핑이 없음을 직접 assert해 exit 0을 확인했다. 리더에게 최종 build 준비를 통지했으며 원격 게시·Unity 실행·브라우저 QA 완료 주장은 추가하지 않는다.

## 리더의 실제 브라우저 확인 및 표시 정정

같은 원천 해시의 production build를 127.0.0.1:4174에서 열었다. Codex 실제 브라우저에서 한국어 제안 본문, 미승인 위치·수치, 시간 기반 이동·개인 판정 전투, 5+1 선택 표와 성공 조건을 확인했다. English 링크를 눌러 `/wiki/en/world/Tripothon-Return-Relay-Proposal`로 이동한 뒤 같은 승인 경계와 결과 표를 확인했다. 이는 대표 데스크톱 내용·언어 전환 확인이며 다중 플랫폼 QA나 원격 게시 확인이 아니다.

확인 도중 `ArticlePage.tsx`가 모든 글에 `정본/Canon` 배지를 고정 표시해 draft도 확정처럼 보이는 문제를 발견했다. 배지를 중립적인 `세계관 문서/World document`로 변경했다. 기존 문서의 설정 승인 상태는 바꾸지 않는다. 이 문구 변경 뒤 production build(TypeScript 포함), publication gate와 diff 검사 모두 exit 0이다. 브라우저 캡처는 배지 변경 전 관찰 기록이므로 변경 후 배지의 화면 증거로 쓰지 않는다.

자료와 UI 문구는 별도 원자 커밋으로 인계한다. GitHub PR은 검토용이며 main 병합·시나리오 수치 승인·원격 배포 완료와 구분한다.

마지막 표시 교정: 한국어 표의 두 범위 `-10~10`, `0~100`이 GFM의 취소선으로 이어질 수 있어 `-10부터 10까지`, `0부터 100까지`로 풀어 썼다. 수치는 동일하다. 재빌드·TypeScript·publication gate exit 0, 생성된 제안의 `delete` 노드 0개를 확인했다. 최종 원천 SHA-256은 `78bae3d8493e709fe7ea5ea6a648494ef00723b47d7aae7197cc0cd855014f65`다. 이전 캡처는 앞선 동일 의미 제안의 관찰 기록이며 이 표시 교정 이후 캡처로 재분류하지 않는다.


## 공개 제외 정책 적용 이력 (후속 검증)

앞선 공개 경로·카탈로그 85개 기록은 당시 상태의 증거다. 현재 원천은 `lore/editorial/Tripothon-Return-Relay-Proposal.json`으로 옮겼고 공개 카탈로그·검색·연표에서는 제외한다. `status: draft`와 미승인 창작 제안 요약을 그대로 유지한다. 단어를 우회해서 공개하거나 승인된 정본으로 바꾸지 않는다. 기존 연표의 위치 제안 문단은 같은 앵커로 편집 원천에 보존했으며 원래 사건 카드는 유지한다.

WIKI #305·#306 병합 설정(신준 12세, 민웅기 식량 배분 촉발 사건, 공개 편집 표지 제거)을 보존한다. #298 개인별 무기·방어구·기술·몸 상태·기분과 지휘 책임, #299의 1+2 역 구간 및 미확정 층 경로, 별도 세 화면의 거의 수직 탑다운 카메라와 3D 렌더 초상을 비게시 인수 조건으로 추가했다. 그래프에는 층 필드가 없어 지하 0회 전환안은 확정 사실로 보고하지 않는다.

후속 최종 검증: build(TypeScript 포함), strict JSON 102문서, 공개 gate, 로어 링크, Wiki 링크 22경로, 계약, artifact allowlist, Atlas 투영 일치 모두 exit 0. 스키마·연표·gate·admission·링크·인물·지도 등 기존 회귀 검사는 통과했고 Atlas 테스트의 한글 경로 URL 처리 오류를 `fileURLToPath`로 수정했다. 최종 렌더+Atlas 재검사는 196/196 통과(실패·skip 0). 별도 편집 원천 검증과 한영 렌더, 기존 16개 제안 블록·이동한 위치 문단의 값 일치, 공개 카탈로그와 양 언어 생성 경로에서 제안 제외를 확인했다. 이번 후속 단계는 실제 브라우저 QA·푸시·원격 게시를 포함하지 않는다.

최종 전달 직전 새 main `80a850cb`(#205 역 별칭·통제)을 추가 병합했다. 기존 제안에는 대치 통제에 관한 문구가 없어 새 S16 설정과 충돌하지 않는다. 같은 build·strict·gate·링크·계약·투영 검사와 렌더·Atlas·연표·지도·역 별칭 검사를 추가 실행한다. 이는 8d39b320 기준 검증을 덮어쓰지 않는 별도 통합 검증이다.

80a850cb 통합 최종 결과: 위 명령 전부 exit 0, 렌더·Atlas·연표·지도·역 별칭 231/231 통과, 실패·skip 0.

## GDD #33 후속 지시 정렬

소유자 GDD PR #33의 `97e504adf8411208e3b03d4e99b9e4af1a41b23a` 원천과 2026-09-28 14:42:46Z 댓글 `5872290524`를 직접 조회했다. 조회 시 PR은 OPEN으로, 소유자 선택과 main 병합·개별 시연안 승인·구현 완료를 구분한다. `latest-battle-direction` 한영 문구만 GURPS 4판 판정, 노랜드 진행·화면, 의지 기반 공포와 기분·리더십 보정(크기 미정), 교전 전체의 명령 잠금으로 교정했다. `gdd33-loyalty-trust-boundary` 문단을 추가해 영웅 충성과 신뢰 T[A,B], 시연 긴장도 T·세력 비교 F를 구분하고 보상·위협은 충성·기분만 직접 바꾼다고 명시했다.

기존 23개 앵커는 모두 유지했고 전투 방향 외 22개 블록·선택표·점수·정산·결과는 파싱 값이 같다. 대상 schema 1문서, 한영 렌더 2/2, production build(TypeScript 포함), 공개 gate, diff 검사가 모두 exit 0이며 한영 생성물·카탈로그·공개 계약에서 편집안 제외를 재확인했다. 첫 렌더에서 원문 URL을 일반 텍스트로 넣어 링크 수가 불일치했던 문제는 기존 href run 형식으로 수정 후 재검증했다. 코드·게임 데이터·GDD는 변경하지 않았다. 문서 원천 SHA-256: `4b108d3e3c3c38fb8ae4bd9f0f7ea97aeb4b8b272734d86ed69799389c9501fd`.
