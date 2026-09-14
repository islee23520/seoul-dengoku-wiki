using System;
using System.Collections.Generic;
using System.Linq;

namespace SeoulKenshi.Contents.Social
{
    /// <summary>
    /// 역 규모 점수. 자원 총량 + 시설 레벨 합 × 가중치.
    /// 가중치(v1 설계 가정): 시설 레벨 1당 100점.
    /// </summary>
    public sealed class RankingScore
    {
        public const int FacilityLevelWeight = 100;

        public long AccountIdx { get; }
        public long TotalResources { get; }
        public int FacilityLevelSum { get; }
        public long Value { get; }

        public RankingScore(long accountIdx, long totalResources, int facilityLevelSum)
        {
            if (totalResources < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(totalResources));
            }

            if (facilityLevelSum < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(facilityLevelSum));
            }

            AccountIdx = accountIdx;
            TotalResources = totalResources;
            FacilityLevelSum = facilityLevelSum;
            Value = Calculate(totalResources, facilityLevelSum);
        }

        public static long Calculate(long totalResources, int facilityLevelSum)
        {
            if (totalResources < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(totalResources));
            }

            if (facilityLevelSum < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(facilityLevelSum));
            }

            return totalResources + (long)facilityLevelSum * FacilityLevelWeight;
        }

        /// <summary>
        /// 점수 내림차순. 동점은 같은 순위(competition rank: 1,1,3)이며
        /// 목록 순서는 AccountIdx 오름차순.
        /// </summary>
        public static IReadOnlyList<RankingPlacement> Place(IEnumerable<RankingScore> scores)
        {
            if (scores == null)
            {
                throw new ArgumentNullException(nameof(scores));
            }

            var ordered = scores
                .OrderByDescending(s => s.Value)
                .ThenBy(s => s.AccountIdx)
                .ToList();

            var result = new List<RankingPlacement>(ordered.Count);
            int lastRank = 0;
            long lastScore = 0;
            bool hasLast = false;

            for (int i = 0; i < ordered.Count; i++)
            {
                var score = ordered[i];
                int rank;
                if (hasLast && score.Value == lastScore)
                {
                    rank = lastRank;
                }
                else
                {
                    rank = i + 1;
                    lastRank = rank;
                    lastScore = score.Value;
                    hasLast = true;
                }

                result.Add(new RankingPlacement(rank, score));
            }

            return result;
        }
    }

    public sealed class RankingPlacement
    {
        public int Rank { get; }
        public RankingScore Score { get; }

        public RankingPlacement(int rank, RankingScore score)
        {
            if (rank < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(rank));
            }

            Rank = rank;
            Score = score ?? throw new ArgumentNullException(nameof(score));
        }
    }
}
