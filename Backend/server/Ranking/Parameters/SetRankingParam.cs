namespace SeoulKenshi.Contents.Ranking
{
    /// <summary>
    /// 랭킹 점수 등록 파라미터.
    /// 게임별 확장 파라미터는 이 클래스를 상속하여 구현합니다.
    /// </summary>
    public class SetRankingParam
    {
        public long Key { get; private set; }
        public long Score { get; private set; }

        public SetRankingParam(long key, long score)
        {
            Key = key;
            Score = score;
        }
    }
}
