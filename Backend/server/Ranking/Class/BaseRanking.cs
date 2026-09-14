using System;

namespace SeoulKenshi.Contents.Ranking
{
    /// <summary>
    /// 랭킹 결과 기본 DTO.
    /// 순위, 점수, 참여 인원수 및 상위 % 계산을 제공합니다.
    /// </summary>
    public class BaseRanking
    {
        public int Rank { get; set; }
        public long Score { get; set; }
        public long UpdateTime { get; set; }

        /// <summary>
        /// 해당 시즌 전체 참여 인원수
        /// </summary>
        public long InvolvedUserCount { get; set; }

        /// <summary>
        /// 상위 백분율을 Mega 단위(100만분율)로 반환합니다.
        /// 예: 상위 1.5% → 15000
        /// </summary>
        public long CalculateRankingPerMega()
        {
            if (InvolvedUserCount == 0)
            {
                return 0;
            }

            return ((long)Rank * 100 * 10000) / InvolvedUserCount;
        }

        /// <summary>
        /// 상위 백분율을 정수로 반환합니다.
        /// 예: 상위 1.5% → 1
        /// </summary>
        public long CalculateRankingPer()
        {
            return CalculateRankingPerMega() / 10000;
        }

        public string GetUpdateTimeString()
        {
            var datetime = new DateTime(UpdateTime);
            return datetime.ToString("yyyy-MM-dd HH:mm:ss");
        }
    }

    /// <summary>
    /// 유저 정보가 포함된 랭킹 DTO.
    /// </summary>
    public class UserRanking : BaseRanking
    {
        public long AccountIdx { get; set; }
        public string Nickname { get; set; }
        public int Level { get; set; }
    }
}
