using System.Buffers.Binary;

namespace Seoul.LocalAI;

// Independent frame budgets never cancel worker execution. The factory is
// injectable so cancellation can be advanced deterministically in regression tests.
sealed class FrameSession(Stream stream, Func<CancellationToken, CancellationTokenSource> budget) {
    public async Task ExchangeAsync(Func<byte[], Task<byte[]>> handle, CancellationToken lifetime) {
        byte[] prefix = new byte[4], request;
        using var input = budget(lifetime);
        await stream.ReadExactlyAsync(prefix,input.Token);
        uint size = BinaryPrimitives.ReadUInt32LittleEndian(prefix);
        if(size==0 || size>65536) throw new InvalidDataException("FRAME_BOUNDS");
        request = new byte[size]; await stream.ReadExactlyAsync(request,input.Token);
        byte[] response = await handle(request);
        if(response.Length==0 || response.Length>65536) throw new InvalidDataException("FRAME_BOUNDS");
        using var output = budget(lifetime);
        BinaryPrimitives.WriteUInt32LittleEndian(prefix,(uint)response.Length);
        await stream.WriteAsync(prefix,output.Token); await stream.WriteAsync(response,output.Token);
        await stream.FlushAsync(output.Token);
        // Client closes after consuming the response; retain pipe custody until then.
        byte[] end = new byte[1]; await stream.ReadAsync(end,output.Token);
    }
    internal static CancellationTokenSource TenSeconds(CancellationToken lifetime) {
        var result = CancellationTokenSource.CreateLinkedTokenSource(lifetime);
        result.CancelAfter(TimeSpan.FromSeconds(10)); return result;
    }
}
