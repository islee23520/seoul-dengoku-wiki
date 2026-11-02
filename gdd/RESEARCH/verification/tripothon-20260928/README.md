# Tripothon 검증·제작 인계 — 2026-09-28

후속 기준: [디렉터 요청 대조표](../director-followup-20260928/README.md). 14:23 UTC 이슈의 별도 탑다운 화면·3D 모델 렌더 초상·연속 워크스루 조건을 아래 제작 계약에 반영했다. [14:33 UTC 공개 접근 재확인](../director-followup-20260928/public-access-followup.md)에서도 /tripothon/은 Access로 이동했다. 기존 원문 관찰·실패 보고는 그대로 보존한다.

이 디렉터리는 #282·#291·#292의 실제 관찰과 후속 제작 계약이다. 게임 구현·자산 승격·제출 완료를 뜻하지 않는다. 기본 소스는 `84920d8c418d0f8e2bbc474b83d4a9ca0c397728`이며, 최신 방향은 소유자 [결정 13·14](https://github.com/islee23520/seoul-dengoku/blob/5a98964518f0e7110e91ba37e7e9590135be21c1/Intent.md)를 따른다. 해당 문서는 조회 당시 열린 PR #306에 있으며 main 병합 사실과 구분한다.

| 이슈 | 실제 제공 | 아직 충족하지 못한 조건 |
|---|---|---|
| #282 | 14개 OBJ/MTL/PNG의 해시·UV·재질·카탈로그 검사, 검수 보드 | 원본 GLB·권리 확인·Unity 임포트 및 렌더 영수증 |
| #291 | 익명 HTTP 302 및 실제 Cloudflare 로그인 화면, 후속 QA 시나리오 | 접근 가능한 최신 캠페인 빌드, 시간 기반 이동·전투·정산 실제 검증 |
| #292 | 촬영 순서, 한영 피치 초안, 영상·출처 보드 제출 계약 | 검증된 플레이 영상·승인 에셋 보드·최종 제출 URL |

## 재현

저장소 루트에서 `node RESEARCH/verification/tripothon-20260928/audit-landmarks.mjs .`를 실행한다. PNG가 LFS 포인터면 실제 객체가 `.git/lfs/objects`에 있어야 하며, 없으면 실패한다. Git LFS가 있는 환경에서는 대상 파일을 먼저 내려받는다. 포인터 텍스트를 이미지로 세지 않는다. 이번 검사는 GitHub LFS에서 실제 객체를 받아 포인터의 oid·size와 대조한 캐시로 수행했다. 전체 Unity 프로젝트의 LFS 복구 완료를 뜻하지 않는다.

`node RESEARCH/verification/tripothon-20260928/check-public-access.mjs`는 익명 HTTP 진입만 검사한다. Access 로그인으로 이동하면 exit 1이다. 응답 쿠키·토큰·리디렉션 쿼리는 보관하지 않는다. HTTP 200만으로 게임 플레이 PASS를 선언하지 않는다.

## 근거 읽기

- [문서] [에셋 보드](issue-282-asset-board.md), [실제 파일 검사](asset-audit.json).
- [문서] [공개 QA](issue-291-public-qa.md), [HTTP 재현](public-demo-evidence/http-access.json). 기존 브라우저 도구의 blank/timeout 보고도 별도로 보존했다.
- [추론] [촬영·피치 초안](issue-292-media-package.md). 구현 확인 뒤 사용할 제작안이다.
- [미확인] 원본 자산 권리, Unity 6000.7.0a5 실제 검증, 최신 공개 빌드와 최종 제출 링크.

관련 C# 검증은 별도 BattleSetup PR, 이동 연구는 `../campaign-movement-20260928/`과 별도 GDD 제안에 있다. 숫자와 설정의 최종 승인 및 main 통합은 소유자 경계다. 공개 사이트의 Access 설정은 변경하지 않았다.
