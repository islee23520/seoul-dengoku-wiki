using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    /// <summary>
    /// 아이템 지급
    /// </summary>
    public class GiveItemParam : GiveRewardParam
    {
        public int ID { get; set; }
        public int Amount { get; set; }

        #region 생성자
        public GiveItemParam(GameLogCause cause, int itemID, int amount)
            : base(RewardType.Item, cause)
        {
            ID = itemID;
            Amount = amount;
        }
        #endregion

        public override int GetCompareKey()
        {
            return ID;
        }
        public override void MergeReward(RewardSpec reward)
        {
            Amount += reward.Param2 == reward.Param3 || reward.Param3 == 0 ? reward.Param2 : GlobalRandom.Between(reward.Param2, reward.Param3);
        }
    }
}
