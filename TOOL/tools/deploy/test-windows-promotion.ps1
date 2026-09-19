param(
    [string]$PromoteScript = (Join-Path $PSScriptRoot '..\..\..\WEB\wiki\deploy\promote-release.ps1'),
    [string]$RollbackScript = (Join-Path $PSScriptRoot '..\..\..\WEB\wiki\deploy\rollback-release.ps1')
)

$ErrorActionPreference = 'Stop'
$script = (Resolve-Path $PromoteScript).Path
$rollbackScript = (Resolve-Path $RollbackScript).Path
$root = Join-Path $env:TEMP ("hub-promote-test-" + [guid]::NewGuid())

function Write-Release([string]$Path, [string]$Value) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
    Set-Content -Path (Join-Path $Path 'release.txt') -Value $Value -NoNewline
}

function Assert-Release([string]$Path, [string]$Value) {
    if (-not (Test-Path (Join-Path $Path 'release.txt'))) { throw "release missing: $Path" }
    $actual = Get-Content (Join-Path $Path 'release.txt') -Raw
    if ($actual -ne $Value) { throw "release mismatch: expected=$Value actual=$actual" }
}

function Invoke-Promotion([string]$Current, [string]$Next, [string]$Previous, [string]$FailPoint) {
    $arguments = @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $script,
        '-Current', $Current, '-Next', $Next, '-Previous', $Previous,
        '-FailPoint', $FailPoint
    )
    return Start-Process powershell.exe -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
}

try {
    foreach ($failPoint in @('after-current-move', 'after-next-move')) {
        $case = Join-Path $root $failPoint
        $current = Join-Path $case 'site'
        $next = Join-Path $case 'site-next'
        $previous = Join-Path $case 'site-previous'
        Write-Release $current 'old'
        Write-Release $next 'new'
        $process = Invoke-Promotion $current $next $previous $failPoint
        if ($process.ExitCode -eq 0) { throw "expected injected failure: $failPoint" }
        Assert-Release $current 'old'
        if (Test-Path $previous) { throw "previous should be consumed after rollback: $failPoint" }
    }
    $postCase = Join-Path $root 'post-verify'
    $postCurrent = Join-Path $postCase 'site'
    $postNext = Join-Path $postCase 'site-next'
    $postPrevious = Join-Path $postCase 'site-previous'
    Write-Release $postCurrent 'old'
    Write-Release $postNext 'new'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -Current $postCurrent -Next $postNext -Previous $postPrevious | Out-Null
    Assert-Release $postCurrent 'new'
    if ((Get-ChildItem $postCurrent -Recurse -File).Count -ne 1) { throw 'promotion merged files instead of replacing release' }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $rollbackScript -Current $postCurrent -Previous $postPrevious | Out-Null
    Assert-Release $postCurrent 'old'
    $nginxTarget = Join-Path $postCase 'nginx.conf'
    $nginxPrevious = Join-Path $postCase 'nginx.conf.previous'
    Set-Content -Path $nginxTarget -Value 'new-nginx' -NoNewline
    Set-Content -Path $nginxPrevious -Value 'old-nginx' -NoNewline
    Write-Release $postNext 'new-again'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -Current $postCurrent -Next $postNext -Previous $postPrevious | Out-Null
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $rollbackScript -Current $postCurrent -Previous $postPrevious -NginxTarget $nginxTarget -NginxPrevious $nginxPrevious | Out-Null
    Assert-Release $postCurrent 'old'
    if ((Get-Content $nginxTarget -Raw) -ne 'old-nginx') { throw 'nginx rollback mismatch' }
    Write-Output 'WINDOWS_PROMOTION_ROLLBACK_PASS cases=3'
} finally {
    if (Test-Path $root) { cmd /c "rmdir /s /q `"$root`"" }
}
