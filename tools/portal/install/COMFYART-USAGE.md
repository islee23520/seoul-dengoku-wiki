# ComfyArt 사용 가이드

이 문서는 이 프로젝트에서 ComfyArt 디자인 캔버스를 **실제로 사용하는 방법**을 다룬다. 설치·재시작·롤백은 [COMFYART.md](COMFYART.md) 운영 문서를 본다.

## 1. 캔버스 열기

두 가지 경로가 있다.

- **포털에서**: tools-portal 작업대의 ComfyUI 연결 패널에 있는 **캔버스 열기** 버튼. local/personal 모드에서 `PORTAL_COMFYUI=true`일 때 표시되며, ComfyUI provider 연결 여부와 무관하게 동작한다. hosted 모드이거나 기능이 꺼져 있으면 숨겨진다.
- **직접 접속**: `http://100.77.98.25:8188/comfyart/` 또는 같은 머신에서 `http://127.0.0.1:8188/comfyart/`.

ComfyUI/ComfyArt에는 별도 로그인이 없다. 포트에 닿는 누구나 작업과 데이터에 접근할 수 있으므로 localhost 또는 제한된 Tailscale 같은 신뢰망에서만 사용한다.

## 2. 첫 이미지 만들기

추가 모델 다운로드 없이 바로 쓸 수 있는 경로는 **Z-Image Turbo**다(`z_image_turbo_bf16` + `qwen_3_4b` + `ae` 3종이 이미 설치되어 있다).

1. 홈에서 **New Project**로 프로젝트를 만든다.
2. 이미지 생성 카드에서 모델 선택기에서 **Z-Image Turbo**를 고른다.
3. 프롬프트를 입력하고(예: `a red apple on a table`) 크기·장수를 정한다.
4. 카드 내부의 **Generate** 버튼을 누른다. 캔버스 우측 상단의 Agent 채팅 Send 버튼(`.ca-gen__send`)이 아니라, 카드에 붙어 있는 활성화된 Generate 버튼이 맞다. 버튼이 툴바에 가려 보이면 카드를 화면 중앙으로 옮긴다.
5. 완료까지 1~3분 걸린다. 실측으로 512×512 1장이 약 124~137초에 완료되었다.

기본값인 Qwen Image 2.1 3종 모델은 아직 내려받지 않았다. 필요하면 [COMFYART.md](COMFYART.md)의 모델 절을 따라 선택 설치한다. 업스케일(4x-UltraSharp), 배경 제거(birefnet)용 가중치 중 일부만 설치되어 있고, 지우개(big-lama)·TTS·3D 등 확장 기능은 대응 커스텀노드가 더 필요하니 [COMFYART.md](COMFYART.md)를 본다.

## 3. 포털 작업대에서 생성하기

포털 자체의 이미지 생성에서 ComfyUI provider를 고를 수 있다(연결·readiness는 `moss-image-sft-*` 계열 워크플로 제공). 이 경로는 원본 시트가 필요하다:

- 등록 인물로 생성하려면 Wiki 식별 검증이 가능해야 한다(Wiki를 사용할 수 없으면 `503 WIKI_UNAVAILABLE`로 거부된다).
- **다른 시트 직접 불러오기**로 원본 detail·token·PNG를 넣어 검증받을 수도 있다. 시트와 핀된 템플릿은 `E:\portal-authority` 기존 구성에서 경로를 제공받는다.

포털 생성 결과는 항상 **draft/HOLD 초안 상태**로 보관되며, 후보 승인·릴리스 승격은 이 가이드의 범위가 아니다. 초상 결과물 정책(`candidate-unreviewed`)은 저장소 규칙을 따른다.

## 4. 결과물과 데이터 위치

- ComfyArt 프로젝트·채팅·스냅샷: ComfyUI 설치의 `user/__comfyart/`(SQLite). **직접 편집·repo 반입 금지.**
- 생성 출력: `output/comfyart/`. 업로드 입력: `input/comfyart/`.
- 완성 이미지를 저장소에 넣을 때는 ART-ASSETS 규칙에 따라 별도 산출물 경로로만 옮긴다.

## 5. 상태 점검

~~~bash
node TOOL/tools-portal/install/comfyart-check.mjs
~~~

버전(0.42.0)·캔버스 응답·ComfyArt 노드 등록·기존 커스텀노드 공존·Z-Image 모델 인식 5개를 검사한다. 문제가 있으면 [COMFYART.md](COMFYART.md)의 재시작 절을 따른다(대기열이 빈 때만).

## 6. 더보기

- 설치·운영·롤백: [COMFYART.md](COMFYART.md)
- LAN 인스턴스 분산·MCP 문서 예시·보안 경계: [COMFYART.md](COMFYART.md) 해당 절
- upstream 문서: 저장소 동봉 `docs-site/guides/`
