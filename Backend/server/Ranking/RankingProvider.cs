using System;
using System.Collections.Generic;
using SeoulKenshi.Contents.Ranking.Operators;

namespace SeoulKenshi.Contents.Ranking
{
    /// <summary>
    /// 랭킹 시스템 진입점.
    /// 랭킹 이름별 RankingOperator를 관리하며, 점수 등록/조회를 위임합니다.
    ///
    /// 사용 예:
    /// <code>
    /// // 게임 시작 시 등록
    /// RankingProvider.Instance.RegisterOperator("PVP", new PvpRankingOperator());
    ///
    /// // 점수 등록
    /// RankingProvider.Instance.SetScore("PVP", seasonNum, new SetRankingParam(accountIdx, score));
    ///
    /// // 순위 조회
    /// var rank = RankingProvider.Instance.GetRank("PVP", new GetRankingParam(accountIdx));
    /// </code>
    /// </summary>
    public class RankingProvider
    {
        readonly Dictionary<string, RankingOperator> _operators = new Dictionary<string, RankingOperator>();

        #region Instance
        static RankingProvider m_Instance = new RankingProvider();
        public static RankingProvider Instance
        {
            get { return m_Instance; }
        }
        #endregion

        #region 오퍼레이터 등록
        /// <summary>
        /// 랭킹 이름에 대한 오퍼레이터를 등록합니다.
        /// </summary>
        public void RegisterOperator(string rankingName, RankingOperator rankingOperator)
        {
            _operators[rankingName] = rankingOperator;
        }

        RankingOperator GetOperator(string rankingName)
        {
            if (_operators.TryGetValue(rankingName, out var op))
            {
                return op;
            }

            throw new InvalidOperationException($"RankingOperator not registered: '{rankingName}'");
        }
        #endregion

        #region 점수 등록
        public void SetScore(string rankingName, int seasonNum, SetRankingParam param)
        {
            GetOperator(rankingName).Set(seasonNum, param);
        }

        public void SetScore(string rankingName, int seasonNum, IEnumerable<SetRankingParam> parameters)
        {
            GetOperator(rankingName).SetMulti(seasonNum, parameters);
        }
        #endregion

        #region 조회
        public int GetRank(string rankingName, GetRankingParam param)
        {
            return GetOperator(rankingName).GetRank(param);
        }

        public long GetScore(string rankingName, GetRankingParam param)
        {
            return GetOperator(rankingName).GetScore(param);
        }

        public List<(long accountIdx, long score)> GetScoreFromRange(string rankingName, GetRangeRankingParam param)
        {
            return GetOperator(rankingName).GetScoreFromRange(param);
        }

        public BaseRanking GetRanking(string rankingName, GetRankingParam param)
        {
            return GetOperator(rankingName).GetRanking(param);
        }
        #endregion

        #region 초기화
        public void InitUploadRanking(string rankingName, IEnumerable<SetRankingParam> parameters)
        {
            GetOperator(rankingName).InitUploadRanking(parameters);
        }
        #endregion
    }
}
