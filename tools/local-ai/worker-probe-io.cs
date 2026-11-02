using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using Microsoft.Win32.SafeHandles;

// Overlapped kernel I/O stays on the impersonated thread. Expiry cancels and
// joins that exact operation before releasing its buffer, event, or token.
internal static class ProbeIo {
    internal const string Pipe = @"\\.\pipe\seoul-local-ai-worker-v1";
    [StructLayout(LayoutKind.Sequential)] struct Overlapped { public UIntPtr Internal, InternalHigh; public uint Offset, OffsetHigh; public IntPtr Event; }
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern SafeFileHandle CreateFileW(string name,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool WaitNamedPipeW(string name,uint timeout);
    [DllImport("kernel32.dll",SetLastError=true)] static extern SafeFileHandle CreateEventW(IntPtr security,bool manual,bool state,IntPtr name);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool ReadFile(SafeFileHandle pipe,IntPtr bytes,uint count,IntPtr transferred,IntPtr overlapped);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool WriteFile(SafeFileHandle pipe,IntPtr bytes,uint count,IntPtr transferred,IntPtr overlapped);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetOverlappedResult(SafeFileHandle pipe,IntPtr overlapped,out uint transferred,bool wait);
    [DllImport("kernel32.dll",SetLastError=true)] static extern bool CancelIoEx(SafeFileHandle pipe,IntPtr overlapped);
    [DllImport("kernel32.dll",SetLastError=true)] static extern uint WaitForSingleObject(SafeFileHandle handle,uint milliseconds);
    [DllImport("advapi32.dll")] static extern uint GetSecurityInfo(SafeFileHandle handle,int type,uint info,out IntPtr owner,out IntPtr group,out IntPtr dacl,out IntPtr sacl,out IntPtr descriptor);
    [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr memory);
    internal static string Hash(byte[] bytes) { using (var hash = SHA256.Create()) return BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-","").ToLowerInvariant(); }
    internal static uint Remaining(Stopwatch clock,int deadline) {
        long left = deadline - clock.ElapsedMilliseconds; if (left <= 0) throw new TimeoutException("PIPE_DEADLINE"); return (uint)left;
    }
    internal static byte[] Exchange(ProbeContract config) {
        var clock = Stopwatch.StartNew();
        while (true) {
            Remaining(clock,config.DeadlineMs);
            // SQOS_PRESENT | SECURITY_IMPERSONATION | FILE_FLAG_OVERLAPPED.
            var pipe = CreateFileW(Pipe,0xc0020000,0,IntPtr.Zero,3,0x40120000,IntPtr.Zero);
            if (!pipe.IsInvalid) {
                using (pipe) {
                    IntPtr owner,group,dacl,sacl,descriptor;
                    uint error = GetSecurityInfo(pipe,6,1,out owner,out group,out dacl,out sacl,out descriptor);
                    if (error != 0) throw new Win32Exception((int)error,"PIPE_OWNER_QUERY");
                    try { ProbeContract.Require(new SecurityIdentifier(owner).Value == config.OwnerSid,"PIPE_OWNER"); } finally { LocalFree(descriptor); }
                    byte[] request = Encoding.UTF8.GetBytes("{\"version\":1,\"op\":\"probe\"}");
                    Transfer(pipe,new IoFrame(BitConverter.GetBytes(request.Length),true,clock,config.DeadlineMs));
                    Transfer(pipe,new IoFrame(request,true,clock,config.DeadlineMs));
                    var prefix = new byte[4]; Transfer(pipe,new IoFrame(prefix,false,clock,config.DeadlineMs));
                    uint size = BitConverter.ToUInt32(prefix,0); ProbeContract.Require(size > 0 && size <= 65536,"FRAME_BOUNDS");
                    var response = new byte[size]; Transfer(pipe,new IoFrame(response,false,clock,config.DeadlineMs));
                    return response;
                }
            }
            int failure = Marshal.GetLastWin32Error(); pipe.Dispose();
            if (failure != 231) throw new Win32Exception(failure,"PIPE_OPEN");
            if (!WaitNamedPipeW(Pipe,Remaining(clock,config.DeadlineMs))) throw new Win32Exception(Marshal.GetLastWin32Error(),"PIPE_CONNECT_DEADLINE");
        }
    }
    internal sealed class IoFrame {
        internal readonly byte[] Bytes; internal readonly bool Write; internal readonly Stopwatch Clock; internal readonly int Deadline;
        internal IoFrame(byte[] bytes,bool write,Stopwatch clock,int deadline) { Bytes=bytes; Write=write; Clock=clock; Deadline=deadline; }
    }
    internal static void Transfer(SafeFileHandle pipe,IoFrame frame) {
        var pin = GCHandle.Alloc(frame.Bytes,GCHandleType.Pinned);
        try {
            int offset = 0;
            while (offset < frame.Bytes.Length) {
                uint remaining = Remaining(frame.Clock,frame.Deadline);
                using (var signal = CreateEventW(IntPtr.Zero,true,false,IntPtr.Zero)) {
                    if (signal.IsInvalid) throw new Win32Exception();
                    IntPtr operation = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(Overlapped)));
                    try {
                        Marshal.StructureToPtr(new Overlapped { Event=signal.DangerousGetHandle() },operation,false);
                        IntPtr buffer = IntPtr.Add(pin.AddrOfPinnedObject(),offset); uint count = (uint)(frame.Bytes.Length-offset);
                        bool immediate = frame.Write ? WriteFile(pipe,buffer,count,IntPtr.Zero,operation) : ReadFile(pipe,buffer,count,IntPtr.Zero,operation);
                        if (!immediate && Marshal.GetLastWin32Error() != 997) throw new Win32Exception(Marshal.GetLastWin32Error(),"PIPE_IO");
                        uint wait = WaitForSingleObject(signal,remaining);
                        if (wait != 0) {
                            CancelIoEx(pipe,operation); uint cancelled;
                            GetOverlappedResult(pipe,operation,out cancelled,true);
                            if (wait == 258) throw new TimeoutException("PIPE_DEADLINE");
                            throw new Win32Exception(Marshal.GetLastWin32Error(),"PIPE_WAIT");
                        }
                        uint transferred;
                        if (!GetOverlappedResult(pipe,operation,out transferred,false)) throw new Win32Exception(Marshal.GetLastWin32Error(),"PIPE_COMPLETION");
                        if (transferred == 0) throw new EndOfStreamException("PIPE_EOF");
                        offset += checked((int)transferred);
                    } finally { Marshal.FreeHGlobal(operation); }
                }
            }
        } finally { pin.Free(); }
    }
}
