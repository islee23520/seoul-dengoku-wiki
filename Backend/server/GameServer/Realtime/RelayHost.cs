using System;
using System.Threading.Tasks;
using SeoulKenshi.GameServer.Service.Session;
using SeoulKenshi.Relay;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Realtime
{
    /// <summary>
    /// 릴레이 허브의 GameServer 측 배선. 세션 레지스트리는 SessionRuntime 싱글턴을 쓰고
    /// 핸드셰이크 인증은 기존 Auth(AccountIdx + SessionKey)를 재사용한다(ADR-005).
    /// </summary>
    internal static class RelayHost
    {
        static SessionRelayHub _hub;

        public static int Port
        {
            get { return _hub == null ? 0 : _hub.Port; }
        }

        public static async Task StartAsync(int port)
        {
            if (_hub != null)
                throw new InvalidOperationException("relay host already started");

            _hub = new SessionRelayHub(SessionRuntime.Sessions, Authenticate);
            await _hub.StartAsync(port).ConfigureAwait(false);
        }

        /// <summary>10초 타이머용 생존 스윙. HighResTimer 콜백이 동기라 결과를 기다린다.</summary>
        public static void RunSweep()
        {
            if (_hub == null)
                return;

            _hub.RunSweepAsync(DateTime.UtcNow, SessionRuntime.HostTimeoutSeconds, SessionRuntime.MemberTimeoutSeconds)
                .GetAwaiter().GetResult();
        }

        public static Task StopAsync()
        {
            if (_hub == null)
                return Task.CompletedTask;

            var hub = _hub;
            _hub = null;
            return hub.StopAsync();
        }

        /// <summary>AccountIdx 헤더와 Redis/DB에 보관된 SessionKey가 같은지 확인한다.</summary>
        static bool Authenticate(long accountIdx, string sessionKey)
        {
            try
            {
                var authInfo = AuthInfoProvider.GetAuthInfo(accountIdx);
                return authInfo != null
                    && !string.IsNullOrEmpty(authInfo.SessionKey)
                    && authInfo.SessionKey == sessionKey;
            }
            catch
            {
                return false;
            }
        }
    }
}
