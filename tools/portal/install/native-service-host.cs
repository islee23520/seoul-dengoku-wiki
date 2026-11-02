// Project-specific SCM adapter. Build once in an administrator-owned tree; never
// compile on service startup. No Docker, shell lookup, or database action lives here.
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Microsoft.Win32.SafeHandles;

public static class NativeInstallation {
  [StructLayout(LayoutKind.Sequential)] struct SA { public int Size; public IntPtr Descriptor; public bool Inherit; }
  [StructLayout(LayoutKind.Sequential)] struct FILE_INFO {
    public uint Attributes; public System.Runtime.InteropServices.ComTypes.FILETIME Created, Accessed, Written;
    public uint Volume, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
  }
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool CreateDirectoryW(string path, ref SA security);
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool ConvertStringSecurityDescriptorToSecurityDescriptorW(string text, uint revision, out IntPtr descriptor, out uint length);
  [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr value);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode)] static extern uint GetNamedSecurityInfoW(string name,int type,uint info,out IntPtr owner,out IntPtr group,out IntPtr dacl,out IntPtr sacl,out IntPtr descriptor);
  [DllImport("advapi32.dll")] static extern uint GetSecurityDescriptorLength(IntPtr descriptor);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern SafeFileHandle CreateFileW(string path, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetFileInformationByHandle(SafeFileHandle file, out FILE_INFO info);
  public static int Access(string path,uint access) {using(var file=CreateFileW(path,access,7,IntPtr.Zero,3,0x00200000,IntPtr.Zero))return file.IsInvalid?Marshal.GetLastWin32Error():0;}
  public static string Hash(string path) { using (var stream = File.OpenRead(path)) using (var sha = SHA256.Create()) return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant(); }
  public static void CreateExclusive(string path, string sddl) {
    IntPtr descriptor; uint length;
    if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl, 1, out descriptor, out length)) throw new Win32Exception();
    try { var sa = new SA { Size=Marshal.SizeOf(typeof(SA)), Descriptor=descriptor };
      if (!CreateDirectoryW(path, ref sa)) throw new Win32Exception(Marshal.GetLastWin32Error(), "INSTALL_CREATE_EXCLUSIVE");
    } finally { LocalFree(descriptor); }
  }
  public static SafeFileHandle Pin(string path, bool directory) {
    return PinFile(path,directory,false,false);
  }
  public static void VerifyOriginalDirectory(SafeFileHandle original,string path){
    FILE_INFO owned,opened;
    using(var current=Pin(path,true)){
      if(original==null||original.IsInvalid||original.IsClosed||!GetFileInformationByHandle(original,out owned)||!GetFileInformationByHandle(current,out opened)||
         owned.Volume!=opened.Volume||owned.IndexHigh!=opened.IndexHigh||owned.IndexLow!=opened.IndexLow)throw new Exception("INSTALL_ORIGINAL_ROOT_HANDLE");
    }
  }
  public static SafeFileHandle PinWritableDirectory(string path,string sid) {
    var handle=PinFile(path,true,false,true);
    try {AdmitAcl(path,sid,true,true);return handle;}catch{handle.Dispose();throw;}
  }
  public static SafeFileHandle PinWindowsImage(string path) {
    string windows=Environment.GetFolderPath(Environment.SpecialFolder.Windows);
    if (!Path.GetFullPath(path).StartsWith(windows+"\\",StringComparison.OrdinalIgnoreCase)) throw new Exception("INSTALL_OS_IMAGE_PATH");
    return PinFile(path,false,true,false);
  }
  static SafeFileHandle PinFile(string path, bool directory, bool windowsImage, bool writableDirectory) {
    if (!Path.IsPathRooted(path) || path.IndexOf('"') >= 0 || path.IndexOf('\0') >= 0) throw new Exception("INSTALL_ABSOLUTE_PATH");
    // Sharing is operational compatibility, not authorization. Neither kind
    // permits DELETE sharing: the admitted object cannot be renamed/replaced.
    var handle = CreateFileW(path, 0x80000000, writableDirectory ? 3u : 1u, IntPtr.Zero, 3, 0x00200000 | (directory ? 0x02000000u : 0u), IntPtr.Zero);
    if (handle.IsInvalid) throw new Win32Exception(Marshal.GetLastWin32Error(), "INSTALL_PIN_"+path);
    FILE_INFO info;
    if (!GetFileInformationByHandle(handle, out info) || (info.Attributes & 0x400) != 0 ||
        ((info.Attributes & 0x10) != 0) != directory || (!directory && !windowsImage && info.Links != 1)) {
      handle.Dispose(); throw new Exception("INSTALL_REGULAR_ONE_LINK_"+path);
    }
    return handle;
  }
  public static string ServiceSid(string name) {
    byte[] digest;
    using (var sha = SHA1.Create()) digest = sha.ComputeHash(Encoding.Unicode.GetBytes(name.ToUpperInvariant()));
    var result = new StringBuilder("S-1-5-80");
    for (int n=0;n<5;n++) result.Append('-').Append(BitConverter.ToUInt32(digest,n*4));
    return result.ToString();
  }
  public static void AdmitAcl(string path, string sid, bool writable, bool directory) {
    IntPtr owner,group,dacl,sacl,descriptor;uint error=GetNamedSecurityInfoW(path,1,7,out owner,out group,out dacl,out sacl,out descriptor);
    if(error!=0)throw new Win32Exception((int)error,"INSTALL_ACL_READ");
    try{byte[] bytes=new byte[GetSecurityDescriptorLength(descriptor)];Marshal.Copy(descriptor,bytes,0,bytes.Length);AdmitRawAcl(path,sid,writable,directory,new RawSecurityDescriptor(bytes,0));}finally{LocalFree(descriptor);}
  }
  public static void AdmitAclDescriptor(string path,string sid,bool writable,bool directory,FileSystemSecurity acl) {
    AdmitRawAcl(path,sid,writable,directory,new RawSecurityDescriptor(acl.GetSecurityDescriptorBinaryForm(),0));
  }
  public static void AdmitRawAcl(string path,string sid,bool writable,bool directory,RawSecurityDescriptor acl){
    string owner = acl.Owner.Value;
    if (owner != "S-1-5-18" && owner != "S-1-5-32-544") throw new Exception("INSTALL_OWNER_"+path);
    if ((acl.ControlFlags&ControlFlags.DiscretionaryAclProtected)==0 && directory) throw new Exception("INSTALL_INHERITANCE_"+path);
    bool service = false,imageRead=false;
    bool sharedRoot=directory&&!writable&&sid==ServiceSid("seoul-dengoku-tools-portal-native")&&String.Equals(path.Replace('/','\\').TrimEnd('\\'),@"E:\portal-authority",StringComparison.OrdinalIgnoreCase);
    if(acl.DiscretionaryAcl==null)throw new Exception("INSTALL_ACL_NULL_"+path);
    foreach (GenericAce raw in acl.DiscretionaryAcl) {
      var ace=raw as CommonAce;
      if(ace==null||ace.IsCallback||ace.AceQualifier!=AceQualifier.AccessAllowed)throw new Exception("INSTALL_ACL_DENY_"+path);
      string principal = ace.SecurityIdentifier.Value;
      if (principal == "S-1-5-18" || principal == "S-1-5-32-544") continue;
      if (writable && principal == "S-1-3-4" && ace.AccessMask == 0x20000) continue;
      if (principal != sid) {
        uint mask=unchecked((uint)ace.AccessMask);
        if(!sharedRoot||imageRead||principal!=ServiceSid("seoul-dengoku-tools-image-native")||mask==0||(mask&~0x801200a9u)!=0)throw new Exception("INSTALL_FOREIGN_ACE_"+path);
        imageRead=true;continue;
      }
      service = true;
      long allowed = writable ? 0x1301bf : 0x1200a9;
      if (((long)unchecked((uint)ace.AccessMask) & ~allowed) != 0) throw new Exception("INSTALL_SERVICE_RIGHTS_"+path);
    }
    if (!service) throw new Exception("INSTALL_SERVICE_SID_"+path);
  }
  public static void AdmitVolumeRoot(string path) {
    var acl = Directory.GetAccessControl(path);
    string owner = acl.GetOwner(typeof(SecurityIdentifier)).Value;
    if (owner != "S-1-5-18" && owner != "S-1-5-32-544") throw new Exception("INSTALL_VOLUME_OWNER");
    foreach (FileSystemAccessRule ace in acl.GetAccessRules(true,true,typeof(SecurityIdentifier))) {
      if ((ace.PropagationFlags & PropagationFlags.InheritOnly) != 0 || ace.AccessControlType != AccessControlType.Allow) continue;
      if (ace.IdentityReference.Value == "S-1-5-18" || ace.IdentityReference.Value == "S-1-5-32-544") continue;
      if (((long)ace.FileSystemRights & 0xc0040) != 0) throw new Exception("INSTALL_VOLUME_REPLACEMENT_RIGHTS");
    }
  }
}

// Administrative activation authority is distinct from synthetic qualification.
// The operator pins the RSA public key in the immutable installation manifest.
public sealed class NativeServiceProfile {
  public readonly string Name,Service,Root,Authority,Schema;
  NativeServiceProfile(string name,string service,string root,string authority,string schema){Name=name;Service=service;Root=root;Authority=authority;Schema=schema;}
  public string Sid {get{return NativeInstallation.ServiceSid(Service);}}
  public static readonly NativeServiceProfile Portal=new NativeServiceProfile("portal","seoul-dengoku-tools-portal-native",@"E:\portal-authority",@"E:\portal-authority\data\originals.sqlite","portal-production-activation.v1");
  public static readonly NativeServiceProfile Image=new NativeServiceProfile("image","seoul-dengoku-tools-image-native",@"E:\portal-authority\image",@"E:\portal-authority\image\authority\tools-unfinished-deferred-owner1-image-five-attempts\authority.bin","image-production-activation.v1");
  public const string ImageBinarySha256="a243a1b006b91eddb807b41cd3bc5643bfd287805df49a8787c389e122d1c834";
  public const string ImageSourceSha="4952bcad53eaf2e18206283890b3dee0ec5907ed";
  public static NativeServiceProfile Select(string service,string root,string sid){
    foreach(var profile in new[]{Portal,Image})if(service==profile.Service&&String.Equals(root.Replace('/','\\').TrimEnd('\\'),profile.Root,StringComparison.OrdinalIgnoreCase)&&sid==profile.Sid)return profile;
    throw new Exception("SERVICE_PROFILE_BINDING");
  }
}

public static class NativeStartupAttestor {
  static readonly JavaScriptSerializer Json=new JavaScriptSerializer();
  public static string Field(Dictionary<string,object> value,string key){object result;if(!value.TryGetValue(key,out result)||!(result is string))throw new Exception("ATTEST_FIELD_"+key);return (string)result;}
  public static string Digest(byte[] bytes){using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
  public static DateTime Time(string value){DateTime time;if(!DateTime.TryParseExact(value,"o",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.RoundtripKind,out time)||time.Kind!=DateTimeKind.Utc)throw new Exception("ATTEST_TIME");return time;}
  static Dictionary<string,object> WriterMap(object value,string location){
    var map=new Dictionary<string,object>(StringComparer.Ordinal);
    var generic=value as IDictionary<string,object>;
    if(generic!=null){foreach(KeyValuePair<string,object> entry in generic)map.Add(entry.Key,entry.Value);return map;}
    var dictionary=value as IDictionary;
    if(dictionary!=null){foreach(DictionaryEntry entry in dictionary){var key=entry.Key as string;if(key==null)throw new Exception("ATTEST_WRITERS_SHAPE_"+location+"_nonstring_key");map.Add(key,entry.Value);}return map;}
    throw new Exception("ATTEST_WRITERS_SHAPE_"+location+"_expected_dictionary");
  }
  static void CollectWriterRows(object value,List<Dictionary<string,object>> rows,int depth){
    if(depth>8)throw new Exception("ATTEST_WRITERS_SHAPE_nesting_limit");
    var list=value as IList;
    if(list!=null){foreach(object entry in list)CollectWriterRows(entry,rows,depth+1);return;}
    var map=WriterMap(value,"rows");
    if(map.ContainsKey("value")||map.ContainsKey("Count")){
      object nested,count;
      if(map.Count!=2||!map.TryGetValue("value",out nested)||!map.TryGetValue("Count",out count)||!(count is int)||(int)count<0)throw new Exception("ATTEST_WRITERS_SHAPE_wrapper");
      int before=rows.Count;CollectWriterRows(nested,rows,depth+1);
      if(rows.Count-before!=(int)count)throw new Exception("ATTEST_WRITERS_SHAPE_count_mismatch");return;
    }
    if(map.ContainsKey("pid")){
      if(map.Count!=5)throw new Exception("ATTEST_WRITERS_SHAPE_row_fields");
      foreach(string key in new[]{"pid","imageName","startUtcTicks","imageSha256","sid"})if(!map.ContainsKey(key))throw new Exception("ATTEST_WRITERS_SHAPE_row_missing_"+key);
      rows.Add(map);return;
    }
    if(map.Count==0)throw new Exception("ATTEST_WRITERS_SHAPE_empty_dictionary");
    // Named row dictionaries are enumerated as entries, never cast to rows.
    foreach(KeyValuePair<string,object> entry in map)CollectWriterRows(entry.Value,rows,depth+1);
  }
  public static List<Dictionary<string,object>> WriterRows(Dictionary<string,object> activation){
    object fenceValue,writers;
    if(activation==null||!activation.TryGetValue("fence",out fenceValue))throw new Exception("ATTEST_WRITERS_SHAPE_missing_fence");
    var fence=WriterMap(fenceValue,"fence");if(!fence.TryGetValue("writers",out writers))throw new Exception("ATTEST_WRITERS_SHAPE_missing_writers");
    var rows=new List<Dictionary<string,object>>();CollectWriterRows(writers,rows,0);return rows;
  }
  public static string WriterDigest(Dictionary<string,object> activation){
    var rows=new List<string>();var pids=new HashSet<int>();
    foreach(var writer in WriterRows(activation)){
      int pid;if(!Int32.TryParse(Field(writer,"pid"),out pid)||pid<=0||!pids.Add(pid))throw new Exception("ATTEST_WRITER_PID");
      string name=Field(writer,"imageName");if(!System.Text.RegularExpressions.Regex.IsMatch(name,@"^[A-Za-z0-9_.-]+\.exe$"))throw new Exception("ATTEST_WRITER_NAME");
      long ticks;if(!Int64.TryParse(Field(writer,"startUtcTicks"),out ticks)||ticks<=0||!System.Text.RegularExpressions.Regex.IsMatch(Field(writer,"imageSha256"),@"^[a-f0-9]{64}$")||!System.Text.RegularExpressions.Regex.IsMatch(Field(writer,"sid"),@"^S-1-5-21-[0-9]+-[0-9]+-[0-9]+-[0-9]+$"))throw new Exception("ATTEST_WRITER_IDENTITY");
      rows.Add(pid.ToString(System.Globalization.CultureInfo.InvariantCulture)+"|"+name.ToLowerInvariant()+"|"+Field(writer,"startUtcTicks")+"|"+Field(writer,"imageSha256")+"|"+Field(writer,"sid"));
    }
    if(rows.Count==0)throw new Exception("ATTEST_WRITERS_EMPTY");rows.Sort(StringComparer.Ordinal);return Digest(Encoding.UTF8.GetBytes(String.Join("\n",rows)));
  }
  public static void VerifyWriterSet(Dictionary<string,object> activation,Dictionary<int,string> current){
    var expected=new Dictionary<int,string>();var names=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach(var writer in WriterRows(activation)){string name=Field(writer,"imageName");expected.Add(Int32.Parse(Field(writer,"pid")),name);names.Add(name);}
    foreach(var row in current){string name;if(expected.TryGetValue(row.Key,out name)){if(!String.Equals(name,row.Value,StringComparison.OrdinalIgnoreCase))throw new Exception("ATTEST_WRITER_CHANGED");expected.Remove(row.Key);}else if(names.Contains(row.Value))throw new Exception("ATTEST_UNEXPECTED_WRITER");}
    if(expected.Count!=0)throw new Exception("ATTEST_WRITER_ABSENT");
  }
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct PROCESSENTRY {public uint Size,Usage,Pid;public UIntPtr Heap;public uint Module,Threads,Parent;public int Priority;public uint Flags;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=260)]public string Exe;}
  [DllImport("kernel32.dll",SetLastError=true)] static extern SafeFileHandle CreateToolhelp32Snapshot(uint flags,uint pid);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool Process32FirstW(SafeFileHandle snapshot,ref PROCESSENTRY entry);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool Process32NextW(SafeFileHandle snapshot,ref PROCESSENTRY entry);
  public static Dictionary<int,string> EnumerateWriters(){
    var result=new Dictionary<int,string>();using(var snapshot=CreateToolhelp32Snapshot(2,0)){
      if(snapshot.IsInvalid)throw new Win32Exception(Marshal.GetLastWin32Error(),"ATTEST_ENUMERATION");var entry=new PROCESSENTRY{Size=(uint)Marshal.SizeOf(typeof(PROCESSENTRY))};
      if(!Process32FirstW(snapshot,ref entry))throw new Win32Exception(Marshal.GetLastWin32Error(),"ATTEST_ENUMERATION");
      do{result.Add((int)entry.Pid,entry.Exe);}while(Process32NextW(snapshot,ref entry));
      if(Marshal.GetLastWin32Error()!=18)throw new Win32Exception(Marshal.GetLastWin32Error(),"ATTEST_ENUMERATION");
    }return result;
  }
  public static void ProbeWriters(Dictionary<string,object> activation,NativeServiceProfile profile){
    string stage="writer-digest";Dictionary<int,string> before=null,after=null;Dictionary<string,object> active=null;List<Dictionary<string,object>> expected=null;
    try{
      WriterDigest(activation);expected=WriterRows(activation);stage="writer-set-before";before=EnumerateWriters();VerifyWriterSet(activation,before);
      foreach(var writer in WriterRows(activation)){
        stage="writer-probe";active=writer;var fence=WriterMap(activation["fence"],"fence");
        fence["containerHostPid"]=Field(writer,"pid");fence["containerHostStartUtcTicks"]=Field(writer,"startUtcTicks");fence["containerHostImageSha256"]=Field(writer,"imageSha256");fence["containerHostSid"]=Field(writer,"sid");
        var bound=new Dictionary<string,object>(activation);bound["fence"]=fence;
        NativeProductionActivation.VerifyProfileOldWriterProcess(bound,profile);
      }
      stage="writer-set-after";active=null;after=EnumerateWriters();VerifyWriterSet(activation,after);
    }catch(Exception error){
      error.Data["stage"]=stage;error.Data["beforeIdentities"]=WriterIdentities(before);error.Data["afterIdentities"]=WriterIdentities(after);
      error.Data["writer"]=active;error.Data["expectedIdentities"]=expected;throw;
    }
  }
  static object WriterIdentities(Dictionary<int,string> snapshot){
    if(snapshot==null)return null;var rows=new List<Dictionary<string,object>>();
    foreach(var entry in snapshot)rows.Add(new Dictionary<string,object>{{"pid",entry.Key},{"imageName",entry.Value}});
    rows.Sort((a,b)=>((int)a["pid"]).CompareTo((int)b["pid"]));return rows;
  }
  public static Dictionary<string,object> ProbeDiagnostic(string stage,Action probe){
    try{probe();return new Dictionary<string,object>{{"status","PASS"},{"failure",null}};}
    catch(Exception caught){
      Exception error=caught;while(error.InnerException!=null)error=error.InnerException;
      var failure=new Dictionary<string,object>{{"stage",error.Data.Contains("stage")?error.Data["stage"]:stage},{"exceptionType",error.GetType().FullName},{"message",error.Message},{"hresult",error.HResult},{"beforeIdentities",error.Data["beforeIdentities"]},{"afterIdentities",error.Data["afterIdentities"]},{"expectedIdentities",error.Data["expectedIdentities"]},{"writer",error.Data["writer"]}};
      return new Dictionary<string,object>{{"status","FAIL"},{"failure",failure}};
    }
  }
  public static string ProbeStatus(Action probe){return (string)ProbeDiagnostic("probe",probe)["status"];}
  public static void PublishResult(string path,byte[] envelope,string sid){
    NativeServiceProfile profile=null;
    foreach(var candidate in new[]{NativeServiceProfile.Portal,NativeServiceProfile.Image})if(sid==candidate.Sid&&String.Equals(Path.GetDirectoryName(path),Path.Combine(candidate.Root,"status","attestations"),StringComparison.OrdinalIgnoreCase))profile=candidate;
    NativePrivateDesktop broker=null;EventWaitHandle acquired=null,released=null;
    try{
      if(profile!=null){
        var signed=Json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(envelope));var result=Json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(Convert.FromBase64String(Field(signed,"payload"))));
        string nonce=Field(result,"nonce");
        if(!System.Text.RegularExpressions.Regex.IsMatch(nonce,@"^[a-f0-9]{32}$")||Path.GetFileName(path)!=nonce+".json")throw new Exception("PRIVATE_BROKER_NONCE");
        if(Field(result,"status")=="PASS"){
          var security=new EventWaitHandleSecurity();security.SetSecurityDescriptorSddlForm("O:SYG:SYD:P(A;;GA;;;SY)(A;;GA;;;BA)(A;;0x2;;;"+sid+")");bool created;
          acquired=new EventWaitHandle(false,EventResetMode.ManualReset,"Global\\NativeStation_"+nonce,out created,security);if(!created)throw new Exception("PRIVATE_BROKER_EVENT_COLLISION");
          var releaseSecurity=new EventWaitHandleSecurity();releaseSecurity.SetSecurityDescriptorSddlForm("O:SYG:SYD:P(A;;GA;;;SY)(A;;GA;;;BA)(A;;0x100000;;;"+sid+")");
          released=new EventWaitHandle(false,EventResetMode.ManualReset,"Global\\NativeStationReleased_"+nonce,out created,releaseSecurity);if(!created)throw new Exception("PRIVATE_BROKER_EVENT_COLLISION");
          broker=NativePrivateDesktop.CreateBroker((profile.Name=="portal"?"PortalProduction_":"ImageProduction_")+nonce,sid);
        }
      }
      PublishBytes(path,envelope,sid);
      if(acquired!=null){if(!acquired.WaitOne(60000))throw new Exception("PRIVATE_BROKER_HANDOFF_TIMEOUT");broker.ReleaseBroker();broker=null;released.Set();}
    }finally{if(broker!=null)broker.ReleaseBroker();if(acquired!=null)acquired.Dispose();if(released!=null)released.Dispose();}
  }
  static void PublishBytes(string path,byte[] envelope,string sid){
    var acl=new FileSecurity();acl.SetSecurityDescriptorSddlForm("O:BAG:BAD:P(A;;FA;;;SY)(A;;FA;;;BA)(A;;0x1200a9;;;"+sid+")");
    // Exclusive final-path creation, never rename or adopt a historical file.
    using(var file=new FileStream(path,FileMode.CreateNew,FileSystemRights.Write,FileShare.Read,4096,FileOptions.WriteThrough,acl)){
      file.Write(envelope,0,envelope.Length);file.Flush(true);
    }
    using(var pin=NativeInstallation.Pin(path,false)){
      NativeInstallation.AdmitAcl(path,sid,false,false);
      // Creation is the completion signal: all signed bytes are closed and pinned.
      using(var ready=new FileStream(path+".ready",FileMode.CreateNew,FileSystemRights.Write,FileShare.Read,4096,FileOptions.WriteThrough,acl)){ready.Flush(true);}
    }
  }
  public static void AwaitResult(string path,AutoResetEvent changed,Stopwatch clock,Func<Exception> watchFailure){
    while(!File.Exists(path+".ready")){
      int remaining=60000-(int)clock.ElapsedMilliseconds;if(remaining<=0||!changed.WaitOne(remaining))throw new Exception("ATTEST_RESULT_TIMEOUT");
      var failure=watchFailure();if(failure!=null)throw new Exception("ATTEST_WATCH_FAILED",failure);
    }
    if(clock.ElapsedMilliseconds>=60000)throw new Exception("ATTEST_RESULT_TIMEOUT");
  }
  public static Dictionary<string,object> VerifyResult(byte[] envelope,string publicKey,string keyHash,string activationHash,string nonce,string writers,DateTime requested,DateTime now,long elapsedMs){
    if(envelope==null||envelope.Length==0)throw new Exception("ATTEST_RESULT_ABSENT");
    if(elapsedMs>=60000||now<requested||now-requested>=TimeSpan.FromSeconds(60))throw new Exception("ATTEST_LATE");
    if(Digest(Encoding.UTF8.GetBytes(publicKey))!=keyHash)throw new Exception("ATTEST_KEY_HASH");
    var signed=Json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(envelope));byte[] payload=Convert.FromBase64String(Field(signed,"payload")),signature=Convert.FromBase64String(Field(signed,"signature"));
    using(var rsa=new RSACryptoServiceProvider()){rsa.PersistKeyInCsp=false;rsa.FromXmlString(publicKey);if(rsa.KeySize<3072||!rsa.VerifyData(payload,CryptoConfig.MapNameToOID("SHA256"),signature))throw new Exception("ATTEST_SIGNATURE");}
    var result=Json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(payload));
    if(Field(result,"schema")!="native-startup-fence.v1"||Field(result,"activationSha256")!=activationHash||Field(result,"nonce")!=nonce||Field(result,"writerSetSha256")!=writers||Field(result,"requestedUtc")!=requested.ToString("o"))throw new Exception("ATTEST_BINDING");
    DateTime issued=Time(Field(result,"issuedUtc")),expires=Time(Field(result,"expiresUtc"));
    if(issued<requested||issued>now||expires<=now||expires<=issued||expires-issued>TimeSpan.FromSeconds(60))throw new Exception("ATTEST_EXPIRED");
    if(Field(result,"status")!="PASS")throw new Exception("ATTEST_PROBE_FAILED");return result;
  }
  public static object Com(object value,string name,System.Reflection.BindingFlags flags,params object[] args){return value.GetType().InvokeMember(name,flags,null,value,args);}
  public static Dictionary<string,object> Config(NativeServiceProfile profile,Dictionary<string,object> activation,List<IDisposable> pins){
    string path=Path.Combine(profile.Root,"action","attestor.json");pins.Add(NativeInstallation.Pin(path,false));NativeInstallation.AdmitAcl(path,profile.Sid,false,false);
    if(NativeInstallation.Hash(path)!=Field(activation,"attestorConfigSha256"))throw new Exception("ATTEST_CONFIG_HASH");
    var config=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(path));
    if(Field(config,"serviceName")!=profile.Service||Field(config,"root")!=profile.Root||Field(config,"taskName")!="\\"+profile.Service+"-startup-attestor")throw new Exception("ATTEST_CONFIG_BINDING");
    string key=Path.Combine(profile.Root,"action","attestor-public-key.xml");pins.Add(NativeInstallation.Pin(key,false));NativeInstallation.AdmitAcl(key,profile.Sid,false,false);
    if(NativeInstallation.Hash(key)!=Field(config,"publicKeySha256"))throw new Exception("ATTEST_KEY_HASH");
    return config;
  }
  public static NativePrivateDesktop Request(NativeServiceProfile profile,Dictionary<string,object> activation,string activationHash,List<IDisposable> pins){
    var config=Config(profile,activation,pins);string writers=WriterDigest(activation),nonce=Guid.NewGuid().ToString("N");DateTime requested=DateTime.UtcNow;var clock=Stopwatch.StartNew();
    string directory=Path.Combine(profile.Root,"status","attestations");pins.Add(NativeInstallation.Pin(directory,true));NativeInstallation.AdmitAcl(directory,profile.Sid,false,true);
    string resultPath=Path.Combine(directory,nonce+".json"),request=Path.Combine(profile.Root,"status","startup-request.json");
    var body=new Dictionary<string,object>{{"schema","native-startup-request.v1"},{"nonce",nonce},{"activationSha256",activationHash},{"writerSetSha256",writers},{"requestedUtc",requested.ToString("o")}};
    // CreateNew request is a durable one-start guard, retained even on failure.
    using(var file=new FileStream(request,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){byte[] bytes=Encoding.UTF8.GetBytes(Json.Serialize(body));file.Write(bytes,0,bytes.Length);file.Flush(true);}
    using(var requestPin=NativeInstallation.Pin(request,false))using(var changed=new AutoResetEvent(false))using(var watcher=new FileSystemWatcher(directory,nonce+".json.ready")){
      watcher.NotifyFilter=NotifyFilters.FileName;watcher.Created+=(s,e)=>changed.Set();watcher.Renamed+=(s,e)=>changed.Set();Exception watchFailure=null;watcher.Error+=(s,e)=>{watchFailure=e.GetException();changed.Set();};watcher.EnableRaisingEvents=true;
      object scheduler=null,folder=null,task=null,running=null;
      try{
        scheduler=Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service"));Com(scheduler,"Connect",System.Reflection.BindingFlags.InvokeMethod);
        folder=Com(scheduler,"GetFolder",System.Reflection.BindingFlags.InvokeMethod,"\\");task=Com(folder,"GetTask",System.Reflection.BindingFlags.InvokeMethod,Field(config,"taskName"));
        string xml=(string)Com(task,"Xml",System.Reflection.BindingFlags.GetProperty);
        if(Digest(Encoding.UTF8.GetBytes(xml))!=Field(config,"taskXmlSha256"))throw new Exception("ATTEST_TASK_DRIFT");
        running=Com(task,"Run",System.Reflection.BindingFlags.InvokeMethod,new object[]{null});
        AwaitResult(resultPath,changed,clock,()=>watchFailure);
        using(var resultPin=NativeInstallation.Pin(resultPath,false)){
          NativeInstallation.AdmitAcl(resultPath,profile.Sid,false,false);
          VerifyResult(File.ReadAllBytes(resultPath),File.ReadAllText(Path.Combine(profile.Root,"action","attestor-public-key.xml")),Field(config,"publicKeySha256"),activationHash,nonce,writers,requested,DateTime.UtcNow,clock.ElapsedMilliseconds);
          if(Time(Field(activation,"expiresUtc"))<=DateTime.UtcNow)throw new Exception("ATTEST_ACTIVATION_EXPIRED");
        }
        var context=NativePrivateDesktop.AcquireBroker((profile.Name=="portal"?"PortalProduction_":"ImageProduction_")+nonce,profile.Sid);
        try{using(var released=EventWaitHandle.OpenExisting("Global\\NativeStationReleased_"+nonce,EventWaitHandleRights.Synchronize)){
          using(var acquired=EventWaitHandle.OpenExisting("Global\\NativeStation_"+nonce,EventWaitHandleRights.Modify))acquired.Set();
          int remaining=60000-(int)clock.ElapsedMilliseconds;if(remaining<=0||!released.WaitOne(remaining))throw new Exception("PRIVATE_BROKER_RELEASE_TIMEOUT");
        }return context;}
        catch{context.ReleaseBroker();throw;}
      }finally{foreach(object value in new[]{running,task,folder,scheduler})if(value!=null&&Marshal.IsComObject(value))Marshal.FinalReleaseComObject(value);}
    }
  }
}

public static class NativeProductionActivation {
  public const string Kind="PRODUCTION_REVIEWED";
  public const string Service="seoul-dengoku-tools-portal-native";
  public const string Root=@"E:\portal-authority";
  public const string Database=@"E:\portal-authority\data\originals.sqlite";
  public const string Profile="production-dedicated-filtered.v1";
  public const string OwnerReference=".omo/evidence/tools-unfinished-deferred/f/cpa-model-id-shipping.json";
  public static readonly Dictionary<string,string> Candidate=new Dictionary<string,string>{
    {"server.mjs","a6fd0b00370b699144c80bb5d0d851412f30c1a36c5748783334c0f0599eb409"},
    {"release-manifest.json","8c0afe02b24e3df17195a8ff188504e3db5ce247669bc5fe0cbbbc6525e09233"},
    {"ssstool-manifest.json","b5a15b17ac46e6cb2a0b0b98a13de091f9466e15fb8bc8736ee79733fa07d383"},
    {"ssstool-release.tar","b5acd94dba88d56fd858fde85f93a9860f349b874c4e5b8ef4f89bec272ba5f3"},
    {"ssstool-release.zip","9b951e80da7f2028a78dbaac7a157d31404dbd8ebd3365125796f12ca4b194bd"}
  };
  static string S(Dictionary<string,object> value,string key){object found;if(!value.TryGetValue(key,out found)||!(found is string))throw new Exception("ACTIVATION_FIELD_"+key);return (string)found;}
  static void Equal(Dictionary<string,object> value,string key,string expected){if(S(value,key)!=expected)throw new Exception("ACTIVATION_BINDING_"+key);}
  static string Digest(byte[] bytes){using(var hash=SHA256.Create())return BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
  public static Dictionary<string,object> VerifyRecord(byte[] envelope,string expectedHash,string publicKey,string publicKeyHash,string installationHash,string ownerHash,string actionId,DateTime now){
    return VerifyProfileRecord(envelope,expectedHash,publicKey,publicKeyHash,installationHash,ownerHash,actionId,now,NativeServiceProfile.Portal);
  }
  public static Dictionary<string,object> VerifyProfileRecord(byte[] envelope,string expectedHash,string publicKey,string publicKeyHash,string installationHash,string ownerHash,string actionId,DateTime now,NativeServiceProfile selected){
    if(!System.Text.RegularExpressions.Regex.IsMatch(expectedHash??"",@"^[a-f0-9]{64}$")||Digest(envelope)!=expectedHash)throw new Exception("ACTIVATION_RECORD_HASH");
    if(Digest(Encoding.UTF8.GetBytes(publicKey))!=publicKeyHash)throw new Exception("ACTIVATION_KEY_HASH");
    var json=new JavaScriptSerializer();var signed=json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(envelope));
    byte[] payload=Convert.FromBase64String(S(signed,"payload")),signature=Convert.FromBase64String(S(signed,"signature"));
    using(var rsa=new RSACryptoServiceProvider()){
      rsa.PersistKeyInCsp=false;rsa.FromXmlString(publicKey);
      if(rsa.KeySize<3072||!rsa.VerifyData(payload,CryptoConfig.MapNameToOID("SHA256"),signature))throw new Exception("ACTIVATION_SIGNATURE");
    }
    var record=json.Deserialize<Dictionary<string,object>>(Encoding.UTF8.GetString(payload));
    Equal(record,"schema",selected.Schema);Equal(record,"kind",Kind);Equal(record,"serviceName",selected.Service);
    Equal(record,"serviceSid",selected.Sid);Equal(record,"root",selected.Root);
    if(selected==NativeServiceProfile.Portal){
      Equal(record,"database",Database);
      foreach(string field in new[]{"authority","gatewaySha256","gatewaySourceSha","imagePrincipalSha256","imageConfigSha256","bindingSha256","seedReceiptSha256"})if(record.ContainsKey(field))throw new Exception("ACTIVATION_PROFILE_CONFUSION");
    }else{
      foreach(string field in new[]{"database","releaseId","candidate"})if(record.ContainsKey(field))throw new Exception("ACTIVATION_PROFILE_CONFUSION");
      Equal(record,"authority",selected.Authority);Equal(record,"gatewaySha256",NativeServiceProfile.ImageBinarySha256);Equal(record,"gatewaySourceSha",NativeServiceProfile.ImageSourceSha);
      Equal(record,"imagePrincipalSha256","3b7cc631766834ba19dafc13336bdb76fc9fdbb12b94093769af242d8ac3fc27");
      Equal(record,"bindingSha256","871ec37f601dfd66d992b119b835087715549cde3287a0d9c00b64f6e821e1be");
      Equal(record,"seedReceiptSha256","cf132acb8320583124229656800e3d0ae4b3b34aaf6ac652c571b9cf7b4351e6");
      if(!System.Text.RegularExpressions.Regex.IsMatch(S(record,"imageConfigSha256"),@"^[a-f0-9]{64}$"))throw new Exception("ACTIVATION_IMAGE_CONFIG_HASH");
    }
    Equal(record,"tokenProfile",Profile);Equal(record,"installationSha256",installationHash);Equal(record,"actionId",actionId);
    Equal(record,"ownerDecisionReference",selected==NativeServiceProfile.Portal?OwnerReference:".omo/evidence/tools-unfinished-deferred/f/q4-native-install-result.json");Equal(record,"ownerDecisionSha256",ownerHash);Equal(record,"ownerDirectiveDate",selected==NativeServiceProfile.Portal?"2026-10-19":"2026-10-18");
    Equal(record,"decision","APPROVE_EXECUTION");
    if(selected==NativeServiceProfile.Portal)Equal(record,"releaseId","4f5df498c7cdabc09e3db6efed40667f6326d680250a9dc5efe3bf7b25f122cb");
    DateTime expires,issued;
    if(!DateTime.TryParseExact(S(record,"issuedUtc"),"o",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.RoundtripKind,out issued)||
       !DateTime.TryParseExact(S(record,"expiresUtc"),"o",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.RoundtripKind,out expires)||
       issued.Kind!=DateTimeKind.Utc||expires.Kind!=DateTimeKind.Utc||issued>now||expires<=now||expires-issued>TimeSpan.FromHours(1))throw new Exception("ACTIVATION_WINDOW");
    if(selected==NativeServiceProfile.Portal){var files=record["candidate"] as Dictionary<string,object>;
      if(files==null||files.Count!=Candidate.Count)throw new Exception("ACTIVATION_CANDIDATE_VECTOR");
      foreach(var file in Candidate)Equal(files,file.Key,file.Value);}
    var fence=record["fence"] as Dictionary<string,object>;
    if(fence==null)throw new Exception("FENCE_UNPROVEN");
    foreach(string check in new[]{"canonicalAcl","ancestorReplacementDenied","containerPathExcluded","containerIdentityDenied","soleApplicationWriter"})Equal(fence,check,"PASS");
    if(!System.Text.RegularExpressions.Regex.IsMatch(S(fence,"containerId"),@"^[a-f0-9]{64}$")||
       !System.Text.RegularExpressions.Regex.IsMatch(S(fence,"containerInspectSha256"),@"^[a-f0-9]{64}$"))throw new Exception("FENCE_CONTAINER_BINDING");
    string oldSid=S(fence,"containerHostSid");
    if(!System.Text.RegularExpressions.Regex.IsMatch(oldSid,@"^S-1-5-21-[0-9]+-[0-9]+-[0-9]+-[0-9]+$")||oldSid==selected.Sid)throw new Exception("FENCE_CONTAINER_IDENTITY");
    Equal(fence,"containerHostAdministrator","false");Equal(fence,"containerHostBackupRestorePrivileges","false");
    return record;
  }
  public static void VerifyContainer(string inspectJson,string containerId){VerifyProfileContainer(inspectJson,containerId,NativeServiceProfile.Portal);}
  public static void VerifyProfileContainer(string inspectJson,string containerId,NativeServiceProfile selected){
    var rows=new JavaScriptSerializer().Deserialize<object[]>(inspectJson);
    if(rows.Length!=1)throw new Exception("FENCE_CONTAINER_COUNT");
    var value=(Dictionary<string,object>)rows[0];Equal(value,"Id",containerId);
    var host=(Dictionary<string,object>)value["HostConfig"];
    if(!(host["Privileged"] is bool)|| (bool)host["Privileged"])throw new Exception("FENCE_PRIVILEGED_CONTAINER");
    if(host["VolumesFrom"]!=null&&((object[])host["VolumesFrom"]).Length!=0)throw new Exception("FENCE_VOLUMES_FROM");
    foreach(Dictionary<string,object> mount in (IEnumerable)value["Mounts"]){
      string source=S(mount,"Source").Replace('\\','/').TrimEnd('/').ToLowerInvariant();
      string suffix=selected==NativeServiceProfile.Image?"/image":"";
      foreach(string authority in new[]{"e:/portal-authority"+suffix,"/e/portal-authority"+suffix,"/host_mnt/e/portal-authority"+suffix,"/run/desktop/mnt/host/e/portal-authority"+suffix})
        if(source==""||source=="/"||source==authority||authority.StartsWith(source+"/",StringComparison.Ordinal)||source.StartsWith(authority+"/",StringComparison.Ordinal))throw new Exception("FENCE_CANONICAL_MOUNT");
      if(source.IndexOf("docker.sock",StringComparison.Ordinal)>=0||source.IndexOf("docker_engine",StringComparison.Ordinal)>=0)throw new Exception("FENCE_DOCKER_CONTROL_MOUNT");
    }
  }
  public static void VerifyDatabaseAcl(string sddl,string sid,bool directory){
    var acl=new RawSecurityDescriptor(sddl);
    if(acl.Owner==null||(acl.Owner.Value!="S-1-5-18"&&acl.Owner.Value!="S-1-5-32-544")||acl.DiscretionaryAcl==null||
       (acl.ControlFlags&ControlFlags.DiscretionaryAclProtected)==0)throw new Exception("FENCE_ACL_OWNER_PROTECTION");
    bool service=false,ownerRights=false;
    foreach(GenericAce raw in acl.DiscretionaryAcl){
      var ace=raw as CommonAce;
      if(ace==null||ace.IsCallback||ace.AceQualifier!=AceQualifier.AccessAllowed)throw new Exception("FENCE_ACL_TYPE");
      string principal=ace.SecurityIdentifier.Value;uint mask=unchecked((uint)ace.AccessMask);
      if(principal=="S-1-5-18"||principal=="S-1-5-32-544")continue;
      if(principal=="S-1-3-4"&&mask==0x20000){ownerRights=true;continue;}
      if(principal!=sid||(mask&~0x1301bfu)!=0)throw new Exception("FENCE_FOREIGN_OR_CONTROL_RIGHTS");
      if((ace.AceFlags&AceFlags.InheritOnly)==0&&(mask&0x12019f)==0x12019f&&(!directory||(ace.AceFlags&(AceFlags.ContainerInherit|AceFlags.ObjectInherit))==(AceFlags.ContainerInherit|AceFlags.ObjectInherit)))service=true;
    }
    if(!service||!ownerRights)throw new Exception("FENCE_SOLE_WRITER_RIGHTS");
  }
  public static void VerifyOldWriterToken(Dictionary<string,object> token,string expectedSid){VerifyProfileOldWriterToken(token,expectedSid,NativeServiceProfile.Portal);}
  public static void VerifyProfileOldWriterToken(Dictionary<string,object> token,string expectedSid,NativeServiceProfile selected){
    if((string)token["user"]!=expectedSid)throw new Exception("FENCE_CONTAINER_TOKEN_USER");
    foreach(var group in (List<Dictionary<string,object>>)token["groups"]){
      string sid=(string)group["sid"];uint flags=(uint)group["attributes"];
      if((sid=="S-1-5-18"||sid=="S-1-5-32-544"||sid==selected.Sid)&&(flags&4)!=0&&(flags&0x10)==0)throw new Exception("FENCE_CONTAINER_PRIVILEGED_GROUP");
    }
    foreach(var privilege in (List<Dictionary<string,object>>)token["privileges"]){
      string name=(string)privilege["name"];
      if(name=="SeBackupPrivilege"||name=="SeRestorePrivilege"||name=="SeTakeOwnershipPrivilege"||name=="SeDebugPrivilege"||name=="SeTcbPrivilege"||name=="SeImpersonatePrivilege"||name=="SeAssignPrimaryTokenPrivilege")throw new Exception("FENCE_CONTAINER_PRIVILEGE");
    }
  }
  public static void VerifyOldWriterProcess(Dictionary<string,object> record){
    VerifyProfileOldWriterProcess(record,NativeServiceProfile.Portal);
  }
  public static void VerifyProfileOldWriterProcess(Dictionary<string,object> record,NativeServiceProfile selected){
    var fence=(Dictionary<string,object>)record["fence"];
    using(var process=Process.GetProcessById(Int32.Parse(S(fence,"containerHostPid")))){
      if(process.StartTime.ToUniversalTime().Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture)!=S(fence,"containerHostStartUtcTicks")||NativeInstallation.Hash(process.MainModule.FileName)!=S(fence,"containerHostImageSha256"))throw new Exception("FENCE_CONTAINER_PROCESS_DRIFT");
      using(var token=NativeWorkloadToken.Open(process.Handle))VerifyProfileOldWriterToken(NativeWorkloadToken.Snapshot(token),S(fence,"containerHostSid"),selected);
      foreach(string path in new[]{selected.Root,Path.GetDirectoryName(selected.Authority),selected.Authority})foreach(uint mask in new uint[]{0x40000000,0x10000,0x40000,0x80000})
        if(NativeWorkloadToken.AccessAs(process.Handle,path,mask,path!=selected.Authority)!=5)throw new Exception("FENCE_CONTAINER_WRITE_NOT_DENIED");
      if(process.HasExited)throw new Exception("FENCE_CONTAINER_PROCESS_EXITED");
    }
  }
  public static void VerifyFence(string root,string database,string sid,Dictionary<string,object> record){
    if(root!=Root||database!=Database||sid!=NativeInstallation.ServiceSid(Service))throw new Exception("FENCE_NAMESPACE");
    NativeInstallation.AdmitVolumeRoot(@"E:\");NativeInstallation.AdmitAcl(root,sid,false,true);
    string directory=Path.GetDirectoryName(database);
    NativeInstallation.AdmitAcl(directory,sid,true,true);
    VerifyDatabaseAcl(Directory.GetAccessControl(directory).GetSecurityDescriptorSddlForm(AccessControlSections.All),sid,true);
    VerifyDatabaseAcl(File.GetAccessControl(database).GetSecurityDescriptorSddlForm(AccessControlSections.All),sid,false);
    var fence=(Dictionary<string,object>)record["fence"];
    if(Digest(Encoding.UTF8.GetBytes(Directory.GetAccessControl(directory).GetSecurityDescriptorSddlForm(AccessControlSections.All)))!=S(fence,"directoryAclSha256")||
       Digest(Encoding.UTF8.GetBytes(File.GetAccessControl(database).GetSecurityDescriptorSddlForm(AccessControlSections.All)))!=S(fence,"databaseAclSha256"))throw new Exception("FENCE_ACL_DRIFT");
    string inspect=Path.Combine(root,"action","container-inspect.json");
    if(NativeInstallation.Hash(inspect)!=S(fence,"containerInspectSha256"))throw new Exception("FENCE_CONFIG_DRIFT");
    VerifyContainer(File.ReadAllText(inspect),S(fence,"containerId"));
    foreach(string entry in Directory.GetFileSystemEntries(directory)){
      string leaf=Path.GetFileName(entry);
      if(leaf.Equals("portal-writer.lock",StringComparison.OrdinalIgnoreCase)||leaf.Equals("originals.sqlite-wal",StringComparison.OrdinalIgnoreCase)||leaf.Equals("originals.sqlite-shm",StringComparison.OrdinalIgnoreCase)||leaf.Equals("originals.sqlite-journal",StringComparison.OrdinalIgnoreCase))throw new Exception("FENCE_EXISTING_WRITER_OR_SIDECAR");
    }
  }
  public static Dictionary<string,object> AdmitImageInstallation(string root,string service,string hostHash,List<IDisposable> pins){
    var selected=NativeServiceProfile.Select(service,root,NativeInstallation.ServiceSid(service));
    if(selected!=NativeServiceProfile.Image)throw new Exception("IMAGE_PROFILE_REQUIRED");
    NativeInstallation.AdmitVolumeRoot(@"E:\");pins.Add(NativeInstallation.Pin(@"E:\",true));
    // The shared parent is immutable namespace custody, not image write authority.
    NativeInstallation.AdmitVolumeRoot(NativeServiceProfile.Portal.Root);pins.Add(NativeInstallation.Pin(NativeServiceProfile.Portal.Root,true));
    foreach(string leaf in new[]{"","code","action","private","authority","authority\\tools-unfinished-deferred-owner1-image-five-attempts","temp","status"}){
      string path=leaf==""?root:Path.Combine(root,leaf);bool writable=leaf=="temp"||leaf=="status"||leaf=="authority\\tools-unfinished-deferred-owner1-image-five-attempts";
      pins.Add(writable?NativeInstallation.PinWritableDirectory(path,selected.Sid):NativeInstallation.Pin(path,true));NativeInstallation.AdmitAcl(path,selected.Sid,writable,true);
    }
    string installation=Path.Combine(root,"installation.json");pins.Add(NativeInstallation.Pin(installation,false));NativeInstallation.AdmitAcl(installation,selected.Sid,false,false);
    var manifest=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(installation));
    Equal(manifest,"schema","image-native-install.v1");Equal(manifest,"scope","PROJECT_REVIEWED");Equal(manifest,"serviceName",service);Equal(manifest,"serviceSid",selected.Sid);Equal(manifest,"tokenProfile",Profile);Equal(manifest,"hostSourceSha256",hostHash);
    var required=new HashSet<string>(new[]{"code/image-only.exe","code/native-service-host.exe","code/native-service-host.cs","private/image-config.json","private/binding.json","private/image-principal.json","private/seed-receipt.json"});
    foreach(Dictionary<string,object> file in (IEnumerable)manifest["files"]){
      string relative=S(file,"path");if(!required.Remove(relative))throw new Exception("IMAGE_INSTALL_FILE_SET");
      string path=Path.Combine(root,relative.Replace('/','\\'));pins.Add(NativeInstallation.Pin(path,false));NativeInstallation.AdmitAcl(path,selected.Sid,false,false);
      if(NativeInstallation.Hash(path)!=S(file,"sha256"))throw new Exception("IMAGE_INSTALL_HASH");
    }
    if(required.Count!=0)throw new Exception("IMAGE_INSTALL_FILE_SET");
    if(NativeInstallation.Hash(Path.Combine(root,"code","image-only.exe"))!=NativeServiceProfile.ImageBinarySha256||NativeInstallation.Hash(Path.Combine(root,"code","native-service-host.cs"))!=hostHash)throw new Exception("IMAGE_INSTALL_BINARY_HASH");
    foreach(string leaf in new[]{"activation.json","activation-public-key.xml","owner-decision.json","container-inspect.json"}){
      string path=Path.Combine(root,"action",leaf);pins.Add(NativeInstallation.Pin(path,false));NativeInstallation.AdmitAcl(path,selected.Sid,false,false);
    }
    return manifest;
  }
  public static Dictionary<string,object> VerifyImageActivation(Dictionary<string,object> manifest,string activationHash,string action){
    var selected=NativeServiceProfile.Image;string root=selected.Root;
    string ownerHash=NativeInstallation.Hash(Path.Combine(root,"action","owner-decision.json"));Equal(manifest,"ownerDecisionSha256",ownerHash);
    return VerifyProfileRecord(File.ReadAllBytes(Path.Combine(root,"action","activation.json")),activationHash,File.ReadAllText(Path.Combine(root,"action","activation-public-key.xml")),S(manifest,"activationPublicKeySha256"),NativeInstallation.Hash(Path.Combine(root,"installation.json")),ownerHash,action,DateTime.UtcNow,selected);
  }
  public static void VerifyImageFence(Dictionary<string,object> record){
    var selected=NativeServiceProfile.Image;string directory=Path.GetDirectoryName(selected.Authority);
    NativeInstallation.AdmitVolumeRoot(@"E:\");NativeInstallation.AdmitVolumeRoot(NativeServiceProfile.Portal.Root);
    NativeInstallation.AdmitAcl(selected.Root,selected.Sid,false,true);NativeInstallation.AdmitAcl(Path.Combine(selected.Root,"authority"),selected.Sid,false,true);
    VerifyDatabaseAcl(Directory.GetAccessControl(directory).GetSecurityDescriptorSddlForm(AccessControlSections.All),selected.Sid,true);
    VerifyDatabaseAcl(File.GetAccessControl(selected.Authority).GetSecurityDescriptorSddlForm(AccessControlSections.All),selected.Sid,false);
    var fence=(Dictionary<string,object>)record["fence"];
    if(Digest(Encoding.UTF8.GetBytes(Directory.GetAccessControl(directory).GetSecurityDescriptorSddlForm(AccessControlSections.All)))!=S(fence,"directoryAclSha256")||Digest(Encoding.UTF8.GetBytes(File.GetAccessControl(selected.Authority).GetSecurityDescriptorSddlForm(AccessControlSections.All)))!=S(fence,"authorityAclSha256"))throw new Exception("FENCE_ACL_DRIFT");
    string inspect=Path.Combine(selected.Root,"action","container-inspect.json");if(NativeInstallation.Hash(inspect)!=S(fence,"containerInspectSha256"))throw new Exception("FENCE_CONFIG_DRIFT");
    VerifyProfileContainer(File.ReadAllText(inspect),S(fence,"containerId"),selected);
    foreach(var file in new Dictionary<string,string>{{"image-config.json","imageConfigSha256"},{"binding.json","bindingSha256"},{"image-principal.json","imagePrincipalSha256"},{"seed-receipt.json","seedReceiptSha256"}})
      if(NativeInstallation.Hash(Path.Combine(selected.Root,"private",file.Key))!=S(record,file.Value))throw new Exception("IMAGE_PRIVATE_BINDING");
    VerifyImageConfig(File.ReadAllText(Path.Combine(selected.Root,"private","image-config.json")));
    if(Directory.GetFileSystemEntries(directory).Length!=1)throw new Exception("IMAGE_AUTHORITY_INVENTORY");
  }
  public static void VerifyImageConfig(string text){
    var config=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(text);
    Equal(config,"directory",Path.GetDirectoryName(NativeServiceProfile.Image.Authority));
    if(!System.Text.RegularExpressions.Regex.IsMatch(S(config,"listen"),@"^127\.0\.0\.1:[1-9][0-9]{0,4}$"))throw new Exception("IMAGE_CONFIG_LISTEN");
    int port=Int32.Parse(S(config,"listen").Substring(10));if(port>65535)throw new Exception("IMAGE_CONFIG_LISTEN");
    var binding=(Dictionary<string,object>)config["binding"];
    Equal(binding,"service_sid",NativeServiceProfile.Image.Sid);Equal(binding,"budget_id","tools-unfinished-deferred-owner1-image-five-attempts");Equal(binding,"owner_sha256","6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b");
  }
}

public static class NativeKnownDlls {
  public const string Profile="local-synthetic-full-primary-known-dlls.v3";
  public const string CandidateSid="S-1-5-12";
  public const string DescriptorSha256="3f13329b6dd447dede559ee7bbdc0db04ff3bc8531c0f20736f082043795e791";
  public const string AdmissionSha256="b6f5f7928e26c110830c72979774a48ecd564d2cb8dc9507841d1c2754ad580a";
  [StructLayout(LayoutKind.Sequential)] struct UNICODE_STRING {public ushort Length,MaximumLength;public IntPtr Buffer;}
  [StructLayout(LayoutKind.Sequential)] struct OBJECT_ATTRIBUTES {public int Length;public IntPtr RootDirectory,ObjectName;public uint Attributes;public IntPtr SecurityDescriptor,SecurityQualityOfService;}
  [StructLayout(LayoutKind.Sequential)] public struct MAPPING {public uint Read,Write,Execute,All;}
  // OBJECT_TYPE_INFORMATION from phnt/ntobapi.h. The mapping is queried from
  // this retained Directory handle, not substituted with filesystem rights.
  [StructLayout(LayoutKind.Sequential)] struct TYPE_INFORMATION {
    public UNICODE_STRING Name;
    public uint Objects,Handles,Paged,NonPaged,NamePool,HandleTable,HighObjects,HighHandles,HighPaged,HighNonPaged,HighNamePool,HighHandleTable,InvalidAttributes;
    public MAPPING Mapping;public uint ValidAccessMask;
    public byte SecurityRequired,MaintainHandleCount,TypeIndex,Reserved;
    public uint PoolType,DefaultPaged,DefaultNonPaged;
  }
  [DllImport("ntdll.dll")] static extern int NtOpenDirectoryObject(out SafeFileHandle handle,uint access,ref OBJECT_ATTRIBUTES attributes);
  [DllImport("ntdll.dll")] static extern int NtQueryObject(SafeFileHandle handle,int kind,IntPtr buffer,uint length,out uint needed);
  [DllImport("ntdll.dll")] static extern int NtQuerySecurityObject(SafeFileHandle handle,uint information,byte[] buffer,uint length,out uint needed);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool DuplicateTokenEx(SafeFileHandle source,uint access,IntPtr security,int level,int type,out SafeFileHandle token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool AccessCheck(byte[] descriptor,SafeFileHandle token,uint access,ref MAPPING mapping,IntPtr privileges,ref uint length,out uint granted,out bool status);
  static string Status(int value){return "0x"+unchecked((uint)value).ToString("x8");}
  public static SafeFileHandle Open(uint access,out int status) {
    IntPtr text=Marshal.StringToHGlobalUni(@"\KnownDlls"),name=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(UNICODE_STRING)));
    try {
      Marshal.StructureToPtr(new UNICODE_STRING{Length=20,MaximumLength=22,Buffer=text},name,false);
      var attributes=new OBJECT_ATTRIBUTES{Length=Marshal.SizeOf(typeof(OBJECT_ATTRIBUTES)),ObjectName=name,Attributes=0x40};
      SafeFileHandle handle;status=NtOpenDirectoryObject(out handle,access,ref attributes);return handle;
    }finally{Marshal.FreeHGlobal(name);Marshal.FreeHGlobal(text);}
  }
  public static byte[] Security(SafeFileHandle handle,uint information,Dictionary<string,object> record,string label) {
    uint needed;int sizing=NtQuerySecurityObject(handle,information,null,0,out needed);
    record[label+"SizingStatus"]=Status(sizing);record[label+"RequiredBytes"]=needed;
    if(needed==0||needed>65536)throw new Exception("KNOWNDLLS_SD_SIZE_"+Status(sizing));
    byte[] bytes=new byte[needed];int status=NtQuerySecurityObject(handle,information,bytes,needed,out needed);record[label+"Status"]=Status(status);
    if(status<0)throw new Exception("KNOWNDLLS_SD_QUERY_"+Status(status));
    Array.Resize(ref bytes,(int)needed);return bytes;
  }
  public static Dictionary<string,object> Describe(SafeFileHandle handle) {
    var result=new Dictionary<string,object>();IntPtr buffer=Marshal.AllocHGlobal(65536);
    try {
      uint needed;int status=NtQueryObject(handle,1,buffer,65536,out needed);result["nameQueryStatus"]=Status(status);
      if(status<0)throw new Exception("KNOWNDLLS_NAME_"+Status(status));
      var name=(UNICODE_STRING)Marshal.PtrToStructure(buffer,typeof(UNICODE_STRING));result["objectName"]=Marshal.PtrToStringUni(name.Buffer,name.Length/2);
      status=NtQueryObject(handle,2,buffer,65536,out needed);result["typeQueryStatus"]=Status(status);
      if(status<0)throw new Exception("KNOWNDLLS_TYPE_"+Status(status));
      var type=(TYPE_INFORMATION)Marshal.PtrToStructure(buffer,typeof(TYPE_INFORMATION));result["objectType"]=Marshal.PtrToStringUni(type.Name.Buffer,type.Name.Length/2);
      result["directoryMapping"]=type.Mapping;result["validAccessMask"]=type.ValidAccessMask;
      result["mappingSource"]="NtQueryObject ObjectTypeInformation on same retained handle; phnt/ntobapi.h OBJECT_TYPE_INFORMATION layout";
      if((string)result["objectName"]!=@"\KnownDlls"||(string)result["objectType"]!="Directory")throw new Exception("KNOWNDLLS_OBJECT_IDENTITY");
      return result;
    }finally{Marshal.FreeHGlobal(buffer);}
  }
  public static string Hash(byte[] bytes){using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
  static void CheckAccess(SafeFileHandle token,byte[] descriptor,MAPPING mapping,uint mask,bool expected,string label,Action<string> record) {
    SafeFileHandle impersonation;if(!DuplicateTokenEx(token,0xc,IntPtr.Zero,2,2,out impersonation))throw new Win32Exception(Marshal.GetLastWin32Error(),"KNOWNDLLS_DUPLICATE");
    using(impersonation){
      IntPtr privileges=Marshal.AllocHGlobal(1024);
      try {
        Marshal.Copy(new byte[1024],0,privileges,1024);
        uint length=1024,granted;bool status;
        bool api=AccessCheck(descriptor,impersonation,mask,ref mapping,privileges,ref length,out granted,out status);int error=api?0:Marshal.GetLastWin32Error();
        uint count=api?unchecked((uint)Marshal.ReadInt32(privileges)):0;int used=api?checked(8+(int)count*12):0;if(used>1024)throw new Exception("KNOWNDLLS_PRIVILEGE_SET_SIZE");
        byte[] raw=new byte[used];Marshal.Copy(privileges,raw,0,raw.Length);
        record("KNOWNDLLS_ACCESS_CHECK="+new JavaScriptSerializer().Serialize(new{label,mask,api,apiError=error,accessStatus=status,granted,privilegeBufferLength=length,privilegeCount=count,privilegeSetBase64=Convert.ToBase64String(raw),mapping,descriptorSha256=Hash(descriptor)}));
        if(!api)throw new Win32Exception(error,"KNOWNDLLS_ACCESS_CHECK_API");
        int native;using(WindowsIdentity.Impersonate(impersonation.DangerousGetHandle()))using(var opened=Open(mask,out native)){
          record("KNOWNDLLS_ACTUAL_OPEN="+new JavaScriptSerializer().Serialize(new{label,mask,ntstatus=Status(native),success=native>=0,identity=native>=0?Describe(opened):null}));
          if(status!=(native>=0))throw new Exception("KNOWNDLLS_ACCESSCHECK_NATIVE_MISMATCH_"+label);
          if(status!=expected||(expected&&(granted&mask)!=mask))throw new Exception("KNOWNDLLS_EXPECTATION_"+label+"_"+mask.ToString("x8"));
        }
      }finally{Marshal.FreeHGlobal(privileges);}
    }
  }
  public static void Gate(SafeFileHandle current,SafeFileHandle proposed,Action<string> record) {
    int status;using(var handle=Open(0x20000,out status)){
      record("KNOWNDLLS_BASELINE_DESCRIPTOR_OPEN="+Status(status));if(status<0)throw new Exception("KNOWNDLLS_BASELINE_DESCRIPTOR_OPEN");
      var metadata=Describe(handle);byte[] descriptor=Security(handle,7,metadata,"descriptor");
      record("KNOWNDLLS_DESCRIPTOR_BEFORE="+new JavaScriptSerializer().Serialize(new{metadata,sha256=Hash(descriptor),rawBase64=Convert.ToBase64String(descriptor)}));
      if(Hash(descriptor)!=DescriptorSha256)throw new Exception("KNOWNDLLS_DESCRIPTOR_DRIFT");
      try {
        var mapping=(MAPPING)metadata["directoryMapping"];
        CheckAccess(current,descriptor,mapping,3,false,"current-v2",record);
        CheckAccess(proposed,descriptor,mapping,3,true,"proposed-v3",record);
        foreach(uint mask in new uint[]{4,8,0x40000,0x80000})CheckAccess(proposed,descriptor,mapping,mask,false,"proposed-v3-negative",record);
        record("KNOWNDLLS_OLD_DENY_NEW_ALLOW_PASS");
      }finally{
        byte[] after=Security(handle,7,metadata,"descriptorAfter");record("KNOWNDLLS_DESCRIPTOR_AFTER="+Hash(after));
        if(Hash(after)!=Hash(descriptor))throw new Exception("KNOWNDLLS_DESCRIPTOR_CHANGED_DURING_GATE");
      }
    }
    record("KNOWNDLLS_DESCRIPTOR_AND_TOKEN_HANDLES_CLOSED_BY_OWNER");
  }
  public static void VerifyProduction(SafeFileHandle token,Action<string> record){
    int status;using(var handle=Open(0x20000,out status)){
      if(status<0)throw new Exception("PRODUCTION_KNOWNDLLS_OPEN");
      var metadata=Describe(handle);byte[] descriptor=Security(handle,7,metadata,"descriptor");
      if(Hash(descriptor)!=DescriptorSha256)throw new Exception("KNOWNDLLS_DESCRIPTOR_DRIFT");
      var mapping=(MAPPING)metadata["directoryMapping"];
      CheckAccess(token,descriptor,mapping,3,true,"production",record);
      foreach(uint mask in new uint[]{4,8,0x40000,0x80000})CheckAccess(token,descriptor,mapping,mask,false,"production-negative",record);
    }
  }
  public static Dictionary<string,object> Capture() {
    var result=new Dictionary<string,object>{{"at",DateTime.UtcNow.ToString("o")},{"os",Environment.OSVersion.VersionString},{"session",Process.GetCurrentProcess().SessionId},{"pointerSize",IntPtr.Size},{"requestedAccess",0x20000},{"securityInformation",7},{"labelEvidence","not yet queried"}};
    using(var identity=WindowsIdentity.GetCurrent())using(var token=new SafeFileHandle(identity.Token,false)){result["collectorIdentity"]=identity.Name;result["collectorToken"]=NativeWorkloadToken.Snapshot(token);}
    int status;using(var handle=Open(0x20000,out status)) {
      result["openStatus"]=Status(status);
      try {
        if(status<0)throw new Exception("KNOWNDLLS_READ_CONTROL_OPEN_"+Status(status));
        foreach(var pair in Describe(handle))result[pair.Key]=pair.Value;
        byte[] bytes=Security(handle,7,result,"descriptor");var descriptor=new RawSecurityDescriptor(bytes,0);
        result["rawDescriptorBase64"]=Convert.ToBase64String(bytes);result["rawDescriptorSha256"]=Hash(bytes);result["sddl"]=descriptor.GetSddlForm(AccessControlSections.All);
        result["owner"]=descriptor.Owner.Value;result["group"]=descriptor.Group.Value;result["controlFlags"]=(int)descriptor.ControlFlags;
        var aces=new List<Dictionary<string,object>>();int index=0;
        foreach(GenericAce ace in descriptor.DiscretionaryAcl){var row=new Dictionary<string,object>{{"index",index++},{"type",ace.AceType.ToString()},{"typeValue",(int)ace.AceType},{"flags",(int)ace.AceFlags}};var known=ace as KnownAce;if(known!=null){row["sid"]=known.SecurityIdentifier.Value;row["mask"]=unchecked((uint)known.AccessMask);}byte[] raw=new byte[ace.BinaryLength];ace.GetBinaryForm(raw,0);row["rawBase64"]=Convert.ToBase64String(raw);aces.Add(row);}
        result["orderedAces"]=aces;
        try{byte[] label=Security(handle,0x10,result,"label");result["labelDescriptorBase64"]=Convert.ToBase64String(label);result["labelSddl"]=new RawSecurityDescriptor(label,0).GetSddlForm(AccessControlSections.All);result["labelEvidence"]="queried read-only; no privilege adjustment";}catch(Exception error){result["labelEvidence"]=error.Message;}
        result["gate"]="DESCRIPTOR_CAPTURED";
      }catch(Exception error){result["gate"]="DESCRIPTOR_FAILED";result["failure"]=error.ToString();}
    }
    result["readOnlyHandleClosed"]=true;return result;
  }
}

public static class NativeWorkloadToken {
  public const string Profile="local-synthetic-full-primary.v2";
  public const string ReadSid="S-1-5-32-545";
  public static string ProofRoot(string sid) {return @"E:\task22-native-token-objects-"+sid.Substring(9);}
  public static string Contract(string sid,string root) {return Profile+"|sourceSidType=1|service="+sid+"|readSids="+ReadSid+"|BA=deny-only-if-present|privileges=SeChangeNotifyPrivilege-only|owner="+sid+"|dacl=SY,BA,"+sid+"|roots="+Path.GetFullPath(root).TrimEnd('\\')+";"+ProofRoot(sid);}
  public static string KnownDllsContract(string sid,string root) {return Contract(sid,root).Replace(Profile+"|",NativeKnownDlls.Profile+"|").Replace("|readSids="+ReadSid+"|","|readSids="+ReadSid+","+NativeKnownDlls.CandidateSid+"|knownDllsDescriptor="+NativeKnownDlls.DescriptorSha256+"|");}
  [StructLayout(LayoutKind.Sequential)] struct SID_ATTRIBUTES { public IntPtr Sid; public uint Attributes; }
  [StructLayout(LayoutKind.Sequential)] struct LUID { public uint Low; public int High; }
  [StructLayout(LayoutKind.Sequential)] struct PRIVILEGE { public LUID Luid; public uint Attributes; }
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out SafeFileHandle token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(SafeFileHandle token,int kind,IntPtr info,int length,out int needed);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool SetTokenInformation(SafeFileHandle token,int kind,IntPtr info,int length);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool CreateRestrictedToken(SafeFileHandle source,uint flags,uint disabledCount,IntPtr disabled,uint deletedCount,IntPtr deleted,uint restrictedCount,IntPtr restricted,out SafeFileHandle token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool DuplicateTokenEx(SafeFileHandle source,uint access,IntPtr security,int level,int type,out SafeFileHandle token);
  [StructLayout(LayoutKind.Sequential)] struct GENERIC_MAPPING {public uint Read,Write,Execute,All;}
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool AccessCheck(byte[] descriptor,SafeFileHandle token,uint access,ref GENERIC_MAPPING mapping,IntPtr privileges,ref uint privilegeLength,out uint granted,out bool status);
  [DllImport("advapi32.dll")] static extern void MapGenericMask(ref uint access,ref GENERIC_MAPPING mapping);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool LookupPrivilegeNameW(string system,ref LUID luid,StringBuilder name,ref int length);
  [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern SafeFileHandle CreateFileW(string path,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
  static IntPtr Info(SafeFileHandle token,int kind) {
    int length;GetTokenInformation(token,kind,IntPtr.Zero,0,out length);IntPtr buffer=Marshal.AllocHGlobal(length);
    if(!GetTokenInformation(token,kind,buffer,length,out length)){Marshal.FreeHGlobal(buffer);throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_QUERY_"+kind);}return buffer;
  }
  public static SafeFileHandle Open(IntPtr process) { SafeFileHandle token;if(!OpenProcessToken(process,0x8f,out token))throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_OPEN");return token; }
  public static Dictionary<string,object> Snapshot(SafeFileHandle token) {
    var result=new Dictionary<string,object>();
    foreach(int kind in new[]{1,4,6,8,2,11,3}) {
      IntPtr buffer=Info(token,kind);
      try {
        if(kind==1||kind==4)result[kind==1?"user":"owner"]=new SecurityIdentifier(Marshal.ReadIntPtr(buffer)).Value;
        else if(kind==8)result["type"]=Marshal.ReadInt32(buffer);
        else if(kind==6){IntPtr acl=Marshal.ReadIntPtr(buffer);int size=(ushort)Marshal.ReadInt16(acl,2);byte[] bytes=new byte[size];Marshal.Copy(acl,bytes,0,size);var raw=new RawAcl(bytes,0);var sd=new RawSecurityDescriptor(ControlFlags.DiscretionaryAclPresent,null,null,null,raw);result["defaultDacl"]=sd.GetSddlForm(AccessControlSections.Access);}
        else {
          int count=Marshal.ReadInt32(buffer);var rows=new List<Dictionary<string,object>>();
          for(int n=0;n<count;n++) {
            if(kind==3){var entry=(PRIVILEGE)Marshal.PtrToStructure(IntPtr.Add(buffer,4+n*Marshal.SizeOf(typeof(PRIVILEGE))),typeof(PRIVILEGE));int length=256;var name=new StringBuilder(length);if(!LookupPrivilegeNameW(null,ref entry.Luid,name,ref length))throw new Win32Exception();rows.Add(new Dictionary<string,object>{{"name",name.ToString()},{"luid",entry.Luid.High+":"+entry.Luid.Low},{"attributes",entry.Attributes}});}
            else {var entry=(SID_ATTRIBUTES)Marshal.PtrToStructure(IntPtr.Add(buffer,(IntPtr.Size==8?8:4)+n*Marshal.SizeOf(typeof(SID_ATTRIBUTES))),typeof(SID_ATTRIBUTES));rows.Add(new Dictionary<string,object>{{"sid",new SecurityIdentifier(entry.Sid).Value},{"attributes",entry.Attributes}});}
          }
          result[kind==2?"groups":kind==11?"restrictedSids":"privileges"]=rows;
        }
      } finally {Marshal.FreeHGlobal(buffer);}
    }
    return result;
  }
  public static string Describe(IntPtr process) {using(var token=Open(process))return new JavaScriptSerializer().Serialize(Snapshot(token));}
  public static int AccessAs(IntPtr process,string path,uint access,bool directory=false) {
    using(var source=Open(process)) {
      SafeFileHandle token;if(!DuplicateTokenEx(source,0xc,IntPtr.Zero,2,2,out token))throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_ACCESS_PROBE_DUPLICATE");
      using(token)return Access(token,path,access,directory);
    }
  }
  public static int Access(SafeFileHandle token,string path,uint access,bool directory) {
    using(WindowsIdentity.Impersonate(token.DangerousGetHandle()))using(var file=CreateFileW(path,access,7,IntPtr.Zero,3,directory?0x02200000u:0x00200000u,IntPtr.Zero))return file.IsInvalid?Marshal.GetLastWin32Error():0;
  }
  public static void Verify(SafeFileHandle token,string sid,bool filtered,bool knownDlls=false,bool production=false) {
    VerifySnapshot(Snapshot(token),sid,filtered,knownDlls,production);
  }
  public static void VerifySnapshot(Dictionary<string,object> value,string sid,bool filtered,bool knownDlls,bool production) {
    if((string)value["user"]!=(production?sid:"S-1-5-19") || (int)value["type"]!=1)throw new Exception(production?"PRODUCTION_TOKEN_USER":"WORKLOAD_PRIMARY_LOCALSERVICE_REQUIRED");
    bool service=production,restricted=false;var restrictedIds=new List<string>();
    foreach(var row in (List<Dictionary<string,object>>)value["groups"]){string id=(string)row["sid"];uint attributes=(uint)row["attributes"];
      if(id==sid&&(attributes&4)!=0&&(attributes&0x10)==0&&((attributes&8)!=0))service=true;
      if(id=="S-1-5-32-544"&&filtered&&((attributes&0x10)==0||(attributes&4)!=0))throw new Exception("WORKLOAD_ADMIN_NOT_DENY_ONLY");
      if(production&&!filtered&&id=="S-1-5-32-544"&&(attributes&4)!=0&&(attributes&0x10)==0)throw new Exception("PRODUCTION_HOST_ADMINISTRATOR");
    }
    foreach(var row in (List<Dictionary<string,object>>)value["restrictedSids"]){restrictedIds.Add((string)row["sid"]);if((string)row["sid"]==sid)restricted=true;}
    if(!service)throw new Exception("WORKLOAD_SERVICE_SID_REQUIRED");
    if(!filtered&&restrictedIds.Count!=0)throw new Exception("SOURCE_TOKEN_CONTRACT_MISMATCH");
    if(filtered){
      if(!restricted||restrictedIds.Count!=(knownDlls?3:2)||!restrictedIds.Contains(ReadSid)||(knownDlls&&!restrictedIds.Contains(NativeKnownDlls.CandidateSid)))throw new Exception("WORKLOAD_RESTRICTING_SET_MISMATCH");
      foreach(var row in (List<Dictionary<string,object>>)value["privileges"])if((string)row["name"]!="SeChangeNotifyPrivilege")throw new Exception("WORKLOAD_PRIVILEGE_PRESENT_"+row["name"]);
      if((string)value["owner"]!=sid)throw new Exception("WORKLOAD_OWNER_MISMATCH");
      var expected=new RawSecurityDescriptor("D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GA;;;"+sid+")");
      if((string)value["defaultDacl"]!=expected.GetSddlForm(AccessControlSections.Access))throw new Exception("WORKLOAD_DEFAULT_DACL_MISMATCH");
    }
  }
  public static void VerifyProcess(IntPtr process,string sid,Action<string> record,string label,bool knownDlls=false,bool production=false) {
    using(var token=Open(process)){Verify(token,sid,true,knownDlls,production);record("TOKEN_"+label+"="+new JavaScriptSerializer().Serialize(Snapshot(token)));}
  }
  public static List<string> ReadSurfaces(string powershell,string node,Action<string> record) {
    var paths=new List<string>{powershell};
    foreach(ProcessModule module in Process.GetCurrentProcess().Modules)if(module.FileName.StartsWith(Environment.GetFolderPath(Environment.SpecialFolder.Windows)+"\\",StringComparison.OrdinalIgnoreCase)&&!paths.Contains(module.FileName))paths.Add(module.FileName);
    foreach(string path in paths) {
      var acl=File.GetAccessControl(path);uint read=0;
      foreach(FileSystemAccessRule ace in acl.GetAccessRules(true,true,typeof(SecurityIdentifier)))if(ace.IdentityReference.Value==ReadSid&&ace.AccessControlType==AccessControlType.Allow)read|=(uint)ace.FileSystemRights;
      record("READ_SID_CANDIDATE path="+path+" sha256="+NativeInstallation.Hash(path)+" sid="+ReadSid+" rights="+read+" sddl="+acl.GetSecurityDescriptorSddlForm(AccessControlSections.All));
      if((read&0x120089)!=0x120089)throw new Exception("WINDOWS_READ_SID_NOT_EVIDENCED_"+path);
    }
    return paths;
  }
  static void ExpectAccess(SafeFileHandle token,string path,uint mask,bool directory,bool allowed,Action<string> record,int expectedSharing=0) {
    FileSystemSecurity acl=directory?(FileSystemSecurity)Directory.GetAccessControl(path):File.GetAccessControl(path);
    var mapping=new GENERIC_MAPPING{Read=0x120089,Write=0x120116,Execute=0x1200a0,All=0x1f01ff};uint specific=mask;MapGenericMask(ref specific,ref mapping);
    SafeFileHandle impersonation;if(!DuplicateTokenEx(token,0xc,IntPtr.Zero,2,2,out impersonation))throw new Win32Exception(Marshal.GetLastWin32Error(),"OBJECT_ACCESS_CHECK_TOKEN");
    using(impersonation){uint length=1024,granted;bool status;IntPtr privileges=Marshal.AllocHGlobal((int)length);
      try{if(!AccessCheck(acl.GetSecurityDescriptorBinaryForm(),impersonation,specific,ref mapping,privileges,ref length,out granted,out status))throw new Win32Exception(Marshal.GetLastWin32Error(),"OBJECT_ACCESS_CHECK_API");
        record("OBJECT_ACCESS_CHECK path="+path+" mask=0x"+mask.ToString("x8")+" mapped=0x"+specific.ToString("x8")+" granted=0x"+granted.ToString("x8")+" allowed="+status+" sddl="+acl.GetSecurityDescriptorSddlForm(AccessControlSections.All));
        if(status!=allowed)throw new Exception("OBJECT_ACCESS_CHECK_EXPECTATION_"+path+"_"+mask.ToString("x8"));
      }finally{Marshal.FreeHGlobal(privileges);}}
    int expected=allowed?expectedSharing:5;
    int code=Access(token,path,mask,directory);record("OBJECT_RIGHT path="+path+" mask=0x"+mask.ToString("x8")+" directory="+directory+" expected="+(allowed?"allow":"deny")+" expectedOperational="+expected+" result="+code);
    if(code!=expected)throw new Exception("OBJECT_RIGHT_GATE_FAILED_"+path+"_"+mask.ToString("x8")+"_"+code);
  }
  public static void KnownDllsIsolation(SafeFileHandle current,SafeFileHandle proposed,string sid,string root,string peer,Action<string> record) {
    var serializer=new JavaScriptSerializer();var old=Snapshot(current);var next=Snapshot(proposed);
    old.Remove("restrictedSids");next.Remove("restrictedSids");
    if(serializer.Serialize(old)!=serializer.Serialize(next))throw new Exception("KNOWNDLLS_NON_RESTRICTING_POLICY_DRIFT");
    foreach(var pair in new[]{new{Token=current,Known=true},new{Token=proposed,Known=false}}){try{Verify(pair.Token,sid,true,pair.Known);throw new Exception("KNOWNDLLS_TOKEN_DRIFT_ACCEPTED");}catch(Exception error){if(error.Message!="WORKLOAD_RESTRICTING_SET_MISMATCH")throw;}}
    record("KNOWNDLLS_NON_RESTRICTING_POLICY_AND_EXACT_SET_NEGATIVES_PASS");
    foreach(string relative in new[]{"code\\launch.json","code\\server.mjs","action\\permit.json","installation.json"}){
      string path=Path.Combine(root,relative);ExpectAccess(proposed,path,0x80000000,false,true,record);
      foreach(uint mask in new uint[]{0x40000000,0x10000,0x40000,0x80000,0x400d0000})ExpectAccess(proposed,path,mask,false,false,record);
    }
    foreach(string relative in new[]{"","code","action"})foreach(uint mask in new uint[]{0x40,0x40000,0x80000,0x400d0040})ExpectAccess(proposed,Path.Combine(root,relative),mask,true,false,record);
    record("KNOWNDLLS_OWN_IMMUTABLE_PASS");
    foreach(string leaf in new[]{"data","temp","status"}){
      string directory=Path.Combine(root,leaf);ExpectAccess(proposed,directory,0x40000000,true,true,record);
      foreach(uint mask in new uint[]{0x40,0x40000,0x80000})ExpectAccess(proposed,directory,mask,true,false,record);
      string created=Path.Combine(directory,"known-dlls-created");
      using(WindowsIdentity.Impersonate(proposed.DangerousGetHandle()))using(var file=new FileStream(created,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){file.WriteByte(42);file.Flush(true);}
      var acl=File.GetAccessControl(created);string owner=acl.GetOwner(typeof(SecurityIdentifier)).Value;string sddl=acl.GetSecurityDescriptorSddlForm(AccessControlSections.All);
      record("KNOWNDLLS_CREATED_OBJECT="+serializer.Serialize(new{path=created,owner,sddl}));
      if(owner!=sid)throw new Exception("KNOWNDLLS_CREATED_OWNER");
      bool ownerRights=false;foreach(FileSystemAccessRule ace in acl.GetAccessRules(true,true,typeof(SecurityIdentifier))){string id=ace.IdentityReference.Value;if(id=="S-1-3-4"&&(long)ace.FileSystemRights==0x20000)ownerRights=true;if(id==NativeKnownDlls.CandidateSid)throw new Exception("KNOWNDLLS_PROJECT_CANDIDATE_ACE");}
      if(!ownerRights)throw new Exception("KNOWNDLLS_CREATED_OWNER_RIGHTS");
      foreach(uint mask in new uint[]{0x80000000,0x40000000,0x10000,0xc0010000})ExpectAccess(proposed,created,mask,false,true,record);
      foreach(uint mask in new uint[]{0x40000,0x80000,0x400c0000})ExpectAccess(proposed,created,mask,false,false,record);
      using(WindowsIdentity.Impersonate(proposed.DangerousGetHandle()))File.Delete(created);
      record("KNOWNDLLS_CREATE_WRITE_DELETE_PASS="+directory);
    }
    record("KNOWNDLLS_CREATED_OWNER_DACL_PASS");
    if(!System.Text.RegularExpressions.Regex.IsMatch(peer.Replace('\\','/'),@"^E:/task22-native-service-[a-f0-9]{16}/code/launch.json$"))throw new Exception("KNOWNDLLS_PEER_BINDING");
    string peerRoot=Path.GetDirectoryName(Path.GetDirectoryName(peer));
    foreach(string relative in new[]{"code\\launch.json","action\\permit.json","data\\created.txt"})foreach(uint mask in new uint[]{0x80000000,0x40000000,0x10000,0x40000,0x80000,0xc00d0000})ExpectAccess(proposed,Path.Combine(peerRoot,relative),mask,false,false,record);
    foreach(string relative in new[]{"","code","action","data"})foreach(uint mask in new uint[]{1,2,4,0x40,0x10000,0x40000,0x80000,0xc00d0047})ExpectAccess(proposed,Path.Combine(peerRoot,relative),mask,true,false,record);
    record("KNOWNDLLS_PEER_PRIVATE_PASS peerWorkloadCreated=False");
    foreach(string candidate in new[]{ReadSid,NativeKnownDlls.CandidateSid})foreach(string kind in new[]{"read","write"}){
      string path=Path.Combine(ProofRoot(sid),(candidate==ReadSid?"bu-":"candidate-")+kind);
      bool normalSupport=candidate==ReadSid;
      record("KNOWNDLLS_BROAD_COUNTEREXAMPLE="+serializer.Serialize(new{candidate,kind,normalSupport,sddl=File.GetAccessControl(path).GetSecurityDescriptorSddlForm(AccessControlSections.All)}));
      ExpectAccess(proposed,path,0x80000000,false,normalSupport,record);ExpectAccess(proposed,path,0x40000000,false,normalSupport&&kind=="write",record);
      try{NativeInstallation.AdmitAcl(path,sid,true,false);throw new Exception("KNOWNDLLS_BROAD_ACL_ADMITTED");}catch(Exception error){if(!error.Message.StartsWith("INSTALL_FOREIGN_ACE_",StringComparison.Ordinal))throw;record("KNOWNDLLS_BROAD_ACL_REJECTED="+error.Message);}
    }
    record("KNOWNDLLS_ISOLATION_GATE_PASS globalWriteConfinement=False");
  }
  public static void ObjectGate(SafeFileHandle token,string sid,string root,List<string> osPaths,Action<string> record,bool production=false) {
    foreach(string path in osPaths)ExpectAccess(token,path,0x80000000,false,true,record);
    foreach(string path in new[]{osPaths[0],Path.Combine(root,"code","node.exe")})ExpectAccess(token,path,0xa0000000,false,true,record);
    foreach(string relative in new[]{"code\\launch.json","code\\server.mjs","action\\permit.json","installation.json"}) {
      string path=Path.Combine(root,relative);record("OBJECT_ACL path="+path+" sddl="+File.GetAccessControl(path).GetSecurityDescriptorSddlForm(AccessControlSections.All));
      ExpectAccess(token,path,0x80000000,false,true,record);
      foreach(uint mask in new uint[]{0x40000000,0x10000,0x40000,0x80000,0x400d0000})ExpectAccess(token,path,mask,false,false,record);
    }
    foreach(string relative in new[]{"code","action"})foreach(uint mask in new uint[]{0x40,0x40000,0x80000,0x400d0040})ExpectAccess(token,Path.Combine(root,relative),mask,true,false,record);
    foreach(string relative in new[]{"data","temp","status"}) {
      string directory=Path.Combine(root,relative);ExpectAccess(token,directory,0x40000000,true,true,record);ExpectAccess(token,directory,0x40,true,false,record);
      foreach(uint mask in new uint[]{0x10,0x100})ExpectAccess(token,directory,mask,true,true,record);
      foreach(uint mask in new uint[]{0x40000,0x80000})ExpectAccess(token,directory,mask,true,false,record);
      ExpectAccess(token,directory,0x10000,true,true,record,32);
      using(WindowsIdentity.Impersonate(token.DangerousGetHandle())) {
        try{Directory.Move(directory,directory+"-replacement-probe");throw new Exception("PINNED_DIRECTORY_RENAMED");}
        catch(IOException error){int code=error.HResult&0xffff;record("NAMESPACE_RENAME path="+directory+" expected=32 result="+code);if(code!=32)throw;}
      }
    }
    // Production never runs fixture writes or creates database sidecars as a probe.
    if(production){record("PRODUCTION_EXISTING_OBJECT_RIGHTS_PASS");return;}
    string created=Path.Combine(root,"data","object-right-created");
    using(WindowsIdentity.Impersonate(token.DangerousGetHandle()))using(var file=new FileStream(created,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){file.WriteByte(42);file.Flush(true);}
    var createdAcl=File.GetAccessControl(created);record("CREATED_OBJECT path="+created+" owner="+createdAcl.GetOwner(typeof(SecurityIdentifier)).Value+" sddl="+createdAcl.GetSecurityDescriptorSddlForm(AccessControlSections.All));
    if(createdAcl.GetOwner(typeof(SecurityIdentifier)).Value!=sid)throw new Exception("CREATED_OBJECT_OWNER");
    foreach(uint mask in new uint[]{0x80000000,0x40000000,0x10000,0xc0010000})ExpectAccess(token,created,mask,false,true,record);
    foreach(uint mask in new uint[]{0x40000,0x80000,0x400c0000})ExpectAccess(token,created,mask,false,false,record);
    using(WindowsIdentity.Impersonate(token.DangerousGetHandle())) {
      foreach(string suffix in new[]{"-wal","-shm","-journal"}){string path=Path.Combine(root,"data","originals.sqlite"+suffix);using(var file=new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.None)){file.WriteByte(42);}File.Delete(path);record("DB_DIRECTORY_SIDECAR_CREATE_WRITE_DELETE="+path);}
      string marker=Path.Combine(root,"data","object-right-marker");using(var file=new FileStream(marker,FileMode.CreateNew,FileAccess.Write,FileShare.None)){file.WriteByte(42);}File.Delete(marker);
    }
    string proof=ProofRoot(sid);
    foreach(string name in new[]{"bu-read","bu-write"}) {
      string path=Path.Combine(proof,name);record("BROAD_SID_OBJECT path="+path+" sddl="+File.GetAccessControl(path).GetSecurityDescriptorSddlForm(AccessControlSections.All));
      ExpectAccess(token,path,0x80000000,false,true,record);ExpectAccess(token,path,0x40000000,false,name=="bu-write",record);
    }
    try{NativeInstallation.AdmitAcl(Path.Combine(proof,"bu-write"),sid,true,false);throw new Exception("BROAD_WRITE_ADMITTED");}catch(Exception error){if(!error.Message.StartsWith("INSTALL_FOREIGN_ACE_",StringComparison.Ordinal))throw;record("BROAD_PROJECT_ACL_REJECTED="+error.Message);}
    foreach(string key in new[]{@"SOFTWARE\Microsoft\.NETFramework",@"SOFTWARE\Microsoft\PowerShell\3\PowerShellEngine"}) {
      using(var raw=Microsoft.Win32.Registry.LocalMachine.OpenSubKey(key)){if(raw==null)throw new Exception("READ_REGISTRY_MISSING_"+key);record("READ_REGISTRY_CANDIDATE key="+key+" sddl="+raw.GetAccessControl().GetSecurityDescriptorSddlForm(AccessControlSections.All));}
      using(WindowsIdentity.Impersonate(token.DangerousGetHandle()))using(var selected=Microsoft.Win32.Registry.LocalMachine.OpenSubKey(key)){if(selected==null)throw new Exception("READ_REGISTRY_DENIED_"+key);record("READ_REGISTRY_ALLOWED="+key);}
    }
    record("OBJECT_RIGHTS_GATE_PASS globalWriteConfinement=False readSid="+ReadSid);
  }
  public static SafeFileHandle Create(string sid,string fault,Action<string> record) {
    using(var source=Open(GetCurrentProcess())) {
      return CreateFromSource(source,sid,fault,record,false);
    }
  }
  public static SafeFileHandle CreateFromSource(SafeFileHandle source,string sid,string fault,Action<string> record,bool knownDlls,bool production=false) {
      // Production changes identity, never the empty source-restriction contract.
      Verify(source,sid,false,false,production);record("TOKEN_RAW_HOST="+new JavaScriptSerializer().Serialize(Snapshot(source)));
      bool readGroup=false;foreach(var row in (List<Dictionary<string,object>>)Snapshot(source)["groups"])if((string)row["sid"]==ReadSid&&((uint)row["attributes"]&0x14)==4)readGroup=true;
      if(!readGroup)throw new Exception("WINDOWS_READ_SID_NORMAL_GROUP_MISSING");
      byte[] sidBytes=new byte[new SecurityIdentifier("S-1-5-32-544").BinaryLength];new SecurityIdentifier("S-1-5-32-544").GetBinaryForm(sidBytes,0);
      IntPtr disabledSid=Marshal.AllocHGlobal(sidBytes.Length),disabledEntry=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SID_ATTRIBUTES)));SafeFileHandle token=null;bool success=false;
      try {
        Marshal.Copy(sidBytes,0,disabledSid,sidBytes.Length);var disabled=new SID_ATTRIBUTES{Sid=disabledSid};Marshal.StructureToPtr(disabled,disabledEntry,false);
        if(fault=="token-create")throw new Exception("TOKEN_INJECT_CREATE");
        var restricting=knownDlls?new[]{new SecurityIdentifier(sid),new SecurityIdentifier(ReadSid),new SecurityIdentifier(NativeKnownDlls.CandidateSid)}:new[]{new SecurityIdentifier(sid),new SecurityIdentifier(ReadSid)};
        IntPtr entries=Marshal.AllocHGlobal(restricting.Length*Marshal.SizeOf(typeof(SID_ATTRIBUTES)));var allocations=new List<IntPtr>();
        try {
          for(int n=0;n<restricting.Length;n++){byte[] bytes=new byte[restricting[n].BinaryLength];restricting[n].GetBinaryForm(bytes,0);IntPtr ptr=Marshal.AllocHGlobal(bytes.Length);allocations.Add(ptr);Marshal.Copy(bytes,0,ptr,bytes.Length);Marshal.StructureToPtr(new SID_ATTRIBUTES{Sid=ptr,Attributes=0},IntPtr.Add(entries,n*Marshal.SizeOf(typeof(SID_ATTRIBUTES))),false);}
          if(!CreateRestrictedToken(source,1,1,disabledEntry,0,IntPtr.Zero,(uint)restricting.Length,entries,out token)){int code=Marshal.GetLastWin32Error();throw new Win32Exception(code,"TOKEN_CREATE_RESTRICTED code="+code);}
        }finally{foreach(var ptr in allocations)Marshal.FreeHGlobal(ptr);Marshal.FreeHGlobal(entries);}
        byte[] ownerBytes=new byte[new SecurityIdentifier(sid).BinaryLength];new SecurityIdentifier(sid).GetBinaryForm(ownerBytes,0);
        IntPtr owner=Marshal.AllocHGlobal(ownerBytes.Length),info=Marshal.AllocHGlobal(IntPtr.Size);
        var descriptor=new RawSecurityDescriptor("D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GA;;;"+sid+")");byte[] aclBytes=new byte[descriptor.DiscretionaryAcl.BinaryLength];descriptor.DiscretionaryAcl.GetBinaryForm(aclBytes,0);IntPtr acl=Marshal.AllocHGlobal(aclBytes.Length);
        try {
          Marshal.Copy(ownerBytes,0,owner,ownerBytes.Length);Marshal.WriteIntPtr(info,owner);
          if(fault=="token-owner")throw new Exception("TOKEN_INJECT_OWNER");
          if(!SetTokenInformation(token,4,info,IntPtr.Size))throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_SET_OWNER");
          Marshal.Copy(aclBytes,0,acl,aclBytes.Length);Marshal.WriteIntPtr(info,acl);
          if(fault=="token-dacl")throw new Exception("TOKEN_INJECT_DACL");
          if(!SetTokenInformation(token,6,info,IntPtr.Size))throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_SET_DACL");
        }finally{Marshal.FreeHGlobal(owner);Marshal.FreeHGlobal(info);Marshal.FreeHGlobal(acl);}
        Verify(token,sid,true,knownDlls,production);record((knownDlls?"TOKEN_PROPOSED_PRIMARY=":"TOKEN_FILTERED_PRIMARY=")+new JavaScriptSerializer().Serialize(Snapshot(token)));success=true;return token;
      }finally{Marshal.FreeHGlobal(disabledSid);Marshal.FreeHGlobal(disabledEntry);if(!success&&token!=null)token.Dispose();}
  }
}

// This context is synthetic-only. The masks are one diagnostic cap, not minimum
// GDI rights. There is no default-object edit, token fallback or second candidate.
public sealed class NativePrivateDesktop : IDisposable {
  public const uint StationMask=0x0002037f, DesktopMask=0x000200ff;
  public const string DesktopName="Workload";
  public readonly string StationName;
  public string FullName {get{return StationName+"\\"+DesktopName;}}
  readonly Api api;
  readonly Action<string> record;
  readonly bool production;
  string creatorOwner;
  IntPtr station,desktop,originalStation,originalDesktop;
  bool restored;
  static readonly object selection=new object();
  [StructLayout(LayoutKind.Sequential)] struct SA {public int Size;public IntPtr Descriptor;public bool Inherit;}
  [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateWindowStationW(string name,uint flags,uint access,ref SA security);
  [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateDesktopW(string name,IntPtr device,IntPtr mode,uint flags,uint access,ref SA security);
  [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr OpenWindowStationW(string name,bool inherit,uint access);
  [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr OpenDesktopW(string name,uint flags,bool inherit,uint access);
  [DllImport("user32.dll",SetLastError=true)] static extern bool CloseWindowStation(IntPtr handle);
  [DllImport("user32.dll",SetLastError=true)] static extern bool CloseDesktop(IntPtr handle);
  [DllImport("user32.dll",SetLastError=true)] static extern bool SetProcessWindowStation(IntPtr handle);
  [DllImport("user32.dll",SetLastError=true)] static extern bool SetThreadDesktop(IntPtr handle);
  [DllImport("user32.dll",SetLastError=true)] static extern IntPtr GetProcessWindowStation();
  [DllImport("user32.dll",SetLastError=true)] static extern IntPtr GetThreadDesktop(uint thread);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool GetUserObjectInformationW(IntPtr handle,int kind,IntPtr buffer,uint length,out uint needed);
  [DllImport("user32.dll",SetLastError=true)] static extern bool GetUserObjectSecurity(IntPtr handle,ref uint information,byte[] buffer,uint length,out uint needed);
  static void Require(bool ok,string label){if(!ok)throw new Win32Exception(Marshal.GetLastWin32Error(),"PRIVATE_"+label);}
  public static string Contract(string station,string sid,string root,string sourceHash){return Contract(station,sid,root,sourceHash,false);}
  public static string Contract(string station,string sid,string root,string sourceHash,bool nodeDirect){return "private-session0.v1|station="+station+"|desktop="+DesktopName+"|service="+sid+"|root="+Path.GetFullPath(root).TrimEnd('\\')+"|hostSource="+sourceHash+"|stationMask=0x0002037f|desktopMask=0x000200ff|owner=BA|dacl=SY,BA,exactSID|noninherited|debugger=false|command="+(nodeDirect?"node-direct-ipc":"exit0")+"|deadlineMs=10000";}
  public static void VerifyBinding(string installed,string permitted,string installedName,string permittedName,string sid,string root,string sourceHash,string profile,string mode,string testEvent,string fault,bool synthetic){
    bool selected=mode=="private-desktop-command"||mode=="node-direct";
    if(!selected&&installed==""&&permitted==""&&installedName==""&&permittedName=="")return;
    if(!selected||!synthetic||profile!=NativeKnownDlls.Profile||testEvent!=""||fault!=""||installedName!=permittedName||
       !System.Text.RegularExpressions.Regex.IsMatch(installedName??"",@"^Task22Private_[a-f0-9]{32}$")||
       !System.Text.RegularExpressions.Regex.IsMatch(sourceHash??"",@"^[a-f0-9]{64}$")||installed!=permitted||installed!=Contract(installedName,sid,root,sourceHash,mode=="node-direct"))throw new Exception("PRIVATE_DESKTOP_COMPOSITION_BINDING");
  }
  public static string Descriptor(string sid,bool isDesktop){return "O:BAG:BAD:P(A;;0x"+(isDesktop?0xf01ffu:0xf037fu).ToString("x8")+";;;SY)(A;;0x"+(isDesktop?0xf01ffu:0xf037fu).ToString("x8")+";;;BA)(A;;0x"+(isDesktop?DesktopMask:StationMask).ToString("x8")+";;;"+sid+")";}
  public static string ProductionDescriptor(string sid,bool isDesktop){return Descriptor(sid,isDesktop).Replace("O:BAG:BA","O:"+sid+"G:"+sid)+"(A;;RC;;;OW)";}
  public static string ProductionDescriptor(string sid,bool isDesktop,string owner){
    if(owner!=sid&&owner!="S-1-5-18"&&owner!="S-1-5-32-544")throw new Exception("PRIVATE_CREATOR_OWNER");
    return Descriptor(sid,isDesktop).Replace("O:BAG:BA","O:"+owner+"G:"+owner)+"(A;;RC;;;OW)";
  }
  public static void VerifyProductionDescriptor(byte[] bytes,string sid,bool isDesktop){
    var actual=new RawSecurityDescriptor(bytes,0);var expected=new RawSecurityDescriptor(ProductionDescriptor(sid,isDesktop,actual.Owner.Value));
    if(actual.GetSddlForm(AccessControlSections.All)!=expected.GetSddlForm(AccessControlSections.All))throw new Exception("PRODUCTION_PRIVATE_DESCRIPTOR");
  }
  public static void VerifyDescriptor(byte[] bytes,string sid,bool isDesktop){
    var sd=new RawSecurityDescriptor(bytes,0);
    if(sd.Owner==null||sd.Owner.Value!="S-1-5-32-544"||sd.Group==null||sd.Group.Value!="S-1-5-32-544"||
       (sd.ControlFlags&ControlFlags.DiscretionaryAclProtected)==0||sd.DiscretionaryAcl==null||sd.DiscretionaryAcl.Count!=3)throw new Exception("PRIVATE_DESCRIPTOR_OWNER_DACL");
    var expected=new Dictionary<string,uint>{{"S-1-5-18",isDesktop?0xf01ffu:0xf037fu},{"S-1-5-32-544",isDesktop?0xf01ffu:0xf037fu},{sid,isDesktop?DesktopMask:StationMask}};
    foreach(GenericAce raw in sd.DiscretionaryAcl){var ace=raw as CommonAce;uint mask;
      if(ace==null||ace.IsCallback||ace.AceQualifier!=AceQualifier.AccessAllowed||ace.AceFlags!=AceFlags.None||!expected.TryGetValue(ace.SecurityIdentifier.Value,out mask)||unchecked((uint)ace.AccessMask)!=mask)throw new Exception("PRIVATE_DESCRIPTOR_ACE");
      expected.Remove(ace.SecurityIdentifier.Value);
    }
    if(expected.Count!=0)throw new Exception("PRIVATE_DESCRIPTOR_EXACT_SID");
    // Only SY/BA/serviceA can authorize either half of a full restricted check.
    // A filtered serviceB has BA deny-only and neither SY nor serviceA; BU and
    // RESTRICTED_CODE have no ACE. This is structural, not a sibling launch.
  }
  public class Api {
    public bool Dedicated;
    public virtual IntPtr CurrentStation(){return GetProcessWindowStation();}
    public virtual IntPtr CurrentDesktop(){return GetThreadDesktop(GetCurrentThreadId());}
    public virtual void SelectStation(IntPtr value){Require(SetProcessWindowStation(value),"SET_STATION");}
    public virtual void SelectDesktop(IntPtr value){Require(SetThreadDesktop(value),"SET_DESKTOP");}
    public virtual IntPtr Create(string name,string sddl,bool isDesktop){
      var sd=new RawSecurityDescriptor(sddl);byte[] bytes=new byte[sd.BinaryLength];sd.GetBinaryForm(bytes,0);IntPtr pointer=Marshal.AllocHGlobal(bytes.Length);
      try{Marshal.Copy(bytes,0,pointer,bytes.Length);var sa=new SA{Size=Marshal.SizeOf(typeof(SA)),Descriptor=pointer,Inherit=false};
        IntPtr result=isDesktop?CreateDesktopW(name,IntPtr.Zero,IntPtr.Zero,0,Dedicated?DesktopMask:0xf01ff,ref sa):CreateWindowStationW(name,1,Dedicated?StationMask:0xf037f,ref sa);
        int error=result==IntPtr.Zero?Marshal.GetLastWin32Error():0;
        if(Trace!=null)Trace("PRIVATE_CREATE kind="+(isDesktop?"desktop":"station")+" name="+name+" handle="+result+" error="+error+" flags="+(isDesktop?0:1)+" sddl="+sddl);
        if(result==IntPtr.Zero)throw new Win32Exception(error,"PRIVATE_CREATE_"+(isDesktop?"DESKTOP":"STATION"));return result;
      }finally{Marshal.FreeHGlobal(pointer);}
    }
    public Action<string> Trace;
    public virtual IntPtr Open(string name,uint mask,bool isDesktop,out int error){IntPtr h=isDesktop?OpenDesktopW(name,0,false,mask):OpenWindowStationW(name,false,mask);error=h==IntPtr.Zero?Marshal.GetLastWin32Error():0;return h;}
    public virtual void Close(IntPtr value,bool isDesktop){Require(isDesktop?CloseDesktop(value):CloseWindowStation(value),"CLOSE_"+(isDesktop?"DESKTOP":"STATION"));}
    public virtual string Name(IntPtr handle){uint needed;GetUserObjectInformationW(handle,2,IntPtr.Zero,0,out needed);if(needed==0||needed>65536)throw new Exception("PRIVATE_NAME_SIZE");IntPtr buffer=Marshal.AllocHGlobal((int)needed);try{Require(GetUserObjectInformationW(handle,2,buffer,needed,out needed),"NAME");return Marshal.PtrToStringUni(buffer);}finally{Marshal.FreeHGlobal(buffer);}}
    public virtual uint Flags(IntPtr handle){uint needed;IntPtr buffer=Marshal.AllocHGlobal(12);try{Require(GetUserObjectInformationW(handle,1,buffer,12,out needed),"FLAGS");if(Marshal.ReadInt32(buffer)!=0)throw new Exception("PRIVATE_INHERITABLE_HANDLE");return unchecked((uint)Marshal.ReadInt32(buffer,8));}finally{Marshal.FreeHGlobal(buffer);}}
    public virtual byte[] Security(IntPtr handle){uint information=7,needed;GetUserObjectSecurity(handle,ref information,null,0,out needed);if(needed==0||needed>65536)throw new Exception("PRIVATE_SD_SIZE");byte[] bytes=new byte[needed];Require(GetUserObjectSecurity(handle,ref information,bytes,needed,out needed),"SECURITY");Array.Resize(ref bytes,(int)needed);return bytes;}
    public virtual void AsToken(SafeFileHandle token,Action action){using(WindowsIdentity.Impersonate(token.DangerousGetHandle()))action();}
    public virtual void VerifyWorkload(SafeFileHandle token,string sid){NativeWorkloadToken.Verify(token,sid,true,true,true);}
  }
  NativePrivateDesktop(string name,Api operations,Action<string> trace,bool dedicated=false){StationName=name;api=operations;record=trace;api.Trace=trace;production=dedicated;}
  void BrokerSetup(string sid,bool acquire){lock(selection){
    originalStation=api.CurrentStation();originalDesktop=api.CurrentDesktop();
    if(originalStation==IntPtr.Zero||originalDesktop==IntPtr.Zero)throw new Exception("PRIVATE_ORIGINAL_ASSOCIATION");
    try{
      int error;
      station=acquire?api.Open(StationName,StationMask,false,out error):api.Create(StationName,ProductionDescriptor(sid,false,creatorOwner),false);
      if(station==IntPtr.Zero)throw new Exception("PRIVATE_BROKER_STATION_ABSENT");
      api.SelectStation(station);
      if(!acquire){IntPtr collision=api.Open(DesktopName,DesktopMask,true,out error);if(collision!=IntPtr.Zero){api.Close(collision,true);throw new Exception("PRIVATE_DESKTOP_COLLISION");}if(error!=2)throw new Exception("PRIVATE_DESKTOP_ABSENCE_UNPROVEN");}
      desktop=acquire?api.Open(DesktopName,DesktopMask,true,out error):api.Create(DesktopName,ProductionDescriptor(sid,true,creatorOwner),true);
      if(desktop==IntPtr.Zero)throw new Exception("PRIVATE_BROKER_DESKTOP_ABSENT");
      if(acquire){Describe(station,StationName,sid,false);Describe(desktop,DesktopName,sid,true);}
    }finally{try{api.SelectStation(originalStation);}finally{api.SelectDesktop(originalDesktop);}if(api.CurrentStation()!=originalStation||api.CurrentDesktop()!=originalDesktop)throw new Exception("PRIVATE_RESTORE_ASSOCIATION_MISMATCH");restored=true;}
  }}
  public static NativePrivateDesktop CreateBroker(string name,string sid){
    if(Process.GetCurrentProcess().SessionId!=0)throw new Exception("PRIVATE_SESSION0_REQUIRED");
    string owner;
    using(var source=NativeWorkloadToken.Open(Process.GetCurrentProcess().Handle))owner=CreatorOwner(NativeWorkloadToken.Snapshot(source),sid);
    return BrokerContext(name,sid,false,owner);
  }
  public static string CreatorOwner(Dictionary<string,object> token,string sid){
    bool admin=false,service=(string)token["user"]==sid;
    foreach(var group in (List<Dictionary<string,object>>)token["groups"]){uint attributes=(uint)group["attributes"];string id=(string)group["sid"];
      if(id=="S-1-5-32-544"&&(attributes&0x14)==4)admin=true;
      if(id==sid&&(attributes&0x1c)==12)service=true;
    }
    if(!admin||((string)token["user"]!="S-1-5-18"&&!service)||((List<Dictionary<string,object>>)token["restrictedSids"]).Count!=0)throw new Exception("PRIVATE_BROKER_PRIVILEGED_CREATOR_REQUIRED");
    return service?sid:"S-1-5-18";
  }
  public static NativePrivateDesktop AcquireBroker(string name,string sid){
    using(var source=NativeWorkloadToken.Open(Process.GetCurrentProcess().Handle))NativeWorkloadToken.Verify(source,sid,false,false,true);
    return BrokerContext(name,sid,true,null);
  }
  static NativePrivateDesktop BrokerContext(string name,string sid,bool acquire,string owner){
    if(Process.GetCurrentProcess().SessionId!=0||!System.Text.RegularExpressions.Regex.IsMatch(name,@"^(Portal|Image)Production_[a-f0-9]{32}$"))throw new Exception("PRIVATE_BROKER_BINDING");
    var context=new NativePrivateDesktop(name,new Api{Dedicated=true},line=>{},true){creatorOwner=owner};Exception failure=null;
    var thread=new Thread(()=>{try{context.BrokerSetup(sid,acquire);}catch(Exception error){failure=error;}});thread.Start();thread.Join();
    if(failure!=null){context.ReleaseBroker();throw failure;}return context;
  }
  public void VerifyRestricted(SafeFileHandle token,string sid,Action<string> trace){
    Exception failure=null;var thread=new Thread(()=>{try{RestrictedSetup(token,sid);}catch(Exception error){failure=error;}});thread.Start();thread.Join();
    if(failure!=null)throw failure;trace("PRIVATE_BROKER_RESTRICTED_PROBES_PASS name="+FullName);
  }
  void RestrictedSetup(SafeFileHandle token,string sid){lock(selection){
    api.VerifyWorkload(token,sid);
    IntPtr previous=api.CurrentStation(),previousDesktop=api.CurrentDesktop();try{
      api.SelectStation(station);Probe(token,sid,false,StationMask,true);Probe(token,sid,true,DesktopMask,true);
      foreach(uint mask in new uint[]{0x40000,0x80000}){Probe(token,sid,false,mask,false);Probe(token,sid,true,mask|0x81,false);}
    }finally{try{api.SelectStation(previous);api.SelectDesktop(previousDesktop);if(api.CurrentStation()!=previous||api.CurrentDesktop()!=previousDesktop)throw new Exception("PRIVATE_RESTORE_ASSOCIATION_MISMATCH");}catch{restored=false;throw;}}
  }}
  public void ReleaseBroker(){lock(selection){
    if(!restored&&(station!=IntPtr.Zero||desktop!=IntPtr.Zero))throw new Exception("PRIVATE_RESTORATION_UNCONFIRMED_HANDLES_RETAINED");
    if(desktop!=IntPtr.Zero){api.Close(desktop,true);desktop=IntPtr.Zero;}if(station!=IntPtr.Zero){api.Close(station,false);station=IntPtr.Zero;}
  }}
  void Describe(IntPtr handle,string expected,string sid,bool isDesktop){
    string actual=api.Name(handle);uint flags=api.Flags(handle);byte[] bytes=api.Security(handle);
    record("PRIVATE_OBJECT name="+actual+" handle="+handle+" flags="+flags+" rawDescriptorBase64="+Convert.ToBase64String(bytes)+" sddl="+new RawSecurityDescriptor(bytes,0).GetSddlForm(AccessControlSections.All));
    if(actual!=expected||flags!=0)throw new Exception("PRIVATE_NAME_OR_FLAGS");if(production)VerifyProductionDescriptor(bytes,sid,isDesktop);else VerifyDescriptor(bytes,sid,isDesktop);
  }
  void Probe(SafeFileHandle token,string sid,bool isDesktop,uint mask,bool allowed){
    string expected=isDesktop?DesktopName:StationName;IntPtr opened=IntPtr.Zero;int error=0;
    try{api.AsToken(token,()=>opened=api.Open(expected,mask,isDesktop,out error));
      record("PRIVATE_EFFECTIVE_OPEN kind="+(isDesktop?"desktop":"station")+" name="+expected+" mask=0x"+mask.ToString("x8")+" handle="+opened+" error="+error+" expected="+(allowed?"allow":"deny"));
      if((opened!=IntPtr.Zero)!=allowed||(!allowed&&error!=5))throw new Exception("PRIVATE_EFFECTIVE_OPEN_GATE");
      if(allowed)Describe(opened,expected,sid,isDesktop);
    }finally{if(opened!=IntPtr.Zero)api.Close(opened,isDesktop);}
  }
  void Setup(SafeFileHandle token,string sid){lock(selection){
    originalStation=api.CurrentStation();originalDesktop=api.CurrentDesktop();
    if(originalStation==IntPtr.Zero||originalDesktop==IntPtr.Zero)throw new Exception("PRIVATE_ORIGINAL_ASSOCIATION");
    record("PRIVATE_ORIGINAL station="+api.Name(originalStation)+" stationHandle="+originalStation+" desktop="+api.Name(originalDesktop)+" desktopHandle="+originalDesktop);
    record("PRIVATE_ORIGINAL_NONINHERITED stationFlags="+api.Flags(originalStation)+" desktopFlags="+api.Flags(originalDesktop));
    try{
      station=api.Create(StationName,production?ProductionDescriptor(sid,false):Descriptor(sid,false),false);Describe(station,StationName,sid,false);api.SelectStation(station);
      int error;IntPtr collision=api.Open(DesktopName,DesktopMask,true,out error);
      if(collision!=IntPtr.Zero){api.Close(collision,true);throw new Exception("PRIVATE_DESKTOP_COLLISION");}
      record("PRIVATE_DESKTOP_PRECREATE_ABSENCE name="+FullName+" error="+error);if(error!=2)throw new Exception("PRIVATE_DESKTOP_ABSENCE_UNPROVEN");
      desktop=api.Create(DesktopName,production?ProductionDescriptor(sid,true):Descriptor(sid,true),true);Describe(desktop,DesktopName,sid,true);
      Probe(token,sid,false,StationMask,true);Probe(token,sid,true,DesktopMask,true);
      foreach(uint mask in new uint[]{0x40000,0x80000}){Probe(token,sid,false,mask,false);Probe(token,sid,true,mask|0x81,false);}
      record("PRIVATE_STRUCTURAL_PEER_DENIAL serviceB_BU_RESTRICTED_CODE=True actualSiblingRuntime=False masksAreDiagnosticCaps=True");
    }finally{
      // Restore before closing any created object, even after failed creation or
      // an effective-open denial. Never close borrowed original handles.
      try{api.SelectStation(originalStation);}finally{api.SelectDesktop(originalDesktop);}
      if(api.CurrentStation()!=originalStation||api.CurrentDesktop()!=originalDesktop)throw new Exception("PRIVATE_RESTORE_ASSOCIATION_MISMATCH");
      restored=true;record("PRIVATE_ASSOCIATION_RESTORED stationHandle="+originalStation+" desktopHandle="+originalDesktop);
    }
  }}
  public static NativePrivateDesktop Create(string name,string sid,SafeFileHandle token,Action<string> record,bool production=false){
    if(Process.GetCurrentProcess().SessionId!=0)throw new Exception("PRIVATE_SESSION0_REQUIRED");
    var context=new NativePrivateDesktop(name,new Api{Dedicated=production},record,production);Exception failure=null;
    // A new managed thread has no windows/hooks. No other host USER work runs
    // until Join; process-wide selection is serialized inside Setup.
    var setup=new Thread(()=>{try{context.Setup(token,sid);}catch(Exception error){failure=error;}});setup.IsBackground=false;setup.Start();setup.Join();
    if(failure!=null){
      if(!context.restored&&(context.station!=IntPtr.Zero||context.desktop!=IntPtr.Zero)){
        record("PRIVATE_RESTORATION_FAILED_LIVE originalUSERHandlesRetained=True noChildCreated=True failure="+failure);
        new ManualResetEvent(false).WaitOne();
      }
      context.Dispose();throw failure;
    }return context;
  }
  sealed class TestApi : Api {
    public string Failure;
    public IntPtr Station=new IntPtr(1),Desktop=new IntPtr(2);
    public readonly List<string> Calls=new List<string>();
    public bool StationExists,DesktopExists;
    public bool BrokerPhase,RestrictedPhase,InToken,RejectWorkload;
    public string Owner;
    public SafeFileHandle ExpectedToken;
    readonly string name,sid;
    public TestApi(string stationName,string service){name=stationName;sid=service;}
    public override IntPtr CurrentStation(){return Station;}
    public override IntPtr CurrentDesktop(){return Desktop;}
    public override void SelectStation(IntPtr value){Calls.Add("selectStation:"+value);if(value==new IntPtr(1)&&Failure=="restore-station")throw new Exception("TEST_RESTORE_STATION");Station=value;}
    public override void SelectDesktop(IntPtr value){Calls.Add("selectDesktop:"+value);if(value==new IntPtr(2)&&Failure=="restore-desktop")throw new Exception("TEST_RESTORE_DESKTOP");Desktop=value;}
    public override IntPtr Create(string value,string sddl,bool isDesktop){if(RestrictedPhase)throw new Exception("PRIVATE_TEST_RESTRICTED_CREATION");Calls.Add(isDesktop?"createDesktop":"createStation");if(Failure==(isDesktop?"create-desktop":"create-station"))throw new Exception("TEST_CREATE");if(isDesktop){DesktopExists=true;return new IntPtr(4);}StationExists=true;return new IntPtr(3);}
    public override IntPtr Open(string value,uint mask,bool isDesktop,out int error){
      if(RestrictedPhase&&!InToken)throw new Exception("PRIVATE_TEST_UNRESTRICTED_PROBE");
      if(BrokerPhase&&(!isDesktop||DesktopExists))throw new Exception("PRIVATE_TEST_PRIVILEGED_PROBE");
      Calls.Add("open:"+value+":"+mask);error=0;
      if(!(isDesktop?DesktopExists:StationExists)){error=2;return IntPtr.Zero;}
      if((mask&0xc0000)!=0){error=5;return IntPtr.Zero;}
      if(Failure=="effective-open"){error=5;return IntPtr.Zero;}
      return isDesktop?new IntPtr(6):new IntPtr(5);
    }
    public override void Close(IntPtr value,bool isDesktop){Calls.Add("close:"+value);if(value==new IntPtr(3))StationExists=false;if(value==new IntPtr(4))DesktopExists=false;}
    public override string Name(IntPtr value){return value==new IntPtr(1)?"originalStation":value==new IntPtr(2)?"originalDesktop":value==new IntPtr(3)||value==new IntPtr(5)?name:DesktopName;}
    public override uint Flags(IntPtr value){return 0;}
    public override byte[] Security(IntPtr value){if(BrokerPhase)throw new Exception("PRIVATE_TEST_PRIVILEGED_INSPECTION");var sd=new RawSecurityDescriptor(Owner==null?Descriptor(sid,value==new IntPtr(4)||value==new IntPtr(6)):ProductionDescriptor(sid,value==new IntPtr(4)||value==new IntPtr(6),Owner));byte[] bytes=new byte[sd.BinaryLength];sd.GetBinaryForm(bytes,0);return bytes;}
    public override void AsToken(SafeFileHandle token,Action action){if(BrokerPhase)throw new Exception("PRIVATE_TEST_PRIVILEGED_PROBE");if(ExpectedToken!=null&&!Object.ReferenceEquals(token,ExpectedToken))throw new Exception("PRIVATE_TEST_TOKEN_SUBSTITUTED");Calls.Add("exactTokenImpersonation");InToken=true;try{action();}finally{InToken=false;}}
    public override void VerifyWorkload(SafeFileHandle token,string service){if(RejectWorkload||!Object.ReferenceEquals(token,ExpectedToken))throw new Exception("PRIVATE_TEST_UNRESTRICTED_WORKLOAD");Calls.Add("verifyRestrictedToken");}
  }
  public static string[] BrokerTests(string sid){
    var results=new List<string>();string name="PortalProduction_"+new string('2',32);
    using(var token=new SafeFileHandle(new IntPtr(99),false))foreach(string owner in new[]{sid,"S-1-5-18"}){
      var operations=new TestApi(name,sid){Owner=owner,BrokerPhase=true,ExpectedToken=token};var creator=new NativePrivateDesktop(name,operations,line=>{},true){creatorOwner=owner};
      creator.BrokerSetup(sid,false);
      try{operations.AsToken(token,()=>{});throw new Exception("PRIVATE_TEST_PRIVILEGED_PROBE_ACCEPTED");}catch(Exception error){if(error.Message!="PRIVATE_TEST_PRIVILEGED_PROBE")throw;}
      if(creator.station!=new IntPtr(3)||creator.desktop!=new IntPtr(4)||!creator.restored)throw new Exception("PRIVATE_TEST_CREATOR_CUSTODY");
      foreach(string call in operations.Calls)if(call!="createStation"&&call!="createDesktop"&&call!="selectStation:3"&&call!="selectStation:1"&&call!="selectDesktop:2"&&call!="open:Workload:"+DesktopMask)throw new Exception("PRIVATE_TEST_PRIVILEGED_SCOPE_"+call);
      operations.BrokerPhase=false;operations.Calls.Clear();var host=new NativePrivateDesktop(name,operations,line=>{},true);host.BrokerSetup(sid,true);
      if(host.station!=new IntPtr(5)||host.desktop!=new IntPtr(6)||operations.Calls.Contains("createStation")||operations.Calls.Contains("createDesktop"))throw new Exception("PRIVATE_TEST_HANDLE_HANDOFF");
      operations.RestrictedPhase=true;host.RestrictedSetup(token,sid);
      try{operations.Create(name,ProductionDescriptor(sid,false,owner),false);throw new Exception("PRIVATE_TEST_RESTRICTED_CREATION_ACCEPTED");}catch(Exception error){if(error.Message!="PRIVATE_TEST_RESTRICTED_CREATION")throw;}
      if(operations.Calls.FindAll(x=>x=="exactTokenImpersonation").Count!=6)throw new Exception("PRIVATE_TEST_RESTRICTED_PROBE_COUNT");
      operations.RejectWorkload=true;try{host.RestrictedSetup(token,sid);throw new Exception("PRIVATE_TEST_UNRESTRICTED_ACCEPTED");}catch(Exception error){if(error.Message!="PRIVATE_TEST_UNRESTRICTED_WORKLOAD")throw;}
      operations.RejectWorkload=false;try{host.RestrictedSetup(null,sid);throw new Exception("PRIVATE_TEST_SUBSTITUTED_ACCEPTED");}catch(Exception error){if(error.Message!="PRIVATE_TEST_UNRESTRICTED_WORKLOAD")throw;}
      operations.RestrictedPhase=false;host.ReleaseBroker();creator.ReleaseBroker();results.Add("owner="+owner+" privileged-create-only retained-handles restricted-probes unrestricted-and-substitution-denied");
    }
    return results.ToArray();
  }
  public static string[] FailureTests(string sid){
    var results=new List<string>();string name="Task22Private_"+new string('1',32);
    foreach(string fault in new[]{"create-station","create-desktop","effective-open","restore-station","restore-desktop",""}){
      var operations=new TestApi(name,sid){Failure=fault};var context=new NativePrivateDesktop(name,operations,line=>{});Exception failure=null;
      try{context.Setup(null,sid);}catch(Exception error){failure=error;}
      if((failure==null)!=(fault==""))throw new Exception("PRIVATE_TEST_FAILURE_EXPECTATION_"+fault);
      bool restoreFailure=fault.StartsWith("restore-",StringComparison.Ordinal);
      try{context.Dispose();if(restoreFailure)throw new Exception("PRIVATE_TEST_RESTORE_CUSTODY_LOST");}
      catch(Exception error){if(!restoreFailure||error.Message!="PRIVATE_RESTORATION_UNCONFIRMED_HANDLES_RETAINED")throw;}
      if(restoreFailure){if(operations.Calls.Exists(x=>x=="close:3"||x=="close:4"))throw new Exception("PRIVATE_TEST_CLOSED_WHILE_ASSOCIATED");}
      else{
        if(operations.Station!=new IntPtr(1)||operations.Desktop!=new IntPtr(2)||operations.StationExists||operations.DesktopExists)throw new Exception("PRIVATE_TEST_CLEANUP_EXACT");
        int restoredAt=operations.Calls.IndexOf("selectDesktop:2"),closeAt=operations.Calls.FindIndex(x=>x=="close:3"||x=="close:4");
        if(closeAt>=0&&closeAt<restoredAt)throw new Exception("PRIVATE_TEST_CLOSE_PRECEDED_RESTORE");
      }
      results.Add("fault="+(fault==""?"none":fault)+" failure="+(failure==null?"none":failure.Message)+" exactCalls="+String.Join(",",operations.Calls));
    }
    return results.ToArray();
  }
  public void Dispose(){lock(selection){
    if(!restored&&(station!=IntPtr.Zero||desktop!=IntPtr.Zero))throw new Exception("PRIVATE_RESTORATION_UNCONFIRMED_HANDLES_RETAINED");
    if(desktop!=IntPtr.Zero){api.Close(desktop,true);record("PRIVATE_CLOSE_DESKTOP originalHandle="+desktop);desktop=IntPtr.Zero;}
    if(station!=IntPtr.Zero){api.Close(station,false);record("PRIVATE_CLOSE_STATION originalHandle="+station);station=IntPtr.Zero;}
    int error;IntPtr remaining=api.Open(StationName,StationMask,false,out error);
    if(remaining!=IntPtr.Zero){api.Close(remaining,false);throw new Exception("PRIVATE_STATION_STILL_EXISTS");}
    record("PRIVATE_CLEANUP_EXACT station="+StationName+" desktop="+FullName+" stationOpenError="+error+" originalHandlesClosed=True");
    if(error!=2)throw new Exception("PRIVATE_STATION_ABSENCE_UNPROVEN");
  }}
}

public sealed class NativeOuterChild : IDisposable {
  public readonly ManualResetEvent ExitObserved=new ManualResetEvent(false);
  internal SafeFileHandle Job, ProcessHandle;
  public static Action<string> CleanupObserved;
  static readonly ManualResetEvent cleanupCustody=new ManualResetEvent(false);
  public Process Process;
  public StreamWriter Input;
  public StreamReader Output, Error;
  SafeFileHandle retainedThread;
  public readonly MemoryStream PrivateStdout=new MemoryStream(),PrivateStderr=new MemoryStream();
  public Task PrivateOutDrain,PrivateErrDrain;
  public readonly Stopwatch PrivateDeadline=new Stopwatch();
  [StructLayout(LayoutKind.Sequential)] struct SA { public int Size; public IntPtr Descriptor; public bool Inherit; }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct SI {
    public int Size; public string Reserved, Desktop, Title; public int X,Y,XSize,YSize,XCount,YCount,Fill;
    public uint Flags; public short Show, Reserved2; public IntPtr Reserved2Ptr, Input, Output, Error;
  }
  [StructLayout(LayoutKind.Sequential)] struct SIX { public SI Startup; public IntPtr Attributes; }
  [StructLayout(LayoutKind.Sequential)] struct PI { public IntPtr Process, Thread; public int Pid,Tid; }
  [StructLayout(LayoutKind.Sequential)] struct BASIC { public long ProcessTime,JobTime; public uint Flags; public IntPtr Min,Max; public uint Active; public IntPtr Affinity; public uint Priority,Scheduling; }
  [StructLayout(LayoutKind.Sequential)] struct IO { public ulong R,W,O,RB,WB,OB; }
  [StructLayout(LayoutKind.Sequential)] struct LIMIT { public BASIC Basic; public IO Io; public IntPtr ProcessMemory,JobMemory,PeakProcess,PeakJob; }
  [DllImport("kernel32.dll", SetLastError=true)] static extern SafeFileHandle CreateJobObject(IntPtr security, IntPtr name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(SafeFileHandle job, int kind, ref LIMIT limits, int size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CreatePipe(out SafeFileHandle read, out SafeFileHandle write, ref SA security, int size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetHandleInformation(SafeFileHandle handle,uint mask,uint flags);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr list,int count,int flags,ref IntPtr size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr list,uint flags,IntPtr key,IntPtr value,IntPtr size,IntPtr previous,IntPtr returned);
  [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr list);
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool CreateProcessAsUserW(SafeFileHandle token,string application,StringBuilder command,IntPtr processAttributes,IntPtr threadAttributes,bool inherit,uint flags,IntPtr environment,string directory,ref SIX startup,out PI info);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint ResumeThread(SafeFileHandle thread);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint SuspendThread(SafeFileHandle thread);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool TerminateProcess(SafeFileHandle process,uint code);
  [DllImport("kernel32.dll", SetLastError=true)] internal static extern uint WaitForSingleObject(SafeFileHandle handle,uint milliseconds);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool IsProcessInJob(IntPtr process,SafeFileHandle job,out bool inside);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetExitCodeProcess(SafeFileHandle process,out uint code);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool QueryInformationJobObject(SafeFileHandle job,int kind,IntPtr buffer,int length,out int needed);
  public uint OriginalExitCode(){uint code;Check(GetExitCodeProcess(ProcessHandle,out code),"ORIGINAL_EXIT_CODE");return code;}
  static void ConfirmCreatedCleanup(Func<bool> terminate,Func<int> lastError,Func<uint> wait,Action<string> record,Action retain){
    bool terminated=terminate();int error=terminated?0:lastError();uint waited=wait();
    record("CREATED_CHILD_CLEANUP terminated="+terminated+" terminationError="+error+" wait="+waited);
    if(waited!=0){record("OUTER_FAILED_CREATED_CHILD_CUSTODY wait="+waited+" error="+lastError());retain();}
  }
  public static string[] CleanupFailureTests(){
    var results=new List<string>();
    foreach(bool terminated in new[]{true,false})foreach(uint waited in new uint[]{0,258,0xffffffff}){
      bool retained=false;var calls=new List<string>();
      ConfirmCreatedCleanup(()=>{calls.Add("terminate-original");return terminated;},()=>5,()=>{calls.Add("wait-original");return waited;},line=>calls.Add(line),()=>{retained=true;calls.Add("retain-original-process-thread-job");});
      if(retained!=(waited!=0)||calls[0]!="terminate-original"||calls[1]!="wait-original")throw new Exception("PRIVATE_CREATED_CLEANUP_TEST");
      results.Add(String.Join(";",calls));
    }
    return results.ToArray();
  }
  public bool Contains(Process process) { bool inside; if (!IsProcessInJob(process.Handle,Job,out inside)) throw ErrorAt("MEMBERSHIP"); return inside; }
  static Exception ErrorAt(string step) { return new Win32Exception(Marshal.GetLastWin32Error(),"OUTER_"+step); }
  static void Check(bool ok,string step) { if (!ok) throw ErrorAt(step); }
  public static NativeOuterChild Start(SafeFileHandle token,string sid,string fault,string executable,string arguments,string directory,IDictionary<string,string> variables,Action<int> beforeResume,bool knownDlls=false,string privateDesktop=null,Action<NativeOuterChild> suspendedReady=null,Action<StreamReader,bool> pump=null,bool production=false) {
    NativeWorkloadToken.Verify(token,sid,true,knownDlls,production);
    var child = new NativeOuterChild();
    SafeFileHandle inputRead=null,inputWrite=null,outputRead=null,outputWrite=null,errorRead=null,errorWrite=null,thread=null;
    IntPtr attributes=IntPtr.Zero,handles=IntPtr.Zero,jobs=IntPtr.Zero,environment=IntPtr.Zero;
    bool initialized=false,created=false,success=false;
    try {
      child.Job=CreateJobObject(IntPtr.Zero,IntPtr.Zero); Check(!child.Job.IsInvalid,"CREATE_JOB");
      var limits = new LIMIT(); limits.Basic.Flags=0x2000;
      Check(SetInformationJobObject(child.Job,9,ref limits,Marshal.SizeOf(typeof(LIMIT))),"KILL_ON_CLOSE");
      var sa = new SA { Size=Marshal.SizeOf(typeof(SA)), Inherit=true };
      Check(CreatePipe(out inputRead,out inputWrite,ref sa,0),"INPUT");
      Check(CreatePipe(out outputRead,out outputWrite,ref sa,0),"OUTPUT");
      Check(CreatePipe(out errorRead,out errorWrite,ref sa,0),"ERROR");
      Check(SetHandleInformation(inputWrite,1,0) && SetHandleInformation(outputRead,1,0) && SetHandleInformation(errorRead,1,0),"PIPE_INHERIT");
      IntPtr size=IntPtr.Zero; InitializeProcThreadAttributeList(IntPtr.Zero,2,0,ref size);
      attributes=Marshal.AllocHGlobal(size);
      Check(InitializeProcThreadAttributeList(attributes,2,0,ref size),"ATTR_INIT"); initialized=true;
      handles=Marshal.AllocHGlobal(IntPtr.Size*3); jobs=Marshal.AllocHGlobal(IntPtr.Size);
      Marshal.WriteIntPtr(handles,0,inputRead.DangerousGetHandle()); Marshal.WriteIntPtr(handles,IntPtr.Size,outputWrite.DangerousGetHandle()); Marshal.WriteIntPtr(handles,IntPtr.Size*2,errorWrite.DangerousGetHandle());
      Marshal.WriteIntPtr(jobs,child.Job.DangerousGetHandle());
      Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20002),handles,new IntPtr(IntPtr.Size*3),IntPtr.Zero,IntPtr.Zero),"HANDLE_LIST");
      if(fault=="job-list")throw new Exception("TOKEN_INJECT_JOB_LIST");
      Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x2000d),jobs,new IntPtr(IntPtr.Size),IntPtr.Zero,IntPtr.Zero),"JOB_LIST");
      var keys=new List<string>(variables.Keys); keys.Sort(StringComparer.OrdinalIgnoreCase); var block=new StringBuilder();
      foreach (string key in keys) block.Append(key).Append('=').Append(variables[key]).Append('\0'); block.Append('\0');
      environment=Marshal.StringToHGlobalUni(block.ToString());
      var startup=new SIX(); startup.Startup.Size=Marshal.SizeOf(typeof(SIX)); startup.Startup.Flags=0x100; startup.Attributes=attributes;
      startup.Startup.Desktop=privateDesktop;
      startup.Startup.Input=inputRead.DangerousGetHandle(); startup.Startup.Output=outputWrite.DangerousGetHandle(); startup.Startup.Error=errorWrite.DangerousGetHandle();
      PI info;
      if(fault=="process-create")throw new Exception("TOKEN_INJECT_PROCESS_CREATE");
      Check(CreateProcessAsUserW(token,executable,new StringBuilder("\""+executable+"\" "+arguments),IntPtr.Zero,IntPtr.Zero,true,0x08080404,environment,directory,ref startup,out info),"CREATE_PROCESS_AS_USER");
      child.ProcessHandle=new SafeFileHandle(info.Process,true); thread=new SafeFileHandle(info.Thread,true); created=true;
      child.Process=Process.GetProcessById(info.Pid); if (child.Process.Handle==IntPtr.Zero || !child.Contains(child.Process)) throw new Exception("OUTER_ATOMIC_MEMBERSHIP");
      if(CleanupObserved!=null)CleanupObserved("CREATED_CONTEXT pid="+info.Pid+" tid="+info.Tid+" createdUtc="+child.Process.StartTime.ToUniversalTime().ToString("o")+" session="+child.Process.SessionId+" desktop="+(privateDesktop??"<null>")+" flags=0x08080404 processHandle="+info.Process+" threadHandle="+info.Thread+" jobHandle="+child.Job.DangerousGetHandle()+" executable="+executable+" arguments="+arguments+" cwd="+directory+" environment="+new JavaScriptSerializer().Serialize(variables));
      if(privateDesktop!=null){
        if(child.Process.SessionId!=0)throw new Exception("PRIVATE_CHILD_SESSION_DRIFT");
        int needed;IntPtr ui=Marshal.AllocHGlobal(4),observed=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(LIMIT)));
        try{
          Check(QueryInformationJobObject(child.Job,4,ui,4,out needed),"QUERY_UI");uint restrictions=unchecked((uint)Marshal.ReadInt32(ui));
          Check(QueryInformationJobObject(child.Job,9,observed,Marshal.SizeOf(typeof(LIMIT)),out needed),"QUERY_LIMITS");var actual=(LIMIT)Marshal.PtrToStructure(observed,typeof(LIMIT));
          if(restrictions!=0||actual.Basic.Flags!=0x2000)throw new Exception("PRIVATE_JOB_POLICY_DRIFT");
          CleanupObserved("PRIVATE_ATOMIC_JOB membership=True uiRestrictions="+restrictions+" limitFlags=0x"+actual.Basic.Flags.ToString("x8")+" handleList=stdin,stdout,stderr privateUSERHandlesInherited=False");
        }finally{Marshal.FreeHGlobal(ui);Marshal.FreeHGlobal(observed);}
      }
      NativeWorkloadToken.VerifyProcess(child.ProcessHandle.DangerousGetHandle(),sid,CleanupObserved,pump==null?"SUSPENDED_POWERSHELL":"SUSPENDED_NODE_SUPERVISOR",knownDlls,production);
      if(knownDlls){child.Process.Exited+=(s,e)=>child.ExitObserved.Set();child.Process.EnableRaisingEvents=true;if(CleanupObserved!=null)CleanupObserved("EXIT_SUBSCRIBED_BEFORE_RESUME=True");}
      if(privateDesktop!=null){
        inputRead.Dispose();inputRead=null;outputWrite.Dispose();outputWrite=null;errorWrite.Dispose();errorWrite=null;
        child.Input=new StreamWriter(new FileStream(inputWrite,FileAccess.Write,4096,false),new UTF8Encoding(false));inputWrite=null;child.Input.AutoFlush=true;
        child.Output=new StreamReader(new FileStream(outputRead,FileAccess.Read,4096,false));outputRead=null;
        child.Error=new StreamReader(new FileStream(errorRead,FileAccess.Read,4096,false));errorRead=null;
        child.PrivateOutDrain=pump==null?child.Output.BaseStream.CopyToAsync(child.PrivateStdout):Task.Run(()=>pump(child.Output,false));
        child.PrivateErrDrain=pump==null?child.Error.BaseStream.CopyToAsync(child.PrivateStderr):Task.Run(()=>pump(child.Error,true));
        CleanupObserved("PRIVATE_OUTPUT_DRAINS_SUBSCRIBED_BEFORE_RESUME=True");
      }
      uint suspension=SuspendThread(thread);Check(suspension==1,"PRE_CALLBACK_SUSPEND_COUNT");Check(ResumeThread(thread)==2,"PRE_CALLBACK_RESTORE_COUNT");
      if(CleanupObserved!=null)CleanupObserved("CREATOR_SUSPEND_COUNT_BEFORE_CALLBACK="+suspension);
      if (beforeResume!=null) beforeResume(info.Pid);
      suspension=SuspendThread(thread);Check(suspension==1,"POST_CALLBACK_SUSPEND_COUNT");Check(ResumeThread(thread)==2,"POST_CALLBACK_RESTORE_COUNT");
      if(CleanupObserved!=null)CleanupObserved("CREATOR_SUSPEND_COUNT_AFTER_CALLBACK="+suspension);
      if(suspendedReady!=null)suspendedReady(child);
      if(fault=="resume")throw new Exception("TOKEN_INJECT_RESUME");
      if(privateDesktop!=null)child.PrivateDeadline.Start();
      Check(ResumeThread(thread)==1,"RESUME");
      if(privateDesktop!=null){child.retainedThread=thread;thread=null;success=true;return child;}
      inputRead.Dispose(); outputWrite.Dispose(); errorWrite.Dispose();
      child.Input=new StreamWriter(new FileStream(inputWrite,FileAccess.Write,4096,false),new UTF8Encoding(false)); inputWrite=null; child.Input.AutoFlush=true;
      child.Output=new StreamReader(new FileStream(outputRead,FileAccess.Read,4096,false)); outputRead=null;
      child.Error=new StreamReader(new FileStream(errorRead,FileAccess.Read,4096,false)); errorRead=null;
      success=true; return child;
    } finally {
      if (initialized) DeleteProcThreadAttributeList(attributes);
      if (attributes!=IntPtr.Zero) Marshal.FreeHGlobal(attributes); if (handles!=IntPtr.Zero) Marshal.FreeHGlobal(handles); if (jobs!=IntPtr.Zero) Marshal.FreeHGlobal(jobs); if (environment!=IntPtr.Zero) Marshal.FreeHGlobal(environment);
      foreach (var handle in new[]{inputRead,inputWrite,outputRead,outputWrite,errorRead,errorWrite}) if (handle!=null) handle.Dispose();
      if (!success) {
        // Never abandon a created suspended process. Original handles remain owned
        // until exit; an unconfirmed cleanup intentionally keeps this host alive.
        if (created) {
          ConfirmCreatedCleanup(()=>TerminateProcess(child.ProcessHandle,1),()=>Marshal.GetLastWin32Error(),()=>WaitForSingleObject(child.ProcessHandle,10000),
            line=>{if(CleanupObserved!=null)CleanupObserved(line);},()=>cleanupCustody.WaitOne());
        }
        child.Dispose();
      }
      if (thread!=null) thread.Dispose();
    }
  }
  public void Dispose() {
    if (Input!=null) Input.Dispose(); if (Output!=null) Output.Dispose(); if (Error!=null) Error.Dispose();
    if (Process!=null) Process.Dispose(); if (ProcessHandle!=null) ProcessHandle.Dispose(); if (Job!=null) Job.Dispose();
    if(retainedThread!=null)retainedThread.Dispose();PrivateStdout.Dispose();PrivateStderr.Dispose();
    ExitObserved.Dispose();
  }
}

public static class NativeServiceHost {
  public sealed class ImageSignals {
    public bool Ready,Drained;
    public void Accept(string line,bool error,bool stopping){
      if(error)return;
      if(line.StartsWith("image-only listening on ",StringComparison.Ordinal)){
        var match=System.Text.RegularExpressions.Regex.Match(line,@"^image-only listening on 127\.0\.0\.1:([1-9][0-9]{0,4})$");
        if(Ready||!match.Success||Int32.Parse(match.Groups[1].Value)>65535)throw new Exception("IMAGE_READY_PROTOCOL");Ready=true;
      }else if(line=="DRAINED"){
        if(!Ready||!stopping||Drained)throw new Exception("IMAGE_DRAIN_PROTOCOL");Drained=true;
      }
    }
  }
  static readonly ImageSignals imageSignals=new ImageSignals();
  public sealed class Signals {
    public int Supervisor,Application;
    public string State="starting";
    public int Accept(string line,bool diagnostic,bool stopRequested) {
      if(diagnostic)return 0;
      int id;
      if(line.StartsWith("NATIVE_BOOTSTRAP_SUPERVISOR_PID=",StringComparison.Ordinal)) {
        if(Supervisor!=0 || !Int32.TryParse(line.Substring(32),out id) || id<=0 || id==Application)throw new Exception("SERVICE_DUPLICATE_SUPERVISOR_IDENTITY");
        Supervisor=id;return id;
      }
      if(line.StartsWith("NATIVE_RUNTIME_PID=",StringComparison.Ordinal)) {
        if(Application!=0 || !Int32.TryParse(line.Substring(19),out id) || id<=0 || id==Supervisor)throw new Exception("SERVICE_DUPLICATE_APPLICATION_IDENTITY");
        Application=id;return id;
      }
      var match=System.Text.RegularExpressions.Regex.Match(line,@"^NATIVE_SUPERVISOR_STATE=(starting|ready|stopping|drained|stopped|failed) child=([1-9][0-9]*)$");
      if(!match.Success)return 0;
      string next=match.Groups[1].Value;
      if(!Int32.TryParse(match.Groups[2].Value,out id))throw new Exception("SERVICE_STATE_PID");
      if(next=="starting")return 0;
      if(Application==0 || id!=Application || Supervisor==0 || Supervisor==Application)throw new Exception("SERVICE_STATE_IDENTITY");
      if(next=="failed"){State=next;return 0;}
      bool valid=(State=="starting"&&next=="ready") || (State=="ready"&&next=="stopping"&&stopRequested) ||
        (State=="stopping"&&next=="drained") || (State=="drained"&&next=="stopped");
      if(!valid)throw new Exception("SERVICE_STATE_ORDER");State=next;return 0;
    }
  }
  delegate void ServiceMainDelegate(int argc,IntPtr argv);
  delegate uint HandlerDelegate(uint control,uint eventType,IntPtr eventData,IntPtr context);
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct TABLE { public string Name; public ServiceMainDelegate Main; }
  [StructLayout(LayoutKind.Sequential)] struct STATUS { public uint Type,State,Accepted,Win32,Specific,Checkpoint,Hint; }
  [StructLayout(LayoutKind.Sequential)] struct SID_ATTRIBUTES { public IntPtr Sid; public uint Attributes; }
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool StartServiceCtrlDispatcherW([In] TABLE[] table);
  [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr RegisterServiceCtrlHandlerExW(string name,HandlerDelegate handler,IntPtr context);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool SetServiceStatus(IntPtr service,ref STATUS status);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(IntPtr token,int kind,IntPtr info,int length,out int needed);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out SafeFileHandle token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool SetTokenInformation(SafeFileHandle token,int kind,IntPtr info,int length);
  [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
  static readonly JavaScriptSerializer json=new JavaScriptSerializer();
  static readonly object gate=new object();
  static readonly ManualResetEvent stop=new ManualResetEvent(false), ready=new ManualResetEvent(false), identityReady=new ManualResetEvent(false);
  static readonly List<IDisposable> pins=new List<IDisposable>();
  static readonly List<Process> members=new List<Process>();
  static ServiceMainDelegate mainCallback=ServiceMain;
  static HandlerDelegate handlerCallback=Handler;
  static string name,root,manifestPath,permitPath,statusPath,action;
  static IntPtr service;
  static STATUS status;
  static NativeOuterChild child;
  static NativePrivateDesktop privateContext;
  static StreamWriter log;
  static EventWaitHandle observation;
  static int stopRequested;
  static bool drained,stopped,protocolFailed;
  static bool project;
  static bool image;
  static bool filteredQualification;
  static bool nodeDirect;
  static readonly Signals signals=new Signals();
  static Dictionary<string,object> manifest,permit;
  static string S(Dictionary<string,object> value,string key) { return (string)value[key]; }
  static void Record(string value) { lock(gate) { log.WriteLine(DateTime.UtcNow.ToString("o")+" "+value); log.Flush(); if(observation!=null)observation.Set(); } }
  static void Report(uint state,uint error,uint checkpoint) {
    lock(gate) {
      status=new STATUS { Type=0x10,State=state,Accepted=(state==4?5u:0u),Win32=error,Checkpoint=checkpoint,Hint=(state==2||state==3?30000u:0u) };
      if (!SetServiceStatus(service,ref status)) throw new Win32Exception();
      Record("SCM_STATE="+state+" checkpoint="+checkpoint);
    }
  }
  public static uint Handler(uint control,uint eventType,IntPtr eventData,IntPtr context) {
    // No I/O, status transition or drain wait in the SCM dispatcher.
    if ((control==1 || control==5) && Interlocked.CompareExchange(ref stopRequested,1,0)==0) stop.Set();
    return 0;
  }
  static void VerifySid() {
    string expected=NativeInstallation.ServiceSid(name);
    if(project){using(var source=NativeWorkloadToken.Open(GetCurrentProcess()))NativeWorkloadToken.Verify(source,expected,false,false,true);return;}
    if(filteredQualification){using(var source=NativeWorkloadToken.Open(GetCurrentProcess()))NativeWorkloadToken.Verify(source,expected,false);return;}
    using (var identity=WindowsIdentity.GetCurrent()) {
      if (identity.User.Value!="S-1-5-19") throw new Exception("SERVICE_NOT_LOCALSERVICE");
      foreach (int kind in new[]{2,11}) {
        int length; GetTokenInformation(identity.Token,kind,IntPtr.Zero,0,out length); IntPtr buffer=Marshal.AllocHGlobal(length);
        try {
          if (!GetTokenInformation(identity.Token,kind,buffer,length,out length)) throw new Win32Exception();
          int count=Marshal.ReadInt32(buffer); int offset=IntPtr.Size==8?8:4; bool found=false;
          for (int i=0;i<count;i++) {
            var entry=(SID_ATTRIBUTES)Marshal.PtrToStructure(IntPtr.Add(buffer,offset+i*Marshal.SizeOf(typeof(SID_ATTRIBUTES))),typeof(SID_ATTRIBUTES));
            if (new SecurityIdentifier(entry.Sid).Value==expected && (entry.Attributes&4)!=0) found=true;
            if (!filteredQualification && kind==2 && new SecurityIdentifier(entry.Sid).Value=="S-1-5-32-544" && (entry.Attributes&4)!=0 && (entry.Attributes&0x10)==0)
              throw new Exception("SERVICE_LOCALSERVICE_ADMINISTRATOR_MEMBERSHIP");
          }
          if (!found) throw new Exception("SERVICE_RESTRICTED_SID_MISSING_"+kind);
        } finally { Marshal.FreeHGlobal(buffer); }
      }
    }
  }
  public static void VerifyProfile(string installation,string activation,bool synthetic) {
    if(!synthetic&&installation==NativeProductionActivation.Profile&&activation==installation)return;
    if(installation!=activation || (installation!=NativeWorkloadToken.Profile && installation!=NativeKnownDlls.Profile && installation!="production-host-admission.v1") || (!synthetic&&installation!="production-host-admission.v1"))throw new Exception("TOKEN_PROFILE_BINDING");
  }
  public static void VerifyContract(string installation,string activation,string sid,string root,bool synthetic) {
    if(!synthetic){if(installation!=""||activation!="")throw new Exception("TOKEN_CONTRACT_BINDING");return;}
    if(installation!=activation||installation!=NativeWorkloadToken.Contract(sid,root))throw new Exception("TOKEN_CONTRACT_BINDING");
  }
  public static void VerifyKnownDllsContract(string installation,string activation,string sid,string root,bool synthetic) {
    if(!synthetic||installation!=activation||installation!=NativeWorkloadToken.KnownDllsContract(sid,root))throw new Exception("TOKEN_KNOWNDLLS_CONTRACT_BINDING");
  }
  public static void VerifyDebuggerBinding(string mode,string eventName,string profile,bool synthetic) {
    if(mode!="debugger-command"&&!(mode=="known-dlls-command"&&eventName!=""))return;
    if(!synthetic||!System.Text.RegularExpressions.Regex.IsMatch(eventName,@"^Global\\Task22DebuggerArmed_[a-f0-9]{32}$")||
       (mode=="known-dlls-command"&&profile!=NativeKnownDlls.Profile)||
       (mode=="debugger-command"&&profile!=NativeWorkloadToken.Profile))throw new Exception("DEBUGGER_COMPOSITION_BINDING");
  }
  static void AdmitImage(){
    var selected=NativeServiceProfile.Select(name,root,NativeInstallation.ServiceSid(name));
    manifest=NativeProductionActivation.AdmitImageInstallation(root,name,NativeInstallation.Hash(Path.Combine(root,"code","native-service-host.cs")),pins);
    permitPath=Path.Combine(root,"action","permit.json");pins.Add(NativeInstallation.Pin(permitPath,false));NativeInstallation.AdmitAcl(permitPath,selected.Sid,false,false);
    permit=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(permitPath));
    if(S(permit,"schema")!="image-native-permit.v1"||S(permit,"scope")!=NativeProductionActivation.Kind||S(permit,"serviceName")!=name||S(permit,"serviceProfile")!="image"||S(permit,"installationSha256")!=NativeInstallation.Hash(manifestPath)||S(permit,"tokenProfile")!=NativeProductionActivation.Profile||S(permit,"fence")!="ENFORCED_ACTOR_EXCLUSION"||S(permit,"testMode")!="normal")throw new Exception("IMAGE_PERMIT_BINDING");
    action=S(permit,"actionId");if(!System.Text.RegularExpressions.Regex.IsMatch(action,@"^[a-f0-9]{32}$"))throw new Exception("IMAGE_ACTION");
    var activation=NativeProductionActivation.VerifyImageActivation(manifest,S(permit,"activationSha256"),action);
    string issuancePath=Path.Combine(root,"action","issuance.json");pins.Add(NativeInstallation.Pin(issuancePath,false));NativeInstallation.AdmitAcl(issuancePath,selected.Sid,false,false);
    var issuance=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(issuancePath));
    if(S(issuance,"activationSha256")!=S(permit,"activationSha256")||S(issuance,"permitSha256")!=NativeInstallation.Hash(permitPath)||S(issuance,"fence")!="PASS"||S(issuance,"actionId")!=action)throw new Exception("ACTIVATION_ISSUANCE_LOG");
    privateContext=NativeStartupAttestor.Request(selected,activation,S(permit,"activationSha256"),pins);
    using(var authority=NativeInstallation.Pin(selected.Authority,false))NativeProductionActivation.VerifyImageFence(activation);
    VerifySid();
    using(var lease=new FileStream(Path.Combine(root,"status","activation.lock"),FileMode.CreateNew,FileAccess.Write,FileShare.Read)){
      byte[] bytes=Encoding.UTF8.GetBytes(action+"\n"+NativeInstallation.Hash(permitPath));lease.Write(bytes,0,bytes.Length);lease.Flush(true);
    }
  }
  static void RunImage(){
    var selected=NativeServiceProfile.Image;string sid=selected.Sid;Report(2,0,1);NativeOuterChild.CleanupObserved=Record;
    var env=new Dictionary<string,string>{{"SystemRoot",Environment.GetFolderPath(Environment.SpecialFolder.Windows)},{"WINDIR",Environment.GetFolderPath(Environment.SpecialFolder.Windows)}};
    using(var source=NativeWorkloadToken.Open(GetCurrentProcess()))using(var workload=NativeWorkloadToken.CreateFromSource(source,sid,"",Record,true,true)){
      NativeKnownDlls.VerifyProduction(workload,Record);
      privateContext.VerifyRestricted(workload,sid,Record);
      child=NativeOuterChild.Start(workload,sid,"",Path.Combine(root,"code","image-only.exe"),"--config \""+Path.Combine(root,"private","image-config.json")+"\" --service-sid "+sid,Path.Combine(root,"code"),env,null,true,privateContext.FullName,null,Pump,true);
    }
    var exited=Task.Run(()=>NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0xffffffff));
    var readiness=Task.Run(()=>ready.WaitOne());
    if(Task.WhenAny(readiness,exited,Task.Delay(30000)).GetAwaiter().GetResult()!=readiness){
      if(!exited.IsCompleted)FailedLive("IMAGE_STARTUP_DEADLINE");throw new Exception("IMAGE_NOT_READY");
    }
    NativeWorkloadToken.VerifyProcess(child.ProcessHandle.DangerousGetHandle(),sid,Record,"IMAGE_APPLICATION",true,true);
    lock(gate){if(protocolFailed)throw new Exception("IMAGE_READY_PROTOCOL");}
    Report(4,0,0);Record("ACTUAL_READY image=True");
    if(WaitHandle.WaitAny(new[]{stop,exitedWait(exited)})==1)throw new Exception("IMAGE_UNEXPECTED_EXIT");
    Report(3,0,1);Record("STOP_SENT image=True");child.Input.WriteLine("STOP");child.Input.Flush();
    if(Task.WhenAny(exited,Task.Delay(20000)).GetAwaiter().GetResult()!=exited)FailedLive("IMAGE_DRAIN_DEADLINE");
    if(!Task.WaitAll(new[]{child.PrivateOutDrain,child.PrivateErrDrain},10000))throw new Exception("IMAGE_OUTPUT_DRAIN");
    lock(gate){if(!drained||!stopped||protocolFailed||child.OriginalExitCode()!=0)throw new Exception("IMAGE_DRAIN_UNCONFIRMED");}
    child.Job.Dispose();privateContext.Dispose();privateContext=null;Record("CLEAN_STOP image=True originalHandleExit=0 DRAINED=True");Report(1,0,0);
  }
  static void Admit() {
    root=Path.GetDirectoryName(manifestPath);
    image=name==NativeServiceProfile.Image.Service&&String.Equals(root,NativeServiceProfile.Image.Root,StringComparison.OrdinalIgnoreCase);
    if(image){project=true;AdmitImage();return;}
    project=name=="seoul-dengoku-tools-portal-native" && String.Equals(root.Replace('\\','/'),"E:/portal-authority",StringComparison.OrdinalIgnoreCase);
    bool synthetic=System.Text.RegularExpressions.Regex.IsMatch(name,@"^PortalNativeTest_[a-f0-9]{16}(_sibling)?$") &&
      System.Text.RegularExpressions.Regex.IsMatch(root.Replace('\\','/'),@"^E:/task22-native-service-[a-f0-9]{16}$",System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    if(!project&&!synthetic)throw new Exception("PROJECT_INSTALLATION_BINDING");
    string sid=NativeInstallation.ServiceSid(name);
    NativeInstallation.AdmitVolumeRoot("E:\\"); pins.Add(NativeInstallation.Pin("E:\\",true));
    pins.Add(NativeInstallation.Pin(root,true)); NativeInstallation.AdmitAcl(root,sid,false,true);
    pins.Add(NativeInstallation.Pin(manifestPath,false));
    manifest=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(manifestPath));
    if (S(manifest,"schema")!="portal-native-install.v1" || S(manifest,"serviceName")!=name) throw new Exception("INSTALL_BINDING");
    if(S(manifest,"scope")!=(project?"PROJECT_REVIEWED":"SYNTHETIC_OWNED"))throw new Exception("INSTALL_SCOPE");
    foreach (string directory in new[]{"code","action","data","temp","status"}) {
      string path=Path.Combine(root,directory);bool writable=directory=="data"||directory=="temp"||directory=="status";
      pins.Add(writable?NativeInstallation.PinWritableDirectory(path,sid):NativeInstallation.Pin(path,true)); NativeInstallation.AdmitAcl(path,sid,writable,true);
    }
    foreach (Dictionary<string,object> file in (IEnumerable)manifest["files"]) {
      string relative=S(file,"path");
      if (relative.IndexOf("..",StringComparison.Ordinal)>=0 || relative.IndexOf(':')>=0 || Path.IsPathRooted(relative)) throw new Exception("INSTALL_FILE_PATH");
      string path=Path.Combine(root,relative); pins.Add(NativeInstallation.Pin(path,false)); NativeInstallation.AdmitAcl(path,sid,false,false);
      if (NativeInstallation.Hash(path)!=S(file,"sha256")) throw new Exception("INSTALL_HASH_"+relative);
    }
    permitPath=Path.Combine(root,"action","permit.json"); pins.Add(NativeInstallation.Pin(permitPath,false)); NativeInstallation.AdmitAcl(permitPath,sid,false,false);
    permit=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(permitPath));
    if (S(permit,"schema")!="portal-native-permit.v1" || S(permit,"installationSha256")!=NativeInstallation.Hash(manifestPath) || S(permit,"serviceName")!=name ||
        S(permit,"scope")!=(project?NativeProductionActivation.Kind:"SYNTHETIC_OWNED") ||
        !System.Text.RegularExpressions.Regex.IsMatch(S(permit,"actionId"),@"^[a-f0-9]{32}$")) throw new Exception("ACTIVATION_PERMIT_INVALID");
    VerifyDebuggerBinding(S(permit,"testMode"),S(permit,"testEvent"),S(manifest,"tokenProfile"),synthetic);
    string hostSource=Path.Combine(root,"code","native-service-host.cs");
    if(!project)NativePrivateDesktop.VerifyBinding(manifest.ContainsKey("launchContext")?S(manifest,"launchContext"):"",permit.ContainsKey("launchContext")?S(permit,"launchContext"):"",
      manifest.ContainsKey("privateDesktopName")?S(manifest,"privateDesktopName"):"",permit.ContainsKey("privateDesktopName")?S(permit,"privateDesktopName"):"",sid,root,NativeInstallation.Hash(hostSource),S(manifest,"tokenProfile"),S(permit,"testMode"),S(permit,"testEvent"),S(permit,"tokenFault"),synthetic);
    nodeDirect=project||S(permit,"testMode")=="node-direct";
    if(!project&&(S(permit,"testMode")=="private-desktop-command"||nodeDirect)&&(S(manifest,"hostSourceSha256")!=NativeInstallation.Hash(hostSource)||S(permit,"hostSourceSha256")!=NativeInstallation.Hash(hostSource)||S(permit,"rawPeerPath")!=""))throw new Exception("PRIVATE_DESKTOP_SOURCE_BINDING");
    if(nodeDirect){
      var required=new Dictionary<string,string>{{"code/node.exe","e3be0545990c90995d7bf3a7af5d64af1f2e0fc1bbd9b79c27f7abc1e9676e50"},{"code/start-personal-native.mjs","e2c943dbbe721c41ac11e5357e57199c15a3cdeb4825c877e4429bec78693437"},{"code/supervise-personal-native.mjs","b3b59080825bbebc8580b2d326542242221dd0be5c679df998be850462113052"},{"code/launch.json",null},{"code/server.mjs",null}};
      foreach(Dictionary<string,object> file in (IEnumerable)manifest["files"]){string relative=S(file,"path"),expected;if(required.TryGetValue(relative,out expected)){if(expected!=null&&S(file,"sha256")!=expected)throw new Exception("NODE_DIRECT_SHIPPED_HASH");required.Remove(relative);}}
      if(required.Count!=0)throw new Exception("NODE_DIRECT_REQUIRED_FILES");
      var config=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(root,"code","launch.json")));
      if(S(config,"schema")!="portal-native-launch.v1"||S(config,"nodeSha256")!=NativeInstallation.Hash(Path.Combine(root,"code","node.exe"))||S(config,"serverSha256")!=NativeInstallation.Hash(Path.Combine(root,"code","server.mjs")))throw new Exception("NODE_DIRECT_CONFIG_HASH");
      foreach(var pair in new Dictionary<string,string>{{"nodePath","code/node.exe"},{"serverPath","code/server.mjs"},{"originalsDb","data/originals.sqlite"},{"storagePath","data/storage"},{"publicPath","code/public"}}){if(S(config,pair.Key)!=Path.Combine(root,pair.Value.Replace('/', '\\')))throw new Exception("NODE_DIRECT_CONFIG_NAMESPACE");}
      if(!project&&((Dictionary<string,object>)config["environment"]).Count!=0)throw new Exception("NODE_DIRECT_SYNTHETIC_ENVIRONMENT");
      foreach(string directory in new[]{"code/public","data/storage"}){string path=Path.Combine(root,directory);pins.Add(project&&directory=="data/storage"?NativeInstallation.PinWritableDirectory(path,sid):NativeInstallation.Pin(path,true));NativeInstallation.AdmitAcl(path,sid,directory=="data/storage",true);}
      if(!project){string database=Path.Combine(root,"data","originals.sqlite");pins.Add(NativeInstallation.Pin(database,false));}
    }
    if(project) {
      foreach(var value in new[]{manifest,permit}){
        if(S(value,"sourceSidType")!="1"||S(value,"tokenContract")!="")throw new Exception("PRODUCTION_SOURCE_CONTRACT");
        var reads=new List<string>();foreach(string read in (IEnumerable)value["windowsReadSids"])reads.Add(read);
        if(reads.Count!=2||reads[0]!=NativeWorkloadToken.ReadSid||reads[1]!=NativeKnownDlls.CandidateSid)throw new Exception("PRODUCTION_READ_SIDS");
      }
      if(S(manifest,"serviceSid")!=sid||S(manifest,"hostSourceSha256")!=NativeInstallation.Hash(hostSource))throw new Exception("PRODUCTION_HOST_BINDING");
      if(S(permit,"fence")!="ENFORCED_ACTOR_EXCLUSION"||S(permit,"testMode")!="normal"||S(permit,"testEvent")!=""||S(permit,"observationEvent")!=""||S(permit,"tokenFault")!=""||S(permit,"rawPeerPath")!="")throw new Exception("FENCE_UNPROVEN");
      foreach(string receipt in new[]{"activation.json","activation-public-key.xml","owner-decision.json","container-inspect.json"}) {
        string path=Path.Combine(root,"action",receipt);
        pins.Add(NativeInstallation.Pin(path,false));NativeInstallation.AdmitAcl(path,sid,false,false);
      }
      string ownerHash=NativeInstallation.Hash(Path.Combine(root,"action","owner-decision.json"));
      if(ownerHash!=S(manifest,"ownerDecisionSha256"))throw new Exception("ACTIVATION_OWNER_HASH");
      var activation=NativeProductionActivation.VerifyRecord(File.ReadAllBytes(Path.Combine(root,"action","activation.json")),S(permit,"activationSha256"),File.ReadAllText(Path.Combine(root,"action","activation-public-key.xml")),S(manifest,"activationPublicKeySha256"),NativeInstallation.Hash(manifestPath),ownerHash,S(permit,"actionId"),DateTime.UtcNow);
      string issuancePath=Path.Combine(root,"action","issuance.json");pins.Add(NativeInstallation.Pin(issuancePath,false));NativeInstallation.AdmitAcl(issuancePath,sid,false,false);
      var issuance=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(issuancePath));
      if(S(issuance,"activationSha256")!=S(permit,"activationSha256")||S(issuance,"permitSha256")!=NativeInstallation.Hash(permitPath)||S(issuance,"fence")!="PASS"||S(issuance,"actionId")!=S(permit,"actionId"))throw new Exception("ACTIVATION_ISSUANCE_LOG");
      var config=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(root,"code","launch.json")));
      if(S(config,"originalsDb")!=NativeProductionActivation.Database||S(config,"serverPath")!=Path.Combine(root,"code","server.mjs")||S(config,"serverSha256")!=NativeProductionActivation.Candidate["server.mjs"])throw new Exception("ACTIVATION_CONFIG_BINDING");
      foreach(var file in NativeProductionActivation.Candidate){string path=Path.Combine(root,"code",file.Key);pins.Add(NativeInstallation.Pin(path,false));NativeInstallation.AdmitAcl(path,sid,false,false);if(NativeInstallation.Hash(path)!=file.Value)throw new Exception("ACTIVATION_CANDIDATE_DRIFT");}
      // SYSTEM attests fresh impersonated probes before the host's DB read pin;
      // the host independently keeps the direct ACL and namespace checks below.
      privateContext=NativeStartupAttestor.Request(NativeServiceProfile.Portal,activation,S(permit,"activationSha256"),pins);
      // Pin only during admission; holding a read-only file share would prohibit SQLite writes.
      using(var database=NativeInstallation.Pin(NativeProductionActivation.Database,false))NativeProductionActivation.VerifyFence(root,NativeProductionActivation.Database,sid,activation);
    } else if(S(permit,"fence")!="ISOLATED_NO_REAL_WRITER")throw new Exception("FENCE_UNPROVEN");
    VerifyProfile(S(manifest,"tokenProfile"),S(permit,"tokenProfile"),!project);
    bool knownDlls=!project && S(manifest,"tokenProfile")==NativeKnownDlls.Profile;
    filteredQualification=!project && (S(manifest,"tokenProfile")==NativeWorkloadToken.Profile||knownDlls);
    if(filteredQualification){
      if(knownDlls)VerifyKnownDllsContract(S(manifest,"tokenContract"),S(permit,"tokenContract"),sid,root,true);
      else VerifyContract(S(manifest,"tokenContract"),S(permit,"tokenContract"),sid,root,true);
      foreach(var value in new[]{manifest,permit}){
        if(S(value,"sourceSidType")!="1")throw new Exception("SOURCE_TOKEN_CONTRACT_MISMATCH");
        var readSids=new List<string>();foreach(string id in (IEnumerable)value["windowsReadSids"])readSids.Add(id);
        if(readSids.Count!=(knownDlls?2:1)||readSids[0]!=NativeWorkloadToken.ReadSid||(knownDlls&&readSids[1]!=NativeKnownDlls.CandidateSid))throw new Exception("TOKEN_SOURCE_CONTRACT_BINDING");
        if(knownDlls&&S(value,"knownDllsDescriptorSha256")!=NativeKnownDlls.DescriptorSha256)throw new Exception("TOKEN_KNOWNDLLS_DESCRIPTOR_BINDING");
      }
    }
    if(knownDlls&&S(permit,"testMode")!="known-dlls-gate"&&S(permit,"testMode")!="known-dlls-isolation"){
      if(S(permit,"testMode")!="known-dlls-command"&&S(permit,"testMode")!="private-desktop-command"&&!nodeDirect)throw new Exception("KNOWNDLLS_CANDIDATE_NOT_RUNTIME_ADMITTED");
      string proof=Path.Combine(root,"action","known-dlls-admission.json");pins.Add(NativeInstallation.Pin(proof,false));NativeInstallation.AdmitAcl(proof,sid,false,false);
      if(S(manifest,"knownDllsAdmissionSha256")!=NativeKnownDlls.AdmissionSha256||S(permit,"knownDllsAdmissionSha256")!=NativeKnownDlls.AdmissionSha256||NativeInstallation.Hash(proof)!=NativeKnownDlls.AdmissionSha256)throw new Exception("KNOWNDLLS_ADMISSION_HASH");
    }
    action=S(permit,"actionId");
    VerifySid();
    // CreateNew is durable one-action consumption, including clean stops. Service
    // cannot replace the admin-owned permit. Maintenance must reconcile before a
    // different action; missing, stale and tampered permits cannot grant startup.
    using (var lease=new FileStream(Path.Combine(root,"status","activation.lock"),FileMode.CreateNew,FileAccess.Write,FileShare.Read)) {
      byte[] bytes=Encoding.UTF8.GetBytes(action+"\n"+NativeInstallation.Hash(permitPath)); lease.Write(bytes,0,bytes.Length); lease.Flush(true);
    }
  }
  static void Observe(string line,bool error) {
    Record((error?"STDERR ":"STDOUT ")+line);
    if(error)return;
    if(image){lock(gate){
      bool wasReady=imageSignals.Ready,wasDrained=imageSignals.Drained;imageSignals.Accept(line,false,stopRequested==1);
      if(!wasReady&&imageSignals.Ready){ready.Set();identityReady.Set();}
      if(!wasDrained&&imageSignals.Drained){drained=true;stopped=true;Report(3,0,2);}
    }return;}
    lock(gate) {
      int id=signals.Accept(line,false,stopRequested==1);
      if (id!=0) {
        var process=Process.GetProcessById(id);
        if(id==child.Process.Id) {process.Dispose();throw new Exception("SERVICE_PARENT_AS_MEMBER");}
        if (!child.Contains(process)) { process.Dispose(); throw new Exception("SERVICE_PID_OUTSIDE_JOB"); }
        NativeWorkloadToken.VerifyProcess(process.Handle,NativeInstallation.ServiceSid(name),Record,id==signals.Supervisor?"SUPERVISOR":"APPLICATION",project||S(manifest,"tokenProfile")==NativeKnownDlls.Profile,project);
        members.Add(process); Record("MEMBER_HANDLE="+id); if(members.Count==(nodeDirect?1:2)) identityReady.Set();
      }
      if (signals.State=="ready") ready.Set();
      if (signals.State=="drained"&&!drained) { drained=true; if (stopRequested==1) Report(3,0,2); }
      if (signals.State=="stopped"&&!stopped) { stopped=true; if (stopRequested==1) Report(3,0,3); }
      if (line.StartsWith("NATIVE_SUPERVISOR_FAILURE=",StringComparison.Ordinal)) protocolFailed=true;
    }
  }
  static void Pump(StreamReader reader,bool error) {
    var raw=nodeDirect?new MemoryStream():null;
    try {
      var line=new StringBuilder(); int total=0,value;
      while ((value=nodeDirect?reader.BaseStream.ReadByte():reader.Read())!=-1) {
        if(raw!=null)raw.WriteByte((byte)value);
        if (++total>1024*1024 || line.Length>4096) throw new Exception("SERVICE_OUTPUT_LIMIT");
      if (value=='\n') { Observe(line.ToString().TrimEnd('\r'),error); line.Clear(); } else line.Append((char)value);
      }
      if (line.Length!=0) Observe(line.ToString(),error);
    } catch (Exception exception) { lock(gate) protocolFailed=true; Record("OUTPUT_FAILURE="+exception.Message); }
    finally{if(raw!=null){Record("NODE_RAW_OUTPUT stream="+(error?"stderr":"stdout")+" bytesBase64="+Convert.ToBase64String(raw.ToArray()));raw.Dispose();}}
  }
  static void FailedLive(string reason) {
    Record("STOP_FAILED_STILL_LIVE reason="+reason+" action="+action);
    // No STOPPED and no timer checkpoints. Retain outer job, original process
    // handles, dispatcher and action exclusion. An explicit owner teardown or host
    // death is abrupt termination, not a successful drain.
    uint waited=NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0xffffffff);
    if(waited!=0){Record("FAILED_LIVE_WAIT_ERROR result="+waited+" error="+Marshal.GetLastWin32Error());new ManualResetEvent(false).WaitOne();}
    throw new Exception("TERMINAL_FAILED_LIVE_EXIT_OBSERVED");
  }
  static void ServiceMain(int argc,IntPtr argv) {
    bool started=false;
    try {
      service=RegisterServiceCtrlHandlerExW(name,handlerCallback,IntPtr.Zero); if (service==IntPtr.Zero) throw new Win32Exception();
      Admit(); statusPath=Path.Combine(root,"status","host.log");
      log=new StreamWriter(new FileStream(statusPath,FileMode.CreateNew,FileAccess.Write,FileShare.Read),new UTF8Encoding(false)); log.AutoFlush=true;
      if(project)Record("PRODUCTION_REVIEWED_ACTIVATION="+S(permit,"activationSha256")+" action="+S(permit,"actionId"));
      if(image){RunImage();return;}
      if(permit.ContainsKey("observationEvent") && S(permit,"observationEvent")!="") observation=EventWaitHandle.OpenExisting(S(permit,"observationEvent"));
      foreach(string directory in new[]{"code","action","data","temp","status"})Record("DIRECTORY_PIN path="+Path.Combine(root,directory)+" access=0x80000000 share="+(directory=="code"||directory=="action"?"1":"3")+" deleteShare=False");
      Record("TOKEN_RESTRICTED_SID="+NativeInstallation.ServiceSid(name)); Report(2,0,1);
      using(var identity=WindowsIdentity.GetCurrent()){foreach(var group in identity.Groups)Record("TOKEN_GROUP="+group.Value);}
      NativeOuterChild.CleanupObserved=Record;
      if(permit.ContainsKey("rawPeerPath")&&S(permit,"rawPeerPath")!="") {
        string peer=S(permit,"rawPeerPath");
        if(!filteredQualification||!System.Text.RegularExpressions.Regex.IsMatch(peer.Replace('\\','/'),@"^E:/task22-native-service-[a-f0-9]{16}/code/launch.json$"))throw new Exception("RAW_PEER_SYNTHETIC_BINDING");
        using(var read=File.OpenRead(peer))Record("RAW_PRIVILEGED_PEER_READ=ALLOWED administratorExcluded=True");
      }
      var env=new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);
      string windows=Environment.GetFolderPath(Environment.SpecialFolder.Windows);
      env.Add("SystemRoot",windows); env.Add("WINDIR",windows);
      env.Add("PSModulePath",Path.Combine(windows,@"System32\WindowsPowerShell\v1.0\Modules"));
      env.Add("TEMP",Path.Combine(root,"temp")); env.Add("TMP",Path.Combine(root,"temp"));
      if(nodeDirect){env.Clear();env.Add("SystemRoot",windows);env.Add("WINDIR",windows);}
      string powershell=S(manifest,"powershellPath");
      if (NativeInstallation.Hash(powershell)!=S(manifest,"powershellSha256")) throw new Exception("POWERSHELL_HASH");
      pins.Add(NativeInstallation.PinWindowsImage(powershell));
      if (Directory.GetFileSystemEntries(Path.Combine(root,"temp")).Length!=0) throw new Exception("SERVICE_TEMP_COLLISION");
      string mode=S(permit,"testMode");
      bool knownDlls=project||S(manifest,"tokenProfile")==NativeKnownDlls.Profile;
      if(mode=="known-dlls-gate"||mode=="known-dlls-isolation"){
        if(S(manifest,"tokenProfile")!=NativeKnownDlls.Profile)throw new Exception("KNOWNDLLS_GATE_PROFILE");
        using(var source=NativeWorkloadToken.Open(GetCurrentProcess()))
        using(var current=NativeWorkloadToken.CreateFromSource(source,NativeInstallation.ServiceSid(name),"",Record,false))
        using(var proposed=NativeWorkloadToken.CreateFromSource(source,NativeInstallation.ServiceSid(name),"",Record,true)){
          if(mode=="known-dlls-gate")NativeKnownDlls.Gate(current,proposed,Record);
          else {NativeKnownDlls.Gate(current,proposed,Record);NativeWorkloadToken.KnownDllsIsolation(current,proposed,NativeInstallation.ServiceSid(name),root,S(permit,"rawPeerPath"),Record);}
        }
        Record("KNOWNDLLS_TOKEN_ONLY_GATE_PASS noWorkloadCreated=True");Report(1,0,0);return;
      }
      bool privateExperiment=mode=="private-desktop-command";
      bool diagnostic=filteredQualification&&(mode=="diagnostic-command"||mode=="debugger-command"||mode=="known-dlls-command"||privateExperiment);
      string fault=permit.ContainsKey("tokenFault")?S(permit,"tokenFault"):"";
      var readSurfaces=filteredQualification&&(mode=="runtime-credited"||diagnostic||knownDlls)?new List<string>():NativeWorkloadToken.ReadSurfaces(powershell,Path.Combine(root,"code","node.exe"),Record);
      using(var source=NativeWorkloadToken.Open(GetCurrentProcess()))using(var workload=NativeWorkloadToken.CreateFromSource(source,NativeInstallation.ServiceSid(name),fault,Record,knownDlls,project)) {
        if(privateExperiment||nodeDirect){
          // Recheck the exact current protected tree instead of borrowing old
          // object proof across changed code/manifest/permit bytes.
          Record("PRIVATE_CURRENT_BYTES manifest="+NativeInstallation.Hash(manifestPath)+" permit="+NativeInstallation.Hash(permitPath)+" source="+NativeInstallation.Hash(Path.Combine(root,"code","native-service-host.cs")));
          NativeWorkloadToken.ObjectGate(workload,NativeInstallation.ServiceSid(name),root,new List<string>{nodeDirect?Path.Combine(root,"code","node.exe"):powershell},Record,project);
          if(project)NativeKnownDlls.VerifyProduction(workload,Record);
          if(project)privateContext.VerifyRestricted(workload,NativeInstallation.ServiceSid(name),Record);
          else privateContext=NativePrivateDesktop.Create(S(manifest,"privateDesktopName"),NativeInstallation.ServiceSid(name),workload,Record);
        }
        if(filteredQualification&&(mode=="runtime-credited"||diagnostic||knownDlls))Record("PRELAUNCH_OBJECT_PROOF_CREDITED sha256="+(knownDlls?NativeKnownDlls.AdmissionSha256:"a33a068c9b86a1fd85ad492b4112bd1bde8b248648142229de015df772a41e3a"));
        else if(!project)NativeWorkloadToken.ObjectGate(workload,NativeInstallation.ServiceSid(name),root,readSurfaces,Record);
        if(filteredQualification&&mode=="object-rights-only"){Record("OBJECT_RIGHTS_ONLY_STOP noWorkloadCreated=True");Report(1,0,0);return;}
        child=NativeOuterChild.Start(workload,NativeInstallation.ServiceSid(name),fault,nodeDirect?Path.Combine(root,"code","node.exe"):powershell,nodeDirect?"\""+Path.Combine(root,"code","supervise-personal-native.mjs")+"\" \""+Path.Combine(root,"code","launch.json")+"\"":diagnostic?"-NoLogo -NoProfile -NonInteractive -Command \"exit 0\"":"-NoLogo -NoProfile -NonInteractive -File \""+Path.Combine(root,"code","start-personal-native.ps1")+"\" -ConfigPath \""+Path.Combine(root,"code","launch.json")+"\"",Path.Combine(root,"code"),env,
          id => { Record((nodeDirect?"NODE_SUPERVISOR_CREATED=":"POWERSHELL_CREATED=")+id); if (mode=="debugger-command"||(mode=="known-dlls-command"&&S(permit,"testEvent")!="")) {Record("DEBUGGER_CREATION_CALLBACK pid="+id);using(var gateEvent=EventWaitHandle.OpenExisting(S(permit,"testEvent")))if(!gateEvent.WaitOne(15000))throw new Exception("DEBUGGER_ARM_HANDSHAKE_TIMEOUT");Record("DEBUGGER_ARM_HANDSHAKE_RELEASED="+id);} if (mode=="before-resume") { Record("BEFORE_RESUME_GATE"); using(var gateEvent=EventWaitHandle.OpenExisting(S(permit,"testEvent"))) gateEvent.WaitOne(); } },knownDlls,(privateExperiment||nodeDirect)?privateContext.FullName:null,
          nodeDirect?(Action<NativeOuterChild>)(owned=>{child=owned;signals.Accept("NATIVE_BOOTSTRAP_SUPERVISOR_PID="+owned.Process.Id,false,false);Record("ORIGINAL_SUPERVISOR_HANDLE="+owned.ProcessHandle.DangerousGetHandle()+" pid="+owned.Process.Id);}):null,nodeDirect?(Action<StreamReader,bool>)Pump:null,project);
      }
      started=true; Record((nodeDirect?"NODE_SUPERVISOR_RESUMED=":"POWERSHELL_RESUMED=")+child.Process.Id);
      if(privateExperiment){
        int remaining=Math.Max(0,10000-(int)child.PrivateDeadline.ElapsedMilliseconds);
        uint waited=NativeOuterChild.WaitForSingleObject(child.ProcessHandle,(uint)remaining);
        if(waited!=0){Record("PRIVATE_CHILD_TIMEOUT wait="+waited);FailedLive("PRIVATE_DEADLINE");}
        remaining=Math.Max(0,10000-(int)child.PrivateDeadline.ElapsedMilliseconds);
        if(!child.ExitObserved.WaitOne(remaining))throw new Exception("PRIVATE_EXIT_EVENT_MISSING");
        remaining=Math.Max(0,10000-(int)child.PrivateDeadline.ElapsedMilliseconds);
        if(!Task.WaitAll(new[]{child.PrivateOutDrain,child.PrivateErrDrain},remaining))throw new Exception("PRIVATE_OUTPUT_DRAIN");
        uint code=child.OriginalExitCode();Record("PRIVATE_CHILD_EXIT="+code+" originalHandleWait="+waited+" stdoutBase64="+Convert.ToBase64String(child.PrivateStdout.ToArray())+" stderrBase64="+Convert.ToBase64String(child.PrivateStderr.ToArray())+" elapsedMs="+child.PrivateDeadline.ElapsedMilliseconds);
        child.Dispose();child=null;started=false;privateContext.Dispose();privateContext=null;
        Record(code==0?"PRIVATE_DESKTOP_NATURAL_EXIT_ZERO":"PRIVATE_DESKTOP_ADMISSION_INSUFFICIENT");Report(1,code==0?0u:1066u,0);return;
      }
      if(!diagnostic||NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0)!=0) {
        try{NativeWorkloadToken.VerifyProcess(child.ProcessHandle.DangerousGetHandle(),NativeInstallation.ServiceSid(name),Record,"RUNNING_POWERSHELL",knownDlls,project);}
        catch(Exception error){if(!diagnostic||NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0)!=0)throw;Record("DIAGNOSTIC_POST_RESUME_QUERY_EXIT_RACE="+error.Message);}
      }
      if(diagnostic){
        var output=child.Output.BaseStream;var errors=child.Error.BaseStream;var stdoutBytes=new MemoryStream();var stderrBytes=new MemoryStream();
        var outDrain=output.CopyToAsync(stdoutBytes);var errDrain=errors.CopyToAsync(stderrBytes);
        uint waited=NativeOuterChild.WaitForSingleObject(child.ProcessHandle,10000);
        if(waited!=0){Record("DIAGNOSTIC_CHILD_TIMEOUT wait="+waited);FailedLive("DIAGNOSTIC_TIMEOUT");}
        if(knownDlls&&!child.ExitObserved.WaitOne(1000))throw new Exception("KNOWNDLLS_EXIT_EVENT_MISSING");
        if(!Task.WaitAll(new[]{outDrain,errDrain},1000))throw new Exception("DIAGNOSTIC_OUTPUT_DRAIN");
        Record("DIAGNOSTIC_CHILD_EXIT="+child.Process.ExitCode+" stdoutBase64="+Convert.ToBase64String(stdoutBytes.ToArray())+" stderrBase64="+Convert.ToBase64String(stderrBytes.ToArray()));
        Report(1,0,0);return;
      }
      var stdout=nodeDirect?child.PrivateOutDrain:Task.Run(()=>Pump(child.Output,false)); var stderr=nodeDirect?child.PrivateErrDrain:Task.Run(()=>Pump(child.Error,true));
      var exited=Task.Run(()=>NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0xffffffff));
      var readiness=Task.Run(()=>ready.WaitOne());
      int startup=Int32.Parse(S(permit,"startupDeadlineMs"));
      if (Task.WhenAny(readiness,exited,Task.Delay(startup)).GetAwaiter().GetResult()!=readiness) {
        if (!exited.IsCompleted) FailedLive("STARTUP_DEADLINE");
        Task.WaitAll(new[]{stdout,stderr},10000);
        Record("STARTUP_CHILD_EXIT="+child.Process.ExitCode);
        throw new Exception("SERVICE_NOT_READY");
      }
      if (!identityReady.WaitOne(startup)) throw new Exception("SERVICE_IDENTITY_DEADLINE");
      lock(gate) { if (members.Count!=(nodeDirect?1:2) || protocolFailed) throw new Exception("SERVICE_READY_IDENTITY"); }
      Report(4,0,0); Record("ACTUAL_READY");
      if (WaitHandle.WaitAny(new[]{stop,exitedWait(exited)})==1) throw new Exception("SERVICE_UNEXPECTED_EXIT");
      Report(3,0,1); Record("STOP_SENT"); child.Input.WriteLine("stop");
      int deadline=Int32.Parse(S(permit,"stopDeadlineMs"));
      if (Task.WhenAny(exited,Task.Delay(deadline)).GetAwaiter().GetResult()!=exited) FailedLive("DRAIN_DEADLINE");
      if (!Task.WaitAll(new[]{stdout,stderr},10000)) throw new Exception("SERVICE_OUTPUT_EXIT_DEADLINE");
      bool clean; lock(gate) clean=drained && stopped && !protocolFailed && child.Process.ExitCode==0;
      foreach(var member in members) clean=member.WaitForExit(10000) && clean;
      if (!clean) throw new Exception("SERVICE_DRAIN_UNCONFIRMED");
      // Close the now-empty outer job only after every required original process
      // handle signaled. Its closure must not be what makes STOPPED become true.
      child.Job.Dispose();
      Record("CLEAN_STOP originalHandles="+(nodeDirect?2:3)+" outerJobClosedAfterExits=True originalSupervisorExit="+child.OriginalExitCode());
      if(nodeDirect){privateContext.Dispose();privateContext=null;}
      Report(1,0,0);
    } catch(Exception exception) {
      if (log!=null) Record("SERVICE_FAILURE="+exception.ToString());
      else if (root!=null) {
        // Diagnostic output has no admission authority. CreateNew avoids adopting
        // a precreated file, and its directory is the service-writable status leaf.
        using(var failureLog=new StreamWriter(new FileStream(Path.Combine(root,"status","startup-failure.log"),FileMode.CreateNew,FileAccess.Write,FileShare.Read))) failureLog.WriteLine(exception.ToString());
      }
      if ((started||(image&&child!=null)) && NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0)!=0) {
        Record("STOP_FAILED_STILL_LIVE reason=EXCEPTION action="+action);
        uint wait=NativeOuterChild.WaitForSingleObject(child.ProcessHandle,0xffffffff);
        if(wait!=0){Record("FAILED_LIVE_WAIT_ERROR result="+wait);new ManualResetEvent(false).WaitOne();}
      }
      if (service!=IntPtr.Zero) { var failure=new STATUS{Type=0x10,State=1,Win32=1066,Specific=1}; SetServiceStatus(service,ref failure); }
    } finally {
      if (child!=null) child.Dispose(); if(privateContext!=null)privateContext.Dispose(); foreach(var member in members) member.Dispose(); foreach(var pin in pins) pin.Dispose(); if(log!=null) log.Dispose(); if(observation!=null)observation.Dispose();
    }
  }
  static WaitHandle exitedWait(Task task) { return ((IAsyncResult)task).AsyncWaitHandle; }
  public static int Main(string[] args) {
    if (args.Length!=2) return 64;
    name=args[0]; manifestPath=Path.GetFullPath(args[1]);
    if (!StartServiceCtrlDispatcherW(new[]{new TABLE{Name=name,Main=mainCallback},new TABLE()})) return Marshal.GetLastWin32Error();
    return 0;
  }
}
