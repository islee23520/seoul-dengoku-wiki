param(
    [string]$InstallerUrl,
    [string]$InstallerSha256,
    [string]$Url,
    [string]$Sha256,
    [string]$Destination,
    [switch]$AllowLocalHttp
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$work = $null
try {
    foreach ($value in @($InstallerUrl, $Url, $Destination)) {
        if ([string]::IsNullOrWhiteSpace($value)) { throw 'INVALID_ARGUMENTS' }
    }
    foreach ($digest in @($InstallerSha256, $Sha256)) {
        if ($digest -cnotmatch '^[a-f0-9]{64}$') { throw 'INVALID_ARGUMENTS' }
    }
    foreach ($value in @($InstallerUrl, $Url)) {
        $uri = $null
        if (-not [Uri]::TryCreate($value, [UriKind]::Absolute, [ref]$uri)) { throw 'INVALID_URL' }
        if ($uri.UserInfo) { throw 'INVALID_URL' }
        $local = $uri.Host -in @('localhost', '127.0.0.1', '[::1]', '::1')
        if ($uri.Scheme -ne 'https' -and -not ($uri.Scheme -eq 'http' -and $local -and $AllowLocalHttp)) { throw 'INVALID_URL' }
    }
    if (Test-Path -LiteralPath $Destination) { throw 'DESTINATION_EXISTS' }
    $work = Join-Path ([IO.Path]::GetTempPath()) ('portrait-bootstrap-' + [Guid]::NewGuid().ToString('N'))
    [void](New-Item -ItemType Directory -Path $work)
    $installer = Join-Path $work 'portrait-install.exe'
    $request = [Net.HttpWebRequest]::Create($InstallerUrl)
    $request.AllowAutoRedirect = $false
    $request.Timeout = 120000
    $request.ReadWriteTimeout = 120000
    $response = $request.GetResponse()
    try {
        if ([int]$response.StatusCode -lt 200 -or [int]$response.StatusCode -ge 300) { throw 'DOWNLOAD_FAILED' }
        $stream = [IO.File]::Open($installer, [IO.FileMode]::CreateNew)
        try { $response.GetResponseStream().CopyTo($stream) } finally { $stream.Dispose() }
    } finally { $response.Dispose() }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $installer).Hash.ToLowerInvariant() -ne $InstallerSha256) { throw 'CHECKSUM_MISMATCH' }
    $arguments = @('--url', $Url, '--sha256', $Sha256, '--destination', $Destination)
    if ($AllowLocalHttp) { $arguments += '--allow-local-http' }
    & $installer @arguments
    if ($LASTEXITCODE -ne 0) { throw 'INSTALL_FAILED' }
} catch {
    [Console]::Error.WriteLine('BOOTSTRAP_FAILED')
    exit 1
} finally {
    if ($null -ne $work -and (Test-Path -LiteralPath $work)) { Remove-Item -LiteralPath $work -Recurse -Force }
}
exit 0
