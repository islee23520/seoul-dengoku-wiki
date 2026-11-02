# Portrait 3D Contract

이 계약은 Blender 3D 렌더 공정에만 적용합니다. 2D 초상·전신은 이 문서의 옛 2D 폐기 설명이 아니라 독립된 `2d/CONTRACTS.md`와 단일 `bin/seoul-character.mjs` 생성·수정 도구 계약을 사용합니다.

## 현재 공정

`미리 베이크된 3D 객체 → Blender 로컬 렌더 → PNG 초상화 → PASS`

1. 입력은 실제 메시와 재질을 가진 `.glb`, `.gltf`, `.fbx`, `.blend` 파일입니다. 모델 생성·2D 이미지 생성 API는 호출하지 않습니다.
2. 렌더는 Blender에서 실행합니다. 기본 크기 512×640, 투명 RGBA PNG, 정면 -Y·상단 +Z, yaw와 upper/full 프레이밍을 명시합니다. upper는 지오메트리 상단 절반이며 얼굴 인식이 아닙니다.
3. **실제 렌더가 성공하고 내용이 있는 유효 PNG가 기록되면 PASS입니다.** PNG decode/CRC/크기·출력 해시 확인은 깨지거나 다른 파일을 성공이라 하지 않기 위한 출력 검증입니다. 별도 2D 단계, 수치/예술 승인, 슬롯별 개수는 없습니다.
4. 실패·없는 원본·손상된 PNG는 PASS가 아닙니다. 작업 기록은 원본/PNG SHA-256, 크기, 프레이밍과 출력 경로를 기록합니다. 과거 PASS 문서가 현재 출력을 승인하지 않습니다.
5. 원본 3D 객체는 변경하지 않습니다. 출력 경로는 새 파일이며 덮어쓰기를 거부합니다. GUI/CLI는 같은 렌더와 확인 함수를 사용합니다.

## 폐기된 2D 계약

OpenAI, Gemini, ComfyUI, PNGAL 생성, target image pinning, 23×2 슬롯, 부위 split/reconstruction, hidden-layer 교환, 숫자/예술 게이트 1→2→3→4, 슬롯별 variant 수는 현재 도구의 요구 사항이 아닙니다. 이전 `pin`, `collect`, `gate`, `verify-comfy`, `turntable`, `base-parts`, 2D `convert` 명령은 `RETIRED_2D_PIPELINE`으로 거부합니다. 이들은 구 2D 파이프라인 명령이며, 2D 초상 생성·수정 자체가 폐기된 것은 아닙니다. 현재 생산 문서와 명령 목록은 `SKILL.md` 및 `2d/CONTRACTS.md`를 따릅니다. 3D 렌더 계약 위의 명령·검증 동작은 변경하지 않습니다.

## 소유권

초상 공정과 캐릭터 저작 도구는 portrait-gen 소속입니다. 다른 작업자의 변경을 포함하지 않습니다. 기존 원본 이미지, DB, evidence는 삭제하지 않으며 현재 3D PASS와 혼동하지 않습니다. 초상 PNG 통과와 Unity 게임 런타임의 asset provenance 승격은 별개입니다.
