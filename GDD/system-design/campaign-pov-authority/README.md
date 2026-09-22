# 캠페인 POV와 권한 전이

이 디렉터리는 캠페인 시점(POV)과 권한 전이를 설명하는 **설계 청사진**이다. Archify가 JSON에서 만든 HTML은 문서용 도식이다. 실제 게임 UI가 아니며, 구현 완료를 주장하지 않는다.

## 소유자 결정으로 잠근 것

- 플레이어는 국가가 아니라 **지금 조종하는 살아 있는 한 인물**이다.
- 캠페인 시점은 그 인물의 **위치와 알려진 정보**에 묶인다. 지정 대리가 이 시점을 바꾸지 않는다.
- 권한은 한 번에 전권이 되지 않는다. **일반 구성원 → 파티 지휘관 → 관직 보유자 → 팩션 통치자**로만 늘어난다.
- **직접 제어**는 현재 인물 분대, 개인 소유, 명시 위임받은 분대에만 열린다.
- **자기 세력의 미위임 자산**은 제안·승인·거부로만 움직인다. 다른 세력은 이 명령 층이 아니라 외교다.
- 파티 지휘관은 동행 전원에 자동 직접 제어를 가지지 않는다. 동의한 위임 분대만이다.
- 관직 보유자의 관할은 제안·승인·거부 권한이다. 직접 제어는 별도 위임이 있을 때만이다.
- 팩션 통치자도 세력 전역 직접 제어는 없다.
- 포획·실종·통신 단절은 관직·관할 층을 지우지 않고 **신규 원격 전송만 잠근다**. 현장 개인 행동의 가부는 신체 상태에 따르며 이 도식 밖이다.
- 복원 또는 **정식 지정 대리**는 위임 범위에서 현장 수락·집행 채널을 연다. 플레이어의 지도 POV는 현재 인물로 남는다. 잠긴 명령을 재평가하지 않고 바로 집행하지 않는다.

수치·클래스 이름·임시 분대장의 세부 권한은 이 도식이 새로 정하지 않는다. 그건 [`Hero-Squads-and-Simultaneous-Turns.md`](../../rules/Hero-Squads-and-Simultaneous-Turns.md)의 설계 제안으로 남긴다.

## 역할과 권한

| 역할 | 직접 제어 | 제안·승인·거부 | 시점 |
|---|---|---|---|
| 일반 구성원 | 현재 인물 분대·개인 행동 | 없음 | 현재 인물 위치·지식. 불변 |
| 파티 지휘관 | 명시 위임·동의한 동행 분대만 | 자기 세력의 미위임 자산 | 현재 인물 POV 유지 |
| 관직 보유자 | 명시 위임만 | 관할의 제안·승인·거부 | 현재 인물 POV 유지 |
| 팩션 통치자 | 현재 인물 분대·소유·명시 위임만 | 자기 세력의 미위임 자산 | 현재 인물 POV 유지 |
| 포획·실종·단절 | 신규 원격 전송 잠김. 현장 개인 행동은 도식 밖 | 신규 원격 전송 잠김. 관직·관할 층은 보임 | 현재 인물 POV 유지 |
| 복원·지정 대리 | 대리의 위임 범위에서 현장 수락·집행 채널 | 위임 범위 | 플레이어 지도 POV는 현재 인물 불변 |

## 전이

1. 시점은 현재 인물에서 시작하고, 권한 층이 올라가도 POV 인물이 바뀌거나 여럿이 되지 않는다.
2. 파티 지휘·관직·통치는 점진 권한이다. 상위 역할이 직접 제어를 세력 전역으로 넓히지 않는다.
3. 원격 명령은 `초안 → 전송 → 수락|거절 → 집행 → 영수증`이다. 기지 스냅샷은 초안·전송에서 고정되고, 판정은 그 스냅샷만 쓴다. 전송은 지연될 수 있다.
4. 각 명령은 책임 인물 또는 관직, ETA, 거절 사유 또는 집행 결과를 남긴다.
5. 통신 단절·포획은 지연과 다르다. 전송 전이나 전송 중에 신규 원격 전송을 잠근다.
6. 복원 또는 지정 대리는 잠긴 명령을 재평가한 뒤 전송·판정으로 되돌린다. 낡은 명령을 바로 집행하지 않는다.

## 도식

| 파일 | 종류 | 설명 |
|---|---|---|
| [`pov-authority-flow.json`](pov-authority-flow.json) | workflow | POV 불변, 점진 권한, 직접 제어 한계, 고립·대리 |
| [`remote-order-lifecycle.json`](remote-order-lifecycle.json) | lifecycle | 원격 명령 본선, 기지 스냅샷, 지연, 잠김, 거절, 재평가 재전송 |
| [`campaign-map-layers.json`](campaign-map-layers.json) | architecture | 지도 권한 층. 세력 전역 직접 제어 없음 |

같은 이름의 `.html`은 아래 명령이 JSON에서 만든 산출물이다. Archify `deliver`는 **인라인 SVG를 담은 단일 HTML**을 쓴다. 별도 `.svg` 파일은 만들지 않는다. 뷰어의 SVG 보내기는 열람 기능일 뿐 저장소 정본이 아니다.

## 비목표

- Unity·Backend 구현, 새 런타임 UI, 허브 게시 경로
- ADR-008 병합. 이 문서는 미병합 ADR을 전제로 쓰지 않는다. 명령 판정 주체는 **권위 있는 게임 서버**로만 적는다
- 로컬 미리보기 서버, Archify `preview`, `visual-check`
- 카드 전투·영웅 직접 액션·세력 전역 전권 UI
- 다른 세력 자산에 대한 명령 제안. 그건 외교다

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
