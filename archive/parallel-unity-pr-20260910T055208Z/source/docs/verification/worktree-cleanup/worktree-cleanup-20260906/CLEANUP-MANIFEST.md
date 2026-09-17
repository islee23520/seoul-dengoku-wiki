# Worktree Cleanup Receipt — 2026-09-06

## Scope
User directive: wts(seoul-kenshi-wt) 폴더 조사 — 미완료 작업은 완료, 완료 작업은 PR 후 폴더 제거.

## Classification rule
- 병합 완료(origin/main 도달)·구세대 대체(정책 이슈 #14, main이 Cast-State 구조로 재편)·중복 세대(프롭 .asset 세대, LFS 미스머지)·PR 반영 완료 → 제거
- 라이브 세션 점유 → 보존

## Removed (42) — branches NOT deleted (132 branches intact)
구세대 cast 레인 33개: cast-b017, cast-b020, cast-backstories-houses-physical-ai-wave05, cast-canonical-M006, cast-canonical-M020..M029, cast-finish-atlas-tooling, cast-finish-B024, cast-finish-B043, cast-foundation-T4-9, cast-hostile-wave3, cast-iso-atlas, cast-monster-M001-M010/M011-M020/M021-M030/M031-M039, cast-repair-B001/B011/B018/B028/B029/B035/B036, cast-social-B013-B024, cast-social-B025-B035, cast-world-final-integration
Unity/POC 레인 8개: unity-poc-art-todo13(PR #2 머지), unity-poc-art-todo15(PR #32로 승격 착륙 후 제거), unity-poc-core-loop-wave0(머지), unity-poc-core-loop-wave1(타이틀/UI는 main 세대에 대체, 프롭 .asset은 중복 세대), unity-poc-evidence-playmode(동일), wiki-complete-f1f4(머지), issue8-run1(전량 PR #31로 착륙), _baseline-main2(검증용 임시)

## Kept (2)
- seoul-kenshi (main)
- cast-backstories-houses-physical-ai — 라이브 OmO 세션(node/Python PID 19379/19407/19932/58733, browser QA http.server) 점유 중

## Archive
- 위치: 이 디렉터리(워크트리별 하위 폴더)
- 각 폴더: status-at-removal.porcelain, untracked-and-evidence.tar.gz(.omo/.openchrome, 캐시 제외), untracked/(미추적 원본 복사), MANIFEST.sha256(파일별 SHA256, 42개 전량)
- 주요 보존: cast-hostile-wave3 G01–G24 도시에 24본, todo15 Unity junit·파일럿 캡처 증거 13건, wave1 증거 1430항
- 스태시: todo15-pre-rebase-20260906(승격 후 재생성 515파일 이터레이션), 기존 cast-social-B001-B012 보존분

## Landed work
- PR #32 (feat/unity-poc-art-todo15): 3역할 승격 + 어셈블리 구조 수정. Node 전 스위트·Python 15/15·Unity EditMode 118/118·승격 PlayMode 통과
- PR #31(병렬 세션, 머지): 타이틀 재구성 + 탐험가 8프레임 파일럿 + 엔진뷰 캡처

## Known issues (not caused by this cleanup)
- main PlayMode UiCandidateRenderPlayModeTests: ArtCandidates/UI/Title/poc-title-art.png 입력 미착륙(#8 타이틀 후보 임포트 대기) — 신규 클론에서도 실패
- LFS: PNG 트래킹 브랜치를 받은 worktree는 git lfs checkout 전에는 테스트 불가(미스머지 → null 로드). 이번 정리 중 승격 PlayMode "실패"의 상당수가 이 아티팩트였음
- Unity.Lic 데몬(PID 6664)이 wave1을 cwd로 갖고 있었으나 제거는 정상 완료. 데몬은 재시작 시스 자체 갱신

## Data loss
없음 — 제거 전 전량 아카이브 + 해시 영수증. 브랜치 132개 전량 보존.

## wts 루트 잔여 정리 (추가)
- 빈 디렉터리 4개 제거: cast-social-B001-B012, character-integrity-repair, runtime-slot-wiring, wiki-sixteen-states-worldbuilding (0바이트 껍데기)
- unity-poc-art-todo14(미등록, .omo 증거 5.2MB) → unity-poc-art-todo14-orphan/omo-evidence.tar.gz 보존 후 제거
- wts 루트 AGENTS.md(워크트리 실행 규칙), deliverable-table.txt, artifact-archives/runtime-slot-wiring 증거 tar 2종(125MB) → wts-root-files/ 로 이동 보존
- 최종 wts 잔여: cast-backstories-houses-physical-ai(라이브 세션 점유) 1개뿐
