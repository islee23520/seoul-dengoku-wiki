using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text.Json;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Relay
{
    /// <summary>
    /// 릴레이 송신 추상화. 구현은 비차단이어야 한다(큐 적재).
    /// TryEnqueue는 연결이 이미 닫혔으면 false를 돌려준다.
    /// </summary>
    public interface IRelayConnection
    {
        long AccountIdx { get; }

        bool TryEnqueue(string json);

        void Close();
    }

    /// <summary>
    /// 세션별 방 관리와 메시지 경로. ADR-005: 게임 명령의 의미를 읽지 않고
    /// 라우팅에 필요한 필드(보낸이·requestId·payload 원문)만 다룬다.
    /// </summary>
    public sealed class RelayRouter
    {
        sealed class Room
        {
            public readonly object Gate = new object();
            public readonly MultiplayerSession Session;
            public readonly Dictionary<long, IRelayConnection> Guests =
                new Dictionary<long, IRelayConnection>();
            public IRelayConnection Host;

            public Room(MultiplayerSession session)
            {
                Session = session;
            }

            public List<IRelayConnection> AllConnections()
            {
                lock (Gate)
                {
                    var list = new List<IRelayConnection>(Guests.Count + 1);
                    if (Host != null)
                        list.Add(Host);
                    list.AddRange(Guests.Values);
                    return list;
                }
            }
        }

        readonly ConcurrentDictionary<long, Room> _rooms = new ConcurrentDictionary<long, Room>();

        public bool HasRoom(long sessionId)
        {
            return _rooms.ContainsKey(sessionId);
        }

        /// <summary>
        /// 호스트 연결 붙이기. 같은 호스트의 이전 연결은 대체한다(재접속).
        /// 세션은 이미 열려 있어야 한다.
        /// </summary>
        public void AttachHost(MultiplayerSession session, IRelayConnection connection, DateTime now)
        {
            if (session == null)
                throw new ArgumentNullException(nameof(session));
            if (!session.IsHost(connection.AccountIdx))
                throw new ArgumentException("connection is not the session host", nameof(connection));

            var room = _rooms.GetOrAdd(session.SessionId, id => new Room(session));
            lock (room.Gate)
            {
                if (room.Host != null && room.Host.AccountIdx == connection.AccountIdx)
                {
                    room.Host.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
                    {
                        Code = 0,
                        Message = RelayCloseReasons.Superseded
                    }));
                    room.Host.Close();
                }

                room.Host = connection;
            }

            session.Heartbeat(connection.AccountIdx, now);
        }

        /// <summary>
        /// 게스트 합류. 로스터 등록은 세션 도메인이 하고, 방에 연결을 달아둔다.
        /// AlreadyMember면 재접속으로 보고 이전 연결을 대체한다.
        /// </summary>
        public SessionMembershipError AttachGuest(MultiplayerSession session, long accountIdx,
            string nickname, IRelayConnection connection, DateTime now)
        {
            var joinError = session.JoinGuest(accountIdx, nickname, now);
            if (joinError != SessionMembershipError.None
                && joinError != SessionMembershipError.AlreadyMember)
            {
                return joinError;
            }

            var room = _rooms.GetOrAdd(session.SessionId, id => new Room(session));
            lock (room.Gate)
            {
                if (room.Guests.TryGetValue(accountIdx, out var previous))
                {
                    previous.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
                    {
                        Code = 0,
                        Message = RelayCloseReasons.Superseded
                    }));
                    previous.Close();
                }

                room.Guests[accountIdx] = connection;
            }

            session.Heartbeat(accountIdx, now);
            return SessionMembershipError.None;
        }

        /// <summary>
        /// 연결 끊김 처리. 계정이 아니라 연결 인스턴스 기준으로 판단한다. 재접속으로 이미
        /// 대체된 낡은 소켓의 뒤늦은 정리는 no-op이어야 살아 있는 연결을 건드리지 않는다.
        /// 호스트 연결 끊김은 즉시 세션을 닫지 않는다(재접속 창, 스윕이 타임아웃 뒤 마감).
        /// </summary>
        public void Detach(long sessionId, IRelayConnection connection, SessionRegistry registry)
        {
            var room = GetRoom(sessionId);
            if (room == null)
                return;

            lock (room.Gate)
            {
                if (ReferenceEquals(room.Host, connection))
                {
                    room.Host = null;
                    return;
                }

                if (room.Guests.TryGetValue(connection.AccountIdx, out var current)
                    && ReferenceEquals(current, connection))
                {
                    room.Guests.Remove(connection.AccountIdx);
                    if (registry != null)
                        registry.Leave(sessionId, connection.AccountIdx);
                }
                else
                {
                    // 낡은 연결의 정리다. 로스터도 방도 건드리지 않는다.
                    return;
                }
            }

            BroadcastRoster(sessionId);
        }

        /// <summary>게스트의 command를 호스트에게만 전달한다.</summary>
        public bool RelayFromGuest(long sessionId, long fromAccountIdx, string requestId, JsonElement? payload)
        {
            var room = GetRoom(sessionId);
            if (room == null)
                return false;

            IRelayConnection host = null;
            lock (room.Gate)
            {
                if (room.Host != null && room.Host.AccountIdx != fromAccountIdx)
                    host = room.Host;
            }

            if (host == null)
                return false;

            return SendRelay(host, room.Session, fromAccountIdx, SessionMemberRole.Guest, requestId, payload);
        }

        /// <summary>호스트의 broadcast를 게스트 전체에게 전달한다. 수신자 수를 돌려준다.</summary>
        public int BroadcastFromHost(long sessionId, long fromAccountIdx, string requestId, JsonElement? payload)
        {
            var room = GetRoom(sessionId);
            if (room == null)
                return 0;

            List<IRelayConnection> guests;
            lock (room.Gate)
            {
                if (room.Session.HostAccountIdx != fromAccountIdx)
                    return 0;
                guests = new List<IRelayConnection>(room.Guests.Values);
            }

            var delivered = 0;
            foreach (var guest in guests)
            {
                if (SendRelay(guest, room.Session, fromAccountIdx, SessionMemberRole.Host, requestId, payload))
                    delivered++;
            }
            return delivered;
        }

        public void BroadcastRoster(long sessionId)
        {
            var room = GetRoom(sessionId);
            if (room == null)
                return;

            RelayRosterMessage roster;
            List<IRelayConnection> targets;
            lock (room.Gate)
            {
                roster = BuildRosterLocked(room);
                targets = room.AllConnections();
            }

            var json = RelayJson.Serialize(roster);
            foreach (var target in targets)
                target.TryEnqueue(json);
        }

        /// <summary>세션 마감 알림 후 연결을 닫는다. 세션 상태 변경은 호출자(레지스트리)가 한다.</summary>
        public void CloseRoom(long sessionId, string reason)
        {
            if (!_rooms.TryRemove(sessionId, out var room))
                return;

            List<IRelayConnection> targets;
            lock (room.Gate)
            {
                targets = room.AllConnections();
            }

            var json = RelayJson.Serialize(new RelaySessionClosedMessage
            {
                SessionId = sessionId,
                Reason = reason
            });
            foreach (var target in targets)
            {
                target.TryEnqueue(json);
                target.Close();
            }
        }

        /// <summary>스윕이 로스터에서 뺀 게스트의 연결을 닫고 로스터를 다시 뿌린다.</summary>
        public void RemoveGuestConnection(long sessionId, long accountIdx)
        {
            var room = GetRoom(sessionId);
            if (room == null)
                return;

            IRelayConnection removed = null;
            lock (room.Gate)
            {
                if (room.Guests.TryGetValue(accountIdx, out removed))
                    room.Guests.Remove(accountIdx);
            }

            if (removed == null)
                return;

            removed.Close();
            BroadcastRoster(sessionId);
        }

        /// <summary>서버 종료: 모든 방에 마감 사유를 보내고 닫는다.</summary>
        public void CloseAllRooms(string reason)
        {
            foreach (var sessionId in _rooms.Keys)
                CloseRoom(sessionId, reason);
        }

        public int RoomCount
        {
            get { return _rooms.Count; }
        }

        Room GetRoom(long sessionId)
        {
            return _rooms.TryGetValue(sessionId, out var room) ? room : null;
        }

        static bool SendRelay(IRelayConnection target, MultiplayerSession session, long fromAccountIdx,
            SessionMemberRole fromRole, string requestId, JsonElement? payload)
        {
            return target.TryEnqueue(RelayJson.Serialize(new RelayDataMessage
            {
                SessionId = session.SessionId,
                FromAccountIdx = fromAccountIdx,
                FromRole = (int)fromRole,
                RequestId = requestId,
                Payload = payload
            }));
        }

        public static List<RelayMemberInfo> BuildMemberInfos(MultiplayerSession session)
        {
            var members = new List<RelayMemberInfo>(session.Members.Count);
            foreach (var member in session.Members)
            {
                members.Add(new RelayMemberInfo
                {
                    AccountIdx = member.AccountIdx,
                    Nickname = member.Nickname,
                    Role = (int)member.Role,
                    JoinedAtUnix = new DateTimeOffset(DateTime.SpecifyKind(member.JoinedAt, DateTimeKind.Utc))
                        .ToUnixTimeSeconds()
                });
            }
            return members;
        }

        static RelayRosterMessage BuildRosterLocked(Room room)
        {
            return new RelayRosterMessage
            {
                SessionId = room.Session.SessionId,
                RosterVersion = room.Session.RosterVersion,
                Members = BuildMemberInfos(room.Session)
            };
        }
    }
}
