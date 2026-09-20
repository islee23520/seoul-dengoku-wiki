# 캐릭터 메쉬 공정 보완 조사

조사일: 2026-09-19. 구현 상태와 추가 권고를 구분한다. 이 문서는 승인·통과 판정이 아니다.

## 현재 도구에서 확인한 누락

- `TOOL/tools/character-tool/blender_common.py:73`의 `meshes()`는 정점이 없는 오브젝트를 검사 대상에서 제외한다. 따라서 다른 정상 메쉬가 있으면 빈 메쉬가 묵인될 수 있다. 면이 없는 오브젝트와 loose geometry도 별도 실패 코드가 필요하다.
- 같은 파일 `inspect_scene()`는 bounds, mesh 수, armature, unweighted vertices를 검사하지만 경계, 면 winding, 중복 면, self-intersection, UV overlap, 목 쿼드 접합 품질을 검사하지 않는다.
- `TOOL/tools/art/blender-character-gate.py`는 GLB 경로의 존재만 확인한다. 파일 내용이나 실제 Blender geometry를 읽지 않으므로 메쉬 품질 게이트로 간주할 수 없다.
- `TOOL/skills/character-tool/SKILL.md`가 자연어 -> CLI 연결 지점이다. 별도 LLM 실행기를 추가할 필요는 없으며 검사 계약과 실패 시 라우팅을 여기에 연결한다.

## 이번 베이스 작업에 필요한 게이트

1. 원본 해시/버전, GLB와 FBX 형상 동등성, 실제 import 후 축/단위 검사. 확장자나 원본 서비스의 축 설명만 믿지 않는다.
2. 빈 메쉬, 면 없는 메쉬, loose vertices/edges, 중복 면, zero-area/nonfinite geometry, nonmanifold junction, inconsistent winding, 내부 중복 셸과 교차를 검사한다. 전체 signed volume 양수만으로 국소 뒤집힘을 통과시키지 않는다.
3. 눈 개구부는 명명된 의도적 경계로 유지한다. 입구, 분리된 구강 파츠의 경계도 역할을 명시한다. 모든 boundary를 일괄 fill하면 안 된다.
4. 목·수리 부위는 주변 형태와 흐름을 맞춘 quad patch로 저작한다. 동일한 루프 수, twist, face aspect/distortion, 연속성, 단색 multiview와 edit-wireframe 증거를 함께 검사한다. Quad 비율 하나는 품질 증명이 아니다.
5. SourceUV를 보존하고 AtlasUV의 누락/비유한값/zero-area/겹침/범위/패딩과 checker 왜곡을 검사한다. 변경한 형상의 텍스처는 재투영/베이크 또는 명시적 재저작이 필요하다.
6. shared eye와 oral parts는 이름/역할/개수, 독립 선택, 눈꺼풀 간섭, 각막 투명도, 치아/혀 간섭을 검사한다.
7. 저장 후 새로 열기와 FBX/GLB round-trip: 높이, 축, topology/normal, UV, 재질 슬롯, 외부 텍스처 의존성을 재검사한다. 저장 성공 로그만으로 통과시키지 않는다.
8. 실패한 모델 fixture로 게이트가 실제 거부하는지 증명한다. Blender Python 예외가 exit 0으로 끝나는 경우를 막기 위해 JSON verdict와 종료 코드 둘 다 요구한다.

## 후속 단계에서 필요한 공정

- 리깅/표정 단계: 정점 순서 고정, Basis/shape key 호환, deform bone 정합, weight 합과 영향 본 수, 관절 굽힘/목 회전/눈 깜박임/입 벌림 pose test. 지금 베이스를 리깅 완료로 표시하지 않는다.
- 게임 반입 단계: 임포트 normals와 tangents 전략, glTF ORM->URP 변환, 텍스처 color space, 투명 각막 렌더 경로, 압축 전후 비교, draw call/메쉬/텍스처 예산, LOD 실루엣 비교. 숫자 예산은 프로젝트 결정 없이 만들지 않는다.
- 실제 런타임 승격은 기존 source-bound BOM/권리/사람 리뷰 게이트를 그대로 거친다. Staging 반입과 runtime promotion은 다르다.

## 공식 근거

- Blender Retopology: https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html — voxel/quad remesh는 변형용 최종 topology를 자동으로 보장하지 않는다. 흐름은 직접 저작·검사해야 한다.
- Blender Bridge Edge Loops: https://docs.blender.org/manual/en/latest/modeling/meshes/editing/edge/bridge_edge_loops.html — unequal count 연결도 가능하지만 twist/cuts/interpolation을 별도로 다룬다. 연산 성공이 좋은 접합을 의미하지 않는다.
- Blender Mesh Analysis: https://docs.blender.org/manual/en/latest/modeling/meshes/mesh_analysis.html — surface intersections와 nonplanar distortion을 별도 진단한다.
- Unity 6000.7 Model Importer: https://docs.unity3d.com/6000.7/Documentation/Manual/FBXImporter-Model.html — scale/axis, normals/tangents, UV channels, blend-shape normals, strict data checks, mesh compression/LOD를 별도 설정한다. 기본 게임 출력의 triangulation과 DCC authoring quad master는 구분한다.

로컬 근거: `TOOL/tools/character-tool/README.md`, `TOOL/skills/character-tool/SKILL.md`, `TOOL/tools/art/AGENTS.md`, `TOOL/docs/contracts/art-pipeline/art-pipeline-bootstrap.md` 및 portable 문서. 후자의 Tripo +X 표현은 이번 Blender import 결과(Z-up/-Y)보다 우선하지 않는다.
