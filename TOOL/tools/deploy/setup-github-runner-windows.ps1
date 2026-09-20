param(
    [Parameter(Mandatory = $true)][string]$RepositoryUrl,
    [Parameter(Mandatory = $true)][string]$RegistrationToken,
    [string]$RunnerRoot = "E:\git\github-runner-seoul-kenshi",
    [string]$RunnerName = "desktop-bo514et-seoul-dengoku",
    [string]$Labels = "seoul-dengoku"
)

$ErrorActionPreference = "Stop"

if (-not $RunnerRoot.StartsWith("E:\git\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "RunnerRoot must stay under E:\git"
}

New-Item -ItemType Directory -Force $RunnerRoot | Out-Null
$release = Invoke-RestMethod -Headers @{ "User-Agent" = "seoul-kenshi-runner-setup" } `
    -Uri "https://api.github.com/repos/actions/runner/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match '^actions-runner-win-x64-.*\.zip$' } | Select-Object -First 1
if (-not $asset) { throw "latest Windows x64 runner archive not found" }

$archive = Join-Path $RunnerRoot $asset.name
Invoke-WebRequest -Headers @{ "User-Agent" = "seoul-kenshi-runner-setup" } -Uri $asset.browser_download_url -OutFile $archive
Expand-Archive -Path $archive -DestinationPath $RunnerRoot -Force
Remove-Item $archive -Force

Push-Location $RunnerRoot
try {
    $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    $serviceArgs = if ($isAdministrator) { @('--runasservice') } else { @() }
    if (-not (Test-Path '.runner')) {
        & .\config.cmd --unattended --replace `
            --url $RepositoryUrl `
            --token $RegistrationToken `
            --name $RunnerName `
            --labels $Labels `
            --work "_work" `
            @serviceArgs
        if ($LASTEXITCODE -ne 0) { throw "runner configuration failed: $LASTEXITCODE" }
    }
} finally {
    Pop-Location
}

if ($isAdministrator) {
    $service = Get-Service | Where-Object { $_.Name -like 'actions.runner.*' -and $_.DisplayName -like "*$RunnerName*" } | Select-Object -First 1
    if (-not $service) { throw "runner service was not installed" }
    if ($service.Status -ne 'Running') { Start-Service $service.Name }
    Set-Service $service.Name -StartupType Automatic
    Write-Host "RUNNER_SETUP_PASS mode=service name=$RunnerName root=$RunnerRoot labels=$Labels"
} else {
    $runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
    $runCommand = '"' + (Join-Path $RunnerRoot 'run.cmd') + '"'
    New-Item -Path $runKey -Force | Out-Null
    Set-ItemProperty -Path $runKey -Name 'SeoulDengokuGitHubRunner' -Value $runCommand
    $listener = Get-Process | Where-Object { $_.ProcessName -eq 'Runner.Listener' -and $_.Path -like "$RunnerRoot*" } | Select-Object -First 1
    if (-not $listener) {
        Start-Process -FilePath (Join-Path $RunnerRoot 'run.cmd') -WorkingDirectory $RunnerRoot -WindowStyle Hidden
    }
    Write-Host "RUNNER_SETUP_PASS mode=user-startup name=$RunnerName root=$RunnerRoot labels=$Labels"
}
