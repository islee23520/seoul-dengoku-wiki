상태: 2026-09-19 결정 11. 제품 목표 인물은 애니메이션풍 정비율이다. 오드랜드·아이소 도표는 POC·역사다. 새 목표 전투가 구현됐다고 쓰지 않는다.

POC 사람 표현은 오드랜드 원본 어셋 as-is다([Intent.md](https://github.com/islee23520/seoul-dengoku/blob/main/Intent.md) 결정 4·10). 실행 티켓 #58은 결정 10으로 취소됐다. 결정 11은 이 POC 자산을 바꾸지 않는다.

## 목표 실루엣 (2026-09-19)

- 애니메이션풍 정비율. SD·2.5등신 목표를 다시 열지 않는다
- 젤다 무쌍 참고는 비례와 선만이다. 무쌍식 조작이나 그 세계관을 가져오지 않는다
- 분명한 얼굴 면과 읽기 쉬운 무기 외곽선
- 화면 안에서 직업과 상태를 구분할 수 있는 색과 장비
- 목표 전장 카메라는 질문 시간 초과 뒤 채택한 3D 자유 지휘 기본안(팬·오빗·줌)이다. 각도·시야각 수치는 만들지 않는다. 정비율 실루엣은 이 카메라에 묶인 SD 규격이 아니다

## POC 사람 표현

전신 전술 모델은 오드랜드 Spine·3D 원본이다. 화면은 용사주식회사 참고 좌우 사이드스크롤(Intent 결정 5·10, POC). 리타깃·SD 변환은 금지다.

위 그림은 2026-09-07 POC 아이소 문법 기록이다. 목표 전장 카메라는 3D 자유 지휘 기본안이며, 이 도표를 새 목표 화면의 증거로 쓰지 않는다. 상단 전장 도식은 문서용 청사진이지 실제 렌더가 아니다.

## 장비 잠금

- 탐사원: 오른손 지렛대, 왼허리 랜턴, 왼어깨 안테나
- 의무원: 오른팔 붉은 천 매듭, 부목 키트
- 순찰대: 곤봉, 흉부 위험 바, 바이저 램프

## 인물 프로필 초상

핵심 인물의 프로필에는 전신 전술 모델과 별도로 흉상 초상을 사용합니다. 2026-09-19 결정 11의 목표는 애니메이션풍 정비율 초상입니다. 특정 회사의 캐릭터 카드, 붓질, 조명, 갑주, 배경, UI를 따라 하지 않습니다.

초상은 [등장인물](/wiki/world/Core-Characters)의 성격, 개인 야망, 공포, 직위와 촉발 사건을 시각적으로 전달해야 합니다. 단순히 `지략가`, `맹장`, `미녀` 같은 유형만 그리지 않습니다.

### 전술 시트 크롭(과도/폐기 대상) — 2026-09-12

2026-09-12 기록. 이전 계약은 다음이다.

초상 한 장은 전투 시트와 같은 레시피에서 남쪽 idle 셀을 잘라 쓴다. 프롬프트로 따로 그리지 않는다.

이 문장은 삭제하지 않는다. 전술 시트 남쪽 idle 셀을 UI Image에 붙이는 경로는 과도·폐기 대상이며, 아래 **애니메 풍 초상** 파이프가 아니다.

## OpenAI 이미지 생성 프롬프트 구조 (역사, 현 목표 파이프 아님)

아래 반실사 프롬프트는 날짜가 있는 역사 기록이다. 결정 11 목표 초상과 아래 「애니메 풍 초상」 오프라인 플레이트 합성의 제작 경로가 아니다. OpenAI 이미지 생성에는 다음 여섯 부분을 순서대로 작성합니다.

1. `Subject`: 나이대, 얼굴 골격, 표정, 부상, 직위와 생업을 구체적으로 적습니다.
2. `Medium and style`: 독자적인 고급 반실사 동아시아 전략게임 인물화 한 가지 매체만 지정합니다.
3. `Composition and camera`: 눈높이 또는 약한 로우앵글의 가슴 위 흉상, 시선 방향, 여백을 지정합니다.
4. `Lighting and color`: 국가의 핵심 인프라에서 나온 빛과 제한된 색상 팔레트를 지정합니다.
5. `Mood`: 야망, 공포, 피로, 의심, 연민처럼 프로필의 정치 감정을 지정합니다.
6. `Background`: 정수장, 공방, 기록고, 시장, 환승 통로처럼 인물의 권력 기반을 흐릿하게 배치합니다.

### 공통 템플릿

```text
Use case: stylized-concept
Asset type: character profile bust portrait for a Korean post-collapse grand-strategy RPG
Subject: [이름], [나이대와 얼굴 특징], [직위와 생업], [부상·장비], expression showing [개인 야망] restrained by [공포]
Medium and style: original premium semi-realistic East Asian historical-strategy illustration, tactile brush texture, grounded human anatomy, post-collapse Seoul material culture
Composition and camera: chest-up portrait, eye-level or subtle low angle, three-quarter view, clear silhouette, quiet negative space for profile UI
Lighting and color: [권력 기반의 광원], restrained palette of [국가색 2~3개], natural skin texture
Mood: [정치적 감정과 내적 갈등]
Background: softly focused [정수장·공방·기록고·시장·환승 통로], no readable text
Constraints: preserve Korean facial identity; clothing combines practical modern salvage with historically informed layering without copying a specific period costume; show profession before combat power; no logo, no watermark
Avoid: direct imitation of any named game, studio, illustrator, character card, UI frame, costume, clan emblem or historical portrait; no glossy doll skin; no oversized fantasy weapon; no feather-fan strategist cliché; no generic samurai armor; no readable text
```

## 인물별 프롬프트 변수

| 인물 | 표정과 감정 | 권력 기반 | 대표 광원·재료 |
|---|---|---|---|
| 한재목 | 계약을 어길 사람을 먼저 의심하는 절제 | 급수 장부와 수문 | 청록 계기판, 젖은 방수천 |
| 강민서 | 공개 토론 뒤 결정을 밀어붙이는 자신감 | 공방과 제작평의회 | 용접광, 무광 공구강 |
| 서이안 | 검증되지 않은 권위에 대한 경계 | 연구실과 안전심사 | 차가운 검사등, 투명 표본병 |
| 임하준 | 후계를 말하지 못한 책임감과 피로 | 펌프실과 공방 | 황동 밸브, 따뜻한 작업등 |
| 배우진 | 보호와 지배를 구분하지 못하는 확신 | 상수호위단 | 백색 비상등, 방수 장갑판 |
| 임초원 | 능력을 증명하려는 침착한 불안 | 공개 설계도와 정비일지 | 청색 휴대등, 낡은 도면 |
| 윤서린 | 기록의 빈틈을 찾는 냉정함 | 기록고와 인준 인장 | 측면 종이등, 먹빛 파일 |
| 박태겸 | 후견과 계산이 공존하는 미소 | 배차실과 철도창고 | 적색 신호등, 기름 묻은 장갑 |
| 오해린 | 손실을 감춘 상대를 읽는 상인 눈빛 | 냉동창고와 경매장 | 차가운 창고등, 성에 낀 금속 |
| 문가람 | 진실 공개의 결과를 두려워하는 집중 | 송신실과 녹음기 | 모니터 잔광, 흡음재 |
| 백온 | 가족을 지키려는 온기와 완고함 | 피난창고와 명부 | 화롯불, 여러 번 기운 외투 |
| 김도윤 | 작업자의 손을 먼저 보는 엄격함 | 차량기지 작업대 | 점검등, 마모된 차륜강 |
| 장세화 | 중립을 지키려는 밝은 긴장 | 환승 배차실과 의료열차 | 녹색 신호등, 응급 표식 천 |
| 류은비 | 환자를 구하면서 분노를 누르는 표정 | 약재고와 치료소 | 따뜻한 약탕등, 종이 약봉지 |
| 고서준 | 즉시 행동하고 싶은 충동을 억누름 | 능선 초소와 교량 관측 | 새벽 역광, 방수 망원경 |
| 남윤경 | 상대의 절박함을 가격으로 읽는 친절 | 경매 원장과 배급창고 | 주황 창고등, 번호표와 장부 |
| 정유라 | 힘이 법을 앞서는 순간의 혐오 | 계약감사실과 협약문 | 중성 백색등, 봉인끈과 서류철 |

## 생성과 검수 기록

초상마다 인물 ID, 프로필 문서 revision, 최종 프롬프트, 생성 도구·모델, 생성 시각, 시드 또는 실행 메타데이터, 원본 출력, 선택 이유, 금지 요소 검수와 사람의 승인을 기록합니다.

프롬프트에는 특정 작품의 이름을 스타일 지시어로 넣지 않습니다. 원하는 품질은 매체, 구도, 조명, 재료, 감정과 배경을 직접 설명해 얻습니다.

## 애니메 풍 초상 (2026-09-12, 2026-09-19 목표와 정합)

2026-09-12 소유자 락(Intent 결정 8). UI의 **애니메 풍 초상**은 전술 베이크와도, 남쪽 idle 셀 크롭과도 구별되는 제3 표면이다. 세 표면의 파이프를 섞지 않는다. 결정 11은 이 표면의 목표 비례를 정비율로 고정한다.

- 전술 표면은 오드랜드 원본 어셋 as-is다(결정 10). 등신·카메라·방향을 UI 초상에 요구하지 않는다. 공유는 정체성 토큰(머리색·의상 팔레트·성별·피부)뿐이다.
- 위의 남쪽 idle 크롭은 전술 시트 크롭(과도/폐기 대상)이며 이 파이프가 아니다.
- UI 제3 표면은 눈·머리·얼굴·옷처럼 교체 가능한 **원본 2D 플레이트**를 정해진 슬롯 순서로 **오프라인 합성**한다.

Unity는 합성 PNG/아틀라스만 받는다. 런타임 레이어 스택, 키아트 한 장 등록, 전술 메시나 방향 시트를 초상으로 쓰는 일은 이 표면이 아니다.

합성은 아래 표의 위가 뒤, 아래가 앞이다. 각 슬롯은 독립 교체 가능한 2D PNG(알파)다. 빈 슬롯은 완전 투명이며 아래 층에 구멍을 뚫으면 실패다. 눈은 `eyes_shape`와 `eyes_color` 두 슬롯, 머리는 `hair_back`과 `hair` 두 슬롯, 얼굴은 `face_base`와 목·볼·턱·입·코·귀이다. 키아트 한 장으로 눈·머리·얼굴을 대체하지 않는다.

| z | 슬롯 | 역할 | 정체성 토큰 | 필수 |
|---|---|---|---|---|
| 0 | bg | 배경 | 없음 | 아니오 |
| 1 | clothes_back | 옷 뒤 | 의상 팔레트 | 아니오 |
| 2 | headgear_back | 머리 장식 뒤 | 의상 | 아니오 |
| 3 | hair_back | 머리 뒤 | 머리색 | 예 |
| 4 | beard_back | 수염 뒤 | 머리색 | 아니오 |
| 5 | face_base | 얼굴 바탕 | 피부 | 예 |
| 6 | neck | 목 | 피부 | 예 |
| 7 | cheeks | 볼 | 피부 | 예 |
| 8 | chin | 턱 | 피부 | 예 |
| 9 | mouth | 입 | 없음 | 예 |
| 10 | nose | 코 | 없음 | 예 |
| 11 | eyes_shape | 눈 형태 | 없음 | 예 |
| 12 | eyes_color | 눈 색 | 눈색(전술 키와 대조 없음) | 예 |
| 13 | ears | 귀 | 피부 | 예 |
| 14 | clothes | 옷 | 의상 팔레트 | 예 |
| 15 | headgear_mid | 머리 장식 중간 | 의상 | 아니오 |
| 16 | beard | 수염 | 머리색 | 아니오 |
| 17 | hair | 머리 앞 | 머리색 | 예 |
| 18 | clothes_front | 옷 앞 | 의상 | 아니오 |
| 19 | headgear | 머리 장식 앞 | 의상 | 아니오 |
| 20 | acc_eye | 눈 장식 | 없음 | 아니오 |
| 21 | frame | UI 테두리 | 없음 | 아니오 |

이 표면의 스틸은 원본 2D 플레이트와 오프라인 합성이다. OpenAI 이미지 생성, TRELLIS, sprite-gen을 플레이트 제작·보정·실패 대체로 쓰지 않는다. 위의 「OpenAI 이미지 생성 프롬프트 구조」는 역사 기록이며 이 파이프가 아니다. UI 레이어 초상을 프롬프트로 따로 그리지 않는다. 프롬프트 그린 초상의 예외는 없으며, 남쪽 idle 크롭 문장과 반실사 프롬프트만 역사 기록으로 남긴다.


