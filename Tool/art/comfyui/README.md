# Windows 포트레잇 생성

Mac 작업 원본은 이 `portrait-anime-layer-composite-w1` 워크스페이스에 둡니다. Windows 실행 환경, 모델, 입력과 출력은 모두 **E:**에 둡니다. 기존 `E:\comfyui` 및 `C:\ComfyUI`는 수정하지 않습니다.

## 설치 위치

- PNGAL: `E:\git\linalab\PNGAL`
- 공식 소스: `islee23520/PNGAL`, `7a00caec16e8e9d6734f3ee5264118f44aec157c`
- 설치 옵션: `1` / Low-VRAM / Qwen GGUF
- 전용 ComfyUI: `E:\git\linalab\PNGAL\environment\ComfyUI-pngal-0.28.0`
- 모델: `E:\git\linalab\PNGAL\models\diffusion_models`
- 프로젝트 입력과 API 워크플로: `E:\git\linalab\PNGAL\portraits\janseon`
- ComfyUI 생성 결과: `E:\git\linalab\PNGAL\environment\ComfyUI-pngal-0.28.0\output\Janseon`

## 실행

Windows에서 `E:\git\linalab\PNGAL\start.bat`을 실행합니다. 종료할 때는 같은 폴더의 `stop.bat`을 사용합니다.

- PNGAL: <http://127.0.0.1:7865>
- ComfyUI: <http://127.0.0.1:8188>

Mac에서 접근하려면 터미널 하나를 열어 아래 명령을 유지합니다. 방화벽이나 외부 공개 설정은 필요 없습니다.

```sh
ssh -N -L 127.0.0.1:17865:127.0.0.1:7865 -L 127.0.0.1:18188:127.0.0.1:8188 windows
```

Mac 주소는 PNGAL <http://127.0.0.1:17865>, ComfyUI <http://127.0.0.1:18188>입니다. 터널을 종료해도 Windows 생성 서비스는 종료되지 않습니다.

## 두 가지 워크플로

### 새 캐릭터 포트레잇

ComfyUI에 `portrait-text-to-image.api.json`을 드래그하거나 열고 실행합니다. 기존 Windows에 설치되어 있던 `animagine-xl-3.1.safetensors`의 별도 복사본을 사용합니다. 모델을 자동으로 바꾸거나 외부 이미지 서비스를 호출하지 않습니다.

- 기본 캔버스: 832×1216
- 기본 seed: 20260914
- 인물 설명: `Adult portrait prompt` 노드
- 다른 인물 생성: 설명과 seed 변경

### 기존 인물의 표정 수정

`portrait-reference-smile.api.json`을 ComfyUI에서 엽니다. LoadImage 원본은 **`target.png`** 입니다. 이 파일은 Mac `Design/potrait-generator/assets/v2/target.png`(SHA-256 `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`, 1145×1374)를 Windows Comfy `input`과 `portraits\janseon`으로 수신한 복사본입니다. 입 마스크는 `janseon-mouth-mask.png`입니다. `Design/potrait-generator/assets/v2/target.png`는 생성 결과로 덮어쓰지 않습니다.

Qwen Image Edit 2511 GGUF가 입 영역만 수정하고, 마지막 합성 노드가 마스크 밖의 원본 픽셀을 보존합니다. 마스크에서 흰색은 수정, 검정은 보존입니다. 기본 파일은 원본의 1145×1374 크기에 맞춰져 있습니다. 다른 크기 원본을 사용할 때는 `ImageScale` 노드의 최종 크기도 함께 변경해야 합니다.

PNGAL UI에서도 원본 PNG를 열고 눈·입 마스크를 그린 뒤 Qwen GGUF 표정 생성을 사용할 수 있습니다. 이 경로의 seed는 PNGAL이 선택합니다. 고정 seed가 필요하면 위 ComfyUI 워크플로를 사용합니다.

### Civitai 타겟 방향 재구성 실험 — 품질 미승인

`portrait-civitai-target-reference.api.json`은 Civitai에서 받은 CAT IL v10 체크포인트와 Modern anime render LoRA를 사용해 `target.png`를 재구성하는 **실험용 ComfyUI API 워크플로**입니다. 새 캐릭터용 승인 파이프라인이 아닙니다.

- 체크포인트: `catCitronAnimeTreasure_ilV10.safetensors` / SHA-256 `e8bcb0b875a044a348fb2000b20c0c0be66c0e5de30cc2bf2d3fafe8a8e8b72f`
- LoRA: `Modern_anime_render.safetensors` / SHA-256 `397d26044d3405db88ce02599b27dff0f9c6437d0854fc4ee0cf4f8bd00e552c`
- 입력: `target.png` / SHA-256 `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`
- 출력: 1145×1374 PNG, seed 100, DPM++ 2M Karras, 32 steps, CFG 5, denoise 0.75
- Modern LoRA 공개 활성화 단어 `modern_anime_render`, `high_detail`, `soft_shading`, `clean_lineart`, `painterly_texture`를 프롬프트에 명시했습니다.

이 조건의 실측 결과는 `Tool/art/portrait/verify-portrait-review.mjs`에 유효한 GQ1 레코드로 제출됐지만 `accepted=false`입니다. Q01–Q07이 타겟보다 낮고 Q10 및 슬롯 관련 수치 게이트는 검증되지 않았습니다. denoise 0.55 결과는 타겟과 더 가깝지만 같은 정체성·구도·의상 배열을 보존한 재구성이라 새 캐릭터 생성 품질 증거가 아닙니다.

따라서 이 워크플로는 다음 용도만 허용합니다.

- 타겟 방향을 설명하는 연구·진단 재현
- 체크포인트/LoRA/API 등록이 실제로 동작하는지 확인
- denoise 변화에 따른 보존/독립성 비교

다음 용도는 금지합니다.

- 새 캐릭터 포트레잇의 승인 생성기라고 표시
- GQ1 통과 또는 guide-bust와 동급이라고 주장
- `target.png`, 승인 레이어, 캐스트 바인딩 또는 Unity 런타임 슬롯 자동 교체

상용 사용 가능 여부는 Civitai 웹 API 플래그만으로 확정하지 않습니다. 체크포인트·LoRA의 원문 라이선스와 기반 모델 조건은 제품 사용 전에 별도로 검증해야 합니다.

## 원본과 결과의 경계

- 계약 파일: `Tool/art/comfyui/target-contract.json`
- Mac 원본(자동 교체 금지): `Design/potrait-generator/assets/v2/target.png`
- 원본 SHA-256: `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`
- Comfy LoadImage 이름: `target.png` (`input/target.png`, `E:\\git\\linalab\\PNGAL\\portraits\\janseon\\target.png`)
- 입 마스크: 원본 mouth 슬롯의 알파를 18px 확장하고 8px 블러 처리한 작업용 마스크
- 생성물은 검토용 후보입니다. `Design/potrait-generator/assets/v2/target.png`를 포함한 승인 원본·레이어를 자동 교체하지 않습니다.
- PNGAL의 Apache-2.0 라이선스는 모델이나 생성물 전체의 사용 권리를 보증하지 않습니다. 모델별 조건과 결과 품질은 배포 전에 별도로 검토해야 합니다.
- 이 폴더의 API JSON은 **ComfyUI용**입니다. PNGAL의 사용자 face-workflow wrapper 규약과는 다르므로 PNGAL `workflows` 폴더에 복사하지 않습니다.

## 검증 상태

실제 설치·생성 검증 결과와 실행 ID는 `.omo/evidence/portrait-pngal-windows`에 기록합니다. 파일 존재만으로 설치 또는 생성 성공을 판단하지 않습니다.
