@AGENTS.md
@Intent.md

# Claude Code 프로젝트 지시

이 파일은 Claude Code 메모리 규약(docs.anthropic.com/en/docs/claude-code/memory)에 따라 루트에 둔다. 위 임포트로 공통 지식 베이스(AGENTS.md)와 방향 결정 기록(Intent.md)을 매 세션 불러온다.

## 현재 활성 계약 (2026-09-19 갱신)

- UI 프레임워크는 **uGUI 전용**이다. Design.md 2026-09-06 개정. 기존 UI Toolkit 코드(UXML/USS/UIDocument)는 #59 마이그레이션 착수 전까지 계약 위반 상태로 취급하고, 그 위에 새 UI Toolkit 코드를 쓰지 않는다.
- 제품 목표 전투는 토탈워식 부대 지휘다(2026-09-19 결정 11). 영웅 직접 조작과 카드 경제를 목표로 쓰지 않는다. 이번 인도는 문서와 설계 템플릿이며 새 게임을 구현했다고 쓰지 않는다. 목표 카메라는 질문 시간 초과 뒤 채택한 3D 자유 지휘 기본안(팬·오빗·줌)이다. 닫힌 전투에서만 일시정지·재개와 정지 중 미리보기·확인을 둔다. 공유 캠페인과 다른 파티는 멈추지 않는다. 이 두 항목은 소유자 직접 결정이 아니다.
- 목표 인물 표현은 애니메이션풍 정비율이다. POC 사람 표현은 오드랜드 원본 어셋 as-is(2026-09-18 결정 10). TOS식 SD 재작업(#58)은 취소됐고, 리타깃·SD 변환을 금지한다. 런타임 승격은 BOM `look.owner_verdict: accepted` 게이트를 그대로 지난다.
- Unity 구현 착수 전에 [Intent.md](Intent.md) 품질 게이트웨이를 확인한다. 게이트는 완화 금지. 결정 11 문서 개정은 GAME/·C#·오드랜드를 바꾸지 않는다.
- 웹 허브는 자체 호스팅 표면 `https://seoul-dengoku.linalab.io`로 전환한다(2026-09-18). 실행: 윈도우 desktop `E:\git\seoul-dengoku-web` docker(nginx + cloudflared 터널 `seoul-dengoku`) + Cloudflare Access 컨트리뷰터 게이트. Vercel `seoul-kenshi` 프로젝트(`prj_KOgAaJkJZ7j3CrUD1eAzYtiGV5mm`)는 전환 검증 후 제거하며, 그 전까지 어떤 새 Vercel 프로젝트·별칭도 만들지 않는다. 정적 데모는 허브 서브 경로 복합 스테이징 원칙을 그대로 지킨다(`SERVICES.md`). 부대 지휘 설계 템플릿 게시 경로는 `/total-war-ui/`다.

## 검증

- 위키·아키텍처 문서 계약: `npm --prefix TOOL/tools test`
- 아트 BOM 계약: `node --test TOOL/tools/art/test-asset-manifest.mjs TOOL/tools/art/test-poc-ui-kit.mjs`
- 아키텍처 게이트: `node TOOL/tools/architecture/check-unity-architecture.mjs`
- 위키 공개 금지 용어(Kenshi·Underrail·Gunner·clone·복제)는 문서 작성 시 `rg`로 선검사한다.
