using System;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using SeoulKenshi.Contents.Session;

namespace SeoulKenshi.Relay
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

    /// <summary>
    /// 호스트 세션 릴레이 허브(ADR-005). Kestrel WebSocket 한 개로
    /// 게스트 명령은 호스트에게, 호스트 사건 배치는 게스트들에게 전달한다.
    /// 게임 시뮬레이션은 호스트 클라이언트에 있고 이 서버는 굴리지 않는다.
    /// </summary>
    public sealed class SessionRelayHub
    {
        /// <summary>한 프레임 최대 크기(바이트). 전송 가드이지 게임 수치가 아니다.</summary>
        public const int MaxMessageBytes = 1024 * 1024;

        readonly SessionRegistry _registry;
        readonly Func<long, string, bool> _authenticate;
        readonly RelayRouter _router = new RelayRouter();
        WebApplication _app;

        public SessionRelayHub(SessionRegistry registry, Func<long, string, bool> authenticate)
        {
            _registry = registry ?? throw new ArgumentNullException(nameof(registry));
            _authenticate = authenticate ?? throw new ArgumentNullException(nameof(authenticate));
        }

        /// <summary>할당된 실제 포트. StartAsync 뒤에 유효하다(0을 주면 임시 포트).</summary>
        public int Port { get; private set; }

        public RelayRouter Router
        {
            get { return _router; }
        }

        public async Task StartAsync(int port)
        {
            if (_app != null)
                throw new InvalidOperationException("relay hub already started");

            var builder = WebApplication.CreateBuilder();
            builder.WebHost.ConfigureKestrel(kestrel => kestrel.ListenAnyIP(port));

            _app = builder.Build();
            _app.UseWebSockets();
            _app.MapGet("/health", () => Results.Ok("relay"));
            _app.MapGet("/session/{code}", async (string code, HttpContext context) =>
            {
                await HandleSessionAsync(context, code);
            });

            await _app.StartAsync().ConfigureAwait(false);

            var addresses = _app.Services.GetRequiredService<IServer>()
                .Features.Get<IServerAddressesFeature>().Addresses;
            Port = ParsePort(addresses.First());
        }

        /// <summary>생존 스윕: 호스트 무응답 세션 마감, 무응답 게스트 퇴장 알림.</summary>
        public Task RunSweepAsync(DateTime now, int hostTimeoutSeconds, int memberTimeoutSeconds)
        {
            var report = _registry.Sweep(now, hostTimeoutSeconds, memberTimeoutSeconds);

            foreach (var session in report.TimedOutSessions)
                _router.CloseRoom(session.SessionId, RelayCloseReasonText.From(session.CloseReason));

            foreach (var removed in report.RemovedMembers)
                _router.RemoveGuestConnection(removed.SessionId, removed.Member.AccountIdx);

            return Task.CompletedTask;
        }

        public async Task StopAsync()
        {
            _router.CloseAllRooms(RelayCloseReasons.ServerShutdown);
            _registry.CloseAll(SessionCloseReason.ServerShutdown, DateTime.UtcNow);

            if (_app != null)
            {
                await _app.StopAsync().ConfigureAwait(false);
                await _app.DisposeAsync().ConfigureAwait(false);
                _app = null;
            }
        }

        async Task HandleSessionAsync(HttpContext context, string code)
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }

            if (!TryGetIdentity(context, out var accountIdx, out var sessionKey)
                || !_authenticate(accountIdx, sessionKey))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            var session = _registry.GetByCode(code);
            if (session == null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
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
                var joinError = _router.AttachGuest(session, accountIdx, nickname, connection, DateTime.UtcNow);
                if (joinError != SessionMembershipError.None)
                {
                    connection.TryEnqueue(RelayJson.Serialize(new RelayErrorMessage
                    {
                        Code = RelayErrorCodes.JoinFailed,
                        Message = joinError.ToString()
                    }));
                    connection.Close();
                    return;
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
                return;
            }

            await ReceiveLoopAsync(connection, session).ConfigureAwait(false);

            _router.Detach(session.SessionId, accountIdx, _registry);

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
            System.Text.Json.JsonElement? data;
            try
            {
                using var document = System.Text.Json.JsonDocument.Parse(payload);
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
                    ? payloadElement
                    : (System.Text.Json.JsonElement?)null;

                if (HandleTypedMessage(connection, session, type, requestId, data) == false)
                    return false;
                return true;
            }
            catch (System.Text.Json.JsonException)
            {
                SendError(connection, RelayErrorCodes.InvalidMessage, "malformed json");
                return true;
            }
        }

        bool HandleTypedMessage(RelayWebSocketConnection connection, MultiplayerSession session,
            string type, string requestId, System.Text.Json.JsonElement? data)
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

        static int ParsePort(string address)
        {
            var colon = address.LastIndexOf(':');
            if (colon < 0 || colon + 1 >= address.Length)
                throw new InvalidOperationException($"cannot parse relay address: {address}");

            var portText = address.Substring(colon + 1).TrimEnd('/');
            return int.Parse(portText);
        }

        /// <summary>WS 연결 패킷. 송신은 단일 펌프 태스크로 직렬화한다.</summary>
        sealed class RelayWebSocketConnection : IRelayConnection, IDisposable
        {
            readonly System.Threading.CancellationTokenSource _cts = new System.Threading.CancellationTokenSource();
            readonly Channel<string> _outbound = Channel.CreateUnbounded<string>(
                new UnboundedChannelOptions { SingleReader = true });

            public RelayWebSocketConnection(long accountIdx, System.Net.WebSockets.WebSocket socket)
            {
                AccountIdx = accountIdx;
                Socket = socket;
            }

            public long AccountIdx { get; }

            public System.Net.WebSockets.WebSocket Socket { get; }

            public bool TryEnqueue(string json)
            {
                return _outbound.Writer.TryWrite(json);
            }

            public void Close()
            {
                _outbound.Writer.TryWrite(null);
            }

            public void Start()
            {
                _ = PumpAsync();
            }

            async Task PumpAsync()
            {
                try
                {
                    while (await _outbound.Reader.WaitToReadAsync(_cts.Token).ConfigureAwait(false))
                    {
                        while (_outbound.Reader.TryRead(out var json))
                        {
                            if (json == null)
                            {
                                await Socket.CloseAsync(
                                    System.Net.WebSockets.WebSocketCloseStatus.NormalClosure,
                                    "relay closed",
                                    _cts.Token).ConfigureAwait(false);
                                return;
                            }

                            await Socket.SendAsync(
                                new ArraySegment<byte>(Encoding.UTF8.GetBytes(json)),
                                System.Net.WebSockets.WebSocketMessageType.Text,
                                true,
                                _cts.Token).ConfigureAwait(false);
                        }
                    }
                }
                catch
                {
                    // 소켓이 닫혔으면 수신 루프도 끝난다. 여기서 삼키고 로그는 호출자 쪽에 남긴다.
                }
            }

            public void Dispose()
            {
                _cts.Cancel();
                _cts.Dispose();
                Socket.Dispose();
            }
        }
    }
}
