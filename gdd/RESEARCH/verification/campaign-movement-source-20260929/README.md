# #296 원문 대조와 실제 단위 검산 — 2026-09-29

**상태: proposal / 오프라인 연구.** [GDD #32](https://github.com/islee23520/seoul-dengoku-gdd/pull/32)의 `campaign-movement-296.json` MOV-01~07 결정을 검산한다. 제품 Core·Unity 데이터·기존 인물 값은 바꾸지 않는다. GAME 기준은 `ac98566ab41132747ae86a3b6825ea5ad2518aeb`, GDD 기준은 병합된 main `09df8e64d198f636b5c43ccdb2d965cacf87de20`이다.

## 확인한 원문

[SJ Games](https://www.sjgames.com/gurps/Lite/)와 [Warehouse23](https://warehouse23.com/products/gurps-lite-fourth-edition)는 공식 제품 확인용이다. 규칙은 [DocDroid 사본](https://www.docdroid.net/lBGne5B/gurps-4e-lite-pdf)의 본문을 직접 대조했다.

- 32쪽; 표지 **AUGUST 2004 EDITION / Rev. 07/12/04**.
- 파일 SHA-256: `56aa72431c4b8a728b3e6eb8efe3b72f3f50afef2b960b55184ae70275a92fb9`.
- 메타데이터 수정일 2008-08-06은 새 판본을 뜻하지 않는다. 공식 서버의 최신 배포 파일과 동일하다는 인증은 없다.
- PDF/인쇄 쪽수가 동일한 p.5/6/22/23/29/31 대조. p.22–23 렌더도 직접 확인했다. 전체 원문·PDF·장문 발췌는 저장소에 복제하지 않는다.

| 원문 쪽 | 확인한 사실 | 검산의 사용 범위 |
|---|---|---|
| 5 | BL=ST²/5 lb, 10lb 이상 반올림 | 정수 ST의 BL을 1/5lb 정수로 표현한다. |
| 6 | Basic Speed=(DX+HT)/4, Basic Move 시작값은 내림 | `baseAttributes`는 BL/Basic Move 수정치 없는 가상 인물용. 실제 구매 Move·수정치를 덮어쓰지 않는다. |
| 22 | 하중 BL×1/2/3/6/10, 이동×1/.8/.6/.4/.2, 내림·하중 하한1 | 경계 같은 경우 낮은 하중등급, 한 무게 단위 초과도 검사한다. |
| 22–23 | 이상적 Hiking 하루 거리 10×Move miles, 지형 .2/.5/1/1.25 | 활동 8시간으로 나누는 것은 신규 제안이다. |
| 29·31 | HP와 FP가 각각 최대의 엄격한 1/3 미만이면 Move 절반 후 올림 | 하중→부상→피로는 조합 해석을 명문화한 후보다. |
| 23·31 | Running은 FP≤1/3, 일반 피로는 FP<1/3 | Hiking이 참조하는 p.31의 엄격한 <를 채택하는 후보. 둘을 오자로 단정하거나 통일하지 않는다. |
| 31 | 도로 Hiking 시간당 1+하중등급 FP; 조용한 휴식 10분당 통상 FP1 회복 | 해당 사건·휴식 일정은 구현하지 않는다. 고정 상태 검산이지 하루 지속 이동 보장은 아니다. |

## 검산과 신규 설계 경계

설계 원장은 GDD의 MOV-01~07 표다. 여기는 재현에 필요한 가상 입력과 산술을 보관한다. `personalMove`는 명시된 Basic Move·BL·짐·HP/FP·보행 가능 상태를 받는다. HP≤0·FP≤0·보행불가·10BL 초과·누락·비정수·범위 초과를 거부하며 기절/의지 판정·부상자 수송을 추측하지 않는다. 이 거부는 GURPS의 절대 행동 불가를 뜻하지 않는다.

후보는 전 보행 구성원 최솟값과 8시간 활동 기준이다. 1mile=1,609,344mm로 환산하면 K=10×1,609,344/(8×3600)=2794/5 환산mm/세계초/Move다. 지형은 간선 작업량에만 적용하여 속도에도 중복 곱하지 않는다. 다섯 태세 계수 1·3/2·1/2·0·0은 프로젝트 제안이며 `campaignRates`는 같은 분모를 다섯 태세에 사용한다. 12시간 대안은 속도2/3이다. 8시간이 실제 무휴식 이동 시간이나 원문의 일일 활동 시간이라는 주장은 없다.

| 가상 분대 | 입력과 유도 | 통상/강행군/매복 속도 W/T |
|---|---|---|
| A | 지휘관 Move6·BL20lb·짐15lb + 병졸8명 각 Move5·BL20lb·짐30lb → 최소4 | 11176/5 · 16764/5 · 5588/5 |
| B | 지휘관 Move6·BL45lb·짐40lb + 병졸12명 각 Move5·BL20lb·짐50lb → 최소3 | 8382/5 · 12573/5 · 4191/5 |

모두 HP/FP12/12를 독립 입력한 가상 인물이다. 최대 HP/FP12는 ST/HT에서 유도한 기본값이 아니며, 별도 구매·수정치를 가진 상태를 가정한다. Lite p.6의 기본 HP=ST, FP=HT를 변경된 원전으로 인용하지 않는다. B의 병졸 한 명이 HP4/12·FP4/12이면 Move3, HP3/12이면2, HP3/12·FP3/12이면1이다. 신종목/실제 병졸 데이터가 아니다.

가상 S0→S1 도로1000m×800W/m=800000W, S1→U0 출입50m×1000W/m+100000W=150000W, U0→U1 지하1000m×2000W/m=2000000W. 총2950000W. 실제 역 좌표나 학동 시설 접근을 정의하지 않는다.

| 관찰 | A | B |
|---|---|---|
| 300세계초 통상 | 670560W, 도로 중간 | 502920W, 도로 중간 |
| 600세계초 통상 | 1341120W, U0 이후391120W | 1005840W, U0 이후55840W |
| 300세계초 강행군 | 1005840W | 754380W |
| 최초 정수 초 도착 관찰 | 1320세계초 | 1760세계초 |

W는 물리 좌표가 아니다. 출입 부가작업은 속도에 비례하며 고정 지연과 다르다. 정수 초의 도착 관찰도 정확한 연속 도착 사건과 다르다. 벽시계 압축비, 분모 변경, 실시간 피로·휴식·태세 전환·동적 봉쇄·전투복귀·전체 지도 탐색은 미구현이다.

## 실행과 결과

GAME 저장소 루트:

```sh
node --check RESEARCH/verification/campaign-movement-source-20260929/source-calculation.mjs
node --check RESEARCH/verification/campaign-movement-source-20260929/source-calculation.test.mjs
node --test RESEARCH/verification/campaign-movement-source-20260929/source-calculation.test.mjs RESEARCH/verification/campaign-movement-20260928/time-motion.test.mjs RESEARCH/verification/campaign-movement-20260928/time-orders.test.mjs
```

2026-09-29 최종 실행 exit0, **20/20**(이번 원문/단위8 + 기존 시간구간4 + 기존 이벤트8), fail0/skip0. 기존 턴 모델의 역사12개 시험은 이 숫자에 포함하지 않는다. 나머지 보존·시간 분할·목표 교체·동일 원장 해시·실제 비용 변경 시 해시 차이·통제권 정지·봉쇄/불법 경로 전체 거부를 확인했다. 기존 연구 코드는 가져와 사용하며 수정하지 않았다. 추가 의존성은 없다.

GDD 검증: materializer59문서, 변경 lock은 제안1문서뿐; 역사29개 source 블록과 frozen source 동일. 뷰어 build/typecheck 및 test3/3 통과, 제안은 공개 카탈로그 제외. GAME의 materializer 테스트는10통과/4실패: main이 `83d33f1`에서 삭제한 `Ref-Songs-of-Silence.md`를 과거52문서 보존 검사가 여전히 요구한다. 제안 이외의 collection/source를 바꾸거나 해당 테스트를 약화하지 않았다. LSP는 미설치/진단 시간 초과여서 성공 근거로 사용하지 않는다.

수치·단위 승인, 실제 캐릭터 BL/Move 수정치, 전체 이동 승인 데이터 validator와 Unity #297은 여전히 후속 조건이다. 이 폴더의 타입/범위 검사는 소유자 승인 레코드 진위검증이 아니다.
