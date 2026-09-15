$ErrorActionPreference="Stop"
$run="E:/omo/rtfc-d2-ui-green-run-st_01a08368/capture"
$env:JANSEON_CAPTURE_DIR="$run/captures"
$u="E:/Unity/Editor/6000.7.0a5/Editor/Unity.exe"
$args=@("-batchmode","-projectPath","E:/git/seoul-kenshi-wt/rtfc-phase-d/Game","-runTests","-testPlatform","PlayMode","-testFilter","UiToolkitCapturePlayModeTests.Capture_C1_To_C10_Matrix_FromProductionCanvas","-testResults","$run/playmode.xml","-logFile","$run/playmode.log.txt")
Remove-Item "$run/playmode.xml","$run/playmode.log.txt","$run/playmode.exit","$run/playmode.done" -Force -ErrorAction SilentlyContinue
Get-ChildItem "$run/captures" -File -ErrorAction SilentlyContinue | Remove-Item -Force
$p=Start-Process -FilePath $u -ArgumentList $args -Wait -PassThru -NoNewWindow
$c=$p.ExitCode
[IO.File]::WriteAllText("$run/playmode.exit","$c`n",[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText("$run/playmode.done",(Get-Date).ToUniversalTime().ToString("o"),[Text.UTF8Encoding]::new($false))
exit $c