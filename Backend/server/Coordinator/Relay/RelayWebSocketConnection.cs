using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace SeoulKenshi.Coordinator.Relay
{
    /// <summary>WS 연결 패킷. 송신은 단일 펌프 태스크로 직렬화한다.</summary>
    internal sealed class RelayWebSocketConnection : IRelayConnection, IDisposable
    {
        readonly CancellationTokenSource _cts = new CancellationTokenSource();
        readonly Channel<string> _outbound = Channel.CreateUnbounded<string>(
            new UnboundedChannelOptions { SingleReader = true });

        Task _pump = Task.CompletedTask;

        public RelayWebSocketConnection(long accountIdx, WebSocket socket)
        {
            AccountIdx = accountIdx;
            Socket = socket;
        }

        public long AccountIdx { get; }

        public WebSocket Socket { get; }

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
            _pump = PumpAsync();
        }

        /// <summary>
        /// 전송 펌프 종료 대기. 큐에 넣은 프레임과 close 핸드셰이크가 소켓 Dispose(abort)보다
        /// 먼저 나가도록 닫힘 경로에서 쓴다.
        /// </summary>
        public async Task WaitForPumpAsync(TimeSpan timeout)
        {
            try
            {
                await _pump.WaitAsync(timeout).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                // 정해 시간 안에 못 끝내도 이후 Dispose가 정리한다.
            }
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
                                WebSocketCloseStatus.NormalClosure,
                                "relay closed",
                                _cts.Token).ConfigureAwait(false);
                            return;
                        }

                        await Socket.SendAsync(
                            new ArraySegment<byte>(Encoding.UTF8.GetBytes(json)),
                            WebSocketMessageType.Text,
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
