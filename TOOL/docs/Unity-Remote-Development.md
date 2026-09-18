# Unity Remote 개발 안내

Unity Remote는 Editor 계층·프로젝트 상태를 브로커와 JSON CLI로 조회하는 개발 도구입니다. 서브모듈은 `GAME/Assets` 밖의 `TOOL/unity-remote`에 두며, 게임 씬이나 플레이어 런타임에 연결하지 않습니다.

## 고정 버전과 준비

- 원본: `https://github.com/islee23520/unity-remote.git`
- 고정 커밋: `86b0c856823946e7bf1e56279cdd83de69a9bf1d`
- Unity: `6000.7.0a5`
- UPM: `com.islee.unity-remote`, `file:../../TOOL/unity-remote/unity-package`

UPM 상대 경로는 `GAME/Packages` 기준입니다. 패키지의 `Islee.UnityRemote.Editor` 어셈블리는 `includePlatforms: ["Editor"]`이며, 선언된 전이 의존성은 Newtonsoft JSON `3.2.2`입니다.

저장소 루트에서 실행합니다.

```bash
npm --prefix TOOL/tools run remote:setup
npm --prefix TOOL/tools run remote:start
```

setup은 기록된 gitlink를 초기화하고 서브모듈의 잠금 파일로 Node 의존성을 설치한 뒤 CLI·브로커·웹 자산을 빌드합니다. `git submodule update --remote`로 임의 최신 버전을 받지 않습니다. 재실행은 같은 커밋을 유지합니다. 신규 클론에서는 setup을 먼저 끝낸 뒤 Unity가 `Game/`을 열어 로컬 패키지를 해석하도록 합니다.

## Editor와 CLI

이 저장소의 [무창 배치 계약](Unity-Headless-Workflow.md)에 따라 별도 터미널 또는 작업 세션에서 실행합니다. 브로커를 먼저 시작해야 Editor가 프로젝트 토큰을 발견합니다.

```bash
export UNITY_EDITOR=/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity
UNITY_REMOTE_BROKER=http://127.0.0.1:4173 "$UNITY_EDITOR" \
  -batchmode -nographics -projectPath "$PWD/GAME" \
  -logFile "$PWD/.omo/unity-remote-editor.log"
```

상주 연결에는 `-quit`을 넣지 않습니다. 같은 `Game/`에 Editor를 둘 이상 실행하지 않습니다.

```bash
npm --prefix TOOL/tools run remote:cli -- project
npm --prefix TOOL/tools run test:unity-remote
```

`project` 응답의 `source`가 `unity`이고 프로젝트 이름과 ID가 이 `Game/`에 해당하는지 확인합니다. Editor가 연결되지 않았을 때의 `demo` 응답은 브로커 확인일 뿐 실제 게임 연결 성공이 아닙니다. 브로커 시작 메시지의 웹 주소에서 빌드된 웹 자산을 제공합니다.

## 인증과 경로

토큰은 `Game/.unity-remote-token`에만 두며 Git에서 제외합니다. 토큰을 문서·로그·커밋에 복사하지 않습니다. npm의 `--prefix`가 프로세스 cwd를 어떻게 바꾸는지에 의존하지 않고 런처가 프로젝트와 웹 자산 경로를 결정합니다.

브로커는 명시한 `UNITY_REMOTE_TOKEN`, 기존 프로젝트 토큰, 새 난수 순으로 선택하고 파일을 권한 `0600`으로 저장합니다. cwd는 `Game/`, 웹 루트는 `TOOL/unity-remote/dist/web` 절대 경로입니다. 저장소 CLI는 다른 프로젝트의 셸 토큰을 무시하고 이 파일을 사용하며, 의도적인 재정의는 `--token`으로 전달합니다. `PORT`를 바꾸면 Editor의 `UNITY_REMOTE_BROKER`와 CLI의 `--broker`도 같은 주소로 맞춥니다.

회귀 테스트는 임시 브로커를 실행하며 프로젝트 토큰을 잠시 교체한 뒤 복원합니다. 실제 개발 브로커·Editor를 종료한 상태에서 실행합니다.

Editor의 실제 우선순위는 `UNITY_REMOTE_TOKEN` 환경 변수, `Islee.UnityRemote.Token` EditorPrefs, `Game/.unity-remote-token` 파일입니다. 브로커 주소도 환경 변수, EditorPrefs, `http://127.0.0.1:4173` 순서입니다. 이전 프로젝트의 환경 변수나 사용자 설정이 남아 있으면 파일보다 우선하므로 연결 대상을 확인합니다. 개발 명령은 전역 EditorPrefs를 변경하지 않습니다.

작업을 끝내면 실행한 브로커와 Editor 세션만 종료합니다. 다른 프로젝트까지 종료하는 `pkill`이나 `killall`은 사용하지 않습니다. 패키지 버전 변경은 별도 검토하며, UPM 설치·변경은 manifest 수동 편집 대신 `UnityEditor.PackageManager.Client` API로 수행합니다.
