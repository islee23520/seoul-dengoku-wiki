@AGENTS.md
@Intent.md

# Claude Code 프로젝트 지시

이 파일은 Claude Code 메모리 규약(docs.anthropic.com/en/docs/claude-code/memory)에 따라 루트에 둔다. 위 임포트로 공통 지식 베이스(AGENTS.md)와 방향 결정 기록(Intent.md)을 매 세션 불러온다.

## 현재 활성 계약 (2026-09-06)

- UI 프레임워크는 **uGUI 전용**이다. Design.md 2026-09-06 개정. 기존 UI Toolkit 코드(UXML/USS/UIDocument)는 #59 마이그레이션 착수 전까지 계약 위반 상태로 취급하고, 그 위에 새 UI Toolkit 코드를 쓰지 않는다.
- 사람 캐릭터 placeholder 3역할은 폐기됐다(#58). TOS식 SD 방향(3D 바디 + 2D 도트 헤드, 눈 강조, 2.5등신)만 따르며, BOM `look.owner_verdict: accepted` 없이 아트를 승격하지 않는다.
- 구현 착수 전에 `.omo/plans/ui-ugui-and-character-rebuild.md`와 대응 이슈(#59·#58)의 품질 게이트웨이를 확인한다. 게이트는 docs/game-logic 이전의 Intent.md에서 잠겨 있으며 완화 금지.

## 검증

- 위키·아키텍처 문서 계약: `npm --prefix tools test`
- 아트 BOM 계약: `node --test tools/art/test-asset-manifest.mjs tools/art/test-poc-ui-kit.mjs tools/art/test-character-poc.mjs`
- 아키텍처 게이트: `node tools/architecture/check-unity-architecture.mjs`
- 위키 공개 금지 용어(Kenshi·Underrail·Gunner·clone·복제)는 문서 작성 시 `rg`로 선검사한다.
