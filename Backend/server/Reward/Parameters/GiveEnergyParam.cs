using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveEnergyParam : GiveRewardParam
    {
        public EnergyType EnergyType { get; set; }
        public int Amount { get; set; }

        #region 생성자
        public GiveEnergyParam(GameLogCause cause, EnergyType type, int amount)
            : base(RewardType.Energy, cause)
        {
            EnergyType = type;
            Amount = amount;
        }
        #endregion

        public override int GetCompareKey()
        {
            return (int)EnergyType;
        }
        public override void MergeReward(RewardSpec reward)
        {
            Amount += reward.Param2 == reward.Param3 || reward.Param3 == 0 ? reward.Param2 : GlobalRandom.Between(reward.Param2, reward.Param3);
        }
    }
}
