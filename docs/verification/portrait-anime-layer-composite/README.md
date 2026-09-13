# 애니메 풍 초상 — 레이어 합성 검증 리포트

날짜: 2026-09-12  
워크트리: `feat/portrait-anime-layer-composite-w1`  
표본: 서윤 (`seoyun-a01`)  
커밋 게이트: 이 폴더는 사람 검수용 스틸이다. 런타임 슬롯 승격 아님.

공개 문구는 **애니메 풍 초상**만 쓴다. 문법 원전 이름·식별자는 비공개 리서치에만 있다.

## 한 줄

UI 흉상은 전술 시트를 자르지 않는다. 눈·머리·얼굴을 **교체 가능한 2D 슬롯**으로 두고, 오프라인에서 겹쳐 **한 장의 PNG**만 Unity에 넘긴다.

## 스크린샷

### 1. 합성 초상 (256×256)

슬롯 12장을 source-over로 겹친 결과. 키아트 한 장이 아니다.

![서윤 애니메 풍 초상 합성](composite.png)

sha256 prefix `cc6f1a4a03a08794` · RGBA

보이는 것: 앞머리가 이마를 가리고 눈은 남음. 흰자(`eyes_shape`)와 홍채(`eyes_color`)가 다른 층. 피부 `#c99a72` 계열, 머리 `#282b2a`, 상의는 서윤 베이크 `tunicColor`/`shirtColor`/`accentColor`에 맞춤.

### 2. 전술 남쪽 idle (64×64)

같은 인물의 전술 베이크 첫 셀. 초상 파이프의 입력이 아니다. 정체성 대조 전용.

![서윤 전술 남쪽 idle](tactical-south-idle.png)

sha256 prefix `0cf75511192a1037` · 원본 `seoyun-a01/machine/idle.png` (64×512, `directions[0]=S`)의 (0,0)–(64,64)

### 3. 나란히 (정체성)

왼쪽 합성 초상, 오른쪽 전술 셀 ×4.

![합성 초상과 전술 남쪽 idle 나란히](contact-sheet.png)

파이프는 섞지 않는다. 공유하는 것은 토큰뿐이다.

| 토큰 | 베이크 `input-design.json` | 초상 매니페스트 | 대조 |
|---|---|---|---|
| 머리색 | `hairColor` `#282b2a` | `hair_color` | 일치 |
| 의상 | tunic/shirt/trouser/covering/accent | `outfit_palette` | 일치 |
| 성별 | `bodyType` Male | `sex` Male | 일치 |
| 피부 | `skinColor` `#c99a72` | `skin` | 일치 |
| 눈색·연령 | 베이크에 필드 없음 | 전술 PASS에서 제외 | n/a |

### 4. 슬롯이 실제로 분리됨

합성기가 받는 입력. 한 장을 최종 파이프로 등록하면 실패다.

| 슬롯 | 미리보기 |
|---|---|
| `face_base` | ![face_base](face-base.png) |
| `eyes_shape` | ![eyes_shape](eyes-shape.png) |
| `eyes_color` | ![eyes_color](eyes-color.png) |
| `hair` | ![hair](hair.png) |
| `clothes` | ![clothes](clothes.png) |

나머지 필수 슬롯 PNG는 `slots/` (`neck`, `cheeks`, `chin`, `mouth`, `nose`, `ears`, `hair_back`).

### 5. 토큰 교체 예시 (2026-09-13)

같은 서윤 표본에서 정체성 토큰(머리색·눈색·의상 팔레트)만 바꿔 다시 합성한 예시. 슬롯 교체 가능성을 보이는 검증 스틸이며 새 캐릭트 베이크가 아니다.

![토큰 교체 예시 2×2](examples/examples-grid.png)

| 변형 | 교체 토큰 | 슬롯 | 목표색 |
|---|---|---|---|
| a 기본 | — | — | — |
| b 머리·눈 | 머리색·눈색 | `hair`·`hair_back`·`eyes_color` | `#6b4a2f`·`#5b3a24` |
| c 의상 | 의상 팔레트 | `clothes` | `#8a4b2d` |
| d 조합 | 머리색·눈색·의상 | 위 전부 | `#9a9aa2`·`#2e6e64`·`#3c4048` |

변형 슬롯 PNG는 각 슬롯의 지배색을 목표색 채널 비율로 곱해 만들었다(음영 구조 보존). 파일 위치: `examples/`. 같은 규칙의 브라우저 재현 데모: `web/portrait-demo/`(정적 페이지, 런타임 아님).

## 지금 할 수 있는 일

1. **슬롯 표** `tools/art/portrait-layer-slots.json` — 제품 ID 22개, z 0–21, `GFX_` 이름 없음.
2. **오프라인 합성** `tools/art/portrait-layer-composite.mjs` — 필수 슬롯 없으면 throw, 완전 투명 소스가 아래 층을 뚫지 않음, z 역순은 픽셀이 다름.
3. **원본 플레이트** — 레퍼런스 원본 DDS를 가져오지 않는다. 서윤 표본은 절차 픽셀.
4. **문서 계약** — `Intent.md` 결정 6: UI 초상은 전술 베이크·남쪽 idle 크롭과 **제3 표면**. `Character-Art-Direction.md`는 크롭 문장을 지우지 않고 날짜를 찍어 남긴다.
5. **위키 게이트** — 문법 원전 약칭과 스타일 속칭을 공개 페이지 금지 용어로 추가했다. `Luck2`는 안 걸린다. `clone`/`clones`는 예전처럼 부분 문자열.

## 아직 안 하는 일

- Unity HUD에 합성 PNG 바인딩 (할 일 9 N/A). `RuntimeSlotCatalog`에 portrait 슬롯 없음.
- 레퍼런스 원본 텍스처 반입. 구독 ≠ 재배포 허락.
- TRELLIS / 6셀 / wBJ / sprite-gen / OpenAI 이미지젠으로 플레이트 생성.
- 전 캐스트 대량 베이크. 표본은 서윤 1명.
- 전술 2.5등신·4방 카메라를 UI 초상에 요구하기.

## 리서치 요약 (문법만, 아트 없음)

엔진은 2D 스프라이트 선언 순서 합성이다. 눈·머리·얼굴은 메시가 아니라 슬롯이다. 원전 레이어 명세는 질병·UI 오버레이를 빼고 핵심 조립 슬롯으로 압축했으며 원문은 비공개 리서치에만 보관한다. `cN`은 z가 아니다.

라이선스: 워크숍 구독은 외부 게임 상업 이용 허락이 아니다. 기능 슬롯·순서는 독자 ID로만 적는다.

## 기계 검증

```text
node --test tools/art/test-portrait-layer-slots.mjs
node --test tools/art/test-portrait-layer-composite.mjs
node --test tools/wiki/test-build-wiki.mjs
```

기대: 슬롯 1 pass, 합성 4 pass, 위키 44 pass 0 fail.

F1–F4 APPROVE 원문: 워크트리 `.omo/evidence/portrait-anime-layer-composite/final/` (gitignored).
