using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveGoodsParam : GiveRewardParam
    {
        /// <summary>
        /// 재화 종류
        /// </summary>
        public GoodsType GoodsType { get; set; }
        /// <summary>
        /// 수량
        /// </summary>
        public int Value { get; set; }

        /// <summary>
        /// 보너스 수량
        /// </summary>
        public int Bonus { get; set; }

        #region 생성자
        public GiveGoodsParam(GameLogCause cause, GoodsType goodsType, int value, int bonus)
            : base(RewardType.Goods, cause)
        {
            GoodsType = goodsType;
            Value = value;
            Bonus = bonus;
        }
        #endregion

        public override int GetCompareKey()
        {
            return (int)GoodsType;
        }
        public override void MergeReward(RewardSpec reward)
        {
            Value += reward.Param2 == reward.Param3 || reward.Param3 == 0 ? reward.Param2 : GlobalRandom.Between(reward.Param2, reward.Param3);

            Bonus += reward.Param4;
        }

    }
}
