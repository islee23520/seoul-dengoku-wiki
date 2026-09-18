using System;
using System.Collections.Generic;
using System.Text.Json;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Relay
{
    /// <summary>
    /// 릴레이 프로토콜 메시지 형태(ADR-005 v1). 모든 메시지는 UTF-8 JSON 텍스트 프레임이고
    /// camelCase 필드를 쓴다. 백엔드는 type·requestId·payload 원문만 다루고
    /// payload의 게임 의미를 해석하지 않는다.
    /// </summary>
    public static class RelayMessageTypes
    {
        // 서버 → 클라이언트
        public const string Joined = "joined";
        public const string Roster = "roster";
        public const string Relay = "relay";
        public const string SessionClosed = "sessionClosed";
        public const string Error = "error";

        // 클라이언트 → 서버
        public const string Heartbeat = "heartbeat";
        public const string Command = "command";
        public const string Broadcast = "broadcast";
    }

    public static class RelayCloseReasons
    {
        public const string HostClosed = "hostClosed";
        public const string HostTimeout = "hostTimeout";
        public const string ServerShutdown = "serverShutdown";
        public const string Superseded = "superseded";
    }

    public static class RelayJson
    {
        public static readonly JsonSerializerOptions Options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static string Serialize(object value)
        {
            return JsonSerializer.Serialize(value, Options);
        }
    }

    public sealed class RelayMemberInfo
    {
        public long AccountIdx { get; set; }
        public string Nickname { get; set; }
        public int Role { get; set; }
        public long JoinedAtUnix { get; set; }
    }

    /// <summary>합류 확인. 요청한 연결자에게만 간다.</summary>
    public sealed class RelayJoinedMessage
    {
        public string Type { get { return RelayMessageTypes.Joined; } }
        public long SessionId { get; set; }
        public string SessionCode { get; set; }
        public int Role { get; set; }
        public int RosterVersion { get; set; }
        public List<RelayMemberInfo> Members { get; set; }
    }

    /// <summary>로스터 변동 알림. 세션 전체에 브로드캐스트한다.</summary>
    public sealed class RelayRosterMessage
    {
        public string Type { get { return RelayMessageTypes.Roster; } }
        public long SessionId { get; set; }
        public int RosterVersion { get; set; }
        public List<RelayMemberInfo> Members { get; set; }
    }

    /// <summary>
    /// 릴레이 본문. 게스트의 command는 호스트에게만, 호스트의 broadcast는 게스트 전체에게 간다.
    /// payload는 받은 그대로 붙인다(JsonElement 재직렬화).
    /// </summary>
    public sealed class RelayDataMessage
    {
        public string Type { get { return RelayMessageTypes.Relay; } }
        public long SessionId { get; set; }
        public long FromAccountIdx { get; set; }
        public int FromRole { get; set; }
        public string RequestId { get; set; }
        public JsonElement? Payload { get; set; }
    }

    public sealed class RelaySessionClosedMessage
    {
        public string Type { get { return RelayMessageTypes.SessionClosed; } }
        public long SessionId { get; set; }
        public string Reason { get; set; }
    }

    public sealed class RelayErrorMessage
    {
        public string Type { get { return RelayMessageTypes.Error; } }
        public int Code { get; set; }
        public string Message { get; set; }
    }

    public static class RelayCloseReasonText
    {
        public static string From(SessionCloseReason reason)
        {
            switch (reason)
            {
                case SessionCloseReason.HostClosed:
                    return RelayCloseReasons.HostClosed;
                case SessionCloseReason.HostTimeout:
                    return RelayCloseReasons.HostTimeout;
                case SessionCloseReason.ServerShutdown:
                    return RelayCloseReasons.ServerShutdown;
                default:
                    return string.Empty;
            }
        }
    }
}
