using System;
using SeoulKenshi.Cache.Redis;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;

namespace SeoulKenshi.GameServer.Service
{
    public class PacketProcessLock : IDisposable
    {
        private readonly string _key;
        private bool _isLocked = false;
        private bool _disposed = false;

        public PacketProcessLock(string key)
        {
            _key = key;
            // 설정에서 락 기능을 끈 경우 바로 복귀
            if (Config.Instance.Settings.PacketProcessLock == false)
                return;

            if (string.IsNullOrEmpty(_key))
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_PACKET_DATA, "Lock key is null or empty.");

            // Redis를 통한 락 시도
            if (RedisCacheManager.Instance.GetSystemCacheClient().Lock(_key) == false)
            {
                _isLocked = false;
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_IN_PROCESSING, $"This user is already in processing... [{_key}]");
            }

            _isLocked = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed) 
                return;

            if (disposing)
            {
                // 락이 걸린 상태에서만 해제 시도
                if (_isLocked)
                {
                    RedisCacheManager.Instance.GetSystemCacheClient().Unlock(_key);
                    _isLocked = false;
                }
            }

            _disposed = true;
        }

        // 소멸자 (안전장치)
        ~PacketProcessLock()
        {
            Dispose(false);
        }
    }
}
