param([Parameter(Mandatory=$true)][string]$BootstrapPath)
$ErrorActionPreference = 'Stop'
$source = [IO.File]::ReadAllText($BootstrapPath)
$match = [regex]::Match($source, "(?s)Add-Type -TypeDefinition @'\r?\n(.*?)\r?\n'@")
if (-not $match.Success) { throw 'FORWARDER_EXTRACTION_FAILED' }

# Compile the production C# verbatim, then run deterministic injected I/O
# against real owned Windows children. No copied forwarding algorithm exists.
$forwarder = $match.Groups[1].Value
$probes = @'
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

public sealed class FaultReader : TextReader {
  readonly ManualResetEventSlim release = new ManualResetEventSlim(false);
  int reads;
  public readonly TaskCompletionSource<bool> SecondReadFinished = new TaskCompletionSource<bool>();
  public bool Pending { get { return reads > 1 && !release.IsSet; } }
  public override string ReadLine() {
    if (Interlocked.Increment(ref reads) == 1) return "stop";
    release.Wait();
    SecondReadFinished.TrySetResult(true);
    return null;
  }
  public void Release() { release.Set(); }
}
public sealed class FaultWriter : StringWriter {
  public readonly TaskCompletionSource<bool> WriteStarted = new TaskCompletionSource<bool>();
  public readonly TaskCompletionSource<bool> FlushStarted = new TaskCompletionSource<bool>();
  public readonly TaskCompletionSource<bool> PendingWrite = new TaskCompletionSource<bool>();
  public string Mode;
  public bool Disposed;
  public readonly TaskCompletionSource<bool> DisposeStarted = new TaskCompletionSource<bool>();
  public FaultWriter(string mode) { Mode = mode; }
  public override Task WriteLineAsync(string value) {
    WriteStarted.TrySetResult(true);
    if (Mode == "write-sync") throw new IOException("INJECT_WRITE_SYNC");
    if (Mode == "write-fault") return Task.FromException(new IOException("INJECT_WRITE_FAULT"));
    if (Mode == "write-pending") return PendingWrite.Task;
    return Task.CompletedTask;
  }
  public override Task FlushAsync() {
    FlushStarted.TrySetResult(true);
    if (Mode == "flush-fault") return Task.FromException(new IOException("INJECT_FLUSH_FAULT"));
    return Task.CompletedTask;
  }
  protected override void Dispose(bool disposing) {
    Disposed = true;
    DisposeStarted.TrySetResult(true);
    if (Mode == "cleanup-fault") throw new IOException("INJECT_DISPOSE_FAULT");
    base.Dispose(disposing);
  }
}
public static class NativeControlProbe {
  public static string CleanupSnapshot;
  static void Check(bool condition, string label) { if (!condition) throw new Exception(label); }
  static void Signal(Task task, string label) {
    Check(Task.WhenAny(task, Task.Delay(10000)).GetAwaiter().GetResult() == task, label);
    task.GetAwaiter().GetResult();
  }
  public static string Run(string mode, string inject = null) {
    CleanupSnapshot = null;
    var psi = new ProcessStartInfo {
      FileName = @"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
      Arguments = "-NoProfile -NonInteractive -Command \"[Console]::ReadLine(); exit 37\"",
      UseShellExecute = false, RedirectStandardInput = true,
      RedirectStandardOutput = true, RedirectStandardError = true,
      CreateNoWindow = true
    };
    var child = new Process { StartInfo = psi };
    var input = new FaultReader();
    var output = new FaultWriter(mode);
    var classified = new TaskCompletionSource<bool>();
    var actualExit = new TaskCompletionSource<int>();
    var disposeStarted = output.DisposeStarted.Task;
    StreamWriter releaseWriter = null;
    Task<int> forward = null;
    bool started = false;
    Exception primary = null;
    string result = null;
    try {
      Check(child.Start(), "CHILD_START");
      started = true;
      releaseWriter = child.StandardInput;
      Check(releaseWriter.AutoFlush, "RELEASE_WRITER_NOT_AUTOFLUSHED");
      int pid = child.Id;
      forward = NativeInputForwarder.Run(child, input, output,
        live => classified.TrySetResult(live), observed => actualExit.TrySetResult(observed));
      Signal(output.WriteStarted.Task, "WRITE_BARRIER");
      if (inject == "write-started") throw new Exception("INJECT_ASSERT_write-started");
      if (mode == "flush-fault" || mode == "cleanup-fault") Signal(output.FlushStarted.Task, "FLUSH_BARRIER");
      if (inject == "flush-started") throw new Exception("INJECT_ASSERT_flush-started");
      if (mode == "write-pending") Check(!forward.IsCompleted, "PENDING_RETURNED_BEFORE_EXIT");
      if (inject == "pending-write") throw new Exception("INJECT_ASSERT_pending-write");
      if (mode == "write-sync" || mode == "write-fault" || mode == "flush-fault") {
        Signal(classified.Task, "FAULT_CLASSIFICATION_BARRIER");
        Check(classified.Task.Result, "FAULT_CLASSIFIED_AFTER_EXIT");
        Check(!forward.IsCompleted, "FAULT_ABANDONED_LIVE_CHILD");
      }
      if (inject == "classified") throw new Exception("INJECT_ASSERT_classified");
      releaseWriter.WriteLine("release");
      Signal(actualExit.Task, "CHILD_EXIT_TIMEOUT");
      Check(actualExit.Task.Result == 37, "CHILD_EXIT_DRIFT");
      if (inject == "child-result") throw new Exception("INJECT_ASSERT_child-result");
      if (mode == "write-pending") output.PendingWrite.TrySetException(new IOException("INJECT_LATE_WRITE"));
      Check(Task.WhenAny(forward, Task.Delay(10000)).GetAwaiter().GetResult() == forward, "FORWARD_EXIT_TIMEOUT");
      int code = 0; string fault = null;
      try { code = forward.GetAwaiter().GetResult(); }
      catch (InvalidOperationException error) { fault = error.Message; }
      bool expectedControllerFault = mode == "write-sync" || mode == "write-fault" || mode == "flush-fault";
      Check(expectedControllerFault ? code == 0 && fault == "NATIVE_INPUT_FORWARD_FAILED" :
        code == 37 && fault == null, "RESULT_MISMATCH_" + mode);
      Check(output.Disposed, "OUTPUT_NOT_DISPOSED");
      Signal(output.DisposeStarted.Task, "DISPOSAL_BARRIER");
      if (inject == "forward-complete") throw new Exception("INJECT_ASSERT_forward-complete");
      result = "FAULT_CASE " + mode + " child=37 forward=" +
        (fault ?? code.ToString()) + " outputDisposed=" + output.Disposed + " pid=" + pid;
    } catch (Exception error) { primary = error; }
    finally {
      input.Release();
      if (mode == "write-pending")
        output.PendingWrite.TrySetException(new IOException("INJECT_LATE_WRITE"));
      try {
        if (started && !actualExit.Task.IsCompleted && releaseWriter != null)
          releaseWriter.WriteLine("release");
        if (started && forward != null) {
          Signal(actualExit.Task, "CLEANUP_CHILD_EXIT_TIMEOUT");
          Check(actualExit.Task.Result == 37, "CLEANUP_CHILD_EXIT_DRIFT");
          if (Task.WhenAny(forward, Task.Delay(10000)).GetAwaiter().GetResult() != forward)
            throw new Exception("CLEANUP_FORWARD_TIMEOUT");
          try { forward.GetAwaiter().GetResult(); }
          catch (InvalidOperationException error) {
            Check(error.Message == "NATIVE_INPUT_FORWARD_FAILED", "CLEANUP_FAULT_DRIFT");
          }
          Signal(disposeStarted, "CLEANUP_DISPOSAL_TIMEOUT");
          if (mode == "cleanup-fault") Signal(input.SecondReadFinished.Task, "CLEANUP_READER_TIMEOUT");
          Check(output.Disposed && (mode != "write-pending" || output.PendingWrite.Task.IsCompleted), "CLEANUP_UNSETTLED");
        }
      } catch (Exception cleanupError) {
        if (primary == null) primary = cleanupError;
        else primary.Data["cleanup"] = cleanupError;
      }
      child.Dispose();
      CleanupSnapshot = "run exit=" + actualExit.Task.IsCompleted + " forward=" +
        (forward != null && forward.IsCompleted) + " pending=" +
        (mode != "write-pending" || output.PendingWrite.Task.IsCompleted) +
        " disposed=" + output.Disposed;
    }
    if (primary != null) throw new Exception("CASE_" + mode + "_" + primary.Message, primary);
    return result;
  }
  public static string ExitBeforeNextAction(string inject = null) {
    CleanupSnapshot = null;
    var psi = new ProcessStartInfo {
      FileName = @"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
      Arguments = "-NoProfile -NonInteractive -Command \"[Console]::ReadLine(); exit 37\"",
      UseShellExecute = false, RedirectStandardInput = true,
      RedirectStandardOutput = true, RedirectStandardError = true,
      CreateNoWindow = true
    };
    var child = new Process { StartInfo = psi };
    var reader = new FaultReader();
    var writer = new FaultWriter("write-sync");
    var classified = new TaskCompletionSource<bool>();
    var actualExit = new TaskCompletionSource<int>();
    StreamWriter releaseWriter = null;
    Task<int> forward = null;
    int pid = 0;
    Exception primary = null;
    string result = null;
    try {
      Check(child.Start(), "REGRESSION_CHILD_START");
      releaseWriter = child.StandardInput;
      Check(releaseWriter.AutoFlush, "REGRESSION_RELEASE_NOT_AUTOFLUSHED");
      pid = child.Id;
      forward = NativeInputForwarder.Run(child, reader, writer,
        live => classified.TrySetResult(live), observed => actualExit.TrySetResult(observed));
      Signal(writer.WriteStarted.Task, "REGRESSION_WRITE_BARRIER");
      if (inject == "write-started") throw new Exception("INJECT_ASSERT_regression-write-started");
      Signal(classified.Task, "REGRESSION_CLASSIFIED_BARRIER");
      Check(classified.Task.Result && !forward.IsCompleted, "REGRESSION_LIVE_FAULT_DRIFT");
      if (inject == "classified") throw new Exception("INJECT_ASSERT_regression-classified");
      releaseWriter.WriteLine("release");
      // The controller's next action is deliberately held until the production
      // forwarder has captured exit 37 and disposed its Process.
      Signal(actualExit.Task, "REGRESSION_EXIT_RESULT_TIMEOUT");
      Check(actualExit.Task.Result == 37, "REGRESSION_EXIT_DRIFT");
      if (inject == "child-result") throw new Exception("INJECT_ASSERT_regression-child-result");
      Check(Task.WhenAny(forward, Task.Delay(10000)).GetAwaiter().GetResult() == forward,
        "REGRESSION_FORWARD_COMPLETION_TIMEOUT");
      string fault = null;
      try { forward.GetAwaiter().GetResult(); }
      catch (InvalidOperationException error) { fault = error.Message; }
      Check(fault == "NATIVE_INPUT_FORWARD_FAILED", "REGRESSION_CLASSIFICATION_DRIFT");
      Check(writer.Disposed, "REGRESSION_OUTPUT_NOT_DISPOSED");
      if (inject == "forward-complete") throw new Exception("INJECT_ASSERT_regression-forward-complete");
      result = "EXIT_BEFORE_NEXT_ACTION child=37 forward=" + fault + " pid=" + pid;
    } catch (Exception error) { primary = error;
    } finally {
      reader.Release();
      try {
        if (forward != null) {
          if (!actualExit.Task.IsCompleted && releaseWriter != null) releaseWriter.WriteLine("release");
          Signal(actualExit.Task, "REGRESSION_CLEANUP_EXIT_TIMEOUT");
          Check(actualExit.Task.Result == 37, "REGRESSION_CLEANUP_EXIT_DRIFT");
          if (Task.WhenAny(forward, Task.Delay(10000)).GetAwaiter().GetResult() != forward)
            throw new Exception("REGRESSION_CLEANUP_FORWARD_TIMEOUT");
          try { forward.GetAwaiter().GetResult(); }
          catch (InvalidOperationException error) {
            Check(error.Message == "NATIVE_INPUT_FORWARD_FAILED", "REGRESSION_CLEANUP_FAULT_DRIFT");
          }
          Signal(writer.DisposeStarted.Task, "REGRESSION_CLEANUP_DISPOSAL_TIMEOUT");
          Check(writer.Disposed, "REGRESSION_CLEANUP_UNSETTLED");
        }
      } catch (Exception cleanupError) {
        if (primary == null) primary = cleanupError;
        else primary.Data["cleanup"] = cleanupError;
      }
      child.Dispose();
      CleanupSnapshot = "regression exit=" + actualExit.Task.IsCompleted + " forward=" +
        (forward != null && forward.IsCompleted) + " disposed=" + writer.Disposed;
    }
    if (primary != null) throw new Exception("REGRESSION_" + primary.Message, primary);
    return result;
  }
  public static string HeldExitedHandler(string inject = null) {
    CleanupSnapshot = null;
    var entered = new ManualResetEventSlim(false);
    var release = new ManualResetEventSlim(false);
    var completed = new TaskCompletionSource<bool>();
    Task waited = null;
    StreamWriter releaseWriter = null;
    bool started = false;
    Exception primary = null;
    string result = null;
    var psi = new ProcessStartInfo {
      FileName = @"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
      Arguments = "-NoProfile -NonInteractive -Command \"[Console]::ReadLine(); exit 37\"",
      UseShellExecute = false, RedirectStandardInput = true,
      RedirectStandardOutput = true, RedirectStandardError = true,
      CreateNoWindow = true
    };
    var child = new Process { StartInfo = psi, EnableRaisingEvents = true };
    child.Exited += (sender, args) => {
      entered.Set();
      release.Wait();
      completed.TrySetResult(true);
    };
    try {
      Check(child.Start(), "HELD_CHILD_START");
      started = true;
      releaseWriter = child.StandardInput;
      Check(releaseWriter.AutoFlush, "HELD_RELEASE_NOT_AUTOFLUSHED");
      releaseWriter.WriteLine("release");
      Check(entered.Wait(10000), "HELD_HANDLER_ENTRY_TIMEOUT");
      if (inject == "handler-entered") throw new Exception("INJECT_ASSERT_handler-entered");
      waited = Task.Run(() => child.WaitForExit());
      Signal(waited, "HELD_WAIT_FOR_EXIT_TIMEOUT");
      Check(!completed.Task.IsCompleted, "HANDLER_COMPLETED_BEFORE_RELEASE");
      if (inject == "wait-returned") throw new Exception("INJECT_ASSERT_wait-returned");
      release.Set();
      Signal(completed.Task, "HELD_HANDLER_COMPLETION_TIMEOUT");
      if (inject == "handler-completed") throw new Exception("INJECT_ASSERT_handler-completed");
      result = "HELD_HANDLER WaitForExitBeforeHandlerComplete=True";
    } catch (Exception error) { primary = error;
    } finally {
      release.Set();
      try {
        if (started) {
          if (releaseWriter != null && !entered.IsSet) releaseWriter.WriteLine("release");
          if (waited == null) waited = Task.Run(() => child.WaitForExit());
          Signal(waited, "HELD_CLEANUP_WAIT_TIMEOUT");
          Signal(completed.Task, "HELD_CLEANUP_HANDLER_TIMEOUT");
        }
      } catch (Exception cleanupError) {
        if (primary == null) primary = cleanupError;
        else primary.Data["cleanup"] = cleanupError;
      }
      child.Dispose();
      CleanupSnapshot = "held handler=" + completed.Task.IsCompleted + " wait=" +
        (waited != null && waited.IsCompleted);
    }
    if (primary != null) throw new Exception("HELD_" + primary.Message, primary);
    return result;
  }
  public static string AssertFailureCleanup(string kind, string mode, string phase) {
    Exception observed = null;
    try {
      if (kind == "run") Run(mode, phase);
      else if (kind == "regression") ExitBeforeNextAction(phase);
      else HeldExitedHandler(phase);
    } catch (Exception error) { observed = error; }
    string expected = kind == "run" ? "CASE_" + mode + "_INJECT_ASSERT_" + phase :
      kind == "regression" ? "REGRESSION_INJECT_ASSERT_regression-" + phase :
      "HELD_INJECT_ASSERT_" + phase;
    Check(observed != null && observed.Message == expected &&
      observed.InnerException != null &&
      observed.InnerException.Message == expected.Substring(expected.IndexOf("INJECT_ASSERT_")) &&
      observed.InnerException.Data["cleanup"] == null, "ASSERTION_MASKED_" + kind + "_" + phase);
    string wanted = kind == "run" ? "run exit=True forward=True pending=True disposed=True" :
      kind == "regression" ? "regression exit=True forward=True disposed=True" :
      "held handler=True wait=True";
    Check(CleanupSnapshot == wanted, "FAILURE_CLEANUP_UNSETTLED_" + kind + "_" + phase + " " + CleanupSnapshot);
    return "ASSERTION_CLEANUP " + kind + " " + mode + " " + phase + " " + CleanupSnapshot +
      " primary=" + observed.Message;
  }
}
'@
Add-Type -TypeDefinition ($probes.Substring(0,$probes.IndexOf('public sealed class FaultReader')) + ($forwarder -replace '(?m)^using .*?;\r?\n','') + "`n" + $probes.Substring($probes.IndexOf('public sealed class FaultReader')))
foreach ($scenario in @(
  @('run','write-sync','write-started'),
  @('run','flush-fault','flush-started'),
  @('run','write-pending','pending-write'),
  @('run','write-fault','classified'),
  @('run','write-pending','child-result'),
  @('run','cleanup-fault','forward-complete'),
  @('regression','','write-started'),
  @('regression','','classified'),
  @('regression','','child-result'),
  @('regression','','forward-complete'),
  @('held','','handler-entered'),
  @('held','','wait-returned'),
  @('held','','handler-completed')
)) {
  Write-Output ([NativeControlProbe]::AssertFailureCleanup($scenario[0],$scenario[1],$scenario[2]))
}
Write-Output ([NativeControlProbe]::HeldExitedHandler())
Write-Output ([NativeControlProbe]::ExitBeforeNextAction())
$orders = @(
  @('write-sync','write-fault','write-pending','flush-fault','cleanup-fault'),
  @('cleanup-fault','flush-fault','write-pending','write-fault','write-sync'),
  @('write-pending','write-sync','cleanup-fault','write-fault','flush-fault')
)
foreach ($order in $orders) {
  foreach ($mode in $order) {
    try { Write-Output ([NativeControlProbe]::Run($mode)) }
    catch { Write-Output ('FAULT_ERROR ' + $mode + ' ' + $_.Exception.ToString()); throw }
  }
}
