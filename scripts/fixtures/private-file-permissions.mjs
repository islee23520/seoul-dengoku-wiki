import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync } from 'node:fs';

// Read-only receipt for the inherited file ACL; no paths, account names or SIDs escape.
export function inspectPrivateFixturePermissions(path) {
  const result = spawnSync('C:/Program Files/PowerShell/7/pwsh.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', `
$ErrorActionPreference = 'Stop'
try {
  $acl = Get-Acl -LiteralPath ([Console]::In.ReadToEnd())
  $descriptor = [System.Security.AccessControl.RawSecurityDescriptor]::new($acl.GetSecurityDescriptorBinaryForm(), 0)
  $current = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  $trusted = @($current, 'S-1-5-18', 'S-1-5-32-544')
  $rules = @($descriptor.DiscretionaryAcl | ForEach-Object {
    $role = if ($_.SecurityIdentifier.Value -eq $current) { 'current' } elseif ($_.SecurityIdentifier.Value -eq 'S-1-5-18') { 'system' } elseif ($_.SecurityIdentifier.Value -eq 'S-1-5-32-544') { 'administrators' } else { 'external' }
    [pscustomobject]@{ role=$role; allow=($_.AceType -eq 'AccessAllowed'); inherited=(($_.AceFlags -band 16) -ne 0); supported=($_ -is [System.Security.AccessControl.CommonAce] -and -not $_.IsCallback) }
  })
  [pscustomobject]@{ ownerTrusted=($descriptor.Owner.Value -in $trusted); daclPresent=(($descriptor.ControlFlags -band 4) -ne 0 -and $null -ne $descriptor.DiscretionaryAcl); rules=$rules } | ConvertTo-Json -Depth 3 -Compress
} catch { exit 20 }
`], { input: path, encoding: 'utf8', timeout: 10000, maxBuffer: 4096, windowsHide: true });
  if (result.error || result.status !== 0) return { inspection: 'failed', status: result.status,
    childErrorCode: result.error?.code === 'ETIMEDOUT' ? 'ETIMEDOUT' : result.error ? 'OTHER' : null };
  try { return JSON.parse(result.stdout); } catch { return { inspection: 'bad-receipt' }; }
}

// Test-owned paths only. Production readers must never repair permissions.
export function setPrivateFixturePermissions(path, { directory = false, broad = false, untrustedOwner = false } = {}) {
  if (process.platform !== 'win32') {
    chmodSync(path, directory ? 0o700 : broad ? 0o644 : 0o600);
    return;
  }
  const result = spawnSync('C:/Program Files/PowerShell/7/pwsh.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', `
$ErrorActionPreference = 'Stop'
$path = [Console]::In.ReadToEnd()
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = [System.Security.AccessControl.${directory ? 'DirectorySecurity' : 'FileSecurity'}]::new()
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner(${untrustedOwner ? "[System.Security.Principal.SecurityIdentifier]::new('S-1-5-32-545')" : '$sid'})
foreach ($identity in @($sid.Value, 'S-1-5-18', 'S-1-5-32-544'${broad ? ", 'S-1-5-32-545'" : ''})) {
  $principal = [System.Security.Principal.SecurityIdentifier]::new($identity)
  $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($principal, 'FullControl', '${directory ? 'ContainerInherit, ObjectInherit' : 'None'}', 'None', 'Allow')
  $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $path -AclObject $acl
`], { input: path, encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
}
