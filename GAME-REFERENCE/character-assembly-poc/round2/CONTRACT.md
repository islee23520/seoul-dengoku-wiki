# 캐릭터 조립 2차 라운드 실행·승인 계약

상태: 실행 계약 고정, 산물 승인 전. 1차 판정은 [회고](RETROSPECTIVE.md)를 따른다. 애니메풍 셰이더는 1차에서 완전 실패했으며 새로 제작·검증해야 한다.

## 목표와 산물의 범위

남성/여성 각각 `underwear`, `smooth-doll`, `anatomical-adult` 세 종류, 총 여섯 성인 베이스를 만든다. 각 산물은 머리와 몸의 접합, 상부 잇몸·치아, 하부 잇몸·치아, 입안, 혀, 좌우 안구를 갖춘다. 구강 네 파트는 오브젝트로 구분하고 치아의 위/아래 턱 소속을 보존한다. 공용 안구 마스터는 공막·홍채·동공·각막의 재질을 구분하고, 각 성별 소켓의 실제 위치와 형태에 맞춘다.

원본 몸의 일부에 이름만 달거나 단색으로 덮은 것을 세 변형으로 세지 않는다. 속옷, 매끈한 돌베이스, 성인 해부학적 몸의 차이는 실제 저작된 형상·재질·계보와 다각도 표면 증거로 확인한다. 시선/포즈는 비성적 T/A 베이스다. 신체 표면이나 접합 결함을 속옷으로 숨기지 않는다.

각각 `.blend`, FBX와 외부 텍스처·manifest를 전달하고, 여섯 모델을 비교할 `showcase.blend`를 제공한다. Blender용 애니메 셰이더 노드가 FBX에 그대로 보존된다고 주장하지 않는다. FBX의 이식 계약은 형상/UV/파트/재질 할당과 외부 색상·필요 맵이며, 네이티브 애니메 셰이더는 `.blend` 안에서 별도로 재열기 검증한다. 리깅/애니메이션과 Unity 런타임 승격은 범위 밖이다.

## 보존·소유권

- Downloads, 외부 `Character-Assembly-POC`, 소유자 스컬트와 성공 기준, 1차 모델·스크립트·JSON은 읽기 전용이다. 1차 보고에는 철회 정정을 추가하지만 역사적 증거를 덮어쓰지 않는다.
- 현재 작업 브랜치는 `feat/character-assembly-round2`다. 타 세션의 파일·서브모듈 포인터를 수정하거나 커밋하지 않는다.
- 사례 manifest, 저작 recipe, 독립 검증 fixture/증거는 이 디렉터리에 둔다. 재사용 가능한 character-tool 구현·동반 스킬은 `TOOL/portrait-gen` 소유이며 별도 작업 checkout에서 검증한다. 공유 checkout을 강제로 전환하지 않는다.
- 소유자가 지도한 남성 맨 베이스의 형상·텍스처 연결성 개선을 보존한다. 이미 합쳐진 새 생성물로 고밀도 얼굴/저밀도 몸 접합 과제를 우회하지 않는다.

## 판정 의미

기계 검사, 실제 시각 판정, 산물 완성도, 다른 입력 재현성은 별도 상태다. 부분 검사 성공을 전체 `accepted`로 승격하지 않는다.

- `PASS`: 해당 검사의 명시된 범위와 근거가 충족됐다.
- `FAIL`: 실제 결함을 검출했으며 결함/좌표/대상/단위/증거를 기록한다.
- `UNPROVEN`: 입력·기준·실행·증거·시각 확인 중 하나가 부족하다. 0이나 PASS로 변환하지 않는다.
- `ERROR`: 추출·파싱·엔진·파일 등의 실행 실패다. 승인하지 않으며 원래 오류를 보존한다.

번들 승인은 정확한 여섯 산물과 모든 hard gate, 개별 시각 판정, 독립 재현, 재열기/재import가 통과했을 때만 가능하다. 완성 실패와 도구 실행 실패를 구분하고 둘 다 비0 종료로 알린다. 결과 JSON에 `schema_version`, 입력 파일/의미 지문, 도구/엔진 버전, 기준 버전, 검사 ID별 상태·측정값·단위·근거, hard failures, 미판정 항목을 기록한다. 수리 코드가 쓴 `ok`는 독립 검사 입력이 아니다.

## 측정·선택 순서

1. **입력 고정:** 모든 소스의 파일 해시, 실제 geometry/UV/재질 지문, GLB/FBX 대응, 행렬·단위·축을 확인한다. Blender import 후 dependency graph를 갱신하고 월드 좌표로 확인한다.
2. **가역 비례 정합:** 머리와 몸 각각의 표식/경계/스케일을 측정한다. 전체 키 하나로 비율을 승인하지 않는다. 여성은 원본과 성인 정비율 기준에 맞춘 블록아웃을 정면·측면에서 확인한 후 연결한다. 남성의 승인된 얼굴 크기는 보존한다.
3. **구조의 hard fail:** 비유한·빈 mesh·의도하지 않은 경계·미용접·wire·퇴화·중복·비정상 연결·winding·자기 관통·누락·보호영역 손상은 하나라도 있으면 승인하지 않는다. 눈 소켓과 구강 입구는 의미가 지정된 의도적 경계다. 경계 길이 숫자만으로 눈인지 결정하지 않는다.
4. **좌우 비교·라우팅:** 대칭 가능한 입력인지 먼저 판단한다. 양측 동일 부위의 기하 노말/접힘/밀도/면 흐름/보존 편차를 측정하고 통과한 후보끼리 비교한다. 고정 왼쪽/오른쪽 donor는 없다. 양쪽이 불량이면 먼저 국소 수리한다.
5. **국소 접합:** 두 목 경계의 arc length·tangent·normal·spacing·valence를 사용해 대응을 잡는다. 얼굴 디테일을 보존하며 제한된 주변 행에 걸쳐 밀도를 전환한다. 쿼드 비율이나 단일 연결 성분만으로 형상 성공을 주장하지 않는다.
6. **구강·눈:** 해당 head 변환 계보와 입/소켓 표식을 따라 각 파트를 조립한다. 파트가 파일에 로드됐다는 사실, 월드 z 하나, centroid만으로 해부학적 피팅을 승인하지 않는다.
7. **UV·색상·셰이더:** 최종 기하에서 전개하고 UV 변경에 맞춰 색상을 재투영/베이크한다. 실제 표면으로 확인한 뒤 애니메풍 셰이더를 바인딩한다.
8. **저장·독립 재검사:** 새 엔진 프로세스로 최종 파일을 다시 추출한다. 이전 메모리 상태·스크립트의 통계·원본 경로에 기대지 않는다.

## UV 검사와 생산 품질

Blender의 실제 evaluated mesh `loop_triangles`와 대응 loop UV를 검사한다. 임의 fan으로 quad/ngon을 펼쳐 만든 교차를 실제 렌더 결함이라고 세지 않는다. 반대로 같은 polygon이거나 서로 인접하다는 이유만으로 양의 면적 겹침을 면제하지 않는다. shared-edge/point 접촉과 양의 면적 overlap을 알려진 fixture로 구분한다.

UV island 전체가 일관되게 반전된 것과 국소 fold를 구분한다. 부호 하나로 무조건 실패시키거나 같은 face ID를 전부 제외하지 않는다. 좌우 UV는 사용자의 요구대로 별도 공간에 놓고, 비중첩 수치만 맞추려고 모든 면을 작은 독립 island로 나누는 우회는 금지한다.

통과에는 finite/누락/퇴화/양의 면적 overlap 검사 외에도 해부학 seam, island의 연결성, 패딩, packing, 표면별 texel density, stretch 및 checker/원본 색상 근접 렌더가 필요하다. 얼굴·목·쇄골·가슴·골반·손발·구강에서 확인한다. 면적 epsilon은 단위·정밀도와 함께 calibration에 고정하고, 카운트를 줄이려 사후 상향하지 않는다.

## 애니메풍 셰이더의 별도 필수 증거

1차는 완전 실패다. `ShaderNodeBsdfToon` 생성, 재질 이름, 이미지 파일, render exit 0는 이 항목의 성공 증거가 아니다.

- 원본 색상 truth pass와 새 shaded pass를 같은 모델·카메라에서 비교한다. 단색 피부로 텍스처 결함을 지우지 않는다.
- 실제 key light 방향 변경에 따라 명암 경계와 하이라이트가 움직여야 한다. 고정 화면 마스크나 이미 베이크된 그림자를 조명 반응으로 오인하지 않는다.
- 피부/입술/치아/구강/공막/홍채/동공/각막/속옷의 역할이 실제 화면에서 구분돼야 한다. 각막의 검은 shell, 과한 내부 outline, 소켓 틈·관통은 반려한다.
- 얼굴과 목의 가독성, 의도된 명암 단계, 소스 색상 연속성, 각도·조명 변화 안정성을 여섯 모델 각각 직접 본다. 외곽선은 무조건 추가하는 기능이 아니라 채택 여부를 비교할 수단이다.
- 실제 목표 스타일의 구체 기준은 source/reference 비교와 실패 렌더를 통해 사전 기록한다. 특정 상용 게임 수준이라는 주장은 하지 않는다.

## 기준 calibration과 독립성

불량 0 등 명백한 구조 불변식 이외의 비율/왜곡/밀도/노말/스타일 임계값은 근거 없이 숫자를 발명하지 않는다. 소유자 지도 기준, 정상/불량 fixture, 원본 참조를 먼저 측정해 경계·단위·출처·불량 누락/정상 오판을 기록한다. 미승인 실측 기준은 `measured-provisional`로 표시하며 소유자 승인으로 둔갑시키지 않는다. 기준으로 분리할 수 없는 항목은 직접 시각 판정을 남긴다.

생산은 기하를 만들고, 검증은 저장된 파일을 새 프로세스에서 추출한다. 수리용 판단 함수를 검사기가 다시 호출해 자기 자신을 승인하는 구조를 피한다. 알려진 정답 fixture, 실제 손상 산물, 한 결함씩 주입한 mutation으로 거짓 승인과 거짓 반려를 모두 확인한다.

별도 실제 geometry를 생산 튜닝 전에 holdout으로 봉인한다. 추가 파일 8개는 기존 보고상 2 geometry family이므로 이름/형식/색상 차이를 재현성 증거로 세지 않는다. 두 family 모두를 생산에 썼다면 다른 geometry가 필요하다. 동일한 UV layout이나 vertex count만 공유하는 별도 형상은 실제 surface 지문으로 구분한다. 적용 범위는 성공한 입력군으로만 주장한다.

## 실행 표면과 PASS 관측

아래는 작업 루트 `/Users/danny/workspace/seoul-kenshi-character-round2`에서 실행할 공개 검사 인터페이스다. 현재 구현 전 명령은 **예정**이며 실행했다고 주장하지 않는다. 실행 경로가 바뀌면 목표의 같은 시나리오와 이 문서를 함께 연결하고 기준을 줄이지 않는다. `Blender`는 `/Applications/Blender.app/Contents/MacOS/Blender`이다.

| 기준 | 정확한 실행 | 이진 관측과 증거 |
|---|---|---|
| 알려진 불량의 거짓 승인 재현 | `uv run --with pytest --with numpy pytest GAME-REFERENCE/character-assembly-poc/round2/tests/uv_red -q` | 수정 전 실제 래퍼의 오판 때문에 원하는 거부 assertion이 실패. 수정 후 동일 의미 테스트 GREEN 및 원인 복원 mutation RED. 테스트/로그/입력 지문 보존. |
| 게이트 자기시험 | `uv run --with pytest --with numpy pytest GAME-REFERENCE/character-assembly-poc/round2/tests -q` | 정상 PASS, 각 불량/빈/누락/잘못된 schema는 정확한 오류로 FAIL. 누락 행 0. |
| 1차 실패 산물 반려 | `Blender --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/scripts/verify_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/fixtures/round1.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/round1-rejection.json` | 실제 결함과 누락을 진단한 비승인, 비0 종료. 구조 숫자가 적다고 전체 PASS 금지. |
| 여섯 모델 제작 | `Blender --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/scripts/build_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/inputs/production.json --output GAME-REFERENCE/character-assembly-poc/round2/deliverables` | source→candidate→selection→output 계보가 있는 6개 모델. baseline 실패를 먼저 측정하고 후보마다 다각도 비교. |
| 여섯 산물 승인 | `Blender --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/scripts/verify_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/acceptance.json` | 정확히 6/6, 기계 hard failure 0, 시각 미판정 0, 각 파트/재질/texture/external map 확인. |
| 다른 입력 자율 재현 | `Blender --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/scripts/build_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/inputs/holdout.json --output GAME-REFERENCE/character-assembly-poc/round2/reproduction` | 같은 동결 공정으로 baseline RED→GREEN. 입력 ID 특례·수동 좌표 덮어쓰기 없음. 두 실행의 정규화 의미 지문 일치. |
| 셰이더·재질 실제 반응 | `Blender --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/scripts/render_shader_matrix.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --lights left,front,right --views front,left,right,back,quarter-left,quarter-right --output GAME-REFERENCE/character-assembly-poc/round2/evidence/shader-matrix` | 1차 실패 렌더와 새 표면 비교, 여섯 모델 개별 시각 승인 및 native 재열기 일치. |
| GUI 인도 | `character-tool launch --input GAME-REFERENCE/character-assembly-poc/round2/deliverables/showcase.blend` | 새 Blender 창 실제 orbit/파트 표시와 action log·스크린샷. 기존 사용자 씬 불변, 요청된 표시용 창만 유지. |

## 완료가 아닌 것

파일 부재를 기록한 뒤 문서를 생성한 것은 행동 RED→GREEN이 아니다. 외부 서비스 timeout, 검사 불능, 이미지 미확인, 타입 오류, 실행 실패, 독립 holdout 부재를 성공으로 바꾸지 않는다. 1차 보고의 수치·메모리·todo 완료 상태를 가져와 현재 상태로 주장하지 않는다. 실패 원인을 찾은 것과 그 원인을 수리·재현 검증한 것은 다른 단계다.
