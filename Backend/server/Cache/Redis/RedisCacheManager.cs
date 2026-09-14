using System;
using System.Collections.Generic;
using System.Threading;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using StackExchange.Redis;
using Y2K.Core.Cache;
using Y2K.Core.Util;

namespace SeoulKenshi.Cache.Redis
{
    /// <summary>
    /// 서버 템플릿용 Redis 캐시 관리자.
    /// Static Singleton 패턴으로 Y2K.Core.Cache의 CacheClient를 관리합니다.
    /// </summary>
    public class RedisCacheManager : IDisposable
    {
        readonly Dictionary<int, CacheClient> _clients = new Dictionary<int, CacheClient>();
        IConnectionMultiplexer _multiplexer;
        readonly ILogger _logger;
        int _isInitialized;

        #region Instance
        static RedisCacheManager m_Instance = new RedisCacheManager();
        public static RedisCacheManager Instance
        {
            get { return m_Instance; }
        }
        #endregion

        #region 생성자
        RedisCacheManager()
        {
            _logger = NullLoggerFactory.Instance.CreateLogger<RedisCacheManager>();
        }
        #endregion

        #region Init
        public void Init(string configString)
        {
            if (Interlocked.CompareExchange(ref _isInitialized, 1, 0) != 0)
            {
                throw new InvalidOperationException("RedisCacheManager is already initialized.");
            }

            var configs = JsonHelper.ReadToObject<RedisConfiguration>(configString);
            _multiplexer = ConnectionMultiplexer.Connect(configs.Uri);

            foreach (var info in configs.BaseCacheInfo)
            {
                _clients.Add((int)info.Type, CreateCacheClient(info.Type, info.ExpireTime));
            }
        }
        #endregion

        #region GetCacheClient
        public CacheClient GetCacheClient(RedisType type)
        {
            if (_clients.TryGetValue((int)type, out var result) == false)
            {
                throw new InvalidOperationException($"Invalid redis type: {type}. Did you register it in config?");
            }

            return result;
        }

        public T GetCacheClient<T>(RedisType type) where T : CacheClient
        {
            var client = GetCacheClient(type);

            if (client is T typed)
            {
                return typed;
            }

            throw new InvalidCastException(
                $"CacheClient at {type} is {client.GetType().Name}, not {typeof(T).Name}.");
        }

        public SystemCacheClient GetSystemCacheClient()
        {
            return GetCacheClient<SystemCacheClient>(RedisType.SystemCache);
        }

        public UserCacheClient GetUserCacheClient()
        {
            return GetCacheClient<UserCacheClient>(RedisType.UserCache);
        }

        public RankingCacheClient GetRankingCacheClient()
        {
            return GetCacheClient<RankingCacheClient>(RedisType.RankingCache);
        }
        #endregion

        #region ExpireCache
        public void ExpireCache(RedisType type, string key)
        {
            var client = GetCacheClient(type);
            client.Expire(key);
        }
        #endregion

        #region Factory
        CacheClient CreateCacheClient(RedisType type, int expireTimeHours)
        {
            int dbIndex = (int)type;

            switch (type)
            {
                case RedisType.SystemCache:
                    return new SystemCacheClient(_multiplexer, dbIndex, expireTimeHours, _logger);
                case RedisType.UserCache:
                    return new UserCacheClient(_multiplexer, dbIndex, expireTimeHours, _logger);
                case RedisType.RankingCache:
                    return new RankingCacheClient(_multiplexer, dbIndex, expireTimeHours, _logger);
                default:
                    return new CacheClient(_multiplexer, dbIndex, expireTimeHours, _logger);
            }
        }
        #endregion

        #region IDisposable
        public void Dispose()
        {
            foreach (var client in _clients.Values)
            {
                client.Dispose();
            }

            _clients.Clear();
            _multiplexer?.Dispose();
        }
        #endregion
    }
}
