param([Parameter(Mandatory=$true)][string]$ConfigPath)
$ErrorActionPreference = 'Stop'

# The caller must use an absolute, admitted PowerShell executable with -NoProfile.
# ACL/ancestry admission is an installation gate, not a claim made by this script.
function ExistingPath([string]$Path, [bool]$Directory) {
  if ($Path -notmatch '^[A-Za-z]:[\\/]' -or $Path.Contains('"')) { throw 'NATIVE_ABSOLUTE_PATH_REQUIRED' }
  $item = Get-Item -Force -LiteralPath $Path
  if ($item.PSIsContainer -ne $Directory) { throw 'NATIVE_PATH_TYPE' }
  $cursor = $item
  while ($null -ne $cursor) {
    if ($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'NATIVE_REPARSE_PATH' }
    if ($cursor.PSIsContainer) { $cursor = $cursor.Parent } else { $cursor = $cursor.Directory }
  }
  return $item.FullName
}

$configFile = ExistingPath $ConfigPath $false
$config = [IO.File]::ReadAllText($configFile) | ConvertFrom-Json
$node = ExistingPath $config.nodePath $false
$launcher = ExistingPath (Join-Path $PSScriptRoot 'supervise-personal-native.mjs') $false
[void](ExistingPath (Join-Path $PSScriptRoot 'start-personal-native.mjs') $false)
if ($config.nodeSha256 -notmatch '^[a-f0-9]{64}$' -or
    (Get-FileHash -LiteralPath $node -Algorithm SHA256).Hash.ToLowerInvariant() -cne $config.nodeSha256) {
  throw 'NATIVE_NODE_HASH_MISMATCH'
}
$psi = [Diagnostics.ProcessStartInfo]::new()
$psi.FileName = $node
$psi.Arguments = '"' + $launcher + '" "' + $configFile + '"'
$psi.WorkingDirectory = ExistingPath $PSScriptRoot $true
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.EnvironmentVariables.Clear()
$psi.EnvironmentVariables['SystemRoot'] = [Environment]::GetFolderPath('Windows')
$psi.EnvironmentVariables['WINDIR'] = [Environment]::GetFolderPath('Windows')
Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
public sealed class NativeOwnedHandle : SafeHandleZeroOrMinusOneIsInvalid {
  static int active;
  public static int Active { get { return Volatile.Read(ref active); } }
  public NativeOwnedHandle() : base(true) { }
  public NativeOwnedHandle(IntPtr value) : this() {
    SetHandle(value);
    if (!IsInvalid) Interlocked.Increment(ref active);
  }
  public SafeFileHandle TransferPipe() {
    var transferred = new SafeFileHandle(DangerousGetHandle(), true);
    SetHandleAsInvalid();
    Interlocked.Decrement(ref active);
    return transferred;
  }
  protected override bool ReleaseHandle() {
    bool closed = NativeJob.KernelClose(handle);
    Interlocked.Decrement(ref active);
    return closed;
  }
}
public sealed class NativeJobChild : IDisposable {
  public readonly Process Process;
  public readonly StreamWriter Input;
  internal readonly NativeOwnedHandle Job;
  readonly NativeOwnedHandle processHandle;
  public NativeJobChild(Process process, StreamWriter input, NativeOwnedHandle ownedJob, NativeOwnedHandle ownedProcess) {
    Process = process; Input = input; Job = ownedJob; processHandle = ownedProcess;
  }
  public void Dispose() {
    try { Input.Dispose(); }
    finally {
      try { Process.Dispose(); }
      finally { try { processHandle.Dispose(); } finally { Job.Dispose(); } }
    }
  }
}
public static class NativeJob {
  static readonly List<NativeOwnedHandle> retained = new List<NativeOwnedHandle>();
  public static int Retained { get { lock (retained) return retained.Count; } }
  public static void ReleaseRetained() {
    lock (retained) {
      foreach (var handle in retained) handle.Dispose();
      retained.Clear();
    }
  }
  const uint CREATE_SUSPENDED = 0x4, CREATE_UNICODE_ENVIRONMENT = 0x400,
    EXTENDED_STARTUPINFO_PRESENT = 0x80000, STARTF_USESTDHANDLES = 0x100;
  const uint HANDLE_FLAG_INHERIT = 1, KILL_ON_CLOSE = 0x2000;
  static readonly IntPtr HandleListAttribute = new IntPtr(0x20002), JobListAttribute = new IntPtr(0x2000D);
  [StructLayout(LayoutKind.Sequential)] struct SECURITY_ATTRIBUTES {
    public int Length; public IntPtr SecurityDescriptor; [MarshalAs(UnmanagedType.Bool)] public bool Inherit;
  }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct STARTUPINFO {
    public int Size; public string Reserved; public string Desktop; public string Title;
    public int X, Y, XSize, YSize, XCountChars, YCountChars, FillAttribute;
    public uint Flags; public short ShowWindow, Reserved2; public IntPtr Reserved2Ptr;
    public IntPtr Input, Output, Error;
  }
  [StructLayout(LayoutKind.Sequential)] struct STARTUPINFOEX {
    public STARTUPINFO Startup; public IntPtr Attributes;
  }
  [StructLayout(LayoutKind.Sequential)] struct PROCESS_INFORMATION {
    public IntPtr Process, Thread; public int ProcessId, ThreadId;
  }
  [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT {
    public long ProcessTime, JobTime; public uint Flags; public IntPtr MinWorkingSet, MaxWorkingSet;
    public uint ActiveProcesses; public IntPtr Affinity; public uint Priority, Scheduling;
  }
  [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS {
    public ulong ReadOps, WriteOps, OtherOps, ReadBytes, WriteBytes, OtherBytes;
  }
  [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT {
    public BASIC_LIMIT Basic; public IO_COUNTERS Io;
    public IntPtr ProcessMemory, JobMemory, PeakProcess, PeakJob;
  }
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr security, IntPtr name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(NativeOwnedHandle job, int kind, ref EXTENDED_LIMIT limits, int length);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool IsProcessInJob(IntPtr process, NativeOwnedHandle job, out bool inside);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CreatePipe(out IntPtr read, out IntPtr write, ref SECURITY_ATTRIBUTES security, int size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetHandleInformation(NativeOwnedHandle handle, uint mask, uint flags);
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr GetStdHandle(int stream);
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr GetCurrentProcess();
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool DuplicateHandle(IntPtr sourceProcess, IntPtr source, IntPtr targetProcess, out IntPtr target, uint access, bool inherit, uint options);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr attributes, int count, int flags, ref IntPtr size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr attributes, uint flags, IntPtr key, IntPtr value, IntPtr size, IntPtr previous, IntPtr returnSize);
  [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr attributes);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool CreateProcessW(string application, StringBuilder command, IntPtr processAttributes, IntPtr threadAttributes, bool inherit, uint flags, IntPtr environment, string directory, ref STARTUPINFOEX startup, out PROCESS_INFORMATION info);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint ResumeThread(NativeOwnedHandle thread);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool TerminateProcess(NativeOwnedHandle process, uint code);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint WaitForSingleObject(NativeOwnedHandle handle, uint milliseconds);
  [DllImport("kernel32.dll", SetLastError=true)] static extern uint GetProcessId(NativeOwnedHandle process);
  [DllImport("kernel32.dll", EntryPoint="CloseHandle", SetLastError=true)] internal static extern bool KernelClose(IntPtr handle);
  static Exception Failure(string step) { return new Win32Exception(Marshal.GetLastWin32Error(), "NATIVE_JOB_" + step); }
  public static bool Contains(NativeJobChild owned, Process member) {
    bool inside;
    if (!IsProcessInJob(member.Handle, owned.Job, out inside)) throw Failure("MEMBERSHIP");
    return inside;
  }
  public static NativeJobChild Start(string executable, string arguments, string directory,
    IDictionary<string,string> variables, string inject = null) {
    NativeOwnedHandle job = null, read = null, write = null, output = null, error = null,
      process = null, thread = null;
    Process child = null; StreamWriter input = null;
    IntPtr attributes = IntPtr.Zero, handles = IntPtr.Zero, jobs = IntPtr.Zero, environment = IntPtr.Zero;
    bool initialized = false, created = false, success = false;
    try {
      IntPtr jobHandle = CreateJobObject(IntPtr.Zero, IntPtr.Zero);
      if (jobHandle == IntPtr.Zero || jobHandle == new IntPtr(-1)) throw Failure("CREATE_JOB");
      job = new NativeOwnedHandle(jobHandle);
      if (job.IsInvalid) throw Failure("CREATE_JOB");
      var limits = new EXTENDED_LIMIT(); limits.Basic.Flags = KILL_ON_CLOSE;
      if (!SetInformationJobObject(job, 9, ref limits, Marshal.SizeOf(typeof(EXTENDED_LIMIT))))
        throw Failure("SET_LIMIT");
      var security = new SECURITY_ATTRIBUTES { Length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES)), Inherit=true };
      IntPtr pipeRead, pipeWrite;
      if (!CreatePipe(out pipeRead, out pipeWrite, ref security, 0)) throw Failure("CREATE_PIPE");
      read = new NativeOwnedHandle(pipeRead); write = new NativeOwnedHandle(pipeWrite);
      if (!SetHandleInformation(write, HANDLE_FLAG_INHERIT, 0)) throw Failure("PIPE_INHERIT");
      IntPtr duplicate;
      IntPtr stdoutHandle = GetStdHandle(-11);
      if (stdoutHandle == IntPtr.Zero || stdoutHandle == new IntPtr(-1) ||
          !DuplicateHandle(GetCurrentProcess(), stdoutHandle, GetCurrentProcess(), out duplicate, 0, true, 2)) throw Failure("STDOUT_DUP");
      output = new NativeOwnedHandle(duplicate);
      IntPtr stderrHandle = GetStdHandle(-12);
      if (stderrHandle == IntPtr.Zero || stderrHandle == new IntPtr(-1) ||
          !DuplicateHandle(GetCurrentProcess(), stderrHandle, GetCurrentProcess(), out duplicate, 0, true, 2)) throw Failure("STDERR_DUP");
      error = new NativeOwnedHandle(duplicate);
      IntPtr size = IntPtr.Zero;
      if (Environment.OSVersion.Version.Major < 10) throw new InvalidOperationException("NATIVE_JOB_LIST_UNSUPPORTED");
      InitializeProcThreadAttributeList(IntPtr.Zero, 2, 0, ref size);
      attributes = Marshal.AllocHGlobal(size);
      if (!InitializeProcThreadAttributeList(attributes, 2, 0, ref size)) throw Failure("ATTR_INIT");
      initialized = true;
      handles = Marshal.AllocHGlobal(IntPtr.Size * 3);
      Marshal.WriteIntPtr(handles, 0, read.DangerousGetHandle());
      Marshal.WriteIntPtr(handles, IntPtr.Size, output.DangerousGetHandle());
      Marshal.WriteIntPtr(handles, IntPtr.Size * 2, error.DangerousGetHandle());
      if (!UpdateProcThreadAttribute(attributes, 0, HandleListAttribute, handles,
            new IntPtr(IntPtr.Size * 3), IntPtr.Zero, IntPtr.Zero)) throw Failure("ATTR_HANDLES");
      jobs = Marshal.AllocHGlobal(IntPtr.Size);
      Marshal.WriteIntPtr(jobs, job.DangerousGetHandle());
      if (inject == "assign") throw new InvalidOperationException("NATIVE_JOB_INJECT_ASSIGN");
      if (!UpdateProcThreadAttribute(attributes, 0, JobListAttribute, jobs,
            new IntPtr(IntPtr.Size), IntPtr.Zero, IntPtr.Zero)) throw Failure("ATTR_JOBS");
      var keys = new List<string>(variables.Keys); keys.Sort(StringComparer.OrdinalIgnoreCase);
      var block = new StringBuilder();
      foreach (string key in keys) block.Append(key).Append('=').Append(variables[key]).Append('\0');
      block.Append('\0');
      environment = Marshal.StringToHGlobalUni(block.ToString());
      var startup = new STARTUPINFOEX();
      startup.Startup.Size = Marshal.SizeOf(typeof(STARTUPINFOEX));
      startup.Attributes = attributes;
      startup.Startup.Flags = STARTF_USESTDHANDLES;
      startup.Startup.Input = read.DangerousGetHandle();
      startup.Startup.Output = output.DangerousGetHandle();
      startup.Startup.Error = error.DangerousGetHandle();
      var command = new StringBuilder("\"" + executable + "\" " + arguments);
      PROCESS_INFORMATION info;
      if (inject == "create" || !CreateProcessW(executable, command, IntPtr.Zero, IntPtr.Zero,
          true, CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO_PRESENT,
          environment, directory, ref startup, out info)) throw inject == "create" ?
            new InvalidOperationException("NATIVE_JOB_INJECT_CREATE") : Failure("CREATE_PROCESS");
      process = new NativeOwnedHandle(info.Process); thread = new NativeOwnedHandle(info.Thread);
      created = true;
      if (inject == "crash-after-create") {
        File.WriteAllText(Path.Combine(directory, "created-boundary.txt"), info.ProcessId.ToString());
        Console.ReadLine();
        Environment.FailFast("NATIVE_JOB_CREATE_BOUNDARY_OWNER_ABORT");
      }
      bool inside;
      if (!IsProcessInJob(process.DangerousGetHandle(), job, out inside) || !inside)
        throw Failure("CREATION_MEMBERSHIP");
      child = Process.GetProcessById(info.ProcessId);
      if (GetProcessId(process) != (uint)child.Id) throw new InvalidOperationException("NATIVE_JOB_IDENTITY");
      // Retain the managed process handle before a fast child can exit and release its PID.
      if (child.Handle == IntPtr.Zero) throw new InvalidOperationException("NATIVE_JOB_PROCESS_HANDLE");
      if (inject == "resume" || inject == "resume-terminate" || inject == "resume-wait" || ResumeThread(thread) != 1) throw inject != null && inject.StartsWith("resume") ?
        new InvalidOperationException("NATIVE_JOB_INJECT_RESUME") : Failure("RESUME");
      read.Dispose(); read = null;
      var inputHandle = write.TransferPipe();
      write.Dispose(); write = null;
      FileStream inputStream = null;
      try {
        inputStream = new FileStream(inputHandle, FileAccess.Write, 4096, false);
        input = new StreamWriter(inputStream, new UTF8Encoding(false));
      } catch {
        if (inputStream != null) inputStream.Dispose(); else inputHandle.Dispose();
        throw;
      }
      input.AutoFlush = true;
      var owned = new NativeJobChild(child, input, job, process);
      success = true;
      return owned;
    } finally {
      Exception cleanupFailure = null;
      if (!success && created && (inject == "resume-terminate" || !TerminateProcess(process, 1)))
        cleanupFailure = inject == "resume-terminate" ?
          new InvalidOperationException("NATIVE_JOB_INJECT_TERMINATE") : Failure("TERMINATE");
      try { if (thread != null) thread.Dispose(); }
      finally {
        try { if (initialized) DeleteProcThreadAttributeList(attributes); }
        finally {
          try { if (attributes != IntPtr.Zero) Marshal.FreeHGlobal(attributes); }
          finally {
            try { if (handles != IntPtr.Zero) Marshal.FreeHGlobal(handles); }
            finally {
              try { if (jobs != IntPtr.Zero) Marshal.FreeHGlobal(jobs); }
              finally { if (environment != IntPtr.Zero) Marshal.FreeHGlobal(environment); }
            }
          }
          try { if (read != null) read.Dispose(); }
          finally {
            try { if (write != null) write.Dispose(); }
            finally {
              try { if (output != null) output.Dispose(); }
              finally {
                try { if (error != null) error.Dispose(); }
                finally {
                  if (!success) {
                    try { if (input != null) input.Dispose(); }
                    finally {
                      try { if (child != null) child.Dispose(); }
                      finally {
                        try {
                          if (created) {
                            uint result = WaitForSingleObject(process, 10000);
                            if (inject == "resume-wait" && result == 0) result = 0x102;
                            if (result != 0 && cleanupFailure == null)
                              cleanupFailure = result == 0x102 ?
                                new InvalidOperationException("NATIVE_JOB_WAIT_TIMEOUT") : Failure("WAIT");
                          }
                        } finally {
                          if (cleanupFailure == null) {
                            try { if (process != null) process.Dispose(); }
                            finally { if (job != null) job.Dispose(); }
                          } else lock (retained) {
                            if (job != null) retained.Add(job);
                            if (process != null) retained.Add(process);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (cleanupFailure != null) throw new InvalidOperationException("NATIVE_JOB_CLEANUP_UNCONFIRMED", cleanupFailure);
    }
  }
}
public static class NativeInputForwarder {
  public static async Task<int> Run(Process child, TextReader input, TextWriter output,
    Action<bool> faultClassified = null, Action<int> resultObserved = null) {
    var exited = Task.Run(() => child.WaitForExit());
    var line = Task.Run(() => input.ReadLine());
    Task pending = null;
    Exception failure = null;
    int exitCode = 0;
    bool controllerFailure = false;
    try {
      while (!exited.IsCompleted) {
        if (await Task.WhenAny(line, exited).ConfigureAwait(false) == exited) break;
        var value = await line.ConfigureAwait(false);
        if (value == null || child.HasExited) break;
        pending = output.WriteLineAsync(value);
        if (await Task.WhenAny(pending, exited).ConfigureAwait(false) == exited) break;
        await pending.ConfigureAwait(false);
        pending = output.FlushAsync();
        if (await Task.WhenAny(pending, exited).ConfigureAwait(false) == exited) break;
        await pending.ConfigureAwait(false);
        pending = null;
        line = Task.Run(() => input.ReadLine());
      }
    } catch (Exception error) {
      controllerFailure = !child.HasExited;
      if (controllerFailure) failure = error;
      if (faultClassified != null) faultClassified(controllerFailure);
    }
    try {
      await exited.ConfigureAwait(false);
      exitCode = child.ExitCode;
      if (resultObserved != null) resultObserved(exitCode);
      if (pending != null) {
        try { await pending.ConfigureAwait(false); } catch (Exception error) {
          if (failure == null && controllerFailure) failure = error;
        }
      }
    } finally {
      try { output.Dispose(); } catch (Exception error) { if (failure == null && controllerFailure) failure = error; }
      try { child.Dispose(); } catch (Exception error) { if (failure == null && controllerFailure) failure = error; }
    }
    if (failure != null) throw new InvalidOperationException("NATIVE_INPUT_FORWARD_FAILED", failure);
    return exitCode;
  }
}
'@
$environment = [Collections.Generic.Dictionary[string,string]]::new()
foreach ($key in $psi.EnvironmentVariables.Keys) { $environment[$key] = $psi.EnvironmentVariables[$key] }
$owned = [NativeJob]::Start($psi.FileName, $psi.Arguments, $psi.WorkingDirectory, $environment)
try {
  $result = [NativeInputForwarder]::Run($owned.Process, [IO.StreamReader]::new([Console]::OpenStandardInput()), $owned.Input).GetAwaiter().GetResult()
} finally { $owned.Dispose() }
exit $result
