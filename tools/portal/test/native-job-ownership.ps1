param(
  [Parameter(Mandatory=$true)][string]$BootstrapPath,
  [Parameter(Mandatory=$true)][string]$ScratchPath,
  [switch]$Owner,
  [switch]$Boundary
)
$ErrorActionPreference = 'Stop'
$source = [IO.File]::ReadAllText($BootstrapPath)
$match = [regex]::Match($source, "(?s)Add-Type -TypeDefinition @'\r?\n(.*?)\r?\n'@")
if (-not $match.Success) { throw 'JOB_EXTRACTION_FAILED' }
Add-Type -TypeDefinition $match.Groups[1].Value
$powershell = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
$environment = [Collections.Generic.Dictionary[string,string]]::new()
$environment.Add('SystemRoot', [Environment]::GetFolderPath('Windows'))
$environment.Add('WINDIR', [Environment]::GetFolderPath('Windows'))
$marker = Join-Path $ScratchPath 'synthetic-child.txt'
$eventName = 'Local\task22-native-job-' + [guid]::NewGuid().ToString('N')
$grandScript = "[IO.File]::WriteAllText('GRAND_READY_PATH','READY');[Threading.EventWaitHandle]::OpenExisting('$eventName').WaitOne() | Out-Null;[IO.File]::WriteAllText('GRAND_RETURNED_PATH','RETURNED')"
$grandScript = $grandScript.Replace('GRAND_READY_PATH',(Join-Path $ScratchPath 'grand-ready.txt').Replace("'","''")).Replace('GRAND_RETURNED_PATH',(Join-Path $ScratchPath 'grand-returned.txt').Replace("'","''"))
$grandEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($grandScript))
$childScript = @'
$ErrorActionPreference='Stop'
$gate=[Threading.EventWaitHandle]::new($false,'ManualReset','EVENT_NAME')
$grand=Start-Process -FilePath 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' -ArgumentList '-NoProfile -NonInteractive -EncodedCommand GRAND_ENCODED' -PassThru -NoNewWindow
[IO.File]::WriteAllText('MARKER_PATH', "$PID`n$($grand.Id)`n")
[Console]::ReadLine() | Out-Null
$gate.Set() | Out-Null
$grand.WaitForExit()
[IO.File]::WriteAllText('CHILD_RETURNED_PATH','RETURNED')
'@
if ($Owner) {
  $childScript = $childScript.Replace('[Console]::ReadLine() | Out-Null', "[IO.File]::WriteAllText('$(Join-Path $ScratchPath 'child-blocked.txt')','BLOCKED');[Threading.EventWaitHandle]::OpenExisting('EVENT_NAME').WaitOne() | Out-Null")
}
$childScript = $childScript.Replace('EVENT_NAME', $eventName).Replace('GRAND_ENCODED',$grandEncoded).Replace('MARKER_PATH',$marker.Replace("'","''")).Replace('CHILD_RETURNED_PATH',(Join-Path $ScratchPath 'child-returned.txt').Replace("'","''"))
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($childScript))
$args = '-NoProfile -NonInteractive -EncodedCommand ' + $encoded
if ($Boundary) {
  [void][NativeJob]::Start($powershell, $args, $ScratchPath, $environment, 'crash-after-create')
  throw 'BOUNDARY_CRASH_MISSING'
}
if ($Owner) {
  [IO.File]::WriteAllText((Join-Path $ScratchPath 'synthetic-writer.lock'), 'HOLD')
  $owned = [NativeJob]::Start($powershell, $args, $ScratchPath, $environment)
  $watcher = [IO.FileSystemWatcher]::new($ScratchPath, 'synthetic-child.txt')
  try {
    if (-not (Test-Path -LiteralPath $marker) -and $watcher.WaitForChanged('Created',10000).TimedOut) { throw 'CHILD_MARKER_TIMEOUT' }
    $ids = [IO.File]::ReadAllLines($marker)
    $member = [Diagnostics.Process]::GetProcessById([int]$ids[1])
    try {
      if (-not [NativeJob]::Contains($owned, $owned.Process) -or -not [NativeJob]::Contains($owned, $member)) { throw 'OWNER_MEMBERSHIP_FAILED' }
    } finally { $member.Dispose() }
    [IO.File]::WriteAllText((Join-Path $ScratchPath 'owner-ready.txt'), 'READY')
    Write-Output "OWNER_READY child=$($ids[0]) grandchild=$($ids[1])"
    [Console]::Out.Flush()
    [Console]::ReadLine() | Out-Null
  } finally { $watcher.Dispose(); $owned.Dispose() }
  exit
}
[IO.File]::Delete($marker)
if ([NativeOwnedHandle]::Active -ne 0) { throw "JOB_HANDLE_LEAK_BEFORE_TEST_$([NativeOwnedHandle]::Active)" }
foreach ($stage in @('create','assign','resume')) {
  try {
    [void][NativeJob]::Start($powershell, $args, $ScratchPath, $environment, $stage)
    throw "FAULT_NOT_THROWN_$stage"
  } catch {
    $cause = $_.Exception
    while ($cause.InnerException) { $cause = $cause.InnerException }
    if ($cause.Message -cne "NATIVE_JOB_INJECT_$($stage.ToUpperInvariant())") { throw }
    Write-Output "JOB_FAULT $stage failure=$($cause.Message) markerAbsent=$(!(Test-Path -LiteralPath $marker)) handles=$([NativeOwnedHandle]::Active)"
    if (Test-Path -LiteralPath $marker) { throw 'SUSPENDED_CHILD_EXECUTED' }
    if ([NativeOwnedHandle]::Active -ne 0) { throw "JOB_HANDLE_LEAK_${stage}_$([NativeOwnedHandle]::Active)" }
  }
}
foreach ($stage in @('resume-terminate','resume-wait')) {
  try {
    [void][NativeJob]::Start($powershell, $args, $ScratchPath, $environment, $stage)
    throw "FAULT_NOT_THROWN_$stage"
  } catch {
    if ($_.Exception.ToString() -notmatch 'NATIVE_JOB_CLEANUP_UNCONFIRMED') { throw }
    if ([NativeJob]::Retained -ne 2 -or [NativeOwnedHandle]::Active -ne 2) { throw "CUSTODY_MISSING_$stage" }
    if (Test-Path -LiteralPath $marker) { throw "CUSTODY_CHILD_EXECUTED_$stage" }
    Write-Output "JOB_CLEANUP_UNCONFIRMED $stage retained=$([NativeJob]::Retained) handles=$([NativeOwnedHandle]::Active)"
    [NativeJob]::ReleaseRetained()
    if ([NativeJob]::Retained -ne 0 -or [NativeOwnedHandle]::Active -ne 0) { throw "CUSTODY_RELEASE_FAILED_$stage" }
  }
}
$watch = [IO.FileSystemWatcher]::new($ScratchPath, 'synthetic-child.txt')
try {
  $owned = [NativeJob]::Start($powershell, $args, $ScratchPath, $environment)
  try {
    if (-not (Test-Path -LiteralPath $marker) -and $watch.WaitForChanged('Created',10000).TimedOut) { throw 'NORMAL_MARKER_TIMEOUT' }
    $ids = [IO.File]::ReadAllLines($marker)
    $grandchild = [Diagnostics.Process]::GetProcessById([int]$ids[1])
    try {
      if (-not [NativeJob]::Contains($owned, $grandchild)) { throw 'GRANDCHILD_NOT_IN_JOB' }
      if (-not [NativeJob]::Contains($owned, $owned.Process)) { throw 'CHILD_NOT_IN_JOB' }
      $owned.Input.WriteLine('stop')
      if (-not $owned.Process.WaitForExit(10000)) { throw 'NORMAL_CHILD_EXIT_TIMEOUT' }
      if (-not $grandchild.WaitForExit(10000)) { throw 'NORMAL_GRANDCHILD_EXIT_TIMEOUT' }
      Write-Output "JOB_NORMAL childExit=$($owned.Process.ExitCode) grandchildExit=$($grandchild.ExitCode) contained=True"
    } finally { $grandchild.Dispose() }
  } finally { $owned.Dispose() }
} finally { $watch.Dispose() }
if ([NativeOwnedHandle]::Active -ne 0) { throw "JOB_HANDLE_LEAK_NORMAL_$([NativeOwnedHandle]::Active)" }
Write-Output "JOB_HANDLES normal=0"
[IO.File]::Delete($marker)
[IO.File]::Delete((Join-Path $ScratchPath 'created-boundary.txt'))
$boundaryProcess = [Diagnostics.Process]::new()
$boundaryProcess.StartInfo.FileName = $powershell
$boundaryProcess.StartInfo.Arguments = '-NoProfile -NonInteractive -File "' + $PSCommandPath + '" -BootstrapPath "' + $BootstrapPath + '" -ScratchPath "' + $ScratchPath + '" -Boundary'
$boundaryProcess.StartInfo.UseShellExecute = $false
$boundaryProcess.StartInfo.RedirectStandardInput = $true
$boundaryProcess.StartInfo.RedirectStandardOutput = $true
$boundaryProcess.StartInfo.RedirectStandardError = $true
$boundaryWatcher = [IO.FileSystemWatcher]::new($ScratchPath, 'created-boundary.txt')
$boundaryChild = $null
$boundaryFailure = $null
$boundaryStarted = $false
try {
  if (-not $boundaryProcess.Start()) { throw 'BOUNDARY_OWNER_START_FAILED' }
  $boundaryStarted = $true
  if (-not (Test-Path -LiteralPath (Join-Path $ScratchPath 'created-boundary.txt')) -and $boundaryWatcher.WaitForChanged('Created',10000).TimedOut) { throw 'BOUNDARY_CREATED_TIMEOUT' }
  $boundaryChild = [Diagnostics.Process]::GetProcessById([int][IO.File]::ReadAllText((Join-Path $ScratchPath 'created-boundary.txt')))
  [void]$boundaryChild.Handle
  if ($boundaryChild.HasExited) { throw 'BOUNDARY_CHILD_EARLY_EXIT' }
  $boundaryProcess.StandardInput.WriteLine('abort')
  if (-not $boundaryProcess.WaitForExit(10000) -or -not $boundaryChild.WaitForExit(10000)) { throw 'BOUNDARY_JOB_KILL_TIMEOUT' }
  if (Test-Path -LiteralPath $marker) { throw 'BOUNDARY_SUSPENDED_CHILD_EXECUTED' }
  Write-Output "JOB_BOUNDARY ownerExit=$($boundaryProcess.ExitCode) childExit=$($boundaryChild.ExitCode) markerAbsent=True"
} catch { $boundaryFailure = $_.Exception
} finally {
  try {
    if ($boundaryStarted -and -not $boundaryProcess.HasExited) { $boundaryProcess.Kill() }
    if ($boundaryStarted -and -not $boundaryProcess.WaitForExit(10000)) { throw 'BOUNDARY_OWNER_CLEANUP_TIMEOUT' }
    if ($boundaryChild -and -not $boundaryChild.WaitForExit(10000)) { throw 'BOUNDARY_CHILD_CLEANUP_TIMEOUT' }
  } catch {
    if ($boundaryFailure) { $boundaryFailure.Data['cleanup'] = $_.Exception }
    else { $boundaryFailure = $_.Exception }
  }
  if ($boundaryChild) { $boundaryChild.Dispose() }
  $boundaryWatcher.Dispose()
  $boundaryProcess.Dispose()
}
if ($boundaryFailure) { throw $boundaryFailure }
[IO.File]::Delete($marker)
$ownerReady = Join-Path $ScratchPath 'owner-ready.txt'
$writerHold = Join-Path $ScratchPath 'synthetic-writer.lock'
$grandReady = Join-Path $ScratchPath 'grand-ready.txt'
$childBlocked = Join-Path $ScratchPath 'child-blocked.txt'
$childReturned = Join-Path $ScratchPath 'child-returned.txt'
$grandReturned = Join-Path $ScratchPath 'grand-returned.txt'
[IO.File]::Delete($ownerReady)
[IO.File]::Delete($writerHold)
[IO.File]::Delete($grandReady)
[IO.File]::Delete($childBlocked)
[IO.File]::Delete($childReturned)
[IO.File]::Delete($grandReturned)
$ownerProcess = [Diagnostics.Process]::new()
$ownerProcess.StartInfo.FileName = $powershell
$ownerProcess.StartInfo.Arguments = '-NoProfile -NonInteractive -File "' + $PSCommandPath + '" -BootstrapPath "' + $BootstrapPath + '" -ScratchPath "' + $ScratchPath + '" -Owner'
$ownerProcess.StartInfo.UseShellExecute = $false
$ownerProcess.StartInfo.RedirectStandardInput = $true
$ownerProcess.StartInfo.RedirectStandardOutput = $true
$ownerProcess.StartInfo.RedirectStandardError = $true
$ownerProcess.StartInfo.CreateNoWindow = $true
$readyWatcher = [IO.FileSystemWatcher]::new($ScratchPath,'owner-ready.txt')
$grandWatcher = [IO.FileSystemWatcher]::new($ScratchPath,'grand-ready.txt')
$blockedWatcher = [IO.FileSystemWatcher]::new($ScratchPath,'child-blocked.txt')
$ownerChild = $null; $ownerGrandchild = $null
$ownerFailure = $null
$ownerStarted = $false
try {
  if (-not $ownerProcess.Start()) { throw 'OWNER_START_FAILED' }
  $ownerStarted = $true
  if (-not (Test-Path -LiteralPath $ownerReady)) {
    $readyChange = $readyWatcher.WaitForChanged('Created',10000)
    if ($readyChange.TimedOut -and -not (Test-Path -LiteralPath $ownerReady)) {
      throw "OWNER_READY_TIMEOUT exited=$($ownerProcess.HasExited) stdout=$($ownerProcess.StandardOutput.ReadToEnd()) stderr=$($ownerProcess.StandardError.ReadToEnd())"
    }
  }
  $ids = [IO.File]::ReadAllLines($marker)
  $ownerChild = [Diagnostics.Process]::GetProcessById([int]$ids[0])
  $ownerGrandchild = [Diagnostics.Process]::GetProcessById([int]$ids[1])
  [void]$ownerChild.Handle
  [void]$ownerGrandchild.Handle
  if (-not (Test-Path -LiteralPath $grandReady) -and $grandWatcher.WaitForChanged('Created',10000).TimedOut) { throw 'GRANDCHILD_READY_TIMEOUT' }
  if (-not (Test-Path -LiteralPath $childBlocked) -and $blockedWatcher.WaitForChanged('Created',10000).TimedOut) { throw 'CHILD_BLOCKED_TIMEOUT' }
  # The owner asserts exact-job membership before publishing owner-ready.txt.
  if ($ownerProcess.HasExited -or $ownerChild.HasExited -or $ownerGrandchild.HasExited) { throw 'OWNER_EXIT_BEFORE_KILL' }
  $ownerProcess.Kill()
  if (-not $ownerProcess.WaitForExit(10000)) { throw 'OWNER_EXIT_TIMEOUT' }
  if (-not $ownerChild.WaitForExit(10000)) { throw 'CRASH_CHILD_EXIT_TIMEOUT' }
  if (-not $ownerGrandchild.WaitForExit(10000)) { throw 'CRASH_GRANDCHILD_EXIT_TIMEOUT' }
  if ((Test-Path -LiteralPath $childReturned) -or (Test-Path -LiteralPath $grandReturned)) { throw 'CRASH_CHILD_RESUMED_NORMALLY' }
  $hold = [IO.File]::ReadAllText((Join-Path $ScratchPath 'synthetic-writer.lock'))
  if ($hold -cne 'HOLD') { throw 'CRASH_MARKER_MISSING' }
  Write-Output "JOB_CRASH ownerExit=$($ownerProcess.ExitCode) childExit=$($ownerChild.ExitCode) grandchildExit=$($ownerGrandchild.ExitCode) preKill=bothBlockedAndInJob postWaitMarkersAbsent=True syntheticMarker=$hold"
} catch { $ownerFailure = $_.Exception
} finally {
  $readyWatcher.Dispose()
  $grandWatcher.Dispose()
  $blockedWatcher.Dispose()
  try {
    if ($ownerStarted -and -not $ownerProcess.HasExited) { $ownerProcess.Kill() }
    if ($ownerStarted -and -not $ownerProcess.WaitForExit(10000)) { throw 'OWNER_CLEANUP_TIMEOUT' }
    if ($ownerChild -and -not $ownerChild.WaitForExit(10000)) { throw 'OWNER_CHILD_CLEANUP_TIMEOUT' }
    if ($ownerGrandchild -and -not $ownerGrandchild.WaitForExit(10000)) { throw 'OWNER_GRANDCHILD_CLEANUP_TIMEOUT' }
  } catch {
    if ($ownerFailure) { $ownerFailure.Data['cleanup'] = $_.Exception }
    else { $ownerFailure = $_.Exception }
  }
  if ($ownerGrandchild) { $ownerGrandchild.Dispose() }
  if ($ownerChild) { $ownerChild.Dispose() }
  $ownerProcess.Dispose()
}
if ($ownerFailure) { throw $ownerFailure }
