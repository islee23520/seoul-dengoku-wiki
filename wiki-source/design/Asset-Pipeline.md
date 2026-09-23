# 에셋이 들어오는 길

## 처음부터 승인까지

사용 권리를 확인한 입력에서 시작해 2D 생성, TRELLIS 출력, 원본 보존, Blender 정리, Unity 가져오기, 사람의 검수를 거쳐 승인된 에셋이 됩니다. 이 순서는 기본 경로입니다. 초상, UI 콘셉트, 타이틀 아트, UI 키트, 프롭, 시네마틱은 같은 그래프에서 의도에 따라 노드가 켜지거나 건너뛰어집니다. 2026-09-19 목표 인물 그림은 애니메이션풍 정비율이다. 질문 만료 뒤 채택한 설계 기본값의 전투 시점은 3D 자유 지휘다.

## 의도에서 그래프가 만들어지는 방식

에셋 한 건은 별도 파이프라인 스크립트로 시작하지 않습니다. 의도를 넣고 그래프를 컴파일한 뒤, 분기 검사를 통과해야만 다음 단계로 갑니다.

의도 필드:

- `asset_class`: `portrait` · `character_mesh` · `prop` · `tile` · `animation_clip` · `identity_lock` · `ui_concept` · `title_art` · `ui_kit`
- `animation_need`: `none` · `four_dir_clip` · `cinematic_keyframe` · `previs`
- `dcc`: `auto` · `blender` · `maya`
- `generation_backend`: `nanobanana_gemini` · `grok_imagine` · `openai_image` · `trellis_v1` · `comfyui_trellis` · `none`
- `rights_status`: `allowed` · `blocked` · `unresolved`
- `source`: `generate` · `existing`

`dcc: auto`는 Blender입니다. Maya는 시네마틱 키프레임 연마가 필요할 때만 고릅니다.

```bash
node tools/art/pipeline-graph.mjs compile --intent tools/art/intents/character-four-dir.json
node tools/art/pipeline-graph.mjs check --graph graph.json --host blender=1,trellis=1,maya=0,animo=0
node tools/art/pipeline-graph.mjs validate-manifest --manifest manifest.json
```

컴파일은 구조만 만듭니다. 분기 검사가 호스트와 권리, 사람 검수 노드 존재를 닫힌 실패로 판정합니다. `blocked` 또는 `unresolved` 권리는 권리 확인 노드만 남기고 생성을 진행하지 않습니다.

## 기본 캐릭터 메시 경로

`character_mesh` + `four_dir_clip` + `dcc: auto`는 다음 순서입니다.

권리 확인 → 2D 생성 → TRELLIS → 원본 보존 → Blender 정리 → 리깅 → FBX 보내기 → Unity 가져오기 → 사람 검수 → BOM 승인

이 경로에는 Maya나 Animo 노드가 없습니다. Animo는 `animo_not_on_auto_path`로 건너뛴 기록만 남깁니다.

초상, UI 콘셉트, 타이틀 아트, UI 키트, 타일은 2D 생성과 보존, 사람 검수까지만 갑니다. 프롭은 TRELLIS와 Blender 정리까지 가되 애니 노드는 켜지 않습니다.

## 2D 백엔드와 TRELLIS

2D 생성 백엔드는 `nanobanana_gemini`, `grok_imagine`, `openai_image` 세 종류다. 노드 메타데이터로 각각 구분해 남깁니다. 3D 생성 출력은 `trellis_v1`이며 노드는 `tool: trellis`, `model: microsoft/TRELLIS-image-large`입니다. 직접 Python 경로를 ComfyUI로 표기하지 않으며, `comfyui_trellis`는 기존 의도가 커뮤니티 실행을 요구할 때만 남깁니다.

ComfyUI를 쓸 때는 모델, 노드, Python, Torch, CUDA와 외부 휠 버전을 고정합니다. 기본 제공 노드를 우선 사용하며 외부 노드는 필요한 기능이 확인된 경우에만 저장소, 커밋, 라이선스와 배포 파일 해시를 검토합니다.

## Blender에서 손보는 것

- 축과 1.5m 타일 기준 스케일 정리
- 중복 정점과 잘못된 노멀 수정
- 게임용 토폴로지와 UV 작성
- 색상, 법선, 거칠기 등 재질 채널 검토
- 캐릭터 리깅 또는 소품 피벗 설정
- LOD와 단순 충돌체 생성

## Maya와 Animo 분기

Animo v10은 Autodesk Maya 2022–2026용 애니메이터 툴셋입니다. Tools Editor와 단축키로 도구를 모으고, 레퍼런스·영상 가져오기, 스페이스 전환, 베이크, 플레이블라스트를 돕습니다. 메시를 만들거나 TRELLIS를 대체하지 않습니다.

Animo 노드는 아래를 모두 만족할 때만 그래프에 들어갑니다.

- `animation_need`가 `cinematic_keyframe`
- `dcc`가 `maya`
- 에셋이 캐릭터 메시 또는 애니 클립
- 앞 노드에 권리 확인과 Blender 정리·리깅이 있음

이때 순서는 정해져 있습니다. Blender 리깅 다음, Unity 가져오기 전입니다. Animo만 따로 실행하는 경로는 금지이며 분기 검사는 `animo_standalone_forbidden`으로 거절합니다. Maya나 Animo가 호스트에 없으면 `maya_missing` / `animo_missing`으로 닫힌 실패고, 초상에 Maya를 지정하면 컴파일이 거절됩니다.

Animo는 저장소에 넣지 않습니다. 상용 사용은 업스트림 조건(무료, 재판매 금지, 베타)을 따르고, 설치된 경로만 `ANIMO_ROOT`로 검사합니다.

## Unity에서 확인하는 것

- 가져오기 도구의 정확한 버전과 설정 기록
- 재질과 텍스처 연결 검증
- 실제 크기, 피벗, 충돌체와 LOD 확인
- 실제 화면 비율에서 가독성 캡처(전략막 팬·줌. 전투 화면의 설계 기본값은 팬·오빗·줌의 3D 자유 지휘 시점이다. 각도·FOV 수치는 없다)

## 기증 에셋: 오드랜드 패이로드 (2026-09-07)

오드랜드 에셋은 생성 경로가 아닙니다. 소유자 자작 프로젝트의 그래픽·SFX·VFX는 **기증 경로**로 들어옵니다. 2026-09-07 소유자가 오드랜드의 모든 그래픽 에셋을 이 프로젝트에서 자유롭게 쓰도록 선언했고, 같은 날 전량 반입을 지시했습니다([Intent](https://github.com/islee23520/seoul-kenshi/blob/main/Intent.md) 결정 4·10). 오드랜드의 3D FBX·재질·애니메이션은 **원본 바이트 as-is**로 쓴다(2026-09-18 결정 10 리타깃·SD 변환 금지). 전략 화면은 3D 하이트맵 전역막이다. 2026-09-19 설계 기본값의 전투 시점은 팬·오빗·줌의 3D 자유 지휘이며, 소유자 명시 결정이 아니다. 목표 인물 그림은 애니메이션풍 정비율이고, 오드랜드 원본 바이트를 보존한다. 이 인도는 문서로만 고치고 오드랜드 바이트를 옮기지 않는다.

- **위치**: `GAME/Assets/Quarantine/Oddland/` — `/Quarantine/` 경로 표시 때문에 런타임 프로비넌스 감사가 이 트리를 항상 격리 등급으로 분류합니다. 슬롯 승격 없이는 재생 가능한 씨에서 도달할 수 없습니다. 원본의 `Resources` 폴더는 `Res`로 이름을 바꿔 빌드에 자동 포함되지 않게 합니다.
- **범위**: 3D 모델·재질·애니메이션·PSD/PNG 텍스처·아이콘·아틀라스·폰트·SFX(wav/ogg/mp3)·VFX 프리팽·셸이더·후처리 프로필·Spine 스켈레톤 데이터와 spine-unity 런타임. 싼, UI 화면 프리팽, 게임 로직 스크립트, 메타데이터, 서드파티 도구는 가져오지 않습니다.
- **재현**: `node TOOL/tools/art/import-oddland-donor.mjs`가 외부 볼륨의 오드랜드 체크아웃에서 `GAME/Assets/Quarantine/Oddland/`로 결정론적으로 복사합니다. 폐기된 옛 참조 자산 트리와 BOM 카탈로그는 승격 증거로 쓰지 않습니다. 실물 검증은 Unity 임포트 결과와 소유자 승인 기록에서 다시 만듭니다.
- **권리**: BOM `rights_status: allowed`, 근거는 2026-09-07 소유자 선언과 기증자 커밋 해시입니다. spine-unity 런타임은 Esoteric Software 런타임 라이선스를 따르며 소유자의 Spine 에디터 라이선스가 전제입니다 — 이것은 그래픽 에셋 권리가 아니라 도구 라이선스입니다.
- **승격**: 기증 페이로드에서 런타임 슬롯으로 올리는 것은 여전히 아래 「에셋마다 남기는 기록」의 BOM·`look.owner_verdict: accepted`·소스 바인딩 영수증을 거칩니다. 기증은 승격이 아닙니다.
- **카탈로그**: 옛 7,712개 BOM 카탈로그는 폐기됐다. 필요 자산은 `GAME/Assets/Quarantine/Oddland/` 실물을 기준으로 새 검수 기록을 작성하며, 과거 처분값을 승계하지 않습니다.

## UI 아트 임포트와 합성

UI 아트는 원본 바이트를 `Texture2D.LoadImage`로 우회하지 않고 `AssetDatabase`가 가져온 텍스처를 씁니다. 임포터의 `maxTextureSize`를 포함한 설정을 존중하며, 그 한도가 실제로 적용됐는지를 검증합니다.

합성은 source-over입니다. 알파 식은 `outA = srcA + dstA * (1 - srcA)`이며, 색은 premultiplied 알파로 섞습니다. `SetPixels`로 목적지를 통째로 덮어쓰지 않습니다. 완전 투명 소스가 목적지에 구멍을 뚫으면 계약 위반입니다.

## 에셋마다 남기는 기록

출시 후보 에셋마다 입력 자료의 권리와 해시, 작업 순서, 시드, 모델과 노드 버전, 원본 출력, Blender 수정, Unity 설정과 사람의 승인 기록을 남깁니다. 필수 필드는 `tools/art/asset-manifest.schema.json`이고 `validate-manifest`가 검사합니다. 그래프 컴파일 결과와 분기 검사 코드도 함께 남깁니다. `blocked` 또는 `unresolved` 값이 하나라도 있으면 프로젝트 에셋으로 받아들이지 않습니다.

생성 전에 에셋마다 `look`을 적습니다. `palette`(색 값), `materials`(거칠기·금속·마감), `references`(근거 문서나 사진 경로)가 비어 있으면 검수·승격을 진행하지 않습니다. 프롬프트만으로 재질을 대신하지 않습니다. 소유자 판정은 `look.owner_verdict`의 `pending` · `accepted` · `rejected`입니다.
