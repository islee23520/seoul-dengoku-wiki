param(
  [Parameter(Mandatory=$true)][string]$RootPath,
  [Parameter(Mandatory=$true)][string]$ServiceName,
  [string]$NodeSource,
  [string]$ServerSource,
  [string]$ServerSha256,
  [Parameter(Mandatory=$true)][string]$CompilerSha256,
  [Parameter(Mandatory=$true)][string]$PowerShellSha256,
  [Parameter(Mandatory=$true)][string]$HostSourceSha256,
  [ValidateSet('Stage','Fence','Permit','Definition','RegisterAttestor','ATTEST')][string]$Mode='Stage',
  [string]$InstallerSha256='',
  [string]$AttestorSignerThumbprint='',
  [switch]$SyntheticQualification,
  [switch]$FilteredWorkload,
  [switch]$KnownDllsCandidate,
  [string]$KnownDllsAdmissionPath='',
  [string]$PrivateDesktopName='',
  [switch]$NodeDirect,
  [Microsoft.Win32.SafeHandles.SafeFileHandle]$OwnedPrivateRoot=$null,
  [ValidateSet('','token-create','token-owner','token-dacl','process-create','job-list','resume')][string]$TokenFault='',
  [string]$RawPeerPath='',
  [string]$ActionId,
  [ValidateSet('normal','before-resume','object-rights-only','runtime-credited','diagnostic-command','debugger-command','known-dlls-gate','known-dlls-isolation','known-dlls-command','private-desktop-command','node-direct')][string]$TestMode='normal',
  [string]$TestEvent='',
  [string]$ObservationEvent='',
  [int]$StartupDeadlineMs=30000,
  [int]$StopDeadlineMs=10000,
  [string]$ActivationRecordPath='',
  [string]$ActivationRecordSha256='',
  [string]$ExpectedOldWriterPath,
  [string]$ObservedOldWritersPath
)
$ErrorActionPreference='Stop'
# Production staging remains an explicit operator-owned migration. This issuer
# never copies a database or manufactures authority from synthetic qualification.
$project=$RootPath.Replace('\','/').TrimEnd('/') -ieq 'E:/portal-authority' -and $ServiceName -ceq 'seoul-dengoku-tools-portal-native'
$profiles=@{portal=@{service='seoul-dengoku-tools-portal-native';root='E:/portal-authority'};image=@{service='seoul-dengoku-tools-image-native';root='E:/portal-authority/image'}}
$image=$ServiceName -ceq $profiles.image.service -and $RootPath.Replace('\','/').TrimEnd('/') -ieq $profiles.image.root
$project=$project -or $image
$synthetic=$SyntheticQualification -and $RootPath.Replace('\','/') -match '^E:/task22-native-service-[a-f0-9]{16}$' -and $ServiceName -match '^PortalNativeTest_[a-f0-9]{16}(_sibling)?$'
if(-not $project -and -not $synthetic){throw 'PROJECT_INSTALLATION_BINDING'}
if(-not $project -and $Mode -in @('RegisterAttestor','ATTEST')){throw 'SYNTHETIC_ATTESTOR_FORBIDDEN'}
if($NodeDirect -and (-not $PrivateDesktopName -or ($Mode -ne 'Stage' -and $TestMode -cne 'node-direct'))){throw 'NODE_DIRECT_COMPOSITION_BINDING'}
if($PrivateDesktopName -or $TestMode -eq 'private-desktop-command' -or $TestMode -eq 'node-direct'){
  if(-not $synthetic -or -not $FilteredWorkload -or -not $KnownDllsCandidate -or -not $KnownDllsAdmissionPath -or $TestEvent -or $TokenFault -or $RawPeerPath -or
     $PrivateDesktopName -cnotmatch '^Task22Private_[a-f0-9]{32}$' -or ($Mode -ne 'Stage' -and $TestMode -cne $(if($NodeDirect){'node-direct'}else{'private-desktop-command'}))){throw 'PRIVATE_DESKTOP_COMPOSITION_BINDING'}
}
if($project){
  if($SyntheticQualification -or $FilteredWorkload -or $KnownDllsCandidate -or $KnownDllsAdmissionPath -or $PrivateDesktopName -or $NodeDirect -or $TokenFault -or $RawPeerPath -or $TestMode -cne 'normal' -or $TestEvent -or $ObservationEvent){throw 'PRODUCTION_SYNTHETIC_COMPOSITION'}
  if($Mode -eq 'Stage'){throw 'PRODUCTION_STAGING_REQUIRES_REVIEWED_MIGRATION'}
  if($Mode -eq 'Definition'){
    [ordered]@{schema='portal-native-service-definition.v1';serviceName=$ServiceName;root=$RootPath;scope='PROJECT_REVIEWED';binaryPath=('"'+$RootPath+'/code/native-service-host.exe" '+$ServiceName+' "'+$RootPath+'/installation.json"');serviceType='SERVICE_WIN32_OWN_PROCESS';account=('NT SERVICE\'+$ServiceName);sidType='SERVICE_SID_TYPE_UNRESTRICTED';start='DEMAND_START';failureActions=@();registration='NOT_REGISTERED';activation='DISABLED_NO_SIGNED_PERMIT'}|ConvertTo-Json -Depth 5
    return
  }
}elseif($ActivationRecordPath -or $ActivationRecordSha256){
  throw 'SYNTHETIC_PRODUCTION_AUTHORITY_FORBIDDEN'
}
$RootPath=[IO.Path]::GetFullPath($RootPath)
$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'INSTALL_ADMIN_REQUIRED' }
$compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$powershell='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
$source=Join-Path $PSScriptRoot 'native-service-host.cs'
function Hash([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
foreach ($entry in @(@($compiler,$CompilerSha256),@($powershell,$PowerShellSha256),@($source,$HostSourceSha256))) {
  if ($entry[1] -cnotmatch '^[a-f0-9]{64}$' -or (Hash $entry[0]) -cne $entry[1]) { throw 'INSTALL_TOOL_HASH' }
}
foreach($toolPath in @($compiler,$powershell)){
  $cursor=Get-Item -Force -LiteralPath $toolPath
  while($cursor){
    if($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'INSTALL_TOOL_REPARSE'}
    $acl=Get-Acl -LiteralPath $cursor.FullName
    $trusted=@('S-1-5-18','S-1-5-32-544','S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464')
    if($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -notin $trusted){throw 'INSTALL_TOOL_OWNER'}
    foreach($ace in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
      if($ace.AccessControlType -eq 'Allow' -and -not ($ace.PropagationFlags -band [Security.AccessControl.PropagationFlags]::InheritOnly) -and
         $ace.IdentityReference.Value -notin $trusted -and ([long]$ace.FileSystemRights -band 0xd0156)){throw 'INSTALL_TOOL_WRITABLE_ANCESTRY'}
    }
    $cursor=if($cursor.PSIsContainer){$cursor.Parent}else{$cursor.Directory}
  }
}
if ((Get-AuthenticodeSignature -LiteralPath $compiler).Status -ne 'Valid' -or
    (Get-AuthenticodeSignature -LiteralPath $powershell).Status -ne 'Valid') { throw 'INSTALL_TOOL_SIGNATURE' }
# Administrative helper only; runtime never builds its own SCM host. Add-Type's
# compiler/reference closure is captured separately from the absolute csc build.
if (-not ('NativeInstallation' -as [type])) { Add-Type -Path $source -ReferencedAssemblies @('System.Web.Extensions','System.Core') }
function WriteNew([string]$Path,[string]$Text) {
  $stream=[IO.FileStream]::new($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
  try { $bytes=[Text.UTF8Encoding]::new($false).GetBytes($Text);$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true) } finally {$stream.Dispose()}
  $acl=Get-Acl -LiteralPath $Path;$acl.SetOwner([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'));Set-Acl -LiteralPath $Path -AclObject $acl
}
function JsonNew([string]$Path,$Value) { WriteNew $Path (ConvertTo-Json -InputObject $Value -Depth 15) }
function CopyNew([string]$From,[string]$To,[string]$Expected) {
  $input=[IO.File]::Open($From,'Open','Read','Read')
  try {
    $output=[IO.FileStream]::new($To,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
    try { $input.CopyTo($output);$output.Flush($true) } finally {$output.Dispose()}
  } finally {$input.Dispose()}
  if ((Hash $To) -cne $Expected) { throw 'INSTALL_COPY_HASH' }
  $acl=Get-Acl -LiteralPath $To;$acl.SetOwner([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'));Set-Acl -LiteralPath $To -AclObject $acl
}
$sid=[NativeInstallation]::ServiceSid($ServiceName)
if($Mode -in @('RegisterAttestor','ATTEST')){
  if($InstallerSha256 -cnotmatch '^[a-f0-9]{64}$' -or (Hash $PSCommandPath) -cne $InstallerSha256 -or [IO.Path]::GetFullPath($PSCommandPath) -cne (Join-Path $RootPath 'code/install-personal-native.ps1')){throw 'ATTEST_INSTALLER_PIN'}
  $signature=Get-AuthenticodeSignature -LiteralPath $PSCommandPath
  if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Thumbprint -cne $AttestorSignerThumbprint){throw 'ATTEST_SCRIPT_SIGNATURE'}
  $selected=[NativeServiceProfile]::Select($ServiceName,$RootPath,$sid)
  $pins=[Collections.Generic.List[IDisposable]]::new()
  try{
    [NativeInstallation]::AdmitVolumeRoot('E:\');$pins.Add([NativeInstallation]::Pin('E:\',$true))
    if($image){[NativeInstallation]::AdmitVolumeRoot('E:\portal-authority');$pins.Add([NativeInstallation]::Pin('E:\portal-authority',$true))}
    foreach($leaf in @('','code','action')){$path=if($leaf){Join-Path $RootPath $leaf}else{$RootPath};$pins.Add([NativeInstallation]::Pin($path,$true));[NativeInstallation]::AdmitAcl($path,$sid,$false,$true)}
    foreach($path in @($PSCommandPath,$source,(Join-Path $RootPath 'installation.json'))){$pins.Add([NativeInstallation]::Pin($path,$false));[NativeInstallation]::AdmitAcl($path,$sid,$false,$false)}
    $manifestPath=Join-Path $RootPath 'installation.json';$manifest=[Web.Script.Serialization.JavaScriptSerializer]::new().DeserializeObject([IO.File]::ReadAllText($manifestPath))
    if($manifest['serviceName'] -cne $ServiceName -or $manifest['serviceSid'] -cne $sid -or $manifest['hostSourceSha256'] -cne $HostSourceSha256){throw 'ATTEST_INSTALL_BINDING'}
    $secret=Join-Path $RootPath 'attestor-secret';$keyPath=Join-Path $secret 'signing-key.xml'
    foreach($path in @($secret,$keyPath)){
      $directory=$path -ceq $secret;$pins.Add([NativeInstallation]::Pin($path,$directory));$acl=Get-Acl -LiteralPath $path
      if(-not $acl.AreAccessRulesProtected -or $acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -notin @('S-1-5-18','S-1-5-32-544')){throw 'ATTEST_KEY_CUSTODY'}
      foreach($ace in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($ace.IdentityReference.Value -notin @('S-1-5-18','S-1-5-32-544') -or $ace.AccessControlType -ne 'Allow'){throw 'ATTEST_KEY_CUSTODY'}}
    }
    $rsa=[Security.Cryptography.RSACryptoServiceProvider]::new();$rsa.PersistKeyInCsp=$false
    try{
      $rsa.FromXmlString([IO.File]::ReadAllText($keyPath));if($rsa.KeySize -lt 3072 -or $rsa.PublicOnly){throw 'ATTEST_PRIVATE_KEY_REQUIRED'}
      $publicKey=$rsa.ToXmlString($false);$publicHash=[NativeStartupAttestor]::Digest([Text.Encoding]::UTF8.GetBytes($publicKey))
      if($Mode -eq 'RegisterAttestor'){
        $taskName=$ServiceName+'-startup-attestor'
        # Scheduler executes only this immutable bootstrap. No task parameters,
        # paths, executable names or shell text come from the startup request.
        $invoke="& '$PSCommandPath' -Mode ATTEST -RootPath '$RootPath' -ServiceName '$ServiceName' -CompilerSha256 '$CompilerSha256' -PowerShellSha256 '$PowerShellSha256' -HostSourceSha256 '$HostSourceSha256' -InstallerSha256 '$InstallerSha256' -AttestorSignerThumbprint '$AttestorSignerThumbprint'"
        $bootstrap="`$ErrorActionPreference='Stop';if((Get-FileHash -LiteralPath '$PSCommandPath' -Algorithm SHA256).Hash.ToLowerInvariant() -cne '$InstallerSha256'){throw 'ATTEST_INSTALLER_PIN'};"+$invoke
        $arguments='-NoLogo -NoProfile -NonInteractive -ExecutionPolicy AllSigned -EncodedCommand '+[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($bootstrap))
        $scheduler=New-Object -ComObject Schedule.Service;$scheduler.Connect();$folder=$scheduler.GetFolder('\')
        if(@($folder.GetTasks(1)|Where-Object {$_.Name -ceq $taskName}).Count){throw 'ATTEST_TASK_COLLISION'}
        $definition=$scheduler.NewTask(0);$definition.RegistrationInfo.Description='Pinned on-demand native startup fence attestor'
        $definition.Principal.UserId='SYSTEM';$definition.Principal.LogonType=5;$definition.Principal.RunLevel=1
        $definition.Settings.Enabled=$true;$definition.Settings.AllowDemandStart=$true;$definition.Settings.StartWhenAvailable=$false
        $definition.Settings.DisallowStartIfOnBatteries=$false;$definition.Settings.StopIfGoingOnBatteries=$false;$definition.Settings.MultipleInstances=2;$definition.Settings.ExecutionTimeLimit='PT1M'
        $action=$definition.Actions.Create(0);$action.Path=$powershell;$action.Arguments=$arguments;$action.WorkingDirectory=Join-Path $RootPath 'code'
        $task=$folder.RegisterTaskDefinition($taskName,$definition,2,'SYSTEM',$null,5,"O:BAG:BAD:P(A;;GA;;;SY)(A;;GA;;;BA)(A;;GRGX;;;$sid)")
        $xmlHash=[NativeStartupAttestor]::Digest([Text.Encoding]::UTF8.GetBytes($task.Xml))
        $resultDirectory=Join-Path $RootPath 'status/attestations'
        [NativeInstallation]::CreateExclusive($resultDirectory,"O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;$sid)")
        WriteNew (Join-Path $RootPath 'action/attestor-public-key.xml') $publicKey
        JsonNew (Join-Path $RootPath 'action/attestor.json') ([ordered]@{schema='native-startup-attestor.v1';serviceName=$ServiceName;root=$RootPath;taskName=('\'+$taskName);taskXmlSha256=$xmlHash;publicKeySha256=$publicHash;installerSha256=$InstallerSha256;hostSourceSha256=$HostSourceSha256;powershellSha256=$PowerShellSha256;signerThumbprint=$AttestorSignerThumbprint})
        Write-Output ('ATTESTOR_REGISTERED config='+(Hash (Join-Path $RootPath 'action/attestor.json')));return
      }
      if([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -cne 'S-1-5-18'){throw 'ATTEST_SYSTEM_REQUIRED'}
      $pins.Add([NativeInstallation]::PinWritableDirectory((Join-Path $RootPath 'status'),$sid))
      $resultDirectory=Join-Path $RootPath 'status/attestations';$pins.Add([NativeInstallation]::Pin($resultDirectory,$true));[NativeInstallation]::AdmitAcl($resultDirectory,$sid,$false,$true)
      $requestPath=Join-Path $RootPath 'status/startup-request.json';$pins.Add([NativeInstallation]::Pin($requestPath,$false))
      if((Get-Item -LiteralPath $requestPath).Length -gt 4096){throw 'ATTEST_REQUEST_SIZE'}
      $request=[Web.Script.Serialization.JavaScriptSerializer]::new().DeserializeObject([IO.File]::ReadAllText($requestPath))
      $nonce=$request['nonce'];if($nonce -cnotmatch '^[a-f0-9]{32}$' -or $request['schema'] -cne 'native-startup-request.v1'){throw 'ATTEST_REQUEST'}
      $requested=[NativeStartupAttestor]::Time($request['requestedUtc']);if($requested -gt [DateTime]::UtcNow -or ([DateTime]::UtcNow-$requested).TotalSeconds -ge 60){throw 'ATTEST_REQUEST_EXPIRED'}
      $permitPath=Join-Path $RootPath 'action/permit.json';$pins.Add([NativeInstallation]::Pin($permitPath,$false));[NativeInstallation]::AdmitAcl($permitPath,$sid,$false,$false)
      $permit=[Web.Script.Serialization.JavaScriptSerializer]::new().DeserializeObject([IO.File]::ReadAllText($permitPath))
      if($permit['activationSha256'] -cne $request['activationSha256'] -or $permit['installationSha256'] -cne (Hash $manifestPath) -or $permit['serviceName'] -cne $ServiceName){throw 'ATTEST_REQUEST_BINDING'}
      foreach($leaf in @('activation.json','activation-public-key.xml','owner-decision.json','container-inspect.json')){$path=Join-Path $RootPath ('action/'+$leaf);$pins.Add([NativeInstallation]::Pin($path,$false));[NativeInstallation]::AdmitAcl($path,$sid,$false,$false)}
      $ownerHash=Hash (Join-Path $RootPath 'action/owner-decision.json');if($ownerHash -cne $manifest['ownerDecisionSha256']){throw 'ATTEST_OWNER_BINDING'}
      $record=[NativeProductionActivation]::VerifyProfileRecord([IO.File]::ReadAllBytes((Join-Path $RootPath 'action/activation.json')),$request['activationSha256'],[IO.File]::ReadAllText((Join-Path $RootPath 'action/activation-public-key.xml')),$manifest['activationPublicKeySha256'],(Hash $manifestPath),$ownerHash,$permit['actionId'],[DateTime]::UtcNow,$selected)
      $config=[NativeStartupAttestor]::Config($selected,$record,$pins)
      if($config['publicKeySha256'] -cne $publicHash -or $config['installerSha256'] -cne $InstallerSha256 -or $config['hostSourceSha256'] -cne $HostSourceSha256 -or $config['powershellSha256'] -cne $PowerShellSha256 -or $config['signerThumbprint'] -cne $AttestorSignerThumbprint){throw 'ATTEST_CONFIG_BINDING'}
      $writers=[NativeStartupAttestor]::WriterDigest($record);if($writers -cne $request['writerSetSha256']){throw 'ATTEST_WRITER_BINDING'}
      $probe=[NativeStartupAttestor]::ProbeDiagnostic('ProbeWriters',[Action]{[NativeStartupAttestor]::ProbeWriters($record,$selected)})
      if($probe['status'] -ceq 'PASS'){
        $probe=[NativeStartupAttestor]::ProbeDiagnostic('VerifyFence',[Action]{if($image){[NativeProductionActivation]::VerifyImageFence($record)}else{[NativeProductionActivation]::VerifyFence($RootPath,$selected.Authority,$sid,$record)}})
      }
      $status=$probe['status'];$failure=$probe['failure']
      $now=[DateTime]::UtcNow;if(($now-$requested).TotalSeconds -ge 60 -or [NativeStartupAttestor]::Time($record['expiresUtc']) -le $now){throw 'ATTEST_LATE_OR_ACTIVATION_EXPIRED'}
      $payload=[Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -Depth 15 -Compress -InputObject ([ordered]@{schema='native-startup-fence.v1';activationSha256=$request['activationSha256'];nonce=$nonce;writerSetSha256=$writers;requestedUtc=$requested.ToString('o');issuedUtc=$now.ToString('o');expiresUtc=$now.AddSeconds(60).ToString('o');status=$status;failure=$failure})))
      $signature=$rsa.SignData($payload,[Security.Cryptography.CryptoConfig]::MapNameToOID('SHA256'))
      $result=Join-Path $RootPath ('status/attestations/'+$nonce+'.json')
      $envelope=[Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -Compress -InputObject @{payload=[Convert]::ToBase64String($payload);signature=[Convert]::ToBase64String($signature)}))
      [NativeStartupAttestor]::PublishResult($result,$envelope,$sid);if($status -cne 'PASS'){throw 'ATTEST_PROBE_FAILED'}
      Write-Output ('ATTEST_PASS nonce='+$nonce+' writers='+$writers)
    }finally{$rsa.Dispose()}
  }finally{foreach($pin in $pins){$pin.Dispose()}}
  return
}
if($image){
  if($NodeSource -or $ServerSource -or $ServerSha256 -or $ExpectedOldWriterPath -or $ObservedOldWritersPath){throw 'IMAGE_PORTAL_ARGUMENTS'}
  if($ActionId -cnotmatch '^[a-f0-9]{32}$'){throw 'PERMIT_ARGUMENTS'}
  $selected=[NativeServiceProfile]::Select($ServiceName,$RootPath,$sid)
  $pins=[Collections.Generic.List[IDisposable]]::new()
  try{
    $manifest=[NativeProductionActivation]::AdmitImageInstallation($RootPath,$ServiceName,$HostSourceSha256,$pins)
    if(-not $ActivationRecordPath -or [IO.Path]::GetFullPath($ActivationRecordPath) -cne (Join-Path $RootPath 'action/activation.json')){throw 'ACTIVATION_RECORD_PATH'}
    $record=[NativeProductionActivation]::VerifyImageActivation($manifest,$ActivationRecordSha256,$ActionId)
    [void][NativeStartupAttestor]::Config($selected,$record,$pins)
    [void][NativeStartupAttestor]::WriterDigest($record)
    [NativeProductionActivation]::VerifyProfileOldWriterProcess($record,$selected)
    $pins.Add([NativeInstallation]::Pin($selected.Authority,$false))
    [NativeProductionActivation]::VerifyImageFence($record)
    if($Mode -eq 'Fence'){Write-Output ('IMAGE_FENCE_PASS activation='+$ActivationRecordSha256);return}
    $permit=[ordered]@{schema='image-native-permit.v1';scope='PRODUCTION_REVIEWED';serviceProfile='image';serviceName=$ServiceName;installationSha256=(Hash (Join-Path $RootPath 'installation.json'));tokenProfile=[NativeProductionActivation]::Profile;fence='ENFORCED_ACTOR_EXCLUSION';testMode='normal';actionId=$ActionId;activationSha256=$ActivationRecordSha256}
    JsonNew (Join-Path $RootPath 'action/permit.json') $permit
    JsonNew (Join-Path $RootPath 'action/issuance.json') ([ordered]@{schema='image-production-issuance.v1';at=[DateTime]::UtcNow.ToString('o');operator=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;activationSha256=$ActivationRecordSha256;permitSha256=(Hash (Join-Path $RootPath 'action/permit.json'));fence='PASS';actionId=$ActionId})
    Write-Output ('IMAGE_PRODUCTION_REVIEWED_PERMIT '+$ActionId)
  }finally{foreach($pin in $pins){$pin.Dispose()}}
  return
}
if($project){
  if($ActionId -cnotmatch '^[a-f0-9]{32}$' -or $StartupDeadlineMs -lt 1 -or $StartupDeadlineMs -gt 120000 -or $StopDeadlineMs -lt 1 -or $StopDeadlineMs -gt 120000){throw 'PERMIT_ARGUMENTS'}
  $pins=[Collections.Generic.List[IDisposable]]::new()
  try{
    [NativeInstallation]::AdmitVolumeRoot('E:\');$pins.Add([NativeInstallation]::Pin('E:\',$true))
    $pins.Add([NativeInstallation]::Pin($RootPath,$true));[NativeInstallation]::AdmitAcl($RootPath,$sid,$false,$true)
    foreach($leaf in @('code','action','data','temp','status')){
      $path=Join-Path $RootPath $leaf;$writable=$leaf -in @('data','temp','status')
      if($writable){$pins.Add([NativeInstallation]::PinWritableDirectory($path,$sid))}else{$pins.Add([NativeInstallation]::Pin($path,$true));[NativeInstallation]::AdmitAcl($path,$sid,$false,$true)}
    }
    $manifestPath=Join-Path $RootPath 'installation.json';$pins.Add([NativeInstallation]::Pin($manifestPath,$false));[NativeInstallation]::AdmitAcl($manifestPath,$sid,$false,$false)
    $manifest=[IO.File]::ReadAllText($manifestPath)|ConvertFrom-Json
    if($manifest.schema -cne 'portal-native-install.v1' -or $manifest.scope -cne 'PROJECT_REVIEWED' -or $manifest.serviceName -cne $ServiceName -or $manifest.serviceSid -cne $sid -or $manifest.tokenProfile -cne [NativeProductionActivation]::Profile -or $manifest.sourceSidType -cne '1' -or $manifest.hostSourceSha256 -cne $HostSourceSha256){throw 'PERMIT_INSTALLATION_BINDING'}
    foreach($file in $manifest.files){
      if($file.path -match '\.\.|:' -or [IO.Path]::IsPathRooted($file.path)){throw 'INSTALL_FILE_PATH'}
      $path=Join-Path $RootPath $file.path;$pins.Add([NativeInstallation]::Pin($path,$false));[NativeInstallation]::AdmitAcl($path,$sid,$false,$false)
      if((Hash $path) -cne $file.sha256){throw 'INSTALL_HASH'}
    }
    foreach($file in [NativeProductionActivation]::Candidate.GetEnumerator()){
      $path=Join-Path $RootPath ('code/'+$file.Key);$pins.Add([NativeInstallation]::Pin($path,$false));[NativeInstallation]::AdmitAcl($path,$sid,$false,$false)
      if((Hash $path) -cne $file.Value){throw 'ACTIVATION_CANDIDATE_DRIFT'}
    }
    $recordPath=Join-Path $RootPath 'action/activation.json'
    if(-not $ActivationRecordPath -or [IO.Path]::GetFullPath($ActivationRecordPath) -cne $recordPath){throw 'ACTIVATION_RECORD_PATH'}
    foreach($leaf in @('activation.json','activation-public-key.xml','owner-decision.json','container-inspect.json')){
      $path=Join-Path $RootPath ('action/'+$leaf);$pins.Add([NativeInstallation]::Pin($path,$false));[NativeInstallation]::AdmitAcl($path,$sid,$false,$false)
    }
    $ownerHash=Hash (Join-Path $RootPath 'action/owner-decision.json')
    if($ownerHash -cne $manifest.ownerDecisionSha256){throw 'ACTIVATION_OWNER_HASH'}
    $record=[NativeProductionActivation]::VerifyRecord([IO.File]::ReadAllBytes($recordPath),$ActivationRecordSha256,[IO.File]::ReadAllText((Join-Path $RootPath 'action/activation-public-key.xml')),$manifest.activationPublicKeySha256,(Hash $manifestPath),$ownerHash,$ActionId,[DateTime]::UtcNow)
    [void][NativeStartupAttestor]::Config([NativeServiceProfile]::Portal,$record,$pins)
    [void][NativeStartupAttestor]::WriterDigest($record)
    $config=[IO.File]::ReadAllText((Join-Path $RootPath 'code/launch.json'))|ConvertFrom-Json
    if($config.originalsDb -cne [NativeProductionActivation]::Database -or $config.serverPath -cne (Join-Path $RootPath 'code/server.mjs') -or $config.serverSha256 -cne [NativeProductionActivation]::Candidate['server.mjs']){throw 'ACTIVATION_CONFIG_BINDING'}
    [NativeProductionActivation]::VerifyFence($RootPath,[NativeProductionActivation]::Database,$sid,$record)
    # An actual old host token must deny writes, not merely encounter our read
    # pin's sharing violation. Probe before pinning the database for issuance.
    [NativeProductionActivation]::VerifyOldWriterProcess($record)
    $pins.Add([NativeInstallation]::Pin([NativeProductionActivation]::Database,$false))
    if($Mode -eq 'Fence'){Write-Output ('PRODUCTION_FENCE_PASS activation='+$ActivationRecordSha256);return}
    $permit=[ordered]@{schema='portal-native-permit.v1';installationSha256=(Hash $manifestPath);serviceName=$ServiceName;scope='PRODUCTION_REVIEWED';tokenProfile=[NativeProductionActivation]::Profile;tokenContract='';sourceSidType='1';windowsReadSids=@('S-1-5-32-545','S-1-5-12');tokenFault='';rawPeerPath='';fence='ENFORCED_ACTOR_EXCLUSION';actionId=$ActionId;testMode='normal';testEvent='';observationEvent='';startupDeadlineMs="$StartupDeadlineMs";stopDeadlineMs="$StopDeadlineMs";activationSha256=$ActivationRecordSha256}
    JsonNew (Join-Path $RootPath 'action/permit.json') $permit
    JsonNew (Join-Path $RootPath 'action/issuance.json') ([ordered]@{schema='portal-production-issuance.v1';at=[DateTime]::UtcNow.ToString('o');operator=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;activationSha256=$ActivationRecordSha256;permitSha256=(Hash (Join-Path $RootPath 'action/permit.json'));fence='PASS';actionId=$ActionId})
    Write-Output ('PRODUCTION_REVIEWED_PERMIT '+$ActionId+' activation='+$ActivationRecordSha256)
  }finally{foreach($pin in $pins){$pin.Dispose()}}
  return
}
if($KnownDllsCandidate -and -not $FilteredWorkload){throw 'KNOWNDLLS_FILTERED_REQUIRED'}
$base='O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)'
$read=$base+"(A;OICI;0x1200a9;;;$sid)"
# OWNER RIGHTS overrides the implicit owner WRITE_DAC on service-created files.
# No shared LocalService allow ACE is granted, including on writable paths.
$write=$base+"(A;OICI;0x1301bf;;;$sid)(A;OICI;RC;;;OW)"
$tokenProfile=if($FilteredWorkload){[NativeWorkloadToken]::Profile}else{'production-host-admission.v1'}
$tokenContract=if($FilteredWorkload){[NativeWorkloadToken]::Contract($sid,$RootPath)}else{''}
$sourceSidType=if($FilteredWorkload){'1'}else{'3'}
$windowsReadSids=if($FilteredWorkload){,@([NativeWorkloadToken]::ReadSid)}else{,@()}
if($KnownDllsCandidate){$tokenProfile=[NativeKnownDlls]::Profile;$tokenContract=[NativeWorkloadToken]::KnownDllsContract($sid,$RootPath);$windowsReadSids=@([NativeWorkloadToken]::ReadSid,[NativeKnownDlls]::CandidateSid)}
$knownDllsDescriptorSha256=if($KnownDllsCandidate){[NativeKnownDlls]::DescriptorSha256}else{''}
$knownDllsAdmissionSha256=if($KnownDllsAdmissionPath){if(-not $KnownDllsCandidate -or (Hash $KnownDllsAdmissionPath) -cne [NativeKnownDlls]::AdmissionSha256){throw 'KNOWNDLLS_ADMISSION_PROVENANCE'};[NativeKnownDlls]::AdmissionSha256}else{''}
$launchContext=if($PrivateDesktopName){[NativePrivateDesktop]::Contract($PrivateDesktopName,$sid,$RootPath,$HostSourceSha256,[bool]$NodeDirect)}else{''}
if ($Mode -eq 'Stage') {
  if($OwnedPrivateRoot){
    if(-not $PrivateDesktopName){throw 'INSTALL_ORIGINAL_ROOT_HANDLE'}
    [NativeInstallation]::VerifyOriginalDirectory($OwnedPrivateRoot,$RootPath)
    [NativeInstallation]::AdmitAcl($RootPath,$sid,$false,$true)
    foreach($leaf in @('code','action','data','temp','status')){if(Test-Path -LiteralPath (Join-Path $RootPath $leaf)){throw 'INSTALL_COLLISION'}}
  }elseif(Test-Path -LiteralPath $RootPath){throw 'INSTALL_COLLISION'}
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) { throw 'SERVICE_COLLISION' }
  if ((Get-Volume -DriveLetter E).FileSystem -cne 'NTFS') { throw 'INSTALL_NTFS_REQUIRED' }
  [NativeInstallation]::AdmitVolumeRoot('E:/')
  $pins=[Collections.Generic.List[IDisposable]]::new()
  try {
    $pins.Add([NativeInstallation]::Pin('E:/',$true))
    if(-not $OwnedPrivateRoot){[NativeInstallation]::CreateExclusive($RootPath,$read)}
    $pins.Add([NativeInstallation]::Pin($RootPath,$true))
    foreach ($directory in @('code','action','data','temp','status')) {
      $acl=if ($directory -in @('data','temp','status')) {$write}else{$read}
      [NativeInstallation]::CreateExclusive((Join-Path $RootPath $directory),$acl)
      if($directory -in @('data','temp','status')){$pins.Add([NativeInstallation]::PinWritableDirectory((Join-Path $RootPath $directory),$sid))}
      else{$pins.Add([NativeInstallation]::Pin((Join-Path $RootPath $directory),$true))}
    }
    $nodeHash='e3be0545990c90995d7bf3a7af5d64af1f2e0fc1bbd9b79c27f7abc1e9676e50'
    if ((Hash $NodeSource) -cne $nodeHash -or (Get-AuthenticodeSignature -LiteralPath $NodeSource).Status -ne 'Valid') {throw 'INSTALL_NODE_PROVENANCE'}
    CopyNew $NodeSource (Join-Path $RootPath 'code/node.exe') $nodeHash
    CopyNew $ServerSource (Join-Path $RootPath 'code/server.mjs') $ServerSha256
    CopyNew $source (Join-Path $RootPath 'code/native-service-host.cs') $HostSourceSha256
    foreach($file in @('start-personal-native.ps1','start-personal-native.mjs','supervise-personal-native.mjs')) {
      CopyNew (Join-Path $PSScriptRoot $file) (Join-Path $RootPath "code/$file") (Hash (Join-Path $PSScriptRoot $file))
    }
    [NativeInstallation]::CreateExclusive((Join-Path $RootPath 'code/public'),$read)
    [NativeInstallation]::CreateExclusive((Join-Path $RootPath 'data/storage'),$write)
    # Synthetic placeholder only, never a source or production database copy.
    WriteNew (Join-Path $RootPath 'data/originals.sqlite') 'SYNTHETIC_NOT_A_DATABASE'
    $config=[ordered]@{schema='portal-native-launch.v1';nodePath=(Join-Path $RootPath 'code/node.exe');nodeSha256=$nodeHash;serverPath=(Join-Path $RootPath 'code/server.mjs');serverSha256=$ServerSha256;originalsDb=(Join-Path $RootPath 'data/originals.sqlite');storagePath=(Join-Path $RootPath 'data/storage');publicPath=(Join-Path $RootPath 'code/public');environment=@{}}
    $bootstrap=[IO.File]::ReadAllText((Join-Path $RootPath 'code/start-personal-native.ps1'))
    $jobSource=[regex]::Match($bootstrap,"(?s)Add-Type -TypeDefinition @'\r?\n(.*?)\r?\n'@")
    if(-not $jobSource.Success){throw 'INSTALL_JOB_SOURCE_EXTRACTION'}
    WriteNew (Join-Path $RootPath 'code/native-job.cs') $jobSource.Groups[1].Value
    $build=[Diagnostics.Process]::new()
    $build.StartInfo.FileName=$compiler
    $build.StartInfo.Arguments='/nologo /noconfig /nostdlib+ /target:exe /platform:x64 /optimize+ /deterministic+ /out:"'+(Join-Path $RootPath 'code/native-service-host.exe')+'" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/mscorlib.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Core.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Web.Extensions.dll" "'+(Join-Path $RootPath 'code/native-service-host.cs')+'"'
    # Framework csc predates /deterministic. Byte hashes bind each actual build;
    # source and consumed compiler/reference hashes make drift reviewable.
    $build.StartInfo.Arguments=$build.StartInfo.Arguments.Replace(' /deterministic+','')
    $build.StartInfo.UseShellExecute=$false;$build.StartInfo.RedirectStandardOutput=$true;$build.StartInfo.RedirectStandardError=$true
    $build.StartInfo.WorkingDirectory=Join-Path $RootPath 'code'
    $build.StartInfo.EnvironmentVariables.Clear()
    $build.StartInfo.EnvironmentVariables['SystemRoot']='C:/Windows';$build.StartInfo.EnvironmentVariables['WINDIR']='C:/Windows'
    $build.StartInfo.EnvironmentVariables['TEMP']=Join-Path $RootPath 'temp';$build.StartInfo.EnvironmentVariables['TMP']=Join-Path $RootPath 'temp'
    try {
      if(-not $build.Start()){throw 'INSTALL_COMPILER_START'}
      $out=$build.StandardOutput.ReadToEndAsync();$err=$build.StandardError.ReadToEndAsync()
      if(-not $build.WaitForExit(30000)){throw 'INSTALL_COMPILER_DEADLINE'}
      if($build.ExitCode -ne 0){throw ('INSTALL_COMPILER_FAILED '+$out.Result+$err.Result)}
      $build.StartInfo.Arguments=$build.StartInfo.Arguments.Replace('/target:exe','/target:library').Replace('native-service-host.exe','native-job.dll').Replace('native-service-host.cs','native-job.cs')
      if(-not $build.Start()){throw 'INSTALL_JOB_COMPILER_START'}
      $out=$build.StandardOutput.ReadToEndAsync();$err=$build.StandardError.ReadToEndAsync()
      if(-not $build.WaitForExit(30000)){throw 'INSTALL_JOB_COMPILER_DEADLINE'}
      if($build.ExitCode -ne 0){throw ('INSTALL_JOB_COMPILER_FAILED '+$out.Result+$err.Result)}
    } finally {if(-not $build.HasExited){$build.Kill();$build.WaitForExit()};$build.Dispose()}
    $hostBinary=Join-Path $RootPath 'code/native-service-host.exe'
    $acl=Get-Acl -LiteralPath $hostBinary;$acl.SetOwner([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'));Set-Acl -LiteralPath $hostBinary -AclObject $acl
    $jobBinary=Join-Path $RootPath 'code/native-job.dll'
    $acl=Get-Acl -LiteralPath $jobBinary;$acl.SetOwner([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'));Set-Acl -LiteralPath $jobBinary -AclObject $acl
    $config['nativeJobAssemblyPath']=$jobBinary;$config['nativeJobAssemblySha256']=Hash $jobBinary
    JsonNew (Join-Path $RootPath 'code/launch.json') $config
    $refs=@($compiler,$powershell,'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/mscorlib.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Core.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Web.Extensions.dll') | ForEach-Object {@{path=$_;sha256=(Hash $_)}}
    $files=@(Get-ChildItem -LiteralPath (Join-Path $RootPath 'code') -File | ForEach-Object {@{path=('code/'+$_.Name);sha256=(Hash $_.FullName)}})
    $manifest=[ordered]@{schema='portal-native-install.v1';serviceName=$ServiceName;serviceSid=$sid;scope='SYNTHETIC_OWNED';tokenProfile=$tokenProfile;tokenContract=$tokenContract;sourceSidType=$sourceSidType;windowsReadSids=$windowsReadSids;powershellPath=$powershell;powershellSha256=$PowerShellSha256;files=$files;compilerReferences=$refs;recovery='DEMAND_START_NO_FAILURE_ACTIONS';fence='FENCE_UNPROVEN'}
    $manifest.knownDllsDescriptorSha256=$knownDllsDescriptorSha256
    $manifest.knownDllsAdmissionSha256=$knownDllsAdmissionSha256
    $manifest.privateDesktopName=$PrivateDesktopName;$manifest.launchContext=$launchContext;$manifest.hostSourceSha256=$HostSourceSha256
    if($KnownDllsAdmissionPath){CopyNew $KnownDllsAdmissionPath (Join-Path $RootPath 'action/known-dlls-admission.json') $knownDllsAdmissionSha256}
    JsonNew (Join-Path $RootPath 'installation.json') $manifest
    $definition=[ordered]@{schema='portal-native-service-definition.v1';serviceName=$ServiceName;binaryPath=('"'+(Join-Path $RootPath 'code/native-service-host.exe')+'" '+$ServiceName+' "'+(Join-Path $RootPath 'installation.json')+'"');serviceType='SERVICE_WIN32_OWN_PROCESS';account='NT AUTHORITY\LocalService';sidType=$(if($FilteredWorkload){'SERVICE_SID_TYPE_UNRESTRICTED'}else{'SERVICE_SID_TYPE_RESTRICTED'});start='DEMAND_START';failureActions=@();registration='NOT_REGISTERED';activation='DISABLED_NO_PERMIT';productionFence='FENCE_UNPROVEN'}
    JsonNew (Join-Path $RootPath 'action/service-definition.json') $definition
    Write-Output ('STAGED '+$RootPath+' manifest='+(Hash (Join-Path $RootPath 'installation.json')))
  } finally {foreach($pin in $pins){$pin.Dispose()}}
  return
}
if ($Mode -eq 'Fence') {
  # A fake observation is test input, not authority. Full preimage equality must
  # hold before even recording a fixture match. No Docker commands are executed.
  $expected=[IO.File]::ReadAllText($ExpectedOldWriterPath)|ConvertFrom-Json
  $parsed=[IO.File]::ReadAllText($ObservedOldWritersPath)|ConvertFrom-Json
  $observed=@($parsed | ForEach-Object {$_})
  if ($expected.id -cnotmatch '^[a-f0-9]{64}$' -or $observed.Count -ne 1 -or
      $observed[0].id -cne $expected.id -or $observed[0].image -cne $expected.image -or
      $observed[0].mount -cne $expected.mount -or $observed[0].labels -cne $expected.labels -or
      $observed[0].config -cne $expected.config -or $observed[0].restart -cne $expected.restart -or
      $observed[0].running -ne $false -or $observed[0].restart -cne 'no') {throw 'FENCE_PREIMAGE_REJECTED'}
  throw 'FENCE_UNPROVEN'
}
if ($Mode -eq 'Permit') {
  if ($ActionId -cnotmatch '^[a-f0-9]{32}$' -or $StartupDeadlineMs -lt 1 -or $StartupDeadlineMs -gt 120000 -or $StopDeadlineMs -lt 1 -or $StopDeadlineMs -gt 120000) {throw 'PERMIT_ARGUMENTS'}
  $manifestPath=Join-Path $RootPath 'installation.json'
  $manifest=[IO.File]::ReadAllText($manifestPath)|ConvertFrom-Json
  if ($manifest.scope -cne 'SYNTHETIC_OWNED' -or $manifest.serviceName -cne $ServiceName) {throw 'PERMIT_INSTALLATION_BINDING'}
  [NativeServiceHost]::VerifyProfile($manifest.tokenProfile,$tokenProfile,$true)
  [NativeServiceHost]::VerifyDebuggerBinding($TestMode,$TestEvent,$tokenProfile,$true)
  [NativePrivateDesktop]::VerifyBinding($manifest.launchContext,$launchContext,$manifest.privateDesktopName,$PrivateDesktopName,$sid,$RootPath,$HostSourceSha256,$tokenProfile,$TestMode,$TestEvent,$TokenFault,$true)
  if($manifest.hostSourceSha256 -cne $HostSourceSha256){throw 'PRIVATE_DESKTOP_SOURCE_BINDING'}
  if($KnownDllsCandidate){[NativeServiceHost]::VerifyKnownDllsContract($manifest.tokenContract,$tokenContract,$sid,$RootPath,$true)}else{[NativeServiceHost]::VerifyContract($manifest.tokenContract,$tokenContract,$sid,$RootPath,[bool]$FilteredWorkload)}
  if($manifest.knownDllsDescriptorSha256 -cne $knownDllsDescriptorSha256){throw 'KNOWNDLLS_DESCRIPTOR_BINDING'}
  if ($manifest.sourceSidType -cne $sourceSidType -or
      @($manifest.windowsReadSids).Count -ne $windowsReadSids.Count -or
      (@($manifest.windowsReadSids) -join ',') -cne ($windowsReadSids -join ',')) {throw 'TOKEN_CONTRACT_BINDING'}
  $permit=[ordered]@{schema='portal-native-permit.v1';installationSha256=(Hash $manifestPath);serviceName=$ServiceName;scope='SYNTHETIC_OWNED';tokenProfile=$tokenProfile;tokenContract=$tokenContract;sourceSidType=$sourceSidType;windowsReadSids=$windowsReadSids;tokenFault=$TokenFault;rawPeerPath=$RawPeerPath;fence='ISOLATED_NO_REAL_WRITER';actionId=$ActionId;testMode=$TestMode;testEvent=$TestEvent;observationEvent=$ObservationEvent;startupDeadlineMs="$StartupDeadlineMs";stopDeadlineMs="$StopDeadlineMs"}
  $permit.knownDllsDescriptorSha256=$knownDllsDescriptorSha256
  $permit.knownDllsAdmissionSha256=$knownDllsAdmissionSha256
  $permit.privateDesktopName=$PrivateDesktopName;$permit.launchContext=$launchContext;$permit.hostSourceSha256=$HostSourceSha256
  JsonNew (Join-Path $RootPath 'action/permit.json') $permit
  Write-Output ('SYNTHETIC_PERMIT '+$ActionId)
}
