using System.Collections.Generic;
using RedisCacheManager = SeoulKenshi.Cache.Redis.RedisCacheManager;

namespace SeoulKenshi.Contents.Ranking.Operators
{
    /// <summary>
    /// 랭킹 오퍼레이터 추상 클래스.
    /// 게임별 랭킹 타입마다 이 클래스를 상속하여 구현합니다.
    ///
    /// 구현 필수:
    /// - Set/SetMulti: 점수 등록 (DB 저장 + Redis 반영)
    /// - GetRank/GetScore: 순위/점수 조회
    /// - MakeRedisScore/MakeRealScore: 점수 변환 (동점 처리용 시퀀스 조합 등)
    /// - GetSequence: 동점 구분을 위한 시퀀스 번호 관리
    /// </summary>
    public abstract class RankingOperator
    {
        #region 추상 메서드 (게임별 구현)
        public abstract void Set(int seasonNum, SetRankingParam parameter);
        public abstract void SetMulti(int seasonNum, IEnumerable<SetRankingParam> parameters);

        public abstract int GetRank(GetRankingParam parameter);
        public abstract long GetScore(GetRankingParam parameter);
        public abstract List<(long accountIdx, long score)> GetScoreFromRange(GetRangeRankingParam parameter);
        public abstract BaseRanking GetRanking(GetRankingParam parameter);

        /// <summary>
        /// 랭킹 데이터 초기 업로드 (시즌 시작 시 DB에서 Redis로)
        /// </summary>
        public abstract void InitUploadRanking(IEnumerable<SetRankingParam> parameters);

        /// <summary>
        /// 동점 처리를 위한 시퀀스 번호를 반환합니다.
        /// </summary>
        protected abstract long GetSequence(string rankingName);

        /// <summary>
        /// Redis에 저장된 점수를 실제 점수로 변환합니다.
        /// </summary>
        protected abstract long MakeRealScore(long score);

        /// <summary>
        /// 실제 점수 + 시퀀스를 조합하여 Redis 저장용 점수를 만듭니다.
        /// </summary>
        protected abstract long MakeRedisScore(long score, long sequence);
        #endregion

        #region 공통 헬퍼 메서드
        /// <summary>
        /// 지정 setId의 멤버에 대한 종합 랭킹 정보를 조회합니다.
        /// </summary>
        protected BaseRanking GetRanking(string setId, string key, bool isDescending)
        {
            var cacheClient = RedisCacheManager.Instance.GetRankingCacheClient();

            var result = new BaseRanking()
            {
                Rank = (int)cacheClient.GetRanking(setId, key, isDescending),
                Score = MakeRealScore(cacheClient.GetScore(setId, key)),
                InvolvedUserCount = cacheClient.GetMemberCount(setId)
            };

            return result;
        }

        /// <summary>
        /// 순위 범위에 해당하는 (accountIdx, score) 목록을 반환합니다.
        /// </summary>
        protected List<(long accountIdx, long score)> GetScoreFromRange(string setId, int from, int to, bool isDescending)
        {
            var cacheClient = RedisCacheManager.Instance.GetRankingCacheClient();

            var entries = cacheClient.GetRangeRankingWithScores(setId, from, to, isDescending);

            var result = new List<(long accountIdx, long score)>();
            foreach (var entry in entries)
            {
                result.Add((long.Parse(entry.Key), MakeRealScore((long)entry.Value)));
            }

            return result;
        }

        /// <summary>
        /// 변환 없이 Redis 원본 점수를 가져옵니다.
        /// </summary>
        protected List<(long accountIdx, long score)> GetRedisScoreFromRange(string setId, int from, int to, bool isDescending)
        {
            var cacheClient = RedisCacheManager.Instance.GetRankingCacheClient();

            var entries = cacheClient.GetRangeRankingWithScores(setId, from, to, isDescending);

            var result = new List<(long accountIdx, long score)>();
            foreach (var entry in entries)
            {
                result.Add((long.Parse(entry.Key), (long)entry.Value));
            }

            return result;
        }
        #endregion
    }
}
