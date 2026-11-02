# 시간 기반 이동 보완 검증 — 2026-09-28

- 기준: GDD 제안 checkout HEAD e7ad057, 최신 GDD #31 head65e523f55ff62ec1142946d13b9c50e18c181445, 당일 GH #296 본문.
- `node --test research/2026-09-28/tripothon/movement/*.test.mjs`: exit0,24/24. 출력 `time-orders-test-results.txt`. 역사12는 현재 계약 증명이 아니고 기존시간4+추가8만 현재 연구다.
- `node --check` time-orders.mjs/time-orders.test.mjs: 각각 exit0. 별도 lint 설정이나 TypeScript 대상은 연구 mjs에 없다.
- 기존 GAME TOOL의 materialize-gdd.mjs를 읽기 실행하여 GDD 제안 JSON을 `/tmp/movement-gdd-296-render`에 생성: exit0,60문서. `canon/rendered.lock.json`에서 proposals/Campaign-Movement-296.md만 변경.
- frozen JSON source, 모든 source.b* 역사 블록을 HEAD와 비교: 동일. proposal-source.md SHA256은 fdeefea78de6cab718e4419d9641221bfa0a080dc3cac76e894865ac718b6919로 JSON source.sha256과 일치.
- 뷰어 의존성 최초 없음으로 vitest 실행 실패. 기존 lockfile의 의존성을 `npm ci --ignore-scripts`로 복원(새 의존성 없음). 최초 빌드의 LORE_ROOT 누락/최초 테스트 생성물 누락을 환경 설정/정상 생성으로 해소.
- `GDD_PAGES_ROOT=/tmp/movement-gdd-296-render LORE_ROOT=<workspace>/output/tripothon-wiki/lore SEOUL_KENSHI_ROOT=<workspace>/output/tripothon-game npm --prefix output/tripothon-gdd/viewer run build`: exit0,56문서/7dataset 생성, tsc+vite 통과. 기존 번들 크기 경고 존재.
- 빌드 후 같은 GDD_PAGES_ROOT로 viewer test: exit0,3/3.
- `git -C output/tripothon-gdd diff --check`: exit0.

직접 읽은 최신 source.b18–b24의 시간/태세/전체 경로/AI 계약을 제안에 연결했다. 원천 PR의 다른 규칙·카메라/초상·잔존 원장 턴 문구는 수정하지 않았다. GAME에는 쓰지 않았다. 제품 속도/단위, Lite 원문 페이지, 개인 속도 유도, 전체 탐색/동적 사건/승인은 여전히 미결이다. 결과는 미승인 연구 제안 검증이며 #296 최종 승인 또는 #297 구현 게이트 통과가 아니다.

## 메타데이터 회귀 수정

추가 시험을 먼저 실행해 paused 이벤트의 rates.label/motion.hostOrder 장식만으로 해시가 달라지는 실패를 확인했다(7/8 통과,1실패). 수정 후 지원 태세5개·motion3개·경로14개 의미 필드만 projection한다. 경로 projection을 해시와 retained-prefix 비교에 공용으로 사용하므로 서로 다른 표시 메타데이터로 목표 교체를 거부하지 않는다. 같은 시험에서 비용 변경의 다른 해시와 지나온 간선 비용 변경 거부도 확인했다. 전체24/24 및 두 mjs의 node --check 통과. GDD·GAME 변경 없음; GDD 커밋 당시23개 기록은 당시 검증 이력이다.

## GAME 패킷 재현

리더가 파일을 GAME의 `RESEARCH/verification/campaign-movement-20260928/`에 복사하고 저장소 루트에서 `node --test RESEARCH/verification/campaign-movement-20260928/*.test.mjs`를 재실행했다: exit0,24/24,실패0·skip0. 제품 Core와 GDD submodule pin은 유지한다. 서버·브라우저·임시 파일을 만들지 않는 시험이다.
