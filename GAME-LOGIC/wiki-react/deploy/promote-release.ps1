param(
    [Parameter(Mandatory = $true)][string]$Current,
    [Parameter(Mandatory = $true)][string]$Next,
    [Parameter(Mandatory = $true)][string]$Previous,
    [ValidateSet('none', 'after-current-move', 'after-next-move')][string]$FailPoint = 'none'
)

$ErrorActionPreference = 'Stop'
$state = 'initial'

try {
    if (Test-Path $Previous) { cmd /c "rmdir /s /q `"$Previous`"" }
    if (Test-Path $Current) {
        Move-Item -Path $Current -Destination $Previous
        $state = 'current-moved'
    }
    if ($FailPoint -eq 'after-current-move') { throw 'injected failure after current move' }

    Move-Item -Path $Next -Destination $Current
    $state = 'next-promoted'
    if ($FailPoint -eq 'after-next-move') { throw 'injected failure after next move' }

    Write-Output 'PROMOTION_PASS'
} catch {
    if ($state -eq 'next-promoted' -and (Test-Path $Current)) {
        cmd /c "rmdir /s /q `"$Current`""
    }
    if (($state -eq 'current-moved' -or $state -eq 'next-promoted') -and (Test-Path $Previous)) {
        Move-Item -Path $Previous -Destination $Current
    }
    throw
}
