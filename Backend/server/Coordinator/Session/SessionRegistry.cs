using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace SeoulKenshi.Coordinator.Session
{
    public enum SessionCreateError : byte
    {
        None = 0,
        HostAlreadyHosting = 1,
    }

    public sealed class RemovedMemberRecord
    {
        public RemovedMemberRecord(long sessionId, SessionMember member)
        {
            SessionId = sessionId;
            Member = member;
        }

        public long SessionId { get; }
        public SessionMember Member { get; }
    }

    /// <summary>
    /// 생존 스윕 결과. 릴레이 허브가 이 목록으로 접속자에게 알림을 보낸다.
    /// </summary>
    public sealed class SessionSweepReport
    {
        public List<MultiplayerSession> TimedOutSessions { get; } = new List<MultiplayerSession>();
        public List<RemovedMemberRecord> RemovedMembers { get; } = new List<RemovedMemberRecord>();
    }

    /// <summary>
    /// 프로세스 안 세션 목록. ADR-005: 세션은 휘발성이라 저장소에 두지 않는다.
    /// 닫힌 세션은 닫힘 후 구성원 타임아웃만큼 지나면 목록에서 치운다.
    /// </summary>
    public sealed class SessionRegistry
    {
        public const int SessionCodeLength = 6;

        /// <summary>혼동 없는 글자만 쓴다(0/O/1/I/L 제외).</summary>
        public static readonly char[] CodeAlphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ".ToCharArray();

        const int CodeRetryLimit = 50;

        readonly ConcurrentDictionary<long, MultiplayerSession> _byId =
            new ConcurrentDictionary<long, MultiplayerSession>();

        readonly ConcurrentDictionary<string, long> _byCode =
            new ConcurrentDictionary<string, long>(StringComparer.Ordinal);

        readonly ConcurrentDictionary<long, long> _openByHost =
            new ConcurrentDictionary<long, long>();

        long _nextSessionId;

        /// <summary>
        /// 세션이 마감되면(호스트 종료·타임아웃·서버 종료) 마감된 세션과 사유를 알린다.
        /// 릴레이 허브가 이 이벤트로 접속자들에게 sessionClosed를 보낸다.
        /// </summary>
        public event Action<MultiplayerSession, SessionCloseReason>? SessionClosed;

        public int OpenSessionCount
        {
            get { return _byId.Values.Count(s => s.State == SessionState.Open); }
        }

        /// <summary>호스트가 세션을 연다. 호스트는 열린 세션을 하나만 가질 수 있다.</summary>
        public bool TryCreate(long hostAccountIdx, string hostNickname, int maxGuests, DateTime now,
            out MultiplayerSession? session, out SessionCreateError error)
        {
            if (maxGuests < 0)
                throw new ArgumentOutOfRangeException(nameof(maxGuests));

            if (!_openByHost.TryAdd(hostAccountIdx, -1L))
            {
                session = null;
                error = SessionCreateError.HostAlreadyHosting;
                return false;
            }

            var sessionId = Interlocked.Increment(ref _nextSessionId);

            string? code = null;
            for (int attempt = 0; attempt < CodeRetryLimit; attempt++)
            {
                var candidate = GenerateCode();
                if (_byCode.TryAdd(candidate, sessionId))
                {
                    code = candidate;
                    break;
                }
            }

            if (code == null)
            {
                _openByHost.TryRemove(new KeyValuePair<long, long>(hostAccountIdx, -1L));
                throw new InvalidOperationException("session code space exhausted");
            }

            session = MultiplayerSession.Create(sessionId, code, hostAccountIdx, hostNickname, maxGuests, now);
            _byId[sessionId] = session;
            _openByHost[hostAccountIdx] = sessionId;
            error = SessionCreateError.None;
            return true;
        }

        public MultiplayerSession? GetByCode(string sessionCode)
        {
            if (string.IsNullOrWhiteSpace(sessionCode))
                return null;

            var normalized = NormalizeCode(sessionCode);
            if (!_byCode.TryGetValue(normalized, out var sessionId))
                return null;

            return _byId.TryGetValue(sessionId, out var session) ? session : null;
        }

        public MultiplayerSession? GetBySessionId(long sessionId)
        {
            return _byId.TryGetValue(sessionId, out var session) ? session : null;
        }

        public IReadOnlyList<MultiplayerSession> ListOpen()
        {
            return _byId.Values
                .Where(s => s.State == SessionState.Open)
                .OrderBy(s => s.SessionId)
                .ToList();
        }

        public bool TryJoin(string sessionCode, long accountIdx, string nickname, DateTime now,
            out MultiplayerSession? session, out SessionMembershipError error)
        {
            session = GetByCode(sessionCode);
            if (session == null)
            {
                error = SessionMembershipError.SessionNotFound;
                return false;
            }

            error = session.JoinGuest(accountIdx, nickname, now);
            return error == SessionMembershipError.None;
        }

        /// <summary>게스트 퇴장. 최선 노력이라 세션이 이미 닫혀도 실패로 보지 않는다.</summary>
        public SessionMembershipError Leave(long sessionId, long accountIdx)
        {
            var session = GetBySessionId(sessionId);
            if (session == null)
                return SessionMembershipError.NotMember;

            return session.RemoveMember(accountIdx);
        }

        public bool Heartbeat(long sessionId, long accountIdx, DateTime now)
        {
            var session = GetBySessionId(sessionId);
            if (session == null)
                return false;

            return session.Heartbeat(accountIdx, now);
        }

        /// <summary>호스트의 명시적 세션 종료. 이미 닫혀 있으면 성공으로 친다(멱등).</summary>
        public bool CloseByHost(long sessionId, long requesterAccountIdx, DateTime now)
        {
            var session = GetBySessionId(sessionId);
            if (session == null)
                return false;
            if (!session.IsHost(requesterAccountIdx))
                return false;

            if (session.Close(SessionCloseReason.HostClosed, now))
            {
                Unregister(session);
                RaiseClosed(session, SessionCloseReason.HostClosed);
            }
            return true;
        }

        /// <summary>서버 종료용 일괄 마감.</summary>
        public void CloseAll(SessionCloseReason reason, DateTime now)
        {
            foreach (var session in _byId.Values)
            {
                if (session.Close(reason, now))
                {
                    Unregister(session);
                    RaiseClosed(session, reason);
                }
            }
        }

        /// <summary>
        /// 생존 스윕. 호스트 무응답 세션을 닫고, 무응답 게스트를 로스터에서 뺀다.
        /// 닫힌 세션은 구성원 타임아웃만큼 지나면 목록에서 치운다.
        /// </summary>
        public SessionSweepReport Sweep(DateTime now, int hostTimeoutSeconds, int memberTimeoutSeconds)
        {
            var report = new SessionSweepReport();

            foreach (var session in _byId.Values)
            {
                if (session.State == SessionState.Closed)
                {
                    if (now >= session.ClosedAt.AddSeconds(memberTimeoutSeconds))
                        _byId.TryRemove(session.SessionId, out _);
                    continue;
                }

                if (session.HostIsSilent(now, hostTimeoutSeconds))
                {
                    if (session.Close(SessionCloseReason.HostTimeout, now))
                    {
                        Unregister(session);
                        report.TimedOutSessions.Add(session);
                        RaiseClosed(session, SessionCloseReason.HostTimeout);
                    }
                    continue;
                }

                foreach (var dropped in session.DropSilentGuests(now, memberTimeoutSeconds))
                    report.RemovedMembers.Add(new RemovedMemberRecord(session.SessionId, dropped));
            }

            return report;
        }

        void RaiseClosed(MultiplayerSession session, SessionCloseReason reason)
        {
            var handlers = SessionClosed;
            if (handlers == null)
                return;

            foreach (Action<MultiplayerSession, SessionCloseReason> handler in handlers.GetInvocationList())
            {
                try
                {
                    handler(session, reason);
                }
                catch
                {
                    // 한 구독자의 실패가 마감 흐름을 막지 않는다.
                }
            }
        }

        void Unregister(MultiplayerSession session)
        {
            _byCode.TryRemove(session.SessionCode, out _);
            if (_openByHost.TryGetValue(session.HostAccountIdx, out var hostingId) && hostingId == session.SessionId)
                _openByHost.TryRemove(session.HostAccountIdx, out _);
        }

        static string GenerateCode()
        {
            var chars = new char[SessionCodeLength];
            for (int i = 0; i < SessionCodeLength; i++)
                chars[i] = CodeAlphabet[Random.Shared.Next(CodeAlphabet.Length)];
            return new string(chars);
        }

        public static string NormalizeCode(string sessionCode)
        {
            return (sessionCode ?? string.Empty).Trim().ToUpperInvariant();
        }
    }
}
