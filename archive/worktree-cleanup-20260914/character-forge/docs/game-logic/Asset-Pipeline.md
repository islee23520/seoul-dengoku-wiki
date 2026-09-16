# 에셋이 들어오는 길

![에셋에서 칸에 누가 서 있고 어느 쪽을 보며 어디까지 보이는지 확인하는 기준](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/isometric-grammar.svg?raw=true)

## 처음부터 승인까지

사용 권리를 확인한 입력에서 시작해, 종류에 따라 다른 도구로 만든 뒤 Unity 가져오기와 사람 검수를 거쳐 승인된 에셋이 됩니다. 전술 캐릭터와 4방향 클립은 character-forge 리그 베이크다. 초상·UI·타이틀·키트·타일은 2D 후보 경로, 역사 프롭은 오드랜드 기증 또는 별도 프롭 경로를 탄다. TRELLIS와 sprite-gen은 쓰지 않는다.

## 의도에서 그래프가 만들어지는 방식

에셋 한 건은 별도 파이프라인 스크립트로 시작하지 않습니다. 의도를 넣고 그래프를 컴파일한 뒤, 분기 검사를 통과해야만 다음 단계로 갑니다.

의도 필드:

- `asset_class`: `portrait` · `character_sheet` · `prop` · `tile` · `animation_clip` · `identity_lock` · `ui_concept` · `title_art` · `ui_kit`
- `animation_need`: `none` · `four_dir_clip` · `cinematic_keyframe` · `previs`
- `dcc`: `none` · `character_forge` · `blender` · `maya`
- `generation_backend`: `character_forge` · `none`
- `rights_status`: `allowed` · `blocked` · `unresolved`
- `source`: `generate` · `existing`

전술 캐릭터의 `dcc`는 `character_forge`다. Maya는 시네마틱 키프레임이 필요할 때만 고른다. `trellis_v1`, `comfyui_trellis`, `nanobanana_gemini`, `grok_imagine`, `openai_image`는 더 이상 생성 백엔드가 아니다.

```bash
node tools/art/pipeline-graph.mjs compile --intent tools/art/intents/character-four-dir.json
node tools/art/pipeline-graph.mjs check --graph graph.json --host character_forge=1,blender=0,maya=0,animo=0
node tools/art/pipeline-graph.mjs validate-manifest --manifest manifest.json
```

컴파일은 구조만 만듭니다. 분기 검사가 호스트와 권리, 사람 검수 노드 존재를 닫힌 실패로 판정합니다. `blocked` 또는 `unresolved` 권리는 권리 확인 노드만 남기고 생성을 진행하지 않습니다.

## 기본 캐릭터 시트 경로

전술 캐릭터는 `character_sheet` + `four_dir_clip` + `dcc: character_forge`다.

권리 확인 → character-forge 레시피 → 리그 베이크(idle·walk, 이후 타격) → 로컬 리뷰 시트 → 사람 검수 → BOM 승인

Maya·Animo·TRELLIS·sprite-gen 노드는 이 경로에 없다. Animo는 `animo_not_on_auto_path`로 건너뛴 기록만 남긴다.

초상, UI 콘셉트, 타이틀 아트, UI 키트, 타일은 2D 후보와 보존, 사람 검수까지만 간다. 역사 프롭은 오드랜드 기증 경로를 탄다. TRELLIS로 프롭을 새로 만들지 않는다.

## 생성 도구

전술 캐릭터 생성 도구는 submodule `character-forge`(https://github.com/islee23520/character-forge)다. pilgrimage 중세 리그의 근미래 포크이며, 같은 발 IK와 64px 베이크 카메라를 쓴다. sprite-gen으로 모션을 뽑지 않는다. TRELLIS, ComfyUI, NanoBanana, Grok Imagine, OpenAI ImageGen은 전술 캐릭터·프롭 생성에 쓰지 않는다.

## Blender에서 손보는 것

- 축과 1.5m 타일 기준 스케일 정리
- 중복 정점과 잘못된 노멀 수정
- 게임용 토폴로지와 UV 작성
- 색상, 법선, 거칠기 등 재질 채널 검토
- 캐릭터 리깅 또는 소품 피벗 설정
- LOD와 단순 충돌체 생성
- 4방향 전술 클립과 기본 키프레임

## Maya와 Animo 분기

Animo v10은 Autodesk Maya 2022–2026용 애니메이터 툴셋입니다. Tools Editor와 단축키로 도구를 모으고, 레퍼런스·영상 가져오기, 스페이스 전환, 베이크, 플레이블라스트를 돕습니다. 전술 캐릭터 시트를 만들거나 character-forge를 대체하지 않습니다.

Animo 노드는 아래를 모두 만족할 때만 그래프에 들어갑니다.

- `animation_need`가 `cinematic_keyframe`
- `dcc`가 `maya`
- 에셋이 캐릭터 메시 또는 애니 클립
- 앞 노드에 권리 확인과 Blender 정리·리깅이 있음

이때 순서는 정해져 있습니다. Blender 리깅 다음, Unity 가져오기 전입니다. Animo만 따로 실행하는 경로는 금지이며 분기 검사는 `animo_standalone_forbidden`으로 거절합니다. Maya나 Animo가 호스트에 없으면 `maya_missing` / `animo_missing`으로 닫힌 실패고, 초상·타일·4방향 클립에 Maya를 지정하면 컴파일이 거절됩니다.

Animo는 저장소에 넣지 않습니다. 상용 사용은 업스트림 조건(무료, 재판매 금지, 베타)을 따르고, 설치된 경로만 `ANIMO_ROOT`로 검사합니다.

## Unity에서 확인하는 것

- 가져오기 도구의 정확한 버전과 설정 기록
- 재질과 텍스처 연결 검증
- 실제 크기, 피벗, 충돌체와 LOD 확인
- 고정 아이소메트릭 카메라에서 가독성 캡처

## 기증 에셋: 오드랜드 패이로드 (2026-09-07)

오드랜드 에셋은 생성 경로가 아닙니다. 소유자 자작 프로젝트의 그래픽·SFX·VFX는 **기증 경로**로 들어옵니다. 2026-09-07 소유자가 오드랜드의 모든 그래픽 에셋을 이 프로젝트에서 자유롭게 쓰도록 선언했고, 같은 날 전량 반입을 지시했습니다([Intent](https://github.com/islee23520/seoul-kenshi/blob/main/Intent.md) 결정 4). 실시간 진형·카드 전투는 미리 렌더된 다이아몬드 아이소 타일을 요구하지 않으므로 오드랜드의 3D FBX·재질·애니메이션을 고정 카메라 아래에 그대로 놓고 씁니다.

- **위치**: `Game/Assets/Quarantine/Oddland/` — `/Quarantine/` 경로 표시 때문에 런타임 프로비넌스 감사가 이 트리를 항상 격리 등급으로 분류합니다. 슬롯 승격 없이는 재생 가능한 씨에서 도달할 수 없습니다. 원본의 `Resources` 폴더는 `Res`로 이름을 바꿔 빌드에 자동 포함되지 않게 합니다.
- **범위**: 3D 모델·재질·애니메이션·PSD/PNG 텍스처·아이콘·아틀라스·폰트·SFX(wav/ogg/mp3)·VFX 프리팽·셸이더·후처리 프로필·Spine 스켈레톤 데이터와 spine-unity 런타임. 싼, UI 화면 프리팽, 게임 로직 스크립트, 메타데이터, 서드파티 도구는 가져오지 않습니다.
- **재현**: `node tools/art/import-oddland-donor.mjs`가 외부 볼륨의 오드랜드 체크아웃에서 결정론적으로 복사하고 `docs/assets/bom/donor/oddland-donor-import.json`과 SHA-256 목록을 씁니다. `--verify`가 페이로드를 목록과 대조합니다 — 에디터가 임포트 때 다시 직렬화하는 YAML(.meta·.mat 등)은 업그레이드로 보고만 하고, FBX·PNG·PSD·WAV 같은 바이너리 원본의 불일치만 실패로 판정합니다. 페이로드(약 1.6GB)는 LFS 할당량을 넘어 git에 넣지 않고 매니페스트만 추적합니다.
- **권리**: BOM `rights_status: allowed`, 근거는 2026-09-07 소유자 선언과 기증자 커밋 해시입니다. spine-unity 런타임은 Esoteric Software 런타임 라이선스를 따르며 소유자의 Spine 에디터 라이선스가 전제입니다 — 이것은 그래픽 에셋 권리가 아니라 도구 라이선스입니다.
- **승격**: 기증 페이로드에서 런타임 슬롯으로 올리는 것은 여전히 아래 「에셋마다 남기는 기록」의 BOM·`look.owner_verdict: accepted`·소스 바인딩 영수증을 거칩니다. 기증은 승격이 아닙니다.
- **카탈로그**: `docs/assets/bom/donor/oddland-asset-catalog.json`·`.md`가 비-.meta 7,712개 전량을 kind·family·처분으로 분류한다(미분류 0). `node tools/art/catalog-oddland-donor.mjs`로 재생성, `--check`로 멱등 검증, `--summary`로 요약. 분류는 사용 준비도 판정이 아니며 승격은 아래 승격 절차를 그대로 따른다.

## UI 아트 임포트와 합성

UI 아트는 원본 바이트를 `Texture2D.LoadImage`로 우회하지 않고 `AssetDatabase`가 가져온 텍스처를 씁니다. 임포터의 `maxTextureSize`를 포함한 설정을 존중하며, 그 한도가 실제로 적용됐는지를 검증합니다.

합성은 source-over입니다. 알파 식은 `outA = srcA + dstA * (1 - srcA)`이며, 색은 premultiplied 알파로 섞습니다. `SetPixels`로 목적지를 통째로 덮어쓰지 않습니다. 완전 투명 소스가 목적지에 구멍을 뚫으면 계약 위반입니다.

## 에셋마다 남기는 기록

출시 후보 에셋마다 입력 자료의 권리와 해시, 작업 순서, 시드, 모델과 노드 버전, 원본 출력, Blender 수정, Unity 설정과 사람의 승인 기록을 남깁니다. 필수 필드는 `tools/art/asset-manifest.schema.json`이고 `validate-manifest`가 검사합니다. 그래프 컴파일 결과와 분기 검사 코드도 함께 남깁니다. `blocked` 또는 `unresolved` 값이 하나라도 있으면 프로젝트 에셋으로 받아들이지 않습니다.

생성 전에 에셋마다 `look`을 적습니다. `palette`(색 값), `materials`(거칠기·금속·마감), `references`(근거 문서나 사진 경로)가 비어 있으면 검수·승격을 진행하지 않습니다. 프롬프트만으로 재질을 대신하지 않습니다. 소유자 판정은 `look.owner_verdict`의 `pending` · `accepted` · `rejected`입니다.
