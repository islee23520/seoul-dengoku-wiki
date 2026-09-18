using System;
using System.Collections.Generic;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Contents.Session;
using SeoulKenshi.Protocols.WCF.Session;

namespace SeoulKenshi.GameServer.Service.Session
{
    /// <summary>
    /// 세션 프로세스 공용 런타임. 프로세스에 세션 레지스트리 싱글턴 하나를 두고(ADR-005),
    /// 정원·타임아웃 같은 운영값은 설정(GameServerSettings)에서만 읽는다.
    /// </summary>
    internal static class SessionRuntime
    {
        static readonly SessionRegistry _registry = new SessionRegistry();

        public static SessionRegistry Sessions
        {
            get { return _registry; }
        }

        public static int MaxGuests
        {
            get { return Math.Max(0, Config.Instance.Settings.SessionMaxGuests); }
        }

        public static int HostTimeoutSeconds
        {
            get { return Math.Max(1, Config.Instance.Settings.SessionHostTimeoutSeconds); }
        }

        public static int MemberTimeoutSeconds
        {
            get { return Math.Max(1, Config.Instance.Settings.SessionMemberTimeoutSeconds); }
        }

        /// <summary>도메인 합류 결과를 에러 코드로 바꾼다. HTTP 프로세서와 릴레이 허브가 같이 쓴다.</summary>
        public static int ToErrorCode(SessionMembershipError error)
        {
            switch (error)
            {
                case SessionMembershipError.None:
                    return SystemErrorCode.SUCCESS;
                case SessionMembershipError.SessionNotFound:
                    return SessionErrorCode.ERROR_SESSION_NOT_FOUND;
                case SessionMembershipError.SessionClosed:
                    return SessionErrorCode.ERROR_SESSION_CLOSED;
                case SessionMembershipError.SessionFull:
                    return SessionErrorCode.ERROR_SESSION_FULL;
                case SessionMembershipError.AlreadyMember:
                    return SessionErrorCode.ERROR_SESSION_ALREADY_MEMBER;
                case SessionMembershipError.HostCannotJoinAsGuest:
                case SessionMembershipError.HostCannotBeRemoved:
                case SessionMembershipError.NotHost:
                    return SessionErrorCode.ERROR_SESSION_NOT_HOST;
                default:
                    return SystemErrorCode.SYSTEM_ERROR;
            }
        }

        public static SessionSummaryPacket ToSummaryPacket(MultiplayerSession session)
        {
            if (session == null)
                throw new ArgumentNullException(nameof(session));

            var hostNickname = string.Empty;
            var guestCount = 0;
            foreach (var member in session.Members)
            {
                if (member.Role == SessionMemberRole.Host)
                    hostNickname = member.Nickname;
                else
                    guestCount++;
            }

            return new SessionSummaryPacket
            {
                SessionId = session.SessionId,
                SessionCode = session.SessionCode,
                HostAccountIdx = session.HostAccountIdx,
                HostNickname = hostNickname,
                GuestCount = guestCount,
                MaxGuests = session.MaxGuests,
                State = session.State.ToString(),
                CreatedAt = ToUnixSeconds(session.CreatedAt)
            };
        }

        public static SessionMemberPacket ToMemberPacket(SessionMember member)
        {
            if (member == null)
                throw new ArgumentNullException(nameof(member));

            return new SessionMemberPacket
            {
                AccountIdx = member.AccountIdx,
                Nickname = member.Nickname,
                Role = (int)member.Role,
                JoinedAt = ToUnixSeconds(member.JoinedAt)
            };
        }

        public static long ToUnixSeconds(DateTime utc)
        {
            return new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToUnixTimeSeconds();
        }
    }
}
