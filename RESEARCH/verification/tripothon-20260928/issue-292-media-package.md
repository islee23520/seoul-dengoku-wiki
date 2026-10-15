# #292 영상·피치 제작 패키지

상태: **촬영 구성·대본 초안 준비 / 실제 플레이 영상·최종 제출 링크 미완료**. #291에서 공개 캠페인 접근이 차단됐고 #282 승인 에셋도 없어, 없는 게임 플레이를 영상으로 만들어 내지 않는다.

## 실제 촬영 순서

1. 익명 브라우저 URL과 빌드 식별자에서 시작해 인물 선택 화면 없이 신종목(K1009)으로 강남구청 진입, 이어 출발 분대 선택을 보여 준다.
2. 첫 응답 사건 선택→승인 창고로 실제 이동→주민 부품 협의→선정릉 통행을 끊김 없이 촬영한다.
3. 같은 세계 시간에서 두 AI 세력과 플레이어 분대가 경로를 따라 움직이는 모습을 보여 준다. 턴 예산과 동시 턴은 최신 결정 14로 대체됐다.
4. 승인된 전투 분기에서 GURPS 4판 개인 판정과 노랜드식 진행·UI, 병졸 손실·정확히 한 번 정산·귀환을 보여 준다. 자동·수동 방식의 동일 판정, 교전 시작부터 종료까지 해당 부대의 새 명령 잠금과 전투 전체 후퇴는 실제 구현된 장면만 담는다.
5. 전력 배분과 운용 결정, 새 응답 수신 및 목표 원장을 보여 준다. 연기·실패는 성공처럼 편집하지 않는다.
6. 별도 짧은 실패 경로와 승인 자산 원본/감축/Unity 다각도·해시/권리 보드를 첨부한다.

현재 학동 위치와 분대·선택 수치는 승인 대기다. 대본의 동선은 최종 승인·구현과 일치할 때만 촬영에 사용한다. 특정 편집 앱·새 서비스·유료 생성 도구는 필요하지 않다. ffmpeg는 로컬에 존재하지만 입력 영상이 없는 상태에서 실행하지 않았다.

## 한국어 약 1분 피치 초안 — 실제 검증 후 시제 확정

《서울:전국》은 대정전 이후 서울의 지하철과 생활권에서 살아가는 사람들의 전략 RPG입니다. 이번 시연은 신종목과 작은 분대가 귀환합성국의 송수신부를 확보하는 원정을 중심으로 구성합니다. 부품을 가져오면 미귀환자의 응답을 다시 받는 귀환망을 보강할 수 있지만, 창고 근처 주민도 그 부품으로 생활 전력을 유지합니다. 플레이어는 이동 시간과 통행권을 따져 길을 고르고, 주민과 회수 수량을 협의하며, 다른 세력의 움직임에 대응합니다. GURPS 4판 개인 판정과 노랜드식 진행·UI, 시간 기반 캠페인을 설계 방향으로 삼으며, 싸움의 결과와 손실은 원정에 남도록 합니다. 원정을 마친 뒤에는 중계 전력과 의무소 냉장 전력의 순서를 정해야 합니다. 목표는 사람들의 동의를 얻어 장비를 가동하고 하나의 새 응답을 끝까지 받는 것입니다. 공개 빌드에서 검증된 장면만 최종 영상과 피치에 포함합니다.

## English pitch draft — not a shipped-feature claim

Seoul Subway States (the current English wiki title) is a strategy RPG about people living along Seoul’s subway network after the Great Blackout. This showcase is designed around Shin Jongmok and a small squad recovering a transmitter to extend the reach of an existing civilian return network. Nearby residents need the same components to keep their homes powered. The player must plan around travel time and passage rights, negotiate how much can be recovered, and respond to other factions. The design direction is GURPS Fourth Edition individual resolution, Norland-style flow and UI, and a time-based campaign. The return network is meant to receive replies again from people who have not come home. Individual outcomes are intended to carry losses back into the expedition. On return, relay power competes with the clinic’s refrigeration schedule. The goal is to earn consent, bring the equipment online, and receive a new reply. The final recording will show only interactions verified in the public build.

[문서] 방향 근거: [소유자 결정 13·14, 고정 커밋](https://github.com/islee23520/seoul-dengoku/blob/5a98964518f0e7110e91ba37e7e9590135be21c1/Intent.md). 추가 근거는 [GDD #33](https://github.com/islee23520/seoul-dengoku-gdd/pull/33), head `97e504adf8411208e3b03d4e99b9e4af1a41b23a`(OPEN)다. 시간 기반 이동과 GURPS 개인 판정, 노랜드식 진행은 현재 설계 방향이며, 위 대본은 [추론] 제작안이다. [미확인] 공개 캠페인 구현, 출품용 영문 제품명 확정, 자산 권리와 제출 URL.

## 최종 제출물 계약

- 끊지 않은 원본 워크스루와 동일 연속성을 유지한 제출용 영상(트레일러 컷 금지), 실제 녹화일·공개 URL·소스/빌드 SHA, 파일 SHA-256.
- 출처·권리 확인된 에셋 보드. 현재 보류 자산 14개는 승인 보드로 승격하지 않는다.
- 녹화 내용과 한영 자막/피치 문장 대조. 위 초안의 미구현 문장은 제거하거나 미래 계획으로 명시한다.
- 로그인 없이 접근 가능한 링크에서 영상 재생·다운로드 검증. 현재 빈 링크나 임의 주소를 제출물로 만들지 않는다.

소유자의 #290 공개 빌드와 #294 원본/권리 인계를 받으면 #291을 먼저 통과시킨 뒤 촬영한다. 이 문서만으로 #292 완료라고 주장할 수 없다.

## 2026-09-28 14:23 UTC 화면 지시 반영

[문서] https://github.com/islee23520/seoul-dengoku/issues/277 및 각 이슈 본문(14:23 UTC 수정)을 기준으로 한다. 생활·거점, 전략 지도, 전투는 별도 상태 화면이며 세 화면 모두 거의 수직으로 내려다보는 탑다운 자유 카메라로 팬·줌·회전을 한다. 지평선·눈높이·시네마틱·얕은 아이소 구도는 사용하지 않는다. 각도·시야각 값은 미정이다. 인물 초상은 해당 캐릭터 3D 모델을 전용 카메라로 찍은 인게임 렌더다. 실사풍 비례·가는 흔들림 선·해칭·저채도 평면색과 3D 셀+해칭을 화면 검수 기준으로 삼는다. 이 항목은 검수 계약이며 구현·촬영 완료 기록이 아니다.


추가 촬영 계약: 목표 사슬1→5의 정상 완료는 **한 번의 연속 플레이**로 담는다. 시간 압축·장면 건너뛰기·트레일러 컷으로 미구현 단계나 접근 실패를 숨기지 않는다. 실패 분기는 별도 연속 녹화다. 앞/중간/끝 프레임을 동일 공개 빌드 액션 로그와 대조하고 `ffprobe -v error -show_entries format=duration -of json <recording>`의 duration>0과 실제 재생을 확인한다. 위 명령은 녹화물이 생긴 뒤 실행할 수용 절차이며 이번에 실행한 증거가 아니다.

최종 한영 피치는 “미귀환자의 응답을 다시 받는 귀환망” / “a return network that receives replies again from people who have not come home”를 목표 문장으로 사용한다. 화풍 설명은 “실사풍 비례와 후지모토 타츠키 화풍의 선·해칭·저채도 색” / “realistic proportions with Tatsuki Fujimoto-inspired linework, hatching and muted colors”이며 실제 공개 장면에서 확인된 표현만 완료형으로 읽는다. 현재 피치는 미촬영 초안이다.
