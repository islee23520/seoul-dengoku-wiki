param(
    [string]$ReleaseRoot,
    [string]$DeployRoot = "E:\git\seoul-dengoku-web",
    [switch]$SkipContainer
)

$ErrorActionPreference = "Stop"

$root = $DeployRoot
$releaseRoot = if ($ReleaseRoot) { $ReleaseRoot } elseif ($env:HUB_RELEASE_ROOT) { $env:HUB_RELEASE_ROOT } else { $root }
$archive = Join-Path $releaseRoot "seoul-dengoku-site.tar"
$next = Join-Path $root "site-next"
$current = Join-Path $root "site"
$previous = Join-Path $root "site-previous"
$nginxSource = Join-Path $root "seoul-dengoku-nginx.conf"
$toolNginxSource = Join-Path $releaseRoot "nginx.conf"
$nginxTarget = Join-Path $root "nginx\default.conf"
$nginxPrevious = Join-Path $root "nginx\default.conf.previous"
$checksumPath = Join-Path $releaseRoot "seoul-dengoku-site.tar.sha256"
$manifestVerifier = Join-Path $releaseRoot "verify-staged-release.mjs"
$postVerifyScript = Join-Path $releaseRoot "check-live-contract.mjs"
$wikiCatalog = Join-Path $releaseRoot "wikiCatalog.ts"
$postVerifyJson = Join-Path $root "live-http-green.json"
$promoteScript = Join-Path $releaseRoot "promote-release.ps1"
$rollbackScript = Join-Path $releaseRoot "rollback-release.ps1"
$lockPath = Join-Path $root "deploy.lock"
$lockStream = $null
$promoted = $false

function Invoke-Native([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "native command failed: $Command ($LASTEXITCODE)" }
}

function Test-WebReady() {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8080/" -TimeoutSec 1
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Invoke-DockerTransition([ValidateSet('start', 'stop')][string]$Action) {
    $process = Start-Process docker.exe -ArgumentList @($Action, 'seoul-dengoku-web') -PassThru -WindowStyle Hidden
    try {
        for ($attempt = 0; $attempt -lt 80; $attempt++) {
            $ready = Test-WebReady
            if (($Action -eq 'start' -and $ready) -or ($Action -eq 'stop' -and -not $ready)) { return }
            if ($process.HasExited -and $process.ExitCode -ne 0) { throw "docker $Action failed ($($process.ExitCode))" }
            Start-Sleep -Milliseconds 250
        }
        throw "docker $Action state transition timeout"
    } finally {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    }
}

try {
    $lockStream = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
} catch {
    throw "deployment lock is held: $lockPath"
}

try {
    Write-Host "DEPLOY_STAGE archive-check"
    $expectedChecksum = (Get-Content $checksumPath -Raw).Trim().Split()[0]
    $actualChecksum = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expectedChecksum -ne $actualChecksum) { throw "archive sha256 mismatch" }

    if (-not $SkipContainer) {
        Write-Host "DEPLOY_STAGE stop-container"
        Invoke-DockerTransition "stop"
    }

    foreach ($path in @($next, $previous)) {
        if (Test-Path $path) { Invoke-Native "cmd" @("/c", "rmdir /s /q `"$path`"") }
    }

    Write-Host "DEPLOY_STAGE extract-next"
    New-Item -ItemType Directory -Path $next -Force | Out-Null
    Invoke-Native "tar" @("-xf", $archive, "-C", $next)

    Get-ChildItem $next -Recurse -Filter "._*" -Force -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue

    Write-Host "DEPLOY_STAGE verify-next"
    $count = (Get-ChildItem $next -Recurse -File).Count
    if ($count -lt 500) { throw "배포 파일 수 부족: $count" }
    if (-not (Test-Path (Join-Path $next "index.html"))) { throw "index.html 없음" }
    if (-not (Test-Path (Join-Path $next "wiki\index.html"))) { throw "wiki/index.html 없음" }
    Invoke-Native "node" @($manifestVerifier, $next, (Join-Path $root "staged-release-verify.json"))

    Write-Host "DEPLOY_STAGE promote"
    & $promoteScript -Current $current -Next $next -Previous $previous
    $promoted = $true
    if (Test-Path $nginxTarget) { Copy-Item $nginxTarget $nginxPrevious -Force }
    if (Test-Path $toolNginxSource) {
        Copy-Item $toolNginxSource $nginxTarget -Force
    } else {
        Copy-Item $nginxSource $nginxTarget -Force
    }

    if (-not $SkipContainer) {
        Write-Host "DEPLOY_STAGE start-container"
        Invoke-DockerTransition "start"
    }

    Write-Host "DEPLOY_STAGE readiness"
    if (-not $SkipContainer -and -not (Test-WebReady)) { throw "nginx readiness failed" }

    Write-Host "DEPLOY_STAGE post-verify"
    if (-not $SkipContainer) {
        Invoke-Native "node" @($postVerifyScript, "http://127.0.0.1:8080", $postVerifyJson, $wikiCatalog)
    }
    Write-Host "DEPLOY_PASS files=$count http=200"
} catch {
    $deploymentError = $_
    $recoveryErrors = @()
    if (-not $SkipContainer) {
        try { Invoke-DockerTransition "stop" } catch { $recoveryErrors += "docker stop failed: $($_.Exception.Message)" }
    }
    if ($promoted -and (Test-Path $previous)) {
        try {
            & $rollbackScript -Current $current -Previous $previous -NginxTarget $nginxTarget -NginxPrevious $nginxPrevious
        } catch {
            $recoveryErrors += "release rollback failed: $($_.Exception.Message)"
        }
    } elseif ($promoted) {
        $recoveryErrors += "previous release missing"
    }
    if (-not $SkipContainer) {
        try { Invoke-DockerTransition "start" } catch { $recoveryErrors += "docker start failed: $($_.Exception.Message)" }
    }
    if ($recoveryErrors.Count -gt 0) {
        throw "deployment failed: $($deploymentError.Exception.Message); recovery failed: $($recoveryErrors -join '; ')"
    }
    throw $deploymentError
} finally {
    if ($lockStream) { $lockStream.Dispose() }
}
