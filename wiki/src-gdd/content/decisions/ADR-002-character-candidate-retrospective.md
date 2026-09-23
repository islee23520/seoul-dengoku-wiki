- Status: Accepted
- Date: 2026-09-05
- Supersedes: 없음(신규). docs/game-logic/Character-Art-Direction.md 의 미술 방향과 승격 게이트는 상위 계약으로 유지된다.

## Context

2026-09-05 캐릭터 후보 수리 레인(fix/character-art-quality-candidates)에서 탐사원·의무원·순찰대 3인의 4방향×5동작(276프레임/60클립) 후보를 로컬 조립하고 Unity 검증과 독립 시각 검수를 수행했다.

### 기술적으로 검증된 것

- 로컬 조립기와 행동 회귀 테스트 13개: 96x128/12fps, idle 4 walk 6 attack 6 hit 3 down 4, 2.5±0.08등신 실측, 셀 경계 이탈 0, atlas 셀 알파 0~255 바이트 보존.
- Unity 6000.7.0a5 batchmode: 격리 경로 Assets/Janseon/ArtCandidates/Characters import 279텍스처(원본 RGBA 동일, 576x2560 다운스케일 없음), runtime Art 경로 쓰기 거부.
- 원본 보존: 선행 레인 원본 1,481파일 집합 SHA 작업 전후 동일.
- 독립 검수: 41파일 + 보강 17파일을 SHA 고정해 4축 검수, 실제 읽기 완료 41/41 58/58 41/41 58/58.

### 실패한 것 (원문 판정, 변경 없음)

COMPOSITION FAIL, SPRITE_FIDELITY FAIL, PRODUCT_POLISH FAIL, TYPOGRAPHY PASS(라벨·증거 판독에 한정). 유지된 결함: 정체성 단순화(밀폐 헬멧·중간가르마 bob 손실), 쓰러짐 자세의 직사각형 몸과 분리된 장비, 공격 시 손 분리, N 방향 쓰러짐의 얼굴색 노출, 경직된 걷기·공격. 최종 상태는 FROZEN_REVIEW_COMPLETE_ART_FAIL이며 승격·런타임 연결은 없다.

### 원인 분석

1. 순서 오류: 기본 형상(정체성·핵심 포즈) 수용 전에 전체 276프레임 제작을 확대했다.
2. 대리 지표 오용: 프레임 바이트 유일성, 스칼라 측정, 테스트 GREEN을 시각 품질 증거로 취급했다.
3. 환경 가정: 매니페스트의 URP 패키지를 실제 렌더 파이프라인으로 가정했다. GraphicsSettings 실제 값은 built-in이었다.
4. 수단 한계 인정 지연: 기하 프리미티브 조립으로 원본 일러스트 정체성을 회복할 수 없다는 판단이 두 번의 불합격 후에야 확정됐다.

### 이전 프로젝트에서 확인한 동일 사고

- k-pop-diablo 드리프트 원장(GitHub docs/art/drift-ledger.md, blob 60c96af8): 다방향 입력 결손 시 뒷면에 정면 얼굴 보간, export 보고와 fresh-import 실측 불일치, 테스트 GREEN인데 런타임 에셋 요청 0건, 변환 결과 재적용으로 누적 열화.
- makcha-unity 시각 잠금 계획: 잘못된 catalog 연결, 미사용 재질·폰트·클립, 셰이더만 교체해 albedo 소실.
- diablo 게임플레이 토폴로지: 시뮬레이션 58k LOC 1,568 테스트와 무관하게 host 호출 약 28개 - 구현량과 플레이 가능의 분리.

## Decision

1. 승격 금지 유지. ArtCandidates 에셋은 status draft, rights unknown, 런타임 미연결로만 존재한다. Editor importer는 격리 경로만 허용하고 runtime Art 경로 쓰기를 거부하며 이 계약은 테스트로 고정돼 있다.
2. 파일럿 우선 순서. 다음 아트 제작은 탐사원 1명 8프레임(4방향 idle 4 + 공격 준비/타격 2 + 피격 1 + 쓰러짐 1)이 원본 대비 정체성·장비 부착·소규모 판독성의 실제 화면 수용을 통과한 뒤에만 확장한다. 3인 276프레임/60클립은 축소가 아니라 원래 요구로 유지한다.
3. 도구 가용성 게이트. ComfyUI 서버, 이미지 모델 가중치, Blender-MCP 연결은 실물 확인(실행·리스너·라이선스) 전에 가용하다고 기술하지 않는다. 새 설치는 모델 ID·용량·설치 위치를 명시한 소유자 승인이 필요하다. Tripo는 소유자 사전 허락 없이 호출 금지.
4. 검증 분리. 코드 GREEN, 아트 시각 승인, 권리 확인은 서로 다른 게이트다. 시각 수용은 원본 소스에 바인딩된 전체 집합 리뷰로만 한다.
5. 증거 보존. 검수 요청·원문 판정·캡처는 무변경 보존한다. 실패 결과도 결과로 기록하며 재시도로 덮어쓰지 않는다.

## Consequences

- 본 브랜치는 후보 검증 인프라(assembler, 테스트, Editor importer, PlayMode 캡처)와 draft 후보 에셋을 저장소에 포함한다. 런타임 코드는 이들을 참조하지 않는다.
- 후속 캐릭터 아트 작업은 이 ADR과 docs/game-logic/Character-Art-Direction.md를 따른다. 기존 원본과 FAIL 기록은 교체하지 않는다.
- 대형 증거(원문 JSONL, 렌더 276장, 접촉시트)는 git-ignored .omo/evidence/에 있고, 판정 수치와 해시는 이 문서와 검수 요청으로 추적한다.
