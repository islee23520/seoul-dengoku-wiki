# Into the Breach — 게임 로직 백과사전

> 출처 인계: [공유 조사 색인](../../.omo/research/README.md). 로컬 sources.json·원문 패킷 언급은 조사 당시 기록이며 이 전달에 원시 자료가 포함된다는 뜻이 아니다. 누락된 ID는 미확인으로 남긴다.

- 개발: Subset Games(FTL 제작진), 2018-02-27 출시, Windows/macOS/Linux, 2022년 무료 대규모 업데이트 "Advanced Edition(AE)" [S-STEAM]
- 장르: 턴제 전술 + 런 기반 로그라이트. 90 Metacritic [S-STEAM]
- 핵심 특징: **완전 정보 턴 전술** — 적의 다음 행동이 전부 예고(텔레그래프)되고, 명중률·회피 판정이 없다(유일한 예외: Grid Defense) [S-STEAM][S-WIKI-GRID]
- 표기: [문서]=공식/위키 원문, [추론]=원문에서 도출한 해석, [미확인]=본 조사에서 원문 확인 불가

## 1. 개요

지하에서 번식하는 거대 생물 **Vek**에게 인류 잔존 문명이 위협받는 세계. 플레이어는 미래에서 온 메크 3기 소대를 조종해 4개 기업 섬을 방어하고 최종 결전 **Volcanic Hive**에서 타임라인을 구원한다 [S-STEAM].

설계상 정체성:
- 전투는 **8×8 타일 그리드**에서 벌어진다 (위키 좌표 A–H열/1–8행 체계) [S-WIKI-HIVE][추론]
- **모든 적 공격이 사전 표시**된다 [S-STEAM][문서]
- 패배해도 시간여행으로 파일럿 한 명을 다음 타임라인에 보낸다 [S-STEAM][문서]
- 유일한 확률 요소는 Grid Defense이며 시드 기반(§6) [S-WIKI-GRID][문서]

## 2. 코어 루프

전술 루프(미션 단위):
1. **적 의도 표시** — Vek는 플레이어 턴 전에 이동해 공격 대상 타일을 조준. 죽이거나 밀거나 무효화하면 취소 [S-WIKI-VEK][문서]
2. **플레이어 턴** — 메크 3기 각각 이동+행동. 행동 전 이동 취소 가능 [S-WIKI-TIPS][문서]
3. **타임라인 UI** — 우측 상단에 턴 실행 순서: 환경→화상/전기→Vek 공격→NPC→부화 [S-WIKI-TIPS][문서]
4. **Reset Turn** — 전투당 1회 되감기 [S-WIKI-RESET][문서]
5. 적 턴 → 부화 → 다음 턴. 미션은 보통 5턴 [S-WIKI-VEK][문서]

전략 루프(섬 단위): 미션 4회 → HQ 리더전 → 섬 완료 → 상점 → 다음 섬 [S-WIKI-ISLANDS][문서]
메타 루프: 런 종료 시 파일럿 1명 인계; 업적 코인으로 소대 해금 [S-WIKI-PILOTS][S-WIKI-ACH][문서]

## 3. 진행 구조

- 런 = 4개 섬 중 2/3/4개 선택 + Volcanic Hive. 2섬 클리어 시 Hive 개방 [S-WIKI-ISLANDS][문서]
- 각 섬은 8개 지역: HQ 1 + 임무 지역 7. **미션 4회 완수 시 HQ전 발동, 잔여 3지역 봉인** [S-WIKI-ISLANDS][문서]
- 최종 결전 2단계: 지상(초화산, 5턴 후 지진) → 지하(Renfield Bomb 5턴 방어) [S-WIKI-HIVE][문서]
- 메타: 업적 70개(본편 55+AE 15), 코인으로 소대 해금(2~25코인) [S-WIKI-ACH][S-WIKI-SQUADS][문서]
- 난이도 곡선: 섬 1(기본 무장) → 섬 3~4(Alpha 급증) → Hive [S-WIKI-DIFF][문서]

## 4. 경제 시스템

자원 3종 [S-WIKI-REP][S-WIKI-GRID][S-WIKI-CORE][문서]:
- **Grid Power**: 시작 5, 최대 7. 건물 피해 시 감소, 0이면 런 패배. 섬 간 유지. 초과분은 Grid Defense로 전환
- **Corporate Reputation**: 목표 달성 획득. 무기 2점/Reactor Core 3점/전력 1점. **섬이 바뀌면 소멸**
- **Reactor Core**: 메크 업그레이드. 무기 전력/체력/이동에 1코어=1전력. Time Pod·평판 구매
- **코인**: 업적 보상. 소대 해금 전용

## 5. 캐릭터/파티 시스템

- 소대는 **메크 3기**. 파일럿 사망 시 AI 파일럿 대체(스킬 없음) [S-WIKI-PILOTS][문서]
- **파일럿 XP**: Vek 처치 시 HP만큼 획득. 25XP·추가 50XP로 스킬 2개 [S-WIKI-PILOTS][S-WIKI-SKILLS][문서]
- **고유 파일럿(Time Travelers)**: Ralph Karlsson(경험치 보너스), Harold Schmidt(수리 시 밀기), Abe Isamu(장갑), Bethany Jones(실드), Henry Kwan(적 통과), Gana(어디든+인접 데미지), Prospero(비행), Lily Reed(+3 이동), Chen Rong(공격 후 이동), Camila Vera(거미줄 무시), Isaac Jones(리셋+1), Silica(무이동 시 2행동), Archimedes(사격 후 재이동) 등 [S-WIKI-PILOTS][문서]
- **시크릿 파일럿**: 특정 지형 파괴로 Strange Object 발견 → 획득(Kazaaakpleth/Mafan/Ariadne — FTL 테마) [S-WIKI-PILOTS][문서]
- **사망**: 파일럿 사망은 영구(런 내). 메크가 살아있으면 파일럿 생존 — "메크가 대신 맞는 것이 이득" [S-WIKI-TIPS][문서]. 런 종료 시 1명 다음 타임라인 인계 [S-WIKI-PILOTS][문서]

## 6. 전투 시스템 (핵심 — 완전 정보 전술)

**그리드와 지형**: 8×8. 산(장애물), 물/용암(밀어 넣으면 즉사), 불, 연막, A.C.I.D., 얼음, 구덩이 [S-WIKI-WEAPONS][문서]

**적 의도**: Vek는 매 턴 조준(빨간 표시). 플레이어는 처치/밀기/방패/몸으로 막기 중 선택 [S-WIKI-VEK][문서]

**밀기(Push)**: 데미지와 함께 1타일 밀어내기. 물에 빠뜨려 즉사, 서로 부딪히게(충돌당 1데미지), 부화 타일 차단, 산에 밀어 이동 상쇄. 당기기·위치 교환·공격 방향 반전까지 포함한 **위치 조작 계열이 데미지 계열과 동격의 해결책**. 아군 오사는 기본 ON — 아군을 밀어 위험에서 탈출시키는 용도 [S-WIKI-WEAPONS][문서]

**타임라인 UI**: 턴 사건 순서 전체 공개. "적끼리 치게 만들고 최종 위치를 예측하라" [S-WIKI-TIPS][문서]

**Rewind**: 전투당 1회 무료. 시드 기반이라 저항 결과도 동일(단, 시드 소모 순서 조작 테크닉 존재) [S-WIKI-RESET][S-WIKI-GRID][문서]

**Vek 생태**: Common(섬당 3종)/Rare/Psion(부양, 패시브 부여)/Minor/Hive Leader(HP 6–7). Alpha 변종 강화. 스폰은 임의 추첨이나 미션 시작 후엔 전부 확정 공개 [S-WIKI-VEK][문서]

**무RNG가 유효한 이유 [추론]**:
1. 책임 소재 완전 이전 — 패배는 "읽기 실패"
2. 퍼즐화된 턴 — 결정적 탐색이 전술의 전부
3. 상호작용 폭발 — 밀기+지형+부화로 해 수가 폭발적
4. 되감기와 정합 — 리셋이 도박이 아니라 정보 획득
5. 압박 재배치 — 운이 아니라 우선순위 희생이 압박원
6. 완전주의 보상 — Perfect 과제가 순수 숙련 증명

## 7. 지도/세계 구조

- 4개 섬 + Volcanic Hive. 섬마다 지역명·지형·보너스 목표 무작위 생성 [S-WIKI-ISLANDS][문서]
- 섬: Museum(Archive)/Desert(R.S.T.)/Ice(Pinnacle)/Factory(Detritus) [S-WIKI-ISLANDS][문서]
- 지역 8개 = HQ 1 + 임무 7. 4회 완수 시 HQ전, 잔여 봉인(선택과 희생) [S-WIKI-ISLANDS][문서]
- 3목표 미션은 고위협(Alpha+증원) [S-WIKI-MISSIONS][문서]
- 미션당 5턴(일부 4턴), 섬당 임무 5개 [S-WIKI-MISSIONS][문서]

## 8. 외교/세력

외교 시스템 없음(Vek는 교섭 불가). **기업 평판·협조**가 대신 [S-WIKI-REP][추론+문서]:
- 4개 기업이 각 섬 지배. 각 기업 파일럿(CorPilot)·CEO 등장 [S-WIKI-PILOTS][문서]
- Corporate Reputation은 기업 상점에서 환전. 섬 간 이월 불가 = "현지 신용" [S-WIKI-REP][문서]
- 소대 10종은 각각 기업 계열 소속 [S-WIKI-SQUADS][문서]

## 9. 이벤트/내러티브

- 선택지 이벤트 없음. 분기는 임무 목표·보상 선택과 Time Pod·시크릿 발굴 [추론]
- **Time Pod**: 미션 중 낙하. 회수 시 Reactor Core 확정+추가 보상. 섬 1–2는 1개, 3–4는 2개; 15% 확률로 Strange Pod(시크릿 파일럿) [S-WIKI-POD][문서]
- **Perfect Island**: 모든 보너스 목표+타임포드 달성+전멸 없음 → 보상 택1 [S-WIKI-MISSIONS][문서]

## 10. 난이도/압박

Easy/Normal/Hard/Unfair(AE) [S-WIKI-DIFF][문서]
- Easy: 민간인 500/지역, Alpha는 3목표 미션에만
- Hard: 1,500명, 섬1부터 Alpha 가능, Rare 2종
- Unfair: Grid Defense 0 시작, 섬4 일반 미션마다 보스

**압박원 [추론]**:
1. 행동 예산 부족 — 3기 × 이동+행동으로 복수 공격 무효화
2. 건물=체력바 — Grid 0이면 패배. 메크는 무료 수리, 건물은 수리 불가
3. 동시 목표 긴장 — 평판·전력·코어·포드 전부 지키려다 하나 잃음
4. 부화 압박 — 매 턴 신규 Vek
5. 영구 파일럿 사망
6. 평판 소멸 — 섬 내 소비 강제

## 출처
- [S-STEAM] Steam Appdetails API 590380
- [S-WIKI-SQUADS/PILOTS/SKILLS/ISLANDS/MISSIONS/REP/GRID/VEK/RESET/POD/ACH/DIFF/HIVE/CORE/WEAPONS/TIPS] intothebreach.fandom.com api.php 전문 (2026-09-06)
