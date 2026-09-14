using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Contents.Reward
{
    public class ExpRewardResult : RewardResult
    {
        #region Properties
        /// <summary>
        /// 경험치 타입(1: Account, 2:SeasonPass)
        /// </summary>
        public ExpType ExpType { get; set; }
        /// <summary>
        /// 레벨업 했는지 여부
        /// </summary>
        public bool IsLevelup { get; set; }
        /// <summary>
        /// 현재 레벨
        /// </summary>
        public int NowLevel { get; set; }
        /// <summary>
        /// 현재 경험치
        /// </summary>
        public int NowExp { get; set; }
        /// <summary>
        /// 습득 경험치
        /// </summary>
        public int Value { get; set; }
        #endregion


        #region 생성자         
        public ExpRewardResult() : base(RewardType.Exp) { }
        public ExpRewardResult(GameLogCause cause, ExpType type, bool isLevelup, int level, int nowExp, int value)
            : base(RewardType.Exp, cause)
        {
            ExpType = type;
            IsLevelup = isLevelup;
            NowLevel = level;
            NowExp = nowExp;
            Value = value;
        }
        #endregion

    }
}
