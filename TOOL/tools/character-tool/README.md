# Character Tool

생성형 AI 캐릭터 GLB를 검사·정합·웰딩·리깅·스키닝·쉐이프키 저작한 뒤, 외부 텍스처 FBX와 Unity URP 머티리얼로 반입하는 내부 CLI입니다. Blender Python API와 저장소에 보관한 애드온을 사용합니다. 자연어는 동반 에이전트 스킬이 명령으로 해석합니다. CLI 자체에 LLM이나 임의 문장 실행기는 없습니다.

## 설치

Node 20 이상과 Blender가 필요합니다. Blender 탐색 순서는 `--blender`, `BLENDER_PATH`, PATH, OS 기본 설치 위치입니다. macOS, Windows, Linux 탐색 경로를 제공하며 실제 엔진 검증 환경은 macOS arm64 / Blender 5.2.2 / Unity 6000.7.0a5입니다.

```bash
npm install --global ./TOOL/tools/character-tool
character-tool --json doctor
character-tool setup --addons auto_rig_pro,rig_tools,weight_paint_tools,proxy_picker,voxel_skinning
character-tool --help
```

`setup`은 `TOOL/blender-addons`의 SHA-256 고정 ZIP을 확인하고 현재 Blender의 사용자 애드온 경로에 설치·활성화합니다. `--addon-dir`로 ZIP 폴더를 지정할 수 있습니다. 다른 버전은 덮어쓰지 않습니다. Weight Paint Tools는 GPU가 필요하므로 setup은 별도 GUI Blender에서 실행 후 종료합니다. 기존 Blender 작업 파일을 열거나 저장하지 않습니다. 설치 원본을 공개 패키지에 재배포하지 않습니다.

Voxel/Surface Heat Diffuse의 플랫폼별 실행 파일은 애드온에 포함된 것을 사용합니다. Apple Silicon에서는 동봉 Intel 바이너리를 **기존 Rosetta 2**로 실행합니다. Rosetta가 없거나 해당 OS/CPU 바이너리가 없으면 명확히 실패합니다. 다른 알고리즘으로 몰래 대체하지 않습니다.

## 기본 공정

```bash
character-tool --json inspect --input source.glb
character-tool align --input source.glb --output aligned.blend --height 1.75 --up Z --forward=-Y
character-tool weld --input aligned.blend --output welded.blend --distance 0.0001
character-tool rig --input welded.blend --output rigged.blend --skeleton skeleton.json --engine voxel
character-tool check --input rigged.blend --require-rig
character-tool render --input rigged.blend --output previews --pose-bone UpperArm.L --angle 25
character-tool export --input rigged.blend --output delivery/character.fbx --require-rig
character-tool unity-install --project GAME
character-tool unity-import --input delivery/character.fbx --project GAME \
  --destination Assets/Art/Staging/MyCharacter --receipt delivery/unity-receipt.json
```

`align`의 축은 **Blender로 로드된 씬 기준**입니다. glTF의 Y-up은 Blender 임포터가 이미 Z-up으로 변환합니다. 따라서 보통 기본값 Z-up/-Y-forward를 사용합니다. 키는 미터 단위이며 바닥 Z=0, XY 중심, object transform identity로 정합합니다. 리깅·쉐이프키·미적용 modifier가 있으면 정합을 거부합니다. 저작 순서는 정합 → 웰딩 → 쉐이프키/본 → 스키닝입니다.

임의 생물의 관절 위치를 추측하지 않습니다. `skeleton.json`에 부모가 자식보다 먼저 오도록 명시합니다. 좌표는 정합된 모델의 월드 좌표입니다.

```json
{"name":"CharacterRig","bones":[
  {"name":"Root","head":[0,0,0],"tail":[0,0,1]},
  {"name":"Spine","head":[0,0,1],"tail":[0,0,1.7],"parent":"Root"}
]}
```

`rig`는 `--skeleton` 또는 기존 `--armature` 중 하나를 받습니다. 엔진은 `automatic`(Blender Bone Heat), `voxel`, `surface`, `arp`입니다. Voxel/Surface 옵션은 `--resolution 128 --loops 5 --influences 4`입니다. 모든 정점의 실제 deform bone weight를 검사한 뒤 저장합니다.

## GUI Auto-Rig Pro

```bash
character-tool rig-template --preset human --output reference-rig.blend --gui --screenshot arp.png
character-tool launch --input reference-rig.blend
# 기준 본을 캐릭터에 맞게 정합한 뒤:
character-tool rig --input fitted-character.blend --output bound-character.blend \
  --armature rig --engine arp --gui --screenshot bound.png
```

프리셋은 human/dog/horse/horse_ik_spine/bird/free입니다. 템플릿 생성은 자동 해부학 정합을 의미하지 않습니다. GUI 작업은 별도 Blender 프로세스에서 실제 ARP Append/Match to Rig/Bind 연산자를 사용합니다. `--gui` 작업은 결과 저장·선택적 캡처 후 종료합니다. `launch`는 사용자가 계속 편집할 수 있는 창을 남기며 PID와 로그를 반환합니다. `launch`의 `spawned`는 로딩 완료 판정이 아닙니다.

## 수정·쉐이프키

```bash
character-tool shape-key --input welded.blend --output facial.blend --mesh Body --spec smile.json
character-tool rig-edit --input rigged.blend --output adjusted.blend --armature CharacterRig --spec bones.json
character-tool skin-edit --input adjusted.blend --output weighted.blend --mesh Body --spec weights.json
```

```json
{"name":"Smile","deltas":[{"vertex":20,"offset":[0.01,0,0.02]}]}
```

```json
{"bones":[{"name":"Spine","head":[0,0,1],"tail":[0,0,1.72]}]}
```

```json
{"vertices":[{"index":20,"weights":{"Root":1,"Spine":3}}]}
```

쉐이프키는 Basis 대비 로컬 좌표 delta입니다. 본 수정은 armature 로컬 rest 좌표를 바꾸고 기존 weight를 보존합니다. 수정 후 변형 품질은 별도로 검수해야 합니다. 스킨 수정은 지정 정점의 deform weights를 교체하고 합을 1로 정규화합니다. 전체 스무딩·리타깃·제약·복잡한 표정은 `exec`로 명시적인 bpy 스크립트를 실행할 수 있습니다.

```bash
character-tool exec --input character.blend --script adjust.py --output changed.blend --gui
```

스크립트에는 `request`가 주입됩니다. `result`에 JSON 값을 대입하면 결과로 반환됩니다. `exec`는 샌드박스가 아니며 파일 시스템을 포함한 전체 bpy/Python 권한을 갖는 명시적 실행 명령입니다. 일반 모델 로딩은 자동 스크립트 실행을 비활성화합니다.

## GLB → FBX → Unity PBR

FBX에 텍스처를 숨겨 넣지 않습니다. `character.fbx`, `character.character.json`, `character.textures/`를 **함께** 전달합니다. GLB 원본 이미지도 외부 파일로 보존합니다.

| glTF 입력 | Unity URP 출력 | Unity import |
|---|---|---|
| Base Color + factor | Base Map + Base Color | sRGB |
| Normal | Normal Map + scale | NormalMap, linear |
| ORM R (AO) | Occlusion G | linear |
| ORM B × metallicFactor | MetallicSmoothness R | linear |
| 1 − ORM G × roughnessFactor | MetallicSmoothness A | linear |
| Emission + factor | Emission Map + Color | sRGB |

Occlusion과 Metallic/Roughness가 서로 다른 텍스처여도 각 glTF texture 참조를 따릅니다. 하나의 ORM 파일이라는 이름만 보고 채널을 추측하지 않습니다. 원본 GLB 경로를 `.blend`에 기록하므로 최종 export까지 원본을 유지해야 합니다. PNG/JPEG, UV0, 기본 metallic-roughness를 지원합니다. 지원하지 않는 필수 extension·특수 재질·텍스처 UV 변환은 조용히 손실시키지 않고 실패합니다. 먼저 베이크/트랜스코드한 뒤 반입합니다.

Unity import는 명시적으로 설치한 Editor 전용 hook을 사용합니다. Generic 또는 `--rig-type humanoid`를 선택하며, 유효하지 않은 Avatar는 실패합니다. 실제 mesh/skin bones/weights/blend shapes/높이와 URP 맵 연결을 검사합니다. 대상은 새 `Assets/Art/Staging/<name>` 폴더만 허용합니다. **런타임 승격, 카탈로그 연결, 출처/권리 승인과는 별개**입니다.

## 출력과 실패

```json
{"ok":true,"command":"inspect","data":{"rigValid":true}}
```

```json
{"ok":false,"command":"rig","error":{"code":"RIG_INVALID","message":"Body: 2 unweighted vertices"}}
```

stdout은 JSON이고 엔진 로그는 stderr입니다. 성공은 exit 0, 오류는 exit 2입니다. 모든 저작 출력은 새 경로여야 하며 기존 파일은 덮어쓰지 않습니다. `doctor`는 batch 프로세스에 로드된 애드온과 설치 가능 여부를 구분합니다. GUI 사용자 설정의 활성화 상태와 동일하다고 주장하지 않습니다.

## 검증

```bash
npm --prefix TOOL/tools/character-tool test
node TOOL/tools/character-tool/qa-workflow.mjs /absolute/new/evidence-directory
```

테스트는 실제 Blender를 요구합니다. GUI/Unity/열확산 검증은 해당 설치가 있는 호스트에서 별도로 실행합니다. 애드온 사용자 UI 내부의 modal poll loop를 복제하지 않고, 동봉 솔버 프로토콜을 실행별 임시 디렉터리에서 사용합니다.
