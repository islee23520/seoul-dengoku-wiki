using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Security.Principal;
using System.Text;
using Microsoft.Win32.SafeHandles;

internal static class WorkerProbeTests {
    static byte[] Fixture() {
        string hash = new string('a',64), nonce = new string('b',32);
        return Encoding.UTF8.GetBytes(ProbeContract.Json.Serialize(new Dictionary<string,object> {
            {"schema","worker-probe.v1"},{"serviceName","fixture"},{"serviceSid",NativeInstallation.ServiceSid("fixture")},
            {"ownerSid",WindowsIdentity.GetCurrent().User.Value},{"applicationPid",Process.GetCurrentProcess().Id.ToString()},
            {"creationFileTime","1"},{"imagePath",@"C:\fixture\node.exe"},{"imageSha256",hash},
            {"brokerPath",@"C:\fixture\WorkerBroker.dll"},{"brokerSha256",hash},{"brokerConfig",@"C:\fixture\broker.json"},
            {"brokerConfigSha256",hash},{"manifestSha256",hash},{"nonce",nonce},{"receiptPath",@"C:\fixture\"+nonce+".json"},
            {"deadlineMs","1000"},{"expiresUtc",DateTime.UtcNow.AddMinutes(5).ToString("o")}
        }));
    }
    static void Reject(Action when,string code) {
        try { when(); } catch (InvalidDataException error) { if (error.Message == code) return; throw; }
        throw new Exception("EXPECTED_REJECTION_"+code);
    }
    static void ParserRejectsDuplicateWhenFieldsRepeat() {
        // Given: duplicate machine input, not production evidence.
        byte[] bytes = Encoding.UTF8.GetBytes("{\"op\":\"probe\",\"op\":\"run\"}");
        // When / Then: parser fails before choosing either value.
        Reject(() => ProbeContract.Object(bytes),"JSON_DUPLICATE_OR_NESTED");
    }
    static void ParserRejectsDeadlineWhenOverTenSeconds() {
        // Given: otherwise valid synthetic contract.
        string json = Encoding.UTF8.GetString(Fixture()).Replace("\"1000\"","\"10001\"");
        // When / Then: out-of-bound budget is rejected.
        Reject(() => new ProbeContract(Encoding.UTF8.GetBytes(json)),"DEADLINE");
    }
    static void IdentityRejectsMismatchWhenOwnedProcessDoesNotMatch() {
        // Given: retained handle to this owned fixture, never SCM/application.
        var config = new ProbeContract(Fixture());
        using (var process = WorkerProbe.OpenProcess(0x1000,false,Process.GetCurrentProcess().Id)) {
            // When / Then: incorrect image and creation FILETIME fail closed.
            Reject(() => WorkerProbe.Identity(process,config),"APPLICATION_IDENTITY");
        }
    }
    static void SnapshotReadsTokenWhenOwnedFixtureQueriesItself() {
        // Given: owner token query only; no impersonation or token mutation.
        using (var identity = WindowsIdentity.GetCurrent()) using (var token = new SafeFileHandle(identity.Token,false)) {
            // When: use the actual linked verifier snapshot implementation.
            var snapshot = NativeWorkloadToken.Snapshot(token);
            // Then: actual owned token user is observed, not synthetic production proof.
            ProbeContract.Require((string)snapshot["user"] == identity.User.Value,"OWNER_SNAPSHOT");
        }
    }
    static void PendingReadCancelsWhenActualIoDeadlineExpires() {
        // Given: unique owner-only fixture transport connected without writing.
        string name = "worker-probe-owned-test-"+Guid.NewGuid().ToString("N");
        using (var server = new NamedPipeServerStream(name,PipeDirection.InOut,1,PipeTransmissionMode.Byte,PipeOptions.Asynchronous))
        using (var client = new NamedPipeClientStream(".",name,PipeDirection.InOut,PipeOptions.Asynchronous)) {
            var connected = server.WaitForConnectionAsync(); client.Connect(1000); connected.GetAwaiter().GetResult();
            using (var handle = new SafeFileHandle(client.SafePipeHandle.DangerousGetHandle(),false)) {
                var clock = Stopwatch.StartNew(); bool expired = false;
                // When: kernel read is issued against a silent connected fixture.
                try { ProbeIo.Transfer(handle,new ProbeIo.IoFrame(new byte[4],false,clock,30)); }
                catch (TimeoutException) { expired = true; }
                // Then: actual pending operation was cancelled and joined before return.
                ProbeContract.Require(expired && clock.ElapsedMilliseconds < 2000,"ACTUAL_IO_DEADLINE");
            }
        }
    }
    public static int Main() {
        ParserRejectsDuplicateWhenFieldsRepeat(); ParserRejectsDeadlineWhenOverTenSeconds();
        IdentityRejectsMismatchWhenOwnedProcessDoesNotMatch(); SnapshotReadsTokenWhenOwnedFixtureQueriesItself();
        PendingReadCancelsWhenActualIoDeadlineExpires();
        Console.WriteLine("PASS 5 focused owned/synthetic tests; production token impersonation NOT RUN"); return 0;
    }
}
