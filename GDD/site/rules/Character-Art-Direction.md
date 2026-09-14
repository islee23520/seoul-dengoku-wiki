# 캐릭터 미술 방향

![캐릭터가 어느 칸에 서 있고 어느 쪽을 보며 시야 안에서 어떻게 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/isometric-grammar.svg?raw=true)

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

## 스타일 레퍼런스: 트리 오브 세이비어식 SD (2026-09-06 소유자 지정)

소유자 지시: 사람 캐릭터는 트리 오브 세이비어 같은 SD 표현으로 다시 만든다. 온라인 조사로 확보한 재현 규칙이다.

1. **3D 몸 + 2D 도트 머리 하이브리드.** TOS 캐릭터는 몸이 3D 모델이고 머리와 일부 이펙트는 2D 도트 스프라이트가 빌보드로 붙는다. 우리의 1번 후보(도트 헤드 + 메시 바디)가 이 구조와 같다.
2. **쿼터뷰 고정, 각도 회전 없음.** MAGGI 인터뷰: 가시성을 위해 카메라 회전을 제거했다. 우리 장르 계약(45°/35.264° 고정)과 일치하며 유지한다.
3. **얼굴은 눈만 강조한 단순화.** 초기의 눈·눈썹·입 세부를 지우고 눈 중심으로 단순화했다. 도트 머리에서도 눈이 식별자다.
4. **손그림 질감, 디오라마 세계.** 텍스처는 손으로 그린 느낌을 유지하고, 캐릭터가 소품에 닿거나 올라탈 수 있는 정돈된 무대를 만든다. 장식적 귀여움이 아니라 현실 묘사를 유지한다(디스토피아 톤 조절).
5. **SD 비율 범위.** 통용 SD는 2~4등신이며 TOS는 그 안의 소두형이다. 우리 실루엣 계약 2.5등신은 이 범위 안에 있으므로 유지한다.
6. **실지 조사 기반 의상·소품.** TOS 팀은 현지 조사로 복장·배경 자료를 모았다. 우리는 서울 지하철·폐허 실사 사진을 레퍼런스 보드로 모아서 같은 역할을 하게 한다.

### 재작업 수치 목표 (2026-09-06 확정)

| 항목 | 목표 | 근거 |
|---|---|---|
| 머리 비율 | 전신 높이의 1/3~1/2 (2.5등신 유지) | SLYNYRD Pixelblog 22 — 소형 스프라이트일수록 머리를 크게 |
| 프레임 | 96×128 유지, 캐릭터가 프레임을 꽉 채우되 상단 여백 허용(Y 겹침용) | SLYNYRD — 타일 단위 프레임, 위쪽 반은 겹침 허용 |
| 애니 구조 | idle 4 · walk 6 · attack 6 · hit 3 · down 4 (기존 계약 유지) | SLYNYRD — 걷기 4~8프레임, 포즈 재사용 |
| 제작 순서 | 베이스 누드 모형 → 장비 얹기(장비 교환식 레이어) | SLYNYRD 기본 모형 방법론 + TOS 장비 시스템 |
| 얼굴 | 눈만 식별자. 눈썹·입은 생략하거나 1~2px | MAGGI 인터뷰 — 눈 강조 단순화 |
| 몸구조 | 3D 메시 바디 + 2D 도트 머리 빌보드 (1번 방식 확정) | Reddit/포럼 TOS 구조 분석 |
| 톤 | 무광 손그림 질감, 디스토피아 톤 유지 — 과한 귀여움 금지 | MAGGI 인터뷰 |

방향 목업: `.omo/evidence/character-direction/tos-sd-direction-mockup.png` (2026-09-06, gpt-image-2 — 스타일 목표 시트이지 런타임 에셋이 아니다). 목업에는 장비 잠금(탐사원 오른손 지렛대·왼쪽 허리 랜턴·왼 어깨 안테나, 의무원 오른팔 붉은 천 매듭, 순찰대 방패등·위험 바)이 계약대로 반영됐다.

출처: MAGGI 아트디렉터 공식 인터뷰(treeofsavior.com/page/news/view.php?n=337), MAGGI 프로필(toswiki.treeofsaviorgame.com/people/maggi), TOS 스프라이트 구조 토론(forum.treeofsavior.com/t/what-is-toss-sprite-art-graphics-style/154277, reddit.com/r/treeofsavior/comments/k8o616), SD 비율 통설(네이버 블로그 게임학원 자료 다수).

거부 목록에 추가: TOS의 실제 도트·텍스처·캐릭터 카드를 그대로 옮겨 그리는 일. 참조는 방법론이지 산출물이 아니다.

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

초상은 [십육국 핵심 인물](/world/Core-Characters)의 성격, 개인 야망, 공포, 직위와 촉발 사건을 시각적으로 전달해야 합니다. 단순히 `지략가`, `맹장`, `미녀` 같은 유형만 그리지 않습니다.

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


