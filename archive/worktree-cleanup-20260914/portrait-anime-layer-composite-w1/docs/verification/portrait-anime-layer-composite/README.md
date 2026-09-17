# 애니메 풍 초상 — 레이어 합성 검증 리포트

날짜: 2026-09-12  
워크트리: `feat/portrait-anime-layer-composite-w1`  
표본: 서윤 (`seoyun-a01`)  
커밋 게이트: 이 폴더는 사람 검수용 스틸이다. 런타임 슬롯 승격 아님.

공개 문구는 **애니메 풍 초상**만 쓴다. 문법 원전 이름·식별자는 비공개 리서치에만 있다.

## 현재 저작 도구 (2026-09-14)

`web/portrait-demo/`는 1145×1374 타겟 흉상의 원본 픽셀을 보존한 부품과 새 형태 변형을 조합한다. 머리 2종(가르마/일자 앞머리), 눈 2종(기본/집중), 의상 2종(겹깃/지퍼)의 8조합이다. 색만 바꾼 예시가 아니다. 기본 조합은 타겟의 decoded RGBA와 일치하며, 실제 브라우저 캔버스의 8조합은 오프라인 출력과 픽셀 차이 0으로 검증했다.

자작 부품은 `web/portrait-demo/assets/v2/`, 선택 계약은 `assets/recipe.json`에 있다. 얼굴 바탕이 턱·목을 연속해서 소유하며 `neck`, `cheeks`, `chin`은 명시적인 빈 슬롯이다. `eyes_shape`는 눈썹을 포함하고 `eyes_color`와 같은 선택값을 쓴다. 머리 앞뒤와 의상 앞뒤도 하나의 선택으로 묶인다. 슬롯 파일의 존재와 별도 작화의 필요는 다르다.

기본 조합, 타겟 대조, 슬롯 토글, 단계별 합성, 배경 검사 및 PNG 저장을 제공한다. 생성 후보 중 접합 결함이 있는 짧은 머리는 채택하지 않았다. 테스트나 파일 크기를 작화 승인으로 대신하지 않으며, 이 결과는 Unity 런타임 승격이 아니다. 공개 허브에는 아직 이번 변경을 배포하지 않았다.

아래 256×256 서윤 그림과 토큰 재색 예시는 **과거 합성기 검증 표본**으로 보존한다. 현재 작화의 타겟이나 완료본이 아니다.

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

변형 슬롯 PNG는 각 슬롯의 지배색을 목표색 채널 비율로 곱해 만들었다(음영 구조 보존). 파일 위치: `examples/`. 이 과거 표본과 현재 부품 조합 도구는 구분한다. 공개 주소는 `https://seoul-kenshi.vercel.app/portrait-demo/` — 별도 Vercel 프로젝트로 배포하지 않는다.

## 지금 할 수 있는 일

1. **슬롯 표** `tools/art/portrait-layer-slots.json` — 제품 ID 22개, z 0–21, `GFX_` 이름 없음.
2. **오프라인 합성** `tools/art/portrait-layer-composite.mjs` — 필수 슬롯 없으면 throw, 완전 투명 소스가 아래 층을 뚫지 않음, z 역순은 픽셀이 다름.
3. **원본 플레이트** — 레퍼런스 원본 DDS를 가져오지 않는다. 서윤 표본은 절차 픽셀.
4. **문서 계약** — `Intent.md` 결정 6: UI 초상은 전술 베이크·남쪽 idle 크롭과 **제3 표면**. `Character-Art-Direction.md`는 크롭 문장을 지우지 않고 날짜를 찍어 남긴다.
5. **위키 게이트** — 문법 원전 약칭과 스타일 속칭을 공개 페이지 금지 용어로 추가했다. `Luck2`는 안 걸린다. `clone`/`clones`는 예전처럼 부분 문자열.

## 아직 안 하는 일

- Unity HUD에 합성 PNG 바인딩 (할 일 9 N/A). `RuntimeSlotCatalog`에 portrait 슬롯 없음.
- 레퍼런스 원본 텍스처 반입. 구독 ≠ 재배포 허락.
- TRELLIS / 6셀 / wBJ / sprite-gen으로 초상 제작. 이미지 생성은 2026-09-14 소유자 변경 지시에 따라 이 2D 부품 파이프에서만 참조 기반 후보·숨은 면 작성에 사용한다.
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

기초 source-over 검사와 타겟 바인딩·부품 페어·픽셀 소유·영향 영역 검사를 함께 실행한다. 테스트 통과는 작화 승인이나 Unity 연결의 증거가 아니다.

F1–F4 APPROVE 원문: 워크트리 `.omo/evidence/portrait-anime-layer-composite/final/` (gitignored).
