using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Seoul.LocalAI;

sealed class NodeAuthority(OwnerBridge bridge) : IGpuLeaseAuthority {
    public async ValueTask<bool> AdmissionAsync(CancellationToken ct) {
        try { return await RunPinnedAsync(Guid.Empty, new Worker("", "", []), "{\"op\":\"admission\"}", ct) == 0; }
        catch (Exception error) when (error is InvalidDataException or InvalidOperationException or IOException) { return false; }
    }
    public async ValueTask<int> RunPinnedAsync(Guid id, Worker worker, string request, CancellationToken ct) {
        foreach (var pin in new[] {(bridge.Executable,bridge.Sha256),(bridge.Script,bridge.ScriptSha256),(bridge.Config,bridge.ConfigSha256)}) {
            using var file = new FileStream(pin.Item1,FileMode.Open,FileAccess.Read,FileShare.Read);
            if(Convert.ToHexString(SHA256.HashData(file)).ToLowerInvariant()!=pin.Item2) throw new InvalidDataException("BRIDGE_PIN");
        }
        ct.ThrowIfCancellationRequested();
        var start = new ProcessStartInfo(bridge.Executable) { UseShellExecute=false, RedirectStandardInput=true, RedirectStandardOutput=true, CreateNoWindow=true };
        start.Environment.Clear(); start.Environment["SystemRoot"]=@"C:\Windows";
        start.ArgumentList.Add(bridge.Script); start.ArgumentList.Add(bridge.Config);
        using var child = Process.Start(start) ?? throw new InvalidOperationException("BRIDGE_START");
        // Drain concurrently, retaining at most 1024 characters even if a pinned
        // owner misbehaves. Continue draining excess so it can exit/release custody.
        var output = DrainAsync(child.StandardOutput);
        try {
            await child.StandardInput.WriteLineAsync(request);
            var exited = child.WaitForExitAsync(CancellationToken.None);
            var cancelled = Task.Delay(Timeout.Infinite,ct);
            if(await Task.WhenAny(exited,cancelled)==cancelled) {
                await child.StandardInput.WriteLineAsync("{\"op\":\"cancel\"}");
                await child.StandardInput.FlushAsync();
            }
            // Never abandon or kill the lease owner: it cancels its own worker,
            // confirms tree exit and restores before exiting. Unconfirmed cleanup
            // deliberately retains this wait and custody for operator reconciliation.
            await exited;
        } finally {
            child.StandardInput.Close();
            await child.WaitForExitAsync(CancellationToken.None);
            await output;
        }
        ct.ThrowIfCancellationRequested();
        if(child.ExitCode!=0) throw new InvalidOperationException("OWNER_BRIDGE_FAILED");
        using var result = JsonDocument.Parse(await output);
        return result.RootElement.GetProperty("exitCode").GetInt32();
    }
    static async Task<string> DrainAsync(StreamReader reader) {
        char[] buffer = new char[512]; var text = new StringBuilder(1024); bool overflow=false;
        int count;
        while((count=await reader.ReadAsync(buffer))!=0) {
            if(text.Length+count<=1024) text.Append(buffer,0,count); else overflow=true;
        }
        if(overflow) throw new InvalidDataException("BRIDGE_RESPONSE");
        return text.ToString();
    }
}
