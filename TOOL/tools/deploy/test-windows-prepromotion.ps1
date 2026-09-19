param([Parameter(Mandatory = $true)][string]$DeployScript)

$ErrorActionPreference = 'Stop'
$testRoot = Join-Path $env:TEMP ("hub-prepromotion-test-" + [guid]::NewGuid())
$releaseRoot = Join-Path $testRoot 'release'
$site = Join-Path $testRoot 'site'
$previous = Join-Path $testRoot 'site-previous'
$nginxDir = Join-Path $testRoot 'nginx'
$nginx = Join-Path $nginxDir 'default.conf'

try {
    New-Item -ItemType Directory -Path $releaseRoot, $site, $previous, $nginxDir -Force | Out-Null
    Set-Content (Join-Path $site 'release.txt') 'current' -NoNewline
    Set-Content (Join-Path $previous 'release.txt') 'stale-previous' -NoNewline
    Set-Content $nginx 'current-nginx' -NoNewline
    Set-Content (Join-Path $releaseRoot 'seoul-dengoku-site.tar.sha256') ('0' * 64 + '  seoul-dengoku-site.tar') -NoNewline
    Set-Content (Join-Path $releaseRoot 'seoul-dengoku-site.tar') 'not-a-valid-release' -NoNewline

    $process = Start-Process powershell.exe -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $DeployScript,
        '-ReleaseRoot', $releaseRoot, '-DeployRoot', $testRoot, '-SkipContainer'
    ) -Wait -PassThru -WindowStyle Hidden
    if ($process.ExitCode -eq 0) { throw 'expected pre-promotion validation failure' }
    if ((Get-Content (Join-Path $site 'release.txt') -Raw) -ne 'current') { throw 'current site changed' }
    if ((Get-Content (Join-Path $previous 'release.txt') -Raw) -ne 'stale-previous') { throw 'stale previous changed' }
    if ((Get-Content $nginx -Raw) -ne 'current-nginx') { throw 'nginx changed' }
    Write-Output 'WINDOWS_PREPROMOTION_PRESERVE_PASS site=current previous=stale nginx=current'
} finally {
    if (Test-Path $testRoot) { cmd /c "rmdir /s /q `"$testRoot`"" }
}
