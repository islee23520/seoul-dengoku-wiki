# 캠페인 POV와 권한 전이

이 디렉터리는 캠페인 시점(POV)과 권한 전이를 설명하는 **설계 청사진**이다. Archify가 JSON에서 만든 HTML은 문서용 도식이다. 실제 게임 UI가 아니며, 구현 완료를 주장하지 않는다.

## 소유자 결정으로 잠근 것

- 플레이어는 국가가 아니라 **지금 조종하는 살아 있는 한 인물**이다.
- 캠페인 시점은 그 인물의 **위치와 알려진 정보**에 묶인다. 팩션 전역을 한눈에 직접 조종하는 전권은 없다.
- 권한은 한 번에 전권이 되지 않는다. **일반 구성원 → 파티 지휘관 → 관직 보유자 → 팩션 통치자**로만 늘어난다.
- **직접 제어**는 개인 행동, 소유 자산, 위임받은 분대에만 열린다.
- 타 팩션·미위임 자산은 **제안·승인·거부**로만 움직인다.
- 포획·실종·통신 단절이면 **원격 전송을 잠근다**. 복원되거나 대리 인물이 확정된 뒤에만 권한을 다시 읽는다.

수치·클래스 이름·임시 분대장의 세부 권한은 이 도식이 새로 정하지 않는다. 그건 [`Hero-Squads-and-Simultaneous-Turns.md`](../../rules/Hero-Squads-and-Simultaneous-Turns.md)의 설계 제안으로 남긴다.

## 역할과 권한

| 역할 | 직접 제어 | 제안·승인·거부 | 시점 |
|---|---|---|---|
| 일반 구성원 | 개인 행동만 | 없음 | 자신의 위치·지식 |
| 파티 지휘관 | 동행 파티 | 파티 밖 타 자산 | 자신과 동행 범위 |
| 관직 보유자 | 관할·위임 자산 | 관할 밖 타 팩션 자산 | 관할에서 알려진 정보 |
| 팩션 통치자 | 개인·소유·위임만 | 팩션 안 미위임·타 팩션 자산 | 전권이 아닌 결재 시야 |
| 포획·실종·단절 | 없음. 전송 잠김 | 없음 | 끊긴 마지막 기지 정보 |
| 복원·대리 인물 | 새 현재 인물의 권한으로 재평가 | 새 역할에 따름 | 대리 인물의 POV |

## 전이

1. 시점은 현재 인물에서 시작하며, 권한 층이 올라가도 POV 인물이 여럿이 되지 않는다.
2. 파티 지휘·관직·통치는 점진 권한이다. 상위 역할이 하위 직접 제어 범위를 자동으로 팩션 전역으로 넓히지 않는다.
3. 원격 명령은 `초안 → 전송 → 수락|거절 → 집행 → 영수증`이다. 전송은 지연될 수 있고, 판정은 전송 시점의 알려진 정보 스냅샷만 쓴다.
4. 각 명령은 책임 인물 또는 관직, ETA, 거절 사유 또는 집행 결과를 남긴다.
5. 통신 단절·포획은 지연과 다르다. 잠긴 뒤에는 복원 또는 대리가 있기 전까지 전송을 재개하지 않는다.

## 도식

| 파일 | 종류 | 설명 |
|---|---|---|
| [`pov-authority-flow.json`](pov-authority-flow.json) | workflow | POV 불변, 점진 권한, 직접 제어 한계, 고립·대리 |
| [`remote-order-lifecycle.json`](remote-order-lifecycle.json) | lifecycle | 원격 명령 수명, 기지 스냅샷, 지연, 잠김, 거절, 대리 |
| [`campaign-map-layers.json`](campaign-map-layers.json) | architecture | 지도 권한 층. 전지적 팩션 전역 직접 제어 없음 |

같은 이름의 `.html`은 아래 명령이 JSON에서 만든 산출물이다. Archify `deliver`는 **인라인 SVG를 담은 단일 HTML**을 쓴다. 별도 `.svg` 파일은 만들지 않는다. 뷰어의 SVG 보내기는 열람 기능일 뿐 저장소 정본이 아니다.

## 비목표

- Unity·Backend 구현, 새 런타임 UI, 허브 게시 경로
- ADR-008 병합. 이 문서는 미병합 ADR을 전제로 쓰지 않는다. 명령 판정 주체는 **권위 있는 게임 서버**로만 적는다
- 로컬 미리보기 서버, Archify `preview`, `visual-check`
- 카드 전투·영웅 직접 액션·팩션 전역 전권 UI

## 생성 명령

설치된 스킬은 `~/.omo/skills/archify`이다. 패키지 버전 `2.17.0-dev.1`, 출처 `https://github.com/tt-a1i/archify`, 설치 시 `main` 커밋 `5289f6867f048a7450ec5718f58459613a84cf41`, 스킬 폴더 해시 `4fb3047dc332ef70c089b99bf4b402c7fa78a5dd`.

작업 디렉터리는 `GDD/system-design/campaign-pov-authority`이다. `visual-check`와 `preview`는 실행하지 않는다.

```bash
ARCHIFY="$HOME/.omo/skills/archify/bin/archify.mjs"
node "$ARCHIFY" validate workflow pov-authority-flow.json --quality standard --json
node "$ARCHIFY" deliver workflow pov-authority-flow.json pov-authority.html --quality standard --json
node "$ARCHIFY" validate lifecycle remote-order-lifecycle.json --quality standard --json
node "$ARCHIFY" deliver lifecycle remote-order-lifecycle.json remote-order-lifecycle.html --quality standard --json
node "$ARCHIFY" validate architecture campaign-map-layers.json --quality standard --json
node "$ARCHIFY" deliver architecture campaign-map-layers.json campaign-map-layers.html --quality standard --json
```

`validate`/`deliver`가 스키마와 구성 9항을 통과한 뒤에만 HTML을 교체한다. 손수 제목만 바꾼 HTML은 정본이 아니다.
