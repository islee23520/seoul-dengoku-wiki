# 캐릭터 조립 2차 라운드 실행 설계

이 문서는 실행 제안이며 최종 검사 의미와 명령 인터페이스는 [CONTRACT.md](../CONTRACT.md)를 따른다. 부모 검토에서 인접면 겹침 면제, 불필요한 제3 family 강제, 문서 부재를 RED로 부르는 오류를 제거했다. 아래 내부 `pipeline/`·`gate/` 분리는 모듈 소유 경계이며 공개 실행 진입점은 계약의 `scripts/` 경로다.

## 0. 판정과 완료 정의

2차 라운드는 1차 산물을 개선하는 작업이 아니라, 실패한 공정과 판정기를 교체해 생산 가능한 절차를 입증하는 작업이다. 1차는 전체 실패로 기록한다. 예외적으로 남성의 눈·입이 비어 있는 베이스 형상만 소유자 지도, 소유자 스컬프, 실제 전후 대응 데이터에 의해 개선되었으나, 최종 UV·구강·안구·재현성·독립 게이트는 승인되지 않았다. 여성 자율 조립과 애니메풍 셰이더는 완전 실패다.

완료는 다음 조건의 교집합이다.

1. 남녀 각각 `underwear`, `smooth-doll`, `anatomical-adult` 3종, 총 6개 베이스가 별도 `.blend`와 FBX+외부 맵으로 존재한다.
2. 각 성별 베이스에는 해당 성별의 상부 잇몸+치아, 하부 잇몸+치아, 입안, 혀가 별도 오브젝트로 피팅되고, 공용 눈 마스터에서 복제한 좌우 안구가 실제 소켓에 피팅된다.
3. 형상, 비율, 접합, UV, 텍스처, 파츠 배치, 셰이더, 재열기, 재임포트의 hard gate가 모두 통과한다. hard gate 실패를 점수로 상쇄하지 않는다.
4. 생산 파이프라인을 작성하지 않은 독립 검증 경로가 정상 fixture를 승인하고 알려진 불량 및 주입 불량을 올바른 이유로 거부한다.
5. 생산 여섯 모델과 좌표·토폴로지·UV 지문이 다른 사전 봉인 holdout에서 같은 절차가 입력별 좌표 땜질 없이 재현된다.
6. 정면·좌우 측면·후면·좌우 사선·구강 절개·UV 체커·조명 방향 변화 렌더를 사람이 직접 비교해 형상과 애니메풍 재질을 승인한다. 파일 수, 노드 수, 리포트의 `ok`, 프로세스 exit 0만으로 완료하지 않는다.

리깅, 애니메이션, Unity 런타임 승격은 범위 밖이다. 이미 머리와 몸이 합쳐진 새 생성물로 접합 과제를 대체하지 않는다.

## 1. 소유권과 불변 경계

| 영역 | 소유 위치 | 변경 규칙 |
|---|---|---|
| 재사용 CLI, Blender 실행·검사·정렬·export 기반 기능 | `/Users/danny/workspace/seoul-kenshi/TOOL/portrait-gen/tools/character-tool` | 구현은 portrait-gen에서만 한다. 공유 checkout은 읽기 전용이며 작업 브랜치를 바꾸지 않는다. 검증된 기능만 별도 portrait-gen 변경으로 반영한다. |
| 이번 조립의 manifest, recipe, Blender 저작 스크립트, 독립 gate, 테스트, 증거 | `GAME-REFERENCE/character-assembly-poc/round2/` | round2 worktree에서 새 파일로 작성한다. 1차 파일을 고치거나 덮어쓰지 않는다. |
| 1차 정본 아카이브 | `GAME-REFERENCE/character-assembly-poc/2026-09-19/` | 모델·스크립트·JSON은 읽기 전용이다. README/과거 최종 보고에 소유자 실패 판정의 정정 표식을 추가하되, 과거 본문과 증거는 보존한다. |
| 외부 원본과 소유자 작업 상태 | `/Users/danny/Documents/Character-Assembly-POC/2026-09-19/` 및 원래 Downloads 파일 | 읽기 전용이다. 해시와 provenance만 기록하며 사용자 Blender 창·씬을 변경하지 않는다. |
| 최종 모델 | `round2/deliverables/` | 입력과 다른 새 경로에만 저장한다. `.blend`, `.fbx`, 외부 텍스처, manifest를 한 묶음으로 전달한다. |

생산 코드와 검증 코드는 같은 기하 구현을 import하지 않는다. 공유할 수 있는 것은 JSON schema, 단위 이름, 오류 코드뿐이다. 생산 쪽은 `bpy`/`bmesh`로 수리하고, 독립 검증 쪽은 저장된 `.blend`를 새 Blender 프로세스에서 열어 evaluated mesh와 `loop_triangles`를 추출한 뒤 별도 Python 수치 검사기로 판정한다. 생산이 생성한 통계 JSON은 검증기의 입력이 아니라 대조 자료다.

## 2. 데이터와 랜드마크 provenance

모든 입력은 `round2/inputs/source-lock.json`에 다음을 기록한 뒤 잠근다.

- 절대 원본 경로, 보존 복사본 경로, 파일 SHA-256, byte size, format, import 옵션.
- mesh별 object/data 이름, 좌표 SHA-256, topology SHA-256, UV SHA-256, 재질·이미지 SHA-256.
- Blender로 import된 축과 단위, 바닥, front를 실측한 정규화 행렬. 목표 계약은 meters, Z-up, -Y-forward, 바닥 Z=0, XY 중심, object transform identity다.
- 얼굴/몸/구강/눈의 source asset ID와 파생 계보. 각 파생물은 부모 지문, recipe version, Blender version, 명령, output 지문을 기록한다.
- 랜드마크는 정점 번호만 저장하지 않는다. `semantic_id`, source object, source face+삼각형 barycentric coordinate, world coordinate, local surface normal, confidence, 작성자(`owner`, `measured`, `derived`), 근거 이미지/보고서 해시를 저장한다. 재토폴로지 뒤에는 barycentric projection으로 옮기고 거리·normal-angle 오차를 기록한다.

소유자 스컬프와 지도된 남성 전후 대응 데이터는 `owner` provenance로 보존하며 학습/측정 자료이지 자동 승인 기준이 아니다. 1차의 왼쪽 donor 성공은 일반적인 왼쪽 우선 규칙이 아니다. 여성 및 holdout에서는 양측을 같은 지표로 먼저 측정하고, 한쪽만 hard gate를 통과할 때만 donor를 선택한다. 양쪽이 모두 불량이면 대칭 복제 전에 수리한다.

## 3. fixture 분류와 독립성

### 3.1 고정 fixture

- `healthy-reference`: 기하학적으로 답을 아는 최소 quad transition, 닫힌 구, 의도된 경계가 있는 구강 fixture를 별도 생성 절차로 고정한다. 생산/검증의 결론을 복사해 정답으로 쓰지 않는다. 실제 `.blend`로도 저장·재열기해 양성 대조군을 확인한다.
- `damaged-round1`: 여성 실패 조립, 남성/여성 1차 UV, 미피팅 눈, 구강 교차·접촉, fan-triangulation 오류를 1차 아카이브에서 복사 없이 직접 참조한다.
- `mutation-fixtures`: 정상 fixture 복사본에 각각 NaN, 빈 mesh, 퇴화 face, 중복 surface, 뒤집힌 winding, 비의도 boundary, seam split, UV 없음, 동일 face pair, 인접 face 접촉, 양의 면적 UV overlap, one-face-per-island, texel-density outlier, 잘못된 축/키, head/body 비율 취소, 구강 외부 배치, 눈 소켓 관통, 재질/텍스처 누락을 한 종류씩 주입한다.
- `production-inputs`: 여섯 산물 제작에 사용되는 머리·몸·구강·눈 source다.
- `holdout`: production manifest가 작성되기 전에 지문을 봉인하고 구현자가 최종 산출물을 보기 전까지 assembly recipe의 파라미터 튜닝에 사용하지 않는 다른 실제 mesh다.

### 3.2 독립 holdout 조건

추가 body 파일 8개는 두 geometry/UV family뿐이므로 파일명이 달라도 독립 사례가 아니다. `additional-body-fingerprints.json`의 `8–10`은 family A, `11–15`는 family B로 취급한다. 같은 family의 GLB/FBX, 다른 texture, 재export는 holdout이 아니다.

holdout은 다음 모두를 만족해야 한다.

1. production의 단순 복사/변환/재export가 아닌 별도 실제 geometry다. coordinate/topology/UV 지문을 모두 기록하되, 공유 topology나 UV가 있다는 이유만으로 다른 실측 표면을 동일 입력으로 판정하지 않는다.
2. vertex/face count만 다른 것이 아니라 canonicalized edge-degree histogram과 surface sample distance로도 동일 mesh/re-export가 아님을 확인한다.
3. production의 튜닝에 쓰지 않은 실제 원본 geometry다. family A와 B가 실제 다른 형상이며 B를 생산·튜닝에 쓰지 않았다면 B는 holdout 후보가 될 수 있다. 두 family를 모두 생산에 썼다면 제3 geometry가 필요하다. geometry가 달라도 texture/UV 일부를 공유할 수 있으므로 UV 지문 차이만으로 독립성을 정하지 않는다.
4. 머리와 몸이 분리되어 있어 접합 공정을 실제로 수행한다.
5. holdout의 baseline RED와 봉인 지문을 구현 전에 `evidence/holdout-lock.json`에 기록한다.

독립 geometry를 확보하지 못하면 재현성은 `UNPROVEN_NO_INDEPENDENT_HOLDOUT`으로 남으며 전체 완료를 선언하지 않는다. 이것은 증거 상태이며 목표 도구의 blocked 상태를 자동 의미하지 않는다. 가능한 원본 조사를 계속한다. 같은 family의 다른 파일을 holdout이라고 부르지 않는다.

## 4. 여섯 세트의 source/body 결정

산물 종류는 형상 family와 의상/해부학 variant를 혼동하지 않는다. 속옷은 몸 표면 위 별도 garment object이며, smooth와 anatomical은 같은 mesh를 재질만 바꾼 것이 아니라 실제 골반/흉부 surface가 다른 variant다.

| 산물 | 머리 기준 | 몸 기준 | variant 제작 원칙 |
|---|---|---|---|
| `male-underwear` | 소유자가 지도한 남성 head와 승인 전후 대응 데이터 | 남성 생산 body family | 먼저 검증된 smooth base를 만들고, 비파괴적 별도 속옷 mesh를 피팅한다. 신체를 잘라 속옷으로 숨기지 않는다. |
| `male-smooth-doll` | 동일 남성 identity head | 동일 남성 body source | 비성적 매끈한 인형형 골반 surface를 별도 파생 mesh로 저작한다. |
| `male-anatomical-adult` | 동일 남성 identity head | 동일 남성 body source | 성인 해부학 surface를 별도 파생 mesh로 저작한다. smooth의 texture/normal swap으로 대체하지 않는다. |
| `female-underwear` | 여성 원본 head와 여성 reference sheet | 여성 생산 body family | 여성 비율을 독립 실측한 뒤 별도 garment를 피팅한다. 남성 transform을 복사하지 않는다. |
| `female-smooth-doll` | 동일 여성 identity head | 동일 여성 body source | 여성 smooth surface의 독립 파생 mesh다. |
| `female-anatomical-adult` | 동일 여성 identity head | 동일 여성 body source | 여성 성인 해부학 surface의 독립 파생 mesh다. |

production source의 최종 파일명은 지문 및 baseline gate를 본 뒤 manifest에 고정한다. 현재 `proportion-study.json`의 `source_head`/`source_body` 숫자는 미승인 임시 scene index이므로 정본 선택으로 승격하지 않는다. 1차 여성 script처럼 같은 `head_scale`을 머리와 몸 모두에 곱하지 않는다. 몸은 목표 키로 한 번 정규화하고, 머리는 원본 비율을 유지한 독립 scale/translation 후보를 측정한다. 남성 1.75 m, 여성 1.65 m는 1차 시험값이지 owner-approved production threshold가 아니므로 고정 승인값으로 사용하지 않는다.

각 성별에 네 구강 오브젝트(`UpperGumTeeth`, `LowerGumTeeth`, `InnerMouth`, `Tongue`)를 하나의 성별 master에서 만들고 세 variant에 링크가 아닌 single-user copy로 배치한다. 공용 눈 마스터는 `ScleraIrisPupil.L/R`, `Cornea.L/R`로 복제하며 공막·홍채·동공·각막이 렌더와 export에서 구분되어야 한다. 기존 `shared-eye-master.json`은 지름 0.024 m, -Y front와 재질 구성을 알려 주지만 `fitted_to_characters:false`이므로 참고 source일 뿐 성공 fixture가 아니다.

## 5. 기하와 UV 전략

### 5.1 접합과 형상

1. import 직후 원본을 동결하고 작업 복사본에서 axis/unit/height를 정규화한다.
2. 얼굴과 몸의 목 경계 loop를 곡선 arc length, 정점 간격, tangent, normal, valence로 실측한다.
3. 밀도비가 허용 band 밖이면 고밀도 얼굴 전체 decimate 또는 몸 전체 subdivide를 하지 않는다. 목 주변 제한 영역에만 transition rings를 추가하거나 국소 리토폴로지를 수행한다.
4. 대응 loop를 cyclic alignment한 뒤 quad strip을 만든다. 극점은 목 정면·측면의 변형 핵심 영역을 피하고, 3/5 valence 분산을 기록한다.
5. seam weld 뒤에는 duplicate vertex, non-manifold, winding, self-intersection, geometric-normal discontinuity, silhouette를 다시 측정한다. custom normal은 마지막 shading 보조이며 기하 실패를 숨기는 수리로 인정하지 않는다.
6. 비율은 키 하나로 판정하지 않는다. 발바닥, 정수리, 턱, 눈선, 어깨, 유두선, 배꼽, 샅, 무릎, 손목, 팔꿈치 랜드마크를 기록하고 source reference와 비교한다.

### 5.2 UV

UV 검증기는 Blender evaluated mesh의 `mesh.calc_loop_triangles()` 결과를 face/loop provenance와 함께 추출한다. polygon fan triangulation을 금지한다. 면적 0인 경계 접촉만 제외한다. 같은 polygon 출신이거나 edge/vertex를 공유하는 인접 pair라도 양의 면적 겹침은 자동 면제하지 않는다. 그 면제는 접힌 quad/인접 surface의 UV 결함을 숨긴다. same-face/adjacent/disjoint는 보고용 분류이며 합격 우회 규칙이 아니다. 수치 허용오차의 면적·단위를 사전에 기록한다.

UV는 의미 있는 해부학 seam과 접합 seam을 사용한다. 단순히 overlap 0을 만들기 위한 `one polygon = one island`는 실패다. 다음을 함께 검사한다.

- 필수 파츠 모두 UV layer와 유효한 finite coordinate를 가진다.
- 렌더링에 실제 쓰이는 UV triangle의 양의 면적 교차가 없다. 인접성/face ID로 면제하지 않으며 경계 접촉과 수치 epsilon은 별도로 기록한다.
- island별 face 수 분포, singleton island 비율, seam length/surface area, packing utilization, texel density, stretch, flipped UV triangle을 기록한다.
- body/head/neck transition의 texel density가 영역별 calibrated band 안에 있다.
- 1차 `192/1456`은 fan 기반 역사 수치이며 ground truth나 목표값으로 사용하지 않는다.
- 체커 렌더에서 목, 얼굴, 손, 발, 가슴, 골반, 구강의 격자 크기·방향·늘어짐을 사람이 직접 확인한다.

## 6. 품질 임계값 결정 절차

현재 production-quality 수치 임계값은 소유자 승인값으로 정해지지 않았다. 이를 임의 숫자로 채우지 않는다. 구현 전에 `threshold-calibration.json`을 다음 절차로 만든다.

1. healthy-reference, owner-guided male target, damaged-round1, mutation fixture에서 각 지표 분포를 뽑는다.
2. topology·UV의 명백한 불변식은 절대 hard fail로 둔다: non-finite 0, 빈 mesh 0, 의도되지 않은 wire/degenerate/non-manifold/winding/self-intersection 0, 필수 object/material/UV 누락 0, 양의 면적 비인접 UV overlap 0.
3. 비율, density transition, normal angle, texel density, stretch, shader band는 정상/불량 분포가 분리되는 가장 엄격한 경계 후보를 기록한다. 경계값, 단위, 표본, false accept/false reject를 함께 제시한다.
4. 경계 후보가 분리되지 않으면 자동 승인 지표로 쓰지 않고 수리 또는 human-review 항목으로 남긴다.
5. 소유자가 승인하지 않은 후보는 `measured-provisional` 상태다. 2차 실행은 이 사전 고정 후보로 일관되게 판정할 수 있지만, 문서에서 owner-approved라고 표현하지 않는다.
6. 산출 결과를 본 뒤 기준을 완화하지 않는다. 기준 변경은 새 calibration version과 모든 fixture 재실행이 필요하다.

## 7. 애니메풍 재질 요구사항

1차 `ShaderNodeBsdfToon` 노드와 기본 색 렌더는 목표 셰이더가 아니다. 새 셰이더는 모델별로 실제 바인딩하고 다음 관찰 가능한 동작을 보여야 한다.

- 피부의 주광/그림자 band가 명확하되 목·코·쇄골·팔꿈치에서 얼룩이나 계단 노이즈가 없어야 한다.
- 얼굴의 시선 집중을 위해 피부, 입술, 구강, 치아, 공막, 홍채, 동공, 각막, 속옷이 서로 다른 재질 반응을 가진다.
- 그림자 경계는 key light를 좌/정면/우로 이동할 때 surface normal을 따라 이동한다. 화면에 고정된 마스크나 베이크된 가짜 그림자는 실패다.
- specular는 피부, 눈 각막, 홍채, 입술, 치아에서 역할별로 구분된다. 각막은 투명/굴절 표현과 highlight를 보존하고, 검은 투명 shell이 되지 않는다.
- base-color texture를 조명 없이 emission으로 출력한 truth pass와 shaded pass를 함께 남겨 texture seam과 lighting을 분리해 판단한다.
- outline을 쓰면 silhouette와 선택적 crease에 안정적으로 나타나야 하며 구강·눈 내부에 과도한 선이 생기지 않아야 한다. outline은 필수 스타일 수단이 아니라 비교 후 채택한다.
- 정면, 좌우 측면, 후면, 좌우 사선에서 key light 세 방향과 neutral world로 렌더한다. `material exists`, node count, render exit 0은 판정 기준이 아니다.

셰이더의 production threshold는 calibration wave에서 reference frame과 실패 frame을 나란히 보고 결정한다. 색상·band 폭·specular 크기·outline 두께의 미정 값을 owner-approved로 발명하지 않는다.

## 8. 실행 wave와 disjoint track

| Wave | Track | 입력/출력 소유 | 선행 조건 | 종료 증거 |
|---|---|---|---|---|
| W0 | `provenance` | source-lock, 지문, holdout-lock만 작성 | 없음 | 원본 해시 일치, 생산/holdout family 분리 |
| W1 | `validator-red` | tests, fixtures, RED logs만 작성 | W0 | healthy 포함 전에는 알려진 불량이 현재 gate를 속이거나 새 테스트가 실패하는 RED |
| W2 | `validator-green` | 독립 extractor/gate만 작성 | W1 | 정상 fixture PASS, 각 mutation이 지정 오류로 FAIL, round1 FAIL |
| W3 | `male-base` | 남성 head/body workcopy와 3 variant만 작성 | W2 | 지도 데이터 보존, 세 variant 기하 gate와 다각도 clay QA |
| W4 | `female-base` | 여성 head/body workcopy와 3 variant만 작성 | W2 | 독립 비율 정규화, 세 variant 기하 gate와 다각도 clay QA |
| W5 | `oral-male`, `oral-female`, `eyes` | 성별 oral master와 공용 eye master를 서로 다른 경로에 작성 | W3/W4 base 동결 | 파츠 자체 gate와 소켓/구강 cutaway QA. 남성 다음 여성 counterpart를 같은 wave에서 완료 |
| W6 | `uv-texture-male`, `uv-texture-female` | 성별 UV/texture 작업본 | W5 | native triangulation gate, 체커, emission truth pass |
| W7 | `anime-shader` | shader library와 6개 binding | W6 | light-direction matrix와 multi-angle 비교 PASS |
| W8 | `holdout-reproduction` | 봉인 holdout output만 작성 | W2와 recipe freeze | baseline RED→동일 recipe GREEN, 입력 ID 특례 없음 |
| W9 | `delivery` | deliverables, export, showcase, evidence index | W7/W8 | 새 프로세스 reopen/reimport, 상대경로 texture, GUI 확인, cleanup |

동시에 실행 가능한 것은 파일 소유가 분리된 W3 남성/여성, W5의 남성 구강/여성 구강/눈, W6 남성/여성뿐이다. validator와 production은 병렬 수정하지 않는다. 한 track이 발견한 gate 결함은 validator wave로 돌아가 RED fixture부터 추가한 뒤 전체 정상/불량 matrix를 재실행한다. 동일 `.blend`, manifest, gate 파일을 두 track이 쓰지 않는다.

## 9. literal proof scenario와 RED→GREEN 계약

아래 명령은 worktree 루트에서 실행한다. `<BLENDER>`는 `character-tool --json doctor`가 보고한 Blender 5.2.2 절대 경로를 evidence manifest에 고정한 값이다. 아직 만들지 않은 script 이름은 이 설계가 요구하는 인터페이스다.

### S0 원본과 holdout 독립성

```bash
uv run --with pytest --with numpy pytest GAME-REFERENCE/character-assembly-poc/round2/tests/test_source_lock.py -q
```

- RED: source-lock 또는 holdout-lock이 없거나, 동일 geometry/UV family 복사본을 holdout으로 넣으면 `E_HOLDOUT_NOT_INDEPENDENT`로 실패한다.
- GREEN/PASS: 모든 원본 hash가 일치하고 holdout이 production과 coordinate/topology/UV 및 canonical mesh signature가 다르다.
- artifact: `evidence/source-lock-test.log`, `evidence/holdout-lock.json`.

### S1 독립 gate의 정상/불량 판별

```bash
uv run --with pytest --with numpy pytest GAME-REFERENCE/character-assembly-poc/round2/tests -q
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/extract_blend.py -- --input GAME-REFERENCE/character-assembly-poc/2026-09-19/deliverables/final-integration.blend --output GAME-REFERENCE/character-assembly-poc/round2/evidence/round1-extracted.npz
uv run --with numpy python GAME-REFERENCE/character-assembly-poc/round2/gate/verify_extracted.py --input GAME-REFERENCE/character-assembly-poc/round2/evidence/round1-extracted.npz --manifest GAME-REFERENCE/character-assembly-poc/round2/fixtures/round1.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/round1-rejection.json
```

- RED: 먼저 기존 fan/누락 구현에 테스트를 실행해 실제 삼각분할, 같은 face 또는 인접 face의 양의 면적 겹침, list/dict 누락, 비율/축/구강/눈 fixture의 거짓 판정을 재현한다. 새 문서 부재나 테스트용 빈 stub 실패는 기존 동작의 실패 증거가 아니다.
- GREEN/PASS: healthy fixture만 승인되고 각 mutation은 manifest의 expected error code로 비0 종료한다. round1은 최소 UV/여성 조립/미피팅 파츠/셰이더 이유로 비승인한다.
- independence: extractor는 `.blend`에서 raw arrays만 쓰고 production report를 읽지 않는다. verifier는 `bpy`를 import하지 않고 생산 geometry helper를 import하지 않는다.
- artifact: `evidence/tests-red.log`, `evidence/tests-green.log`, `evidence/mutation-matrix.json`, `evidence/round1-rejection.json`.

### S2 여섯 베이스 제작과 기하 승인

```bash
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/pipeline/build_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/inputs/production.json --output GAME-REFERENCE/character-assembly-poc/round2/deliverables
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/verify_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/acceptance.json
```

- RED: 각 성별 unjoined source와 1차 여성 assembly를 먼저 verify해 seam, proportion, missing-part baseline이 실패하는 로그와 clay renders를 남긴다.
- GREEN/PASS: manifest가 정확히 6개 고유 ID를 가지며 각 모델의 hard failure가 0이고 네 oral object와 좌우 eye pair가 실제 배치되어 있다. smooth/anatomical mesh fingerprint가 다르고 underwear object가 별도다.
- manual QA: 각 수리 뒤 orthographic front/left/right/back 및 perspective left/right quarter를 렌더해 이전 image와 비교한다. 접합, 실루엣, 얼굴 크기, 승모근·쇄골, 손발, 골반을 사람이 승인하기 전 다음 wave로 가지 않는다.
- artifact: `evidence/baseline-{male,female}/`, `evidence/geometry-{model}/`, `evidence/acceptance.json`.

### S3 oral과 eye fitting

```bash
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/render_cutaways.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/cutaways
uv run --with numpy python GAME-REFERENCE/character-assembly-poc/round2/gate/verify_placement.py --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/placement.json
```

- RED: 미피팅 eye master와 1차 oral을 넣어 `E_EYE_NOT_FITTED`, `E_ORAL_INTERSECTION`, `E_REQUIRED_PART_MISSING`을 캡처한다.
- GREEN/PASS: 6개 모델 모두 구강 파츠 사이 unintended penetration이 없고 입술 밖 노출이 없으며, 눈은 소켓 내부 간격과 eyelid clearance의 calibrated band를 만족한다. 눈이 머리 중심에 단순 배치된 상태는 실패한다.
- manual QA: 입을 연 cutaway, 정면 눈 close-up, 좌우 사선 close-up을 실제 렌더로 본다.
- artifact: `evidence/placement-red.log`, `evidence/placement.json`, `evidence/cutaways/`.

### S4 UV와 텍스처

```bash
uv run --with pytest --with numpy pytest GAME-REFERENCE/character-assembly-poc/round2/tests/test_uv_gate.py -q
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/render_uv_review.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/uv-review
```

- RED: fan triangulation, 동일 face pair, one-face islands, UV 누락, 양의 면적 overlap mutation이 각각 올바른 assertion으로 실패한다.
- GREEN/PASS: native loop triangles 기준 양의 면적 겹침/국소 fold/필수 UV 누락이 없고 singleton-island/texel-density/stretch가 사전 calibration band 안이다. island 전체의 일관된 부호 반전은 국소 fold와 구분한다.
- manual QA: 체커와 unlit base-color pass에서 목/얼굴/몸/구강 seam, 격자 크기, 색상 연속성을 확인한다. 수치만 통과하면 승인하지 않는다.
- artifact: `evidence/uv-red.log`, `evidence/uv-green.log`, `evidence/uv-review/`.

### S5 애니메풍 셰이더

```bash
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/render_shader_matrix.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --lights left,front,right --views front,left,right,back,quarter-left,quarter-right --output GAME-REFERENCE/character-assembly-poc/round2/evidence/shader-matrix
```

- RED: 1차 basic Toon BSDF 결과를 동일 matrix로 렌더하고 `FAILED_ROUND1_SHADER` baseline으로 고정한다. 노드가 존재해도 reference behavior를 충족하지 않는 것이 RED다.
- GREEN/PASS: 6개 모델에서 light 이동에 따라 band와 highlight가 표면을 따라 이동하고, 피부/눈/구강/치아/속옷 재질 역할이 구분되며, 모든 view에서 검은 shell·face-fixed shadow·seam·과도한 outline이 없다.
- manual QA: contact sheet를 원본 색상 truth pass와 나란히 보고 사람이 각 모델을 개별 승인한다. 자동 pixel count만으로 PASS하지 않는다.
- artifact: `evidence/shader-round1-red/`, `evidence/shader-matrix/`, `evidence/shader-review.json`의 모델별 human verdict.

### S6 다른 실제 mesh 재현과 반복성

```bash
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/pipeline/build_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/inputs/holdout.json --output GAME-REFERENCE/character-assembly-poc/round2/reproduction/run-a
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/pipeline/build_bundle.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/inputs/holdout.json --output GAME-REFERENCE/character-assembly-poc/round2/reproduction/run-b
uv run --with numpy python GAME-REFERENCE/character-assembly-poc/round2/gate/compare_runs.py --a GAME-REFERENCE/character-assembly-poc/round2/reproduction/run-a/manifest.json --b GAME-REFERENCE/character-assembly-poc/round2/reproduction/run-b/manifest.json --output GAME-REFERENCE/character-assembly-poc/round2/evidence/reproduction.json
```

- RED: 봉인 holdout의 unjoined baseline이 seam/placement gate에 실패한다.
- GREEN/PASS: 같은 recipe가 별도 input ID 분기나 정점 번호/월드 좌표 상수 없이 holdout을 승인하고, 정규화 geometry/UV/material fingerprint가 run-a/run-b에서 일치한다. timestamp와 절대 경로는 fingerprint에서 제외한다.
- adversarial check: production ID 문자열을 바꾸거나 object order를 섞어도 결과가 동일해야 한다. 특정 ID 분기가 발견되면 실패한다.
- artifact: `evidence/holdout-red.json`, `evidence/reproduction.json`, holdout 다각도 렌더.

### S7 export, 재열기, 실제 Blender 표면

```bash
character-tool export --input GAME-REFERENCE/character-assembly-poc/round2/deliverables/showcase.blend --output GAME-REFERENCE/character-assembly-poc/round2/deliverables/export/showcase.fbx
<BLENDER> --background --factory-startup --python-exit-code 1 --python GAME-REFERENCE/character-assembly-poc/round2/gate/reopen_reimport.py -- --manifest GAME-REFERENCE/character-assembly-poc/round2/deliverables/manifest.json --relocate-to "$(mktemp -d)/round2-package" --output GAME-REFERENCE/character-assembly-poc/round2/evidence/reopen-reimport.json
character-tool launch --input GAME-REFERENCE/character-assembly-poc/round2/deliverables/showcase.blend
```

- RED: 텍스처 하나를 mutation package에서 제거하거나 절대 경로로 묶으면 재열기 검사가 `E_EXTERNAL_TEXTURE_MISSING`으로 실패한다.
- GREEN/PASS: 새 Blender 프로세스에서 여섯 `.blend`가 열리고, 재import FBX의 geometry/UV/material slot이 export manifest와 일치하며, 임의 디렉터리로 옮긴 패키지의 누락 외부 맵이 0이다.
- manual QA: `launch`가 반환한 새 PID의 실제 Blender 창에서 여섯 모델, 구강, 눈, shader를 직접 orbit/visibility toggle로 확인한다. 기존 사용자 창과 scene은 불변이어야 한다.
- cleanup: QA용 Blender PID 종료 후 `kill -0 <pid>`가 실패해야 한다. `mktemp` relocation dir를 삭제하고, 남은 QA Blender process와 temp dir가 없음을 receipt에 기록한다. 소유자에게 명시적으로 남기라고 한 표시용 창만 예외다.
- artifact: `evidence/reopen-reimport.json`, GUI action log와 여러 각도 screenshot, `evidence/cleanup.txt`.

## 10. gate 결과 schema와 independently falsifiable 조건

모든 gate JSON은 최소 다음을 갖는다.

```json
{
  "schema_version": 1,
  "verdict": "pass|fail|blocked",
  "input_sha256": "...",
  "extractor_version": "...",
  "threshold_version": "...",
  "checks": [{"id":"UV_OVERLAP","status":"pass|fail","observed":0,"limit":0,"unit":"pairs","evidence":"..."}],
  "hard_failures": [],
  "manual_review_required": [],
  "provenance": {}
}
```

검증기의 신뢰 조건은 다음과 같다.

- 정상 fixture를 최소 하나 통과시키지 못하는 검증기는 사용할 수 없다.
- 각 hard check는 그 결함만 주입한 mutation에서 반드시 실패하고 mutation을 되돌리면 다시 통과해야 한다.
- 오류 부호, exit code, JSON shape를 함께 검사한다. 예외 없이 `ok:false`만 출력하거나 exit 0인 실패는 gate 실패다.
- production 통계와 독립 추출 통계가 다르면 자동 승인하지 않고 `E_ORACLE_DISAGREEMENT`로 중단한다.
- 시각 criterion은 human verdict와 screenshot/contact sheet가 없으면 `blocked`다. 수치나 exit 0이 이를 대신하지 않는다.

## 11. 최종 인도 목록

- 여섯 native `.blend`.
- 여섯 FBX와 모델별 외부 base color, normal, material용 map, character manifest.
- 성별 oral master 두 개와 shared eye master 한 개.
- 여섯 모델을 동시에 비교하는 `showcase.blend`.
- source-lock, production/holdout manifest, threshold calibration, recipe/decision log.
- RED/GREEN test logs, mutation matrix, round1 rejection, six-model acceptance, holdout reproduction, shader matrix, reopen/reimport, GUI action log, cleanup receipt.
- 제한 보고서: measured-provisional threshold, owner 미승인 항목, 한 holdout 사례로 일반화하지 않는 범위, 리깅/Unity 제외.

최종 판정은 `6/6 production PASS + independent holdout PASS + all mutations rejected + manual geometry/UV/shader/GUI PASS + reopen/reimport PASS + cleanup complete`일 때만 가능하다. 하나라도 빠지면 완료가 아니라 해당 오류 코드의 미완료 상태다.
