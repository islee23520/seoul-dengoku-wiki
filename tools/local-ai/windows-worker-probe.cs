using System;
using System.ComponentModel;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using Microsoft.Win32.SafeHandles;

public static class WorkerProbe {
    [DllImport("kernel32.dll",SetLastError=true)] internal static extern SafeFileHandle OpenProcess(uint access,bool inherit,int pid);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetProcessTimes(SafeFileHandle process,out long created,out long exited,out long kernel,out long user);
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool QueryFullProcessImageNameW(SafeFileHandle process,uint flags,StringBuilder name,ref int length);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetExitCodeProcess(SafeFileHandle process,out uint code);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(SafeFileHandle process,uint access,out SafeFileHandle token);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool DuplicateTokenEx(SafeFileHandle token,uint access,IntPtr security,int level,int type,out SafeFileHandle duplicate);
    [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr OpenSCManagerW(string machine,string database,uint access);
    [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr OpenServiceW(IntPtr scm,string name,uint access);
    [DllImport("advapi32.dll",SetLastError=true)] static extern bool QueryServiceStatusEx(IntPtr service,int level,IntPtr buffer,int size,out int needed);
    [DllImport("advapi32.dll")] static extern bool CloseServiceHandle(IntPtr handle);
    internal static void Identity(SafeFileHandle process, ProbeContract config) {
        long created,exited,kernel,user; uint code; int length = 32768; var path = new StringBuilder(length);
        if (!GetProcessTimes(process,out created,out exited,out kernel,out user) || !QueryFullProcessImageNameW(process,0,path,ref length) || !GetExitCodeProcess(process,out code)) throw new Win32Exception();
        ProbeContract.Require(code == 259 && exited == 0 && created == config.CreationFileTime && String.Equals(path.ToString(),config.ImagePath,StringComparison.OrdinalIgnoreCase),"APPLICATION_IDENTITY");
        ProbeContract.Require(NativeInstallation.Hash(config.ImagePath) == config.ImageSha256,"APPLICATION_HASH");
    }
    internal static int ServicePid(string name) {
        IntPtr scm = OpenSCManagerW(null,null,1); if (scm == IntPtr.Zero) throw new Win32Exception();
        try {
            IntPtr service = OpenServiceW(scm,name,4); if (service == IntPtr.Zero) throw new Win32Exception();
            try {
                IntPtr data = Marshal.AllocHGlobal(36);
                try { int needed; if (!QueryServiceStatusEx(service,0,data,36,out needed)) throw new Win32Exception();
                    ProbeContract.Require(Marshal.ReadInt32(data,4) == 4,"SERVICE_NOT_RUNNING"); return Marshal.ReadInt32(data,28);
                } finally { Marshal.FreeHGlobal(data); }
            } finally { CloseServiceHandle(service); }
        } finally { CloseServiceHandle(scm); }
    }
    static int ParentWithLauncher(int pid,string launcher,ProbeContract config) {
        using (var process = new ManagementObject("Win32_Process.Handle='"+pid+"'")) {
            process.Get();
            string command = (string)process["CommandLine"];
            string directory = Path.GetDirectoryName(config.ImagePath);
            string expected = config.ImagePath+" "+Path.Combine(directory,launcher)+" "+Path.Combine(directory,"launch.json");
            ProbeContract.Require(command.Replace("\"","") == expected,"APPLICATION_LAUNCHER_CHAIN");
            return checked((int)(uint)process["ParentProcessId"]);
        }
    }
    static void ApplicationChain(ProbeContract config) {
        int scm = ServicePid(config.ServiceName);
        ProbeContract.Require(config.ApplicationPid != scm,"SCM_HOST_IS_NOT_APPLICATION");
        int supervisor = ParentWithLauncher(config.ApplicationPid,"start-personal-native.mjs",config);
        ProbeContract.Require(supervisor != scm && ParentWithLauncher(supervisor,"supervise-personal-native.mjs",config) == scm,"APPLICATION_SCM_CHAIN");
    }
    static void Response(Dictionary<string,object> response, ProbeContract config) {
        ProbeContract.Require(response.Count == 9 && response["version"] is int && (int)response["version"] == 1 && ProbeContract.Text(response,"op") == "probe" &&
            ProbeContract.Text(response,"ownerSid") == config.OwnerSid && ProbeContract.Text(response,"peerSid") == config.ServiceSid &&
            ProbeContract.Text(response,"identitySource") == "windows-pipe-impersonation" && ProbeContract.Text(response,"manifestSha256") == config.ManifestSha256 &&
            response["gpuDispatches"] is int && (int)response["gpuDispatches"] == 0,"PROBE_RESPONSE_IDENTITY");
        string lease = ProbeContract.Text(response,"leaseAuthority"); uint uid;
        ProbeContract.Require((lease == "unwired" || lease == "owner-bridge") && UInt32.TryParse(ProbeContract.Text(response,"ubuntuUid"),out uid),"PROBE_RESPONSE_FIELDS");
    }
    public static int Main(string[] args) {
        try {
            ProbeContract.Require(args.Length == 2,"USAGE_CONFIG_AND_SHA256");
            string configPath = Path.GetFullPath(args[0]);
            using (var pin = NativeInstallation.Pin(configPath,false)) {
                ProbeContract.Require(new FileInfo(configPath).Length <= 65536,"CONFIG_BOUNDS");
                ProbeContract.Require(NativeInstallation.Hash(configPath) == args[1],"CONFIG_SHA256");
                var config = new ProbeContract(File.ReadAllBytes(configPath));
                ProbeContract.Require(DateTime.UtcNow < config.ExpiresUtc && config.ExpiresUtc - DateTime.UtcNow <= TimeSpan.FromMinutes(30),"CONFIG_EXPIRED_OR_TOO_LONG");
                ProbeContract.PrivatePath(configPath,config.OwnerSid); ProbeContract.PrivatePath(config.BrokerConfig,config.OwnerSid);
                ProbeContract.PrivatePath(Path.GetDirectoryName(config.ReceiptPath),config.OwnerSid);
                using (var broker = NativeInstallation.Pin(config.BrokerPath,false))
                using (var brokerConfig = NativeInstallation.Pin(config.BrokerConfig,false))
                using (var image = NativeInstallation.Pin(config.ImagePath,false))
                using (var process = OpenProcess(0x1000,false,config.ApplicationPid)) {
                    if (process.IsInvalid) throw new Win32Exception(Marshal.GetLastWin32Error(),"APPLICATION_OPEN_QUERY");
                    ApplicationChain(config);
                    Identity(process,config);
                    ProbeContract.Require(NativeInstallation.Hash(config.BrokerPath) == config.BrokerSha256 && NativeInstallation.Hash(config.BrokerConfig) == config.BrokerConfigSha256,"BROKER_PINS");
                    SafeFileHandle token;
                    if (!OpenProcessToken(process,0x0a,out token)) throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_QUERY_DUPLICATE");
                    using (token) {
                        NativeWorkloadToken.Verify(token,config.ServiceSid,true,true,true);
                        var snapshot = NativeWorkloadToken.Snapshot(token); string before = ProbeContract.Json.Serialize(snapshot);
                        SafeFileHandle duplicate;
                        if (!DuplicateTokenEx(token,0x0c,IntPtr.Zero,2,2,out duplicate)) throw new Win32Exception(Marshal.GetLastWin32Error(),"TOKEN_DUPLICATE_IMPERSONATION");
                        using (duplicate) {
                            byte[] reply;
                            using (WindowsIdentity.Impersonate(duplicate.DangerousGetHandle())) reply = ProbeIo.Exchange(config);
                            var response = ProbeContract.Object(reply); Response(response,config);
                            Identity(process,config); ApplicationChain(config); NativeWorkloadToken.Verify(token,config.ServiceSid,true,true,true);
                            ProbeContract.Require(before == ProbeContract.Json.Serialize(NativeWorkloadToken.Snapshot(token)),"TOKEN_DRIFT");
                            var receipt = new { schema="worker-probe-receipt.v1", status="PASS", nonce=config.Nonce, configSha256=args[1], executableSha256=NativeInstallation.Hash(typeof(WorkerProbe).Assembly.Location), applicationPid=config.ApplicationPid,
                                creationFileTime=config.CreationFileTime.ToString(), imagePath=config.ImagePath, imageSha256=config.ImageSha256, serviceName=config.ServiceName, serviceSid=config.ServiceSid,
                                brokerSha256=config.BrokerSha256, brokerConfigSha256=config.BrokerConfigSha256, token=snapshot, response=response, responseSha256=ProbeIo.Hash(reply), completedUtc=DateTime.UtcNow.ToString("o") };
                            var acl = new FileSecurity(); acl.SetOwner(new SecurityIdentifier(config.OwnerSid)); acl.SetAccessRuleProtection(true,false);
                            acl.AddAccessRule(new FileSystemAccessRule(new SecurityIdentifier(config.OwnerSid),FileSystemRights.FullControl,AccessControlType.Allow));
                            using (var output = new FileStream(config.ReceiptPath,FileMode.CreateNew,FileSystemRights.Write,FileShare.None,4096,FileOptions.WriteThrough,acl)) {
                                byte[] bytes = Encoding.UTF8.GetBytes(ProbeContract.Json.Serialize(receipt)); output.Write(bytes,0,bytes.Length); output.Flush(true);
                            }
                        }
                    }
                }
            }
            Console.WriteLine("PRODUCTION_PROBE_PASS"); return 0;
        } catch (Exception error) { Console.Error.WriteLine(error.GetType().Name+":"+error.Message); return 1; }
    }
}
