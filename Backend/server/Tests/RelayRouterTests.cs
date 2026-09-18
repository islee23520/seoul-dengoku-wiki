using System.Collections.Concurrent;
using System.Text.Json;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Relay;

namespace SeoulKenshi.Server.Tests;

public class RelayRouterTests
{
    private static readonly DateTime T0 = new DateTime(2026, 9, 18, 0, 0, 0, DateTimeKind.Utc);

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

        public JsonElement NextMessage()
        {
            if (!Sent.TryDequeue(out var json))
                Assert.Fail("no message enqueued");

            return JsonDocument.Parse(json).RootElement;
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

    private static (SessionRegistry Registry, MultiplayerSession Session) NewSession(
        long hostIdx = 1, int maxGuests = 4)
    {
        var registry = new SessionRegistry();
        var ok = registry.TryCreate(hostIdx, "host", maxGuests, T0, out var session, out var error);
        Assert.True(ok);
        Assert.Equal(SessionCreateError.None, error);
        return (registry, session);
    }

    private static JsonElement Payload(string json)
    {
        return JsonDocument.Parse(json).RootElement;
    }

    [Fact]
    public void Guest_command_reaches_only_the_host_with_request_id_and_raw_payload()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var guest = new FakeConnection(2);
        router.AttachHost(session, host, T0);
        router.AttachGuest(session, 2, "g2", guest, T0);

        var ok = router.RelayFromGuest(session.SessionId, 2, "req-1", Payload("{\"tick\":5,\"cmd\":\"move\"}"));

        Assert.True(ok);
        var relay = host.NextOfType("relay");
        Assert.NotNull(relay);
        Assert.Equal(2, relay.Value.GetProperty("fromAccountIdx").GetInt64());
        Assert.Equal(1, relay.Value.GetProperty("fromRole").GetInt32());
        Assert.Equal("req-1", relay.Value.GetProperty("requestId").GetString());
        Assert.Equal(5, relay.Value.GetProperty("payload").GetProperty("tick").GetInt32());
        Assert.Equal("move", relay.Value.GetProperty("payload").GetProperty("cmd").GetString());
        Assert.Null(guest.NextOfType("relay"));
        _ = registry;
    }

    [Fact]
    public void Host_broadcast_reaches_all_guests_and_non_host_is_rejected()
    {
        var (_, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var g1 = new FakeConnection(2);
        var g2 = new FakeConnection(3);
        router.AttachHost(session, host, T0);
        router.AttachGuest(session, 2, "g2", g1, T0);
        router.AttachGuest(session, 3, "g3", g2, T0);

        var delivered = router.BroadcastFromHost(session.SessionId, 1, null, Payload("{\"events\":[]}"));

        Assert.Equal(2, delivered);
        foreach (var guest in new[] { g1, g2 })
        {
            var relay = guest.NextOfType("relay");
            Assert.NotNull(relay);
            Assert.Equal(1, relay.Value.GetProperty("fromAccountIdx").GetInt64());
            Assert.Equal(0, relay.Value.GetProperty("fromRole").GetInt32());
        }

        Assert.Equal(0, router.BroadcastFromHost(session.SessionId, 2, null, Payload("{}")));
    }

    [Fact]
    public void Guest_join_and_detach_update_roster_and_registry()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var guest = new FakeConnection(2);
        router.AttachHost(session, host, T0);

        var joinError = router.AttachGuest(session, 2, "g2", guest, T0);
        Assert.Equal(SessionMembershipError.None, joinError);

        // 허브 흐름과 같다: 합류 뒤 joined를 보내고 로스터를 브로드캐스트한다.
        router.BroadcastRoster(session.SessionId);
        var roster = host.NextOfType("roster");
        Assert.NotNull(roster);
        Assert.Equal(2, roster.Value.GetProperty("members").GetArrayLength());
        Assert.True(session.HasMember(2));

        router.Detach(session.SessionId, 2, registry);

        Assert.False(session.HasMember(2));
        var after = host.NextOfType("roster");
        Assert.NotNull(after);
        Assert.Equal(1, after.Value.GetProperty("members").GetArrayLength());
    }

    [Fact]
    public void Host_detach_keeps_session_open_for_reconnect()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        router.AttachHost(session, host, T0);

        router.Detach(session.SessionId, 1, registry);

        Assert.Equal(SessionState.Open, session.State);
        Assert.True(router.HasRoom(session.SessionId));
    }

    [Fact]
    public void AttachGuest_full_session_returns_error()
    {
        var (_, session) = NewSession(maxGuests: 1);
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var g1 = new FakeConnection(2);
        var g2 = new FakeConnection(3);
        router.AttachHost(session, host, T0);
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g2", g1, T0));

        var error = router.AttachGuest(session, 3, "g3", g2, T0);

        Assert.Equal(SessionMembershipError.SessionFull, error);
        Assert.False(session.HasMember(3));
    }

    [Fact]
    public void Guest_reattach_supersedes_previous_connection()
    {
        var (_, session) = NewSession();
        var router = new RelayRouter();
        var first = new FakeConnection(2);
        var second = new FakeConnection(2);
        router.AttachGuest(session, 2, "g2", first, T0);

        var error = router.AttachGuest(session, 2, "g2", second, T0);

        Assert.Equal(SessionMembershipError.None, error);
        Assert.True(first.Closed);
        Assert.Equal("superseded", first.NextOfType("error").Value.GetProperty("message").GetString());

        var host = new FakeConnection(1);
        router.AttachHost(session, host, T0);
        router.BroadcastFromHost(session.SessionId, 1, null, Payload("{}"));
        Assert.Null(first.NextOfType("relay"));
    }

    [Fact]
    public void Relay_from_guest_without_live_host_returns_false()
    {
        var (_, session) = NewSession();
        var router = new RelayRouter();
        var guest = new FakeConnection(2);
        router.AttachGuest(session, 2, "g2", guest, T0);

        Assert.False(router.RelayFromGuest(session.SessionId, 2, "r", Payload("{}")));
    }

    [Fact]
    public void CloseRoom_notifies_everyone_and_clears_the_room()
    {
        var (_, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var guest = new FakeConnection(2);
        router.AttachHost(session, host, T0);
        router.AttachGuest(session, 2, "g2", guest, T0);

        router.CloseRoom(session.SessionId, RelayCloseReasons.HostTimeout);

        foreach (var conn in new[] { host, guest })
        {
            var closed = conn.NextOfType("sessionClosed");
            Assert.NotNull(closed);
            Assert.Equal("hostTimeout", closed.Value.GetProperty("reason").GetString());
            Assert.True(conn.Closed);
        }
        Assert.False(router.HasRoom(session.SessionId));
    }
}
