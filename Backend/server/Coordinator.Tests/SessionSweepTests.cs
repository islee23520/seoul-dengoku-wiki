using System.Net;
using System.Net.WebSockets;
using Microsoft.Extensions.DependencyInjection;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Tests;

/// <summary>
/// 세션 생존 스윕 통합 테스트(호스티드 SessionLivenessSweep). 실 Kestrel 임시 포트 위에서
/// 짧은 타임아웃(호스트·구성원 1초)과 빠른 스윕 간격(0.25초)을 테스트 구성으로 걸어 돌린다.
/// 대기는 전부 메시지·이벤트 폴링이다(Thread.Sleep 없음).
/// </summary>
public sealed class SessionSweepTests
{
    static readonly Dictionary<string, string?> ShortSweepConfig =
        new Dictionary<string, string?>
        {
            ["Coordinator:SessionHostTimeoutSeconds"] = "1",
            ["Coordinator:SessionMemberTimeoutSeconds"] = "1",
            ["Coordinator:SweepIntervalSeconds"] = "0.25",
        };

    [Fact]
    public async Task Silent_host_sweep_closes_session_and_notifies_guest_with_hostTimeout()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync(ShortSweepConfig);
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        using var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx,
            host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);

        using var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
            guest.SessionKey, "g1");
        await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);

        // 호스트는 소켓을 열어 둔 채 하트비트를 멈춘다. 스윕이 세션을 닫을 때까지 기다린다.
        var closed = await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.SessionClosed);
        Assert.Equal(RelayCloseReasons.HostTimeout, closed.GetProperty("reason").GetString());

        // sessionClosed 프레임 뒤에 소켓이 닫힌다.
        Assert.True(await RelayTestSockets.WaitCloseAsync(guestWs, TimeSpan.FromSeconds(10)));

        // 세션은 코드 목록에서 내려간다.
        Assert.Null(app.Registry.GetByCode(code));
        Assert.Equal(HttpStatusCode.NotFound, await GetSessionStatusAsync(app.Port, code, host));
    }

    [Fact]
    public async Task Silent_guest_is_dropped_from_roster_while_host_keeps_session_open()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync(ShortSweepConfig);
        var host = app.RegisterAccount();
        var silentGuest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        using var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx,
            host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);
        // 합류 직후 로스터(구성원 1)를 소비해 둔다. 뒤의 구성원 1 로스터는 스윕 결과만 남는다.
        var initialRoster = await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Roster);
        Assert.Equal(1, initialRoster.GetProperty("members").GetArrayLength());

        using var guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, silentGuest.AccountIdx,
            silentGuest.SessionKey, "quiet");
        await RelayTestSockets.ReceiveUntilTypeAsync(guestWs, RelayMessageTypes.Joined);

        // 호스트는 계속 하트비트하고, 게스트는 조용히 있는다.
        using var heartbeatCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var heartbeats = HeartbeatUntilCancelledAsync(hostWs, heartbeatCts.Token);

        var roster = await RelayTestSockets.ReceiveUntilAsync(hostWs, root =>
            root.GetProperty("type").GetString() == RelayMessageTypes.Roster
            && root.GetProperty("members").GetArrayLength() == 1);
        Assert.Equal(session.SessionId, roster.GetProperty("sessionId").GetInt64());

        // 남은 틱에서도 세션은 열려 있어야 한다(스윕이 남긴 세션을 닫지 않는다).
        await WaitForSweepTicksAsync(app.App.Services.GetRequiredService<SessionLivenessSweep>(),
            ticks: 1, TimeSpan.FromSeconds(10));

        heartbeatCts.Cancel();
        await heartbeats;

        var current = app.Registry.GetByCode(code);
        Assert.NotNull(current);
        Assert.Equal(SessionState.Open, current!.State);
        Assert.True(current.HasMember(host.AccountIdx));
        Assert.False(current.HasMember(silentGuest.AccountIdx));
        Assert.Equal(HttpStatusCode.OK, await GetSessionStatusAsync(app.Port, code, host));

        // 무응답 게스트의 소켓도 스윕이 닫는다.
        Assert.True(await RelayTestSockets.WaitCloseAsync(guestWs, TimeSpan.FromSeconds(10)));
    }

    [Fact]
    public async Task Heartbeating_host_survives_multiple_sweep_ticks()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync(ShortSweepConfig);
        var host = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        using var hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx,
            host.SessionKey);
        await RelayTestSockets.ReceiveUntilTypeAsync(hostWs, RelayMessageTypes.Joined);
        var heartbeatAtStart = session.HostLastHeartbeat;

        // 3번의 스윕 틱(1초 타임아웃 안을 여러 번 가로지름)까지 하트비트가 세션을 살린다.
        using var heartbeatCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var heartbeats = HeartbeatUntilCancelledAsync(hostWs, heartbeatCts.Token);
        await WaitForSweepTicksAsync(app.App.Services.GetRequiredService<SessionLivenessSweep>(),
            ticks: 3, TimeSpan.FromSeconds(10));

        heartbeatCts.Cancel();
        await heartbeats;

        var current = app.Registry.GetByCode(code);
        Assert.NotNull(current);
        Assert.Equal(SessionState.Open, current!.State);
        Assert.True(current.HostLastHeartbeat > heartbeatAtStart);
        Assert.Equal(HttpStatusCode.OK, await GetSessionStatusAsync(app.Port, code, host));
    }

    /// <summary>취소될 때까지 0.2초 간격으로 하트비트를 보낸다. 끊긴 소켓 뒤처리는 조용히 묻는다.</summary>
    static async Task HeartbeatUntilCancelledAsync(ClientWebSocket ws, CancellationToken token)
    {
        try
        {
            while (!token.IsCancellationRequested)
            {
                await RelayTestSockets.SendAsync(ws, new { type = RelayMessageTypes.Heartbeat }, token);
                await Task.Delay(TimeSpan.FromMilliseconds(200), token);
            }
        }
        catch (OperationCanceledException)
        {
            // 정상 종료 신호다.
        }
        catch (Exception) when (token.IsCancellationRequested)
        {
            // 취소 뒤의 소켓 정리 경합이다. 이미 대기는 끝났다.
        }
    }

    static async Task WaitForSweepTicksAsync(SessionLivenessSweep sweep, int ticks, TimeSpan timeout)
    {
        var remaining = ticks;
        var completed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        void OnTick()
        {
            if (Interlocked.Decrement(ref remaining) == 0)
                completed.TrySetResult();
        }

        sweep.SweepTicked += OnTick;
        try
        {
            await completed.Task.WaitAsync(timeout);
        }
        finally
        {
            sweep.SweepTicked -= OnTick;
        }
    }

    static async Task<HttpStatusCode> GetSessionStatusAsync(int port, string code,
        (long AccountIdx, string SessionKey) identity)
    {
        using var http = new HttpClient();
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"http://127.0.0.1:{port}/sessions/{code}");
        request.Headers.Add("AccountIdx", identity.AccountIdx.ToString());
        request.Headers.Add("SessionKey", identity.SessionKey);
        using var response = await http.SendAsync(request);
        return response.StatusCode;
    }
}
