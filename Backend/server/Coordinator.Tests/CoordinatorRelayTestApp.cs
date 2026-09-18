using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeoulKenshi.Coordinator.Identity;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Tests;

/// <summary>
/// 릴레이 통합 테스트용 호스트. Program과 같은 파이프라인을 실 Kestrel 위에
/// 임시 포트(0)로 띄운다. 1219는 절대 쓰지 않는다.
/// </summary>
public sealed class CoordinatorRelayTestApp : IAsyncDisposable
{
    CoordinatorRelayTestApp(WebApplication app, int port)
    {
        App = app;
        Port = port;
        Identities = app.Services.GetRequiredService<IdentityStore>();
        Registry = app.Services.GetRequiredService<SessionRegistry>();
        Relay = app.Services.GetRequiredService<SessionRelayHub>();
    }

    public WebApplication App { get; }
    public int Port { get; }
    public IdentityStore Identities { get; }
    public SessionRegistry Registry { get; }
    public SessionRelayHub Relay { get; }

    /// <summary>
    /// configuration으로 Coordinator:* 테스트 구성(짧은 타임아웃 등)을 걸 수 있다.
    /// Options는 첫 조회 때 묶이므로 조립 전에 추가해도 같은 구성이 적용된다.
    /// </summary>
    public static async Task<CoordinatorRelayTestApp> StartAsync(
        IDictionary<string, string?>? configuration = null)
    {
        var builder = CoordinatorApp.CreateBuilder();
        builder.WebHost.ConfigureKestrel(kestrel => kestrel.ListenAnyIP(0));
        if (configuration != null)
            builder.Configuration.AddInMemoryCollection(configuration);

        // Program과 같은 파이프라인(UseWebSockets + 라우트)을 반드시 통해서 조립한다.
        var app = CoordinatorApp.Build(builder);
        await app.StartAsync();

        var addresses = app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses;
        return new CoordinatorRelayTestApp(app, ParsePort(addresses.First()));
    }

    /// <summary>테스트 계정 등록. 돌아오는 키로 WS·REST 인증을 모두 한다.</summary>
    public (long AccountIdx, string SessionKey) RegisterAccount(string? vid = null)
    {
        vid ??= $"relay-{Guid.NewGuid():N}";
        Assert.True(Identities.TryRegister(vid, out var accountIdx, out var sessionKey));
        return (accountIdx, sessionKey);
    }

    static int ParsePort(string address)
    {
        var colon = address.LastIndexOf(':');
        if (colon < 0 || colon + 1 >= address.Length)
            throw new InvalidOperationException($"cannot parse relay address: {address}");

        var portText = address.Substring(colon + 1).TrimEnd('/');
        return int.Parse(portText);
    }

    public async ValueTask DisposeAsync()
    {
        await App.StopAsync();
        await App.DisposeAsync();
    }
}

/// <summary>릴레이 WS 테스트 공용 클라이언트 유틸. 대기는 전부 메시지 폴링(timeout)이다.</summary>
public static class RelayTestSockets
{
    public static async Task<ClientWebSocket> ConnectAsync(int port, string code, long accountIdx,
        string sessionKey, string? nickname = null)
    {
        var ws = new ClientWebSocket();
        ws.Options.SetRequestHeader("AccountIdx", accountIdx.ToString());
        ws.Options.SetRequestHeader("SessionKey", sessionKey);
        if (!string.IsNullOrEmpty(nickname))
            ws.Options.SetRequestHeader("Nickname", nickname);
        await ws.ConnectAsync(new Uri($"ws://127.0.0.1:{port}/sessions/{code}"), CancellationToken.None);
        return ws;
    }

    /// <summary>헤더를 못 쓰는 클라이언트용: 신원을 쿼리로 건넨다(업그레이드 전 인증 대상).</summary>
    public static async Task<ClientWebSocket> ConnectViaQueryAsync(int port, string code, long accountIdx,
        string sessionKey)
    {
        var ws = new ClientWebSocket();
        var query = $"accountIdx={accountIdx}&sessionKey={Uri.EscapeDataString(sessionKey)}";
        await ws.ConnectAsync(new Uri($"ws://127.0.0.1:{port}/sessions/{code}?{query}"), CancellationToken.None);
        return ws;
    }

    public static async Task SendAsync(ClientWebSocket ws, object message,
        CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(message,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await ws.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(json)),
            WebSocketMessageType.Text, true, cancellationToken);
    }

    public static async Task<JsonElement> ReceiveAsync(ClientWebSocket ws)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var buffer = new byte[16 * 1024];
        using var frame = new MemoryStream();

        while (true)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), timeout.Token);
            if (result.MessageType == WebSocketMessageType.Close)
                throw new TimeoutException("socket closed before expected message");

            frame.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
            {
                using var document = JsonDocument.Parse(Encoding.UTF8.GetString(frame.ToArray()));
                return document.RootElement.Clone();
            }
        }
    }

    public static async Task<JsonElement> ReceiveUntilTypeAsync(ClientWebSocket ws, string type)
    {
        return await ReceiveUntilAsync(ws, root => root.GetProperty("type").GetString() == type);
    }

    public static async Task<JsonElement> ReceiveUntilAsync(ClientWebSocket ws, Func<JsonElement, bool> predicate)
    {
        for (var attempt = 0; attempt < 16; attempt++)
        {
            var root = await ReceiveAsync(ws);
            if (predicate(root))
                return root;
        }
        throw new TimeoutException("expected message did not arrive");
    }

    /// <summary>상대의 close 핸드셰이크(또는 정리 중단)를 기다린다. 소켓이 닫히면 true.</summary>
    public static async Task<bool> WaitCloseAsync(ClientWebSocket ws, TimeSpan timeout)
    {
        using var timeoutCts = new CancellationTokenSource(timeout);
        var buffer = new byte[1024];

        try
        {
            while (true)
            {
                var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), timeoutCts.Token);
                if (result.MessageType == WebSocketMessageType.Close)
                    return true;
            }
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
        {
            // 정상 핸드셰이크 대신 서버가 소켓을 정리(abort)했을 수도 있다.
            var state = ws.State;
            return state == WebSocketState.Closed || state == WebSocketState.CloseSent
                || state == WebSocketState.Aborted;
        }
    }

    public static async Task CloseQuietlyAsync(ClientWebSocket? ws)
    {
        if (ws == null)
            return;
        if (ws.State != WebSocketState.Open && ws.State != WebSocketState.CloseReceived)
            return;

        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "stale", timeout.Token);
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException or InvalidOperationException)
        {
            // 재접속이 이미 이전 소켓을 닫았다.
        }
    }
}

/// <summary>
/// 릴레이 엔드투엔드 흐름(ADR-005 v1). 실 Kestrel 임시 포트 위에서 합류·명령 중계·
/// 브로드캐스트·호스트 재접속·REST 마감·인증 실패·정원 초과를 검증한다.
/// 대기는 전부 메시지 폴링이고 Thread.Sleep은 쓰지 않는다.
/// </summary>
public sealed class CoordinatorRelayFlowTests
{
    [Fact]
    public async Task Join_host_and_guest_receive_joined_and_roster_updates()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out var createError));
        Assert.Equal(SessionCreateError.None, createError);
        var code = session!.SessionCode;

        using var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
        var hostJoined = await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);
        Assert.Equal((int)SessionMemberRole.Host, hostJoined.GetProperty("role").GetInt32());
        Assert.Equal(session.SessionId, hostJoined.GetProperty("sessionId").GetInt64());

        using var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
            guest.SessionKey, "g1");
        var guestJoined = await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);
        Assert.Equal((int)SessionMemberRole.Guest, guestJoined.GetProperty("role").GetInt32());
        Assert.Equal(2, guestJoined.GetProperty("members").GetArrayLength());

        var hostRoster = await RelayTestSockets.ReceiveUntilAsync(hostWs, root =>
            root.GetProperty("type").GetString() == RelayMessageTypes.Roster
            && root.GetProperty("members").GetArrayLength() == 2);
        Assert.Equal(session.SessionId, hostRoster.GetProperty("sessionId").GetInt64());
    }

    [Fact]
    public async Task Guest_command_reaches_host_with_requestId_and_payload_intact()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var (hostWs, guestWs, _, guest, _) = await ConnectHostAndGuestAsync(app, maxGuests: 4);

        await RelayTestSockets.SendAsync(guestWs,
            new { type = "command", requestId = "cmd-1", payload = new { cmd = "move", x = 3 } });

        var relay = await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Relay);
        Assert.Equal(guest.AccountIdx, relay.GetProperty("fromAccountIdx").GetInt64());
        Assert.Equal((int)SessionMemberRole.Guest, relay.GetProperty("fromRole").GetInt32());
        Assert.Equal("cmd-1", relay.GetProperty("requestId").GetString());
        Assert.Equal("move", relay.GetProperty("payload").GetProperty("cmd").GetString());
        Assert.Equal(3, relay.GetProperty("payload").GetProperty("x").GetInt32());
    }

    [Fact]
    public async Task Host_broadcast_reaches_guests_with_requestId_and_payload_intact()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var (hostWs, guestWs, host, _, _) = await ConnectHostAndGuestAsync(app, maxGuests: 4);

        await RelayTestSockets.SendAsync(hostWs,
            new { type = "broadcast", requestId = "tick-7", payload = new { tick = 7, entities = new[] { 1, 2 } } });

        var relay = await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Relay);
        Assert.Equal(host.AccountIdx, relay.GetProperty("fromAccountIdx").GetInt64());
        Assert.Equal((int)SessionMemberRole.Host, relay.GetProperty("fromRole").GetInt32());
        Assert.Equal("tick-7", relay.GetProperty("requestId").GetString());
        Assert.Equal(7, relay.GetProperty("payload").GetProperty("tick").GetInt32());
        Assert.Equal(2, relay.GetProperty("payload").GetProperty("entities").GetArrayLength());
    }

    [Fact]
    public async Task Host_reconnect_superseded_socket_detach_is_noop_and_commands_still_delivered()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        using var staleHost = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(staleHost, RelayMessageTypes.Joined);

        using var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
            guest.SessionKey, "g1");
        await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);

        // 같은 호스트 계정이 새 소켓으로 재접속한다. 낡은 소켓은 superseded 뒤 닫힌다.
        using var liveHost = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(liveHost, RelayMessageTypes.Joined);

        var superseded = await RelayTestSockets.ReceiveUntilTypeAsync(staleHost, RelayMessageTypes.Error);
        Assert.Equal(RelayCloseReasons.Superseded, superseded.GetProperty("message").GetString());
        await RelayTestSockets.CloseQuietlyAsync(staleHost);

        // 낡은 소켓의 수신 루프가 끝나며 Detach가 불려도 살아 있는 호스트와 세션은 그대로다.
        var current = app.Registry.GetByCode(code)!;
        Assert.Equal(SessionState.Open, current.State);
        Assert.True(current.HasMember(guest.AccountIdx));

        await RelayTestSockets.SendAsync(guestWs,
            new { type = "command", requestId = "after-reconnect", payload = new { cmd = "ping" } });
        var relay = await RelayTestSockets.ReceiveUntilTypeAsync(liveHost, RelayMessageTypes.Relay);
        Assert.Equal("after-reconnect", relay.GetProperty("requestId").GetString());
        Assert.Equal(guest.AccountIdx, relay.GetProperty("fromAccountIdx").GetInt64());
    }

    [Fact]
    public async Task Rest_close_pushes_sessionClosed_hostClosed_frame_to_connected_sockets()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var (hostWs, guestWs, host, _, code) = await ConnectHostAndGuestAsync(app, maxGuests: 4);

        using var http = new HttpClient();
        using var request = new HttpRequestMessage(HttpMethod.Post,
            $"http://127.0.0.1:{app.Port}/sessions/{code}/close");
        request.Headers.Add("AccountIdx", host.AccountIdx.ToString());
        request.Headers.Add("SessionKey", host.SessionKey);
        using var response = await http.SendAsync(request);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var guestClosed = await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.SessionClosed);
        Assert.Equal(RelayCloseReasons.HostClosed, guestClosed.GetProperty("reason").GetString());
        var hostClosed = await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.SessionClosed);
        Assert.Equal(RelayCloseReasons.HostClosed, hostClosed.GetProperty("reason").GetString());
    }

    [Fact]
    public async Task Bad_sessionKey_is_rejected_with_401_before_upgrade()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        // 헤더로 건넨 잘못된 키도, 쿼리로 건넨 잘못된 키도 업그레이드 전에 401이다.
        // ClientWebSocket 예외 체인은 구현 상세라서, 핸드셰이크 응답 코드를 직접 본다.
        var headerStatus = await HandshakeStatusAsync(app.Port, code, host.AccountIdx, "wrong-key",
            viaQuery: false);
        Assert.Equal(HttpStatusCode.Unauthorized, headerStatus);

        var queryStatus = await HandshakeStatusAsync(app.Port, code, host.AccountIdx, "wrong-key",
            viaQuery: true);
        Assert.Equal(HttpStatusCode.Unauthorized, queryStatus);
    }

    static async Task<HttpStatusCode> HandshakeStatusAsync(int port, string code, long accountIdx,
        string sessionKey, bool viaQuery)
    {
        var uri = viaQuery
            ? $"http://127.0.0.1:{port}/sessions/{code}?accountIdx={accountIdx}&sessionKey={Uri.EscapeDataString(sessionKey)}"
            : $"http://127.0.0.1:{port}/sessions/{code}";
        using var http = new HttpClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        if (!viaQuery)
        {
            request.Headers.Add("AccountIdx", accountIdx.ToString());
            request.Headers.Add("SessionKey", sessionKey);
        }
        request.Headers.Add("Connection", "Upgrade");
        request.Headers.TryAddWithoutValidation("Upgrade", "websocket");
        request.Headers.Add("Sec-WebSocket-Key", Convert.ToBase64String("0123456789abcdef"u8.ToArray()));
        request.Headers.Add("Sec-WebSocket-Version", "13");
        using var response = await http.SendAsync(request);
        return response.StatusCode;
    }

    [Fact]
    public async Task Full_session_join_gets_JoinFailed_error_frame()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        var first = app.RegisterAccount();
        var second = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", maxGuests: 1, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        using var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);
        using var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, first.AccountIdx,
            first.SessionKey, "g1");
        await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);

        using var overflow = await RelayTestSockets.ConnectAsync(app.Port, code, second.AccountIdx,
            second.SessionKey, "g2");
        var failure = await RelayTestSockets.ReceiveUntilTypeAsync(overflow, RelayMessageTypes.Error);
        Assert.Equal(RelayErrorCodes.JoinFailed, failure.GetProperty("code").GetInt32());
        Assert.Equal(nameof(SessionMembershipError.SessionFull), failure.GetProperty("message").GetString());

        // 정원 초과자는 로스터에 못 들어간다.
        Assert.False(app.Registry.GetByCode(code)!.HasMember(second.AccountIdx));
    }

    static async Task<(ClientWebSocket HostWs, ClientWebSocket GuestWs,
        (long AccountIdx, string SessionKey) Host, (long AccountIdx, string SessionKey) Guest, string Code)>
        ConnectHostAndGuestAsync(CoordinatorRelayTestApp app, int maxGuests)
    {
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", maxGuests, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
        try
        {
            await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);
            var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
                guest.SessionKey, "g1");
            await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);
            return (hostWs, guestWs, host, guest, code);
        }
        catch
        {
            hostWs.Dispose();
            throw;
        }
    }
}
