param(
    [Parameter(Mandatory = $true)][string]$Current,
    [Parameter(Mandatory = $true)][string]$Previous,
    [string]$NginxTarget,
    [string]$NginxPrevious
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Previous)) { throw "previous release missing: $Previous" }
if (Test-Path $Current) { cmd /c "rmdir /s /q `"$Current`"" }
Rename-Item $Previous $Current
if ($NginxTarget -and $NginxPrevious -and (Test-Path $NginxPrevious)) {
    Copy-Item $NginxPrevious $NginxTarget -Force
}
Write-Output 'ROLLBACK_PASS'
