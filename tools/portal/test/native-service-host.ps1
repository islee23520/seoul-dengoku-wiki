param(
  [Parameter(Mandatory=$true)][string]$SourcePath,
  [Parameter(Mandatory=$true)][string]$OutputPath,
  [Parameter(Mandatory=$true)][switch]$RegisterOwnedSyntheticServices,
  [switch]$ExpectHostIdentityRejection,
  [switch]$ObjectRightsOnly,
  [switch]$RuntimeOnly,
  [switch]$KnownDllsGate,
  [switch]$KnownDllsIsolation,
  [switch]$KnownDllsCommand,
  [switch]$PrivateDesktopCommand,
  [switch]$NodeDirect,
  [switch]$TwoPeerNodeDirect,
  [string]$OfficialNodePath='',
  [string]$PrivateRoot='',
  [Microsoft.Win32.SafeHandles.SafeFileHandle]$OwnedPrivateRoot=$null,
  [string]$KnownDllsAdmissionPath='',
  [string]$DiagnosticRoot='',
  [string]$DebuggerRoot=''
)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$installer=Join-Path $SourcePath 'install/install-personal-native.ps1'
$compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$powershell='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
function Hash([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32.SafeHandles;
public sealed class OwnedScmHandle : SafeHandleZeroOrMinusOneIsInvalid {
  public OwnedScmHandle():base(true){}
  [DllImport("advapi32.dll")] static extern bool CloseServiceHandle(IntPtr handle);
  protected override bool ReleaseHandle(){return CloseServiceHandle(handle);}
}
public sealed class OwnedScmService : IDisposable {
  [StructLayout(LayoutKind.Sequential)] struct SID_INFO {public uint Type;}
  [StructLayout(LayoutKind.Sequential)] struct FAILURE {public uint Reset;public IntPtr Reboot,Command;public uint Count;public IntPtr Actions;}
  [StructLayout(LayoutKind.Sequential)] public struct STATUS {public uint Type,State,Accepted,Win32,Specific,Checkpoint,Hint,Pid,Flags;}
  [StructLayout(LayoutKind.Sequential)] struct NOTIFY {public uint Version;public Callback Callback;public IntPtr Context;public uint Result;public STATUS Status;public uint Triggered;public IntPtr Names;}
  [UnmanagedFunctionPointer(CallingConvention.Winapi)] delegate void Callback(IntPtr value);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern OwnedScmHandle OpenSCManagerW(string machine,string database,uint access);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern OwnedScmHandle OpenServiceW(OwnedScmHandle scm,string name,uint access);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern OwnedScmHandle CreateServiceW(OwnedScmHandle scm,string name,string display,uint access,uint type,uint start,uint error,string binary,string group,IntPtr tag,string dependencies,string account,string password);
  [DllImport("advapi32.dll",EntryPoint="ChangeServiceConfig2W",SetLastError=true)] static extern bool ChangeSid(OwnedScmHandle service,uint level,ref SID_INFO sid);
  [DllImport("advapi32.dll",EntryPoint="ChangeServiceConfig2W",SetLastError=true)] static extern bool ChangeFailure(OwnedScmHandle service,uint level,ref FAILURE failure);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool SetServiceObjectSecurity(OwnedScmHandle service,uint kind,byte[] security);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool StartServiceW(OwnedScmHandle service,int count,IntPtr arguments);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool ControlService(OwnedScmHandle service,uint control,out STATUS status);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool QueryServiceStatusEx(OwnedScmHandle service,int level,out STATUS status,int length,out int needed);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool QueryServiceConfig2W(OwnedScmHandle service,uint level,IntPtr buffer,uint length,out uint needed);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool DeleteService(OwnedScmHandle service);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode)] static extern uint NotifyServiceStatusChangeW(OwnedScmHandle service,uint mask,IntPtr notify);
  [DllImport("kernel32.dll")] static extern uint SleepEx(uint milliseconds,bool alertable);
  OwnedScmHandle manager,handle;
  public string Name;
  public uint SidType;
  public string Configuration;
  public Process OriginalHost;
  static void Check(bool result,string message){if(!result)throw new Win32Exception(Marshal.GetLastWin32Error(),message);}
  public OwnedScmService(string name,string binary,uint sidType){
    Name=name;manager=OpenSCManagerW(null,null,3);Check(!manager.IsInvalid,"SCM_OPEN");
    using(var collision=OpenServiceW(manager,name,1)){
      if(!collision.IsInvalid)throw new Exception("SERVICE_COLLISION");
      if(Marshal.GetLastWin32Error()!=1060)throw new Win32Exception();
    }
    handle=CreateServiceW(manager,name,name,0xf01ff,0x10,3,1,binary,null,IntPtr.Zero,null,@"NT AUTHORITY\LocalService",null);
    Check(!handle.IsInvalid,"SCM_CREATE_EXCLUSIVE");
    try{
      if(sidType!=1&&sidType!=3)throw new Exception("SCM_SID_TYPE_CONTRACT");
      var sid=new SID_INFO{Type=sidType};Check(ChangeSid(handle,5,ref sid),"SCM_EXACT_SERVICE_SID");
      var failure=new FAILURE();Check(ChangeFailure(handle,2,ref failure),"SCM_NO_RECOVERY");
      var dacl=new System.Security.AccessControl.RawSecurityDescriptor("O:SYG:SYD:P(A;;GA;;;SY)(A;;GA;;;BA)");
      var bytes=new byte[dacl.BinaryLength];dacl.GetBinaryForm(bytes,0);Check(SetServiceObjectSecurity(handle,4,bytes),"SCM_DACL");
      uint needed;IntPtr info=Marshal.AllocHGlobal(4);
      try{Check(QueryServiceConfig2W(handle,5,info,4,out needed),"SCM_QUERY_SID_TYPE");SidType=(uint)Marshal.ReadInt32(info);if(SidType!=sidType)throw new Exception("SOURCE_SCM_CONFIG_MISMATCH");}finally{Marshal.FreeHGlobal(info);}
      QueryServiceConfig2W(handle,2,IntPtr.Zero,0,out needed);info=Marshal.AllocHGlobal((int)needed);
      try{Check(QueryServiceConfig2W(handle,2,info,needed,out needed),"SCM_QUERY_RECOVERY");var observed=(FAILURE)Marshal.PtrToStructure(info,typeof(FAILURE));if(observed.Count!=0)throw new Exception("SCM_RECOVERY_NOT_EMPTY");}finally{Marshal.FreeHGlobal(info);}
      Configuration="name="+name+" sidType="+SidType+" ownProcess=True demandStart=True failureActions=0 binary="+binary;
    }catch{DeleteService(handle);handle.Dispose();manager.Dispose();throw;}
  }
  public STATUS Query(){STATUS status;int needed;Check(QueryServiceStatusEx(handle,0,out status,Marshal.SizeOf(typeof(STATUS)),out needed),"SCM_QUERY");return status;}
  public void Start(){Check(StartServiceW(handle,0,IntPtr.Zero),"SCM_START");var status=Query();if(status.Pid!=0){OriginalHost=Process.GetProcessById((int)status.Pid);var h=OriginalHost.Handle;}}
  public void Stop(){STATUS status;if(!ControlService(handle,1,out status)&&Marshal.GetLastWin32Error()!=1061)throw new Win32Exception();}
  public void WaitState(uint expected,int milliseconds){
    if(Query().State==expected)return;
    Exception failure=null;
    var thread=new Thread(()=>{
      IntPtr buffer=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(NOTIFY)));
      try{
        bool fired=false;Callback callback=p=>{fired=true;};
        var notify=new NOTIFY{Version=2,Callback=callback};Marshal.StructureToPtr(notify,buffer,false);
        uint code=NotifyServiceStatusChangeW(handle,1u<<((int)expected-1),buffer);
        if(code!=0)throw new Win32Exception((int)code,"SCM_NOTIFY");
        var clock=Stopwatch.StartNew();
        // Alertable wait dispatches the SCM APC; this is an event subscription,
        // not a timing sleep or QueryServiceStatus polling loop.
        while(!fired){long remaining=milliseconds-clock.ElapsedMilliseconds;if(remaining<=0)throw new Exception("SCM_EVENT_DEADLINE");SleepEx((uint)remaining,true);}
        GC.KeepAlive(callback);
        if(Query().State!=expected)throw new Exception("SCM_STATE_DRIFT");
      }catch(Exception error){failure=error;}finally{Marshal.FreeHGlobal(buffer);}
    });thread.IsBackground=true;thread.Start();
    if(!thread.Join(milliseconds+1000))throw new Exception("SCM_NOTIFY_THREAD_DEADLINE");
    if(failure!=null)throw failure;
  }
  public void CaptureHost(){if(OriginalHost==null){var status=Query();if(status.Pid==0)throw new Exception("SCM_HOST_PID_MISSING");OriginalHost=Process.GetProcessById((int)status.Pid);var h=OriginalHost.Handle;}}
  public void Abort(){CaptureHost();if(!OriginalHost.HasExited)OriginalHost.Kill();if(!OriginalHost.WaitForExit(10000))throw new Exception("HOST_ABORT_EXIT_DEADLINE");}
  public void Dispose(){
    if(handle==null)return;
    try{
      if(Query().State!=1){Abort();WaitState(1,10000);}
      if(OriginalHost!=null&&!OriginalHost.WaitForExit(10000))throw new Exception("SCM_HOST_HANDLE_EXIT_DEADLINE");
      Check(DeleteService(handle),"SCM_DELETE_ORIGINAL_HANDLE");
    }finally{handle.Dispose();handle=null;if(OriginalHost!=null)OriginalHost.Dispose();manager.Dispose();}
  }
}
public static class NativeHarnessEvents {
  [StructLayout(LayoutKind.Sequential)] public struct OBJECT_ATTRIBUTES {public uint Length;public IntPtr RootDirectory,ObjectName;public uint Attributes;public IntPtr SecurityDescriptor,SecurityQualityOfService;}
  [StructLayout(LayoutKind.Sequential)] public struct UNICODE_STRING {public ushort Length,MaximumLength;public IntPtr Buffer;}
  public sealed class DebuggerOutput : IDisposable {
    public readonly ManualResetEvent Ready=new ManualResetEvent(false);
    public readonly ManualResetEvent Exited=new ManualResetEvent(false);
    public readonly ManualResetEvent Failed=new ManualResetEvent(false);
    public readonly System.Text.StringBuilder Text=new System.Text.StringBuilder();
    public static string InputForLine(string line){if(line=="TASK22_EVENT_CONTINUE_VERIFIED_LOADER_BREAK")return "gh";if(line=="TASK22_EVENT_CAPTURED_TEARDOWN"||line.Contains("Error:")||line.Contains("Syntax error")||line.Contains("Error evaluating breakpoint")||line.Contains("INSTRUMENTATION_ERROR")||line.Contains("INITIALIZER_")||line.Contains("No runnable debuggees"))return "q";return null;}
    void Receive(Process process,string line){if(line==null)return;lock(Text){Text.AppendLine(line);if(line=="TASK22_DEBUGGER_ARMED")Ready.Set();string input=InputForLine(line);if(input=="q")Failed.Set();if(input!=null){try{process.StandardInput.WriteLine(input);process.StandardInput.Flush();}catch(InvalidOperationException){}}}}
    public void Subscribe(Process process){process.Exited+=(s,e)=>Exited.Set();process.EnableRaisingEvents=true;process.OutputDataReceived+=(s,e)=>Receive(process,e.Data);process.ErrorDataReceived+=(s,e)=>Receive(process,e.Data);}
    public string Snapshot(){lock(Text)return Text.ToString();}
    public void Dispose(){Ready.Dispose();Exited.Dispose();Failed.Dispose();}
  }
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern SafeFileHandle CreateFileW(string path,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
  [DllImport("advapi32.dll",SetLastError=true)] static extern uint GetSecurityInfo(SafeFileHandle handle,uint kind,uint information,out IntPtr owner,out IntPtr group,out IntPtr dacl,out IntPtr sacl,out IntPtr descriptor);
  [DllImport("advapi32.dll")] static extern uint GetSecurityDescriptorLength(IntPtr descriptor);
  [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr pointer);
  public static string PipeSecurity(string path){using(var handle=CreateFileW(path,0x20000,3,IntPtr.Zero,3,0,IntPtr.Zero)){
    if(handle.IsInvalid)throw new Win32Exception(Marshal.GetLastWin32Error(),"RUNTIME_PIPE_OPEN");IntPtr owner,group,dacl,sacl,descriptor;uint code=GetSecurityInfo(handle,1,7,out owner,out group,out dacl,out sacl,out descriptor);if(code!=0)throw new Win32Exception((int)code,"RUNTIME_PIPE_SECURITY");
    try{byte[] bytes=new byte[GetSecurityDescriptorLength(descriptor)];Marshal.Copy(descriptor,bytes,0,bytes.Length);return new System.Security.AccessControl.RawSecurityDescriptor(bytes,0).GetSddlForm(System.Security.AccessControl.AccessControlSections.All);}finally{LocalFree(descriptor);}}}
  static readonly System.Collections.Generic.Dictionary<string,EventWaitHandle> gates=new System.Collections.Generic.Dictionary<string,EventWaitHandle>();
  public static void Register(string path,EventWaitHandle signal){gates.Add(path,signal);}
  public static Task<string> Line(string path,string needle){
    var armed=new ManualResetEvent(false);
    var task=Task.Factory.StartNew(()=>{
      using(var watcher=new FileSystemWatcher(Path.GetDirectoryName(path),Path.GetFileName(path))){
        var changed=new AutoResetEvent(false);FileSystemEventHandler handler=(s,e)=>changed.Set();RenamedEventHandler rename=(s,e)=>changed.Set();
        watcher.Created+=handler;watcher.Changed+=handler;watcher.Renamed+=rename;watcher.EnableRaisingEvents=true;
        armed.Set();
        var clock=Stopwatch.StartNew();
        EventWaitHandle signal;gates.TryGetValue(path,out signal);
        while(true){
          if(File.Exists(path)){string text;using(var stream=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.ReadWrite))using(var reader=new StreamReader(stream))text=reader.ReadToEnd();foreach(string line in text.Split('\n'))if(line.Contains(needle))return line.Trim();if(needle=="ACTUAL_READY"&&text.Contains("SERVICE_FAILURE="))throw new Exception("SERVICE_FAILED_BEFORE_READY "+text);}
          int remaining=30000-(int)clock.ElapsedMilliseconds;if(remaining<=0)throw new Exception("HARNESS_EVENT_DEADLINE_"+needle);if(signal!=null)signal.WaitOne(remaining);else changed.WaitOne(remaining);
        }
      }
    },TaskCreationOptions.LongRunning);
    if(WaitHandle.WaitAny(new[]{armed,((IAsyncResult)task).AsyncWaitHandle},5000)!=0){task.GetAwaiter().GetResult();throw new Exception("HARNESS_SUBSCRIPTION_DEADLINE");}
    armed.Dispose();return task;
  }
  public static Process Member(string path,string prefix){
    string line=Read(path);foreach(string item in line.Split('\n'))if(item.Contains(prefix)){int start=item.IndexOf(prefix,StringComparison.Ordinal)+prefix.Length;int id=Int32.Parse(item.Substring(start).Split(' ')[0]);var p=Process.GetProcessById(id);var h=p.Handle;return p;}throw new Exception("MEMBER_NOT_REPORTED_"+prefix);
  }
  public static string Read(string path){using(var stream=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.ReadWrite))using(var reader=new StreamReader(stream))return reader.ReadToEnd();}
  public static Task<int> Exit(Process process){
    var done=new TaskCompletionSource<int>();process.Exited+=(s,e)=>done.TrySetResult(process.ExitCode);process.EnableRaisingEvents=true;
    if(process.HasExited)done.TrySetResult(process.ExitCode);return done.Task;
  }
  public static int RenameAs(Process process,string path){
    SafeFileHandle token;if(!OpenProcessToken(process.Handle,0xc,out token))throw new Win32Exception(Marshal.GetLastWin32Error(),"PEER_TOKEN_OPEN");
    using(token)using(System.Security.Principal.WindowsIdentity.Impersonate(token.DangerousGetHandle())){
      try{Directory.Move(path,path+"-replacement");return 0;}catch(IOException error){return error.HResult&65535;}catch(UnauthorizedAccessException error){return error.HResult&65535;}
    }
  }
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out SafeFileHandle token);
  public static Task<string> Exchange(string name){return Task.Factory.StartNew(()=>{
    using(var pipe=new System.IO.Pipes.NamedPipeClientStream(".",name,System.IO.Pipes.PipeDirection.InOut)){
      pipe.Connect(10000);using(var reader=new StreamReader(pipe))using(var writer=new StreamWriter(pipe)){
        writer.AutoFlush=true;writer.WriteLine("probe");var line=reader.ReadLineAsync();
        if(!line.Wait(10000))throw new Exception("PEER_APPLICATION_REPLY_DEADLINE");return line.Result;
      }
    }
  },TaskCreationOptions.LongRunning);}
  public static string Modules(Process process){var text=new System.Text.StringBuilder();foreach(ProcessModule module in process.Modules)text.AppendLine(module.FileName+" "+NativeHash(module.FileName));return text.ToString();}
  static string NativeHash(string path){using(var stream=File.OpenRead(path))using(var sha=System.Security.Cryptography.SHA256.Create())return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();}
}
'@
$helper=Join-Path $SourcePath 'install/native-service-host.cs'
Add-Type -Path $helper -ReferencedAssemblies @('System.Web.Extensions','System.Core')
if($TwoPeerNodeDirect){
  if($NodeDirect -or $PrivateDesktopCommand -or $ExpectHostIdentityRejection -or $ObjectRightsOnly -or $RuntimeOnly -or $KnownDllsGate -or $KnownDllsIsolation -or $KnownDllsCommand -or $PrivateRoot -or $OwnedPrivateRoot -or $DiagnosticRoot -or $DebuggerRoot -or
     $OfficialNodePath.Replace('\','/') -cnotmatch '^E:/task22-native-noderuntime-[a-f0-9]+/node-v24\.13\.1-win-x64/node\.exe$' -or (Test-Path -LiteralPath $OutputPath)){throw 'TWO_PEER_COMPOSITION'}
  if((Hash $OfficialNodePath) -cne 'e3be0545990c90995d7bf3a7af5d64af1f2e0fc1bbd9b79c27f7abc1e9676e50' -or (Hash $KnownDllsAdmissionPath) -cne [NativeKnownDlls]::AdmissionSha256){throw 'TWO_PEER_PROVENANCE'}
  $receipt=[ordered]@{schema='task22-native-two-peer-control.v1';passed=$false;peerRuntimeIsolationProven=$false;failure='';serviceRegistrations=0;peers=@();access=@();cleanup=@();source=@{};gate='offline-prerequisites';errors=@()}
  function SavePeerReceipt {
    $receipt.at=[DateTime]::UtcNow.ToString('o')
    [IO.File]::WriteAllText($OutputPath,(ConvertTo-Json -InputObject $receipt -Depth 40),[Text.UTF8Encoding]::new($false))
  }
  function PeerError($ErrorRecord) {
    $chain=@();$exception=$ErrorRecord.Exception
    while($exception){$native=$null;if($exception.PSObject.Properties['NativeErrorCode']){$native=$exception.NativeErrorCode};$chain+=@{type=$exception.GetType().FullName;message=$exception.Message;HResult=$exception.HResult;NativeErrorCode=$native;stack=$exception.ToString()};$exception=$exception.InnerException}
    return @{record=($ErrorRecord|Format-List * -Force|Out-String -Width 4096);scriptStack=$ErrorRecord.ScriptStackTrace;exceptions=$chain}
  }
  SavePeerReceipt
  $peers=[Collections.Generic.List[object]]::new()
  $probeSource=@'
#include <windows.h>
#include <sddl.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>
static void text(const wchar_t *s){int n=WideCharToMultiByte(CP_UTF8,0,s,-1,NULL,0,NULL,NULL);char *b=malloc(n);WideCharToMultiByte(CP_UTF8,0,s,-1,b,n,NULL,NULL);putchar('"');for(char *p=b;*p;p++){unsigned char c=*p;if(c=='"'||c=='\\'){putchar('\\');putchar(c);}else if(c<32)printf("\\u%04x",c);else putchar(c);}putchar('"');free(b);}
static void sid(PSID s){LPWSTR v=NULL;if(!ConvertSidToStringSidW(s,&v))exit(2);text(v);LocalFree(v);}
static void *info(HANDLE t,TOKEN_INFORMATION_CLASS kind){DWORD n=0;GetTokenInformation(t,kind,NULL,0,&n);void *p=malloc(n);if(!GetTokenInformation(t,kind,p,n,&n))exit(3);return p;}
static void snapshot(HANDLE t){
 TOKEN_USER *u=info(t,TokenUser);TOKEN_OWNER *o=info(t,TokenOwner);TOKEN_DEFAULT_DACL *d=info(t,TokenDefaultDacl);TOKEN_TYPE *ty=info(t,TokenType);SECURITY_DESCRIPTOR sd;LPWSTR acl=NULL;
 InitializeSecurityDescriptor(&sd,SECURITY_DESCRIPTOR_REVISION);SetSecurityDescriptorDacl(&sd,TRUE,d->DefaultDacl,FALSE);if(!ConvertSecurityDescriptorToStringSecurityDescriptorW(&sd,SDDL_REVISION_1,DACL_SECURITY_INFORMATION,&acl,NULL))exit(4);
 printf("{\"user\":");sid(u->User.Sid);printf(",\"owner\":");sid(o->Owner);printf(",\"defaultDacl\":");text(acl);printf(",\"type\":%d",*ty);LocalFree(acl);free(u);free(o);free(d);free(ty);
 for(int k=0;k<2;k++){TOKEN_GROUPS *g=info(t,k?TokenRestrictedSids:TokenGroups);printf(",\"%s\":[",k?"restrictedSids":"groups");for(DWORD i=0;i<g->GroupCount;i++){if(i)putchar(',');printf("{\"sid\":");sid(g->Groups[i].Sid);printf(",\"attributes\":%lu}",g->Groups[i].Attributes);}putchar(']');free(g);}
 TOKEN_PRIVILEGES *p=info(t,TokenPrivileges);printf(",\"privileges\":[");for(DWORD i=0;i<p->PrivilegeCount;i++){WCHAR name[256];if(p->Privileges[i].Luid.HighPart!=0||p->Privileges[i].Luid.LowPart!=23){fprintf(stderr,"TOKEN_UNEXPECTED_PRIVILEGE %ld:%lu\n",p->Privileges[i].Luid.HighPart,p->Privileges[i].Luid.LowPart);exit(5);}wcscpy(name,L"SeChangeNotifyPrivilege");if(i)putchar(',');printf("{\"name\":");text(name);printf(",\"luid\":\"%ld:%lu\",\"attributes\":%lu}",p->Privileges[i].Luid.HighPart,p->Privileges[i].Luid.LowPart,p->Privileges[i].Attributes);}printf("]}");free(p);
}
typedef struct {WCHAR path[1024];DWORD mask,result;int directory,rename;} ROW;
int wmain(int argc,wchar_t **argv){
 HANDLE token;if(argc!=3||!OpenProcessToken(GetCurrentProcess(),TOKEN_QUERY,&token))return 6;ROW rows[92];int count=0,failed=0;
 const WCHAR *files[]={L"code/launch.json",L"action/permit.json",L"data/originals.sqlite",L"data/object-right-created",L"data/storage/node-created",L"data/portal-writer.lock"};
 const WCHAR *dirs[]={L"",L"code",L"action",L"data",L"data/storage",L"temp",L"status"};DWORD masks[]={0x80000000,0x40000000,0x10000,0x40000,0x80000,0xc00d0000},dm[]={0x80000000,0x40000000,0x40,0x10000,0x40000,0x80000,0xc00d0040};
 for(int kind=0;kind<2&&!failed;kind++)for(int i=0;i<(kind?7:6)&&!failed;i++){
  for(int m=0;m<(kind?7:6)&&!failed;m++){ROW *r=&rows[count++];const WCHAR *relative=kind?dirs[i]:files[i];swprintf(r->path,1024,*relative?L"%ls/%ls":L"%ls",argv[1],relative);r->mask=kind?dm[m]:masks[m];r->directory=kind;r->rename=0;HANDLE h=CreateFileW(r->path,r->mask,7,NULL,OPEN_EXISTING,kind?0x02200000:0x00200000,NULL);r->result=h==INVALID_HANDLE_VALUE?GetLastError():0;if(h!=INVALID_HANDLE_VALUE)CloseHandle(h);if(r->result!=ERROR_ACCESS_DENIED)failed=1;}
  if(kind&&!failed){ROW *r=&rows[count++];swprintf(r->path,1024,*dirs[i]?L"%ls/%ls":L"%ls",argv[1],dirs[i]);WCHAR to[1100];swprintf(to,1100,L"%ls-replacement",r->path);r->mask=0;r->directory=1;r->rename=1;r->result=MoveFileW(r->path,to)?0:GetLastError();if(r->result!=ERROR_ACCESS_DENIED)failed=1;}
 }
 printf("{\"pid\":%lu,\"token\":",GetCurrentProcessId());snapshot(token);printf(",\"access\":[");for(int i=0;i<count;i++){ROW *r=&rows[i];if(i)putchar(',');printf("{\"path\":");text(r->path);if(r->rename)printf(",\"operation\":\"parent-replacement\"");else printf(",\"mask\":%lu,\"directory\":%s",r->mask,r->directory?"true":"false");printf(",\"api\":\"%s\",\"scope\":\"cross\",\"result\":%lu}",r->rename?"MoveFileW":"CreateFileW",r->result);}printf("],\"failed\":%s}\n",failed?"true":"false");CloseHandle(token);return failed?1:0;
}
'@
  $serverText=@'
import { openSync, closeSync, writeSync, readFileSync, unlinkSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { createServer } from 'node:net';
const root=__ROOT__, peer=__PEER__, pipe=__PIPE__, sid=__SID__, probeHash=__PROBE_HASH__;
const own={}, observations=[];
function errorRecord(error){return error==null?null:Object.fromEntries(Object.getOwnPropertyNames(error).map(key=>[key,error[key]]));}
function observe(record){
  observations.push(record);const json=JSON.stringify(record);
  for(let offset=0;offset<json.length;offset+=2000)console.error('PEER_PROBE_OBSERVATION_CHUNK '+JSON.stringify({index:observations.length-1,offset,total:json.length,text:json.slice(offset,offset+2000)}));
  return record;
}
function operation(scope,path,api,expected,call){
  let value,error=null;try{value=call();}catch(e){error=e;}
  observe({scope,path,api,expected,result:error?error.code:'ALLOWED',error:errorRecord(error)});
  if(expected==='DENIED'){if(!['EACCES','EPERM'].includes(error?.code))throw error??Error('EXPECTED_DENIAL '+path);return error.code;}
  if(error)throw error;return value;
}
for(const relative of ['code/launch.json','code/server.mjs','action/permit.json']){
  const path=join(root,relative);operation('own',path,'openSync(r)+closeSync','ALLOWED',()=>{const fd=openSync(path,'r');closeSync(fd);});own[relative]='READ';
  own[relative+'Write']=operation('own',path,'openSync(r+)+closeSync','DENIED',()=>{const fd=openSync(path,'r+');closeSync(fd);});
}
for(const name of ['originals.sqlite-wal','originals.sqlite-shm','originals.sqlite-journal','peer-marker']){
  const path=join(dirname(process.env.PORTAL_ORIGINALS_DB),name);let fd;
  operation('own',path,'openSync(wx)','ALLOWED',()=>{fd=openSync(path,'wx');});operation('own',path,'writeSync','ALLOWED',()=>writeSync(fd,'synthetic'));closeSync(fd);operation('own',path,'unlinkSync','ALLOWED',()=>unlinkSync(path));own[name]='CREATE_WRITE_DELETE';
}
const temp=join(root,'temp','node-created');let t;
operation('own',temp,'openSync(wx)','ALLOWED',()=>{t=openSync(temp,'wx');});operation('own',temp,'writeSync','ALLOWED',()=>writeSync(t,'synthetic'));closeSync(t);operation('own',temp,'unlinkSync','ALLOWED',()=>unlinkSync(temp));own.temp='CREATE_WRITE_DELETE';
const created=join(root,'data/storage/node-created');let c;operation('own',created,'openSync(wx)','ALLOWED',()=>{c=openSync(created,'wx');});operation('own',created,'writeSync','ALLOWED',()=>writeSync(c,'private'));closeSync(c);
const server=createServer(socket=>{let input='';socket.on('data',bytes=>{input+=bytes;if(!input.includes('\n'))return;
  try{
  if(input.trim()!=='probe')throw Error('UNEXPECTED_PEER_TRIGGER');const cross=[];
  for(const relative of ['code/launch.json','data/originals.sqlite','data/storage/node-created'])for(const operation of ['read','write','delete']){
    const path=join(peer,relative);let result='ALLOWED';try{if(operation==='delete')unlinkSync(path);else{const fd=openSync(path,operation==='read'?'r':'r+');closeSync(fd);}}catch(e){result=e.code;}
    observe({scope:'cross',path,api:operation==='delete'?'unlinkSync':operation==='read'?'openSync(r)+closeSync':'openSync(r+)+closeSync',expected:'DENIED',result});
    cross.push({relative,operation,result});if(!['EACCES','EPERM'].includes(result))throw Error('PEER_'+operation+'_'+result);
  }
  let replacement='ALLOWED';try{renameSync(join(peer,'data/storage'),join(peer,'data/storage-replacement'));}catch(e){replacement=e.code;}
  observe({scope:'cross',path:join(peer,'data/storage'),api:'renameSync',expected:'DENIED',result:replacement});
  if(!['EACCES','EPERM'].includes(replacement))throw Error('PEER_REPLACEMENT_'+replacement);
  const executable=join(root,'peer-probe.exe');
  const bytes=operation('own',executable,'readFileSync','ALLOWED',()=>readFileSync(executable));
  if(createHash('sha256').update(bytes).digest('hex')!==probeHash)throw Error('PEER_PROBE_HASH');
  const result=spawnSync(executable,[peer,sid],{encoding:'utf8',windowsHide:true,env:Object.fromEntries(Object.entries(process.env).filter(([k])=>['SYSTEMROOT','WINDIR'].includes(k.toUpperCase())))});
  const spawn=observe({scope:'own',path:executable,api:'spawnSync',arguments:[peer,sid],expected:'ALLOWED',error:errorRecord(result.error),status:result.status,signal:result.signal,pid:result.pid,stderr:result.stderr,stdout:result.stdout,stderrTail:result.stderr?.slice(-8192),stdoutTail:result.stdout?.slice(-8192)});
  if(result.error||result.status!==0)throw Error('PEER_NATIVE_PROBE '+result.stderr);
  const native=JSON.parse(result.stdout);
  socket.end(JSON.stringify({pid:process.pid,node:process.versions.node,own,cross,replacement,native,spawn,observations})+'\n');
  }catch(error){observe({scope:'gate',api:'application-probe',error:errorRecord(error)});socket.end(JSON.stringify({pid:process.pid,node:process.versions.node,own,observations,failure:errorRecord(error)})+'\n');}
});});
server.listen(pipe,()=>process.send({schema:'portal-native-ipc.v1',type:'ready'}));
process.on('message',m=>{if(m?.schema==='portal-native-ipc.v1'&&m.type==='stop')server.close(()=>process.send({schema:'portal-native-ipc.v1',type:'drained'},()=>process.exit(0)));});
'@
  try{
    foreach($label in @('A','B')){
      $id=[guid]::NewGuid().ToString('N').Substring(0,16);$name='PortalNativeTest_'+$id;$sid=[NativeInstallation]::ServiceSid($name);$root='E:/task22-native-service-'+$id
      $p=@{label=$label;root=$root;name=$name;sid=$sid;station=('Task22Private_'+[guid]::NewGuid().ToString('N'));pin=$null;service=$null;observation=$null;members=@();exits=@();proof=[NativeWorkloadToken]::ProofRoot($sid);proofOwned=$false;rootOwned=$false;log=(Join-Path $root 'status/host.log');record=@{label=$label;root=$root;name=$name;sid=$sid};pipe=('task22-peer-'+$id)};$peers.Add($p)
      [NativeInstallation]::CreateExclusive($root,('O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;'+$sid+')'));$p.rootOwned=$true;$p.pin=[NativeInstallation]::Pin($root,$true)
      & (Join-Path $SourcePath 'test/native-installation.ps1') -SourcePath $SourcePath -ScratchPath $root -PrivateDesktopPrerequisites -OwnedPrivateRoot $p.pin | Write-Host
      $p.record.prerequisites=[IO.File]::ReadAllText((Join-Path $root 'prerequisites.json'))|ConvertFrom-Json
      if(-not $p.record.prerequisites.passed){throw 'TWO_PEER_OFFLINE_GATE'}
    }
    if($peers[0].sid -ceq $peers[1].sid){throw 'TWO_PEER_DISTINCT_SID'}
    foreach($p in $peers){
      $other=if($p.label -eq 'A'){$peers[1]}else{$peers[0]}
      $probePath=Join-Path $p.root 'peer-probe.c';[IO.File]::WriteAllText($probePath,$probeSource)
      $nativeCompiler='C:/mingw64/bin/gcc.exe';$p.record.probeCompilerSha256=Hash $nativeCompiler
      $probeOutput=& $nativeCompiler -municode -static -O2 -Wall -Wextra -o (Join-Path $p.root 'peer-probe.exe') $probePath -ladvapi32 2>&1
      if($LASTEXITCODE -ne 0){throw ('TWO_PEER_PROBE_COMPILE '+($probeOutput -join "`n"))}
      $p.record.probeSha256=Hash (Join-Path $p.root 'peer-probe.exe')
      $fixture=$serverText.Replace('__ROOT__',($p.root|ConvertTo-Json -Compress)).Replace('__PEER__',($other.root|ConvertTo-Json -Compress)).Replace('__PIPE__',(('\\.\pipe\'+$p.pipe)|ConvertTo-Json -Compress)).Replace('__SID__',($p.sid|ConvertTo-Json -Compress)).Replace('__PROBE_HASH__',($p.record.probeSha256|ConvertTo-Json -Compress))
      $server=Join-Path $p.root 'synthetic-peer.mjs';$f=[IO.FileStream]::new($server,'CreateNew','Write','Read');try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes($fixture);$f.Write($bytes,0,$bytes.Length)}finally{$f.Dispose()}
      $common=@{SyntheticQualification=$true;FilteredWorkload=$true;KnownDllsCandidate=$true;KnownDllsAdmissionPath=$KnownDllsAdmissionPath;PrivateDesktopName=$p.station;RootPath=$p.root;ServiceName=$p.name;NodeSource=$OfficialNodePath;ServerSource=$server;ServerSha256=(Hash $server);CompilerSha256=(Hash $compiler);PowerShellSha256=(Hash $powershell);HostSourceSha256=(Hash $helper);NodeDirect=$true}
      & $installer @common -OwnedPrivateRoot $p.pin | Write-Host
      $observationName='Global\task22-native-observation-'+$p.name.Substring(17);$security=[Security.AccessControl.EventWaitHandleSecurity]::new()
      foreach($principal in @($p.sid,'S-1-5-32-544')){$security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new($principal),'FullControl','Allow'))}
      $created=$false;$p.observation=[Threading.EventWaitHandle]::new($false,'AutoReset',$observationName,[ref]$created,$security);if(-not $created){throw 'TWO_PEER_EVENT_COLLISION'}
      [NativeHarnessEvents]::Register($p.log,$p.observation)
      & $installer @common -Mode Permit -TestMode node-direct -ActionId ([guid]::NewGuid().ToString('N')) -ObservationEvent $observationName -StartupDeadlineMs 10000 | Write-Host
      foreach($relative in @('installation.json','action/permit.json','action/service-definition.json','code/launch.json')){$p.record[$relative]=[IO.File]::ReadAllText((Join-Path $p.root $relative));$p.record[$relative+'Sha256']=Hash (Join-Path $p.root $relative)}
      [NativeInstallation]::CreateExclusive($p.proof,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)');$p.proofOwned=$true
      foreach($entry in @(@('bu-read','0x1200a9'),@('bu-write','0x1301bf'))){$path=Join-Path $p.proof $entry[0];[IO.File]::WriteAllText($path,'synthetic');$acl=[Security.AccessControl.FileSecurity]::new();$acl.SetSecurityDescriptorSddlForm(('O:BAG:BAD:P(A;;FA;;;SY)(A;;FA;;;BA)(A;;'+$entry[1]+';;;BU)'));Set-Acl -LiteralPath $path -AclObject $acl}
      $definition=$p.record['action/service-definition.json']|ConvertFrom-Json;$p.service=[OwnedScmService]::new($p.name,$definition.binaryPath,1);$receipt.serviceRegistrations++;$p.record.configuration=$p.service.Configuration
      $p.ready=[NativeHarnessEvents]::Line($p.log,'ACTUAL_READY')
    }
    foreach($relative in @('install/native-service-host.cs','install/install-personal-native.ps1','test/native-service-host.ps1','test/native-installation.ps1','install/start-personal-native.ps1','install/start-personal-native.mjs','install/supervise-personal-native.mjs')){$receipt.source[$relative]=Hash (Join-Path $SourcePath $relative)}
    $receipt.runtime=@{path=$OfficialNodePath;sha256=(Hash $OfficialNodePath);signature=(Get-AuthenticodeSignature -LiteralPath $OfficialNodePath).Status.ToString()}
    $receipt.pretrigger=@{sourceAndRuntimeHashesRecorded=$true;bothReadySubscriptionsArmed=$true;exitAndOutputDrainOwner='NativeOuterChild.Start before ResumeThread for each peer';runtimeLaunchCap=2;runtimeRetries=0}
    $receipt.gate='A-ready';$peers[0].service.Start();if(-not $peers[0].ready.Wait(15000)){throw 'TWO_PEER_A_READY'}
    $receipt.gate='B-ready';$peers[1].service.Start();if(-not $peers[1].ready.Wait(15000)){throw 'TWO_PEER_B_READY'}
    Write-Host 'TWO_PEER_CHECKPOINT both-ready'
    foreach($p in $peers){
      Write-Host ('TWO_PEER_CHECKPOINT capture-begin peer='+$p.label)
      $armedLog=[NativeHarnessEvents]::Read($p.log)
      foreach($needle in @('EXIT_SUBSCRIBED_BEFORE_RESUME=True','PRIVATE_OUTPUT_DRAINS_SUBSCRIBED_BEFORE_RESUME=True')){if(-not $armedLog.Contains($needle)){throw 'TWO_PEER_PRE_RESUME_SUBSCRIPTIONS'}}
      $p.service.CaptureHost();$p.hostExit=[NativeHarnessEvents]::Exit($p.service.OriginalHost)
      $sup=[NativeHarnessEvents]::Member($p.log,'NODE_SUPERVISOR_CREATED=');$app=[NativeHarnessEvents]::Member($p.log,'NATIVE_RUNTIME_PID=');$p.members=@($sup,$app)
      $p.exits=@($p.members|ForEach-Object{[NativeHarnessEvents]::Exit($_)})
      $suspended=[regex]::Match($armedLog,'TOKEN_SUSPENDED_NODE_SUPERVISOR=(\{[^\r\n]+\})');$application=[regex]::Match($armedLog,'TOKEN_APPLICATION=(\{[^\r\n]+\})')
      if(-not $suspended.Success -or -not $application.Success -or $suspended.Index -gt $armedLog.IndexOf('NODE_SUPERVISOR_RESUMED=')){throw 'TWO_PEER_CREATION_IDENTITIES_MISSING'}
      $p.record.suspendedSupervisorToken=$suspended.Groups[1].Value|ConvertFrom-Json;$p.record.applicationToken=$application.Groups[1].Value|ConvertFrom-Json
      foreach($token in @($p.record.suspendedSupervisorToken,$p.record.applicationToken)){
        if($token.user -cne 'S-1-5-19' -or $token.owner -cne $p.sid -or $token.type -ne 1 -or @($token.groups|Where-Object{$_.sid -like 'S-1-16-*'}).Count -ne 1 -or @($token.groups|Where-Object{$_.sid -eq 'S-1-5-32-544' -and $_.attributes -eq 16}).Count -ne 1 -or @($token.privileges|Where-Object{$_.name -cne 'SeChangeNotifyPrivilege'}).Count){throw 'TWO_PEER_CREATION_IDENTITY_CONTRACT'}
      }
      $p.record.identities=@($p.members|ForEach-Object{@{pid=$_.Id;handle=$_.Handle.ToInt64();startUtc=$_.StartTime.ToUniversalTime().ToString('o')}})
      foreach($member in $p.members){if($member.HasExited){throw 'TWO_PEER_NOT_SIMULTANEOUSLY_ALIVE'}}
      $p.record.observation=@{supervisorIdentityBeforeResume=$true;applicationIdentityBeforeReady=$true;integritySid=@($p.record.applicationToken.groups|Where-Object{$_.sid -like 'S-1-16-*'})[0].sid}
      $receipt.peers=@($peers|ForEach-Object{$_.record});SavePeerReceipt
      Write-Host ('TWO_PEER_CHECKPOINT capture-complete peer='+$p.label)
    }
    $receipt.bothReadyWithOriginalHandles=$true;$receipt.gate='actual-Node-own-and-cross-operations'
    foreach($p in $peers){
      Write-Host ('TWO_PEER_CHECKPOINT exchange-begin peer='+$p.label)
      $reply=[NativeHarnessEvents]::Exchange($p.pipe);if(-not $reply.Wait(15000)){throw 'TWO_PEER_REPLY'};$p.record.applicationReplyRaw=$reply.Result;SavePeerReceipt;$answer=$reply.Result|ConvertFrom-Json
      $p.record.applicationObservations=$answer.observations;SavePeerReceipt
      if($answer.failure){throw ('TWO_PEER_APPLICATION_PROBE '+($answer.failure|ConvertTo-Json -Compress))}
      if($answer.pid -ne $p.members[1].Id -or $answer.node -cne '24.13.1' -or @($answer.cross).Count -ne 9 -or @($answer.cross|Where-Object{$_.result -notin @('EACCES','EPERM')}).Count -or $answer.replacement -notin @('EACCES','EPERM')){throw 'TWO_PEER_APPLICATION_IDENTITY'}
      if(@($answer.native.access).Count -ne 92 -or @($answer.native.access|Where-Object{$_.result -ne 5}).Count -or ($answer.native.token|ConvertTo-Json -Depth 20 -Compress) -cne ($p.record.applicationToken|ConvertTo-Json -Depth 20 -Compress)){throw 'TWO_PEER_NATIVE_DENIAL_CONTRACT'}
      $receipt.access+=@{from=$p.label;applicationPid=$answer.pid;inheritedProbePid=$answer.native.pid;actualPeerToken=$answer.native.token;checks=$answer.native.access}
      $other=if($p.label -eq 'A'){$peers[1]}else{$peers[0]};$positive=[IO.File]::OpenRead((Join-Path $other.root 'code/launch.json'));$positive.Dispose();$p.record.administratorExcludedPositiveControl=@{controllerReadAllowed=$true}
      Write-Host ('TWO_PEER_CHECKPOINT exchange-complete peer='+$p.label)
    }
    $receipt.gate='lifecycle-stop-once'
    foreach($p in $peers){$p.clean=[NativeHarnessEvents]::Line($p.log,'CLEAN_STOP')}
    foreach($p in $peers){$p.service.Stop();$p.record.stopCalls=1}
    foreach($p in $peers){
      if(-not $p.clean.Wait(15000)){throw 'TWO_PEER_CLEAN_STOP_DEADLINE'}
      foreach($exit in $p.exits){if(-not $exit.Wait(10000) -or $exit.Result -ne 0){throw 'TWO_PEER_ORIGINAL_MEMBER_EXIT'}}
      $p.service.WaitState(1,10000);if(-not $p.hostExit.Wait(10000)){throw 'TWO_PEER_ORIGINAL_HOST_EXIT'}
      $log=[NativeHarnessEvents]::Read($p.log);$p.record.log=$log;$previous=-1
      foreach($needle in @('ACTUAL_READY','STOP_SENT','STATE=drained','CHILD_EXIT code=0 signal=null','STATE=stopped','NODE_RAW_OUTPUT stream=stdout','CLEAN_STOP originalHandles=2','PRIVATE_CLEANUP_EXACT')){$at=$log.IndexOf($needle,$previous+1,[StringComparison]::Ordinal);if($at -lt 0){throw ('TWO_PEER_ORDER_'+$needle)};$previous=$at}
      if($log.Contains('SERVICE_FAILURE=') -or ([regex]::Matches($log,'STOP_SENT')).Count -ne 1 -or (Test-Path (Join-Path $p.root 'data/portal-writer.lock'))){throw 'TWO_PEER_LIFECYCLE_FAILED'}
      $p.record.originalHandleExitCodes=@($p.exits|ForEach-Object{$_.Result})
    }
    $receipt.passed=$true;$receipt.peerRuntimeIsolationProven=$true;$receipt.gate='complete'
  }catch{$receipt.failure=$_.Exception.ToString();$receipt.errors+=@(PeerError $_);$receipt.passed=$false;$receipt.peerRuntimeIsolationProven=$false;SavePeerReceipt;Write-Host ('TWO_PEER_CAUGHT gate='+$receipt.gate+' error='+$receipt.failure)}
  finally{
    try{
      foreach($p in $peers){
        $cleanup=@{name=$p.name;root=$p.root;complete=$false}
        $receipt.cleanup+=@($cleanup);$receipt.peers=@($peers|ForEach-Object{$_.record});SavePeerReceipt
        try{
          Write-Host ('TWO_PEER_CHECKPOINT cleanup-begin peer='+$p.label)
          if($p.service){
            if($p.service.Query().State -ne 1){
              $p.service.CaptureHost();$cleanupHostExit=[NativeHarnessEvents]::Exit($p.service.OriginalHost)
              if(-not $p.record.stopCalls){$p.service.Stop();$p.record.stopCalls=1}
              $p.service.WaitState(1,15000);if(-not $cleanupHostExit.Wait(10000)){throw 'TWO_PEER_FAILURE_STOP_HOST_EXIT'}
            }
            $p.service.Dispose();$cleanup.serviceDeletedViaOriginalHandle=$true
          }
        foreach($member in $p.members){if(-not $member.WaitForExit(10000)){throw 'TWO_PEER_CLEANUP_LIVE'};$member.Dispose()};$cleanup.originalMemberExitsConfirmed=$true
        if(Test-Path -LiteralPath $p.log){$p.record.log=[NativeHarnessEvents]::Read($p.log)}
        $failurePath=Join-Path $p.root 'status/startup-failure.log';if(Test-Path -LiteralPath $failurePath){$p.record.startupFailure=[IO.File]::ReadAllText($failurePath)}
        $p.record.files=@(Get-ChildItem -LiteralPath $p.root -File -Recurse|ForEach-Object{@{path=$_.FullName;sha256=(Hash $_.FullName)}})
        if($p.observation){$p.observation.Dispose();$cleanup.observationOriginalHandleClosed=$true}
        if($p.proofOwned){Remove-Item -LiteralPath $p.proof -Recurse -Force};$cleanup.proofAbsent=(-not (Test-Path -LiteralPath $p.proof))
        if($p.rootOwned){[NativeInstallation]::VerifyOriginalDirectory($p.pin,$p.root);$cleanup.rootOriginalIdentityVerified=$true;$p.pin.Dispose();Remove-Item -LiteralPath $p.root -Recurse -Force}
        $cleanup.rootAbsent=(-not (Test-Path -LiteralPath $p.root));$cleanup.registrationAbsent=(-not (Get-Service -Name $p.name -ErrorAction SilentlyContinue))
        if(-not $cleanup.rootAbsent -or -not $cleanup.registrationAbsent -or -not $cleanup.proofAbsent){throw 'TWO_PEER_CLEANUP_ABSENCE'}
          $cleanup.complete=$true
        }catch{$cleanup.failure=$_.Exception.ToString();$cleanup.errorRecord=PeerError $_;$receipt.passed=$false;$receipt.peerRuntimeIsolationProven=$false;if(-not $receipt.failure){$receipt.failure=$cleanup.failure};Write-Host ('TWO_PEER_CLEANUP_CAUGHT peer='+$p.label+' error='+$cleanup.failure)}
        finally{SavePeerReceipt}
        Write-Host ('TWO_PEER_CHECKPOINT cleanup-complete peer='+$p.label)
      }
      foreach($relative in @('install/native-service-host.cs','install/install-personal-native.ps1','test/native-service-host.ps1','test/native-installation.ps1')){$receipt.source[$relative]=Hash (Join-Path $SourcePath $relative)}
      $receipt.registrationInventory=@(Get-Service -Name 'PortalNativeTest_*' -ErrorAction SilentlyContinue|ForEach-Object{$_.Name})
    }catch{$receipt.passed=$false;$receipt.peerRuntimeIsolationProven=$false;$receipt.errors+=@(PeerError $_);if(-not $receipt.failure){$receipt.failure=$_.Exception.ToString()}}
    finally{Write-Host 'TWO_PEER_CHECKPOINT receipt-write-begin';SavePeerReceipt;Write-Host 'TWO_PEER_CHECKPOINT receipt-write-complete'}
  }
  if(-not $receipt.passed){throw ('TWO_PEER_FIRST_FAILED_GATE '+$receipt.gate+' '+$receipt.failure)}
  Write-Output 'TWO_PEER_NODE_DIRECT_PASS';return
}
if($PrivateDesktopCommand -or $NodeDirect){
  if(-not $RegisterOwnedSyntheticServices -or $ExpectHostIdentityRejection -or $ObjectRightsOnly -or $RuntimeOnly -or $KnownDllsGate -or $KnownDllsIsolation -or $KnownDllsCommand -or $DiagnosticRoot -or $DebuggerRoot -or
     $PrivateRoot.Replace('\','/') -cnotmatch '^E:/task22-native-service-[a-f0-9]{16}$' -or -not $OwnedPrivateRoot){throw 'PRIVATE_CONTROLLER_COMPOSITION'}
  [NativeInstallation]::VerifyOriginalDirectory($OwnedPrivateRoot,$PrivateRoot)
  $privateId=$PrivateRoot.Substring($PrivateRoot.Length-16);$privateServiceName='PortalNativeTest_'+$privateId
  $privateSid=[NativeInstallation]::ServiceSid($privateServiceName)
  [NativeInstallation]::AdmitAcl($PrivateRoot,$privateSid,$false,$true)
  if((Hash $KnownDllsAdmissionPath) -cne [NativeKnownDlls]::AdmissionSha256){throw 'PRIVATE_ADMISSION_HASH'}
  $prerequisitePath=Join-Path $PrivateRoot 'prerequisites.json'
  $prerequisites=[IO.File]::ReadAllText($prerequisitePath)|ConvertFrom-Json
  if($prerequisites.passed -ne $true -or $prerequisites.sourceSha256 -cne (Hash $helper) -or $prerequisites.controllerSha256 -cne (Hash $PSCommandPath) -or
     $prerequisites.installerSha256 -cne (Hash $installer) -or $prerequisites.testSha256 -cne (Hash (Join-Path $SourcePath 'test/native-installation.ps1'))){throw 'PRIVATE_PREREQUISITES_REQUIRED'}
  $privateReceipt=[ordered]@{schema='task22-private-desktop-control.v1';service=$privateServiceName;root=$PrivateRoot;station=('Task22Private_'+[guid]::NewGuid().ToString('N'));launches=0;serviceRegistrations=0;failure='';cleanup=@{}}
  $privateService=$null;$privateProof=[NativeWorkloadToken]::ProofRoot($privateSid);$privateProofOwned=$false;$privateObservation=$null
  $minimalServer=Join-Path $PrivateRoot 'synthetic-unused.mjs'
  $once=[IO.FileStream]::new((Join-Path $PrivateRoot 'one-run.lock'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{$bytes=[Text.Encoding]::UTF8.GetBytes($privateServiceName+"`n"+$privateReceipt.station+"`n"+(Hash $helper));$once.Write($bytes,0,$bytes.Length);$once.Flush($true)}finally{$once.Dispose()}
  try{
    $unused=[IO.FileStream]::new($minimalServer,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
    try{$fixture=if($NodeDirect){'process.on("message", m => { if (m?.schema === "portal-native-ipc.v1" && m.type === "stop") process.send({schema:"portal-native-ipc.v1",type:"drained"}, () => process.exit(0)); }); process.send({schema:"portal-native-ipc.v1",type:"ready"});'}else{'throw new Error("NOT_ADMITTED_IN_PRIVATE_DESKTOP_CONTROL");'};$bytes=[Text.Encoding]::UTF8.GetBytes($fixture);$unused.Write($bytes,0,$bytes.Length)}finally{$unused.Dispose()}
    if($NodeDirect -and ($OfficialNodePath.Replace('\','/') -cnotmatch '^E:/task22-native-noderuntime-[a-f0-9]+/node-v24\.13\.1-win-x64/node\.exe$' -or $PrivateDesktopCommand)){throw 'NODE_DIRECT_OFFICIAL_RUNTIME_BINDING'}
    $privateCommon=@{SyntheticQualification=$true;FilteredWorkload=$true;KnownDllsCandidate=$true;KnownDllsAdmissionPath=$KnownDllsAdmissionPath;PrivateDesktopName=$privateReceipt.station;RootPath=$PrivateRoot;ServiceName=$privateServiceName;NodeSource=$(if($NodeDirect){$OfficialNodePath}else{'C:/Users/oliver/AppData/Local/nvm/v24.13.1/node.exe'});ServerSource=$minimalServer;ServerSha256=(Hash $minimalServer);CompilerSha256=(Hash $compiler);PowerShellSha256=(Hash $powershell);HostSourceSha256=(Hash $helper);NodeDirect=[bool]$NodeDirect}
    & $installer @privateCommon -OwnedPrivateRoot $OwnedPrivateRoot | Write-Host
    $privateObservationName=''
    if($NodeDirect){
      $privateObservationName='Global\task22-native-observation-'+$privateId
      $security=[Security.AccessControl.EventWaitHandleSecurity]::new()
      foreach($principal in @($privateSid,'S-1-5-32-544')){$security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new($principal),'FullControl','Allow'))}
      $created=$false;$privateObservation=[Threading.EventWaitHandle]::new($false,'AutoReset',$privateObservationName,[ref]$created,$security)
      if(-not $created){throw 'NODE_DIRECT_OBSERVATION_COLLISION'}
      [NativeHarnessEvents]::Register((Join-Path $PrivateRoot 'status/host.log'),$privateObservation)
      $privateReceipt.observation=@{mechanism='existing-host-record-event';name=$privateObservationName;exclusive=$true;registeredBeforeStart=$true}
    }
    & $installer @privateCommon -Mode Permit -TestMode $(if($NodeDirect){'node-direct'}else{'private-desktop-command'}) -ActionId ([guid]::NewGuid().ToString('N')) -StartupDeadlineMs 10000 -ObservationEvent $privateObservationName | Write-Host
    foreach($relative in @('installation.json','action/permit.json','action/service-definition.json')){$privateReceipt[$relative]=[IO.File]::ReadAllText((Join-Path $PrivateRoot $relative));$privateReceipt[$relative+'Sha256']=Hash (Join-Path $PrivateRoot $relative)}
    [NativeInstallation]::CreateExclusive($privateProof,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)');$privateProofOwned=$true
    foreach($entry in @(@('bu-read','0x1200a9'),@('bu-write','0x1301bf'))){
      $path=Join-Path $privateProof $entry[0];$f=[IO.FileStream]::new($path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read);try{$f.WriteByte(42)}finally{$f.Dispose()}
      $acl=[Security.AccessControl.FileSecurity]::new();$acl.SetSecurityDescriptorSddlForm(('O:BAG:BAD:P(A;;FA;;;SY)(A;;FA;;;BA)(A;;'+$entry[1]+';;;BU)'));Set-Acl -LiteralPath $path -AclObject $acl
    }
    $definition=$privateReceipt['action/service-definition.json']|ConvertFrom-Json
    $privateService=[OwnedScmService]::new($privateServiceName,$definition.binaryPath,1);$privateReceipt.serviceRegistrations=1;$privateReceipt.configuration=$privateService.Configuration
    if($NodeDirect){
      $ready=[NativeHarnessEvents]::Line((Join-Path $PrivateRoot 'status/host.log'),'ACTUAL_READY')
      $privateService.Start()
      if(-not $ready.Wait(15000)){throw 'NODE_DIRECT_READY_GATE_FAILED'}
      $privateReceipt.observation.readyLine=$ready.Result;$privateReceipt.observation.taskStatus=$ready.Status.ToString()
      $privateService.CaptureHost();$privateService.Stop();$privateService.WaitState(1,15000)
    }else{$privateService.Start();$privateService.WaitState(1,20000)}
    $privateReceipt.terminalStatus=$privateService.Query()
    $privateReceipt.log=[NativeHarnessEvents]::Read((Join-Path $PrivateRoot 'status/host.log'))
    $privateReceipt.launches=([regex]::Matches($privateReceipt.log,$(if($NodeDirect){'NODE_SUPERVISOR_CREATED='}else{'POWERSHELL_CREATED='}))).Count
    if($privateReceipt.launches -gt 1){throw 'PRIVATE_LAUNCH_BUDGET'}
    if($privateReceipt.log.Contains('SERVICE_FAILURE=')){throw 'PRIVATE_FIRST_ADMISSION_OR_RUNTIME_GATE_FAILED'}
    if(-not $privateReceipt.log.Contains('PRIVATE_CLEANUP_EXACT ')){throw 'PRIVATE_USER_CLEANUP_UNPROVEN'}
    if(-not $privateReceipt.log.Contains($(if($NodeDirect){'CLEAN_STOP originalHandles=2'}else{'PRIVATE_DESKTOP_NATURAL_EXIT_ZERO'}))){
      if($privateReceipt.log.Contains('PRIVATE_DESKTOP_ADMISSION_INSUFFICIENT')){throw 'PRIVATE_DESKTOP_ADMISSION_INSUFFICIENT'}
      throw 'PRIVATE_TERMINAL_OUTCOME_MISSING'
    }
  }catch{$privateReceipt.failure=$_.Exception.ToString()}
  finally{
    if($privateService){
      try{$privateService.Dispose();$privateReceipt.cleanup.serviceDeletedViaOriginalHandle=$true;$privateReceipt.cleanup.originalHostExited=$true}catch{$privateReceipt.cleanup.error=$_.Exception.ToString()}
    }
    if($privateObservation){$privateObservation.Dispose();$privateReceipt.cleanup.originalObservationHandleClosed=$true}
    $privateReceipt.cleanup.registrationAbsent=(-not (Get-Service -Name $privateServiceName -ErrorAction SilentlyContinue))
    $logPath=Join-Path $PrivateRoot 'status/host.log';if(Test-Path -LiteralPath $logPath){$privateReceipt.log=[NativeHarnessEvents]::Read($logPath);$privateReceipt.launches=([regex]::Matches($privateReceipt.log,$(if($NodeDirect){'NODE_SUPERVISOR_CREATED='}else{'POWERSHELL_CREATED='}))).Count}
    $failPath=Join-Path $PrivateRoot 'status/startup-failure.log';if(Test-Path -LiteralPath $failPath){$privateReceipt.startupFailure=[IO.File]::ReadAllText($failPath)}
    $privateReceipt.binaryHashes=@(Get-ChildItem -LiteralPath (Join-Path $PrivateRoot 'code') -File -ErrorAction SilentlyContinue|ForEach-Object{@{path=$_.Name;sha256=(Hash $_.FullName)}})
    if($privateProofOwned){Remove-Item -LiteralPath $privateProof -Recurse -Force};$privateReceipt.cleanup.tokenProofAbsent=(-not (Test-Path -LiteralPath $privateProof))
    $privateReceipt.at=[DateTime]::UtcNow.ToString('o')
    $out=[IO.FileStream]::new($OutputPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
    try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes((ConvertTo-Json -InputObject $privateReceipt -Depth 30));$out.Write($bytes,0,$bytes.Length);$out.Flush($true)}finally{$out.Dispose()}
  }
  Write-Output ('PRIVATE_CONTROL_TERMINAL '+$privateReceipt.failure)
  return
}
$results=[Collections.Generic.List[object]]::new()
$roots=[Collections.Generic.List[string]]::new()
$services=[Collections.Generic.List[OwnedScmService]]::new()
$owned=[Collections.Generic.List[Diagnostics.Process]]::new()
$events=[Collections.Generic.List[IDisposable]]::new()
$objectRoots=[Collections.Generic.List[string]]::new()
$configurations=[Collections.Generic.List[string]]::new()
$harnessId=[guid]::NewGuid().ToString('N').Substring(0,16)
$fixtureRoot='E:/task22-native-service-fixture-'+$harnessId
# Fixtures are protected from their first instant too, and are never executable
# authority after staging. No existing scratch is adopted.
[NativeInstallation]::CreateExclusive($fixtureRoot,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)')
$server=Join-Path $fixtureRoot 'server.mjs'
$serverText=@'
import { openSync, closeSync, writeSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { watch, existsSync } from 'node:fs';
import { createServer } from 'node:net';
const scenario = '__SCENARIO__';
const evidence = join(process.env.PORTAL_STORAGE_PATH, 'token.json');
const checks = {};
const siblingTarget = '__SIBLING_TARGET__';
if (scenario === 'sibling') {
  checks.siblingTarget=siblingTarget;
  for (const [name, path, access] of [['siblingRead', siblingTarget+'/code/launch.json', 'r'], ['siblingWrite', siblingTarget+'/data/originals.sqlite', 'r+']]) {
    try { const fd=openSync(path,access);closeSync(fd);checks[name]='ALLOWED'; } catch(error) { checks[name]=error.code; }
  }
}
for (const [key, path] of Object.entries({config: new URL('./launch.json', import.meta.url), permit: new URL('../action/permit.json', import.meta.url), code: new URL('./server.mjs', import.meta.url)})) {
  const readable = openSync(path, 'r');closeSync(readable);checks[key+'Read']='ALLOWED';
  try { const fd = openSync(path, 'r+'); closeSync(fd); checks[key] = 'WRITABLE'; } catch (error) { checks[key] = error.code; }
}
for (const name of ['originals.sqlite-wal', 'originals.sqlite-shm', 'originals.sqlite-journal', 'temp.bin']) {
  const path = join(dirname(process.env.PORTAL_STORAGE_PATH), name); const fd = openSync(path, 'wx'); writeSync(fd, 'synthetic'); closeSync(fd); unlinkSync(path); checks[name] = 'CREATE_WRITE_DELETE';
}
const pipePath = '\\\\.\\pipe\\task22-native-runtime-'+process.pid;
const server = createServer(socket => socket.end('OWN_RUNTIME_PIPE'));
server.listen(pipePath, () => {
  const output = openSync(evidence, 'wx'); writeSync(output, JSON.stringify({checks,env:process.env,cwd:process.cwd(),node:process.versions.node,pid:process.pid,pipePath,ipcConnected:process.connected,report:process.report.getReport().libuv})); closeSync(output);
  process.send({schema:'portal-native-ipc.v1', type:'ready'});
});
process.on('message', message => {
  if (message?.schema !== 'portal-native-ipc.v1' || message.type !== 'stop') return;
  const finish = () => server.close(() => process.send({schema:'portal-native-ipc.v1', type:'drained'}, () => process.exit(0)));
  if (scenario === 'slow' || scenario === 'failed') {
    const release = join(process.env.PORTAL_STORAGE_PATH, 'release');
    const held = openSync(join(process.env.PORTAL_STORAGE_PATH, 'stop-requested'), 'wx'); writeSync(held, 'STOP_REQUESTED\n'); closeSync(held);
    console.log('FIXTURE_STOP_HELD');
    if (scenario === 'failed') process.send({schema:'portal-native-ipc.v1', type:'drain-failed'});
    const watcher = watch(process.env.PORTAL_STORAGE_PATH, () => { if (existsSync(release)) { watcher.close(); finish(); } });
    if (existsSync(release)) { watcher.close(); finish(); }
  } else finish();
});
'@
[IO.File]::WriteAllText($server,$serverText,[Text.UTF8Encoding]::new($false))
$common=@{SyntheticQualification=$true;FilteredWorkload=(!$ExpectHostIdentityRejection);NodeSource='C:/Users/oliver/AppData/Local/nvm/v24.13.1/node.exe';ServerSource=$server;ServerSha256=(Hash $server);CompilerSha256=(Hash $compiler);PowerShellSha256=(Hash $powershell);HostSourceSha256=(Hash $helper)}
if($KnownDllsGate -or $KnownDllsIsolation -or $KnownDllsCommand){$common.KnownDllsCandidate=$true}
if($KnownDllsCommand){$common.KnownDllsAdmissionPath=$KnownDllsAdmissionPath}
$knownPeer=''
function Stage([string]$Suffix,[string]$TestMode='normal',[string]$TestEvent='',[int]$StopDeadline=10000,[string]$TokenFault='') {
  $id=[guid]::NewGuid().ToString('N').Substring(0,16)
  $root='E:/task22-native-service-'+$id;$name='PortalNativeTest_'+$id
  $roots.Add($root)
  $observationName='Global\task22-native-observation-'+$id
  $observationAcl=[Security.AccessControl.EventWaitHandleSecurity]::new()
  $observationAcl.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new([NativeInstallation]::ServiceSid($name)),'FullControl','Allow'))
  $observationAcl.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'),'FullControl','Allow'))
  $created=$false;$observation=[Threading.EventWaitHandle]::new($false,'AutoReset',$observationName,[ref]$created,$observationAcl);$events.Add($observation)
  [NativeHarnessEvents]::Register((Join-Path $root 'status/host.log'),$observation)
  $siblingTarget=if($normal){$normal.root.Replace('\','/')}else{''}
  [IO.File]::WriteAllText($server,$serverText.Replace('__SCENARIO__',$Suffix).Replace('__SIBLING_TARGET__',$siblingTarget),[Text.UTF8Encoding]::new($false));$common.ServerSha256=Hash $server
  & $installer @common -RootPath $root -ServiceName $name | Write-Host
  $rawPeer=if($KnownDllsIsolation){$knownPeer}else{if($Suffix -eq 'sibling'){(Join-Path $normal.root 'code/launch.json').Replace('\','/')}else{''}}
  & $installer @common -RootPath $root -ServiceName $name -Mode Permit -ActionId ([guid]::NewGuid().ToString('N')) -TestMode $TestMode -TestEvent $TestEvent -ObservationEvent $observationName -StopDeadlineMs $StopDeadline -TokenFault $TokenFault -RawPeerPath $rawPeer | Write-Host
  $definition=[IO.File]::ReadAllText((Join-Path $root 'action/service-definition.json'))|ConvertFrom-Json
  $proof=[NativeWorkloadToken]::ProofRoot([NativeInstallation]::ServiceSid($name));$objectRoots.Add($proof)
  [NativeInstallation]::CreateExclusive($proof,'O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)')
  foreach($entry in @(@('bu-read','0x1200a9'),@('bu-write','0x1301bf'))){
    $path=Join-Path $proof $entry[0];[IO.File]::WriteAllText($path,'SYNTHETIC_TOKEN_OBJECT')
    $acl=[Security.AccessControl.FileSecurity]::new();$acl.SetSecurityDescriptorSddlForm(('O:BAG:BAD:P(A;;FA;;;SY)(A;;FA;;;BA)(A;;'+$entry[1]+';;;BU)'));Set-Acl -LiteralPath $path -AclObject $acl
  }
  if($KnownDllsIsolation){foreach($entry in @(@('candidate-read','0x1200a9'),@('candidate-write','0x1301bf'))){$path=Join-Path $proof $entry[0];[IO.File]::WriteAllText($path,'SYNTHETIC_CANDIDATE');$acl=[Security.AccessControl.FileSecurity]::new();$acl.SetSecurityDescriptorSddlForm(('O:BAG:BAD:P(A;;FA;;;SY)(A;;FA;;;BA)(A;;'+$entry[1]+';;;'+[NativeKnownDlls]::CandidateSid+')'));Set-Acl -LiteralPath $path -AclObject $acl}}
  $sidType=if($ExpectHostIdentityRejection){3}else{1}
  $service=[OwnedScmService]::new($name,$definition.binaryPath,[uint32]$sidType);$services.Add($service);$configurations.Add($service.Configuration);Write-Host ('SOURCE_SCM_CONFIGURATION '+$service.Configuration)
  return @{root=$root;name=$name;service=$service;log=(Join-Path $root 'status/host.log')}
}
function Await($Task) { if(-not $Task.Wait(35000)){throw 'HARNESS_TASK_DEADLINE'};return $Task.Result }
try {
  if($KnownDllsCommand -and -not $DebuggerRoot){
    $control=Stage 'known-dlls-command' 'known-dlls-command';$control.service.Start();$control.service.WaitState(1,15000)
    $proof=[NativeHarnessEvents]::Read($control.log);$results.Add(@{case='known-dlls-command';log=$proof})
    if(-not $proof.Contains('DIAGNOSTIC_CHILD_EXIT=')){throw 'KNOWNDLLS_COMMAND_OUTCOME_MISSING'}
    if($proof -notmatch 'DIAGNOSTIC_CHILD_EXIT=0 stdoutBase64= stderrBase64='){throw 'KNOWNDLLS_COMMAND_NOT_NATURAL_ZERO'}
    return
  }
  if($KnownDllsIsolation){
    $peerId=[guid]::NewGuid().ToString('N').Substring(0,16);$peerRoot='E:/task22-native-service-'+$peerId;$roots.Add($peerRoot);$peerSid=[NativeInstallation]::ServiceSid('PortalNativeTest_'+$peerId)
    $peerRead='O:BAG:BAD:P(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;'+$peerSid+')'
    [NativeInstallation]::CreateExclusive($peerRoot,$peerRead)
    foreach($leaf in @('code','action','data')){[NativeInstallation]::CreateExclusive((Join-Path $peerRoot $leaf),$peerRead)}
    foreach($relative in @('code/launch.json','action/permit.json','data/created.txt')){[IO.File]::WriteAllText((Join-Path $peerRoot $relative),'SYNTHETIC_PEER_PRIVATE')}
    $knownPeer=($peerRoot+'/code/launch.json')
    $control=Stage 'known-dlls-isolation' 'known-dlls-isolation';$control.service.Start();$control.service.WaitState(1,10000)
    $proof=[NativeHarnessEvents]::Read($control.log);$results.Add(@{case='known-dlls-isolation';log=$proof;peerSid=$peerSid;peerRoot=$peerRoot})
    if(-not $proof.Contains('KNOWNDLLS_ISOLATION_GATE_PASS')){throw 'KNOWNDLLS_ISOLATION_GATE_FAILED'}
    if($proof.Contains('POWERSHELL_CREATED=')){throw 'KNOWNDLLS_ISOLATION_CREATED_WORKLOAD'}
    return
  }
  if($KnownDllsGate){
    $control=Stage 'known-dlls-gate' 'known-dlls-gate'
    $control.service.Start();$control.service.WaitState(1,10000)
    $proof=[NativeHarnessEvents]::Read($control.log)
    $results.Add(@{case='known-dlls-token-only';log=$proof})
    if(-not $proof.Contains('KNOWNDLLS_TOKEN_ONLY_GATE_PASS noWorkloadCreated=True')){throw 'KNOWNDLLS_TOKEN_ONLY_GATE_FAILED'}
    if($proof.Contains('POWERSHELL_CREATED=')){throw 'KNOWNDLLS_TOKEN_GATE_CREATED_WORKLOAD'}
    return
  }
  if($DebuggerRoot){
    if($DebuggerRoot.Replace('\','/') -notmatch '^E:/task22-native-debugger-[a-f0-9]{32}$'){throw 'DEBUGGER_ROOT_BINDING'}
    $eventName='Global\Task22DebuggerArmed_'+[guid]::NewGuid().ToString('N');$security=[Security.AccessControl.EventWaitHandleSecurity]::new()
    $security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'),'FullControl','Allow'))
    $security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-19'),'Synchronize','Allow'))
    $created=$false;$release=[Threading.EventWaitHandle]::new($false,'ManualReset',$eventName,[ref]$created,$security);$events.Add($release)
    if(-not $created){throw 'DEBUGGER_EVENT_COLLISION'}
    $debugMode=if($KnownDllsCommand){'known-dlls-command'}else{'debugger-command'}
    $control=Stage $debugMode $debugMode $eventName
    foreach($relative in @('installation.json','action/permit.json','action/service-definition.json','action/known-dlls-admission.json')){
      $path=Join-Path $control.root $relative
      if(Test-Path -LiteralPath $path){Copy-Item -LiteralPath $path -Destination (Join-Path $DebuggerRoot ($relative.Replace('/','-'))) -ErrorAction Stop}
    }
    $boundary=[NativeHarnessEvents]::Line($control.log,'DEBUGGER_CREATION_CALLBACK pid=');$control.service.Start();Await $boundary|Out-Null
    $target=[NativeHarnessEvents]::Member($control.log,'POWERSHELL_CREATED=');$owned.Add($target)
    $identity=@{pid=$target.Id;createdUtc=$target.StartTime.ToUniversalTime().ToString('o');image=$target.MainModule.FileName;log=([NativeHarnessEvents]::Read($control.log))}
    [IO.File]::WriteAllText((Join-Path $DebuggerRoot 'identity.json'),(ConvertTo-Json -InputObject $identity -Depth 6))
    $commands=Join-Path $DebuggerRoot 'commands.txt'
    $armCommands=@('.echo TASK22_ATTACH_CONTEXT','|','~*k','lm','.reload /f ntdll.dll','dt ntdll!_PEB @$peb NtGlobalFlag','ed @@c++(&((ntdll!_PEB*)@$peb)->NtGlobalFlag) (dwo(@@c++(&((ntdll!_PEB*)@$peb)->NtGlobalFlag)) | 2)','dt ntdll!_PEB @$peb NtGlobalFlag')
    $initializerScript=@'
"use strict";
var frames = {}, entries = {}, sequence = 0, returnAddress, tlsThunk, primaryTid, loaderBreakSeen = false;
function hx(v) { return "0x" + v.toString(16); }
function value(e) {
    for(var line of host.namespace.Debugger.Utility.Control.ExecuteCommand("? "+e)) {
        var match=/=\s*([0-9a-f`]+)\s*$/i.exec(line);
        if(match) return host.parseInt64(match[1].replace(/`/g,""),16);
    }
    throw new Error("INITIALIZER_EXPRESSION_UNAVAILABLE "+e);
}
function equal(a,b) { return hx(a) === hx(b); }
function output(v) { host.diagnostics.debugLog("TASK22_INIT " + JSON.stringify(v) + "\n"); }
function command(c) { for (var line of host.namespace.Debugger.Utility.Control.ExecuteCommand(c)) host.diagnostics.debugLog(line + "\n"); }
function setup() {
    returnAddress = value("ntdll!LdrpCallInitRoutineInternal+0x22");
    tlsThunk = value("ntdll!ImageTlsCallbackCaller");
    primaryTid = hx(value("@$tid"));
    // The exact matched-image disassembly proves sub rsp,28; call guard; AL store at +22.
    if (Number(value("by(ntdll!LdrpCallInitRoutineInternal)")) !== 0x48 ||
        Number(value("by(ntdll!LdrpCallInitRoutineInternal+0x1d)")) !== 0xe8 ||
        Number(value("by(ntdll!LdrpCallInitRoutineInternal+0x22)")) !== 0x88) throw new Error("INITIALIZER_ABI_CHANGED");
    output({kind:"ABI_READY",postCall:hx(returnAddress),tlsThunk:hx(tlsThunk)});
    return true;
}
function calledUnsafe() {
    var tid=hx(value("@$tid")), sp=value("@rsp"), entry=value("@rcx"), base=value("@rdx"), reason=Number(value("@r8d"));
    if (!frames[tid]) frames[tid]=[];
    if (equal(entry,tlsThunk)||reason!==1) {
        frames[tid].push({skip:true,returnSp:hx(sp.subtract(0x28))});
        if(equal(entry,tlsThunk)) output({kind:"TLS_VOID",tid:tid,callback:hx(value("@r9")),base:hx(base),reason:reason});
        return false;
    }
    var peEntry=base.add(value("dwo(@rdx+dwo(@rdx+0x3c)+0x28)"));
    if (!equal(entry,peEntry)) throw new Error("INITIALIZER_NOT_PE_ENTRY");
    var record={id:++sequence,tid:tid,base:hx(base),entry:hx(entry),rva:hx(entry.subtract(base)),reason:reason,reserved:hx(value("@r9")),helperSp:hx(sp),entrySp:hx(sp.subtract(0x30)),returnSp:hx(sp.subtract(0x28)),returnAddress:hx(returnAddress),entered:false};
    frames[tid].push(record);output({kind:"SCHEDULE",frame:record});
    if (!entries[hx(entry)]) { command('bp /w "@$scriptContents.entered()" '+hx(entry));entries[hx(entry)]=true; }
    return false;
}
function enteredUnsafe() {
    var tid=hx(value("@$tid")), list=frames[tid];
    if (!list || !list.length) return false;
    var f=list[list.length-1];
    if(f.skip) return false;
    if(hx(value("@rip"))!==f.entry || hx(value("@rsp"))!==f.entrySp) return false;
    if(hx(value("poi(@rsp)"))!==f.returnAddress || hx(value("@rcx"))!==f.base || Number(value("@edx"))!==1 || hx(value("@r8"))!==f.reserved) throw new Error("INITIALIZER_ENTRY_FRAME_MISMATCH");
    f.entered=true;output({kind:"DLL_PROCESS_ATTACH_ENTRY",frame:f});command("lmv a "+f.entry);command("kv");
    if(f.rva==="0x51120") armUser32Cause(f);
    return false;
}
var causeFrame, causeCalls={}, causeReturns={}, causeSequence=0;
var causeNames=["ntdll!CsrClientConnectToServer","ntdll!RtlInitializeNtUserPfn","ntdll!RtlRetrieveNtUserPfn","ntdll!NtQuerySystemInformation","ntdll!NtOpenSection","ntdll!NtMapViewOfSection","ntdll!NtOpenDirectoryObject","ntdll!NtOpenFile","ntdll!NtCreateFile","ntdll!NtOpenKey","ntdll!NtConnectPort","ntdll!NtAlpcConnectPort","ntdll!NtAlpcSendWaitReceivePort","ntdll!NtOpenProcessToken","ntdll!NtQueryInformationToken","ntdll!NtQueryInformationProcess","win32u!NtUserProcessConnect","win32u!NtUserInitializeClientPfnArrays","win32u!NtUserGetThreadState","win32u!NtUserGetProcessWindowStation","win32u!NtUserOpenWindowStation","win32u!NtUserOpenDesktop","win32u!NtUserSetProcessWindowStation","win32u!NtUserSetThreadDesktop"];
function armUser32Cause(f) {
    causeFrame=f;
    // Branches and import callsites are from the byte-identical KnownDll .text,
    // bound to CDB947D1-B96B-8797-7915-DE04CF54279C, age 1.
    if(Number(value("dwo(user32+dwo(user32+0x3c)+8)"))!==0x4c25ada6 || Number(value("dwo(user32+dwo(user32+0x3c)+0x50)"))!==0x1cf000) throw new Error("INITIALIZER_USER32_IDENTITY");
    for(var rva of [0x6bc15,0x6bc29,0x6bc3d,0x6bc55,0x6bc61,0x6bc7c,0x6bd2e,0x6bd3a,0x6bd7e,0x6be61,0x6bf36,0x6c1cb,0x6c41a,0x6c431,0x6c435]) command('bp /w "@$scriptContents.causePoint()" user32+0x'+rva.toString(16));
    for(var id=0;id<causeNames.length;id++) command('bu /w "@$scriptContents.causeEnter('+id+')" '+causeNames[id]);
    armGdiCause();
    output({kind:"CAUSE_ARMED",frame:f});
}
var gdiRvas=[0x82099,0x8209e,0x820b3,0x820b8,0x820c3,0x820d1,0x8655b,0x86571,0x86576,0x8962e,0x89635,0x89647,0x89656,0x89662,0x8966c,0x89675,0x89690,0x896a0,0x896aa];
function armGdiCause(){
    command(".reload /f gdi32full.dll");command("!lmi gdi32full");
    if(Number(value("dwo(gdi32full+dwo(gdi32full+0x3c)+8)"))!==0x3516563f || Number(value("dwo(gdi32full+dwo(gdi32full+0x3c)+0x50)"))!==0x129000 || Number(value("dwo(gdi32full+0xf26f4)"))!==0xa6245e4f || Number(value("dwo(gdi32full+0xf2704)"))!==1)throw new Error("INITIALIZER_GDI_IDENTITY");
    for(var id=0;id<gdiRvas.length;id++)command('bp /w "@$scriptContents.gdiPoint('+id+')" gdi32full+0x'+gdiRvas[id].toString(16));
    output({kind:"GDI_CAUSE_ARMED",rvas:gdiRvas});
}
function gdiPoint(id){return guarded("gdiPoint",function(){
    if(!causeFrame||hx(value("@$tid"))!==causeFrame.tid)return false;
    var rva=gdiRvas[Number(id)];if(rva===undefined||hx(value("@rip").subtract(value("gdi32full")))!==hx(host.parseInt64(rva.toString(16),16)))throw new Error("INITIALIZER_GDI_POINT");
    output({kind:"GDI_CAUSAL_POINT",id:Number(id),rva:hx(value("@rip").subtract(value("gdi32full"))),tid:causeFrame.tid,rsp:hx(value("@rsp")),eax:hx(value("@eax")),rax:hx(value("@rax")),rcx:hx(value("@rcx")),rdx:hx(value("@rdx")),r8:hx(value("@r8")),r9:hx(value("@r9")),ebx:hx(value("@ebx")),lastError:hx(value("dwo(@$teb+0x68)")),lastStatus:hx(value("dwo(@$teb+0x1250)"))});
    command("u @rip L3");command("kv");return false;
});}
causeNames=causeNames.concat(["win32u!NtGdiInit2","gdi32full!GdiDllInitialize","gdi32full!InitializeGdiHeap","gdi32full!DllMainCRTStartup","gdi32full!DllMain","gdi32full!GdiProcessSetup","gdi32full!InitializeCFontCache","gdi32full!GetStockObject","ntdll!RtlInitializeCriticalSection"]);
function causePoint(){return guarded("causePoint",function(){
    if(!causeFrame||hx(value("@$tid"))!==causeFrame.tid)return false;
    output({kind:"USER32_CAUSAL_BRANCH",rva:hx(value("@rip").subtract(value("user32"))),eax:hx(value("@eax")),rax:hx(value("@rax")),ebx:hx(value("@ebx")),r15:hx(value("@r15")),lastError:hx(value("dwo(@$teb+0x68)")),lastStatus:hx(value("dwo(@$teb+0x1250)"))});
    command("u @rip L3");return false;
});}
function causeEnter(id){return guarded("causeEnter",function(){
    var name=causeNames[Number(id)];if(!name)throw new Error("INITIALIZER_CAUSE_ID");
    if(!causeFrame||hx(value("@$tid"))!==causeFrame.tid)return false;
    var sp=value("@rsp"),ret=value("poi(@rsp)"),key=hx(sp.add(8));
    var f={id:++causeSequence,name:name,tid:causeFrame.tid,sp:hx(sp),returnSp:key,returnAddress:hx(ret),rcx:hx(value("@rcx")),rdx:hx(value("@rdx")),r8:hx(value("@r8")),r9:hx(value("@r9"))};
    causeCalls[key]=f;output({kind:"CAUSE_CALL_ENTRY",call:f});command("dq @rsp Lc");
    if(name==="ntdll!CsrClientConnectToServer")command("du @rcx");
    if(/NtOpenSection$|NtOpenDirectoryObject$|NtOpenFile$|NtCreateFile$|NtOpenKey$/.test(name)) {command("dt ntdll!_OBJECT_ATTRIBUTES @r8");command("dt ntdll!_UNICODE_STRING poi(@r8+0x10)");command("du poi(poi(@r8+0x10)+8)");}
    if(name==="ntdll!NtAlpcConnectPort"||name==="ntdll!NtConnectPort"){command("dt ntdll!_UNICODE_STRING @rdx");command("du poi(@rdx+8)");}
    if(!causeReturns[hx(ret)]){command('bp /w "@$scriptContents.causeReturn()" '+hx(ret));causeReturns[hx(ret)]=true;}
    return false;
});}
function causeReturn(){return guarded("causeReturn",function(){
    if(!causeFrame||hx(value("@$tid"))!==causeFrame.tid)return false;
    var key=hx(value("@rsp")),f=causeCalls[key];if(!f||f.returnAddress!==hx(value("@rip")))return false;
    delete causeCalls[key];output({kind:"CAUSE_CALL_RETURN",call:f,eax:hx(value("@eax")),rax:hx(value("@rax")),lastError:hx(value("dwo(@$teb+0x68)")),lastStatus:hx(value("dwo(@$teb+0x1250)"))});command("kv");return false;
});}
function returnedUnsafe() {
    var tid=hx(value("@$tid")), list=frames[tid];
    if (!list || !list.length) return false;
    var f=list[list.length-1];
    if(hx(value("@rsp"))!==f.returnSp) throw new Error("INITIALIZER_RETURN_FRAME_MISMATCH");
    if(f.skip) { list.pop();return false; }
    if(!f.entered) throw new Error("INITIALIZER_ENTRY_NOT_OBSERVED");
    list.pop();var result=Number(value("@eax"));output({kind:"DLL_PROCESS_ATTACH_RETURN",id:f.id,tid:tid,entry:f.entry,base:f.base,returnSp:f.returnSp,eax:result,al:Number(value("@al")),bool:result!==0});
    if(result===0) { output({kind:"FIRST_BOOL_FALSE",frame:f});command("kv");command("lm");host.diagnostics.debugLog("TASK22_EVENT_CAPTURED_TEARDOWN\n");return true; }
    return false;
}
function guarded(name, fn) { try { return fn(); } catch(error) { output({kind:"INSTRUMENTATION_ERROR",callback:name,error:String(error),pending:frames}); return true; } }
function called() { return guarded("called",calledUnsafe); }
function entered() { return guarded("entered",enteredUnsafe); }
function returned() { return guarded("returned",returnedUnsafe); }
function failure(kind) { return guarded("failure",function(){output({kind:["LOADER_INITIALIZATION_FAILURE","RTL_RAISE_STATUS","NT_TERMINATE_PROCESS_CAPTURED"][kind],tid:hx(value("@$tid")),rcx:hx(value("@rcx")),edx:hx(value("@edx")),pending:frames});command("kv");host.diagnostics.debugLog("TASK22_EVENT_CAPTURED_TEARDOWN\n");return true;}); }
function eventPolicy(event) {
    return event.code==="80000003" && event.firstChance && event.exactCallsite && event.int3 && event.loaderStack && event.primaryThread && !event.alreadySeen ? "CONTINUE_VERIFIED_LOADER_BREAK" : "CAPTURED_TEARDOWN";
}
function eventLines(c) {var lines=[];for(var line of host.namespace.Debugger.Utility.Control.ExecuteCommand(c))lines.push(line);return lines;}
function debugEvent(kind) { return guarded("debugEvent",function(){
    var last=eventLines(".lastevent"),stack=eventLines("kv");
    var text=last.join("\n"), trace=stack.join("\n"), match=/code\s+([0-9a-f]{8})/i.exec(text);
    var event={kind:kind,code:match?match[1].toLowerCase():null,firstChance:/\(first chance\)/i.test(text),lastEvent:last,stack:stack,pending:frames,alreadySeen:loaderBreakSeen};
    if(event.code==="80000003") {
        event.exactCallsite=equal(value("@rip"),value("ntdll!LdrpDoDebuggerBreak+0x35"));
        event.int3=Number(value("by(@rip)"))===0xcc;
        event.loaderStack=/ntdll!LdrpDoDebuggerBreak\+0x35/.test(trace)&&/ntdll!LdrpInitializeProcess/.test(trace);
        event.primaryThread=hx(value("@$tid"))===primaryTid;
    }
    var action=eventPolicy(event);event.action=action;output({kind:"DEBUG_EVENT",event:event});
    command(".exr -1");command("lm a @rip");
    if(action==="CONTINUE_VERIFIED_LOADER_BREAK") loaderBreakSeen=true;
    host.diagnostics.debugLog("TASK22_EVENT_"+action+"\n");return true;
}); }
function offlineEventPolicyTest() {
    var base={code:"80000003",firstChance:true,exactCallsite:true,int3:true,loaderStack:true,primaryThread:true,alreadySeen:false}, cases=[];
    function test(label,overrides,expected) {var event={};for(var key in base)event[key]=base[key];for(var key in overrides)event[key]=overrides[key];var actual=eventPolicy(event);if(actual!==expected)throw new Error("EVENT_POLICY_TEST_FAILED "+label);cases.push({label:label,event:event,action:actual});}
    test("verified ordinary loader initial break",{},"CONTINUE_VERIFIED_LOADER_BREAK");
    for(var field of ["firstChance","exactCallsite","int3","loaderStack","primaryThread"]) {var negative={};negative[field]=false;test("reject "+field,negative,"CAPTURED_TEARDOWN");}
    test("reject repeated loader break",{alreadySeen:true},"CAPTURED_TEARDOWN");
    for(var code of ["c0000005","c0000142","e06d7363","c0000409",null]) test("capture exception "+code,{code:code},"CAPTURED_TEARDOWN");
    output({kind:"OFFLINE_EVENT_POLICY_PASS",cases:cases,termination:"failure(2) captures then requests teardown",tls:"void callback, not BOOL"});return true;
}
function offlineEventIntegrationTest() {
    var oldValue=value,oldCommand=command,oldOutput=output,oldTid=primaryTid,oldSeen=loaderBreakSeen,oldFrames=frames,oldLines=eventLines;
    var events=[],commands=[],code="80000003",site="180122239";
    function n(v){return host.parseInt64(v,16);}
    try {
        primaryTid="0x1234";loaderBreakSeen=false;frames={};
        value=function(e){if(e==="@$tid")return n("1234");if(e==="by(@rip)")return n("cc");if(e==="@rip")return n(site);if(e==="ntdll!LdrpDoDebuggerBreak+0x35")return n("180122239");return n("0");};
        command=function(c){commands.push(c);};output=function(e){events.push(e);};
        eventLines=function(c){return c===".lastevent"?["Break instruction exception - code "+code+" (first chance)"]:["ntdll!LdrpDoDebuggerBreak+0x35","ntdll!LdrpInitializeProcess+0x100"];};
        debugEvent(2);if(events[0].event.action!=="CONTINUE_VERIFIED_LOADER_BREAK")throw new Error("EVENT_POLICY_TEST_FAILED event handler loader break");
        debugEvent(1);if(events[1].event.action!=="CAPTURED_TEARDOWN")throw new Error("EVENT_POLICY_TEST_FAILED event handler repeated break");
        loaderBreakSeen=false;site="180122240";debugEvent(1);if(events[2].event.action!=="CAPTURED_TEARDOWN")throw new Error("EVENT_POLICY_TEST_FAILED event handler unknown break");
        for(var failureCode of ["c0000005","c0000142","e06d7363"]){code=failureCode;debugEvent(0);if(events[events.length-1].event.action!=="CAPTURED_TEARDOWN")throw new Error("EVENT_POLICY_TEST_FAILED exception teardown");}
        var eventCases=events.slice();events=[];commands=[];
        for(var kind=0;kind<3;kind++)if(failure(kind)!==true)throw new Error("EVENT_POLICY_TEST_FAILED failure callback must stop");
        if(events.length!==3||events[2].kind!=="NT_TERMINATE_PROCESS_CAPTURED"||commands.length!==3)throw new Error("EVENT_POLICY_TEST_FAILED failure capture");
        oldOutput({kind:"OFFLINE_EVENT_INTEGRATION_PASS",realInt64:true,eventCases:eventCases,failureCallbacks:events,commands:commands});return true;
    } finally {value=oldValue;command=oldCommand;output=oldOutput;primaryTid=oldTid;loaderBreakSeen=oldSeen;frames=oldFrames;eventLines=oldLines;}
}

function offlineTest() {
    var savedValue=value,savedCommand=command,savedOutput=output,savedFrames=frames,savedEntries=entries,savedSequence=sequence,savedReturn=returnAddress,savedTls=tlsThunk;
    var registers={},events=[],commands=[];
    function n(v) { return host.parseInt64(String(v).replace(/^0x/,""),16); }
    function check(v,label) { if(!v)throw new Error("OFFLINE_TEST_FAILED "+label); }
    function invocation(tid,sp,base,entry) {
        registers={"@$tid":n(tid),"@rsp":n(sp),"@rcx":n(entry),"@rdx":n(base),"@r8d":n("1"),"@r9":n("1234"),"dwo(@rdx+dwo(@rdx+0x3c)+0x28)":n("5060")};
        calledUnsafe();return frames[hx(n(tid))][frames[hx(n(tid))].length-1];
    }
    function entry(f) { registers={"@$tid":n(f.tid),"@rip":n(f.entry),"@rsp":n(f.entrySp),"poi(@rsp)":returnAddress,"@rcx":n(f.base),"@edx":n("1"),"@r8":n(f.reserved)};enteredUnsafe(); }
    function finish(f,result) { registers={"@$tid":n(f.tid),"@rsp":n(f.returnSp),"@eax":n(result),"@al":n(result)};returnedUnsafe(); }
    try {
        check(equal(savedValue("kernelbase+0x5060"),savedValue("kernelbase+dwo(kernelbase+dwo(kernelbase+0x3c)+0x28)")),"real PE entry equality");
        check(!equal(savedValue("kernelbase"),savedValue("kernelbase+0x5060")),"unequal addresses");
        check(savedValue("kernelbase").compareTo(savedValue("kernelbase"))!==0,"old strict comparison reproduced");
        value=function(e){if(!registers[e])throw new Error("TEST_REGISTER_MISSING "+e);return registers[e];};
        command=function(c){commands.push(c);};output=function(e){events.push(JSON.parse(JSON.stringify(e)));};
        frames={};entries={};sequence=0;returnAddress=n("7ff9f8e9eada");tlsThunk=n("7ff9f8e683e0");
        var outer=invocation("32f9c","b74607f000","7ff9f6030000","7ff9f6035060");entry(outer);
        var nested=invocation("32f9c","b74607e000","7ff9f6030000","7ff9f6035060");entry(nested);
        var other=invocation("32f9d","b74609f000","7ff9f6030000","7ff9f6035060");entry(other);finish(other,"1");finish(nested,"1");finish(outer,"0");
        check(events.filter(function(e){return e.kind==="DLL_PROCESS_ATTACH_ENTRY";}).length===3,"three exact entries");
        check(events.filter(function(e){return e.kind==="DLL_PROCESS_ATTACH_RETURN";}).map(function(e){return e.id;}).join(",")==="3,2,1","thread and nesting pairing");
        check(events.filter(function(e){return e.kind==="FIRST_BOOL_FALSE";}).length===1,"one BOOL false");
        registers={"@$tid":n("32f9c"),"@rsp":n("b74607f000"),"@rcx":tlsThunk,"@rdx":n("7ff9f6030000"),"@r8d":n("1"),"@r9":n("7ff9f6034000")};calledUnsafe();
        registers={"@$tid":n("32f9c"),"@rsp":n("b74607efd8"),"@eax":n("0"),"@al":n("0")};returnedUnsafe();
        check(events.filter(function(e){return e.kind==="FIRST_BOOL_FALSE";}).length===1,"TLS void never BOOL");
        var bad=invocation("32f9c","b74607f000","7ff9f6030000","7ff9f6035060");registers["@rsp"]=n("1");
        check(returned()===true&&events[events.length-1].kind==="INSTRUMENTATION_ERROR","error requests owned teardown");
        savedOutput({kind:"OFFLINE_TEST_PASS",realPeEntry:true,oldStrictComparisonReproduced:true,pairedIds:[3,2,1],tlsVoid:true,frameMismatchTeardown:true,events:events});
        return true;
    } finally {value=savedValue;command=savedCommand;output=savedOutput;frames=savedFrames;entries=savedEntries;sequence=savedSequence;returnAddress=savedReturn;tlsThunk=savedTls;}
}
function initializeScript() { return [new host.apiVersionSupport(1,7)]; }
'@
    $scriptPath=(Join-Path $DebuggerRoot 'initializer.js').Replace('\','/')
    [IO.File]::WriteAllText($scriptPath,$initializerScript,[Text.UTF8Encoding]::new($false))
    $armCommands+=@(
      ('.scriptload '+$scriptPath),'dx @$scriptContents.setup()',
      'bp /w "@$scriptContents.called()" ntdll!LdrpCallInitRoutineInternal',
      'bp /w "@$scriptContents.returned()" ntdll!LdrpCallInitRoutineInternal+0x22',
      'bp /w "@$scriptContents.failure(0)" ntdll!LdrpInitializationFailure',
      'bp /w "@$scriptContents.failure(1)" ntdll!RtlRaiseStatus',
      'bp /w "@$scriptContents.failure(2)" ntdll!NtTerminateProcess',
      'sxn ld',
      'sxe -c "dx @$scriptContents.debugEvent(0)" *',
      'sxe -c "dx @$scriptContents.debugEvent(1)" bpe',
      'sxe -c "dx @$scriptContents.debugEvent(2)" ibp',
      'sxe -c "dx @$scriptContents.debugEvent(3)" av',
      'sxe -c "dx @$scriptContents.debugEvent(4)" c0000142',
      'sxe -c "dx @$scriptContents.debugEvent(5)" eh',
      'sxe -c ".echo TASK22_PROCESS_EXIT; .lastevent; q" epr')
    $armCommands+=@('bl','.echo TASK22_DEBUGGER_ARMED','g');[IO.File]::WriteAllLines($commands,$armCommands)
    $debugger=[Diagnostics.Process]::new();$observer=[NativeHarnessEvents+DebuggerOutput]::new()
    $debugger.StartInfo.FileName='C:/Program Files (x86)/Windows Kits/10/Debuggers/x64/cdb.exe'
    # Break on the attach's existing ntdll LOAD_DLL event, not a breakpoint
    # requiring the still-suspended primary thread to execute first.
    $debugger.StartInfo.Arguments='-pb -xe ld:ntdll.dll -p '+$target.Id+' -cf "'+$commands+'" -logo "'+(Join-Path $DebuggerRoot 'cdb.log')+'" -y "'+(Join-Path $DebuggerRoot 'symbols').Replace('/','\')+'"'
    $debugger.StartInfo.UseShellExecute=$false;$debugger.StartInfo.RedirectStandardOutput=$true;$debugger.StartInfo.RedirectStandardError=$true;$debugger.StartInfo.RedirectStandardInput=$true
    try{
      $observer.Subscribe($debugger)
      if(-not $debugger.Start()){throw 'DEBUGGER_START'};$debugger.BeginOutputReadLine();$debugger.BeginErrorReadLine()
      if([Threading.WaitHandle]::WaitAny(@($observer.Ready,$observer.Exited,$observer.Failed),10000) -ne 0){throw 'DEBUGGER_NOT_ARMED_OR_EXITED'}
      $arm=$observer.Snapshot();if($arm -match 'Syntax error|Unable to|Could not|failed|Failed|Error|Exception|No runnable debuggees' -or -not $arm.Contains('ABI_READY')){throw 'DEBUGGER_COMMAND_COVERAGE_REJECTED'}
      $release.Set()|Out-Null
      if([Threading.WaitHandle]::WaitAny(@($observer.Failed,$observer.Exited),10000) -eq 0){throw 'DEBUGGER_INSTRUMENTATION_ERROR_OWNED_TEARDOWN'}
      if(-not $target.WaitForExit(1000)){throw 'DEBUGGER_TARGET_EXIT_TIMEOUT'}
      $control.service.WaitState(1,10000)
      if(-not $observer.Exited.WaitOne(3000)){throw 'DEBUGGER_EXIT_EVENT_TIMEOUT'};$debugger.WaitForExit()
      $results.Add(@{case=$debugMode;initializerDiagnostic=$true;targetExit=$target.ExitCode;debuggerExit=$debugger.ExitCode;log=([NativeHarnessEvents]::Read($control.log))})
    }finally{
      if($debugger.Id -and -not $debugger.HasExited){$debugger.Kill();$debugger.WaitForExit(5000)|Out-Null}
      [IO.File]::WriteAllText((Join-Path $DebuggerRoot 'debugger-output.txt'),$observer.Snapshot());$observer.Dispose();$debugger.Dispose()
    }
    return
  }
  if($DiagnosticRoot){
    if($DiagnosticRoot.Replace('\','/') -notmatch '^E:/task22-native-diag-[a-f0-9]{32}$' -or -not (Test-Path -LiteralPath $DiagnosticRoot)){throw 'DIAGNOSTIC_ROOT_BINDING'}
    $control=Stage 'diagnostic-command' 'diagnostic-command'
    $traceName='Task22NativeDiag_'+[guid]::NewGuid().ToString('N')
    $providers=Join-Path $DiagnosticRoot 'providers.txt';$etl=Join-Path $DiagnosticRoot 'control.etl'
    $trace=[ordered]@{name=$traceName;sessionGuid='assigned-by-logman-record-in-live-query';qpcFrequency=[Diagnostics.Stopwatch]::Frequency;utcBefore=[DateTime]::UtcNow.ToString('o');qpcBefore=[Diagnostics.Stopwatch]::GetTimestamp();commands=@()}
    function TraceCommand([string[]]$Arguments){$out=& 'C:/Windows/System32/logman.exe' @Arguments 2>&1;$code=$LASTEXITCODE;$trace.commands+=@{argv=$Arguments;exitCode=$code;output=($out -join [Environment]::NewLine)};return $code}
    [IO.File]::WriteAllLines($providers,@('{22fb2cd6-0e7b-422b-a0c7-2fad1fd0e716} 0x70 5','{edd08927-9cc4-4e65-b970-c2560fb5c289} 0xf0 5','{70eb4f03-c1de-4f73-a051-33d13d5413bd} 0xb401 5'))
    $doneName='Global\Task22DiagDone_'+[guid]::NewGuid().ToString('N');$created=$false;$done=[Threading.EventWaitHandle]::new($false,'ManualReset',$doneName,[ref]$created)
    $watchdog=$null;$traceStarted=$false
    try{
      if((TraceCommand -Arguments @('query',$traceName,'-ets')) -eq 0){throw 'TRACE_NAME_COLLISION'}
      if((TraceCommand -Arguments @('create','trace',$traceName,'-ets','-pf',$providers,'-o',$etl,'-f','bin','-max','128','-bs','64','-nb','16','64','-ct','perf')) -ne 0){throw 'TRACE_START_FAILED'}
      $traceStarted=$true
      $watchdogText="`$e=[Threading.EventWaitHandle]::OpenExisting('$doneName');if(-not `$e.WaitOne(30000)){& C:/Windows/System32/logman.exe stop '$traceName' -ets;exit 30};`$e.Dispose()"
      $watchdog=[Diagnostics.Process]::Start('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',('-NoProfile -NonInteractive -EncodedCommand '+[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($watchdogText))))
      if((TraceCommand -Arguments @('query',$traceName,'-ets')) -ne 0){throw 'TRACE_ARM_QUERY_FAILED'}
      $live=$trace.commands[-1].output
      foreach($guid in @('22fb2cd6-0e7b-422b-a0c7-2fad1fd0e716','edd08927-9cc4-4e65-b970-c2560fb5c289','70eb4f03-c1de-4f73-a051-33d13d5413bd')){if($live -notmatch $guid){throw 'TRACE_PROVIDER_NOT_CONFIRMED'}}
      $trace.armedAt=[DateTime]::UtcNow.ToString('o');$trace.qpcArmed=[Diagnostics.Stopwatch]::GetTimestamp()
      $control.service.Start();$control.service.WaitState(1,10000)
      $trace.childLog=[NativeHarnessEvents]::Read($control.log)
      if(-not $trace.childLog.Contains('DIAGNOSTIC_CHILD_EXIT=')){throw 'DIAGNOSTIC_CHILD_OUTCOME_MISSING'}
      $results.Add(@{case='diagnostic-command';log=$trace.childLog})
    }finally{
      if($traceStarted){$trace.finalQueryExit=TraceCommand -Arguments @('query',$traceName,'-ets');$trace.stopExit=TraceCommand -Arguments @('stop',$traceName,'-ets');$trace.absentQueryExit=TraceCommand -Arguments @('query',$traceName,'-ets')}
      $done.Set()|Out-Null;if($watchdog){if(-not $watchdog.WaitForExit(5000)){throw 'TRACE_WATCHDOG_EXIT'};$trace.watchdogExit=$watchdog.ExitCode;$watchdog.Dispose()};$done.Dispose()
      $trace.stoppedAt=[DateTime]::UtcNow.ToString('o');[IO.File]::WriteAllText((Join-Path $DiagnosticRoot 'trace-control.json'),(ConvertTo-Json -InputObject $trace -Depth 12),[Text.UTF8Encoding]::new($false))
    }
    return
  }
  if($ObjectRightsOnly){
    $rights=Stage 'object-rights-only' 'object-rights-only';$rights.service.Start();$rights.service.WaitState(1,10000)
    $rightsLog=[NativeHarnessEvents]::Read($rights.log)
    if(-not $rightsLog.Contains('OBJECT_RIGHTS_GATE_PASS') -or -not $rightsLog.Contains('OBJECT_RIGHTS_ONLY_STOP noWorkloadCreated=True')){throw 'OBJECT_RIGHTS_ONLY_GATE_FAILED'}
    if($rightsLog.Contains('POWERSHELL_CREATED=')){throw 'OBJECT_RIGHTS_ONLY_CREATED_WORKLOAD'}
    $results.Add(@{case='single-service-object-rights-only';passed=$true;log=$rightsLog});return
  }
  if($ExpectHostIdentityRejection){
    $rejected=Stage 'normal';$rejected.service.Start();$rejected.service.WaitState(1,10000)
    $failurePath=Join-Path $rejected.root 'status/startup-failure.log'
    $failure=[IO.File]::ReadAllText($failurePath)
    if(-not $failure.Contains('SERVICE_LOCALSERVICE_ADMINISTRATOR_MEMBERSHIP')){throw 'EXPECTED_IDENTITY_REJECTION_MISSING'}
    if(Test-Path (Join-Path $rejected.root 'data/portal-writer.lock')){throw 'IDENTITY_REJECTION_STARTED_WRITER'}
    $results.Add(@{case='host-identity-rejection';reason=$failure;writerNeverStarted=$true})
    return
  }
  $normal=Stage 'normal' $(if($RuntimeOnly){'runtime-credited'}else{'normal'})
  $ready=[NativeHarnessEvents]::Line($normal.log,'ACTUAL_READY')
  $normal.service.Start();Await $ready|Out-Null;$normal.service.CaptureHost()
  Write-Host 'HARNESS normal ready'
  $supervisor=[NativeHarnessEvents]::Member($normal.log,'NATIVE_BOOTSTRAP_SUPERVISOR_PID=');$owned.Add($supervisor)
  $runtime=[NativeHarnessEvents]::Member($normal.log,'NATIVE_RUNTIME_PID=');$owned.Add($runtime)
  Write-Host 'HARNESS normal member handles'
  $normal.service.WaitState(4,10000)
  Write-Host 'HARNESS normal running'
  $ps=[NativeHarnessEvents]::Member($normal.log,'POWERSHELL_RESUMED=');$owned.Add($ps)
  $sid=[NativeInstallation]::ServiceSid($normal.name)
  foreach($member in @($ps,$supervisor,$runtime)){[NativeWorkloadToken]::VerifyProcess($member.Handle,$sid,[Action[string]]{param($line) Write-Host $line},'HARNESS_RUNNING')}
  $runtimeObject=[IO.File]::ReadAllText((Join-Path $normal.root 'data/storage/token.json'))|ConvertFrom-Json
  if($runtimeObject.node -cne '24.13.1' -or -not $runtimeObject.ipcConnected -or $runtimeObject.cwd -cne (Join-Path $normal.root 'code').Replace('/','\')){throw 'RUNTIME_ENVIRONMENT_IDENTITY'}
  $runtimeCreated=@{}
  foreach($relative in @('data/storage/token.json','data/portal-writer.lock')){
    $path=Join-Path $normal.root $relative;$acl=Get-Acl -LiteralPath $path
    if($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -cne $sid){throw 'RUNTIME_CREATED_OWNER'}
    if($acl.Sddl -notmatch ';;;OW\)'){throw 'RUNTIME_CREATED_OWNER_RIGHTS'}
    $access=@{}
    foreach($mask in @(0x80000000L,0x40000000L,0x40000L,0x80000L)){$code=[NativeWorkloadToken]::AccessAs($runtime.Handle,$path,[uint32]$mask);$access["$mask"]=$code;if($code -ne $(if($mask -in @(0x40000L,0x80000L)){5}else{0})){throw 'RUNTIME_CREATED_ACCESS'}}
    $runtimeCreated[$relative]=@{sddl=$acl.Sddl;access=$access}
  }
  $pipeSddl=[NativeHarnessEvents]::PipeSecurity($runtimeObject.pipePath)
  $pipeDescriptor=[Security.AccessControl.RawSecurityDescriptor]::new($pipeSddl)
  if($pipeDescriptor.Owner.Value -cne $sid){throw 'RUNTIME_PIPE_OWNER'}
  $pipeAccess=[NativeWorkloadToken]::AccessAs($runtime.Handle,$runtimeObject.pipePath,[uint32]0xc0000000)
  if($pipeAccess -ne 0){throw "RUNTIME_PIPE_OWN_ACCESS_$pipeAccess"}
  $ownAccess=@{}
  foreach($file in @('code/launch.json','code/server.mjs','action/permit.json')){
    foreach($access in @(0x80000000L,0x40000000L,0x40000L,0x80000L)){
      $code=[NativeWorkloadToken]::AccessAs($runtime.Handle,(Join-Path $normal.root $file),[uint32]$access)
      $ownAccess["${file}:$access"]=$code
      if(($access -eq 0x80000000L -and $code -ne 0) -or ($access -ne 0x80000000L -and $code -ne 5)){throw 'OWN_TOKEN_ACCESS_CONTRACT'}
    }
  }
  $consumedModules=@{host=([NativeHarnessEvents]::Modules($normal.service.OriginalHost));powershell=([NativeHarnessEvents]::Modules($ps));supervisor=([NativeHarnessEvents]::Modules($supervisor));application=([NativeHarnessEvents]::Modules($runtime))}
  if(-not $consumedModules.powershell.Contains((Join-Path $normal.root 'code/native-job.dll').Replace('/','\'))){throw 'IMMUTABLE_NATIVE_JOB_NOT_LOADED'}
  if($RuntimeOnly){
    $clean=[NativeHarnessEvents]::Line($normal.log,'CLEAN_STOP');$normal.service.Stop();Await $clean|Out-Null;$normal.service.WaitState(1,10000)
    foreach($member in @($ps,$supervisor,$runtime)){if(-not $member.WaitForExit(10000)){throw 'RUNTIME_ORIGINAL_HANDLE_EXIT'}}
    if(-not $normal.service.OriginalHost.WaitForExit(10000)){throw 'RUNTIME_HOST_HANDLE_EXIT'}
    if(Test-Path (Join-Path $normal.root 'data/portal-writer.lock')){throw 'RUNTIME_CLEAN_MARKER_RETAINED'}
    $results.Add(@{case='single-runtime';passed=$true;runtime=$runtimeObject;created=$runtimeCreated;pipeSddl=$pipeSddl;pipeOwnAccess=$pipeAccess;consumedModules=$consumedModules;log=([NativeHarnessEvents]::Read($normal.log));originalHandleExits=@($ps.ExitCode,$supervisor.ExitCode,$runtime.ExitCode)});return
  }
  # The ready IPC state holds both workloads alive until the explicit stop event.
  $sibling=Stage 'sibling'
  $siblingReady=[NativeHarnessEvents]::Line($sibling.log,'ACTUAL_READY');$sibling.service.Start();Await $siblingReady|Out-Null;$sibling.service.CaptureHost()
  $siblingRuntime=[NativeHarnessEvents]::Member($sibling.log,'NATIVE_RUNTIME_PID=');$owned.Add($siblingRuntime)
  $siblingSupervisor=[NativeHarnessEvents]::Member($sibling.log,'NATIVE_BOOTSTRAP_SUPERVISOR_PID=');$owned.Add($siblingSupervisor)
  $peerAccess=@{}
  foreach($direction in @(@($runtime,$sibling),@($siblingRuntime,$normal))){
    foreach($relative in @('code/launch.json','data/originals.sqlite','data/object-right-created','data/storage/token.json')){
      foreach($access in @(0x80000000L,0x40000000L,0x10000L,0x40000L,0x80000L,0xc00d0000L)){
        $path=Join-Path $direction[1].root $relative;$code=[NativeWorkloadToken]::AccessAs($direction[0].Handle,$path,[uint32]$access)
        $peerAccess[($direction[0].Id.ToString()+':'+$path+':'+$access)]=$code;if($code -ne 5){throw 'FILTERED_BIDIRECTIONAL_PRIVATE_ACCESS'}
      }
    }
  }
  $siblingToken=[IO.File]::ReadAllText((Join-Path $sibling.root 'data/storage/token.json'))|ConvertFrom-Json
  foreach($key in @('siblingRead','siblingWrite')){if($siblingToken.checks.$key -notin @('EACCES','EPERM')){throw "SIBLING_ACCESS_$key"}}
  $siblingLog=[NativeHarnessEvents]::Read($sibling.log)
  if(-not $siblingLog.Contains('RAW_PRIVILEGED_PEER_READ=ALLOWED administratorExcluded=True')){throw 'RAW_PRIVILEGED_READ_CONTROL_MISSING'}
  $siblingClean=[NativeHarnessEvents]::Line($sibling.log,'CLEAN_STOP');$sibling.service.Stop();Await $siblingClean|Out-Null;$sibling.service.WaitState(1,10000)
  if(-not $siblingRuntime.WaitForExit(10000) -or -not $siblingSupervisor.WaitForExit(10000)){throw 'SIBLING_ORIGINAL_HANDLE_EXIT'}
  $results.Add(@{case='two-filtered-private-isolation';bothAliveAtChecks=$true;access=$peerAccess;rawPrivilegedRead='ALLOWED_ADMINISTRATOR_EXCLUDED';log=([NativeHarnessEvents]::Read($sibling.log))})
  $clean=[NativeHarnessEvents]::Line($normal.log,'CLEAN_STOP')
  $timer=[Diagnostics.Stopwatch]::StartNew();$normal.service.Stop();$normal.service.Stop();$handlerMs=$timer.ElapsedMilliseconds
  Await $clean|Out-Null;$normal.service.WaitState(1,10000)
  if(-not $supervisor.WaitForExit(10000) -or -not $runtime.WaitForExit(10000)){throw 'NORMAL_MEMBER_EXIT'}
  $normalLog=[NativeHarnessEvents]::Read($normal.log)
  if(([regex]::Matches($normalLog,'STOP_SENT')).Count -ne 1 -or (Test-Path (Join-Path $normal.root 'data/portal-writer.lock'))){throw 'NORMAL_SINGLE_STOP_MARKER'}
  $token=[IO.File]::ReadAllText((Join-Path $normal.root 'data/storage/token.json'))|ConvertFrom-Json
  foreach($key in @('config','permit','code')){if($token.checks.$key -notin @('EACCES','EPERM')){throw "SERVICE_CODE_MUTATION_$key"}}
  $createdObjectAcl=(Get-Acl -LiteralPath (Join-Path $normal.root 'data/storage/token.json')).Sddl
  $results.Add(@{case='normal';handlerControlCallsMs=$handlerMs;singleStop=$true;cleanStop=$true;restrictedSid=([NativeInstallation]::ServiceSid($normal.name));token=$token;ownAccess=$ownAccess;createdObjectSddl=$createdObjectAcl;consumedModules=$consumedModules;log=$normalLog})
  # A consumed immutable action is never reused, including after a clean stop.
  try{$normal.service.Start();$normal.service.WaitState(1,10000)}catch{if($normal.service.Query().State -ne 1){throw}}
  $results.Add(@{case='consumed-permit';stopped=$true;activationLockRetained=(Test-Path (Join-Path $normal.root 'status/activation.lock'))})
  $slow=Stage 'slow'
  $slowReady=[NativeHarnessEvents]::Line($slow.log,'ACTUAL_READY');$slow.service.Start();Await $slowReady|Out-Null;$slow.service.CaptureHost()
  $held=[NativeHarnessEvents]::Line($slow.log,'FIXTURE_STOP_HELD')
  $slowClean=[NativeHarnessEvents]::Line($slow.log,'CLEAN_STOP');$slow.service.Stop();Await $held|Out-Null
  if($slow.service.Query().State -ne 3 -or [NativeHarnessEvents]::Read($slow.log).Contains('CLEAN_STOP')){throw 'SLOW_FALSE_STOPPED'}
  [IO.File]::WriteAllText((Join-Path $slow.root 'data/storage/release'),'RELEASE')
  Await $slowClean|Out-Null;$slow.service.WaitState(1,10000)
  $results.Add(@{case='slow-drain';noFalseStopped=$true;log=([NativeHarnessEvents]::Read($slow.log))})
  $failed=Stage 'failed' 'normal' '' 1000
  $failedReady=[NativeHarnessEvents]::Line($failed.log,'ACTUAL_READY');$failed.service.Start();Await $failedReady|Out-Null;$failed.service.CaptureHost()
  $failedLive=[NativeHarnessEvents]::Line($failed.log,'STOP_FAILED_STILL_LIVE');$failed.service.Stop();Await $failedLive|Out-Null
  $failedState=$failed.service.Query()
  if($failedState.State -ne 3 -or $failedState.Checkpoint -ne 1 -or $failed.service.OriginalHost.HasExited){throw 'FAILED_LIVE_CUSTODY'}
  if(-not (Test-Path (Join-Path $failed.root 'status/activation.lock'))){throw 'FAILED_LIVE_EXCLUSION_LOST'}
  $failed.service.Abort();$failed.service.WaitState(1,10000)
  $results.Add(@{case='failed-live';state=$failedState.State;checkpoint=$failedState.Checkpoint;custodyUntilExplicitAbort=$true;log=([NativeHarnessEvents]::Read($failed.log))})
  $crash=Stage 'crash'
  $crashReady=[NativeHarnessEvents]::Line($crash.log,'ACTUAL_READY');$crash.service.Start();Await $crashReady|Out-Null;$crash.service.CaptureHost()
  $ps=[NativeHarnessEvents]::Member($crash.log,'POWERSHELL_RESUMED=');$owned.Add($ps)
  $sup=[NativeHarnessEvents]::Member($crash.log,'NATIVE_BOOTSTRAP_SUPERVISOR_PID=');$owned.Add($sup)
  $app=[NativeHarnessEvents]::Member($crash.log,'NATIVE_RUNTIME_PID=');$owned.Add($app)
  $crash.service.Abort();$crash.service.WaitState(1,10000)
  foreach($p in @($ps,$sup,$app)){if(-not $p.WaitForExit(10000)){throw 'OUTER_CRASH_DESCENDANT_ALIVE'}}
  if(-not (Test-Path (Join-Path $crash.root 'data/portal-writer.lock'))){throw 'OUTER_CRASH_MARKER_LOST'}
  $crash.service.Start();$crash.service.WaitState(1,10000)
  if(-not (Test-Path (Join-Path $crash.root 'data/portal-writer.lock'))){throw 'CRASH_RESTART_STOLE_MARKER'}
  $results.Add(@{case='ready-host-abort';originalHandleExits=@($ps.ExitCode,$sup.ExitCode,$app.ExitCode);markerRetained=$true;log=([NativeHarnessEvents]::Read($crash.log))})
  $eventName='Global\task22-native-before-resume-'+$harnessId
  $security=[Security.AccessControl.EventWaitHandleSecurity]::new()
  $security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-19'),'FullControl','Allow'))
  $created=$false;$testEvent=[Threading.EventWaitHandle]::new($false,'ManualReset',$eventName,[ref]$created,$security);$events.Add($testEvent)
  $boundary=Stage 'boundary' 'before-resume' $eventName
  $security.AddAccessRule([Security.AccessControl.EventWaitHandleAccessRule]::new([Security.Principal.SecurityIdentifier]::new([NativeInstallation]::ServiceSid($boundary.name)),'FullControl','Allow'));$testEvent.SetAccessControl($security)
  $gate=[NativeHarnessEvents]::Line($boundary.log,'BEFORE_RESUME_GATE');$boundary.service.Start();Await $gate|Out-Null;$boundary.service.CaptureHost()
  $suspended=[NativeHarnessEvents]::Member($boundary.log,'POWERSHELL_CREATED=');$owned.Add($suspended)
  $boundary.service.Abort();$boundary.service.WaitState(1,10000)
  if(-not $suspended.WaitForExit(10000) -or (Test-Path (Join-Path $boundary.root 'data/portal-writer.lock'))){throw 'BEFORE_RESUME_CONTAINMENT'}
  $results.Add(@{case='before-resume-host-abort';originalHandleExit=$suspended.ExitCode;markerAbsent=$true;log=([NativeHarnessEvents]::Read($boundary.log))})
  foreach($fault in @('token-create','token-owner','token-dacl','process-create','job-list','resume')){
    $failure=Stage 'fault' 'normal' '' 10000 $fault
    $failure.service.Start();$failure.service.WaitState(1,10000)
    $failureLog=[NativeHarnessEvents]::Read($failure.log)
    if($failureLog -notmatch 'TOKEN_INJECT_' -or (Test-Path (Join-Path $failure.root 'data/portal-writer.lock'))){throw "TOKEN_FAULT_NOT_CLOSED_$fault"}
    if($fault -eq 'resume' -and -not $failureLog.Contains('CREATED_CHILD_CLEANUP terminated=True terminationError=0 wait=0')){throw 'RESUME_CLEANUP_NOT_PROVEN'}
    $results.Add(@{case=('token-fault-'+$fault);writerNeverStarted=$true;log=$failureLog})
  }
} finally {
  $cleanup=[Collections.Generic.List[object]]::new()
  $cleanupMembers=[Collections.Generic.List[Diagnostics.Process]]::new()
  foreach($root in $roots){
    $path=Join-Path $root 'status/host.log'
    if(Test-Path $path){
      $text=[NativeHarnessEvents]::Read($path)
      foreach($match in [regex]::Matches($text,'(?:POWERSHELL_RESUMED=|MEMBER_HANDLE=)([0-9]+)')){
        try{$member=[Diagnostics.Process]::GetProcessById([int]$match.Groups[1].Value);[void]$member.Handle;$cleanupMembers.Add($member)}catch [ArgumentException]{}
      }
    }
  }
  foreach($service in $services){try{$service.Dispose();$cleanup.Add(@{service=$service.Name;deletedViaOriginalHandle=$true})}catch{$cleanup.Add(@{service=$service.Name;error=$_.Exception.ToString()})}}
  foreach($member in $cleanupMembers){try{if(-not $member.WaitForExit(10000)){throw 'CLEANUP_ORIGINAL_MEMBER_EXIT'}}finally{$member.Dispose()}}
  foreach($process in $owned){try{if(-not $process.WaitForExit(10000)){throw 'CLEANUP_DESCENDANT_ALIVE'}}finally{$process.Dispose()}}
  foreach($event in $events){$event.Dispose()}
  $diagnostics=@($roots|ForEach-Object{$path=Join-Path $_ 'status/host.log';$failure=Join-Path $_ 'status/startup-failure.log';@{root=$_;log=$(if(Test-Path $path){[IO.File]::ReadAllText($path)}else{'NO_HOST_LOG'});failure=$(if(Test-Path $failure){[IO.File]::ReadAllText($failure)}else{''});files=@(Get-ChildItem -LiteralPath $_ -Recurse -File|ForEach-Object{$_.FullName});binaryHashes=@(Get-ChildItem -LiteralPath (Join-Path $_ 'code') -File|Where-Object{$_.Extension -in @('.exe','.dll')}|ForEach-Object{@{path=$_.FullName;sha256=(Hash $_.FullName)}})}})
  foreach($root in $roots){if(Test-Path -LiteralPath $root){Remove-Item -LiteralPath $root -Recurse -Force}}
  foreach($proof in $objectRoots){if(Test-Path -LiteralPath $proof){Remove-Item -LiteralPath $proof -Recurse -Force}}
  Remove-Item -LiteralPath $fixtureRoot -Recurse -Force
  $receipt=[ordered]@{schema='portal-native-service-harness.v2';at=[DateTime]::UtcNow.ToString('o');sourceConfigurations=@($configurations);results=@($results);cleanup=@($cleanup);diagnostics=$diagnostics;rootsAbsent=@(@($roots)+@($objectRoots)|ForEach-Object {@{path=$_;absent=(!(Test-Path -LiteralPath $_))}})}
  [IO.File]::WriteAllText($OutputPath,(ConvertTo-Json -InputObject $receipt -Depth 20),[Text.UTF8Encoding]::new($false))
}
Write-Output ('NATIVE_SERVICE_HARNESS_PASS '+$OutputPath)
