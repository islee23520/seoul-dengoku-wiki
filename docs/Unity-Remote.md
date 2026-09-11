# Unity Remote로 게임 확인하기

`tools/unity-remote`는 private 저장소 `islee23520/unity-remote`의 고정된 Git submodule이다. Unity 프로젝트는 `Game/`이며, submodule 안의 `unity-package`를 local UPM dependency로 사용한다. 브라우저는 broker에 연결하고, Unity Editor는 같은 머신의 broker로 연결한다.

## 처음 설치

저장소 루트에서 실행한다. 두 private 저장소에 대한 Git 접근 권한이 필요하다.

```powershell
git submodule update --init --recursive
npm --prefix tools/unity-remote ci
npm --prefix tools/unity-remote run build
npm --prefix tools/unity-remote test
```

Submodule 버전은 상위 저장소의 gitlink로 고정한다. `git submodule update --remote`는 설치에 필요하지 않다.

## Broker 시작

별도 터미널에서 실행하고 터미널을 유지한다. 작업 디렉터리는 반드시 submodule 루트여야 한다. 여기에서 web build와 session token을 찾는다.

```powershell
Set-Location tools/unity-remote
npm run dev
```

기본 주소는 `http://127.0.0.1:4173`이다. 같은 LAN의 다른 기기는 시작 로그에 표시되는 LAN 주소를 사용한다. Tailscale 주소도 지원한다. 이 설치는 router port forwarding이나 외부 공개 배포를 구성하지 않는다.

로컬에서만 사용할 때는 실행 전에 `$env:UNITY_REMOTE_BIND = '127.0.0.1'`로 제한한다. 종료는 broker 터미널에서 `Ctrl+C`다.

## Unity Editor 연결

Broker를 먼저 시작한 뒤, 저장소 루트의 별도 PowerShell에서 다음을 실행한다. 설치된 Editor 경로가 다르면 첫 줄을 바꾼다.

```powershell
$editor = 'E:/Unity/Editor/6000.7.0a5/Editor/Unity.exe'
$previousBroker = $env:UNITY_REMOTE_BROKER
$previousToken = $env:UNITY_REMOTE_TOKEN
try {
    $env:UNITY_REMOTE_BROKER = 'http://127.0.0.1:4173'
    $env:UNITY_REMOTE_TOKEN = (Get-Content -Raw 'tools/unity-remote/.unity-remote-token').Trim()
    Start-Process -FilePath $editor -ArgumentList '-projectPath', "`"$((Resolve-Path Game).Path)`""
} finally {
    $env:UNITY_REMOTE_TOKEN = $previousToken
    $env:UNITY_REMOTE_BROKER = $previousBroker
}
```

이미 실행 중인 Editor에는 새 환경 변수가 전달되지 않는다. 해당 Editor를 정상 종료한 뒤 위 명령으로 다시 열거나, `Preferences > Unity Remote`에서 broker와 현재 session token을 지정한다. 환경 변수가 Preferences보다 우선한다. Preferences로 연결하려면 해당 환경 변수 없이 Editor를 열어야 한다.

Broker는 `UNITY_REMOTE_TOKEN` 환경 변수가 없으면 매번 새 token을 생성한다. Token이 바뀌었다면 Editor도 새 token으로 연결해야 한다. Token은 submodule의 ignored 파일에만 두고 commit하거나 공유 로그에 붙이지 않는다. Broker는 submodule 루트에 token 파일을 쓰지만 connector는 `Game/.unity-remote-token`을 읽으므로 기본 자동 탐색만으로는 연결되지 않는다.

시작 중 Script Updating Consent 또는 Input System 설정 대화상자가 나타나면 기존 소스·설정을 유지하도록 `No` / `Don't Enable`을 선택한다. 이 대화상자가 열린 동안에는 socket 인증에 성공해도 실제 조회가 `504 UNITY_TIMEOUT`으로 실패할 수 있다.

## 브라우저에서 확인

1. Broker 시작 로그의 one-time bootstrap URL을 열어 session을 인증한다. 또는 기본 주소의 session form에 현재 token을 입력한다. Bootstrap URL 역시 인증 정보이므로 문서나 공개 메시지에 저장하지 않는다.
2. 실제 `Game` 프로젝트와 열린 scene의 hierarchy가 표시되는지 확인한다. Demo hierarchy가 보이는 것만으로 Editor 연결 성공은 아니다.
3. `Assets/Scenes/Foundation.unity`처럼 카메라가 있는 게임 scene을 열고 Game View의 실제 frame을 확인한다. `Bootstrap`은 Edit Mode에서 카메라가 없다. Editor가 없으면 `/api/game-view`는 `503 DISCONNECTED`를 반환한다. 현재 upstream frame은 카메라를 RenderTexture에 그린 이미지이며, screen-space overlay UI까지 포함하는 Editor Game 탭 전체 캡처는 아니다.
4. Hierarchy에서 실제 GameObject를 선택해 Inspector의 components와 serialized properties를 확인한다. 이 도구의 기본 확인 단위는 scene object이며, 전체 AssetDatabase 파일 브라우저와 동일하지 않다.
5. 상단 Play/Stop으로 Play Mode를 제어한다. Game View 입력 전달은 Play Mode에서 사용한다. 속성 변경과 scene 저장은 별도 동작이므로 확인만 할 때는 변경하거나 저장하지 않는다.

상세 기능과 설정의 원본은 [submodule README](../tools/unity-remote/README.md)다.
