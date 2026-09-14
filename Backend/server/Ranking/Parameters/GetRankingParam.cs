namespace SeoulKenshi.Contents.Ranking
{
    /// <summary>
    /// 랭킹 조회 파라미터.
    /// </summary>
    public class GetRankingParam
    {
        public long Key { get; private set; }

        public GetRankingParam(long key)
        {
            Key = key;
        }
    }

    /// <summary>
    /// 순위 범위 조회 파라미터 (1-based).
    /// </summary>
    public class GetRangeRankingParam
    {
        public int From { get; private set; }
        public int To { get; private set; }

        public GetRangeRankingParam(int fromRank, int toRank)
        {
            fromRank = 1 > fromRank ? 1 : fromRank;

            From = fromRank;
            To = toRank;
        }
    }
}
