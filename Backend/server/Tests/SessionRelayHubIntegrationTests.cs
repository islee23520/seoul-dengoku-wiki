using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Relay;
using Xunit;

namespace SeoulKenshi.Server.Tests;

public class SessionRelayHubIntegrationTests : IAsyncLifetime
{
    readonly SessionRegistry _registry = new SessionRegistry();
    readonly SessionRelayHub _hub;

    public SessionRelayHubIntegrationTests()
    {
        _hub = new SessionRelayHub(_registry, (accountIdx, sessionKey) => sessionKey == $"k{accountIdx}");
    }

    public Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await _hub.StopAsync();
    }

    [Fact]
    public async Task Host_and_guest_flow_join_relay_broadcast_and_host_timeout_close()
    {
        Assert.True(_registry.TryCreate(1, "host", 4, DateTime.UtcNow, out var session, out _));
        await _hub.StartAsync(0);

        var host = await ConnectAsync(_hub.Port, session.SessionCode, 1, "k1");
        var joinedHost = await ReceiveAsync(host);
        Assert.Equal("joined", joinedHost.GetProperty("type").GetString());
        Assert.Equal(0, joinedHost.GetProperty("role").GetInt32());

        var guest = await ConnectAsync(_hub.Port, session.SessionCode, 2, "k2");
        var joinedGuest = await ReceiveAsync(guest);
        Assert.Equal("joined", joinedGuest.GetProperty("type").GetString());
        Assert.Equal(1, joinedGuest.GetProperty("role").GetInt32());

        var roster = await ReceiveUntilAsync(host, root =>
            root.GetProperty("type").GetString() == "roster"
            && root.GetProperty("members").GetArrayLength() == 2);
        Assert.Equal(2, roster.GetProperty("members").GetArrayLength());

        // 게스트 → 호스트 명령 릴레이(페이로드는 해석 없이 그대로).
        await SendAsync(guest, new { type = "command", requestId = "req-1", payload = new { tick = 5, cmd = "move" } });
        var command = await ReceiveUntilTypeAsync(host, "relay");
        Assert.Equal(2, command.GetProperty("fromAccountIdx").GetInt64());
        Assert.Equal("req-1", command.GetProperty("requestId").GetString());
        Assert.Equal("move", command.GetProperty("payload").GetProperty("cmd").GetString());

        // 호스트 → 게스트 사건 배치 브로드캐스트.
        await SendAsync(host, new { type = "broadcast", payload = new { events = new[] { 1, 2 } } });
        var broadcast = await ReceiveUntilTypeAsync(guest, "relay");
        Assert.Equal(1, broadcast.GetProperty("fromAccountIdx").GetInt64());
        Assert.Equal(0, broadcast.GetProperty("fromRole").GetInt32());

        // 호스트가 끊기면(재접속 없이) 스윕이 세션을 닫고 게스트에게 알린다.
        await host.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
        await _hub.RunSweepAsync(DateTime.UtcNow.AddSeconds(31), 30, 30);

        var closed = await ReceiveUntilTypeAsync(guest, "sessionClosed");
        Assert.Equal("hostTimeout", closed.GetProperty("reason").GetString());
        Assert.Equal(SessionState.Closed, session.State);

        // 닫힌 세션은 새 연결을 받지 않는다.
        await Assert.ThrowsAnyAsync<WebSocketException>(() =>
            ConnectAsync(_hub.Port, session.SessionCode, 3, "k3"));
    }

    [Fact]
    public async Task Heartbeat_keeps_session_alive_across_sweeps()
    {
        Assert.True(_registry.TryCreate(10, "host", 4, DateTime.UtcNow, out var session, out _));
        await _hub.StartAsync(0);

        var host = await ConnectAsync(_hub.Port, session.SessionCode, 10, "k10");
        var guest = await ConnectAsync(_hub.Port, session.SessionCode, 11, "k11");
        await ReceiveAsync(host);
        await ReceiveAsync(guest);
        await ReceiveUntilTypeAsync(host, "roster");

        var later = DateTime.UtcNow.AddSeconds(15);
        await SendAsync(host, new { type = "heartbeat" });
        await SendAsync(guest, new { type = "heartbeat" });
        await _hub.RunSweepAsync(later, 30, 30);

        Assert.Equal(SessionState.Open, session.State);
    }

    [Fact]
    public async Task Wrong_session_key_is_rejected_before_websocket_upgrade()
    {
        Assert.True(_registry.TryCreate(20, "host", 4, DateTime.UtcNow, out var session, out _));
        await _hub.StartAsync(0);

        await Assert.ThrowsAnyAsync<WebSocketException>(() =>
            ConnectAsync(_hub.Port, session.SessionCode, 20, "wrong-key"));
    }

    [Fact]
    public async Task Unknown_session_code_is_rejected()
    {
        await _hub.StartAsync(0);

        await Assert.ThrowsAnyAsync<WebSocketException>(() =>
            ConnectAsync(_hub.Port, "ZZZZZZ", 1, "k1"));
    }

    static async Task<ClientWebSocket> ConnectAsync(int port, string code, long accountIdx, string sessionKey)
    {
        var ws = new ClientWebSocket();
        ws.Options.SetRequestHeader("AccountIdx", accountIdx.ToString());
        ws.Options.SetRequestHeader("SessionKey", sessionKey);
        await ws.ConnectAsync(new Uri($"ws://127.0.0.1:{port}/session/{code}"), CancellationToken.None);
        return ws;
    }

    static async Task SendAsync(ClientWebSocket ws, object message)
    {
        var json = JsonSerializer.Serialize(message,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await ws.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(json)),
            WebSocketMessageType.Text, true, CancellationToken.None);
    }

    static async Task<JsonElement> ReceiveAsync(ClientWebSocket ws)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var buffer = new byte[16 * 1024];
        using var frame = new MemoryStream();

        while (true)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), timeout.Token);
            frame.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
                return JsonDocument.Parse(Encoding.UTF8.GetString(frame.ToArray())).RootElement;
        }
    }

    static async Task<JsonElement> ReceiveUntilTypeAsync(ClientWebSocket ws, string type)
    {
        return await ReceiveUntilAsync(ws, root => root.GetProperty("type").GetString() == type);
    }

    static async Task<JsonElement> ReceiveUntilAsync(ClientWebSocket ws, Func<JsonElement, bool> predicate)
    {
        for (var attempt = 0; attempt < 16; attempt++)
        {
            var root = await ReceiveAsync(ws);
            if (predicate(root))
                return root;
        }
        throw new TimeoutException("expected message did not arrive");
    }
}
