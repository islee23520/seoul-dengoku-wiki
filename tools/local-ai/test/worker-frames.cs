using Seoul.LocalAI;

// No Windows/WSL/lease required. Explicit console regression for the real frame
// exchange used by ServeOneAsync; barriers advance expiry without clock sleeps.
await LongHandler();
await SlowFrame();
Console.WriteLine("FRAME_REGRESSIONS_PASS 2");

static async Task LongHandler() {
    // Given a complete request and an input budget whose expiration is observable.
    using var stream = new FixtureStream(new byte[] {1,0,0,0,42});
    var inputExpired = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    int budgets=0;
    CancellationTokenSource Budget(CancellationToken parent) {
        bool first=++budgets==1;
        var source=first ? CancellationTokenSource.CreateLinkedTokenSource(parent,stream.InputCancellation.Token) : CancellationTokenSource.CreateLinkedTokenSource(parent);
        if(first) source.Token.Register(()=>inputExpired.TrySetResult());
        return source;
    }
    var session=new FrameSession(stream,Budget);
    var exchange=session.ExchangeAsync(async _ => {
        entered.SetResult(); await release.Task; return new byte[] {99};
    },CancellationToken.None);
    // When the already-consumed input budget expires while Handle is held.
    await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
    // Expiration of input I/O cannot cancel the new response scope.
    stream.InputCancellation.Cancel();
    await inputExpired.Task.WaitAsync(TimeSpan.FromSeconds(5));
    release.SetResult(); await exchange.WaitAsync(TimeSpan.FromSeconds(5));
    // Then a fresh response budget writes the full expected frame.
    if(budgets!=2 || !stream.Output.ToArray().SequenceEqual(new byte[] {1,0,0,0,99})) throw new Exception("LONG_HANDLE_RESPONSE");
}

static async Task SlowFrame() {
    // Given a peer stalled before its prefix, with manual bounded I/O expiry.
    using var stream=new FixtureStream(Array.Empty<byte>(),true);
    using var budget=new CancellationTokenSource();
    bool handled=false;
    var exchange=new FrameSession(stream,_=>budget).ExchangeAsync(_=> {
        handled=true;return Task.FromResult(new byte[] {1});
    },CancellationToken.None);
    // When the exact read-start barrier fires, expire only the input budget.
    await stream.ReadStarted.Task.WaitAsync(TimeSpan.FromSeconds(5)); budget.Cancel();
    // Then cancellation terminates the stalled frame before handler dispatch.
    try {await exchange.WaitAsync(TimeSpan.FromSeconds(5));throw new Exception("SLOW_FRAME_ACCEPTED");}
    catch(OperationCanceledException) {if(handled) throw new Exception("SLOW_FRAME_DISPATCHED");}
}

sealed class FixtureStream(byte[] request,bool stall=false) : Stream {
    readonly MemoryStream input=new(request);
    internal readonly MemoryStream Output=new();
    internal readonly CancellationTokenSource InputCancellation=new();
    internal readonly TaskCompletionSource ReadStarted=new(TaskCreationOptions.RunContinuationsAsynchronously);
    public override async ValueTask<int> ReadAsync(Memory<byte> buffer,CancellationToken ct=default) {
        if(input.Position<input.Length) {
            using var linked=CancellationTokenSource.CreateLinkedTokenSource(ct,InputCancellation.Token);
            return await input.ReadAsync(buffer,linked.Token);
        }
        if(stall) {ReadStarted.TrySetResult();await Task.Delay(Timeout.Infinite,ct);}
        return 0;
    }
    public override ValueTask WriteAsync(ReadOnlyMemory<byte> bytes,CancellationToken ct=default) {ct.ThrowIfCancellationRequested();return Output.WriteAsync(bytes,ct);}
    public override Task FlushAsync(CancellationToken ct) {ct.ThrowIfCancellationRequested();return Task.CompletedTask;}
    public override bool CanRead=>true;public override bool CanWrite=>true;public override bool CanSeek=>false;
    public override long Length=>throw new NotSupportedException();public override long Position {get=>throw new NotSupportedException();set=>throw new NotSupportedException();}
    public override void Flush()=>throw new NotSupportedException();public override int Read(byte[] b,int o,int c)=>throw new NotSupportedException();
    public override void Write(byte[] b,int o,int c)=>throw new NotSupportedException();public override long Seek(long o,SeekOrigin s)=>throw new NotSupportedException();public override void SetLength(long l)=>throw new NotSupportedException();
}
