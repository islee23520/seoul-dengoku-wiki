# 캐릭터 미술 방향

![캐릭터가 어느 칸에 서 있고 어느 쪽을 보며 시야 안에서 어떻게 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/isometric-grammar.svg?raw=true)

## 실루엣

- 2.5등신 SD 비율
- 큰 머리와 분명한 얼굴 면
- 작은 몸통, 읽기 쉬운 어깨와 무기 외곽선
- 동, 서, 남, 북 네 방향 전용 표현
- 한 타일 안에서 직업과 상태를 구분할 수 있는 색과 장비

## 하이브리드 후보

기본 후보는 도트 헤드와 메시 바디의 실시간 결합입니다. 목 소켓, 방향 상태, 조명, 그림자와 가림 순서를 하나의 계약으로 관리합니다.

다음 세 방식을 같은 캐릭터와 조건으로 비교합니다.

1. 도트 헤드와 메시 바디
2. 통합 SD 메시와 포인트 필터 얼굴 아틀라스
3. 통합 4방향 스프라이트

## 탈락 결함

- 목 경계가 벌어지거나 흔들림
- 머리와 몸의 방향 상태가 한 프레임 이상 어긋남
- 머리, 머리카락, 무기와 환경의 깊이 순서 오류
- 조명과 색조가 달라 머리가 붙인 그림처럼 보임
- 정수 배율이 깨져 얼굴 픽셀이 번짐
- 비대칭 장비를 좌우 반전해 형태가 바뀜

실제 Unity Play Mode 캡처에서 결함이 남으면 더 단순한 통합 표현을 선택합니다.

## 인물 프로필 초상

핵심 인물의 프로필에는 전신 전술 모델과 별도로 흉상 초상을 사용합니다. 목표는 동아시아 역사 대전략 게임의 묵직한 인물화 감각이지만, 특정 회사의 캐릭터 카드, 붓질, 조명, 갑주, 배경, UI와 얼굴 비례를 따라 하지 않는 독자적 반실사 전략 일러스트입니다.

초상은 [십육국 핵심 인물](Core-Characters.md)의 성격, 개인 야망, 공포, 직위와 촉발 사건을 시각적으로 전달해야 합니다. 단순히 `지략가`, `맹장`, `미녀` 같은 유형만 그리지 않습니다.

## OpenAI 이미지 생성 프롬프트 구조

OpenAI 이미지 생성에는 다음 여섯 부분을 순서대로 작성합니다.

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


