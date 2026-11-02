# PR #308 materializer 계약 검토 — 2026-09-29

[문서] [정식 변경 요청 5341438940](https://github.com/islee23520/seoul-dengoku/pull/308#pullrequestreview-5341438940)에 대한 별도 도구 검증이다. 이동 연구·Unity 구현·공개 플레이 검증과 독립적이다. 최종 도구 변경은 `fa18e72`, 기존 전체 rendered-lock 비교는 이미 독립 커밋 `3fb3a7911e10d233e0e1607d2248a7b8b5b4a74c`였다. 공유 이력을 고치지 않고 새 도구 커밋과 이 증거 커밋을 분리했다.

## 원천과 권한

조회: `2026-09-28T22:35:44.820262+00:00`. 응답 필드·API 경로는 [authority.json](authority.json).

| 구분 | 확인한 SHA | 원천 문서 수 | 실제 CLI | canon 테스트 |
|---|---|---:|---|---|
| 현재 GDD main | `95bfbf37fad9b40d0e731b670fa1543c6a28ebd6` | 59 | PASS, exit 0 | 39/39 PASS |
| GAME #306 head `f732ab2fe8b36e0dc48add4f4bbb0f6e65d8b705`의 GDD gitlink | `83d33f1d8b4d11c60916b5b4dc9b91d62491335a` | 58 | PASS, exit 0 | 35 PASS / 4 FAIL |
| 미병합 GDD #33 제안 head | `97e504adf8411208e3b03d4e99b9e4af1a41b23a` | 59 | PASS, exit 0 | 39/39 PASS |
| GAME #308의 기존 GDD gitlink·로컬 checkout | `e4b14cac11314c47da23b8e04eb4c4e336ffc3e6` | 이번 변경 없음 | 원격 최신으로 취급 안 함 | 수정 전 materializer 11/11 PASS |

GDD #33은 OPEN, base는 `docs/norland-combat-decision-13`의 `65e523f55ff62ec1142946d13b9c50e18c181445`다. 해당 제안 문구를 현재 main 정본·승인된 수치·Unity 구현으로 승격하지 않는다. GAME #306 역시 OPEN이다. 과거 보고의 #306 `5a989645`와 이번 `f732ab2f`를 구분한다. 이 표는 조회한 SHA의 사실이며 미래 branch HEAD를 보증하지 않는다.

## 검사 책임과 변이 결과

전체 rendered lock 비교는 현재 모든 출력 경로·바이트 해시를 확인한다. 추가 문서를 금지하는 59개 고정값은 복구하지 않았다. 이관 보존 검사는 Git 객체 `6018b4f0e40ec829a77762e808755ea390aaba4e:canon/rendered.lock.json`의 52개 원문 해시와 별도로 고정된 필수 규칙 7개를 확인한다. 렌더 바이트 해시와 `source.sha256`의 과거 원문 지문은 서로 다른 값이다.

- 현재 main의 52개 원문 해시 모두 일치: [source-fingerprints.json](source-fingerprints.json)에 각 경로, JSON 바이트 해시, 문서/컬렉션 원문 해시, 이관 해시를 기록했다.
- 52개 각각의 문서 원문 해시를 `000…000`으로 바꾸고 거절을 확인했다. 다시 52개 각각을 문서와 컬렉션 양쪽에서 일치하게 바꾸어도 동결 이관 해시 대조가 거절했다. ADR 8개는 컬렉션 항목이 없어 두 모드에서 같은 문서 변이가 적용된다. 각 반복 뒤 원본 fixture 바이트를 복원하고 마지막 정상 회귀도 통과했다.
- Battle, CampaignLoop, EconomyLogistics, FactionsWarfare, SaveDeterminism, Strongholds, TravelEncounters를 각각 컬렉션과 렌더 lock 양쪽에서 함께 제거했다. 7/7 모두 `missing post-migration rule`로 거절했다. 실제 원천이나 잠금 파일을 수정해 성공을 만들지 않았고, 변이는 임시 복사본에서만 수행했다.
- 기존 단독 이관 테스트는 `references/Ref-Bannerlord.md`의 문서 `source.sha256`만 바꾸면 exit 0이었다. 보강 뒤 같은 검사는 exit 1 (`source identity mismatch`)이다. 기존 전체 materializer 테스트나 실제 CLI까지 통과했다는 주장은 아니다. 실제 CLI는 해당 문서/컬렉션 불일치를 `E_SCHEMA_SHAPE`로 이미 거절했다.
- 문서와 컬렉션 원문 해시를 함께 변조하거나 필수 규칙을 컬렉션과 lock에서 함께 제거하면 실제 CLI는 각각 exit 0이다. 이는 CLI가 현재 렌더/lock의 정합성을 검사하고 역사적 코퍼스 보존은 독립 테스트가 검사하기 때문이다. 두 검사를 함께 실행해야 한다.
- 실제 본문을 바꾸고 lock을 그대로 두면 CLI는 exit 1, `E_RENDERED_LOCK_MISMATCH: rules/Campaign-Loop.md`다.

[verification.json](verification.json)은 변경 전/후 단독 테스트와 실제 CLI의 성공·실패 원출력이다. 첫 실행 뒤 불완전 기준선에서 변이 결과를 잘못 해석하지 않도록 baseline 검사를 앞당겼다. 최종 코드 바이트 해시와 세 SHA의 재실행 결과는 [final-validation.json](final-validation.json)에 별도로 남겼다.

## GAME #306에서 확인한 실패

`83d33f1d`에는 원래 이관 문서 `references/Ref-Songs-of-Silence.md`가 없어서 51/52다. 원래 해시는 `c8d97c193acd606e62fc8f9f91e7e0201b42196ace2044dbf28f1ffb228f4c74`. 실제 CLI는 그 시점의 58문서 lock을 정상 렌더하지만, 기존 보존 계약은 실패한다. 최종 4개 실패는 기본 보존 검사 1개와 불완전 baseline을 먼저 거절하는 변이 검사 3개다. 이 포인터에서는 변이 완주를 주장하지 않는다. GDD 복원·정책 변경은 해당 원천 소유자의 후속 판단이며 이번 GAME 도구 작업이 임의로 바꾸지 않았다.

## 재현과 실행 환경

기존 `TOOL/tools/node_modules`의 Vitest 5.0.2와 기존 document-renderer dist를 사용했다. 새 의존성 설치 없음. Git으로 각 SHA를 임시 GDD checkout에 가져오고 그곳의 이관 Git 객체를 읽었다. 원본 GDD checkout은 그대로다.

```sh
# GAME 저장소 TOOL/tools 디렉터리에서, GDD_ROOT는 조사할 GDD checkout 절대 경로
GDD_ROOT=/absolute/temporary/gdd ./node_modules/.bin/vitest run --config vitest.config.mjs canon/ --reporter=verbose
# GAME 저장소 루트에서, 출력 경로는 GDD 밖의 새 임시 디렉터리
node TOOL/tools/canon/materialize-gdd.mjs --gdd /absolute/temporary/gdd --out /absolute/temporary/pages
node --check TOOL/tools/canon/test-materialize-gdd.mjs
git diff --check
```

실행한 절대 경로·명령·stdout·stderr·exit code는 JSON에 있다. 최초 루트 `TOOL/vitest.config.mjs` 실행은 루트 node_modules가 없어 `vitest/config` 해석 실패였다. 기존 의존성이 있는 `TOOL/tools`의 실제 프로젝트 설정으로 재실행했다. 별도 lint/typecheck 스크립트는 없고, 변경은 JavaScript 테스트만이므로 구문 검사와 실제 Vitest를 수행했다. LSP는 사용 불가이며 설치하지 않았다. 문서 링크·해시 대조는 설정 승인이나 자연스러움 판정이 아니다.

임시 clone·출력과 이력 테스트 복사본을 제거했고, 모든 새 migration fixture 디렉터리가 정리되었다. [teardown.json](teardown.json)은 원본 GDD clean 상태, 고정 HEAD와 제거 영수증이다.

## 보존한 공개 검증 경계

기존 `/tripothon/`·`/play/` HTTP 302 Cloudflare Access 관찰과 F1–F4 **NOT RUN**은 유지한다. 이번 도구 테스트는 익명 사용자의 플레이 가능 증거가 아니며 새 공개 플레이나 Unity 검증을 수행하지 않았다. [기존 공개 QA](../tripothon-20260928/issue-291-public-qa.md), [후속 Access 관찰](../director-followup-20260928/public-access-followup.md)의 원출력은 변경하지 않았다. 이동 연구, 세계관·무공·수치, 자산 권리, 승인 상태, 원격 게시 상태도 이 결과로 변경되지 않는다.

로컬 검증·커밋까지 완료한 기록이며 push·PR 댓글·본문 갱신·병합은 이 작업에서 수행하지 않았다.
