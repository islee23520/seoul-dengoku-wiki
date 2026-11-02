# Boulder/ULW ↔ GitHub Issues/PRs 최종 대사 (읽기 전용, 2026-09-22)

읽기 전용 감사. GitHub에 아무것도 쓰지 않았다(이슈/PR 상태·라벨·댓글 변경 없음). Gemini 미사용.
기계 판독본: `RESEARCH/verification/boulder-github-issues-final-20260921.json`.

## 저장소/브랜치 바인딩

- `git remote -v` (메인 체크아웃 `/Users/OWNER/workspace/seoul-kenshi`): `origin` = `https://github.com/islee23520/seoul-kenshi.git`.
- `gh repo view --json nameWithOwner`: **`islee23520/seoul-dengoku`**. `gh`가 바라보는 실제 GitHub 저장소는 `seoul-dengoku`이며, 로컬 origin URL 문자열(`seoul-kenshi.git`)과 이름이 다르다(리다이렉트/rename 추정, 미확인). 이 감사의 모든 `gh` 조회는 `seoul-dengoku`를 대상으로 했다.
- 대상 worktree: `/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-updates-state-selection`, 브랜치 `fix/wiki-updates-state-selection`. `git log origin/main..HEAD --oneline`: **24 커밋** (아래 표). `HEAD`가 `origin/fix/wiki-updates-state-selection`과 동일 — PR211 원격 브랜치는 최신.
- worktree 작업트리 상태: 추적 파일 다수 modified(WEB/wiki, GDD/design-store 산출물)와 신규 untracked 파일 — `GDD/architecture/JSON-Relational-Canon.md`, `GDD/architecture/Person-Permanent-ID-Extension.md`, `GDD/design-store/canon/adr--adr-007-pr-evidence-lifecycle/`, `GDD/design-store/canon/data-catalog-and-schema/`, `RESEARCH/verification/cast-relations-id-mapping-20260921.{md,json}`. 이 파일들은 **아직 커밋되지 않았다** — PR211 diff에는 없다.

## PR211(24 커밋, origin/main..HEAD)

```
ea43a47d feat(tools): ADR-005를 JSON 정본 컬렉션에 추가한다
e732a0c9 feat(tools): ADR-006을 JSON 정본 컬렉션에 추가한다
8044f4fd feat(tools): ADR-004를 JSON 정본 컬렉션에 추가한다
1cc2a963 test(policy): 게이트 fixture를 ADR-004 계약에 맞춘다
dc014b64 feat(tools): ADR-001을 JSON 정본 컬렉션에 추가한다
64dfa727 docs(lore): 2126 배경과 백 년 구술로 논지를 맞춘다
37e3f707 docs(lore): 붕괴 원인을 프롤로그 문맥으로 옮긴다
333cf6d2 feat(tools): ADR-002를 JSON 정본 컬렉션에 추가한다
05577070 fix(wiki): 프롤로그와 2126 시점 라벨을 바로잡는다
f5965149 docs(lore): 공개 산문 문체와 Patina 영수증을 맞춘다
16141ffa feat(tools): ADR-003을 세 번째 JSON 정본으로 옮긴다
3da8d803 docs(lore): 프롤로그 참조를 독자 문맥으로 고친다
72a8bf0b feat(tools): 구조물을 두 번째 JSON 정본으로 옮긴다
a53140af feat(tools): 무공 용어집 계약을 검증한다
6909710a docs(lore): 무공 전승과 예비군 근거를 보강한다
1794b293 feat(tools): Patina 공개 문서 게이트를 보강한다
5df68977 feat(tools): 관직 JSON 정본 파일럿을 추가한다
0dc67baa docs(gdd): Ravelen 활성 참고를 제거한다
f0e6e458 feat(wiki): 1004명 영웅 확정 계약을 공개한다
cee3ce1a fix(wiki): 저작 문서와 투영 메타를 공개에서 분리한다
692f166d docs(lore): 붕괴 연쇄와 부평 재접촉을 정본화한다
e871cbd1 fix(wiki): 지도 마우스 팬과 오빗 입력을 바로잡는다
287472d1 feat(wiki): 전체 위키 업데이트 이력을 추적한다
ebb4b737 feat(wiki): 최신 소식과 국가 선택 정보를 연결한다
```

PR211 본문(작성자 직접 명시, OPEN): **"전체 ULW 완료 전 병합하지 않는다."** 남은 차단 사유:
1. CPA Gemini quota 429 — mixed 판정 4문서(Cast-Index-S4, Chaebol-Houses, Martial-Paths, Station-Interior) 미교정.
2. 138문서 Patina receipt는 위 4문서 교정 후 재생성 필요, World-Expansion-Index 수동 승인 SHA 미확보.
3. 인물 관계 JSON 컷오버 보류 — K ID 없는 582명(이름만 안정 키)의 소유자 잠금 배정 순서 부재.
4. G004 C002/C004 및 전체 이슈·worktree·파생물 인도 미완.

worktree의 미커밋 `cast-relations-id-mapping-20260921.md/json`은 위 3번 차단을 다룬 **읽기 전용 감사**로, K ID 커버리지(422/1004명, 나머지 582명은 이름 단일 키), K 없는 이름 4개(오경재·이일섭·조재표·이연)를 확정했지만 정본 컷오버 결정(K423+ 배정 or 이름 표준화)은 "여기서 정하지 않았다"고 명시 — 정본 수정 0건.

## 이슈/PR 표

| # | 유형 | 제목 | 상태 | 라벨 | 이 런의 근거 | 판정 |
|---|---|---|---|---|---|---|
| #122 | Issue | 세계관: 백야 신종목·신준과 기동잔존대 귀환망 | OPEN | 세계관,설정,인물,사건,이야기,gateway,quality:medium | `LORE/characters/{Cast-Index,Cast-Relations,Cast-Unaffiliated,Starting-Presets}.md`에 "신종목"/"백야" 문자열 0건(grep). 이슈 최신 댓글이 명시: "인물 카드·전용 PR이 착지하지 않은 이슈는 닫지 않습니다." PR211 24커밋 어디에도 캐스트 카드 착지 없음. | **KEEP-OPEN — owner 데이터 없음.** 카드 미착지, 소유자 락 항목(표시 이름 승인) 미확정. |
| #126 | Issue | 인물: 민웅기 — minpeter 캐스트 등록 | OPEN | 인물,이야기,gateway,quality:medium | 동일 grep에 "민웅기"/"minpeter" 0건. 이슈 본문 자체가 "이 이슈에서 Cast-State/Cast-Index/Cast-Relations/values-cast.json을 직접 수정하지 않는다"로 비목표 명시 — 후속 전용 PR 필요. PR211 커밋에 해당 인물 카드 없음. | **KEEP-OPEN — owner 데이터 없음.** 카드 미착지. |
| #108 | Issue | 인물: 조재표 — 유명 낭인 캐스트 등록 | OPEN | 인물,이야기,gateway,quality:medium | grep으로 `Cast-Relations.md`, `Starting-Presets.md`, `Cast-Index.md`, `Cast-Unaffiliated.md` 4개 파일에 "조재표" 존재 확인. `cast-relations-id-mapping-20260921.md`가 `Cast-Unaffiliated.md`의 `캐릭터 ID: unaffiliated-jaepyo-jo`를 정본 필드로 재확인(verify-cast R15 검사 대상). 카드는 이미 착지된 상태로 보이나, 이 착지가 PR211의 24커밋에 포함된 신규 작업은 아니며(기존 main 반영분), PR211은 이 인물을 새로 다루지 않았다. | **UPDATE-ONLY(owner 확인 필요) — 이 런의 산출물이 아님.** 카드는 (이전 작업에서) 착지된 것으로 보이나 이슈 종료 여부는 owner가 PR 링크로 확정해야 함; 이 스윕이 새로 만족시킨 사실은 없음. |
| #161 | Issue | 인물: 지연희 추가 — 비밀 명단 회수와 해방 계약 서사 | OPEN | 세계관,인물,이야기,gateway,quality:medium | grep 0건. PR211 커밋에 해당 인물 없음. | **KEEP-OPEN — owner 데이터 없음.** |
| #208 | Issue | [인물] 서하진 인물 등록 및 첫 등장 사건 설계 | OPEN | 인물,quality:medium | grep 0건. PR211 커밋에 해당 인물 없음. | **KEEP-OPEN — owner 데이터 없음.** |
| #102 | Issue | 세계관: 무협 컨셉 추가 — 무술 유파·거지(개방) 계열 (신종목 제안) | OPEN | 세계관,인물,gateway,quality:medium | PR211 커밋 `6909710a`(무공 전승과 예비군 근거를 보강한다), `a53140af`(무공 용어집 계약을 검증한다)가 직접 무공 유파/전승/용어집을 다룸(TOOL 테스트로 게이트 확인, PR211 검증란 "무공 9유파 후계 4유파 전승·기법·상성, 예비군 제도 사실/창작 분리, 용어집 계약"). 단, #122(신종목 자체 캐릭터화)는 여전히 미착지이므로 이슈 본문의 "신종목 제안" 연결 절반만 진행. | **UPDATE-ONLY.** 세계관 설정(유파 체계) 진행, 캐릭터 연결(#122)은 미완 — 이슈 자체를 닫을 근거 부족. |
| #101 | Issue | 설정: UI/UX 레퍼런스 게임 취합 (화면 소유·이슈 링크) | OPEN | 설정,게임로직,gateway,quality:high | PR134(CLOSED, unmerged)와 PR169(OPEN, unmerged)가 모두 "Closes nothing. Relates to #101" — 두 PR 다 이슈를 닫지 않는다고 명시. PR211 커밋은 #101을 다루지 않음(무공/JSON canon/지도 작업). | **KEEP-OPEN.** PR134/169 어느 쪽도 종료 권한 없음(작성자 명시); PR211과 무관. |
| #97 | Issue | 설정: 시야·카메라는 좌우 사이드스크롤 (Intent 결정 10) | OPEN | 설정,게임로직,gateway,quality:medium | PR211 커밋에 카메라/전투 화면 변경 없음. 참고: AGENTS.md 기록상 Intent 결정 10(2026-09-18)이 3D 자유 카메라로 대체됐다고 별도 기록되어 있으나, 이는 이 PR211 커밋으로 만족된 것이 아니라 이전 Intent 결정이며, 해당 GDD 반영 커밋도 이 24개 목록에 없다. | **SUPERSEDED(문서 트랙, 이 런과 무관) — 종료는 별도 Intent 갱신 PR의 몫.** 이 스윕만으로 닫을 근거 없음. |
| #98 | Issue | 설정: 인물·생업·관계가 카드로 들어오는 부여 규칙 | OPEN | 설정,게임로직,gateway,quality:medium | PR211 커밋에 카드 부여 규칙 변경 없음. | **KEEP-OPEN.** 무관. |
| #41 | Issue | 이야기: 서사·플레이 경험 디렉션과 「문을 닫지 않는 공성전」 제안 | OPEN | 설정,사건,이야기,gateway,quality:medium | PR211 커밋에 해당 제안 반영 없음. | **KEEP-OPEN.** 무관. |
| PR134 | PR | docs(ui): #101 12면과 후계 보조 목업을 고정한다 | **CLOSED** (mergedAt: null → 병합되지 않고 닫힘) | headRefName `docs/issue-101-twelve-screen-mockups` | 본문 "Closes nothing. Relates to #101." 파일 4개(`poc-complete.html` 2곳, `Reference/ui-ux-refs/index.html`, `Tool/tools/test-issue-101-mockup-names.mjs`) 변경. | **CLOSED, unmerged — 상태 변경 불필요(이미 종결).** #101을 닫지 않음. |
| PR169 | PR | docs(wiki): #101 UI/UX 결정 기록을 정본과 공식 위키에 반영 | **OPEN**, unmerged | headRefName `docs/issue-101-canon-wiki-sync`, base `main` | 본문: "소유자 병합으로 main에 push되면 Windows 공식 허브 배포 워크플로가 자동 실행됩니다... #101 화면 목업과 Unity 구현은 이 PR 범위가 아닙니다." GDD/Wiki 13개 파일 변경(정본 복구 + 위키 동기화). PR211과 독립 브랜치(`docs/issue-101-canon-wiki-sync` ≠ `fix/wiki-updates-state-selection`). | **KEEP-OPEN — owner 병합 대기.** 검증은 자체 완료(VitePress/링크게이트/도구테스트 44건/배송정책 통과)로 본문에 기재되어 있으나, 병합 여부는 owner 권한이며 이 감사가 병합하지 않음. |
| PR211 | PR | wiki-updates-state-selection (위키 업데이트·국가 선택·JSON 정본·무공·붕괴연쇄 등 다건) | **OPEN**, unmerged | headRefName `fix/wiki-updates-state-selection` | 위 24커밋 + 작성자 본인이 "전체 ULW 완료 전 병합하지 않는다" 명시. worktree에 미커밋 변경 다수(추가 조사 산출물 포함) 존재 — PR diff에는 반영되지 않은 상태. | **KEEP-OPEN — 작성자 본인이 병합 보류 선언, 4개 미해결 차단(Gemini 429/receipt/K-ID 컷오버/전체 인도) 모두 미해소.** |

## 요약 판정 분포

- CLOSE-COMPLETE: **0건** (이 스윕이 새로 완결시킨 이슈/PR 없음).
- KEEP-OPEN (owner 데이터/결정 누락): #122, #126, #161, #208, #101, #98, #41, PR169, PR211.
- UPDATE-ONLY (부분 진행, 종료 불가): #102(무공 설정 진행, 캐릭터 미착지), #108(카드는 기존에 착지됐으나 이 런의 산출물 아님 — owner가 PR로 직접 확인 필요).
- SUPERSEDED: #97(문서 트랙상 Intent 결정으로 대체 진행 중이나 이 PR211 커밋과 무관, 별도 GDD 갱신 PR이 종료 주체).

## 인용한 게이트/명령

- `gh repo view --json nameWithOwner` → `islee23520/seoul-dengoku`
- `gh issue view {122,126,108,161,208,102,101,98,97,41} --json ... -R islee23520/seoul-dengoku`
- `gh issue list -R islee23520/seoul-dengoku --state open --limit 200 --json number,title,labels,updatedAt` (라벨 필터: wiki|world|gdd|lore|설정|세계관|인물)
- `gh pr view {134,169,211} --json number,title,state,body,url,mergedAt,headRefName,baseRefName,files,commits -R islee23520/seoul-dengoku`
- `git log origin/main..HEAD --oneline` (worktree `wiki-updates-state-selection`, 24건)
- `git status --short` (worktree, 미커밋 변경 확인)
- `grep -rl` 인물명 대사(신종목/백야, 민웅기/minpeter, 지연희, 조재표, 서하진) — `LORE/characters/*.md`
- `RESEARCH/verification/cast-relations-id-mapping-20260921.md` (worktree 내 미커밋, 읽기 전용 감사 원문)

## 승인된 조치(이 감사가 실제로 수행한 것)

- 파일 작성만: `RESEARCH/verification/boulder-github-issues-final-20260921.md`, `RESEARCH/verification/boulder-github-issues-final-20260921.json` (apply_patch/Write 도구, 메인 체크아웃 `/Users/OWNER/workspace/seoul-kenshi`).
- GitHub 쓰기 없음(이슈/PR 코멘트·라벨·상태·병합 변경 0건). Gemini 미호출.
