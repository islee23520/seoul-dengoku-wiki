using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Tests;

public class SessionDomainTests
{
    private static readonly DateTime T0 = new DateTime(2026, 9, 18, 0, 0, 0, DateTimeKind.Utc);

    private static MultiplayerSession CreateSession(SessionRegistry registry, long hostIdx = 100,
        int maxGuests = 2, string nickname = "host")
    {
        var ok = registry.TryCreate(hostIdx, nickname, maxGuests, T0, out var session, out var error);
        Assert.True(ok);
        Assert.Equal(SessionCreateError.None, error);
        return session;
    }

    [Fact]
    public void TryCreate_makes_host_a_member_and_six_char_code_from_safe_alphabet()
    {
        var registry = new SessionRegistry();

        var session = CreateSession(registry);

        Assert.Equal(SessionState.Open, session.State);
        Assert.Equal(100, session.HostAccountIdx);
        Assert.True(session.IsHost(100));
        var host = Assert.Single(session.Members);
        Assert.Equal(SessionMemberRole.Host, host.Role);
        Assert.Equal("host", host.Nickname);

        Assert.Equal(SessionRegistry.SessionCodeLength, session.SessionCode.Length);
        Assert.All(session.SessionCode, ch => Assert.Contains(ch, SessionRegistry.CodeAlphabet));
    }

    [Fact]
    public void TryCreate_rejects_second_open_session_from_same_host()
    {
        var registry = new SessionRegistry();
        CreateSession(registry, hostIdx: 100);

        var ok = registry.TryCreate(100, "host", 2, T0, out var second, out var error);

        Assert.False(ok);
        Assert.Null(second);
        Assert.Equal(SessionCreateError.HostAlreadyHosting, error);
    }

    [Fact]
    public void Host_can_open_again_after_previous_session_closes()
    {
        var registry = new SessionRegistry();
        var first = CreateSession(registry, hostIdx: 100);

        Assert.True(registry.CloseByHost(first.SessionId, 100, T0.AddMinutes(1)));
        var ok = registry.TryCreate(100, "host", 2, T0.AddMinutes(2), out var second, out var error);

        Assert.True(ok);
        Assert.Equal(SessionCreateError.None, error);
        Assert.NotEqual(first.SessionCode, second.SessionCode);
    }

    [Fact]
    public void TryJoin_adds_guest_and_ignores_code_case_and_whitespace()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);
        var versionBefore = session.RosterVersion;

        var ok = registry.TryJoin(" " + session.SessionCode.ToLowerInvariant() + " ",
            200, "guest", T0.AddSeconds(1), out var joined, out var error);

        Assert.True(ok);
        Assert.Equal(SessionMembershipError.None, error);
        Assert.Same(session, joined);
        Assert.Equal(2, session.Members.Count);
        Assert.Equal(versionBefore + 1, session.RosterVersion);
        Assert.Contains(session.Members, m => m.AccountIdx == 200 && m.Role == SessionMemberRole.Guest);
    }

    [Fact]
    public void TryJoin_unknown_code_reports_session_not_found()
    {
        var registry = new SessionRegistry();

        var ok = registry.TryJoin("ZZZZZZ", 200, "guest", T0, out var session, out var error);

        Assert.False(ok);
        Assert.Null(session);
        Assert.Equal(SessionMembershipError.SessionNotFound, error);
    }

    [Fact]
    public void TryJoin_enforces_capacity_and_duplicate_and_host_rules()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry, hostIdx: 100, maxGuests: 1);

        Assert.True(registry.TryJoin(session.SessionCode, 200, "a", T0, out _, out var first));
        Assert.Equal(SessionMembershipError.SessionFull,
            JoinError(registry, session, 300));
        Assert.Equal(SessionMembershipError.AlreadyMember,
            JoinError(registry, session, 200));
        Assert.Equal(SessionMembershipError.HostCannotJoinAsGuest,
            JoinError(registry, session, 100));
    }

    private static SessionMembershipError JoinError(SessionRegistry registry, MultiplayerSession session, long guestIdx)
    {
        var ok = registry.TryJoin(session.SessionCode, guestIdx, "g", T0, out _, out var error);
        Assert.False(ok);
        return error;
    }

    [Fact]
    public void TryJoin_closed_session_is_rejected()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);
        registry.CloseByHost(session.SessionId, 100, T0.AddSeconds(1));

        Assert.Null(registry.GetByCode(session.SessionCode));
        Assert.Equal(SessionMembershipError.SessionNotFound,
            JoinError(registry, session, 200));
    }

    [Fact]
    public void Leave_removes_guest_and_rejoin_is_allowed()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry, hostIdx: 100, maxGuests: 1);
        registry.TryJoin(session.SessionCode, 200, "a", T0, out _, out _);

        Assert.Equal(SessionMembershipError.None, registry.Leave(session.SessionId, 200));
        Assert.False(session.HasMember(200));

        var ok = registry.TryJoin(session.SessionCode, 200, "a", T0.AddSeconds(1), out _, out var error);
        Assert.True(ok);
        Assert.Equal(SessionMembershipError.None, error);
    }

    [Fact]
    public void Leave_cannot_remove_host()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry, hostIdx: 100);

        Assert.Equal(SessionMembershipError.HostCannotBeRemoved, registry.Leave(session.SessionId, 100));
    }

    [Fact]
    public void CloseByHost_is_host_only_and_idempotent()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry, hostIdx: 100);

        Assert.False(registry.CloseByHost(session.SessionId, 999, T0));
        Assert.Equal(SessionState.Open, session.State);

        Assert.True(registry.CloseByHost(session.SessionId, 100, T0));
        Assert.Equal(SessionState.Closed, session.State);
        Assert.Equal(SessionCloseReason.HostClosed, session.CloseReason);
        Assert.Equal(T0, session.ClosedAt);

        Assert.True(registry.CloseByHost(session.SessionId, 100, T0.AddSeconds(1)));
    }

    [Fact]
    public void Sweep_closes_session_when_host_goes_silent()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);
        registry.TryJoin(session.SessionCode, 200, "a", T0.AddSeconds(1), out _, out _);

        var report = registry.Sweep(T0.AddSeconds(31), hostTimeoutSeconds: 30, memberTimeoutSeconds: 30);

        Assert.Equal(SessionState.Closed, session.State);
        Assert.Equal(SessionCloseReason.HostTimeout, session.CloseReason);
        Assert.Same(session, Assert.Single(report.TimedOutSessions));
        Assert.Null(registry.GetByCode(session.SessionCode));
    }

    [Fact]
    public void Sweep_keeps_session_alive_while_host_heartbeats_and_drops_silent_guests()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);
        registry.TryJoin(session.SessionCode, 200, "keep", T0, out _, out _);
        registry.TryJoin(session.SessionCode, 300, "drop", T0, out _, out _);

        var now = T0.AddSeconds(40);
        Assert.True(registry.Heartbeat(session.SessionId, 100, now));
        Assert.True(registry.Heartbeat(session.SessionId, 200, now));

        var report = registry.Sweep(now.AddSeconds(1), hostTimeoutSeconds: 30, memberTimeoutSeconds: 30);

        Assert.Empty(report.TimedOutSessions);
        Assert.Equal(SessionState.Open, session.State);
        var removed = Assert.Single(report.RemovedMembers);
        Assert.Equal(300, removed.Member.AccountIdx);
        Assert.Equal(session.SessionId, removed.SessionId);
        Assert.True(session.HasMember(200));
        Assert.False(session.HasMember(300));
    }

    [Fact]
    public void Heartbeat_of_unknown_member_or_session_fails()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);

        Assert.False(registry.Heartbeat(session.SessionId, 999, T0));
        Assert.False(registry.Heartbeat(-1, 100, T0));
    }

    [Fact]
    public void Sweep_removes_closed_session_after_member_timeout()
    {
        var registry = new SessionRegistry();
        var session = CreateSession(registry);
        registry.CloseByHost(session.SessionId, 100, T0);

        registry.Sweep(T0.AddSeconds(10), hostTimeoutSeconds: 30, memberTimeoutSeconds: 30);
        Assert.NotNull(registry.GetBySessionId(session.SessionId));

        registry.Sweep(T0.AddSeconds(31), hostTimeoutSeconds: 30, memberTimeoutSeconds: 30);
        Assert.Null(registry.GetBySessionId(session.SessionId));
    }

    [Fact]
    public void CloseAll_marks_open_sessions_server_shutdown()
    {
        var registry = new SessionRegistry();
        var a = CreateSession(registry, hostIdx: 100);
        var b = CreateSession(registry, hostIdx: 101);

        registry.CloseAll(SessionCloseReason.ServerShutdown, T0.AddMinutes(1));

        Assert.Equal(SessionCloseReason.ServerShutdown, a.CloseReason);
        Assert.Equal(SessionCloseReason.ServerShutdown, b.CloseReason);
        Assert.Equal(0, registry.OpenSessionCount);
    }

    [Fact]
    public void SessionClosed_event_fires_for_every_close_path()
    {
        var registry = new SessionRegistry();
        var observed = new List<(long sessionId, SessionCloseReason reason)>();
        registry.SessionClosed += (session, reason) => observed.Add((session.SessionId, reason));

        var byHost = CreateSession(registry, hostIdx: 100);
        var swept = CreateSession(registry, hostIdx: 101);
        var all = CreateSession(registry, hostIdx: 102);

        registry.CloseByHost(byHost.SessionId, 100, T0);
        registry.Heartbeat(all.SessionId, 102, T0.AddSeconds(5));
        registry.Sweep(T0.AddSeconds(31), hostTimeoutSeconds: 30, memberTimeoutSeconds: 30);
        registry.CloseAll(SessionCloseReason.ServerShutdown, T0.AddMinutes(1));

        Assert.Contains((byHost.SessionId, SessionCloseReason.HostClosed), observed);
        Assert.Contains((swept.SessionId, SessionCloseReason.HostTimeout), observed);
        Assert.Contains((all.SessionId, SessionCloseReason.ServerShutdown), observed);
    }

    [Fact]
    public void ListOpen_orders_by_session_id_and_excludes_closed()
    {
        var registry = new SessionRegistry();
        var a = CreateSession(registry, hostIdx: 100);
        var b = CreateSession(registry, hostIdx: 101);
        registry.CloseByHost(a.SessionId, 100, T0);

        var open = registry.ListOpen();

        Assert.Equal(new[] { b }, open);
    }
}
