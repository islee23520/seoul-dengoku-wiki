# Iyen Spine Reference Boards

원본 캐릭터를 Spine 제작용으로 락킹하고, 의상/악세사리/소품을 분해하기 위한 레퍼런스 산출물입니다.

## Boards

| 파일 | 용도 |
|---|---|
| `iyen_spine_reference_01_turnaround.png` | 원본 고딕 의상 락킹 턴어라운드 |
| `iyen_spine_reference_02_bikini_base_turnaround.png` | 의상 피팅 기준 비키니 베이스 턴어라운드 |
| `iyen_spine_reference_03_outfit_breakdown_steps.png` | 원본 의상 탈착 단계 비교 |
| `iyen_spine_reference_04_parts_collage.png` | 원본 이미지에서 잘라낸 핵심 파츠 콜라주 |
| `iyen_spine_reference_05_outfit_variations.png` | 대체 의상 바리에이션 비교 |
| `iyen_spine_reference_06_accessory_variations.png` | 머리 장식, 귀걸이, 링, 체인, 부츠 장식 등 악세서리 변형 |

## Deleted Boards

Boards 07-16 and `iyen_spine_reference_contact_sheet.png` were xAI/Grok-generated failed outputs and have been removed. Only boards 01-06 (GPT-generated) are retained.

## Production Notes

- `iyen_asset_breakdown_memo.md`: 파츠 ID, 탈착 단계, 바리에이션 후보, 제작 메모.
- `iyen_asset_layers.csv`: Spine/PSD 레이어 체크리스트로 옮기기 쉬운 CSV.
- `parts_crops/`: 원본에서 잘라낸 파츠 이미지 조각. 콜라주 재편집용으로 보존.
- `prompts/iyen_style_locked_regeneration_prompts.md`: 01번 그림체 기준 재생성 프롬프트.
- `gemini_style_verification_report.md`: Gemini 3.1 Pro Preview 검수 요약.
- `outputs/comfy-reference-boards/`: 01번 락킹 보드를 보존한 채 02/03/05/06/헤어 가발 보드를 Windows 4080 ComfyUI로 개선하기 위한 업로드 큐, 보드별 요청서, Gemini 고검수 프롬프트.

## Custom GPT Pipeline

1clik Character Sheet Generator URL을 로컬 파이프라인 패키지로 변환하려면:

```bash
uv run python -m iyen_layers custom-gpt-sheet-pipeline \
  'https://chatgpt.com/g/g-6a0997d9c8688191becbd852e0a1e218-1clik-character-sheet-generator/c/6a22eb55-f78c-83aa-ba4c-f4a6ed5a74be' \
  spine_reference_boards \
  --gemini-report spine_reference_boards/gemini_style_verification_report.md \
  --output-dir outputs/custom-gpt-sheet-pipeline
```

출력:

- `manifest.json`: GPT ID, 대화 ID, required output 파일명, 업로드 파일 목록.
- `generation-request.md`: Custom GPT에 그대로 넣을 스타일 락 재생성 요청서.
- `upload-queue.txt`: 브라우저 업로드용 절대 경로 목록.

## Locking Rule

- `iyen_spine_reference_01_turnaround.png`는 락킹 기준이며 재생성/덮어쓰기 금지.
- 고정: 와인색 장발, 왼쪽 장미형 헤어 장식, 핑크 레드 눈, 붉은 귀걸이, 검정/자홍색 고딕 하드웨어.
- 교체 가능: 로브, 소매, 스커트 패널, 스타킹, 부츠, 브라/상의, 허리 스트랩, 체인/태슬.
- 비키니 베이스는 의상 피팅과 레이어 경계 확인용 기준 이미지로 사용한다.

## Windows ComfyUI Regeneration Queue

```bash
uv run python -m iyen_layers comfy-reference-board-pipeline \
  spine_reference_boards \
  --output-dir outputs/comfy-reference-boards \
  --github-repo islee23520/iyen-virtual-doll
```

이 패키지는 01번을 스타일 락 입력으로만 복사하고, 02/03/05/06 및 헤어/가발 바리에이션 후보를 Windows 4080 ComfyUI에서 새 파일로 생성하도록 요청합니다. 후보는 Gemini 3.1 Pro Preview high review x3가 모두 PASS일 때만 Spine 작업 소스로 승격합니다.
