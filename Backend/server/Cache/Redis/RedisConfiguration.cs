using System.Collections.Generic;
using SeoulKenshi.Cache;

namespace SeoulKenshi.Cache.Redis
{
    public class RedisConfiguration
    {
        public List<BaseCacheInfo> BaseCacheInfo { get; set; } = new List<BaseCacheInfo>();
        /// <summary>
        /// redis 접속 uri
        /// </summary>
        public string Uri { get; set; }

    }

    public class BaseCacheInfo
    {
        /// <summary>
        /// 레디스 DB 인덱스 대시 캐시 타입
        /// </summary>
        public RedisType Type { get; set; }
        /// <summary>
        /// 캐시 데이터의 유효 기간(단위는 시간)
        /// </summary>
        public int ExpireTime { get; set; }
    }
}
