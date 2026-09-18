using System;
using System.IO;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SeoulKenshi.Coordinator.Api;
using SeoulKenshi.Coordinator.Identity;
using SeoulKenshi.Coordinator.Session;

namespace SeoulKenshi.Coordinator.Relay
{
    /// <summary>WS 프로토콜 안에서 쓰는 전송 계층 에러 코드(Common 에러 코드와 별개다).</summary>
    public static class RelayErrorCodes
    {
        public const int InvalidMessage = 1;
        public const int NotAllowed = 2;
        public const int HostUnreachable = 3;
        public const int SessionClosed = 4;
        public const int JoinFailed = 5;
    }

    /// <summary>업그레이드와 릴레이 흐름이 응답을 이미 마쳤을 때 쓰는 no-op 결과.</summary>
    internal sealed class RelayHandledResult : IResult
    {
        public static readonly RelayHandledResult Instance = new RelayHandledResult();

        public Task ExecuteAsync(HttpContext context)
        {
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// 세션 릴레이 허브(ADR-005). Coordinator의 GET /sessions/{code} 웹소켓 업그레이드를 받아
    /// 게스트 명령은 호스트에게, 호스트 사건 배치는 게스트들에게 전달한다.
    /// 게임 시뮬레이션은 호스트 클라이언트에 있고 이 서버는 굴리지 않는다.
    /// 리스너는 두지 않는다. 업그레이드 전 인증(IdentityStore)도 여기서 끝낸다.
    /// </summary>
    public sealed class SessionRelayHub
    {
        /// <summary>한 프레임 최대 크기(바이트). 전송 가드이지 게임 수치가 아니다.</summary>
        public const int MaxMessageBytes = 1024 * 1024;

        readonly SessionRegistry _registry;
        readonly IdentityStore _identities;
        readonly RelayRouter _router = new RelayRouter();

        public SessionRelayHub(SessionRegistry registry, IdentityStore identities)
        {
            _registry = registry ?? throw new ArgumentNullException(nameof(registry));
            _identities = identities ?? throw new ArgumentNullException(nameof(identities));

            // 모든 마감 경로(REST 호스트 종료·스윕·서버 종료)가 접속자에게 sessionClosed로 이어진다.
            _registry.SessionClosed += (session, reason) =>
                _router.CloseRoom(session.SessionId, RelayCloseReasonText.From(reason));
        }

        public RelayRouter Router
        {
            get { return _router; }
        }

        /// <summary>
        /// 웹소켓 세션 흐름. 업그레이드 전에 인증과 세션 조회를 마치고(실패는 401/404),
        /// 업그레이드 뒤로는 응답을 이 메서드가 끝까지 담당한다.
        /// </summary>
        public async Task<IResult> HandleSessionAsync(HttpContext context, string code)
        {
            if (!TryGetIdentity(context, out var accountIdx, out var sessionKey)
                || !_identities.TryLogin(accountIdx, sessionKey))
            {
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status401Unauthorized, CoordinatorErrorCodes.Unauthorized,
                    "invalid AccountIdx or SessionKey");
            }

            var session = _registry.GetByCode(code);
            if (session is null)
            {
                return CoordinatorErrorCodes.Problem(
                    StatusCodes.Status404NotFound, CoordinatorErrorCodes.SessionNotFound,
                    "session not found");
            }

            var socket = await context.WebSockets.AcceptWebSocketAsync().ConfigureAwait(false);
            using var connection = new RelayWebSocketConnection(accountIdx, socket);
            connection.Start();

            var isHost = session.IsHost(accountIdx);
            if (isHost)
            {
                _router.AttachHost(session, connection, DateTime.UtcNow);
            }
            else
            {
                var nickname = GetString(context, "Nickname", "nickname");
                if (string.IsNullOrEmpty(nickname))
                    _identities.TryGetNickname(accountIdx, out nickname);

                var joinError = _router.AttachGuest(session, accountIdx, nickname, connection, DateTime.UtcNow);
                if (joinError != SessionMembershipError.None)
                {
                    connection.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
                    {
                        Code = RelayErrorCodes.JoinFailed,
                        Message = joinError.ToString()
                    }));
                    connection.Close();
                    // JoinFailed 프레임과 close 핸드셰이크가 Dispose(abort)보다 먼저 나가도록 pump를 기다린다.
                    await connection.WaitForPumpAsync(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
                    return RelayHandledResult.Instance;
                }
            }

            connection.TryEnqueue(RelayJson.Serialize(new RelayJoinedMessage
            {
                SessionId = session.SessionId,
                SessionCode = session.SessionCode,
                Role = isHost ? (int)SessionMemberRole.Host : (int)SessionMemberRole.Guest,
                RosterVersion = session.RosterVersion,
                Members = RelayRouter.BuildMemberInfos(session)
            }));
            _router.BroadcastRoster(session.SessionId);

            if (session.State != SessionState.Open)
            {
                connection.TryEnqueue(RelayJson.Serialize(new RelaySessionClosedMessage
                {
                    SessionId = session.SessionId,
                    Reason = RelayCloseReasonText.From(session.CloseReason)
                }));
                connection.Close();
                // sessionClosed 프레임과 close 핸드셰이크가 Dispose(abort)보다 먼저 나가도록 pump를 기다린다.
                await connection.WaitForPumpAsync(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
                return RelayHandledResult.Instance;
            }

            await ReceiveLoopAsync(connection, session).ConfigureAwait(false);

            // 수신 루프가 끝난 소켓 기준으로 정리한다. 재접속으로 이미 대체된 낡은
            // 연결이라면 Detach는 no-op이라 살아 있는 연결이 흔들리지 않는다.
            _router.Detach(session.SessionId, connection, _registry);

            // 클라이언트가 close를 시작했다면 응답 프레임으로 핸드셰이크를 마친다.
            // Dispose는 중단(abort)이므로 여기서 정상 종료를 먼저 시도한다.
            try
            {
                if (connection.Socket.State == WebSocketState.CloseReceived)
                {
                    await connection.Socket.CloseAsync(WebSocketCloseStatus.NormalClosure,
                        "relay closed", CancellationToken.None).ConfigureAwait(false);
                }
            }
            catch
            {
                // 이미 끊긴 연결이다. 이후 Dispose가 정리한다.
            }

            return RelayHandledResult.Instance;
        }

        async Task ReceiveLoopAsync(RelayWebSocketConnection connection, MultiplayerSession session)
        {
            var buffer = new byte[16 * 1024];
            var frame = new MemoryStream();

            while (true)
            {
                WebSocketReceiveResult result;
                try
                {
                    result = await connection.Socket.ReceiveAsync(
                        new ArraySegment<byte>(buffer), CancellationToken.None).ConfigureAwait(false);
                }
                catch
                {
                    break;
                }

                if (result.MessageType == WebSocketMessageType.Close)
                    break;

                if (result.MessageType != WebSocketMessageType.Text)
                    break;

                frame.Write(buffer, 0, result.Count);
                if (frame.Length > MaxMessageBytes)
                {
                    connection.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
                    {
                        Code = RelayErrorCodes.InvalidMessage,
                        Message = "message too large"
                    }));
                    break;
                }

                if (!result.EndOfMessage)
                    continue;

                if (!HandleClientMessage(connection, session, frame.ToArray()))
                    break;

                frame.SetLength(0);
            }
        }

        /// <summary>클라이언트 메시지 하나를 처리. false를 돌려주면 연결을 끊는다.</summary>
        bool HandleClientMessage(RelayWebSocketConnection connection, MultiplayerSession session, byte[] payload)
        {
            string type;
            string requestId;
            JsonElement? data;
            try
            {
                using var document = JsonDocument.Parse(payload);
                var root = document.RootElement;
                if (!root.TryGetProperty("type", out var typeElement))
                {
                    SendError(connection, RelayErrorCodes.InvalidMessage, "missing type");
                    return true;
                }

                type = typeElement.GetString();
                requestId = root.TryGetProperty("requestId", out var requestIdElement)
                    ? requestIdElement.GetString()
                    : null;
                data = root.TryGetProperty("payload", out var payloadElement)
                    ? payloadElement.Clone()
                    : (JsonElement?)null;

                if (HandleTypedMessage(connection, session, type, requestId, data) == false)
                    return false;
                return true;
            }
            catch (JsonException)
            {
                SendError(connection, RelayErrorCodes.InvalidMessage, "malformed json");
                return true;
            }
        }

        bool HandleTypedMessage(RelayWebSocketConnection connection, MultiplayerSession session,
            string type, string requestId, JsonElement? data)
        {
            var accountIdx = connection.AccountIdx;

            if (type == RelayMessageTypes.Heartbeat)
            {
                if (session.Heartbeat(accountIdx, DateTime.UtcNow))
                    return true;

                connection.TryEnqueue(RelayJson.Serialize(new RelaySessionClosedMessage
                {
                    SessionId = session.SessionId,
                    Reason = RelayCloseReasonText.From(session.CloseReason)
                }));
                connection.Close();
                return false;
            }

            if (type == RelayMessageTypes.Command)
            {
                if (session.IsHost(accountIdx))
                {
                    SendError(connection, RelayErrorCodes.NotAllowed, "command is guest-to-host only");
                    return true;
                }

                if (!_router.RelayFromGuest(session.SessionId, accountIdx, requestId, data))
                    SendError(connection, RelayErrorCodes.HostUnreachable, "host is not connected");

                return true;
            }

            if (type == RelayMessageTypes.Broadcast)
            {
                if (!session.IsHost(accountIdx))
                {
                    SendError(connection, RelayErrorCodes.NotAllowed, "broadcast is host-to-guests only");
                    return true;
                }

                _router.BroadcastFromHost(session.SessionId, accountIdx, requestId, data);
                return true;
            }

            SendError(connection, RelayErrorCodes.InvalidMessage, $"unknown type: {type}");
            return true;
        }

        void SendError(RelayWebSocketConnection connection, int code, string message)
        {
            connection.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
            {
                Code = code,
                Message = message
            }));
        }

        static bool TryGetIdentity(HttpContext context, out long accountIdx, out string sessionKey)
        {
            accountIdx = 0;
            sessionKey = null;

            var accountIdxText = GetString(context, "AccountIdx", "accountIdx");
            sessionKey = GetString(context, "SessionKey", "sessionKey");

            return long.TryParse(accountIdxText, out accountIdx)
                && !string.IsNullOrEmpty(sessionKey);
        }

        static string GetString(HttpContext context, string headerName, string queryName)
        {
            var header = context.Request.Headers[headerName];
            if (header.Count > 0)
                return header[0];

            var query = context.Request.Query[queryName];
            return query.Count > 0 ? query[0] : null;
        }
    }
}
