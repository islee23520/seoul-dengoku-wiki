using System;
using System.Collections.Concurrent;
using System.Text.Json;
using SeoulKenshi.Coordinator.Relay;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Tests;

/// <summary>
/// 스윕 정리와 재접속의 경합 가드. registry.Sweep이 무응답 게스트를 로스터에서 뺀 뒤
/// 연결을 닫기 전에 같은 계정이 재접속하면, 스윕 정리는 새 연결을 건드리지 않아야 한다.
/// RemoveGuestConnection이 계정만 보고 닫으면(인스턴스 비교 없으면) 살아 있는 새 연결이
/// 죽는다. SessionLivenessSweep.SweepOnce와 같은 순서(스냅샷 → Sweep → Remove)를 그대로
/// 재현해 검증한다.
/// </summary>
public class SweepRejoinGuardTests
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

        public JsonElement? LastOfType(string type)
        {
            JsonElement? found = null;
            while (Sent.TryDequeue(out var json))
            {
                var root = JsonDocument.Parse(json).RootElement;
                if (root.GetProperty("type").GetString() == type)
                    found = root;
            }
            return found;
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

    [Fact]
    public void Sweep_remove_after_rejoin_skips_new_connection()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var oldGuest = new FakeConnection(2);
        var newGuest = new FakeConnection(2);
        router.AttachHost(session, host, T0);
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g", oldGuest, T0));

        // 스윕 틱: 판단 시점 스냅샷을 찍고 게스트가 로스터에서 빠진다(구성원 타임아웃 1초 가정).
        var guests = router.SnapshotGuests();
        var report = registry.Sweep(T0.AddSeconds(2), hostTimeoutSeconds: 30, memberTimeoutSeconds: 1);
        Assert.Single(report.RemovedMembers);
        Assert.False(session.HasMember(2));

        // 판단과 정리 사이에 게스트가 새 하트비트로 재접속한다. 로스터도 돌아온다.
        Assert.Equal(SessionMembershipError.None,
            router.AttachGuest(session, 2, "g", newGuest, T0.AddSeconds(2)));
        Assert.True(session.HasMember(2));

        // 스윕 정리가 스냅샷(낡은 인스턴스)을 넘겨도 새 연결은 그대로여야 한다.
        var removed = router.RemoveGuestConnection(session.SessionId, 2, guests[(session.SessionId, 2)]);
        Assert.False(removed);
        Assert.False(newGuest.Closed);
        Assert.True(session.HasMember(2));

        // 살아 남은 재접속 연결로 릴레이가 계쏙 흐른다.
        Assert.True(router.RelayFromGuest(session.SessionId, 2, "after-rejoin", null));
        var relay = host.LastOfType(RelayMessageTypes.Relay);
        Assert.Equal("after-rejoin", relay!.Value.GetProperty("requestId").GetString());
    }

    [Fact]
    public void Sweep_remove_without_rejoin_closes_connection_and_broadcasts_roster()
    {
        var (registry, session) = NewSession();
        var router = new RelayRouter();
        var host = new FakeConnection(1);
        var guest = new FakeConnection(2);
        router.AttachHost(session, host, T0);
        Assert.Equal(SessionMembershipError.None, router.AttachGuest(session, 2, "g", guest, T0));

        var guests = router.SnapshotGuests();
        var report = registry.Sweep(T0.AddSeconds(2), hostTimeoutSeconds: 30, memberTimeoutSeconds: 1);
        Assert.Single(report.RemovedMembers);

        // 재접속이 없으면 스냅샷 연결을 닫고 로스터를 다시 뿌린다.
        var removed = router.RemoveGuestConnection(session.SessionId, 2, guests[(session.SessionId, 2)]);
        Assert.True(removed);
        Assert.True(guest.Closed);
        Assert.False(session.HasMember(2));

        var roster = host.LastOfType(RelayMessageTypes.Roster);
        Assert.NotNull(roster);
        Assert.Equal(1, roster!.Value.GetProperty("members").GetArrayLength());
    }
}
