# Iyen Spine Asset Breakdown Memo

목적: 원본 디자인을 기준으로 Spine 작업용 레이어, 탈착 단계, 의상 바리에이션 제작 기준을 고정한다.  
기준 이미지: `file_000000001e547209a13af1766db10cbe.png`, `spine_reference_boards/iyen_spine_reference_01_turnaround.png`

## Design Lock

- 캐릭터 인상: 성인 여성, 고딕/뱀파이어 무드, 차분하고 유혹적인 표정, 와인색 장발.
- 고정 팔레트: 와인 레드 헤어, 핑크 레드 눈, 블랙 의상, 자홍색 금속 하드웨어, 붉은 보석, 반투명 블랙 스타킹.
- 반드시 유지할 실루엣: 긴 웨이브 헤어, 왼쪽 장미형 원형 헤어 장식, 목 중심 원형 장식, 허리 중심 원형 링, 길게 떨어지는 비대칭 스커트/로브 라인.
- 교체 가능 영역: 겉 로브, 소매, 스커트 앞패널, 스타킹, 부츠, 가슴 컵/브라 계열, 허리 스트랩, 장식 태슬.
- 교체해도 유지할 앵커: 머리 장식, 귀걸이, 눈 색, 헤어 볼륨, 목 장식 위치, 허리 중심 링 위치. 

## Layer Stack

| 단계 | 이름 | 포함 파츠 | 용도 |
|---|---|---|---|
| 00 | body_base | 얼굴, 목, 몸통, 팔, 손, 다리 | 모든 착장 공통 베이스. 실제 제작 시 옷 아래 가려지는 부분도 연결선 확인용으로 필요 |
| 01 | bikini_base | 기본 브라 컵, 팬티/하의, 최소 스트랩 | 의상 탈착/교체 기준. 노출 연출용이 아니라 의상 핏 확인용 기준 레이어 |
| 02 | inner_lace | 레이스 컵 가장자리, 허벅지 레이스 밴드 | 고딕 정체성을 유지하는 얇은 장식 레이어 |
| 03 | collar_harness | 목 하이칼라, 가슴 중앙 링, Y자 스트랩 | 캐릭터를 알아보게 하는 핵심 의상 레이어 |
| 04 | waist_harness | 허리 벨트, 중심 원형 링, 좌우 스트랩 | 모든 의상 바리에이션에 재사용 가능한 앵커 |
| 05 | sleeves | 오프숄더 긴 소매, 팔 스트랩, 손목 프릴 | 팔 움직임용 별도 리깅 필요 |
| 06 | skirt_robe | 앞 스커트 패널, 옆/뒤 롱 로브, 자홍 안감 | 하체 실루엣 변화용 큰 천 파츠 |
| 07 | legwear | 반투명 스타킹, 가터/레이스, 다리 장식선 | 다리 레이어 위에 곱하기/반투명 소재로 분리 권장 |
| 08 | boots | 하이힐 부츠, 발목 링, 체인/보석 | 발목 회전과 발끝 포즈에 맞춰 좌우 분리 |
| 09 | accessories | 헤어 장식, 귀걸이, 태슬, 보석, 손톱 | 흔들림/물리본 적용 후보 |
| 10 | hair | 앞머리, 옆머리, 뒷머리 덩어리, 잔머리 | Spine 본 체인 분리 최우선 |

## Parts Catalog

| ID | 카테고리 | 파츠명 | 위치 | 탈착 단계 | 변형 후보 | 제작 메모 |
|---|---|---|---|---|---|---|
| HAIR_001 | hair | 앞머리 메인 | 이마 중앙 | 고정 | 길이/갈라짐 2종 | 눈을 살짝 덮는 캐릭터 인상 유지 |
| HAIR_002 | hair | 왼쪽 옆머리 | 얼굴 좌측 | 고정 | 귀 노출/가림 | 헤어 장식과 겹침 순서 주의 |
| HAIR_003 | hair | 오른쪽 옆머리 | 얼굴 우측 | 고정 | 볼륨 2종 | 얼굴 윤곽을 가리지 않게 분리 |
| HAIR_004 | hair | 뒷머리 큰 덩어리 | 등 전체 | 고정 | 일반/바람/젖은 머리 | 턴테이블에서 가장 큰 실루엣 기준 |
| HAIR_005 | hair | 하단 웨이브 잔머리 | 허리 아래 | 고정 | 길이 2종 | 물리본 체인 여러 개로 분리 |
| ACC_001 | accessory | 장미형 원형 헤어 장식 | 왼쪽 머리 | 고정 앵커 | 금속색/보석색 변형 | 캐릭터 식별용 핵심 소품 |
| ACC_002 | accessory | 헤어 장식 태슬 | 왼쪽 머리 아래 | 선택 | 짧은 태슬/긴 태슬 | 흔들림 본 적용 |
| ACC_003 | accessory | 좌우 링 귀걸이 | 양쪽 귀 | 선택 | 보석형/체인형 | 얼굴 회전별 위치 고정 필요 |
| ACC_004 | accessory | 붉은 드롭 보석 | 귀걸이 하단 | 선택 | 루비/자수정 | 작은 파츠지만 색 포인트 큼 |
| FACE_001 | face | 핑크 레드 눈 | 얼굴 | 고정 | 감정별 눈매 | 표정 보드 필요 |
| FACE_002 | face | 미소 입 | 얼굴 | 고정 | 닫힘/웃음/말하기 | 립싱크 슬롯 후보 |
| NAIL_001 | accessory | 긴 와인색 손톱 | 손가락 끝 | 선택 | 짧은 손톱/장갑 | 손 포즈에서 실루엣 유지 |
| TOP_001 | clothing | 블랙 하이칼라 | 목 | 외의 제거 후에도 유지 가능 | 초커형/레이스형 | 목 회전과 턱 겹침 주의 |
| TOP_002 | clothing | 가슴 중앙 원형 링 | 쇄골 아래 | 고정 앵커 | 링 크기/보석형 | 상의 바리에이션 공통 기준점 |
| TOP_003 | clothing | Y자 하네스 스트랩 | 목-가슴 중앙 | 선택 | 십자/비대칭 스트랩 | 상체 변형 시 늘어남 주의 |
| TOP_004 | clothing | 블랙 브라 컵 | 가슴 | bikini_base | 레이스/가죽/천 | 기본 베이스 착장 기준 |
| TOP_005 | clothing | 컵 레이스 트림 | 브라 가장자리 | 선택 | 레이스 밀도 2종 | 컵과 별도 레이어 권장 |
| TOP_006 | clothing | 어깨 노출 라인 | 좌우 어깨 | 고정 디자인 | 숄/재킷 추가 | 의상 교체 시 피부 경계 기준 |
| ARM_001 | clothing | 왼쪽 오프숄더 소매 | 왼팔 | 선택 | 제거/타이트/퍼프 | 팔 본과 별도 천 본 필요 |
| ARM_002 | clothing | 오른쪽 오프숄더 소매 | 오른팔 | 선택 | 제거/타이트/퍼프 | 좌우 비대칭 변형 가능 |
| ARM_003 | clothing | 상완 스트랩 | 팔 위쪽 | 선택 | 1줄/2줄/체인 | 팔 굽힘 시 왜곡 체크 |
| ARM_004 | clothing | 손목 프릴 커프 | 손목 | 선택 | 프릴/가죽 커프 | 손 회전 레이어 순서 중요 |
| WAIST_001 | clothing | 허리 벨트 본체 | 허리 | 선택 | 코르셋/얇은 벨트 | 상하체 연결부를 가림 |
| WAIST_002 | clothing | 허리 중앙 원형 링 | 배꼽 아래 | 고정 앵커 | 링/보석 브로치 | 캐릭터 정면 중심선 기준 |
| WAIST_003 | clothing | 세로 드롭 리본 | 허리 중앙 아래 | 선택 | 짧은 리본/체인 | 걷기 모션에서 흔들림 |
| WAIST_004 | clothing | 사선 체인 스트랩 | 허리-골반 | 선택 | 한 줄/두 줄/체인 | 로브 위/아래 레이어 구분 |
| BOTTOM_001 | clothing | 앞 스커트 패널 | 골반 전면 | 선택 | 짧은 패널/긴 패널 | 비키니 베이스에서는 제거 |
| BOTTOM_002 | clothing | 좌측 롱 로브 | 왼쪽 다리 외곽 | 선택 | 짧은 케이프/롱 케이프 | 하체 실루엣을 크게 바꿈 |
| BOTTOM_003 | clothing | 우측 롱 로브 | 오른쪽 다리 외곽 | 선택 | 짧은 케이프/롱 케이프 | 좌우 분리 리깅 |
| BOTTOM_004 | clothing | 뒤 로브 큰 천 | 등-다리 뒤 | 선택 | 투명 망사/두꺼운 코트 | 뒷모습 락킹 핵심 |
| BOTTOM_005 | clothing | 자홍색 안감 | 로브 안쪽 | 선택 | 채도 2종 | 움직일 때 보이는 색 포인트 |
| LEG_001 | clothing | 반투명 블랙 스타킹 | 양다리 | 선택 | 맨다리/망사/오버니삭스 | 피부 레이어 위 별도 알파 |
| LEG_002 | clothing | 허벅지 레이스 밴드 | 허벅지 상단 | 선택 | 가터/레이스 제거 | 비키니 베이스와 궁합 체크 |
| SHOE_001 | clothing | 왼쪽 하이힐 부츠 | 왼발 | 선택 | 샌들/롱부츠/맨발 베이스 | 발목 본 분리 |
| SHOE_002 | clothing | 오른쪽 하이힐 부츠 | 오른발 | 선택 | 샌들/롱부츠/맨발 베이스 | 좌우 대칭 유지 |
| SHOE_003 | accessory | 부츠 체인/보석 | 발목/발등 | 선택 | 제거/강화 | 작은 흔들림 파츠 |
| PROP_001 | prop | 장미/고딕 방 배경 모티프 | 배경 | 비사용 | UI 배경/카드 일러스트 | Spine 캐릭터 본체에는 제외 |

## Outfit Breakdown Stages

| Stage | 이름 | 남는 레이어 | 제거되는 레이어 | 목적 |
|---|---|---|---|---|
| A | full_locking | 모든 원본 의상 | 없음 | 최종 캐릭터 락킹 기준 |
| B | robe_off | bikini_base, collar_harness, waist_harness, sleeves, legwear, boots | skirt_robe | 긴 천을 제거했을 때 실루엣 확인 |
| C | sleeves_off | bikini_base, collar_harness, waist_harness, legwear, boots | sleeves, skirt_robe | 팔 리깅/상체 라인 확인 |
| D | harness_only | bikini_base, collar_harness, waist_harness | sleeves, skirt_robe, legwear, boots | 교체 의상 위에 공통 장식 적용 확인 |
| E | bikini_base | bikini_base, hair, face, accessories | collar_harness, waist_harness, sleeves, skirt_robe, legwear, boots | 의상 피팅용 기준 바디. 노출 목적 아님 |
| F | alternate_outfit | hair, face, accessories, 선택형 상/하의 | 원본 겉옷 일부 | 신규 의상 바리에이션 비교 |

## Variation Board Plan

| 보드 | 파일명 제안 | 내용 | 생성 상태 |
|---|---|---|---|
| 01 | `iyen_spine_reference_01_turnaround.png` | 원본 의상 전신 턴테이블 | 완료 |
| 02 | `iyen_spine_reference_02_bikini_base_turnaround.png` | 비키니 베이스 전신 턴테이블, 5방향 | 완료 |
| 03 | `iyen_spine_reference_03_outfit_breakdown_steps.png` | full -> robe off -> sleeves off -> harness only -> bikini base | 완료 |
| 04 | `iyen_spine_reference_04_parts_collage.png` | 헤어/장식/상의/허리/하의/신발 파츠 콜라주 | 완료 |
| 05 | `iyen_spine_reference_05_outfit_variations.png` | 고딕 드레스, 전투복, 수영복, 라운지웨어 등 착장 비교 | 완료 |
| 06 | `iyen_spine_reference_06_accessory_variations.png` | 머리 장식, 귀걸이, 허리 링, 체인/태슬 변형 | 완료 |
| 07 | `iyen_spine_reference_07_hair_wig_variations.png` | 앞머리/옆머리/뒷머리/가발 실루엣 교체안 | Windows 4080 ComfyUI 후보 생성 필요 |

## Prompt Notes For Next Image Generation

공통 금지: 과한 노출, 누드, 명시적 포즈, 침실 배경, 텍스트 라벨, 워터마크, 몸 비율 변화, 헤어 장식 누락.  
공통 유지: 성인 캐릭터, 와인색 장발, 왼쪽 장미 원형 헤어 장식, 붉은 눈, 자홍 금속 장식, 고딕 블랙 팔레트.

### Board 02 Prompt

Create a professional anime character sheet board for Spine 2D rigging. Adult gothic female character based on the provided locked design: long wine-red hair, pink-red eyes, left rose-disc mechanical hair ornament with tassels, ruby earrings, black and magenta gothic hardware. Show the same character in a tasteful black gothic bikini base used only as a clothing-fit reference, not erotic: full-body neutral A-pose turnaround, front, 3/4 front, side, 3/4 back, back. Keep the face, hair volume, body proportions, accessories, and palette consistent with the locked turnaround. Plain light gray studio background, guide lines, no text, no watermark.

### Board 03 Prompt

Create a costume breakdown collage board for Spine production. Same adult gothic female character, same proportions and locked identity. Show five full-body front views in neutral A-pose: full original outfit, long robe removed, sleeves removed, harness-only over bikini base, bikini base only. Make every clothing layer clearly separable: collar, chest ring, waist ring, sleeves, robe panels, stockings, boots, chains, tassels. Plain studio background, no labels, no watermark, production reference style.

### Board 05 Prompt

Create an outfit variation collage board for the locked gothic anime female character. Keep the same face, hair, hair ornament, eyes, earrings, body proportions, and magenta-black hardware language. Show six neutral full-body front views with different attachable outfit concepts: original gothic dress, gothic bikini base, short combat jacket set, elegant evening dress, swimwear variant with gothic hardware, casual black lounge outfit. Keep all designs tasteful and Spine-rigging friendly, with clear separable layers and consistent anchor points at collar and waist rings. Plain studio background, no text, no watermark.

### Board 07 Hair / Wig Prompt

Create a hair and wig variation board for the locked gothic anime female character. Board 01 is the only style lock. Keep the same adult face, pink-red eyes, hair ornament anchor, earrings, neck shape, color density, line weight, and black-magenta gothic polish. Show attachable hair systems for Spine: original long wine-red waves, shorter layered gothic bob, twin side-tail wig, high ponytail wig, long straight wig, and swept-back updo. Each style must show front and back silhouette notes visually without text labels, preserve the left rose-disc ornament mounting point, and avoid changing the character identity.
