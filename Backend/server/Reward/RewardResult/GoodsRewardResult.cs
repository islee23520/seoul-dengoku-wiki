using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Contents.Reward
{
    public class GoodsRewardResult : RewardResult
    {
        #region Properties
        /// <summary>
        /// 재화 타입
        /// </summary>
        public GoodsType GoodsType { get; set; }

        /// <summary>
        /// 기본적으로 습득한 값
        /// </summary>
        public int Value { get; set; }

        /// <summary>
        /// 보너스로 습득한 값
        /// </summary>
        public int Bonus { get; set; }

        /// <summary>
        /// 현재 수량
        /// </summary>
        public long TotalValue { get; set; }
        #endregion

        #region 생성자         
        public GoodsRewardResult() 
            : base(RewardType.Goods) { }
        public GoodsRewardResult(GameLogCause cause, GoodsType type, int value, int bonus, long totalValue)
            : base(RewardType.Goods, cause)
        {
            GoodsType = type;
            Value = value;
            Bonus = bonus;
            TotalValue = totalValue;
        }
        #endregion
    }
}
