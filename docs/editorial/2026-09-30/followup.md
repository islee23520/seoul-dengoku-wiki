# #330 검증 상태 후속 — 2026-09-30

[9월 29일 결정 자료 검증](../2026-09-29/verification.md)과 당시 실패 기록을 보존하면서, 나중에 완료된 원격 CI 결과를 추가한다.

## 원격 CI 결과

- 대상: [Wiki #330](https://github.com/islee23520/seoul-dengoku-wiki/pull/330), 기존 제안 HEAD `9eca05bc7440a5dbb9d22a4335dba714ffcd98f4`.
- [실행 36566760157](https://github.com/islee23520/seoul-dengoku-wiki/actions/runs/36566760157): `pull_request`, `completed`, **success**. 2026-09-29 21:16:25 KST 완료.
- `lore-pr-checks`의 실제 검증 단계는 **Test lore JSON validator**와 **Validate changed lore JSON**이다. 두 단계가 모두 성공했다.

따라서 현재 전달 상태는 “원격 CI 진행 중”이 아니라 “해당 제안 HEAD의 lore JSON CI 통과”다. 이 실행에는 전체 production build·admission·contract·TypeScript·publication gate의 성공 근거가 없다. 9월 29일 로컬 Atlas 투영 33개 불일치와 생성 파일 부재 기록을 CI 성공만으로 해소 처리하지 않는다. 최신 main 전체 빌드 상태도 이 기록으로 판정하지 않는다.

## 설정 승인과 다음 작업

#330은 계속 Draft이며 조회 시 리뷰·일반 댓글·소유자 승인은 없었다. 학동 창고·접속/출입층·점유권과 성인 병졸·개별 장비/기술/상태/기분/지휘 입력은 미결이다. `decision-inputs.json`의 `runtimeTarget=null`, `stage2Locked=true`, 승인 null/false 상태를 유지한다. 해당 제안은 공개 정본과 게임 데이터가 아니다.

GDD #32의 이동 단위·계수 승인도 미결이다. 마감이 지났다는 이유로 제안을 자동 채택하거나 출발 분대·무기 성능·창고 역을 확정하지 않는다. 이후 승인 근거가 생기면 해당 원천과 승인표를 함께 갱신하고 정식 생성 경로로 검증한다.

## 검증 범위

`gh run view 36566760157 -R islee23520/seoul-dengoku-wiki --json conclusion,headSha,event,status,url,jobs`로 HEAD·종료 시각·개별 단계를 확인하고 PR 상태와 대조했다. 이번 변경은 문서 상태 기록만 추가한다. lore 원천·생성물·검사 코드·과거 검증 기록은 변경하지 않으며 테스트 재실행을 새 증거로 만들지 않는다.
