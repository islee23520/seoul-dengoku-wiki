# Worktree 정리 영수증 — 2026-09-05

실행 주체: w6R:p29 OmO 리드 세션 (사용자 지시: "clean up any remaining job done here and worktrees done merged to main then clean up worktrees")

## 분류 기준

- 제거: tracked 변경 없음(완전 clean) 또는 미추적 파일을 아카이브 후 제거. 브랜치는 삭제하지 않음(커밋 전부 보존).
- 제외: main 작업 사본, tracked 변경(dirty) 존재, 에이전트 pane이 cwd로 점유 중, character-integrity-repair(사용자 종료 취소 지시 유지).
- 임시 자원: 리드가 만든 monitor/백그라운드 세션 3개 종료(kill_bash), Unity 프로세스 없음 확인.

## 결과 요약

- 제거: 102개 worktree (script removed=101 + ui-assets-preparation 잔여 완전 제거). git worktree remove --force 사용.
- 생략(dirty 보존): 25개 — cast-b017, cast-b020, cast-backstories-* 2개, cast-canonical-M006, cast-finish-atlas-tooling, cast-finish-B024/B043, cast-foundation-T4-9, cast-hostile-wave3(12 mods/25 untracked), cast-iso-atlas, cast-monster-* 4개, cast-social-B013-B024(7 mods), cast-social-B025-B035, unity-poc-art-todo13(2), unity-poc-art-todo15(518), unity-poc-core-loop-wave0(3), unity-poc-core-loop-wave1(23), unity-poc-evidence-playmode(35), wiki-complete-f1f4(2).
- 에이전트 pane 보호 제외: character-integrity-repair(wCN:p1), runtime-slot-wiring, cast-backstories-houses-physical-ai.
- main 작업 사본: git이 main working tree 제거를 올바르게 거부(무영향).

## 아카이브 (본 디렉터리)

- `cast-g19-g24/` + `.SHA256`: 미추적 1파일.
- `ui-assets-preparation/` + `.SHA256`: Game/Assets/Janseon/ArtCandidates* 38파일(frozen preserved_untracked_imports와 동일 집합).
- `ui-code-integration-review/` + `.SHA256`: 리드 검증 checkout의 재생성 후보 38파일(ui-assets 아카이브와 해시 동일).
- `recovered-review-raw/`: UI lane 세션 기록에서 복구한 독립 리뷰 원문 문자열 11건(≥4,000자, 세션·줄·해시 파일명).
- `ui-final-json-first-read-fragment.log`: UI frozen final.json의 첫 읽기 출력 전체(74,013바이트, 전반부 약 51KB 포함, 후반부는 기록에 부재).
- `remove-errors.log`: 제거 실패 원시 로그.

## 데이터 손실 고지 (중요)

- gitignore된 `.omo` 로컬 증거는 `git worktree remove --force`가 제거한 102개 worktree에서 함께 삭제됐다. 캐스트 등 완료·병합 lane의 로컬 세션 노트가 이에 해당한다.
- **ui-assets-preparation의 frozen UI 증거(final.json SHA256 71e966000b70cf6531cba4f8380c26d427c499d18a1e55ac02480a2584078581) 전문 바이트는 유실됐다.** 복구 시도: APFS 스냅샷 없음, Time Machine 백업 없음, 이슈 #8 첨부 없음(댓글에 SHA 기록만 존재), 세션 기록에서는 후반부 약 46KB가 어디에도 저장되지 않았음이 확인됐다. 남은 것: 전반부 조각(위 fragment), 리뷰 원문 11건, 167개 파일 전체 SHA256 목록(메인 저장소 `.omo/ulw-notes/ui-preservation-before.json`), 이슈 #8 기록, 재생성 가능한 candidate-v1(병합된 generator로 동일 산출).
- 원인: 정리 스크립트가 git 미추적 대상만 아카이브했고 gitignore 대상(.omo)은 아카이브 없이 --force 제거 경로에 있었다.

## 정리 후 상태 검증

- 2026-09-05 22:15 기준 worktree 33개: 설계상 보존 25개 + **정리 실행 중 다른 세션이 병렬로 재생성한 것으로 보이는 cast-canonical-M020~M026, runtime-slot-wiring-review(locked) 등**. 재생성분은 이 정리의 대상에서 제외했으며 현 HEAD가 출발 당시와 다름(M021 22aabb8, M022 d7071e0, M023 f6f8407 신규 커밋)을 확인했다.
- character-integrity-repair 존재 확인, wCN:p1 pane 응답 확인, Herdr server running(0.8.2) 확인, Unity 편집기 프로세스 해당 worktree 무관 확인.
