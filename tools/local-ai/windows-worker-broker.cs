using System.ComponentModel;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text.Json;
using Microsoft.Win32.SafeHandles;

namespace Seoul.LocalAI;

// The authority must retain the task13 exclusive OS lease through worker exit,
// and monitor competing listeners/processes. Wire it in trusted host code, never JSON.
public interface IGpuLeaseAuthority {
    ValueTask<bool> AdmissionAsync(CancellationToken cancellation) => ValueTask.FromResult(false);
    // The task13 owner must spawn inside runExclusive, not return a lease handle.
    ValueTask<int> RunPinnedAsync(Guid requestId, Worker worker, string request, CancellationToken cancellation);
}
sealed class UnwiredAuthority : IGpuLeaseAuthority {
    public ValueTask<int> RunPinnedAsync(Guid id, Worker worker, string request, CancellationToken ct) =>
        ValueTask.FromException<int>(new InvalidOperationException("GPU_MAINTENANCE_REQUIRED"));
}
public sealed record Worker(string Executable, string Sha256, string[] Arguments);
public sealed record OwnerBridge(string Executable, string Sha256, string Script, string ScriptSha256, string Config, string ConfigSha256);
public sealed record Configuration(string OwnerSid, string ServiceSid, string Spool, string ManifestSha256,
    Dictionary<string, Worker> Workers, Dictionary<string, string> Artifacts, OwnerBridge? Bridge = null);
sealed record Journal(string Hash, string State, int? ExitCode);

static class Native {
    [StructLayout(LayoutKind.Sequential)] internal struct SecurityAttributes {
        internal int Length; internal IntPtr Descriptor; internal int Inherit;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    internal static extern SafePipeHandle CreateNamedPipeW(string name, uint access, uint mode,
        uint instances, uint output, uint input, uint timeout, ref SecurityAttributes attributes);
    [DllImport("advapi32.dll", SetLastError=true)]
    static extern bool GetTokenInformation(IntPtr token, int kind, IntPtr buffer, int length, out int needed);
    internal static HashSet<string> Restricted(WindowsIdentity identity) {
        GetTokenInformation(identity.AccessToken.DangerousGetHandle(), 11, IntPtr.Zero, 0, out int length);
        if (length <= 0) throw new Win32Exception();
        IntPtr buffer = Marshal.AllocHGlobal(length);
        try {
            if (!GetTokenInformation(identity.AccessToken.DangerousGetHandle(), 11, buffer, length, out _)) throw new Win32Exception();
            int count = Marshal.ReadInt32(buffer);
            var result = new HashSet<string>(StringComparer.Ordinal);
            int offset = IntPtr.Size == 8 ? 8 : 4, stride = IntPtr.Size == 8 ? 16 : 8;
            for (int i = 0; i < count; i++) result.Add(new SecurityIdentifier(Marshal.ReadIntPtr(buffer, offset + i * stride)).Value);
            return result;
        } finally { Marshal.FreeHGlobal(buffer); }
    }
    internal static NamedPipeServerStream Pipe(Configuration config) {
        var descriptor = new RawSecurityDescriptor($"O:{config.OwnerSid}G:{config.OwnerSid}D:P(A;;GA;;;{config.OwnerSid})(A;;GRGW;;;{config.ServiceSid})");
        byte[] bytes = new byte[descriptor.BinaryLength]; descriptor.GetBinaryForm(bytes, 0);
        var pin = GCHandle.Alloc(bytes, GCHandleType.Pinned);
        try {
            var sa = new SecurityAttributes { Length = Marshal.SizeOf<SecurityAttributes>(), Descriptor = pin.AddrOfPinnedObject() };
            // DUPLEX | OVERLAPPED | FIRST_PIPE_INSTANCE; BYTE | REJECT_REMOTE_CLIENTS.
            var handle = CreateNamedPipeW(@"\\.\pipe\seoul-local-ai-worker-v1", 0x40080003, 8, 1, 65540, 65540, 0, ref sa);
            if (handle.IsInvalid) { handle.Dispose(); throw new Win32Exception(); }
            return new NamedPipeServerStream(PipeDirection.InOut, true, false, handle);
        } finally { pin.Free(); }
    }
}

public sealed class Broker : IDisposable {
    static string RequestHash(JsonElement request, string prompt) =>
        Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(new {
            tool = Text(request,"tool"), asset = Text(request,"assetId"), seed = request.GetProperty("seed").GetInt32(),
            prompt = Convert.ToHexString(System.Text.Encoding.UTF8.GetBytes(prompt)).ToLowerInvariant()
        }))).ToLowerInvariant();
    readonly Configuration config;
    readonly IGpuLeaseAuthority authority;
    readonly SemaphoreSlim serial = new(1);
    readonly NamedPipeServerStream pipe;
    public Broker(Configuration configuration, IGpuLeaseAuthority leaseAuthority) {
        config = configuration; authority = leaseAuthority;
        using var identity = WindowsIdentity.GetCurrent();
        if (identity.User?.Value != config.OwnerSid || Native.Restricted(identity).Count != 0) throw new InvalidOperationException("BROKER_OWNER_REQUIRED");
        _ = new SecurityIdentifier(config.ServiceSid);
        if (!config.ServiceSid.StartsWith("S-1-5-80-", StringComparison.Ordinal) || config.OwnerSid == config.ServiceSid) throw new InvalidOperationException("SERVICE_SID_REQUIRED");
        if (!Path.IsPathFullyQualified(config.Spool)) throw new InvalidOperationException("SPOOL_ABSOLUTE_REQUIRED");
        // Spool must be pre-created by owner with an exact protected owner-only DACL.
        var acl = new DirectoryInfo(config.Spool).GetAccessControl();
        var rules = acl.GetAccessRules(true, true, typeof(SecurityIdentifier));
        if (!acl.AreAccessRulesProtected || acl.GetOwner(typeof(SecurityIdentifier))?.Value != config.OwnerSid || rules.Count != 1 ||
            rules[0] is not FileSystemAccessRule rule || rule.IdentityReference.Value != config.OwnerSid ||
            rule.AccessControlType != AccessControlType.Allow || rule.FileSystemRights != FileSystemRights.FullControl)
            throw new InvalidOperationException("SPOOL_OWNER_ONLY_REQUIRED");
        if ((File.GetAttributes(config.Spool) & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("SPOOL_REPARSE");
        // Retain first-instance custody before journal recovery and across clients.
        pipe = Native.Pipe(config);
        var journals = Directory.GetFiles(config.Spool, "*.json");
        if (journals.Length > 4096) throw new InvalidDataException("SPOOL_CAPACITY");
        foreach (var path in journals) {
            if (!Guid.TryParseExact(Path.GetFileNameWithoutExtension(path), "D", out _)) throw new InvalidDataException("JOURNAL_NAME");
            if (new FileInfo(path).Length > 1024 || (File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0) throw new InvalidDataException("JOURNAL_BOUNDS");
            var old = JsonSerializer.Deserialize<Journal>(File.ReadAllBytes(path)) ?? throw new InvalidDataException("JOURNAL_INVALID");
            if (old.State == "RUNNING") Save(path, old with { State = "UNKNOWN" });
        }
    }
    static void Save(string path, Journal record) {
        string temp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        using (var file = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough)) {
            JsonSerializer.Serialize(file, record); file.Flush(true);
        }
        File.Move(temp, path, true);
    }
    static void Keys(JsonElement root, params string[] keys) {
        if (root.ValueKind != JsonValueKind.Object) throw new InvalidDataException("REQUEST_OBJECT");
        var seen = new HashSet<string>();
        foreach (var p in root.EnumerateObject()) if (!keys.Contains(p.Name) || !seen.Add(p.Name)) throw new InvalidDataException("REQUEST_FIELD");
        if (seen.Count != keys.Length) throw new InvalidDataException("REQUEST_FIELDS");
    }
    static string Text(JsonElement root, string key) => root.GetProperty(key).GetString() ?? throw new InvalidDataException("REQUEST_STRING");
    string ResultPath(string id) {
        if (!Guid.TryParseExact(id,"D",out var parsed) || parsed.ToString("D") != id) throw new InvalidDataException("REQUEST_UUID");
        string path=Path.Combine(config.Spool,"results",id,"receipt.json");
        for (string? current=path; current is not null && current!=config.Spool; current=Path.GetDirectoryName(current)) {
            if ((File.GetAttributes(current)&FileAttributes.ReparsePoint)!=0) throw new InvalidDataException("RESULT_REPARSE");
        }
        return path;
    }
    string Result(string id) {
        string path=ResultPath(id);
        if(new FileInfo(path).Length>32768) throw new InvalidDataException("RESULT_BOUNDS");
        var journal=JsonSerializer.Deserialize<Journal>(File.ReadAllBytes(Path.Combine(config.Spool,id+".json"))) ?? throw new InvalidDataException("JOURNAL_INVALID");
        if(journal.State!="AWAITING_VALIDATION" || journal.ExitCode!=0) throw new InvalidDataException("RESULT_UNCONFIRMED");
        string receipt=File.ReadAllText(path);
        using var document=JsonDocument.Parse(receipt);
        var request=document.RootElement.GetProperty("request");
        if(Text(request,"requestId")!=id) throw new InvalidDataException("RESULT_REQUEST");
        string hash=RequestHash(request,Text(request,"tool")=="unimate"?Text(request,"prompt"):"");
        if(hash!=journal.Hash) throw new InvalidDataException("RESULT_REQUEST");
        return receipt;
    }
    internal static string VerifyPeer(WindowsIdentity peer, Configuration config) {
        string sid = peer.User?.Value ?? throw new InvalidDataException("PEER_USER");
        var restricted = Native.Restricted(peer);
        if (new WindowsPrincipal(peer).IsInRole(WindowsBuiltInRole.Administrator) && sid != config.OwnerSid) throw new InvalidDataException("PEER_ADMIN_DENIED");
        if (sid == config.OwnerSid && restricted.Count == 0) return sid;
        if (sid != config.ServiceSid || !restricted.SetEquals(new[] {config.ServiceSid, "S-1-5-32-545", "S-1-5-12"})) throw new InvalidDataException("PEER_IDENTITY_DENIED");
        return sid;
    }
    async Task<object> Handle(JsonElement request, string peer, CancellationToken ct) {
        if (request.GetProperty("version").GetInt32() != 1) throw new InvalidDataException("VERSION");
        switch (Text(request, "op")) {
        case "admission": {
            Keys(request,"version","op");
            return new {version=1,op="admission",configurationEligible=await authority.AdmissionAsync(ct)};
        }
        case "result": {
            Keys(request,"version","op","requestId");
            return new {version=1,op="result",receipt=Result(Text(request,"requestId"))};
        }
        case "probe": {
            Keys(request, "version", "op");
            var start = new ProcessStartInfo(@"C:\Windows\System32\wsl.exe") { UseShellExecute=false, RedirectStandardOutput=true, CreateNoWindow=true };
            start.Environment.Clear(); start.Environment["SystemRoot"] = @"C:\Windows";
            foreach (string arg in new[] { "-d", "Ubuntu", "--", "/usr/bin/id", "-u" }) start.ArgumentList.Add(arg);
            using var process = Process.Start(start) ?? throw new InvalidOperationException("UBUNTU_PROBE_START");
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct); timeout.CancelAfter(TimeSpan.FromSeconds(10));
            try { await process.WaitForExitAsync(timeout.Token); }
            catch (OperationCanceledException) { process.Kill(true); await process.WaitForExitAsync(CancellationToken.None); throw; }
            string uid = (await process.StandardOutput.ReadToEndAsync(ct)).Trim();
            if (process.ExitCode != 0 || uid.Length > 10 || !uint.TryParse(uid, out _)) throw new InvalidOperationException("UBUNTU_PROBE_FAILED");
            return new { version=1, op="probe", ownerSid=config.OwnerSid, peerSid=peer, identitySource="windows-pipe-impersonation", manifestSha256=config.ManifestSha256, leaseAuthority=config.Bridge is null ? "unwired" : "owner-bridge", gpuDispatches=0, ubuntuUid=uid };
        }
        case "run": {
            Keys(request, "version", "op", "requestId", "tool", "assetId", "seed", "prompt");
            string idText = Text(request, "requestId");
            if (!Guid.TryParseExact(idText, "D", out Guid id) || id.ToString("D") != idText) throw new InvalidDataException("REQUEST_UUID");
            string tool = Text(request, "tool"), asset = Text(request, "assetId"), prompt = Text(request, "prompt");
            int seed = request.GetProperty("seed").GetInt32();
            if (seed < 0 || prompt.Length > 2000 || !config.Workers.TryGetValue(tool + ":" + asset, out var worker)) throw new InvalidDataException("WORKER_NOT_APPROVED");
            // Hash canonical field order, independent of JSON whitespace and property order.
            string hash = RequestHash(request,prompt);
            string path = Path.Combine(config.Spool, id + ".json");
            await serial.WaitAsync(ct);
            try {
                if (File.Exists(path)) {
                    var old = JsonSerializer.Deserialize<Journal>(File.ReadAllBytes(path)) ?? throw new InvalidDataException("JOURNAL_INVALID");
                    if (old.Hash != hash) throw new InvalidDataException("REQUEST_CONFLICT");
                    return new { version=1, op="run", requestId=id, state=old.State, requestSha256=hash, exitCode=old.ExitCode };
                }
                if (Directory.GetFiles(config.Spool,"*.json").Length >= 4096) throw new InvalidDataException("SPOOL_CAPACITY");
                using var executable = new FileStream(worker.Executable, FileMode.Open, FileAccess.Read, FileShare.Read);
                if (Convert.ToHexString(SHA256.HashData(executable)).ToLowerInvariant() != worker.Sha256) throw new InvalidDataException("EXECUTABLE_PIN");
                // The owner bridge owns the atomic authorization/spawn boundary.
                // Publish before delegation: any interrupted response stays UNKNOWN.
                Save(path, new Journal(hash, "RUNNING", null));
                int exit;
                try { exit = await authority.RunPinnedAsync(id, worker, request.GetRawText(), ct); }
                catch { Save(path, new Journal(hash,"UNKNOWN",null)); throw; }
                // Exit zero is not artifact validation and must never mean inference success.
                string state = exit == 0 ? "AWAITING_VALIDATION" : "FAILED";
                Save(path, new Journal(hash, state, exit));
                return new { version=1, op="run", requestId=id, state, requestSha256=hash, exitCode=exit };
            } finally { serial.Release(); }
        }
        case "get": {
            Keys(request, "version", "op", "artifactId", "offset", "length");
            string id = Text(request, "artifactId");
            long offset = request.GetProperty("offset").GetInt64(); int length = request.GetProperty("length").GetInt32();
            if (offset < 0 || length < 1 || length > 32768) throw new InvalidDataException("ARTIFACT_DENIED");
            string? path;
            string? expectedHash=null; long? expectedBytes=null;
            if(id.Length==38 && id[36]=='-' && id[37]>='0' && id[37]<='2') {
                string requestId=id[..36];
                using var receipt=JsonDocument.Parse(Result(requestId));
                var items=receipt.RootElement.GetProperty("artifacts").EnumerateArray().Where(item=>Text(item,"id")==id).ToArray();
                if(items.Length!=1) throw new InvalidDataException("ARTIFACT_DENIED");
                expectedHash=Text(items[0],"sha256");expectedBytes=items[0].GetProperty("bytes").GetInt64();
                path=Path.Combine(config.Spool,"results",requestId,"artifacts",id);
                if((File.GetAttributes(Path.GetDirectoryName(path)!)&FileAttributes.ReparsePoint)!=0) throw new InvalidDataException("RESULT_REPARSE");
            } else if(!config.Artifacts.TryGetValue(id,out path)) throw new InvalidDataException("ARTIFACT_DENIED");
            using var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            if (file.Length > 128L*1024*1024 || offset > file.Length || (File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0) throw new InvalidDataException("ARTIFACT_BOUNDS");
            string hash = Convert.ToHexString(SHA256.HashData(file)).ToLowerInvariant(); file.Position = offset;
            if(expectedHash is not null && (hash!=expectedHash || file.Length!=expectedBytes)) throw new InvalidDataException("ARTIFACT_CHANGED");
            byte[] chunk = new byte[Math.Min(length, file.Length-offset)]; await file.ReadExactlyAsync(chunk, ct);
            return new { version=1, op="get", artifactId=id, offset, total=file.Length, sha256=hash, data=Convert.ToBase64String(chunk) };
        }
        default: throw new InvalidDataException("OPERATION_DENIED");
        }
    }
    public async Task ServeOneAsync(CancellationToken ct) {
        var connected = pipe.WaitForConnectionAsync(ct);
        Console.WriteLine("PIPE_READY");
        await connected;
        try {
        await new FrameSession(pipe,FrameSession.TenSeconds).ExchangeAsync(async bytes => {
        string? peer = null;
        pipe.RunAsClient(() => { using var identity = WindowsIdentity.GetCurrent(true) ?? throw new InvalidDataException("PEER_TOKEN"); peer = VerifyPeer(identity, config); });
        using var json = JsonDocument.Parse(bytes, new JsonDocumentOptions { MaxDepth=8 });
        object result;
        try { result = await Handle(json.RootElement, peer ?? throw new InvalidDataException("PEER_TOKEN"), ct); }
        catch (Exception error) when (error is InvalidDataException or InvalidOperationException or KeyNotFoundException or FormatException) { result = new { version=1, op="error", code=error is InvalidDataException or InvalidOperationException ? error.Message : "REQUEST_SHAPE" }; }
        return JsonSerializer.SerializeToUtf8Bytes(result);
        },ct);
        } finally { if (pipe.IsConnected) pipe.Disconnect(); }
    }
    public void Dispose() { pipe.Dispose(); serial.Dispose(); }
}
static class Program {
    static async Task Main(string[] args) {
        if (args.Length is < 1 or > 2 || (args.Length == 2 && args[1] != "--once")) throw new ArgumentException("Expected owner-controlled config path [--once]");
        var config = JsonSerializer.Deserialize<Configuration>(File.ReadAllBytes(args[0]), new JsonSerializerOptions { UnmappedMemberHandling=System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow }) ?? throw new InvalidDataException("CONFIG");
        using var broker = new Broker(config, config.Bridge is null ? new UnwiredAuthority() : new NodeAuthority(config.Bridge));
        using var shutdown = new CancellationTokenSource();
        Console.CancelKeyPress += (_, signal) => { signal.Cancel = true; shutdown.Cancel(); };
        do {
            try { await broker.ServeOneAsync(shutdown.Token); }
            catch (OperationCanceledException) when (shutdown.IsCancellationRequested) { break; }
            catch (Exception error) when (error is IOException or InvalidDataException or OperationCanceledException) {
                Console.Error.WriteLine(error.GetType().Name);
            }
        } while (args.Length == 1 && !shutdown.IsCancellationRequested);
    }
}
