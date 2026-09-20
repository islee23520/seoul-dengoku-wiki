param(
    [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")),
    [string]$DeployRoot = "E:\git\seoul-dengoku-web",
    [string]$EvidenceRoot = (Join-Path $RepositoryRoot ".omo\evidence\hub-docker-deploy\latest")
)

$ErrorActionPreference = "Stop"

function Invoke-Native([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "native command failed: $Command ($LASTEXITCODE)" }
}

$repository = (Resolve-Path $RepositoryRoot).Path
$output = Join-Path $repository ".omo\deploy\hub"
$builder = Join-Path $repository "TOOL\tools\deploy\build-hub-docker.mjs"
$windowsDeploy = Join-Path $repository "WEB\wiki\deploy\deploy-windows.ps1"

New-Item -ItemType Directory -Force $EvidenceRoot | Out-Null
Set-Location $repository

Invoke-Native "node" @($builder, "--output", $output)
Invoke-Native "powershell.exe" @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $windowsDeploy,
    "-ReleaseRoot", $output,
    "-DeployRoot", $DeployRoot
)

foreach ($receipt in @(
    (Join-Path $output "deployment-manifest.json"),
    (Join-Path $DeployRoot "staged-release-verify.json"),
    (Join-Path $DeployRoot "live-http-green.json")
)) {
    if (Test-Path $receipt) { Copy-Item $receipt $EvidenceRoot -Force }
}

$head = (git -C $repository rev-parse HEAD).Trim()
Set-Content (Join-Path $EvidenceRoot "deployed-git-sha.txt") "$head`n" -Encoding utf8
Write-Host "HUB_DEPLOY_PASS local-windows git=$head"
