---
name: character-tool
description: "Use for natural-language Blender character workflows: 블렌더 켜기, 캐릭터 검사·키 정합·웰딩·리깅·스키닝 수정·쉐이프키 저작, GUI Auto-Rig Pro, Voxel/Surface Heat Diffuse, GLB to external-texture FBX and Unity URP PBR import."
---

# Character Tool

자연어 요청을 독립된 CLI 작업으로 나눕니다. `character-tool --help`와 `character-tool --json doctor`로 실제 설치 상태·명령을 먼저 확인합니다. 명령이 없으면 저장소 루트에서 `npm install --global ./TOOL/tools/character-tool`을 실행합니다. 인증·외부 서비스는 필요 없습니다.

애드온이 없으면 `character-tool setup`을 사용합니다. Voxel/Surface가 필요하면 `--addons voxel_skinning`을 추가합니다. ZIP 위치는 `TOOL/blender-addons`, 상세 계약은 `../../tools/character-tool/README.md`입니다. GUI 사용 요청은 `--gui`; 사용자가 직접 계속 편집할 창은 `launch`입니다.

## 요청별 동작

- “블렌더 켜”: `launch --input <blend>`; 반환 PID/로그를 기록합니다. 이미 열린 사용자 씬을 덮어쓰지 않습니다.
- “캐릭터 체크”: `inspect --input <file>`; `--require-rig`로 미가중 정점과 누락 armature를 거부합니다.
- “키 175cm로 정합”: `align --height 1.75`; glTF importer가 이미 축을 변환하므로 로드된 Blender 씬 기준 축을 확인합니다.
- “웰딩”: 정합 다음 `weld --distance <meters>`. 쉐이프키·리깅 전에 실행합니다.
- “리깅”: 인간/동물 프리셋은 `rig-template`, 실제 본 위치는 `rig-edit` 또는 `exec`로 정합한 뒤 `rig`. 임의 캐릭터 관절을 추측해서 완료라 하지 않습니다.
- “ARP GUI”: 실제 `--gui`에서 템플릿/Match to Rig/Bind를 실행하고 screenshot을 봅니다.
- “복셀/서피스 히트맵”: `rig --engine voxel|surface`; OS solver 지원을 먼저 확인합니다. 다른 알고리즘으로 자동 전환하지 않습니다.
- “스키닝 수정”: `skin-edit --spec`에 지정 정점·본 weight를 씁니다. normalize 후 pose render로 변형을 확인합니다.
- “쉐이프키”: `shape-key --spec`으로 Basis 대비 정점 delta를 저작합니다. 복잡한 저작은 `exec --script`로 bpy를 사용합니다.
- “유니티로”: 외부 텍스처 FBX+manifest 패키지 export → `unity-install` → `unity-import`. ORM을 그대로 Unity 슬롯에 넣지 않습니다.

```bash
character-tool align --input source.glb --output aligned.blend --height 1.75
character-tool rig --input aligned.blend --output rigged.blend --skeleton skeleton.json --engine voxel
character-tool export --input rigged.blend --output delivery/character.fbx --require-rig
```

JSON spec 형식은 README를 읽습니다. stdout의 `ok` 및 exit code로 판단하고 로그만 보고 성공이라 하지 않습니다. 쓰기는 항상 새 출력 경로입니다. GUI와 batch 모두 사용자 원본 대신 새 파일을 다룹니다. `exec`는 전체 Python 권한이므로 명시적 저작 목적의 검토된 스크립트만 실행합니다.

Unity에서는 프로젝트의 batchmode 정책을 따르고 동일 프로젝트 Editor를 중복 실행하지 않습니다. `Assets/Art/Staging` 반입은 runtime promotion이 아닙니다. 출처·권리·리뷰 게이트를 우회하거나 사용자 파일/씬을 삭제하지 않습니다. Windows/Linux는 해당 호스트에서 검증하지 않았다면 경로 지원과 실기 검증을 구분해 보고합니다.
