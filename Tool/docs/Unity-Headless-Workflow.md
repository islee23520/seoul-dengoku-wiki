# Unity 무창 배치 작업 가이드

이 문서는 이 저장소와 모든 Git worktree에서 Unity 작업을 수행하는 강제 실행 계약입니다. 목표는 Unity 기능을 포기하는 것이 아니라 **사용자 데스크톱에 Unity Editor 창을 열지 않고**, Unity Technologies의 CLI와 `-batchmode` Editor 프로세스로 동일한 저작·검증 작업을 수행하는 것입니다.

## 1. 절대 규칙

1. `unity open`을 실행하지 않습니다.
   `unity 6000.7.0a5 "$WORKTREE/Game"` 같은 version shorthand도 GUI Editor를 열 수 있으므로 실행하지 않습니다.
2. 대화형 Unity Editor, GUI Test Runner, 수동 Play 버튼, CuaDriver, OS GUI 자동화, uLoop를 사용하지 않습니다.
3. `unicli`는 열린 Editor의 named-pipe server가 필요하므로 이 프로젝트에서는 사용하지 않습니다.
4. 모든 Editor 프로세스는 `-batchmode`로 실행합니다.
5. Unity 프로세스는 전용 background worker/session에서 실행하며 사용자 터미널 pane과 데스크톱 focus를 점유하지 않습니다.
6. 한 worktree의 같은 `Game` 경로에는 Unity 프로세스를 동시에 둘 이상 실행하지 않습니다. 병렬 Unity 작업은 서로 다른 worktree의 `Game` 경로를 사용합니다.
7. scene, prefab, `.asset`, build settings, UI Toolkit 문서는 Unity API로 생성·수정합니다. Unity YAML을 손으로 편집하지 않습니다.
8. 모든 실행은 log와 결과 파일을 남기고 exit code로 판정합니다. 화면에서 “보였다”는 진술은 증거가 아닙니다.

## 2. 작업 표면 선택

다음 우선순위를 사용합니다.

### A. Unity를 실행하지 않아도 되는 작업

- 순수 C# domain 코드와 정적 계약: 파일 편집, LSP, Node architecture gate.
- 문서와 art-pipeline 계약: 해당 Node/Python 테스트.
- Unity registry의 알려진 package id 조회: registry API를 사용할 수 있으면 먼저 사용합니다.

Unity API, serialization, import, scene graph, UI 렌더링이 관련되면 정적 검사만으로 완료 처리하지 않습니다.

### B. 일회성 Unity 작업

Unity Technologies CLI가 자동으로 batch mode를 구성하는 명령을 우선합니다.

비시각 일회성 작업의 기본 계약은 다음 한 줄입니다.

```bash
unity run "$WORKTREE/Game" --editor-version 6000.7.0a5 -- -nographics -executeMethod <fully-qualified-static-method> -logFile -
```

```bash
unity run "$WORKTREE/Game" --editor-version 6000.7.0a5 \
  -- -executeMethod <fully-qualified-static-method> \
  -logFile "$WORKTREE/.omo/evidence/unity/build-content.log"

unity test "$WORKTREE/Game" --editor-version 6000.7.0a5 \
  --mode EditMode --report-format junit \
  --output "$WORKTREE/.omo/evidence/unity/editmode.xml" \
  --timeout 600

unity test "$WORKTREE/Game" --editor-version 6000.7.0a5 \
  --mode PlayMode --report-format junit \
  --output "$WORKTREE/.omo/evidence/unity/playmode.xml" \
  --timeout 600

unity build "$WORKTREE/Game" --editor-version 6000.7.0a5 \
  --target StandaloneOSX \
  --execute-method <fully-qualified-static-method>
```

`unity run`에는 CLI가 `-batchmode`와 `-quit`을 주입하므로 같은 flag를 중복 전달하지 않습니다.

### C. 여러 GUI/scene 명령을 연속 수행하는 작업

반복 cold boot 대신 Pipeline package를 설치하고 **persistent headless Editor**를 사용합니다. 이것은 Editor 창을 여는 것이 아니라 `-batchmode` 프로세스를 상주시켜 CLI command server로 사용하는 방식입니다.

```bash
unity pipeline install --project-path "$WORKTREE/Game"

EDITOR_PATH="$(unity editors path 6000.7.0a5 --format json | jq -r '.data.path')"
if [[ "$EDITOR_PATH" == *.app ]]; then
  UNITY_BIN="$EDITOR_PATH/Contents/MacOS/Unity"
else
  UNITY_BIN="$EDITOR_PATH/Unity.app/Contents/MacOS/Unity"
fi
"$UNITY_BIN" -batchmode -projectPath "$WORKTREE/Game" \
  -logFile "$WORKTREE/.omo/evidence/unity/pipeline-editor.log"
```

위 프로세스는 전용 background session에서 시작하고 `-quit`을 넣지 않습니다. 준비 여부는 `unity status`가 아니라 다음 명령으로 확인합니다. batch-mode Editor는 `unity status`에 나타나지 않을 수 있습니다.

```bash
unity list --project-path "$WORKTREE/Game" --format json
unity command --project-path "$WORKTREE/Game" --format json
```

그 뒤 built-in command 또는 프로젝트의 `[CliCommand]`를 사용합니다.

```bash
unity command create_gameobject --project-path "$WORKTREE/Game" --name MainTitleRoot
unity command save_all --project-path "$WORKTREE/Game"
unity command capture_acceptance_evidence --project-path "$WORKTREE/Game" \
  --output "$WORKTREE/.omo/evidence/unity/main-title.png"
```

명령 이름과 인자는 기억에 의존하지 말고 매번 `unity list --format json` 또는 `unity command --format json`으로 확인합니다.

### D. UPM package 추가·제거

`Packages/manifest.json`을 손으로 고치지 않습니다. `UnityEditor.PackageManager.Client.AddAndRemove`를 호출하는 Editor script를 사용합니다. UPM 요청은 비동기이므로 Editor binary를 직접 `-batchmode`로 실행하고 **`-quit`을 넣지 않습니다**. Script가 update callback에서 완료를 확인한 뒤 `EditorApplication.Exit(exitCode)`를 호출해야 합니다.

## 3. GUI 화면과 scene을 창 없이 만드는 방법

GUI 작업은 아래와 같이 코드로 저작합니다.

- UI Toolkit: `VisualTreeAsset`, `StyleSheet`, UXML/USS source, `UIDocument`, `PanelSettings`를 Editor script가 생성·연결합니다.
- Scene: `EditorSceneManager`, `GameObject`, component API로 계층을 만들고 `EditorSceneManager.SaveScene`으로 저장합니다.
- Prefab: 임시 scene object를 구성한 뒤 `PrefabUtility.SaveAsPrefabAsset`으로 저장합니다.
- Serialized asset: `ScriptableObject.CreateInstance`, `AssetDatabase.CreateAsset`, `SerializedObject`를 사용합니다.
- Build settings: `EditorBuildSettings.scenes`를 deterministic하게 교체하고 저장합니다.
- Import: `AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate)`, `AssetDatabase.ImportAsset`, `AssetDatabase.SaveAssets`를 사용합니다.
- 반복 작업: `Assets/Janseon/**/Editor/`에 idempotent builder 또는 `[CliCommand]`를 둡니다.

저작 명령은 같은 입력으로 다시 실행해도 중복 GameObject나 asset을 만들지 않아야 합니다. 기존 대상을 stable path/name/GUID로 찾고 생성 또는 갱신한 뒤 저장합니다.

## 4. Compile, test, visual evidence

### 검증 전 LFS 사전 검사 (#34)

모든 worktree에서 Node·아트 검사와 Unity compile/test/build를 시작하기 전에 저장소 루트에서 아래 단계를 실행합니다. 브랜치를 바꾸거나 새 에셋을 받은 뒤에도 다시 검사합니다.

```bash
git lfs checkout
node Tool/check-lfs-hydration.mjs
```

각 명령의 종료 코드가 0일 때만 다음 단계로 진행합니다. 사전 검사는 `Game/Assets`와 `Reference/assets`를 재귀적으로 읽고, 파일 시작부터 LFS 포인터 형식인 입력을 찾습니다. 일반 문서의 문자열 언급은 포인터로 취급하지 않습니다. JSON 출력의 `filesScanned`는 읽은 파일 수, `pointers`는 미스머지 경로, `errors`는 필수 루트 누락·읽기 오류·지원하지 않는 파일 유형(심볼릭 링크 포함)입니다. 포인터나 오류가 하나라도 있으면 종료 코드 1로 검증을 차단합니다. 다른 작업 사본은 `node Tool/check-lfs-hydration.mjs /absolute/path/to/worktree`로 검사할 수 있습니다.

검사기는 다운로드나 에셋 변경을 하지 않습니다. `git lfs checkout`은 로컬 LFS 객체를 작업 파일로 펼치며, 객체가 없으면 먼저 `git lfs pull`로 받은 뒤 checkout과 사전 검사를 다시 실행합니다. `git lfs fsck` 성공만으로 작업 파일의 hydration을 보장하지 않습니다. 포인터 상태의 PNG로 발생한 sprite null·BOM 해시 불일치·UI kit 실패를 제품 결함으로 판정하지 않습니다. 이 명령은 `npm test`와 별개인 필수 준비 단계입니다.

### 비시각 검증

- compile, EditMode, non-rendering PlayMode에는 `-nographics`를 사용할 수 있습니다.
- 실패는 process exit code, JUnit/NUnit XML, filtered log로 판정합니다.
- C# 변경 뒤 compile 오류가 하나라도 있으면 다음 단계로 진행하지 않습니다.

### 시각 검증

- 시각 검증도 interactive Editor를 열지 않습니다.
- batchmode PlayMode test 또는 project command가 target scene을 load하고 고정 seed·resolution·camera로 frame을 렌더링합니다.
- `-nographics`는 사용하지 않습니다. 필요하면 RenderTexture/ScreenCapture를 사용해 PNG를 기록합니다.
- PNG와 함께 scene, commit, Unity version, resolution, seed, tested route, timestamp를 담은 JSON receipt와 test XML/log를 기록합니다.
- 생성된 PNG는 Unity 밖의 이미지 검토 surface에서 확인합니다. Unity 창을 열어 육안 확인하지 않습니다.

이 저장소에서 기존 문서의 “실제 Editor Play Mode”는 **실제 Unity Editor runtime의 PlayMode를 `-batchmode`로 실행**한다는 뜻입니다. interactive Editor 실행을 뜻하지 않습니다.

## 5. 백그라운드 실행과 종료

- 장시간 Unity 명령은 agent의 persistent background session에서 실행합니다.
- readiness나 완료를 기다릴 때 foreground polling/sleep을 사용하지 않고 log sentinel 또는 process-completion monitor를 등록합니다.
- persistent headless Editor는 작업이 끝나면 해당 session/process tree만 종료합니다.
- 다른 worktree나 사용자 프로젝트를 보호하기 위해 `killall Unity`, `pkill -f Unity` 같은 이름 기반 종료는 금지합니다. 시작한 background session id 또는 확인한 PID만 종료합니다.

## 6. 금지 명령 점검표

다음 문자열이 실행 계획에 있으면 중단하고 batch 대체 경로로 바꿉니다.

```text
unity open
unity 6000.7.0a5 <project-path>
unicli
uloop
killall Unity
pkill -f Unity
```

또한 Unity를 대상으로 CuaDriver, AppleScript, Finder, Dock click, GUI Test Runner, 수동 Play Mode를 사용하지 않습니다.

## 7. 작업 완료 증거

Unity 관련 작업은 최소한 다음을 보고해야 완료입니다.

1. 사용한 worktree와 `Game` 절대 경로.
2. 실행한 Unity CLI/Editor batch command.
3. exit code 0.
4. compile/test/build 결과 파일 경로.
5. 시각 변경이면 batchmode 생성 PNG와 receipt 경로.
6. visible Unity window와 focus change가 없었다는 isolation 확인.
7. persistent worker를 시작했다면 종료 확인.

위 증거가 없으면 정적 코드가 맞아 보여도 Unity 작업은 미검증 상태입니다.

## 8. 신규 클론의 전체 PlayMode 준비 (#33)

전체 PlayMode에는 runtime scene 검사뿐 아니라 **격리 후보의 import/render 검사**가 포함됩니다. `Library`를 처음 만드는 것만으로는 UI 후보와 파일럿이 생성되지 않으며, 캐릭터 캡처는 원본 후보 PNG의 해시도 기록합니다. 따라서 기존 작업 사본의 `.omo`를 복사하지 말고 아래 저장소 생성기와 Unity 임포터를 먼저 실행합니다.

전제: Git LFS, Node.js 20 이상, Python 3와 Pillow/NumPy, Unity `6000.7.0a5`. 검증 환경의 Python 패키지는 Pillow `12.2.0`, NumPy `2.4.4`입니다. 필요한 경우 별도 Python 가상환경에서 `python -m pip install Pillow==12.2.0 numpy==2.4.4`로 준비합니다. 아래는 새 클론 루트에서 실행하며, `UNITY_EDITOR`는 실제 Editor 실행 파일의 절대 경로입니다. 모든 Unity 명령은 전용 background worker에서 순차 실행합니다.

```bash
git lfs pull
git lfs fsck
git lfs checkout
node Tool/check-lfs-hydration.mjs
npm ci --prefix Tool
export UNITY_EDITOR=/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity
mkdir -p .omo/evidence/fresh-playmode

python3 Tool/art/build-poc-ui-candidates.py \
  --output-dir .omo/evidence/gateway-ui-candidates/candidate-v1
python3 Tool/art/build-poc-character-sprites.py \
  --output-dir .omo/evidence/gateway-character-candidates/candidate-v2
python3 Tool/art/build-poc-character-sprites.py --explorer-pilot \
  --output-dir .omo/evidence/gateway-character-candidates/explorer-pilot-v3

"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" \
  -executeMethod Janseon.Art.Editor.UiCandidateShowcase.Import \
  -logFile "$PWD/.omo/evidence/fresh-playmode/ui-import.log"
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" \
  -executeMethod Janseon.Art.Editor.CharacterCandidateBuilder.Import \
  -logFile "$PWD/.omo/evidence/fresh-playmode/character-import.log"
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" \
  -executeMethod Janseon.Art.Editor.CharacterCandidatePilotCapture.Import \
  -logFile "$PWD/.omo/evidence/fresh-playmode/pilot-import.log"

"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" \
  -runTests -testPlatform PlayMode \
  -testResults "$PWD/.omo/evidence/fresh-playmode/playmode.xml" \
  -logFile "$PWD/.omo/evidence/fresh-playmode/playmode.log"
node --test Tool/art/test-*.mjs
python3 -m unittest discover -s Tool/art -p 'test_*.py'
```

각 명령의 종료 코드가 0일 때만 다음 명령으로 진행합니다. PlayMode는 `-quit`이나 `-nographics`를 붙이지 않습니다. NUnit XML의 실패·skip 수와 실제 후보 capture receipt를 함께 확인합니다. UI는 `gateway-ui-candidates/unity-render`, 캐릭터 276프레임은 `gateway-character-candidates/playmode-v2`, 파일럿 8프레임은 `gateway-character-candidates/pilot-capture` 아래에 기록됩니다. XML/log/PNG 및 receipt를 실행별 디렉터리에 보존하고, 실행한 Git HEAD와 dirty-source fingerprint에 연결합니다.

생성기는 이미 존재하는 출력 디렉터리를 거부합니다. 재검증은 별도 새 클론에서 수행하여 이전 실패 증거와 후보 입력을 덮어쓰지 않습니다. 임포터가 만드는 `ArtCandidates` 변경은 검증용이며 runtime 승격 커밋에 포함하지 않습니다. 생성 manifest의 draft/unknown-rights/빈 review 상태는 그대로 유지합니다. 이 절차의 통과는 입력 재현성과 import/render 계약의 증명이며, #8의 타이틀 구도 승인이나 캐릭터 전체 프레임의 시각 품질 승인을 대신하지 않습니다.
