import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const powershell = 'C:/Program Files/PowerShell/7/pwsh.exe';
const inspectAcl = `
$ErrorActionPreference = 'Stop'
$exceptionStatus = 20
try {
  $path = [Console]::In.ReadToEnd()
  $acl = [System.Security.AccessControl.FileSecurity]::new($path, [System.Security.AccessControl.AccessControlSections]'Access, Owner')
  $exceptionStatus = 21
  $descriptor = [System.Security.AccessControl.RawSecurityDescriptor]::new($acl.GetSecurityDescriptorBinaryForm(), 0)
  $exceptionStatus = 22
  $trusted = @([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value, 'S-1-5-18', 'S-1-5-32-544')
  $exceptionStatus = 23
  if ($null -eq $descriptor.Owner -or $descriptor.Owner.Value -notin $trusted) { exit 10 }
  if (($descriptor.ControlFlags -band [System.Security.AccessControl.ControlFlags]::DiscretionaryAclPresent) -eq 0 -or $null -eq $descriptor.DiscretionaryAcl) { exit 11 }
  foreach ($ace in $descriptor.DiscretionaryAcl) {
    if ($ace -isnot [System.Security.AccessControl.CommonAce] -or $ace.IsCallback) { exit 12 }
    if ($ace.AceType -notin @([System.Security.AccessControl.AceType]::AccessAllowed, [System.Security.AccessControl.AceType]::AccessDenied)) { exit 13 }
    if ($ace.AceType -eq [System.Security.AccessControl.AceType]::AccessAllowed -and $ace.SecurityIdentifier.Value -notin $trusted) { exit 14 }
  }
  [Console]::Out.Write('PRIVATE_FILE_ALLOWED')
} catch { exit $exceptionStatus }
`;
const reasons = Object.freeze({
  10: 'policy-owner', 11: 'policy-dacl', 12: 'policy-ace', 13: 'policy-ace-type', 14: 'policy-allow',
  20: 'query-exception', 21: 'descriptor-exception', 22: 'identity-exception', 23: 'inspection-exception',
});

// Read-only and deliberately uncached: an ACL may change between two opens.
// No source contents or account names cross the child-process boundary.
export function assertPrivateFilePermissions(path) {
  const mode = statSync(path).mode & 0o777;
  if (process.platform !== 'win32') {
    if (mode !== 0o600) throw Object.assign(new Error('E_PRIVATE_MODE'), { code: 'E_PRIVATE_MODE' });
    return;
  }
  const started = performance.now();
  const result = spawnSync(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', inspectAcl], {
    input: resolve(path), encoding: 'utf8', timeout: 10000, maxBuffer: 1024, windowsHide: true,
  });
  if (result.error || result.status !== 0 || result.stdout !== 'PRIVATE_FILE_ALLOWED') {
    // Only fixed classifications and bounded scalar metadata may leave this boundary.
    // In particular, never retain child Error/message, stderr, stdout or command arguments.
    const branch = result.error ? 'child-error' : result.status !== 0 ? 'child-status' : 'bad-sentinel';
    const diagnostic = Object.freeze({
      branch,
      reason: branch === 'child-status' ? reasons[result.status] ?? 'unclassified-status' : branch,
      childErrorCode: result.error ? (['ETIMEDOUT', 'ENOENT', 'EACCES', 'EPERM', 'ENOBUFS'].includes(result.error.code) ? result.error.code : 'OTHER') : null,
      status: Number.isInteger(result.status) && result.status >= 0 && result.status <= 255 ? result.status : null,
      signal: result.signal ? (['SIGTERM', 'SIGKILL', 'SIGABRT', 'SIGINT'].includes(result.signal) ? result.signal : 'OTHER') : null,
      elapsedMs: Math.min(2147483647, Math.max(0, Math.round(performance.now() - started))),
      stdoutLength: typeof result.stdout === 'string' ? Math.min(1025, result.stdout.length) : 0,
      sentinelMatch: result.stdout === 'PRIVATE_FILE_ALLOWED',
    });
    throw Object.assign(new Error('E_PRIVATE_MODE'), { code: 'E_PRIVATE_MODE', diagnostic });
  }
}
