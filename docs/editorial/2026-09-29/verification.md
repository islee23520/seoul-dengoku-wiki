# #299·#298 결정 자료 검증 — 2026-09-29

대상 브랜치 `codex/tripothon-decision-packet-20260929`, 기준 Wiki `7d1b5d742da03c89202f0113c520184f6fbf6de9`. 최종 GAME 그래프 기준 `ac98566ab41132747ae86a3b6825ea5ad2518aeb`; 처음 조회한 `35b8d7c211eef1aa8c6af9c718b915680ff7a62b`와 그래프 바이트가 동일함을 확인했다. [결정 자료](tripothon-director-decision-packet.md)와 [검증 출력](verification-evidence.json)을 함께 읽는다.

## 변경·보존 범위

- `lore/editorial/Tripothon-Return-Relay-Proposal.json`: 기존 24개 앵커 전부 보존, 5개 블록의 경로 근거·개인 지휘·태세 표현 보완, 결정 자료 안내 1블록 및 이력 추가. 나머지 19개 블록의 파싱 값 동일.
- 특히 `choices`, `effect-contract`, `replacement-acceptance`, `outcomes`, `failure-return`, `acceptance`의 선택·수치·동의·정산·성공/실패는 그대로다. 새 지하 접근 설정과 전투 수치를 만들지 않았다.
- 같은 날짜 문서 폴더에 비교/결정 자료, 미승인 입력표, 재현 가능한 검증 스크립트·출력, 이 기록, PR 본문을 추가한다.
- 연표·연대기·핵심 인물·강남 지역·values-cast·공개 통제 지도 6파일을 기준 커밋과 바이트 대조했다. 코드·게임 데이터·의존성 선언/lockfile은 변경하지 않았다.

## 명령·결과

실행 디렉터리는 Wiki 저장소다. `SEOUL_KENSHI_ROOT`는 GAME 저장소 절대 경로다.

| 명령 | 결과와 검증 한계 |
|---|---|
| `npm ci --ignore-scripts` | exit 0, 기존 lockfile의 396 packages 설치, audit 0 vulnerabilities. 새 dependency 없음. 최초 `test:admission`의 vitest 미설치 실패를 복구했다. |
| `node scripts/lore-json-validate.mjs lore/editorial/Tripothon-Return-Relay-Proposal.json` | exit 0, 최종 대상 1문서 스키마/한영 계약. |
| `npm run test:lore-json` | exit 0, 10/10 통과. 기존 schema 회귀 검사. |
| `npm run test:lore-render` | exit 0, 175/175 통과. 개인 후보 문구/원래 표 포맷 보완 뒤 최종 재실행도 175/175 통과(13.84초). |
| `SEOUL_KENSHI_ROOT=… node docs/editorial/2026-09-29/verify-packet.mjs` | exit 0. 고정 그래프 해시·실제 간선·대안 최단 간선 수·현재 S16/open 전략 통행·경로 연결·승인 null/false·병졸 한도·기존 원천/블록 보존 검사. |
| `git diff --check` | exit 0. 별도 lint 스크립트는 없다. Biome LSP는 설치되지 않아 LSP 결과는 없음. |
| 보조 JSON 파싱·Markdown 상대 링크 검사 | exit 0, JSON 2파일 파싱 및 새 문서의 로컬 링크 존재 확인. |
| `SEOUL_KENSHI_ROOT=… npm run build` | **exit 1**. Atlas projection 33개가 `E_PROJECTION_STALE`로 생성 단계에서 실패. Vite production build 미완료. |
| `npm run test:admission` (의존성 복구 후) | **exit 1**, 5 pass / 2 fail. 두 실패는 동일 Atlas 불일치. 통합 admission 통과로 보고하지 않는다. |
| `npm run test:contract` (의존성 복구 후) | **exit 1**, 동일 Atlas 불일치. |
| `npm exec tsc -- -b` | **exit 1**, `src/generated/clanFamilyCatalog` 부재와 이에 따른 암묵적 any. 앞선 generator 실패 이후 전체 typecheck 통과 불가. |
| `node scripts/gate.mjs` | **exit 1**, 생성 페이지 `src/generated/world/Sixteen-States.json` 부재. 전체 publication gate 통과 없음. |

## 기준 main의 빌드 차단 확인

Atlas 원천, `world-atlas-schema.mjs`의 `PROJECTION_PATHS` 33파일, materialize/parse/render/schema 4모듈을 `git show 7d1b5d74:<path>`와 현재 작업 파일로 바이트 비교해 모두 동일했다(exit 0). 즉 이 편집안이 해당 불일치를 만든 것이 아니다. 관련 없는 Atlas를 재생성하거나 공개 원천을 수정해서 우회하지 않았다. 기준 main 정비 후 전체 build/admission/contract/typecheck/gate를 다시 실행해야 한다.

표적 검증의 `approvedDocuments(..., {checkAtlas: async () => {}})`는 **디렉터리 제외 규칙만 분리해 검사**한다. production gate를 수정하거나 성공으로 치환하지 않는다. 현 원천에서 editorial이 입장 대상에 없고, 기존 catalog/manifest와 한영 생성 파일에도 제안이 없음을 별도로 확인했다. 전체 생성이 실패했으므로 이를 새 공개 산출물의 통합 검증으로 확대하지 않는다.

## 실제 미결과 반영 상태

학동 창고 채택, 출입 층/접속/권한, 성인 병졸 식별·동의, 개인별 전투/장비/몸 상태/기분/지휘 입력, 모든 시연 효과·시간 매핑, 상대와 정착 조건은 소유자 입력 대기다. 자료상 `runtimeTarget=null` 및 2단계 잠금이 유지된다. 이는 게임에서 잠금이 구현됐다는 주장도 아니다.

브라우저 화면·Unity 실행·자동/수동 전투·원격 게시 검증은 하지 않았다. 이 lane은 커밋·푸시·PR·이슈 댓글을 만들지 않았다. [PR 본문](pr-body.md)은 리더 인수용 초안이며 발행 상태가 아니다.
