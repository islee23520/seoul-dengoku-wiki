# pilgrimage 코드 분석 — tomjohndesign/pilgrimage (2026-09-07, 클론: /Volumes/gameWorkspace/game-refs/pilgrimage)

## 정체
- RCT2 + AoE2 영감의 **중세 정착지 빌더 웹게임**. Next.js(app router) + TypeScript(lib/game), Vercel 자동 배포(v0.app 부트스트랩). v0.0.87, 기능 PR마다 릴리스(#102 per-pose depth, #104 wildlife, #105 mounted knights, #106 traffic paths). 스프라이트 PNG 3,879장(1.6GB), wav 7.
- 라이선스: **LICENSE 파일 없음 → 기본 전권 보유. 코드·에셋 복제 금지, 기술·절차 참조만.**

## 코드 분석 — 왜 우리 참조가 되는가

### 1. 파라메트릭 리그 → 스프라이트 베이크 (제3의 경로)
- 캐릭터는 AI 이미지가 아니라 **코드 리그**: `personRecipe()` + `createBasePersonRig()`(lib/game/base-person/pose.ts). 비율이 버전 레시피로 고정 — v10: "head 120%, shoulder 100%, neck 65%, legs 90%, foot width 95%...". orthographic 카메라로 셀에 굽고(64×64 패딩 셀, 30~35px 인물, 32색 팔레트, nearest-neighbor), 잉크 엣지는 `inkPersonFrame`.
- **"roughly five-head proportions"** — 열 권 본 그림책 참조 기반. Hunter02(5.0~5.5등신)·FF9(~3.5)·TOS(3~4)에 이은 **5등신 부근의 세 번째 독립 수렴** — 고정 아이소에서 얼굴 판독과 인체감의 시장 검증 지점이 반복 확인된다.
- 보행 규율(WALKING.md): step/stride 정의, 지지 60%·양발 접지 구간, 무릎 8° 유연, **"절대 완성 이미지를 미러링·잡아늘려 프레임 만들지 마라"** — 이미지 조작이 아니라 리그 재포즈.

### 2. 포즈별 뎁스 아틀라스 — 3D 세계와 픽셀 정밀 합성
- `spriteDepthBaker`가 같은 카메라·셀 해상도로 **RG16 뎁스 PNG(view-offset-rg16-v1)**를 컬러 시트와 1:1 생성(R/G=리그 원점 기준 오프셋, B=지오메트리 플래그). 런타임 `applySpriteDepth`가 컬러 UV 그대로 뎁스 샘플 — 프레임·방향·변형이 절대 어긋나지 않음.
- 건물 등 월드 메시는 **실제 3D 메시 + 노멀 뎁스 버퍼**, 스프라이트 주민만 뎁스 아틀라스로 합성 — **하이브리드 월드 + 2D 주민** 구조(우리 '3D 메시 바디+2D 도트 헤드'와 같은 방향의 성숙판). PR #102 "per-pose sprite depth"가 그 증명.

### 3. 인구·직업 변형 시스템
- 하나의 base person 리그에서 **calling(직업)색 의상 + 남녀 6체형 프로필**을 같은 셀 크기로 — 직업=의상+프로필 파라미터(태합식 직업 시스템, 16국 캐스트 다양화의 실증 해법). 동질화 문제를 리그 파라미터로 푼다.
- 검증: `npm run assets:check-population` 등 **아트 기계 게이트** + /assets/characters 플레이그라운드(8방향 검수·프레임 스텝·네이티브 크기) — 우리 뷰어·캡처 게이트와 동일 철학.

### 4. 게임 본체
- lib/game: sim/balance/motion 테스트 주도, transport(수레·당나귀·말·운전자 레이어·길찾기), knights, monk-routine, admission-audio. 타일 배치 검증("12타 이내, 막히면 빨간 프리뷰"), 자원 소비, minimap.
- 렌더는 DOM/캔버스 하이브리드(PixelCanvas, bake.ts는 캔버스로 굽고 저장).

## seoul-kenshi 적용 판정
- **A′(4.5~5.5등신 툰) 방향과 직교하는 제3 옵션이 실증됐다**: 3D 메시 월드 + 리그 베이크 2D 스프라이트 주민 + 뎁스 아틀라스 합성. 장점 — 프레임 비용 0에 수렴(베이크), 방향·포즈 변형 완전 자유, 뎁스 합성으로 '2D인데 3D 세계에 안 붙는' 문제 해소, 아트 기계 게이트와 절차 문서화가 우리 저장소 규율과 동일. 단점 — 3D 라이트닝/장비 메시 변형의 즉시성은 포기(리그 수정→재베이크), 폰트로서의 확대 표정은 셀 해상도 한계.
- 권리: 라이선스 없음 — **기술·절차·형식(RG16 뎁스, 리그 레시피, 8방향 시트 구조) 참조만 가능**, 코드·PNG 복제 불가. 우리 구현은 자체 리그로 작성.
- 관련 기존 결론과의 관계: Hunter02(3D 리그)·VRM(3D MToon)·pilgrimage(2D 리그 베이크) — 세 경로 모두 '리그 1개 + 변형 파라미터'로 수렴. 아트 방향 결정(A′)에서 3D 툰 vs 2D 베이크 비교 후보로 pilgrimage 방식을 정식 추가할 가치.
