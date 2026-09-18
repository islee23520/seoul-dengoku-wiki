using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Tests;

/// <summary>
/// 재접속으로 대체된 낡은 연결의 뒤늦은 Detach는 no-op이어야 한다(w1-detach-red 포팅).
/// 낡은 연결의 인스턴스를 넘기는 지금 시그니처에서는 살아 있는 연결이 그대로여야 GREEN이고,
/// 계정 기준 정리로 돌아가면 살아 있는 연결이 eviction 되어 RED다.
/// </summary>
public class SupersededDetachRouterTests
{
    static readonly DateTime T0 = new DateTime(2026, 9, 18, 0, 0, 0, DateTimeKind.Utc);

    sealed class FakeConnection : IRelayConnection
    {
        public FakeConnection(long accountIdx)
        {
            AccountIdx = accountIdx;
        }

        public long AccountIdx { get; }
        public ConcurrentQueue<string> Sent { get; } = new ConcurrentQueue<string>();
        public bool Closed { get; private set; }

        public bool TryEnqueue(string json)
        {
            Sent.Enqueue(json);
            return true;
        }

        public void Close()
        {
            Closed = true;
        }

        public JsonElement? NextOfType(string type)
        {
            while (Sent.TryDequeue(out var json))
            {
                var root = JsonDocument.Parse(json).RootElement;
                if (root.GetProperty("type").GetString() == type)
                    return root;
            }
            return null;
        }
    }

    static (SessionRegistry Registry, MultiplayerSession Session) NewSession()
    {
        var registry = new SessionRegistry();
        var ok = registry.TryCreate(1, "host", 4, T0, out var session, out var error);
        Assert.True(ok);
        Assert.Equal(SessionCreateError.None, error);
        return (registry, session!);
    }

    static JsonElement Payload(string json)
    {
        return JsonDocument.Parse(json).RootElement;
    }

    [Fact]
    public void SupersededDetach_guest_live_connection_stays_on_roster_and_receives_broadcast()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var staleGuest = new FakeConnection(2);
        var liveGuest = new FakeConnection(2);
        router.AttachHost(session, host, T0);
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g2", staleGuest, T0));
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g2", liveGuest, T0));
        Assert.True(staleGuest.Closed);

        // HandleSessionAsync가 낡은 소켓의 수신 루프가 끝난 뒤 하는 것과 같은 호출:
        // 낡은 연결 인스턴스 기준의 Detach다.
        router.Detach(session.SessionId, staleGuest, registry);

        Assert.True(session.HasMember(2),
            "superseded Detach must not remove the live guest from the roster");
        var delivered = router.BroadcastFromHost(session.SessionId, 1, "keep", Payload("{\"keep\":true}"));
        Assert.Equal(1, delivered);
        var relay = liveGuest.NextOfType("relay");
        Assert.NotNull(relay);
        Assert.Equal("keep", relay.Value.GetProperty("requestId").GetString());
        Assert.Null(staleGuest.NextOfType("relay"));
    }

    [Fact]
    public void SupersededDetach_host_live_connection_still_receives_guest_commands()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var staleHost = new FakeConnection(1);
        var liveHost = new FakeConnection(1);
        var guest = new FakeConnection(2);
        router.AttachHost(session, staleHost, T0);
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g2", guest, T0));
        router.AttachHost(session, liveHost, T0);
        Assert.True(staleHost.Closed);

        router.Detach(session.SessionId, staleHost, registry);

        Assert.Equal(SessionState.Open, session.State);
        Assert.True(session.HasMember(2));
        var ok = router.RelayFromGuest(session.SessionId, 2, "req-live", Payload("{\"cmd\":\"move\"}"));
        Assert.True(ok, "superseded Detach must not drop the live host connection");
        var relay = liveHost.NextOfType("relay");
        Assert.NotNull(relay);
        Assert.Equal("req-live", relay.Value.GetProperty("requestId").GetString());
        Assert.Equal("move", relay.Value.GetProperty("payload").GetProperty("cmd").GetString());
        Assert.Null(staleHost.NextOfType("relay"));
    }
}

/// <summary>
/// 같은 시나리오를 실 소켓 경로로: 재접속은 허브가 superseded로 낡은 소켓을 닫고,
/// 그 수신 루프가 끝나며 돌리는 Detach가 살아 있는 연결을 건드리지 않는다.
/// </summary>
public class SupersededDetachHubTests
{
    [Fact]
    public async Task SupersededDetach_guest_reattach_then_old_socket_Detach_keeps_live_guest()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        ClientWebSocket? hostWs = null;
        ClientWebSocket? staleGuest = null;
        ClientWebSocket? liveGuest = null;
        try
        {
            hostWs = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
            await RelayTestSockets.ReceiveUntilTypeAsync(hostWs!, RelayMessageTypes.Joined);

            staleGuest = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
                guest.SessionKey, "g");
            await RelayTestSockets.ReceiveUntilTypeAsync(staleGuest!, RelayMessageTypes.Joined);
            await RelayTestSockets.ReceiveUntilAsync(hostWs!, root =>
                root.GetProperty("type").GetString() == RelayMessageTypes.Roster
                && root.GetProperty("members").GetArrayLength() == 2);

            liveGuest = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
                guest.SessionKey, "g");
            await RelayTestSockets.ReceiveUntilTypeAsync(liveGuest!, RelayMessageTypes.Joined);

            // 낡은 게스트 소켓은 superseded 뒤 닫힌다. 그 뒤늦은 Detach가 살아 있는 게스트를
            // 로스터에서 빼지 않는다는 것이 이 테스트의 요지다.
            var superseded = await RelayTestSockets.ReceiveUntilTypeAsync(staleGuest!, RelayMessageTypes.Error);
            Assert.Equal(RelayCloseReasons.Superseded, superseded.GetProperty("message").GetString());
            await RelayTestSockets.CloseQuietlyAsync(staleGuest);

            var current = app.Registry.GetByCode(code)!;
            Assert.True(current.HasMember(guest.AccountIdx),
                "superseded Detach must not remove the live guest from the roster");
            Assert.Equal(SessionState.Open, current.State);

            await RelayTestSockets.SendAsync(hostWs,
                new { type = "broadcast", requestId = "keep", payload = new { keep = true } });
            var relay = await RelayTestSockets.ReceiveUntilTypeAsync(liveGuest!, RelayMessageTypes.Relay);
            Assert.Equal(host.AccountIdx, relay.GetProperty("fromAccountIdx").GetInt64());
            Assert.Equal("keep", relay.GetProperty("requestId").GetString());
        }
        finally
        {
            await RelayTestSockets.CloseQuietlyAsync(staleGuest);
            await RelayTestSockets.CloseQuietlyAsync(liveGuest);
            await RelayTestSockets.CloseQuietlyAsync(hostWs);
        }
    }

    [Fact]
    public async Task SupersededDetach_host_reattach_then_old_socket_Detach_keeps_live_host()
    {
        await using var app = await CoordinatorRelayTestApp.StartAsync();
        var host = app.RegisterAccount();
        var guest = app.RegisterAccount();
        Assert.True(app.Registry.TryCreate(host.AccountIdx, "host", 4, DateTime.UtcNow,
            out var session, out _));
        var code = session!.SessionCode;

        ClientWebSocket? staleHost = null;
        ClientWebSocket? liveHost = null;
        ClientWebSocket? guestWs = null;
        try
        {
            staleHost = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
            await RelayTestSockets.ReceiveUntilTypeAsync(staleHost!, RelayMessageTypes.Joined);

            guestWs = await RelayTestSockets.ConnectAsync(app.Port, code, guest.AccountIdx,
                guest.SessionKey, "g");
            await RelayTestSockets.ReceiveUntilTypeAsync(guestWs!, RelayMessageTypes.Joined);
            await RelayTestSockets.ReceiveUntilAsync(staleHost!, root =>
                root.GetProperty("type").GetString() == RelayMessageTypes.Roster
                && root.GetProperty("members").GetArrayLength() == 2);

            liveHost = await RelayTestSockets.ConnectAsync(app.Port, code, host.AccountIdx, host.SessionKey);
            await RelayTestSockets.ReceiveUntilTypeAsync(liveHost!, RelayMessageTypes.Joined);

            var superseded = await RelayTestSockets.ReceiveUntilTypeAsync(staleHost!, RelayMessageTypes.Error);
            Assert.Equal(RelayCloseReasons.Superseded, superseded.GetProperty("message").GetString());
            await RelayTestSockets.CloseQuietlyAsync(staleHost);

            var current = app.Registry.GetByCode(code)!;
            Assert.Equal(SessionState.Open, current.State);
            Assert.True(current.HasMember(guest.AccountIdx));

            await RelayTestSockets.SendAsync(guestWs,
                new { type = "command", requestId = "req-live", payload = new { cmd = "wave" } });
            var relay = await RelayTestSockets.ReceiveUntilTypeAsync(liveHost!, RelayMessageTypes.Relay);
            Assert.Equal(guest.AccountIdx, relay.GetProperty("fromAccountIdx").GetInt64());
            Assert.Equal("req-live", relay.GetProperty("requestId").GetString());
        }
        finally
        {
            await RelayTestSockets.CloseQuietlyAsync(staleHost);
            await RelayTestSockets.CloseQuietlyAsync(liveHost);
            await RelayTestSockets.CloseQuietlyAsync(guestWs);
        }
    }
}
