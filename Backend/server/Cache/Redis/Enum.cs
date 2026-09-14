namespace SeoulKenshi.Cache
{
    /// <summary>
    /// 캐시 데이터의 용도별 분류를 위한 타입으로 redis의 db idx와 동일합니다.
    /// </summary>
    public enum RedisType : byte
    {
        /// <summary>
        /// 패킷 중복처리, 기획 데이터 버전 확인 등등을 위해 사용되는 캐시 입니다.
        /// </summary>
        SystemCache = 0,
        /// <summary>
        /// 유저 정보의 저장을 담당하는 캐시 입니다.
        /// </summary>
        UserCache,
        /// <summary>
        /// 랭킹 데이터를 위한 Redis Sorted Set 캐시 입니다.
        /// </summary>
        RankingCache,
    }
}
