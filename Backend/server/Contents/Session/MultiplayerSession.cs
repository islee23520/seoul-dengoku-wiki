using System;
using System.Collections.Generic;

namespace SeoulKenshi.Contents.Session
{
    public enum SessionState : byte
    {
        Open = 0,
        Closed = 1,
    }

    public enum SessionCloseReason : byte
    {
        None = 0,
        HostClosed = 1,
        HostTimeout = 2,
        ServerShutdown = 3,
    }

    public enum SessionMemberRole : byte
    {
        Host = 0,
        Guest = 1,
    }

    /// <summary>
    /// 세션 합류·퇴장 결과. 도메인은 에러 코드를 모르고, 서비스 계층이 변환한다.
    /// </summary>
    public enum SessionMembershipError : byte
    {
        None = 0,
        SessionClosed = 1,
        SessionFull = 2,
        AlreadyMember = 3,
        HostCannotJoinAsGuest = 4,
        NotMember = 5,
        NotHost = 6,
        HostCannotBeRemoved = 7,
        SessionNotFound = 8,
    }

    public sealed class SessionMember
    {
        public SessionMember(long accountIdx, SessionMemberRole role, string nickname, DateTime now)
        {
            AccountIdx = accountIdx;
            Role = role;
            Nickname = nickname ?? string.Empty;
            JoinedAt = now;
            LastHeartbeat = now;
        }

        public long AccountIdx { get; }
        public SessionMemberRole Role { get; }
        public string Nickname { get; }
        public DateTime JoinedAt { get; }
        public DateTime LastHeartbeat { get; internal set; }
    }

    /// <summary>
    /// 호스트가 연 멀티플레이 세션. ADR-005: 세션은 휘발성이고 월드 정본은 호스트의 로컬 저장이다.
    /// 상태 변경은 인스턴스 잠금 안에서만 일어난다.
    /// </summary>
    public sealed class MultiplayerSession
    {
        readonly object _gate = new object();
        readonly List<SessionMember> _members = new List<SessionMember>();

        MultiplayerSession(long sessionId, string sessionCode, long hostAccountIdx,
            string hostNickname, int maxGuests, DateTime now)
        {
            SessionId = sessionId;
            SessionCode = sessionCode;
            HostAccountIdx = hostAccountIdx;
            MaxGuests = maxGuests;
            CreatedAt = now;
            HostLastHeartbeat = now;
            State = SessionState.Open;
            CloseReason = SessionCloseReason.None;
            _members.Add(new SessionMember(hostAccountIdx, SessionMemberRole.Host, hostNickname, now));
        }

        /// <summary>레지스트리 전용 팩터리. 세션 코드의 유일성은 레지스트리가 보증한다.</summary>
        internal static MultiplayerSession Create(long sessionId, string sessionCode, long hostAccountIdx,
            string hostNickname, int maxGuests, DateTime now)
        {
            if (maxGuests < 0)
                throw new ArgumentOutOfRangeException(nameof(maxGuests));
            return new MultiplayerSession(sessionId, sessionCode, hostAccountIdx, hostNickname, maxGuests, now);
        }

        public long SessionId { get; }
        public string SessionCode { get; }
        public long HostAccountIdx { get; }
        public int MaxGuests { get; }
        public DateTime CreatedAt { get; }
        public DateTime HostLastHeartbeat { get; private set; }
        public SessionState State { get; private set; }
        public SessionCloseReason CloseReason { get; private set; }
        public DateTime ClosedAt { get; private set; }

        public IReadOnlyList<SessionMember> Members
        {
            get
            {
                lock (_gate)
                {
                    return _members.ToArray();
                }
            }
        }

        public bool IsHost(long accountIdx)
        {
            return accountIdx == HostAccountIdx;
        }

        public bool HasMember(long accountIdx)
        {
            lock (_gate)
            {
                return FindMemberLocked(accountIdx) != null;
            }
        }

        /// <summary>세대 번호. 로스터가 바뀔 때마다 올라가고, 참가자가 변경을 감지하는 데 쓴다.</summary>
        public int RosterVersion { get; private set; }

        public SessionMembershipError JoinGuest(long accountIdx, string nickname, DateTime now)
        {
            lock (_gate)
            {
                if (State != SessionState.Open)
                    return SessionMembershipError.SessionClosed;
                if (accountIdx == HostAccountIdx)
                    return SessionMembershipError.HostCannotJoinAsGuest;
                if (FindMemberLocked(accountIdx) != null)
                    return SessionMembershipError.AlreadyMember;
                if (GuestCountLocked() >= MaxGuests)
                    return SessionMembershipError.SessionFull;

                _members.Add(new SessionMember(accountIdx, SessionMemberRole.Guest, nickname, now));
                RosterVersion++;
                return SessionMembershipError.None;
            }
        }

        public SessionMembershipError RemoveMember(long accountIdx)
        {
            lock (_gate)
            {
                var member = FindMemberLocked(accountIdx);
                if (member == null)
                    return SessionMembershipError.NotMember;
                if (member.Role == SessionMemberRole.Host)
                    return SessionMembershipError.HostCannotBeRemoved;

                _members.Remove(member);
                RosterVersion++;
                return SessionMembershipError.None;
            }
        }

        /// <summary>구성원(호스트 포함) 생존 신고. 세션이 닫혀 있으면 false.</summary>
        public bool Heartbeat(long accountIdx, DateTime now)
        {
            lock (_gate)
            {
                if (State != SessionState.Open)
                    return false;
                if (accountIdx == HostAccountIdx)
                {
                    HostLastHeartbeat = now;
                    return true;
                }
                var member = FindMemberLocked(accountIdx);
                if (member == null)
                    return false;
                member.LastHeartbeat = now;
                return true;
            }
        }

        /// <summary>마감. 호스트 요청·서버 종료·호스트 무응답만 쓸 수 있다.</summary>
        public bool Close(SessionCloseReason reason, DateTime now)
        {
            lock (_gate)
            {
                if (State == SessionState.Closed)
                    return false;
                State = SessionState.Closed;
                CloseReason = reason;
                ClosedAt = now;
                RosterVersion++;
                return true;
            }
        }

        /// <summary>무응답 게스트 정리. 제거된 구성원 목록을 돌려준다.</summary>
        public List<SessionMember> DropSilentGuests(DateTime now, int memberTimeoutSeconds)
        {
            var dropped = new List<SessionMember>();
            lock (_gate)
            {
                if (State != SessionState.Open)
                    return dropped;

                var deadline = now.AddSeconds(-memberTimeoutSeconds);
                for (int i = _members.Count - 1; i >= 0; i--)
                {
                    var member = _members[i];
                    if (member.Role == SessionMemberRole.Guest && member.LastHeartbeat < deadline)
                    {
                        _members.RemoveAt(i);
                        dropped.Add(member);
                    }
                }
                if (dropped.Count > 0)
                    RosterVersion++;
            }
            return dropped;
        }

        public bool HostIsSilent(DateTime now, int hostTimeoutSeconds)
        {
            lock (_gate)
            {
                return State == SessionState.Open
                    && HostLastHeartbeat < now.AddSeconds(-hostTimeoutSeconds);
            }
        }

        SessionMember FindMemberLocked(long accountIdx)
        {
            for (int i = 0; i < _members.Count; i++)
            {
                if (_members[i].AccountIdx == accountIdx)
                    return _members[i];
            }
            return null;
        }

        int GuestCountLocked()
        {
            var count = 0;
            for (int i = 0; i < _members.Count; i++)
            {
                if (_members[i].Role == SessionMemberRole.Guest)
                    count++;
            }
            return count;
        }
    }
}
