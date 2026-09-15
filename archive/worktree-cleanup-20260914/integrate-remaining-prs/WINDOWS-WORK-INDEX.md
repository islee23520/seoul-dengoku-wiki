# Windows 작업 복구 색인

2026-09-09 Windows `DESKTOP-BO514ET`의 seoul-kenshi 관련 작업을 이 Mac에서 그대로 읽고 이어갈 수 있도록 복구했다. 원본 체크아웃에는 손대지 않았고, 복구본은 `.omo/windows-full-recovery-20260909/recovered/payload/` 아래에 별도 보관한다.

## 지금 이어서 할 작업

Windows의 현재 주 작업 브랜치는 `feat/unity-remote-integration` (`0744ec776986619483eac6505750dfa83e679270`)이다. 현재 모듈은 Unity POC 통합 코어 루프다. 코어 구현과 PlayMode 검증은 끝났지만 uGUI 전환, 생성 아트 통합, 최종 수용 게이트는 남았다.

- 현재 체크리스트: [Windows ToDo.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/ToDo.md)
- Unity Remote 실행법과 현재 제약: [docs/Unity-Remote.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/docs/Unity-Remote.md)
- 주 작업 트리의 미커밋 코드: [UiCandidateShowcase.cs](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/Game/Assets/Janseon/Art/Editor/UiCandidateShowcase.cs)
- 미커밋 프로젝트 설정: [ProjectSettings.asset](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/Game/ProjectSettings/ProjectSettings.asset)
- 전체 Windows 상태와 SHA 원장: [source-manifest.json](.omo/windows-full-recovery-20260909/recovered/source-manifest.json)

Unity Remote 하위 저장소도 별도로 복구했다. `main` (`7bfe64f860f9411fd5d625aeb9b77ff267c04a84`) 기준 27개 dirty 항목이며, token-free broker/CLI/web/Unity connector 변경과 `tests/no-token.test.ts`가 포함된다.

- 하위 저장소 설명: [External/unity-remote/README.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/External/unity-remote/README.md)
- 신규 테스트: [tests/no-token.test.ts](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/External/unity-remote/tests/no-token.test.ts)
- 복원 패치: [unity-remote working-tree.patch](.omo/windows-full-recovery-20260909/recovered/payload/git/unity-remote/working-tree.patch)
- Git 이력 bundle: [unity-remote repository.bundle](.omo/windows-full-recovery-20260909/recovered/payload/git/unity-remote/repository.bundle)

## 병렬·역사 작업 트리

복구 시점 상태는 다음과 같다. `rtfc-phase-d`와 `poc-ugui-v4-runtime-contract`는 현재 구현 맥락을 가진 dirty 작업 트리다. `poc-ugui-v4-runtime-promotion`의 114개 미추적 이미지/애니메이션은 탈락·시험 아트를 포함한 보존 자료이며 갤러리 재전시 대상으로 취급하지 않는다.

| Windows 원본 | 브랜치 / HEAD | dirty | 로컬 복구본 |
|---|---|---:|---|
| `E:/git/seoul-kenshi` | `feat/unity-remote-integration` / `0744ec7` | 10 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi/) |
| `E:/git/seoul-kenshi-live-poc-6f07a94` | detached / `6f07a94` | 2 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi-live-poc-6f07a94/) |
| `E:/git/seoul-kenshi-wt/poc-ugui-v4-runtime-contract` | `feat/poc-ugui-v4-runtime-contract` / `e0b7535` | 5 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/poc-ugui-v4-runtime-contract/) |
| `E:/git/seoul-kenshi-wt/poc-ugui-v4-runtime-promotion` | `feat/poc-ugui-v4-runtime-promotion` / `e37d83d` | 114 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/poc-ugui-v4-runtime-promotion/) |
| `E:/git/seoul-kenshi-wt/poc-ugui-v4-runtime-provenance` | `feat/poc-ugui-v4-runtime-provenance` / `e0b7535` | 1 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/poc-ugui-v4-runtime-provenance/) |
| `E:/git/seoul-kenshi-wt/rtfc-phase-d` | `rtfc/phase-d` / `baaeb8a` | 32 | [worktree](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/) |

나머지 clean 작업 트리와 비-Git 증거 루트도 빠짐없이 [worktrees](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/) 아래에 있다. 모든 브랜치·HEAD·status 원문은 [source-manifest.json의 repositories](.omo/windows-full-recovery-20260909/recovered/source-manifest.json)에 기록했다. 공통 Git 이력은 [seoul-kenshi repository.bundle](.omo/windows-full-recovery-20260909/recovered/payload/git/seoul-kenshi/repository.bundle)로 복원할 수 있고, 각 작업 트리의 binary patch와 index patch는 [git](.omo/windows-full-recovery-20260909/recovered/payload/git/)에 있다.

## 조사·계획·결과·HTML

- 최신 사유 연구 뷰어: [reference-games-viewer.html](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/.omo/research-private/reference-games-viewer.html)
- 최신 UI 목업: [ui-mockup-v4.html](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/.omo/design/ui-mockup-v4.html)
- 조사 출처: [Research-Sources.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/docs/game-logic/Research-Sources.md)
- 현재 계획과 다음 모듈 결정: [rtfc-phase-d ToDo.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/ToDo.md)
- 개발 로드맵: [Development-Roadmap.md](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/docs/game-logic/Development-Roadmap.md)
- PlayMode 완료 표식: [playmode.done](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/rtfc-phase-d/.omo/evidence/ulw-execute/phase-d-readiness/d1-integration-verifier-st_01a0829d/playmode.done)
- 문서·QA 증거 루트: [seoul-kenshi-docs-evidence-st_01a079f1](.omo/windows-full-recovery-20260909/recovered/payload/worktrees/seoul-kenshi-docs-evidence-st_01a079f1/)

역사 자료와 현재 자료를 섞지 않는다. `poc-ugui-v4-runtime-*`, `gameplay-6d3fe97`, `live-poc-6f07a94`, `qa-publication`, `reference-context-sync-st_01a079f1`은 병렬 실험·증거·과거 체크포인트다. 현재 행동 기준은 위의 `seoul-kenshi`와 `rtfc-phase-d` 상태다.

## 에이전트 세션과 외부 연구 저장소

프로젝트 경로 또는 본문에 `seoul-kenshi`, `janseon`, `rtfc-phase-d`, `poc-ugui` 등 정확한 연결이 있는 파일만 회수했다. 개인 설정·인증 정보와 다른 프로젝트 세션은 가져오지 않았다.

- OMO 메모리·세션·research: [C__Users_oliver_.omo](.omo/windows-full-recovery-20260909/recovered/payload/sessions/C__Users_oliver_.omo/) — 3,714개
- Claude 원문 transcript: [C__Users_oliver_.claude_transcripts](.omo/windows-full-recovery-20260909/recovered/payload/sessions/C__Users_oliver_.claude_transcripts/) — 26개
- 대표 OMO 원문 세션: [2026-09-07 session](.omo/windows-full-recovery-20260909/recovered/payload/sessions/C__Users_oliver_.omo/agent/sessions/--E--git-seoul-kenshi--/2026-09-07T16-15-57-837Z_01a07ca7-a98d-78d7-a87a-20df4824ef66.jsonl)

Codex, Senpi/pi, OpenCode 저장소는 별도 탐색했지만 정확히 연결된 세션 파일이 없었다. AppData의 Claude/OpenCode/VS Code/Cursor browser·globalStorage 캐시는 작성 결과가 아니고 다른 프로젝트·개인 설정을 함께 담으므로 제외했다. 근거와 전체 경로는 [excluded.json](.omo/windows-full-recovery-20260909/excluded.json)에 있다.

## 복구 규모와 검증

최종 원장은 37,429개 파일, 1,762,299,811바이트다.

- 33,671개: 프로젝트 및 작업 트리 원본 파일
- 3,740개: 프로젝트 연결 세션·연구 파일
- 17개: Git bundle/patch/history 재구성 파일
- 1개: Windows 예약 이름 `nul`을 `__windows_reserved_nul`로 매핑한 빈 파일

초기 31,406개에서 최종 37,429개로 늘어난 이유는 Git tracked/untracked 목록만 복사하지 않고, `.git`, `Library`, `Temp`, `Logs`, `obj`, `node_modules`, `UserSettings`, 캐시를 제외한 작업 트리의 모든 일반 파일을 다시 열거했기 때문이다. 이 재열거로 ignore된 파일 6,164개가 추가됐고, 세션 선택에서 프로젝트 연결 `.log` 195개를 보존했다. 증가분에는 작성 증거·설정·결과뿐 아니라 기존 `.omo/design/t2-profile` browser profile 1,494개 / 182,533,897바이트도 들어 있다. `t2-profile`은 조사 맥락의 증거가 아니라 과거 작업이 남긴 브라우저 캐시이며, 원본 보존 요구 때문에 복구본에는 유지하되 작업 맥락 완전성 수치로 해석하지 않는다. 분해 근거는 [expansion-analysis.json](.omo/windows-full-recovery-20260909/inventory/expansion-analysis.json), 전체 분류는 [source-manifest.json](.omo/windows-full-recovery-20260909/recovered/source-manifest.json), RED 근거는 [red-vs-prior-recovery.json](.omo/windows-full-recovery-20260909/inventory/red-vs-prior-recovery.json)에 있다.

검증 명령:

```bash
python3 .omo/windows-full-recovery-20260909/scripts/validate_recovery.py
```

정상 결과는 exit 0이며 로컬 missing/hash/size mismatch와 원격 byte missing/hash/size mismatch, inventory added/removed, unresolved error/inaccessible, unstable authored file이 모두 0이다. 최종 원격 검사는 37,412개 원본 source 항목을 다시 SHA-256으로 읽어 로컬 manifest와 대조했다. 작성 파일의 누락·해시 불일치·목록 증감은 0이다. 실행 중 계속 기록된 OMO runtime diagnostic log 2개는 크기 증가를 별도 기록했으며 작성 프로젝트 자료 안정성 판정에서는 제외했다. [remote-byte-comparison.json](.omo/windows-full-recovery-20260909/inventory/remote-byte-comparison.json)과 [reconciliation.json](.omo/windows-full-recovery-20260909/inventory/reconciliation.json)에 비교 결과가 있다.

## 제외·특수 항목

- Unity `Library`, `Temp`, `Game/Logs`·Editor/AssetImportWorker 로그, `obj`, `.vs`, `node_modules`, `UserSettings`, 일반 캐시 131,187개는 재생성 가능 산출물로 제외했다. `.omo`, 증거 루트, 작업 트리 루트의 작성 QA/research 로그는 보존했고, blanket `Logs` 감사를 통해 누락됐던 `.omo/senpi-task/logs/st_01a07944.jsonl`도 별도 회수했다.
- 이전 `seoul-kenshi-document-export-20260909*`는 이번 원본 루트의 생성 중복본이어서 재귀 복사하지 않았다.
- LFS 추적 파일은 현재 작업 트리의 실제 바이트를 복사하고 SHA-256을 검증했다. LFS object cache 자체는 중복 캐시라 복사하지 않았다.
- reparse point/junction은 선택 범위에서 0개였다.
- 접근 불가 파일과 미해결 export 오류는 0개다.
- VS Code C# 자동 탐색이 복구본 안에 만든 `.NET/Temp/obj` sidecar 70개는 원장 외 파일임을 [post-extraction-extras.json](.omo/windows-full-recovery-20260909/post-extraction-extras.json)에 기록한 뒤 제거했다. VS Code 설정과 프로세스는 건드리지 않았다.
- 이번 작업의 원격 임시 export만 검증 후 삭제했다. [cleanup-receipt.json](.omo/windows-full-recovery-20260909/cleanup-receipt.json)
