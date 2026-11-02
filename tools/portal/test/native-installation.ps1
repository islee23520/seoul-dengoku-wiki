param([Parameter(Mandatory=$true)][string]$SourcePath,[Parameter(Mandatory=$true)][string]$ScratchPath,[switch]$KnownDllsDescriptorOnly,[switch]$PrivateDesktopPrerequisites,[switch]$ProductionOfflineOnly,[Microsoft.Win32.SafeHandles.SafeFileHandle]$OwnedPrivateRoot=$null)
$ErrorActionPreference='Stop'
$source=Join-Path $SourcePath 'install/native-service-host.cs'
Add-Type -Path $source -ReferencedAssemblies @('System.Web.Extensions','System.Core')
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Runtime.InteropServices;
using System.Security.Principal;
using Microsoft.Win32.SafeHandles;
public static class AttestPublicationFixture {
  [StructLayout(LayoutKind.Sequential)] struct SidEntry {public IntPtr Sid;public uint Attributes;}
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out SafeFileHandle token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool CreateRestrictedToken(SafeFileHandle source,uint flags,uint disable,IntPtr disabled,uint privileges,IntPtr deleted,uint count,ref SidEntry restricted,out SafeFileHandle token);
  public static void ReaderDenied(string path,string sid){
    SafeFileHandle source,restricted;if(!OpenProcessToken(Process.GetCurrentProcess().Handle,0xb,out source))throw new System.ComponentModel.Win32Exception();
    using(source){var identity=new SecurityIdentifier(sid);var bytes=new byte[identity.BinaryLength];identity.GetBinaryForm(bytes,0);IntPtr buffer=Marshal.AllocHGlobal(bytes.Length);
      try{Marshal.Copy(bytes,0,buffer,bytes.Length);var entry=new SidEntry{Sid=buffer};if(!CreateRestrictedToken(source,1,0,IntPtr.Zero,0,IntPtr.Zero,1,ref entry,out restricted))throw new System.ComponentModel.Win32Exception();
        using(restricted)using(WindowsIdentity.Impersonate(restricted.DangerousGetHandle())){
          foreach(string operation in new[]{"write","rename","replace"}){
            int code=0;try{if(operation=="write"){using(var file=new FileStream(path,FileMode.Open,FileAccess.Write,FileShare.ReadWrite)){} }else if(operation=="rename")File.Move(path,path+".reader-moved");else File.Replace(path+".replacement",path,path+".backup");}catch(Exception error){code=error.HResult&65535;}
            if(code!=5)throw new Exception("ATTEST_READER_"+operation+"_EXPECTED_5_ACTUAL_"+code);
          }
        }
      }finally{Marshal.FreeHGlobal(buffer);}
    }
  }
  public static byte[] Receive(Type attestor,string path,byte[] bytes,string sid){
    using(var changed=new AutoResetEvent(false))using(var finished=new ManualResetEvent(false))using(var watcher=new FileSystemWatcher(Path.GetDirectoryName(path),Path.GetFileName(path)+".ready")){
      Exception writerError=null,watchError=null;
      watcher.Created+=(s,e)=>changed.Set();watcher.Error+=(s,e)=>{watchError=e.GetException();changed.Set();};watcher.EnableRaisingEvents=true;
      var clock=Stopwatch.StartNew();
      ThreadPool.QueueUserWorkItem(_=>{try{attestor.GetMethod("PublishResult").Invoke(null,new object[]{path,bytes,sid});}catch(Exception error){writerError=error;}finally{finished.Set();changed.Set();}});
      try{
        attestor.GetMethod("AwaitResult").Invoke(null,new object[]{path,changed,clock,new Func<Exception>(()=>writerError??watchError)});
        return File.ReadAllBytes(path);
      }finally{if(!finished.WaitOne(10000))throw new Exception("ATTEST_FIXTURE_WRITER_TIMEOUT");}
    }
  }
}
'@
if($ProductionOfflineOnly){
  if($KnownDllsDescriptorOnly -or $PrivateDesktopPrerequisites -or $OwnedPrivateRoot){throw 'OFFLINE_MODE_COMPOSITION'}
  function Reject([string]$Name,[scriptblock]$Action,[string]$ErrorPattern){
    try{& $Action;throw ('NEGATIVE_ACCEPTED_'+$Name)}catch{if($_.Exception.ToString() -notmatch $ErrorPattern){throw}}
    Write-Output ('PRODUCTION_NEGATIVE_PASS '+$Name)
  }
  function Digest([byte[]]$Bytes){$hash=[Security.Cryptography.SHA256]::Create();try{[BitConverter]::ToString($hash.ComputeHash($Bytes)).Replace('-','').ToLowerInvariant()}finally{$hash.Dispose()}}
  # Exact v6 redacted JSON shape from f/probewriters-cast-diagnostics.json.
  $writerJson=[Web.Script.Serialization.JavaScriptSerializer]::new()
  $redactedWriters='{"fence":{"writers":{"value":[{"pid":"<System.String:pid>","imageName":"<System.String:exe-basename>","startUtcTicks":"<System.String:utc-ticks>","imageSha256":"<System.String:sha256>","sid":"<System.String:account-sid>"},{"pid":"<System.String:pid>","imageName":"<System.String:exe-basename>","startUtcTicks":"<System.String:utc-ticks>","imageSha256":"<System.String:sha256>","sid":"<System.String:account-sid>"}],"Count":2}}}'
  $shapeRecord=$writerJson.DeserializeObject($redactedWriters)
  if([NativeStartupAttestor]::WriterRows($shapeRecord).Count -ne 2){throw 'WRITER_REDACTED_SHAPE_NOT_READ'}
  Reject 'writer-redacted-values-not-identities' {[NativeStartupAttestor]::ProbeWriters($shapeRecord,[NativeServiceProfile]::Portal)} 'ATTEST_WRITER_PID'
  $shapeRows=$shapeRecord['fence']['writers']['value']
  for($i=0;$i -lt 2;$i++){$shapeRows[$i]['pid']=[string](123+$i);$shapeRows[$i]['imageName']='backend.exe';$shapeRows[$i]['startUtcTicks']='1';$shapeRows[$i]['imageSha256']='a'*64;$shapeRows[$i]['sid']='S-1-5-21-1-2-3-1001'}
  $shapeDigest=[NativeStartupAttestor]::WriterDigest($shapeRecord)
  $shapeCurrent=[Collections.Generic.Dictionary[int,string]]::new();$shapeCurrent.Add(123,'backend.exe');$shapeCurrent.Add(124,'backend.exe')
  [NativeStartupAttestor]::VerifyWriterSet($shapeRecord,$shapeCurrent)
  $shapeWrapper=$shapeRecord['fence']['writers']
  $shapeRecord['fence']['writers']=$shapeRows
  if([NativeStartupAttestor]::WriterDigest($shapeRecord) -cne $shapeDigest){throw 'WRITER_ARRAY_DIGEST_DIFFERENT'}
  $nested=$writerJson.DeserializeObject('{"outer":{}}');$nested['outer']['second']=$shapeRows[1];$nested['outer']['first']=$shapeRows[0]
  $shapeRecord['fence']['writers']=$nested
  if([NativeStartupAttestor]::WriterDigest($shapeRecord) -cne $shapeDigest){throw 'WRITER_NESTED_DIGEST_DIFFERENT'}
  $entries=@{first=@{pid='123';imageName='backend.exe';startUtcTicks='1';imageSha256=('a'*64);sid='S-1-5-21-1-2-3-1001'};second=$shapeRows[1]}
  $shapeRecord['fence']['writers']=$entries
  if([NativeStartupAttestor]::WriterDigest($shapeRecord) -cne $shapeDigest){throw 'WRITER_DICTIONARY_ENTRY_DIGEST_DIFFERENT'}
  [NativeStartupAttestor]::VerifyWriterSet($shapeRecord,$shapeCurrent)
  Write-Output 'WRITER_V6_SHAPE_REPRO_PASS array-wrapper-nested-dictionary-entry'
  foreach($badShape in @('null','123','"text"','{}','[null]','{"value":[],"Count":"0"}','{"value":[],"Count":1}','{"value":[]}','{"Count":0}','{"value":[],"Count":0,"extra":1}','{"good":[],"bad":false}','[{"pid":"123"}]')){
    $badRecord=$writerJson.DeserializeObject('{"fence":{"writers":'+$badShape+'}}')
    Reject 'writer-unexpected-shape' {[NativeStartupAttestor]::WriterDigest($badRecord)} 'ATTEST_WRITERS_SHAPE_'
  }
  $shapeRecord['fence']['writers']=$shapeWrapper;$shapeWrapper['value']=[object[]]@($shapeRows[0],$shapeRows[0])
  Reject 'writer-wrapper-duplicate-pid' {[NativeStartupAttestor]::WriterDigest($shapeRecord)} 'ATTEST_WRITER_PID'
  $shapeWrapper['value']=[object[]]@();$shapeWrapper['Count']=0
  Reject 'writer-wrapper-empty' {[NativeStartupAttestor]::WriterDigest($shapeRecord)} 'ATTEST_WRITERS_EMPTY'
  $shapeRecord['fence']['writers']=@{nested=$null};$shapeRecord['fence']['writers']['nested']=$shapeRecord['fence']['writers']
  Reject 'writer-cyclic-shape' {[NativeStartupAttestor]::WriterDigest($shapeRecord)} 'ATTEST_WRITERS_SHAPE_nesting_limit'
  $shapeRecord['fence']['writers']=@{1=$shapeRows[0]}
  Reject 'writer-nonstring-key' {[NativeStartupAttestor]::WriterDigest($shapeRecord)} 'ATTEST_WRITERS_SHAPE_rows_nonstring_key'
  $sid=[NativeInstallation]::ServiceSid([NativeProductionActivation]::Service)
  function Token([string]$User,[bool]$Filtered,[bool]$Synthetic){
    $value=[Collections.Generic.Dictionary[string,object]]::new();$value['user']=$User;$value['type']=[int]1;$value['owner']=$sid
    $groups=[Collections.Generic.List[Collections.Generic.Dictionary[string,object]]]::new()
    foreach($id in @('S-1-5-32-545',$sid)){$row=[Collections.Generic.Dictionary[string,object]]::new();$row['sid']=$id;$row['attributes']=[uint32]12;$groups.Add($row)}
    $restricted=[Collections.Generic.List[Collections.Generic.Dictionary[string,object]]]::new()
    if($Filtered){foreach($id in @($sid,'S-1-5-32-545','S-1-5-12')){$row=[Collections.Generic.Dictionary[string,object]]::new();$row['sid']=$id;$row['attributes']=[uint32]0;$restricted.Add($row)}}
    $value['groups']=$groups;$value['restrictedSids']=$restricted;$value['privileges']=[Collections.Generic.List[Collections.Generic.Dictionary[string,object]]]::new()
    $value['defaultDacl']=([Security.AccessControl.RawSecurityDescriptor]::new("D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GA;;;$sid)")).GetSddlForm([Security.AccessControl.AccessControlSections]::Access)
    return ,$value
  }
  $hostToken=Token $sid $false $false;$workload=Token $sid $true $false
  $creator=Token 'S-1-5-18' $false $false;$creator['groups'].Clear()
  $adminCreator=[Collections.Generic.Dictionary[string,object]]::new();$adminCreator['sid']='S-1-5-32-544';$adminCreator['attributes']=[uint32]4;$creator['groups'].Add($adminCreator)
  if([NativePrivateDesktop]::CreatorOwner($creator,$sid) -cne 'S-1-5-18'){throw 'PRIVATE_SYSTEM_OWNER_SELECTION'}
  $creator['user']=$sid;if([NativePrivateDesktop]::CreatorOwner($creator,$sid) -cne $sid){throw 'PRIVATE_SERVICE_OWNER_SELECTION'}
  $adminCreator['attributes']=[uint32]16
  Reject 'private-creator-deny-only-admin' {[NativePrivateDesktop]::CreatorOwner($creator,$sid)} 'PRIVATE_BROKER_PRIVILEGED_CREATOR_REQUIRED'
  $adminCreator['attributes']=[uint32]4;$creator['restrictedSids']=$workload['restrictedSids']
  Reject 'private-creator-restricted-token' {[NativePrivateDesktop]::CreatorOwner($creator,$sid)} 'PRIVATE_BROKER_PRIVILEGED_CREATOR_REQUIRED'
  Reject 'private-creator-foreign-owner' {[NativePrivateDesktop]::ProductionDescriptor($sid,$false,'S-1-5-19')} 'PRIVATE_CREATOR_OWNER'
  foreach($result in [NativePrivateDesktop]::BrokerTests($sid)){Write-Output ('PRIVATE_BROKER_SPLIT_PASS '+$result)}
  [NativeWorkloadToken]::VerifySnapshot($hostToken,$sid,$false,$false,$true)
  [NativeWorkloadToken]::VerifySnapshot($workload,$sid,$true,$true,$true)
  $networkPrivilege=Token $sid $true $false
  $extraPrivilege=[Collections.Generic.Dictionary[string,object]]::new();$extraPrivilege['name']='SeDebugPrivilege';$extraPrivilege['attributes']=[uint32]2
  $networkPrivilege['privileges'].Add($extraPrivilege)
  Reject 'network-discovery-cannot-add-workload-privilege' {[NativeWorkloadToken]::VerifySnapshot($networkPrivilege,$sid,$true,$true,$true)} 'WORKLOAD_PRIVILEGE_PRESENT_SeDebugPrivilege'
  Reject 'foreign-host-user' {[NativeWorkloadToken]::VerifySnapshot((Token 'S-1-5-19' $false $false),$sid,$false,$false,$true)} 'PRODUCTION_TOKEN_USER'
  Reject 'restricted-host-source' {[NativeWorkloadToken]::VerifySnapshot($workload,$sid,$false,$false,$true)} 'SOURCE_TOKEN_CONTRACT_MISMATCH'
  Reject 'unrestricted-workload' {[NativeWorkloadToken]::VerifySnapshot($hostToken,$sid,$true,$true,$true)} 'WORKLOAD_RESTRICTING_SET_MISMATCH'
  $wrong=Token $sid $true $false;$wrong['restrictedSids'].RemoveAt(0)
  Reject 'workload-missing-service-restriction' {[NativeWorkloadToken]::VerifySnapshot($wrong,$sid,$true,$true,$true)} 'WORKLOAD_RESTRICTING_SET_MISMATCH'
  Reject 'production-user-in-synthetic-contract' {[NativeWorkloadToken]::VerifySnapshot($hostToken,$sid,$false,$false,$false)} 'WORKLOAD_PRIMARY_LOCALSERVICE_REQUIRED'
  $foreign=Token 'S-1-5-21-1-2-3-1001' $false $false;$foreign['groups'].RemoveAt(1)
  [NativeProductionActivation]::VerifyOldWriterToken($foreign,'S-1-5-21-1-2-3-1001')
  $admin=[Collections.Generic.Dictionary[string,object]]::new();$admin['sid']='S-1-5-32-544';$admin['attributes']=[uint32]4;$foreign['groups'].Add($admin)
  Reject 'privileged-old-writer' {[NativeProductionActivation]::VerifyOldWriterToken($foreign,'S-1-5-21-1-2-3-1001')} 'FENCE_CONTAINER_PRIVILEGED_GROUP'
  # Inspect compiled call wiring, not source prose: the startup path itself must
  # request a fresh privileged verification before the DB pin or activation lock.
  Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Reflection.Emit;
public static class ProductionStartupCalls {
  public static string[] Read(Type host) {
    return ReadMethod(host,"Admit");
  }
  public static string[] ReadMethod(Type host,string name) {
    var method=host.GetMethod(name,BindingFlags.Static|BindingFlags.Instance|BindingFlags.NonPublic|BindingFlags.Public);
    var bytes=method.GetMethodBody().GetILAsByteArray();
    var ops=new Dictionary<short,OpCode>();
    foreach(var field in typeof(OpCodes).GetFields(BindingFlags.Public|BindingFlags.Static)){
      var op=(OpCode)field.GetValue(null);ops[op.Value]=op;
    }
    var calls=new List<string>();
    for(int index=0;index<bytes.Length;){
      short code=bytes[index++];if(code==0xfe)code=unchecked((short)(0xfe00|bytes[index++]));
      var op=ops[code];int size;
      switch(op.OperandType){
        case OperandType.InlineNone:size=0;break;
        case OperandType.ShortInlineBrTarget:case OperandType.ShortInlineI:case OperandType.ShortInlineVar:size=1;break;
        case OperandType.InlineVar:size=2;break;
        case OperandType.InlineI8:case OperandType.InlineR:size=8;break;
        case OperandType.InlineSwitch:size=4+4*BitConverter.ToInt32(bytes,index);break;
        default:size=4;break;
      }
      if(op.OperandType==OperandType.InlineMethod){
        var target=method.Module.ResolveMethod(BitConverter.ToInt32(bytes,index));
        calls.Add(target.DeclaringType.FullName+"."+target.Name);
      }
      index+=size;
    }
    return calls.ToArray();
  }
}
'@
  $calls=[ProductionStartupCalls]::Read([NativeServiceHost])
  $live=[Array]::IndexOf($calls,'NativeStartupAttestor.Request')
  $pin=[Array]::IndexOf($calls,'NativeInstallation.Pin',$live+1)
  $fenceCall=[Array]::IndexOf($calls,'NativeProductionActivation.VerifyFence')
  $lock=[Array]::IndexOf($calls,'System.IO.FileStream..ctor')
  if($live -lt 0 -or $pin -le $live -or $fenceCall -le $pin -or $lock -le $fenceCall){throw 'STARTUP_LIVE_FENCE_CALL_ORDER'}
  Write-Output 'PRODUCTION_STARTUP_CALL_ORDER_PASS attestor-before-dbPin-before-currentFence-before-lock'
  foreach($methodName in @('WriterDigest','VerifyWriterSet','ProbeWriters')){
    $writerCalls=[ProductionStartupCalls]::ReadMethod([NativeStartupAttestor],$methodName)
    if([Array]::IndexOf($writerCalls,'NativeStartupAttestor.WriterRows') -lt 0){throw ('WRITER_SHARED_ITERATION_MISSING_'+$methodName)}
  }
  Write-Output 'WRITER_SHARED_ITERATION_PASS digest-set-probes'
  $brokerCalls=[ProductionStartupCalls]::ReadMethod([NativePrivateDesktop],'BrokerSetup')
  foreach($call in $brokerCalls){if($call -match 'NativeWorkloadToken\.|NativeOuterChild\.|NativeInstallation\.|System.IO\.'){throw ('PRIVATE_PRIVILEGED_SCOPE_'+$call)}}
  $restrictedCalls=[ProductionStartupCalls]::ReadMethod([NativePrivateDesktop],'RestrictedSetup')
  if([Array]::IndexOf($restrictedCalls,'NativePrivateDesktop+Api.VerifyWorkload') -lt 0 -or [Array]::IndexOf($restrictedCalls,'NativePrivateDesktop.Probe') -lt 0){throw 'PRIVATE_RESTRICTED_GATE_MISSING'}
  foreach($methodName in @('ServiceMain','RunImage')){
    $launchCalls=[ProductionStartupCalls]::ReadMethod([NativeServiceHost],$methodName)
    if([Array]::IndexOf($launchCalls,'NativePrivateDesktop.VerifyRestricted') -lt 0 -or [Array]::IndexOf($launchCalls,'NativeOuterChild.Start') -lt 0){throw 'PRIVATE_RESTRICTED_LAUNCH_WIRING'}
  }
  Write-Output 'PRIVATE_BROKER_COMPILED_SCOPE_PASS'
  # The current offline test process is the observed actor. These cases stop at
  # identity/time binding before any canonical-path access probe can execute.
  $process=[Diagnostics.Process]::GetCurrentProcess()
  try{
    $writer=[Collections.Generic.Dictionary[string,object]]::new()
    $writer['containerHostPid']=$process.Id.ToString()
    $writer['containerHostStartUtcTicks']=$process.StartTime.ToUniversalTime().Ticks.ToString([Globalization.CultureInfo]::InvariantCulture)
    $writer['containerHostImageSha256']=(Get-FileHash -LiteralPath $process.MainModule.FileName -Algorithm SHA256).Hash.ToLowerInvariant()
    $writer['containerHostSid']='S-1-5-21-1-2-3-1001'
    $activation=[Collections.Generic.Dictionary[string,object]]::new();$activation['fence']=$writer
    if([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -ceq $writer['containerHostSid']){throw 'OFFLINE_FOREIGN_ACTOR_FIXTURE_COLLISION'}
    Reject 'startup-old-writer-present' {[NativeProductionActivation]::VerifyOldWriterProcess($activation)} 'FENCE_CONTAINER_TOKEN_USER'
    $issued=Token $writer['containerHostSid'] $false $false;$issued['groups'].RemoveAt(1)
    [NativeProductionActivation]::VerifyOldWriterToken($issued,$writer['containerHostSid'])
    $writer['containerHostStartUtcTicks']=([long]$writer['containerHostStartUtcTicks']-1).ToString([Globalization.CultureInfo]::InvariantCulture)
    Reject 'startup-old-writer-reappeared-after-issuance' {[NativeProductionActivation]::VerifyOldWriterProcess($activation)} 'FENCE_CONTAINER_PROCESS_DRIFT'
  }finally{$process.Dispose()}
  [NativeWorkloadToken]::VerifySnapshot((Token 'S-1-5-19' $false $true),$sid,$false,$false,$false)
  [NativeWorkloadToken]::VerifySnapshot((Token 'S-1-5-19' $true $true),$sid,$true,$true,$false)
  foreach($desktop in @($false,$true)){
    $sddl=[NativePrivateDesktop]::ProductionDescriptor($sid,$desktop);$sd=[Security.AccessControl.RawSecurityDescriptor]::new($sddl);$bytes=[byte[]]::new($sd.BinaryLength);$sd.GetBinaryForm($bytes,0)
    [NativePrivateDesktop]::VerifyProductionDescriptor($bytes,$sid,$desktop)
    $bad=[Security.AccessControl.RawSecurityDescriptor]::new($sddl.Replace('(A;;RC;;;OW)',''));$bytes=[byte[]]::new($bad.BinaryLength);$bad.GetBinaryForm($bytes,0)
    Reject ('desktop-owner-rights-'+$desktop) {[NativePrivateDesktop]::VerifyProductionDescriptor($bytes,$sid,$desktop)} 'PRODUCTION_PRIVATE_DESCRIPTOR'
  }
  $acl="O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1301bf;;;$sid)(A;OICI;RC;;;OW)"
  [NativeProductionActivation]::VerifyDatabaseAcl($acl,$sid,$true)
  foreach($mutation in @(($acl+'(A;OICI;FW;;;BU)'),$acl.Replace('0x1301bf','FA'),$acl.Replace('D:P','D:'),$acl.Replace('(A;OICI;RC;;;OW)',''))){
    Reject 'database-acl' {[NativeProductionActivation]::VerifyDatabaseAcl($mutation,$sid,$true)} 'FENCE_'
  }
  $imageSid=[NativeServiceProfile]::Image.Sid
  $rootAcl="O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;$sid)"
  function CheckRoot([string]$Sddl,[string]$Path){[NativeInstallation]::AdmitRawAcl($Path,$sid,$false,$true,[Security.AccessControl.RawSecurityDescriptor]::new($Sddl))}
  CheckRoot ($rootAcl+"(A;;0x1200a9;;;$imageSid)") 'E:\portal-authority'
  CheckRoot ($rootAcl+"(A;OICIIO;0x1200a9;;;$imageSid)") 'E:\portal-authority'
  Write-Output 'SHARED_ROOT_IMAGE_READ_PASS explicit-and-inherit-only'
  foreach($right in @('0x1200ab','0x1300a9','0x1600a9','0x1a00a9','GA','GW')){
    Reject ('shared-root-image-write-'+$right) {CheckRoot ($rootAcl+"(A;;$right;;;$imageSid)") 'E:\portal-authority'} 'INSTALL_FOREIGN_ACE'
  }
  Reject 'shared-root-other-sid' {CheckRoot ($rootAcl+'(A;;0x1200a9;;;S-1-5-21-1-2-3-1001)') 'E:\portal-authority'} 'INSTALL_FOREIGN_ACE'
  Reject 'shared-root-duplicate-image' {CheckRoot ($rootAcl+"(A;;0x1200a9;;;$imageSid)(A;OICIIO;0x1200a9;;;$imageSid)") 'E:\portal-authority'} 'INSTALL_FOREIGN_ACE'
  Reject 'portal-child-rejects-image-read' {CheckRoot ($rootAcl+"(A;;0x1200a9;;;$imageSid)") 'E:\portal-authority\code'} 'INSTALL_FOREIGN_ACE'
  $container=@{Id=('a'*64);HostConfig=@{Privileged=$false;VolumesFrom=$null};Mounts=@(@{Source='/e/git/portal/inputs';Destination='/inputs';RW=$false})}
  [NativeProductionActivation]::VerifyContainer((ConvertTo-Json -InputObject @($container) -Depth 10),('a'*64))
  foreach($mount in @('/e','/e/portal-authority','E:\portal-authority\data','/run/desktop/mnt/host/e','/var/run/docker.sock')){
    $container.Mounts[0].Source=$mount
    Reject 'container-canonical-or-control-mount' {[NativeProductionActivation]::VerifyContainer((ConvertTo-Json -InputObject @($container) -Depth 10),('a'*64))} 'FENCE_'
  }
  $now=[DateTime]::SpecifyKind([DateTime]::Parse('2026-10-19T12:00:00'),[DateTimeKind]::Utc)
  $payload=[ordered]@{schema='portal-production-activation.v1';kind='PRODUCTION_REVIEWED';serviceName=[NativeProductionActivation]::Service;serviceSid=$sid;root=[NativeProductionActivation]::Root;database=[NativeProductionActivation]::Database;tokenProfile=[NativeProductionActivation]::Profile;installationSha256=('1'*64);actionId=('2'*32);ownerDecisionReference=[NativeProductionActivation]::OwnerReference;ownerDecisionSha256=('3'*64);ownerDirectiveDate='2026-10-19';decision='APPROVE_EXECUTION';releaseId='4f5df498c7cdabc09e3db6efed40667f6326d680250a9dc5efe3bf7b25f122cb';issuedUtc=$now.AddMinutes(-1).ToString('o');expiresUtc=$now.AddMinutes(10).ToString('o');candidate=[ordered]@{};fence=@{canonicalAcl='PASS';ancestorReplacementDenied='PASS';containerPathExcluded='PASS';containerIdentityDenied='PASS';soleApplicationWriter='PASS';containerId=('a'*64);containerInspectSha256=('4'*64);containerHostSid='S-1-5-21-1-2-3-1001';containerHostAdministrator='false';containerHostBackupRestorePrivileges='false'}}
  foreach($file in [NativeProductionActivation]::Candidate.GetEnumerator()){$payload.candidate[$file.Key]=$file.Value}
  $rsa=[Security.Cryptography.RSACryptoServiceProvider]::new(3072);$rsa.PersistKeyInCsp=$false
  try{
    $key=$rsa.ToXmlString($false);$keyHash=Digest ([Text.Encoding]::UTF8.GetBytes($key))
    function Envelope($Value){$body=[Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $Value -Depth 15 -Compress));$sig=$rsa.SignData($body,[Security.Cryptography.CryptoConfig]::MapNameToOID('SHA256'));return ,[Text.Encoding]::UTF8.GetBytes((@{payload=[Convert]::ToBase64String($body);signature=[Convert]::ToBase64String($sig)}|ConvertTo-Json -Compress))}
    function Verify([byte[]]$Bytes,[string]$Hash){return [NativeProductionActivation]::VerifyRecord($Bytes,$Hash,$key,$keyHash,('1'*64),('3'*64),('2'*32),$now)}
    $signed=Envelope $payload;[void](Verify $signed (Digest $signed))
    $currentRelease=$payload.releaseId;$payload.releaseId='beb0745be3c02c1787159c6fd06c7651e080858cdba5752f0136dc4d20e34533';$oldRelease=Envelope $payload
    Reject 'superseded-release-id' {[void](Verify $oldRelease (Digest $oldRelease))} 'ACTIVATION_BINDING_releaseId';$payload.releaseId=$currentRelease
    $currentServer=$payload.candidate['server.mjs'];$payload.candidate['server.mjs']='92254cc17edb10c0c0f96ab12c800e17bd55239119ebf0902364165da763e876';$mixedRelease=Envelope $payload
    Reject 'new-release-old-server-mix' {[void](Verify $mixedRelease (Digest $mixedRelease))} 'ACTIVATION_BINDING_server.mjs';$payload.candidate['server.mjs']=$currentServer
    $attest=[ordered]@{schema='native-startup-fence.v1';activationSha256=('1'*64);nonce=('2'*32);writerSetSha256=('3'*64);requestedUtc=$now.ToString('o');issuedUtc=$now.AddSeconds(1).ToString('o');expiresUtc=$now.AddSeconds(61).ToString('o');status='PASS';failure=''}
    function VerifyAttest([byte[]]$Bytes,[DateTime]$At,[long]$Elapsed){return [NativeStartupAttestor]::VerifyResult($Bytes,$key,$keyHash,('1'*64),('2'*32),('3'*64),$now,$At,$Elapsed)}
    $attestBytes=Envelope $attest;[void](VerifyAttest $attestBytes $now.AddSeconds(2) 2000)
    Write-Output 'ATTEST_FRESH_VALID_PASS'
    $diagnosticRecord=$writerJson.DeserializeObject($redactedWriters)
    $diagnostic=[NativeStartupAttestor]::ProbeDiagnostic('ProbeWriters',[Action]{[NativeStartupAttestor]::ProbeWriters($diagnosticRecord,[NativeServiceProfile]::Portal)})
    if($diagnostic['status'] -cne 'FAIL' -or $diagnostic['failure']['stage'] -cne 'writer-digest' -or $diagnostic['failure']['exceptionType'] -cne 'System.Exception' -or $diagnostic['failure']['message'] -cne 'ATTEST_WRITER_PID' -or $diagnostic['failure']['hresult'] -ne -2146233088){throw 'ATTEST_EXACT_DIAGNOSTIC_LOST'}
    $attest.status=$diagnostic['status'];$attest.failure=$diagnostic['failure'];$diagnosticBytes=Envelope $attest
    $decodedEnvelope=$writerJson.DeserializeObject([Text.Encoding]::UTF8.GetString($diagnosticBytes));$decodedPayload=$writerJson.DeserializeObject([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($decodedEnvelope['payload'])))
    if($decodedPayload['failure']['message'] -cne 'ATTEST_WRITER_PID' -or $decodedPayload['failure']['stage'] -cne 'writer-digest' -or $decodedPayload['failure']['hresult'] -ne -2146233088){throw 'ATTEST_SIGNED_DIAGNOSTIC_LOST'}
    Reject 'attest-structured-fail-immediate' {[void](VerifyAttest $diagnosticBytes $now.AddSeconds(2) 2000)} 'ATTEST_PROBE_FAILED'
    if($ScratchPath.Replace('\','/') -cnotmatch '^E:/task22-native-installation-test-[a-f0-9]{16}$'){throw 'ATTEST_FIXTURE_SCRATCH'}
    [NativeInstallation]::CreateExclusive($ScratchPath,"O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;$sid)")
    try{
      $publicationPin=[NativeInstallation]::Pin($ScratchPath,$true)
      try{
        $received=[AttestPublicationFixture]::Receive([NativeStartupAttestor],(Join-Path $ScratchPath 'signed-fail.json'),$diagnosticBytes,$sid)
        Reject 'attest-published-fail-immediate' {[void](VerifyAttest $received $now.AddSeconds(2) 2000)} 'ATTEST_PROBE_FAILED'
      }finally{$publicationPin.Dispose()}
    }finally{Remove-Item -LiteralPath $ScratchPath -Recurse -Force}
    $absentRecord=$writerJson.DeserializeObject('{"fence":{"writers":[{"pid":"2147483647","imageName":"fixture-never-running.exe","startUtcTicks":"1","imageSha256":"'+('a'*64)+'","sid":"S-1-5-21-1-2-3-1001"}]}}')
    $absentDiagnostic=[NativeStartupAttestor]::ProbeDiagnostic('ProbeWriters',[Action]{[NativeStartupAttestor]::ProbeWriters($absentRecord,[NativeServiceProfile]::Portal)})
    if($absentDiagnostic['failure']['stage'] -cne 'writer-set-before' -or $absentDiagnostic['failure']['message'] -cne 'ATTEST_WRITER_ABSENT' -or $null -eq $absentDiagnostic['failure']['beforeIdentities'] -or $null -ne $absentDiagnostic['failure']['afterIdentities'] -or $absentDiagnostic['failure']['expectedIdentities'][0]['pid'] -cne '2147483647'){throw 'ATTEST_WRITER_IDENTITIES_LOST'}
    Write-Output 'ATTEST_SIGNED_EXACT_EXCEPTION_PASS'
    $attest.status='PASS';$attest.failure=''
    Reject 'attest-absent' {[void](VerifyAttest ([byte[]]::new(0)) $now.AddSeconds(2) 2000)} 'ATTEST_RESULT_ABSENT'
    Reject 'attest-late-arrival' {[void](VerifyAttest $attestBytes $now.AddSeconds(2) 60000)} 'ATTEST_LATE'
    Reject 'attest-wallclock-late' {[void](VerifyAttest $attestBytes $now.AddSeconds(60) 2000)} 'ATTEST_LATE'
    foreach($field in @('activationSha256','nonce','writerSetSha256','requestedUtc')){
      $before=$attest[$field];$attest[$field]='wrong';$badAttest=Envelope $attest
      Reject ('attest-mismatch-'+$field) {[void](VerifyAttest $badAttest $now.AddSeconds(2) 2000)} 'ATTEST_BINDING';$attest[$field]=$before
    }
    $attest.expiresUtc=$now.AddSeconds(2).ToString('o');$badAttest=Envelope $attest
    Reject 'attest-expired' {[void](VerifyAttest $badAttest $now.AddSeconds(2) 2000)} 'ATTEST_EXPIRED';$attest.expiresUtc=$now.AddSeconds(61).ToString('o')
    $attest.issuedUtc=$now.AddSeconds(-1).ToString('o');$badAttest=Envelope $attest
    Reject 'attest-prior-startup' {[void](VerifyAttest $badAttest $now.AddSeconds(2) 2000)} 'ATTEST_EXPIRED';$attest.issuedUtc=$now.AddSeconds(1).ToString('o')
    $tampered=[Text.Encoding]::UTF8.GetString($attestBytes)|ConvertFrom-Json;$signatureBytes=[Convert]::FromBase64String($tampered.signature);$signatureBytes[0]=$signatureBytes[0] -bxor 1;$tampered.signature=[Convert]::ToBase64String($signatureBytes);$badAttest=[Text.Encoding]::UTF8.GetBytes(($tampered|ConvertTo-Json -Compress))
    Reject 'attest-tampered-signature' {[void](VerifyAttest $badAttest $now.AddSeconds(2) 2000)} 'ATTEST_SIGNATURE'
    $attest.status=[NativeStartupAttestor]::ProbeStatus([Action]{throw 'FENCE_CONTAINER_WRITE_NOT_DENIED'})
    if($attest.status -cne 'FAIL'){throw 'ATTEST_PROBE_NOT_PROPAGATED'};$badAttest=Envelope $attest
    Reject 'attest-deny-probe-failure' {[void](VerifyAttest $badAttest $now.AddSeconds(2) 2000)} 'ATTEST_PROBE_FAILED'
    $writerRecord=[Web.Script.Serialization.JavaScriptSerializer]::new().DeserializeObject('{"fence":{"writers":[{"pid":"123","imageName":"backend.exe","startUtcTicks":"1","imageSha256":"hash","sid":"sid"}]}}')
    $writerSet=[Collections.Generic.Dictionary[int,string]]::new();$writerSet.Add(123,'backend.exe')
    [NativeStartupAttestor]::VerifyWriterSet($writerRecord,$writerSet);$writerSet.Add(124,'backend.exe')
    Reject 'attest-unexpected-writer' {[NativeStartupAttestor]::VerifyWriterSet($writerRecord,$writerSet)} 'ATTEST_UNEXPECTED_WRITER'
    $writerSet.Remove(124);$writerSet.Remove(123)
    Reject 'attest-missing-writer' {[NativeStartupAttestor]::VerifyWriterSet($writerRecord,$writerSet)} 'ATTEST_WRITER_ABSENT'
    $other=[Security.Cryptography.RSACryptoServiceProvider]::new(3072);$other.PersistKeyInCsp=$false
    try{$otherKey=$other.ToXmlString($false);Reject 'wrong-signer' {[void][NativeProductionActivation]::VerifyRecord($signed,(Digest $signed),$otherKey,(Digest ([Text.Encoding]::UTF8.GetBytes($otherKey))),('1'*64),('3'*64),('2'*32),$now)} 'ACTIVATION_SIGNATURE'}finally{$other.Dispose()}
    Reject 'missing-record' {[void](Verify ([byte[]]::new(0)) (Digest $signed))} 'ACTIVATION_RECORD_HASH'
    Reject 'record-hash-mismatch' {[void](Verify $signed ('0'*64))} 'ACTIVATION_RECORD_HASH'
    $unsigned=[Text.Encoding]::UTF8.GetBytes('{"payload":"e30=","signature":""}')
    Reject 'unsigned-record' {[void](Verify $unsigned (Digest $unsigned))} 'ACTIVATION_SIGNATURE|Bad Length|parameter|Parameter'
    foreach($field in @('serviceSid','database','installationSha256','ownerDecisionSha256','tokenProfile','kind')){
      $before=$payload[$field];$payload[$field]='wrong';$bad=Envelope $payload
      Reject ('record-'+$field) {[void](Verify $bad (Digest $bad))} 'ACTIVATION_BINDING_'
      $payload[$field]=$before
    }
    $before=$payload.candidate['server.mjs'];$payload.candidate['server.mjs']='0'*64;$bad=Envelope $payload
    Reject 'candidate-vector-drift' {[void](Verify $bad (Digest $bad))} 'ACTIVATION_BINDING_';$payload.candidate['server.mjs']=$before
    $payload.fence.canonicalAcl='FAIL';$bad=Envelope $payload
    Reject 'fence-fail' {[void](Verify $bad (Digest $bad))} 'ACTIVATION_BINDING_';$payload.fence.canonicalAcl='PASS'
    $payload.expiresUtc=$now.AddSeconds(-1).ToString('o');$bad=Envelope $payload
    Reject 'expired-record' {[void](Verify $bad (Digest $bad))} 'ACTIVATION_WINDOW'
    $payload.expiresUtc=$now.AddMinutes(10).ToString('o')
    $imageProfile=[NativeServiceProfile]::Image
    [void][NativeServiceProfile]::Select($imageProfile.Service,$imageProfile.Root,$imageProfile.Sid)
    Reject 'profile-name-root-confusion' {[void][NativeServiceProfile]::Select($imageProfile.Service,[NativeServiceProfile]::Portal.Root,$imageProfile.Sid)} 'SERVICE_PROFILE_BINDING'
    Reject 'profile-sid-confusion' {[void][NativeServiceProfile]::Select($imageProfile.Service,$imageProfile.Root,$sid)} 'SERVICE_PROFILE_BINDING'
    function VerifyImage([byte[]]$Bytes){return [NativeProductionActivation]::VerifyProfileRecord($Bytes,(Digest $Bytes),$key,$keyHash,('1'*64),('3'*64),('2'*32),$now,$imageProfile)}
    $portalSigned=Envelope $payload
    Reject 'portal-record-on-image' {[void](VerifyImage $portalSigned)} 'ACTIVATION_BINDING_'
    $imagePayload=[ordered]@{};foreach($field in $payload.Keys){$imagePayload[$field]=$payload[$field]}
    foreach($field in @('database','releaseId','candidate')){$imagePayload.Remove($field)}
    $imagePayload.schema='image-production-activation.v1';$imagePayload.serviceName=$imageProfile.Service;$imagePayload.serviceSid=$imageProfile.Sid;$imagePayload.root=$imageProfile.Root
    $imagePayload.authority=$imageProfile.Authority;$imagePayload.gatewaySha256='a243a1b006b91eddb807b41cd3bc5643bfd287805df49a8787c389e122d1c834';$imagePayload.gatewaySourceSha='4952bcad53eaf2e18206283890b3dee0ec5907ed'
    $imagePayload.ownerDecisionReference='.omo/evidence/tools-unfinished-deferred/f/q4-native-install-result.json'
    $imagePayload.ownerDirectiveDate='2026-10-18'
    $imagePayload.imagePrincipalSha256='3b7cc631766834ba19dafc13336bdb76fc9fdbb12b94093769af242d8ac3fc27'
    $imagePayload.bindingSha256='871ec37f601dfd66d992b119b835087715549cde3287a0d9c00b64f6e821e1be'
    $imagePayload.seedReceiptSha256='cf132acb8320583124229656800e3d0ae4b3b34aaf6ac652c571b9cf7b4351e6';$imagePayload.imageConfigSha256='7'*64
    $imageSigned=Envelope $imagePayload;[void](VerifyImage $imageSigned)
    foreach($superseded in @(@{field='gatewaySha256';value='0e46d12305f92b7313b1967f1d775e9cb7e3b0db4319e56693830446316ddfec'},@{field='gatewaySourceSha';value='386a86538b23b58be3de8ffff0e18b6aaca4ca0d'})){
      $before=$imagePayload[$superseded.field];$imagePayload[$superseded.field]=$superseded.value;$bad=Envelope $imagePayload
      Reject ('image-superseded-'+$superseded.field) {[void](VerifyImage $bad)} ('ACTIVATION_BINDING_'+$superseded.field);$imagePayload[$superseded.field]=$before
    }
    Reject 'image-record-on-portal' {[void](Verify $imageSigned (Digest $imageSigned))} 'ACTIVATION_BINDING_'
    foreach($field in @('gatewaySha256','gatewaySourceSha','serviceSid','authority','imagePrincipalSha256')){
      $before=$imagePayload[$field];$imagePayload[$field]='0'*64;$bad=Envelope $imagePayload
      Reject ('image-'+$field) {[void](VerifyImage $bad)} 'ACTIVATION_BINDING_';$imagePayload[$field]=$before
    }
    foreach($field in @('database','releaseId','candidate')){
      $imagePayload[$field]=$payload[$field];$bad=Envelope $imagePayload
      Reject ('image-rejects-portal-'+$field) {[void](VerifyImage $bad)} 'ACTIVATION_PROFILE_CONFUSION';$imagePayload.Remove($field)
    }
    $payload.gatewaySha256=[NativeServiceProfile]::ImageBinarySha256;$bad=Envelope $payload
    Reject 'portal-rejects-image-bindings' {[void](Verify $bad (Digest $bad))} 'ACTIVATION_PROFILE_CONFUSION';$payload.Remove('gatewaySha256')
    $imagePayload.fence.canonicalAcl='FAIL';$bad=Envelope $imagePayload
    Reject 'image-fence-fail' {[void](VerifyImage $bad)} 'ACTIVATION_BINDING_';$imagePayload.fence.canonicalAcl='PASS'
    $imagePayload.kind='SYNTHETIC_OWNED';$bad=Envelope $imagePayload
    Reject 'image-synthetic-authority' {[void](VerifyImage $bad)} 'ACTIVATION_BINDING_kind';$imagePayload.kind='PRODUCTION_REVIEWED'
    $container.Mounts[0].Source='/e/portal-authority/image'
    Reject 'image-canonical-mount' {[NativeProductionActivation]::VerifyProfileContainer((ConvertTo-Json -InputObject @($container) -Depth 10),('a'*64),$imageProfile)} 'FENCE_CANONICAL_MOUNT'
    $imageSignals=[NativeServiceHost+ImageSignals]::new()
    $imageSignals.Accept('image-only listening on 127.0.0.1:8318',$true,$false)
    $imageSignals.Accept('DRAINED',$true,$true)
    if($imageSignals.Ready -or $imageSignals.Drained){throw 'IMAGE_STDERR_SPOOF'}
    Reject 'image-drain-before-ready' {$imageSignals.Accept('DRAINED',$false,$true)} 'IMAGE_DRAIN_PROTOCOL'
    Reject 'image-ready-foreign-interface' {$imageSignals.Accept('image-only listening on 0.0.0.0:8318',$false,$false)} 'IMAGE_READY_PROTOCOL'
    Reject 'image-ready-invalid-port' {$imageSignals.Accept('image-only listening on 127.0.0.1:99999',$false,$false)} 'IMAGE_READY_PROTOCOL'
    $imageSignals.Accept('image-only listening on 127.0.0.1:8318',$false,$false)
    Reject 'image-duplicate-ready' {$imageSignals.Accept('image-only listening on 127.0.0.1:8318',$false,$false)} 'IMAGE_READY_PROTOCOL'
    Reject 'image-drain-without-stop' {$imageSignals.Accept('DRAINED',$false,$false)} 'IMAGE_DRAIN_PROTOCOL'
    $imageSignals.Accept('DRAINED',$false,$true)
    Reject 'image-duplicate-drain' {$imageSignals.Accept('DRAINED',$false,$true)} 'IMAGE_DRAIN_PROTOCOL'
    if(-not $imageSignals.Ready -or -not $imageSignals.Drained){throw 'IMAGE_ORDERED_PROTOCOL'}
  }finally{$rsa.Dispose()}
  $installer=Join-Path $SourcePath 'install/install-personal-native.ps1'
  $arguments=@{RootPath='E:/task22-native-service-0000000000000000';ServiceName='PortalNativeTest_0000000000000000';NodeSource='unused';ServerSource='unused';ServerSha256=('0'*64);CompilerSha256=('0'*64);PowerShellSha256=('0'*64);HostSourceSha256=('0'*64);SyntheticQualification=$true;Mode='Permit';ActivationRecordPath='unused'}
  Reject 'synthetic-cannot-consume-production-record' {& $installer @arguments} 'SYNTHETIC_PRODUCTION_AUTHORITY_FORBIDDEN'
  Write-Output 'PRODUCTION_OFFLINE_PASS noServices=True noWorkloadLaunch=True noDatabase=True'
  return
}
if($PrivateDesktopPrerequisites){
  if($KnownDllsDescriptorOnly -or $ScratchPath.Replace('\','/') -cnotmatch '^E:/task22-native-service-[a-f0-9]{16}$' -or -not $OwnedPrivateRoot){throw 'PRIVATE_PREREQUISITE_ROOT_BINDING'}
  [NativeInstallation]::VerifyOriginalDirectory($OwnedPrivateRoot,$ScratchPath)
  $privateName='PortalNativeTest_'+$ScratchPath.Substring($ScratchPath.Length-16);$privateSid=[NativeInstallation]::ServiceSid($privateName)
  [NativeInstallation]::AdmitAcl($ScratchPath,$privateSid,$false,$true)
  $checks=[Collections.Generic.List[object]]::new();$failure=''
  function PrivateHash([string]$Path){(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()}
  try{
    $compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
    foreach($entry in @(@('mscorlib.dll','11ac114c43ecf6996bef58ba3c99fba3693a4560a84eeadde54d193060dc626c'),@('System.Core.dll','8b898bed54ae8cc61f9c58cc3eb062724f8357d2bdda338b5d363654ecff333d'))){
      if((PrivateHash ('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/'+$entry[0])) -cne $entry[1]){throw ('PRIVATE_REFERENCE_PREIMAGE_DRIFT '+$entry[0])}
    }
    $build=[Diagnostics.Process]::new();$build.StartInfo.FileName=$compiler
    $build.StartInfo.Arguments='/nologo /noconfig /nostdlib+ /target:exe /platform:x64 /optimize+ /out:"'+(Join-Path $ScratchPath 'prerequisite-host.exe')+'" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/mscorlib.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Core.dll" /reference:"C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Web.Extensions.dll" "'+$source+'"'
    $build.StartInfo.UseShellExecute=$false;$build.StartInfo.RedirectStandardOutput=$true;$build.StartInfo.RedirectStandardError=$true
    $build.StartInfo.EnvironmentVariables.Clear();$build.StartInfo.EnvironmentVariables['SystemRoot']='C:/Windows';$build.StartInfo.EnvironmentVariables['WINDIR']='C:/Windows';$build.StartInfo.EnvironmentVariables['TEMP']=$ScratchPath;$build.StartInfo.EnvironmentVariables['TMP']=$ScratchPath
    try{if(-not $build.Start()){throw 'PRIVATE_COMPILER_START'};$out=$build.StandardOutput.ReadToEndAsync();$err=$build.StandardError.ReadToEndAsync();if(-not $build.WaitForExit(30000)){throw 'PRIVATE_COMPILER_DEADLINE'}
      $checks.Add(@{case='absolute-csc';exitCode=$build.ExitCode;stdout=$out.Result;stderr=$err.Result;compilerSha256=(PrivateHash $compiler)})
      if($build.ExitCode -ne 0){throw 'PRIVATE_COMPILER_FAILED'}
    }finally{if(-not $build.HasExited){$build.Kill();$build.WaitForExit()};$build.Dispose()}
    foreach($relative in @('install/install-personal-native.ps1','test/native-service-host.ps1','test/native-installation.ps1','install/start-personal-native.ps1')){
      $tokens=$null;$errors=$null;[void][Management.Automation.Language.Parser]::ParseFile((Join-Path $SourcePath $relative),[ref]$tokens,[ref]$errors)
      $checks.Add(@{case='Parser.ParseFile';path=$relative;errors=@($errors|ForEach-Object{$_.ToString()})});if($errors.Count){throw 'PRIVATE_PARSER_FAILED'}
    }
    $station='Task22Private_'+('1'*32);$sourceHash=PrivateHash $source;$contract=[NativePrivateDesktop]::Contract($station,$privateSid,$ScratchPath,$sourceHash)
    $direct=[NativePrivateDesktop]::Contract($station,$privateSid,$ScratchPath,$sourceHash,$true)
    [NativePrivateDesktop]::VerifyBinding($direct,$direct,$station,$station,$privateSid,$ScratchPath,$sourceHash,[NativeKnownDlls]::Profile,'node-direct','','',$true)
    try{[NativePrivateDesktop]::VerifyBinding($contract,$contract,$station,$station,$privateSid,$ScratchPath,$sourceHash,[NativeKnownDlls]::Profile,'node-direct','','',$true);throw 'NODE_DIRECT_WRONG_CONTEXT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'PRIVATE_DESKTOP_COMPOSITION_BINDING'){throw}}
    [NativePrivateDesktop]::VerifyBinding($contract,$contract,$station,$station,$privateSid,$ScratchPath,$sourceHash,[NativeKnownDlls]::Profile,'private-desktop-command','','',$true)
    $negativeCases=@('missing-install','missing-permit','mixed-name','wrong-context','production','v2','debugger','fault','source-drift','root-drift','sid-drift')
    foreach($case in $negativeCases){
      $a=$contract;$b=$contract;$n=$station;$mode='private-desktop-command';$synthetic=$true;$profile=[NativeKnownDlls]::Profile;$event='';$fault='';$hash=$sourceHash;$root=$ScratchPath;$sid=$privateSid
      switch($case){'missing-install'{$a=''}'missing-permit'{$b=''}'mixed-name'{$n='Task22Private_'+('2'*32)}'wrong-context'{$mode='known-dlls-command'}'production'{$synthetic=$false}'v2'{$profile=[NativeWorkloadToken]::Profile}'debugger'{$event='Global\Task22DebuggerArmed_'+('1'*32)}'fault'{$fault='resume'}'source-drift'{$hash='0'*64}'root-drift'{$root='E:/task22-native-service-0000000000000000'}'sid-drift'{$sid='S-1-5-19'}}
      try{[NativePrivateDesktop]::VerifyBinding($a,$b,$station,$n,$sid,$root,$hash,$profile,$mode,$event,$fault,$synthetic);throw 'PRIVATE_BAD_CONTRACT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'PRIVATE_DESKTOP_COMPOSITION_BINDING'){throw}}
      $checks.Add(@{case=('contract-'+$case);rejected=$true})
    }
    foreach($desktop in @($false,$true)){
      $sddl=[NativePrivateDesktop]::Descriptor($privateSid,$desktop);$sd=[Security.AccessControl.RawSecurityDescriptor]::new($sddl);$bytes=[byte[]]::new($sd.BinaryLength);$sd.GetBinaryForm($bytes,0);[NativePrivateDesktop]::VerifyDescriptor($bytes,$privateSid,$desktop)
      $mutations=@{owner=$sddl.Replace('O:BA','O:LS');unprotected=$sddl.Replace('D:P','D:');broadAce=$sddl+'(A;;RC;;;BU)';wrongSid=$sddl.Replace($privateSid,'S-1-5-12');broadMask=$sddl.Replace($(if($desktop){'0x000200ff'}else{'0x0002037f'}),'0x000e03ff')}
      foreach($case in @('owner','unprotected','broadAce','wrongSid','broadMask')){
        $bad=$mutations[$case];if($bad -ceq $sddl){throw "PRIVATE_DESCRIPTOR_MUTATION_NOOP $case desktop=$desktop"}
        $sd=[Security.AccessControl.RawSecurityDescriptor]::new($bad);$bytes=[byte[]]::new($sd.BinaryLength);$sd.GetBinaryForm($bytes,0)
        try{[NativePrivateDesktop]::VerifyDescriptor($bytes,$privateSid,$desktop);throw "PRIVATE_BAD_DESCRIPTOR_ACCEPTED $case desktop=$desktop"}catch{if($_.Exception.ToString() -notmatch 'PRIVATE_DESCRIPTOR_'){throw}}
      }
      $checks.Add(@{case='descriptor-exact-owner-protected-SY-BA-exactSID';desktop=$desktop;rejectedMutations=5})
    }
    foreach($result in [NativePrivateDesktop]::FailureTests($privateSid)){$checks.Add(@{case='actual-private-custody-flow-injected-API';result=$result})}
    foreach($result in [NativeOuterChild]::CleanupFailureTests()){$checks.Add(@{case='actual-created-child-cleanup-flow-injected-API';result=$result})}
    $controller=[IO.File]::ReadAllText((Join-Path $SourcePath 'test/native-service-host.ps1'))
    $helper=[regex]::Match($controller,"(?s)Add-Type -TypeDefinition @'\r?\n(.*?)\r?\n'@")
    if(-not $helper.Success){throw 'PRIVATE_CONTROLLER_EXTRACTION'};Add-Type -TypeDefinition $helper.Groups[1].Value
    foreach($line in @('TASK22_EVENT_CONTINUE_VERIFIED_LOADER_BREAK','TASK22_EVENT_CAPTURED_TEARDOWN','Error: exact failure','Syntax error','INITIALIZER_FAILURE','ordinary output')){
      $expected=if($line -eq 'TASK22_EVENT_CONTINUE_VERIFIED_LOADER_BREAK'){'gh'}elseif($line -eq 'ordinary output'){$null}else{'q'}
      if([NativeHarnessEvents+DebuggerOutput]::InputForLine($line) -cne $expected){throw 'PRIVATE_EXISTING_CONTROLLER_POLICY'}
    }
    $signals=[NativeServiceHost+Signals]::new();[void]$signals.Accept('NATIVE_BOOTSTRAP_SUPERVISOR_PID=31',$true,$false);if($signals.Supervisor){throw 'PRIVATE_STDERR_PROTOCOL'}
    foreach($line in @('NATIVE_BOOTSTRAP_SUPERVISOR_PID=31','NATIVE_RUNTIME_PID=32','NATIVE_SUPERVISOR_STATE=ready child=32','NATIVE_SUPERVISOR_STATE=stopping child=32','NATIVE_SUPERVISOR_STATE=drained child=32','NATIVE_SUPERVISOR_STATE=stopped child=32')){[void]$signals.Accept($line,$false,$true)}
    if($signals.State -cne 'stopped'){throw 'PRIVATE_EXISTING_PROTOCOL'}
    $directSignals=[NativeServiceHost+Signals]::new();[void]$directSignals.Accept('NATIVE_BOOTSTRAP_SUPERVISOR_PID=41',$false,$false)
    foreach($line in @('NATIVE_RUNTIME_PID=42','NATIVE_SUPERVISOR_STATE=ready child=42','NATIVE_SUPERVISOR_STATE=stopping child=42','NATIVE_SUPERVISOR_STATE=drained child=42','NATIVE_SUPERVISOR_STATE=stopped child=42')){[void]$directSignals.Accept($line,$false,$true)}
    if($directSignals.State -cne 'stopped' -or $directSignals.Supervisor -ne 41){throw 'NODE_DIRECT_ORIGINAL_SUPERVISOR_PROTOCOL'}
    $checks.Add(@{case='unchanged-controller-and-ordered-protocol';passed=$true;nativeServices=0;children=0})
  }catch{$failure=$_.Exception.ToString()}
  $receipt=[ordered]@{schema='task22-private-desktop-prerequisites.v1';passed=(!$failure);failure=$failure;checks=@($checks);sourceSha256=(PrivateHash $source);controllerSha256=(PrivateHash (Join-Path $SourcePath 'test/native-service-host.ps1'));installerSha256=(PrivateHash (Join-Path $SourcePath 'install/install-personal-native.ps1'));testSha256=(PrivateHash $PSCommandPath);references=@(@($compiler,'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/mscorlib.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Core.dll','C:/Windows/Microsoft.NET/Framework64/v4.0.30319/System.Web.Extensions.dll')|ForEach-Object{@{path=$_;sha256=(PrivateHash $_)}})}
  $f=[IO.FileStream]::new((Join-Path $ScratchPath 'prerequisites.json'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read);try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes((ConvertTo-Json -InputObject $receipt -Depth 20));$f.Write($bytes,0,$bytes.Length);$f.Flush($true)}finally{$f.Dispose()}
  if($failure){throw $failure};Write-Output 'PRIVATE_DESKTOP_PREREQUISITES_PASS';return
}
if($KnownDllsDescriptorOnly){
  if($ScratchPath.Replace('\','/') -notmatch '^E:/task22-native-known-dlls-[a-f0-9]{32}/descriptor.json$' -or (Test-Path -LiteralPath $ScratchPath)){throw 'DESCRIPTOR_OUTPUT_BINDING'}
  $capture=[NativeKnownDlls]::Capture()
  [IO.File]::WriteAllText($ScratchPath,(ConvertTo-Json -InputObject $capture -Depth 20),[Text.UTF8Encoding]::new($false))
  if($capture.gate -ne 'DESCRIPTOR_CAPTURED'){throw 'KNOWNDLLS_DESCRIPTOR_GATE_FAILED'}
  Write-Output ('KNOWNDLLS_DESCRIPTOR_CAPTURED '+$ScratchPath);return
}
if ($ScratchPath.Replace('\','/') -notmatch '^E:/task22-native-installation-test-[a-f0-9]{16}$' -or (Test-Path -LiteralPath $ScratchPath)) {throw 'TEST_SCRATCH_COLLISION'}
$signals=[NativeServiceHost+Signals]::new()
foreach($line in @('NATIVE_BOOTSTRAP_SUPERVISOR_PID=31','NATIVE_RUNTIME_PID=32','NATIVE_SUPERVISOR_STATE=ready child=32','NATIVE_SUPERVISOR_STATE=drained child=32')){
  [void]$signals.Accept($line,$true,$true)
}
if($signals.Supervisor -ne 0 -or $signals.Application -ne 0 -or $signals.State -cne 'starting'){throw 'STDERR_PROTOCOL_SPOOF'}
[void]$signals.Accept('NATIVE_BOOTSTRAP_SUPERVISOR_PID=31',$false,$false)
try{[void]$signals.Accept('NATIVE_RUNTIME_PID=31',$false,$false);throw 'DUPLICATE_PID_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'SERVICE_DUPLICATE_APPLICATION_IDENTITY'){throw}}
$signals=[NativeServiceHost+Signals]::new()
[void]$signals.Accept('NATIVE_BOOTSTRAP_SUPERVISOR_PID=31',$false,$false)
[void]$signals.Accept('NATIVE_RUNTIME_PID=32',$false,$false)
try{[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=ready child=33',$false,$false);throw 'WRONG_STATE_PID_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'SERVICE_STATE_IDENTITY'){throw}}
[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=ready child=32',$false,$false)
[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=drained child=32',$true,$true)
if($signals.State -cne 'ready'){throw 'STDERR_DRAIN_SPOOF'}
[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=stopping child=32',$false,$true)
[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=drained child=32',$false,$true)
[void]$signals.Accept('NATIVE_SUPERVISOR_STATE=stopped child=32',$false,$true)
if($signals.State -cne 'stopped'){throw 'PROTOCOL_VALID_SEQUENCE'}
Write-Output 'PROTOCOL_NEGATIVES_PASS stderr-spoof duplicate-pid wrong-state-pid ordered-clean-sequence'
foreach($profile in @('','wrong','local-synthetic-primary.v1:BA-deny-only:disable-max-privilege:service-owner:service-dacl:preserve-restricting-sids','production-host-admission.v1')){
  try{[NativeServiceHost]::VerifyProfile([NativeWorkloadToken]::Profile,$profile,$true);throw 'TOKEN_PROFILE_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}
}
try{[NativeServiceHost]::VerifyProfile('production-host-admission.v1',[NativeWorkloadToken]::Profile,$true);throw 'MIXED_PROFILE_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}
$oldProfile='local-synthetic-primary.v1:BA-deny-only:disable-max-privilege:service-owner:service-dacl:preserve-restricting-sids'
try{[NativeServiceHost]::VerifyProfile($oldProfile,$oldProfile,$true);throw 'OLD_PROFILE_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}
try{[NativeServiceHost]::VerifyProfile([NativeWorkloadToken]::Profile,[NativeWorkloadToken]::Profile,$false);throw 'PRODUCTION_FILTER_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}
[NativeServiceHost]::VerifyProfile([NativeWorkloadToken]::Profile,[NativeWorkloadToken]::Profile,$true)
[NativeServiceHost]::VerifyProfile([NativeKnownDlls]::Profile,[NativeKnownDlls]::Profile,$true)
$debugEvent='Global\Task22DebuggerArmed_'+('1'*32)
[NativeServiceHost]::VerifyDebuggerBinding('known-dlls-command',$debugEvent,[NativeKnownDlls]::Profile,$true)
[NativeServiceHost]::VerifyDebuggerBinding('known-dlls-command','',[NativeKnownDlls]::Profile,$true)
[NativeServiceHost]::VerifyDebuggerBinding('debugger-command',$debugEvent,[NativeWorkloadToken]::Profile,$true)
foreach($case in @(@('debugger-command','',[NativeWorkloadToken]::Profile,$true),@('known-dlls-command','unbound',[NativeKnownDlls]::Profile,$true),@('known-dlls-command',$debugEvent,[NativeWorkloadToken]::Profile,$true),@('debugger-command',$debugEvent,[NativeKnownDlls]::Profile,$true),@('known-dlls-command',$debugEvent,[NativeKnownDlls]::Profile,$false))){
  try{[NativeServiceHost]::VerifyDebuggerBinding($case[0],$case[1],$case[2],$case[3]);throw 'DEBUGGER_COMPOSITION_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'DEBUGGER_COMPOSITION_BINDING'){throw}}
}
Write-Output 'DEBUGGER_COMPOSITION_NEGATIVES_PASS event profile production'
foreach($pair in @(@([NativeWorkloadToken]::Profile,[NativeKnownDlls]::Profile),@([NativeKnownDlls]::Profile,[NativeWorkloadToken]::Profile))){try{[NativeServiceHost]::VerifyProfile($pair[0],$pair[1],$true);throw 'MIXED_V2_V3_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}}
try{[NativeServiceHost]::VerifyProfile([NativeKnownDlls]::Profile,[NativeKnownDlls]::Profile,$false);throw 'PRODUCTION_V3_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_PROFILE_BINDING'){throw}}
if([NativeWorkloadToken]::Profile -cne 'local-synthetic-full-primary.v2' -or [NativeWorkloadToken]::ReadSid -cne 'S-1-5-32-545'){throw 'TOKEN_PROFILE_CONTRACT_CHANGED'}
$contractSid=[NativeInstallation]::ServiceSid('PortalNativeTest_0000000000000000')
$contractRoot='E:\task22-native-service-0000000000000000'
$contract=[NativeWorkloadToken]::Contract($contractSid,$contractRoot)
$knownContract=[NativeWorkloadToken]::KnownDllsContract($contractSid,$contractRoot)
[NativeServiceHost]::VerifyKnownDllsContract($knownContract,$knownContract,$contractSid,$contractRoot,$true)
foreach($bad in @($contract,$knownContract.Replace([NativeKnownDlls]::DescriptorSha256,('0'*64)),$knownContract.Replace(',S-1-5-12',''),$knownContract.Replace('S-1-5-32-545,S-1-5-12','S-1-5-12,S-1-5-32-545'))){try{[NativeServiceHost]::VerifyKnownDllsContract($bad,$bad,$contractSid,$contractRoot,$true);throw 'KNOWNDLLS_DRIFT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_KNOWNDLLS_CONTRACT_BINDING'){throw}}}
if(-not $contract){throw 'TOKEN_CONTRACT_EMPTY'}
[NativeServiceHost]::VerifyContract($contract,$contract,$contractSid,$contractRoot,$true)
[NativeServiceHost]::VerifyContract('','','S-1-5-19',$contractRoot,$false)
foreach($pair in @(@('',$contract),@($contract,''),@($contract,'tampered'),@($contract,$contract))){
  $sid=if($pair[0] -ceq $contract -and $pair[1] -ceq $contract){[NativeInstallation]::ServiceSid('PortalNativeTest_0000000000000000_sibling')}else{$contractSid}
  try{[NativeServiceHost]::VerifyContract($pair[0],$pair[1],$sid,$contractRoot,$true);throw 'TOKEN_CONTRACT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_CONTRACT_BINDING'){throw}}
}
try{[NativeServiceHost]::VerifyContract($contract,$contract,$contractSid,$contractRoot,$false);throw 'PRODUCTION_CONTRACT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_CONTRACT_BINDING'){throw}}
try{[NativeServiceHost]::VerifyContract($contract,$contract,$contractSid,'E:\task22-native-service-1111111111111111',$true);throw 'OTHER_ROOT_CONTRACT_ACCEPTED'}catch{if($_.Exception.ToString() -notmatch 'TOKEN_CONTRACT_BINDING'){throw}}
Write-Output 'TOKEN_PROFILE_NEGATIVES_PASS missing wrong old-v1 mixed production-synthetic contract-drift'
[NativeInstallation]::CreateExclusive($ScratchPath,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)')
function Hash([string]$Path){(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()}
$installer=Join-Path $SourcePath 'install/install-personal-native.ps1'
$args=@{SyntheticQualification=$true;RootPath='E:/task22-native-service-0000000000000000';ServiceName='PortalNativeTest_0000000000000000';NodeSource='not-consumed';ServerSource='not-consumed';ServerSha256=('0'*64);CompilerSha256=(Hash 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe');PowerShellSha256=(Hash 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe');HostSourceSha256=(Hash $source)}
$expected=[ordered]@{id=('a'*64);image=('b'*64);mount='synthetic-db';labels='synthetic-portal';config=('c'*64);restart='no';running=$false}
$expectedPath=Join-Path $ScratchPath 'expected.json';$observedPath=Join-Path $ScratchPath 'observed.json'
[IO.File]::WriteAllText($expectedPath,($expected|ConvertTo-Json -Compress))
$cases=@('exact','unless-stopped','failed-policy-update','same-name-new-id','missing-id','extra-writer','recreated','image-drift','mount-drift','labels-drift','config-drift','running')
try {
  # Reproduce the v8 Move failure with a held no-DELETE file pin, then
  # publish final bytes under the exact production directory pins unchanged.
  $publication=Join-Path $ScratchPath 'attestations'
  [NativeInstallation]::CreateExclusive($publication,"O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;$contractSid)")
  $directoryPin=[NativeInstallation]::Pin($publication,$true);$attestorPin=[NativeInstallation]::Pin($publication,$true)
  try{
    $temporary=Join-Path $publication 'historical.tmp';[IO.File]::WriteAllText($temporary,'historical-never-promoted')
    $temporaryPin=[NativeInstallation]::Pin($temporary,$false)
    try{
      $code=0;try{[IO.File]::Move($temporary,(Join-Path $publication 'historical.json'))}catch{$code=$_.Exception.GetBaseException().HResult -band 65535}
      if($code -ne 32){throw "ATTEST_MOVE_REPRO_EXPECTED_32_ACTUAL_$code"}
      Write-Output 'ATTEST_PINNED_MOVE_REPRO_PASS error=32'
    }finally{$temporaryPin.Dispose()}
    $final=Join-Path $publication 'fresh.json';$bytes=[Text.Encoding]::UTF8.GetBytes('{"payload":"fixture","signature":"fixture"}')
    $received=[AttestPublicationFixture]::Receive([NativeStartupAttestor],$final,$bytes,$contractSid)
    if([Convert]::ToBase64String($received) -cne [Convert]::ToBase64String($bytes)){throw 'ATTEST_RECEIVED_BYTES'}
      $resultPin=[NativeInstallation]::Pin($final,$false)
      try{
        [NativeInstallation]::AdmitAcl($final,$contractSid,$false,$false)
        if([Convert]::ToBase64String([IO.File]::ReadAllBytes($final)) -cne [Convert]::ToBase64String($bytes)){throw 'ATTEST_PUBLICATION_BYTES'}
        foreach($operation in @('rename','replace')){
          $replacement=Join-Path $publication ('replacement-'+$operation);[IO.File]::WriteAllText($replacement,'not-attestor-result');$code=0
          try{if($operation -ceq 'rename'){[IO.File]::Move($final,$final+'.moved')}else{[IO.File]::Replace($replacement,$final,$final+'.backup')}}catch{$code=$_.Exception.GetBaseException().HResult -band 65535}
          if($code -ne 32){throw "ATTEST_NONATTESTOR_${operation}_EXPECTED_32_ACTUAL_$code"}
          Write-Output "ATTEST_NONATTESTOR_NAMESPACE_DENIED operation=$operation error=32"
        }
        try{[NativeStartupAttestor]::PublishResult($final,$bytes,$contractSid);throw 'ATTEST_RESULT_OVERWRITTEN'}catch{if($_.Exception.GetBaseException() -isnot [IO.IOException]){throw}}
      }finally{$resultPin.Dispose()}
      [IO.File]::WriteAllText($final+'.replacement','not-attestor')
      [AttestPublicationFixture]::ReaderDenied($final,$contractSid)
      Write-Output 'ATTEST_READER_WRITE_RENAME_REPLACE_DENIED error=5 without-file-pin'
      if([IO.File]::Exists((Join-Path $publication 'historical.json')) -or [IO.File]::ReadAllText($temporary) -cne 'historical-never-promoted'){throw 'ATTEST_HISTORICAL_PROMOTION'}
      Write-Output 'ATTEST_DIRECT_PUBLICATION_PASS pinned-directory unchanged-acl no-replacement'
  }finally{$attestorPin.Dispose();$directoryPin.Dispose()}
  foreach($case in $cases){
    $copy=[ordered]@{};foreach($key in $expected.Keys){$copy[$key]=$expected[$key]}
    $observed=@($copy)
    switch($case){
      'unless-stopped'{$copy.restart='unless-stopped'}
      'failed-policy-update'{$copy.restart='always'}
      'same-name-new-id'{$copy.id='d'*64}
      'missing-id'{$observed=@()}
      'extra-writer'{$observed=@($copy,$copy)}
      'recreated'{$copy.id='e'*64}
      'image-drift'{$copy.image='f'*64}
      'mount-drift'{$copy.mount='foreign-db'}
      'labels-drift'{$copy.labels='foreign'}
      'config-drift'{$copy.config='1'*64}
      'running'{$copy.running=$true}
    }
    [IO.File]::WriteAllText($observedPath,(ConvertTo-Json -InputObject $observed -Compress))
    $expectedError=if($case -eq 'exact'){'FENCE_UNPROVEN'}else{'FENCE_PREIMAGE_REJECTED'}
    try{& $installer @args -Mode Fence -ExpectedOldWriterPath $expectedPath -ObservedOldWritersPath $observedPath;throw 'FENCE_ACCEPTED'}catch{if($_.Exception.Message -cne $expectedError){throw}}
    Write-Output "FENCE_NEGATIVE $case $expectedError"
  }
  $child=Join-Path $ScratchPath 'collision'
  [NativeInstallation]::CreateExclusive($child,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)')
  try{[NativeInstallation]::CreateExclusive($child,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)');throw 'COLLISION_ADOPTED'}catch{if($_.Exception.ToString() -notmatch 'INSTALL_CREATE_EXCLUSIVE'){throw}}
  Write-Output 'INSTALL_COLLISION_DENIED'
  $broad=Join-Path $ScratchPath 'broad-write'
  [NativeInstallation]::CreateExclusive($broad,"O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;$contractSid)(A;OICI;0x1301bf;;;BU)")
  try{[NativeInstallation]::AdmitAcl($broad,$contractSid,$false,$true);throw 'BROAD_WRITE_ADMITTED'}catch{if($_.Exception.ToString() -notmatch 'INSTALL_FOREIGN_ACE'){throw}}
  Write-Output 'INSTALL_BROAD_WRITE_DENIED'
  $original=Join-Path $ScratchPath 'original.txt';$alias=Join-Path $ScratchPath 'alias.txt'
  [IO.File]::WriteAllText($original,'synthetic')
  $linkOutput=& cmd.exe /d /c "mklink /H `"$alias`" `"$original`"" 2>&1
  if($LASTEXITCODE -ne 0){throw "TEST_HARDLINK_CREATE $linkOutput"}
  try{$pin=[NativeInstallation]::Pin($original,$false);$pin.Dispose();throw 'HARDLINK_ADMITTED'}catch{if($_.Exception.ToString() -notmatch 'INSTALL_REGULAR_ONE_LINK'){throw}}
  Write-Output 'INSTALL_HARDLINK_DENIED'
  $junction=Join-Path $ScratchPath 'junction'
  $linkOutput=& cmd.exe /d /c "mklink /J `"$junction`" `"$child`"" 2>&1
  if($LASTEXITCODE -ne 0){throw "TEST_JUNCTION_CREATE $linkOutput"}
  try{$pin=[NativeInstallation]::Pin($junction,$true);$pin.Dispose();throw 'REPARSE_ADMITTED'}catch{if($_.Exception.ToString() -notmatch 'INSTALL_REGULAR_ONE_LINK'){throw}}
  Write-Output 'INSTALL_REPARSE_DENIED'
  # Use administrator-authorized opens to distinguish sharing from the DACL.
  # Both directory pin kinds must deny actual deletion/rename/replacement;
  # unpinned controls demonstrate that the operations themselves are supported.
  $process=[Diagnostics.Process]::GetCurrentProcess();$token=[NativeWorkloadToken]::Open($process.Handle)
  try{
    foreach($writable in @($false,$true)){
      $directory=Join-Path $ScratchPath ('pin-'+$writable);$moved=$directory+'-moved'
      [NativeInstallation]::CreateExclusive($directory,"O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1301bf;;;$contractSid)(A;OICI;RC;;;OW)")
      $pin=if($writable){[NativeInstallation]::PinWritableDirectory($directory,$contractSid)}else{[NativeInstallation]::Pin($directory,$true)}
      try{
        $code=[NativeWorkloadToken]::Access($token,$directory,[uint32]0x40000000,$true);$expected=if($writable){0}else{32}
        if($code -ne $expected){throw "PIN_WRITE_SHARING_EXPECTED_${expected}_ACTUAL_$code"}
        Write-Output "INSTALL_PIN_WRITE writable=$writable expected=$expected result=$code"
        foreach($operation in @('rename','delete')){
          $code=0
          try{if($operation -eq 'rename'){[IO.Directory]::Move($directory,$moved)}else{[IO.Directory]::Delete($directory)}}catch{$code=$_.Exception.GetBaseException().HResult -band 65535}
          if($code -ne 32){throw "PIN_NAMESPACE_${operation}_EXPECTED_32_ACTUAL_$code"}
          Write-Output "INSTALL_PIN_NAMESPACE writable=$writable operation=$operation expected=32 result=$code"
        }
        try{[NativeInstallation]::CreateExclusive($directory,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)');throw 'PIN_REPLACEMENT_ADOPTED'}catch{if($_.Exception.ToString() -notmatch 'INSTALL_CREATE_EXCLUSIVE'){throw}}
        if(-not [IO.Directory]::Exists($directory) -or [IO.Directory]::Exists($moved)){throw 'PIN_NAMESPACE_CHANGED'}
      }finally{$pin.Dispose()}
      [IO.Directory]::Move($directory,$moved);[IO.Directory]::Delete($moved)
      Write-Output "INSTALL_PIN_UNPINNED_RENAME_DELETE writable=$writable result=0"
    }
  }finally{$token.Dispose();$process.Dispose()}
}finally{Remove-Item -LiteralPath $ScratchPath -Recurse -Force}
Write-Output 'NATIVE_INSTALLATION_HARNESS_PASS'
