# ADR-004 — 루트 7도메인 구조 고정

- 상태: 수용됨 (소유자 승인 2026-09-18, "규칙으로 락킹")
- 선행: ADR-001 (인도 정책 — 본 구조 재편의 인도는 ADR-001 소유자 권한 아래 수행됐다)
- 시행 커밋: `befb8da9` (2026-09-18 루트 7도메인 전면 재편)

## 배경

2026-09-14 7폴더 구조(Game/GDD/Design/Research/Reference/Tool/Backend)와 Wikis 분리를 거쳐, 소유자가 문서를 GDD·LORE·GAME-LOGIC·GAME-REFERENCE·RESEARCH·TOOL 하위 도메인으로 나누고 GAME을 Unity로 두는 전면 재편을 지시했다. 적대적 검토(스켑틱 21결함)를 통과한 계획(.omo/plans/root-domain-restructure.md)으로 실행했다.

## 결정

저장소 루트는 아래 도메인 디렉터리와 루트 설정 파일만 가질 수 있다. 이 목록 외의 루트 항목은 `Tool/tools/policy/check-repo-delivery-policy.mjs`의 구조 검사가 거부한다(fail-closed).

| 도메인 | 책임 |
|---|---|
| `GDD/` | 스튜디오 기획 산출(adr·proposals·system-design·design-store) + 게시 design계 10페이지 |
| `LORE/` | 세계관 정본(world계 175 + name-pools + regions) |
| `GAME-LOGIC/` | 규칙·시스템 정본 + `site/`(VitePress 게시면, mount 스크립트 포함) |
| `GAME-REFERENCE/` | 에셋 BOM·UX 레퍼런스·무드보드·POC·지리 데이터(data) |
| `RESEARCH/` | canon-reference·verification |
| `TOOL/` | 저장소 Node 패키지(tools)·skills·서브모듈(unity-remote, character-forge)·Unity 문서 |
| `GAME/` | Unity 프로젝트(에디터 핀 6000.7.0a5, batchmode 전용) |
| `Backend/` | .NET 8 CoreWCF 서버(루트 유지 — 소유자 선택) |
| `store/` | 런 산출물 보존(루트 유지) |
| `archive/` | 워크트리 청소 스냅샷(sparse `!/archive/`, 루트 유지) |

루트 설정 파일 허용 목록(17종): `.gitattributes` `.gitignore` `.gitmodules` `.vercelignore` `AGENTS.md` `CLAUDE.md` `CONCEPT`류 기획 문서(`Concept.md` `Design.md` `Intent.md` `ToDo.md`) `CONTRIBUTING.md` `README.md` `SERVICES.md` `index.html` `package.json` `package-lock.json` `vercel.json`.

## 규칙

1. **구조 불변**: 신규 루트 디렉터리·루트 파일 추가는 이 ADR 개정(또는 후속 ADR) 없이 불가다. 정책 검사가 거부한다.
2. **구 세계 금지**: `Wikis/`·`Design/`·`Reference/`·`data/`·`Research/`·`Tool/`·`Game/`(구 케이스) 최상위 재생성 금지.
3. **문서 배치 계약**: 세계관은 LORE, 규칙은 GAME-LOGIC, 기획은 GDD, 레퍼런스는 GAME-REFERENCE, 조사는 RESEARCH에만 둔다. 코퍼스 분류는 `GAME-LOGIC/site/scripts/mount.mjs`의 폴더=도메인 규칙을 따른다.
4. **배포면**: 공개 문서는 `GAME-LOGIC/site/dist`(로컬 prebuilt, `.vercelignore` 8행 체인)만 쓴다. 서브 경로 서빙은 SERVICES.md 표 + 복합 스테이징을 따른다.
5. **인도**: 본 구조 변경사항의 인도 절차는 ADR-001을 따른다.

## 폐기

- 2026-09-14 7폴더 구조(Game/GDD/Design/Research/Reference/Tool/Backend 최상위)와 `Wikis/` 최상위 게시 정본 체계는 이 ADR로 대체된다.
- `wiki-vs-gdd` 분류 락의 경로 표기(Wikis/game-logic)는 LORE/GAME-LOGIC/GDD 3분할로 대체되며, 분류 원칙(게시 정본 vs 스튜디오 산출) 자체는 유지된다.
