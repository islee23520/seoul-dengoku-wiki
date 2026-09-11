# Unity Remote로 게임 확인하기

`External/unity-remote`는 private 저장소 `islee23520/unity-remote`의 고정된 Git submodule이다. Unity 프로젝트는 `Game/`이며, submodule 안의 `unity-package`를 local UPM dependency로 사용한다. 브라우저는 broker에 연결하고, Unity Editor는 같은 머신의 broker로 연결한다.

## 처음 설치

저장소 루트에서 실행한다. 두 private 저장소에 대한 Git 접근 권한이 필요하다.

```powershell
git submodule update --init --recursive
npm --prefix External/unity-remote ci
npm --prefix External/unity-remote run build
npm --prefix External/unity-remote test
```

Submodule 버전은 상위 저장소의 gitlink로 고정한다. `git submodule update --remote`는 설치에 필요하지 않다.

> 현재 token-free 변경은 `External/unity-remote`의 미커밋 로컬 변경이다. 상위 저장소의 기존 pin `7bfe64f`만 받은 fresh clone에는 아래 token-free 동작이 아직 포함되지 않는다. Submodule 변경을 commit/publish하고 상위 gitlink를 갱신하기 전에는 이 제한을 유지한다.

## Broker 시작

별도 터미널에서 실행하고 터미널을 유지한다. 작업 디렉터리는 반드시 submodule 루트여야 한다. 여기에서 web build를 찾는다. Session token 파일은 생성하거나 읽지 않는다.

```powershell
Set-Location External/unity-remote
npm run dev
```

기본 주소는 `http://127.0.0.1:4173`이다. 인증 토큰, bootstrap URL, 브라우저 session 로그인은 필요 없다. 같은 LAN의 다른 기기는 시작 로그에 표시되는 LAN 주소를 사용한다. Tailscale 주소도 지원한다. 이 설치는 router port forwarding이나 외부 공개 배포를 구성하지 않는다.

로컬에서만 사용할 때는 실행 전에 `$env:UNITY_REMOTE_BIND = '127.0.0.1'`로 제한한다. 기본 bind는 `0.0.0.0`이므로 연결 가능한 LAN/Tailscale 기기는 토큰 없이 Editor 조회·수정·Play 제어를 할 수 있다. 기존 Host/Origin 허용 검사는 유지되지만 사용자 인증을 대신하지 않는다. 신뢰하는 네트워크에서만 사용하고 공용 인터넷에 노출하지 않는다. 종료는 broker 터미널에서 `Ctrl+C`다.

## Unity Editor 연결

Broker를 먼저 시작한 뒤, 저장소 루트의 별도 PowerShell에서 다음을 실행한다. 설치된 Editor 경로가 다르면 첫 줄을 바꾼다.

```powershell
$editor = 'E:/Unity/Editor/6000.7.0a5/Editor/Unity.exe'
$previousBroker = $env:UNITY_REMOTE_BROKER
try {
    $env:UNITY_REMOTE_BROKER = 'http://127.0.0.1:4173'
    Start-Process -FilePath $editor -ArgumentList '-projectPath', "`"$((Resolve-Path Game).Path)`""
} finally {
    $env:UNITY_REMOTE_BROKER = $previousBroker
}
```

기본 broker를 사용한다면 Unity Hub에서 `Game/`을 여는 것만으로도 연결된다. 다른 주소는 `Preferences > Unity Remote`의 Broker URL 또는 `UNITY_REMOTE_BROKER`로 지정한다. 환경 변수가 Preferences보다 우선하며, 이미 실행 중인 Editor에는 새 환경 변수가 전달되지 않는다.

Broker를 재시작해도 Editor connector는 자동 재연결한다. `UNITY_REMOTE_TOKEN`, 기존 `.unity-remote-token` 파일, 기존 token EditorPrefs는 사용하지 않는다. 이전 버전에서 갱신했다면 broker를 재시작하고 web build를 다시 만든 뒤 Editor의 package 재컴파일을 완료한다. Asset Import Worker와 batchmode Editor는 자동 연결하지 않는다.

시작 중 Script Updating Consent 또는 Input System 설정 대화상자가 나타나면 기존 소스·설정을 유지하도록 `No` / `Don't Enable`을 선택한다. 이 대화상자가 열린 동안에는 socket 연결에 성공해도 실제 조회가 `504 UNITY_TIMEOUT`으로 실패할 수 있다.

## 브라우저에서 확인

1. 새 브라우저 창에서 `http://127.0.0.1:4173/` 또는 시작 로그의 LAN 주소를 연다. 토큰 입력 없이 workspace가 바로 열린다.
2. 실제 `Game` 프로젝트와 열린 scene의 hierarchy가 표시되는지 확인한다. Demo hierarchy가 보이는 것만으로 Editor 연결 성공은 아니다.
3. `Assets/Scenes/Foundation.unity`처럼 카메라가 있는 게임 scene을 열고 Game View의 실제 frame을 확인한다. `Bootstrap`은 Edit Mode에서 카메라가 없다. Editor가 없으면 `/api/game-view`는 `503 DISCONNECTED`를 반환한다. 현재 upstream frame은 카메라를 RenderTexture에 그린 이미지이며, screen-space overlay UI까지 포함하는 Editor Game 탭 전체 캡처는 아니다.
4. Hierarchy에서 `poc-prop-ticket-gate` 같은 실제 Foundation prop을 선택해 Inspector의 components와 serialized properties를 확인한다. 이 도구의 기본 확인 단위는 scene object이며, 전체 AssetDatabase 파일 브라우저와 동일하지 않다.
5. 상단 Play/Stop으로 Play Mode를 제어한다. Game View 입력 전달은 Play Mode에서 사용한다. 속성 변경과 scene 저장은 별도 동작이므로 확인만 할 때는 변경하거나 저장하지 않는다.

상세 기능과 설정의 원본은 [submodule README](../External/unity-remote/README.md)다.

