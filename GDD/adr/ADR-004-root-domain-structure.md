# ADR-004 — 루트 도메인과 단일 설계 정본

- 상태: 2026-09-20 개정 수용됨 (소유자 결정: GDD 단일 설계 정본)
- 선행: ADR-001 (인도 정책 — 본 구조 재편의 인도는 ADR-001 소유자 권한 아래 수행됐다)
- 시행 커밋: `befb8da9` (2026-09-18 루트 7도메인 전면 재편)

## 배경

2026-09-14 7폴더 구조(Game/GDD/Design/Research/Reference/Tool/Backend)와 Wikis 분리를 거쳐, 소유자가 문서를 GDD·LORE·GAME-LOGIC·GAME-REFERENCE·RESEARCH·TOOL 하위 도메인으로 나누고 GAME을 Unity로 두는 전면 재편을 지시했다. 적대적 검토(스켑틱 21결함)를 통과한 계획(.omo/plans/root-domain-restructure.md)으로 실행했다.

## 결정

저장소 루트는 아래 도메인 디렉터리와 루트 설정 파일만 가질 수 있다. 이 목록 외의 루트 항목은 `Tool/tools/policy/check-repo-delivery-policy.mjs`의 구조 검사가 거부한다(fail-closed).

| 도메인 | 책임 |
|---|---|
| `GDD/` | 모든 게임 설계 정본: 제품·규칙·레퍼런스·아키텍처·아트·ADR·제안·시스템 설계 |
| `LORE/` | 세계관 정본(world계 175 + name-pools + regions) |
| `WEB/` | React 공식 위키와 VitePress 생성·검증 표면. 정본이 아님 |
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
3. **문서 배치 계약**: 세계관은 LORE, 모든 게임 설계와 규칙은 GDD, 시각·실물 참고는 GAME-REFERENCE, 조사는 RESEARCH에만 둔다. WEB은 정본을 읽어 게시할 뿐 의미를 소유하지 않는다.
4. **배포면**: 공개 문서는 `WEB/wiki-source/dist`(로컬 prebuilt, `.vercelignore` 8행 체인)만 쓴다. 서브 경로 서빙은 SERVICES.md 표 + 복합 스테이징을 따른다.
5. **인도**: 본 구조 변경사항의 인도 절차는 ADR-001을 따른다.

## 폐기

- 2026-09-14 7폴더 구조(Game/GDD/Design/Research/Reference/Tool/Backend 최상위)와 `Wikis/` 최상위 게시 정본 체계는 이 ADR로 대체된다.
- 2026-09-18의 LORE/GAME-LOGIC/GDD 3분할은 2026-09-20 소유자 결정으로 폐기한다. 설계 정본은 GDD 하나이며 게시 표면은 WEB로 분리한다.
